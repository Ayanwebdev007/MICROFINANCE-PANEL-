const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const db = getFirestore();

/**
 * TransactionService
 * Centralizes all transaction-related operations to ensure data consistency
 * between legacy date-based storage and the new consolidated collection.
 */
class TransactionService {
    /**
     * Records a transaction in both legacy and new structures.
     * @param {string} bankId - The bank identifier.
     * @param {Object} transData - The transaction data.
     * @param {string} date - (Optional) Transaction date in YYYY-MM-DD. Defaults to today.
     * @param {Object} transaction - (Optional) Firestore transaction object.
     */
    async recordTransaction(bankId, transData, date, transaction = null) {
        const transDate = date || transData.entryDate || new Date().toISOString().slice(0, 10);
        const transId = transData.id || db.collection(bankId).doc('transaction').collection(transDate).doc().id;

        const finalData = {
            ...transData,
            id: transId,
            entryDate: transDate,
            serverTimestamp: FieldValue.serverTimestamp(),
        };

        const legacyRef = db.collection(bankId).doc('transaction').collection(transDate).doc(transId);
        const globalRef = db.collection(bankId).doc('consolidated').collection('transactions').doc(transId);

        if (transaction) {
            transaction.set(legacyRef, finalData);
            transaction.set(globalRef, finalData);
            await this._updateDailyStats(bankId, finalData, transDate, transaction);
        } else {
            const batch = db.batch();
            batch.set(legacyRef, finalData);
            batch.set(globalRef, finalData);
            await this._updateDailyStats(bankId, finalData, transDate, batch);
            await batch.commit();
        }

        return transId;
    }

    /**
     * Updates daily aggregates for faster reporting.
     * @private
     */
    async _updateDailyStats(bankId, data, date, tOrBatch) {
        const statsRef = db.collection(bankId).doc('consolidated').collection('daily_stats').doc(date);
        const amount = parseFloat(data.amount) || 0;
        const type = data.type; // 'credit' or 'debit'
        const method = data.method; // 'cash' or 'transfer'
        const glCode = data.glCode;

        const updateData = {};

        // Track Cash In Hand
        if (method === 'cash') {
            updateData.cashInHand = FieldValue.increment(type === 'credit' ? amount : -amount);
            if (type === 'credit') updateData.totalCashReceipts = FieldValue.increment(amount);
            else updateData.totalCashPayments = FieldValue.increment(amount);
        }

        // Categorize by GL (Simplified for optimization)
        // Savings GLs (example range 11000-12000)
        if (glCode.startsWith('1')) {
            if (type === 'credit') updateData.totalSavingsCredit = FieldValue.increment(amount);
            else updateData.totalSavingsDebit = FieldValue.increment(amount);
        }
        // Loan Principal GLs
        else if (glCode === '23315' || glCode === '23105') {
            if (type === 'debit') updateData.totalLoanDisbursed = FieldValue.increment(amount);
            else updateData.totalLoanPrincipalCollected = FieldValue.increment(amount);
        }
        // Interest GLs
        else if (glCode === '52315' || glCode === '52105') {
            if (type === 'credit') updateData.totalInterestCollected = FieldValue.increment(amount);
        }

        tOrBatch.set(statsRef, updateData, { merge: true });
    }

    /**
     * Records multiple transactions in a single operation.
     */
    async recordBulkTransactions(bankId, transactionsArray, transaction = null) {
        const results = [];
        for (const trans of transactionsArray) {
            const id = await this.recordTransaction(bankId, trans.data, trans.date, transaction);
            results.push(id);
        }
        return results;
    }

    /**
     * Fetches transactions for a date range using the new consolidated collection.
     */
    async getTransactionsByRange(bankId, fromDate, toDate) {
        const query = db.collection(bankId)
            .doc('consolidated')
            .collection('transactions')
            .where('entryDate', '>=', fromDate)
            .where('entryDate', '<=', toDate)
            .orderBy('entryDate', 'asc');

        const snapshot = await query.get();
        return snapshot.docs.map(doc => doc.data());
    }
}

module.exports = new TransactionService();
