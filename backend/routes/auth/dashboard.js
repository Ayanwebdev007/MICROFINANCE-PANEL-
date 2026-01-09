const {getFirestore, AggregateField} = require('firebase-admin/firestore');
const db = getFirestore();

module.exports = app => {
    app.get('/api/auth/dashboard-counts', async function (req, res) {
        const token = req.user;
        if (!token) return res.status(401).send({error: 'You are not authorized. Please log in.'});

        const systemDate = new Date().toISOString().slice(0, 10);
        const otherDepositAccountTypes = ['thrift-fund', 'cash-certificate', 'fixed-deposit', 'recurring-deposit', 'daily-savings', 'mis-deposit'];

        try {
            const userProfileInfo = await db.collection(token.bankId).doc('admin').collection('users').doc(token.uid).get();
            let kycColRef = db.collection(token.bankId).doc('kyc').collection('member-kyc');
            if (token.role !== 'root' && token.role !== 'admin' && userProfileInfo.data()?.accessLevel?.fullDataAccess !== true) {
                kycColRef = kycColRef.where('associatedEmployee', '==', token.uid);
            }
            const getKycCount = await kycColRef.count().get();
            const kycCount = getKycCount.data().count || 0;

            // Group Count
            let groupColRef = db.collection(token.bankId).doc('kyc').collection('group');
            if (token.role !== 'root' && token.role !== 'admin' && userProfileInfo.data()?.accessLevel?.fullDataAccess !== true) {
                groupColRef = groupColRef.where('associatedEmployee', '==', token.uid);
            }
            const getGroupCount = await groupColRef.count().get();
            const groupCount = (getGroupCount.data().count - 1) || 0;

            // Savings Balance
            let savingsColRef = db.collection(token.bankId).doc('accounts').collection('savings');
            if (token.role !== 'root' && token.role !== 'admin' && userProfileInfo.data()?.accessLevel?.fullDataAccess !== true) {
                savingsColRef = savingsColRef.where('associatedEmployee', '==', token.uid);
            }
            const savingsSumAggregateQuery = savingsColRef.aggregate({
                totalBalance: AggregateField.sum('balance'),
            });
            const savingsBalanceSnapshot = await savingsSumAggregateQuery.get();
            const totalSavings = savingsBalanceSnapshot.data().totalBalance || 0;

            // Get Deposit Balance
            let totalDeposit = 0;
            for (let i = 0; i < otherDepositAccountTypes.length; i++) {
                let depositColRef = db.collection(token.bankId).doc('accounts').collection(otherDepositAccountTypes[i]);
                if (token.role !== 'root' && token.role !== 'admin' && userProfileInfo.data()?.accessLevel?.fullDataAccess !== true) {
                    depositColRef = depositColRef.where('associatedEmployee', '==', token.uid);
                }
                const depositSumAggregateQuery = depositColRef.aggregate({
                    totalBalance: AggregateField.sum('balance'),
                });
                const depositBalanceSnapshot = await depositSumAggregateQuery.get();
                const depositBalance = depositBalanceSnapshot.data().totalBalance || 0;
                totalDeposit += depositBalance;
            }

            // Get Loan Balance
            let totalLoan = 0;
            let loanColRef = db.collection(token.bankId).doc('accounts').collection('loan').where('closed', '==', false);
            if (token.role !== 'root' && token.role !== 'admin' && userProfileInfo.data()?.accessLevel?.fullDataAccess !== true) {
                loanColRef = loanColRef.where('associatedEmployee', '==', token.uid);
            }
            const getLoanCol = await loanColRef.get();
            getLoanCol.forEach(function (loan) {
                const pendingLoan = parseFloat(loan.data().emiAmount || 0) * (parseFloat(loan.data().totalEMI || 0) - parseFloat(loan.data().paidEMI || 0));
                totalLoan += pendingLoan;
            });

            // Get Group Loan Balance
            let totalGroupLoan = 0;
            let groupLoanColRef = db.collection(token.bankId).doc('accounts').collection('group-loan').where('closed', '==', false);
            if (token.role !== 'root' && token.role !== 'admin' && userProfileInfo.data()?.accessLevel?.fullDataAccess !== true) {
                groupLoanColRef = groupLoanColRef.where('associatedEmployee', '==', token.uid);
            }
            const getGroupLoanCol = await groupLoanColRef.get();
            getGroupLoanCol.forEach(function (loan) {
                const pendingLoan = parseFloat(loan.data().emiAmount || 0) * (parseFloat(loan.data().totalEMI || 0) - parseFloat(loan.data().paidEMI || 0));
                totalGroupLoan += pendingLoan;
            });

            const dayBookRef = db.collection(token.bankId).doc('scheduler').collection('daily-book').doc('value');
            const dayBookInfo = await dayBookRef.get();
            const dayBookData = dayBookInfo.data() || {};
            const performanceObj = dayBookData.performanceObj || {};

            let cashInHand = dayBookData.cashInHand || 0;

            // Get DayBook Data
            const dayBookTrans = await db.collection(token.bankId).doc('transaction').collection(systemDate).get();
            dayBookTrans.forEach(function (transaction) {
                // Get Deposit Transaction Amounts
                if (transaction.data().type === 'credit') {
                    cashInHand += parseFloat(transaction.data().amount);
                } else {
                    cashInHand -= parseFloat(transaction.data().amount);
                }
            });

            // Get Balance with other Bank
            const bankBalanceRef = await db.collection(token.bankId).doc('balance');
            const bankBalanceInfo = await bankBalanceRef.get();

            res.send({
                success: 'Successfully fetched dashboard details',
                kycCount: kycCount,
                advisorCount: 0,
                groupCount: groupCount,
                totalSavings: totalSavings,
                totalDeposit: totalDeposit,
                totalLoan: totalLoan,
                totalGroupLoan: totalGroupLoan,
                cashInHand: cashInHand,
                bankBalance: bankBalanceInfo.data()?.balance || 0,
                chartData: {
                    weekday0: performanceObj.weekday0 || {},
                    weekday1: performanceObj.weekday1 || {},
                    weekday2: performanceObj.weekday2 || {},
                    weekday3: performanceObj.weekday3 || {},
                    weekday4: performanceObj.weekday4 || {},
                    weekday5: performanceObj.weekday5 || {},
                    weekday6: performanceObj.weekday6 || {},
                }
            });
        } catch (error) {
            console.log("dashboard details error: ", error);
            res.send({error: "Failed to fetch dashboard details. try again..."})

        }

    });

    app.get('/api/scheduler/calculate-daily-dashboard-data', async function (req, res) {
        const depositAccountTypes = ['savings', 'thrift-fund', 'cash-certificate', 'fixed-deposit', 'recurring-deposit', 'daily-savings'];
        const loanAccountTypes = ['loan', 'group-loan'];
        const registeredBanks = [];
        const systemDate = new Date().toISOString().slice(0, 10);

        const registeredBankColRef = db.collection('admin').doc('organization').collection('banks');
        const getBanksInfo = await registeredBankColRef.get();
        getBanksInfo.forEach(function (bank) {
            registeredBanks.push(bank.id);
        });

        for (const bankId of registeredBanks) {
            let totalSavings = 0;
            let totalDeposit = 0;
            let totalLoan = 0;
            let totalGroupLoan = 0;
            const totalSumObj = {
                debitAmount: 0,
                creditAmount: 0,
            };
            let totalLoanCollection = 0;
            let depositTransaction = 0;

            // Get Deposit Amounts
            for (let i = 0; i < depositAccountTypes.length; i++) {
                const accountType = depositAccountTypes[i];
                const depositAccountColRef = db.collection(bankId).doc('accounts').collection(accountType).where('closed', '==', false);
                const getAccounts = await depositAccountColRef.get();
                getAccounts.forEach(function (account) {
                    if (accountType === 'savings') {
                        totalSavings += parseFloat(account.data().balance || 0);
                    } else {
                        totalDeposit += parseFloat(account.data().balance || 0);
                    }
                });
            }

            // Get Loan Disbursement Amounts
            for (let i = 0; i < loanAccountTypes.length; i++) {
                const accountType = loanAccountTypes[i];
                const loanAccountColRef = db.collection(bankId).doc('accounts').collection(accountType).where('closed', '==', false);
                const getAccounts = await loanAccountColRef.get();
                getAccounts.forEach(function (account) {
                    if (accountType === 'loan') {
                        totalLoan += parseFloat(account.data().disbursement || 0);
                    } else {
                        totalGroupLoan += parseFloat(account.data().disbursement || 0);
                    }
                });
            }

            // Set Daily Book Data
            const dayBookRef = db.collection(bankId).doc('scheduler').collection('daily-book').doc('value');
            const dayBookInfo = await dayBookRef.get();
            const dayBookData = dayBookInfo.data() || {};
            if (dayBookData.date) {
                const dayBookBackupRef = db.collection(bankId).doc('scheduler').collection('daily-book').doc(dayBookData.date);
                await dayBookBackupRef.set(dayBookData);
            }

            // Get DayBook Data
            const dayBookTrans = await db.collection(bankId).doc('transaction').collection(systemDate).get();
            dayBookTrans.forEach(function (transaction) {
                if (transaction.data().type === 'credit') {
                    totalSumObj.creditAmount += parseFloat(transaction.data().amount);
                } else {
                    totalSumObj.debitAmount += parseFloat(transaction.data().amount);
                }

                // Get Deposit Transaction Amounts
                if (depositAccountTypes.includes(transaction.data().accountType)) {
                    if (transaction.data().type === 'credit') {
                        depositTransaction += parseFloat(transaction.data().amount);
                    } else {
                        depositTransaction -= parseFloat(transaction.data().amount);
                    }
                }
                // Get Loan Repayment Amounts
                if (loanAccountTypes.includes(transaction.data().accountType)) {
                    if (transaction.data().type === 'credit') {
                        totalLoanCollection += parseFloat(transaction.data().amount);
                    }
                }
            });

            // Calculate Performance Data
            const weekday = new Date().getDay();
            const performanceObj = weekday === 0 ? {} : dayBookData;
            performanceObj[`weekday${weekday}`] = {
                depositAmount: depositTransaction,
                loanCollection: totalLoanCollection,
                cashInHand: totalSumObj.creditAmount - totalSumObj.debitAmount,
            };


            await dayBookRef.set({
                date: new Date().toISOString().slice(0, 10),
                totalSavings: totalSavings,
                totalDeposit: totalDeposit,
                totalLoan: totalLoan,
                totalGroupLoan: totalGroupLoan,
                depositTransaction: depositTransaction,
                totalLoanCollection: totalLoanCollection,
                cashInHand: (dayBookData.cashInHand || 0) + totalSumObj.creditAmount - totalSumObj.debitAmount,
                performanceObj: performanceObj,
            });
        }

        res.send({success: 'Success'});
    });

    app.get('/api/wallet/balance', async function (req, res) {
        const token = req.user;
        if (!token) return res.status(401).send({error: 'You are not authorized. Please log in.'});

        try {
            const mainBranchRef = db.collection('admin').doc('organization').collection('banks').doc(token.bankId);
            const mainBranchInfo = await mainBranchRef.get();
            const mainBranchId = mainBranchInfo.data().mainBranchId || token.bankId;

            const walletBalance = await db.collection(mainBranchId).doc('wallet').get();
            const walletBalanceData = walletBalance.data() || {};
            const walletBalanceAmount = walletBalanceData.balance || 0;
            res.send({success: 'Successfully fetched wallet balance', walletBalanceAmount: walletBalanceAmount});
        } catch (error) {
            console.log("wallet balance error: ", error);
            res.send({error: "Failed to fetch walet balance. try again..."})

        }
    });

}
