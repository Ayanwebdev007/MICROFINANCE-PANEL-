const {getFirestore} = require('firebase-admin/firestore');
const db = getFirestore();

module.exports = app => {
    app.post('/api/master/mFinanceGroup', async function (req, res) {
        const token = req.user; // Get user from the middleware

        if (!token) return res.status(401).send({error: 'You are not authorized. Please log in.'});

        if (req.body.name && req.body.joinedMembers) {
            try {
                await db.runTransaction(async (t) => {
                    const groupIteratorRef = db.collection(token.bankId).doc('admin').collection('iterator').doc('group');
                    const getGroupIterator = await t.get(groupIteratorRef);
                    const groupNumber = `${getGroupIterator.data().prefix || ''}${getGroupIterator.data().value}`;

                    if (isNaN(parseInt(getGroupIterator.data().value))) {
                        return res.send({error: 'Invalid iterator value. Please contact support.'});
                    }

                    // Update Iterators to incremental value
                    await t.update(groupIteratorRef, {
                        value: (parseInt(getGroupIterator.data().value) + 1).toString().padStart(getGroupIterator.data().value.length, '0'),
                        isUsed: true
                    });

                    const groupRef = db.collection(token.bankId).doc('kyc').collection('group').doc(groupNumber);
                    t.set(groupRef, {
                        ...req.body,
                        associatedEmployee: req.body.associatedEmployee || token.uid,
                    });

                    const memberArray = Object.values(req.body.joinedMembers);
                    const memberLength = memberArray.length;
                    for (let i = 0; i < memberLength; i++) {
                        const cifRef = db.collection(token.bankId).doc('kyc').collection('member-kyc').doc(memberArray[i].kyc.toString());
                        t.update(cifRef, {group: groupNumber});
                    }
                    res.send({success: `Successfully created Group with ID ${groupNumber}`});
                });
            } catch (err) {
                console.log(err);
                await db.collection('admin').doc('crash').collection('group').add(
                    {
                        ...req.body,
                        author: token.email,
                        bankId: token.bankId,
                        type: 'group-creation',
                        err: err.toString()
                    });

                res.send({error: 'captured the error for further evaluation'});
            }
        } else {
            res.send({error: 'Mandatory fields are missing'});
        }
    });

    app.get('/api/master/get-mFinanceGroup-for-edit/:id', async function (req, res) {
        const token = req.user; // Get user from the middleware
        const groupId = req.params.id;

        try {
            const groupDetails = await db.collection(token.bankId).doc('kyc').collection('group').doc(groupId).get();
            if (groupDetails.exists) {
                const existingMembers = [];
                const getAssociatedKyc = await db.collection(token.bankId).doc('kyc').collection('member-kyc').where('group', '==', groupId).get();
                getAssociatedKyc.forEach(function (kyc) {
                    if (kyc.data().active !== false) {
                        existingMembers.push({
                            ...kyc.data(),
                            id: kyc.id,
                        });
                    }
                });

                res.send({
                    success: 'Successfully fetched group details',
                    details: {
                        ...groupDetails.data(),
                        joinedMembers: [],
                        existingMembers
                    },
                });
            } else {
                res.send({error: 'Invalid group Id. Please try again'});
            }
        } catch (error) {
            console.error('Error fetching group details:', error);
            res.send({error: 'Failed to fetch group details. Try again...'});

        }
    });

    app.post('/api/master/update-mFinanceGroup', async function (req, res) {
        const token = req.user; // Get user from the middleware

        if (!token) return res.status(401).send({error: 'You are not authorized. Please log in.'});

        if (req.body.groupId && req.body.name && req.body.joinedMembers) {
            try {
                await db.runTransaction(async (t) => {
                    const groupRef = db.collection(token.bankId).doc('kyc').collection('group').doc(req.body.groupId);

                    t.update(groupRef, {
                        name: req.body.name,
                        updateDate: req.body.updateDate || new Date().toISOString().slice(0, 10),
                        associatedEmployee: req.body.associatedEmployee || token.uid,
                        // joinedMembers: req.body.joinedMembers,
                    });

                    const memberArray = Object.values(req.body.joinedMembers);
                    const memberLength = memberArray.length;
                    for (let i = 0; i < memberLength; i++) {
                        const cifRef = db.collection(token.bankId).doc('kyc').collection('member-kyc').doc(memberArray[i].kyc.toString());
                        t.update(cifRef, {group: req.body.groupId});
                    }
                    res.send({success: `Successfully updated Group with ID ${req.body.groupId}`});
                });
            } catch (err) {
                console.log(err);
                await db.collection('admin').doc('crash').collection('group').add(
                    {
                        ...req.body,
                        author: token.email,
                        bankId: token.bankId,
                        type: 'mFinance-group',
                        err: err.toString()
                    });

                res.send({error: 'captured the error for further evaluation'});
            }
        } else {
            res.send({error: 'Mandatory fields are missing'});
        }
    });

    app.post('/api/reports/loan/get-all-group', async function (req, res) {
        const token = req.user; // Get user from the middleware

        if (!token) return res.status(401).send({error: 'You are not authorized. Please log in.'});
        const groups = [];

        try {
            const bankId = req.body.bankId || token.bankId;
            const employees = {};

            const getEmployees = await db.collection(token.bankId).doc('admin').collection('users').get();
            getEmployees.forEach(function (employee) {
                employees[employee.id] = {id: employee.id, ...employee.data()};
            });

            const getGroupCol = await db.collection(bankId).doc('kyc').collection('group').get();
            getGroupCol.forEach(function (group) {
                if (!group.data().hide && group.id !== '100000') {
                    const associatedEmployee = group.data().associatedEmployee;
                    groups.push({
                        id: group.id,
                        agentName: employees[associatedEmployee] ? employees[associatedEmployee].name : '',
                        agentEmail: employees[associatedEmployee] ? employees[associatedEmployee].email : '',
                        agentPhone: employees[associatedEmployee] ? employees[associatedEmployee].phone : '',
                        ...group.data(),
                        label: `${group.id}-${group.data().name}`,
                    });
                }
            })

            res.send({success: 'successfully fetched group details', details: groups});
        } catch (error) {
            console.error('Error fetching groups:', error);
            res.send({error: 'Failed to fetch groups. Try again...'});
        }
    });
}