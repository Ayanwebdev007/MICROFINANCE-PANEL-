const { getFirestore} = require('firebase-admin/firestore');
const db = getFirestore();

module.exports = app => {
    app.get('/admin-patch-helper/copy-master-data/gl-codes', async function (req, res){
        const bankId = '01_iTaxFinance__itNnpqyqNKLp3j';
        
        try {
            await db.runTransaction(async (t) => {
                const masterGlRef = db.collection('admin').doc('master-data').collection('gl_code').doc('value');
                const masterGlInfo = await t.get(masterGlRef);
                const bankGlRef = db.collection(bankId).doc('admin').collection('gl_code').doc('value');
                await t.set(bankGlRef, masterGlInfo.data());
                
                return res.send('Successfully copied GL Codes.');
            });
        } catch (e) {
            console.log('Transaction failure:', e);
            return res.send({error: 'Failed to create account. Try again...'});
        }
    });
}