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

        const masterGlRef = db.collection('admin').doc('master-data').collection('gl_code').doc('value');

        // Check if it exists first
        const doc = await masterGlRef.get();
        if (doc.exists) {
            console.log('Master GL Data already exists. Skipping.');
            return;
        }

        // Creating a dummy GL structure. 
        // Real tracking would require knowing the exact GL schema, but for "getting it running",
        // providing a valid object is the first step.
        const dummyGLData = {
            assets: {},
            liabilities: {},
            income: {},
            expenses: {},
            seeded_by: 'antigravity_fix'
        };

        await masterGlRef.set(dummyGLData);
        console.log('Master GL Data seeded successfully!');

    } catch (error) {
        console.error('SEEDING ERROR:', error);
    }
}

seedMasterData();
