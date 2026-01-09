const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require("firebase-admin/auth");
const db = getFirestore();
const { generateKeywords } = require('../../utils/searchUtils');
const { generateRandomString } = require('../../utils/stringUtils');

module.exports = app => {
    app.post('/api/admin/create-new-user', async function (req, res) {
        const token = req.user; // Get user from the middleware

        if (!token) return res.status(401).send({ error: 'You are not authorized. Please log in.' });
        if (token.role !== 'root') return res.status(403).send({ error: 'You do not have permission.' });
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
                    role: 'admin',
                });

                const userAdminRef = db.collection('admin').doc('organization').collection('bank-users').doc(userRecord.uid);
                await t.set(userAdminRef, {
                    bankId: bankId,
                    name: req.body.name,
                    email: req.body.email,
                });

                const bankRef = db.collection(bankId).doc('admin').collection('users').doc(userRecord.uid);
                const searchKeywords = generateKeywords(`${userRecord.uid} ${req.body.name} ${req.body.phone} ${req.body.email}`);

                await t.set(bankRef, {
                    name: req.body.name,
                    email: req.body.email,
                    phone: req.body.phone,
                    address: req.body.address,
                    profilePic: req.body.profilePic,
                    permissions: req.body.module,
                    accessLevel: {},
                    role: 'admin',
                    uid: userRecord.uid,
                    twoFAEnabled: req.body.twoFAEnabled || false,
                    searchKeywords,
                });

                res.send({ success: `Successfully create new user with email: ${req.body.email} and password: ${password}` });
            });
        } catch (err) {
            res.send({ error: 'Failed to create new Bank. Try again...' });
        }
    });

    app.post('/api/admin/update-user-permission', async function (req, res) {
        const token = req.user; // Get user from the middleware

        if (!token || (token.role !== 'root' && token.role !== 'admin')) {
            return res.send({ error: 'You are not authorized. Please log in.' });
        }
        if (req.body.bankId === '') return res.send({ error: 'Please select a bank first' });

        try {
            await db.runTransaction(async (t) => {
                const bankId = req.body.bankId;
                // Check if user have admin access
                await getAuth().getUser(req.body.userId).then(function (userRecord) {
                    if ((userRecord.customClaims?.role !== 'admin' && userRecord.customClaims?.role !== 'root') && req.body.module.tools === true) {
                        throw new Error('You can not assign Tools access to non-admin user');
                    }
                });

                const bankRef = db.collection(bankId).doc('admin').collection('users').doc(req.body.userId);
                const searchKeywords = generateKeywords(`${req.body.userId} ${req.body.name} ${req.body.phone}`);

                await t.update(bankRef, {
                    profilePic: req.body.profilePic,
                    permissions: req.body.module,
                    accessLevel: req.body.accessLevel || {},
                    name: req.body.name,
                    phone: req.body.phone,
                    address: req.body.address,
                    twoFAEnabled: req.body.twoFAEnabled || false,
                    searchKeywords,
                });

                res.send({ success: `Successfully updated user details & permissions` });
            });
        } catch (err) {
            console.log(err);
            res.send({ error: 'Failed to Update. Error: ' + err.message });
        }
    });

    app.post('/api/admin/delete-bank-user', async function (req, res) {
        const token = req.user; // Get user from the middleware

        if (!token || (token.role !== 'root' && token.role !== 'admin')) {
            return res.send({ error: 'You are not authorized. Please log in.' });
        }
        if (req.body.bankId === '') return res.send({ error: 'Please select a bank first' });

        try {
            await db.runTransaction(async (t) => {
                const bankId = req.body.bankId;

                await getAuth().deleteUser(req.body.userId);

                const bankUserRef = db.collection(bankId).doc('admin').collection('users').doc(req.body.userId);
                await t.delete(bankUserRef);

                res.send({ success: `Successfully deleted the user` });
            });
        } catch (err) {
            console.log(err);
            res.send({ error: 'Failed to Update. Error: ' + err.message });
        }
    });

    app.post('/api/admin/get-users-by-bank', async function (req, res) {
        const token = req.user;
        const bankId = req.body.bankId;
        const { limit = 50, lastVisible, search } = req.body;

        if (!token || (token.role !== 'root' && token.role !== 'admin')) {
            return res.send({ error: 'You are not authorized. Please log in.' });
        }

        if (bankId === '') return res.send({ error: 'Please select a bank first' });
        try {
            let userQuery = db.collection(bankId).doc('admin').collection('users').orderBy('name');

            if (search) {
                const searchTokens = search.toLowerCase().split(' ').filter(t => t.length > 0);
                if (searchTokens.length > 0) {
                    userQuery = userQuery.where('searchKeywords', 'array-contains', searchTokens[0]);
                }
            }

            if (lastVisible) {
                const lastDoc = await db.collection(bankId).doc('admin').collection('users').doc(lastVisible).get();
                if (lastDoc.exists) {
                    userQuery = userQuery.startAfter(lastDoc);
                }
            }

            const snapshot = await userQuery.limit(parseInt(limit)).get();

            const applicableUsers = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    key: doc.id,
                    label: data.name,
                    data: {
                        id: doc.id,
                        ...data,
                    },
                };
            });

            const nextLastVisible = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1].id : null;

            res.send({
                success: `Successfully fetched bank users`,
                data: applicableUsers,
                lastVisible: nextLastVisible
            });
        } catch (error) {
            console.error('Error fetching users by bank:', error);
            return res.send({ error: 'Failed to fetch users. Try again...' });
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