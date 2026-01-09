const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const db = getFirestore();
const { generateKeywords } = require('../../utils/searchUtils');

const dataMigration = app => {
  app.post('/api/admin/load-data-from-excel', async (req, res) => {
    const token = req.user;
    const bankId = req.body.bankId;

    // Auth checks
    if (!token) return res.status(401).send({ error: 'You are not authorized. Please log in.' });
    if (token.role !== 'root') return res.status(401).send({ error: 'You are not authorized. Only admin is allowed' });

    try {
      if (req.body.type === 'member-kyc') {
        await loadMemberData(bankId, req.body.rows);
        res.send({ success: 'Successfully loaded member data' });
      } else if (req.body.type === 'loan-account') {
        await loanAccountLoader(bankId, req.body.rows);
        res.send({ success: 'Successfully loaded loan account data' });
      } else if (req.body.type === 'loan-transaction') {
        await loanTransactionsLoader(bankId, req.body.rows);
        res.send({ success: 'Successfully loaded loan transactions data' });
      } else {
        res.send({ error: 'Invalid type' });
      }

    } catch (err) {
      console.error('Error creating user:', err);
      res.send({ error: 'Failed to Loan Data. Please check error message' });
    }
  });

  app.post('/api/admin/migrate-transactions', async (req, res) => {
    const token = req.user;
    const bankId = req.body.bankId || token.bankId;

    if (!token) return res.status(401).send({ error: 'You are not authorized. Please log in.' });
    if (token.role !== 'root') return res.status(401).send({ error: 'Unauthorized' });

    try {
      const stats = await migrateTransactions(bankId);
      res.send({ success: true, stats });
    } catch (err) {
      console.error('Migration failed:', err);
      res.status(500).send({ error: err.message });
    }
  });

  app.post('/api/admin/rebuild-search-keywords', async (req, res) => {
    const token = req.user;
    const bankId = req.body.bankId || token.bankId;

    if (!token) return res.status(401).send({ error: 'You are not authorized. Please log in.' });
    if (token.role !== 'root') return res.status(401).send({ error: 'Unauthorized' });

    try {
      const stats = await rebuildKeywords(bankId);
      res.send({ success: true, stats });
    } catch (err) {
      console.error('Keyword rebuild failed:', err);
      res.status(500).send({ error: err.message });
    }
  });
};

async function migrateTransactions(bankId) {
  const transactionDocRef = db.collection(bankId).doc('transaction');
  const collections = await transactionDocRef.listCollections();

  let totalMigrated = 0;
  let foldersProcessed = 0;

  for (const collection of collections) {
    const date = collection.id; // The collection ID is the date (YYYY-MM-DD)
    const snapshot = await collection.get();

    if (snapshot.empty) continue;

    const batch = db.batch();
    let batchCount = 0;

    snapshot.forEach(doc => {
      const transData = doc.data();
      const globalRef = db.collection(bankId).doc('consolidated').collection('transactions').doc(doc.id);

      batch.set(globalRef, {
        ...transData,
        id: doc.id,
        entryDate: transData.entryDate || date,
        migrated: true,
        migratedAt: new Date().toISOString()
      }, { merge: true });

      // Update Daily Stats logic (manual for migration batch)
      const statsRef = db.collection(bankId).doc('consolidated').collection('daily_stats').doc(transData.entryDate || date);
      const amount = parseFloat(transData.amount) || 0;
      const type = transData.type;
      const method = transData.method;
      const glCode = transData.glCode || '';

      const statsUpdate = {};
      if (method === 'cash') {
        statsUpdate.cashInHand = FieldValue.increment(type === 'credit' ? amount : -amount);
        if (type === 'credit') statsUpdate.totalCashReceipts = FieldValue.increment(amount);
        else statsUpdate.totalCashPayments = FieldValue.increment(amount);
      }
      if (glCode.startsWith('1')) {
        if (type === 'credit') statsUpdate.totalSavingsCredit = FieldValue.increment(amount);
        else statsUpdate.totalSavingsDebit = FieldValue.increment(amount);
      } else if (glCode === '23315' || glCode === '23105') {
        if (type === 'debit') statsUpdate.totalLoanDisbursed = FieldValue.increment(amount);
        else statsUpdate.totalLoanPrincipalCollected = FieldValue.increment(amount);
      } else if (glCode === '52315' || glCode === '52105') {
        if (type === 'credit') statsUpdate.totalInterestCollected = FieldValue.increment(amount);
      }

      batch.set(statsRef, statsUpdate, { merge: true });

      batchCount++;
      totalMigrated++;
    });

    if (batchCount > 0) {
      await batch.commit();
    }
    foldersProcessed++;
    console.log(`Migrated ${batchCount} transactions for date ${date}`);
  }

  return { totalMigrated, foldersProcessed };
}

