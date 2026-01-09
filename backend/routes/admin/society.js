const {getFirestore} = require('firebase-admin/firestore');
const db = getFirestore();

const society = app => {
    app.get('/api/admin/get-ho-list', async function (req, res) {
        const token = req.user;
        const bankList = [];

        if (!token) return res.status(401).send({error: 'You are not authorized. Please log in.'});
        if (token.role !== 'root') return res.status(403).send({error: 'You do not have permission.'});

        try {
            const bankColRef = db.collection('admin').doc('organization').collection('banks').where('isHO', '==', true);
            const snapshot = await bankColRef.get();
            snapshot.forEach(doc => {
                bankList.push({
                    key: doc.id,
                    label: doc.data().bankName,
                    isMainBranch: !doc.data().mainBranchId,
                    isHO: doc.data().isHO,
                });
            });
            const bankDropdown = [];
            for (const bank of bankList) {
                const bankRef = db.collection(bank.key).doc('admin').collection('bank-info').doc('details');
                const bankInfo = await bankRef.get();
                bankDropdown.push({
                    key: bank.key,
                    label: bank.label,
                    isMainBranch: bank.isMainBranch,
                    data: bankInfo.data(),
                    isHO: bank.isHO,
                });
            }
            res.send({success: 'Successfully fetched registered banks', data: bankDropdown});
        } catch (error) {
            console.log("Fetch Registered Banks Error:", error);
            res.send({error: 'Failed to fetch banks. Try again...'});
        }
    });

    app.post('/api/admin/get-ho-branches', async function (req, res) {
        const token = req.user;
        const bankList = [];
        const bankDropdown = [];

        if (!token) return res.status(401).send({error: 'You are not authorized. Please log in.'});
        if (token.role !== 'root') return res.status(403).send({error: 'You do not have permission.'});

        try {
            const bankColRef = db.collection('admin').doc('organization').collection('banks').where('HO_ID', '==', req.body.HO_ID).where('isHOBranch', '==', true);
            const snapshot = await bankColRef.get();
            snapshot.forEach(doc => {
                bankList.push({
                    key: doc.id,
                    label: doc.data().bankName,
                    isMainBranch: !doc.data().mainBranchId,
                    isHO: doc.data().isHO,
                });
            });
            for (const bank of bankList) {
                const bankRef = db.collection(bank.key).doc('admin').collection('bank-info').doc('details');
                const bankInfo = await bankRef.get();
                bankDropdown.push({
                    key: bank.key,
                    label: bank.label,
                    isMainBranch: bank.isMainBranch,
                    data: bankInfo.data(),
                    isHO: bank.isHO,
                });
            }
            if (bankDropdown.length === 0) {
                res.send({error: 'No Branch found for the selected HO. Please create a new branch for this HO.'});
            }else {
                res.send({success: 'Successfully fetched registered banks', data: bankDropdown});
            }
        } catch (error) {
            console.log("Fetch Registered Banks Error:", error);
            res.send({error: 'Failed to fetch banks. Try again...'});
        }
    });
};

module.exports = society;