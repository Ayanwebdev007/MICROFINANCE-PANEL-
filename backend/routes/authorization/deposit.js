const { getFirestore } = require('firebase-admin/firestore');
const db = getFirestore();
const transactionService = require('../../services/transactionService');

module.exports = app => {
    app.get('/api/authorize/deposit/:transactionId', async function (req, res) {
        const token = req.user; // Get user from the middleware
        if (!token) return res.status(401).send({ error: 'You are not authorized. Please log in.' });

        const transactionId = req.params.transactionId;
        const systemDate = new Date().toISOString().slice(0, 10);

        try {
            await db.runTransaction(async (t) => {
                const transactions = [];
                const transactionColRef = db.collection(token.bankId).doc('pi').collection('deposit');
                const snapshot = await t.get(transactionColRef);
                snapshot.forEach(doc => {
                    transactions.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });

                const transactionRef = db.collection(token.bankId).doc('pi').collection('deposit').doc(transactionId);
                const transaction = await t.get(transactionRef);
                if (!transaction.exists) {
                    return res.send({ warning: 'Transaction not found. Maybe already authorized', transactions });
                }
                const accountRef = db.collection(token.bankId).doc('accounts').collection(transaction.data().accountType).doc(transaction.data().account);
                const account = await t.get(accountRef);
                const transactionData = {
                    account: transaction.data().account,
                    accountType: transaction.data().accountType,
                    entryDate: transaction.data().transactionDate,
                    type: transaction.data().type,
                    method: transaction.data().method,
                    narration: transaction.data().narration,
                    name: transaction.data().name,
                    amount: transaction.data().amount,
                    balance: account.data().balance,
                    glCode: transaction.data().glCode,
                    glHead: transaction.data().glHead,
                    author: transaction.data().author,
                    approvedBy: token.email,
                    createdAt: new Date().toISOString(),
                };
                if (transaction.data().type === 'credit') {
                    t.update(accountRef, { balance: parseFloat(account.data().balance) + transaction.data().amount });
                } else {
                    if (parseFloat(account.data().balance) < transaction.data().amount) {
                        return res.send({ error: 'Insufficient balance' });
                    }
                    t.update(accountRef, { balance: parseFloat(account.data().balance) - transaction.data().amount });
                }

                const accountTransRef = db.collection(token.bankId).doc('accounts').collection(transaction.data().accountType).doc(transaction.data().account).collection('transaction').doc(transactionId);
                await t.set(accountTransRef, transactionData);

                // Use TransactionService for dual-recording
                await transactionService.recordTransaction(token.bankId, transactionData, systemDate, t);

                t.delete(transactionRef);

                return res.send({
                    success: `Transaction ${transactionId} is authorized successfully`,
                    autoAuthorize: transaction.data().autoAuthorize,
                    transactions: transactions.filter(t => t.id !== transactionId),
                });
            });
        } catch (e) {
            console.log('Transaction failure:', e);
            return res.send({ error: 'Failed to authorize. Try again...' });
        }

    });

    app.get('/api/authorise/bulk-renewal/:transaction', async function (req, res) {
        const token = req.user;
        if (!token) return res.status(401).send({ error: 'You are not authorized. Please log in.' });

        const serverDate = new Date().toISOString().slice(0, 10);
        const transactionNumber = req.params.transaction;

        try {
            const transactionRef = db.collection(token.bankId).doc('pi').collection('bulk-renewal').doc(transactionNumber);
            const transactionRecord = await transactionRef.get();

            if (!transactionRecord.exists) {
                return res.send({ error: 'Bulk transaction not found.' });
            }

            const transactionInfo = transactionRecord.data();
            const accountType = transactionInfo.accountType;
            const accountTrans = transactionInfo.trans || [];

            let failedCount = 0;
            let successCount = 0;

            for (let i = 0; i < accountTrans.length; i++) {
                const item = accountTrans[i];
                try {
                    await db.runTransaction(async (trans) => {
                        const accountRef = db.collection(token.bankId).doc('accounts').collection(accountType).doc(item.accountNumber);
                        const accountDoc = await trans.get(accountRef);

                        if (!accountDoc.exists) {
                            throw new Error('Account not found');
                        }

                        const accountInfo = accountDoc.data();

                        if (accountInfo.closed === true) {
                            throw new Error('Account closed');
                        }

                        const updatedBalance = parseFloat(accountInfo.balance || 0) + parseFloat(item.amount);
                        trans.update(accountRef, {
                            balance: updatedBalance,
                            transDate: serverDate,
                        });

                        const transObj = {
                            amount: item.amount || 0,
                            accountType: accountType,
                            balance: accountInfo.balance || 0,
                            glCode: transactionInfo.glCode || '',
                            glHead: transactionInfo.glHead || '',
                            entryDate: serverDate,
                            date: serverDate,
                            narration: transactionInfo.narration || '',
                            type: 'credit',
                            method: transactionInfo.method || 'cash',
                            account: item.accountNumber || '',
                            name: item.name || '',
                            author: transactionInfo.author || '',
                            approver: token.email || '',
                            createdAt: new Date().toISOString(),
                        };

                        const accountTransRef = db.collection(token.bankId).doc('accounts').collection(accountType).doc(item.accountNumber)
                            .collection('transaction').doc(`${transactionNumber}.${i}`);
                        trans.set(accountTransRef, transObj);

                        // Use TransactionService for dual-recording
                        await transactionService.recordTransaction(token.bankId, {
                            ...transObj,
                            id: `${transactionNumber}.${i}`
                        }, serverDate, trans);
                    });
                    successCount++;
                } catch (e) {
                    console.error(`Bulk item ${i} failed:`, e.toString());
                    failedCount++;
                    // Log rejection
                    await db.collection(token.bankId).doc('pi').collection('rejected-bulk-renewal').add({
                        ...transactionInfo,
                        ...item,
                        bulkTransactionId: transactionNumber,
                        reason: e.toString(),
                        author: token.email
                    });
                    const crashObj = {
                        instructionId: transactionNumber,
                        author: token.email,
                        bankId: token.bankId,
                        err: e.toString(),
                        account: item.accountNumber,
                        name: item.name || '',
                        amount: item.amount || 0,
                    };
                    await db.collection('admin').doc('crash').collection('deposit-bulk-renewal-trans').add(crashObj);
                }
            }

            await transactionRef.delete();

            if (failedCount > 0) {
                res.send({ warning: `Successfully approved ${successCount} entries, but ${failedCount} were rejected. View on Rejected Renewal.` });
            } else {
                res.send({ success: `Successfully approved Transaction Id: ${transactionNumber}` });
            }
        } catch (e) {
            console.error('Bulk Renewal failure:', e);
            await db.collection('admin').doc('crash').collection('bulk-renewal-trans').add({
                instructionId: transactionNumber,
                author: token.email,
                bankId: token.bankId,
                err: e.toString(),
            });
            res.status(500).send({ error: 'Failed to process bulk renewal. ' + e.message });
        }
    });
};