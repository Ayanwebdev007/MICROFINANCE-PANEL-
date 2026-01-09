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

        // if (product === 'Deposit Loan') {
        //     if (!isOverdue) {
        //         glCode = '23105';
        //         glHead = 'SHORT TERM (D L)  LAD LOAN - CURRENT';
        //     } else {
        //         glCode = '23106';
        //         glHead = 'SHORT TERM (D L) LAD LOAN - OVERDUE';
        //     }
        // }else if (product === 'MT Non-Agril'){
        //     if (!isOverdue){
        //         glCode = '23215';
        //         glHead = 'MEDIUM TERM (NON-AGRIL) LOAN - CURRENT'
        //     }else {
        //         glCode = '23216';
        //         glHead = 'MEDIUM TERM (NON-AGRIL) LOAN - OVERDUE';
        //     }
        // }else if (product === 'MT Agril'){
        //     if (!isOverdue){
        //         glCode = '23203';
        //         glHead = 'MEDIUM TERM (AGRIL) LOAN - CURRENT';
        //     }else {
        //         glCode = '23204';
        //         glHead = 'MEDIUM TERM (AGRIL) LOAN - OVERDUE';
        //     }
        // }else if (product === 'House Building'){
        //     if (!isOverdue){
        //         glCode = '23301';
        //         glHead = 'LONG TERM HOME LOAN - CURRENT';
        //     }else {
        //         glCode = '23302';
        //         glHead = 'LONG TERM HOME LOAN - OVERDUE';
        //     }
        // }else if (product === 'MT Staff Loan'){
        //     if (!isOverdue){
        //         glCode = '23401';
        //         glHead = 'STAFF LOAN - CURRENT';
        //     }else {
        //         glCode = '23402';
        //         glHead = 'STAFF LOAN - OVERDUE';
        //     }
        // }else if (product === 'Daily Savings Loan'){
        //     if (!isOverdue){
        //         glCode = '23501';
        //         glHead = 'DAILY SAVINGS LOAN ( CURRENT)';
        //     }else {
        //         glCode = '23502';
        //         glHead = 'DAILY SAVINGS LOAN ( OVERDUE)';
        //     }
        // }else if (product === 'Pledge Loan'){
        //     if (!isOverdue){
        //         glCode = '23133';
        //         glHead = 'SHORT TERM  PLEDGE LOAN - CURRENT';
        //     }else {
        //         glCode = '23134';
        //         glHead = 'SHORT TERM  PLEDGE LOAN - OVERDUE';
        //     }
        // }else if (product === 'KVP Loan'){
        //     if (!isOverdue){
        //         glCode = '23109 ';
        //         glHead = 'SHORT TERM NSC/KVP/LIP LOAN - CURRENT';
        //     }else {
        //         glCode = '23110';
        //         glHead = 'SHORT TERM NSC/KVP/LIP LOAN - OVERDUE';
        //     }
        // }else if (product === 'JLG Loan'){
        //     if (!isOverdue){
        //         glCode = '23217';
        //         glHead = 'JLG LOAN - CURRENT';
        //     }else {
        //         glCode = '23218';
        //         glHead = 'JLG LOAN -OVERDUE';
        //     }
        // }else if (product === 'Personal Loan'){
        //     if (!isOverdue){
        //         glCode = '23315';
        //         glHead = 'SHORT TERM PERSONAL LOAN - CURRENT';
        //     }else {
        //         glCode = '23316';
        //         glHead = 'SHORT TERM PERSONAL LOAN - OVERDUE';
        //     }
        // }else if (product === 'REGP Loan'){
        //     if (!isOverdue){
        //         glCode = '23137';
        //         glHead = 'REGP LOAN -CURRNT';
        //     }else {
        //         glCode = '23138';
        //         glHead = 'REGP LOAN -OVERDUE';
        //     }
        // }else if (product === 'BDL Loan'){
        //     if (!isOverdue){
        //         glCode = '23135';
        //         glHead = 'BUSINESS DEVELOPMENT LOAN - CURRENT';
        //     }else {
        //         glCode = '23136';
        //         glHead = 'BUSINESS DEVELOPMENT LOAN - OVERDUE';
        //     }
        // }else if (product === 'Consumption Loan'){
        //     if (!isOverdue){
        //         glCode = '23107';
        //         glHead = 'SHORT TERM CONSUMPTION (PAWNING) LOAN - CURRENT';
        //     }else {
        //         glCode = '23108';
        //         glHead = 'SHORT TERM CONSUMPTION (PAWING) LOAN - OVERDUE';
        //     }
        // }

        // Extra Product: We can change it later
        // else if (product === 'Fishery Loan'){
        //     glCode = '23111';
        //     glHead = 'SHORT TERM FISHERY LOAN - CURRENT';
        // }

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

exports.accountGlCode = accountGlCode;