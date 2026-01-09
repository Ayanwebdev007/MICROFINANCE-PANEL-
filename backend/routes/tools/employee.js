const { getFirestore } = require('firebase-admin/firestore');
const db = getFirestore();

module.exports = app => {
    app.post('/api/tools/bulk-update-employee-mapping', async function (req, res){
        const token = req.user; // Get user from the middleware

        if (!token) return res.status(401).send({ error: 'You are not authorized. Please log in.' });

        if (token.role !== 'root' && token.role !== 'admin') {
            return res.status(403).send({ error: 'You do not have permission.' });
        }

        const selectedEmployee = req.body.userId;
        const memberId = req.body.memberId;
        const bankId = req.body.bankId;

        const accountTypesSnap = await db.collection(bankId).doc('accounts').listCollections();
        const accountTypes = accountTypesSnap.map(coll => coll.id);

        try {
            await db.runTransaction(async (t) => {
                const associatedAccounts = [];

                // Get Associated Accounts
                for (let j = 0; j < accountTypes.length; j++) {
                    const accountColRef = db.collection(bankId).doc('accounts').collection(accountTypes[j]).where('applicants', 'array-contains', memberId);
                    const accountCol = await t.get(accountColRef);
                    accountCol.forEach(function (account){
                        if (account.data().closed === false){
                            associatedAccounts.push({
                                id: account.id,
                                type: accountTypes[j]
                            });
                        }
                    });
                }


                // Update CP Mapping in KYC
                const kycRef = db.collection(bankId).doc('kyc').collection('member-kyc').doc(memberId);
                t.update(kycRef, {associatedEmployee: selectedEmployee});

                // Update CP Mapping in associated Accounts
                for (let j = 0; j < associatedAccounts.length; j++) {
                    const accountRef = db.collection(bankId).doc('accounts').collection(associatedAccounts[j].type).doc(associatedAccounts[j].id);
                    t.update(accountRef, {associatedEmployee: selectedEmployee});
                }
            });
            res.send({success: 'Successfully transferred to selected Employee'});
        } catch (e) {
            console.log('Transaction failure:', e);
            return res.send({error: 'Failed to Update for KYC. Try again...'});
        }
    });

    app.get('/api/admin/users', async function (req, res) {
        const token = req.user;
        if (!token) return res.status(401).send({error: 'You are not authorized. Please log in.'});

        try {
            // Fetch all user documents from the 'users' collection under 'admin'
            const usersSnapshot = await db.collection(token.bankId).doc('admin').collection('users').get();

            const users = [];
            usersSnapshot.forEach(doc => {
                users.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            res.send({success: 'Successfully fetched all users', users});
        } catch (e) {
            console.log('Error fetching users:', e);
            return res.status(500).send({error: 'Failed to fetch users. Try again...'});
        }
    });

}