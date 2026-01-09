const { getFirestore } = require('firebase-admin/firestore');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const puppeteer = require('puppeteer');
const db = getFirestore();
const fs = require('fs/promises');
const { chromium } = require('playwright');
const numberToWords = require('number-to-words');


// 🔒 Reuse browser (VERY IMPORTANT)
let browser;
(async () => {
    browser = await chromium.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
})();

module.exports = app => {
    app.post('/api/loan/plan-creation/:type', async function (req, res) {
        const loanType = req.params.type;
        const token = req.user;

        if (!token) return res.status(401).send({ error: 'You are not authorized. Please log in.' });

        try {
            await db.runTransaction(async (t) => {
                const planRef = db.collection(token.bankId).doc('admin').collection('service-plan').doc(loanType);
                const getPlan = await t.get(planRef);
                const planData = getPlan.data() || {};
                await t.set(planRef, {
                    ...planData,
                    [req.body.id]: req.body,
                });
                return res.send({ success: 'Plan details updated successfully' });
            });
        } catch (e) {
            console.log('Transaction failure:', e);
            return res.send({ error: 'Failed to create plan. Try again...' });
        }
    });

    app.get('/api/loan/get-plans/:type', async function (req, res) {
        const loanType = req.params.type;
        const token = req.user;

        if (!token) return res.status(401).send({ error: 'You are not authorized. Please log in.' });

        // Get Main Branch Id
        const mainBranchRef = db.collection('admin').doc('organization').collection('banks').doc(token.bankId);
        const mainBranchInfo = await mainBranchRef.get();
        const bankId = mainBranchInfo.data().mainBranchId || token.bankId;

        const plans = [];
        const planRef = db.collection(bankId).doc('admin').collection('service-plan').doc(loanType);
        const planSnapshot = await planRef.get();
        const planData = planSnapshot.data();
        if (planSnapshot.exists) {
            Object.keys(planData).forEach(key => {
                plans.push({ ...planData[key], id: key, label: `${planData[key].name} - ${key}` });
            });
        }
        res.send({ success: 'Successfully fetched data', plans });
    });

    app.post('/api/loan/delete-plan/:type', async function (req, res) {
        const loanType = req.params.type;
        const { schemeCode } = req.body;
        const token = req.user;

        if (!token) return res.status(401).send({ error: 'You are not authorized. Please log in.' });

        if (!schemeCode) {
            return res.status(400).send({ error: 'schemeCode is required.' });
        }

        const planRef = db
            .collection(token.bankId)
            .doc('admin')
            .collection('service-plan')
            .doc(loanType);

        const planDoc = await planRef.get();

        if (!planDoc.exists) {
            return res.status(404).send({ error: 'Plan document not found.' });
        }

        const planData = planDoc.data();

        if (!planData[schemeCode]) {
            return res.status(404).send({ error: 'Scheme not found.' });
        }

        // Remove the scheme using Firestore's FieldValue.delete()
        const admin = require('firebase-admin');
        await planRef.update({
            [schemeCode]: admin.firestore.FieldValue.delete()
        });

        return res.send({ success: 'Scheme deleted successfully.' });
    });


    app.get('/api/get-loan-account/:type/:account/:date', async function (req, res) {
        const accountType = req.params.type;
        const account = req.params.account;

        const token = req.user;

        if (!token) return res.status(401).send({ error: 'You are not authorized. Please log in.' });

        const applicants = [];
        const accountDetails = await db.collection(token.bankId).doc('accounts').collection(accountType).doc(account).get();
        if (accountDetails.exists) {
            for (let i = 0; i < accountDetails.data().applicants.length; i++) {
                const getApplicant = await db.collection(token.bankId).doc('kyc').collection('member-kyc').doc(accountDetails.data().applicants[i]).get();
                if (getApplicant.exists) {
                    applicants.push({
                        cif: getApplicant.id,
                        ...getApplicant.data(),
                    });
                } else {
                    console.log('kyc not exists')
                }
            }

            const accountObj = {
                account: accountDetails.id,
                ...accountDetails.data(),
                applicants: applicants,
                uuid: applicants[0].uuid,
            };
            // console.log(accountObj);
            res.send({ success: accountObj });
        } else {
            res.send({ error: 'You have entered incorrect Account Number' });
        }
    });

    app.post('/api/reports/loan/account-statement', async function (req, res) {
        const transactions = [];
        const token = req.user;

        if (!token) return res.status(401).send({ error: 'You are not authorized. Please log in.' });

        const fromDate = req.body.fromDate || '2021-01-01';
        const toDate = req.body.toDate || '2222-01-01';

        const getAccount = await db.collection(token.bankId).doc('accounts').collection(req.body.accountType).doc(req.body.account).get();
        if (!getAccount.exists) {
            return res.send({ error: 'Account not found' });
        }

        const cifDetails = await db
            .collection(token.bankId)
            .doc('kyc')
            .collection('member-kyc')
            .doc(getAccount.data().applicants?.[0])
            .get();

        const cifData = cifDetails.exists ? cifDetails.data() : {};
        const groupId = cifData.group || '100000'; // fallback group

        const groupSnap = await db
            .collection(token.bankId)
            .doc('kyc')
            .collection('group')
            .doc(groupId)
            .get();

        const groupData = groupSnap.exists ? groupSnap.data() : {};

        const fetchTrans = await db.collection(token.bankId).doc('accounts').collection(req.body.accountType).doc(req.body.account).collection('transaction').where('entryDate', '>=', fromDate).get();
        fetchTrans.forEach(function (trans) {
            if (new Date(trans.data().entryDate) - new Date(toDate) <= 0) {
                transactions.push({
                    id: trans.id,
                    ...trans.data()
                });
            }
        });
        let totalEmiPaidAmount = 0;
        transactions.map(trans => {
            if (trans.type === 'credit') {
                totalEmiPaidAmount += trans.amount || 0
            }
        })

        console.log(totalEmiPaidAmount)
        const installmentDue = Math.round((new Date() - new Date(getAccount.data().disbursementDate)) / (3600 * 24 * 1000 * 7)) + 1 - parseInt(getAccount.data().paidEMI);
        const installmentActualDue = installmentDue > (parseInt(getAccount.data().totalEMI) - parseInt(getAccount.data().paidEMI)) ? (parseInt(getAccount.data().totalEMI) - parseInt(getAccount.data().paidEMI)) : installmentDue;

        res.send({
            success: {
                name: cifData.name || '',
                guardian: cifData.guardian || '',
                address: cifData.address || '',
                cif: getAccount.data().applicants?.[0] || '',
                groupId: groupId,
                groupName: groupData.name || 'Unallocated',
                phone: cifData.phone || '',
                account: req.body.account,

                installmentPaid: getAccount.data().paidEMI,
                emiAmount: getAccount.data().emiAmount,

                // amountPaid:
                //     (parseInt(getAccount.data().paidEMI) * parseFloat(getAccount.data().emiAmount)) -
                //     parseInt(getAccount.data().partialEmiDueAmount || '0'),
                amountPaid: totalEmiPaidAmount,

                installmentDue: installmentActualDue,

                amountDue:
                    installmentActualDue * parseFloat(getAccount.data().emiAmount) +
                    parseInt(getAccount.data().partialEmiDueAmount || '0'),

                installmentPending:
                    parseInt(getAccount.data().totalEMI) -
                    parseInt(getAccount.data().paidEMI),

                amountPending:
                    ((parseInt(getAccount.data().totalEMI) -
                        parseInt(getAccount.data().paidEMI)) *
                        parseFloat(getAccount.data().emiAmount)) +
                    parseInt(getAccount.data().partialEmiDueAmount || '0'),

                transactions
            }
        });


    });

    app.get('/api/get-details-by-group/bulk-loan-repayment/:groupId', async function (req, res) {
        const token = req.user;

        if (!token) return res.status(401).send({ error: 'You are not authorized. Please log in.' });

        const accounts = [{
            value: "",
            label: "Select an Option",
            isDisabled: true,
        }];

        const members = [];
        const groupInfo = await db.collection(token.bankId).doc('kyc').collection('group').doc(req.params.groupId).get();
        const getAssociatedKyc = await db.collection(token.bankId).doc('kyc').collection('member-kyc').where('group', '==', req.params.groupId).get();
        getAssociatedKyc.forEach(function (kyc) {
            if (kyc.data().active !== false) {
                members.push({
                    ...kyc.data(),
                    id: kyc.id,
                });
            }
        });

        for (let member of members) {
            const kycId = member.id;

            const getAccount = await db
                .collection(token.bankId)
                .doc('accounts')
                .collection('group-loan')
                .where('applicants', 'array-contains', kycId)
                .get();

            getAccount.forEach(function (account) {
                if (account.data().closed !== true) {
                    // loanAccounts.push({ account: account.id, ...account.data(), kycId });

                    accounts.push({
                        cif: kycId,
                        name: member.name,
                        label: `${member.name} - ${account.id}`,
                        key: account.id,
                        groupId: member.group,
                        groupName: groupInfo.data()?.name || '',
                        account: account.id,
                        installmentAmount: account.data().emiAmount,
                        interestInstallment: account.data().interestEMI,
                        principleInstallment: account.data().principleEMI,
                        openingDate: account.data().disbursementDate || account.data().openingDate,
                        termPeriod: account.data().totalEMI,
                        emiMode: account.data().planDetails?.emiMode,
                        installment: (parseInt(account.data().paidEMI) || 0).toString(),
                    });
                }
            });
        }

        // for (let i = 0; i < loanAccounts.length; i++) {
        //     const account = loanAccounts[i];
        //     const kycInfo = await db.collection(token.bankId).doc('kyc').collection('member-kyc').doc(account.applicants[0]).get();
        //     if (kycInfo.exists && kycInfo.data().group && account.closed !== true) {
        //         const groupInfo = await db.collection(token.bankId).doc('kyc').collection('group').doc(kycInfo.data().group).get();
        //         const cifId = account.applicants[0];
        //         const name = kycInfo.data().name;
        //         accounts.push({
        //             cif: cifId,
        //             name: name,
        //             label: `${name} - ${account.account}`,
        //             key: account.account,
        //             groupId: kycInfo.data().group,
        //             groupName: groupInfo.data().name,
        //             account: account.account,
        //             installmentAmount: account.emiAmount,
        //             interestInstallment: account.interestEMI,
        //             principleInstallment: account.principleEMI,
        //             openingDate: account.disbursementDate || account.openingDate,
        //             referrer: account.referrer,
        //             termPeriod: account.totalEMI,
        //             installment: (parseInt(account.paidEMI) || 0).toString(),
        //         });
        //     }
        // }

        if (accounts.length > 0) {
            res.send({ success: 'successfully fetched accounts details under the group', details: accounts });
        } else {
            res.send({ error: 'No Referrer Account found under the CP' });
        }
    });

    app.post('/api/reports/loan/active-accounts/:type', async (req, res) => {
        const token = req.user;

        if (!token) return res.status(401).send({ error: 'You are not authorized. Please log in.' });
        const loanType = req.params.type;

        if (!['loan', 'group-loan'].includes(loanType)) {
            return res.send({ error: 'Invalid loan type' });
        }
        const bankId = req.body.bankId || token.bankId;
        const loanAccounts = [];
        const applicableAccounts = [];
        const employees = {};

        const getEmployees = await db.collection(token.bankId).doc('admin').collection('users').get();
        getEmployees.forEach(function (employee) {
            employees[employee.id] = { id: employee.id, ...employee.data() };
        });

        const userProfileInfo = await db.collection(token.bankId).doc('admin').collection('users').doc(token.uid).get();
        let loanColRef = db.collection(bankId).doc('accounts').collection(loanType).where('closed', '==', false);
        if (token.role !== 'root' && token.role !== 'admin' && userProfileInfo.data()?.accessLevel?.fullDataAccess !== true) {
            loanColRef = loanColRef.where('associatedEmployee', '==', token.uid);
        }

        const snapshot = await loanColRef.get();
        snapshot.forEach((doc) => {
            applicableAccounts.push({
                id: doc.id,
                ...doc.data(),
            });
        });
        let slNo = 0;
        for (const accountInfo of applicableAccounts) {
            slNo++
            const kycInfo = await db.collection(bankId).doc('kyc').collection('member-kyc').doc(accountInfo.applicants[0]).get();
            if (kycInfo.exists) {
                const associatedEmployee = kycInfo.data().associatedEmployee;

                loanAccounts.push({
                    slNo: slNo,
                    name: kycInfo.data().name || '',
                    phone: kycInfo.data().phone || '',
                    account: accountInfo.id,
                    disbursement: accountInfo.disbursement || 0,
                    installmentAmount: accountInfo.emiAmount || 0,
                    principleInstallment: accountInfo.principleEMI || 0,
                    principleDue: (accountInfo.disbursement || 0) - (parseFloat(accountInfo.principleEMI || 0) * accountInfo.paidEMI),
                    openingDate: accountInfo.disbursementDate || accountInfo.loanDate || '',
                    termPeriod: accountInfo.totalEMI || 0,
                    installment: (parseInt(accountInfo.paidEMI) || 0).toString(),
                    memberNo: accountInfo.applicants[0],
                    scheme: accountInfo.planDetails?.name,
                    loanType: accountInfo.planDetails?.type,
                    status: accountInfo.closed ? 'Closed' : 'Active',
                    currentDebt: (accountInfo.totalEMI - accountInfo.paidEMI) * accountInfo.emiAmount,
                    emiCollection: (accountInfo.planDetails?.emiMode || '').toUpperCase(),
                    extraPayment: parseInt(accountInfo.remainingBalance) || 0,
                    employeeName: employees[associatedEmployee] ? employees[associatedEmployee].name : '',
                });
            }
        }
        res.send({ success: true, details: loanAccounts });
    });

    app.get('/api/reports/loan/active-accounts/:type/:loanId', async (req, res) => {
        const token = req.user;

        if (!token) return res.status(401).send({ error: 'You are not authorized. Please log in.' });

        const loanType = req.params.type;
        const loanId = req.params.loanId;

        try {
            // Validate loan type
            if (!['loan', 'group-loan'].includes(loanType)) {
                return res.status(400).json({ error: 'Invalid loan type' });
            }

            const loanDocRef = db
                .collection(token.bankId)
                .doc('accounts')
                .collection(loanType)
                .doc(loanId);

            const loanDoc = await loanDocRef.get();

            if (!loanDoc.exists) {
                return res.status(404).json({ error: 'Loan account not found' });
            }

            const accountInfo = loanDoc.data();
            const loanAccount = [];

            let groupName = '';
            if (loanType === 'group-loan') {
                let groupId = accountInfo.groupId
                const groupRef = await db.collection(token.bankId).doc('kyc').collection('group').doc(groupId).get();
                if (groupRef.exists) {
                    groupName = groupRef.data().name || 'NA'
                }
            }
            // Validate applicants
            const mainApplicantId = accountInfo?.applicants?.[0];
            if (!mainApplicantId) {
                return res.status(400).json({ error: 'Main applicant missing in loan data' });
            }

            // Fetch KYC
            const kycDoc = await db
                .collection(token.bankId)
                .doc('kyc')
                .collection('member-kyc')
                .doc(mainApplicantId)
                .get();
            if (kycDoc.exists) {
                const kycData = kycDoc.data();

                loanAccount.push({
                    groupName: groupName || 'NA',
                    name: kycData.name || '',
                    phone: kycData.phone || '',
                    account: loanId,
                    memberNo: mainApplicantId,
                    status: accountInfo.closed ? 'Closed' : 'Active',
                    uuid: kycData.uuid,
                    foreclosureStatus: accountInfo.foreclosureStatus || 'NA',
                    foreclosureRequestId: accountInfo.lastForeclosureRequestId || 'NA',
                    disbursement: accountInfo.disbursement || 0,
                    disbursementDate: accountInfo.disbursementDate || '',
                    loanAmount: accountInfo.loanAmount || 0,
                    loanDate: accountInfo.loanDate || '',
                    loanTerm: accountInfo.loanTerm || 0,
                    totalEMI: accountInfo.totalEMI || 0,
                    paidEMI: accountInfo.paidEMI || 0,
                    groupId: accountInfo.groupId || 'NA',
                    installmentAmount: accountInfo.emiAmount || 0,
                    interestEMI: accountInfo.interestEMI || 0,
                    principleInstallment: accountInfo.principleEMI || 0,
                    principleDue:
                        (accountInfo.disbursement || 0) -
                        ((parseFloat(accountInfo.principleEMI) || 0) * (parseInt(accountInfo.paidEMI) || 0)),
                    openingDate: accountInfo.disbursementDate || accountInfo.loanDate || '',

                    emiCollection: accountInfo.planDetails?.emiMode?.toUpperCase() || '',

                    planDetails: accountInfo.planDetails || {},
                    deductionDetails: accountInfo.deductionDetails || {},
                    coApplicant: accountInfo.coApplicant || {},
                    guarantor: accountInfo.guarantor || {},

                    scheme: accountInfo.planDetails?.name || '',
                    label: accountInfo.planDetails?.label || '',
                    firstEmiDate: accountInfo.firstEmiDate || '',

                    extraPayment: parseInt(accountInfo.remainingBalance) || 0,
                });
            }

            const transactionsSnapshot = await loanDocRef
                .collection('transaction')
                .orderBy('createdAt', 'desc')
                .get();

            const transactions = transactionsSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));


            return res.json({
                success: true,
                details: loanAccount,
                transactions,
            });

        } catch (error) {
            console.error('Error fetching loan account:', error);
            return res.status(401).json({ error: 'Authentication error. Try again...' });
        }
    });

    app.post('/api/loan/delete-loan-account', async (req, res) => {
        const token = req.user;
        const loanId = req.body.loanId;
        const accountType = req.body.accountType;

        try {
            await db.runTransaction(async (t) => {
                const transactions = [];
                const loanRef = db.collection(token.bankId).doc('accounts').collection(accountType).doc(loanId);
                const loanAccountSnapshot = await loanRef.get();
                if (!loanAccountSnapshot.exists) {
                    return res.status(404).send({ error: 'Loan account not found.' });
                }
                if (loanAccountSnapshot.data().closed === true) {
                    return res.status(400).send({ error: 'Loan account is already closed.' });
                }
                const loanAccountData = loanAccountSnapshot.data();

                const cashInHandRef = db.collection(token.bankId).doc('scheduler').collection('daily-book').doc('value');
                const cashInHandSnapshot = await t.get(cashInHandRef);

                const loanTransactionRef = loanRef.collection('transaction');
                const loanTransactionSnapshot = await t.get(loanTransactionRef);
                loanTransactionSnapshot.forEach((doc) => {
                    transactions.push({
                        id: doc.id,
                        ...doc.data(),
                        transactionDate: (doc.data().approvedAt || doc.data().authorisedAt || doc.data().createdAt).slice(0, 10),
                    });
                });

                for (const transaction of transactions) {
                    if (transaction.type === 'credit') {
                        const transactionIds = [`${transaction.id}`, `${transaction.id}.2`, `${transaction.id}.3`, `${transaction.id}.4`, `${transaction.id}.5`];
                        for (const transactionId of transactionIds) {
                            try {
                                const transactionRef = db.collection(token.bankId).doc('transaction').collection(transaction.transactionDate).doc(transactionId);
                                t.delete(transactionRef);
                            } catch (e) {
                                console.log('Transaction not found');
                            }
                        }
                    } else if (transaction.type === 'debit') {
                        const transactionIds = [`${transaction.id}.1`, `${transaction.id}.2`, `${transaction.id}.3`];
                        for (const transactionId of transactionIds) {
                            try {
                                const transactionRef = db.collection(token.bankId).doc('transaction').collection(transaction.transactionDate).doc(transactionId);
                                t.delete(transactionRef);
                            } catch (e) {
                                console.log('Transaction not found');
                            }
                        }
                    }

                    // Reduce Balance from Cash in Hand Transactions
                    const updatedCashInHand = parseInt(cashInHandSnapshot.data()?.cashInHand ?? 0) + (parseInt(loanAccountData.disbursement ?? 0) - (parseInt(loanAccountData.emiAmount) * parseInt(loanAccountData.paidEMI))) - (parseInt(loanAccountData?.deductionDetails?.gst ?? 0) + parseInt(loanAccountData?.deductionDetails?.insuranceAmount ?? 0) + parseInt(loanAccountData?.deductionDetails?.legalAmount ?? 0) + parseInt(loanAccountData?.deductionDetails?.processingFee ?? 0));
                    t.update(cashInHandRef, {
                        cashInHand: updatedCashInHand,
                    });
                }

                t.delete(loanRef);
            })
            res.send({ success: 'Loan account deleted successfully.' });
        } catch (error) {
            console.log(error);
            res.send({ error: error.message });
        }
    });

    app.post('/api/loan/check-existing-loan', async function (req, res) {
        const token = req.user;

        if (!token) return res.status(401).send({ error: 'You are not authorized. Please log in.' });

        try {
            const loanColRef = db.collection(token.bankId).doc('accounts').collection(req.body.loanType).where('applicants', "array-contains", req.body.memberId).where('closed', '==', false);
            const loanSnapshot = await loanColRef.get();
            if (!loanSnapshot.empty) {
                res.send({ warning: 'Loan account already exists for the member. You are sure you want to continue?' });
            } else {
                res.send({ success: true });
            }
        } catch (e) {
            console.log(e);
            return res.send({ error: 'Failed to validate existing Loan. Error: ' + e.message });
        }
    });

    app.get('/api/loan/loan-accounts/:loanId/emi-schedule/print', async (req, res) => {
        const token = req.user;
        if (!token) {
            return res.status(401).send({ error: 'Unauthorized. Please log in.' });
        }

        const { loanId } = req.params;

        try {
            const loanDocRef = db
                .collection(token.bankId)
                .doc('accounts')
                .collection('loan')
                .doc(loanId);

            const loanDoc = await loanDocRef.get();
            if (!loanDoc.exists) {
                return res.status(404).send({ error: 'Loan account not found.' });
            }

            const data = loanDoc.data();

            const kycDoc = await db
                .collection(token.bankId)
                .doc('kyc')
                .collection('member-kyc')
                .doc(data.applicants?.[0])
                .get();

            const memberName = kycDoc.exists ? kycDoc.data().name : 'N/A';

            const loanAmount = parseFloat(data.disbursement || data.loanAmount || 0);
            const emiAmount = parseFloat(data.emiAmount || 0);
            const totalEMI = parseInt(data.totalEMI || 0);
            const principleEMI = parseFloat(data.principleEMI || 0) || loanAmount / totalEMI;
            const interestEMI = emiAmount - principleEMI;
            const disbursementDate = data.disbursementDate || data.loanDate || null;
            const emiMode = (data.planDetails?.emiMode || 'daily').toLowerCase();
            const account = data.account || loanId;
            const loanType = data.planDetails?.type || 'Micro Loan';

            if (!disbursementDate || !loanAmount || !totalEMI || !emiAmount) {
                return res.status(400).send({ error: 'Missing required loan details.' });
            }

            const transSnapshot = await loanDocRef
                .collection('transaction')
                .where('type', '==', 'credit')
                .get();

            let paidEMICount = 0;
            transSnapshot.forEach(doc => {
                const paid = doc.data().paidEMI;
                if (paid && parseInt(paid) > paidEMICount) {
                    paidEMICount = parseInt(paid);
                }
            });

            const startDate = new Date(disbursementDate);
            const schedule = [];
            let balance = loanAmount;

            for (let i = 1; i <= totalEMI; i++) {
                const emiDate = new Date(startDate);
                switch (emiMode) {
                    case 'daily':
                        emiDate.setDate(startDate.getDate() + i - 1);
                        break;
                    case 'weekly':
                        emiDate.setDate(startDate.getDate() + (i - 1) * 7);
                        break;
                    case 'fortnightly':
                        emiDate.setDate(startDate.getDate() + (i - 1) * 14);
                        break;
                    case 'monthly':
                        emiDate.setMonth(startDate.getMonth() + i - 1);
                        break;
                    case 'quarterly':
                        emiDate.setMonth(startDate.getMonth() + (i - 1) * 3);
                        break;
                    default:
                        emiDate.setDate(startDate.getDate() + i - 1);
                }

                const principal = principleEMI;
                const interest = interestEMI;
                const emi = principal + interest;
                balance -= principal;

                schedule.push({
                    emiNo: i,
                    date: new Intl.DateTimeFormat('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: '2-digit',
                    }).format(emiDate),
                    principal: principal.toFixed(2),
                    interest: interest.toFixed(2),
                    emi: emi.toFixed(2),
                    balance: Math.max(balance, 0).toFixed(2),
                });
            }


            const bankInfoDoc = await db
                .collection(token.bankId)
                .doc('admin')
                .collection('bank-info')
                .doc('details')
                .get();

            const DEFAULT_BANK_INFO = {
                bankName: 'Your Financial Institution',
                address: 'Address not available',
                registrationCode: 'Registration not available',
                phone: 'Phone not available',
                email: 'Email not available',
                logo: 'https://via.placeholder.com/150',
            };

            const bankInfo = bankInfoDoc.exists
                ? {
                    bankName: bankInfoDoc.data().bankName || DEFAULT_BANK_INFO.bankName,
                    address: bankInfoDoc.data().address || DEFAULT_BANK_INFO.address,
                    registrationCode: bankInfoDoc.data().registrationCode || DEFAULT_BANK_INFO.registrationCode,
                    phone: bankInfoDoc.data().phone || DEFAULT_BANK_INFO.phone,
                    email: bankInfoDoc.data().email || DEFAULT_BANK_INFO.email,
                    logo: bankInfoDoc.data().logo || DEFAULT_BANK_INFO.logo,
                }
                : DEFAULT_BANK_INFO;


            const formatCurrency = (amount) => {
                const formatted = new Intl.NumberFormat('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                }).format(parseFloat(amount));
                return `Rs. ${formatted}`;
            };

            // --- PDF Generation with pdf-lib ---
            const pdfDoc = await PDFDocument.create();
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

            const PAGE_WIDTH = 595.28; // A4 width
            const PAGE_HEIGHT = 841.89; // A4 height
            const MARGIN = 40;
            const COL_WIDTHS = [40, 70, 70, 70, 70, 70, 60]; // Adjusted for Status column
            const TABLE_WIDTH = COL_WIDTHS.reduce((a, b) => a + b, 0);

            // Calculate start X to center the table
            const START_X = (PAGE_WIDTH - TABLE_WIDTH) / 2;

            let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
            let y = PAGE_HEIGHT - MARGIN;

            const drawText = (text, x, y, options = {}) => {
                page.drawText(String(text), {
                    x,
                    y,
                    size: options.size || 10,
                    font: options.font || font,
                    color: options.color || rgb(0, 0, 0),
                    ...options,
                });
            };

            // Draw Header
            const bankNameText = bankInfo.bankName.toUpperCase();
            const bankNameWidth = boldFont.widthOfTextAtSize(bankNameText, 16);
            drawText(bankNameText, (PAGE_WIDTH - bankNameWidth) / 2, y, { size: 16, font: boldFont, color: rgb(0.04, 0.2, 0.45) });
            y -= 15;

            const addressText = bankInfo.address;
            const addressWidth = font.widthOfTextAtSize(addressText, 9);
            drawText(addressText, (PAGE_WIDTH - addressWidth) / 2, y, { size: 9, color: rgb(0.4, 0.4, 0.4) });
            y -= 12;

            const regText = `Reg: ${bankInfo.registrationCode} | Ph: ${bankInfo.phone}`;
            const regWidth = font.widthOfTextAtSize(regText, 9);
            drawText(regText, (PAGE_WIDTH - regWidth) / 2, y, { size: 9, color: rgb(0.4, 0.4, 0.4) });
            y -= 25;

            // Draw Loan Info
            const titleText = 'LOAN REPAYMENT SCHEDULE';
            const titleWidth = boldFont.widthOfTextAtSize(titleText, 12);
            drawText(titleText, (PAGE_WIDTH - titleWidth) / 2, y, { size: 12, font: boldFont });
            y -= 20;

            const infoStartX = START_X;
            drawText('Account No:', infoStartX, y, { size: 10, font: boldFont });
            drawText(account, infoStartX + 80, y, { size: 10 });
            drawText('Member Name:', infoStartX + 250, y, { size: 10, font: boldFont });
            drawText(memberName, infoStartX + 330, y, { size: 10 });
            y -= 15;

            drawText('Loan Type:', infoStartX, y, { size: 10, font: boldFont });
            drawText(loanType, infoStartX + 80, y, { size: 10 });
            drawText('Disbursed:', infoStartX + 250, y, { size: 10, font: boldFont });
            drawText(formatCurrency(loanAmount), infoStartX + 330, y, { size: 10 });
            y -= 15;

            drawText('EMI Amount:', infoStartX, y, { size: 10, font: boldFont });
            drawText(formatCurrency(emiAmount), infoStartX + 80, y, { size: 10 });
            y -= 30;

            // Draw Table Header
            const headers = ['#', 'Date', 'Principal', 'Interest', 'EMI', 'Balance', 'Status'];
            let xOffset = START_X;

            // Draw background for header
            page.drawRectangle({
                x: START_X,
                y: y - 5,
                width: TABLE_WIDTH,
                height: 20,
                color: rgb(0.95, 0.96, 0.98)
            });

            headers.forEach((header, i) => {
                drawText(header, xOffset + 5, y, { size: 9, font: boldFont });
                xOffset += COL_WIDTHS[i];
            });
            y -= 20;

            // Draw Table Rows
            for (const item of schedule) {
                if (y < MARGIN + 30) {
                    page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
                    y = PAGE_HEIGHT - MARGIN;
                    // Redraw header on new page
                    xOffset = START_X;
                    page.drawRectangle({
                        x: START_X,
                        y: y - 5,
                        width: TABLE_WIDTH,
                        height: 20,
                        color: rgb(0.95, 0.96, 0.98)
                    });
                    headers.forEach((header, i) => {
                        drawText(header, xOffset + 5, y, { size: 9, font: boldFont });
                        xOffset += COL_WIDTHS[i];
                    });
                    y -= 20;
                }

                xOffset = START_X;
                const isPaid = item.emiNo <= paidEMICount;
                const rowColor = isPaid ? rgb(0, 0.5, 0) : rgb(0, 0, 0); // Green for paid

                if (isPaid) {
                    page.drawRectangle({
                        x: START_X,
                        y: y - 2,
                        width: TABLE_WIDTH,
                        height: 15,
                        color: rgb(0.9, 0.98, 0.9)
                    });
                }

                const values = [
                    item.emiNo.toString(),
                    item.date,
                    item.principal,
                    item.interest,
                    item.emi,
                    item.balance,
                    isPaid ? 'Paid' : 'Not Paid'
                ];

                values.forEach((val, i) => {
                    let color = isPaid ? rgb(0.1, 0.4, 0.1) : rgb(0.1, 0.1, 0.1);
                    if (i === 6) { // Status column color
                        color = isPaid ? rgb(0, 0.6, 0) : rgb(0.8, 0, 0);
                    }
                    drawText(val, xOffset + 5, y, { size: 9, color });
                    xOffset += COL_WIDTHS[i];
                });

                y -= 15;
            }

            // Footer
            const footerText = `Generated on ${new Date().toLocaleDateString('en-IN')} | System Generated`;
            const pages = pdfDoc.getPages();
            pages.forEach((p, idx) => {
                p.drawText(footerText, {
                    x: START_X,
                    y: 20,
                    size: 8,
                    font: font,
                    color: rgb(0.5, 0.5, 0.5)
                });
                p.drawText(`Page ${idx + 1} of ${pages.length}`, {
                    x: PAGE_WIDTH - START_X - 50,
                    y: 20,
                    size: 8,
                    font: font,
                    color: rgb(0.5, 0.5, 0.5)
                });
            });


            const pdfBytes = await pdfDoc.save();

            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="Repayment_Schedule_${memberName}_${account}.pdf"`,
            });
            res.end(Buffer.from(pdfBytes));

        } catch (error) {
            console.error('Error generating EMI schedule PDF:', error);
            return res.status(500).send({ error: 'Failed to generate PDF. Please try again.' });
        }
    });


    // single user loan passbook print PDF from backend | start

    app.get('/api/:loanType/:loanId/passbook/print', async (req, res) => {
        const token = req.user;
        if (!token) {
            return res.status(401).send({ error: 'Unauthorized. Please log in.' });
        }

        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const { loanId } = req.params;
        const { loanType } = req.params;
        if (!loanId) {
            return res.status(400).json({ error: "Loan id missing" });
        }

        let kycType = '';
        if (loanType === "loan") {
            kycType = "member-kyc";
        }
        const transactions = [];

        const bankInfoDoc = await db
            .collection(token.bankId)
            .doc('admin')
            .collection('bank-info')
            .doc('details')
            .get();
        const bankData = await bankInfoDoc.data();
        const getToday = () => new Date().toISOString().slice(0, 10);
        const fromDate = req.body.fromDate || '2021-01-01';
        const toDate = req.body.toDate || getToday();

        const formatDate = (dateStr) => {
            const d = new Date(dateStr);
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            return `${day}/${month}/${year}`;
        };
        const formatAmount = (amt) => {
            return amt ? amt.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-';
        };
        const statementPeriod =
            `${formatDate(fromDate)} 00:00 - ${formatDate(toDate)} 23:59`;

        const getAccount = await db.collection(token.bankId).doc('accounts').collection(loanType).doc(loanId).get();
        const cifDetails = await db.collection(token.bankId).doc('kyc').collection(kycType).doc(getAccount.data().applicants[0]).get();
        // const groupInfo = await db.collection(token.bankId).doc('kyc').collection('group').doc(cifDetails.data().group || '100000').get()
        const fetchTrans = await db.collection(token.bankId).doc('accounts').collection(loanType).doc(loanId).collection('transaction').where('entryDate', '>=', fromDate).get();
        fetchTrans.forEach(function (trans) {
            if (new Date(trans.data().entryDate) - new Date(toDate) <= 0) {
                transactions.push({
                    id: trans.id,
                    ...trans.data()
                });
            }
        });

        // console.log(cifDetails.data());
        // console.log(getAccount.data());
        // console.log(transactions);
        const generateTransactionRows = (transactions) => {
            let runningBalance = 0;

            return transactions.map(txn => {

                let debit = '-';
                let credit = '-';

                if (txn.type === 'debit') {
                    debit = formatAmount(txn.amount);
                    runningBalance += txn.amount;
                }

                if (txn.type === 'credit') {
                    credit = formatAmount(txn.amount);
                    runningBalance -= txn.amount;
                }

                return `
                    <tr>
                        <td style="border:1px solid #000; padding:4px;">
                            ${formatDate(txn.entryDate)}
                        </td>
                        <td style="border:1px solid #000; padding:4px;">
                            ${txn.id}
                        </td>
                        <td style="border:1px solid #000; padding:4px;">
                            ${txn.narration}
                        </td>
                        <td style="border:1px solid #000; padding:4px; text-align:right;">
                            ${debit}
                        </td>
                        <td style="border:1px solid #000; padding:4px; text-align:right;">
                            ${credit}
                        </td>
                        <td style="border:1px solid #000; padding:4px; text-align:right;">
                            ${formatAmount(runningBalance)}
                        </td>
                    </tr>
                    `;
            }).join('');
        };

        const outstandingAmount = getAccount.data().loanTerm * getAccount.data().emiAmount;
        const amountInWords = numberToWords.toWords(outstandingAmount).replace(/\b\w/g, char => char.toUpperCase());
        const formattedWords = amountInWords.charAt(0).toUpperCase() + amountInWords.slice(1);
        const finalAmountText = `${outstandingAmount} (${formattedWords})`;

        try {
            // 1️⃣ Fetch data from DB (example)
            // Replace this with real DB call
            const dataFromDB = {
                date: new Date().toLocaleDateString(),
                bankName: bankData.bankName,
                bankAddress: bankData.address,
                bankRegCode: bankData.registrationCode,
                memberName: cifDetails?.data()?.name || "N/A",
                accountNo: getAccount?.data()?.account || "N/A",
                memberAddress: cifDetails?.data()?.address || "N/A",
                scheme: getAccount?.data()?.planDetails?.label || "N/A",
                openingDate: cifDetails?.data()?.date || "N/A",
                interestRate: getAccount?.data()?.planDetails?.interestRate || "N/A",
                statementPeriod: statementPeriod,
                outstandingBalance: finalAmountText,
                transactionsRow: generateTransactionRows(transactions),
            };

            // 2️⃣ Load HTML template
            let html = await fs.readFile('./routes/loan/loanPassbook.html', 'utf8');

            // 4️⃣ Inject data into HTML
            html = html
                .replace('{{bankName}}', dataFromDB.bankName)
                .replace('{{bankAddress}}', dataFromDB.bankAddress)
                .replace('{{bankRegCode}}', dataFromDB.bankRegCode)
                .replace('{{memberName}}', dataFromDB.memberName)
                .replace('{{accountNo}}', dataFromDB.accountNo)
                .replace('{{memberAddress}}', dataFromDB.memberAddress)
                .replace('{{scheme}}', dataFromDB.scheme)
                .replace('{{openingDate}}', dataFromDB.openingDate)
                .replace('{{interestRate}}', dataFromDB.interestRate)
                .replace('{{statementPeriod}}', dataFromDB.statementPeriod)
                .replace('{{outstandingBalance}}', dataFromDB.outstandingBalance)
                .replace('{{transactionsRow}}', dataFromDB.transactionsRow);

            // 5️⃣ Generate PDF
            const page = await browser.newPage();
            await page.setContent(html, { waitUntil: 'networkidle' });

            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
            });

            await page.close();

            // 6️⃣ Send PDF
            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename=report.pdf',
            });

            res.send(pdfBuffer);

        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'PDF generation failed' });
        }
    });
    // single user loan passbook print pdf from backend | end

    // group loan sanction letter | start
    app.get('/api/:loanType/:loanId/sanction-letter/print', async (req, res) => {
        try {
            const token = req.user;
            if (!token) {
                return res.status(401).send({ error: 'Unauthorized. Please log in.' });
            }

            const { loanId, loanType } = req.params;
            if (!loanId) {
                return res.status(400).json({ error: "Loan id missing" });
            }

            const accountType = loanType === 'group-loan' ? 'group' : 'loan';

            // 🔹 SAFE helper (MOST IMPORTANT)
            const safeData = (doc) => (doc && doc.exists ? doc.data() : {});

            // ================= BANK INFO =================
            const bankInfoDoc = await db
                .collection(token.bankId)
                .doc('admin')
                .collection('bank-info')
                .doc('details')
                .get();

            const bankData = safeData(bankInfoDoc);

            // ================= LOAN / KYC =================
            const kycDoc = await db
                .collection(token.bankId)
                .doc('accounts')
                .collection(loanType)
                .doc(loanId)
                .get();

            const memberData = safeData(kycDoc);

            // ================= MEMBER INFO =================
            const memberId = memberData?.applicants?.[0] || null;
            let memberInfoDta = {};

            if (memberId) {
                const memberInfoDoc = await db
                    .collection(token.bankId)
                    .doc('kyc')
                    .collection('member-kyc')
                    .doc(memberId)
                    .get();

                memberInfoDta = safeData(memberInfoDoc);
            }

            // ================= CENTER / GROUP DATA =================
            let centerHeadName = "";
            let groupHeadName = "";
            let associatedEmployeeName = "";
            console.log('ok');
            if (memberData?.groupId) {
                const centerHeadDoc = await db
                    .collection(token.bankId)
                    .doc('kyc')
                    .collection(accountType)
                    .doc(memberData.groupId)
                    .get();

                const centerHeadData = safeData(centerHeadDoc);

                // ----- Center Head -----
                if (centerHeadData?.centerHead) {
                    const centerHeadInfo = await db
                        .collection(token.bankId)
                        .doc('kyc')
                        .collection('member-kyc')
                        .doc(centerHeadData.centerHead)
                        .get();

                    centerHeadName = safeData(centerHeadInfo)?.name || "";
                }

                // ----- Group Head -----
                if (centerHeadData?.groupHead) {
                    const groupHeadInfo = await db
                        .collection(token.bankId)
                        .doc('kyc')
                        .collection('member-kyc')
                        .doc(centerHeadData.groupHead)
                        .get();

                    groupHeadName = safeData(groupHeadInfo)?.name || "";
                }

                // ----- Associated Employee -----
                if (centerHeadData?.associatedEmployee) {
                    const associatedEmployeeinfo = await db
                        .collection(token.bankId)
                        .doc('admin')
                        .collection('users')
                        .doc(centerHeadData.associatedEmployee)
                        .get();

                    associatedEmployeeName = safeData(associatedEmployeeinfo)?.name || "";
                }
            }
            const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>LOAN_SANCTION_LETTER</title>
                <style>
                @page {
                    size: A4 landscape;
                    margin: 10mm;
                }
                
                html, body {
                    width: 297mm;
                    /*height: 210mm;*/
                    margin: 0;
                    padding: 0;
                    font-family: Arial, Helvetica, sans-serif;
                }
                
                .page {
                    width: 100%;
                    height: 100%;
                }
                
                /* ---------- HEADINGS ---------- */
                h1 {
                    font-size: 20px;
                    font-weight: bold;
                    margin: 6px 0;
                    text-align: center;
                }
                
                h2 {
                    font-size: 15px;
                    margin: 5px 0;
                    text-align: center;
                }
                
                h3 {
                    font-size: 14px;
                    margin: 5px 0;
                    text-align: center;
                    text-decoration: underline;
                }
                
                /* ---------- ADDRESS ---------- */
                .address {
                    text-align: center;
                    font-size: 12.5px;
                    margin-bottom: 10px;
                }
                
                /* ---------- INFO ROW ---------- */
                .row {
                    display: flex;
                    justify-content: space-between;
                    font-size: 12.5px;
                    margin: 8px 0;
                }
                
                /* ---------- TABLE ---------- */
                table {
                    width: 100%;
                    border-collapse: collapse;
                    table-layout: auto;
                    margin-top: 10px;
                }
                
                th {
                    border: 1px solid #000;
                    padding: 6px 4px;
                    font-size: 9.5px;
                    font-weight: bold;
                    line-height: 1.3;
                    text-align: center;
                }
                
                td {
                    border: 1px solid #000;
                    padding: 8px 4px;          /* ⬆ increases row height */
                    font-size: 9.5px;          /* ⬆ readable size */
                    line-height: 1.4;          /* ⬆ better spacing */
                    text-align: center;
                    word-break: break-word;
                    vertical-align: middle;
                }
                
                .left {
                    text-align: left;
                }
                
                /* ---------- NOTES ---------- */
                .note {
                    font-size: 12px;
                    margin-top: 12px;
                    line-height: 1.5;
                    text-align: justify;
                }
                
                /* ---------- SIGNATURE ---------- */
                .signature-section {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 45px;
                    font-size: 12.5px;
                }
                
                .sign-box {
                    width: 30%;
                    text-align: center;
                    line-height: 1.6;
                }
                </style>

        </head>
        <body>
         <div class="page">
            <h1>${bankData.bankName}</h1>
        <div class="address">
            <p style="text-align: center">${bankData.address}</p>
            <p style="text-align: center">${bankData.registrationCode}</p>
        </div>

        <h2>GROUP LOAN APPLICATION FORM (Office Copy)</h2>
        <h3>LOAN SANCTION LETTER CUM DEMAND PROMISSORY NOTE</h3>

        <div class="row">
            <div><strong>Date of Disbursement:</strong> 03/10/2024</div>
            <div><strong>Meeting Day:</strong> Thursday &nbsp; <strong>Time:</strong> 12:00 AM</div>
        </div>

        <div class="note">
            We, the members of Group no G000005 at SAHAY CHANDAN Branch MACHHALI SHAHAR - 001 request apply to FINOTA
            GRAMEEN MICRO FINANCE PRIVATE LIMITED for the loans as given below and the contents are filled at my/our
            instruction and are read over and explained to me/us in language known to me/us and my/our group members by
            the Center Leader / Community Service Officer and made me/us understand. I/We authorize FINOTA GRAMEEN MICRO
            FINANCE PRIVATE LIMITED to transfer the loan amount in cash/NEFT to my/us account. I/We understand that I/We
            will receive the remaining loan amount as shown in below table after auto deduction of Loan Processing Fee
            (including applicable tax). I/We hereby make this loan application with my/our free will and consent to the
            declaration mentioned overleaf and make the following factual declarations which are true and correct. I/We
            cancel the loan, I undertake to refund the transferred loan amount to FINOTA GRAMEEN MICRO FINANCE PRIVATE
            LIMITED along with applicable interest if any.
        </div>

        <table>
            <tr>
                <th>Member Photo</th>
                <th>Member ID</th>
                <th>Loan ID</th>
                <th>Date of Application</th>
                <th>Member Name</th>
                <th>Loan Type</th>
                <th>Loan Amount</th>
                <th>Purpose</th>
                <th>Loan Cycle</th>
                <th>Tenure</th>
                <th>Bank Name / A/C No</th>
                <th>PF</th>
                <th>GST</th>
                <th>Legal</th>
                <th>Insur.</th>
                <th>Net Disbursement</th>
                <th>Disbursement Mode</th>
                <th>Revenue Stamp/Signature</th>
            </tr>

            <tr>
                <td></td>
                <td>${memberData?.applicants?.[0] || ""}</td>
                <td>${memberData?.account || ""}</td>
                <td>${memberData?.loanDate || ""}</td>
                <td>${memberInfoDta?.name || ""}</td>
                <td>${memberData?.planDetails?.type || ""}</td>
                <td>${memberData?.loanAmount || ""}</td>
                <td>${memberData?.planDetails?.name || ""}</td>
                <td>${memberData?.planDetails?.emiMode || ""}</td>
                <td>${memberData?.planDetails?.emiCount || ""}</td>
                <td></td>
                <td>${memberData?.deductionDetails?.processingFee || ""}</td>
                <td>${memberData?.deductionDetails?.gst || ""}</td>
                <td>${memberData?.deductionDetails?.legalAmount || ""}</td>
                <td>${memberData?.deductionDetails?.insuranceAmount || ""}</td>
                <td>${memberData?.disbursement || ""}</td>
                <td></td>
                <td></td>
            </tr>
        </table>

        <div class="note">
            <strong>FOR OFFICIAL PURPOSE ONLY:</strong><br>
            As requested by your loan application, we FINOTA GRAMEEN MICRO FINANCE PRIVATE LIMITED, hereby approve
            above-mentioned loan amount. The final agreement is subject to agreement of auto-debit of loan processing
            fee (including applicable tax) at the time of disbursement of the loan amount for above-mentioned purpose.
            The loan amount is repayable in 359 equal weekly/bi-weekly/monthly installments along with interest at the
            rate of 45 Percent (diminishing balance method) and the rate of interest payable by you is stated in the
            Loan Card.
        </div>

        <table>
            <tr>
                <th>S.No</th>
                <th>Group Code</th>
                <th>Loan ID</th>
                <th>Member Name</th>
                <th>Co-Insured Name</th>
                <th>Nominee Name</th>
                <th>Relationship</th>
                <th>Contact No</th>
                <th>Member Signature</th>
            </tr>
            <tr>
                <td>1</td>
                <td>${memberData?.groupId || ""}</td>
                <td>${memberData?.account || ""}</td>
                <td>${memberInfoDta?.name || ""}</td>
                <td></td>
                <td>${memberInfoDta?.nominee?.name || ""}</td>
                <td>${memberInfoDta?.nominee?.relation || ""}</td>
                <td>${memberInfoDta?.phone || ""}</td>
                <td></td>
            </tr>
        </table>
        <div class="signature-section">
            
            <div class="sign-box">
                Center Head Name:<br><strong>${centerHeadName}</strong><br><br>
                ____________________<br>
                Center Head Signature
            </div>
            <div class="sign-box">
                Group Head Name:<br><strong>${groupHeadName}</strong><br><br>
                ____________________<br>
                Group Head Signature
            </div>

            <div class="sign-box">
                CSO Name:<br><strong>${associatedEmployeeName}</strong><br><br>
                ____________________<br>
                CSO Signature
            </div>

            <div class="sign-box">
                BM Name:<br>
                Employee Code:<br><br>
                ____________________<br>
                Branch Manager Signature
            </div>
        </div>

    </div>
            
        </body>
        </html>
        `;

            const browser = await puppeteer.launch({
                headless: "new",
                args: ["--no-sandbox", "--disable-setuid-sandbox"],
            });

            const page = await browser.newPage();
            await page.setContent(html, { waitUntil: "networkidle0" });

            const pdfBuffer = await page.pdf({
                format: "A4",
                landscape: true,
                printBackground: true,
                preferCSSPageSize: true // ✅ VERY IMPORTANT
            });

            await browser.close();

            // 🚨 CRITICAL HEADERS
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader(
                "Content-Disposition",
                'attachment; filename="Perfect_Test.pdf"'
            );
            res.setHeader("Content-Length", pdfBuffer.length);

            // 🚨 CRITICAL SEND
            res.send(Buffer.from(pdfBuffer));

        } catch (err) {
            console.error(err);
            res.status(500).send("PDF generation failed");
        }
    });
    // group loan sanction letter | end


    app.get('/api/:type/foreclose/noc/:account', async (req, res) => {
        const token = req.user;
        if (!token) return res.status(401).send({ error: 'Unauthorized.' });

        const { type, account } = req.params;

        if (type !== 'loan' && type !== 'group-loan') {
            return res.status(400).send({
                error: "Invalid account type. Must be 'loan' or 'group-loan'."
            });
        }

        try {
            const loanRef = db.collection(token.bankId)
                .doc('accounts')
                .collection(type)
                .doc(account);
            const loanDoc = await loanRef.get();
            if (!loanDoc.exists) return res.status(404).send({ error: 'Loan not found.' });

            const data = loanDoc.data();
            if (!data.closed || data.closureType !== 'foreclosure') {
                return res.status(400).send({ error: 'Loan not foreclosed.' });
            }

            const kycDoc = await db.collection(token.bankId)
                .doc('kyc')
                .collection('member-kyc')
                .doc(data.applicants?.[0])
                .get();
            const memberName = kycDoc.exists ? kycDoc.data().name : 'N/A';

            const bankDoc = await db.collection(token.bankId)
                .doc('admin')
                .collection('bank-info')
                .doc('details')
                .get();
            const bankInfo = bankDoc.exists ? bankDoc.data() : {
                bankName: 'Your Financial Institution',
                address: 'Address not available',
                registrationCode: 'Registration not available',
                phone: 'Phone not available',
                email: 'Email not available',
                logo: 'https://via.placeholder.com/150'
            };

            const today = new Date().toLocaleDateString('en-IN');

            const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>No Objection Certificate</title>
  <style>
    body { 
      font-family: 'Times New Roman', serif; 
      margin: 0; 
      padding: 0;
      background: #fff; 
      color: #000; 
    }
    .container { 
      width: 210mm; /* A4 width */
      min-height: 297mm; /* A4 height */
      padding: 25mm 20mm 20mm 20mm; /* top, right, bottom, left */
      box-sizing: border-box;
      margin: 0 auto;
      border: 0.5px solid #999;
      position: relative;
    }
    .header { 
      text-align: center; 
      margin-bottom: 15px; 
    }
    .header img { 
      height: 60px; 
      margin-bottom: 8px; 
    }
    .header h1 { 
      margin: 3px 0; 
      font-size: 18px; 
      font-weight: bold; 
      text-transform: uppercase; 
    }
    .header p { 
      margin: 1px 0; 
      font-size: 11px; 
    }
    .title { 
      text-align: center; 
      font-size: 16px; 
      font-weight: bold; 
      margin: 18px 0 15px; 
      text-decoration: underline; 
    }
    .content { 
      font-size: 12px; 
      line-height: 1.5; 
      text-align: justify; 
    }
    .content p {
      margin: 8px 0;
    }
    .signature { 
      margin-top: 60px; 
      text-align: right; 
      font-size: 12px; 
    }
    .signature p { 
      margin: 2px 0; 
    }
    .footer { 
      text-align: center; 
      margin-top: 30px; 
      font-size: 10px; 
      color: #555; 
      border-top: 0.5px solid #ccc; 
      padding-top: 6px; 
    }
    /* Prevent overflow */
    @media print {
      body { -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${bankInfo.logo ? `<img src="${bankInfo.logo.trim()}" alt="Logo" />` : ''}
      <h1>${bankInfo.bankName}</h1>
      <p>${bankInfo.address}</p>
      <p><strong>Reg:</strong> ${bankInfo.registrationCode} | 
         <strong>Ph:</strong> ${bankInfo.phone} | 
         <strong>Email:</strong> ${bankInfo.email}</p>
    </div>

    <div class="title">No Objection Certificate (NOC)</div>

    <div class="content">
      <p>Date: <strong>${today}</strong></p>
      <p>To,<br>
      <strong>${memberName}</strong><br>
      Loan A/C No: <strong>${account}</strong></p>

      <p>Dear Sir/Madam,</p>

      <p>This is to certify that the above-mentioned loan account with our institution has been 
      <strong>closed on ${data.closedDate}</strong>. All dues including principal, interest, and applicable charges 
      have been received in full.</p>

      <p>We hereby confirm that <strong>${memberName}</strong> has no outstanding liabilities towards 
      <strong>${bankInfo.bankName}</strong> in respect of the said loan account. Accordingly, we issue this 
      <strong>No Objection Certificate (NOC)</strong> for your records.</p>

      <p>We thank you for your association with us and wish you success in your future endeavors.</p>
    </div>

    <div class="signature">
      <p>For ${bankInfo.bankName},</p>
      <p><br><br>________________________</p>
      <p>Authorized Signatory</p>
    </div>

    <div class="footer">
      <p>This is a computer-generated certificate and does not require a physical signature or seal.</p>
    </div>
  </div>
</body>
</html>`;

            const browser = await puppeteer.launch({
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
                headless: true
            });
            const page = await browser.newPage();

            await page.setViewport({ width: 1240, height: 1754 });
            await page.setContent(html, { waitUntil: 'networkidle0' });

            const pdf = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '0px',
                    bottom: '0px',
                    left: '0px',
                    right: '0px'
                },
                scale: 0.95,
            });

            await browser.close();

            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="NOC_${memberName}_${account}.pdf"`,
            });
            res.end(pdf);

        } catch (error) {
            console.error('PDF generation failed:', error);
            return res.status(500).send({ error: 'Failed to generate NOC.' });
        }
    });

    app.get('/api/loan/generate-agreement/:loanId', async (req, res) => {
        const token = req.user;
        if (!token) return res.status(401).send({ error: 'Unauthorized.' });

        const { loanId } = req.params;

        try {
            //Loan Account
            const loanRef = db.collection(token.bankId)
                .doc('accounts')
                .collection('loan')
                .doc(loanId);
            const loanSnap = await loanRef.get();

            if (!loanSnap.exists) {
                return res.status(404).send({ error: 'Loan account not found.' });
            }

            const loanData = loanSnap.data();

            //Fetch Borrower
            const kycDoc = await db.collection(token.bankId)
                .doc('kyc')
                .collection('member-kyc')
                .doc(loanData.applicants[0])
                .get();

            if (!kycDoc.exists) {
                return res.status(404).send({ error: 'Borrower KYC not found.' });
            }

            const borrower = kycDoc.data();

            // Fetch Co-Applicant
            const coApplicant = loanData.coApplicant || {};

            // Format Dates
            const agreementDate = new Date().toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });

            const disbursementDate = new Date(loanData.disbursementDate);
            const emiStartDate = new Date(disbursementDate);
            emiStartDate.setDate(emiStartDate.getDate() + 7); // First EMI
            const emiStartStr = emiStartDate.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });

            const loanEndDate = new Date(disbursementDate);
            loanEndDate.setMonth(loanEndDate.getMonth() + loanData.loanTerm);
            const loanEndStr = loanEndDate.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });

            // Format Numbers
            const formatINR = (num) => `Rs. ${parseFloat(num).toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}`;

            const numberToWords = (num) => {
                const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
                const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
                if ((num = num.toString()).length > 9) return 'overflow';
                let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
                if (!n) return;
                let str = '';
                str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
                str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
                str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
                str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
                str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
                return str + 'Rupees Only';
            };

            // Fetch Bank Info
            const bankInfoDoc = await db
                .collection(token.bankId)
                .doc('admin')
                .collection('bank-info')
                .doc('details')
                .get();

            const DEFAULT_BANK_INFO = {
                bankName: 'Your Financial Institution',
                address: 'Address not available',
                registrationCode: 'N/A',
                phone: 'N/A',
                email: 'N/A',
                logo: 'https://via.placeholder.com/150'
            };

            const bankInfo = bankInfoDoc.exists ? bankInfoDoc.data() : DEFAULT_BANK_INFO;

            // --- PDF Generation with pdf-lib ---
            const pdfDoc = await PDFDocument.create();
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

            const PAGE_WIDTH = 595.28; // A4 width
            const PAGE_HEIGHT = 841.89; // A4 height
            const MARGIN = 50;
            const CONTENT_WIDTH = PAGE_WIDTH - (MARGIN * 2);

            let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
            let y = PAGE_HEIGHT - MARGIN;

            const drawText = (text, x, y, options = {}) => {
                page.drawText(String(text), {
                    x,
                    y,
                    size: options.size || 10,
                    font: options.font || font,
                    color: options.color || rgb(0, 0, 0),
                    ...options,
                });
            };

            // Helper to wrap text
            const wrapText = (text, maxWidth, fontSize, fontToUse) => {
                const words = text.split(' ');
                let lines = [];
                let currentLine = words[0];

                for (let i = 1; i < words.length; i++) {
                    const word = words[i];
                    const width = fontToUse.widthOfTextAtSize(currentLine + " " + word, fontSize);
                    if (width < maxWidth) {
                        currentLine += " " + word;
                    } else {
                        lines.push(currentLine);
                        currentLine = word;
                    }
                }
                lines.push(currentLine);
                return lines;
            };

            const drawWrappedText = (text, x, y, maxWidth, options = {}) => {
                const fontSize = options.size || 10;
                const fontToUse = options.font || font;
                const lineHeight = fontSize * 1.4;

                // Handle newlines in text first
                const paragraphs = text.split('\n');
                let currentY = y;

                paragraphs.forEach(paragraph => {
                    if (paragraph.trim() === '') {
                        currentY -= lineHeight; // Empty line spacing
                        return;
                    }

                    const lines = wrapText(paragraph, maxWidth, fontSize, fontToUse);
                    lines.forEach(line => {
                        if (currentY < MARGIN + 40) {
                            page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
                            currentY = PAGE_HEIGHT - MARGIN;
                        }
                        drawText(line, x, currentY, { ...options, font: fontToUse });
                        currentY -= lineHeight;
                    });
                });
                return currentY;
            };

            // --- Draw Content ---

            // Header
            const bankNameText = bankInfo.bankName.toUpperCase();
            const bankNameWidth = boldFont.widthOfTextAtSize(bankNameText, 16);
            drawText(bankNameText, (PAGE_WIDTH - bankNameWidth) / 2, y, { size: 16, font: boldFont, color: rgb(0.04, 0.2, 0.45) });
            y -= 20;

            const addressText = bankInfo.address;
            const addressWidth = font.widthOfTextAtSize(addressText, 10);
            drawText(addressText, (PAGE_WIDTH - addressWidth) / 2, y, { size: 10, color: rgb(0.4, 0.4, 0.4) });
            y -= 15;

            const regText = `Reg: ${bankInfo.registrationCode} | Ph: ${bankInfo.phone} | Email: ${bankInfo.email}`;
            const regWidth = font.widthOfTextAtSize(regText, 9);
            drawText(regText, (PAGE_WIDTH - regWidth) / 2, y, { size: 9, color: rgb(0.4, 0.4, 0.4) });
            y -= 10;

            // Draw Separator Line
            page.drawLine({
                start: { x: MARGIN, y: y },
                end: { x: PAGE_WIDTH - MARGIN, y: y },
                thickness: 1,
                color: rgb(0, 0, 0),
            });
            y -= 30;


            // Title
            const titleText = 'LOAN AGREEMENT';
            const titleWidth = boldFont.widthOfTextAtSize(titleText, 16);
            drawText(titleText, (PAGE_WIDTH - titleWidth) / 2, y, { size: 16, font: boldFont, underline: true });
            y -= 40;

            // Agreement Date
            const dateClause = `THIS LOAN AGREEMENT (this "Agreement") dated this ${agreementDate.split(' ')[0]} day of ${agreementDate.split(' ')[1]}, ${agreementDate.split(' ')[2]}`;
            y = drawWrappedText(dateClause, MARGIN, y, CONTENT_WIDTH, { size: 10, font: boldFont });
            y -= 20;

            // Parties
            y = drawWrappedText(`BETWEEN: ${bankInfo.bankName} of ${bankInfo.address} (the "Lender")`, MARGIN, y, CONTENT_WIDTH, { font: boldFont });
            y -= 15;
            drawText('AND', MARGIN, y, { font: boldFont });
            y -= 15;

            let borrowerText = `${borrower.name} S/o, D/o, W/o ${borrower.guardian || 'N/A'}, Aged ${borrower.age || 'N/A'} years, Resident of ${borrower.address || 'N/A'}`;
            if (coApplicant.coApplicantname) {
                borrowerText += `\nAND\n${coApplicant.coApplicantname} S/o, D/o, W/o ${coApplicant.memberCode || 'N/A'}, Aged N/A years, Resident of ${coApplicant.address || 'N/A'}`;
            }
            borrowerText += '\n(collectively and individually the "Borrower")';

            y = drawWrappedText(borrowerText, MARGIN, y, CONTENT_WIDTH, {});
            y -= 20;

            // Clauses
            y = drawWrappedText('IN CONSIDERATION OF the Lender loaning certain money (the "Loan") to the Borrower, and the Borrower repaying the Loan to the Lender, the parties agree to keep, perform and fulfil the promises and conditions set out in this Agreement:', MARGIN, y, CONTENT_WIDTH, {});
            y -= 15;

            // 1. Loan Amount
            y = drawWrappedText('Loan Amount & Interest', MARGIN, y, CONTENT_WIDTH, { font: boldFont });
            y -= 5;
            const clause1 = `1. The Lender promises ${formatINR(loanData.loanAmount)} (Rupees ${numberToWords(loanData.loanAmount).toUpperCase()}) to the Borrower and the Borrower promises to repay this principal amount to the Lender, with interest payable on the unpaid principal at the rate of ${loanData.planDetails.interestRate}% per annum, calculated yearly not in advance, beginning on ${agreementDate}.`;
            y = drawWrappedText(clause1, MARGIN, y, CONTENT_WIDTH, {});
            y -= 10;
            y = drawWrappedText('2. The individual Borrowers are jointly and severally liable to the Lender for the full principal amount, plus the applicable interest.', MARGIN, y, CONTENT_WIDTH, {});
            y -= 15;

            // Payment
            y = drawWrappedText('Payment', MARGIN, y, CONTENT_WIDTH, { font: boldFont });
            y -= 5;
            const clause3 = `3. This Loan will be repaid in consecutive ${loanData.planDetails.emiMode} instalments of principal and interest commencing on ${emiStartStr}, and continuing on the Sunday of each following week until ${loanEndStr}, with the balance then owing under this Agreement being paid at that time.`;
            y = drawWrappedText(clause3, MARGIN, y, CONTENT_WIDTH, {});
            y -= 10;
            y = drawWrappedText('4. At any time while not in default under this Agreement, the Borrower may make lump sum payments or pay the outstanding balance then owing under this Agreement to the Lender without further bonus or penalty.', MARGIN, y, CONTENT_WIDTH, {});
            y -= 15;

            // Late Payment
            y = drawWrappedText('Late Payment', MARGIN, y, CONTENT_WIDTH, { font: boldFont });
            y -= 5;
            const clause5 = `5. Should the Borrower fail to make a payment within 7 days of the date it is due, a late fee of ${formatINR(loanData.planDetails.penaltyRate)} INR will be charged to the Borrower.`;
            y = drawWrappedText(clause5, MARGIN, y, CONTENT_WIDTH, {});
            y -= 15;

            // Default
            y = drawWrappedText('Default', MARGIN, y, CONTENT_WIDTH, { font: boldFont });
            y -= 5;
            y = drawWrappedText('6. Notwithstanding anything to the contrary in this Agreement, if the Borrower defaults in the performance of any obligation under this Agreement, the Lender may declare the principal amount outstanding and any accrued interest to be immediately due and payable.', MARGIN, y, CONTENT_WIDTH, {});
            y -= 10;
            y = drawWrappedText('7. Further, if the Lender declares the principal amount owing under this Agreement to be immediately due and payable, and the Borrower fails to provide full payment within 7 days, the Borrower will be charged a Rs. ............ INR late fee.', MARGIN, y, CONTENT_WIDTH, {});
            y -= 15;

            // Governing Law
            y = drawWrappedText('Governing Law', MARGIN, y, CONTENT_WIDTH, { font: boldFont });
            y -= 5;
            y = drawWrappedText('8. This Agreement will be construed in accordance with and governed by the laws of the State of West Bengal.', MARGIN, y, CONTENT_WIDTH, {});
            y -= 15;

            // Costs
            y = drawWrappedText('Costs', MARGIN, y, CONTENT_WIDTH, { font: boldFont });
            y -= 5;
            y = drawWrappedText('9. The Borrower shall be liable for all costs, expenses and expenditures incurred including, without limitation, the complete legal costs of the Lender incurred by enforcing this Agreement as a result of any default by the Borrower and such costs will be added to the principal then outstanding and shall be due and payable by the Borrower to the Lender immediately upon demand of the Lender.', MARGIN, y, CONTENT_WIDTH, {});
            y -= 15;

            // Binding Effect
            y = drawWrappedText('Binding Effect', MARGIN, y, CONTENT_WIDTH, { font: boldFont });
            y -= 5;
            y = drawWrappedText('10. This Agreement will pass to the benefit of and be binding upon the respective heirs, executors, administrators, successors and permitted assigns of the Borrower and Lender. The Borrower waives presentment for payment, notice of non-payment, protest, and notice of protest.', MARGIN, y, CONTENT_WIDTH, {});
            y -= 15;

            // Amendments
            y = drawWrappedText('Amendments', MARGIN, y, CONTENT_WIDTH, { font: boldFont });
            y -= 5;
            y = drawWrappedText('11. This Agreement may only be amended or modified by a written instrument executed by both the Borrower and the Lender.', MARGIN, y, CONTENT_WIDTH, {});
            y -= 15;

            // Severability
            y = drawWrappedText('Severability', MARGIN, y, CONTENT_WIDTH, { font: boldFont });
            y -= 5;
            y = drawWrappedText('12. The clauses and paragraphs contained in this Agreement are intended to be read and construed independently of each other. If any term, covenant, condition or provision of this Agreement is held by a court of competent jurisdiction to be invalid, void or unenforceable, it is the parties\' intent that such provision be reduced in scope by the court only to the extent deemed necessary by that court to render the provision reasonable and enforceable and the remainder of the provisions of this Agreement will in no way be affected, impaired or invalidated as a result.', MARGIN, y, CONTENT_WIDTH, {});
            y -= 40;

            // Signatures
            if (y < MARGIN + 100) {
                page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
                y = PAGE_HEIGHT - MARGIN;
            }

            drawText('Signature of Borrower', MARGIN, y, { font: boldFont });
            drawText('Signature of Lender', PAGE_WIDTH - MARGIN - 150, y, { font: boldFont });
            y -= 50;
            drawText('_______________________', MARGIN, y, {});
            drawText('_______________________', PAGE_WIDTH - MARGIN - 150, y, {});
            y -= 40;

            drawText('Witness 1', MARGIN, y, { font: boldFont });
            drawText('Witness 2', PAGE_WIDTH - MARGIN - 150, y, { font: boldFont });
            y -= 50;
            drawText('_______________________', MARGIN, y, {});
            drawText('_______________________', PAGE_WIDTH - MARGIN - 150, y, {});


            const pdfBytes = await pdfDoc.save();

            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="Loan_Agreement_${loanId}.pdf"`,
            });
            res.end(Buffer.from(pdfBytes));

        } catch (error) {
            console.error('Failed to generate loan agreement:', error);
            return res.status(500).send({ error: 'Failed to generate agreement.' });
        }
    });

    app.get('/api/loan/generate-sanction-letter/:loanId', async (req, res) => {
        const token = req.user;
        if (!token) return res.status(401).send({ error: 'Unauthorized.' });

        const { loanId } = req.params;

        try {
            // Fetch Loan Account
            const loanRef = db.collection(token.bankId)
                .doc('accounts')
                .collection('loan')
                .doc(loanId);
            const loanSnap = await loanRef.get();

            if (!loanSnap.exists) {
                return res.status(404).send({ error: 'Loan account not found.' });
            }

            const loanData = loanSnap.data();

            // Fetch Borrower (Main Applicant)
            const kycDoc = await db.collection(token.bankId)
                .doc('kyc')
                .collection('member-kyc')
                .doc(loanData.applicants[0])
                .get();

            if (!kycDoc.exists) {
                return res.status(404).send({ error: 'Borrower KYC not found.' });
            }

            const borrower = kycDoc.data();

            // Fetch Co-Applicant (if exists)
            const coApplicant = loanData.coApplicant || {};

            // Format Dates
            const sanctionDate = new Date().toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });

            const disbursementDate = new Date(loanData.disbursementDate);
            const emiStartDate = new Date(disbursementDate);
            emiStartDate.setDate(emiStartDate.getDate() + 7); // First EMI after 7 days
            const emiStartStr = emiStartDate.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });

            // Calculate end date based on actual EMI count
            const totalEMIs = parseInt(loanData.planDetails.emiCount) || 0;
            const emiInterval = loanData.planDetails.emiInterval === 'week' ? 'weeks' : 'months';
            const loanEndDate = new Date(disbursementDate);
            loanEndDate.setDate(loanEndDate.getDate() + (totalEMIs * (emiInterval === 'week' ? 7 : 30)));
            const loanEndStr = loanEndDate.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });

            // Format Numbers
            const formatINR = (num) => `Rs. ${parseFloat(num).toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}`;

            const numberToWords = (num) => {
                const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
                const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
                if ((num = num.toString()).length > 9) return 'overflow';
                let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
                if (!n) return;
                let str = '';
                str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
                str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
                str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
                str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
                str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
                return str + 'Rupees Only';
            };

            // Fetch Bank Info
            const bankInfoDoc = await db
                .collection(token.bankId)
                .doc('admin')
                .collection('bank-info')
                .doc('details')
                .get();

            const DEFAULT_BANK_INFO = {
                bankName: 'New Bank',
                address: 'New',
                registrationCode: 'N/A',
                phone: 'N/A',
                email: 'N/A',
                logo: 'https://via.placeholder.com/150'
            };

            const bankInfo = bankInfoDoc.exists ? bankInfoDoc.data() : DEFAULT_BANK_INFO;

            // Financial Summary
            const loanAmount = parseFloat(loanData.loanAmount);
            const emiAmount = parseFloat(loanData.emiAmount);
            const totalEMIsCount = parseInt(loanData.planDetails.emiCount) || 0;
            const totalRepayment = emiAmount * totalEMIsCount;
            const totalFees = parseFloat(loanData.deductionDetails.processingFee || 0) +
                parseFloat(loanData.deductionDetails.insuranceAmount || 0) +
                parseFloat(loanData.deductionDetails.legalAmount || 0);
            const netDisbursed = loanAmount - totalFees;

            // Extract Plan Details
            const plan = loanData.planDetails || {};
            const interestRate = plan.interestRate || '0';
            const calculationMethod = plan.calculationMethod || 'Flat';
            const productName = plan.name || 'Unspecified Product';
            const planId = plan.id || 'N/A';

            // --- PDF Generation with pdf-lib ---
            const pdfDoc = await PDFDocument.create();
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

            const PAGE_WIDTH = 595.28; // A4 width
            const PAGE_HEIGHT = 841.89; // A4 height
            const MARGIN = 50;
            const CONTENT_WIDTH = PAGE_WIDTH - (MARGIN * 2);

            let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
            let y = PAGE_HEIGHT - MARGIN;

            const drawText = (text, x, y, options = {}) => {
                page.drawText(String(text), {
                    x,
                    y,
                    size: options.size || 10,
                    font: options.font || font,
                    color: options.color || rgb(0, 0, 0),
                    ...options,
                });
            };

            const drawWrappedText = (text, x, y, maxWidth, options = {}) => {
                const fontSize = options.size || 10;
                const fontToUse = options.font || font;
                const lineHeight = fontSize * 1.4;

                const paragraphs = text.split('\n');
                let currentY = y;

                // Simple wrap helper
                const wrapText = (txt, maxW) => {
                    const words = txt.split(' ');
                    let lines = [];
                    let currentLine = words[0];
                    for (let i = 1; i < words.length; i++) {
                        const word = words[i];
                        const width = fontToUse.widthOfTextAtSize(currentLine + " " + word, fontSize);
                        if (width < maxW) {
                            currentLine += " " + word;
                        } else {
                            lines.push(currentLine);
                            currentLine = word;
                        }
                    }
                    lines.push(currentLine);
                    return lines;
                };

                paragraphs.forEach(paragraph => {
                    if (paragraph.trim() === '') {
                        currentY -= lineHeight;
                        return;
                    }
                    const lines = wrapText(paragraph, maxWidth);
                    lines.forEach(line => {
                        if (currentY < MARGIN + 40) {
                            page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
                            currentY = PAGE_HEIGHT - MARGIN;
                        }
                        drawText(line, x, currentY, { ...options, font: fontToUse });
                        currentY -= lineHeight;
                    });
                });
                return currentY;
            };

            // --- Draw Content ---

            // Header (Bank Info)
            const bankNameText = bankInfo.bankName.toUpperCase();
            const bankNameWidth = boldFont.widthOfTextAtSize(bankNameText, 16);
            drawText(bankNameText, (PAGE_WIDTH - bankNameWidth) / 2, y, { size: 16, font: boldFont, color: rgb(0.04, 0.2, 0.45) });
            y -= 20;

            const addressText = bankInfo.address;
            const addressWidth = font.widthOfTextAtSize(addressText, 10);
            drawText(addressText, (PAGE_WIDTH - addressWidth) / 2, y, { size: 10, color: rgb(0.4, 0.4, 0.4) });
            y -= 15;

            const regText = `Reg: ${bankInfo.registrationCode} | Ph: ${bankInfo.phone} | Email: ${bankInfo.email}`;
            const regWidth = font.widthOfTextAtSize(regText, 9);
            drawText(regText, (PAGE_WIDTH - regWidth) / 2, y, { size: 9, color: rgb(0.4, 0.4, 0.4) });
            y -= 10;

            // Header Divider
            page.drawLine({
                start: { x: MARGIN, y: y },
                end: { x: PAGE_WIDTH - MARGIN, y: y },
                thickness: 1,
                color: rgb(0, 0, 0),
            });
            y -= 30;

            // Ref No & Date
            drawText(`Ref No: ${loanId}`, MARGIN, y, { font: boldFont });
            drawText(`Date: ${sanctionDate}`, PAGE_WIDTH - MARGIN - 150, y, { font: boldFont });
            y -= 30;

            // Title
            const titleText = 'LOAN SANCTION LETTER';
            const titleWidth = boldFont.widthOfTextAtSize(titleText, 16);
            drawText(titleText, (PAGE_WIDTH - titleWidth) / 2, y, { size: 16, font: boldFont, underline: true, color: rgb(0.04, 0.2, 0.45) });
            y -= 40;

            // To Address
            drawText('To,', MARGIN, y, {});
            y -= 15;
            drawText(borrower.name, MARGIN, y, { font: boldFont });
            y -= 15;
            drawText(borrower.address || 'N/A', MARGIN, y, {});
            y -= 15;
            drawText(`Contact: ${borrower.phone || 'N/A'}`, MARGIN, y, {});
            y -= 30;

            // Intro
            drawText(`Dear ${borrower.name},`, MARGIN, y, {});
            y -= 20;
            y = drawWrappedText(`Sub: Sanction of Loan under ${productName} Scheme`, MARGIN, y, CONTENT_WIDTH, { font: boldFont });
            y -= 15;
            y = drawWrappedText(`With reference to your application dated ${new Date(loanData.applicationDate).toLocaleDateString('en-IN')} and subsequent discussions, we are pleased to inform you that our bank has sanctioned the following credit facility to you, subject to the terms and conditions mentioned herein and those stipulated in the loan agreement.`, MARGIN, y, CONTENT_WIDTH, {});
            y -= 20;

            // Section A: Loan Details Table
            drawText('A. LOAN DETAILS', MARGIN, y, { font: boldFont, color: rgb(0.04, 0.2, 0.45) });
            y -= 20;

            const tableRows = [
                ['Particulars', 'Details'],
                ['Loan Account Number', loanId],
                ['Loan Scheme/Product', `${productName} (${planId})`],
                ['Sanctioned Amount', `${formatINR(loanAmount)} (${numberToWords(loanAmount).toUpperCase()})`],
                ['Rate of Interest', `${interestRate}% per annum (${calculationMethod})`],
                ['Processing Fees', formatINR(loanData.deductionDetails.processingFee || 0)],
                ['Insurance Charges', formatINR(loanData.deductionDetails.insuranceAmount || 0)],
                ['Other Charges', formatINR(loanData.deductionDetails.legalAmount || 0)],
                ['Net Disbursement Amount', formatINR(netDisbursed)],
                ['Repayment Tenure', `${totalEMIsCount} ${emiInterval}`],
                ['EMI Amount', `${formatINR(emiAmount)} per ${emiInterval.slice(0, -1)}`],
                ['Total Repayment Amount', formatINR(totalRepayment)],
                ['First EMI Date', emiStartStr],
                ['Last EMI Date', loanEndStr]
            ];

            const col1Width = 180;
            const col2Width = 300;
            const rowHeight = 20;

            tableRows.forEach((row, index) => {
                if (y < MARGIN + rowHeight) {
                    page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
                    y = PAGE_HEIGHT - MARGIN;
                }
                const isHeader = index === 0;
                const fontToUse = isHeader ? boldFont : font;

                // Draw cell borders
                page.drawRectangle({
                    x: MARGIN,
                    y: y - rowHeight + 5,
                    width: col1Width,
                    height: rowHeight,
                    borderColor: rgb(0, 0, 0),
                    borderWidth: 1,
                    color: isHeader ? rgb(0.9, 0.95, 1) : undefined
                });
                page.drawRectangle({
                    x: MARGIN + col1Width,
                    y: y - rowHeight + 5,
                    width: col2Width,
                    height: rowHeight,
                    borderColor: rgb(0, 0, 0),
                    borderWidth: 1,
                    color: isHeader ? rgb(0.9, 0.95, 1) : undefined
                });

                // Draw Text
                drawText(row[0], MARGIN + 5, y - 8, { font: fontToUse });
                // Simple truncate for Col 2 if too long, or usually it fits.
                // For proper wrap in cell we would need more logic, but for now assuming fits or single line ok.
                const val = String(row[1]);
                if (fontToUse.widthOfTextAtSize(val, 10) > col2Width - 10) {
                    drawText(val, MARGIN + col1Width + 5, y - 8, { font: fontToUse, size: 8 }); // shrink to fit if needed
                } else {
                    drawText(val, MARGIN + col1Width + 5, y - 8, { font: fontToUse });
                }

                y -= rowHeight;
            });
            y -= 20;

            // Section B: General Terms
            if (y < MARGIN + 100) {
                page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
                y = PAGE_HEIGHT - MARGIN;
            }

            drawText('B. GENERAL TERMS & CONDITIONS', MARGIN, y, { font: boldFont, color: rgb(0.04, 0.2, 0.45) });
            y -= 15;

            const terms = [
                '1. The loan is subject to the terms and conditions of the loan agreement to be executed.',
                `2. Interest will be charged at the rate mentioned above on a ${calculationMethod.toLowerCase()} basis.`,
                `3. A penalty of ${plan.penaltyRate}% ${plan.penaltyType} will be levied on overdue EMIs.`,
                '4. The loan must be utilized solely for the purpose stated in the application.',
                '5. The bank reserves the right to recall the entire outstanding amount if any information provided by you is found to be incorrect.',
                '6. Any change in your address/contact details must be communicated to the bank immediately.',
                '7. Original documents submitted will be returned after the closure of the loan account.'
            ];

            terms.forEach(term => {
                y = drawWrappedText(term, MARGIN, y, CONTENT_WIDTH, {});
                y -= 10;
            });

            if (coApplicant.coApplicantname) {
                y -= 10;
                y = drawWrappedText(`Note: This loan is jointly sanctioned to ${borrower.name} and ${coApplicant.coApplicantname}, who will be jointly and severally liable for repayment of the entire loan amount along with interest and other charges.`, MARGIN, y, CONTENT_WIDTH, { font: boldFont });
            }

            y -= 20;
            y = drawWrappedText('The disbursement will be made to your registered bank account after completion of all formalities and execution of loan documents.', MARGIN, y, CONTENT_WIDTH, {});
            y -= 15;
            y = drawWrappedText('Please sign the duplicate copy of this sanction letter as a token of your acceptance of the above terms and conditions.', MARGIN, y, CONTENT_WIDTH, {});
            y -= 30;

            drawText('Thanking you,', MARGIN, y, {});
            y -= 40;

            // Signatures
            if (y < MARGIN + 100) {
                page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
                y = PAGE_HEIGHT - MARGIN;
            }

            drawText('Yours faithfully,', PAGE_WIDTH - MARGIN - 200, y, {});
            y -= 15;
            drawText(`For ${bankInfo.bankName}`, PAGE_WIDTH - MARGIN - 200, y, { font: boldFont });
            y -= 50;
            drawText('_______________________', PAGE_WIDTH - MARGIN - 200, y, {});
            y -= 15;
            drawText('Authorized Signatory', PAGE_WIDTH - MARGIN - 200, y, {});

            // Footer
            y = 30;
            drawText('This is a computer-generated document. No signature is required.', MARGIN, y, { size: 8, color: rgb(0.5, 0.5, 0.5), align: 'center' }); // Align center calc manually or just put at margin
            // Centering footer manually
            const footerText = `${bankInfo.bankName} | ${bankInfo.address} | Phone: ${bankInfo.phone}`;
            const footerW = font.widthOfTextAtSize(footerText, 8);
            drawText(footerText, (PAGE_WIDTH - footerW) / 2, y - 10, { size: 8, color: rgb(0.6, 0.6, 0.6) });

            const pdfBytes = await pdfDoc.save();

            // Send PDF
            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="Loan_Sanction_Letter_${loanId}.pdf"`,
            });
            res.end(Buffer.from(pdfBytes));

        } catch (error) {
            console.error('Failed to generate loan sanction letter:', error);
            return res.status(500).send({ error: 'Failed to generate sanction letter.', details: error.message });
        }
    });

    app.post('/api/loan/get-employee-associated-accounts', async (req, res) => {
        const token = req.user;
        const { employeeId } = req.body;

        if (!token) {
            return res.status(401).send({ error: 'Unauthorized. Please log in.' });
        }
        if (!employeeId) {
            return res.status(400).send({ error: 'Missing employee ID! Please Select an employee to continue.' });
        }

        try {
            const loanAccounts = await db
                .collection(token.bankId)
                .doc('accounts')
                .collection('loan')
                .where('closed', '==', false)
                .where('associatedEmployee', '==', employeeId)
                .get();

            const accounts = [];

            for (const doc of loanAccounts.docs) {
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
                    installmentAmount: account.emiAmount,
                    interestInstallment: account.interestEMI,
                    principleInstallment: account.principleEMI,
                    openingDate: account.disbursementDate || account.openingDate,
                    referrer: account.referrer,
                    termPeriod: account.totalEMI,
                    emiMode: account.planDetails?.emiMode,
                    installment: (parseInt(account.paidEMI) || 0).toString(),
                };

                accounts.push(transformed);
            }
            res.send({ success: true, accountDetails: accounts });
        } catch (error) {
            console.error('Error fetching employee associated accounts:', error);
            return res.status(500).json({ error: 'Server error. Try again...' });
        }
    });

    app.post('/api/reports/loan/search-accounts', async (req, res) => {
        const token = req.user;

        if (!token) {
            return res.status(401).send({ error: 'Unauthorized. Please log in.' });
        }

        const accountList = [];
        const memberList = [];
        const bankId = token.bankId;
        const searchKeyword = req.body.search.toUpperCase();

        try {
            // Fetch By Account Number
            const accountInfo = await db.collection(bankId).doc('accounts').collection(req.body.accountType).doc(searchKeyword).get();
            if (accountInfo.exists) {
                const kycInfo = await db.collection(bankId).doc('kyc').collection('member-kyc').doc(accountInfo.data().applicants[0]).get();
                if (kycInfo.exists) {
                    if (accountInfo.data().closed === false) {
                        accountList.push({
                            cif: accountInfo.data().applicants[0],
                            name: kycInfo.data().name,
                            label: `${kycInfo.data().name} - ${searchKeyword}`,
                            key: searchKeyword,
                            groupId: kycInfo.data().group,
                            groupName: '',
                            account: searchKeyword,
                            installmentAmount: accountInfo.data().emiAmount,
                            interestInstallment: accountInfo.data().interestEMI,
                            principleInstallment: accountInfo.data().principleEMI,
                            emiMode: accountInfo.data().planDetails?.emiMode,
                            openingDate: accountInfo.data().disbursementDate || accountInfo.data().openingDate,
                            termPeriod: accountInfo.data().totalEMI,
                            installment: (parseInt(accountInfo.data().paidEMI) || 0).toString(),
                        })
                    }
                }
            }

            const nextValue = searchKeyword.slice(0, -1) + String.fromCharCode(searchKeyword.slice(-1).charCodeAt(0) + 1);
            const searchByName = await db.collection(bankId).doc('kyc').collection('member-kyc').where('name', '>=', searchKeyword).where('name', '<', nextValue).get();
            searchByName.forEach(doc => {
                const data = doc.data();
                memberList.push({
                    id: doc.id,
                    ...data,
                });
            });

            const searchByPhone = await db.collection(bankId).doc('kyc').collection('member-kyc').where('phone', '>=', searchKeyword).where('phone', '<', nextValue).get();
            searchByPhone.forEach(doc => {
                const data = doc.data();
                memberList.push({
                    id: doc.id,
                    ...data,
                });
            });

            const searchByAadhar = await db.collection(bankId).doc('kyc').collection('member-kyc').where('aadhar', '>=', searchKeyword).where('aadhar', '<', nextValue).get();
            searchByAadhar.forEach(doc => {
                const data = doc.data();
                memberList.push({
                    id: doc.id,
                    ...data,
                });
            });

            const searchByPAN = await db.collection(bankId).doc('kyc').collection('member-kyc').where('pan', '>=', searchKeyword).where('pan', '<', nextValue).get();
            searchByPAN.forEach(doc => {
                const data = doc.data();
                memberList.push({
                    id: doc.id,
                    ...data,
                });
            });

            const searchByVoter = await db.collection(bankId).doc('kyc').collection('member-kyc').where('voter', '>=', searchKeyword).where('voter', '<', nextValue).get();
            searchByVoter.forEach(doc => {
                const data = doc.data();
                memberList.push({
                    id: doc.id,
                    ...data,
                });
            });

            for (let i = 0; i < memberList.length; i++) {
                const accountRef = await db.collection(bankId).doc('accounts').collection(req.body.accountType).where('applicants', 'array-contains', memberList[i].id).get();
                accountRef.forEach(account => {
                    if (account.data().closed === false) {
                        accountList.push({
                            cif: memberList[i].id,
                            name: memberList[i].name,
                            label: `${memberList[i].name} - ${account.id}`,
                            key: account.id,
                            groupId: memberList[i].group,
                            groupName: '',
                            account: account.id,
                            installmentAmount: account.data().emiAmount,
                            interestInstallment: account.data().interestEMI,
                            principleInstallment: account.data().principleEMI,
                            openingDate: account.data().disbursementDate || account.data().openingDate,
                            termPeriod: account.data().totalEMI,
                            installment: (parseInt(account.data().paidEMI) || 0).toString(),
                        });
                    }
                });
            }

            res.send({ success: true, accounts: accountList });
        } catch (error) {
            return res.status(500).json({ error: 'Server error. Try again...' });
        }
    });


    const addDays = (date, days) => {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    };

    app.get('/api/reports/loan/demand-sheet/:date', async (req, res) => {
        const token = req.user;
        if (!token) return res.status(401).send({ error: 'You are not authorized. Please log in.' });

        const targetDateString = req.params.date;

        const parseLocalDate = (dateStr) => {
            const [y, m, d] = dateStr.split('-').map(Number);
            return new Date(y, m - 1, d);
        };

        const targetDate = parseLocalDate(targetDateString);
        if (isNaN(targetDate.getTime())) {
            return res.status(400).send({ error: 'Invalid date format. Use YYYY-MM-DD.' });
        }

        const requestedLoanType = req.query.loanType;
        const requestedEmployeeId = req.query.employeeId;

        const validLoanTypes = ['day', 'week', 'fortnight', 'month'];
        if (requestedLoanType && !validLoanTypes.includes(requestedLoanType)) {
            return res.status(400).send({ error: 'Invalid loanType. Use: day, week, fortnight, or month.' });
        }

        const isSameDay = (d1, d2) => {
            return d1.getFullYear() === d2.getFullYear() &&
                d1.getMonth() === d2.getMonth() &&
                d1.getDate() === d2.getDate();
        };

        const addMonths = (date, months) => {
            const result = new Date(date);
            const day = result.getDate();
            result.setMonth(result.getMonth() + months);
            if (result.getDate() !== day) {
                result.setDate(0);
            }
            return result;
        };

        try {
            const employees = { 'N/A': 'Unassigned' };
            const empSnapshot = await db
                .collection(token.bankId)
                .doc('admin')
                .collection('users')
                .get();

            empSnapshot.forEach(doc => {
                const empData = doc.data();
                employees[doc.id] = empData.name || doc.id;
            });

            const demandRows = [];
            const accountTypes = ['loan'];

            for (const accountType of accountTypes) {
                let q = db
                    .collection(token.bankId)
                    .doc('accounts')
                    .collection(accountType)
                    .where('closed', '==', false);

                if (requestedEmployeeId && requestedEmployeeId !== 'all' && requestedEmployeeId !== '') {
                    q = q.where('associatedEmployee', '==', requestedEmployeeId);
                }

                const snapshot = await q.get();

                for (const doc of snapshot.docs) {
                    const loan = doc.data();
                    const account = doc.id;

                    if ((loan.paidEMI || 0) >= (loan.totalEMI || 0)) continue;

                    const {
                        applicants,
                        firstEmiDate,
                        emiAmount = 0,
                        principleEMI = 0,
                        interestEMI = 0,
                        totalEMI = 0,
                        planDetails = {},
                        associatedEmployee,
                        remainingBalance = 0,
                        partialEmiDueAmount = 0,
                        disbursement,
                        loanAmount,
                        disbursementDate
                    } = loan;

                    let effectiveFirstEmiDate = firstEmiDate || loan[' firstEmiDate'] || loan['  firstEmiDate'];

                    const interval = (planDetails.emiInterval || '').toLowerCase().trim();
                    if (!interval) continue;

                    // Only for daily loans
                    if (interval === 'day' && !effectiveFirstEmiDate && disbursementDate) {
                        const disbDate = parseLocalDate(disbursementDate);
                        if (disbDate && !isNaN(disbDate.getTime())) {
                            const nextDay = addDays(disbDate, 1);
                            effectiveFirstEmiDate = nextDay.toISOString().split('T')[0]; // YYYY-MM-DD
                        }
                    }

                    // Skip if still no valid date
                    if (!effectiveFirstEmiDate) {
                        continue;
                    }

                    if (requestedLoanType && interval !== requestedLoanType) continue;
                    if (requestedEmployeeId && requestedEmployeeId !== 'all' && requestedEmployeeId !== '' &&
                        associatedEmployee !== requestedEmployeeId) {
                        continue;
                    }

                    const startDate = parseLocalDate(effectiveFirstEmiDate);
                    let matchedInstallment = null;

                    if (interval === 'month') {
                        for (let i = 0; i < totalEMI; i++) {
                            const emiDate = addMonths(startDate, i);
                            if (isSameDay(emiDate, targetDate)) {
                                matchedInstallment = i + 1;
                                break;
                            }
                        }
                    } else {
                        let stepDays = 1;
                        if (interval === 'week') stepDays = 7;
                        else if (interval === 'fortnight') stepDays = 14;
                        else if (interval === 'day') stepDays = 1;
                        else continue;

                        for (let i = 0; i < totalEMI; i++) {
                            const emiDate = new Date(startDate);
                            emiDate.setDate(emiDate.getDate() + i * stepDays);
                            if (isSameDay(emiDate, targetDate)) {
                                matchedInstallment = i + 1;
                                break;
                            }
                        }
                    }

                    if (matchedInstallment) {
                        let clientName = 'N/A';
                        if (applicants?.[0]) {
                            const kycDoc = await db
                                .collection(token.bankId)
                                .doc('kyc')
                                .collection('member-kyc')
                                .doc(applicants[0])
                                .get();
                            if (kycDoc.exists) {
                                clientName = kycDoc.data().name || 'N/A';
                            }
                        }

                        const emi = parseFloat(emiAmount) || 0;
                        const arrear = parseFloat(partialEmiDueAmount) || 0;
                        const excess = parseFloat(remainingBalance) || 0;

                        let demandCurrent = emi;
                        if (excess >= emi) {
                            demandCurrent = 0;
                        } else {
                            demandCurrent = emi - excess;
                        }
                        demandCurrent = Math.max(0, demandCurrent);
                        const totalDemand = Math.max(0, demandCurrent + arrear);

                        demandRows.push({
                            date: targetDateString,
                            employee: employees[associatedEmployee] || employees['N/A'],
                            employeeId: associatedEmployee || 'N/A',
                            loanAccount: account,
                            clientId: applicants?.[0] || 'N/A',
                            clientName: clientName,
                            loanType: interval,
                            emiAmount: emi,
                            principal: parseFloat(principleEMI),
                            interest: parseFloat(interestEMI),
                            installment: matchedInstallment,
                            accountType: accountType,
                            arrear: arrear,
                            demandCurrent: demandCurrent,
                            totalDemand: totalDemand,
                            remainingBalance: excess,
                        });
                    }
                }
            }

            demandRows.sort((a, b) => {
                if (a.employee !== b.employee) return a.employee.localeCompare(b.employee);
                return a.loanAccount.localeCompare(b.loanAccount);
            });

            return res.send({
                success: `EMI Demand Sheet for ${targetDateString}`,
                date: targetDateString,
                filters: {
                    loanType: requestedLoanType || 'all',
                    employeeId: requestedEmployeeId || 'all'
                },
                totalRecords: demandRows.length,
                demand: demandRows
            });

        } catch (error) {
            console.error('Demand Sheet JSON Error:', error);
            return res.status(500).send({ error: 'Failed to generate demand sheet. Please try again.' });
        }
    });


    app.get('/api/reports/loan/demand-sheet-pdf/:date', async (req, res) => {
        const token = req.user;
        if (!token) return res.status(401).send({ error: 'You are not authorized. Please log in.' });

        const targetDateString = req.params.date;
        const parseLocalDate = (dateStr) => {
            const [y, m, d] = dateStr.split('-').map(Number);
            return new Date(y, m - 1, d);
        };

        const targetDate = parseLocalDate(targetDateString);
        if (isNaN(targetDate.getTime())) {
            return res.status(400).send({ error: 'Invalid date format. Use YYYY-MM-DD.' });
        }

        const requestedLoanType = req.query.loanType;
        const requestedEmployeeId = req.query.employeeId;
        const validLoanTypes = ['day', 'week', 'fortnight', 'month'];
        if (requestedLoanType && !validLoanTypes.includes(requestedLoanType)) {
            return res.status(400).send({ error: 'Invalid loanType. Use: day, week, fortnight, or month.' });
        }

        const isSameDay = (d1, d2) => {
            return d1.getFullYear() === d2.getFullYear() &&
                d1.getMonth() === d2.getMonth() &&
                d1.getDate() === d2.getDate();
        };

        const addMonths = (date, months) => {
            const result = new Date(date);
            const day = result.getDate();
            result.setMonth(result.getMonth() + months);
            if (result.getDate() !== day) {
                result.setDate(0);
            }
            return result;
        };

        try {
            const bankInfoDoc = await db
                .collection(token.bankId)
                .doc('admin')
                .collection('bank-info')
                .doc('details')
                .get();
            const bankInfo = bankInfoDoc.exists ? bankInfoDoc.data() : { bankName: 'ALORAN FINANCE' };

            const employees = {};
            const empSnapshot = await db
                .collection(token.bankId)
                .doc('admin')
                .collection('users')
                .get();

            empSnapshot.forEach(doc => {
                const empData = doc.data();
                employees[doc.id] = {
                    name: empData.name || doc.id,
                    id: doc.id,
                };
            });
            employees['N/A'] = { name: 'Unassigned', id: 'N/A' };

            const demandRows = [];
            const accountTypes = ['loan'];

            for (const accountType of accountTypes) {
                let q = db
                    .collection(token.bankId)
                    .doc('accounts')
                    .collection(accountType)
                    .where('closed', '==', false);

                if (requestedEmployeeId && requestedEmployeeId !== 'all' && requestedEmployeeId !== '') {
                    q = q.where('associatedEmployee', '==', requestedEmployeeId);
                }

                const snapshot = await q.get();

                for (const doc of snapshot.docs) {
                    const loan = doc.data();
                    const account = doc.id;

                    if ((loan.paidEMI || 0) >= (loan.totalEMI || 0)) continue;

                    const {
                        applicants,
                        firstEmiDate,
                        emiAmount = 0,
                        principleEMI = 0,
                        remainingBalance = 0,
                        partialEmiDueAmount = 0,
                        totalEMI = 0,
                        planDetails = {},
                        associatedEmployee,
                        disbursementDate
                    } = loan;

                    let effectiveFirstEmiDate = firstEmiDate || loan[' firstEmiDate'] || loan['  firstEmiDate'];

                    const interval = (planDetails.emiInterval || '').toLowerCase().trim();
                    if (!interval) continue;

                    // Only for daily loans
                    if (interval === 'day' && !effectiveFirstEmiDate && disbursementDate) {
                        const disbDate = parseLocalDate(disbursementDate);
                        if (disbDate && !isNaN(disbDate.getTime())) {
                            const nextDay = addDays(disbDate, 1);
                            effectiveFirstEmiDate = nextDay.toISOString().split('T')[0];
                        }
                    }

                    // Skip if still no valid date
                    if (!effectiveFirstEmiDate) {
                        continue;
                    }

                    if (requestedLoanType && interval !== requestedLoanType) continue;
                    if (requestedEmployeeId && requestedEmployeeId !== 'all' && requestedEmployeeId !== '' &&
                        associatedEmployee !== requestedEmployeeId) {
                        continue;
                    }

                    const startDate = parseLocalDate(effectiveFirstEmiDate);
                    let matchedInstallment = null;

                    if (interval === 'month') {
                        for (let i = 0; i < totalEMI; i++) {
                            const emiDate = addMonths(startDate, i);
                            if (isSameDay(emiDate, targetDate)) {
                                matchedInstallment = i + 1;
                                break;
                            }
                        }
                    } else {
                        let stepDays = 1;
                        if (interval === 'week') stepDays = 7;
                        else if (interval === 'fortnight') stepDays = 14;
                        else if (interval === 'day') stepDays = 1;
                        else continue;

                        for (let i = 0; i < totalEMI; i++) {
                            const emiDate = new Date(startDate);
                            emiDate.setDate(emiDate.getDate() + i * stepDays);
                            if (isSameDay(emiDate, targetDate)) {
                                matchedInstallment = i + 1;
                                break;
                            }
                        }
                    }

                    if (matchedInstallment) {
                        let clientName = 'N/A', phone = '';

                        if (applicants?.[0]) {
                            const kycDoc = await db
                                .collection(token.bankId)
                                .doc('kyc')
                                .collection('member-kyc')
                                .doc(applicants[0])
                                .get();
                            if (kycDoc.exists) {
                                const kyc = kycDoc.data();
                                clientName = kyc.name || 'N/A';
                                phone = kyc.phone || '';
                            }
                        }

                        const emi = parseFloat(emiAmount) || 0;
                        const arrear = parseFloat(partialEmiDueAmount) || 0;
                        const excess = parseFloat(remainingBalance) || 0;

                        let demandCurrent = emi;
                        if (excess >= emi) {
                            demandCurrent = 0;
                        } else {
                            demandCurrent = emi - excess;
                        }
                        demandCurrent = Math.max(0, demandCurrent);
                        const totalDemand = Math.max(0, demandCurrent + arrear);

                        const employeeId = associatedEmployee || 'N/A';
                        const empInfo = employees[employeeId] || { name: 'Unassigned', id: 'N/A' };

                        demandRows.push({
                            employeeId: employeeId,
                            employeeName: empInfo.name,
                            employeeCode: empInfo.id,
                            loanAccount: account,
                            clientId: applicants?.[0] || 'N/A',
                            clientName,
                            phone,
                            groupName: 'Individual',
                            groupCode: 'IND',
                            isGroupLoan: false,
                            loanAmount: parseFloat(loan.disbursement || loan.loanAmount || 0),
                            emiAmount: emi,
                            tenure: totalEMI,
                            tenureUnit: interval === 'week' ? 'WEEK' :
                                interval === 'fortnight' ? 'FORTNIGHT' :
                                    interval === 'month' ? 'MONTH' : 'DAY',
                            demandCurrent: demandCurrent,
                            arrear: arrear,
                            totalDemand: totalDemand,
                            balanceOutstanding: parseFloat(loan.disbursement || loan.loanAmount || 0) - (parseFloat(principleEMI) * (loan.paidEMI || 0)),
                            weeksLeft: totalEMI - (loan.paidEMI || 0)
                        });
                    }
                }
            }

            const grouped = {};
            demandRows.forEach(row => {
                const empKey = row.employeeId || 'unassigned';
                if (!grouped[empKey]) {
                    grouped[empKey] = {
                        employeeName: row.employeeName,
                        employeeCode: row.employeeCode,
                        groups: {}
                    };
                }
                const groupKey = 'Individual|IND';
                if (!grouped[empKey].groups[groupKey]) {
                    grouped[empKey].groups[groupKey] = {
                        groupName: 'Individual',
                        groupCode: 'IND',
                        isGroupLoan: false,
                        members: []
                    };
                }
                grouped[empKey].groups[groupKey].members.push(row);
            });

            const formatDate = (date) => {
                const d = new Date(date);
                return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
            };

            const formatINR = (num) => {
                return new Intl.NumberFormat('en-IN', { minimumFractionDigits: 0 }).format(num);
            };

            let htmlContent = `
                                    <!DOCTYPE html>
                                    <html>
                                        <head>
                                            <meta charset="UTF-8">
                                                <title>Demand Sheet - ${targetDateString}</title>
                                                <style>
                                                    body {
                                                        font - family: Arial, sans-serif;
                                                    font-size: 10pt;
                                                    margin: 0;
                                                    padding: 0;
                                                    line-height: 1.2;
        }
                                                    .page {
                                                        padding: 20px;
                                                    page-break-after: always;
        }
                                                    .page:last-child {
                                                        page -break-after: auto;
        }
                                                    .header {
                                                        text - align: center;
                                                    margin-bottom: 10px; 
        }
                                                    .header h2 {
                                                        margin: 5px 0;
                                                    font-size: 16pt;
                                                    font-weight: bold;
        }
                                                    .sub-header {
                                                        font - size: 10pt;
                                                    margin-bottom: 15px;
                                                    text-align: center;
                                                    line-height: 1.4;
        }
                                                    table {
                                                        width: 100%;
                                                    border-collapse: collapse;
                                                    margin-bottom: 20px;
                                                    font-size: 9pt;
        }
                                                    th, td {
                                                        border: 1px solid #000;
                                                    padding: 6px 4px;
                                                    text-align: center;
                                                    vertical-align: top;
                                                    height: 24px;
        }
                                                    th {
                                                        background - color: #f0f0f0;
                                                    font-weight: bold;
        }
                                                    .totals-line {
                                                        margin - top: 10px;
                                                    font-size: 10pt;
                                                    text-align: center;
                                                    line-height: 1.6;
        }
                                                </style>
                                        </head>
                                        <body>
                                            `;

            Object.entries(grouped).forEach(([empId, empData]) => {
                const groups = Object.values(empData.groups);
                groups.forEach((groupData) => {
                    const { groupName, groupCode, members } = groupData;
                    const collectionDate = formatDate(targetDate);
                    const fieldOfficerLine = empData.employeeName;

                    const pageSize = 10;
                    const totalPages = Math.ceil(members.length / pageSize);

                    for (let pageNum = 0; pageNum < totalPages; pageNum++) {
                        const startIndex = pageNum * pageSize;
                        const pageMembers = members.slice(startIndex, startIndex + pageSize);

                        htmlContent += `
                                            <div class="page">
                                                <div class="header">
                                                    <h2>${bankInfo.bankName || 'ALORAN FINANCE'}</h2>
                                                    <p>LOAN DEMAND & COLLECTION SHEET</p>
                                                </div>
                                                <div class="sub-header">
                                                    <p style="display:inline-block; margin-right:20px;">
                                                        Field Officer Name: ${fieldOfficerLine}
                                                    </p>
                                                    <p style="display:inline-block;">
                                                        Collection Date: ${collectionDate}
                                                    </p>
                                                </div>

                                                <table>
                                                    <thead>
                                                        <tr>
                                                            <th>Sl.<br>No.</th>
                                                            <th>Member Name</th>
                                                            <th>Member ID/<br>Loan Id</th>
                                                            <th>Mobile No</th>
                                                            <th>Loan Amount<br>Sanctioned & Tenure</th>
                                                            <th>Instalment<br>Amount</th>
                                                            <th>Demand<br>(This Period)</th>
                                                            <th>Arrear<br>(Past Due)</th>
                                                            <th>Total Demand<br>(Arrear+<br>Current)</th>
                                                                <th>Balance Outstanding /<br>Left Week</th>
                                                                <th>Amount<br>Collected</th>
                                                                <th>Signature</th>
                                                            </tr>
                                                            </thead>
                                                            <tbody>
                                                                `;

                        for (let i = 0; i < pageSize; i++) {
                            if (i < pageMembers.length) {
                                const member = pageMembers[i];
                                htmlContent += `
                                                                <tr>
                                                                    <td>${startIndex + i + 1}</td>
                                                                    <td>${member.clientName}</td>
                                                                    <td>${member.clientId}/${member.loanAccount}</td>
                                                                    <td>${member.phone}</td>
                                                                    <td>${formatINR(member.loanAmount)} ${member.tenure}${member.tenureUnit}</td>
                                                                    <td>${formatINR(member.emiAmount)}</td>
                                                                    <td>${formatINR(member.demandCurrent)}</td>
                                                                    <td>${formatINR(member.arrear)}</td>
                                                                    <td>${formatINR(member.totalDemand)}</td>
                                                                    <td>${formatINR(member.balanceOutstanding)}/${member.weeksLeft}${member.tenureUnit}</td>
                                                                    <td></td>
                                                                    <td></td>
                                                                </tr>
                                                                `;
                            } else {
                                htmlContent += `<tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>`;
                            }
                        }

                        const totalCurrent = pageMembers.reduce((sum, m) => sum + m.demandCurrent, 0);
                        const totalArrear = pageMembers.reduce((sum, m) => sum + m.arrear, 0);
                        const totalDemand = pageMembers.reduce((sum, m) => sum + m.totalDemand, 0);

                        htmlContent += `
                                                                <tr>
                                                                    <td colspan="5"></td>
                                                                    <td><strong>Total Demand This Period</strong></td>
                                                                    <td>${formatINR(totalCurrent)}</td>
                                                                    <td>${formatINR(totalArrear)}</td>
                                                                    <td>${formatINR(totalDemand)}</td>
                                                                    <td colspan="3"></td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                        <div class="totals-line">
                                                            Total Demand: ___________
                                                            Total Collection Made: __________
                                                            Balance Outstanding(if any): ____________
                                                        </div>
                                                    </div>
                                                    `;
                    }
                });
            });

            if (Object.keys(grouped).length === 0) {
                htmlContent += `
    <div class="page">
        <p style="text-align:center; margin-top:100px; font-size:12pt;">
            No EMIs due on ${targetDateString}.
        </p>
    </div>`;
            }

            htmlContent += `
                                                </body>
                                            </html>`;

            const browser = await puppeteer.launch({
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
                headless: true,
            });
            const page = await browser.newPage();
            await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
            const pdfBuffer = await page.pdf({
                format: 'A4',
                landscape: true,
                printBackground: true,
                margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' }
            });
            await browser.close();

            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="Individual_Demand_Sheet_${targetDateString}.pdf"`,
            });
            res.end(pdfBuffer);

        } catch (error) {
            console.error('PDF Demand Sheet Error:', error);
            return res.status(500).send({ error: 'Failed to generate PDF demand sheet.' });
        }
    });




    app.post('/api/loan/update-first-emi-date/:type', async (req, res) => {
        const token = req.user;
        if (!token) {
            return res.status(401).send({ error: 'You are not authorized. Please log in.' });
        }

        const accountType = req.params.type;
        const { account, firstEmiDate } = req.body;

        // Validate account type
        if (!['loan', 'group-loan'].includes(accountType)) {
            return res.status(400).send({ error: 'Invalid account type. Use "loan" or "group-loan".' });
        }

        // Validate required fields
        if (!account || !firstEmiDate) {
            return res.status(400).send({ error: 'Missing required fields: account, firstEmiDate' });
        }

        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(firstEmiDate)) {
            return res.status(400).send({ error: 'Invalid date format. Use YYYY-MM-DD.' });
        }

        const dateObj = new Date(firstEmiDate);
        if (dateObj.toISOString().slice(0, 10) !== firstEmiDate) {
            return res.status(400).send({ error: 'Invalid calendar date.' });
        }

        try {
            const accountRef = db.collection(token.bankId).doc('accounts').collection(accountType).doc(account);
            const doc = await accountRef.get();

            if (!doc.exists) {
                return res.status(404).send({ error: 'Loan account not found.' });
            }

            const data = doc.data();
            // Check if firstEmiDate already exists
            const currentFirstEmi = data.firstEmiDate || data[' firstEmiDate'] || data['  firstEmiDate'];
            if (currentFirstEmi) {
                return res.status(409).send({
                    error: 'firstEmiDate already exists for this account.',
                    existingValue: currentFirstEmi
                });
            }

            // Update only the clean field
            await accountRef.update({ firstEmiDate });

            return res.send({
                success: 'firstEmiDate updated successfully',
                account,
                accountType,
                firstEmiDate
            });

        } catch (error) {
            console.error('Error updating firstEmiDate:', error);
            return res.status(500).send({ error: 'Failed to update firstEmiDate. Please try again.' });
        }
    });


    app.get('/api/reports/group-loan/demand-sheet/:date', async (req, res) => {
        const token = req.user;
        if (!token) return res.status(401).send({ error: 'You are not authorized. Please log in.' });

        const targetDateString = req.params.date;

        const parseLocalDate = (dateStr) => {
            const [y, m, d] = dateStr.split('-').map(Number);
            if (!y || !m || !d || m < 1 || m > 12 || d < 1 || d > 31) return null;
            return new Date(y, m - 1, d);
        };

        const targetDate = parseLocalDate(targetDateString);
        if (!targetDate || isNaN(targetDate.getTime())) {
            return res.status(400).send({ error: 'Invalid date format. Use YYYY-MM-DD.' });
        }

        const requestedLoanType = req.query.loanType;
        const requestedEmployeeId = req.query.employeeId;
        const requestedGroupId = req.query.groupId;

        const validLoanTypes = ['day', 'week', 'fortnight', 'month'];
        if (requestedLoanType && !validLoanTypes.includes(requestedLoanType)) {
            return res.status(400).send({ error: 'Invalid loanType. Use: day, week, fortnight, or month.' });
        }

        // Pre-fetch group members if groupId is provided
        let allowedApplicantSet = null;
        if (requestedGroupId) {
            const kycSnapshot = await db
                .collection(token.bankId)
                .doc('kyc')
                .collection('member-kyc')
                .where('group', '==', requestedGroupId)
                .get();

            allowedApplicantSet = new Set();
            kycSnapshot.forEach(doc => {
                const data = doc.data();
                if (data.active !== false) {
                    allowedApplicantSet.add(doc.id);
                }
            });

            if (allowedApplicantSet.size === 0) {
                return res.send({
                    success: `EMI Demand Sheet for ${targetDateString}`,
                    bankId: token.bankId,
                    date: targetDateString,
                    filters: {
                        loanType: requestedLoanType || 'all',
                        employeeId: requestedEmployeeId || 'all',
                        groupId: requestedGroupId
                    },
                    totalRecords: 0,
                    demand: []
                });
            }
        }

        const isSameDay = (d1, d2) => {
            return d1.getFullYear() === d2.getFullYear() &&
                d1.getMonth() === d2.getMonth() &&
                d1.getDate() === d2.getDate();
        };

        const addMonths = (date, months) => {
            const result = new Date(date);
            const day = result.getDate();
            result.setMonth(result.getMonth() + months);
            if (result.getDate() !== day) {
                result.setDate(0);
            }
            return result;
        };

        try {
            const employees = { 'N/A': 'Unassigned' };
            const empSnapshot = await db
                .collection(token.bankId)
                .doc('admin')
                .collection('users')
                .get();

            empSnapshot.forEach(doc => {
                const empData = doc.data();
                employees[doc.id] = empData.name || doc.id;
            });

            // Fetch all active group loans
            let q = db
                .collection(token.bankId)
                .doc('accounts')
                .collection('group-loan')
                .where('closed', '==', false);

            if (requestedEmployeeId && requestedEmployeeId !== 'all' && requestedEmployeeId !== '') {
                q = q.where('associatedEmployee', '==', requestedEmployeeId);
            }

            const snapshot = await q.get();

            const applicantIds = new Set();
            const validLoans = [];

            for (const doc of snapshot.docs) {
                const loan = doc.data();
                const account = doc.id;

                if (Object.keys(loan).length === 0) continue;

                const paidEMI = parseInt(loan.paidEMI, 10) || 0;
                const totalEMI = parseInt(loan.totalEMI, 10) || 0;
                if (paidEMI >= totalEMI) continue;

                const applicants = loan.applicants || [];
                const primaryApplicant = applicants[0];
                const associatedEmployee = loan.associatedEmployee;

                const { firstEmiDate, disbursementDate, planDetails = {} } = loan;

                let effectiveFirstEmiDate = firstEmiDate || loan[' firstEmiDate'] || loan['  firstEmiDate'];
                const interval = (planDetails.emiInterval || '').toLowerCase().trim();

                if (interval === 'day' && !effectiveFirstEmiDate && disbursementDate) {
                    const disbDate = parseLocalDate(disbursementDate);
                    if (disbDate && !isNaN(disbDate.getTime())) {
                        const nextDay = addDays(disbDate, 1);
                        effectiveFirstEmiDate = nextDay.toISOString().split('T')[0];
                    }
                }

                if (!effectiveFirstEmiDate || !interval || !validLoanTypes.includes(interval)) {
                    continue;
                }

                if (requestedLoanType && interval !== requestedLoanType) continue;
                if (requestedEmployeeId && requestedEmployeeId !== 'all' && requestedEmployeeId !== '' &&
                    associatedEmployee !== requestedEmployeeId) continue;

                if (allowedApplicantSet) {
                    if (!primaryApplicant || !allowedApplicantSet.has(primaryApplicant)) {
                        continue;
                    }
                }

                const startDate = parseLocalDate(effectiveFirstEmiDate);
                if (!startDate || isNaN(startDate.getTime())) continue;

                validLoans.push({ doc, loan, account, primaryApplicant, startDate, interval, totalEMI });
                if (primaryApplicant) applicantIds.add(primaryApplicant);
            }

            const kycMap = {};
            const ids = Array.from(applicantIds);
            for (let i = 0; i < ids.length; i += 10) {
                const chunk = ids.slice(i, i + 10);
                const kycSnapshot = await db
                    .collection(token.bankId)
                    .doc('kyc')
                    .collection('member-kyc')
                    .where('__name__', 'in', chunk)
                    .get();

                kycSnapshot.forEach(doc => {
                    kycMap[doc.id] = doc.data().name || 'N/A';
                });
            }

            const demandRows = [];

            for (const { loan, account, primaryApplicant, startDate, interval, totalEMI } of validLoans) {
                let matchedInstallment = null;

                if (interval === 'month') {
                    for (let i = 0; i < totalEMI; i++) {
                        const emiDate = addMonths(startDate, i);
                        if (isSameDay(emiDate, targetDate)) {
                            matchedInstallment = i + 1;
                            break;
                        }
                    }
                } else {
                    let stepDays = 1;
                    if (interval === 'week') stepDays = 7;
                    else if (interval === 'fortnight') stepDays = 14;

                    for (let i = 0; i < totalEMI; i++) {
                        const emiDate = new Date(startDate);
                        emiDate.setDate(emiDate.getDate() + i * stepDays);
                        if (isSameDay(emiDate, targetDate)) {
                            matchedInstallment = i + 1;
                            break;
                        }
                    }
                }

                if (matchedInstallment) {
                    const clientName = primaryApplicant ? kycMap[primaryApplicant] || 'N/A' : 'N/A';

                    const emi = parseFloat(loan.emiAmount) || 0;
                    const arrear = parseFloat(loan.partialEmiDueAmount) || 0;
                    const excess = parseFloat(loan.remainingBalance) || 0;

                    let demandCurrent = emi;
                    if (excess >= emi) {
                        demandCurrent = 0;
                    } else {
                        demandCurrent = emi - excess;
                    }
                    demandCurrent = Math.max(0, demandCurrent);
                    const totalDemand = Math.max(0, demandCurrent + arrear);

                    demandRows.push({
                        date: targetDateString,
                        employee: employees[loan.associatedEmployee] || employees['N/A'],
                        employeeId: loan.associatedEmployee || 'N/A',
                        loanAccount: account,
                        clientId: primaryApplicant || 'N/A',
                        clientName: clientName,
                        loanType: interval,
                        emiAmount: emi,
                        principal: parseFloat(loan.principleEMI) || 0,
                        interest: parseFloat(loan.interestEMI) || 0,
                        installment: matchedInstallment,
                        accountType: 'group-loan',
                        arrear: arrear,
                        demandCurrent: demandCurrent,
                        totalDemand: totalDemand,
                        remainingBalance: excess
                    });
                }
            }

            demandRows.sort((a, b) => {
                if (a.employee !== b.employee) return a.employee.localeCompare(b.employee);
                return a.loanAccount.localeCompare(b.loanAccount);
            });

            return res.send({
                success: `EMI Demand Sheet for ${targetDateString}`,
                bankId: token.bankId,
                date: targetDateString,
                filters: {
                    loanType: requestedLoanType || 'all',
                    employeeId: requestedEmployeeId || 'all',
                    groupId: requestedGroupId || 'all'
                },
                totalRecords: demandRows.length,
                demand: demandRows
            });

        } catch (error) {
            console.error('Group Loan Demand Sheet Error:', error);
            return res.status(500).send({ error: 'Failed to generate group loan demand sheet.' });
        }
    });

    app.get('/api/reports/group-loan/demand-sheet-pdf/:date', async (req, res) => {
        const token = req.user;
        if (!token) return res.status(401).send({ error: 'You are not authorized. Please log in.' });

        const targetDateString = req.params.date;
        const parseLocalDate = (dateStr) => {
            const [y, m, d] = dateStr.split('-').map(Number);
            if (!y || !m || !d || m < 1 || m > 12 || d < 1 || d > 31) return null;
            const date = new Date(y, m - 1, d);
            if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
                return null;
            }
            return date;
        };

        const targetDate = parseLocalDate(targetDateString);
        if (!targetDate || isNaN(targetDate.getTime())) {
            return res.status(400).send({ error: 'Invalid date format. Use YYYY-MM-DD.' });
        }

        const requestedLoanType = req.query.loanType;
        const requestedEmployeeId = req.query.employeeId;
        const requestedGroupId = req.query.groupId;

        const validLoanTypes = ['day', 'week', 'fortnight', 'month'];
        if (requestedLoanType && !validLoanTypes.includes(requestedLoanType)) {
            return res.status(400).send({ error: 'Invalid loanType. Use: day, week, fortnight, or month.' });
        }

        const isSameDay = (d1, d2) => {
            return d1.getFullYear() === d2.getFullYear() &&
                d1.getMonth() === d2.getMonth() &&
                d1.getDate() === d2.getDate();
        };

        const addMonths = (date, months) => {
            const result = new Date(date);
            const day = result.getDate();
            result.setMonth(result.getMonth() + months);
            if (result.getDate() !== day) {
                result.setDate(0);
            }
            return result;
        };

        try {
            const bankInfoDoc = await db
                .collection(token.bankId)
                .doc('admin')
                .collection('bank-info')
                .doc('details')
                .get();
            const bankInfo = bankInfoDoc.exists ? bankInfoDoc.data() : { bankName: 'ALORAN FINANCE' };

            const employees = {};
            const empSnapshot = await db
                .collection(token.bankId)
                .doc('admin')
                .collection('users')
                .get();

            empSnapshot.forEach(doc => {
                const empData = doc.data();
                employees[doc.id] = {
                    name: empData.name || doc.id,
                    id: doc.id,
                };
            });
            employees['N/A'] = { name: 'Unassigned', id: 'N/A' };

            // Pre-fetch group members if groupId is provided
            let allowedApplicantSet = null;
            let groupInfo = {};
            if (requestedGroupId) {
                const kycSnapshot = await db
                    .collection(token.bankId)
                    .doc('kyc')
                    .collection('member-kyc')
                    .where('group', '==', requestedGroupId)
                    .get();

                allowedApplicantSet = new Set();
                kycSnapshot.forEach(doc => {
                    const data = doc.data();
                    if (data.active !== false) {
                        allowedApplicantSet.add(doc.id);
                    }
                });

                if (allowedApplicantSet.size === 0) {
                    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'], headless: true });
                    const page = await browser.newPage();
                    await page.setContent(`
                                            <!DOCTYPE html>
                                            <html><body>
                                                <div style="text-align:center; margin-top:100px; font-size:12pt;">
                                                    No group EMIs due on ${targetDateString}.
                                                </div>
                                            </body></html>
                                            `);
                    const pdfBuffer = await page.pdf({ format: 'A4', landscape: true, printBackground: true });
                    await browser.close();
                    res.set({
                        'Content-Type': 'application/pdf',
                        'Content-Disposition': `attachment; filename="Group_Demand_Sheet_${targetDateString}.pdf"`,
                    });
                    return res.end(pdfBuffer);
                }

                const firstMember = kycSnapshot.docs[0]?.data();
                groupInfo = {
                    groupName: firstMember?.groupName || requestedGroupId,
                    groupCode: requestedGroupId
                };
            }

            // Fetch all active group loans
            let q = db
                .collection(token.bankId)
                .doc('accounts')
                .collection('group-loan')
                .where('closed', '==', false);

            if (requestedEmployeeId && requestedEmployeeId !== 'all' && requestedEmployeeId !== '') {
                q = q.where('associatedEmployee', '==', requestedEmployeeId);
            }

            const snapshot = await q.get();

            const validLoans = [];
            const applicantIds = new Set();

            for (const doc of snapshot.docs) {
                const loan = doc.data();
                const account = doc.id;

                if ((loan.paidEMI || 0) >= (loan.totalEMI || 0)) continue;

                const {
                    applicants,
                    firstEmiDate,
                    emiAmount = 0,
                    principleEMI = 0,
                    remainingBalance = 0,
                    partialEmiDueAmount = 0,
                    totalEMI = 0,
                    planDetails = {},
                    associatedEmployee,
                    disbursementDate
                } = loan;

                let effectiveFirstEmiDate = firstEmiDate || loan[' firstEmiDate'] || loan['  firstEmiDate'];
                const interval = (planDetails.emiInterval || '').toLowerCase().trim();

                if (interval === 'day' && !effectiveFirstEmiDate && disbursementDate) {
                    const disbDate = parseLocalDate(disbursementDate);
                    if (disbDate && !isNaN(disbDate.getTime())) {
                        const nextDay = addDays(disbDate, 1);
                        effectiveFirstEmiDate = nextDay.toISOString().split('T')[0];
                    }
                }

                if (!effectiveFirstEmiDate || !interval || !validLoanTypes.includes(interval)) continue;

                if (requestedLoanType && interval !== requestedLoanType) continue;
                if (requestedEmployeeId && requestedEmployeeId !== 'all' && requestedEmployeeId !== '' &&
                    associatedEmployee !== requestedEmployeeId) continue;

                const primaryApplicant = applicants?.[0];
                if (allowedApplicantSet && (!primaryApplicant || !allowedApplicantSet.has(primaryApplicant))) continue;

                const startDate = parseLocalDate(effectiveFirstEmiDate);
                if (!startDate || isNaN(startDate.getTime())) continue;

                validLoans.push({ doc, loan, account, primaryApplicant, startDate, interval, totalEMI, associatedEmployee });
                if (primaryApplicant) applicantIds.add(primaryApplicant);
            }

            const kycMap = {};
            const ids = Array.from(applicantIds);
            for (let i = 0; i < ids.length; i += 10) {
                const chunk = ids.slice(i, i + 10);
                const kycSnapshot = await db
                    .collection(token.bankId)
                    .doc('kyc')
                    .collection('member-kyc')
                    .where('__name__', 'in', chunk)
                    .get();
                kycSnapshot.forEach(doc => {
                    kycMap[doc.id] = doc.data();
                });
            }

            const demandRows = [];
            for (const { loan, account, primaryApplicant, startDate, interval, totalEMI, associatedEmployee } of validLoans) {
                let matchedInstallment = null;

                if (interval === 'month') {
                    for (let i = 0; i < totalEMI; i++) {
                        const emiDate = addMonths(startDate, i);
                        if (isSameDay(emiDate, targetDate)) {
                            matchedInstallment = i + 1;
                            break;
                        }
                    }
                } else {
                    let stepDays = 1;
                    if (interval === 'week') stepDays = 7;
                    else if (interval === 'fortnight') stepDays = 14;

                    for (let i = 0; i < totalEMI; i++) {
                        const emiDate = new Date(startDate);
                        emiDate.setDate(emiDate.getDate() + i * stepDays);
                        if (isSameDay(emiDate, targetDate)) {
                            matchedInstallment = i + 1;
                            break;
                        }
                    }
                }

                if (matchedInstallment) {
                    const kyc = primaryApplicant ? kycMap[primaryApplicant] : null;
                    const clientName = kyc?.name || 'N/A';
                    const phone = kyc?.phone || '';
                    const groupName = kyc?.groupName || (requestedGroupId ? groupInfo.groupName : 'Group');
                    const groupCode = kyc?.group || requestedGroupId || 'GRP';

                    const emi = parseFloat(loan.emiAmount) || 0;
                    const arrear = parseFloat(loan.partialEmiDueAmount) || 0;
                    const excess = parseFloat(loan.remainingBalance) || 0;

                    let demandCurrent = emi;
                    if (excess >= emi) {
                        demandCurrent = 0;
                    } else {
                        demandCurrent = emi - excess;
                    }
                    demandCurrent = Math.max(0, demandCurrent);
                    const totalDemand = Math.max(0, demandCurrent + arrear);

                    const employeeId = associatedEmployee || 'N/A';
                    const empInfo = employees[employeeId] || { name: 'Unassigned', id: 'N/A' };

                    demandRows.push({
                        employeeId: employeeId,
                        employeeName: empInfo.name,
                        employeeCode: empInfo.id,
                        loanAccount: account,
                        clientId: primaryApplicant || 'N/A',
                        clientName,
                        phone,
                        groupName,
                        groupCode,
                        isGroupLoan: true,
                        loanAmount: parseFloat(loan.disbursement || loan.loanAmount || 0),
                        emiAmount: emi,
                        tenure: totalEMI,
                        tenureUnit: interval === 'week' ? 'WEEK' :
                            interval === 'fortnight' ? 'FORTNIGHT' :
                                interval === 'month' ? 'MONTH' : 'DAY',
                        demandCurrent: demandCurrent,
                        arrear: arrear,
                        totalDemand: totalDemand,
                        balanceOutstanding: parseFloat(loan.disbursement || loan.loanAmount || 0) - (parseFloat(loan.principleEMI) * (loan.paidEMI || 0)),
                        weeksLeft: totalEMI - (loan.paidEMI || 0)
                    });
                }
            }

            // Group by employee → group
            const grouped = {};
            demandRows.forEach(row => {
                const empKey = row.employeeId || 'unassigned';
                if (!grouped[empKey]) {
                    grouped[empKey] = {
                        employeeName: row.employeeName,
                        employeeCode: row.employeeCode,
                        groups: {}
                    };
                }
                const groupKey = `${row.groupName}|${row.groupCode}`;
                if (!grouped[empKey].groups[groupKey]) {
                    grouped[empKey].groups[groupKey] = {
                        groupName: row.groupName,
                        groupCode: row.groupCode,
                        isGroupLoan: true,
                        members: []
                    };
                }
                grouped[empKey].groups[groupKey].members.push(row);
            });

            const formatDate = (date) => {
                const d = new Date(date);
                return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
            };

            const formatINR = (num) => {
                return new Intl.NumberFormat('en-IN', { minimumFractionDigits: 0 }).format(num);
            };

            let htmlContent = `
                                            <!DOCTYPE html>
                                            <html>
                                                <head>
                                                    <meta charset="UTF-8">
                                                        <title>Group Loan Demand Sheet - ${targetDateString}</title>
                                                        <style>
                                                            body {
                                                                font - family: Arial, sans-serif;
                                                            font-size: 10pt;
                                                            margin: 0;
                                                            padding: 0;
                                                            line-height: 1.2;
        }
                                                            .page {
                                                                padding: 20px;
                                                            page-break-after: always;
        }
                                                            .page:last-child {
                                                                page -break-after: auto;
        }
                                                            .header {
                                                                text - align: center;
                                                            margin-bottom: 10px; 
        }
                                                            .header h2 {
                                                                margin: 4px 0;
                                                            font-size: 16pt;
                                                            font-weight: bold;
        }
                                                            .sub-header {
                                                                font - size: 10pt;
                                                            margin-bottom: 15px;
                                                            text-align: center;
                                                            line-height: 1.4;
        }
                                                            table {
                                                                width: 100%;
                                                            border-collapse: collapse;
                                                            margin-bottom: 17px;
                                                            font-size: 9pt;
        }
                                                            th, td {
                                                                border: 1px solid #000;
                                                            padding: 6px 4px;
                                                            text-align: center;
                                                            vertical-align: top;
                                                            height: 22px;
        }
                                                            th {
                                                                background - color: #f0f0f0;
                                                            font-weight: bold;
        }
                                                            .totals-line {
                                                                margin - top: 9px;
                                                            font-size: 9pt;
                                                            text-align: center;
                                                            line-height: 1.6;
        }
                                                            .group-title {
                                                                font - weight: bold;
                                                            margin: 14px 0 5px 0;
                                                            text-align: center;
                                                            font-size: 11pt;
        }
                                                        </style>
                                                </head>
                                                <body>
                                                    `;

            if (Object.keys(grouped).length === 0) {
                htmlContent += `
    <div class="page">
        <p style="text-align:center; margin-top:100px; font-size:12pt;">
            No group EMIs due on ${targetDateString}.
        </p>
    </div>`;
            } else {
                Object.entries(grouped).forEach(([empId, empData]) => {
                    const groups = Object.values(empData.groups);
                    groups.forEach((groupData) => {
                        const { groupName, groupCode, members } = groupData;
                        const collectionDate = formatDate(targetDate);
                        const fieldOfficerLine = empData.employeeName;

                        const pageSize = 10;
                        const totalPages = Math.ceil(members.length / pageSize);

                        for (let pageNum = 0; pageNum < totalPages; pageNum++) {
                            const startIndex = pageNum * pageSize;
                            const pageMembers = members.slice(startIndex, startIndex + pageSize);

                            htmlContent += `
    <div class="page">
        <div class="header">
            <h2>${bankInfo.bankName || 'ALORAN FINANCE'}</h2>
            <p>GROUP LOAN DEMAND & COLLECTION SHEET</p>
        </div>
        <div class="sub-header">
            <p style="display:inline-block; margin-right:20px;">
                Field Officer Name: ${fieldOfficerLine}
            </p>
            <p style="display:inline-block;">
                Collection Date: ${collectionDate}
            </p>
            <p style="display:block; margin-top:5px;">
                Group Name: ${groupName} | Group Code: ${groupCode}
            </p>
        </div>
        <table>
            <thead>
                <tr>
                    <th>Sl.<br>No.</th>
                    <th>Member Name</th>
                    <th>Member ID/<br>Loan Id</th>
                    <th>Mobile No</th>
                    <th>Loan Amount<br>Sanctioned & Tenure</th>
                    <th>Instalment<br>Amount</th>
                    <th>Demand<br>(This Period)</th>
                    <th>Arrear<br>(Past Due)</th>
                    <th>Total Demand<br>(Arrear+<br>Current)</th>
                    <th>Balance Outstanding /<br>Left Week</th>
                    <th>Amount<br>Collected</th>
                    <th>Signature</th>
                </tr>
            </thead>
            <tbody>
`;

                            for (let i = 0; i < pageSize; i++) {
                                if (i < pageMembers.length) {
                                    const member = pageMembers[i];
                                    htmlContent += `
                <tr>
                    <td>${startIndex + i + 1}</td>
                    <td>${member.clientName}</td>
                    <td>${member.clientId}/${member.loanAccount}</td>
                    <td>${member.phone}</td>
                    <td>${formatINR(member.loanAmount)} ${member.tenure}${member.tenureUnit}</td>
                    <td>${formatINR(member.emiAmount)}</td>
                    <td>${formatINR(member.demandCurrent)}</td>
                    <td>${formatINR(member.arrear)}</td>
                    <td>${formatINR(member.totalDemand)}</td>
                    <td>${formatINR(member.balanceOutstanding)}/${member.weeksLeft}${member.tenureUnit}</td>
                    <td></td>
                    <td></td>
                </tr>
`;
                                } else {
                                    htmlContent += `<tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>`;
                                }
                            }

                            const totalCurrent = pageMembers.reduce((sum, m) => sum + m.demandCurrent, 0);
                            const totalArrear = pageMembers.reduce((sum, m) => sum + m.arrear, 0);
                            const totalDemand = pageMembers.reduce((sum, m) => sum + m.totalDemand, 0);

                            htmlContent += `
                <tr>
                    <td colspan="5"></td>
                    <td><strong>Total Demand This Period</strong></td>
                    <td>${formatINR(totalCurrent)}</td>
                    <td>${formatINR(totalArrear)}</td>
                    <td>${formatINR(totalDemand)}</td>
                    <td colspan="3"></td>
                </tr>
            </tbody>
        </table>
        <div class="totals-line">
            Total Demand: ___________ 
            Total Collection Made: __________ 
            Balance Outstanding(if any): ____________
        </div>
    </div>
`;
                        }
                    })
                })
            }

            htmlContent += `</body></html>`;

            const browser = await puppeteer.launch({
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
                headless: true,
            });
            const page = await browser.newPage();
            await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
            const pdfBuffer = await page.pdf({
                format: 'A4',
                landscape: true,
                printBackground: true,
                margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' }
            });
            await browser.close();

            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="Group_Demand_Sheet_${targetDateString}.pdf"`,
            });
            res.end(pdfBuffer);

        } catch (error) {
            console.error('Group Loan PDF Demand Sheet Error:', error);
            return res.status(500).send({ error: 'Failed to generate group loan PDF demand sheet.' });
        }
    });
}

