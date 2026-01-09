module.exports = (accountType, product, isOverdue) => {
    let interestGlCode = '00001';
    let interestGlHead = 'GL MIS-MATCH';
    if (accountType === 'savings'){
        interestGlCode = '62101';
        interestGlHead = 'INTEREST ON SAVINGS DEPOSIT (INDIVIDUAL MEMBERS)';
    }else if (accountType === 'no-frill'){
        interestGlCode = '62107';
        interestGlHead = 'INTEREST ON NO-FRILL (INDIVIDUAL MEMBERS)';
    }else if (accountType === 'thrift-fund'){
        interestGlCode = '62108';
        interestGlHead = 'INTEREST ON THRIFT-FUND  DEPOSIT';
    }else if (accountType === 'cash-certificate'){
        interestGlCode = '62109';
        interestGlHead = 'INTEREST ON CASH CERTIFICATE (INDIVIDUAL MEMBERS)';
    }else if (accountType === 'fixed-deposit'){
        interestGlCode = '62103';
        interestGlHead = 'INTEREST ON FIXED DEPOSIT (INDIVIDUAL MEMBERS)';
    }else if (accountType === 'jlg'){
        interestGlCode = '62401';
        interestGlHead = 'INTEREST ON SAVINGS DEPOSIT(JLG GROUP)';
    }else if (accountType === 'mis-deposit'){
        interestGlCode = '62399';
        interestGlHead = 'INTEREST ON MIS DEPOSITS (NON-MEMBERS)';
    }else if (accountType === 'mFinance-savings'){
        interestGlCode = '62102';
        interestGlHead = 'INTEREST ON RECURRING DEPOSIT (INDIVIDUAL MEMBERS)';
    }else if (accountType === 'share-account'){
        interestGlCode = '51110';
        interestGlHead = 'DIVIDEND TO MEMBER';
    }else if (accountType === 'shg-deposit'){
        interestGlCode = '62201';
        interestGlHead = 'INTEREST ON SAVINGS DEPOSIT (SELF-HELP GROUPS)';
    }else if (accountType === 'daily-savings'){
        interestGlCode = '62105';
        interestGlHead = 'INTEREST ON HOME SAVINGS DEPOSIT (INDIVIDUAL MEMBERS)';
    }else if (accountType === 'farm-loan'){
        if (isOverdue){
            interestGlCode = '52102';
            interestGlHead = 'INTEREST ON SHORT TERM CROP / KCC LOAN -OVERDUE';
        }else {
            interestGlCode = '52101';
            interestGlHead = 'INTEREST ON SHORT TERM CROP / KCC LOAN -CURRENT';
        }
    }else if (accountType === 'non-farm-loan'){
        if (isOverdue){
            interestGlCode = '52104';
            interestGlHead = 'INTEREST ON SHORT TERM LAD LOAN - OVERDUE';
        }else {
            interestGlCode = '52103';
            interestGlHead = 'INTEREST ON SHORT TERM  LAD LOAN - CURRENT';
        }

        // if (product === 'Deposit Loan'){
        //     if (isOverdue){
        //         interestGlCode = '52104';
        //         interestGlHead = 'INTEREST ON SHORT TERM LAD LOAN - OVERDUE';
        //     }else {
        //         interestGlCode = '52103';
        //         interestGlHead = 'INTEREST ON SHORT TERM  LAD LOAN - CURRENT';
        //     }
        // }else if (product === 'MT Non-Agril'){
        //     if (isOverdue){
        //         interestGlCode = '52216';
        //         interestGlHead = 'INTEREST ON MEDIUM TERM(NON-AGRIL) LOAN - OVERDUE';
        //     }else {
        //         interestGlCode = '52215';
        //         interestGlHead = 'INTEREST ON MEDIUM TERM(NON-AGRIL) LOAN - CURRENT';
        //     }
        // }else if (product === 'MT Agril'){
        //     if (isOverdue){
        //         interestGlCode = '52204';
        //         interestGlHead = 'INTEREST ON MEDIUM TERM (AGRIL) LOAN - OVERDUE';
        //     }else {
        //         interestGlCode = '52203';
        //         interestGlHead = 'INTEREST ON MEDIUM TERM (AGRIL) LOAN - CURRENT';
        //     }
        // }else if (product === 'House Building'){
        //     if (isOverdue){
        //         interestGlCode = '52302';
        //         interestGlHead = 'INTEREST ON LONG TERM HOME LOAN - OVERDUE';
        //     }else {
        //         interestGlCode = '52301';
        //         interestGlHead = 'INTEREST ON LONG TERM HOME LOAN - CURRENT';
        //     }
        // }else if (product === 'MT Staff Loan'){
        //     if (isOverdue){
        //         interestGlCode = '52402';
        //         interestGlHead = 'INTEREST ON STAFF LOAN - OVERDUE';
        //     }else {
        //         interestGlCode = '52401';
        //         interestGlHead = 'INTEREST ON STAFF LOAN - CURRENT';
        //     }
        // }else if (product === 'Daily Savings Loan'){
        //     if (isOverdue){
        //         interestGlCode = '52220';
        //         interestGlHead = 'INTEREST ON DAILY SAVINGS LOAN-OVERDUE';
        //     }else {
        //         interestGlCode = '52219';
        //         interestGlHead = 'INTEREST ON DAILY SAVINGS LOAN-CURRENT';
        //     }
        // }else if (product === 'Pledge Loan'){
        //     if (isOverdue){
        //         interestGlCode = '52134';
        //         interestGlHead = 'INTEREST ON SHORT TERM PLEDGE LOAN - OVERDUE';
        //     }else {
        //         interestGlCode = '52133';
        //         interestGlHead = 'INTEREST ON SHORT TERM PLEDGE LOAN - CURRENT';
        //     }
        // }else if (product === 'KVP Loan'){
        //     if (isOverdue){
        //         interestGlCode = '52108';
        //         interestGlHead = 'INTEREST ON SHORT TERM NSC/KVP/LIP LOAN - OVERDUE';
        //     }else {
        //         interestGlCode = '52107';
        //         interestGlCode = 'INTEREST ON SHORT TERM NSC/KVP/LIP LOAN - CURRENT';
        //     }
        // }else if (product === 'JLG Loan'){
        //     if (isOverdue){
        //         interestGlCode = '52218';
        //         interestGlHead = 'INTEREST ON JLG LOAN-OVERDUE';
        //     }else {
        //         interestGlCode = '52217';
        //         interestGlCode = 'INTEREST ON JLG LOAN-CURRENT';
        //     }
        // }else if (product === 'Personal Loan'){
        //     if (isOverdue){
        //         interestGlCode = '52316';
        //         interestGlHead = 'INTEREST ON SHORT TERM PERSONAL LOAN-OVERDUE';
        //     }else {
        //         interestGlCode = '52315';
        //         interestGlHead = 'INTEREST ON SHORT TERM PERSONAL LOAN-CURRENT';
        //     }
        // }else if (product === 'REGP Loan'){
        //     if (isOverdue){
        //         interestGlCode = '52138';
        //         interestGlHead = 'INTEREST ON REGP LOAN - OVERDUE';
        //     }else {
        //         interestGlCode = '52137';
        //         interestGlHead = 'INTEREST ON REGP LOAN - CURRENTT';
        //     }
        // }else if (product === 'BDL Loan'){
        //     if (isOverdue){
        //         interestGlCode = '52136';
        //         interestGlHead = 'INTEREST ON BUSINESS DEVELOPMENT LOAN - OVERDUE';
        //     }else {
        //         interestGlCode = '52135';
        //         interestGlHead = 'INTEREST ON BUSINESS DEVELOPMENT LOAN - CURRENTT';
        //     }
        // }else if (product === 'Consumption Loan'){
        //     if (isOverdue){
        //         interestGlCode = '52106';
        //         interestGlHead = 'INTEREST ON SHORT TERM CONSUMPTION (PAWNING) LOAN - OVERDUE';
        //     }else {
        //         interestGlCode = '52105';
        //         interestGlHead = 'INTEREST ON SHORT TERM CONSUMPTION (PAWNING) LOAN - CURRENT';
        //     }
        // }

        // Extra Product
        // else if (product === 'Fishery Loan'){
        //     glCode = '23111';
        //     glHead = 'SHORT TERM FISHERY LOAN - CURRENT';
        // }

    }else if (accountType === 'shg-loan'){
        if (product === 'Short Term'){
            if (isOverdue){
                interestGlCode = '52112';
                interestGlHead = 'INTEREST ON SHORT TERM SELF-HELP GROUP LOAN - OVERDUE';
            }else {
                interestGlCode = '52111';
                interestGlHead = 'INTEREST ON SHORT TERM SELF-HELP GROUP LOAN - CURRENT';
            }
        }else if (product === 'Medium Term'){
            if (isOverdue){
                interestGlCode = '52213';
                interestGlHead = 'INTEREST ON MEDIUM TERM SELF-HELP GROUP LOAN - OVERDUE';
            }else {
                interestGlCode = '52214';
                interestGlHead = 'INTEREST ON MEDIUM TERM SELF-HELP GROUP LOAN - CURRENT';
            }
        }
    }

    return {interestGlCode, interestGlHead};
}
