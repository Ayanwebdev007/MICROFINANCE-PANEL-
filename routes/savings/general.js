const {getFirestore} = require('firebase-admin/firestore');
const db = getFirestore();

module.exports = app => {
    app.post('/api/savings/get-employee-associated-accounts', async (req, res) => {
        const token = req.user;
        const { employeeId } = req.body;

        if (!token) {
            return res.status(401).send({ error: 'Unauthorized. Please log in.' });
        }
        if (!employeeId) {
            return res.status(400).send({ error: 'Missing employee ID! Please Select an employee to continue.' });
        }

        try {
            const savingsAccounts = await db
                .collection(token.bankId)
                .doc('accounts')
                .collection('savings')
                .where('associatedEmployee', '==', employeeId)
                .where('closed', '==', false)
                .get();

            const accounts = [];

            for (const doc of savingsAccounts.docs) {
                const account = doc.data();

                // fetch first applicant's KYC info
                let memberName = '';
                if (account.applicants && account.applicants.length > 0) {
                    const applicantId = account.applicants[0];

                    const kycInfo = await db
                        .collection(token.bankId)
                        .doc('kyc')
                        .collection('member-kyc')
                        .doc(applicantId)
                        .get();

                    if (kycInfo.exists) {
                        memberName = kycInfo.data().name;
                    }
                }

                const transformed = {
                    cif: account.applicants && account.applicants.length > 0 ? account.applicants[0] : '',
                    name: memberName,
                    label: `${memberName} - ${account.account}`,
                    key: account.account,
                    account: account.account,
                    referrer: account.referrer,
                    currentBalance: account.balance
                };

                accounts.push(transformed);
            }
            res.send({ success: true, accountDetails: accounts });
        } catch (error) {
            console.error('Error fetching employee associated accounts:', error);
            return res.status(500).json({ error: 'Server error. Try again...' });
        }
    });

    app.post('/api/savings/get-employee-associated-deposit-accounts', async (req, res) => {
        const token = req.user;
        const { employeeId, accountType } = req.body;

        if (!token) {
            return res.status(401).send({ error: 'Unauthorized. Please log in.' });
        }
        if (!employeeId) {
            return res.status(400).send({ error: 'Missing employee ID! Please Select an employee to continue.' });
        }
        if (!accountType) {
            return res.status(400).send({ error: 'Missing account type! Please Select an account type to continue.' });
        }

        try {
            const depositAccounts = await db
                .collection(token.bankId)
                .doc('accounts')
                .collection(accountType)
                .where('associatedEmployee', '==', employeeId)
                .where('closed', '==', false)
                .get();

            const accounts = [];

            for (const doc of depositAccounts.docs) {
                const account = doc.data();

                // fetch first applicant's KYC info
                let memberName = '';
                if (account.applicants && account.applicants.length > 0) {
                    const applicantId = account.applicants[0];

                    const kycInfo = await db
                        .collection(token.bankId)
                        .doc('kyc')
                        .collection('member-kyc')
                        .doc(applicantId)
                        .get();

                    if (kycInfo.exists) {
                        memberName = kycInfo.data().name;
                    }
                }

                const transformed = {
                    cif: account.applicants && account.applicants.length > 0 ? account.applicants[0] : '',
                    name: memberName,
                    label: `${memberName} - ${account.account}`,
                    key: account.account,
                    account: account.account,
                    referrer: account.referrer,
                    currentBalance: account.balance
                };

                accounts.push(transformed);
            }
            res.send({ success: true, accountDetails: accounts });
        } catch (error) {
            console.error('Error fetching employee associated accounts:', error);
            return res.status(500).json({ error: 'Server error. Try again...' });
        }
    });

}
