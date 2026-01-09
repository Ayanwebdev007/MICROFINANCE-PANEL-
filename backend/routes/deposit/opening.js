const { getFirestore } = require('firebase-admin/firestore');

const db = getFirestore();

module.exports = app => {
    app.post('/api/deposit/account-opening', async function (req, res) {
        const token = req.user; // Get user from the middleware
        if (!token) return res.status(401).send({ error: 'You are not authorized. Please log in.' });

        const systemDate = new Date().toISOString().slice(0, 10);

        try {
            await db.runTransaction(async (t) => {
                const { glCode, glHead } = accountGlCode(req.body.accountType, '', false);

                const typeIdentifier = req.body.accountType === 'savings' ? 'savings' : 'deposit';

                let transactionId;
                const iteratorRef = db.collection(token.bankId).doc('admin').collection('iterator').doc(typeIdentifier);
                const iteratorInfo = await t.get(iteratorRef);
                const accountNumber = `${iteratorInfo.data().prefix || ''}${iteratorInfo.data().value}`;

                const piRef = db.collection(token.bankId).doc('admin').collection('transIterator').doc(systemDate);
                const piInfo = await t.get(piRef);
                if (piInfo.exists) {
                    transactionId = parseInt(piInfo.data().value) + 1;
                } else {
                    transactionId = generateTransactionId() + 1;
                }
                const kycRef = db.collection(token.bankId).doc('kyc').collection('member-kyc').doc(req.body.memberId);
                const kycInfo = await t.get(kycRef);

                if (isNaN(parseInt(iteratorInfo.data().value))) {
                    return res.send({error: 'Invalid iterator value. Please contact support.'});
                }

                await t.update(iteratorRef, {
                    value: (parseInt(iteratorInfo.data().value) + 1).toString().padStart(iteratorInfo.data().value.length, '0'),
                    isUsed: true
                });

                await t.set(piRef, { value: transactionId });
                const accountRef = db.collection(token.bankId).doc('accounts').collection(req.body.accountType).doc(accountNumber);
                if (req.body.accountType === 'savings' || req.body.accountType === 'thrift-fund' || req.body.accountType === 'daily-savings') {
                    await t.set(accountRef, {
                        account: accountNumber,
                        balance: 0,
                        accountType: req.body.accountType,
                        openingDate: req.body.openingDate,
                        openingAmount: parseFloat(req.body.amount),
                        applicants: [req.body.memberId],
                        modeOfOperation: req.body.modeOfOperation,
                        jointSurvivorCode: req.body.jointSurvivorCode,
                        jointSurvivorName: req.body.jointSurvivorName,
                        relation: req.body.relation,
                        associatedEmployee: kycInfo.data().associatedEmployee || token.uid,
                        remarks: req.body.remarks,
                        smsSend: req.body.smsSend,
                        debitCardIssue: req.body.debitCardIssue,
                        planDetails: req.body.planDetails || {},
                        closed: false,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        author: token.email,
                    });
                } else if (req.body.accountType === 'cash-certificate' || req.body.accountType === 'fixed-deposit' || req.body.accountType === 'recurring-deposit' || req.body.accountType === 'mis-deposit') {
                    await t.set(accountRef, {
                        account: accountNumber,
                        balance: 0,
                        accountType: req.body.accountType,
                        openingDate: req.body.openingDate,
                        openingAmount: parseFloat(req.body.amount),
                        applicants: [req.body.memberId],
                        modeOfOperation: req.body.modeOfOperation,
                        jointSurvivorCode: req.body.jointSurvivorCode,
                        jointSurvivorName: req.body.jointSurvivorName,
                        relation: req.body.relation,
                        associatedEmployee: kycInfo.data().associatedEmployee || token.uid,
                        remarks: req.body.remarks,
                        smsSend: req.body.smsSend,
                        debitCardIssue: req.body.debitCardIssue,
                        termPeriod: req.body.termPeriod,
                        interestRate: req.body.interestRate,
                        maturityDate: req.body.maturityDate,
                        maturityAmount: req.body.maturityAmount,
                        planDetails: req.body.planDetails || {},
                        closed: false,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });
                }
                if (parseInt(req.body.amount) > 0) {
                    const transactionRef = db.collection(token.bankId).doc('pi').collection('deposit').doc(`${transactionId}.1`);
                    await t.set(transactionRef, {
                        transactionId: transactionId.toString(),
                        account: accountNumber,
                        accountType: req.body.accountType,
                        transactionType: 'deposit',
                        transactionDate: req.body.openingDate,
                        name: req.body.memberName,
                        amount: parseFloat(req.body.amount),
                        glCode,
                        glHead,
                        narration: 'Account Opening',
                        method: 'cash',
                        type: 'credit',
                        author: token.email,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        autoAuthorize: [{
                            type: 'voucher',
                            id: `${transactionId}.2`,
                        }]
                    });
                }
                if (parseFloat(req.body.openingFees) > 0) {
                    const transactionRef = db.collection(token.bankId).doc('pi').collection('voucher').doc(`${transactionId}.2`);
                    await t.set(transactionRef, {
                        transactionId: transactionId.toString(),
                        accountNumber: accountNumber,
                        transactionType: 'voucher',
                        transactionDate: req.body.openingDate,
                        name: req.body.memberName,
                        amount: parseFloat(req.body.openingFees),
                        glCode: '57905',
                        glHead: 'PROCESSING FEE',
                        narration: `${req.body.accountType} opening for A/C ${accountNumber}`,
                        method: 'cash',
                        type: 'credit',
                        author: token.email,
                    });
                }
                return res.send({ success: 'Account created with ID: ' + accountNumber });
            });
        } catch (e) {
            console.log('Transaction failure:', e);
            return res.send({ error: 'Failed to create account. Try again...' });
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
    return parseInt(now.getFullYear().toString() + month.toString() + day.toString() + '000');
}

const accountGlCode = (accountType, product, isOverdue) => {
    let glCode = '00001';
    let glHead = 'GL MIS-MATCH';
    if (accountType === 'savings') {
        glCode = '14301';
        glHead = 'SAVINGS DEPOSIT(NON MEMBERS)';
    } else if (accountType === 'mFinance-savings') {
        glCode = '14307';
        glHead = 'M-FINANCE SAVINGS DEPOSIT';
    } else if (accountType === 'no-frill') {
        glCode = '14305';
        glHead = 'NO FRILL SAVINGS ( NON MEMBER)';
    } else if (accountType === 'thrift-fund') {
        glCode = '14306';
        glHead = 'THRIFT FUND SAVINGS ( NONMEMBER)';
    } else if (accountType === 'cash-certificate') {
        glCode = '22502';
        glHead = 'DEPOSIT CERTIFICATE(INDIVIDUAL MEMBERS)';
    } else if (accountType === 'fixed-deposit') {
        glCode = '14303';
        glHead = 'FIXED DEPOSIT(NON MEMBERS)';
    } else if (accountType === 'jlg') {
        glCode = '14401';
        glHead = 'SAVINGS DEPOSIT (JLG GROUPS)';
    } else if (accountType === 'mis-deposit') {
        glCode = '14399';
        glHead = 'MIS DEPOSIT(NON MEMBERS)';
    } else if (accountType === 'recurring-deposit') {
        glCode = '14302';
        glHead = 'RECURRING DEPOSIT(NON MEMBERS)';
    } else if (accountType === 'share-account') {
        glCode = '11200';
        glHead = 'A CLASS SHARE';
    } else if (accountType === 'shg-deposit') {
        glCode = '14201';
        glHead = 'SAVINGS DEPOSIT(SELF HELP GROUPS)';
    } else if (accountType === 'daily-savings') {
        glCode = '14205';
        glHead = 'HOME SAVINGS DEPOSIT';
    } else if (accountType === 'farm-loan') {
        if (!isOverdue) {
            glCode = '23101';
            glHead = 'SHORT TERM (KCC) LOAN - CURRENT';
        } else {
            glCode = '23102';
            glHead = 'SHORT TERM (KCC) LOAN - OVERDUE';
        }
    } else if (accountType === 'non-farm-loan') {
        if (!isOverdue) {
            glCode = '23105';
            glHead = 'SHORT TERM (D L)  LAD LOAN - CURRENT';
        } else {
            glCode = '23106';
            glHead = 'SHORT TERM (D L) LAD LOAN - OVERDUE';
        }
    } else if (accountType === 'shg-loan') {
        if (product === 'Short Term') {
            if (!isOverdue) {
                glCode = '23113';
                glHead = 'SHORT TERM SELF-HELP GROUP LOAN - CURRENT';
            } else {
                glCode = '23114';
                glHead = 'SHORT TERM SELF-HELP GROUP LOAN - OVERDUE';
            }
        } else if (product === 'Medium Term') {
            if (!isOverdue) {
                glCode = '23213';
                glHead = 'MEDIUM TERM SELF-HELP GROUP LOAN - CURRENT';
            } else {
                glCode = '23214';
                glHead = 'MEDIUM TERM SELF-HELP GROUP LOAN - OVERDUE';
            }
        }
    } else if (accountType === 'cash-credit-loan') {
        if (!isOverdue) {
            glCode = '23305';
            glHead = 'CASH CREDIT LOAN - CURRENT';
        } else {
            glCode = '23306';
            glHead = 'CASH CREDIT LOAN - OVERDUE';
        }
    }

    return { glCode, glHead };
}