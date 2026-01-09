const { getFirestore} = require('firebase-admin/firestore');
const db = getFirestore();

module.exports = app=> {
    app.post('/api/report/deposit/get-detailList-updated', async function (req, res){
        const token = req.user;
        if (!token) return res.status(401).send({error: 'You are not authorized. Please log in.'});
        const accounts = [];
        let totalPrinciple = 0;
        const allCif = [];
        const allFutureTransactions = [];
        let cifIdentifier = 'member-kyc';
        
        Date.prototype.addDays = function(days) {
            let date = new Date(this.valueOf());
            date.setDate(date.getDate() + days);
            return date;
        }
        
        function processDate(date){
            // let date = new Date(tomorrow).addDays(i)
            let month = (date.getMonth() + 1);
            let day = date.getDate();
            if (month < 10)
                month = "0" + month;
            if (day < 10)
                day = "0" + day;
            return  date.getFullYear() + '-' + month + '-' + day;
        }
        
        function createDateArray(fromDate, toDate){
            if (toDate < fromDate){
                return [];
            }
            const dates = [];
            let startDate = new Date(fromDate);
            let date = '00';
            for (let i = 0; date !== toDate ; i++){
                const now = startDate.addDays(i);
                let month = (now.getMonth() + 1);
                let day = now.getDate();
                if (month < 10)
                    month = "0" + month;
                if (day < 10)
                    day = "0" + day;
                date = now.getFullYear() + '-' + month + '-' + day;
                dates.push(date);
            }
            return dates;
        }
        
        async function getAllCif(bankId){
            const getCif = await db.collection(bankId).doc('kyc').collection(cifIdentifier).get();
            getCif.forEach(function (querySnapshot){
                const cstObj = {
                    id: querySnapshot.id,
                    details: querySnapshot.data()
                };
                allCif.push(cstObj);
            });
            return null;
        }
        
        async function getAllFutureTransaction(bankId, date){
            const nextDate = processDate(new Date(date).addDays(1));
            const serverDate = processDate(new Date());
            const dateRange = createDateArray(nextDate, serverDate);
            for (let i = 0; i < dateRange.length ; i++){
                const dayTransaction = await db.collection(bankId).doc('transaction').collection(dateRange[i]).get();
                dayTransaction.forEach(function (trans){
                    allFutureTransactions.push(trans.data());
                });
            }
            return null;
        }
        
        async function fetchAccountDetail(accounts, bankId, accountType, date){
            await getAllFutureTransaction(bankId, date);
            
            await getAllCif(bankId);
            
            const detailList = [];
            for (let i = 0; i < accounts.length; i++) {
                let name = '';
                let guardian = '';
                let balance = parseFloat(accounts[i].details.balance || '0');
                allFutureTransactions.forEach(function (querySnapshot){
                    if (querySnapshot.account === accounts[i].account){
                        if (querySnapshot.type === 'debit'){
                            balance += parseFloat(querySnapshot.amount);
                        }else if (querySnapshot.type === 'credit'){
                            balance -= parseFloat(querySnapshot.amount);
                        }
                    }
                });
                totalPrinciple += balance;
                for (let j = 0; j < accounts[i].details.applicants.length; j++){
                    const cif = accounts[i].details.applicants[j];
                    for (let k = 0; k < allCif.length ; k++){
                        if (allCif[k].id === cif){
                            if (name === ''){
                                name += allCif[k].details.name;
                                guardian += allCif[k].details.guardian;
                            }else {
                                name += ' | ' + allCif[k].details.name;
                                guardian += ' | ' + allCif[k].details.guardian;
                            }
                            break;
                        }
                    }
                }
                const obj = {
                    serial: i + 1,
                    account: accounts[i].account,
                    name: name,
                    guardian: guardian,
                    amount: balance.toFixed(2),
                    interest: '',
                    oldAccount: accounts[i].details.oldAccount,
                    product: accounts[i].details.product,
                    referrer: accounts[i].details.referrer,
                    term: `${accounts[i].details.term} Year`,
                    openingDate: `${accounts[i].details.openingDate}`,
                }
                detailList.push(obj);
            }
            return {
                details: detailList,
                totalPrinciple,
            };
        }
        
        async function calculateAccountInterest(accounts, bankId){
            const detailList = [];
            for (let i = 0; i < accounts.length; i++) {
                const accountDetails = accounts[i].details;
                let name = '';
                let guardianName = '';
                const principle = parseFloat(accountDetails.balance || '0');
                totalPrinciple += principle;
                
                for (let j = 0; j < accounts[i].details.applicants.length; j++){
                    const cif = accounts[i].details.applicants[j];
                    const getCif = await db.collection(bankId).doc('kyc').collection(cifIdentifier).doc(cif.toString()).get();
                    if (name === ''){
                        name += getCif.data().name;
                        guardianName += getCif.data().guardian;
                    }else {
                        name += ' | ' + getCif.data().name;
                        guardianName += ' | ' + getCif.data().guardian;
                    }
                }
                const obj = {
                    oldAccount: accountDetails.oldAccount,
                    serial: i + 1,
                    account: accounts[i].account,
                    name: name,
                    guardian: guardianName,
                    amount: principle.toFixed(2),
                    interest: '',
                    referrer: accounts[i].details.referrer,
                    term: `${accounts[i].details.term} Year`,
                    openingDate: `${accounts[i].details.openingDate}`,
                };
                detailList.push(obj);
            }
            
            // return detailList;
            return {
                details: detailList,
                totalInterest: 0,
                totalPrinciple,
            };
        }
        
        try {
            const accountTypes = [];
            if (req.body.accountType === 'all'){
                accountTypes.push('savings', 'thrift-fund', 'cash-certificate', 'fixed-deposit', 'recurring-deposit', 'daily-savings');
            }else {
                accountTypes.push(req.body.accountType);
            }
            for (let i = 0; i < accountTypes.length; i++) {
                const accountInformation = await db.collection(token.bankId).doc('accounts').collection(accountTypes[i]).where('openingDate', '<=', req.body.date).get();
                accountInformation.forEach(function (account){
                    if (account.data().closed === false){
                        const accountInfo = {
                            account: account.id,
                            accountType: accountTypes[i],
                            details: account.data(),
                        };
                        accounts.push(accountInfo);
                    }
                });
            }
            if (req.body.accountType === 'savings' || req.body.accountType === 'thrift-fund' || req.body.accountType === 'all'){
                const accountDetailList = await fetchAccountDetail(accounts, token.bankId, req.body.accountType, req.body.date);
                res.send({success: `fetched details for ${req.body.accountType}`,details: accountDetailList});
            }else if (req.body.accountType === 'fixed-deposit'|| req.body.accountType === 'cash-certificate' || req.body.accountType === 'recurring-deposit' || req.body.accountType === 'daily-savings' ){
                const accountDetailList = await calculateAccountInterest(accounts, token.bankId);
                res.send({success: `fetched details for ${req.body.accountType}`, details: accountDetailList});
            }else {
                res.send({error: `invalid account type selected: ${req.body.accountType}`});
            }
        } catch (error) {
            console.log(error)
            res.send({error: "Failed to fetch detail list. try again..."})
        }
        
    });
}