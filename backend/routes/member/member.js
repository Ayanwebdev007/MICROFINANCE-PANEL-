const { getFirestore } = require('firebase-admin/firestore');
const db = getFirestore();
const { generateKeywords } = require('../../utils/searchUtils');

module.exports = app => {
    app.post('/api/member/add-new-member', async function (req, res) {
        const token = req.user; // Get user from the middleware
        if (!token) return res.status(401).send({ error: 'You are not authorized. Please log in.' });
        let errorSent = false;

        const bankId = req.body.bankId || token.bankId;

        // Validate if same Aadhar or PAN Card Existing Member
        if (req.body.aadhar) {
            const aadharRef = db.collection(bankId).doc('kyc').collection('member-kyc').where('aadhar', '==', req.body.aadhar);
            const getAadharMatchingMembers = await aadharRef.get();
            if (getAadharMatchingMembers.size > 0) {
                return res.send({ error: 'Aadhar Card already exists for another Member. Please use another Aadhar Card' });
            }
        }
        if (req.body.pan) {
            const panRef = db.collection(bankId).doc('kyc').collection('member-kyc').where('pan', '==', req.body.pan);
            const getPanMatchingMembers = await panRef.get();
            if (getPanMatchingMembers.size > 0) {
                return res.send({ error: 'PAN Card already exists for another Member. Please use another PAN Card' });
            }
        }

        if (req.body.phone) {
            const panRef = db.collection(bankId).doc('kyc').collection('member-kyc').where('phone', '==', req.body.phone);
            const getPanMatchingMembers = await panRef.get();
            if (getPanMatchingMembers.size > 0) {
                return res.send({ error: 'Phone Number already exists for another Member. Please use another Phone Number' });
            }
        }

        try {
            await db.runTransaction(async (t) => {
                // Create Member Details
                const iteratorRef = db.collection(bankId).doc('admin').collection('iterator').doc('kyc');
                const iterator = await t.get(iteratorRef);

                if (isNaN(parseInt(iterator.data().value))) {
                    return res.send({ error: 'Invalid iterator value. Please contact support.' });
                }

                const kycId = `${iterator.data().prefix || ''}${iterator.data().value}`;

                await t.update(iteratorRef, {
                    value: (parseInt(iterator.data().value) + 1).toString().padStart(iterator.data().value.length, '0'),
                    isUsed: true
                });

                const kycRef = db.collection(bankId).doc('kyc').collection('member-kyc').doc(kycId);
                const searchKeywords = generateKeywords(`${kycId} ${req.body.name} ${req.body.phone} ${req.body.aadhar} ${req.body.pan}`);

                await t.set(kycRef, {
                    ...req.body,
                    associatedEmployee: req.body.userId || token.uid,
                    selectedUserEmail: req.body.selectedUserEmail || '',
                    selectedUserId: req.body.userId || '',
                    author: token.email,
                    createdAt: new Date(),
                    searchKeywords,
                });
                res.send({ success: `Customer KYC created successfully with Id: ${kycId}` });
            });
        } catch (e) {
            console.log(e)
            if (!errorSent) {
                res.send({ error: 'Failed to create customer KYC' });
            }
        }
    });

    app.post('/api/member/update-member', async function (req, res) {
        const token = req.user; // Get user from the middleware
        if (!token) return res.status(401).send({ error: 'You are not authorized. Please log in.' });

        // Ensure member ID is provided in the request body for the update
        if (!req.body.id) {
            return res.status(400).send({ error: 'Missing member ID for update.' });
        }

        const bankId = req.body.bankId || token.bankId;
        const memberIdToUpdate = req.body.id;
        const fieldsToValidate = ['phone', 'aadhar', 'pan', 'voter']; // Fields that must be unique

        try {
            await db.runTransaction(async (t) => {
                const kycRef = db.collection(bankId).doc('kyc').collection('member-kyc').doc(memberIdToUpdate);
                const docSnap = await t.get(kycRef);

                if (!docSnap.exists) {
                    throw new Error('MemberNotFound');
                }
                const memberData = docSnap.data();

                const changedFields = [];

                // Identify which fields are being updated and require unique validation check
                for (const field of fieldsToValidate) {
                    const newValue = req.body[field];
                    const existingValue = memberData[field];

                    // Check if the value is provided in the request body AND is different from the existing value
                    if (newValue &&
                        String(newValue).trim().toLowerCase() !== String(existingValue || '').trim().toLowerCase()) {

                        changedFields.push({
                            field,
                            newValue: String(newValue).trim()
                        });
                    }
                }

                // Validate changed unique fields against other members
                if (changedFields.length > 0) {
                    for (const { field, newValue } of changedFields) {
                        const queryRef = db.collection(bankId).doc('kyc').collection('member-kyc')
                            .where(field, '==', newValue)
                            .limit(2);

                        const duplicateSnapshot = await queryRef.get();

                        // Check if a document is returned that is NOT the current member being updated
                        const foundDuplicate = duplicateSnapshot.docs.some(doc => doc.id !== memberIdToUpdate);

                        if (foundDuplicate) {
                            throw new Error(`DuplicateError: ${field.charAt(0).toUpperCase() + field.slice(1)} already exists for another Member. Please use another ${field.charAt(0).toUpperCase() + field.slice(1)}.`);
                        }
                    }
                }

                const searchKeywords = generateKeywords(`${memberIdToUpdate} ${req.body.name || memberData.name} ${req.body.phone || memberData.phone} ${req.body.aadhar || memberData.aadhar} ${req.body.pan || memberData.pan}`);

                await t.update(kycRef, {
                    ...req.body,
                    associatedEmployee: memberData.associatedEmployee || req.body.userId || token.uid,
                    selectedUserEmail: req.body.selectedUserEmail || '',
                    selectedUserId: req.body.userId || '',
                    updatedBy: token.email,
                    updatedAt: new Date(),
                    searchKeywords,
                });
            });

            res.send({
                success: "Customer KYC updated successfully",
            });

        } catch (e) {
            if (e.message.startsWith('DuplicateError:')) {
                const validationError = e.message.substring('DuplicateError:'.length).trim();
                return res.status(409).send({ error: validationError });
            }
            if (e.message === 'MemberNotFound') {
                return res.status(404).send({ error: 'Member not found.' });
            }

            return res.status(500).send({ error: 'Failed to update customer KYC' });
        }
    });

    app.post('/api/member/delete-member', async function (req, res) {
        const token = req.user; // Get user from the middleware
        if (!token) return res.status(401).send({ error: 'You are not authorized. Please log in.' });

        const bankId = req.body.bankId || token.bankId;
        try {
            await db.runTransaction(async (t) => {
                const kycRef = db.collection(bankId).doc('kyc').collection('member-kyc').doc(req.body.id);

                // Check if the Member is associated with any Account
                const accountTypesSnap = await db.collection(bankId).doc('accounts').listCollections();
                const accountTypes = accountTypesSnap.map(coll => coll.id);

                for (const accountType of accountTypes) {
                    const accountRef = db.collection(bankId).doc('accounts').collection(accountType).where('applicants', 'array-contains', req.body.id);
                    const accountDocs = await accountRef.get();
                    if (accountDocs.size > 0) {
                        accountDocs.forEach(doc => {
                            throw new Error(`Member is associated with account ${doc.id} of type ${accountType}. Please delete the account first.`);
                        });
                    }
                }

                await t.delete(kycRef);
            });
            res.send({
                success: "Successfully deleted member with KYC Id: " + req.body.id
            });


        } catch (e) {
            res.send({ error: 'Failed to Delete. Error: ' + e.message });
        }
    });

    app.post('/api/member/view-members', async function (req, res) {
        const token = req.user; // Get user from the middleware

        if (!token) return res.status(401).send({ error: 'You are not authorized. Please log in.' });

        try {
            const members = [];
            const kycData = await db.collection(token.bankId).doc('kyc').collection('member-kyc').where('date', '>=', req.body.startDate).where('date', '<=', req.body.endDate).get();
            kycData.forEach((doc) => {
                members.push({
                    id: String(doc.id),
                    name: String(doc.data().name),
                    guardian: String(doc.data().guardian),
                    joiningDate: String(doc.data().date),
                    address: String(doc.data().address),
                    phone: String(doc.data().phone),
                    aadhar: String(doc.data().aadhar),
                    pan: String(doc.data().pan),
                });
            });
            if (members.length === 0) return res.send({ error: 'No member found with selected date range' });
            return res.send({ success: 'Successfully fetched member details', data: members });
        } catch (error) {
            console.error('Error fetching members:', error);
            res.send({ error: 'Failed to fetch member details. Try again...' });

        }
    });

    app.post('/api/member/search-members', async function (req, res) {
        const token = req.user; // Get user from the middleware
        if (!token) return res.status(401).send({ error: 'You are not authorized. Please log in.' });

        try {
            const bankId = req.body.bankId || token.bankId;
            const members = [];
            const searchValue = req.body.value.toLowerCase().trim();

            if (!searchValue) return res.send({ error: 'Please enter a search value' });

            // Use array-contains for tokenized search
            // Note: Firestore array-contains only matches one element. 
            // For multi-token search we usually need multiple where clauses (limited to 10 tokens)
            // or we use the first token and filter the rest client-side for better UX.
            const tokens = searchValue.split(/[\s\-_,.]+/).filter(t => t.length > 0);

            let query = db.collection(bankId).doc('kyc').collection('member-kyc');

            // Start with the first token for primary filtering
            query = query.where('searchKeywords', 'array-contains', tokens[0]);

            const kycData = await query.limit(50).get(); // Limit results for performance

            kycData.forEach((doc) => {
                const data = doc.data();
                const combinedText = `${doc.id} ${data.name} ${data.phone} ${data.aadhar} ${data.pan}`.toLowerCase();

                // Client-side refinement for multi-token matching
                const matchesAll = tokens.every(token => combinedText.includes(token));

                if (matchesAll) {
                    members.push({
                        id: doc.id,
                        ...data,
                        name: data.name,
                        guardian: data.guardian,
                        joiningDate: data.date,
                        address: data.address,
                        phone: data.phone,
                        aadhar: data.aadhar,
                        pan: data.pan,
                        label: `${doc.id} - ${data.name}`,
                        active: data.active !== false,
                    });
                }
            });

            if (members.length === 0) return res.send({ error: 'No member found with parameters: ' + req.body.value });
            return res.send({ success: 'Successfully fetched member details', data: members });
        } catch (error) {
            console.error('Error searching members:', error);
            res.send({ error: 'Failed to search member details. Try again...' });
        }
    });

    app.get('/api/member/get-all-members', async function (req, res) {
        const token = req.user; // Get user from the middleware
        if (!token) return res.status(401).send({ error: 'You are not authorized. Please log in.' });

        try {
            const members = [];
            const employees = {};
            const bankId = req.query.bankId || token.bankId;
            const limit = parseInt(req.query.limit) || 50;
            const lastVisibleId = req.query.lastVisible;
            const searchValue = req.query.search ? req.query.search.toLowerCase().trim() : '';

            const userProfileInfo = await db.collection(token.bankId).doc('admin').collection('users').doc(token.uid).get();
            let kycColRef = db.collection(bankId).doc('kyc').collection('member-kyc');

            if (token.role !== 'root' && token.role !== 'admin' && userProfileInfo.data()?.accessLevel?.fullDataAccess !== true) {
                kycColRef = kycColRef.where('associatedEmployee', '==', token.uid);
            }

            if (searchValue) {
                const tokens = searchValue.split(/[\s\-_,.]+/).filter(t => t.length > 0);
                kycColRef = kycColRef.where('searchKeywords', 'array-contains', tokens[0]);
            }

            kycColRef = kycColRef.orderBy('createdAt', 'desc').limit(limit);

            if (lastVisibleId) {
                const lastDoc = await db.collection(bankId).doc('kyc').collection('member-kyc').doc(lastVisibleId).get();
                if (lastDoc.exists) {
                    kycColRef = kycColRef.startAfter(lastDoc);
                }
            }

            // Fetch Employee Details (Cached briefly in memory for this request)
            const getEmployees = await db.collection(bankId).doc('admin').collection('users').get();
            getEmployees.forEach(function (employee) {
                employees[employee.id] = { id: employee.id, ...employee.data() };
            });

            const kycData = await kycColRef.get();
            kycData.forEach((doc) => {
                const data = doc.data();
                if (searchValue) {
                    const tokens = searchValue.split(/[\s\-_,.]+/).filter(t => t.length > 0);
                    const combinedText = `${doc.id} ${data.name} ${data.phone} ${data.aadhar} ${data.pan}`.toLowerCase();
                    if (!tokens.every(token => combinedText.includes(token))) return;
                }

                const associatedEmployee = data.associatedEmployee;
                members.push({
                    label: `${doc.id} - ${data.name}`,
                    id: doc.id,
                    ...data,
                    agentName: employees[associatedEmployee] ? employees[associatedEmployee].name : '',
                    agentEmail: employees[associatedEmployee] ? employees[associatedEmployee].email : '',
                });
            });

            if (members.length === 0 && !lastVisibleId && !searchValue) {
                return res.send({ error: 'No member found. Please add new member' });
            }

            return res.send({
                success: 'Successfully fetched member details',
                data: members,
                lastVisible: kycData.docs.length > 0 ? kycData.docs[kycData.docs.length - 1].id : null
            });

        } catch (error) {
            console.error('Error fetching members:', error);
            res.send({ error: 'Failed to fetch all member details. Try again...' });
        }
    });

    app.get('/api/member/get-member-by-id/:memberId', async function (req, res) {
        const token = req.user; // Get user from the middleware
        if (!token) return res.status(401).send({ error: 'You are not authorized. Please log in.' });
        const memberId = req.params.memberId;

        try {
            const kycData = await db.collection(token.bankId).doc('kyc').collection('member-kyc').doc(memberId).get();
            if (!kycData.exists) return res.send({ error: 'No member found with selected Id' });
            if (kycData.data().active === false) return res.send({ error: 'Member is inactive. Please Activate the member first' });
            return res.send({
                success: 'Successfully fetched member details',
                ...kycData.data(),
                id: kycData.id,
            });
        } catch (error) {
            console.error('Error fetching member by ID:', error);
            res.send({ error: 'Failed to fetch member by id.' });
        }
    });

    app.post('/api/member/get-users-by-bank-restrictive', async function (req, res) {
        const token = req.user; // Get user from the middleware
        if (!token) return res.status(401).send({ error: 'You are not authorized. Please log in.' });

        try {
            const applicableUsers = [];
            const bankId = req.body.bankId || token.bankId;
            if (!token.bankId) return res.send({ error: 'Unauthorized request. Try logging in again...' });

            const userColRef = await db.collection(bankId).doc('admin').collection('users').get();
            userColRef.forEach(doc => {
                applicableUsers.push({
                    key: doc.id,
                    label: doc.data().name,
                    userId: doc.id,
                    email: doc.data().email,
                });
            });

            res.send({ success: `Successfully fetched bank users`, data: applicableUsers });
        } catch (error) {
            console.error('Error fetching users by bank:', error);
            return res.send({ error: 'Failed to fetch users. Try again...' });
        }
    });

    app.get('/api/member/get-associated-branch-restrictive', async function (req, res) {
        const token = req.user; // Get user from the middleware
        if (!token) return res.status(401).send({ error: 'You are not authorized. Please log in.' });

        try {
            const bankColRef = db.collection('admin').doc('organization').collection('banks').where('mainBranchId', '==', token.bankId);
            const snapshot = await bankColRef.get();
            const bankList = [];
            snapshot.forEach(doc => {
                bankList.push({
                    key: doc.id,
                    label: doc.data().bankName,
                });
            });
            const bankDropdown = bankList;

            const mainBranchRef = db.collection(token.bankId).doc('admin').collection('bank-info').doc('details');
            const mainBranchInfo = await mainBranchRef.get();
            bankDropdown.push({
                key: token.bankId,
                label: mainBranchInfo.data().bankName,
                isMainBranch: true,
            });
            res.send({ success: 'Successfully fetched registered banks', data: bankDropdown });
        } catch (error) {
            console.error('Error fetching associated branches:', error);
            res.send({ error: 'Failed to fetch associated branches. Try again...' });
        }
    });

    app.get('/api/member/view-member-details/:id', async function (req, res) {
        const token = req.user;
        if (!token) return res.status(401).send({ error: 'You are not authorized. Please log in.' });

        const memberId = req.params.id;
        const bankId = req.query.bankId;

        console.log(bankId);
        console.log(memberId);

        try {
            // Fetch member KYC
            const kycRef = db.collection(bankId).doc('kyc').collection('member-kyc').doc(memberId);
            const kycDoc = await kycRef.get();

            console.log('KYC Fetched' + kycDoc.id);

            if (!kycDoc.exists) {
                return res.status(404).send({ error: 'Member not found.' });
            }

            const memberData = kycDoc.data();
            if (memberData.active === false) {
                return res.status(400).send({ error: 'Member is inactive. Please activate the member first.' });
            }

            // Permission check
            const userProfileInfo = await db.collection(bankId).doc('admin').collection('users').doc(token.uid).get();
            const hasFullAccess =
                token.role === 'root' ||
                token.role === 'admin' ||
                (userProfileInfo.exists && userProfileInfo.data()?.accessLevel?.fullDataAccess === true);

            if (!hasFullAccess && memberData.associatedEmployee !== token.uid) {
                return res.status(403).send({ error: 'You do not have permission to view this member.' });
            }

            // Define account types
            const accountTypes = [
                'loan',
                'group-loan',
                'savings',
                'fixed-deposit',
                'recurring-deposit',
                'cash-certificate',
                'daily-savings',
                'mis-deposit',
                'thrift-fund'
            ];

            // Fetch accounts + their transactions
            const accountPromises = accountTypes.map(async (type) => {
                const query = db
                    .collection(bankId)
                    .doc('accounts')
                    .collection(type)
                    .where('applicants', 'array-contains', memberId);

                const snapshot = await query.get();
                const accounts = [];

                for (const doc of snapshot.docs) {
                    const accountData = { id: doc.id, ...doc.data() };

                    // Fetch transactions for this account
                    const transactionSnapshot = await doc.ref.collection('transaction').get();
                    const transactions = [];
                    transactionSnapshot.forEach(tDoc => {
                        transactions.push({ id: tDoc.id, ...tDoc.data() });
                    });

                    accountData.transactions = transactions;
                    accounts.push(accountData);
                }

                return { type, accounts };
            });

            const accountResults = await Promise.all(accountPromises);

            const accountsByType = {};
            accountResults.forEach(({ type, accounts }) => {
                accountsByType[type] = accounts;
            });

            return res.send({
                success: 'Member details, accounts, and transactions fetched successfully',
                member: {
                    id: kycDoc.id,
                    ...memberData
                },
                accounts: accountsByType
            });

        } catch (error) {
            console.error('Error fetching member, accounts, and transactions:', error);
            return res.status(500).send({ error: 'Failed to fetch data. Please try again.' });
        }
    });

    app.post('/api/member/user-app-permission', async function (req, res) {
        const token = req.user;
        if (!token) return res.status(401).send({ error: 'You are not authorized. Please log in.' });

        const { memberId, bankId, userAppEnabled } = req.body;

        if (!memberId || !bankId) {
            return res.status(400).send({ error: 'Missing memberId or bankId' });
        }

        try {
            await db.runTransaction(async (t) => {
                const kycRef = db.collection(bankId)
                    .doc('kyc')
                    .collection('member-kyc')
                    .doc(memberId);

                const kycDoc = await t.get(kycRef);
                if (!kycDoc.exists) {
                    throw new Error("Member not found");
                }

                const phone = kycDoc.data().phone;
                const userAppDocId = `91${phone}`;

                // Permission document reference
                const userAppPermissionRef = db
                    .collection('admin')
                    .doc('app-access')
                    .collection('app-user')
                    .doc(userAppDocId);

                const userAppPermissionDoc = await t.get(userAppPermissionRef);

                t.update(kycRef, {
                    userAppEnabled,
                    updatedBy: token.email,
                    updatedAt: new Date(),
                });

                // ENABLE PERMISSION
                if (userAppEnabled === true) {
                    // If already assigned → Block assigning to another member
                    if (userAppPermissionDoc.exists) {
                        const existingPhoneNumber = userAppPermissionDoc.data().phoneNumber;
                        const existingBankId = userAppPermissionDoc.data().bankId;
                        if (existingPhoneNumber === phone && existingBankId === bankId) {
                            throw new Error("This phone number has already user app permission.");
                        }
                    }

                    // Create/Update the permission
                    t.set(userAppPermissionRef, {
                        bankId,
                        kycId: memberId,
                        phoneNumber: phone,
                        createdAt: new Date(),
                    }, { merge: false });
                }

                // DISABLE PERMISSION
                if (userAppEnabled === false) {
                    if (userAppPermissionDoc.exists) {
                        const existingPhoneNumber = userAppPermissionDoc.data().phoneNumber;
                        const existingBankId = userAppPermissionDoc.data().bankId;

                        if (existingPhoneNumber === phone && existingBankId === bankId) {
                            t.delete(userAppPermissionRef);
                        }
                    }
                }
            });

            // Send success response AFTER transaction completes
            return res.send({
                success: true,
                message: "User app permissions updated successfully",
                userAppEnabled
            });

        } catch (err) {
            console.error("Transaction error:", err);
            return res.status(500).send({ error: err.message });
        }
    });

}