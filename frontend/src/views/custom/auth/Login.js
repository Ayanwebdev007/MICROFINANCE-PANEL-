// /*!
//
// =========================================================
// * Black Dashboard PRO React - v1.2.4
// =========================================================
//
// * Product Page: https://www.creative-tim.com/product/black-dashboard-pro-react
// * Copyright 2024 Creative Tim (https://www.creative-tim.com)
//
// * Coded by Creative Tim
//
// =========================================================
//
// * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
import React from "react";
import {
    Input,
    Container,
    Form,
    Spinner,
} from "reactstrap";
import {FaCalculator, FaChartLine, FaFileAlt, FaCog} from "react-icons/fa";
import logo from "../../../assets/img/apple-touch-icon.png";
import {
    getAuth,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
} from "firebase/auth";
import axios from "axios";
import {useNavigate} from "react-router-dom";
import {useDispatch} from "react-redux";
import {getAuthState} from "../../../reducers/authReducer";
import CstNotification from "../components/CstNotification";

const Login = () => {
    const [progressbar, setProgressbar] = React.useState(false);
    const [userInput, setUserInput] = React.useState({email: "", password: "", otp: '', idToken: ''});
    const [resetPassword, setResetPassword] = React.useState(false);
    const [twoFA, setTwoFA] = React.useState(false);

    const [alert, setAlert] = React.useState({
        color: 'success',
        message: '',
        autoDismiss: 7,
        place: 'tc',
        timestamp: new Date().getTime(),
    });

    const auth = getAuth();
    const navigate = useNavigate();
    const authDispatch = useDispatch();

    const showAlert = (color, message, autoDismiss = 7) => {
        if (message.includes("active session") || message.includes("Wait 5 minutes")) {
            message = "You're already logged in elsewhere. Wait 5 minutes or contact support.";
            autoDismiss = 15;
        }

        setAlert({
            color,
            message,
            autoDismiss,
            place: 'tc',
            timestamp: new Date().getTime(),
        });
    };

    const signInWithFirebase = async (e) => {
        e.preventDefault();

        const email = userInput.email;
        const password = userInput.password;
        setAlert({
            color: 'success',
            message: '',
            autoDismiss: 7,
            place: 'tc',
            timestamp: null,
        });

        if (email && password) {
            setProgressbar(true);
            if (userInput.idToken){
                createSessionWithBackend(userInput.idToken, userInput.otp);
            }else {
                signInWithEmailAndPassword(auth, email, password)
                    .then(async function ({user}) {
                        const idToken = await user.getIdToken();
                        createSessionWithBackend(idToken, '');
                    }).catch(function () {
                    setAlert({
                        color: 'danger',
                        message: 'Invalid credential. Please enter valid username or password to continue',
                        autoDismiss: 7,
                        place: 'tc',
                        timestamp: new Date().getTime(),
                    });
                    setProgressbar(false);
                });
            }
        } else {
            setAlert({
                color: 'warning',
                message: 'Please fill username and password',
                autoDismiss: 7,
                place: 'tc',
                timestamp: new Date().getTime(),
            });
        }
    };

    function createSessionWithBackend(idToken, otp) {
        axios.post('/sessionLogin', {idToken: idToken, otp: otp})
            .then(function (loginData) {
                if (loginData.data.twoFactorAuth === true){
                    setTwoFA(true);
                    setUserInput({...userInput, idToken: idToken});
                } else if (loginData.data.status === 'success') {
                    authDispatch(getAuthState(loginData.data.data));
                    navigate("/admin/dashboard");
                    document.body.classList.toggle("dark-content");
                } else {
                    setAlert({
                        color: 'danger',
                        message: 'Failed to login. Please try again later.',
                        autoDismiss: 7,
                        place: 'tc',
                        timestamp: new Date().getTime(),
                    });
                }
                setProgressbar(false);
            }).catch(function (e) {
            if (e.response && (e.response.status === 401 || e.response.status === 403)) {
                setAlert({
                    color: 'danger',
                    message: e.response.data.message || 'Unauthorised Request. Please try again later',
                    autoDismiss: 15,
                    place: 'tc',
                    timestamp: new Date().getTime(),
                });
            } else {
                setAlert({
                    color: 'danger',
                    message: e.response?.data?.message || 'Something went wrong. Please try again later',
                    autoDismiss: 7,
                    place: 'tc',
                    timestamp: new Date().getTime(),
                });
            }
            setProgressbar(false);
        });
    }

    function resetPasswordWithFirebase() {
        setProgressbar(true);
        sendPasswordResetEmail(auth, userInput.email)
            .then(function () {
                setProgressbar(false);
                setAlert({
                    color: 'success',
                    message: 'Password reset email sent. Please check your email.',
                    autoDismiss: 7,
                    place: 'tc',
                    display: false,
                    timestamp: new Date().getTime(),
                });
            }).catch(function (e) {
            setProgressbar(false);
            setAlert({
                color: 'danger',
                message: e.toLocaleString(),
                autoDismiss: 7,
                place: 'tc',
                display: true,
                timestamp: new Date().getTime(),
            });
        });
    }

    return (
        <div style={{backgroundColor: "#f5f7f9", minHeight: "100vh"}}>
            <div className="rna-container">
                {alert.message && <CstNotification
                    color={alert.color}
                    message={alert.message}
                    autoDismiss={alert.autoDismiss}
                    place={alert.place}
                    timestamp={alert.timestamp}
                />}
            </div>

            <Container
                fluid
                className="d-flex justify-content-center align-items-center"
                style={{minHeight: "100vh", padding: "1rem"}}
            >
                <div className="login-card">
                    {/* Left Side - Login Form */}
                    {twoFA ?
                        <div className="login-left">
                            <form className="d-flex flex-column align-items-center" onSubmit={signInWithFirebase}>
                                <img src={logo} alt="Finalan Logo" style={{height: "60px", marginBottom: "1rem"}}/>
                                <h2 style={{fontSize: "1.8rem", fontWeight: "700", color: "#0066cc"}}>mPanel</h2>
                                <p style={{fontSize: "1.2rem", color: "#555", textAlign: "center"}}>
                                    Enter the 6-digit code sent to your email
                                </p>

                                <div style={{display: 'flex', justifyContent: 'center', gap: '8px', margin: '20px 0'}}>
                                    {[1, 2, 3, 4, 5, 6].map((_, index) => (
                                        <input
                                            key={index}
                                            type="text"
                                            maxLength={1}
                                            style={{
                                                width: '45px',
                                                height: '45px',
                                                fontSize: '24px',
                                                textAlign: 'center',
                                                border: '2px solid #ddd',
                                                borderRadius: '8px',
                                                margin: '0 4px'
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Backspace' && !e.currentTarget.value) {
                                                    const prev = e.currentTarget.previousElementSibling;
                                                    if (prev) {
                                                        prev.focus();
                                                        prev.select();
                                                    }
                                                }
                                            }}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (/^\d*$/.test(val)) {
                                                    const next = e.currentTarget.nextElementSibling;
                                                    if (next && val) {
                                                        next.focus();
                                                    }

                                                    // Get all OTP input values and combine them
                                                    const inputs = e.currentTarget.parentElement.querySelectorAll('input');
                                                    const otp = Array.from(inputs).map(input => input.value).join('');
                                                    setUserInput(prev => ({...prev, otp}));
                                                } else {
                                                    e.target.value = '';
                                                }
                                            }}
                                        />
                                    ))}
                                </div>
                                <button
                                    style={{
                                        width: "100%",
                                        backgroundColor: "#0066cc",
                                        color: "#fff",
                                        border: "none",
                                        padding: "1rem",
                                        fontSize: "1.2rem",
                                        fontWeight: "600",
                                        borderRadius: "8px",
                                        cursor: "pointer",
                                        marginTop: "20px",
                                        position: "relative",
                                    }}
                                    disabled={progressbar}
                                    type="submit"
                                >
                                    {progressbar ? <Spinner size="sm" color="light"/> : "Verify OTP"}
                                </button>
                            </form>
                        </div>
                        :
                        <div className="login-left">
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                marginBottom: "1.5rem",
                            }}
                        >
                            <img
                                src={logo}
                                alt="Finalan Logo"
                                style={{height: "60px", marginRight: "1rem"}}
                            />
                            <div>
                                <h2
                                    style={{
                                        margin: 0,
                                        fontSize: "2rem",
                                        fontWeight: "700",
                                        color: "#0066cc",
                                    }}
                                >
                                    mPanel
                                </h2>
                                <p style={{margin: 0, fontSize: "1rem", color: "#555"}}>
                                    Powering Banks & NBFCs
                                </p>
                            </div>
                        </div>

                        <h3
                            style={{
                                fontSize: "1.6rem",
                                fontWeight: "600",
                                marginBottom: "2rem",
                            }}
                        >
                            Loan Management Software
                        </h3>

                        <Form onSubmit={signInWithFirebase}>
                            <div className="form-group mb-4">
                                <label
                                    htmlFor="email"
                                    style={{fontSize: "1.1rem", fontWeight: "500"}}
                                >
                                    Email / Username
                                </label>
                                <Input
                                    id="email"
                                    type="text"
                                    placeholder="Enter your email or username"
                                    value={userInput.email}
                                    onChange={(e) =>
                                        setUserInput({...userInput, email: e.target.value})
                                    }
                                    style={{
                                        borderRadius: "8px",
                                        padding: "1rem",
                                        fontSize: "1rem",
                                    }}
                                />
                            </div>

                            {!resetPassword && (
                                <div className="form-group mb-4">
                                    <label
                                        htmlFor="password"
                                        style={{fontSize: "1.1rem", fontWeight: "500"}}
                                    >
                                        Password
                                    </label>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="Enter your password"
                                        value={userInput.password}
                                        onChange={(e) =>
                                            setUserInput({...userInput, password: e.target.value})
                                        }
                                        style={{
                                            borderRadius: "8px",
                                            padding: "1rem",
                                            fontSize: "1rem",
                                        }}
                                    />
                                </div>
                            )}

                            <div className="d-flex justify-content-end mb-4">
                                <a
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setResetPassword(true); // 👈 TOGGLE STATE, NOT TRIGGER RESET
                                    }}
                                    style={{
                                        fontSize: "1rem",
                                        color: "#0066cc",
                                        textDecoration: "none",
                                    }}
                                >
                                    Forgot Password?
                                </a>
                            </div>

                            {resetPassword ? (
                                <button
                                    type="button"
                                    onClick={resetPasswordWithFirebase}
                                    style={{
                                        width: "100%",
                                        backgroundColor: "#0066cc",
                                        color: "#fff",
                                        border: "none",
                                        padding: "1rem",
                                        fontSize: "1.2rem",
                                        fontWeight: "600",
                                        borderRadius: "8px",
                                        cursor: "pointer",
                                        marginBottom: "1rem",
                                        position: "relative",
                                    }}
                                    disabled={progressbar}
                                >
                                    {progressbar ? <Spinner size="sm" color="light"/> : "Reset Password"}
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    style={{
                                        width: "100%",
                                        backgroundColor: "#0066cc",
                                        color: "#fff",
                                        border: "none",
                                        padding: "1rem",
                                        fontSize: "1.2rem",
                                        fontWeight: "600",
                                        borderRadius: "8px",
                                        cursor: "pointer",
                                        marginBottom: "1rem",
                                        position: "relative",
                                    }}
                                    disabled={progressbar}
                                >
                                    {progressbar ? <Spinner size="sm" color="light"/> : "Login"}
                                </button>
                            )}

                            {resetPassword && (
                                <div className="d-flex justify-content-center mt-3">
                                    <a
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setResetPassword(false);
                                        }}
                                        style={{
                                            fontSize: "0.95rem",
                                            color: "#666",
                                            textDecoration: "underline",
                                        }}
                                    >
                                        ← Back to Login
                                    </a>
                                </div>
                            )}
                        </Form>

                        {/* Mobile Only Free Trial + Signup + Highlights + Help */}
                        <div className="mobile-trial-signup">
                            <p className="trial-text">Get 30 days free trial</p>
                            <button className="signup-btn"
                                    onClick={() => showAlert("success", "Contact US for free Trial")}
                            >Sign Up</button>

                            <h4 className="section-title">Product Highlights</h4>
                            <ul className="highlights-list mobile-highlights">
                                {[
                                    {icon: <FaCalculator/>, text: "Loan Calculator"},
                                    {icon: <FaChartLine/>, text: "EMI Tracker"},
                                    {icon: <FaFileAlt/>, text: "Reports"},
                                    {icon: <FaCog/>, text: "Settings"},
                                ].map((item, i) => (
                                    <li key={i} className="highlight-item">
                                        <span className="highlight-icon">{item.icon}</span>
                                        {item.text}
                                    </li>
                                ))}
                            </ul>

                            <h4 className="section-title">Need Help?</h4>
                            <p className="help-text">+91 80161 92445</p>
                          <p className="help-text">
                            Email:{" "}
                            <a href="mailto:support@finalantechno.com" className="help-link">
                              support@finalantechno.com
                            </a>
                          </p>
                          <p className="help-text">
                            Website:{" "}
                            <a
                              href="https://www.finalantechno.com"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="help-link"
                            >
                              www.finalantechno.com
                            </a>
                          </p>
                        </div>
                    </div>}

                    {/* Right Side - Desktop Only */}
                    <div className="login-right">
                        <h4
                            style={{
                                fontSize: "1.25rem",
                                fontWeight: "600",
                                marginBottom: "1.5rem",
                            }}
                        >
                            Get 30 Days Free Trial
                        </h4>
                        <button
                            style={{
                                backgroundColor: "#0066cc",
                                color: "#fff",
                                border: "none",
                                borderRadius: "8px",
                                width: "100%",
                                padding: "0.9rem",
                                fontSize: "1.1rem",
                                fontWeight: "600",
                                cursor: "pointer",
                            }}
                            onClick={() => showAlert("success", "Contact US for free Trial")}
                        >
                            Sign Up
                        </button>

                        <h4
                            style={{
                                fontSize: "1.25rem",
                                fontWeight: "600",
                                margin: "2rem 0 1rem",
                            }}
                        >
                            Product Highlights
                        </h4>

                        <ul className="highlights-list">
                            {[
                                {icon: <FaCalculator/>, text: "Loan Calculator"},
                                {icon: <FaChartLine/>, text: "EMI Tracker"},
                                {icon: <FaFileAlt/>, text: "Reports"},
                                {icon: <FaCog/>, text: "Settings"},
                            ].map((item, i) => (
                                <li key={i} className="highlight-item">
                                    <span className="highlight-icon">{item.icon}</span>
                                    {item.text}
                                </li>
                            ))}
                        </ul>

                      <h4
                        style={{
                          fontSize: "1.25rem",
                          fontWeight: "600",
                          marginTop: "2rem",
                          marginBottom: "0.5rem",
                        }}
                      >
                        Need Help?
                      </h4>

                      <p
                        style={{
                          fontSize: "1.1rem",
                          color: "#555",
                          fontWeight: "500",
                        }}
                      >
                        Phone:{" "}
                        <a href="tel:+918016192445" style={{ color: "#007bff", textDecoration: "none" }}>
                          +91 80161 92445
                        </a>
                      </p>
                      <p
                        style={{
                          fontSize: "1.1rem",
                          color: "#555",
                          fontWeight: "500",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Email:{" "}
                        <a
                          href="mailto:support@finalantechno.com"
                          style={{ color: "#007bff", textDecoration: "none" }}
                        >
                          support@finalantechno.com
                        </a>
                      </p>


                      <p
                        style={{
                          fontSize: "1.1rem",
                          color: "#555",
                          fontWeight: "500",
                        }}
                      >
                        Website:{" "}
                        <a
                          href="https://www.finalantechno.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "#007bff", textDecoration: "none" }}
                        >
                          www.finalantechno.com
                        </a>
                      </p>



                    </div>
                </div>
            </Container>

            {/*  responsive styles */}
            <style>
                {`
        .login-card {
          display: flex;
          border-radius: 16px;
          background: #fff;
          width: 100%;
          max-width: 1100px;
          min-height: 750px;
          box-shadow: 0 8px 30px rgba(0,0,0,0.12);
          overflow: hidden;
        }
        .login-left {
          flex: 2;
          padding: 3rem;
        }
        .login-right {
          flex: 1;
          padding: 3rem;
          border-left: 1px solid #eee;
        }

        /* Highlights List */
        .highlights-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .highlight-item {
          display: flex;
          align-items: center;
          margin-bottom: 1rem;
          font-size: 1.05rem;
          color: #555;
        }
        .highlight-icon {
          color: #0066cc;
          margin-right: 0.75rem;
          font-size: 1.3rem;
        }

        /* Mobile overrides */
        @media (max-width: 768px) {
          .login-card {
            flex-direction: column;
            max-width: 95%;
            min-height: auto;
          }
          .login-right {
            display: none;
          }
          .login-left {
            padding: 1.5rem;
          }

.login-left h3 {
  font-size: 1.15rem !important;
  white-space: nowrap;
  overflow: visible;
  text-overflow: clip;
  margin: 0 0 2rem 0;
  line-height: 1.3;
}

          .mobile-trial-signup {
            margin-top: 0.5rem;
            display: block;
          }
          .mobile-trial-signup .trial-text {
            font-size: 1rem;
            font-weight: 600;
            text-align: center;
            margin: 0.5rem 0;
          }
          .mobile-trial-signup .signup-btn {
            background-color: #0066cc;
            color: #fff;
            border: none;
            border-radius: 8px;
            padding: 0.7rem 1.5rem;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            display: block;
            margin: 0.5rem auto 1rem;
          }
          .mobile-trial-signup .section-title {
            font-size: 1.1rem;
            font-weight: 600;
            margin: 1.2rem 0 0.5rem;
          }
          .mobile-highlights {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.1rem 1rem;
            margin: 0;
            padding: 0;
            list-style: none;
          }
          .mobile-highlights .highlight-item {
            display: flex;
            align-items: center;
            font-size: 0.95rem;
            color: #333;
          }
          .mobile-highlights .highlight-icon {
            color: #0066cc;
            margin-right: 0.5rem;
            font-size: 1.1rem;
          }
          .mobile-trial-signup .help-text {
            font-size: 1rem;
            font-weight: 500;
            color: #555;
            margin-top: 0.3rem;
          }
   
.mobile-trial-signup .section-title:nth-of-type(2) {
  text-align: center;
}

.mobile-trial-signup .help-text {
  text-align: center;
}
        }
        

        @media (min-width: 769px) {
          .mobile-trial-signup {
            display: none;
          }
        }
      `}
            </style>
        </div>
    );
};

export default Login;