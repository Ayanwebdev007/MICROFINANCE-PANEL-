const { getFirestore } = require('firebase-admin/firestore');
const db = getFirestore();

module.exports = app => {
    app.post('/api/transaction/cash/general-voucher', async function (req, res) {
        const token = req.user; // Get user from the middleware
        if (!token) return res.status(401).send({ error: 'You are not authorized. Please log in.' });

        let transactionNumber;
        const systemDate = new Date().toISOString().slice(0, 10);

        try {
            await db.runTransaction(async (t) => {
                const iteratorRef = db.collection(token.bankId).doc('admin').collection('transIterator').doc(systemDate);
                const iteratorInfo = await t.get(iteratorRef);

                if (iteratorInfo.exists) {
                    transactionNumber = parseInt(iteratorInfo.data().value) + 1;
                } else {
                    transactionNumber = generateTransactionId() + 1;
                }
                const piRef = db.collection(token.bankId).doc('pi').collection('voucher').doc(transactionNumber.toString());
                t.set(iteratorRef, { value: transactionNumber });
                const paymentInstruction = {
                    ...req.body,
                    transactionId: transactionNumber.toString(),
                    accountNumber: '',
                    transactionType: 'voucher',
                    transactionDate: systemDate,
                    name: '',
                    amount: parseFloat(req.body.amount),
                    glCode: req.body.glCode,
                    glHead: req.body.glHead,
                    narration: req.body.narration || 'General Voucher - Cash Transaction',
                    method: 'cash',
                    type: req.body.type,
                    author: token.email,
                };
                t.set(piRef, paymentInstruction);

                res.send({
                    success: `Successfully create Payment Instruction. Please authorize transaction ${transactionNumber}`,
                    // denomination: updatedMyDenomination,
                });
            });
        } catch (e) {
            console.log(e);
            res.send({ error: 'there is something wrong. Try again...' });
        }
    });

    app.post('/api/transaction/journal', async function (req, res) {
        const token = req.user; // Provided by inactivityCheck middleware

        if (!token) {
            return res.status(401).send({ error: 'You are not authorized. Please log in.' });
        }

        const today = new Date().toISOString().slice(0, 10);

        try {
            const iteratorRef = db
                .collection(token.bankId)
                .doc('admin')
                .collection('transIterator')
                .doc(today);

            const transactionNumber = await db.runTransaction(async (transaction) => {
                const doc = await transaction.get(iteratorRef);
                let newTransactionId;

                if (doc.exists) {
                    newTransactionId = doc.data().iterator + 1;
                } else {
                    newTransactionId = generateTransactionId() + 1; // Your custom ID generator
                }

                const piRef = db
                    .collection(token.bankId)
                    .doc('pi')
                    .collection('journal')
                    .doc(newTransactionId.toString());

                transaction.set(iteratorRef, { iterator: newTransactionId });
                transaction.set(piRef, {
                    ...req.body,
                    author: token.email,
                    createdAt: new Date(),
                });

                return newTransactionId;
            });

            return res.send({
                success: `Payment Instruction created successfully with id: ${transactionNumber}`,
            });
        } catch (error) {
            console.error('Error creating journal transaction:', error);
            return res.send({ error: 'There is something wrong. Try again.' });
        }
    });

}

const generateTransactionId = () => {
    let now = new Date();
    let month = (now.getMonth() + 1);
    let day = now.getDate();
    if (month < 10)
        month = "0" + month;
    if (day < 10)
        day = "0" + day;
    return parseInt(now.getFullYear().toString() + month.toString() + day.toString() + '000');
}