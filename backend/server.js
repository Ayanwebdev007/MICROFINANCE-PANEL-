const express = require('express');
const helmet = require("helmet");
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

// Standardized Firebase Initialization
const SERVICE_ACCOUNT_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS || './service_account.json';
try {
  const resolvedPath = path.resolve(__dirname, SERVICE_ACCOUNT_PATH);
  if (fs.existsSync(resolvedPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(resolvedPath));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: 'microfinance-db'
    });
    console.log('Firebase initialized with Service Account.');
  } else {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: 'microfinance-db'
    });
    console.log('Firebase initialized with Application Default Credentials.');
  }
} catch (e) {
  console.error('Firebase Initialization Error:', e.message);
}

const db = admin.firestore();
const auth = admin.auth();

const INACTIVITY_TIMEOUT = 12 * 60 * 60 * 1000; // 12 hours

// Middleware to check for user inactivity
const inactivityCheck = async (req, res, next) => {
  const sessionCookie = req.cookies.session || "";
  if (!sessionCookie) {
    return next(); // No cookie, proceed to the endpoint which will handle authorization
  }

  try {
    const decodedToken = await auth.verifySessionCookie(sessionCookie, false);
    const userSessionRef = db.collection('userSessions').doc(decodedToken.uid);
    const userSession = await userSessionRef.get();

    if (userSession.exists) {
      const lastActivity = userSession.data().lastActivity;

      if (Date.now() - lastActivity > INACTIVITY_TIMEOUT) {
        // User is inactive, log them out
        await auth.revokeRefreshTokens(decodedToken.uid);
        await userSessionRef.delete(); // Clean up session doc
        res.clearCookie('session', { httpOnly: true, secure: true, sameSite: 'none' });
        return res.status(401).send({ error: 'Session expired due to inactivity.' });
      } else {
        // User is active, update the timestamp and attach user to request
        if (req.path !== '/wallet/balance') {
          await userSessionRef.update({ lastActivity: Date.now() });
        }
        if (decodedToken.bankId) {
          req.user = decodedToken;
          return next();
        } else {
          return res.status(401).send({ error: 'You are not authorized. Please log in.' });
        }
      }
    } else {
      // Session doc doesn't exist, might be a login request or an anomaly
      req.user = decodedToken;
      return next();
    }
  } catch (err) {
    // Session cookie is invalid (e.g., expired), clear it
    res.clearCookie('session', { httpOnly: true, secure: true, sameSite: 'none' });
    return next();
  }
};

// Initialize packages or middlewares
const server = express();
const PORT = process.env.PORT || 3001;

server.set('trust proxy', 1); // Trust the first hop from the proxy

server.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

const cors = require('cors');

// Middlewares
server.use(cors({
  origin: ['https://microfinance-frontend01.onrender.com', 'http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
server.use(express.static("public"));
server.use(bodyParser.json({ limit: "5mb" }));
server.use(bodyParser.urlencoded({ extended: true }));
server.use(cookieParser());

// Debug Middleware
server.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Origin: ${req.get('Origin')} - Cookie Present: ${!!req.cookies.session}`);
  next();
});

server.use('/api', inactivityCheck);

server.get("/", function (req, res) {
  res.send("Microfinance Backend is Running.");
});

// Routes
require('./routes/auth/authRoute')(server);
require('./routes/auth/dashboard')(server);
require('./routes/member/member')(server);
require('./routes/member/group')(server);
require('./routes/member/printKyc')(server);

require('./routes/advisor/advisor')(server);

require('./routes/employee/employee')(server);

require('./routes/deposit/opening')(server);
require('./routes/deposit/general')(server);
require('./routes/deposit/transaction')(server);

require('./routes/loan/general')(server);
require('./routes/loan/foreClose')(server);
require('./routes/loan/loanOpening')(server);
require('./routes/loan/loanTransaction')(server);

require('./routes/authorization/paymentInstruction')(server);
require('./routes/authorization/deposit')(server);
require('./routes/authorization/loan')(server);
require('./routes/authorization/voucher')(server);
require('./routes/authorization/journal')(server);

require('./routes/reports/general/dayBook')(server);
require('./routes/reports/general/cashAccount')(server);
require('./routes/reports/loan/repayment')(server);
require('./routes/reports/loan/cpWiseEWI')(server);
require('./routes/reports/deposit/detailList')(server);

require('./routes/journal/general')(server);
require('./routes/journal/generalVoucher')(server);

require('./routes/admin/bank')(server);
require('./routes/admin/user')(server);
require('./routes/admin/dataReset')(server);
require('./routes/admin/dataMigration')(server);
require('./routes/admin/society')(server);

require('./routes/mobileApp/userSignup')(server);
require('./routes/mobileApp/transactions')(server);

require('./routes/tools/branch')(server);
require('./routes/tools/branchUser')(server);
require('./routes/tools/cibiAPI')(server);
require('./routes/tools/iterator')(server);
require('./routes/tools/employee')(server);

require('./routes/user/userProfile')(server);

require('./routes/savings/general')(server);

// Internal Utility! Strictly for Development Use Only!
require('./routes/helper/copyGLCodes')(server);
require('./routes/helper/createAdmin')(server);

server.get("*", function (req, res) {
  res.status(404).send("API Endpoint Not Found");
});

server.listen(PORT, function () {
  console.log(`Server started on http://localhost:${PORT}`);
});