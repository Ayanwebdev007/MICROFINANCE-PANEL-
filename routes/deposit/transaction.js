const { getFirestore} = require('firebase-admin/firestore');
const db = getFirestore();

module.exports = app => {
  app.post('/api/deposit/cash-transaction', async function (req, res){
    const token = req.user; // Get user from the middleware
    if (!token) return res.status(401).send({error: 'You are not authorized. Please log in.'});

    const systemDate = new Date().toISOString().slice(0, 10);

    try {
        await db.runTransaction(async (t) => {
        const {glCode, glHead} = accountGlCode(req.body.accountType, '', false);
        let transactionId;

        const piRef = db.collection(token.bankId).doc('admin').collection('transIterator').doc(systemDate);
        const piInfo = await t.get(piRef);
        if (piInfo.exists) {
          transactionId = parseInt(piInfo.data().value) + 1;
        }else {
          transactionId = generateTransactionId() + 1;
        }
        const accountRef = db.collection(token.bankId).doc('accounts').collection(req.body.accountType).doc(req.body.account);
        const accountInfo = await t.get(accountRef);

        const kycRef = db.collection(token.bankId).doc('kyc').collection('member-kyc').doc(accountInfo.data().applicants[0]);
        const kycInfo = await t.get(kycRef);

        await t.set(piRef, {value: transactionId});

        const transactionRef = db.collection(token.bankId).doc('pi').collection('deposit').doc(`${transactionId}`);
        await t.set(transactionRef, {
          transactionId: transactionId.toString(),
          account: req.body.account,
          accountType: req.body.accountType,
          transactionType: 'deposit',
          transactionDate: req.body.transDate,
          name: kycInfo.data().name,
          amount: parseFloat(req.body.amount),
          glCode,
          glHead,
          narration: req.body.narration,
          method: req.body.paymentMethod,
          type: req.body.type,
          author: token.email,
          createdAt: new Date(),
          updatedAt: new Date(),
          autoAuthorize: []
        });
        return res.send({success: 'Transaction created with ID: ' + transactionId});
      });
    } catch (e) {
      console.log('Transaction failure:', e);
      return res.send({error: 'Failed to create transaction. Try again...'});
    }
  });

  app.post('/api/transaction/bulk-renewal', async function (req, res){
    const token = req.user; // Get user from the middleware
    if (!token) return res.status(401).send({error: 'You are not authorized. Please log in.'});

    const accountType = req.body.accountType;
    if (req.body.trans && req.body.accountType){
      try {
        await db.runTransaction(async (t) => {
          const {glCode, glHead} = accountGlCode(accountType, '');
          let transactionId;

          const piRef = db.collection(token.bankId).doc('admin').collection('transIterator').doc(new Date().toISOString().slice(0, 10));
          const piInfo = await t.get(piRef);
          if (piInfo.exists) {
            transactionId = parseInt(piInfo.data().value) + 1;
          }else {
            transactionId = generateTransactionId() + 1;
          }

          await t.set(piRef, {value: transactionId});

          const transPIRef = db.collection(token.bankId).doc('pi').collection('bulk-renewal').doc(transactionId.toString());
          const paymentInstruction = {
            ...req.body,
            glCode: glCode,
            glHead: glHead,
            accountType: accountType,
            date: req.body.transDate,
            author: token.email,
          };
          await t.set(transPIRef, paymentInstruction);

          res.send({success: `Successfully create Payment Instruction. Please authorize transaction ${transactionId}`});
        });
      }catch (err){
        await db.collection('admin').doc('crash').collection('bulk-renewal').add(
          {
            ...req.body,
            author: token.email,
            bankId: token.bankId,
            err: err.toString(),
          });
        console.log(err)
        res.send({error: 'captured the error for further evaluation'});
      }
    }else {
      res.send({error: 'mandatory field missing. Fill all required details'});
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
  if (accountType === 'savings'){
    glCode = '14301';
    glHead = 'SAVINGS DEPOSIT(NON MEMBERS)';
  }else if (accountType === 'mFinance-savings'){
    glCode = '14307';
    glHead = 'M-FINANCE SAVINGS DEPOSIT';
  }else if (accountType === 'no-frill'){
    glCode = '14305';
    glHead = 'NO FRILL SAVINGS ( NON MEMBER)';
  }else if (accountType === 'thrift-fund'){
    glCode = '14306';
    glHead = 'THRIFT FUND SAVINGS ( NONMEMBER)';
  }else if (accountType === 'cash-certificate'){
    glCode = '22502';
    glHead = 'DEPOSIT CERTIFICATE(INDIVIDUAL MEMBERS)';
  }else if (accountType === 'fixed-deposit'){
    glCode = '14303';
    glHead = 'FIXED DEPOSIT(NON MEMBERS)';
  }else if (accountType === 'jlg'){
    glCode = '14401';
    glHead = 'SAVINGS DEPOSIT (JLG GROUPS)';
  }else if (accountType === 'mis-deposit'){
    glCode = '14399';
    glHead = 'MIS DEPOSIT(NON MEMBERS)';
  }else if (accountType === 'recurring-deposit'){
    glCode = '14302';
    glHead = 'RECURRING DEPOSIT(NON MEMBERS)';
  }else if (accountType === 'share-account'){
    glCode = '11200';
    glHead = 'A CLASS SHARE';
  }else if (accountType === 'shg-deposit'){
    glCode = '14201';
    glHead = 'SAVINGS DEPOSIT(SELF HELP GROUPS)';
  }else if (accountType === 'daily-savings'){
    glCode = '14205';
    glHead = 'HOME SAVINGS DEPOSIT';
  }else if (accountType === 'farm-loan'){
    if (!isOverdue){
      glCode = '23101';
      glHead = 'SHORT TERM (KCC) LOAN - CURRENT';
    }else {
      glCode = '23102';
      glHead = 'SHORT TERM (KCC) LOAN - OVERDUE';
    }
  }else if (accountType === 'non-farm-loan'){
    if (!isOverdue){
      glCode = '23105';
      glHead = 'SHORT TERM (D L)  LAD LOAN - CURRENT';
    }else {
      glCode = '23106';
      glHead = 'SHORT TERM (D L) LAD LOAN - OVERDUE';
    }
  }else if (accountType === 'shg-loan'){
    if (product === 'Short Term'){
      if (!isOverdue){
        glCode = '23113';
        glHead = 'SHORT TERM SELF-HELP GROUP LOAN - CURRENT';
      }else {
        glCode = '23114';
        glHead = 'SHORT TERM SELF-HELP GROUP LOAN - OVERDUE';
      }
    }else if (product === 'Medium Term'){
      if (!isOverdue){
        glCode = '23213';
        glHead = 'MEDIUM TERM SELF-HELP GROUP LOAN - CURRENT';
      }else {
        glCode = '23214';
        glHead = 'MEDIUM TERM SELF-HELP GROUP LOAN - OVERDUE';
      }
    }
  }else if (accountType === 'cash-credit-loan'){
    if (!isOverdue){
      glCode = '23305';
      glHead = 'CASH CREDIT LOAN - CURRENT';
    }else {
      glCode = '23306';
      glHead = 'CASH CREDIT LOAN - OVERDUE';
    }
  }

  return {glCode, glHead};
}