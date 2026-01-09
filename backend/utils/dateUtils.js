/**
 * Helper Functions for Date Manipulation
 */

const parseLocalDate = (dateStr) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
};

const formatDate = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const addMonths = (date, months) => {
    const result = new Date(date);
    const day = result.getDate();
    result.setMonth(result.getMonth() + months);
    if (result.getDate() !== day) {
        result.setDate(0); // Adjust to last day of previous month
    }
    return result;
};

module.exports = {
    parseLocalDate,
    formatDate,
    addMonths
};
