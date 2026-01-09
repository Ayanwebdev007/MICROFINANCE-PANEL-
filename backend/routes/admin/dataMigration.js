const { getFirestore} = require('firebase-admin/firestore');
const db = getFirestore();

const dataMigration = app => {
  app.post('/api/admin/load-data-from-excel', async (req, res) => {
    const token = req.user;
    const bankId = req.body.bankId;

    // Auth checks
    if (!token) return res.status(401).send({error: 'You are not authorized. Please log in.'});
    if (token.role !== 'root') return res.status(401).send({error: 'You are not authorized. Only admin is allowed'});

    try {
      if (req.body.type === 'member-kyc') {
        await loadMemberData(bankId, req.body.rows);
        res.send({success: 'Successfully loaded member data'});
      } else if (req.body.type === 'loan-account') {
        await loanAccountLoader(bankId, req.body.rows);
        res.send({success: 'Successfully loaded loan account data'});
      }else if (req.body.type === 'loan-transaction') {
        await loanTransactionsLoader(bankId, req.body.rows);
        res.send({success: 'Successfully loaded loan transactions data'});
      }else {
        res.send({error: 'Invalid type'});
      }

    } catch (err) {
      console.error('Error creating user:', err);
      res.send({error: 'Failed to Loan Data. Please check error message'});
    }
  });
};
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
      console.log(`${i+1} Member ${member.id} added to the database`);
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

    console.log(`${i+1} Account ${details.id} added to the database`);
  }
  await batch.commit();
  console.log('Account Transaction loaded successfully');
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

    console.log(`${i+1} Account ${details.accountNumber} transactions added to the database`);
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
  if(isNaN(date.getTime())){
      return ''
  }

  // Create a new JavaScript Date object using UTC milliseconds
  return new Date(milliseconds).toJSON().slice(0, 10);
}