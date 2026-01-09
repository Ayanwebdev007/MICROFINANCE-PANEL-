const { getFirestore } = require('firebase-admin/firestore');
const db = getFirestore();
const institutionService = require('../../services/institutionService');
const { generateRandomString } = require('../../utils/stringUtils');

module.exports = app => {
    app.post('/api/admin/create-new-branch', async function (req, res) {
        const token = req.user;

        if (!token) return res.send({ error: 'You are not authorized. Please log in.' });
        if (token.role !== 'root' && token.role !== 'admin') return res.send({ error: 'You do not have permission.' });

        try {
            const mainBranchId = req.body.bankId;
            const mainBranchSnap = await db.collection('admin').doc('organization').collection('banks').doc(mainBranchId).get();

            if (!mainBranchSnap.exists) return res.send({ error: 'Main branch not found' });

            const mainBranchData = mainBranchSnap.data();

            await db.runTransaction(async (t) => {
                let dateTimeString = new Date().toISOString().slice(0, 16).replaceAll('-', '').replace(':', '');
                const bankId = `GS3_${dateTimeString}_${generateRandomString(13)}`;

                const searchKeywords = await institutionService.generateInstitutionalKeywords(req.body, { mainBranchId });

                const bankAdminRef = db.collection('admin').doc('organization').collection('banks').doc(bankId);
                t.set(bankAdminRef, {
                    bankId: bankId,
                    mainBranchId: mainBranchId,
                    bankName: `${req.body.bankName} branch of ${mainBranchData.bankName}`,
                    displayName: `${req.body.displayName} branch of ${mainBranchData.displayName}`,
                    createdAt: new Date(),
                    branchCode: req.body.branchCode,
                    createdBy: token.email,
                    searchKeywords,
                });

                const bankRef = db.collection(bankId).doc('admin').collection('bank-info').doc('details');
                t.set(bankRef, {
                    ...req.body,
                    mainBranchId: mainBranchId,
                    createdAt: new Date(),
                    createdBy: token.email,
                    isMainBranch: false,
                    searchKeywords,
                });

                // Initialize branch data from master templates
                const masterGlRef = db.collection('admin').doc('master-data').collection('gl_code').doc('value');
                const masterGlInfo = await t.get(masterGlRef);
                const bankGlRef = db.collection(bankId).doc('admin').collection('gl_code').doc('value');
                t.set(bankGlRef, masterGlInfo.data());

                const mainBranchIteratorRef = db.collection(mainBranchId).doc('admin').collection('iterator').doc('default');
                const mainBranchIteratorInfo = await t.get(mainBranchIteratorRef);
                const iteratorData = mainBranchIteratorInfo.data() || {};

                const collections = ['savings', 'deposit', 'loan', 'group-loan', 'advisor', 'employee', 'group', 'kyc'];
                collections.forEach(col => {
                    const ref = db.collection(bankId).doc('admin').collection('iterator').doc(col);
                    const prefix = (iteratorData[col]?.prefix || '') + req.body.branchCode + (col === 'advisor' ? '' : '00');
                    t.set(ref, {
                        value: iteratorData[col]?.incrementalValue || 1,
                        prefix: prefix
                    });
                });

                const groupRef = db.collection(bankId).doc('kyc').collection('group').doc('100000');
                t.set(groupRef, { name: 'NOT ASSIGNED' });

                res.send({ success: `Successfully created new Branch` });
            });
        } catch (err) {
            console.error('Create Branch Error:', err);
            res.send({ error: 'Failed to create new Branch. Err: ' + err.message });
        }
    });

    app.post('/api/admin/validate-branch-code', async function (req, res) {
        const token = req.user;
        if (!token) return res.send({ error: 'You are not authorized. Please log in.' });
        if (token.role !== 'root' && token.role !== 'admin') return res.send({ error: 'You do not have permission.' });

        try {
            const snapshot = await db.collection('admin').doc('organization').collection('banks')
                .where('mainBranchId', '==', req.body.mainBranchId)
                .where('branchCode', '==', req.body.branchCode)
                .limit(1)
                .get();

            if (!snapshot.empty) {
                return res.send({ error: 'Branch code already exists. Please choose another one.' });
            }
            return res.send({ success: 'Branch code is available' });
        } catch (err) {
            console.error('Validate Branch Code Error:', err);
            res.send({ error: 'Failed to validate branch code.' });
        }
    });

    app.post('/api/admin/update-existing-branch', async function (req, res) {
        const token = req.user;
        if (!token) return res.send({ error: 'You are not authorized. Please log in.' });
        if (token.role !== 'root' && token.role !== 'admin') return res.send({ error: 'You do not have permission.' });

        try {
            const bankId = req.body.bankId;
            const mainBranchId = req.body.mainBranchId || token.bankId;

            await institutionService.updateInstitution(bankId, {
                ...req.body,
                mainBranchId
            }, token);

            res.send({ success: `Successfully updated the branch` });
        } catch (err) {
            console.error('Update Branch Error:', err);
            res.send({ error: 'Failed to update branch.' });
        }
    });

    app.get('/api/admin/get-associated-branch', async function (req, res) {
        const token = req.user;
        if (!token) return res.send({ error: 'You are not authorized. Please log in.' });
        if (token.role !== 'root' && token.role !== 'admin') return res.send({ error: 'You do not have permission.' });

        try {
            const snapshot = await db.collection('admin').doc('organization').collection('banks')
                .where('mainBranchId', '==', token.bankId)
                .get();

            const bankIds = snapshot.docs.map(doc => doc.id);
            bankIds.push(token.bankId); // Include self

            const details = await institutionService.getInstitutionDetails(bankIds);
            const formattedData = details.map(detail => ({
                key: detail.bankId,
                label: detail.bankName,
                data: detail,
                isMainBranch: detail.bankId === token.bankId
            }));

            res.send({ success: 'Successfully fetched associated branches', data: formattedData });
        } catch (error) {
            console.error('Error fetching associated branches:', error);
            res.send({ error: 'Failed to fetch associated branches.' });
        }
    });

    app.post('/api/admin/send-reset-request', async function (req, res) {
        const token = req.user;
        if (!token) return res.send({ error: 'You are not authorized. Please log in.' });
        if (token.role !== 'root' && token.role !== 'admin') return res.send({ error: 'You do not have sufficient permission.' });

        try {
            await db.collection('admin').doc('organization').collection('reset-request').add({
                bankId: req.body.bankId,
                date: new Date().toISOString().slice(0, 10),
                name: req.body.name,
                bankName: req.body.bankName,
                isMainBranch: req.body.isMainBranch,
                createdAt: new Date(),
                createdBy: token.email,
            });
            res.send({ success: 'Reset request sent successfully.' });
        } catch (err) {
            console.error('Reset Request Error:', err);
            res.send({ error: 'Failed to send reset request.' });
        }
    });

    app.get('/api/admin/get-reset-request', async function (req, res) {
        const token = req.user;
        if (!token) return res.send({ error: 'You are not authorized. Please log in.' });
        if (token.role !== 'root' && token.role !== 'admin') return res.send({ error: 'You do not have permission.' });

        try {
            const snapshot = await db.collection('admin').doc('organization').collection('reset-request').get();
            const resetRequestList = snapshot.docs.map(doc => ({
                key: doc.id,
                ...doc.data(),
                isMainBranch: doc.data().isMainBranch ? 'Yes' : 'No',
            }));
            res.send({ success: 'Successfully fetched reset request', data: resetRequestList });
        } catch (e) {
            res.send({ error: 'Failed to get reset request. Error: ' + e.message });
        }
    });
};