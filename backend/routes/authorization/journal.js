const { getFirestore} = require('firebase-admin/firestore');
const db = getFirestore();

module.exports = app=> {
    app.get('/api/authorise/journal/:transaction', async function (req, res){
        const token = req.user; // Get user from the middleware
        if (!token) return res.status(401).send({error: 'You are not authorized. Please log in.'});

        const transactionNumber = req.params.transaction;
        
        try {
            await db.runTransaction(async (t) => {
                let glTrans = {};
                let accountTrans = {};
                const paymentInstructionRef = db.collection(token.bankId).doc('pi').collection('journal').doc(transactionNumber);
                const getPaymentInstruction = await t.get(paymentInstructionRef);
                const transactions = Object.values(getPaymentInstruction.data().trans);

                //for back date entry
                // const serverDate = new Date().toISOString().slice(0,10);
                const serverDate = getPaymentInstruction.data().date || new Date().toISOString().slice(0,10);

                for (let i = 0; i < transactions.length; i++){
                    if (transactions[i].accountType){
                        let multiplier = 1;
                        if (transactions[i].type === 'debit'){
                            multiplier = -1;
                        }
                        const accountRef = db.collection(token.bankId).doc('accounts').collection(transactions[i].accountType).doc(transactions[i].account);
                        const getAccountInfo = await t.get(accountRef);
                        if (!getAccountInfo.exists){
                            res.send({error: `invalid account number ${transactions[i].account}`});
                            return;
                        }
                        const determinedCode = accountGlCode(transactions[i].accountType, '');
                        accountTrans = {
                            ...accountTrans,
                            [transactions[i].account]: {
                                amount: (parseFloat(transactions[i].amount) * multiplier) + parseFloat(accountTrans[transactions[i].account] ? accountTrans[transactions[i].account].amount : '0'),
                                balance: getAccountInfo.data().balance || '0.00',
                                glCode: determinedCode.glCode,
                                glHead: determinedCode.glHead,
                                account: transactions[i].account,
                                accountType: transactions[i].accountType,
                                installment: transactions[i].installment || '',
                                referrer: transactions[i].referrer || '',
                                term: transactions[i].term || 1,
                            }
                        };
                        glTrans = {
                            ...glTrans,
                            [determinedCode.glCode]: {
                                ...glTrans[determinedCode.glCode],
                                creditSum: parseFloat(multiplier === 1 ? transactions[i].amount : '0') + parseFloat(glTrans[determinedCode.glCode] ? glTrans[determinedCode.glCode].creditSum || '0' : '0'),
                                debitSum: parseFloat(multiplier === -1 ? transactions[i].amount : '0') + parseFloat(glTrans[determinedCode.glCode] ? glTrans[determinedCode.glCode].debitSum || '0' : '0'),
                                glHead: determinedCode.glHead,
                                glCode: determinedCode.glCode
                            }
                        }
                    }else {
                        glTrans = {
                            ...glTrans,
                            [transactions[i].glCode]: {
                                creditSum: parseFloat(transactions[i].type === 'credit' ? transactions[i].amount : '0') + parseFloat(glTrans[transactions[i].glCode] ? glTrans[transactions[i].glCode].creditSum : '0'),
                                debitSum: parseFloat(transactions[i].type === 'debit' ? transactions[i].amount : '0') + parseFloat(glTrans[transactions[i].glCode] ? glTrans[transactions[i].glCode].debitSum : '0'),
                                creditTrans: parseFloat(transactions[i].type === 'credit' ? transactions[i].amount : '0') + parseFloat(glTrans[transactions[i].glCode] ? glTrans[transactions[i].glCode].creditTrans || 0 : '0'),
                                debitTrans: parseFloat(transactions[i].type === 'debit' ? transactions[i].amount : '0') + parseFloat(glTrans[transactions[i].glCode] ? glTrans[transactions[i].glCode].debitTrans || 0: '0'),
                                glHead: transactions[i].glHead,
                                glCode: transactions[i].glCode,
                            }
                        }
                    }
                }

                const totalAccountTrans = Object.values(accountTrans);
                const totalGlTrans = Object.values(glTrans);

                for (let i = 0; i < totalAccountTrans.length; i++){
                    const accountRef = db.collection(token.bankId).doc('accounts').collection(totalAccountTrans[i].accountType).doc(totalAccountTrans[i].account);
                    const personalLedgerRef = db.collection(token.bankId).doc('accounts').collection(totalAccountTrans[i].accountType).doc(totalAccountTrans[i].account)
                        .collection('transaction').doc(transactionNumber + '0' + i);
                    const dayBookRef = db.collection(token.bankId).doc('transaction').collection(serverDate).doc(transactionNumber + '0' + i);

                    t.update(accountRef, {balance: parseFloat(totalAccountTrans[i].balance || '0') + parseFloat(totalAccountTrans[i].amount), transDate: serverDate});
                    const dayBookTransObj = {
                        ...totalAccountTrans[i],
                        amount: (totalAccountTrans[i].amount < 0 ? totalAccountTrans[i].amount * (-1) : totalAccountTrans[i].amount).toFixed(2),
                        entryDate: serverDate,
                        date: serverDate,
                        type: totalAccountTrans[i].amount > 0 ? 'credit' : 'debit',
                        installment: totalAccountTrans[i].installment,
                        referrer: totalAccountTrans[i].referrer,
                        term: totalAccountTrans[i].term,
                        method: 'transfer',
                        author: getPaymentInstruction.data().author,
                        approver: token.email,
                        narration: getPaymentInstruction.data().narration,
                        approvedBy: token.email,
                        approvedAt: new Date(),
                    };
                    t.set(personalLedgerRef, dayBookTransObj);
                    t.set(dayBookRef, dayBookTransObj);
                }

                for (let i = 0; i < totalGlTrans.length; i++){
                    const dayBookRef = db.collection(token.bankId).doc('transaction').collection(serverDate).doc(transactionNumber + '1' + i);
                    if (totalGlTrans[i].debitTrans || totalGlTrans[i].creditTrans){
                        const amount = totalGlTrans[i].creditTrans - totalGlTrans[i].debitTrans
                        t.set(dayBookRef, {
                            amount: amount < 0 ? amount * (-1) : amount,
                            glCode: totalGlTrans[i].glCode,
                            glHead: totalGlTrans[i].glHead,
                            entryDate: serverDate,
                            type: amount > 0 ? 'credit' : 'debit',
                            method: 'transfer',
                            author: getPaymentInstruction.data().author,
                            approver: token.email,
                            narration: getPaymentInstruction.data().narration,
                            approvedBy: token.email,
                            approvedAt: new Date(),
                        });
                    }
                }
                t.delete(paymentInstructionRef);
                res.send({success: `Journal Transfer is authorised successfully with id: ${transactionNumber}`});
            });
        } catch (err) {
            res.send({error: 'there is something wrong. Try again...'});
            console.log('Transaction failure:', err);
        }
    });
}

const accountGlCode = (accountType) => {
    let glCode = '00001';
    let glHead = 'GL MIS-MATCH';
    if (accountType === 'savings'){
        glCode = '14301';
        glHead = 'SAVINGS DEPOSIT(NON MEMBERS)';
    }else if (accountType === 'thrift-fund'){
        glCode = '14306';
        glHead = 'THRIFT FUND SAVINGS ( NONMEMBER)';
    }else if (accountType === 'cash-certificate'){
        glCode = '22502';
        glHead = 'DEPOSIT CERTIFICATE(INDIVIDUAL MEMBERS)';
    }else if (accountType === 'fixed-deposit'){
        glCode = '14303';
        glHead = 'FIXED DEPOSIT(NON MEMBERS)';
    }else if (accountType === 'recurring-deposit'){
        glCode = '14302';
        glHead = 'RECURRING DEPOSIT(NON MEMBERS)';
    }else if (accountType === 'daily-savings'){
        glCode = '14205';
        glHead = 'HOME SAVINGS DEPOSIT';
    }
    
    return {glCode, glHead};
}