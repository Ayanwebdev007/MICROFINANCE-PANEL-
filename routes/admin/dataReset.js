const { getFirestore} = require('firebase-admin/firestore');
const {getAuth} = require("firebase-admin/auth");
const db = getFirestore();

module.exports = app => {
    app.post('/api/admin/reject-reset-request', async (req, res) => {
        const token = req.user;

        // Auth checks
        if (!token) return res.status(401).send({ error: 'You are not authorized. Please log in.' });
        if (token.role !== 'root') return res.status(401).send({ error: 'You are not authorized. Only admin is allowed' });

        try {
            const resetRequestRef = db.collection('admin').doc('organization').collection('reset-request').doc(req.body.requestId);
            await resetRequestRef.delete();
            res.send({success: 'Successfully rejected reset request'});
        } catch (err) {
            console.error('Error creating user:', err);
            res.send({ error: 'Failed to Loan Data. Error: ' + err.message });
        }
    });

    app.post('/api/admin/approve-reset-request', async (req, res) => {
        const token = req.user;

        // Auth checks
        if (!token) return res.status(401).send({ error: 'You are not authorized. Please log in.' });
        if (token.role !== 'root') return res.status(401).send({ error: 'You are not authorized. Only admin is allowed to perform this action'});

        try {
            const resetRequestRef = db.collection('admin').doc('organization').collection('reset-request').doc(req.body.requestId);
            const resetRequestSnap = await resetRequestRef.get();

            const bankId = resetRequestSnap.data().bankId;

            // Delete all accounts
            const accountTypeCol = await db.collection(bankId).doc('accounts').listCollections();
            const accountTypes = accountTypeCol.map(coll => coll.id);
            for (let i = 0; i < accountTypes.length; i++) {
                const applicableAccounts = [];
                const accountColRef = db.collection(bankId).doc('accounts').collection(accountTypes[i]);
                const accountColSnap = await accountColRef.get();
                accountColSnap.forEach(doc => {
                    applicableAccounts.push(doc.id);
                });

                // Delete all transactions for each account and delete the account
                for (let j = 0; j < applicableAccounts.length; j++) {
                    const accountTransactionsRef = db.collection(bankId).doc('accounts').collection(accountTypes[i]).doc(applicableAccounts[j]).collection('transaction');
                    const accountTransactionsSnap = await accountTransactionsRef.get();
                    accountTransactionsSnap.forEach(doc => {
                        doc.ref.delete();
                    });
                    const accountRef = db.collection(bankId).doc('accounts').collection(accountTypes[i]).doc(applicableAccounts[j]);
                    await accountRef.delete();
                }
            }

            // Delete all App Transactions
            const appTransactionRef = await db.collection(bankId).doc('app-transactions').listCollections();
            const appTransactionTypes = appTransactionRef.map(coll => coll.id);
            for (let i = 0; i < appTransactionTypes.length; i++) {
                const appTransactionColRef = db.collection(bankId).doc('app-transactions').collection(appTransactionTypes[i]);
                const appTransactionColSnap = await appTransactionColRef.get();
                appTransactionColSnap.forEach(doc => {
                    doc.ref.delete();
                });
            }

            // Delete all Approval Queue
            const approvalQueueRef = await db.collection(bankId).doc('approval-queue').listCollections();
            const approvalQueueTypes = approvalQueueRef.map(coll => coll.id);
            for (let i = 0; i < approvalQueueTypes.length; i++) {
                const approvalQueueColRef = db.collection(bankId).doc('approval-queue').collection(approvalQueueTypes[i]);
                const approvalQueueColSnap = await approvalQueueColRef.get();
                approvalQueueColSnap.forEach(doc => {
                    doc.ref.delete();
                });
            }

            // Delete Balance Document
            const balanceRef = db.collection(bankId).doc('balance');
            await balanceRef.delete();

            // Delete all members
            const memberRef = db.collection(bankId).doc('kyc').collection('member-kyc');
            const memberSnap = await memberRef.get();
            memberSnap.forEach(doc => {
                doc.ref.delete();
            });

            // Delete all Group
            const groupRef = db.collection(bankId).doc('kyc').collection('group');
            const groupSnap = await groupRef.get();
            groupSnap.forEach(doc => {
                doc.ref.delete();
            });

            // Create a default group
            const defaultGroupRef = db.collection(bankId).doc('kyc').collection('group').doc('100000');
            await defaultGroupRef.set({
                name: 'NOT ASSIGNED',
            });

            // Delete All Employees
            const employeeRef = db.collection(bankId).doc('kyc').collection('employee');
            const employeeSnap = await employeeRef.get();
            employeeSnap.forEach(doc => {
                doc.ref.delete();
            });

            // Delete PI
            const piRef = await db.collection(bankId).doc('pi').listCollections();
            const piTypes = piRef.map(coll => coll.id);
            for (let i = 0; i < piTypes.length; i++) {
                const piColRef = db.collection(bankId).doc('pi').collection(piTypes[i]);
                const piColSnap = await piColRef.get();
                piColSnap.forEach(doc => {
                    doc.ref.delete();
                });
            }

            // Delete Rejected-PI Document
            const rejectedPiRef = await db.collection(bankId).doc('rejected-pi').listCollections();
            const rejectedPiTypes = rejectedPiRef.map(coll => coll.id);
            for (let i = 0; i < rejectedPiTypes.length; i++) {
                const rejectedPiColRef = db.collection(bankId).doc('rejected-pi').collection(rejectedPiTypes[i]);
                const rejectedPiColSnap = await rejectedPiColRef.get();
                rejectedPiColSnap.forEach(doc => {
                    doc.ref.delete();
                });
            }

            // Delete Daybook Scheduler Documents
            const daybookSchedulerRef = await db.collection(bankId).doc('scheduler').collection('daily-book');
            const daybookSchedulerSnap = await daybookSchedulerRef.get();
            daybookSchedulerSnap.forEach(doc => {
                doc.ref.delete();
            });

            // Delete All Transactions
            const transactionRef = await db.collection(bankId).doc('transaction').listCollections();
            const transactionTypes = transactionRef.map(coll => coll.id);
            for (let i = 0; i < transactionTypes.length; i++) {
                const transactionColRef = db.collection(bankId).doc('transaction').collection(transactionTypes[i]);
                const transactionColSnap = await transactionColRef.get();
                transactionColSnap.forEach(doc => {
                    doc.ref.delete();
                });
            }

            // Delete Created Plan
            const planRef = await db.collection(bankId).doc('admin').collection('service-plan');
            const planSnap = await planRef.get();
            planSnap.forEach(doc => {
                doc.ref.delete();
            });

            // Delete Mobile Users
            const mobileUsersRef = await db.collection(bankId).doc('admin').collection('mobile-users');
            const mobileUsersSnap = await mobileUsersRef.get();
            mobileUsersSnap.forEach(doc => {
                doc.ref.delete();
            });

            // Delete Employee Data
            const employeeDataRef = await db.collection(bankId).doc('admin').collection('employee');
            const employeeDataSnap = await employeeDataRef.get();
            employeeDataSnap.forEach(doc => {
                doc.ref.delete();
            });

            // Delete Non-Admin Users
            const nonAdminUsersRef = await db.collection(bankId).doc('admin').collection('users');
            const nonAdminUsersSnap = await nonAdminUsersRef.get();
            nonAdminUsersSnap.forEach(doc => {
                if (doc.data().role !== 'admin'){
                    doc.ref.delete();
                    getAuth().deleteUser(doc.id);
                }
            });

            // Delete the Reset Request
            await resetRequestRef.delete();

            res.send({success: `Successfully Reset all the data for selected Bank`});
        } catch (err) {
            console.error('Error creating user:', err);
            res.send({ error: 'Failed to Reset Data. Error: ' + err.message });
        }
    });
}