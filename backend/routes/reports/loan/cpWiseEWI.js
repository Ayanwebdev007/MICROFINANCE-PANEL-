const { getFirestore} = require('firebase-admin/firestore');
const db = getFirestore();
const createDateArray = require("../../../functions/createDateArray");

module.exports = app=> {
    app.post('/api/reports/loan/loan-cp-ewi-report', async function (req, res){
        const token = req.user;
        if (!token) return res.status(401).send({error: 'You are not authorized. Please log in.'});
        
        try {
            const bankId = req.body.bankId || token.bankId;
            const fromDate = req.body.fromDate;
            const toDate = req.body.toDate;
            const dateArray = createDateArray(fromDate, toDate);
            const agentTransactions = [];
            let transObj = {};
            // Sum Variables
            let totalDebit = 0;
            let totalCredit = 0;
            let totalPrinciple = 0;
            let totalInterest = 0;
            
            for (const selectedDate of dateArray) {
                let getTrans;
                if (req.body.agent === 'all'){
                    getTrans = await db.collection(bankId).doc('transaction').collection(selectedDate).where('glCode', '==', '23105').get();
                }else {
                    getTrans = await db.collection(bankId).doc('transaction').collection(selectedDate).where('glCode', '==', '23105').where('referrer', '==', req.body.agent).get();
                }
                
                getTrans.forEach(function (querySnapshot){
                    const existingTrans = transObj[querySnapshot.data().referrer]
                    if (querySnapshot.data().type === 'credit'){
                        transObj = {
                            ...transObj,
                            [querySnapshot.data().referrer]: {
                                agent: querySnapshot.data().referrer,
                                debit: existingTrans ? existingTrans.debit : 0,
                                credit: existingTrans ? existingTrans.credit + parseFloat(querySnapshot.data().principle) + parseFloat(querySnapshot.data().interest) : parseFloat(querySnapshot.data().principle) + parseFloat(querySnapshot.data().interest),
                                principle: existingTrans ? existingTrans.principle + parseFloat(querySnapshot.data().principle) : parseFloat(querySnapshot.data().principle),
                                interest: existingTrans ? existingTrans.interest + parseFloat(querySnapshot.data().interest) : parseFloat(querySnapshot.data().interest),
                            },
                        };
                        totalCredit += parseFloat(querySnapshot.data().principle) + parseFloat(querySnapshot.data().interest);
                        totalPrinciple += parseFloat(querySnapshot.data().principle);
                        totalInterest += parseFloat(querySnapshot.data().interest);
                    }else if (querySnapshot.data().type === 'debit'){
                        transObj = {
                            ...transObj,
                            [querySnapshot.data().referrer]: {
                                agent: querySnapshot.data().referrer,
                                debit: existingTrans ? existingTrans.debit + parseFloat(querySnapshot.data().amount) : parseFloat(querySnapshot.data().amount),
                                credit: existingTrans ? existingTrans.credit : 0,
                                principle: existingTrans ? existingTrans.principle : 0,
                                interest: existingTrans ? existingTrans.interest : 0,
                            },
                        };
                        totalDebit += parseFloat(querySnapshot.data().amount);
                    }
                });
            }
            
            for (const trans of Object.values(transObj)) {
                const cifInfo = await db.collection(bankId).doc('kyc').collection('advisor-kyc').doc(trans.agent).get();
                agentTransactions.push({
                    ...trans,
                    name: cifInfo.data().name,
                    membershipNumber: cifInfo.id,
                });
            }
            res.send({
                success: 'successfully fetched EWI transactions',
                details: agentTransactions,
                totalDebit,
                totalCredit,
                totalPrinciple,
                totalInterest,
            });
        } catch (error) {
            console.log(error);
            res.send({error: "Failed to fetch loan-cp-ewi report. try again..."})
            
        }
    });
}