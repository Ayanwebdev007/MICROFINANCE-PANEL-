const {getFirestore} = require('firebase-admin/firestore');
const puppeteer = require("puppeteer");
const db = getFirestore();

module.exports = app => {
    //  Generate Transaction ID
    const generateTransactionId = () => {
        const d = new Date();
        const pad = n => n.toString().padStart(2, '0');
        return parseInt(d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '000');
    };
//Foreclose request
    app.post('/api/loan/foreclose/request', async (req, res) => {
        const token = req.user;
        if (!token) return res.status(401).send({error: 'You are not authorized. Please log in.'});

        const {accountType, account, transDate, charges} = req.body;
        const systemDate = transDate || new Date().toISOString().slice(0, 10);
        let transactionId;
        let loanData;
        let loanRef;
        let borrowerName = 'Unknown';
        let iteratorInfo;

        try {
            await db.runTransaction(async (t) => {
                loanRef = db.collection(token.bankId)
                    .doc('accounts')
                    .collection(accountType)
                    .doc(account);
                const loanSnap = await t.get(loanRef);
                if (!loanSnap.exists) throw new Error('Loan account not found.');
                loanData = loanSnap.data();
                //Validation
                if (loanData.closed === true) throw new Error('Loan is already closed.');
                if (loanData.closureType === 'foreclosure') throw new Error('This loan has already been foreclosed.');
                if (loanData.foreclosureStatus === 'pending') throw new Error('A foreclosure request is already pending.');

                const outstandingPrincipal = parseFloat(charges?.foreClosurePrincipal) || 0;
                if (outstandingPrincipal <= 0) throw new Error('No principal due.');

                const iteratorRef = db.collection(token.bankId)
                    .doc('admin')
                    .collection('transIterator')
                    .doc(systemDate);
                iteratorInfo = await t.get(iteratorRef);

                if (loanData.applicants?.[0]) {
                    const kycDoc = await t.get(
                        db.collection(token.bankId)
                            .doc('kyc')
                            .collection('member-kyc')
                            .doc(loanData.applicants[0])
                    );
                    if (kycDoc.exists) {
                        borrowerName = kycDoc.data().name;
                    }
                }

                // Recalculate Total with GST
                const calculateTotal = (amount, gstRate) => {
                    const total = parseFloat(amount) + (parseFloat(amount) * parseFloat(gstRate)) / 100;
                    return parseFloat(total.toFixed(2));
                };

                //  Sanitize & Recalculate All Charges
                const sanitizedCharges = {
                    foreClosurePrincipal: parseFloat(charges.foreClosurePrincipal) || 0,
                    closureDiscount: parseFloat(charges.closureDiscount) || 0,
                    payMode: charges.payMode || 'Cash',
                    remarks: charges.remarks || '',
                    overdueInterest: {
                        amount: parseFloat(charges.overdueInterest?.amount) || 0,
                        gstRate: parseFloat(charges.overdueInterest?.gstRate) || 18,
                        total: calculateTotal(
                            parseFloat(charges.overdueInterest?.amount) || 0,
                            parseFloat(charges.overdueInterest?.gstRate) || 18
                        ),
                    },
                    noticeCharges: {
                        amount: parseFloat(charges.noticeCharges?.amount) || 0,
                        gstRate: parseFloat(charges.noticeCharges?.gstRate) || 18,
                        total: calculateTotal(
                            parseFloat(charges.noticeCharges?.amount) || 0,
                            parseFloat(charges.noticeCharges?.gstRate) || 18
                        ),
                    },
                    serviceCharges: {
                        amount: parseFloat(charges.serviceCharges?.amount) || 0,
                        gstRate: parseFloat(charges.serviceCharges?.gstRate) || 18,
                        total: calculateTotal(
                            parseFloat(charges.serviceCharges?.amount) || 0,
                            parseFloat(charges.serviceCharges?.gstRate) || 18
                        ),
                    },
                    overduePenalty: {
                        amount: parseFloat(charges.overduePenalty?.amount) || 0,
                        gstRate: parseFloat(charges.overduePenalty?.gstRate) || 18,
                        total: calculateTotal(
                            parseFloat(charges.overduePenalty?.amount) || 0,
                            parseFloat(charges.overduePenalty?.gstRate) || 18
                        ),
                    },
                    foreClosureCharges: {
                        amount: parseFloat(charges.foreClosureCharges?.amount) || 0,
                        gstRate: parseFloat(charges.foreClosureCharges?.gstRate) || 18,
                        total: calculateTotal(
                            parseFloat(charges.foreClosureCharges?.amount) || 0,
                            parseFloat(charges.foreClosureCharges?.gstRate) || 18
                        ),
                    },
                };

                // Calculate Total Amount
                const totalAmount = [
                    sanitizedCharges.foreClosurePrincipal,
                    sanitizedCharges.overdueInterest.total,
                    sanitizedCharges.noticeCharges.total,
                    sanitizedCharges.serviceCharges.total,
                    sanitizedCharges.overduePenalty.total,
                    sanitizedCharges.foreClosureCharges.total,
                ].reduce((sum, val) => sum + val, 0);
                const totalForeclosureFees = [
                    sanitizedCharges.overdueInterest.total,
                    sanitizedCharges.noticeCharges.total,
                    sanitizedCharges.serviceCharges.total,
                    sanitizedCharges.overduePenalty.total,
                    sanitizedCharges.foreClosureCharges.total,
                ].reduce((sum, val) => sum + val, 0);
                //  Net Amount to Collect
                const netAmount = totalAmount - sanitizedCharges.closureDiscount;
                const totalForeclosureAmount = parseFloat(netAmount.toFixed(2));

                //  Generate Transaction ID
                transactionId = (iteratorInfo.exists ? iteratorInfo.data().value : generateTransactionId()) + 1;
                await t.set(iteratorRef, {value: transactionId});

                //  Store
                const approvalQueueRef = db.collection(token.bankId)
                    .doc('approval-queue')
                    .collection('foreclosure')
                    .doc(transactionId.toString());
                await t.set(approvalQueueRef, {
                    transactionId: transactionId.toString(),
                    accountNumber: account,
                    accountType,
                    borrowerName,
                    amount: totalForeclosureAmount,
                    requestDate: new Date().toISOString(),
                    status: 'pending',
                    createdBy: token.email,
                    createdAt: new Date().toISOString(),
                    charges: sanitizedCharges,
                    totalForeclosureAmount,
                    totalForeclosureFees,

                    //  Include all data
                    glCode: loanData.glCode || '23315',
                    glHead: loanData.glHead || 'SHORT TERM PERSONAL LOAN - CURRENT',
                    interestGLCode: loanData.interestGLCode || '52315',
                    interestGLHead: loanData.interestGLHead || 'INTEREST ON SHORT TERM PERSONAL LOAN-CURRENT',
                    applicants: loanData.applicants,
                });

                // Update Loan Status
                await t.update(loanRef, {
                    foreclosureStatus: 'pending',
                    lastForeclosureRequestDate: systemDate,
                    lastForeclosureRequestId: transactionId.toString(),
                });
            });

            return res.send({
                success: `Foreclosure request created. Please approve transaction ${transactionId}.`,
                transactionId,
            });
        } catch (error) {
            console.error('Foreclosure request failed:', error);
            return res.status(500).send({error: error.message || 'Failed to create request.'});
        }
    });

//approve foreclosure
    app.post('/api/loan/authorize-foreclosure', async (req, res) => {
        const token = req.user;
        if (!token) return res.status(401).send({error: 'Unauthorized.'});
        if (!['manager', 'root'].includes(token.role)) {
            return res.status(403).send({error: 'Only managers can approve.'});
        }

        const {transactionId} = req.body;
        const systemDate = new Date().toISOString().slice(0, 10);
        const approvedAt = new Date().toISOString();

        if (!transactionId) {
            return res.status(400).send({error: 'transactionId is required.'});
        }

        if (!req.body.charges || typeof req.body.charges !== 'object') {
            return res.status(400).send({error: 'Valid charges object is required.'});
        }

        try {
            await db.runTransaction(async (t) => {
                const queueRef = db.collection(token.bankId)
                    .doc('approval-queue')
                    .collection('foreclosure')
                    .doc(transactionId.toString());
                const queueSnap = await t.get(queueRef);

                if (!queueSnap.exists) {
                    console.log('Request not found in approval-queue:', transactionId);
                    throw new Error('Request not found. Maybe already processed.');
                }

                const queueData = queueSnap.data();
                if (queueData.status !== 'pending') {
                    throw new Error('Request already processed.');
                }

                const loanRef = db.collection(token.bankId)
                    .doc('accounts')
                    .collection(queueData.accountType)
                    .doc(queueData.accountNumber);
                const loanSnap = await t.get(loanRef);

                if (!loanSnap.exists) {
                    throw new Error('Loan account not found.');
                }

                const loanData = loanSnap.data();
                if (loanData.closed) {
                    throw new Error('Loan already closed.');
                }

                let borrowerName = 'Unknown';
                if (loanData.applicants?.[0]) {
                    const kycDoc = await t.get(
                        db.collection(token.bankId)
                            .doc('kyc')
                            .collection('member-kyc')
                            .doc(loanData.applicants[0])
                    );
                    if (kycDoc.exists) {
                        borrowerName = kycDoc.data().name;
                    }
                }

                //  calculation with 2 decimal
                const calculateTotal = (amount, gstRate) => {
                    const amt = parseFloat(amount) || 0;
                    const rate = parseFloat(gstRate) || 18;
                    return Math.round((amt + (amt * rate) / 100) * 100) / 100;
                };

                let finalCharges = queueData.charges;
                let finalAmount = queueData.amount;
                let finalTotalForeclosureFees = queueData.totalForeclosureFees;

                const hasEdits = Object.keys(req.body.charges).length > 0;

                if (hasEdits) {
                    finalCharges = {
                        foreClosurePrincipal: parseFloat(req.body.charges.foreClosurePrincipal) || 0,
                        closureDiscount: parseFloat(req.body.charges.closureDiscount) || 0,
                        payMode: req.body.charges.payMode || queueData.charges.payMode || 'Cash',
                        remarks: req.body.charges.remarks || queueData.charges.remarks || '',

                        overdueInterest: {
                            amount: parseFloat(req.body.charges.overdueInterest?.amount) || 0,
                            gstRate: parseFloat(req.body.charges.overdueInterest?.gstRate) || 18,
                            total: calculateTotal(req.body.charges.overdueInterest?.amount, req.body.charges.overdueInterest?.gstRate),
                        },
                        noticeCharges: {
                            amount: parseFloat(req.body.charges.noticeCharges?.amount) || 0,
                            gstRate: parseFloat(req.body.charges.noticeCharges?.gstRate) || 18,
                            total: calculateTotal(req.body.charges.noticeCharges?.amount, req.body.charges.noticeCharges?.gstRate),
                        },
                        serviceCharges: {
                            amount: parseFloat(req.body.charges.serviceCharges?.amount) || 0,
                            gstRate: parseFloat(req.body.charges.serviceCharges?.gstRate) || 18,
                            total: calculateTotal(req.body.charges.serviceCharges?.amount, req.body.charges.serviceCharges?.gstRate),
                        },
                        overduePenalty: {
                            amount: parseFloat(req.body.charges.overduePenalty?.amount) || 0,
                            gstRate: parseFloat(req.body.charges.overduePenalty?.gstRate) || 18,
                            total: calculateTotal(req.body.charges.overduePenalty?.amount, req.body.charges.overduePenalty?.gstRate),
                        },
                        foreclosureCharges: {
                            amount: parseFloat(req.body.charges.foreclosureCharges?.amount) || 0,
                            gstRate: parseFloat(req.body.charges.foreclosureCharges?.gstRate) || 18,
                            total: calculateTotal(req.body.charges.foreclosureCharges?.amount, req.body.charges.foreclosureCharges?.gstRate),
                        },
                    };

                    //  total calculation
                    const totalFees = [
                        finalCharges.overdueInterest?.total || 0,
                        finalCharges.noticeCharges?.total || 0,
                        finalCharges.serviceCharges?.total || 0,
                        finalCharges.overduePenalty?.total || 0,
                        finalCharges.foreclosureCharges?.total || 0,
                    ].reduce((sum, val) => sum + val, 0);

                    const grossAmount = finalCharges.foreClosurePrincipal + totalFees;
                    const netAmount = Math.max(0, grossAmount - finalCharges.closureDiscount);

                    finalAmount = Math.round(netAmount * 100) / 100;
                    finalTotalForeclosureFees = Math.round(totalFees * 100) / 100;
                }

                // Update Loan as Closed
                await t.update(loanRef, {
                    closed: true,
                    closedDate: systemDate,
                    closureType: 'foreclosure',
                    foreclosurePrinciple: finalCharges.foreClosurePrincipal,
                    foreclosureAmount: finalAmount,
                    foreclosureFee: finalTotalForeclosureFees,
                    foreclosureTransactionId: transactionId,
                    foreclosureBy: token.email,
                    lastModified: approvedAt,
                    remainingBalance: 0,
                    foreclosureStatus: 'approved',
                    totalEMI: loanData.paidEMI,
                });

                const transactionObject = {
                    entryDate: systemDate,
                    accountType: queueData.accountType,
                    amount: finalAmount,
                    interest: 0,
                    principle: finalAmount,
                    glCode: queueData.glCode,
                    glHead: queueData.glHead,
                    account: queueData.accountNumber,
                    method: 'cash',
                    paidEMI: 0,
                    type: 'credit',
                    name: borrowerName,
                    narration: `Loan Foreclosure by ${borrowerName}`,
                    createdAt: approvedAt,
                    createdBy: token.email,
                    authorisedAt: new Date().toISOString(),
                    authorisedBy: token.email,
                };
                const accountLedgerRef = db.collection(token.bankId).doc('accounts').collection(queueData.accountType).doc(queueData.accountNumber).collection('transaction').doc(transactionId);
                await t.set(accountLedgerRef, transactionObject);

                const bankLedgerRef = db.collection(token.bankId).doc('transaction').collection(systemDate).doc(`${transactionId}.1`);
                await t.set(bankLedgerRef, transactionObject);

                const bankFeeLedgerRef = db.collection(token.bankId).doc('transaction').collection(systemDate).doc(`${transactionId}.2`);
                await t.set(bankFeeLedgerRef, {
                    ...transactionObject,
                    amount: finalTotalForeclosureFees,
                    glCode: '18148',
                    glHead: 'TAXES & FEES RECEIVED',
                    narration: `Foreclosure fee for A/C ${queueData.accountNumber}`,
                });

                // const repaymentPiRef = db.collection(token.bankId)
                //     .doc('pi')
                //     .collection('loan-repayment')
                //     // .collection('loan-foreclosure')
                //     .doc(transactionId);
                //
                // await t.set(repaymentPiRef, {
                //     account: queueData.accountNumber,
                //     accountType: queueData.accountType,
                //     name: borrowerName,
                //     amount: finalAmount,
                //     foreclosureAmount: finalAmount,
                //     foreclosureFee: finalTotalForeclosureFees,
                //     emiCollection: 0,
                //     glCode: queueData.glCode,
                //     glHead: queueData.glHead,
                //     interestGLCode: queueData.interestGLCode,
                //     interestGLHead: queueData.interestGLHead,
                //     method: finalCharges.payMode || 'cash',
                //     narration: `Loan Foreclosure by ${borrowerName}`,
                //     transactionDate: systemDate,
                //     entryDate: systemDate,
                //     type: 'credit',
                //     createdBy: token.email,
                //     createdAt: approvedAt,
                //     status: 'success',
                //     transactionType: 'loan-foreclosure',
                //     applicants: loanData.applicants,
                //     charges: finalCharges,
                //     transactionId: transactionId,
                // });

                // Remove from approval queue
                await t.delete(queueRef);
            });

            return res.send({
                success: `Loan foreclosure approved successfully.`,
                transactionId
            });
        } catch (error) {
            console.error('Approval failed:', error);
            return res.status(500).send({error: error.message || 'Failed to approve.'});
        }
    });


    app.get('/api/loan/foreclosure/pending/:type', async (req, res) => {
        const { type } = req.params;
        const token = req.user;

        if (!['loan', 'group-loan'].includes(type)) {
            return res.status(400).send({ error: 'Invalid account type. Must be "loan" or "group-loan".' });
        }

        if (!token) return res.status(401).send({ error: 'Unauthorized.' });

        try {

            const queueSnapshot = await db
              .collection(token.bankId)
              .doc('approval-queue')
              .collection('foreclosure')
              .where('status', '==', 'pending')
              .where('accountType', '==', type)
              .get();

            if (queueSnapshot.empty) {
                return res.send({ pendingRequests: [], count: 0 });
            }

            const pendingRequests = [];
            const fetchPromises = [];

            queueSnapshot.forEach(doc => {
                const enrichRequest = async () => {
                    try {
                        const requestData = doc.data();
                        const { accountNumber } = requestData;


                        const loanRef = db.collection(token.bankId)
                          .doc('accounts')
                          .collection(type)
                          .doc(accountNumber);

                        const loanSnap = await loanRef.get();

                        let borrowerName = 'N/A';
                        if (loanSnap.exists) {
                            const loanData = loanSnap.data();
                            if (loanData.applicants?.[0]) {
                                const kycDoc = await db.collection(token.bankId)
                                  .doc('kyc')
                                  .collection('member-kyc')
                                  .doc(loanData.applicants[0])
                                  .get();
                                if (kycDoc.exists) {
                                    borrowerName = kycDoc.data().name;
                                }
                            }

                            pendingRequests.push({
                                transactionId: doc.id,
                                ...requestData,
                                borrowerName,
                                loanDetails: {
                                    currentDebt: loanData.currentDebt || 0,
                                    principleDue: loanData.principleDue || 0,
                                    totalEMI: loanData.totalEMI || 0,
                                    paidEMI: loanData.paidEMI || 0,
                                    scheme: loanData.scheme || 'N/A',
                                    emiAmount: loanData.emiAmount || 0,
                                    loanAmount: loanData.loanAmount || 0,
                                    disbursementDate: loanData.disbursementDate || 'N/A',
                                    planDetails: loanData.planDetails || {},
                                    glCode: loanData.glCode || '23315',
                                    glHead: loanData.glHead || 'SHORT TERM PERSONAL LOAN - CURRENT',
                                    interestGLCode: loanData.interestGLCode || '52315',
                                    interestGLHead: loanData.interestGLHead || 'INTEREST ON SHORT TERM PERSONAL LOAN-CURRENT',
                                },
                                requestDate: requestData.requestDate || requestData.createdAt,
                                createdAt: requestData.createdAt,
                            });
                        } else {
                            pendingRequests.push({
                                transactionId: doc.id,
                                ...requestData,
                                borrowerName,
                                loanDetails: null,
                                requestDate: requestData.requestDate || requestData.createdAt,
                                createdAt: requestData.createdAt,
                                warning: 'Loan account not found',
                            });
                        }
                    } catch (err) {
                        console.error(`Failed to enrich request ${doc.id}:`, err);
                        pendingRequests.push({
                            transactionId: doc.id,
                            ...requestData,
                            borrowerName: 'N/A',
                            loanDetails: null,
                            requestDate: requestData.requestDate || requestData.createdAt,
                            createdAt: requestData.createdAt,
                            error: 'Failed to load details',
                        });
                    }
                };

                fetchPromises.push(enrichRequest());
            });

            await Promise.all(fetchPromises);

            // Sort newest first
            pendingRequests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            return res.send({
                count: pendingRequests.length,
                pendingRequests
            });
        } catch (error) {
            console.error('Failed to fetch pending requests:', error);
            return res.status(500).send({
                error: 'Failed to fetch pending requests.'
            });
        }
    });




    app.get('/api/loan/foreclose/request-slip/:transactionId', async (req, res) => {
        const token = req.user;
        if (!token) return res.status(401).send({ error: 'Unauthorized.' });

        const { transactionId } = req.params;

        try {
            const piDoc = db.collection(token.bankId)
              .doc('approval-queue')
              .collection('foreclosure')
              .doc(transactionId);
            const piSnap = await piDoc.get();
            if (!piSnap.exists) return res.status(404).send({ error: 'Request not found.' });

            const piData = piSnap.data();

            const loanRef = db.collection(token.bankId)
              .doc('accounts')
              .collection(piData.accountType)
              .doc(piData.accountNumber);
            const loanDoc = await loanRef.get();
            const loanData = loanDoc.exists ? loanDoc.data() : {};

            const kycDoc = await db.collection(token.bankId)
              .doc('kyc')
              .collection('member-kyc')
              .doc(loanData.applicants?.[0])
              .get();
            const memberName = kycDoc.exists ? kycDoc.data().name : 'N/A';

            const bankDoc = await db.collection(token.bankId)
              .doc('admin')
              .collection('bank-info')
              .doc('details')
              .get();
            const bankInfo = bankDoc.exists ? bankDoc.data() : {
                bankName: 'Your Financial Institution',
                address: 'Address not available',
                registrationCode: 'Registration not available',
                phone: 'Phone not available',
                email: 'Email not available',
                logo: 'https://via.placeholder.com/150'
            };

            const formatCurrency = (amt) => new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR'
            }).format(amt || 0);


            // Official style HTML
            const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Foreclosure Request Slip</title>
  <style>
    body {
      font-family: 'Times New Roman', serif;
      margin: 0;
      padding: 30px;
      background: #fff;
      font-size: 13px;
      color: #000;
    }
    .container {
      width: 100%;
      margin: auto;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #000;
      padding-bottom: 10px;
      margin-bottom: 15px;
    }
    .header img {
      height: 60px;
      margin-bottom: 5px;
    }
    .header h1 {
      margin: 0;
      font-size: 20px;
      font-weight: bold;
    }
    .header p {
      margin: 2px 0;
      font-size: 12px;
    }
    .title {
      text-align: center;
      font-size: 16px;
      font-weight: bold;
      margin: 20px 0;
      text-decoration: underline;
    }
    h2 {
      font-size: 14px;
      margin: 15px 0 5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 15px;
    }
    th, td {
      border: 1px solid #000;
      padding: 6px;
      text-align: left;
      font-size: 12px;
    }
    th {
      background-color: #f2f2f2;
    }
    .signatory {
      margin-top: 40px;
      display: flex;
      justify-content: space-between;
      font-size: 12px;
    }
    .signatory div {
      text-align: center;
      width: 45%;
    }
    .footer {
      margin-top: 30px;
      border-top: 1px solid #000;
      padding-top: 10px;
      text-align: center;
      font-size: 11px;
      color: #444;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${bankInfo.logo ? `<img src="${bankInfo.logo.trim()}" alt="Bank Logo" />` : ''}
      <h1>${bankInfo.bankName}</h1>
      <p>${bankInfo.address}</p>
      <p>Regd. Code: ${bankInfo.registrationCode} | Phone: ${bankInfo.phone} | Email: ${bankInfo.email}</p>
    </div>

    <div class="title">FORECLOSURE REQUEST SLIP</div>

    <h2>Request Details</h2>
    <table>
      <tr><td><strong>Transaction ID</strong></td><td>${transactionId}</td></tr>
      <tr><td><strong>Account Number</strong></td><td>${piData.accountNumber}</td></tr>
      <tr><td><strong>Borrower Name</strong></td><td>${memberName}</td></tr>
      <tr><td><strong>Status</strong></td><td>Pending Approval</td></tr>
      <tr><td><strong>Requested On</strong></td><td>${new Date(piData.createdAt).toLocaleDateString('en-IN')}</td></tr>
      <tr><td><strong>Requested By</strong></td><td>${piData.createdBy.split('@')[0]}</td></tr>
    </table>

    <h2>Charges Summary</h2>
    <table>
      <tr><th>Description</th><th>Amount</th></tr>
      <tr><td>Principal</td><td>${formatCurrency(piData.charges?.foreClosurePrincipal)}</td></tr>
      <tr><td>Foreclosure Fee</td><td>${formatCurrency(piData.charges?.foreClosureCharges?.total)}</td></tr>
      <tr><td>Overdue Interest</td><td>${formatCurrency(piData.charges?.overdueInterest?.total)}</td></tr>
      <tr><td>Notice Charges</td><td>${formatCurrency(piData.charges?.noticeCharges?.total)}</td></tr>
      <tr><td>Service Charges</td><td>${formatCurrency(piData.charges?.serviceCharges?.total)}</td></tr>
      <tr><td>Penalty</td><td>${formatCurrency(piData.charges?.overduePenalty?.total)}</td></tr>
      <tr><td>Discount</td><td>- ${formatCurrency(piData.charges?.closureDiscount)}</td></tr>
      <tr><td><strong>Total to Collect</strong></td><td><strong>${formatCurrency(piData.totalForeclosureAmount)}</strong></td></tr>
    </table>

    <div class="signatory">
      <div>
        _______________________<br>
        Authorized Officer
      </div>
      <div>
        _______________________<br>
        Borrower’s Signature
      </div>
    </div>

    <div class="footer">
      <p>This is a system-generated foreclosure request slip and does not require a signature.</p>
      <p>Generated on: ${new Date().toLocaleDateString('en-IN')}</p>
    </div>
  </div>
</body>
</html>
`;

            const browser = await puppeteer.launch({
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
                headless: true
            });
            const page = await browser.newPage();
            await page.setContent(html, { waitUntil: 'networkidle0' });
            const pdf = await page.pdf({ format: 'A4', printBackground: true });
            await browser.close();

            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="Foreclosure_Request_${memberName}_${transactionId}.pdf"`,
            });
            res.end(pdf);

        } catch (error) {
            console.error('Request slip generation failed:', error);
            return res.status(500).send({ error: 'Failed to generate request slip.' });
        }
    });


    app.get('/api/loan/foreclose/receipt/:account', async (req, res) => {
        const token = req.user;
        if (!token) return res.status(401).send({error: 'Unauthorized.'});

        const {account} = req.params;

        try {
            const loanRef = db.collection(token.bankId).doc('accounts').collection('loan').doc(account);
            const loanDoc = await loanRef.get();
            if (!loanDoc.exists) return res.status(404).send({error: 'Loan not found.'});

            const data = loanDoc.data();
            if (!data.closed || data.closureType !== 'foreclosure') {
                return res.status(400).send({error: 'Loan not foreclosed.'});
            }

            const kycDoc = await db.collection(token.bankId)
                .doc('kyc')
                .collection('member-kyc')
                .doc(data.applicants?.[0])
                .get();
            const memberName = kycDoc.exists ? kycDoc.data().name : 'N/A';

            const bankDoc = await db.collection(token.bankId)
                .doc('admin')
                .collection('bank-info')
                .doc('details')
                .get();
            const bankInfo = bankDoc.exists ? bankDoc.data() : {
                bankName: 'Your Financial Institution',
                address: 'Address not available',
                registrationCode: 'Registration not available',
                phone: 'Phone not available',
                email: 'Email not available',
                logo: 'https://via.placeholder.com/150'
            };

            const formatCurrency = (amt) => new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR'
            }).format(amt);

            const principal = parseFloat(data.foreclosureBalance) || 0;
            const fee = parseFloat(data.foreclosureFee) || 0;
            const total = principal + fee;

            const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Foreclosure Receipt</title>
  <style>
    body { font-family: 'Segoe UI', sans-serif; margin: 0; padding: 0; background: #f4f6f9; }
    .container { max-width: 800px; margin: 20px auto; padding: 30px; background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #d1d8e0; padding-bottom: 15px; }
    .header img { height: 70px; margin-bottom: 10px; }
    .header h1 { margin: 5px 0; color: #2d3436; font-size: 24px; font-weight: 600; }
    .header p { margin: 5px 0; color: #636e72; font-size: 14px; }
    .title { text-align: center; color: #a55eea; font-size: 22px; font-weight: bold; margin: 20px 0; text-transform: uppercase; letter-spacing: 1px; }
    .section { margin: 20px 0; padding: 15px; border: 1px solid #dfe6e9; border-radius: 8px; background: #f9fafa; }
    .section h2 { color: #2d3436; border-bottom: 1px solid #b2bec3; padding-bottom: 5px; margin-bottom: 10px; font-size: 16px; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 14px; }
    th, td { border: 1px solid #636e72; padding: 8px; text-align: left; }
    th { background-color: #dfe6e9; color: #2d3436; font-weight: 600; }
    .footer { text-align: center; margin-top: 30px; color: #636e72; font-size: 12px; border-top: 1px solid #dfe6e9; padding-top: 15px; }
    .qr { text-align: center; margin: 20px 0; }
    .qr img { width: 120px; height: 120px; border: 2px solid #a55eea; border-radius: 8px; }
    .badge { background: #00b894; color: white; padding: 5px 10px; border-radius: 4px; font-size: 12px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${bankInfo.logo ? `<img src="${bankInfo.logo.trim()}" alt="Logo" />` : ''}
      <h1>${bankInfo.bankName}</h1>
      <p>${bankInfo.address}</p>
      <p><strong>Reg:</strong> ${bankInfo.registrationCode} | 
         <strong>Phone:</strong> ${bankInfo.phone} | 
         <strong>Email:</strong> ${bankInfo.email}</p>
    </div>

    <div class="title">Loan Foreclosure Receipt</div>

    <div class="section">
      <h2>Loan Details</h2>
      <table>
        <tr><td><strong>Account No.</strong></td><td>${account}</td></tr>
        <tr><td><strong>Borrower Name</strong></td><td>${memberName}</td></tr>
        <tr><td><strong>Closed On</strong></td><td>${data.closedDate}</td></tr>
        <tr><td><strong>Status</strong></td><td><span class="badge">Closed - Foreclosed</span></td></tr>
      </table>
    </div>

    <div class="section">
      <h2>Payment Summary</h2>
      <table>
        <tr><th>Description</th><th>Amount (₹)</th></tr>
        <tr><td>Principal Balance</td><td>${formatCurrency(principal)}</td></tr>
        <tr><td>Foreclosure Fee</td><td>${formatCurrency(fee)}</td></tr>
        <tr style="font-weight:bold;"><td>Total Payment</td><td>${formatCurrency(total)}</td></tr>
      </table>
    </div>

    <div class="section">
      <h2>Approval Details</h2>
      <table>
        <tr><td><strong>Transaction ID</strong></td><td>${data.foreclosureTransactionId || 'N/A'}</td></tr>
        <tr><td><strong>Approved By</strong></td><td>${data.foreclosureBy?.split('@')[0] || 'N/A'}</td></tr>
        <tr><td><strong>Approved On</strong></td><td>${new Date().toLocaleDateString('en-IN')}</td></tr>
      </table>
    </div>

    <div class="footer">
      <p>This is a system-generated receipt.</p>
      <p>Generated on: ${new Date().toLocaleDateString('en-IN')}</p>
    </div>

    <div class="qr">
     
    </div>
  </div>
</body>
</html>`;

            const browser = await puppeteer.launch({
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
                headless: true
            });
            const page = await browser.newPage();
            await page.setContent(html, {waitUntil: 'networkidle0'});
            const pdf = await page.pdf({format: 'A4', printBackground: true});
            await browser.close();

            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="Foreclosure_${memberName}_${account}.pdf"`,
            });
            res.end(pdf);

        } catch (error) {
            console.error('PDF generation failed:', error);
            return res.status(500).send({error: 'Failed to generate receipt.'});
        }
    });


    app.post('/api/loan/foreclose/reject', async (req, res) => {
        const token = req.user;
        if (!token) return res.status(401).send({error: 'Unauthorized.'});
        if (!['manager', 'root'].includes(token.role)) {
            return res.status(403).send({error: 'Permission denied.'});
        }

        const {transactionId, rejectionReason} = req.body;
        const rejectedAt = new Date().toISOString();

        if (!transactionId) {
            return res.status(400).send({error: 'Transaction ID is required.'});
        }

        try {
            await db.runTransaction(async (t) => {
                const queueRef = db.collection(token.bankId)
                    .doc('approval-queue')
                    .collection('foreclosure')
                    .doc(transactionId);
                const queueSnap = await t.get(queueRef);

                if (!queueSnap.exists) {
                    throw new Error('Rejection failed: Request not found in approval queue. Already processed or invalid.');
                }
                const queueData = queueSnap.data();

                //  Loan Account
                const loanRef = db.collection(token.bankId)
                    .doc('accounts')
                    .collection(queueData.accountType)
                    .doc(queueData.accountNumber);
                const loanSnap = await t.get(loanRef);

                if (!loanSnap.exists) {
                    throw new Error('Rejection failed: Loan account not found.');
                }

                const loanData = loanSnap.data();
                if (loanData.foreclosureStatus !== 'pending') {
                    throw new Error(`Rejection failed: Loan foreclosure status is "${loanData.foreclosureStatus}".`);
                }

                const rejectedPiRef = db.collection(token.bankId)
                    .doc('rejected-pi')
                    .collection('rejected-foreclosure')
                    .doc(transactionId);

                await t.set(rejectedPiRef, {
                    ...queueData,
                    status: 'rejected',
                    rejectedBy: token.email,
                    rejectedAt: rejectedAt,
                    rejectionReason: rejectionReason || 'No reason provided',
                    originalRequestDate: queueData.requestDate,
                    movedAt: rejectedAt,
                });


                // loan foreclosure status
                await t.update(loanRef, {
                    foreclosureStatus: 'Rejected',
                    lastForeclosureRequestDate: null,
                    lastForeclosureRequestId: null,
                });

                await t.delete(queueRef);
            });

            return res.send({
                success: `Foreclosure request ${transactionId} has been rejected and archived.`,
                transactionId
            });
        } catch (error) {
            console.error('Rejection failed:', error);
            return res.status(500).send({
                error: error.message || 'Failed to reject request.'
            });
        }
    });



    app.get('/api/loan/foreclosed-accounts/:type', async (req, res) => {
        const { type } = req.params;
        const token = req.user;

        if (type !== 'loan' && type !== 'group-loan') {
            return res.status(400).send({
                error: "Invalid account type. Must be 'loan' or 'group-loan'."
            });
        }

        if (!token) return res.status(401).send({ error: 'Unauthorized.' });

        try {

            const loanSnapshot = await db
              .collection(token.bankId)
              .doc('accounts')
              .collection(type)
              .where('closureType', '==', 'foreclosure')
              .get();

            if (loanSnapshot.empty) {
                return res.send({ accounts: [], count: 0 });
            }

            const accounts = [];
            const fetchPromises = [];

            loanSnapshot.forEach(doc => {
                const enrichLoan = async () => {
                    try {
                        const loanData = doc.data();
                        let borrowerName = 'N/A';

                        if (loanData.applicants?.[0]) {
                            const kycDoc = await db
                              .collection(token.bankId)
                              .doc('kyc')
                              .collection('member-kyc')
                              .doc(loanData.applicants[0])
                              .get();

                            if (kycDoc.exists && kycDoc.data().name) {
                                borrowerName = kycDoc.data().name;
                            }
                        }

                        accounts.push({
                            accountNumber: doc.id,
                            accountType: type,
                            ...loanData,
                            borrowerName,
                            closureDate: loanData.closedDate || 'N/A',
                            foreclosureAmount: loanData.foreclosureAmount || 0,
                            foreclosureFee: loanData.foreclosureFee || 0,
                            foreclosurePrinciple: loanData.foreclosurePrinciple || 0,
                            foreclosureBy: loanData.foreclosureBy || 'N/A',
                            foreclosureTransactionId: loanData.foreclosureTransactionId || 'N/A',
                            emiMode: loanData.planDetails?.emiMode || 'N/A',
                            loanAmount: loanData.loanAmount || 0,
                            disbursementDate: loanData.disbursementDate || 'N/A',
                            status: 'Closed - Foreclosure',
                            lastModified: loanData.lastModified || loanData.closedDate || 'N/A',
                        });
                    } catch (err) {
                        console.error(`Failed to enrich loan ${doc.id}:`, err);
                        accounts.push({
                            accountNumber: doc.id,
                            accountType: type,
                            borrowerName: 'N/A',
                            closureDate: 'N/A',
                            error: 'Failed to load details',
                        });
                    }
                };

                fetchPromises.push(enrichLoan());
            });

            await Promise.all(fetchPromises);

            accounts.sort((a, b) => {
                const dateA = new Date(a.closedDate || a.lastModified || 0);
                const dateB = new Date(b.closedDate || b.lastModified || 0);
                return dateB - dateA;
            });

            return res.send({
                count: accounts.length,
                accounts
            });
        } catch (error) {
            console.error('Failed to fetch foreclosed accounts:', error);
            return res.status(500).send({
                error: 'Failed to fetch foreclosed accounts.'
            });
        }
    });




};
