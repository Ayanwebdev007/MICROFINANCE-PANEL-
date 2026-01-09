const {getFirestore} = require('firebase-admin/firestore');
const db = getFirestore();
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

const formatINR = (num) => {
    if (num == null || isNaN(num)) return 'Rs. 0.00';
    return 'Rs. ' + new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(parseFloat(num));
};

// --- Helper: Format Date (YYYY-MM-DD → DD-MMM-YYYY) ---
const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
};

// --- Helper: Number to Words (for principal) ---
const numberToWords = (num) => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ',
        'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    num = Math.floor(num);
    if (num === 0) return 'Zero';
    let str = '';
    const crore = Math.floor(num / 10000000);
    num %= 10000000;
    const lakh = Math.floor(num / 100000);
    num %= 100000;
    const thousand = Math.floor(num / 1000);
    num %= 1000;
    const hundred = Math.floor(num / 100);
    num %= 100;
    let tens = num;
    if (crore > 0) str += (a[crore] || b[Math.floor(crore / 10)] + ' ' + a[crore % 10]) + 'Crore ';
    if (lakh > 0) str += (a[lakh] || b[Math.floor(lakh / 10)] + ' ' + a[lakh % 10]) + 'Lakh ';
    if (thousand > 0) str += (a[thousand] || b[Math.floor(thousand / 10)] + ' ' + a[thousand % 10]) + 'Thousand ';
    if (hundred > 0) str += a[hundred] + 'Hundred ';
    if (tens > 0) {
        if (str !== '') str += 'and ';
        str += a[tens] || b[Math.floor(tens / 10)] + ' ' + a[tens % 10];
    }
    return (str.trim() + ' Rupees Only').replace(/\s+/g, ' ');
};

