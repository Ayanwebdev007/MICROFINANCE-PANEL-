const admin = require('firebase-admin');

class GLService {
    get db() {
        return admin.firestore();
    }
    /**
     * Get all GL codes for a specific bank.
     */
    async getAllGLCodes(bankId) {
        const glColRef = this.db.collection(bankId).doc('admin').collection('gl_codes');
        const snapshot = await glColRef.get();
        const glCodes = [];
        snapshot.forEach(doc => {
            glCodes.push({ id: doc.id, ...doc.data() });
        });
        return glCodes;
    }

    /**
     * Update or create a GL code record.
     */
    async updateGLCode(bankId, glData) {
        const { code } = glData;
        if (!code) throw new Error('GL Code is required');

        const glDocRef = this.db.collection(bankId).doc('admin').collection('gl_codes').doc(code);
        await glDocRef.set(glData, { merge: true });
        return { success: true, code };
    }

    /**
     * Sync GL codes from master data to a specific bank.
     * This handles the new sharded structure.
     */
    async syncFromMaster(bankId) {
        const masterGlColRef = this.db.collection('admin').doc('master-data').collection('gl_codes');
        const snapshot = await masterGlColRef.get();

        const batch = this.db.batch();
        snapshot.forEach(doc => {
            const bankGlDocRef = this.db.collection(bankId).doc('admin').collection('gl_codes').doc(doc.id);
            batch.set(bankGlDocRef, doc.data());
        });

        await batch.commit();
        return { success: true, count: snapshot.size };
    }

    /**
     * Migration Helper: Convert monolithic document to sharded collection.
     */
    async migrateToSharded(bankId) {
        const oldGlRef = this.db.collection(bankId).doc('admin').collection('gl_code').doc('value');
        const doc = await oldGlRef.get();

        if (!doc.exists) return { success: false, message: 'Old GL document not found' };

        const data = doc.data();
        const glArray = data.gl || [];

        if (!Array.isArray(glArray)) return { success: false, message: 'GL data is not an array' };

        const batch = this.db.batch();
        glArray.forEach(item => {
            if (item.code) {
                const newRef = this.db.collection(bankId).doc('admin').collection('gl_codes').doc(item.code);
                batch.set(newRef, item);
            }
        });

        await batch.commit();
        return { success: true, count: glArray.length };
    }
}

module.exports = new GLService();
