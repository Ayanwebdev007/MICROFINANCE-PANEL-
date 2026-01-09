const { getFirestore} = require('firebase-admin/firestore');
const db = getFirestore();

module.exports = app => {
    app.get('/api/authorize/loan-disbursement/:transactionId', async function (req, res){
        const token = req.user; // Get user from the middleware
        if (!token) return res.status(401).send({error: 'You are not authorized. Please log in.'});

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
                    return res.send({warning: 'Transaction not found. Maybe already authorized', transactions});
                }
                const accountRef = db.collection(token.bankId).doc('accounts').collection(transaction.data().accountType).doc(transaction.data().accountNumber);
                const accountInfo = await t.get(accountRef);

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

                const bankTransRef = db.collection(token.bankId).doc('transaction').collection(systemDate).doc(transactionId);
                await t.set(bankTransRef, transactionData);

                t.delete(transactionRef);

                return res.send({
                    success: `Transaction ${transactionId} is authorized successfully`,
                    autoAuthorize: [
                        {type: 'voucher', id: `${transactionId}.2`},
                        {type: 'voucher', id: `${transactionId}.3`},
                        {type: 'voucher', id: `${transactionId}.4`},
                        {type: 'voucher', id: `${transactionId}.5`},
                    ],
                    transactions: transactions.filter(t => t.id !== transactionId),
                });
            });
        } catch (e) {
            console.log('Transaction failure:', e);
            return res.send({error: 'Failed to authorize. Try again...'});
        }
    });

    app.get('/api/authorise/loan-repayment/:transaction', async function (req, res){
        const token = req.user; // Get user from the middleware
        if (!token) return res.status(401).send({error: 'You are not authorized. Please log in.'});

        const transactionNumber = req.params.transaction;
        const systemDate = new Date().toISOString().slice(0,10);

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
                    return res.send({warning: 'Transaction not found. Maybe already authorized', transactions});
                }
                const transactionInfo = transaction.data();

                const accountRef = db.collection(token.bankId).doc('accounts').collection(transactionInfo.accountType).doc(transactionInfo.account);
                const accountInfo = await trans.get(accountRef);

                if ((parseInt(accountInfo.data().installment) + parseInt(transactionInfo.emiCollection)) > parseInt(accountInfo.data().totalEMI)){
                    await db.collection(token.bankId).doc('pi').collection('rejected-loan-repayment').add({
                        ...transactionInfo,
                        id: transactionNumber,
                        narration: "Rejected as Over Payment",
                    });
                    return res.send({error: `Failed to Authorize: Rejected as Overpayment`});
                }else {
                    trans.update(accountRef, {
                        transDate: systemDate,
                        paidEMI: parseInt(accountInfo.data().paidEMI || 0) + parseInt(transactionInfo.emiCollection),
                        partialEmiDueAmount: parseInt( transactionInfo.partialEmiDueAmount) || 0,
                        closed: parseInt( transactionInfo.partialEmiDueAmount) === 0 && (parseInt(accountInfo.data().totalEMI) === (parseInt(accountInfo.data().paidEMI || 0) + parseInt(transactionInfo.emiCollection))),
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

                    const accountTransRef = db.collection(token.bankId).doc('accounts').collection(transactionInfo.accountType).doc(transactionInfo.account)
                        .collection('transaction').doc(transactionNumber);
                    trans.set(accountTransRef, transactionObject);

                    const principleTransRef = db.collection(token.bankId).doc('transaction').collection(systemDate).doc(`${transactionNumber}.2`);
                    trans.set(principleTransRef, {
                        ...transactionObject,
                        amount: parseInt(transactionInfo.totalAmount) - interestAmount,
                    });

                    const interestTransRef = db.collection(token.bankId).doc('transaction').collection(systemDate).doc(`${transactionNumber}.3`);
                    trans.set(interestTransRef, {
                        ...transactionObject,
                        glCode: transactionInfo.interestGLCode,
                        glHead: transactionInfo.interestGLHead,
                        amount: interestAmount,
                    });
                    trans.delete(transactionRef);
                    return res.send({
                        success: `Transaction ${transactionNumber} is authorized successfully`,
                        autoAuthorize: [
                            {type: 'voucher', id: `${transactionNumber}.1`},
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
            res.send({error: `Failed to Authorize: ${e.toLocaleString()}`});
        }
    });
    
    app.get('/api/authorise/bulk-loan-repayment/:transaction', async function (req, res){
        const token = req.user;
        if (!token) return res.status(401).send({error: 'You are not authorized. Please log in.'});

        const transactionNumber = req.params.transaction;
        
        let principleTotal = 0;
        let interestTotal = 0;
        let rejectedCount = 0;
        
        try {
            await db.runTransaction(async (t) => {
                const transactionRef = db.collection(token.bankId).doc('pi').collection('loan-bulk-repayment').doc(transactionNumber);
                const transaction = await t.get(transactionRef);
                const transactionInfo = transaction.data();
                
                const date = new Date().toISOString().slice(0, 10);
                
                const transactionLength = transactionInfo.trans.length;
                
                for (let i = 0; i < transactionLength; i++) {
                    try {
                        await db.runTransaction(async (trans) => {
                            const accountRef = db.collection(token.bankId).doc('accounts').collection(transactionInfo.accountType).doc(transactionInfo.trans[i].account);
                            const accountInfo = await trans.get(accountRef);
                            
                            if ((parseInt(accountInfo.data().installment) + parseInt(transactionInfo.trans[i].multiplier)) > parseInt(accountInfo.data().termPeriod)){
                                await db.collection(token.bankId).doc('pi').collection('rejected-loan-bulk-repayment').add({
                                    ...transactionInfo,
                                    ...transactionInfo.trans[i],
                                    id: transactionNumber,
                                    narration: "Rejected as Over Payment",
                                });
                                rejectedCount++;
                            }else {
                                trans.update(accountRef, {
                                    transDate: date,
                                    paidEMI: parseInt(accountInfo.data().paidEMI || 0) + parseInt(transactionInfo.trans[i].multiplier),
                                    closed: parseInt(accountInfo.data().totalEMI) === (parseInt(accountInfo.data().paidEMI || 0) + parseInt(transactionInfo.trans[i].multiplier))
                                });

                                const baseTransactionObject = {
                                    entryDate: date,
                                    accountType: transactionInfo.accountType,
                                    amount: parseInt(transactionInfo.trans[i].installmentAmount) * parseInt(transactionInfo.trans[i].multiplier),
                                    interest: parseInt(transactionInfo.trans[i].interestInstallment) * parseInt(transactionInfo.trans[i].multiplier),
                                    principle: parseInt(transactionInfo.trans[i].principleInstallment) * parseInt(transactionInfo.trans[i].multiplier),
                                    glCode: transactionInfo.glCode,
                                    glHead: transactionInfo.glHead,
                                    account: transactionInfo.trans[i].account,
                                    method: transactionInfo.method,
                                    paidEMI: parseInt(accountInfo.data().paidEMI || 0) + parseInt(transactionInfo.trans[i].multiplier),
                                    transferTo: '',
                                    type: 'credit',
                                    name: transactionInfo.trans[i].name,
                                    narration: transactionInfo.narration || '',
                                    author: transactionInfo.author,
                                    approver: token.email,
                                    createdAt: transactionInfo.createdAt || '',
                                    createdBy: transactionInfo.author || '',
                                    authorisedAt: new Date().toISOString(),
                                    authorisedBy: token.email,
                                };

                                if (transactionInfo.accountType === 'group-loan') {
                                    baseTransactionObject.groupId = transactionInfo.trans[i].groupId || '';
                                    baseTransactionObject.groupName = transactionInfo.trans[i].groupName || '';
                                }

                                const transactionObject = baseTransactionObject;


                                const accountTransRef = db.collection(token.bankId).doc('accounts').collection(transactionInfo.accountType).doc(transactionInfo.trans[i].account)
                                    .collection('transaction').doc(`${transactionNumber}.${i}`);
                                trans.set(accountTransRef, transactionObject);
                                
                                const transRef = db.collection(token.bankId).doc('transaction').collection(date).doc(`${transactionNumber}.${i}.1`);
                                trans.set(transRef, {
                                    ...transactionObject,
                                    amount: parseInt(transactionInfo.trans[i].principleInstallment) * parseInt(transactionInfo.trans[i].multiplier),
                                    glCode: transactionInfo.glCode,
                                    glHead: transactionInfo.glHead,
                                });
                                
                                const interestTransRef = db.collection(token.bankId).doc('transaction').collection(date).doc(`${transactionNumber}.${i}.2`);
                                trans.set(interestTransRef, {
                                    ...transactionObject,
                                    amount: parseInt(transactionInfo.trans[i].interestInstallment) * parseInt(transactionInfo.trans[i].multiplier),
                                    glCode: transactionInfo.interestGlCode,
                                    glHead: transactionInfo.interestGlHead,
                                });
                                principleTotal += parseInt(transactionInfo.trans[i].principleInstallment) * parseInt(transactionInfo.trans[i].multiplier);
                                interestTotal += parseInt(transactionInfo.trans[i].interestInstallment) * parseInt(transactionInfo.trans[i].multiplier);
                            }
                        });
                    } catch (e) {
                        console.log(e);
                        await db.collection(token.bankId).doc('pi').collection('rejected-loan-bulk-repayment').add({
                            ...transactionInfo,
                            ...transactionInfo.trans[i],
                            id: transactionNumber,
                            narration: e.toString(),
                        });
                        await db.collection('admin').doc('crash').collection('loan-bulk-repayment').add({
                            ...transactionInfo,
                            ...transactionInfo.trans[i],
                            id: transactionNumber,
                            narration: e.toString(),
                        });
                    }
                }
                
                t.delete(transactionRef);
                if (rejectedCount > 0){
                    res.send({warning: `successfully approved but ${rejectedCount} transaction is rejected. View on Rejected Repayments`});
                }else {
                    res.send({success: `successfully approved Transaction Id: ${transactionNumber}`});
                }
            });
        }catch (err) {
            console.log('Transaction failure:', err);
            res.send({error: 'there is something wrong. Try again...'});
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


                const glTransRef = db.collection(token.bankId).doc('transaction')
                  .collection(systemDate).doc(transactionNumber);
                trans.set(glTransRef, transactionObject);

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