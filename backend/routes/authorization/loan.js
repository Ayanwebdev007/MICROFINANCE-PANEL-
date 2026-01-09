const { getFirestore } = require('firebase-admin/firestore');
const db = getFirestore();
const transactionService = require('../../services/transactionService');

module.exports = app => {
    app.get('/api/authorize/loan-disbursement/:transactionId', async function (req, res) {
        const token = req.user; // Get user from the middleware
        if (!token) return res.status(401).send({ error: 'You are not authorized. Please log in.' });

        const transactionId = req.params.transactionId;
        const systemDate = new Date().toISOString().slice(0, 10);

        try {
            await db.runTransaction(async (t) => {
                const transactions = [];

                const transactionColRef = db.collection(token.bankId).doc('pi').collection('loan-disbursement');
                const snapshot = await t.get(transactionColRef);
                snapshot.forEach(doc => {
                    transactions.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });

                const transactionRef = db.collection(token.bankId).doc('pi').collection('loan-disbursement').doc(transactionId);
                const transaction = await t.get(transactionRef);
                if (!transaction.exists) {
                    return res.send({ warning: 'Transaction not found. Maybe already authorized', transactions });
                }
                const accountRef = db.collection(token.bankId).doc('accounts').collection(transaction.data().accountType).doc(transaction.data().accountNumber);

                const transactionData = {
                    account: transaction.data().accountNumber,
                    accountType: transaction.data().accountType,
                    entryDate: transaction.data().transactionDate,
                    type: transaction.data().type,
                    method: transaction.data().method,
                    narration: transaction.data().narration,
                    name: transaction.data().name,
                    amount: transaction.data().amount,
                    balance: 0,
                    glCode: transaction.data().glCode,
                    glHead: transaction.data().glHead,
                    author: transaction.data().createdBy,
                    approvedBy: token.email,
                    createdAt: transaction.data().createdAt,
                    approvedAt: new Date().toISOString(),
                };
                t.update(accountRef, {
                    disbursement: transaction.data().amount,
                    disbursementDate: systemDate,
                    transactionDate: systemDate,
                    closed: false,
                });

                const accountTransRef = db.collection(token.bankId).doc('accounts').collection(transaction.data().accountType).doc(transaction.data().accountNumber).collection('transaction').doc(transactionId);
                await t.set(accountTransRef, transactionData);

                // Use TransactionService for dual-recording
                await transactionService.recordTransaction(token.bankId, transactionData, systemDate, t);

                t.delete(transactionRef);

                return res.send({
                    success: `Transaction ${transactionId} is authorized successfully`,
                    autoAuthorize: [
                        { type: 'voucher', id: `${transactionId}.2` },
                        { type: 'voucher', id: `${transactionId}.3` },
                        { type: 'voucher', id: `${transactionId}.4` },
                        { type: 'voucher', id: `${transactionId}.5` },
                    ],
                    transactions: transactions.filter(t => t.id !== transactionId),
                });
            });
        } catch (e) {
            console.log('Transaction failure:', e);
            return res.send({ error: 'Failed to authorize. Try again...' });
        }
    });

    app.get('/api/authorise/loan-repayment/:transaction', async function (req, res) {
        const token = req.user; // Get user from the middleware
        if (!token) return res.status(401).send({ error: 'You are not authorized. Please log in.' });

        const transactionNumber = req.params.transaction;
        const systemDate = new Date().toISOString().slice(0, 10);

        try {
            await db.runTransaction(async (trans) => {
                const transactions = [];

                const transactionColRef = db.collection(token.bankId).doc('pi').collection('loan-repayment');
                const snapshot = await trans.get(transactionColRef);
                snapshot.forEach(doc => {
                    transactions.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });

                const transactionRef = db.collection(token.bankId).doc('pi').collection('loan-repayment').doc(transactionNumber);
                const transaction = await trans.get(transactionRef);
                if (!transaction.exists) {
                    return res.send({ warning: 'Transaction not found. Maybe already authorized', transactions });
                }
                const transactionInfo = transaction.data();

                const accountRef = db.collection(token.bankId).doc('accounts').collection(transactionInfo.accountType).doc(transactionInfo.account);
                const accountInfo = await trans.get(accountRef);

                if ((parseInt(accountInfo.data().installment) + parseInt(transactionInfo.emiCollection)) > parseInt(accountInfo.data().totalEMI)) {
                    await db.collection(token.bankId).doc('pi').collection('rejected-loan-repayment').add({
                        ...transactionInfo,
                        id: transactionNumber,
                        narration: "Rejected as Over Payment",
                    });
                    return res.send({ error: `Failed to Authorize: Rejected as Overpayment` });
                } else {
                    trans.update(accountRef, {
                        transDate: systemDate,
                        paidEMI: parseInt(accountInfo.data().paidEMI || 0) + parseInt(transactionInfo.emiCollection),
                        partialEmiDueAmount: parseInt(transactionInfo.partialEmiDueAmount) || 0,
                        closed: parseInt(transactionInfo.partialEmiDueAmount) === 0 && (parseInt(accountInfo.data().totalEMI) === (parseInt(accountInfo.data().paidEMI || 0) + parseInt(transactionInfo.emiCollection))),
                    });
                    const interestAmount = parseInt(accountInfo.data().interestEMI) * parseInt(transactionInfo.emiCollection)
                    const transactionObject = {
                        entryDate: transactionInfo.transactionDate,
                        accountType: transactionInfo.accountType,
                        amount: transactionInfo.totalAmount,
                        interest: interestAmount,
                        principle: parseInt(transactionInfo.totalAmount) - interestAmount,
                        glCode: transactionInfo.glCode,
                        glHead: transactionInfo.glHead,
                        account: transactionInfo.account,
                        method: transactionInfo.method,
                        paidEMI: parseInt(accountInfo.data().paidEMI || 0) + parseInt(transactionInfo.emiCollection),
                        type: transactionInfo.type,
                        name: transactionInfo.name,
                        narration: transactionInfo.narration || `Loan Repayment by ${transactionInfo.name}`,
                        createdAt: transactionInfo.createdAt,
                        createdBy: transactionInfo.createdBy,
                        authorisedAt: new Date().toISOString(),
                        authorisedBy: token.email,
                    };

                    // Account local transaction history
                    const accountTransRef = db.collection(token.bankId).doc('accounts').collection(transactionInfo.accountType).doc(transactionInfo.account)
                        .collection('transaction').doc(transactionNumber);
                    trans.set(accountTransRef, transactionObject);

                    // Use TransactionService for dual-recording (Principal)
                    await transactionService.recordTransaction(token.bankId, {
                        ...transactionObject,
                        id: `${transactionNumber}.2`,
                        amount: parseInt(transactionInfo.totalAmount) - interestAmount,
                    }, systemDate, trans);

                    // Use TransactionService for dual-recording (Interest)
                    await transactionService.recordTransaction(token.bankId, {
                        ...transactionObject,
                        id: `${transactionNumber}.3`,
                        glCode: transactionInfo.interestGLCode,
                        glHead: transactionInfo.interestGLHead,
                        amount: interestAmount,
                    }, systemDate, trans);
                    trans.delete(transactionRef);
                    return res.send({
                        success: `Transaction ${transactionNumber} is authorized successfully`,
                        autoAuthorize: [
                            { type: 'voucher', id: `${transactionNumber}.1` },
                        ],
                        transactions: transactions.filter(t => t.id !== transactionNumber),
                    });
                }
            });
        } catch (e) {
            console.log(e);
            await db.collection('admin').doc('crash').collection('loan-repayment').add({
                author: token.email,
                bankId: token.bankId,
                id: transactionNumber,
                reason: e.toLocaleString(),
            });
            res.send({ error: `Failed to Authorize: ${e.toLocaleString()}` });
        }
    });

    app.get('/api/authorise/bulk-loan-repayment/:transaction', async function (req, res) {
        const token = req.user;
        if (!token) return res.status(401).send({ error: 'You are not authorized. Please log in.' });

        const transactionNumber = req.params.transaction;
        const date = new Date().toISOString().slice(0, 10);

        try {
            // First, get the bulk transaction info (not in a write transaction yet)
            const transactionRef = db.collection(token.bankId).doc('pi').collection('loan-bulk-repayment').doc(transactionNumber);
            const transactionRecord = await transactionRef.get();

            if (!transactionRecord.exists) {
                return res.send({ error: 'Bulk transaction not found.' });
            }

            const transactionInfo = transactionRecord.data();
            const accountsToProcess = transactionInfo.trans || [];

            let rejectedCount = 0;
            let successCount = 0;

            // Process each individual loan repayment in its own transaction
            for (let i = 0; i < accountsToProcess.length; i++) {
                const item = accountsToProcess[i];
                try {
                    await db.runTransaction(async (trans) => {
                        const accountRef = db.collection(token.bankId).doc('accounts').collection(transactionInfo.accountType).doc(item.account);
                        const accountDoc = await trans.get(accountRef);

                        if (!accountDoc.exists) {
                            throw new Error('Account not found');
                        }

                        const accountData = accountDoc.data();
                        const currentPaidEMI = parseInt(accountData.paidEMI || 0);
                        const newPaidCount = currentPaidEMI + parseInt(item.multiplier);

                        if (newPaidCount > parseInt(accountData.totalEMI || accountData.termPeriod)) {
                            // This one is an overpayment, will be handled by the catch block below or logic within transaction
                            throw new Error('Overpayment');
                        }

                        trans.update(accountRef, {
                            transDate: date,
                            paidEMI: newPaidCount,
                            closed: parseInt(accountData.totalEMI || accountData.termPeriod) === newPaidCount
                        });

                        const interestAmount = parseInt(item.interestInstallment) * parseInt(item.multiplier);
                        const principleAmount = parseInt(item.principleInstallment) * parseInt(item.multiplier);

                        const transactionObject = {
                            entryDate: date,
                            accountType: transactionInfo.accountType,
                            amount: principleAmount + interestAmount,
                            interest: interestAmount,
                            principle: principleAmount,
                            glCode: transactionInfo.glCode,
                            glHead: transactionInfo.glHead,
                            account: item.account,
                            method: transactionInfo.method,
                            paidEMI: newPaidCount,
                            type: 'credit',
                            name: item.name,
                            narration: transactionInfo.narration || '',
                            author: transactionInfo.author,
                            approver: token.email,
                            createdAt: transactionInfo.createdAt || '',
                            createdBy: transactionInfo.author || '',
                            authorisedAt: new Date().toISOString(),
                            authorisedBy: token.email,
                            groupId: transactionInfo.accountType === 'group-loan' ? (item.groupId || '') : '',
                            groupName: transactionInfo.accountType === 'group-loan' ? (item.groupName || '') : '',
                        };

                        // Account local transaction history
                        const accountTransRef = accountRef.collection('transaction').doc(`${transactionNumber}.${i}`);
                        trans.set(accountTransRef, transactionObject);

                        // Use TransactionService for dual-recording (Principal)
                        await transactionService.recordTransaction(token.bankId, {
                            ...transactionObject,
                            id: `${transactionNumber}.${i}.1`,
                            amount: principleAmount,
                            glCode: transactionInfo.glCode,
                            glHead: transactionInfo.glHead,
                        }, date, trans);

                        // Use TransactionService for dual-recording (Interest)
                        await transactionService.recordTransaction(token.bankId, {
                            ...transactionObject,
                            id: `${transactionNumber}.${i}.2`,
                            amount: interestAmount,
                            glCode: transactionInfo.interestGlCode,
                            glHead: transactionInfo.interestGlHead,
                        }, date, trans);
                    });
                    successCount++;
                } catch (e) {
                    console.error(`Bulk item ${i} failed:`, e.message);
                    rejectedCount++;
                    // Log rejection
                    await db.collection(token.bankId).doc('pi').collection('rejected-loan-bulk-repayment').add({
                        ...transactionInfo,
                        ...item,
                        bulkTransactionId: transactionNumber,
                        reason: e.message,
                        author: token.email
                    });
                }
            }

            // Finally delete the PI
            await transactionRef.delete();

            if (rejectedCount > 0) {
                res.send({ warning: `Successfully processed ${successCount} accounts, but ${rejectedCount} were rejected. Check Rejected Repayments.` });
            } else {
                res.send({ success: `Successfully authorized bulk transaction ${transactionNumber}` });
            }
        } catch (err) {
            console.error('Bulk Authorization failure:', err);
            res.status(500).send({ error: 'Failed to process bulk authorization. ' + err.message });
        }
    });

    app.get('/api/authorise/loan-foreclosure/:transaction', async function (req, res) {
        const token = req.user;
        if (!token) return res.status(401).send({ error: 'You are not authorized. Please log in.' });

        const transactionNumber = req.params.transaction;
        const systemDate = new Date().toISOString().slice(0, 10);

        try {
            const result = await db.runTransaction(async (trans) => {

                const transactions = [];
                const transactionColRef = db.collection(token.bankId).doc('pi').collection('loan-foreclosure');
                const snapshot = await trans.get(transactionColRef);
                snapshot.forEach(doc => {
                    transactions.push({ id: doc.id, ...doc.data() });
                });

                const transactionRef = transactionColRef.doc(transactionNumber);
                const transactionDoc = await trans.get(transactionRef);
                if (!transactionDoc.exists) {
                    return {
                        warning: 'Transaction not found. Maybe already authorized',
                        transactions,
                    };
                }
                const transactionInfo = transactionDoc.data();


                const accountRef = db.collection(token.bankId)
                    .doc('accounts')
                    .collection(transactionInfo.accountType)
                    .doc(transactionInfo.accountNumber);
                const accountDoc = await trans.get(accountRef);
                if (!accountDoc.exists) {
                    throw new Error(`Account ${transactionInfo.accountNumber} not found`);
                }




                const transactionObject = {
                    entryDate: systemDate,
                    transactionId: transactionNumber,
                    accountType: transactionInfo.accountType,
                    account: transactionInfo.accountNumber,
                    method: transactionInfo.method,
                    type: transactionInfo.type,
                    name: transactionInfo.name,
                    narration: transactionInfo.narration || `Loan Foreclosure by ${transactionInfo.name}`,
                    amount: parseFloat(transactionInfo.foreclosureAmount),
                    foreclosureFee: parseFloat(transactionInfo.foreclosureFee || 0),
                    glCode: transactionInfo.glCode,
                    glHead: transactionInfo.glHead,
                    interestGLCode: transactionInfo.interestGLCode,
                    interestGLHead: transactionInfo.interestGLHead,
                    planDetails: transactionInfo.planDetails || {},
                    createdAt: transactionInfo.createdAt,
                    createdBy: transactionInfo.createdBy,
                    authorisedAt: new Date().toISOString(),
                    authorisedBy: token.email,
                };


                const accountTransRef = accountRef.collection('transaction').doc(transactionNumber);
                trans.set(accountTransRef, transactionObject);

                // Use TransactionService for dual-recording
                await transactionService.recordTransaction(token.bankId, {
                    ...transactionObject,
                    id: transactionNumber
                }, systemDate, trans);

                trans.delete(transactionRef);

                return {
                    success: `Loan foreclosure transaction ${transactionNumber} authorized successfully`,
                    transactions: transactions.filter(t => t.id !== transactionNumber),
                };
            });

            res.send(result);

        } catch (e) {
            console.error(e);
            await db.collection('admin').doc('crash').collection('loan-foreclosure').add({
                author: token.email,
                bankId: token.bankId,
                id: transactionNumber,
                reason: e.toString(),
            });
            res.send({ error: `Failed to Authorize: ${e.toString()}` });
        }
    });






};