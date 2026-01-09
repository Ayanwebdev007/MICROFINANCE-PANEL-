const {getFirestore} = require('firebase-admin/firestore');
const {getAuth} = require("firebase-admin/auth");
const db = getFirestore();

module.exports = app => {
    app.get('/api/internal-utility/68ugjhdrtew56578790unjkh98/create-new-bank', async function (req, res) {

        try {
            await db.runTransaction(async (t) => {
                const bankId = `01_mPanel_DEV__itNnefCGyynLKLk35IRR`;

                const masterGlRef = db.collection('admin').doc('master-data').collection('gl_code').doc('value');
                const masterGlInfo = await t.get(masterGlRef);

                const bankAdminRef = db.collection('admin').doc('organization').collection('banks').doc(bankId);
                await t.set(bankAdminRef, {
                    bankId: bankId,
                    bankName: 'GS3 Microfinance Services Pvt. Ltd.',
                    displayName: 'GS3 Finance',
                    createdAt: new Date(),
                    createdBy: 'dev utility',
                });

                const bankRef = db.collection(bankId).doc('admin').collection('bank-info').doc('details');
                await t.set(bankRef, {
                    bankName: 'GS3 Microfinance Services Pvt. Ltd.',
                    displayName: 'GS3 Finance',
                    registrationCode: 'TEST/35UI/23B/45L',
                    address: '',
                    pan: '',
                    tan: '',
                    gst: '',
                    email: '',
                    phone: '',
                    logo: '',
                    module: {
                        admin: true,
                        member: true,
                        advisor: true,
                        employee: true,
                        savings: true,
                        deposit: true,
                        loan: true,
                        groupLoan: true,
                        journal: true,
                        authorize: true,
                        report: true,
                    },
                    createdAt: new Date(),
                    createdBy: 'dev utility',
                });

                const bankGlRef = db.collection(bankId).doc('admin').collection('gl_code').doc('value');
                await t.set(bankGlRef, masterGlInfo.data());

                const accountIteratorRef = db.collection(bankId).doc('admin').collection('iterator').doc('account');
                await t.set(accountIteratorRef, {value: 100000000000});

                const advisorIteratorRef = db.collection(bankId).doc('admin').collection('iterator').doc('advisor');
                await t.set(advisorIteratorRef, {value: 200000});

                const employeeIteratorRef = db.collection(bankId).doc('admin').collection('iterator').doc('employee');
                await t.set(employeeIteratorRef, {value: 10000});

                const groupIteratorRef = db.collection(bankId).doc('admin').collection('iterator').doc('group');
                await t.set(groupIteratorRef, {value: 100000});

                const kycIteratorRef = db.collection(bankId).doc('admin').collection('iterator').doc('kyc');
                await t.set(kycIteratorRef, {value: 10000000002});

                const groupRef = db.collection(bankId).doc('kyc').collection('group').doc('100000');
                await t.set(groupRef, {
                    name: 'NOT ASSIGNED',
                });

                res.send({success: `Successfully create new bank`});
            });
        } catch (err) {
            console.log(err);
            res.send({error: 'Failed to create new Bank. Try again...'});
        }
    });

    app.get('/api/internal-utility/t6tu980hnvdc6879bvx89bftdg/create-new-user', async function (req, res) {
        function generatePassword(length) {
            const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz^#@&$0123456789';
            let result = '';
            for (let i = 0; i < length; i++) {
                const randomIndex = Math.floor(Math.random() * characters.length);
                result += characters.charAt(randomIndex);
            }
            return result;
        }

        try {
            await db.runTransaction(async (t) => {
                const bankId = '01_GS3Finance__itNnefCGyynLKLk35IRR';
                const email = 'test.mpanel@mpanel.co.in';
                // const password = generatePassword(15);
                const password = 'test@pass123';

                const userRecord = await getAuth().createUser({
                    email: email,
                    password: password,
                    displayName: 'Admin Account',
                    disabled: false,
                    emailVerified: true,
                });

                await getAuth().setCustomUserClaims(userRecord.uid, {
                    bankId: bankId,
                    role: 'root',
                });

                const bankRef = db.collection(bankId).doc('admin').collection('users').doc(userRecord.uid);
                await t.set(bankRef, {
                    name: 'Admin Account',
                    email: email,
                    phone: '',
                    address: '',
                    profilePic: '',
                    permissions: {
                        admin: true,
                        member: true,
                        advisor: true,
                        employee: true,
                        savings: true,
                        deposit: true,
                        loan: true,
                        groupLoan: true,
                        journal: true,
                        report: true,
                    },
                    role: 'root',
                    uid: 'test',
                });

                res.send({success: `Successfully create new user with email: ${email} and password: ${password}`});
            });
        } catch (err) {
            console.log(err);
            // res.send({error: 'Failed to create new Bank. Try again...'});
        }
    });

    app.get('/api/internal-utility/t6tu980hnvdctr6757bvx89bftdg/update-user-custom-claim', async function (req, res) {
        const bankId = '';
        const uid = '';

        // await getAuth().setCustomUserClaims(uid, {
        //   bankId: bankId,
        //   role: 'admin',
        // });

        await getAuth().getUser(uid).then(function (userRecord) {
            console.log(userRecord.customClaims);
        });
        res.send({success: `Successfully update user custom claim`});
    });
}