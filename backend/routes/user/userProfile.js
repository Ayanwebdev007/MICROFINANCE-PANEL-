const { getFirestore} = require('firebase-admin/firestore');
const {getAuth} = require("firebase-admin/auth");
const db = getFirestore();

module.exports = app => {
    app.post('/api/user/user-profile', async (req, res) => {
        const token = req.user;
        if (!token) return res.status(401).send({error: 'You are not authorized. Please log in.'});
        const userBankInfoRef = db.collection(token.bankId).doc('admin').collection('bank-info').doc('details');
        const userBankInfoSnap = await userBankInfoRef.get();
        const userBankInfo = userBankInfoSnap.data() || {};
        const userDetails = await getAuth().getUser(token.uid);
        const userProfile = {
            name: userBankInfo.displayName,
            address: userBankInfo.address,
            email: userDetails.email,
            pan: userBankInfo.pan,
            phone: userBankInfo.phone,
            registrationCode: userBankInfo.registrationCode,
            photoURL: userBankInfo.logo,
            role: userDetails.customClaims.role,
            createdAt: userDetails.metadata.creationTime,
        }
        console.log(userProfile);
        res.send({success: true, data: userProfile});
    })
}