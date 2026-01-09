const {getFirestore} = require('firebase-admin/firestore');
const db = getFirestore();

module.exports = app => {
    app.post('/api/employee/add-designation', async function (req, res) {
        const token = req.user; // Get user from the middleware
        if (!token) return res.status(401).send({error: 'You are not authorized. Please log in.'});

        try {
            await db.runTransaction(async (t) => {
                const employeeRef = db.collection(token.bankId).doc('admin').collection('employee').doc('designation');
                const employeeInfo = await t.get(employeeRef);
                const employeeData = employeeInfo.data() || {};
                t.set(employeeRef, {
                    ...employeeData,
                    [req.body.designationId]: {
                        designationName: req.body.designationName,
                        designationId: req.body.designationId,
                    }
                });
            });
            res.send({success: `Successfully added designation`});
        } catch (e) {
            res.send({error: 'Failed to create designation'});
            console.log('KYC Creation failure:', e);
        }
    });

    app.get('/api/employee/get-designations', async function (req, res) {
        const token = req.user; // Get user from the middleware
        if (!token) return res.status(401).send({error: 'You are not authorized. Please log in.'});


        try {
            const employeeRef = db.collection(token.bankId).doc('admin').collection('employee').doc('designation');
            const employeeInfo = await employeeRef.get();
            if (!employeeInfo.exists) {
                res.send({error: 'Designation list is empty. Add first designation'});
                return;
            }
            res.send({success: employeeInfo.data()});
        } catch (e) {
            res.send({error: 'Failed to fetch designation list'});
            console.log('Failed to fetch designation list:', e);
        }
    });

    app.post('/api/employee/add-department', async function (req, res) {
        const token = req.user; // Get user from the middleware
        if (!token) return res.status(401).send({error: 'You are not authorized. Please log in.'});

        try {
            await db.runTransaction(async (t) => {
                const employeeRef = db.collection(token.bankId).doc('admin').collection('employee').doc('department');
                const employeeInfo = await t.get(employeeRef);
                const employeeData = employeeInfo.data() || {};
                t.set(employeeRef, {
                    ...employeeData,
                    [req.body.departmentId]: {
                        departmentName: req.body.departmentName,
                        departmentId: req.body.departmentId,
                    }
                });
            });
            res.send({success: `Successfully added department`});
        } catch (e) {
            res.send({error: 'Failed to add department'});
            console.log('KYC Creation failure:', e);
        }
    });

    app.get('/api/employee/get-departments', async function (req, res) {
        const token = req.user; // Get user from the middleware
        if (!token) return res.status(401).send({error: 'You are not authorized. Please log in.'});

        try {
            const employeeRef = db.collection(token.bankId).doc('admin').collection('employee').doc('department');
            const employeeInfo = await employeeRef.get();
            if (!employeeInfo.exists) {
                res.send({error: 'Department list is empty. Add first department'});
                return;
            }
            res.send({success: employeeInfo.data()});
        } catch (e) {
            res.send({error: 'Failed to fetch department list'});
            console.log('Failed to fetch department list:', e);
        }
    });

    app.post('/api/employee/add-employee', async function (req, res) {
        const token = req.user; // Get user from the middleware
        if (!token) return res.status(401).send({error: 'You are not authorized. Please log in.'});

        try {
            await db.runTransaction(async (t) => {
                const bankId = req.body.bankId;
                const iteratorRef = db.collection(bankId).doc('admin').collection('iterator').doc('employee');
                const iterator = await t.get(iteratorRef);
                if (isNaN(parseInt(iterator.data().value))) {
                    return res.send({error: 'Invalid iterator value. Please contact support.'});
                }

                const employeeId = `${iterator.data().prefix || ''}${iterator.data().value}`;
                const kycRef = db.collection(bankId).doc('kyc').collection('employee-kyc').doc(employeeId);

                await t.update(iteratorRef, {
                    value: (parseInt(iterator.data().value) + 1).toString().padStart(iterator.data().value.length, '0'),
                    isUsed: true
                });

                await t.set(kycRef, {
                    ...req.body,
                    selectedUserId: req.body.userId,
                    author: token.email,
                    createdAt: new Date(),
                });
                res.send({success: `Employee details is captured successfully with Id: ${employeeId}`});
            });
        } catch (e) {
            res.send({error: 'Failed to create customer KYC'});
            console.log('KYC Creation failure:', e);
        }
    });

    app.get('/api/employee/get-employee-list', async function (req, res) {
        const token = req.user; // Get user from the middleware
        if (!token) return res.status(401).send({error: 'You are not authorized. Please log in.'});

        try {
            const employeeList = [];
            const bankId = req.query.bankId || token.bankId;
            const advisorRef = db.collection(bankId).doc('kyc').collection('employee-kyc');
            const advisorSnapshot = await advisorRef.get();
            advisorSnapshot.forEach((doc) => {
                employeeList.push({
                    ...doc.data(),
                    id: doc.id,
                    salary: doc.data().salary || {},
                });
            });
            res.send({success: 'Successfully fetched data', employeeList});
        } catch (error) {
            console.error('Error fetching employee list:', error);
            res.send({error: 'Failed to fetch employee list. Try again...'});
        }
    });

    app.post('/api/employee/salary-master', async function (req, res) {
        const token = req.user; // Get user from the middleware
        if (!token) return res.status(401).send({error: 'You are not authorized. Please log in.'});

        try {
            await db.runTransaction(async (t) => {
                const kycRef = db.collection(token.bankId).doc('kyc').collection('employee-kyc').doc(req.body.employeeCode);
                await t.update(kycRef, {
                    salary: {
                        basic: parseFloat(req.body.basic) || 0,
                        hra: parseFloat(req.body.hra) || 0,
                        da: parseFloat(req.body.da) || 0,
                        ta: parseFloat(req.body.ta) || 0,
                        allowance: parseFloat(req.body.allowance) || 0,
                        others: parseFloat(req.body.others) || 0,
                        grossPay: parseFloat(req.body.grossPay) || 0,
                        pf: parseFloat(req.body.pf) || 0,
                        esi: parseFloat(req.body.esi) || 0,
                        netPay: parseFloat(req.body.netPay) || 0,
                    },
                    updatedAt: new Date(),
                    updatedBy: token.email,
                });
            });
            res.send({success: `Salary details is captured successfully`});
        } catch (e) {
            res.send({error: 'Failed to create customer KYC'});
            console.log('KYC Creation failure:', e);
        }
    });

    app.post('/api/employee/salary-payment', async function (req, res) {
        const token = req.user; // Get user from the middleware
        if (!token) return res.status(401).send({error: 'You are not authorized. Please log in.'});

        let transactionNumber;
        const systemDate = new Date().toISOString().slice(0, 10);

        try {
            await db.runTransaction(async (t) => {
                const kycRef = db.collection(token.bankId).doc('kyc').collection('employee-kyc').doc(req.body.employeeCode);
                const kycInfo = await t.get(kycRef);

                const salaryRef = db.collection(token.bankId).doc('kyc').collection('employee-kyc').doc(req.body.employeeCode).collection('salary').doc(req.body.salaryPeriod);
                const salaryInfo = await t.get(salaryRef);
                if (salaryInfo.exists) {
                    return res.send({error: 'Salary already credited for selected period for selected employee'});
                }

                const iteratorRef = db.collection(token.bankId).doc('admin').collection('transIterator').doc(systemDate);
                const iteratorInfo = await t.get(iteratorRef);

                if (iteratorInfo.exists) {
                    transactionNumber = parseInt(iteratorInfo.data().value) + 1;
                } else {
                    transactionNumber = generateTransactionId() + 1;
                }
                t.set(iteratorRef, {value: transactionNumber});

                const piRef = db.collection(token.bankId).doc('pi').collection('voucher').doc(transactionNumber.toString());
                const paymentInstruction = {
                    transactionId: transactionNumber.toString(),
                    accountNumber: '',
                    transactionType: 'voucher',
                    transactionDate: systemDate,
                    name: kycInfo.data().employeeName,
                    amount: parseFloat(kycInfo.data().salary.netPay || req.body.salaryDetails.netPay),
                    glCode: '18132',
                    glHead: 'SALARY PAYABLE',
                    narration: req.body.narration,
                    method: 'cash',
                    type: 'credit',
                    author: token.email,
                };
                t.set(piRef, paymentInstruction);
                t.set(salaryRef, {
                    ...paymentInstruction,
                    salaryPeriod: req.body.salaryPeriod,
                    salaryDetails: req.body.salaryDetails,
                    payDate: req.body.payDate
                });

                res.send({
                    success: `Successfully captured Salary Payment Request. Please authorize the transaction.`,
                    // denomination: updatedMyDenomination,
                });
            });
        } catch (e) {
            console.log(e);
            res.send({error: 'there is something wrong. Try again...'});
        }
    });

    app.post('/api/employee/get-payslip-for-print', async function (req, res) {
        const token = req.user; // Get user from the middleware
        if (!token) return res.status(401).send({error: 'You are not authorized. Please log in.'});

        try {
            const salaryRef = db.collection(token.bankId).doc('kyc').collection('employee-kyc').doc(req.body.selectedEmployee).collection('salary').doc(req.body.salaryPeriod);
            const salaryInfo = await salaryRef.get();
            if (!salaryInfo.exists) {
                return res.send({error: 'Salary details not found for selected employee'});
            }
            const employeeRef = db.collection(token.bankId).doc('kyc').collection('employee-kyc').doc(req.body.selectedEmployee);
            const employeeInfo = await employeeRef.get();

            res.send({
                success: 'Successfully fetched Salary details for selected employee',
                data: {
                    employeeName: employeeInfo.data().employeeName,
                    employeeCode: employeeInfo.data().employeeCode,
                    department: employeeInfo.data().department || "",
                    designation: employeeInfo.data().designation || "",
                    bankAccount: "",
                    pfNumber: "",
                    salaryDetails: salaryInfo.data().salaryDetails,
                },
            });
        } catch (error) {
            console.error('Error fetching payslip for print:', error);
            res.send({error: 'Failed to fetch payslip details. Try again...'});
        }
    });

    // Offer Letter Defaults: GET and POST
    app.get('/api/employee/offer-letter-defaults', async function (req, res) {
        const token = req.user; // Get user from the middleware
        if (!token) return res.status(401).send({error: 'You are not authorized. Please log in.'});

        try {
            const ref = db.collection(token.bankId).doc('admin').collection('employee').doc('offerLetterDefaults');
            const snap = await ref.get();
            if (!snap.exists) {
                return res.send({warning: 'Offer letter defaults not set yet', data: {benefits: [], terms: []}});
            }
            const data = snap.data() || {};
            res.send({
                success: 'Fetched offer letter defaults',
                data: {benefits: data.benefits || [], terms: data.terms || []}
            });
        } catch (e) {
            console.error('Error fetching offer letter defaults:', e);
            res.send({error: 'Failed to fetch offer letter defaults'});
        }
    });

    app.post('/api/employee/offer-letter-defaults', async function (req, res) {
        const token = req.user; // Get user from the middleware
        if (!token) return res.status(401).send({error: 'You are not authorized. Please log in.'});

        try {
            const {benefits, terms} = req.body || {};
            if (!Array.isArray(benefits) || !Array.isArray(terms)) {
                return res.send({error: 'Invalid payload. Expecting arrays: benefits, terms'});
            }
            const ref = db.collection(token.bankId).doc('admin').collection('employee').doc('offerLetterDefaults');
            await ref.set({
                benefits: benefits.filter(v => typeof v === 'string'),
                terms: terms.filter(v => typeof v === 'string'),
                updatedAt: new Date(),
                updatedBy: token.email,
            }, {merge: true});
            res.send({success: 'Offer letter defaults saved successfully'});
        } catch (e) {
            console.error('Error saving offer letter defaults:', e);
            res.send({error: 'Failed to save offer letter defaults'});
        }
    });
}

const generateTransactionId = () => {
    let now = new Date();
    let month = (now.getMonth() + 1);
    let day = now.getDate();
    if (month < 10)
        month = "0" + month;
    if (day < 10)
        day = "0" + day;
    return parseInt(now.getFullYear().toString() + month.toString() + day.toString() + '000');
}