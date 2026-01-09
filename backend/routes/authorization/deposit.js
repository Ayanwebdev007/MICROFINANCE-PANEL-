const {getFirestore} = require('firebase-admin/firestore');
const db = getFirestore();

module.exports = app => {
    app.get('/api/authorize/deposit/:transactionId', async function (req, res) {
        const token = req.user; // Get user from the middleware
        if (!token) return res.status(401).send({error: 'You are not authorized. Please log in.'});

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
                    return res.send({warning: 'Transaction not found. Maybe already authorized', transactions});
                }
                const accountRef = db.collection(token.bankId).doc('accounts').collection(transaction.data().accountType).doc(transaction.data().account);
                const account = await t.get(accountRef);
                const transactionData = {
                    account: transaction.data().account,
                    accountType: transaction.data().accountType,
                    date: transaction.data().transactionDate,
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
                    createdAt: new Date(),
                };
                if (transaction.data().type === 'credit') {
                    t.update(accountRef, {balance: parseFloat(account.data().balance) + transaction.data().amount});
                } else {
                    if (parseFloat(account.data().balance) < transaction.data().amount) {
                        return res.send({error: 'Insufficient balance'});
                    }
                    t.update(accountRef, {balance: parseFloat(account.data().balance) - transaction.data().amount});
                }

                const accountTransRef = db.collection(token.bankId).doc('accounts').collection(transaction.data().accountType).doc(transaction.data().account).collection('transaction').doc(transactionId);
                await t.set(accountTransRef, transactionData);

                const bankTransRef = db.collection(token.bankId).doc('transaction').collection(systemDate).doc(transactionId);
                await t.set(bankTransRef, transactionData);

                t.delete(transactionRef);

                return res.send({
                    success: `Transaction ${transactionId} is authorized successfully`,
                    autoAuthorize: transaction.data().autoAuthorize,
                    transactions: transactions.filter(t => t.id !== transactionId),
                });
            });
        } catch (e) {
            console.log('Transaction failure:', e);
            return res.send({error: 'Failed to authorize. Try again...'});
        }

    });

    app.get('/api/authorise/bulk-renewal/:transaction', async function (req, res) {
        const token = req.user; // Get user from the middleware
        if (!token) return res.status(401).send({error: 'You are not authorized. Please log in.'});

        const serverDate = new Date().toISOString().slice(0, 10);
        const transactionNumber = req.params.transaction;

        let totalTransaction = 0;
        let failedCount = 0;

        try {
            await db.runTransaction(async (t) => {
                const transactionRef = db.collection(token.bankId).doc('pi').collection('bulk-renewal').doc(transactionNumber);
                const transaction = await t.get(transactionRef);
                const transactionInfo = transaction.data();
                const accountType = transactionInfo.accountType;
                // For Backdate Entry
                // const serverDate = transactionInfo.date;

                // Create Account Transaction
                const accountTrans = transactionInfo.trans;
                const accountTransLen = accountTrans.length;
                for (let i = 0; i < accountTransLen; i++) {
                    try {
                        await db.runTransaction(async (trans) => {
                            const accountRef = db.collection(token.bankId).doc('accounts').collection(accountType).doc(accountTrans[i].accountNumber);
                            const accountDoc = await trans.get(accountRef);
                            const accountInfo = accountDoc.data();

                            if (accountInfo.closed === true) {
                                await db.collection(token.bankId).doc('pi').collection('rejected-bulk-renewal').add({
                                    ...transactionInfo,
                                    ...transactionInfo.trans[i],
                                    id: transactionNumber,
                                    narration: "Rejected as Closed Account",
                                });
                                failedCount++;
                            } else {
                                const updatedBalance = parseFloat(accountInfo.balance || 0) + parseFloat(accountTrans[i].amount);
                                trans.update(accountRef, {
                                    balance: updatedBalance,
                                    transDate: serverDate,
                                });

                                const transObj = {
                                    amount: accountTrans[i].amount || 0,
                                    accountType: accountType,
                                    balance: accountInfo.balance || 0,
                                    glCode: transactionInfo.glCode || '',
                                    glHead: transactionInfo.glHead || '',
                                    entryDate: serverDate,
                                    date: serverDate,
                                    narration: transactionInfo.narration || '',
                                    type: 'credit',
                                    method: transactionInfo.method || 'cash',
                                    account: accountTrans[i].accountNumber || '',
                                    name: accountTrans[i].name || '',
                                    author: transactionInfo.author || '',
                                    approver: token.email || '',
                                    createdAt: new Date().toISOString(),
                                };

                                const accountTransRef = db.collection(token.bankId).doc('accounts').collection(accountType).doc(accountTrans[i].accountNumber)
                                    .collection('transaction').doc(`${transactionNumber}.${i}`);
                                trans.set(accountTransRef, transObj);

                                const transRef = db.collection(token.bankId).doc('transaction').collection(serverDate).doc(`${transactionNumber}.${i}`);
                                trans.set(transRef, transObj);

                                totalTransaction += parseFloat(accountTrans[i].amount);
                            }
                        });
                    } catch (e) {
                        console.log(e);
                        failedCount++;
                        const transObj = {
                            instructionId: transactionNumber,
                            author: token.email,
                            bankId: token.bankId,
                            err: e.toString(),
                            account: accountTrans[i].account,
                            name: accountTrans[i].name || '',
                            amount: accountTrans[i].amount || 0,
                        };
                        await db.collection('admin').doc('crash').collection('deposit-bulk-renewal-trans').add(transObj);
                        await db.collection(token.bankId).doc('pi').collection('rejected-bulk-renewal').add({
                            ...transactionInfo,
                            ...transactionInfo.trans[i],
                            id: transactionNumber,
                            narration: e.toString(),
                        });
                    }
                }

                t.delete(transactionRef);
                if (failedCount > 0) {
                    res.send({warning: `successfully approved but ${failedCount} transaction is rejected. View on Rejected Renewal`});
                } else {
                    res.send({success: `successfully approved Transaction Id: ${transactionNumber}`});
                }
            });
        } catch (e) {
            console.log(e);
            await db.collection('admin').doc('crash').collection('bulk-renewal-trans').add({
                type: 'debit',
                instructionId: transactionNumber,
                author: token.email,
                bankId: token.bankId,
                err: e.toString(),
            });
            res.send({error: 'Something wrong. We have captured the response for further evaluation. Contact Dev team for immediate attention'});
        }
    });
};