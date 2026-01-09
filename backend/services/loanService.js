const { getFirestore } = require('firebase-admin/firestore');
const db = getFirestore();
const { parseLocalDate, formatDate, addMonths } = require('../utils/dateUtils');

class LoanService {
    /**
     * Generates an EMI schedule based on loan parameters.
     */
    generateEmiSchedule(firstEmiDateStr, totalEMI, emiAmount, interval) {
        const firstEmiDate = parseLocalDate(firstEmiDateStr);
        const schedule = [];
        const lowInterval = (interval || '').toLowerCase().trim();

        if (
            lowInterval &&
            ['day', 'week', 'fortnight', 'month'].includes(lowInterval) &&
            totalEMI > 0 &&
            !isNaN(firstEmiDate.getTime())
        ) {
            for (let i = 0; i < totalEMI; i++) {
                let dueDate;
                if (lowInterval === 'month') {
                    dueDate = addMonths(firstEmiDate, i);
                } else {
                    const stepDays =
                        lowInterval === 'week' ? 7 :
                            lowInterval === 'fortnight' ? 14 : 1;
                    dueDate = new Date(firstEmiDate);
                    dueDate.setDate(dueDate.getDate() + i * stepDays);
                }
                schedule.push({
                    sl: i + 1,
                    dueDate: formatDate(dueDate),
                    amount: parseFloat(emiAmount)
                });
            }
        }
        return schedule;
    }

    /**
     * Calculates a detailed EMI schedule including principal, interest, and balance.
     */
    calculateDetailedSchedule(loanAmount, totalEMI, emiAmount, disbursementDate, emiMode) {
        const startDate = new Date(disbursementDate);
        const principleEMI = loanAmount / totalEMI;
        const interestEMI = emiAmount - principleEMI;
        const schedule = [];
        let balance = loanAmount;

        for (let i = 1; i <= totalEMI; i++) {
            const emiDate = new Date(startDate);
            switch (emiMode.toLowerCase()) {
                case 'daily':
                    emiDate.setDate(startDate.getDate() + i - 1);
                    break;
                case 'weekly':
                    emiDate.setDate(startDate.getDate() + (i - 1) * 7);
                    break;
                case 'fortnightly':
                    emiDate.setDate(startDate.getDate() + (i - 1) * 14);
                    break;
                case 'monthly':
                    emiDate.setMonth(startDate.getMonth() + i - 1);
                    break;
                case 'quarterly':
                    emiDate.setMonth(startDate.getMonth() + (i - 1) * 3);
                    break;
                default:
                    emiDate.setDate(startDate.getDate() + i - 1);
            }

            balance -= principleEMI;
            schedule.push({
                emiNo: i,
                date: emiDate,
                principal: principleEMI,
                interest: interestEMI,
                emi: emiAmount,
                balance: Math.max(balance, 0)
            });
        }
        return schedule;
    }

    /**
     * Calculates detailed installment due information.
     */
    calculateInstallmentDue(disbursementDate, totalEMI, paidEMI, emiMode, emiAmount, partialEmiDueAmount, toDateStr) {
        const fromDate = new Date(disbursementDate);
        const toDate = toDateStr ? new Date(toDateStr) : new Date();

        if (isNaN(fromDate.getTime())) return { expected: 0, emiPending: 0, emiAmountNeedToPay: 0 };

        const diffMs = toDate - fromDate;
        const days = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

        let divisor;
        switch (emiMode.toLowerCase()) {
            case 'daily': divisor = 1; break;
            case 'weekly': divisor = 7; break;
            case 'fortnightly': divisor = 14; break;
            case 'monthly': divisor = 30; break;
            case 'quarterly': divisor = 90; break;
            default: divisor = 7;
        }

        let expected = Math.floor(days / divisor);
        const total = parseInt(totalEMI) || 0;
        const paid = parseInt(paidEMI) || 0;
        const remaining = Math.max(total - paid, 0);

        expected = Math.min(Math.max(expected, 0), total);
        const emiPending = Math.min(Math.max(expected - paid, 0), remaining);
        const emiAmountNeedToPay = (emiPending * parseFloat(emiAmount)) + (parseFloat(partialEmiDueAmount) || 0);

        return {
            expected,
            emiPending,
            emiAmountNeedToPay,
            days,
            divisor,
            remaining
        };
    }

