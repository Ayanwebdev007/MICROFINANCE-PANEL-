const { getFirestore} = require('firebase-admin/firestore');
const db = getFirestore();

module.exports = app=> {
    app.post('/api/reports/loan/repayment-report', async function (req, res){
        const token = req.user;
        if (!token) return res.status(401).send({error: 'You are not authorized. Please log in.'});
        
        const loanAccounts = [];
        const accounts = [];
        
        try {
            const bankId = token.bankId;
            if (req.body.agent === 'all' || req.body.accountType === 'loan'){
                const getAccount = await db.collection(bankId).doc('accounts').collection(req.body.accountType).get();
                getAccount.forEach(function (account){
                    if (account.data().closed !== true){
                        loanAccounts.push({account: account.id, ...account.data()});
                    }
                });
            }else {
                const getAccount = await db.collection(bankId).doc('accounts').collection(req.body.accountType).where('referrer', '==', req.body.agent).orderBy('openingDate').get();
                getAccount.forEach(function (account){
                    if (account.data().closed !== true){
                        loanAccounts.push({account: account.id, ...account.data()});
                    }
                });
            }
            
            for (let i = 0; i < loanAccounts.length; i++) {
                const account = loanAccounts[i]
                const cifInfo = await db.collection(bankId).doc('kyc').collection('member-kyc').doc(account.applicants[0]).get();
                if (req.body.accountType === 'loan'){
                    accounts.push({
                        name: cifInfo.data().name,
                        phone: cifInfo.data().phone || '',
                        account: account.account,
                        disbursement: account.disbursement,
                        installmentAmount: account.emiAmount || 0,
                        interestInstallment: account.interestEMI || 0,
                        principleInstallment: account.principleEMI || 0,
                        principle: account.principle || 0,
                        openingDate: account.disbursementDate || account.openingDate,
                        termPeriod: account.totalEMI || 0,
                        installment: (parseInt(account.paidEMI) || 0).toString(),
                    });
                }else {
                    const groupInfo = await db.collection(bankId).doc('kyc').collection('group').doc(cifInfo.data().group || '100000').get()
                    accounts.push({
                        name: cifInfo.data().name,
                        phone: cifInfo.data().phone || '',
                        account: account.account,
                        disbursement: account.disbursement,
                        installmentAmount: account.emiAmount || 0,
                        interestInstallment: account.interestEMI || 0,
                        principleInstallment: account.principleEMI || 0,
                        principle: account.principle || 0,
                        openingDate: account.disbursementDate || account.openingDate,
                        referrer: groupInfo.data().referrer || '',
                        termPeriod: account.totalEMI || 0,
                        installment: (parseInt(account.paidEMI) || 0).toString(),
                        groupId: cifInfo.data().group,
                        groupName: groupInfo.data().name,
                    });
                }
            }
            res.send({success: 'successfully fetched accounts details', details: accounts});
        } catch (error) {
            console.log(error);
            res.send({error: "Failed to fetch repayment report. try again..."})
            
        }
    });
}