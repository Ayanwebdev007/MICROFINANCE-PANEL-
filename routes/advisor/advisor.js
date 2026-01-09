const {getFirestore} = require('firebase-admin/firestore');
const db = getFirestore();

module.exports = app => {
    app.post('/api/advisor/add-new-advisor', async function (req, res) {
        const token = req.user; // Get user from the middleware

        if (!token) return res.status(401).send({error: 'You are not authorized. Please log in.'});
        const systemDate = new Date().toISOString().slice(0, 10);

        try {
            await db.runTransaction(async (t) => {
                let transactionId;
                const iteratorRef = db.collection(token.bankId).doc('admin').collection('iterator').doc('advisor');
                const iterator = await t.get(iteratorRef);
                const piRef = db.collection(token.bankId).doc('admin').collection('transIterator').doc(systemDate);
                const piInfo = await t.get(piRef);
                if (piInfo.exists) {
                    transactionId = parseInt(piInfo.data().value) + 1;
                } else {
                    transactionId = generateTransactionId() + 1;
                }

                const upLine = [];
                if (req.body.referrer) {
                    const referrerRef = db.collection(token.bankId).doc('kyc').collection('advisor-kyc').doc(req.body.referrer);
                    const referrerInfo = await t.get(referrerRef);
                    upLine.push(...referrerInfo.data().upLine, req.body.referrer);
                }

                const kycId = `${iterator.data().prefix || ''}${iterator.data().value}`;
                const kycRef = db.collection(token.bankId).doc('kyc').collection('advisor-kyc').doc(kycId);

                if (isNaN(parseInt(iterator.data().value))) {
                    return res.send({error: 'Invalid iterator value. Please contact support.'});
                }

                await t.update(iteratorRef, {
                    value: (parseInt(iterator.data().value) + 1).toString().padStart(iterator.data().value.length, '0'),
                    isUsed: true
                });

                await t.set(kycRef, {
                    ...req.body,
                    upLine,
                    author: token.email,
                    createdAt: new Date(),
                });
                if (parseFloat(req.body.fee) > 0) {
                    const transactionRef = db.collection(token.bankId).doc('pi').collection('voucher').doc(`${transactionId}`);
                    await t.set(transactionRef, {
                        transactionId: transactionId.toString(),
                        accountNumber: '',
                        transactionType: 'voucher',
                        transactionDate: systemDate,
                        name: req.body.name,
                        amount: parseFloat(req.body.fee),
                        glCode: '59019',
                        glHead: 'MEMBERSHIP FEES COLLECTION',
                        narration: `Joining Fee of ${req.body.name}`,
                        method: 'cash',
                        type: 'credit',
                        author: token.email,
                    });
                }
                res.send({success: `Advisor KYC created successfully with Id: ${kycId}`});
            });
        } catch (e) {
            res.send({error: 'Failed to create Advisor KYC'});
            console.log('KYC Creation failure:', e);
        }
    });

    app.post('/api/advisor/update-advisor', async function (req, res) {
        const token = req.user; // Get user from the middleware

        if (!token) return res.status(401).send({error: 'You are not authorized. Please log in.'});

        try {
            await db.runTransaction(async (t) => {
                const upLine = [];
                if (req.body.referrer) {
                    const referrerRef = db.collection(token.bankId).doc('kyc').collection('advisor-kyc').doc(req.body.referrer);
                    const referrerInfo = await t.get(referrerRef);
                    upLine.push(...referrerInfo.data().upLine, req.body.referrer);
                }
                const kycRef = db.collection(token.bankId).doc('kyc').collection('advisor-kyc').doc(req.body.id);
                await t.update(kycRef, {
                    ...req.body,
                    upLine,
                    updatedBy: token.email,
                    updatedAt: new Date(),
                });
            });
            res.send({success: `Advisor KYC updated successfully`});
        } catch (e) {
            res.send({error: 'Failed to create customer KYC'});
            console.log('KYC Creation failure:', e);
        }

    });

    app.get('/api/advisor/get-advisor-list', async function (req, res) {
        const token = req.user; // Get user from the middleware

        if (!token) return res.status(401).send({error: 'You are not authorized. Please log in.'});
        try {
            const advisorList = [];
            const advisorRef = db.collection(token.bankId).doc('kyc').collection('advisor-kyc');
            const advisorSnapshot = await advisorRef.get();
            advisorSnapshot.forEach((doc) => {
                advisorList.push({...doc.data(), id: doc.id});
            });
            res.send({success: 'Successfully fetched data', advisorList});
        } catch (error) {
            console.error('Error fetching advisor list:', error);
            res.send({error: 'Failed to fetch advisor list. Try again...'});
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