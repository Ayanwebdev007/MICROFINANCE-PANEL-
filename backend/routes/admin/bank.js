const {getFirestore} = require('firebase-admin/firestore');
const db = getFirestore();

module.exports = app => {
    app.post('/api/admin/create-new-bank', async function (req, res) {
        const token = req.user;

        if (!token) return res.status(401).send({error: 'You are not authorized. Please log in.'});
        if (token.role !== 'root') return res.status(403).send({error: 'You do not have permission.'});

        try {
            await db.runTransaction(async (t) => {
                let dateTimeString = new Date().toISOString().slice(0, 16).replaceAll('-', '');
                dateTimeString = dateTimeString.replace(':', '');
                const bankId = `GS3_${dateTimeString}_${generateRandomString(13)}`;

                const masterGlRef = db.collection('admin').doc('master-data').collection('gl_code').doc('value');
                const masterGlInfo = await t.get(masterGlRef);

                const bankAdminRef = db.collection('admin').doc('organization').collection('banks').doc(bankId);
                t.set(bankAdminRef, {
                    bankId: bankId,
                    bankName: req.body.bankName,
                    displayName: req.body.displayName,
                    isMainBranch: true,
                    createdAt: new Date(),
                    createdBy: token.email,
                    HO_ID: req.body.isSocietyStructure ? (req.body.HO_ID || '') : '',
                    isHO: (req.body.isSocietyStructure && (!req.body.HO_ID || '') || ''),
                    BRANCH_ID: req.body.isSocietyStructure ? req.body.BRANCH_ID : '',
                    isHOBranch: (req.body.isSocietyStructure && (!req.body.BRANCH_ID || '' && !!req.body.HO_ID || '') || ''),
                });

                const bankRef = db.collection(bankId).doc('admin').collection('bank-info').doc('details');
                t.set(bankRef, {
                    bankName: req.body.bankName,
                    displayName: req.body.displayName,
                    registrationCode: req.body.registrationCode,
                    address: req.body.address,
                    pan: req.body.pan,
                    tan: req.body.tan,
                    gst: req.body.gst,
                    domain: req.body.domainName,
                    startDate: req.body.startDate,
                    renewDate: req.body.renewDate,
                    email: req.body.email,
                    phone: req.body.phone,
                    logo: req.body.logo,
                    module: req.body.module,
                    createdAt: new Date(),
                    createdBy: token.email,
                    isMainBranch: true,
                });

                const bankGlRef = db.collection(bankId).doc('admin').collection('gl_code').doc('value');
                t.set(bankGlRef, masterGlInfo.data());

                const savingsIteratorRef = db.collection(bankId).doc('admin').collection('iterator').doc('savings');
                t.set(savingsIteratorRef, {value: 1, prefix: 'SV00'});

                const depositIteratorRef = db.collection(bankId).doc('admin').collection('iterator').doc('deposit');
                t.set(depositIteratorRef, {value: 1, prefix: 'D00'});

                const loanIteratorRef = db.collection(bankId).doc('admin').collection('iterator').doc('loan');
                t.set(loanIteratorRef, {value: 1, prefix: 'LN00'});

                const groupLoanIteratorRef = db.collection(bankId).doc('admin').collection('iterator').doc('group-loan');
                t.set(groupLoanIteratorRef, {value: 1, prefix: 'SHG00'});

                const advisorIteratorRef = db.collection(bankId).doc('admin').collection('iterator').doc('advisor');
                t.set(advisorIteratorRef, {value: 1, prefix: 'GRP00'});

                const employeeIteratorRef = db.collection(bankId).doc('admin').collection('iterator').doc('employee');
                t.set(employeeIteratorRef, {value: 1, prefix: 'EMP00'});

                const groupIteratorRef = db.collection(bankId).doc('admin').collection('iterator').doc('group');
                t.set(groupIteratorRef, {value: 1, prefix: 'GRP00'});

                const kycIteratorRef = db.collection(bankId).doc('admin').collection('iterator').doc('kyc');
                t.set(kycIteratorRef, {value: 1, prefix: 'M00'});

                const groupRef = db.collection(bankId).doc('kyc').collection('group').doc('100000');
                t.set(groupRef, {
                    name: 'NOT ASSIGNED',
                });

                res.send({success: `Successfully create new bank`});
            });
        } catch (err) {
            console.log(err);
            res.send({error: 'Failed to create new Bank. Err: ' + err.message});
        }
    });

    app.post('/api/admin/update-existing-bank', async function (req, res) {
        const token = req.user;

        if (!token) return res.status(401).send({error: 'You are not authorized. Please log in.'});
        if (token.role !== 'root') return res.status(403).send({error: 'You do not have permission.'});

        try {
            await db.runTransaction(async (t) => {
                const bankId = req.body.bankId;

                const bankRef = db.collection(bankId).doc('admin').collection('bank-info').doc('details');
                const bankDetails = await t.get(bankRef);

                let oldRenewDate = null;

                if (bankDetails.exists) {
                    const data = bankDetails.data();
                    oldRenewDate = data.renewDate || null;

                    if (oldRenewDate) {
                        const historyRef = db.collection(bankId).doc('admin').collection('bank-info').doc('renew-history');
                        const historyDoc = await t.get(historyRef);

                        let existingHistory = [];

                        if (historyDoc.exists) {
                            const historyData = historyDoc.data();
                            existingHistory = Array.isArray(historyData.renewDates) ? historyData.renewDates : [];
                        }

                        existingHistory.push({
                            date: oldRenewDate,
                            updatedAt: new Date(),
                            updatedBy: token.email,
                        });

                        t.set(historyRef, {renewDates: existingHistory}, {merge: true});
                    }
                }

                const bankAdminRef = db.collection('admin').doc('organization').collection('banks').doc(bankId);
                t.update(bankAdminRef, {
                    bankName: req.body.bankName,
                    displayName: req.body.displayName,
                    updatedAt: new Date(),
                    updatedBy: token.email,
                });

                t.update(bankRef, {
                    bankName: req.body.bankName,
                    displayName: req.body.displayName,
                    registrationCode: req.body.registrationCode,
                    address: req.body.address,
                    pan: req.body.pan,
                    tan: req.body.tan,
                    gst: req.body.gst,
                    renewDate: req.body.renewDate,
                    email: req.body.email,
                    phone: req.body.phone,
                    logo: req.body.logo,
                    module: req.body.module,
                    isMainBranch: true,
                });

                res.send({success: `Successfully updated the bank`});
            });
        } catch (err) {
            console.log("Transaction Error:", err);
            res.send({error: 'Failed to update bank. Try again...'});
        }
    });


    app.get('/api/admin/get-registered-banks', async function (req, res) {
        const token = req.user

        if (!token) return res.status(401).send({error: 'You are not authorized. Please log in.'});
        if (token.role !== 'root') return res.status(403).send({error: 'You do not have permission.'});

        try {
            const bankColRef = db.collection('admin').doc('organization').collection('banks');
            const snapshot = await bankColRef.get();
            const bankList = [];
            snapshot.forEach(doc => {
                bankList.push({
                    key: doc.id,
                    label: doc.data().bankName,
                    isMainBranch: !doc.data().mainBranchId,
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
                });
            }
            res.send({success: 'Successfully fetched registered banks', data: bankDropdown});
        } catch (error) {
            console.log("Fetch Registered Banks Error:", error);
            res.send({error: 'Failed to fetch banks. Try again...'});
        }
    });

    app.post('/api/admin/update-bank-status', async function (req, res) {
        const token = req.user

        if (!token) return res.status(401).send({error: 'You are not authorized. Please log in.'});
        if (token.role !== 'root') return res.status(403).send({error: 'You do not have permission.'});

        try{
            const bankInfoRef = db.collection(req.body.bankId).doc('admin').collection('bank-info').doc('details');
            const bankInfo = await bankInfoRef.get();
            await bankInfoRef.update({
                disabled: req.body.actionValue,
            });

            // Fetch Registered Banks
            const bankColRef = db.collection('admin').doc('organization').collection('banks');
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

            res.send({success: `Successfully updated bank: ${bankInfo.data().bankName}`, data: bankDropdown});
        } catch (error) {
            console.log("Bank update error", error)
            res.send({error: "Failed to update bank. Try again..."});
        }
    });

    app.post('/api/admin/get-wallet-balance-and-configuration', async function (req, res) {
        const token = req.user

        if (!token) return res.status(401).send({error: 'You are not authorized. Please log in.'});
        if (token.role !== 'root') return res.status(403).send({error: 'You do not have permission.'});

        try {
            const bankWalletRef = db.collection(req.body.bankId).doc('wallet');
            const getWalletDetails = await bankWalletRef.get();
            const walletDetails = getWalletDetails.data() || {};

            res.send({
                success: `Successfully fetched Wallet Details`,
                data: {
                    walletBalance: walletDetails.balance || 0,
                    walletConfiguration: walletDetails.configuration || {
                        equifaxCIBIL: {},
                    },
                },
            });
        } catch (e) {
            console.log(e);
            res.send({error: "Failed to get wallet balance. Try again..."});
        }
    });

    app.post('/api/admin/add-wallet-balance-main-branch', async function (req, res) {
        const token = req.user

        if (!token) return res.status(401).send({error: 'You are not authorized. Please log in.'});
        if (token.role !== 'root') return res.status(403).send({error: 'You do not have permission.'});

        try {
            await db.runTransaction(async (t) => {
                const bankWalletRef = db.collection(req.body.bankId).doc('wallet');
                const getWalletDetails = await t.get(bankWalletRef);
                const walletDetails = getWalletDetails.data() || {};

                const walletTransactionRef = db.collection(req.body.bankId).doc('wallet').collection('loaded-balance').doc(new Date().toISOString());
                t.set(walletTransactionRef, {
                    amount: parseInt(req.body.amount),
                    balance: (walletDetails.balance || 0) + parseInt(req.body.amount),
                    type: 'credit',
                    description: 'Added to Wallet',
                    createdAt: new Date(),
                    createdBy: token.email,
                });

                t.set(bankWalletRef, {
                    balance: (walletDetails.balance || 0) + parseInt(req.body.amount),
                    configuration: {
                        equifaxCIBIL: req.body.equifaxCIBIL || {},
                    },
                });
                res.send({success: `Successfully Updated Wallet Balance & Configuration for ${req.body.bankName}`});
            });
        } catch (err) {
            console.log("Transaction Error:", err);
            res.send({error: 'Failed to Update. Error: ' + err.message});
        }
    });


    app.post('/api/admin/get-loaded-wallet-transactions', async function (req, res) {
        const token = req.user;
        const {collection} = req.body;

        if (!token) return res.status(401).send({error: 'You are not authorized. Please log in.'});

        // Validate collection type
        const validCollections = ["loaded-balance", "api-usage"];
        if (!validCollections.includes(collection)) {
            return res.send({error: 'Invalid collection type requested.'});
        }

        const mainBranchRef = db.collection('admin').doc('organization').collection('banks').doc(token.bankId);
        const mainBranchInfo = await mainBranchRef.get();
        const bankId = mainBranchInfo.data().mainBranchId || token.bankId;

        try {
            const walletTxnsRef = db
                .collection(bankId)
                .doc('wallet')
                .collection(collection)
                .orderBy(collection === "loaded-balance" ? 'createdAt' : 'timestamp', 'desc');

            const snapshot = await walletTxnsRef.get();

            const transactions = [];
            snapshot.forEach((doc) => {
                transactions.push({id: doc.id, ...doc.data()});
            });

            res.send({
                success: `${collection} wallet transactions fetched successfully`,
                data: transactions,
            });
        } catch (err) {
            console.error('Error fetching wallet transactions:', err);
            res.send({error: 'Failed to load wallet transactions.'});
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