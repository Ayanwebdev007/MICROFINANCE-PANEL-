const { getFirestore} = require('firebase-admin/firestore');
const db = getFirestore();

module.exports = app => {
    app.post('/api/loan/loan-opening', async function (req, res){
        const token = req.user;
        if (!token) return res.status(401).send({error: 'You are not authorized. Please log in.'});
        const systemDate = new Date().toISOString().slice(0,10);

        // === Helper Functions ===
        const parseLocalDate = (dateStr) => {
            const [y, m, d] = dateStr.split('-').map(Number);
            return new Date(y, m - 1, d);
        };

        const formatDate = (date) => {
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        };

        const addMonths = (date, months) => {
            const result = new Date(date);
            const day = result.getDate();
            result.setMonth(result.getMonth() + months);
            if (result.getDate() !== day) {
                result.setDate(0); // Adjust to last day of previous month
            }
            return result;
        };


        try {
            await db.runTransaction(async (t) => {
                const accountNumber = req.body.account;
                let transactionId;
                let associatedEmployee = '';
                let glCode = '23315';
                let glHead = 'SHORT TERM PERSONAL LOAN - CURRENT';
                let interestGLCode = '52315';
                let interestGLHead = 'INTEREST ON SHORT TERM PERSONAL LOAN-CURRENT';
                
                if (req.body.accountType === 'group-loan') {
                    glCode = '23105';
                    glHead = 'SHORT TERM GROUP LOAN - CURRENT';
                    interestGLCode = '52105';
                    interestGLHead = 'INTEREST ON SHORT TERM GROUP LOAN-CURRENT';
                }

                const piRef = db.collection(token.bankId).doc('admin').collection('transIterator').doc(systemDate);
                const piInfo = await t.get(piRef);
                if (piInfo.exists) {
                    transactionId = parseInt(piInfo.data().value) + 1;
                }else {
                    transactionId = generateTransactionId() + 1;
                }

                const kycRef = db.collection(token.bankId).doc('kyc').collection('member-kyc').doc(req.body.memberId);
                const kycInfo = await t.get(kycRef);

                if (req.body.accountType === 'group-loan') {
                    if (!kycInfo.exists && kycInfo.data().group) {
                        const groupRef = db.collection(token.bankId).doc('kyc').collection('group').doc(kycInfo.data().group);
                        const groupInfo = await t.get(groupRef);
                        if (groupInfo.exists) {
                            associatedEmployee = groupInfo.data().associatedEmployee;
                        }
                    }
                }

                t.set(piRef, {value: transactionId});

                // === GENERATE EMI SCHEDULE ===
                const firstEmiDate = parseLocalDate(req.body.firstEmiDate);
                const totalEMI = parseInt(req.body.emiCount, 10) || 0;
                const emiAmount = parseFloat(req.body.emiAmount) || 0;
                const interval = (req.body.planDetails?.emiInterval || '').toLowerCase().trim();

                const emiSchedule = [];

                if (
                  interval &&
                  ['day', 'week', 'fortnight', 'month'].includes(interval) &&
                  totalEMI > 0 &&
                  !isNaN(firstEmiDate.getTime())
                ) {
                    for (let i = 0; i < totalEMI; i++) {
                        let dueDate;
                        if (interval === 'month') {
                            dueDate = addMonths(firstEmiDate, i);
                        } else {
                            const stepDays =
                              interval === 'week' ? 7 :
                                interval === 'fortnight' ? 14 : 1; // 'day' or fallback
                            dueDate = new Date(firstEmiDate);
                            dueDate.setDate(dueDate.getDate() + i * stepDays);
                        }
                        emiSchedule.push({
                            sl: i + 1,
                            dueDate: formatDate(dueDate),
                            amount: emiAmount
                        });
                    }
                }


                const accountRef = db.collection(token.bankId).doc('accounts').collection(req.body.accountType).doc(accountNumber);
                if(req.body.accountType === 'group-loan'){
                    t.set(accountRef, {
                        account: accountNumber,
                        groupId: req.body.groupId,
                        disbursement: 0,
                        loanTerm: req.body.loanTerm,
                        loanAmount: req.body.amount,
                        loanDate: req.body.loanDate,
                        emiAmount: req.body.emiAmount,
                        principleEMI: req.body.principleEMI,
                        interestEMI: req.body.interestEMI,
                        totalEMI: req.body.emiCount,
                        paidEMI: 0,
                        firstEmiDate: req.body.firstEmiDate,
                        applicants: [req.body.memberId],
                        planDetails: req.body.planDetails,
                        guarantor: req.body.guarantor,
                        coApplicant: req.body.coApplicant,
                        deductionDetails: req.body.deductionDetails,
                        associatedEmployee: kycInfo.data().associatedEmployee || associatedEmployee,
                        emiSchedule: emiSchedule
                    });
                } else {
                    t.set(accountRef, {
                        account: accountNumber,
                        disbursement: 0,
                        loanTerm: req.body.loanTerm,
                        loanAmount: req.body.amount,
                        loanDate: req.body.loanDate,
                        emiAmount: req.body.emiAmount,
                        principleEMI: req.body.principleEMI,
                        interestEMI: req.body.interestEMI,
                        totalEMI: req.body.emiCount,
                        paidEMI: 0,
                        firstEmiDate: req.body.firstEmiDate,
                        applicants: [req.body.memberId],
                        planDetails: req.body.planDetails,
                        guarantor: req.body.guarantor,
                        coApplicant: req.body.coApplicant,
                        deductionDetails: req.body.deductionDetails,
                        associatedEmployee: kycInfo.data().associatedEmployee || associatedEmployee,
                        emiSchedule: emiSchedule,
                    });
                }

                const disburseTransRef = db.collection(token.bankId).doc('pi').collection('loan-disbursement').doc(`${transactionId}`);
                t.set(disburseTransRef, {
                    ...req.body,
                    accountType: req.body.accountType,
                    accountNumber: accountNumber,
                    createdBy: token.email,
                    createdAt: new Date().toISOString(),
                    name: req.body.memberName,
                    transactionDate: req.body.loanDate,
                    transactionType: 'loan-disbursement',
                    type: 'debit',
                    method: 'cash',
                    glCode: glCode,
                    glHead: glHead,
                    interestGLCode: interestGLCode,
                    interestGLHead: interestGLHead,
                    narration: `Loan disbursement for account ${accountNumber}`,
                });

                if (parseFloat(req.body.deductionDetails.processingFee) > 0) {
                    const transactionRef = db.collection(token.bankId).doc('pi').collection('voucher').doc(`${transactionId}.2`);
                    t.set(transactionRef, {
                        transactionId: transactionId.toString(),
                        accountNumber: accountNumber,
                        transactionType: 'voucher',
                        transactionDate: req.body.loanDate,
                        name: req.body.memberName,
                        amount: parseFloat(req.body.deductionDetails.processingFee),
                        glCode: '57908',
                        glHead: 'PROCESSING FEE',
                        narration: `loan opening for A/C ${accountNumber}`,
                        method: 'cash',
                        type: 'credit',
                        author: token.email,
                    });
                }

                if (parseFloat(req.body.deductionDetails.legalAmount) > 0) {
                    const transactionRef = db.collection(token.bankId).doc('pi').collection('voucher').doc(`${transactionId}.3`);
                    t.set(transactionRef, {
                        transactionId: transactionId.toString(),
                        accountNumber: accountNumber,
                        transactionType: 'voucher',
                        transactionDate: req.body.loanDate,
                        name: req.body.memberName,
                        amount: parseFloat(req.body.deductionDetails.legalAmount),
                        glCode: '18148',
                        glHead: 'TAXES & FEES RECEIVED',
                        narration: `loan opening for A/C ${accountNumber}`,
                        method: 'cash',
                        type: 'credit',
                        author: token.email,
                    });
                }

                if (parseFloat(req.body.deductionDetails.gst) > 0) {
                    const transactionRef = db.collection(token.bankId).doc('pi').collection('voucher').doc(`${transactionId}.4`);
                    t.set(transactionRef, {
                        transactionId: transactionId.toString(),
                        accountNumber: accountNumber,
                        transactionType: 'voucher',
                        transactionDate: req.body.loanDate,
                        name: req.body.memberName,
                        amount: parseFloat(req.body.deductionDetails.gst),
                        glCode: '18148',
                        glHead: 'TAXES & FEES PAYABLE',
                        narration: `loan opening for A/C ${accountNumber}`,
                        method: 'cash',
                        type: 'credit',
                        author: token.email,
                    });
                }

                if (Number.parseFloat(req.body.deductionDetails.insuranceAmount) > 0) {
                    const transactionRef = db.collection(token.bankId).doc('pi').collection('voucher').doc(`${transactionId}.5`);
                    t.set(transactionRef, {
                        transactionId: transactionId.toString(),
                        account: accountNumber,
                        transactionType: 'voucher',
                        transactionDate: req.body.loanDate,
                        name: req.body.memberName,
                        amount: Number.parseFloat(req.body.deductionDetails.insuranceAmount),
                        glCode: '63304',
                        glHead: 'INSURANCE CHARGES ( CASH IN TRANSIT )',
                        narration: `loan opening for A/C ${accountNumber}`,
                        method: 'cash',
                        type: 'credit',
                        author: token.email,
                    });
                }
                const approvalQueueRef = db.collection(token.bankId).doc('approval-queue').collection(req.body.accountType).doc(accountNumber);
                t.delete(approvalQueueRef);
            });
            res.send({success: `Account created with ID: ${req.body.account}. Please authorize the loan request`});
        }catch (e) {
            res.send({error: e.toLocaleString()});
        }
    });

    app.post('/api/loan/loan-opening-application',async function (req, res){
        const token = req.user;
        if (!token) return res.status(401).send({error: 'You are not authorized. Please log in.'});

        try {
            await db.runTransaction(async (t) => {
                const accountIdentifier = req.body.accountType === 'loan' ? 'loan' : 'group-loan';
                const iteratorRef = db.collection(token.bankId).doc('admin').collection('iterator').doc(accountIdentifier);
                const iteratorInfo = await t.get(iteratorRef);
                if (isNaN(parseInt(iteratorInfo.data().value))) {
                    return res.send({error: 'Invalid iterator value. Please contact support.'});
                }
                const accountNumber = `${iteratorInfo.data().prefix || ''}${iteratorInfo.data().value}`;

                await t.update(iteratorRef, {
                    value: (parseInt(iteratorInfo.data().value) + 1).toString().padStart(iteratorInfo.data().value.length, '0'),
                    isUsed: true
                });

                const approvalQueueRef = db.collection(token.bankId).doc('approval-queue').collection(req.body.accountType).doc(accountNumber.toString());
                t.set(approvalQueueRef, {...req.body, account: accountNumber.toString()});

                return res.send({success: 'Successfully captured the request with Account Number ' + accountNumber});
            });
        } catch (e) {
            console.log('Transaction failure:', e);
            return res.send({error: 'Failed to create account. Try again...'});
        }
       
    });

    app.post('/api/loan/get-loan-application-waiting-approval',async function (req, res){
        const token = req.user;
        if (!token) return res.status(401).send({error: 'You are not authorized. Please log in.'});
        try {
            const queueRef = db.collection(token.bankId).doc('approval-queue').collection(req.body.accountType);
            const queueInfo = await queueRef.get();
            const queue = queueInfo.docs.map(doc => {
                return {
                    ...doc.data(),
                    key: doc.id,
                    label: `A/C - ${doc.id} A/C Holder: ${doc.data().memberData?.name}(${doc.data().memberData?.id})`,
                };
            });
            if (queue.length > 0) {
                return res.send({success: queue});
            }else {
                return res.send({error: `No Loan Application found for ${req.body.accountType} account type` });
            }
        } catch (error) {
            console.log(error);
            res.send({ error: "Failed to fetch loan application. Please try again..."})
            
        }
    });

    app.post('/api/loan/reject-loan-application', async function (req, res){
        const token = req.user;
        if (!token) return res.status(401).send({error: 'You are not authorized. Please log in.'});

        try {
            await db.runTransaction(async (t) => {
                const queueRef = db.collection(token.bankId).doc('approval-queue').collection(req.body.accountType).doc(req.body.account);
                t.delete(queueRef);
                return res.send({success: 'Successfully rejected the request'});
            })
        } catch (e) {
            console.log('Transaction failure:', e);
            return res.send({error: 'Failed to reject the request. Refresh the page and try again...'});
        }
    });
}

const generateTransactionId = () => {
    let now = new Date();
    let month = (now.getMonth() + 1);
    let day = now.getDate();
    if (month < 10)
        month = "0" + month;
    if (day < 10)
        day = "0" + day;
    return Number.parseInt(now.getFullYear().toString() + month.toString() + day.toString() + '000');
}