const { getFirestore } = require('firebase-admin/firestore');
const db = getFirestore();
const institutionService = require('../../services/institutionService');

module.exports = app => {
    app.get('/api/admin/get-ho-list', async function (req, res) {
        const token = req.user;
        if (!token) return res.status(401).send({ error: 'You are not authorized. Please log in.' });
        if (token.role !== 'root') return res.status(403).send({ error: 'You do not have permission.' });

        try {
            const snapshot = await db.collection('admin').doc('organization').collection('banks')
                .where('isHO', '==', true)
                .get();

            const bankIds = snapshot.docs.map(doc => doc.id);
            const details = await institutionService.getInstitutionDetails(bankIds);

            const results = details.map(detail => ({
                key: detail.bankId,
                label: snapshot.docs.find(d => d.id === detail.bankId).data().bankName,
                isMainBranch: !snapshot.docs.find(d => d.id === detail.bankId).data().mainBranchId,
                data: detail,
                isHO: true,
            }));

            res.send({ success: 'Successfully fetched HO list', data: results });
        } catch (error) {
            console.error("Fetch HO List Error:", error);
            res.send({ error: 'Failed to fetch HO list.' });
        }
    });

    app.post('/api/admin/get-ho-branches', async function (req, res) {
        const token = req.user;
        if (!token) return res.status(401).send({ error: 'You are not authorized.' });
        if (token.role !== 'root') return res.status(403).send({ error: 'You do not have permission.' });

        try {
            const snapshot = await db.collection('admin').doc('organization').collection('banks')
                .where('HO_ID', '==', req.body.HO_ID)
                .where('isHOBranch', '==', true)
                .get();

            const bankIds = snapshot.docs.map(doc => doc.id);
            if (bankIds.length === 0) {
                return res.send({ error: 'No Branch found for the selected HO.' });
            }

            const details = await institutionService.getInstitutionDetails(bankIds);
            const results = details.map(detail => ({
                key: detail.bankId,
                label: snapshot.docs.find(d => d.id === detail.bankId).data().bankName,
                data: detail,
                isHO: false,
            }));

            res.send({ success: 'Successfully fetched HO branches', data: results });
        } catch (error) {
            console.error("Fetch HO Branches Error:", error);
            res.send({ error: 'Failed to fetch HO branches.' });
        }
    });
};