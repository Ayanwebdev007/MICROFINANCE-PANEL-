const express = require('express');
const helmet = require("helmet");
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");

const { applicationDefault } = require("firebase-admin/app");

require('dotenv').config();

initializeApp({
  credential: applicationDefault(),
  projectId: 'microfinance-db'
});

const db = getFirestore();

const INACTIVITY_TIMEOUT = 15 * 60 * 1000;

// Middleware to check for user inactivity
const inactivityCheck = async (req, res, next) => {
  const sessionCookie = req.cookies.session || "";
  if (!sessionCookie) {
    return next(); // No cookie, proceed to the endpoint which will handle authorization
  }

  try {
    const decodedToken = await getAuth().verifySessionCookie(sessionCookie, false);
    const userSessionRef = db.collection('userSessions').doc(decodedToken.uid);
    const userSession = await userSessionRef.get();

    if (userSession.exists) {
      const lastActivity = userSession.data().lastActivity;

      if (Date.now() - lastActivity > INACTIVITY_TIMEOUT) {
        // User is inactive, log them out
        await getAuth().revokeRefreshTokens(decodedToken.uid);
        await userSessionRef.delete(); // Clean up session doc
        res.clearCookie('session');
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
    res.clearCookie('session');
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
server.use(cors()); // Allow all origins for now (or specify frontend url)
server.use(express.static("public"));
server.use(bodyParser.json({ limit: "5mb" }));
server.use(bodyParser.urlencoded({ extended: true }));
server.use(cookieParser());

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