const admin = require("firebase-admin");
const db = admin.firestore();
const axios = require('axios');

module.exports = app=> {
    app.post('/api/report/deposit/detail-list', async function (req, res){
        const sessionCookie = req.cookies.session || "";

        admin
            .auth()
            .verifySessionCookie(sessionCookie, false)
            .then(async (token) => {
                const getLiveDate = await db.collection(token.bankId).doc('admin').collection('bank-info').doc('details').get();
                if (new Date(getLiveDate.data().liveDate) - new Date(req.body.date) <= 0){
                    const requestBody = {...req.body,token: token, auth: "z1UgnkNexZ2Bcgrb3QwMFD!zsfdHiATowvu3&oJEXa1"}
                    // const detailList = await axios.post('https://asia-south1-banksoft-dev.cloudfunctions.net/D_DTList_r7yLZe0kX1SD7kn', requestBody);
                    const detailList = await axios.post('https://asia-south1-banksoft-prod.cloudfunctions.net/D_DTList_r7yLZe0kX1SD7kn', requestBody);
                    if (detailList.data.details){
                        res.send({details: detailList.data.details});
                    }else {
                        res.send({error: detailList.data.error});
                    }
                }else {
                    res.send({error: `migration date is ${getLiveDate.data().liveDate}`});
                }

            })
            .catch((error) => {
                console.log(error);
                res.send({error: 'Authentication error! try logout and then logback in'});
            });


        // // #############  Cloud function deployed ########
        const accounts = [];
        let totalPrinciple = 0;
        let totalInterest = 0;
        const allCif = [];
        const allFutureTransactions = [];
        let cifIdentifier;

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

        // ####################### New Approach ####################

        async function getAllCif(bankId, accountType){
            if (accountType === 'shg'){
                cifIdentifier = 'shg-cif'
            }else {
                cifIdentifier = 'client-cif'
            }
            const getCif = await db.collection(bankId).doc('kyc').collection(cifIdentifier).get();
            getCif.forEach(function (querySnapshot){
                const cstObj = {
                    id: querySnapshot.id,
                    details: querySnapshot.data()
                };
                allCif.push(cstObj);
            });
            console.log('all cif')
            return null;
        }

        async function getAllFutureTransaction(bankId, date){
            const nextDate = processDate(new Date(date).addDays(1));
            const serverDate = processDate(new Date());
            const dateRange = createDateArray(nextDate, serverDate);
            for (let i = 0; i < dateRange.length ; i++){
                const dayTransaction = await db.collection(bankId).doc('transactions').collection(dateRange[i]).get();
                dayTransaction.forEach(function (trans){
                    allFutureTransactions.push(trans.data());
                });
            }
            return null;
        }

        async function fetchAccountDetail(accounts, bankId, accountType, date){
            await getAllFutureTransaction(bankId, date);

            if (accountType === 'savings'){
                await getAllCif(bankId, accountType);
            }

            const detailList = [];
            for (let i = 0; i < accounts.length; i++) {
                let name = '';
                let guardianName = '';
                let balance = parseFloat(accounts[i].details.availableBalance || 0);
                allFutureTransactions.forEach(function (querySnapshot){
                    if (querySnapshot.acNumber === accounts[i].accountNumber)
                        if (querySnapshot.transactionType === 'Debited'){
                            balance += parseFloat(querySnapshot.amountCreditDebit);
                        }else if (querySnapshot.transactionType === 'Credited'){
                            balance -= parseFloat(querySnapshot.amountCreditDebit);
                        }
                });
                totalPrinciple += balance;
                if (accountType === 'no-frill' || accountType === 'thrift-fund' || accountType === 'jlg'){
                    for (let j = 0; j < accounts[i].details.applicants.length; j++){
                        const cif = accounts[i].details.applicants[j];
                        const getCif = await db.collection(bankId).doc('kyc').collection('client-cif').doc(cif.toString()).get();
                        if (name === ''){
                            name += getCif.data().name;
                            guardianName += getCif.data().guardianName;
                        }else {
                            name += ' | ' + getCif.data().name;
                            guardianName += ' | ' + getCif.data().guardianName;
                        }
                    }
                }else if (accountType === 'savings'){
                    for (let j = 0; j < accounts[i].details.applicants.length; j++){
                        const cif = accounts[i].details.applicants[j];
                        for (let k = 0; k < allCif.length ; k++){
                            if (allCif[k].id === cif){
                                if (name === ''){
                                    name += allCif[k].details.name;
                                    guardianName += allCif[k].details.guardianName;
                                }else {
                                    name += ' | ' + allCif[k].details.name;
                                    guardianName += ' | ' + allCif[k].details.guardianName;
                                }
                                break;
                            }
                        }
                    }
                } else if (accountType === 'shg'){
                    const shgCif = accounts[i].details.shgCif;
                    const getCif = await db.collection(bankId).doc('kyc').collection('shg-cif').doc(shgCif).get();
                    name += getCif.data().groupName;
                    guardianName += getCif.data().leaderName;
                }else if (accountType === 'share-account'){
                    const cifId = accounts[i].details.cifId;
                    const getCif = await db.collection(bankId).doc('kyc').collection('client-cif').doc(cifId).get();
                    name += getCif.data().name;
                    guardianName += getCif.data().guardianName;
                }
                const obj = {
                    serial: i + 1,
                    accountNumber: accounts[i].accountNumber,
                    name: name,
                    guardianName: guardianName,
                    amount: balance.toFixed(2),
                    interest: '',
                    oldAccount: accounts[i].details.oldAccount,
                    cbsAccount: accounts[i].details.cbsAccount
                }
                detailList.push(obj);
                // console.log(totalPrinciple);
            }
            // return detailList;
            return {
                details: detailList,
                totalPrinciple,
            };
        }

        // ################ Legacy Approach ####################

        // async function fetchAccountDetail(accounts, bankId, accountType, date){
        //     const detailList = [];
        //     for (let i = 0; i < accounts.length; i++) {
        //         const accountNumber = accounts[i].accountNumber;
        //         let name = '';
        //         let guardianName = '';
        //         let balance = parseFloat(accounts[i].details.availableBalance || 0);
        //         const transactions = await db.collection(bankId).doc('accounts').collection(accountType).doc(accountNumber)
        //             .collection('transactions').where("entryDate", ">", date).get();
        //         transactions.forEach(function (querySnapshot){
        //             if (querySnapshot.data().transactionType === 'Debited'){
        //                 balance += parseFloat(querySnapshot.data().amountCreditDebit);
        //             }else if (querySnapshot.data().transactionType === 'Credited'){
        //                 balance -= parseFloat(querySnapshot.data().amountCreditDebit);
        //             }
        //         });
        //         totalPrinciple += balance;
        //         if (accountType === 'savings' || accountType === 'no-frill' || accountType === 'thrift-fund' || accountType === 'jlg'){
        //             for (let j = 0; j < accounts[i].details.applicants.length; j++){
        //                 const cif = accounts[i].details.applicants[j];
        //                 const getCif = await db.collection(bankId).doc('kyc').collection('client-cif').doc(cif.toString()).get();
        //                 if (name === ''){
        //                     name += getCif.data().name;
        //                     guardianName += getCif.data().guardianName;
        //                 }else {
        //                     name += ' | ' + getCif.data().name;
        //                     guardianName += ' | ' + getCif.data().guardianName;
        //                 }
        //             }
        //         }else if (accountType === 'shg'){
        //             const shgCif = accounts[i].details.shgCif;
        //             const getCif = await db.collection(bankId).doc('kyc').collection('shg-cif').doc(shgCif).get();
        //             name += getCif.data().groupName;
        //             guardianName += getCif.data().leaderName;
        //         }else if (accountType === 'share-account'){
        //             const cifId = accounts[i].details.cifId;
        //             const getCif = await db.collection(bankId).doc('kyc').collection('client-cif').doc(cifId).get();
        //             name += getCif.data().name;
        //             guardianName += getCif.data().guardianName;
        //         }
        //         const obj = {
        //             serial: i + 1,
        //             accountNumber: accountNumber,
        //             name: name,
        //             guardianName: guardianName,
        //             amount: balance.toFixed(2),
        //             interest: '',
        //             oldAccount: accounts[i].details.oldAccount,
        //             cbsAccount: accounts[i].details.cbsAccount
        //         }
        //         detailList.push(obj);
        //         // console.log(totalPrinciple);
        //     }
        //     // return detailList;
        //     return {
        //         details: detailList,
        //         totalPrinciple,
        //     };
        // }

        // ########################################################

        async function calculateAccountInterest(accounts, bankId, accountType, date){
            const detailList = [];
            for (let i = 0; i < accounts.length; i++) {
                const accountDetails = accounts[i].details;
                let name = '';
                let guardianName = '';
                const principle = parseFloat(accountDetails.availableBalance || 0);
                const time = parseFloat(calculateDateDifference(date, accountDetails.openingDate)/365);
                const r = parseFloat(accountDetails.interest);
                let interest = 0;
                if (accountType === 'fixed-deposit'){
                    if (accountDetails.calculationRule ==='compoundMonthly'){
                        interest = principle * Math.pow((1 + (r / (12 * 100))), (12 * time)) - principle;
                    }else if (accountDetails.calculationRule === "compoundQuarterly") {
                        interest = principle * Math.pow((1 + (r / (4 * 100))), (4 * time)) - principle;
                    }else {
                        interest = principle * r * time /100;
                    }
                    totalPrinciple += principle;
                    totalInterest += interest;
                }else if (accountType === 'recurring-deposit'){
                    const balance = accountDetails.depositAmount;
                    const quarters = Math.floor(time * 4);
                    interest = balance * ((Math.pow(r / 400 + 1, quarters) - 1) / (1-(Math.pow(r / 400 + 1,(-1/3))))) - balance;  // If Compound Interest
                    // interest = (balance * time * 12 * (time*12 + 1) * r)/(2 * 100);  // Simple Interest
                    totalPrinciple += principle;
                    totalInterest += interest;
                }else if (accountType === 'mis-deposit'){
                    interest = principle * r/(12*100);
                    totalPrinciple += principle;
                    totalInterest += interest;
                }else if (accountType === 'cash-certificate'){
                    interest = principle * Math.pow((1 + (r / (4 * 100))), (4 * time)) - principle;
                    totalPrinciple += principle;
                    totalInterest += interest;
                }

                for (let j = 0; j < accounts[i].details.applicants.length; j++){
                    const cif = accounts[i].details.applicants[j];
                    const getCif = await db.collection(bankId).doc('kyc').collection('client-cif').doc(cif.toString()).get();
                    if (name === ''){
                        name += getCif.data().name;
                        guardianName += getCif.data().guardianName;
                    }else {
                        name += ' | ' + getCif.data().name;
                        guardianName += ' | ' + getCif.data().guardianName;
                    }
                }
                const obj = {
                    serial: i + 1,
                    accountNumber: accounts[i].accountNumber,
                    name: name,
                    guardianName: guardianName,
                    amount: principle.toFixed(2),
                    interest: interest.toFixed(2),
                    oldAccount: accountDetails.oldAccount,
                    cbsAccount: accountDetails.cbsAccount
                };
                detailList.push(obj);
            }

            // return detailList;
            return {
                details: detailList,
                totalInterest,
                totalPrinciple,
            };
        }

        function calculateDateDifference(start, end){
            const startDate = new Date(start);
            const endDate = new Date(end);
            return (startDate-endDate)/(1000*3600*24);
        }

        admin
            .auth()
            .verifySessionCookie(sessionCookie, false)
            .then(async (token) => {
                const accountInformation = await db.collection(token.bankId).doc('accounts').collection(req.body.accountType).where('openingDate', '<=', req.body.date).get();
                accountInformation.forEach(function (account){
                    const accountInfo = {
                        accountNumber: account.id,
                        details: account.data()
                    };
                    accounts.push(accountInfo);
                });
                if (req.body.accountType === 'savings' || req.body.accountType === 'no-frill' || req.body.accountType === 'thrift-fund' || req.body.accountType === 'shg' || req.body.accountType === 'jlg' || req.body.accountType === 'share-account'){
                    const accountDetailList = await fetchAccountDetail(accounts, token.bankId, req.body.accountType, req.body.date);
                    res.send({details: accountDetailList});
                }else if (req.body.accountType === 'fixed-deposit' || req.body.accountType === 'cash-certificate' || req.body.accountType === 'recurring-deposit' || req.body.accountType === 'mis-deposit'){
                    const accountDetailList = await calculateAccountInterest(accounts, token.bankId, req.body.accountType, req.body.date);
                    res.send({details: accountDetailList});
                }else {
                    res.send({error: `invalid account type selected: ${req.body.accountType}`});
                }

            })
            .catch((error) => {
                console.log(error)
                res.send({error: 'Authentication error, login required'});
            });
    });

    app.post('/api/report/loan/detail-list', async function (req, res){
        const sessionCookie = req.cookies.session || "";

        admin
            .auth()
            .verifySessionCookie(sessionCookie, false)
            .then(async (token) => {
                const requestBody = {...req.body,token: token, auth: "L&fTj5Q@7uVp&bDpd3#Vt5RG9rj&lMLuk^9&znq#e47lyy"}
                // const detailList = await axios.post('https://asia-south1-banksoft-dev.cloudfunctions.net/L_DTList_p3FkRgSOx8kB6jI', requestBody);
                const detailList = await axios.post('https://asia-south1-banksoft-prod.cloudfunctions.net/L_DTList_p3FkRgSOx8kB6jI', requestBody);
                if (detailList.data.details){
                    res.send({details: detailList.data.details});
                }else {
                    res.send({error: detailList.data.error});
                }

            })
            .catch((error) => {
                console.log(error);
                res.send({error: 'Authentication error! try logout and then logback in'});
            });

        // L&fTj5Q@7uVp&bDpd3#Vt5RG9rj&lMLuk^9&znq#e47lyy
        // #############  Cloud function deployed ########
        // const accounts = [];
        // async function calculateAccountInterest(accounts, bankId, accountType, date){
        //     const detailList = [];
        //     let totalLoanDisburse = 0;
        //     let totalLoanCurrentInterest = 0;
        //     let totalLoanOverdueInterest = 0;
        //     let totalLoanOverduePrinciple = 0;
        //     let totalLoanOutstandingPrinciple = 0;
        //     for (let i = 0; i < accounts.length; i++) {
        //         const accountDetails = accounts[i].details;
        //         const principle = parseFloat(accountDetails.principle || 0);
        //         const time = parseFloat(calculateDateDifference(date, accountDetails.transactionDate)/365);
        //         const r = parseFloat(accountDetails.rateOfInterest);
        //         const pr = parseFloat(accountDetails.rateOfInterest) + parseFloat(accountDetails.penalRoi);
        //         let interestCurrent = 0;
        //         let interestOverdue = 0;
        //         let principleOverdue = 0;
        //         if (accountType === 'farm-loan'){
        //             if (calculateDateDifference(accountDetails.lastRepayDate, date) >= 0){
        //                 interestCurrent = Math.round(principle * time * (r/100)) + parseFloat(accountDetails.overdueInterest || '0');
        //                 totalLoanCurrentInterest += interestCurrent;
        //                 interestOverdue = 0;
        //             }else {
        //                 interestCurrent = 0;
        //                 interestOverdue = principle * time * (pr/100) + parseFloat(accountDetails.overdueInterest || '0');
        //                 totalLoanOverdueInterest += interestOverdue;
        //                 principleOverdue = principle;
        //                 totalLoanOverduePrinciple += principleOverdue;
        //             }
        //         }else if (accountType === 'non-farm-loan' || accountType === 'shg-loan'){
        //             const lastRepayPeriod = parseInt(accountDetails.loanPeriodMonth) * 30 + parseInt(accountDetails.loanPeriodDays);
        //             if (accountDetails.calculationRule === 'compoundQuarterly'){
        //                 if (parseInt(calculateDateDifference(date, accountDetails.disbursementDate)) <= lastRepayPeriod){
        //                     interestCurrent = principle * Math.pow((1 + (r / (4 * 100))), (4 * time)) - principle + parseFloat(accountDetails.overdueInterest || '0');
        //                     totalLoanCurrentInterest += interestCurrent;
        //                     interestOverdue = 0;
        //                 }else {
        //                     interestCurrent = 0;
        //                     interestOverdue = principle * Math.pow((1 + (pr / (4 * 100))), (4 * time)) - principle + parseFloat(accountDetails.overdueInterest || '0');
        //                     totalLoanOverdueInterest += interestOverdue;
        //                     principleOverdue = principle;
        //                     totalLoanOverduePrinciple += principleOverdue;
        //                 }
        //             }else {
        //                 if (parseInt(calculateDateDifference(date, accountDetails.disbursementDate)) <= lastRepayPeriod){
        //                     interestCurrent = principle * time * (r/100) + parseFloat(accountDetails.overdueInterest || '0');
        //                     totalLoanCurrentInterest += interestCurrent;
        //                     interestOverdue = 0;
        //                 }else {
        //                     interestCurrent = 0;
        //                     interestOverdue = principle * time * (pr/100) + parseFloat(accountDetails.overdueInterest || '0');
        //                     totalLoanOverdueInterest += interestOverdue;
        //                     principleOverdue = principle;
        //                     totalLoanOverduePrinciple += principleOverdue;
        //                 }
        //             }
        //         }
        //         totalLoanDisburse += parseInt(accountDetails.disbursement);
        //         totalLoanOutstandingPrinciple += principle;
        //         const cif = accountDetails.cifId;
        //         let name = '';
        //         let guardianName = '';
        //         if (accountType === 'shg-loan'){
        //             const getCif = await db.collection(bankId).doc('kyc').collection('shg-cif').doc(cif.toString()).get();
        //             name = getCif.data().groupName;
        //             guardianName = getCif.data().leaderName;
        //         }else {
        //             const getCif = await db.collection(bankId).doc('kyc').collection('client-cif').doc(cif.toString()).get();
        //             name = getCif.data().name;
        //             guardianName = getCif.data().guardianName;
        //         }
        //         const obj = {
        //             serial: i + 1,
        //             accountNumber: accounts[i].accountNumber,
        //             name: name,
        //             guardianName: guardianName,
        //             disbursementDate: accountDetails.disbursementDate,
        //             disbursement: accountDetails.disbursement,
        //             interestCurrent: interestCurrent.toFixed(2),
        //             interestOverdue: interestOverdue.toFixed(2),
        //             principleOverdue: principleOverdue.toFixed(2),
        //             principleOutstanding: principle.toFixed(2),
        //         };
        //         detailList.push(obj);
        //     }
        //
        //     // return detailList;
        //     return {
        //         details: detailList,
        //         totalLoanCurrentInterest,
        //         totalLoanOverdueInterest,
        //         totalLoanOverduePrinciple,
        //         totalLoanDisburse,
        //         totalLoanOutstandingPrinciple,
        //     };
        // }
        //
        // function calculateDateDifference(start, end){
        //     const startDate = new Date(start);
        //     const endDate = new Date(end);
        //     return (startDate-endDate)/(1000*3600*24);
        // }
        //
        //
        // admin
        //     .auth()
        //     .verifySessionCookie(sessionCookie, false)
        //     .then(async (token) => {
        //         const accountInformation = await db.collection(token.bankId).doc('accounts').collection(req.body.accountType).where('disbursementDate', '<=', req.body.date).get();
        //         accountInformation.forEach(function (account){
        //             const accountInfo = {
        //                 accountNumber: account.id,
        //                 details: account.data()
        //             };
        //             accounts.push(accountInfo);
        //         });
        //         const accountDetailList = await calculateAccountInterest(accounts, token.bankId, req.body.accountType, req.body.date);
        //         res.send({details: accountDetailList});
        //
        //     })
        //     .catch((error) => {
        //         console.log(error)
        //         res.send({error: 'Authentication error, login required'});
        //     });
    });

    app.post('/api/report/loan/npa', async function (req, res){
        const sessionCookie = req.cookies.session || "";
        const accounts = [];

        // admin
        //     .auth()
        //     .verifySessionCookie(sessionCookie, false)
        //     .then(async (token) => {
        //         const requestBody = {...req.body,token: token, auth: "L&fTj5Q@7uVp&bDpd3#Vt5RG9rj&lMLuk^9&znq#e47lyy"}
        //         const detailList = await axios.post('https://asia-south1-bank-app-290809.cloudfunctions.net/L_DTList_p3FkRgSOx8kB6jI', requestBody);
        //         if (detailList.data.details){
        //             res.send({details: detailList.data.details});
        //         }else {
        //             res.send({error: detailList.data.error});
        //         }
        //
        //     })
        //     .catch((error) => {
        //         res.send({error: 'Authentication error! try logout and then logback in'});
        //     });

        // L&fTj5Q@7uVp&bDpd3#Vt5RG9rj&lMLuk^9&znq#e47lyy
        // #############  Cloud function deployed ########

        async function calculateAccountInterest(accounts, bankId, accountType, date){
            const detailList = [];
            //total
            let totalOutstandingPrinciple = 0;
            let totalInterestCurrent = 0;
            let totalInterestOverdue = 0;
            let totalStandardPrinciple = 0;
            let totalStandardInterest = 0;
            let totalSubStandardPrinciple = 0;
            let totalSubStandardInterest = 0;
            let totalD1Principle = 0;
            let totalD1Interest = 0;
            let totalD2Principle = 0;
            let totalD2Interest = 0;
            let totalD3Principle = 0;
            let totalD3Interest = 0;


            for (let i = 0; i < accounts.length; i++) {
                const accountDetails = accounts[i].details;
                const principle = parseFloat(accountDetails.principle || 0);
                totalOutstandingPrinciple += principle;
                const time = -1 * parseFloat(calculateDateDifference(date, accountDetails.transactionDate)/365);
                const r = parseFloat(accountDetails.rateOfInterest);
                const pr = parseFloat(accountDetails.rateOfInterest) + parseFloat(accountDetails.penalRoi);
                let interestCurrent = 0;
                let interestOverdue = 0;
                let principleOverdue = 0;
                let overdueDate;

                //npa calculation
                let standardPrinciple;
                let standardInterest;
                let subStandardPrinciple;
                let subStandardInterest;
                let d1Principle;
                let d1Interest;
                let d2Principle;
                let d2Interest;
                let d3Principle;
                let d3Interest;


                if (accountType === 'farm-loan'){
                    overdueDate = accountDetails.lastRepayDate;
                    if (calculateDateDifference(accountDetails.lastRepayDate, date) < 0){
                        interestCurrent = Math.round(principle * time * (r/100)) + parseFloat(accountDetails.overdueInterest || '0');
                        totalInterestCurrent += interestCurrent;
                        interestOverdue = 0;
                    }else {
                        interestCurrent = 0;
                        interestOverdue = principle * time * (pr/100) + parseFloat(accountDetails.overdueInterest || '0');
                        totalInterestOverdue += interestOverdue;
                        principleOverdue = principle;
                    }

                    if (calculateDateDifference(accountDetails.lastRepayDate, date) < 0){
                        standardPrinciple = parseFloat(principle).toFixed(2);
                        standardInterest = parseFloat(interestCurrent).toFixed(2);
                        totalStandardPrinciple +=  parseFloat(standardPrinciple);
                        totalStandardInterest += parseFloat(standardInterest);
                    }else if(calculateDateDifference(accountDetails.lastRepayDate, date) < 90){
                        standardPrinciple = parseFloat(principle).toFixed(2);
                        standardInterest = parseFloat(interestCurrent).toFixed(2);
                        totalStandardPrinciple +=  parseFloat(standardPrinciple);
                        totalStandardInterest += parseFloat(standardInterest);
                    }else if(calculateDateDifference(accountDetails.lastRepayDate, date) < 3*365){
                        subStandardPrinciple = parseFloat(principle * 0.95).toFixed(2);
                        subStandardInterest = parseFloat(interestOverdue).toFixed(2);
                        totalSubStandardPrinciple += parseFloat(subStandardPrinciple);
                        totalSubStandardInterest += parseFloat(subStandardInterest);
                    }else if(calculateDateDifference(accountDetails.lastRepayDate, date) < 4*365){
                        d1Principle = parseFloat(principle * 0.90).toFixed(2);
                        d1Interest = parseFloat(interestOverdue).toFixed(2);
                        totalD1Principle += parseFloat(d1Principle);
                        totalD1Interest += parseFloat(d1Interest);
                    }else if(calculateDateDifference(accountDetails.lastRepayDate, date) < 6*365){
                        d2Principle = parseFloat(principle * 0.85).toFixed(2);
                        d2Interest = parseFloat(interestOverdue).toFixed(2);
                        totalD2Principle += parseFloat(d2Principle);
                        totalD2Interest += parseFloat(d2Interest);
                    }else if(calculateDateDifference(accountDetails.lastRepayDate, date) > 6*365){
                        d3Principle = parseFloat(principle * 0.5).toFixed(2);
                        d3Interest = parseFloat(interestOverdue).toFixed(2);
                        totalD3Principle += parseFloat(d3Principle);
                        totalD3Interest += parseFloat(d3Interest);
                    }
                }else if (accountType === 'non-farm-loan' || accountType === 'shg-loan'){
                    overdueDate = accountDetails.lastRepayDate;
                    const lastRepayPeriod = parseInt(accountDetails.loanPeriodMonth) * 30 + parseInt(accountDetails.loanPeriodDays);
                    if (accountDetails.calculationRule === 'compoundQuarterly'){
                        if (parseInt(calculateDateDifference(date, accountDetails.disbursementDate)) <= lastRepayPeriod){
                            interestCurrent = principle * Math.pow((1 + (r / (4 * 100))), (4 * time)) - principle + parseFloat(accountDetails.overdueInterest || '0');
                            totalInterestCurrent += interestCurrent;
                            interestOverdue = 0;
                        }else {
                            interestCurrent = 0;
                            interestOverdue = principle * Math.pow((1 + (pr / (4 * 100))), (4 * time)) - principle + parseFloat(accountDetails.overdueInterest || '0');
                            totalInterestOverdue += interestOverdue;
                            principleOverdue = principle;
                        }
                    }else {
                        if (parseInt(calculateDateDifference(date, accountDetails.disbursementDate)) <= lastRepayPeriod){
                            interestCurrent = principle * time * (r/100) + parseFloat(accountDetails.overdueInterest || '0');
                            totalInterestCurrent += interestCurrent;
                            interestOverdue = 0;
                        }else {
                            interestCurrent = 0;
                            interestOverdue = principle * time * (pr/100) + parseFloat(accountDetails.overdueInterest || '0');
                            totalInterestOverdue += interestOverdue;
                            principleOverdue = principle;
                        }
                    }


                    if (calculateDateDifference(accountDetails.lastRepayDate, date) < 0){
                        standardPrinciple = parseFloat(principle).toFixed(2);
                        standardInterest = parseFloat(interestCurrent).toFixed(2);
                        totalStandardPrinciple +=  parseFloat(standardPrinciple);
                        totalStandardInterest += parseFloat(standardInterest);
                    }else if(calculateDateDifference(accountDetails.lastRepayDate, date) < 90){
                        standardPrinciple = parseFloat(principle).toFixed(2);
                        standardInterest = parseFloat(interestCurrent).toFixed(2);
                        totalStandardPrinciple +=  parseFloat(standardPrinciple);
                        totalStandardInterest += parseFloat(standardInterest);
                    }else if(calculateDateDifference(accountDetails.lastRepayDate, date) < 3*365){
                        subStandardPrinciple = parseFloat(principle * 0.95).toFixed(2);
                        subStandardInterest = parseFloat(interestOverdue).toFixed(2);
                        totalSubStandardPrinciple += parseFloat(subStandardPrinciple);
                        totalSubStandardInterest += parseFloat(subStandardInterest);
                    }else if(calculateDateDifference(accountDetails.lastRepayDate, date) < 4*365){
                        d1Principle = parseFloat(principle * 0.90).toFixed(2);
                        d1Interest = parseFloat(interestOverdue).toFixed(2);
                        totalD1Principle += parseFloat(d1Principle);
                        totalD1Interest += parseFloat(d1Interest);
                    }else if(calculateDateDifference(accountDetails.lastRepayDate, date) < 6*365){
                        d2Principle = parseFloat(principle * 0.85).toFixed(2);
                        d2Interest = parseFloat(interestOverdue).toFixed(2);
                        totalD2Principle += parseFloat(d2Principle);
                        totalD2Interest += parseFloat(d2Interest);
                    }else if(calculateDateDifference(accountDetails.lastRepayDate, date) > 6*365){
                        d3Principle = parseFloat(principle * 0.5).toFixed(2);
                        d3Interest = parseFloat(interestOverdue).toFixed(2);
                        totalD3Principle += parseFloat(d3Principle);
                        totalD3Interest += parseFloat(d3Interest);
                    }
                }
                const cif = accountDetails.cifId;
                let name = '';
                let guardianName = '';
                if (accountType === 'shg-loan'){
                    const getCif = await db.collection(bankId).doc('kyc').collection('shg-cif').doc(cif.toString()).get();
                    name = getCif.data().groupName;
                    guardianName = getCif.data().leaderName;
                }else {
                    const getCif = await db.collection(bankId).doc('kyc').collection('client-cif').doc(cif.toString()).get();
                    name = getCif.data().name;
                    guardianName = getCif.data().guardianName;
                }
                const obj = {
                    serial: i + 1,
                    accountNumber: accounts[i].accountNumber,
                    name: name,
                    guardianName: guardianName,
                    disbursementDate: accountDetails.disbursementDate,
                    disbursement: accountDetails.disbursement,
                    overdueDate:  overdueDate,
                    standardPrinciple: standardPrinciple,
                    standardInterest: standardInterest,
                    subStandardPrinciple: subStandardPrinciple,
                    subStandardInterest: subStandardInterest,
                    d1Principle:d1Principle,
                    d1Interest: d1Interest,
                    d2Principle: d2Principle,
                    d2Interest: d2Interest,
                    d3Principle: d3Principle,
                    d3Interest: d3Interest,
                    interestCurrent: interestCurrent.toFixed(2),
                    interestOverdue: interestOverdue.toFixed(2),
                    principleOverdue: principleOverdue.toFixed(2),
                    principleOutstanding: principle.toFixed(2),
                };
                detailList.push(obj);
            }
            const totalPrinciple = totalStandardPrinciple + totalSubStandardPrinciple + totalD1Principle + totalD2Principle + totalD3Principle;
            const totalInterest = totalStandardInterest + totalSubStandardInterest + totalD1Interest + totalD2Interest + totalD3Interest;


            const npaReport = {
                details: detailList,
                totalOutstandingPrinciple,
                totalInterestCurrent,
                totalInterestOverdue,
                totalStandardPrinciple,
                totalStandardInterest,
                totalSubStandardPrinciple,
                totalSubStandardInterest,
                totalD1Principle,
                totalD1Interest,
                totalD2Principle,
                totalD2Interest,
                totalD3Principle,
                totalD3Interest,
                totalPrinciple,
                totalInterest,

            };
            return npaReport;
        }

        function calculateDateDifference(start, end){
            const startDate = new Date(start);
            const endDate = new Date(end);
            return (endDate - startDate)/(1000*3600*24);
        }

        admin
            .auth()
            .verifySessionCookie(sessionCookie, false)
            .then(async (token) => {
                const accountInformation = await db.collection(token.bankId).doc('accounts').collection(req.body.accountType).where('disbursementDate', '<=', req.body.date).get();
                accountInformation.forEach(function (account){

                    if (!account.data().closingDate){
                        const accountInfo = {
                            accountNumber: account.id,
                            details: account.data()
                        };
                        accounts.push(accountInfo);
                    } else if (((new Date(req.body.date) - new Date(account.data().closingDate))) < 0){
                        const accountInfo = {
                            accountNumber: account.id,
                            details: account.data()
                        };
                        accounts.push(accountInfo);
                    }
                });
                const accountDetailList = await calculateAccountInterest(accounts, token.bankId, req.body.accountType, req.body.date);
                res.send(accountDetailList);

            })
            .catch((error) => {
                console.log(error)
                res.send({error: 'Authentication error, login required'});
            });
    });


    // // ######################## New Approach for Detail List #####################
    // app.post('/api/report/deposit/detail-list-new-approach', async function (req, res){
    //     const sessionCookie = req.cookies.session || "";
    //     const allCif = [];
    //     const allFutureTransactions = [];
    //     let cifIdentifier;
    //
    //     const accounts = [];
    //     let totalPrinciple = 0;
    //     let totalInterest = 0;
    //
    //     async function getAllCif(bankId, accountType){
    //         if (accountType === 'shg'){
    //             cifIdentifier = 'shg-cif'
    //         }else {
    //             cifIdentifier = 'client-cif'
    //         }
    //         const getCif = await db.collection(bankId).doc('kyc').collection(cifIdentifier).get();
    //         getCif.forEach(function (querySnapshot){
    //             const cstObj = {
    //                 id: querySnapshot.id,
    //                 details: querySnapshot.data()
    //             };
    //             allCif.push(cstObj);
    //         });
    //         console.log('all cif')
    //         return null;
    //     }
    //
    //     async function getAllFutureTransaction(bankId, date){
    //         const nextDate = processDate(new Date(date).addDays(1));
    //         const serverDate = processDate(new Date());
    //         const dateRange = createDateArray(nextDate, serverDate);
    //         for (let i = 0; i < dateRange.length ; i++){
    //             const dayTransaction = await db.collection(bankId).doc('transaction').collection(dateRange[i]).get();
    //             dayTransaction.forEach(function (trans){
    //                 allFutureTransactions.push(trans.data());
    //             });
    //         }
    //         return null;
    //     }
    //
    //     async function fetchAccountDetail(accounts, bankId, accountType, date){
    //         await getAllFutureTransaction(bankId, date);
    //
    //         if (accountType === 'savings'){
    //             await getAllCif(bankId, accountType);
    //         }
    //
    //         const detailList = [];
    //         for (let i = 0; i < accounts.length; i++) {
    //             let name = '';
    //             let guardianName = '';
    //             let balance = parseFloat(accounts[i].details.availableBalance || 0);
    //             allFutureTransactions.forEach(function (querySnapshot){
    //                 if (querySnapshot.acNumber === accounts[i].accountNumber){
    //                     if (querySnapshot.transactionType === 'Debited'){
    //                         balance += parseFloat(querySnapshot.amountCreditDebit);
    //                     }else if (querySnapshot.transactionType === 'Credited'){
    //                         balance -= parseFloat(querySnapshot.amountCreditDebit);
    //                     }
    //                 }
    //             });
    //             totalPrinciple += balance;
    //             if (accountType === 'no-frill' || accountType === 'thrift-fund' || accountType === 'jlg'){
    //                 for (let j = 0; j < accounts[i].details.applicants.length; j++){
    //                     const cif = accounts[i].details.applicants[j];
    //                     const getCif = await db.collection(bankId).doc('kyc').collection('client-cif').doc(cif.toString()).get();
    //                     if (name === ''){
    //                         name += getCif.data().name;
    //                         guardianName += getCif.data().guardianName;
    //                     }else {
    //                         name += ' | ' + getCif.data().name;
    //                         guardianName += ' | ' + getCif.data().guardianName;
    //                     }
    //                 }
    //             }else if (accountType === 'savings'){
    //                 for (let j = 0; j < accounts[i].details.applicants.length; j++){
    //                     const cif = accounts[i].details.applicants[j];
    //                     for (let k = 0; k < allCif.length ; k++){
    //                         if (allCif[k].id === cif){
    //                             if (name === ''){
    //                                 name += allCif[k].details.name;
    //                                 guardianName += allCif[k].details.guardianName;
    //                             }else {
    //                                 name += ' | ' + allCif[k].details.name;
    //                                 guardianName += ' | ' + allCif[k].details.guardianName;
    //                             }
    //                             break;
    //                         }
    //                     }
    //                 }
    //             } else if (accountType === 'shg'){
    //                 const shgCif = accounts[i].details.shgCif;
    //                 const getCif = await db.collection(bankId).doc('kyc').collection('shg-cif').doc(shgCif).get();
    //                 name += getCif.data().groupName;
    //                 guardianName += getCif.data().leaderName;
    //             }else if (accountType === 'share-account'){
    //                 const cifId = accounts[i].details.cifId;
    //                 const getCif = await db.collection(bankId).doc('kyc').collection('client-cif').doc(cifId).get();
    //                 name += getCif.data().name;
    //                 guardianName += getCif.data().guardianName;
    //             }
    //             const obj = {
    //                 serial: i + 1,
    //                 accountNumber: accounts[i].accountNumber,
    //                 name: name,
    //                 guardianName: guardianName,
    //                 amount: balance.toFixed(2),
    //                 interest: '',
    //                 oldAccount: accounts[i].details.oldAccount,
    //                 cbsAccount: accounts[i].details.cbsAccount
    //             }
    //             detailList.push(obj);
    //             // console.log(totalPrinciple);
    //         }
    //         // return detailList;
    //         return {
    //             details: detailList,
    //             totalPrinciple,
    //         };
    //     }
    //
    //     async function calculateAccountInterest(accounts, bankId, accountType, date){
    //         const detailList = [];
    //         for (let i = 0; i < accounts.length; i++) {
    //             const accountDetails = accounts[i].details;
    //             let name = '';
    //             let guardianName = '';
    //             const principle = parseFloat(accountDetails.availableBalance || 0);
    //             const time = parseFloat(calculateDateDifference(date, accountDetails.openingDate)/365);
    //             const r = parseFloat(accountDetails.interest);
    //             let interest = 0;
    //             if (accountType === 'fixed-deposit'){
    //                 if (accountDetails.calculationRule ==='compoundMonthly'){
    //                     interest = principle * Math.pow((1 + (r / (12 * 100))), (12 * time)) - principle;
    //                 }else if (accountDetails.calculationRule === "compoundQuarterly") {
    //                     interest = principle * Math.pow((1 + (r / (4 * 100))), (4 * time)) - principle;
    //                 }else {
    //                     interest = principle * r * time /100;
    //                 }
    //                 totalPrinciple += principle;
    //                 totalInterest += interest;
    //             }else if (accountType === 'recurring-deposit'){
    //                 const balance = accountDetails.depositAmount;
    //                 const quarters = Math.floor(time * 4);
    //                 interest = balance * ((Math.pow(r / 400 + 1, quarters) - 1) / (1-(Math.pow(r / 400 + 1,(-1/3))))) - balance;  // If Compound Interest
    //                 // interest = (balance * time * 12 * (time*12 + 1) * r)/(2 * 100);  // Simple Interest
    //                 totalPrinciple += principle;
    //                 totalInterest += interest;
    //             }else if (accountType === 'mis-deposit'){
    //                 interest = principle * r/(12*100);
    //                 totalPrinciple += principle;
    //                 totalInterest += interest;
    //             }else if (accountType === 'cash-certificate'){
    //                 interest = principle * Math.pow((1 + (r / (4 * 100))), (4 * time)) - principle;
    //                 totalPrinciple += principle;
    //                 totalInterest += interest;
    //             }
    //
    //             for (let j = 0; j < accounts[i].details.applicants.length; j++){
    //                 const cif = accounts[i].details.applicants[j];
    //                 const getCif = await db.collection(bankId).doc('kyc').collection('client-cif').doc(cif.toString()).get();
    //                 if (name === ''){
    //                     name += getCif.data().name;
    //                     guardianName += getCif.data().guardianName;
    //                 }else {
    //                     name += ' | ' + getCif.data().name;
    //                     guardianName += ' | ' + getCif.data().guardianName;
    //                 }
    //             }
    //             const obj = {
    //                 serial: i + 1,
    //                 accountNumber: accounts[i].accountNumber,
    //                 name: name,
    //                 guardianName: guardianName,
    //                 amount: principle.toFixed(2),
    //                 interest: interest.toFixed(2),
    //                 oldAccount: accountDetails.oldAccount,
    //                 cbsAccount: accountDetails.cbsAccount
    //             };
    //             detailList.push(obj);
    //         }
    //
    //         return {
    //             details: detailList,
    //             totalInterest,
    //             totalPrinciple,
    //         };
    //     }
    //
    //     function calculateDateDifference(start, end){
    //         const startDate = new Date(start);
    //         const endDate = new Date(end);
    //         return (startDate-endDate)/(1000*3600*24);
    //     }
    //
    //     admin
    //         .auth()
    //         .verifySessionCookie(sessionCookie, false)
    //         .then(async (token) => {
    //             const accountInformation = await db.collection(token.bankId).doc('accounts').collection(req.body.accountType).where('openingDate', '<=', req.body.date).get();
    //             accountInformation.forEach(function (account){
    //                 const accountInfo = {
    //                     accountNumber: account.id,
    //                     details: account.data()
    //                 };
    //                 accounts.push(accountInfo);
    //             });
    //             if (req.body.accountType === 'savings' || req.body.accountType === 'no-frill' || req.body.accountType === 'thrift-fund' || req.body.accountType === 'shg' || req.body.accountType === 'jlg' || req.body.accountType === 'share-account'){
    //                 const accountDetailList = await fetchAccountDetail(accounts, token.bankId, req.body.accountType, req.body.date);
    //                 res.send({details: accountDetailList});
    //             }else if (req.body.accountType === 'fixed-deposit' || req.body.accountType === 'cash-certificate' || req.body.accountType === 'recurring-deposit' || req.body.accountType === 'mis-deposit'){
    //                 const accountDetailList = await calculateAccountInterest(accounts, token.bankId, req.body.accountType, req.body.date);
    //                 res.send({details: accountDetailList});
    //             }else {
    //                 res.send({error: `invalid account type selected: ${req.body.accountType}`});
    //             }
    //
    //         })
    //         .catch((error) => {
    //             console.log(error)
    //             res.send({error: 'Authentication error, login required'});
    //         });
    // });
}

// function processDate(date){
//     // let date = new Date(tomorrow).addDays(i)
//     let month = (date.getMonth() + 1);
//     let day = date.getDate();
//     if (month < 10)
//         month = "0" + month;
//     if (day < 10)
//         day = "0" + day;
//     return  date.getFullYear() + '-' + month + '-' + day;
// }
//
// function createDateArray(fromDate, toDate){
//     if (toDate < fromDate){
//         return [];
//     }
//     const dates = [];
//     let startDate = new Date(fromDate);
//     let date = '00';
//     for (let i = 0; date !== toDate ; i++){
//         const now = startDate.addDays(i);
//         let month = (now.getMonth() + 1);
//         let day = now.getDate();
//         if (month < 10)
//             month = "0" + month;
//         if (day < 10)
//             day = "0" + day;
//         date = now.getFullYear() + '-' + month + '-' + day;
//         dates.push(date);
//     }
//     return dates;
// }




