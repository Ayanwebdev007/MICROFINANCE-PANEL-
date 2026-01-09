const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
require('dotenv').config();

initializeApp({
    credential: applicationDefault(),
    projectId: 'microfinance-db'
});

const db = getFirestore();

async function seedMasterData() {
    try {
        console.log('Seeding Master Data...');

        // Create the master-data/gl_code/value document
        // I am initializing it with an empty object or basic structure since the code just copies it.
        // If specific fields are needed, they would usually be accessed by property, but here it just does:
        // await t.set(bankGlRef, masterGlInfo.data());
        // So just having the document exist (even if empty) might be enough, 
        // but deeper logic might expect fields. 
        // SAFEST BET: Initialize with a generic structure or at least an empty object so .data() is not undefined.

        const glCodes = [
            { code: '14301', head: 'SAVINGS DEPOSIT(NON MEMBERS)', category: 'liability' },
            { code: '14306', head: 'THRIFT FUND SAVINGS ( NONMEMBER)', category: 'liability' },
            { code: '23315', head: 'SHORT TERM PERSONAL LOAN - CURRENT', category: 'asset' },
            { code: '23105', head: 'SHORT TERM GROUP LOAN - CURRENT', category: 'asset' }
        ];

        for (const gl of glCodes) {
            const docRef = db.collection('admin').doc('master-data').collection('gl_codes').doc(gl.code);
            await docRef.set({ ...gl, seeded_by: 'antigravity_fix' });
        }
        console.log('Master GL Data seeded successfully!');

    } catch (error) {
        console.error('SEEDING ERROR:', error);
    }
}

seedMasterData();
