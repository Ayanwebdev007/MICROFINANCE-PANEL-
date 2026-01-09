const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const db = getFirestore();
const { generateKeywords } = require('../utils/searchUtils');
const glService = require('./glService');

/**
 * Service for managing institutional entities (Banks, Branches, Societies).
 * Focused on maintainability and performance (avoiding N+1 queries).
 */
class InstitutionService {
    /**
     * Fetches details for a list of institutions efficiently.
     * Replaces N+1 query patterns with batched fetches.
     */
    async getInstitutionDetails(bankIds) {
        if (!bankIds || bankIds.length === 0) return [];

        const detailTasks = bankIds.map(bankId =>
            db.collection(bankId).doc('admin').collection('bank-info').doc('details').get()
                .then(snap => snap.exists ? { bankId, ...snap.data() } : { bankId, error: 'Not found' })
        );

        return Promise.all(detailTasks);
    }

    /**
     * Generates institutional search keywords with hierarchy awareness.
     */
    async generateInstitutionalKeywords(institutionData, parentIds = {}) {
        let parentContent = '';

        // Fetch parent names for hierarchy-aware search
        if (parentIds.HO_ID) {
            const hoSnap = await db.collection('admin').doc('organization').collection('banks').doc(parentIds.HO_ID).get();
            if (hoSnap.exists) parentContent += ` ${hoSnap.data().bankName}`;
        }
        if (parentIds.BRANCH_ID) {
            const branchSnap = await db.collection('admin').doc('organization').collection('banks').doc(parentIds.BRANCH_ID).get();
            if (branchSnap.exists) parentContent += ` ${branchSnap.data().bankName}`;
        }
        if (parentIds.mainBranchId) {
            const mainSnap = await db.collection('admin').doc('organization').collection('banks').doc(parentIds.mainBranchId).get();
            if (mainSnap.exists) parentContent += ` ${mainSnap.data().bankName}`;
        }

        const baseContent = `${institutionData.bankName} ${institutionData.displayName || ''} ${institutionData.registrationCode || ''} ${institutionData.email || ''} ${institutionData.phone || ''}`;
        return generateKeywords(`${baseContent} ${parentContent}`.trim());
    }

    /**
     * Standardized institutional update logic.
     */
    async updateInstitution(bankId, updateData, token) {
        await db.runTransaction(async (t) => {
            const searchKeywords = await this.generateInstitutionalKeywords(updateData, {
                HO_ID: updateData.HO_ID,
                BRANCH_ID: updateData.BRANCH_ID,
                mainBranchId: updateData.mainBranchId
            });

            const bankAdminRef = db.collection('admin').doc('organization').collection('banks').doc(bankId);
            const bankRef = db.collection(bankId).doc('admin').collection('bank-info').doc('details');

            const existingDetails = await t.get(bankRef);

            // Handle renew date history if applicable
            if (updateData.renewDate && existingDetails.exists && existingDetails.data().renewDate !== updateData.renewDate) {
                const historyRef = db.collection(bankId).doc('admin').collection('bank-info').doc('renew-history');
                t.set(historyRef, {
                    renewDates: FieldValue.arrayUnion({
                        date: existingDetails.data().renewDate,
                        updatedAt: new Date(),
                        updatedBy: token.email,
                    })
                }, { merge: true });
            }

            t.update(bankAdminRef, {
                bankName: updateData.bankName,
                displayName: updateData.displayName || updateData.bankName,
                updatedAt: new Date(),
                updatedBy: token.email,
                searchKeywords,
            });

            t.update(bankRef, {
                ...updateData,
                updatedAt: new Date(),
                updatedBy: token.email,
                searchKeywords,
            });
        });

        return { success: true };
    }
}

module.exports = new InstitutionService();
