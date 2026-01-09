const { getFirestore} = require('firebase-admin/firestore');
const db = getFirestore();
const createDateArray = require("../../../functions/createDateArray");

module.exports = app=> {
    app.post('/api/reports/general/cash-account-v2', async function (req, res){
        const token = req.user;
       if (!token) return res.status(401).send({error: 'You are not authorized. Please log in.'});

       try {
        const transObj = {};
        const totalSumObj = {
            cashDebitAmount: 0,
            cashCreditAmount: 0,
            transferDebitAmount: 0,
            transferCreditAmount: 0,
            debitAmount: 0,
            creditAmount: 0,
        };
 
        const dateArray = createDateArray(req.body.fromDate, req.body.toDate);
        
        for (const selectedDate of dateArray) {
            const dayBookTrans = await db.collection(token.bankId).doc('transaction').collection(selectedDate).get();
            dayBookTrans.forEach(function (transaction){
                if (transaction.data().type === 'credit'){
                    totalSumObj.creditAmount += parseFloat(transaction.data().amount);
                    if (transObj[transaction.data().glCode]){
                        transObj[transaction.data().glCode].creditAmount += parseFloat(transaction.data().amount);
                        if (transaction.data().method === 'cash'){
                            transObj[transaction.data().glCode].cashCreditAmount += parseFloat(transaction.data().amount);
                            totalSumObj.cashCreditAmount += parseFloat(transaction.data().amount);
                        }else {
                            transObj[transaction.data().glCode].transferCreditAmount += parseFloat(transaction.data().amount);
                            totalSumObj.transferCreditAmount += parseFloat(transaction.data().amount);
                        }
                    }else {
                        if (transaction.data().method === 'cash'){
                            transObj[transaction.data().glCode] = {
                                glCode: transaction.data().glCode,
                                glHead: transaction.data().glHead,
                                debitAmount: 0,
                                cashDebitAmount: 0,
                                transferDebitAmount: 0,
                                creditAmount: parseFloat(transaction.data().amount),
                                cashCreditAmount: parseFloat(transaction.data().amount),
                                transferCreditAmount: 0,
                            };
                            totalSumObj.cashCreditAmount += parseFloat(transaction.data().amount);
                        }else {
                            transObj[transaction.data().glCode] = {
                                glCode: transaction.data().glCode,
                                glHead: transaction.data().glHead,
                                debitAmount: 0,
                                cashDebitAmount: 0,
                                transferDebitAmount: 0,
                                creditAmount: parseFloat(transaction.data().amount),
                                cashCreditAmount: 0,
                                transferCreditAmount: parseFloat(transaction.data().amount),
                            };
                            totalSumObj.transferCreditAmount += parseFloat(transaction.data().amount);
                        }
                    }
                }else {
                    totalSumObj.debitAmount += parseFloat(transaction.data().amount);
                    if (transObj[transaction.data().glCode]){
                        transObj[transaction.data().glCode].debitAmount += parseFloat(transaction.data().amount);
                        if (transaction.data().method === 'cash'){
                            transObj[transaction.data().glCode].cashDebitAmount += parseFloat(transaction.data().amount);
                            totalSumObj.cashDebitAmount += parseFloat(transaction.data().amount);
                        }else {
                            transObj[transaction.data().glCode].transferDebitAmount += parseFloat(transaction.data().amount);
                            totalSumObj.transferDebitAmount += parseFloat(transaction.data().amount);
                        }
                    }else {
                        if (transaction.data().method === 'cash'){
                            transObj[transaction.data().glCode] = {
                                glCode: transaction.data().glCode,
                                glHead: transaction.data().glHead,
                                creditAmount: 0,
                                cashCreditAmount: 0,
                                transferCreditAmount: 0,
                                debitAmount: parseFloat(transaction.data().amount),
                                cashDebitAmount: parseFloat(transaction.data().amount),
                                transferDebitAmount: 0,
                            };
                            totalSumObj.cashDebitAmount += parseFloat(transaction.data().amount);
                        }else {
                            transObj[transaction.data().glCode] = {
                                glCode: transaction.data().glCode,
                                glHead: transaction.data().glHead,
                                creditAmount: 0,
                                cashCreditAmount: 0,
                                transferCreditAmount: 0,
                                debitAmount: parseFloat(transaction.data().amount),
                                cashDebitAmount: 0,
                                transferDebitAmount: parseFloat(transaction.data().amount),
                            };
                            totalSumObj.transferDebitAmount += parseFloat(transaction.data().amount);
                        }
                    }
                }
            });
        }
        res.send({success: Object.values(transObj), totalSum: totalSumObj});
 
       } catch (error) {
            console.log("cash account errro: ", error);
            res.send({error: "Failed to fetch cash account. Please try again.."})
       }       
    });
}