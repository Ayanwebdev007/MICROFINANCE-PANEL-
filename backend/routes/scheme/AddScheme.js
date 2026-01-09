const { getFirestore} = require('firebase-admin/firestore');
const db = getFirestore();


module.exports=app=>{


    app.post('/api/scheme/add-savings-scheme', async function (req, res) {
        const token = req.user;
        if (!token) return res.status(401).send({error: 'You are not authorized. Please log in.'});

        try {
            const data = req.body;
            const schemeId = data.schemeCode;


            await db.runTransaction(async (t) => {
                const schemeRef = db
                    .collection(token.bankId)
                    .doc('admin')
                    .collection('saving-schemes')
                    .doc(schemeId);

                t.set(schemeRef, {
                    ...data,
                    updatedAt: new Date(),
                }, { merge: true });
            });

            res.status(200).send({ success: 'Scheme updated successfully' });
        } catch (e) {
            console.log('Scheme saving failed:', e);
            res.status(500).send({ error: 'Failed to save scheme. Try again...' });
        }
    });
}