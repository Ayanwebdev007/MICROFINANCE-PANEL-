const { getFirestore } = require('firebase-admin/firestore');
const db = getFirestore();
const transactionService = require('../../../services/transactionService');

module.exports = app => {
    app.post('/api/reports/loan/loan-cp-ewi-report', async function (req, res) {
        const token = req.user;
        if (!token) return res.status(401).send({ error: 'You are not authorized. Please log in.' });

        try {
            const bankId = req.body.bankId || token.bankId;
            const fromDate = req.body.fromDate;
            const toDate = req.body.toDate;
            const agentTransactions = [];
            let transObj = {};
            // Sum Variables
            let totalDebit = 0;
            let totalCredit = 0;
            let totalPrinciple = 0;
            let totalInterest = 0;

            const transactions = await transactionService.getTransactionsByRange(bankId, fromDate, toDate);

            transactions.forEach(function (data) {
                if (data.glCode !== '23105') return;
                if (req.body.agent !== 'all' && data.referrer !== req.body.agent) return;

                const referrer = data.referrer;
                if (!referrer) return;

                if (!transObj[referrer]) {
                    transObj[referrer] = {
                        agent: referrer,
                        debit: 0,
                        credit: 0,
                        principle: 0,
                        interest: 0,
                    };
                }

                const existingTrans = transObj[referrer];
                const amount = parseFloat(data.amount) || 0;
                const principle = parseFloat(data.principle) || 0;
                const interest = parseFloat(data.interest) || 0;

                if (data.type === 'credit') {
                    existingTrans.credit += principle + interest;
                    existingTrans.principle += principle;
                    existingTrans.interest += interest;

                    totalCredit += principle + interest;
                    totalPrinciple += principle;
                    totalInterest += interest;
                } else if (data.type === 'debit') {
                    existingTrans.debit += amount;
                    totalDebit += amount;
                }
            });

            for (const trans of Object.values(transObj)) {
                const cifInfo = await db.collection(bankId).doc('kyc').collection('advisor-kyc').doc(trans.agent).get();
                if (cifInfo.exists) {
                    agentTransactions.push({
                        ...trans,
                        name: cifInfo.data().name,
                        membershipNumber: cifInfo.id,
                    });
                }
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
            res.send({ error: "Failed to fetch loan-cp-ewi report. try again..." })

        }
    });
}