const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
require('dotenv').config();

// Print env var to debug path
console.log('GOOGLE_APPLICATION_CREDENTIALS:', process.env.GOOGLE_APPLICATION_CREDENTIALS);

try {
    initializeApp({
        credential: applicationDefault(),
        projectId: 'microfinance-db'
    });
    console.log('Firebase App Initialized.');
} catch (e) {
    console.error('Initialization Failed:', e);
}

const db = getFirestore();

async function testConnection() {
    try {
        console.log('Attempting to write test document...');
        const testDoc = db.collection('test_connection').doc('ping');
        await testDoc.set({ timestamp: new Date(), status: 'connected' });
        console.log('Write Success!');

        console.log('Attempting to read test document...');
        const doc = await testDoc.get();
        console.log('Read Success! Data:', doc.data());

        // Clean up
        await testDoc.delete();
        console.log('Cleanup Success!');

    } catch (error) {
        console.error('CONNECTION ERROR:', error);
        console.log('DETAILS:');
        console.log('Code:', error.code);
        console.log('Message:', error.message);
    }
}

testConnection();
