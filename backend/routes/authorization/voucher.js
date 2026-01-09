const { getFirestore } = require('firebase-admin/firestore');
const db = getFirestore();
const transactionService = require('../../services/transactionService');

module.exports = app => {
    app.get('/api/authorise/voucher/:transaction', async function (req, res) {
        const token = req.user; // Get user from the middleware
        if (!token) return res.status(401).send({ error: 'You are not authorized. Please log in.' });
        const voucherId = req.params.transaction;

        try {
            await db.runTransaction(async (t) => {
                const transactions = [];
                const transactionColRef = db.collection(token.bankId).doc('pi').collection('voucher');
                const snapshot = await t.get(transactionColRef);
                snapshot.forEach(doc => {
                    transactions.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });

                const piRef = await db.collection(token.bankId).doc('pi').collection('voucher').doc(voucherId.toString());
                const getPI = await t.get(piRef);
                if (!getPI.exists) {
                    return res.send({ warning: 'Transaction not found. Maybe already authorized', transactions });
                }
                const piInfo = getPI.data();

                const serverDate = piInfo.transDate || new Date().toISOString().slice(0, 10);

                // Get Existing total Balance with other bank
                const bankBalanceRef = await db.collection(token.bankId).doc('balance');
                const bankBalanceInfo = await t.get(bankBalanceRef);

                const transObj = {
                    amount: piInfo.amount,
                    balance: 0,
                    glCode: piInfo.glCode,
                    glHead: piInfo.glHead,
                    entryDate: serverDate,
                    narration: piInfo.narration,
                    type: piInfo.type,
                    method: piInfo.method,
                    author: piInfo.author,
                    approvedBy: token.email,
                    createdAt: new Date().toISOString(),
                };

                // Use TransactionService for dual-recording
                await transactionService.recordTransaction(token.bankId, {
                    ...transObj,
                    id: voucherId.toString()
                }, serverDate, t);

                // Update total Balance with other bank
                if (piInfo.bankBalance) {
                    t.set(bankBalanceRef, {
                        balance: (bankBalanceInfo.data()?.balance || 0) + (piInfo.type === 'credit' ? 1 : -1) * (parseInt(piInfo.amount) || 0)
                    });
                }

                t.delete(piRef);

                return res.send({
                    success: `Transaction ${voucherId} is authorized successfully`,
                    autoAuthorize: [],
                    transactions: transactions.filter(t => t.id !== voucherId),
                });
            });
        } catch (e) {
            console.log(e);
            res.send({ error: 'There is something wrong. Try again...' });
        }
    });
};