    getInstallmentDue(disbursementDate, totalEMI, paidEMI, intervalDays = 7) {
        const result = this.calculateInstallmentDue(disbursementDate, totalEMI, paidEMI, 'custom', 0, 0);
        // Compatibility wrapper
        const diffMs = new Date() - new Date(disbursementDate);
        const diffDays = diffMs / (3600 * 24 * 1000);
        const installmentDue = Math.floor(diffDays / intervalDays) + 1 - parseInt(paidEMI);
        const remainingEMI = parseInt(totalEMI) - parseInt(paidEMI);
        const finalResult = installmentDue > remainingEMI ? remainingEMI : (installmentDue < 0 ? 0 : installmentDue);
        return isNaN(finalResult) ? 0 : finalResult;
    }

    /**
     * Determines GL codes based on account type.
     */
    /**
     * Calculates loan terms including EMI, principal/interest split, and deductions.
     * Consolidates logic from LoanOpening.jsx.
     */
    calculateLoanTerms(amount, planDetails) {
        const loanAmount = parseFloat(amount);
        if (isNaN(loanAmount) || !planDetails || !planDetails.id) {
            return null;
        }

        let totalPayment = 0;
        let term = 0;
        const emiCount = parseInt(planDetails.emiCount) || 0;
        const emiMode = (planDetails.emiMode || '').toLowerCase();
        const interestRate = parseFloat(planDetails.interestRate) || 0;
        const calculationMethod = (planDetails.calculationMethod || '').toUpperCase();

        // Calculate term in months for flat rate calculation
        if (emiMode === 'daily') {
            term = Math.ceil(emiCount / 30);
        } else if (emiMode === 'weekly') {
            term = Math.ceil((emiCount * 7) / 30);
        } else if (emiMode === 'fortnightly') {
            term = Math.ceil((emiCount * 14) / 30);
        } else if (emiMode === 'monthly') {
            term = emiCount;
        } else if (emiMode === 'quarterly') {
            term = emiCount * 3;
        }

        if (calculationMethod === 'REDUCING') {
            let rate;
            if (emiMode === 'daily') {
                rate = interestRate / (365 * 100);
            } else if (emiMode === 'weekly') {
                rate = (interestRate * 7) / (365 * 100);
            } else if (emiMode === 'fortnightly') {
                rate = (interestRate * 14) / (365 * 100);
            } else if (emiMode === 'quarterly') {
                rate = (interestRate * 3) / (12 * 100);
            } else {
                // monthly
                rate = interestRate / (12 * 100);
            }

            // Calculate EMI using reducing balance formula: P * r * (1+r)^n / ((1+r)^n - 1)
            if (rate > 0 && emiCount > 0) {
                const emi = loanAmount * rate * Math.pow(1 + rate, emiCount) / (Math.pow(1 + rate, emiCount) - 1);
                totalPayment = emi * emiCount;
            } else {
                totalPayment = loanAmount;
            }
        } else {
            // Flat rate
            totalPayment = loanAmount + (loanAmount * term * interestRate) / (100 * 12);
        }

        const emiAmount = emiCount > 0 ? Math.ceil(totalPayment / emiCount) : 0;
        const principleEMI = emiCount > 0 ? Math.round(loanAmount / emiCount) : 0;

        return {
            amount: loanAmount,
            loanTerm: term,
            emiAmount: emiAmount,
            emiCount: emiCount,
            principleEMI: principleEMI,
            interestEMI: Math.max(0, emiAmount - principleEMI),
            deductionDetails: {
                processingFee: (loanAmount * (parseFloat(planDetails.processingFee) || 0) / 100).toFixed(2),
                legalAmount: (parseFloat(planDetails.legalFee) || 0).toFixed(2),
                insuranceAmount: (loanAmount * (parseFloat(planDetails.insuranceFeeRate) || 0) / 100).toFixed(2),
                gst: (loanAmount * (parseFloat(planDetails.gstRate) || 0) / 100).toFixed(2),
            }
        };
    }

    getLoanGlConfig(accountType) {
        if (accountType === 'group-loan') {
            return {
                glCode: '23105',
                glHead: 'SHORT TERM GROUP LOAN - CURRENT',
                interestGLCode: '52105',
                interestGLHead: 'INTEREST ON SHORT TERM GROUP LOAN-CURRENT'
            };
        }
        return {
            glCode: '23315',
            glHead: 'SHORT TERM PERSONAL LOAN - CURRENT',
            interestGLCode: '52315',
            interestGLHead: 'INTEREST ON SHORT TERM PERSONAL LOAN-CURRENT'
        };
    }
}

module.exports = new LoanService();