module.exports = app => {
    app.post('/api/deposit/get-deposit-details', async function (req, res) {
        const token = req.user;
        if (!token) return res.status(401).send({error: 'You are not authorized. Please log in.'});


        try {
            const accountRef = db.collection(token.bankId).doc('accounts').collection(req.body.accountType).doc(req.body.accountNumber);
            const accountInfo = await accountRef.get();
            if (!accountInfo.exists) {
                return res.send({error: 'Account not found. Please enter a valid account number'});
            }
            const kycRef = db.collection(token.bankId).doc('kyc').collection('member-kyc').doc(accountInfo.data().applicants[0]);
            const kycInfo = await kycRef.get();

            return res.send({
                success: 'Successfully fetched account details',
                data: {
                    account: req.body.accountNumber,
                    balance: accountInfo.data().balance,
                    modeOfOperation: accountInfo.data().modeOfOperation,
                    jointSurvivorCode: accountInfo.data().jointSurvivorCode,
                    jointSurvivorName: accountInfo.data().jointSurvivorName,
                    relation: accountInfo.data().relation,
                    advisorCode: accountInfo.data().advisorCode,
                    advisorName: accountInfo.data().advisorName,
                    paymentMethod: accountInfo.data().paymentMethod,
                    uuid: kycInfo.data().uuid,
                    name: kycInfo.data().name,
                    kycId: accountInfo.data().applicants[0],
                    guardian: kycInfo.data().guardian,
                    gender: kycInfo.data().gender,
                    dob: kycInfo.data().dob,
                    materialStatus: kycInfo.data().materialStatus,
                    email: kycInfo.data().email,
                    phone: kycInfo.data().phone,
                    address: kycInfo.data().address,
                    aadhar: kycInfo.data().aadhar,
                    voter: kycInfo.data().voter,
                    pan: kycInfo.data().pan,
                    occupation: kycInfo.data().occupation,
                    income: kycInfo.data().income,
                    education: kycInfo.data().education,
                },
            });
        } catch (e) {
            res.send({error: 'Failed to fetch account details'});
            console.log('Transaction fetch failure:', e);
        }
    });

    app.post('/api/reports/deposit/account-statement', async function (req, res) {
        const token = req.user;
        if (!token) return res.status(401).send({error: 'You are not authorized. Please log in.'});

        const transactions = [];

        try {
            const fromDate = req.body.fromDate || '2000-01-01';
            const toDate = req.body.toDate || '2299-01-01';

            const getAccount = await db.collection(token.bankId).doc('accounts').collection(req.body.accountType).doc(req.body.account).get();
            if (getAccount.exists) {
                const cifDetails = await db.collection(token.bankId).doc('kyc').collection('member-kyc').doc(getAccount.data().applicants[0]).get();
                const groupInfo = await db.collection(token.bankId).doc('kyc').collection('group').doc(cifDetails.data().group || '100000').get()

                let fetchTrans = await db.collection(token.bankId).doc('accounts').collection(req.body.accountType).doc(req.body.account).collection('transaction').get();
                if (req.body.fromDate){
                    fetchTrans = await db.collection(token.bankId).doc('accounts').collection(req.body.accountType).doc(req.body.account).collection('transaction').where('date', '>=', fromDate).get();
                }
                fetchTrans.forEach(function (trans) {
                    if (new Date(trans.data().date) - new Date(toDate) <= 0) {
                        transactions.push({
                            id: trans.id,
                            ...trans.data()
                        });
                    }
                });
                res.send({
                    success: {
                        name: cifDetails.data().name,
                        guardian: cifDetails.data().guardian,
                        address: cifDetails.data().address,
                        cif: getAccount.data().applicants[0],
                        groupId: cifDetails.data().group || '100000',
                        groupName: groupInfo.data().name || 'Unallocated',
                        balance: parseFloat(getAccount.data().balance),
                        phone: cifDetails.data().phone,
                        openingDate: getAccount.data().openingDate,
                        isClosed: !!getAccount.data().closed,
                        account: req.body.account,
                        transactions
                    }
                });
            } else {
                res.send({error: 'Invalid Account Number provided'});
            }
        } catch (error) {
            console.error('Error fetching account statement:', error);
            res.send({error: 'Failed to fetch account statement. Try again...'});
        }
    });

    app.get('/api/get-details-by-agent/bulk-renewal/:agent', async function (req, res) {
        const token = req.user; // Get user from the middleware
        if (!token) return res.status(401).send({error: 'You are not authorized. Please log in.'});

        const accounts = [{
            value: "",
            label: "Select an Option",
            isDisabled: true,
        }];

        try {
            const accountsArray = [];
            const getAccount = await db.collection(token.bankId).doc('accounts').collection('daily-savings').where('referrer', '==', req.params.agent).get();
            getAccount.forEach(function (account) {
                if (!account.data().closed) {
                    accountsArray.push({
                        id: account.id,
                        ...account.data(),
                    });
                }
            });
            for (const accountInfo of accountsArray) {
                const cifRef = db.collection(token.bankId).doc('kyc').collection('member-kyc').doc(accountInfo.applicants[0]);
                const cifInfo = await cifRef.get();
                if (cifInfo.exists) {
                    const cifId = accountInfo.applicants[0];
                    const name = cifInfo.data().name;
                    accounts.push({
                        cif: cifId,
                        name: name,
                        label: `${accountInfo.id} - ${name}`,
                        key: accountInfo.id,
                        account: accountInfo.id,
                        passbook: accountInfo.oldAccount || accountInfo.passbook,
                        termAmount: accountInfo.termAmount || 0,
                        installment: ((parseInt(accountInfo.installment) || 1) + 1).toString(),
                    });
                }
            }

            if (accounts.length > 0) {
                res.send({success: 'successfully fetched accounts details under the CP', details: accounts});
            } else {
                res.send({error: 'No Referrer Account found under the CP'});
            }
        } catch (error) {
            console.error('Error fetching accounts by agent:', error);
            res.send({error: 'Failed to fetch details by agent. Try again...  '});
        }
    });


    app.get('/api/reports/deposit/active-accounts/:type', async (req, res) => {
        const token = req.user;

        if (!token) return res.status(401).send({error: 'You are not authorized. Please log in.'});

        const depositType = req.params.type;


        const depositAccounts = [];
        const applicableAccounts = [];

        try {
            // Fetch all active (non-closed) deposit accounts
            const bankId = req.query.bankId || token.bankId;
            const employees = {};

            const getEmployees = await db.collection(token.bankId).doc('admin').collection('users').get();
            getEmployees.forEach(function (employee) {
                employees[employee.id] = {id: employee.id, ...employee.data()};
            });

            const userProfileInfo = await db.collection(token.bankId).doc('admin').collection('users').doc(token.uid).get();
            let depositColRef = db.collection(bankId).doc('accounts').collection(depositType).where('closed', '==', false);
            if (token.role !== 'root' && token.role !== 'admin' && userProfileInfo.data()?.accessLevel?.fullDataAccess !== true) {
                depositColRef = depositColRef.where('associatedEmployee', '==', token.uid);
            }

            const snapshot = await depositColRef.get();

            snapshot.forEach((doc) => {
                applicableAccounts.push({
                    id: doc.id,
                    ...doc.data(),
                });
            });

            let slNo = 0;
            for (const accountInfo of applicableAccounts) {
                slNo++;

                const kycInfo = await db.collection(bankId).doc('kyc').collection('member-kyc').doc(accountInfo.applicants[0]).get();

                if (kycInfo.exists) {
                    const kycData = kycInfo.data();
                    const associatedEmployee = kycInfo.data().associatedEmployee;

                    depositAccounts.push({
                        slNo: slNo,
                        name: kycData.name || '',
                        phone: kycData.phone || '',
                        account: accountInfo.id,
                        accountType: accountInfo.accountType || '',
                        balance: accountInfo.balance || 0,
                        openingAmount: accountInfo.openingAmount || 0,
                        openingDate: accountInfo.openingDate || '',
                        modeOfOperation: accountInfo.modeOfOperation || '',
                        remarks: accountInfo.remarks || '',
                        referrer: accountInfo.referrer || '',
                        smsSend: accountInfo.smsSend || false,
                        createdAt: accountInfo.createdAt?.toDate().toISOString().split('T')[0] || '',
                        updatedAt: accountInfo.updatedAt?.toDate().toISOString().split('T')[0] || '',
                        memberNo: accountInfo.applicants[0],
                        status: accountInfo.closed ? 'Closed' : 'Active',
                        employeeName: employees[associatedEmployee] ? employees[associatedEmployee].name : '',
                    });
                }
            }

            res.send({success: true, details: depositAccounts});
        } catch (error) {
            console.error('Error fetching deposit accounts:', error);
            res.status(500).send({error: 'Internal server error'});
        }
    });

    app.get('/api/reports/accounts/:accountType/:accountId', async (req, res) => {
        const token = req.user;

        if (!token) {
            return res.status(401).json({error: 'Unauthorized. Please log in.'});
        }

        const {accountType, accountId} = req.params;

        const VALID_ACCOUNT_TYPES = [
            'savings',
            'daily-savings',
            'fixed-deposit',
            'thrift-fund',
            'cash-certificate',
            'recurring-deposit',
            'mis-deposit',
        ];

        if (!VALID_ACCOUNT_TYPES.includes(accountType)) {
            return res.status(400).json({
                error: `Invalid account type. Must be one of: ${VALID_ACCOUNT_TYPES.join(', ')}`,
            });
        }

        try {
            const bankId = token.bankId;
            const accountDocRef = db
                .collection(bankId)
                .doc('accounts')
                .collection(accountType)
                .doc(accountId);

            const accountDoc = await accountDocRef.get();

            if (!accountDoc.exists) {
                return res.status(404).json({
                    error: `Account not found: ${accountType}/${accountId}`,
                });
            }

            const accountData = accountDoc.data();

            const mainApplicantId = accountData?.applicants?.[0];
            if (!mainApplicantId) {
                return res.status(400).json({
                    error: 'Main applicant missing in account data.',
                });
            }

            const kycDoc = await db
                .collection(bankId)
                .doc('kyc')
                .collection('member-kyc')
                .doc(mainApplicantId)
                .get();

            const kycData = kycDoc.exists ? kycDoc.data() : {};

            const toFloat = (val, fallback = 0) => {
                const num = parseFloat(val);
                return isNaN(num) ? fallback : num;
            };

            const formatDate = (timestamp) => {
                return timestamp?.toDate ? timestamp.toDate().toISOString() : '';
            };

            const enrichedAccount = {

                name: kycData.name || 'N/A',
                phone: kycData.phone || '',
                uuid: kycData.uuid || '',
                memberNo: mainApplicantId,


                account: accountId,
                accountType,
                status: accountData.closed ? 'Closed' : 'Active',
                balance: toFloat(accountData.balance),
                openingAmount: toFloat(accountData.openingAmount),
                openingDate: accountData.openingDate || '',
                debitCardIssue: Boolean(accountData.debitCardIssue),
                smsSend: Boolean(accountData.smsSend),
                modeOfOperation: accountData.modeOfOperation || '',
                jointSurvivorName: accountData.jointSurvivorName || '',
                jointSurvivorCode: accountData.jointSurvivorCode || '',
                remarks: accountData.remarks || '',
                referrer: accountData.referrer || '',
                author: accountData.author || '',
                createdAt: formatDate(accountData.createdAt),
                updatedAt: formatDate(accountData.updatedAt),
                planDetails: accountData.planDetails || {},
                scheme: accountData.planDetails?.schemeName || accountData.planDetails?.name || '',
                label: accountData.planDetails?.schemeCode || accountData.planDetails?.label || '',

            };


            //For SAVINGS
            if (['savings', 'current'].includes(accountType)) {
                Object.assign(enrichedAccount, {
                    minMonthlyAvgBalance: toFloat(accountData.planDetails?.minMonthlyAvgBalance),
                    serviceCharges: toFloat(accountData.planDetails?.serviceCharges),
                    smsCharges: toFloat(accountData.planDetails?.smsCharges),
                    annualInterestRate: accountData.planDetails?.annualInterestRate || '',
                    interestPayout: accountData.planDetails?.interestPayout || '',
                });
            }



            const transactionsSnapshot = await accountDocRef
                .collection('transaction')
                .orderBy('createdAt', 'desc')
                .get();

            const transactions = transactionsSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));

            return res.json({
                success: true,
                details: [enrichedAccount],
                transactions,
            });
        } catch (error) {
            console.error('Error fetching account:', error);
            return res.status(500).json({
                error: 'Internal server error. Please try again later.',
            });
        }
    });

    app.post('/api/reports/deposit/search-accounts', async (req, res) => {
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
                const accData = accountInfo.data();
                const kycInfo = await db.collection(bankId).doc('kyc').collection('member-kyc').doc(accData.applicants[0]).get();
                if (kycInfo.exists && accData.closed === false) {
                    const memberName = kycInfo.data().name || "";
                    accountList.push({
                        cif: accData.applicants?.[0] || '',
                        name: memberName,
                        label: `${memberName} - ${accData.account}`,
                        key: accData.account,
                        account: accData.account,
                        referrer: accData.referrer,
                        currentBalance: accData.balance || 0
                    });
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
                accountRef.forEach(accDoc => {
                    const accData = accDoc.data();
                    if (accData.closed === false) {
                        const memberName = memberList[i].name || "";
                        accountList.push({
                            cif: accData.applicants?.[0] || '',
                            name: memberName,
                            label: `${memberName} - ${accData.account}`,
                            key: accData.account,
                            account: accData.account,
                            referrer: accData.referrer,
                            currentBalance: accData.balance || 0
                        });
                    }
                });
            }

            res.send({ success: true, accounts: accountList });
        } catch (error) {
            return res.status(500).json({ error: 'Server error. Try again...' });
        }
    });

    app.post('/api/deposit/delete-deposit-account', async (req, res) => {
        const token = req.user;
        const account = req.body.account;
        const accountType = req.body.accountType;

        try {
            await db.runTransaction(async (t) => {
                const transactions = [];
                const loanRef = db.collection(token.bankId).doc('accounts').collection(accountType).doc(account);
                const accountSnapshot = await loanRef.get();
                if (!accountSnapshot.exists) {
                    return res.status(404).send({error: 'Account not found.'});
                }
                if (accountSnapshot.data().closed === true) {
                    return res.status(400).send({error: 'Selected Account is already closed.'});
                }
                const accountData = accountSnapshot.data();

                const cashInHandRef = db.collection(token.bankId).doc('scheduler').collection('daily-book').doc('value');
                const cashInHandSnapshot = await t.get(cashInHandRef);

                const transactionRef = loanRef.collection('transaction');
                const transactionSnapshot = await t.get(transactionRef);
                transactionSnapshot.forEach((doc) => {
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
                            }catch (e) {
                                console.log('Transaction not found');
                            }
                        }
                    }else if (transaction.type === 'debit') {
                        const transactionIds = [`${transaction.id}.1`, `${transaction.id}.2`, `${transaction.id}.3`];
                        for (const transactionId of transactionIds) {
                            try {
                                const transactionRef = db.collection(token.bankId).doc('transaction').collection(transaction.transactionDate).doc(transactionId);
                                t.delete(transactionRef);
                            }catch (e) {
                                console.log('Transaction not found');
                            }
                        }
                    }

                    // Reduce Balance from Cash in Hand Transactions
                    const updatedCashInHand = parseInt(cashInHandSnapshot.data()?.cashInHand ?? 0) - parseInt(accountData.balance ?? 0);
                    t.update(cashInHandRef, {
                        cashInHand: updatedCashInHand,
                    });
                }

                t.delete(loanRef);
            })
            res.send({success: 'Loan account deleted successfully.'});
        } catch (error) {
            console.log(error);
            res.send({error: error.message});
        }
    });

    app.get('/api/deposit/:type/certificate/:account', async (req, res) => {
        const token = req.user;
        if (!token || !token.bankId) {
            return res.status(401).send({ error: 'Unauthorized or invalid token (missing bankId).' });
        }
        const { type, account } = req.params;

        const parseLocalDate = (dateStr) => {
            if (!dateStr) return new Date();
            const [y, m, d] = dateStr.split('-').map(Number);
            return new Date(y, m - 1, d);
        };

        const formatLocalDate = (date) => {
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        };

        const calculateAge = (dobStr) => {
            if (!dobStr) return null;
            const dob = parseLocalDate(dobStr);
            const today = new Date();
            let age = today.getFullYear() - dob.getFullYear();
            const m = today.getMonth() - dob.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
            return age;
        };

        const formatDate = (dateStr) => {
            if (!dateStr) return 'N/A';
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return 'Invalid Date';
            return d.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        };

        const wrapText = (text, font, size, maxWidth) => {
            if (!text) return [''];


            const safeText = String(text).replace(/\n/g, ' ');

            const words = safeText.split(' ').filter(w => w);

            const lines = [];
            let line = words[0] || '';
            for (let i = 1; i < words.length; i++) {
                const word = words[i];
                const testLine = line + ' ' + word;
                const testWidth = font.widthOfTextAtSize(testLine, size);
                if (testWidth <= maxWidth) {
                    line = testLine;
                } else {
                    lines.push(line);
                    line = word;
                }
            }
            lines.push(line);
            return lines;
        };

        try {
            //Fetch account
            const accountRef = db.collection(token.bankId).doc('accounts').collection(type).doc(account);
            const accountDoc = await accountRef.get();
            if (!accountDoc.exists) {
                return res.status(404).send({ error: `Account ${account} not found in ${type}.` });
            }
            const accData = accountDoc.data();
            if (!accData || typeof accData !== 'object') {
                return res.status(500).send({ error: 'Account data corrupted.' });
            }

            let mainApplicantId = accData.applicants?.[0];
            if (!mainApplicantId || typeof mainApplicantId !== 'string') {
                mainApplicantId = accData.associatedEmployee;
            }
            if (!mainApplicantId || typeof mainApplicantId !== 'string') {
                return res.status(400).send({
                    error: 'Main applicant ID not found. Check applicants[0] or associatedEmployee.'
                });
            }

            //Fetch KYC
            let kycDoc = await db.collection(token.bankId).doc('kyc').collection('member-kyc').doc(mainApplicantId).get();

            if (!kycDoc.exists) {
                const uidFallback = accData.associatedEmployee;
                if (uidFallback && uidFallback !== mainApplicantId) {
                    const kycDoc2 = await db.collection(token.bankId).doc('kyc').collection('member-kyc').doc(uidFallback).get();
                    if (kycDoc2.exists) {
                        mainApplicantId = uidFallback;
                        kycDoc = kycDoc2;
                    }
                }
            }
            if (!kycDoc.exists) {
                return res.status(404).send({
                    error: 'KYC not found for applicant.',
                    applicantId: mainApplicantId,
                    associatedEmployee: accData.associatedEmployee
                });
            }
            const kycData = kycDoc.data();

            if (!kycData || typeof kycData !== 'object') {
                return res.status(500).send({
                    error: 'KYC record is missing or corrupted.',
                    details: 'No data found in KYC document.'
                });
            }

            if (!kycData.name) {
                return res.status(400).send({
                    error: 'KYC record is incomplete.',
                    missingField: 'name'
                });
            }

            if (!kycData.dob && !kycData.dateOfBirth) {
                return res.status(400).send({
                    error: 'KYC record is incomplete.',
                    missingField: 'dob or dateOfBirth'
                });
            }

            const kyc = kycData;


            const age = calculateAge(kyc.dob || kyc.dateOfBirth);
            const isSeniorCitizen = age !== null && age >= 60;

            const bankDoc = await db.collection(token.bankId).doc('admin').collection('bank-info').doc('details').get();
            const DEFAULT_BANK_INFO = {
                bankName: 'Your Financial Institution',
                address: 'Address not available',
                registrationCode: 'Reg. No. N/A',
                phone: 'Phone: N/A',
                email: 'Email: N/A',
                logo: ''
            };
            const bankInfo = bankDoc.exists ? {
                bankName: bankDoc.data().bankName || DEFAULT_BANK_INFO.bankName,
                address: bankDoc.data().address || DEFAULT_BANK_INFO.address,
                registrationCode: bankDoc.data().registrationCode || DEFAULT_BANK_INFO.registrationCode,
                phone: bankDoc.data().phone || DEFAULT_BANK_INFO.phone,
                email: bankDoc.data().email || DEFAULT_BANK_INFO.email,
                logo: bankDoc.data().logo || ''
            } : DEFAULT_BANK_INFO;
            let logoImage = null;
            if (bankInfo.logo) {
                try {
                    if (bankInfo.logo.startsWith('http')) {
                        // Fetch image from URL
                        const imageRes = await fetch(bankInfo.logo);
                        if (!imageRes.ok) throw new Error(`HTTP ${imageRes.status}`);
                        const arrayBuffer = await imageRes.arrayBuffer();
                        const bytes = new Uint8Array(arrayBuffer);

                        // Detect MIME type from response headers or filename
                        const contentType = imageRes.headers.get('content-type') || 'image/png';
                        if (contentType.includes('png')) {
                            logoImage = await pdfDoc.embedPng(bytes);
                        } else if (contentType.includes('jpeg') || contentType.includes('jpg')) {
                            logoImage = await pdfDoc.embedJpg(bytes);
                        } else {
                            console.warn('Unsupported logo format:', contentType);
                        }
                    } else if (bankInfo.logo.startsWith('data:image/')) {
                        // Base64 data URI
                        const matches = bankInfo.logo.match(/^data:image\/(\w+);base64,(.+)$/);
                        if (!matches) throw new Error('Invalid data URI format');
                        const [, format, base64] = matches;
                        const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

                        if (format === 'png') {
                            logoImage = await pdfDoc.embedPng(bytes);
                        } else if (format === 'jpeg' || format === 'jpg') {
                            logoImage = await pdfDoc.embedJpg(bytes);
                        } else {
                            console.warn('Unsupported base64 image format:', format);
                        }
                    }
                } catch (err) {
                    console.error('Failed to load/embed logo:', err.message);

                }
            }

            let principal = parseFloat(accData.openingAmount) || 0;
            if (principal === 0 && accData.planDetails?.minRdDdAmount) {
                principal = parseFloat(accData.planDetails.minRdDdAmount) || 1000;
            }

            const baseRate = parseFloat(accData.planDetails?.annualInterestRate) || 0;
            const srAddon = parseFloat(accData.planDetails?.srCitizenAddonRate) || 0;
            const effectiveRate = isSeniorCitizen ? baseRate + srAddon : baseRate;
            const rateDisplay = isSeniorCitizen
              ? `${baseRate}% + ${srAddon}% (SC)`
              : `${baseRate}%`;

            const tenureValue = parseFloat(accData.planDetails?.tenureOfRdDdValue) || 1;
            const tenureUnit = (accData.planDetails?.tenureOfRdDdUnit || 'YEARS').toUpperCase();
            const openingDate = accData.openingDate || new Date().toISOString().split('T')[0];

            const start = parseLocalDate(openingDate);
            const originalDay = start.getDate();
            if (tenureUnit === 'YEARS') {
                start.setFullYear(start.getFullYear() + tenureValue);
            } else if (tenureUnit === 'MONTHS') {
                start.setMonth(start.getMonth() + tenureValue);
                if (start.getDate() !== originalDay) start.setDate(0);
            } else if (tenureUnit === 'DAYS') {
                start.setDate(start.getDate() + tenureValue);
            }
            const maturityDate = formatLocalDate(start);

            const years = tenureUnit === 'YEARS' ? tenureValue :
              tenureUnit === 'MONTHS' ? tenureValue / 12 :
                tenureUnit === 'DAYS' ? tenureValue / 365 : 1;

            let maturityAmount = 0;
            let monthlyInterest = 0;
            if (type === 'fixed-deposit') {
                maturityAmount = principal * (1 + (effectiveRate / 100) * years);
            } else if (type === 'cash-certificate') {
                maturityAmount = principal * Math.pow(1 + (effectiveRate / 100), years);
            } else if (type === 'mis-deposit') {
                monthlyInterest = (principal * effectiveRate) / 100 / 12;
                maturityAmount = principal;
            }

            const tenureDisplay = tenureUnit === 'YEARS'
              ? `${tenureValue} Year${tenureValue > 1 ? 's' : ''}`
              : `${tenureValue} ${tenureUnit.toLowerCase()}`;

            const nominee = (accData.jointSurvivorName || '').trim() || 'N/A';
            const nominationRegistered = nominee === 'N/A' ? 'No' : 'Yes';

            let title = '', legalText = '', terms = [];
            switch (type) {
                case 'fixed-deposit':
                    title = 'FIXED DEPOSIT';
                    legalText = 'NON TRANSFERABLE';
                    terms = [
                        `This Fixed Deposit has been opened with ${bankInfo.bankName} in accordance with the applicable deposit rules and regulations of the institution.`,
                        'The deposit carries interest at the applicable rate, which shall be payable on maturity unless otherwise specified under the scheme.',
                        'Interest on the deposit shall be calculated as per the method and periodicity prescribed under the deposit scheme of the bank.',
                        'Premature closure of the deposit, if permitted, shall be governed by the prevailing rules of the bank and may attract applicable penalties or reduced interest.',
                        'Loans or advances against the Fixed Deposit may be permitted subject to the bank’s rules and terms applicable at the time.',
                        'The maturity proceeds shall be payable to the depositor or the registered nominee, subject to compliance with applicable norms and submission of required documents.',
                        'In the event of the depositor’s death, the settlement of the deposit shall be made in favour of the registered nominee or legal heir(s) in accordance with bank rules.',
                        'This Fixed Deposit is non-transferable and cannot be assigned, pledged, or otherwise encumbered except as permitted by the bank.',
                        'The bank reserves the right to amend, modify, or withdraw the terms and conditions of the deposit in accordance with regulatory or statutory requirements.'
                    ];
                    break;
                case 'cash-certificate':
                    title = 'CASH CERTIFICATE';
                    legalText = 'CUMULATIVE DEPOSIT';
                    terms = [
                        `This Cash Certificate is issued by ${bankInfo.bankName} in accordance with the applicable deposit rules and regulations of the institution.`,
                        'The deposit carries cumulative interest which is compounded at the applicable rate and is payable only on maturity.',
                        'Premature closure of the deposit, if permitted, shall be governed by the prevailing rules of the bank and may attract applicable penalties.',
                        'The maturity proceeds shall be payable to the depositor or the registered nominee, subject to compliance with applicable norms.',
                        'This Cash Certificate is non-transferable and cannot be assigned, pledged, or otherwise encumbered without prior written consent of the bank.',
                        'In the event of the depositor’s death, the settlement of the deposit shall be made in favour of the registered nominee or legal heir(s) as per bank rules.',
                        'The bank reserves the right to modify the terms and conditions of the deposit in accordance with regulatory or statutory requirements.'
                    ];
                    break;
                case 'mis-deposit':
                    title = 'MONTHLY INCOME SCHEME (MIS)';
                    legalText = 'MONTHLY INTEREST PAYOUT';
                    terms = [
                        `This Monthly Income Scheme (MIS) deposit has been opened with ${bankInfo.bankName} in accordance with the applicable deposit rules of the institution.`,
                        'Interest on the deposit shall be calculated at the applicable rate and paid on a monthly basis to the depositor.',
                        'The principal amount shall be repayable on maturity of the deposit.',
                        'Interest payout shall commence from the month following the date of deposit.',
                        'Premature closure of the deposit, if permitted, shall be governed by the prevailing rules of the bank and may attract applicable penalties.',
                        'The maturity proceeds shall be payable to the depositor or the registered nominee, subject to compliance with applicable norms.',
                        'This deposit is non-transferable and cannot be assigned or pledged without prior written consent of the bank.',
                        'In the event of the depositor’s death, the deposit shall be settled in favour of the registered nominee or legal heir(s) as per bank rules.',
                        'The bank reserves the right to amend the terms and conditions of the scheme in accordance with regulatory requirements.'
                    ];
                    break;
                default:
                    return res.status(400).send({ error: 'Invalid deposit type. Use: fixed-deposit, cash-certificate, mis-deposit' });
            }

            const pdfDoc = await PDFDocument.create();
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
            const PAGE_WIDTH = 595.28;
            const PAGE_HEIGHT = 841.89;
            const MARGIN = 50;
            const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN;

            let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
            let y = PAGE_HEIGHT - MARGIN;

            const drawText = (text, x, y, opts = {}) => {
                const safeText = (text == null) ? '' : String(text).trim();
                page.drawText(safeText, {
                    x,
                    y,
                    size: opts.size || 10,
                    font: opts.font || font,
                    color: opts.color || rgb(0, 0, 0),
                });
            };
            const drawMultilineText = (
              text,
              x,
              y,
              maxWidth,
              lineHeight = 14,
              opts = {}
            ) => {
                const lines = wrapText(text, opts.font || font, opts.size || 10, maxWidth);
                lines.forEach(line => {
                    if (y < MARGIN + 40) {
                        page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
                        y = PAGE_HEIGHT - MARGIN;
                    }
                    page.drawText(line, {
                        x,
                        y,
                        size: opts.size || 10,
                        font: opts.font || font,
                        color: opts.color || rgb(0, 0, 0),
                    });
                    y -= lineHeight;
                });
                return y;
            };

            if (logoImage) {
                const logoDims = logoImage.scale(0.6); // Adjust scale as needed
                const logoX = PAGE_WIDTH - MARGIN - logoDims.width;
                const logoY = PAGE_HEIGHT - MARGIN - logoDims.height;
                page.drawImage(logoImage, {
                    x: logoX,
                    y: logoY,
                    width: logoDims.width,
                    height: logoDims.height,
                });
            }



            const bankNameText = (bankInfo.bankName || 'BANK').toUpperCase();
            const bankNameWidth = boldFont.widthOfTextAtSize(bankNameText, 14);
            drawText(bankNameText, (PAGE_WIDTH - bankNameWidth) / 2, y, {
                size: 14,
                font: boldFont,
                color: rgb(0, 0.2, 0.4)
            });
            y -= 18;

            const bankAddr = bankInfo.address || 'Address not available';
            drawText(bankAddr, (PAGE_WIDTH - font.widthOfTextAtSize(bankAddr, 9)) / 2, y, { size: 9 });
            y -= 14;

            const regLine = `Reg: ${bankInfo.registrationCode || 'N/A'} | Ph: ${bankInfo.phone || 'N/A'} | Email: ${bankInfo.email || 'N/A'}`;
            drawText(regLine, (PAGE_WIDTH - font.widthOfTextAtSize(regLine, 8)) / 2, y, { size: 8, color: rgb(0.4, 0.4, 0.4) });
            y -= 25;

            // Title
            const titleWidth = boldFont.widthOfTextAtSize(title, 16);
            drawText(title, (PAGE_WIDTH - titleWidth) / 2, y, { size: 16, font: boldFont });
            y -= 20;

            const legalWidth = font.widthOfTextAtSize(legalText, 10);
            drawText(legalText, (PAGE_WIDTH - legalWidth) / 2, y, { size: 10, color: rgb(0.5, 0.5, 0.5) });
            y -= 30;

            // Depositor Info
            const depositorLines = [
                `Received From: ${kyc.name || 'N/A'}`,
                kyc.guardian ? `S/o, D/o, W/o: ${kyc.guardian}` : '',
                kyc.address || 'Address not provided',
                kyc.pincode ? `${kyc.pincode}` : '',
                'INDIA'
            ].filter(l => l.trim());

            const accountLines = [
                `Account No: ${account}`,
                `Scheme: ${accData.planDetails?.schemeName || 'N/A'}`,
                `Date of Deposit: ${formatDate(openingDate)}`
            ];

            let tempY = y;
            depositorLines.forEach(line => {
                tempY = drawMultilineText(
                  line,
                  MARGIN,
                  tempY,
                  CONTENT_WIDTH / 2 - 10,
                  14,
                  { size: 10 }
                );
            });
            tempY = y;
            accountLines.forEach(line => {
                tempY = drawMultilineText(
                  line,
                  PAGE_WIDTH - MARGIN - 250,
                  tempY,
                  240,
                  14,
                  { size: 10 }
                );
            });

            y = Math.min(tempY, y - 14 * Math.max(depositorLines.length, accountLines.length)) - 20;

            // Info Table
            const drawRow = (label, value, extraLabel = '', extraValue = '') => {
                if (y < MARGIN + 80) {
                    page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
                    y = PAGE_HEIGHT - MARGIN;
                }

                drawText(label + ':', MARGIN, y, { font: boldFont, size: 10 });

                const leftStartY = y;
                y = drawMultilineText(
                  value,
                  MARGIN + 150,
                  y,
                  180,
                  14,
                  { size: 10 }
                );

                let rightY = leftStartY;
                if (extraLabel) {
                    drawText(extraLabel + ':', MARGIN + 330, rightY, { font: boldFont, size: 10 });
                    rightY = drawMultilineText(
                      extraValue,
                      MARGIN + 450,
                      rightY,
                      140,
                      14,
                      { size: 10 }
                    );

                }

                y = Math.min(y, rightY) - 10;
            };


            drawRow(
              'Principal Amount',
              `${formatINR(principal)}
(${numberToWords(principal).toUpperCase()})`
              ,
              'Rate of Interest',
              `${rateDisplay} p.a.`
            );
            drawRow('Period', tenureDisplay);
            if (type === 'mis-deposit') {
                drawRow('Monthly Interest', formatINR(monthlyInterest), 'Principal Payable on Maturity', formatINR(principal));
            } else {
                drawRow('Maturity Amount', formatINR(maturityAmount));
            }
            drawRow('Maturity Date', formatDate(maturityDate), 'Nomination Registered', nominationRegistered);
            drawRow('PAN No', kyc.pan || 'N/A', 'Nominee Name', nominee);

            y -= 15;

            // Terms
            drawText('TERMS AND CONDITIONS', MARGIN, y, { font: boldFont, size: 11 });
            y -= 20;

            terms.forEach((term, i) => {
                const lines = wrapText(`${i + 1}. ${term}`, font, 9, CONTENT_WIDTH - 20);
                lines.forEach(line => {
                    if (y < MARGIN + 30) {
                        page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
                        y = PAGE_HEIGHT - MARGIN;
                    }
                    drawText(line, MARGIN, y, { size: 9 });
                    y -= 13;
                });
                y -= 8;
            });

            y -= 15;

            // Signature & Footer
            drawText('Customer Acknowledgement .................................. (Signature)', MARGIN, y, { size: 10 });
            y -= 40;
            drawText('Deposit received with thanks', MARGIN, y, { size: 10 });
            y -= 14;
            drawText(`For ${bankInfo.bankName}`, MARGIN, y, { size: 10 });
            y -= 20;
            drawText('This is a computer generated advice and does not require signature', MARGIN, y, {
                size: 8,
                color: rgb(0.5, 0.5, 0.5)
            });

            // Finalize
            const pdfBytes = await pdfDoc.save();
            const filename = `${title.replace(/\s+/g, '_')}_${(kyc.name || 'Member').replace(/\s+/g, '_')}_${account}.pdf`;

            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`
            });
            res.end(Buffer.from(pdfBytes));

        } catch (error) {
            console.error(`[Deposit Certificate Error] Type: ${type}, Account: ${account}`, error);
            return res.status(500).json({
                error: 'Failed to generate certificate.',
                message: error.message || 'Unknown error',
            });
        }
    });
}
