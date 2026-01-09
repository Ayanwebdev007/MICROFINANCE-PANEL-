const { getFirestore } = require('firebase-admin/firestore');
const db = getFirestore();

module.exports = app => {
    app.post('/api/loan/loan-repayment-transaction', async function (req, res) {
        const token = req.user;
        const systemDate = new Date().toISOString().slice(0, 10);

        try {
            await db.runTransaction(async (t) => {
                let transactionId;
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
                } else {
                    transactionId = generateTransactionId() + 1;
                }

                await t.set(piRef, { value: transactionId });

                const repaymentTransRef = db.collection(token.bankId).doc('pi').collection('loan-repayment').doc(`${transactionId}`);
                await t.set(repaymentTransRef, {
                    ...req.body,
                    accountType: req.body.accountType,
                    name: req.body.name,
                    // amount: parseFloat(req.body.emiAmount) * parseFloat(req.body.emiCollection),
                    amount: req.body.totalAmount,
                    accountNumber: req.body.account,
                    createdBy: token.email,
                    createdAt: new Date().toISOString(),
                    transactionDate: req.body.transDate || systemDate,
                    transactionType: 'loan-repayment',
                    type: 'credit',
                    method: 'cash',
                    glCode: glCode,
                    glHead: glHead,
                    interestGLCode: interestGLCode,
                    interestGLHead: interestGLHead,
                });

                if (parseFloat(req.body.lateFee) > 0) {
                    const transactionRef = db.collection(token.bankId).doc('pi').collection('voucher').doc(`${transactionId}.1`);
                    await t.set(transactionRef, {
                        transactionId: transactionId.toString(),
                        accountNumber: req.body.account,
                        transactionType: 'voucher',
                        transactionDate: req.body.transDate || systemDate,
                        name: '',
                        amount: parseFloat(req.body.lateFee),
                        glCode: '57909',
                        glHead: 'LATE FEE',
                        narration: `Loan late fee for A/C ${req.body.account}`,
                        method: 'cash',
                        type: 'credit',
                        author: token.email,
                    });
                }

                return res.send({ success: `Repayment request is captured. Please authorize the loan request` });
            });
        } catch (e) {
            console.log(e);
            return res.send({ error: e.toLocaleString() });
        }
    });

    app.post('/api/transaction/loan/bulk-repayment', async function (req, res) {
        const token = req.user;
        if (!token) return res.status(401).send({ error: 'You are not authorized. Please log in.' });

        let transactionNumber;

        try {
            await db.runTransaction(async (t) => {
                let date = req.body.transDate || new Date().toISOString().slice(0, 10);
                let glCode = '23105';
                let glHead = 'SHORT TERM GROUP LOAN - CURRENT';
                let interestGlCode = '52105';
                let interestGlHead = 'INTEREST ON SHORT TERM GROUP LOAN-CURRENT';

                if (req.body.accountType === 'loan') {
                    glCode = '23315';
                    glHead = 'SHORT TERM PERSONAL LOAN - CURRENT';
                    interestGlCode = '52315';
                    interestGlHead = 'INTEREST ON SHORT TERM PERSONAL LOAN-CURRENT';
                }
                const iteratorRef = db.collection(token.bankId).doc('admin').collection('transIterator').doc(date);
                const iteratorInfo = await t.get(iteratorRef);

                if (iteratorInfo.exists) {
                    transactionNumber = iteratorInfo.data().value + 1;
                } else {
                    transactionNumber = generateTransactionId() + 1;
                }
                const piRef = db.collection(token.bankId).doc('pi').collection('loan-bulk-repayment').doc(transactionNumber.toString());

                t.set(iteratorRef, { value: transactionNumber });
                const paymentInstruction = {
                    ...req.body,
                    glCode,
                    glHead,
                    interestGlCode,
                    interestGlHead,
                    author: token.email,
                    createdAt: new Date().toISOString(),
                };
                t.set(piRef, paymentInstruction);
                res.send({
                    success: `Successfully create Payment Instruction. Please authorize transaction ${transactionNumber}`,
                    // denomination: updatedMyDenomination,
                });
            });
        } catch (e) {
            console.log(e);
            res.send({ error: 'there is something wrong. Try again...' });
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