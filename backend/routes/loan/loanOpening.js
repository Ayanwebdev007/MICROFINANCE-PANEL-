const { getFirestore } = require('firebase-admin/firestore');
const db = getFirestore();
const loanService = require('../../services/loanService');
const { generateTransactionId } = require('../../utils/transactionUtils');
const { generateKeywords } = require('../../utils/searchUtils');

module.exports = app => {
    app.post('/api/loan/loan-opening', async function (req, res) {
        const token = req.user;
        if (!token) return res.status(401).send({ error: 'You are not authorized. Please log in.' });
        const systemDate = new Date().toISOString().slice(0, 10);

        try {
            await db.runTransaction(async (t) => {
                const accountNumber = req.body.account;
                let transactionId;
                let associatedEmployee = '';

                const { glCode, glHead, interestGLCode, interestGLHead } = loanService.getLoanGlConfig(req.body.accountType);

                const piRef = db.collection(token.bankId).doc('admin').collection('transIterator').doc(systemDate);
                const piInfo = await t.get(piRef);
                if (piInfo.exists) {
                    transactionId = parseInt(piInfo.data().value) + 1;
                } else {
                    transactionId = generateTransactionId() + 1;
                }

                const kycRef = db.collection(token.bankId).doc('kyc').collection('member-kyc').doc(req.body.memberId);
                const kycInfo = await t.get(kycRef);

                if (req.body.accountType === 'group-loan') {
                    if (kycInfo.exists && kycInfo.data().group) {
                        const groupRef = db.collection(token.bankId).doc('kyc').collection('group').doc(kycInfo.data().group);
                        const groupInfo = await t.get(groupRef);
                        if (groupInfo.exists) {
                            associatedEmployee = groupInfo.data().associatedEmployee;
                        }
                    }
                }

                t.set(piRef, { value: transactionId });

                // === GENERATE EMI SCHEDULE VIA SERVICE ===
                const emiSchedule = loanService.generateEmiSchedule(
                    req.body.firstEmiDate,
                    parseInt(req.body.emiCount, 10) || 0,
                    parseFloat(req.body.emiAmount) || 0,
                    req.body.planDetails?.emiInterval
                );

                const accountRef = db.collection(token.bankId).doc('accounts').collection(req.body.accountType).doc(accountNumber);
                const accountData = {
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
                    associatedEmployee: kycInfo.data()?.associatedEmployee || associatedEmployee,
                    emiSchedule: emiSchedule,
                    searchKeywords: generateKeywords(`${accountNumber} ${req.body.memberId} ${req.body.memberName}`)
                };

                if (req.body.accountType === 'group-loan') {
                    accountData.groupId = req.body.groupId;
                }

                t.set(accountRef, accountData);

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

                // Helper for voucher creation
                const createVoucher = (suffix, amount, code, head) => {
                    const val = parseFloat(amount);
                    if (val > 0) {
                        const vRef = db.collection(token.bankId).doc('pi').collection('voucher').doc(`${transactionId}.${suffix}`);
                        t.set(vRef, {
                            transactionId: transactionId.toString(),
                            accountNumber: accountNumber,
                            transactionType: 'voucher',
                            transactionDate: req.body.loanDate,
                            name: req.body.memberName,
                            amount: val,
                            glCode: code,
                            glHead: head,
                            narration: `loan opening for A/C ${accountNumber}`,
                            method: 'cash',
                            type: 'credit',
                            author: token.email,
                        });
                    }
                };

                createVoucher('2', req.body.deductionDetails.processingFee, '57908', 'PROCESSING FEE');
                createVoucher('3', req.body.deductionDetails.legalAmount, '18148', 'TAXES & FEES RECEIVED');
                createVoucher('4', req.body.deductionDetails.gst, '18148', 'TAXES & FEES PAYABLE');
                createVoucher('5', req.body.deductionDetails.insuranceAmount, '63304', 'INSURANCE CHARGES ( CASH IN TRANSIT )');

                const approvalQueueRef = db.collection(token.bankId).doc('approval-queue').collection(req.body.accountType).doc(accountNumber);
                t.delete(approvalQueueRef);
            });
            res.send({ success: `Account created with ID: ${req.body.account}. Please authorize the loan request` });
        } catch (e) {
            console.error(e);
            res.send({ error: e.toLocaleString() });
        }
    });

    app.post('/api/loan/loan-opening-application', async function (req, res) {
        const token = req.user;
        if (!token) return res.status(401).send({ error: 'You are not authorized. Please log in.' });

        try {
            await db.runTransaction(async (t) => {
                const accountIdentifier = req.body.accountType === 'loan' ? 'loan' : 'group-loan';
                const iteratorRef = db.collection(token.bankId).doc('admin').collection('iterator').doc(accountIdentifier);
                const iteratorInfo = await t.get(iteratorRef);
                if (!iteratorInfo.exists || isNaN(parseInt(iteratorInfo.data().value))) {
                    return res.send({ error: 'Invalid iterator configuration. Please contact support.' });
                }
                const accountNumber = `${iteratorInfo.data().prefix || ''}${iteratorInfo.data().value}`;

                await t.update(iteratorRef, {
                    value: (parseInt(iteratorInfo.data().value) + 1).toString().padStart(iteratorInfo.data().value.length, '0'),
                    isUsed: true
                });

                const approvalQueueRef = db.collection(token.bankId).doc('approval-queue').collection(req.body.accountType).doc(accountNumber.toString());
                t.set(approvalQueueRef, { ...req.body, account: accountNumber.toString() });

                return res.send({ success: 'Successfully captured the request with Account Number ' + accountNumber });
            });
        } catch (e) {
            console.log('Transaction failure:', e);
            return res.send({ error: 'Failed to create account. Try again...' });
        }

    });

    app.post('/api/loan/get-loan-application-waiting-approval', async function (req, res) {
        const token = req.user;
        if (!token) return res.status(401).send({ error: 'You are not authorized. Please log in.' });
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
                return res.send({ success: queue });
            } else {
                return res.send({ error: `No Loan Application found for ${req.body.accountType} account type` });
            }
        } catch (error) {
            console.log(error);
            res.send({ error: "Failed to fetch loan application. Please try again..." })

        }
    });

    app.post('/api/loan/reject-loan-application', async function (req, res) {
        const token = req.user;
        if (!token) return res.status(401).send({ error: 'You are not authorized. Please log in.' });

        try {
            await db.runTransaction(async (t) => {
                const queueRef = db.collection(token.bankId).doc('approval-queue').collection(req.body.accountType).doc(req.body.account);
                t.delete(queueRef);
                return res.send({ success: 'Successfully rejected the request' });
            })
        } catch (e) {
            console.log('Transaction failure:', e);
            return res.send({ error: 'Failed to reject the request. Refresh the page and try again...' });
        }
    });
}