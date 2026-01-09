const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require("firebase-admin/auth");
const db = getFirestore();
const jwt = require('jsonwebtoken');
const axios = require('axios');

const crypto = require('crypto');

function createToken(JWT_KEY, data) {
    // Header
    const header = JSON.stringify({
        typ: 'JWT',
        alg: 'HS256'
    });

    // Payload
    const payload = JSON.stringify(data);

    // EXACT PHP base64_encode + str_replace(['+','/'], ['-','_'])
    const base64UrlEncode = (input) => {
        return Buffer.from(input, 'utf8')
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_'); // ⚠️ DO NOT remove '='
    };

    const base64UrlHeader  = base64UrlEncode(header);
    const base64UrlPayload = base64UrlEncode(payload);

    // Signature (hash_hmac with raw output = true)
    const signature = crypto
        .createHmac('sha256', JWT_KEY)
        .update(base64UrlHeader + '.' + base64UrlPayload)
        .digest('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_'); // ⚠️ keep '='

    return `${base64UrlHeader}.${base64UrlPayload}.${signature}`;
}


module.exports = app => {
    app.post('/api/tools/equifax-cibil-check-proxy-call-old', async function (req, res) {
        const token = req.user; // Get user from the middleware

        if (!token) return res.status(401).send({ error: 'You are not authorized. Please log in.' });


        // Fetch report from Equifax API
        const mainBranchRef = db.collection('admin').doc('organization').collection('banks').doc(token.bankId);
        const mainBranchInfo = await mainBranchRef.get();
        const mainBranchId = mainBranchInfo.data().mainBranchId || token.bankId;

        const walletRef = db.collection(mainBranchId).doc('wallet');
        const walletInfo = await walletRef.get();

        if (!walletInfo.exists) {
            return res.send({ error: 'Please contact admin to activate wallet.' });
        } else if (parseInt(walletInfo.data().balance) < 100) {
            return res.send({ error: 'Insufficient balance. Please top up your wallet first.' });
        } else if (!walletInfo.data().configuration.equifaxCIBIL && !walletInfo.data().configuration.equifaxCIBIL.enabled) {
            return res.send({ error: 'Equifax CIBIL API is not enabled for your bank. Please contact admin to activate it.' });
        }

        // Check if CIBIL Report is already checked for the same PAN Number
        if (!req.body.force) {
            const cibiReportRef = db.collection('admin').doc('master-data').collection('cibi-report').doc(req.body.pan);
            const cibiReportInfo = await cibiReportRef.get();
            if (cibiReportInfo.exists) {
                return res.send({
                    success: `Latest CIBIL Report for PAN ${req.body.pan} fetched on ${cibiReportInfo.data().date}.`,
                    data: cibiReportInfo.data().response.data,
                    isCached: true
                });
            } else {
                return res.send({ warning: 'CIBIL Report is not available for this PAN Number. Please fetch from Credit Beuro' });
            }
        }

        await walletRef.update({
            balance: parseInt(walletInfo.data().balance) - parseInt(walletInfo.data().configuration.equifaxCIBIL.cost),
        });

        const JWT_KEY = 'f6c24877179a8b0b17f5037c84a89f7669852540';

        const payload = {
            timestamp: 1766628347,
            partnerId: "ESP00087",
            iat: 1766579090
        };

        const jwtToken = createToken(JWT_KEY, payload);

        const equifaxCIBILCheckEnableStatus = walletInfo.data().configuration.equifaxCIBIL.enabled
        let civilCheckApiUrl = "https://uat-api.bharateverify.com/api/v1/credit-bureau/get-full-report"
        let responseText = 'success';
        if (equifaxCIBILCheckEnableStatus) {
            civilCheckApiUrl = 'https://api.bharateverify.com/api/v1/credit-bureau/get-full-report';
        }
        try {
            const requestData = await axios.post(civilCheckApiUrl, {
                fullname: req.body.fullname,
                mobile: req.body.mobile,
                pan: req.body.pan,
                dob: req.body.dob,
                pincode: req.body.pincode,
                refid: generateRandomNumber(9),
            },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'jwt-token': jwtToken,

                    }
                });

            if (requestData.status) {
                // Catch CIBIL Report for future use
                await db.collection('admin').doc('master-data').collection('cibi-report').doc(req.body.pan).set({
                    request: req.body,
                    response: requestData.data.data,
                    timestamp: Date.now(),
                    date: new Date().toISOString().slice(0, 10),
                    bankId: token.bankId,
                    userEmail: token.email,
                    status: 'success',
                    statusMessage: requestData.data.message,
                });

                res.send({
                    success: true,
                    data: requestData.data.data
                });
            } else {
                responseText = 'error' || '';
                res.send({ error: requestData.data.error });
            }
        } catch (err) {
            responseText = 'error' || '';
            console.log(err);
            res.send({ error: err.toString() });
        } finally {
            await db.collection(token.bankId).doc('wallet').collection('api-usage').add({
                type: 'Equifax CIBIL Report',
                panNumber: req.body.pan,
                name: req.body.fullname,
                phone: req.body.mobile,
                timestamp: Date.now(),
                date: new Date().toISOString().slice(0, 10),
                userEmail: token.email,
                amount: walletInfo.data().configuration.equifaxCIBIL.cost,
                responseText: responseText || '',
            });
        }

    });


    app.post('/api/tools/equifax-cibil-check-proxy-call', async function (req, res) {
        const token = req.user; // Get user from the middleware

        if (!token) return res.status(401).send({ error: 'You are not authorized. Please log in.' });


        // Fetch report from Equifax API
        const mainBranchRef = db.collection('admin').doc('organization').collection('banks').doc(token.bankId);
        const mainBranchInfo = await mainBranchRef.get();
        const mainBranchId = mainBranchInfo.data().mainBranchId || token.bankId;

        const walletRef = db.collection(mainBranchId).doc('wallet');
        const walletInfo = await walletRef.get();

        if (!walletInfo.exists) {
            return res.send({ error: 'Please contact admin to activate wallet.' });
        } else if (parseInt(walletInfo.data().balance) < 100) {
            return res.send({ error: 'Insufficient balance. Please top up your wallet first.' });
        } else if (!walletInfo.data().configuration.equifaxCIBIL && !walletInfo.data().configuration.equifaxCIBIL.enabled) {
            return res.send({ error: 'Equifax CIBIL API is not enabled for your bank. Please contact admin to activate it.' });
        }

        // Check if CIBIL Report is already checked for the same PAN Number
        if (!req.body.force) {
            const cibiReportRef = db.collection('admin').doc('master-data').collection('cibi-report').doc(req.body.pan);
            const cibiReportInfo = await cibiReportRef.get();
            if (cibiReportInfo.exists) {
                return res.send({
                    success: `Latest CIBIL Report for PAN ${req.body.pan} fetched on ${cibiReportInfo.data().date}.`,
                    data: cibiReportInfo.data().response.data,
                    isCached: true
                });
            } else {
                return res.send({ warning: 'CIBIL Report is not available for this PAN Number. Please fetch from Credit Beuro' });
            }
        }

        await walletRef.update({
            balance: parseInt(walletInfo.data().balance) - parseInt(walletInfo.data().configuration.equifaxCIBIL.cost),
        });

        const JWT_KEY = '46eb3133e55322de057a4c7f05642fc6d63449eb';

        const payload = {
            timestamp: Date.now(),
            partnerId: "ESP00087",
            iat: 1766579090
        };

        const jwtToken = createToken(JWT_KEY, payload);
        let responseText = 'success'
        const civilCheckApiUrl = 'https://testing.maxhub.center/api/bharat-verify/equifaxCIBIL';

        try {
            const requestData = await axios.post(civilCheckApiUrl, {
                fullname: req.body.fullname,
                mobile: req.body.mobile,
                pan: req.body.pan,
                dob: req.body.dob,
                pincode: req.body.pincode,
                jwtToken: jwtToken,
                refid: generateRandomNumber(9),
            })

            if (requestData.data?.success) {
                // Catch CIBIL Report for future use
                await db.collection('admin').doc('master-data').collection('cibi-report').doc(req.body.pan).set({
                    request: req.body,
                    response: requestData.data,
                    timestamp: Date.now(),
                    date: new Date().toISOString().slice(0, 10),
                    bankId: token.bankId,
                    userEmail: token.email,
                    status: 'success',
                    statusMessage: requestData.data.message,
                });

                res.send({
                    success: true,
                    data: requestData.data.data
                });
            } else {
                responseText = 'error' || '';
                res.send({ error: requestData.data.error });
            }
        } catch (err) {
            responseText = 'error' || '';
            console.log(err);
            res.send({ error: err.toString() });
        } finally {
            await db.collection(token.bankId).doc('wallet').collection('api-usage').add({
                type: 'Equifax CIBIL Report',
                panNumber: req.body.pan,
                name: req.body.fullname,
                phone: req.body.mobile,
                timestamp: Date.now(),
                date: new Date().toISOString().slice(0, 10),
                userEmail: token.email,
                amount: walletInfo.data().configuration.equifaxCIBIL.cost,
                responseText: responseText,
            });
        }

    });

    app.post('/api/tools/cibi-score-api', async function (req, res) {
        const token = req.user; // Get user from the middleware

        if (!token) return res.status(401).send({ error: 'You are not authorized. Please log in.' });


        const jwtSecretKey = 'UTA5U1VEQXdNREF4VFZSSmVrNUVWVEpPZWxVd1RuYzlQUT09';
        const authKey = 'TVRJek5EVTJOelUwTnpKRFQxSlFNREF3TURFPQ==';
        const APIUrl = 'https://uat.paysprint.in/sprintverify-uat/api/v1/verification/credit_report_checker';

        // Check if CIBIL Report is already checked for the same PAN Number
        if (!req.body.force) {
            const cibiReportRef = db.collection('admin').doc('master-data').collection('cibi-report').doc(req.body.panNumber);
            const cibiReportInfo = await cibiReportRef.get();
            if (cibiReportInfo.exists) {
                return res.send({
                    success: `Latest CIBIL Report for PAN ${req.body.panNumber} fetched on ${cibiReportInfo.data().date}.`,
                    data: cibiReportInfo.data().response.data,
                    isCached: true
                });
            } else {
                return res.send({ warning: 'CIBIL Report is not available for this PAN Number. Please fetch from Credit Beuro' });
            }
        }

        // Check & Deduct Balance from Wallet
        const mainBranchRef = db.collection('admin').doc('organization').collection('banks').doc(token.bankId);
        const mainBranchInfo = await mainBranchRef.get();
        const mainBranchId = mainBranchInfo.data().mainBranchId || token.bankId;

        const walletRef = db.collection(mainBranchId).doc('wallet');
        const walletInfo = await walletRef.get();
        if (!walletInfo.exists) {
            return res.send({ error: 'Please contact admin to activate wallet.' });
        } else if (parseInt(walletInfo.data().balance) < 100) {
            return res.send({ error: 'Insufficient balance. Please top up your wallet first.' });
        } else if (!walletInfo.data().configuration?.equifaxCIBIL && !walletInfo.data().configuration.equifaxCIBIL.enabled) {
            return res.send({ error: 'Equifax CIBIL API is not enabled for your bank. Please contact admin to activate it.' });
        }

        await walletRef.update({
            balance: parseInt(walletInfo.data().balance) - parseInt(walletInfo.data().configuration.equifaxCIBIL.cost),
        });

        let jwtPayload = {
            timestamp: Date.now(),
            partnerId: "CORP00001",
            reqid: generateRandomNumber(8) //(send a unique intiger for each request)
        };
        let jwtToken = jwt.sign(jwtPayload, jwtSecretKey, {
            algorithm: "HS256",
        });

        const options = {
            method: 'POST',
            url: APIUrl,
            headers: {
                accept: 'application/json',
                Token: jwtToken,
                authorisedkey: authKey,
                'content-type': 'application/json'
            },
            data: {
                refid: generateRandomNumber(9),
                name: req.body.name,
                mobile: req.body.mobileNumber,
                document_id: req.body.panNumber,
                date_of_birth: req.body.dateOfBirth,
                address: req.body.address,
                pincode: req.body.pincode,
            }
        };
        let responseObj = {};

        try {
            const requestData = await axios(options);
            if (requestData.data.statuscode === 200 && requestData.data.status === true) {
                responseObj = {
                    message: requestData.data.message,
                    status: 'success',
                }
                console.log(requestData.data);
                // Catch CIBIL Report for future use
                await db.collection('admin').doc('master-data').collection('cibi-report').doc(req.body.panNumber).set({
                    request: req.body,
                    response: requestData.data,
                    timestamp: Date.now(),
                    date: new Date().toISOString().slice(0, 10),
                    bankId: token.bankId,
                    userEmail: token.email,
                    status: 'success',
                    statusMessage: requestData.data.message,
                });

                res.send({
                    success: `${requestData.data.message} for PAN ${req.body.panNumber}.`,
                    data: requestData.data.data
                });
            } else {
                responseObj = {
                    message: requestData.data.message,
                    status: 'error',
                }
                res.send({ error: requestData.data.message });
            }
        } catch (e) {
            responseObj = {
                message: e.toString(),
                status: 'error',
            }
            console.log(e);
            res.send({ error: e.toString() });
        } finally {
            await db.collection(token.bankId).doc('wallet').collection('api-usage').add({
                type: 'Equifax CIBIL Report',
                panNumber: req.body.panNumber,
                name: req.body.name,
                phone: req.body.mobileNumber,
                timestamp: Date.now(),
                date: new Date().toISOString().slice(0, 10),
                userEmail: token.email,
                amount: walletInfo.data().configuration.equifaxCIBIL.cost,
                ...responseObj,
            });
        }

    });

    app.post('/api/tools-test/cibi-score-api-uat-testing', async function (req, res) {

        const jwtSecretKey = 'UTA5U1VEQXdNREF4VFZSSmVrNUVWVEpPZWxVd1RuYzlQUT09';
        const authKey = 'TVRJek5EVTJOelUwTnpKRFQxSlFNREF3TURFPQ==';
        const APIUrl = 'https://uat.paysprint.in/sprintverify-uat/api/v1/verification/credit_report_checker';

        let jwtPayload = {
            timestamp: Date.now(),
            partnerId: "CORP00001",
            reqid: generateRandomNumber(8) //(send a unique intiger for each request)
        };
        let jwtToken = jwt.sign(jwtPayload, jwtSecretKey, {
            algorithm: "HS256",
        });


        const options = {
            method: 'POST',
            url: APIUrl,
            headers: {
                accept: 'application/json',
                Token: jwtToken,
                authorisedkey: authKey,
                'content-type': 'application/json'
            },
            data: {
                refid: generateRandomNumber(9),
                name: req.body.name,
                mobile: req.body.mobileNumber,
                document_id: req.body.panNumber,
                date_of_birth: req.body.dateOfBirth,
                address: req.body.address,
                pincode: req.body.pincode,
            }
        };

        try {
            const requestData = await axios(options);
            if (requestData.data.statuscode === 200 && requestData.data.status === true) {
                res.send({
                    success: `${requestData.data.message} for PAN ${req.body.panNumber}.`,
                    data: requestData.data.data
                });
            } else {
                res.send({ error: requestData.data.message });
            }
        } catch (e) {
            res.send({ error: e.toString() });
        }
    });
}

function generateRandomNumber(length) {
    const characters = '0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters.charAt(randomIndex);
    }
    return result;
}