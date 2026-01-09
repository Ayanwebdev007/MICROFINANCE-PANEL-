const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Configuration
const SERVICE_ACCOUNT_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS || './service_account.json';
const TEST_USER = {
    email: 'test.mpanel@mpanel.co.in',
    password: 'test@pass123',
    displayName: 'Test Admin'
};
const BANK_ID = 'microfinance-bank-01';

// Initialize Firebase
console.log('--- Startup ---');
let serviceAccount;
try {
    const resolvedPath = path.resolve(__dirname, SERVICE_ACCOUNT_PATH);
    console.log(`Searching for service account at: ${resolvedPath}`);
    if (!fs.existsSync(resolvedPath)) {
        throw new Error(`File not found at ${resolvedPath}`);
    }
    const rawData = fs.readFileSync(resolvedPath);
    serviceAccount = JSON.parse(rawData);
    console.log(`Service Account loaded for project: ${serviceAccount.project_id}`);
} catch (e) {
    console.error(`CRITICAL: Error loading service account: ${e.message}`);
    process.exit(1);
}

try {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: 'microfinance-db'
    });
    console.log('Firebase initialized successfully.');
} catch (e) {
    console.error(`CRITICAL: Firebase initialization failed: ${e.message}`);
    process.exit(1);
}

const auth = admin.auth();
const db = admin.firestore();

async function initializeProduction() {
    try {
        console.log('--- Initializing Production Environment ---');

        // 1. Create or Find User
        let user;
        try {
            user = await auth.getUserByEmail(TEST_USER.email);
            console.log(`User already exists: ${user.uid}`);
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                user = await auth.createUser({
                    email: TEST_USER.email,
                    password: TEST_USER.password,
                    displayName: TEST_USER.displayName,
                });
                console.log(`Created new user: ${user.uid}`);
            } else {
                throw error;
            }
        }

        // 2. Set Custom Claims (Required for Backend logic)
        console.log('Setting Custom Claims (bankId, role)...');
        await auth.setCustomUserClaims(user.uid, {
            bankId: BANK_ID,
            role: 'admin'
        });
        console.log('Custom claims set successfully.');

        // 3. Seed Firestore Data
        console.log('Seeding Firestore data...');
        const batch = db.batch();

        // Bank Info
        const bankInfoRef = db.collection(BANK_ID).doc('admin').collection('bank-info').doc('details');
        batch.set(bankInfoRef, {
            bankName: 'Microfinance Development Bank',
            domain: '', // Leave empty to allow any domain in dev/test
            disabled: false,
            renewDate: '2030-12-31',
            module: {
                loan: true,
                savings: true,
                accounting: true
            }
        });

        // User Profile in Firestore
        const userRef = db.collection(BANK_ID).doc('admin').collection('users').doc(user.uid);
        batch.set(userRef, {
            name: TEST_USER.displayName,
            email: TEST_USER.email,
            phone: '9999999999',
            permissions: { 'ALL': true },
            accessLevel: 'admin',
            twoFAEnabled: false
        });

        // Master Data (Required for bank operations)
        const masterGlRef = db.collection('admin').doc('master-data').collection('gl_code').doc('value');
        batch.set(masterGlRef, {
            assets: {},
            liabilities: {},
            income: {},
            expenses: {},
            initialized: true
        });

        await batch.commit();
        console.log('Firestore data seeded successfully.');

        console.log('\n--- Initialization Complete! ---');
        console.log('You can now log in to the Live URL with:');
        console.log(`Email: ${TEST_USER.email}`);
        console.log('Password: test@pass123');
        console.log('------------------------------------------');

    } catch (error) {
        console.error('INITIALIZATION FAILED:', error);
    }
}

initializeProduction();
