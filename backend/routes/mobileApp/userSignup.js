const { getFirestore} = require('firebase-admin/firestore');
const db = getFirestore();

module.exports = app => {
    app.post('/api/admin/create-new-mobile-app-user', async (req, res) => {
        const token = req.user;

        // Auth checks
        if (!token) return res.status(401).send({ error: 'You are not authorized. Please log in.' });

        const { name, email, userId, phone, address, profilePic, bankId } = req.body;

        // Input validation
        if (!name || !userId) {
            return res.send({ error: 'Missing required fields: name, email' });
        }


        try {

            const userRef = db.collection(bankId).doc('admin').collection('users').doc(userId);
            const userSnap = await userRef.get();
            if (userSnap.exists) {
                const userData = userSnap.data();
                if (userData?.agentAppPermission === true) {
                    return res.send({
                        success: false,
                        message: 'This user have already app permission'
                    })
                }
            }
            await userRef.update({
                agentAppPermission: true,
            })

            // Write to admin/organization/mobile-users
            const userAdminRef = db.collection('admin').doc('organization').collection('mobile-users').doc(userId);
            await userAdminRef.set({
                bankId,
                name,
                email,
                phone,
                createdAt: Date.now(),
                createdBy: token.uid,
                date: new Date().toISOString().split('T')[0]
            });

            // Write to bank-specific collection
            const bankRef = db.collection(bankId).doc('admin').collection('mobile-users').doc(userId);
            await bankRef.set({
                name,
                email,
                phone,
                address,
                profilePic,
                permissions: {},
                uid: userId,
                createdAt: Date.now(),
                createdBy: token.uid,
                date: new Date().toISOString().split('T')[0]
            });

            res.send({
                success: `Successfully updated access for user with email: ${email} please login with existing password`,
                existingUser: userSnap.data().agentAppPermission,
                credentials: {
                    email,
                    password: 'EXISTING_PASSWORD'
                }
            });
        } catch (err) {
            console.error('Error creating user:', err);
            res.send({ error: 'Failed to create new mobile app user. Please try again.' });
        }
    });
};