module.exports = dataMigration;

async function loadMemberData(bankId, memberData) {
  const bankRef = db.collection(bankId).doc('kyc').collection('member-kyc');
  const batch = db.batch();

  for (let i = 0; i < memberData.length; i++) {
    const member = memberData[i];
    const memberRef = bankRef.doc(member.id);
    batch.set(memberRef, {
      ...member,
      active: true,
      loadedDate: new Date().toISOString().slice(0, 10),
      date: excelDateToJSDateString(member.date),
      joiningDate: excelDateToJSDateString(member.date),
      uuid: '#',
      bankId: bankId,
    });
    console.log(`${i + 1} Member ${member.id} added to the database`);
  }
  await batch.commit();
  console.log('Member data loaded successfully');
}

async function loanAccountLoader(bankId, inputData) {
  const loanAccountColRef = db.collection(bankId).doc('accounts').collection('loan');
  const batch = db.batch();

  for (let i = 0; i < inputData.length; i++) {
    const details = inputData[i];

    const loanAccountRef = loanAccountColRef.doc(details.id);
    batch.set(loanAccountRef, {
      account: details.id,
      disbursement: details.disbursement || 0,
      disbursementDate: excelDateToJSDateString(details.disbursementDate),
      loanTerm: details.loanTerm,
      loanAmount: details.disbursement || 0,
      loanDate: excelDateToJSDateString(details.disbursementDate),
      emiAmount: details.emiAmount,
      principleEMI: details.principleEMI,
      interestEMI: details.interestEMI,
      totalEMI: details.totalEMI,
      paidEMI: details.paidEMI,
      closed: false,
      firstEmiDate: excelDateToJSDateString(details.disbursementDate),
      applicants: [details.memberId],
      planDetails: {
        calculationMethod: details.planDetails?.calculationMethod || 'FLAT',
        emiCount: details.totalEMI,
        emiInterval: details.planDetails?.emiInterval || '',
        interestRate: details.planDetails?.interestRate || '',
        loanAmount: details.disbursement || 0,
        emiMode: details.planDetails?.emiMode || '',
      },
      guarantor: details.guarantor || '',
      coApplicant: {},
      deductionDetails: {
        gst: details.deductionDetails?.gst || 0,
        insuranceAmount: details.deductionDetails?.insuranceAmount || 0,
        legalAmount: details.deductionDetails?.legalAmount || 0,
        processingFee: details.deductionDetails?.processingFee || 0,
      },
      associatedEmployee: '',
      emiSchedule: [],
    });
    const transactionNumber = `${excelDateToJSDateString(details.disbursementDate).replaceAll('-', '')}.${i}-d`;

    const loanDisbursementTransRef = db.collection(bankId).doc('accounts').collection('loan').doc(details.id).collection('transaction').doc(transactionNumber);
    batch.set(loanDisbursementTransRef, {
      accountType: 'loan',
      entryDate: excelDateToJSDateString(details.disbursementDate),
      type: 'debit',
      method: 'cash',
      narration: `Loan Disbursement for ${details.id}`,
      name: '',
      amount: details.disbursement || 0,
      balance: 0,
      glCode: '23315',
      glHead: 'SHORT TERM PERSONAL LOAN - CURRENT',
      author: 'Data Migration',
      approvedBy: '',
      createdAt: Date.now(),
      approvedAt: Date.now(),
    });

    const disbursementTransRef = db.collection(bankId).doc('transaction').collection(excelDateToJSDateString(details.disbursementDate)).doc(transactionNumber);
    batch.set(disbursementTransRef, {
      accountType: 'loan',
      entryDate: excelDateToJSDateString(details.disbursementDate),
      type: 'debit',
      method: 'cash',
      narration: `Loan Disbursement for ${details.id}`,
      name: '',
      amount: details.disbursement || 0,
      balance: 0,
      glCode: '23315',
      glHead: 'SHORT TERM PERSONAL LOAN - CURRENT',
      author: 'Data Migration',
      approvedBy: '',
      createdAt: Date.now(),
      approvedAt: Date.now(),
    });

    console.log(`${i + 1} Account ${details.id} added to the database`);
  }
  await batch.commit();
  console.log('Account Transaction loaded successfully');
}

