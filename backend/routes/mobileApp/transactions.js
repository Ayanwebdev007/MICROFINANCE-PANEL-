const { getFirestore} = require('firebase-admin/firestore');
const db = getFirestore();

// get all mobile app transactions
module.exports = app => {
    app.post('/api/admin/get-mobile-transactions', async (req, res) => {
        const token = req.user;

        // Auth checks
        if (!token) return res.status(401).send({ error: 'You are not authorized. Please log in.' });

        const { transactionType } = req.body;

        // Validate input
        if (!transactionType) {
            return res.status(400).send({ error: 'bankId and transactionType are required.' });
        }

        try {
            const transactions = []
            const transactionColRef = await db.collection(token.bankId).doc('app-transaction').collection(transactionType).get();
            transactionColRef.forEach(doc => {
                transactions.push({
                    key: doc.id,
                    label: doc.data().name,
                    data: {
                        id: doc.id,
                        ...doc.data()
                    }
                })
            })
            res.send({ success: 'Successfully fetched transactions', data: transactions})
        } catch (e) {
            console.error('Error fetching transactions:', e);
            res.status(500).send({ error: 'Failed to fetch transactions. Please try again.' });
        }
    })

    app.post("/api/admin/mobile-bulk-transaction", async (req, res) => {
        const token = req.user;
        const { transactions, transactionType, transDate, accountType } = req.body;

        if (!token) return res.status(401).json({ error: "Unauthorized" });

        if (!transactionType || !["deposit", "loan"].includes(transactionType)) {
            return res.status(400).json({ error: "Invalid transaction type" });
        }
        if (!transactions || transactions.length === 0) {
            return res.status(400).json({ error: "No transactions provided" });
        }

        // const allSameType = transactions.every(txn => txn.type === 'savings');
        // if (!allSameType) {
        //     return res.status(400).json({ error: `All transactions must be of type "${transactionType}"` });
        // }

        let transactionId;
        const collectionName = transactionType === "deposit" ? "bulk-renewal" : "loan-bulk-repayment";

        try {
            await db.runTransaction(async (t) => {
                const date = transDate || new Date().toISOString().slice(0, 10);
                let glCode = '23105';
                let glHead = 'SHORT TERM GROUP LOAN - CURRENT';
                let interestGlCode = '52105';
                let interestGlHead = 'INTEREST ON SHORT TERM GROUP LOAN-CURRENT';

                if (req.body.accountType === 'loan') {
                    glCode = '23315';
                    glHead = 'SHORT TERM PERSONAL LOAN - CURRENT';
                    interestGlCode = '52315';
                    interestGlHead = 'INTEREST ON SHORT TERM PERSONAL LOAN-CURRENT';
                }
                const iteratorRef = db.collection(token.bankId).doc("admin").collection("transIterator").doc(date);
                const iteratorSnapshot = await t.get(iteratorRef);

                if (iteratorSnapshot.exists) {
                    transactionId = iteratorSnapshot.data().iterator + 1;
                } else {
                    transactionId = generateTransactionId() + 1;
                }

                t.set(iteratorRef, { iterator: transactionId });

                const totalAmount = transactions.reduce((sum, trans) => {
                    const amt = parseFloat(trans.amount) || 0;
                    return sum + amt;
                }, 0);

                const groupedTransaction = {
                    accountType: accountType,
                    agent: transactions[0].agent || "",
                    agentId: transactions[0].agent || "",
                    agentName: transactions[0].agentName || "",
                    amountValidated: true,
                    author: token.email,
                    date,
                    totalAmount,
                    denomination: {},
                    method: "cash",
                    trans: transactions,
                    glCode,
                    glHead,
                    interestGlCode,
                    interestGlHead,
                    createdAt: new Date().toISOString(),
                    createdBy: token.email,
                };

                const docRef = db.collection(token.bankId).doc("pi").collection(collectionName).doc(transactionId.toString());
                t.set(docRef, groupedTransaction);

                // Remove processed transactions from temp store
                for (const trans of transactions) {
                    const transRef = db.collection(token.bankId).doc("app-transaction").collection(transactionType).doc(trans.id);
                    t.delete(transRef);
                }
            });

            return res.json({
                success: true,
                message: `Bulk ${transactionType} transaction saved in ${collectionName}. Transaction ID: ${transactionId}`
            });

        } catch (error) {
            console.error("Transaction Error:", error);
            return res.status(500).json({ error: "Failed to save bulk transaction." });
        }
    });

};


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