const {getFirestore} = require('firebase-admin/firestore');
const db = getFirestore();

module.exports = app => {
    app.post('/api/admin/create-new-branch', async function (req, res) {
        const token = req.user; // Get user from the middleware

        if (!token) return res.send({error: 'You are not authorized. Please log in.'});

        if (token.role !== 'root' && token.role !== 'admin') return res.send({error: 'You do not have permission.'});

        try {
            await db.runTransaction(async (t) => {
                let dateTimeString = new Date().toISOString().slice(0, 16).replaceAll('-', '');
                dateTimeString = dateTimeString.replace(':', '');
                const bankId = `GS3_${dateTimeString}_${generateRandomString(13)}`;
                const mainBranchId = req.body.bankId;

                const masterGlRef = db.collection('admin').doc('master-data').collection('gl_code').doc('value');
                const masterGlInfo = await t.get(masterGlRef);
                const mainBranchRef = db.collection('admin').doc('organization').collection('banks').doc(mainBranchId);
                const mainBranchInfo = await t.get(mainBranchRef);
                const mainBranchIteratorRef = db.collection(mainBranchId).doc('admin').collection('iterator').doc('default');
                const mainBranchIteratorInfo = await t.get(mainBranchIteratorRef);

                const bankAdminRef = db.collection('admin').doc('organization').collection('banks').doc(bankId);
                await t.set(bankAdminRef, {
                    bankId: bankId,
                    mainBranchId: req.body.bankId,
                    bankName: `${req.body.bankName} branch of ${mainBranchInfo.data().bankName}`,
                    displayName: `${req.body.displayName} branch of ${mainBranchInfo.data().displayName}`,
                    createdAt: new Date(),
                    branchCode: req.body.branchCode,
                    createdBy: token.email,
                });

                const bankRef = db.collection(bankId).doc('admin').collection('bank-info').doc('details');
                await t.set(bankRef, {
                    bankName: req.body.bankName,
                    displayName: req.body.displayName,
                    mainBranchId: req.body.bankId,
                    registrationCode: req.body.registrationCode,
                    address: req.body.address,
                    domain: mainBranchInfo.data().domain || '',
                    startDate: new Date().toISOString().slice(0, 10) || req.body.startDate || '',
                    renewDate: '',
                    pan: req.body.pan,
                    tan: req.body.tan,
                    gst: req.body.gst,
                    email: req.body.email,
                    phone: req.body.phone,
                    logo: req.body.logo,
                    module: req.body.module,
                    createdAt: new Date(),
                    createdBy: token.email,
                    isMainBranch: false,
                });

                const bankGlRef = db.collection(bankId).doc('admin').collection('gl_code').doc('value');
                await t.set(bankGlRef, masterGlInfo.data());

                const savingsIteratorRef = db.collection(bankId).doc('admin').collection('iterator').doc('savings');
                await t.set(savingsIteratorRef, {
                    value: mainBranchIteratorInfo.data()?.savings?.incrementalValue || 1,
                    prefix: `${mainBranchIteratorInfo.data()?.savings?.prefix || 'SV'}${req.body.branchCode}00`,
                });

                const depositIteratorRef = db.collection(bankId).doc('admin').collection('iterator').doc('deposit');
                await t.set(depositIteratorRef, {
                    value: mainBranchIteratorInfo.data()?.deposit?.incrementalValue || 1,
                    prefix: `${mainBranchIteratorInfo.data()?.deposit?.prefix || 'D'}${req.body.branchCode}00`,
                });

                const loanIteratorRef = db.collection(bankId).doc('admin').collection('iterator').doc('loan');
                await t.set(loanIteratorRef, {
                    value: mainBranchIteratorInfo.data()?.loan?.incrementalValue || 1,
                    prefix: `${mainBranchIteratorInfo.data()?.loan?.prefix || 'LN'}${req.body.branchCode}00`,
                });

                const groupLoanIteratorRef = db.collection(bankId).doc('admin').collection('iterator').doc('group-loan');
                await t.set(groupLoanIteratorRef, {
                    value: mainBranchIteratorInfo.data()?.['group-loan']?.incrementalValue || 1,
                    prefix: `${mainBranchIteratorInfo.data()?.['group-loan']?.prefix || 'GRP'}${req.body.branchCode}00`,
                });

                const advisorIteratorRef = db.collection(bankId).doc('admin').collection('iterator').doc('advisor');
                await t.set(advisorIteratorRef, {
                    value: mainBranchIteratorInfo.data()?.advisor?.incrementalValue || 1,
                    prefix: `${mainBranchIteratorInfo.data()?.advisor?.prefix || ''}${req.body.branchCode}`,
                });

                const employeeIteratorRef = db.collection(bankId).doc('admin').collection('iterator').doc('employee');
                await t.set(employeeIteratorRef, {
                    value: mainBranchIteratorInfo.data()?.employee?.incrementalValue || 1,
                    prefix: `${mainBranchIteratorInfo.data()?.employee?.prefix || 'EMP'}${req.body.branchCode}00`,
                });

                const groupIteratorRef = db.collection(bankId).doc('admin').collection('iterator').doc('group');
                await t.set(groupIteratorRef, {
                    value: mainBranchIteratorInfo.data()?.group?.incrementalValue || 1,
                    prefix: `${mainBranchIteratorInfo.data()?.group?.prefix || 'GRP'}${req.body.branchCode}00`,
                });

                const kycIteratorRef = db.collection(bankId).doc('admin').collection('iterator').doc('kyc');
                await t.set(kycIteratorRef, {
                    value: mainBranchIteratorInfo.data()?.kyc?.incrementalValue || 1,
                    prefix: `${mainBranchIteratorInfo.data()?.kyc?.prefix || 'M'}${req.body.branchCode}00`,
                });

                const groupRef = db.collection(bankId).doc('kyc').collection('group').doc('100000');
                await t.set(groupRef, {
                    name: 'NOT ASSIGNED',
                });

                res.send({success: `Successfully create new Branch`});
            });
        } catch (err) {
            console.log(err)
            res.send({error: 'Failed to create new Bank. Try again...'});
        }
    });

    app.post('/api/admin/validate-branch-code', async function (req, res) {
        const token = req.user; // Get user from the middleware

        if (!token) return res.send({error: 'You are not authorized. Please log in.'});

        if (token.role !== 'root' && token.role !== 'admin') return res.send({error: 'You do not have permission.'});

        try {
            const bankColRef = db.collection('admin').doc('organization').collection('banks').where('mainBranchId', '==', req.body.mainBranchId);
            const snapshot = await bankColRef.get();
            const bankList = [];
            snapshot.forEach(doc => {
                bankList.push({
                    key: doc.id,
                    label: doc.data().bankName,
                });
            });
            for (const bank of bankList) {
                const bankRef = db.collection(bank.key).doc('admin').collection('bank-info').doc('details');
                const bankInfo = await bankRef.get();
                if (bankInfo.data().branchCode === req.body.branchCode) {
                    console.log()
                    return res.send({error: 'Branch code already exists. Please choose another one.'});
                }
            }
            return res.send({success: 'Branch code is available'});
        } catch (err) {
            console.log(err)
            res.send({error: 'Failed to create new Bank. Try again...'});
        }
    });

    app.post('/api/admin/update-existing-branch', async function (req, res) {
        const token = req.user; // Get user from the middleware

        if (!token) return res.send({error: 'You are not authorized. Please log in.'});

        if (token.role !== 'root' && token.role !== 'admin') return res.send({error: 'You do not have permission.'});

        try {
            await db.runTransaction(async (t) => {
                const bankId = req.body.bankId;

                const mainBranchRef = db.collection('admin').doc('organization').collection('banks').doc(token.bankId);
                const mainBranchInfo = await t.get(mainBranchRef);

                const bankAdminRef = db.collection('admin').doc('organization').collection('banks').doc(bankId);
                await t.update(bankAdminRef, {
                    bankName: `${req.body.bankName} branch of ${mainBranchInfo.data().bankName}`,
                    displayName: `${req.body.displayName} branch of ${mainBranchInfo.data().displayName}`,
                    updatedAt: new Date(),
                    updatedBy: token.email,
                });

                const bankRef = db.collection(bankId).doc('admin').collection('bank-info').doc('details');
                await t.update(bankRef, {
                    bankName: req.body.bankName,
                    displayName: req.body.displayName,
                    registrationCode: req.body.registrationCode,
                    address: req.body.address,
                    pan: req.body.pan,
                    tan: req.body.tan,
                    gst: req.body.gst,
                    email: req.body.email,
                    phone: req.body.phone,
                    logo: req.body.logo,
                    module: req.body.module,
                    isMainBranch: false,
                    updatedAt: new Date(),
                    updatedBy: token.email,
                });

                res.send({success: `Successfully updated the bank`});
            });
        } catch (err) {
            console.log(err)
            res.send({error: 'Failed to create new Bank. Try again...'});
        }
    });

    app.get('/api/admin/get-associated-branch', async function (req, res) {
        const token = req.user; // Get user from the middleware

        if (!token) return res.send({error: 'You are not authorized. Please log in.'});

        if (token.role !== 'root' && token.role !== 'admin') return res.send({error: 'You do not have permission.'});

        try {
            const bankColRef = db.collection('admin').doc('organization').collection('banks').where('mainBranchId', '==', token.bankId);
            const snapshot = await bankColRef.get();
            const bankList = [];
            snapshot.forEach(doc => {
                bankList.push({
                    key: doc.id,
                    label: doc.data().bankName,
                });
            });
            const bankDropdown = [];
            for (const bank of bankList) {
                const bankRef = db.collection(bank.key).doc('admin').collection('bank-info').doc('details');
                const bankInfo = await bankRef.get();
                bankDropdown.push({
                    key: bank.key,
                    label: bank.label,
                    data: bankInfo.data(),
                });
            }
            const mainBranchRef = db.collection(token.bankId).doc('admin').collection('bank-info').doc('details');
            const mainBranchInfo = await mainBranchRef.get();
            bankDropdown.push({
                key: token.bankId,
                label: mainBranchInfo.data().bankName,
                data: mainBranchInfo.data(),
                isMainBranch: true,
            });
            res.send({success: 'Successfully fetched registered banks', data: bankDropdown});
        } catch (error) {
            console.error('Error fetching associated branches:', error);
            res.send({error: 'Failed to fetch associated branches. Try again...'});

        }
    });

    app.post('/api/admin/send-reset-request', async function (req, res) {
        const token = req.user; // Get user from the middleware

        if (!token) return res.send({error: 'You are not authorized. Please log in.'});

        if (token.role !== 'root' && token.role !== 'admin') return res.send({error: 'You do not have sufficient permission.'});

        try {
            const resetRequestRef = db.collection('admin').doc('organization').collection('reset-request');
            await resetRequestRef.add({
                bankId: req.body.bankId,
                date: new Date().toISOString().slice(0, 10),
                name: req.body.name,
                bankName: req.body.bankName,
                isMainBranch: req.body.isMainBranch,
                createdAt: new Date(),
                createdBy: token.email,
            });
            return res.send({success: 'Reset request sent successfully. Please wait for the admin to approve it.'});
        } catch (err) {
            console.log(err)
            res.send({error: 'Failed to create new Bank. Try again...'});
        }
    });

    app.get('/api/admin/get-reset-request', async function (req, res) {
        const token = req.user;
        if (!token) return res.send({error: 'You are not authorized. Please log in.'});
        if (token.role !== 'root' && token.role !== 'admin') return res.send({error: 'You do not have permission.'});

        try {
            const resetRequestRef = db.collection('admin').doc('organization').collection('reset-request');
            const snapshot = await resetRequestRef.get();
            const resetRequestList = [];
            snapshot.forEach(doc => {
                resetRequestList.push({
                    key: doc.id,
                    ...doc.data(),
                    isMainBranch: doc.data().isMainBranch ? 'Yes' : 'No',
                })
            });
            res.send({success: 'Successfully fetched reset request', data: resetRequestList});
        }catch (e) {
            res.send({error: 'Failed to get reset request. Error: ' + e.message});
        }
    });
}

function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters.charAt(randomIndex);
    }
    return result;
}