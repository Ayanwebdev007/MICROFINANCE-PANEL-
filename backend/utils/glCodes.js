const GL_CODES = {
  'savings': { code: '14301', head: 'SAVINGS DEPOSIT(NON MEMBERS)' },
  'mFinance-savings': { code: '14307', head: 'M-FINANCE SAVINGS DEPOSIT' },
  'no-frill': { code: '14305', head: 'NO FRILL SAVINGS ( NON MEMBER)' },
  'thrift-fund': { code: '14306', head: 'THRIFT FUND SAVINGS ( NONMEMBER)' },
  'cash-certificate': { code: '22502', head: 'DEPOSIT CERTIFICATE(INDIVIDUAL MEMBERS)' },
  'fixed-deposit': { code: '14303', head: 'FIXED DEPOSIT(NON MEMBERS)' },
  'jlg': { code: '14401', head: 'SAVINGS DEPOSIT (JLG GROUPS)' },
  'mis-deposit': { code: '14399', head: 'MIS DEPOSIT(NON MEMBERS)' },
  'recurring-deposit': { code: '14302', head: 'RECURRING DEPOSIT(NON MEMBERS)' },
  'share-account': { code: '11200', head: 'A CLASS SHARE' },
  'shg-deposit': { code: '14201', head: 'SAVINGS DEPOSIT(SELF HELP GROUPS)' },
  'daily-savings': { code: '14205', head: 'HOME SAVINGS DEPOSIT' }
};

const LOAN_GL_CODES = {
  'farm-loan': {
    current: { code: '23101', head: 'SHORT TERM (KCC) LOAN - CURRENT' },
    overdue: { code: '23102', head: 'SHORT TERM (KCC) LOAN - OVERDUE' }
  },
  'non-farm-loan': {
    current: { code: '23105', head: 'SHORT TERM (D L)  LAD LOAN - CURRENT' },
    overdue: { code: '23106', head: 'SHORT TERM (D L) LAD LOAN - OVERDUE' }
  },
  'shg-loan': {
    'Short Term': {
      current: { code: '23113', head: 'SHORT TERM SELF-HELP GROUP LOAN - CURRENT' },
      overdue: { code: '23114', head: 'SHORT TERM SELF-HELP GROUP LOAN - OVERDUE' }
    },
    'Medium Term': {
      current: { code: '23213', head: 'MEDIUM TERM SELF-HELP GROUP LOAN - CURRENT' },
      overdue: { code: '23214', head: 'MEDIUM TERM SELF-HELP GROUP LOAN - OVERDUE' }
    }
  },
  'cash-credit-loan': {
    current: { code: '23305', head: 'CASH CREDIT LOAN - CURRENT' },
    overdue: { code: '23306', head: 'CASH CREDIT LOAN - OVERDUE' }
  }
};

const getAccountGlCode = (accountType, product = '', isOverdue = false) => {
  const defaultGl = { glCode: '00001', glHead: 'GL MIS-MATCH' };

  if (GL_CODES[accountType]) {
    return {
      glCode: GL_CODES[accountType].code,
      glHead: GL_CODES[accountType].head
    };
  }

  if (LOAN_GL_CODES[accountType]) {
    const loanType = LOAN_GL_CODES[accountType];
    const status = isOverdue ? 'overdue' : 'current';

    if (accountType === 'shg-loan' && product) {
      return loanType[product]?.[status] || defaultGl;
    }

    return loanType[status] || defaultGl;
  }

  return defaultGl;
};

module.exports = { getAccountGlCode };