const { getFirestore} = require('firebase-admin/firestore');
const db = getFirestore();

module.exports = app => {
    app.post('/api/payment-instructions/get-transactions', async function (req, res){
        const token = req.user; // Get user from the middleware
        if (!token) return res.status(401).send({error: 'You are not authorized. Please log in.'});

        const transactions = [];
        try {
            const transactionRef = db.collection(token.bankId).doc('pi').collection(req.body.parameter);
            const snapshot = await transactionRef.get();
            snapshot.forEach(doc => {
                transactions.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            if (transactions.length === 0) return res.send({error: 'All Transactions are already authorized'});
            return res.send({success: 'Successfully fetched transaction details', data: transactions});
        } catch (e) {
            res.send({error: 'Failed to fetch transactions'});
            console.log('Transaction fetch failure:', e);
        }
        
    });

    app.get('/api/authorise-reject/:type/:transaction', async function (req, res){
        const token = req.user; // Get user from the middleware
        if (!token) return res.status(401).send({error: 'You are not authorized. Please log in.'});
        
        const type = req.params.type;
        const transactionNumber = req.params.transaction;

        const systemDate = new Date().toISOString().slice(0, 10);

        try {
            await db.runTransaction(async (t) => {
                const transactions = [];
                const transactionColRef = db.collection(token.bankId).doc('pi').collection(type);
                const snapshot = await t.get(transactionColRef);
                snapshot.forEach(doc => {
                    transactions.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                const transactionRef = db.collection(token.bankId).doc('pi').collection(type).doc(transactionNumber.toString());
                const transaction = await t.get(transactionRef);
                const transactionInfo = transaction.data();
                console.log(transactionNumber);

                if (!transaction.exists) {
                    return res.send({warning: 'Transaction not found. Maybe already authorized', transactions});
                }

                const rejectRef = db.collection(token.bankId).doc('rejected-pi').collection(`${systemDate}-${type}`).doc(transactionNumber.toString());
                t.set(rejectRef, {
                    ...transactionInfo,
                    type: type,
                    createdAt: new Date(),
                    createdBy: token.email,
                });
                t.delete(transactionRef);

                res.send({success: `Rejected with Transaction Id: ${transactionNumber},`, transactions});
            });
        } catch (e) {
            console.log(e)
            res.send({error: 'there is something wrong. Try again...'});
        }
    });
}