const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require("firebase-admin/auth");
const db = getFirestore();
const { generateRandomString } = require('../../utils/stringUtils');

module.exports = app => {
    app.post('/api/admin/create-new-branch-user', async function (req, res) {
        const token = req.user;

        if (!token) return res.status(401).send({ error: 'You are not authorized. Please log in.' });
        if (token.role !== 'root' && token.role !== 'admin') return res.send({ error: 'You do not have permission.' });
        if (!req.body.bankId) return res.send({ error: 'Please select a bank first' });

        try {
            await db.runTransaction(async (t) => {
                const bankId = req.body.bankId;
                const password = generateRandomString(12, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz^#@&$0123456789');

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
                t.set(userAdminRef, {
                    bankId: bankId,
                    name: req.body.name,
                    email: req.body.email,
                });

                const bankRef = db.collection(bankId).doc('admin').collection('users').doc(userRecord.uid);
                const { generateKeywords } = require('../../utils/searchUtils');
                const searchKeywords = generateKeywords(`${userRecord.uid} ${req.body.name} ${req.body.phone} ${req.body.email}`);

                t.set(bankRef, {
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
                    searchKeywords,
                });

                res.send({ success: `Successfully created new user with email: ${req.body.email} and password: ${password}` });
            });
        } catch (err) {
            console.error('Create Branch User Error:', err);
            res.send({ error: 'Failed to create new user. Try again...' });
        }
    });
};