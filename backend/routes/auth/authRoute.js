const admin = require('firebase-admin');
const axios = require("axios");
const db = admin.firestore();
const auth = admin.auth();

module.exports = app => {
    app.post("/sessionLogin", async function (req, res) {
        const idToken = req.body.idToken?.toString();
        const expiresIn = 15 * 60 * 60 * 1000; // 15 hours in milliseconds
        const date = new Date().toISOString().slice(0, 10);

        if (!idToken) {
            return res.status(400).send("ID token is missing");
        }

        try {
            const decodedIdToken = await auth.verifyIdToken(idToken);
            const authAge = (Date.now() / 1000) - decodedIdToken.auth_time;

            if (authAge >= 3600) { // 1 hour tolerance
                return res.status(401).send("Invalid Credential!");
            }

            const bankId = decodedIdToken.bankId;
            const bankInfoSnap = await db.collection(bankId).doc('admin').collection('bank-info').doc('details').get();
            const userSnap = await db.collection(bankId).doc('admin').collection('users').doc(decodedIdToken.uid).get();

            if (!bankInfoSnap.exists || !userSnap.exists) {
                return res.status(403).send({
                    message: 'Bank or user not found',
                    data: {
                        bankId: '',
                        email: '',
                        role: {},
                        date,
                        permissions: {},
                        module: {},
                        profile: '',
                    }
                });
            }

            // Check if bank is disabled or domain doesn't match
            const bankInfo = bankInfoSnap.data() || {};
            const userInfo = userSnap.data() || {};
            if (req.hostname !== 'localhost' && (bankInfo.disabled || (bankInfo.domain && bankInfo.domain !== req.hostname))) {
                return res.status(403).send({
                    message: 'Bank is disabled or domain is not allowed',
                    data: {
                        bankId: '',
                        email: '',
                        role: {},
                        date,
                        permissions: {},
                        module: {},
                        profile: '',
                        minibar: 'sidebar-min',
                        darkMode: 'dark-content',
                        color: '',
                        bankInfo: {},
                    }
                });
            }

            if (userInfo.twoFAEnabled === true) {
                const userOTPRef = db.collection('User-2FA-OTP').doc(decodedIdToken.uid);
                if (req.body.otp) {
                    const otp = req.body.otp;
                    const userOTP = await userOTPRef.get();

                    if (userOTP.exists) {
                        const timeDiff = (Date.now() - userOTP.data().createdAt) / 1000;
                        if (userOTP.data().otp !== otp || timeDiff > 180) {
                            return res.status(401).send({ error: 'Invalid OTP. Please try again.' });
                        }
                        await userOTPRef.delete();
                    } else {
                        return res.status(401).send({ error: 'Invalid OTP. Please try again.' });
                    }
                } else {
                    const otp = Math.floor(100000 + Math.random() * 900000);
                    await userOTPRef.set({
                        otp: otp.toString(),
                        createdAt: Date.now(),
                    });
                    const getAPIKeyMapping = await db.collection('admin').doc('organization').collection('api-key-mapping').doc('whatsapp').get();
                    const apiKey = getAPIKeyMapping.data()?.[req.body.hostname] || '65aE8dYeivaylabCRjl1';
                    const message = `Your OTP for to login is: ${otp}`;
                    axios.get(`https://www.msgwapi.com/api/whatsapp/send?receiver=91${userInfo.phone}&msgtext=${message}&token=${apiKey}`)
                        .catch(error => console.error('Error sending message:', error));

                    return res.send({
                        message: 'Two Factor Authentication is enabled. OTP is sent to your registered phone number (WhatsApp chat). Please verify your account.',
                        twoFactorAuth: true
                    });
                }
            }

            const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
            const options = { maxAge: expiresIn, httpOnly: true, secure: true, sameSite: 'none' };
            // const options = { maxAge: expiresIn, httpOnly: true};

            // Overwrite existing session if it exists (Allow re-login)
            const userSessionRef = db.collection('userSessions').doc(decodedIdToken.uid);

            // Save session info to Firestore
            await userSessionRef.set({
                lastActivity: Date.now(),
                session: sessionCookie,
            });

            // Set session cookie
            res.cookie('session', sessionCookie, options);

            const profileObj = {
                bankId,
                email: decodedIdToken.email,
                role: (decodedIdToken.role === 'root' || decodedIdToken.role === 'admin') ? 'admin' : 'user',
                date,
                name: userInfo.name,
                permissions: userInfo.permissions || {},
                accessLevel: userInfo.accessLevel || {},
                module: bankInfo.module || {},
                profile: userInfo.profilePic || '',
                minibar: userInfo.minibar || 'sidebar-min',
                darkMode: userInfo.darkMode || 'dark-content',
                color: userInfo.color || '',
                bankInfo: bankInfo || {},
            };

            return res.status(200).send({ status: 'success', data: profileObj, sessionToken: sessionCookie });

        } catch (error) {
            console.error("Login error:", error);
            return res.status(401).send("Unauthorized Request!");
        }
    });


    app.get('/sessionLogout', async (req, res) => {
        const session = req.cookies.session;
        if (!session) {
            return res.redirect('/');
        }

        try {
            // Decode the session cookie to get the uid
            const decodedToken = await auth.verifySessionCookie(session);
            const uid = decodedToken.uid;

            // Revoke tokens and delete session record
            await auth.revokeRefreshTokens(uid);
            await db.collection('userSessions').doc(uid).delete();

            // Clear cookie
            res.clearCookie('session');

            return res.redirect('/');
        } catch (error) {
            console.error('Error during logout:', error.message || error);
            return res.redirect('/');
        }
    });

    app.get('/api/auth/get-user', async function (req, res) {
        const token = req.user;
        if (!token) return res.status(401).send({ error: 'You are not authorized. Please log in.' });
        const date = new Date().toISOString().slice(0, 10);

        try {
            const bankInfo = await db.collection(token.bankId).doc('admin').collection('bank-info').doc('details').get();
            const getUser = await db.collection(token.bankId).doc('admin').collection('users').doc(token.uid).get();
            const userInfo = getUser.data() || {};
            if (bankInfo.data().disabled || (bankInfo.data().domain && req.hostname !== bankInfo.data().domain)) {
                res.status(403).send({
                    loggedIn: false,
                    bankId: "",
                    email: "",
                    name: "",
                    permissions: {},
                    bankInfo: {},
                });
                return;
            }
            const profileObj = {
                bankId: token.bankId,
                email: token.email,
                name: userInfo.name,
                role: (token.role === 'root' || token.role === 'admin') ? 'admin' : 'user',
                date: date,
                permissions: userInfo.permissions || {},
                accessLevel: userInfo.accessLevel || {},
                module: bankInfo.data().module || {},
                profile: userInfo.profilePic || '',
                minibar: userInfo.nimibar || 'sidebar-min',
                darkMode: userInfo.darkMode || 'dark-content',
                color: userInfo.color || '',
                bankInfo: bankInfo.data() || {},
            }
            res.send(profileObj);

        } catch (error) {
            res.status(403).send({
                loggedIn: false,
                bankId: "",
                email: "",
                name: "",
                permissions: {},
                accessLevel: {},
                bankInfo: {},
            });
        }
    });

    app.get('/open-api/auth/get-domain-branding', async function (req, res) {
        const getDomainBranding = await db.collection('admin').doc('organization').collection('domain-branding').doc(req.hostname).get();
        if (getDomainBranding.exists) {
            res.send({
                success: 'Successfully fetched branding',
                data: {
                    favicon: getDomainBranding.data().favicon,
                    branding: getDomainBranding.data().branding,
                }
            });
        } else {
            res.send({
                error: 'Branding not found'
            });
        }
    });

    app.get('/api/auth/get-subscription-validity', async function (req, res) {
        const token = req.user;
        if (!token) return res.status(401).send({ error: 'You are not authorized. Please log in.' });

        try {
            const bankInfo = await db.collection(token.bankId).doc('admin').collection('bank-info').doc('details').get();
            if ((new Date(bankInfo.data().renewDate) - new Date()) < 7 * 24 * 60 * 60 * 1000) {
                res.send({
                    valid: false,
                    renewDate: bankInfo.data().renewDate,
                    daysLeft: Math.floor((new Date(bankInfo.data().renewDate) - new Date()) / (1000 * 60 * 60 * 24)),
                });
            } else {
                res.send({
                    valid: true,
                    renewDate: bankInfo.data().renewDate,
                });
            }
        } catch (error) {
            res.status(403).send({ error: 'You are not authorized. Please log in.' });
        }
    });
};