async function rebuildKeywords(bankId) {
  const collectionsToUpdate = [
    { path: db.collection('admin').doc('organization').collection('banks'), fields: ['bankName', 'displayName', 'branchCode'] },
    { path: db.collection(bankId).doc('kyc').collection('member-kyc'), fields: ['name', 'phone', 'aadhar', 'pan'] },
    { path: db.collection(bankId).doc('kyc').collection('advisor-kyc'), fields: ['name', 'phone', 'aadhar', 'pan'] },
    { path: db.collection(bankId).doc('kyc').collection('employee-kyc'), fields: ['name', 'phone'] },
    { path: db.collection(bankId).doc('admin').collection('users'), fields: ['name', 'phone', 'email'] },
    { path: db.collection(bankId).doc('accounts').collection('savings'), fields: ['account', 'applicants'] },
    { path: db.collection(bankId).doc('accounts').collection('loan'), fields: ['account', 'applicants'] },
    { path: db.collection(bankId).doc('accounts').collection('group-loan'), fields: ['account', 'applicants', 'groupId'] },
    { path: db.collection(bankId).doc('accounts').collection('recurring-deposit'), fields: ['account', 'applicants'] },
    { path: db.collection(bankId).doc('accounts').collection('fixed-deposit'), fields: ['account', 'applicants'] },
    { path: db.collection(bankId).doc('accounts').collection('cash-certificate'), fields: ['account', 'applicants'] },
    { path: db.collection(bankId).doc('accounts').collection('mis-deposit'), fields: ['account', 'applicants'] },
    { path: db.collection(bankId).doc('accounts').collection('thrift-fund'), fields: ['account', 'applicants'] },
    { path: db.collection(bankId).doc('accounts').collection('daily-savings'), fields: ['account', 'applicants'] },
  ];
  // ... existing loop

  let totalUpdated = 0;

  for (const coll of collectionsToUpdate) {
    const snapshot = await coll.path.get();
    let batch = db.batch();
    let count = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const stringToTokenize = [doc.id, ...coll.fields.map(f => data[f])].filter(Boolean).join(' ');
      const searchKeywords = generateKeywords(stringToTokenize);

      batch.update(doc.ref, { searchKeywords });
      count++;
      totalUpdated++;

      if (count >= 500) {
        await batch.commit();
        batch = db.batch();
        count = 0;
      }
    }
    if (count > 0) await batch.commit();
  }

  return { totalUpdated };
}

async function loanTransactionsLoader(bankId, inputData) {
  const batch = db.batch();

  for (let i = 0; i < inputData.length; i++) {
    const details = inputData[i];
    const transactionObject = {
      entryDate: excelDateToJSDateString(details.transactionDate),
      accountType: 'loan',
      amount: details.totalAmount,
      interest: details.interest,
      principle: details.principal,
      glCode: '23315',
      glHead: 'SHORT TERM PERSONAL LOAN - CURRENT',
      account: details.accountNumber,
      method: 'cash',
      lateFee: details.lateFee,
      paidEMI: details.paidEMICount,
      type: 'credit',
      name: '',
      narration: `Loan Repayment for ${details.accountNumber} on ${excelDateToJSDateString(details.transactionDate)}`,
      createdAt: Date.now(),
      createdBy: 'Data Migration',
      authorisedAt: Date.now(),
      authorisedBy: 'Data Migration',
    };
    const transactionNumber = `${excelDateToJSDateString(details.transactionDate).replaceAll('-', '')}.${i}-p`;
    const loanAccountTransRef = db.collection(bankId).doc('accounts').collection('loan').doc(details.accountNumber).collection('transaction').doc(`${transactionNumber}`);
    batch.set(loanAccountTransRef, transactionObject);

    const principleTransRef = db.collection(bankId).doc('transaction').collection(excelDateToJSDateString(details.transactionDate)).doc(`${transactionNumber}.2`);
    batch.set(principleTransRef, {
      ...transactionObject,
      amount: details.principal,
    });

    const interestTransRef = db.collection(bankId).doc('transaction').collection(excelDateToJSDateString(details.transactionDate)).doc(`${transactionNumber}.3`);
    batch.set(interestTransRef, {
      ...transactionObject,
      glCode: '52315',
      glHead: 'INTEREST ON SHORT TERM PERSONAL LOAN-CURRENT',
      amount: details.interest,
    });

    console.log(`${i + 1} Account ${details.accountNumber} transactions added to the database`);
  }
  await batch.commit();
  console.log('Account Transaction is loaded successfully');
}

function excelDateToJSDateString(excelDateNumber) {
  if (excelDateNumber === null) {
    return ''
  }
  // Number of days between Jan 1, 1900 and Jan 1, 1970 (plus one day for Excel's leap year bug)
  const excelToJSDateDaysDiff = 25569;

  // Convert the Excel day count to JavaScript millisecond count
  const milliseconds = (excelDateNumber - excelToJSDateDaysDiff) * 86400 * 1000;
  const date = new Date(milliseconds)
  if (isNaN(date.getTime())) {
    return ''
  }

  // Create a new JavaScript Date object using UTC milliseconds
  return new Date(milliseconds).toJSON().slice(0, 10);
}