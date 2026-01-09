const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require("firebase-admin/auth");
const db = getFirestore();

module.exports = app => {
    app.post('/api/admin/create-new-branch-user', async function (req, res) {
        const token = req.user; // Get user from the middleware

        if (!token) return res.status(401).send({ error: 'You are not authorized. Please log in.' });
        if (token.role !== 'root' && token.role !== 'admin') return res.send({ error: 'You do not have permission.' });
        if (req.body.bankId === '') return res.send({ error: 'Please select a bank first' });

        try {
            await db.runTransaction(async (t) => {
                const bankId = req.body.bankId;
                const password = generateRandomString(12);

                const userRecord = await getAuth().createUser({
                    email: req.body.email,
                    password: password,
                    displayName: req.body.name,
                    disabled: false,
                    emailVerified: true,
                });

                await getAuth().setCustomUserClaims(userRecord.uid, {
                    bankId: bankId,
                    role: 'user',
                });

                const userAdminRef = db.collection('admin').doc('organization').collection('bank-users').doc(userRecord.uid);
                await t.set(userAdminRef, {
                    bankId: bankId,
                    name: req.body.name,
                    email: req.body.email,
                });

                const bankRef = db.collection(bankId).doc('admin').collection('users').doc(userRecord.uid);
                await t.set(bankRef, {
                    name: req.body.name,
                    email: req.body.email,
                    phone: req.body.phone,
                    address: req.body.address,
                    profilePic: req.body.profilePic,
                    permissions: req.body.module,
                    accessLevel: {},
                    role: 'user',
                    uid: userRecord.uid,
                    twoFAEnabled: req.body.twoFAEnabled || false,
                });

                res.send({ success: `Successfully create new user with email: ${req.body.email} and password: ${password}` });
            });
        } catch (err) {
            res.send({ error: 'Failed to create new Bank. Try again...' });
        }
    });
}

function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz^#@&$0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters.charAt(randomIndex);
    }
    return result;
}