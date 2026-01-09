const { getFirestore } = require('firebase-admin/firestore');
const db = getFirestore();
const glService = require('../../services/glService');
const institutionService = require('../../services/institutionService');
const { generateRandomString } = require('../../utils/stringUtils');

module.exports = app => {
    app.post('/api/admin/create-new-bank', async function (req, res) {
        const token = req.user;

        if (!token) return res.status(401).send({ error: 'You are not authorized. Please log in.' });
        if (token.role !== 'root') return res.status(403).send({ error: 'You do not have permission.' });

        try {
            const bankId = `GS3_${new Date().toISOString().slice(0, 16).replaceAll('-', '').replace(':', '')}_${generateRandomString(13)}`;

            const searchKeywords = await institutionService.generateInstitutionalKeywords(req.body, {
                HO_ID: req.body.HO_ID,
                BRANCH_ID: req.body.BRANCH_ID
            });

            await db.runTransaction(async (t) => {
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
                    searchKeywords,
                });

                const bankRef = db.collection(bankId).doc('admin').collection('bank-info').doc('details');
                t.set(bankRef, {
                    ...req.body,
                    createdAt: new Date(),
                    createdBy: token.email,
                    isMainBranch: true,
                    searchKeywords,
                });

                await glService.syncFromMaster(bankId, t);

                const iterators = ['savings', 'deposit', 'loan', 'group-loan', 'advisor', 'employee', 'group', 'kyc'];
                const prefixes = { savings: 'SV00', deposit: 'D00', loan: 'LN00', 'group-loan': 'SHG00', advisor: 'GRP00', employee: 'EMP00', group: 'GRP00', kyc: 'M00' };

                iterators.forEach(it => {
                    const ref = db.collection(bankId).doc('admin').collection('iterator').doc(it);
                    t.set(ref, { value: 1, prefix: prefixes[it] });
                });

                const groupRef = db.collection(bankId).doc('kyc').collection('group').doc('100000');
                t.set(groupRef, { name: 'NOT ASSIGNED' });

                res.send({ success: `Successfully created new bank` });
            });
        } catch (err) {
            console.error('Create Bank Error:', err);
            res.send({ error: 'Failed to create new Bank. Err: ' + err.message });
        }
    });

    app.post('/api/admin/update-existing-bank', async function (req, res) {
        // ... (omitted for brevity, assume searchKeywords already updated in previous turn)
    });


    app.get('/api/admin/get-registered-banks', async function (req, res) {
        const token = req.user;
        const { limit = 50, lastVisible, search } = req.query;

        if (!token) return res.status(401).send({ error: 'You are not authorized. Please log in.' });
        if (token.role !== 'root') return res.status(403).send({ error: 'You do not have permission.' });

        try {
            let bankQuery = db.collection('admin').doc('organization').collection('banks').orderBy('bankName');

            if (search) {
                const searchTokens = search.toLowerCase().split(' ').filter(t => t.length > 0);
                if (searchTokens.length > 0) {
                    bankQuery = bankQuery.where('searchKeywords', 'array-contains', searchTokens[0]);
                }
            }

            if (lastVisible) {
                const lastDoc = await db.collection('admin').doc('organization').collection('banks').doc(lastVisible).get();
                if (lastDoc.exists) {
                    bankQuery = bankQuery.startAfter(lastDoc);
                }
            }

            const snapshot = await bankQuery.limit(parseInt(limit)).get();
            const bankIds = snapshot.docs.map(doc => doc.id);

            const details = await institutionService.getInstitutionDetails(bankIds);
            const formattedData = details.map(detail => {
                const doc = snapshot.docs.find(d => d.id === detail.bankId);
                const bankData = doc.data();
                return {
                    key: detail.bankId,
                    label: bankData.bankName,
                    isMainBranch: !bankData.mainBranchId,
                    data: detail,
                };
            });

            const nextLastVisible = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1].id : null;

            res.send({
                success: 'Successfully fetched registered banks',
                data: formattedData,
                lastVisible: nextLastVisible
            });
        } catch (error) {
            console.error('Fetch Registered Banks Error:', error);
            res.send({ error: 'Failed to fetch banks.' });
        }
    });

    app.post('/api/admin/update-bank-status', async function (req, res) {
        const token = req.user

        if (!token) return res.status(401).send({ error: 'You are not authorized. Please log in.' });
        if (token.role !== 'root') return res.status(403).send({ error: 'You do not have permission.' });

        try {
            const { bankId, actionValue } = req.body;
            const bankInfoRef = db.collection(bankId).doc('admin').collection('bank-info').doc('details');

            await bankInfoRef.update({
                disabled: actionValue,
            });

            // Fetch the updated detail efficiently
            const bankDoc = await db.collection('admin').doc('organization').collection('banks').doc(bankId).get();
            const bankInfoStore = await bankInfoRef.get();
            const bankData = bankDoc.data();

            const result = {
                key: bankId,
                label: bankData.bankName,
                data: bankInfoStore.data(),
            };

            res.send({
                success: `Successfully updated bank: ${bankData.bankName}`,
                updatedBank: result
            });
        } catch (error) {
            console.error("Bank update error:", error);
            res.send({ error: "Failed to update bank. Try again..." });
        }
    });

    app.post('/api/admin/get-wallet-balance-and-configuration', async function (req, res) {
        const token = req.user

        if (!token) return res.status(401).send({ error: 'You are not authorized. Please log in.' });
        if (token.role !== 'root') return res.status(403).send({ error: 'You do not have permission.' });

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
            res.send({ error: "Failed to get wallet balance. Try again..." });
        }
    });

    app.post('/api/admin/add-wallet-balance-main-branch', async function (req, res) {
        const token = req.user

        if (!token) return res.status(401).send({ error: 'You are not authorized. Please log in.' });
        if (token.role !== 'root') return res.status(403).send({ error: 'You do not have permission.' });

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
                res.send({ success: `Successfully Updated Wallet Balance & Configuration for ${req.body.bankName}` });
            });
        } catch (err) {
            console.log("Transaction Error:", err);
            res.send({ error: 'Failed to Update. Error: ' + err.message });
        }
    });


    app.post('/api/admin/get-loaded-wallet-transactions', async function (req, res) {
        const token = req.user;
        const { collection } = req.body;

        if (!token) return res.status(401).send({ error: 'You are not authorized. Please log in.' });

        // Validate collection type
        const validCollections = ["loaded-balance", "api-usage"];
        if (!validCollections.includes(collection)) {
            return res.send({ error: 'Invalid collection type requested.' });
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
                transactions.push({ id: doc.id, ...doc.data() });
            });

            res.send({
                success: `${collection} wallet transactions fetched successfully`,
                data: transactions,
            });
        } catch (err) {
            console.error('Error fetching wallet transactions:', err);
            res.send({ error: 'Failed to load wallet transactions.' });
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