const {getFirestore} = require('firebase-admin/firestore');
const db = getFirestore();

module.exports = app => {
    app.post('/api/admin/update-iterators', async function (req, res) {
        const token = req.user; // Get user from the middleware

        if (!token) return res.status(401).send({error: 'You are not authorized. Please log in.'});
        if (token.role !== 'root' && token.role !== 'admin') {
            return res.status(403).send({error: 'You are not authorized.'});
        }

        const bankId = req.body.bankId;

        const iteratorTypes = [
            'savings',
            'deposit',
            'loan',
            'group-loan',
            'advisor',
            'employee',
            'group',
            'kyc'
        ];

        try {
            await db.runTransaction(async (t) => {
                const errors = [];

                const iteratorsData = req.body.iterators;

                if (!iteratorsData) {
                    return res.status(400).send({
                        error: 'Missing "iterators" object in request body.'
                    });
                }

                if (token.bankId === bankId) {
                    const defaultIteratorRef = db.collection(bankId).doc('admin').collection('iterator').doc('default');
                    const defaultIteratorInfo = await t.get(defaultIteratorRef);
                    if (!defaultIteratorInfo.exists) {
                        await t.set(defaultIteratorRef, req.body.iterators);
                    }
                }

                for (const type of iteratorTypes) {
                    const data = iteratorsData[type];

                    if (!data) {
                        errors.push(`Missing data for "${type}"`);
                        continue;
                    }

                    const {prefix, incrementalValue} = data;

                    if (typeof prefix !== 'string') {
                        errors.push(`Invalid prefix for "${type}" - must be a string`);
                    }

                    if (!incrementalValue) {
                        errors.push(`Invalid value for "${type} incrementalValue" is required`);
                    }

                    if (errors.length > 0) continue;

                    const docRef = db.collection(bankId).doc("admin")
                        .collection("iterator").doc(type);

                    // Use set with merge to allow creation or update
                    await t.set(docRef, {
                        prefix,
                        value: incrementalValue
                    }, {merge: true});
                }

                if (errors.length > 0) {
                    let errorMessage = 'Validation failed: ';
                    for (const error of errors) {
                        errorMessage += `${error}. `;
                    }
                    return res.status(400).send({
                        success: false,
                        error: errorMessage
                    });
                }

                return res.send({
                    success: true,
                    message: 'All iterators updated successfully.',
                });
            });
        } catch (err) {
            console.error('Transaction failed:', err);
            return res.status(500).send({
                error: err.message,
            });
        }
    });

    app.get('/api/admin/get-iterator-list', async function (req, res) {
        const token = req.user; // Get user from the middleware

        if (!token) return res.status(401).send({error: 'You are not authorized. Please log in.'});

        if (token.role !== 'root' && token.role !== 'admin') {
            return res.status(403).send({error: 'You do not have permission.'});
        }

        const iteratorList = {};

        try {
            const bankId = token.bankId;

            // Reference to the iterator subcollection
            const iteratorRef = db.collection(bankId).doc('admin').collection('iterator');
            const snapshot = await iteratorRef.get();
            snapshot.forEach(doc => {
                iteratorList[doc.id] = doc.data();
            });

            res.send({success: true, iteratorList});

        } catch (err) {
            console.error('Error fetching iterator list:', err);
            res.status(500).send({error: 'Failed to fetch iterator list.'});
        }

    });

    app.get('/api/admin/get-iterator-list/:bankId', async function (req, res) {
        const token = req.user; // Get user from the middleware
        const bankId = req.params.bankId;

        if (!token) return res.status(401).send({error: 'You are not authorized. Please log in.'});

        if (token.role !== 'root' && token.role !== 'admin') {
            return res.status(403).send({error: 'You do not have permission.'});
        }

        const iteratorList = {};

        try {
            // Reference to the iterator subcollection
            const iteratorRef = db.collection(bankId).doc('admin').collection('iterator');
            const snapshot = await iteratorRef.get();
            snapshot.forEach(doc => {
                iteratorList[doc.id] = doc.data();
            });

            // Check if al-least one document exists for each iterator type
            // Check KYC Document
            const kycColRef = db.collection(bankId).doc('kyc').collection('member-kyc');
            const getKycCount = await kycColRef.count().get();
            iteratorList['kyc'].hasDocument = (getKycCount.data().count > 0);

            // Check Advisor Document
            const advisorColRef = db.collection(bankId).doc('kyc').collection('advisor-kyc');
            const getAdvisorCount = await advisorColRef.count().get();
            iteratorList['advisor'].hasDocument = (getAdvisorCount.data().count > 0);

            // Check Employee Document
            const employeeColRef = db.collection(bankId).doc('kyc').collection('employee-kyc');
            const getEmployeeCount = await employeeColRef.count().get();
            iteratorList['employee'].hasDocument = getEmployeeCount.data().count > 0;

            // Check Group Document
            const groupColRef = db.collection(bankId).doc('kyc').collection('group');
            const getGroupCount = await groupColRef.count().get();
            iteratorList['group'].hasDocument = getGroupCount.data().count > 1;

            // Check Savings Document
            const savingsColRef = db.collection(bankId).doc('accounts').collection('savings');
            const getSavingsCount = await savingsColRef.count().get();
            iteratorList['savings'].hasDocument = getSavingsCount.data().count > 0;

            // Check Deposit Document
            let hasDepositDocument = false;
            const depositTypes = ['recurring-deposit', 'daily-savings', 'thrift-fund', 'fixed-deposit', 'cash-certificate', 'mis-deposit'];
            for (const type of depositTypes) {
                const depositColRef = db.collection(bankId).doc('accounts').collection(type);
                const getDepositCount = await depositColRef.count().get();
                if (getDepositCount.data().count > 0) {
                    hasDepositDocument = true;
                }
            }
            iteratorList['deposit'].hasDocument = hasDepositDocument;

            // Check Loan Document
            const loanColRef = db.collection(bankId).doc('accounts').collection('loan');
            const getLoanCount = await loanColRef.count().get();
            iteratorList['loan'].hasDocument = getLoanCount.data().count > 0;

            // Check Group Loan Document
            const groupLoanColRef = db.collection(bankId).doc('accounts').collection('group-loan');
            const getGroupLoanCount = await groupLoanColRef.count().get();
            iteratorList['group-loan'].hasDocument = getGroupLoanCount.data().count > 0;

            res.send({success: true, iteratorList});

        } catch (err) {
            console.error('Error fetching iterator list:', err);
            res.status(500).send({error: 'Failed to fetch iterator list.'});
        }

    });
}
