const { getFirestore } = require('firebase-admin/firestore');
const db = getFirestore();

class DepositService {
    /**
     * Determines GL codes based on account type for deposits.
     */
    getDepositGlConfig(accountType) {
        let glCode = '00001';
        let glHead = 'GL MIS-MATCH';

        switch (accountType) {
            case 'savings':
                glCode = '14301';
                glHead = 'SAVINGS DEPOSIT(NON MEMBERS)';
                break;
            case 'thrift-fund':
                glCode = '14306';
                glHead = 'THRIFT FUND SAVINGS ( NONMEMBER)';
                break;
            case 'cash-certificate':
                glCode = '22502';
                glHead = 'DEPOSIT CERTIFICATE(INDIVIDUAL MEMBERS)';
                break;
            case 'fixed-deposit':
                glCode = '14303';
                glHead = 'FIXED DEPOSIT(NON MEMBERS)';
                break;
            case 'recurring-deposit':
                glCode = '14302';
                glHead = 'RECURRING DEPOSIT(NON MEMBERS)';
                break;
            case 'daily-savings':
                glCode = '14205';
                glHead = 'HOME SAVINGS DEPOSIT';
                break;
        }

        return { glCode, glHead };
    }
}

module.exports = new DepositService();
