const { getFirestore } = require('firebase-admin/firestore');
const db = getFirestore();
const transactionService = require('../../../services/transactionService');

module.exports = app => {
    app.get('/api/reports/general/day-book-v2/:date', async function (req, res) {
        const transactionDate = req.params.date;
        const token = req.user;
        if (!token) return res.status(401).send({ error: 'You are not authorized. Please log in.' });

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

            // Fetch for a single day using the range utility
            const transactions = await transactionService.getTransactionsByRange(token.bankId, transactionDate, transactionDate);

            transactions.forEach(function (data) {
                const amount = parseFloat(data.amount) || 0;
                const glCode = data.glCode;
                const glHead = data.glHead;
                const method = data.method;

                if (data.type === 'credit') {
                    totalSumObj.creditAmount += amount;
                    if (!transObj[glCode]) {
                        transObj[glCode] = {
                            glCode, glHead,
                            debitAmount: 0, cashDebitAmount: 0, transferDebitAmount: 0,
                            creditAmount: 0, cashCreditAmount: 0, transferCreditAmount: 0,
                            transactions: []
                        };
                    }

                    transObj[glCode].creditAmount += amount;
                    transObj[glCode].transactions.push({ details: data, id: data.id });

                    if (method === 'cash') {
                        transObj[glCode].cashCreditAmount += amount;
                        totalSumObj.cashCreditAmount += amount;
                    } else {
                        transObj[glCode].transferCreditAmount += amount;
                        totalSumObj.transferCreditAmount += amount;
                    }
                } else {
                    totalSumObj.debitAmount += amount;
                    if (!transObj[glCode]) {
                        transObj[glCode] = {
                            glCode, glHead,
                            debitAmount: 0, cashDebitAmount: 0, transferDebitAmount: 0,
                            creditAmount: 0, cashCreditAmount: 0, transferCreditAmount: 0,
                            transactions: []
                        };
                    }

                    transObj[glCode].debitAmount += amount;
                    transObj[glCode].transactions.push({ details: data, id: data.id });

                    if (method === 'cash') {
                        transObj[glCode].cashDebitAmount += amount;
                        totalSumObj.cashDebitAmount += amount;
                    } else {
                        transObj[glCode].transferDebitAmount += amount;
                        totalSumObj.transferDebitAmount += amount;
                    }
                }
            });
            res.send({ success: Object.values(transObj), totalSum: totalSumObj });
        } catch (error) {
            console.log(error)
            res.send({ error: "something went wrong" })
        }
    });
}