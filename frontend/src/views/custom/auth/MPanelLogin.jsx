import React from "react";
import {
    Input,
    Container,
    Form,
    Spinner,
    Button,
    FormGroup,
} from "reactstrap";
import {
    FaEye,
    FaEyeSlash,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";

import logo from "../../../assets/img/MPANELogo.png";
import googleCloudSecure from "../../../assets/img/secureImage.png"
import {
    getAuth,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
} from "firebase/auth";
import axios from "axios";
import { getAuthState } from "../../../reducers/authReducer";
import CstNotification from "../components/CstNotification";

const COLORS = {
    primary: "#0b78f0",
    accent: "#64b5f6",
    textLight: "#ccd9eb",
    textMuted: "#a0b9d9",
    cardBg: "rgba(255, 255, 255, 0.95)",
    success: "#48bb78",
    warning: "#ecc94b",
    danger: "#f56565",
};


const MobileLogoSection = () => (
    <div className="mobile-logo-section">
        <div className="logo-wrapper">
            <img src={logo} alt="mPANEL Logo" className="logo-img" />
            {/*<h2 className="logo-title">*/}
            {/*  <span className="logo-panel">MPANEL</span>*/}
            {/*</h2>*/}
        </div>
    </div>
);

const DesktopLogoSection = () => (
    <div className="desktop-logo-section">
        <div className="logo-wrapper">
            <img src={logo} alt="mPANEL Logo" className="logo-img" />
            {/*<h2 className="logo-title">*/}
            {/*  <span className="logo-panel">MPANEL</span>*/}
            {/*</h2>*/}
        </div>
    </div>
);

const MobileHelpSection = () => (
    <div className="mobile-help-section">
        <img src={googleCloudSecure} alt="googleCloudeSecureImage" className="bottom-img" />
    </div>
);

const MPanelLogin = () => {
    const [progressbar, setProgressbar] = React.useState(false);
    const [userInput, setUserInput] = React.useState({ email: "", password: "" });
    const [showPassword, setShowPassword] = React.useState(false);
    const [resetPassword, setResetPassword] = React.useState(false);
    const [twoFA, setTwoFA] = React.useState(false);
    const [alert, setAlert] = React.useState({
        color: "success",
        message: "",
        autoDismiss: 7,
        place: "tc",
        timestamp: Date.now(),
    });

    const auth = getAuth();
    const navigate = useNavigate();
    const authDispatch = useDispatch();

    const showAlert = React.useCallback(
        (color, message, autoDismiss = 7) => {
            let msg = message;
            if (msg.includes("active session") || msg.includes("Wait 5 minutes")) {
                msg =
                    "You're already logged in elsewhere. Wait 5 minutes or contact support.";
                autoDismiss = 15;
            }
            setAlert({
                color,
                message: msg,
                autoDismiss,
                place: "tc",
                timestamp: Date.now(),
            });
        },
        []
    );

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
            if (userInput.idToken) {
                createSessionWithBackend(userInput.idToken, userInput.otp);
            } else {
                signInWithEmailAndPassword(auth, email, password)
                    .then(async function ({ user }) {
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

    async function subscriptionCheck() {
        axios.get("/api/auth/get-subscription-validity").then((data) => {
            if (data.data?.valid) {
                console.log('Subscription is valid');
            } else if (data.data?.daysLeft < 0) {
                window.alert(`Your subscription has expired. Please renew your subscription to avoid any disruption in service.`);
            } else {
                window.alert(`Your subscription is about to expire in ${data.data?.daysLeft} days. Please renew your subscription.`);
            }
        }).catch(() => {
            console.log('auth state called from backend');
        });
    }

    function createSessionWithBackend(idToken, otp) {
        axios.post('/sessionLogin', { idToken: idToken, otp: otp })
            .then(async function (loginData) {
                if (loginData.data.twoFactorAuth === true) {
                    setTwoFA(true);
                    setUserInput({ ...userInput, idToken: idToken });
                } else if (loginData.data.status === 'success') {
                    if (loginData.data.sessionToken) {
                        localStorage.setItem('sessionToken', loginData.data.sessionToken);
                    }
                    await subscriptionCheck();
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

    const handleResetPassword = React.useCallback(async () => {
        if (!userInput.email) {
            showAlert("warning", "Please enter your email to reset password.");
            return;
        }
        try {
            setProgressbar(true);
            await sendPasswordResetEmail(auth, userInput.email);
            showAlert("success", "Password reset email sent. Check your inbox.");
        } catch (error) {
            showAlert("danger", error?.message || "Failed to send reset email.");
        } finally {
            setProgressbar(false);
        }
    }, [userInput.email, auth, showAlert]);

    return (
        <div className="login-page">
            {alert.message && (
                <div className="global-top-alert">
                    <CstNotification
                        color={alert.color}
                        message={alert.message}
                        autoDismiss={alert.autoDismiss}
                        place={alert.place}
                        timestamp={alert.timestamp}
                    />
                </div>
            )}

            <Container fluid className="login-container">
                <div className="login-wrapper">
                    <main className="login-card" role="main">
                        {twoFA ?
                            <div className="otp-form-container">
                                <form className="otp-form" onSubmit={signInWithFirebase}>
                                    <img src={logo} alt="mPANEL Logo" className="otp-logo" />
                                    <p className="otp-instruction">
                                        Enter the 6-digit code sent to your email
                                    </p>

                                    <div className="otp-inputs">
                                        {[1, 2, 3, 4, 5, 6].map((_, index) => (
                                            <input
                                                key={index}
                                                type="text"
                                                maxLength={1}
                                                className="otp-input"
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

                                                        const inputs = e.currentTarget.parentElement.querySelectorAll('input');
                                                        const otp = Array.from(inputs).map(input => input.value).join('');
                                                        setUserInput(prev => ({ ...prev, otp }));
                                                    } else {
                                                        e.target.value = '';
                                                    }
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <Button
                                        color="info"
                                        type="submit"
                                        disabled={progressbar}
                                        className="btn-animated w-100 otp-submit-btn"
                                        aria-busy={progressbar}
                                    >
                                        {progressbar ? <Spinner size="sm" /> : "Verify OTP"}
                                    </Button>
                                </form>
                            </div>
                            :
                            <div>
                                <DesktopLogoSection />
                                <MobileLogoSection />
                                {/*<header className="login-header">*/}
                                {/*    <h3 className="login-title">Welcome back</h3>*/}
                                {/*    <p className="login-subtitle">Sign in to continue to your dashboard</p>*/}
                                {/*</header>*/}

                                <Form onSubmit={signInWithFirebase} className="login-form" noValidate>
                                    <FormGroup className="input-group-cool">
                                        <div className="input-wrapper">
                                            <label htmlFor="email" className="input-label">Email address</label>
                                            <Input
                                                id="email"
                                                name="email"
                                                type="email"
                                                placeholder="Enter your email"
                                                autoComplete="email"
                                                value={userInput.email}
                                                onChange={(e) => setUserInput({ ...userInput, email: e.target.value })}
                                                className="input-cool form-control-lg email-input"
                                                required
                                            />

                                            <span className="input-border"></span>
                                        </div>
                                    </FormGroup>


                                    {!resetPassword && (
                                        <FormGroup className="input-group-cool password-group-cool">
                                            <div className="input-wrapper">
                                                <label htmlFor="password" className="input-label">Password</label>
                                                <Input
                                                    id="password"
                                                    name="password"
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="Enter your password"
                                                    autoComplete="current-password"
                                                    value={userInput.password}
                                                    onChange={(e) => setUserInput({ ...userInput, password: e.target.value })}
                                                    className="input-cool form-control-lg password-input"
                                                    required
                                                />

                                                <Button
                                                    type="button"
                                                    color="link"
                                                    size="sm"
                                                    onClick={() => setShowPassword((s) => !s)}
                                                    className="password-toggle-cool"
                                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                                >
                                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                                </Button>
                                                <span className="input-border"></span>
                                            </div>
                                        </FormGroup>
                                    )}


                                    <div className="forgot-password">
                                        <button
                                            type="button"
                                            className="link-reset"
                                            onClick={() => setResetPassword(true)}
                                        >
                                            Forgot password?
                                        </button>
                                    </div>


                                    {resetPassword ? (
                                        <Button
                                            color="info"
                                            type="button"
                                            onClick={handleResetPassword}
                                            disabled={progressbar}
                                            className="btn-animated w-100"
                                            aria-busy={progressbar}
                                        >
                                            {progressbar ? (
                                                <>
                                                    <Spinner size="sm" /> Sending...
                                                </>
                                            ) : (
                                                "📧 Send Reset Link"
                                            )}
                                        </Button>
                                    ) : (
                                        <Button
                                            color="info"
                                            type="submit"
                                            disabled={progressbar}
                                            className="btn-animated w-100"
                                            aria-busy={progressbar}
                                        >
                                            {progressbar ? (
                                                <>
                                                    <Spinner size="sm" /> Signing in...
                                                </>
                                            ) : (
                                                "🔓 Sign in"
                                            )}
                                        </Button>
                                    )}

                                    {resetPassword && (
                                        <div className="back-link">
                                            <button
                                                type="button"
                                                className="link-back"
                                                onClick={() => setResetPassword(false)}
                                            >
                                                ← Back to Login
                                            </button>
                                        </div>
                                    )}
                                </Form>
                                <MobileHelpSection />
                            </div>
                        }
                    </main>
                </div>
            </Container>


            <style>{`
            /* ── Brand Colors ─────────────────────────────────────────── */
            .logo-m,
            .brand-m { color: #28a745; font-weight: 700; }
            .logo-panel,
            .brand-panel { color: ${COLORS.accent}; font-weight: 600; }

            /* ── Layout & Page ─────────────────────────────────────────── */
            .login-page {
                min-height: 100vh;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                position: relative;
            }
            .login-page::before {
                content: "";
                position: absolute;
                top: -50%;
                left: -50%;
                width: 200%;
                height: 200%;
                background:
                radial-gradient(circle at 10% 20%, rgba(100, 181, 246, 0.1) 0%, transparent 20%),
            radial-gradient(circle at 90% 80%, rgba(26, 61, 124, 0.2) 0%, transparent 25%),
            radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.03) 0%, transparent 35%);
            pointer-events: none;
            z-index: 0;
            }

            .global-top-alert {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                width: 100%;
                z-index: 9999;
                display: flex;
                justify-content: center;
                align-items: flex-start;
                animation: fadeInDown 0.35s ease-out forwards;
            }
            .global-top-alert > * {
                pointer-events: all;
                margin-top: 10px;
                max-width: 92%;
                width: 420px;
            }

            @keyframes fadeInDown {
                from { opacity: 0; transform: translateY(-20px); }
                to { opacity: 1; transform: translateY(0); }
            }

            /* ── Container & Wrapper ───────────────────────────────────── */
            .login-container {
                flex: 1;
                padding: 2rem;
                display: flex;
                justify-content: center;
                align-items: center;
                position: relative;
                z-index: 2;
               
            }
            .login-wrapper {
                display: flex;
                width: 100%;
                max-width: 1100px;
                gap: 2rem;
                box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
                border-radius: 20px;
                overflow: hidden;
            }
            @media (min-width: 1024px) {
                .login-wrapper {
                    width: 30%;
                    height: 90%;
                    
                }
                .login-container {
                    justify-content: center;
                }
            }

            /* ── Sidebar (Desktop Only) ────────────────────────────────── */
            .login-sidebar {
                position: relative;
                width: 300px;
                padding: 2rem 1.5rem;
                border-radius: 16px;
                border: 1px solid rgba(255,255,255,0.7);
                background:
                radial-gradient(1200px 800px at -10% -30%, rgba(100,181,246,0.18), transparent 60%),
            linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,255,255,0.92));
            overflow: hidden;
            backdrop-filter: blur(6px);
            box-shadow: 0 12px 30px rgba(0,0,0,0.12);
            display: flex;
            flex-direction: column;
            }
            .login-sidebar::after {
                content: "";
                position: absolute;
                inset: -2px;
                background-image:
                linear-gradient(transparent 23px, rgba(0,0,0,0.04) 24px),
            linear-gradient(90deg, transparent 23px, rgba(0,0,0,0.04) 24px);
            background-size: 24px 24px;
            mask: linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 20%, rgba(0,0,0,1) 80%, rgba(0,0,0,0) 100%);
            pointer-events: none;
            }

            .sidebar-hero { margin-bottom: 1.25rem; position: relative; z-index: 1; }
            .brand-title { margin: 0 0 0.25rem 0; font-size: 1.7rem; font-weight: 800; letter-spacing: 0.2px; }
            .tagline { color: #64748b; margin: 0.25rem 0 1rem; font-size: 0.95rem; }

            .pills {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
            }
            .pill {
                font-size: 0.75rem;
                padding: 6px 10px;
                border-radius: 999px;
                background: rgba(49,130,206,0.08);
                border: 1px solid rgba(49,130,206,0.20);
                color: #2b6cb0;
                animation: floaty 6s ease-in-out infinite;
            }
            .pill:nth-child(2) { animation-delay: 0.6s; }
            .pill:nth-child(3) { animation-delay: 1.2s; }
            @keyframes floaty {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-2px); }
            }

            .fancy-nav { margin: 1.2rem 0 1.2rem; position: relative; z-index: 1; }
            .fancy-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px 14px;
                margin: 6px 0;
                border: 1px solid #e6edf6;
                border-radius: 12px;
                background: #ffffff;
                transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
            }
            .fancy-item:hover {
                transform: translateY(-2px);
                border-color: rgba(49,130,206,0.35);
                box-shadow: 0 8px 18px rgba(49,130,206,0.12);
            }
            .fancy-item .nav-icon { color: ${COLORS.accent}; font-size: 1.2rem; }
            .nav-chevron {
                margin-left: auto;
                opacity: 0.5;
                transition: transform 0.18s ease, opacity 0.18s;
            }
            .fancy-item:hover .nav-chevron {
                transform: translateX(4px);
                opacity: 0.9;
            }

            .sidebar-cta { margin-top: auto; position: relative; z-index: 1; }
            .support-card {
                margin-top: 12px;
                padding: 12px;
                border-radius: 12px;
                background: linear-gradient(180deg, rgba(100,181,246,0.12), rgba(100,181,246,0.06));
                border: 1px solid rgba(100,181,246,0.35);
            }
            .support-title { margin: 0 0 6px 0; font-weight: 700; color: ${COLORS.primary}; }
            .support-line { margin: 2px 0; color: #475569; font-size: 0.9rem; }

            /* ── Login Card ─*/
            .login-card {
                flex: 1;
                background: ${COLORS.cardBg};
                border-radius: 16px;
                width: 100%;
                padding: 1rem;
                box-shadow: 0 8px 30px rgba(0,0,0,0.15);
                border: 1px solid rgba(255,255,255,0.7);
                display: flex;
                flex-direction: column;
                position: relative;
            }
            .login-card::before {
                content: "";
                position: absolute;
                top: -50%;
                left: -50%;
                width: 200%;
                height: 200%;
                background: radial-gradient(circle, rgba(100,181,246,0.05) 0%, transparent 70%);
                z-index: 0;
                pointer-events: none;
            }

            /* ── OTP Form Styles ──────────────────────────────────────── */
            .otp-form-container {
                width: 100%;
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 1rem;
            }
            
            .otp-form {
                width: 100%;
                display: flex;
                flex-direction: column;
                align-items: center;
            }

            .otp-logo {
                height: 60px;
                margin-bottom: 1rem;
            }

            .otp-instruction {
                font-size: 1.2rem;
                color: #555;
                text-align: center;
                margin-bottom: 2rem;
            }

            .otp-inputs {
                display: flex;
                justify-content: center;
                gap: 10px;
                margin-bottom: 2rem;
                flex-wrap: wrap;
            }

            .otp-input {
                width: 50px;
                height: 60px;
                font-size: 1.5rem;
                text-align: center;
                background: rgba(255, 255, 255, 0.7);
                border: 3px solid #2698c3;
                border-radius: 12px;
                box-shadow:
                    0 0 0 1px rgba(38, 152, 195, 0.4),
                    0 6px 14px rgba(38, 152, 195, 0.25),
                    inset 0 1px 2px rgba(255, 255, 255, 0.6);
                backdrop-filter: blur(8px);
                transition: all 0.25s ease;
                color: ${COLORS.primary};
                font-weight: 600;
                caret-color: ${COLORS.primary};
            }


            .otp-input:focus {
                outline: none;
                background: rgba(255, 255, 255, 0.95);
                box-shadow: 0 6px 16px rgba(49, 130, 206, 0.2);
                border-color: ${COLORS.primary};
            }

            .otp-submit-btn {
                padding: 0.9rem;
                font-size: 1.1rem;
                font-weight: 600;
            }

            .desktop-logo-section { text-align: center; margin-bottom: 1rem; }
            .desktop-logo-section .logo-wrapper { display: inline-flex; flex-direction: column; align-items: center; }
            .desktop-logo-section .logo-img { height: 55px; margin-bottom: 2px; margin-top:15px; }
            .desktop-logo-section .logo-title { font-size: 1.6rem; }

            .mobile-logo-section { text-align: center; margin-bottom: 2rem; }
            .mobile-logo-section .logo-wrapper { margin-bottom: 0; }
            .mobile-logo-section .logo-img { height: 50px; margin-bottom: 8px; }
            .mobile-logo-section .logo-title { font-size: 1.5rem; }

            .login-header { margin-bottom: 1.75rem; text-align: center; }
            .login-title {
                font-size: 1.8rem;
                font-weight: 800;
                margin: 0;
                background: linear-gradient(90deg, ${COLORS.primary}, #3182ce);
                -webkit-background-clip: text;
                background-clip: text;
                color: transparent;
            }
            .login-subtitle { color: #718096; margin-top: 0.5rem; font-size: 1rem; }

            /* COOL INPUT FIELDS */
            .input-group-cool { margin-bottom: 1.4rem; position: relative; }
            .input-wrapper { position: relative; width: 100%; }

            .input-cool {
                width: 100%;
                padding: 16px 16px 16px 48px;
                font-size: 1rem;
                background: rgba(255, 255, 255, 0.7);
                border: none;
                border-radius: 14px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
                backdrop-filter: blur(8px);
                transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                color: ##0f0f0f !important;
                caret-color: #0b78f0 !important;
                height: 56px;
                box-sizing: border-box;
            }
            .input-cool::placeholder { color: #0f0f0f !important; }

            .input-icon-left {
                position: absolute;
                left: 16px;
                top: 50%;
                transform: translateY(-50%);
                color: #a0aec0;
                font-size: 1.2rem;
                transition: color 0.3s ease;
                z-index: 2;
            }

            .input-label {
                position: relative;
                top: 50%;
                color: #0b78f0 !important;
                pointer-events: none;
                font-size: 1rem;
                font-weight: 5600;
            }


            .input-border {
                position: absolute;
                bottom: 0;
                left: 0;
                width: 0;
                height: 2px;
                background: ${COLORS.accent};
                border-radius: 2px;
                transition: width 0.4s cubic-bezier(0.22, 0.61, 0.36, 1);
            }
            .input-cool:focus ~ .input-border { width: 100%; }

            /* Password Toggle Enhancement */
            .password-group-cool .password-toggle-cool {
                position: absolute !important;
                right: 14px !important;
                top: 50% !important;
                transform: translateY(-50%) !important;
                z-index: 3 !important;
                color: #718096 !important;
                font-size: 1.15rem !important;
                padding: 0 !important;
                background: none !important;
                border: none !important;
                opacity: 0.8 !important;
                transition: all 0.3s ease !important;
            }
            .password-toggle-cool:hover {
                opacity: 1 !important;
                color: ${COLORS.accent} !important;
                transform: translateY(-50%) scale(1.1) !important;
            }
            .input-cool:focus ~ .input-icon-left { color: ${COLORS.accent}; }

            /*  Button & Misc */
            .forgot-password { text-align: right; margin-bottom: 1.25rem; }
            .link-reset,
            .link-back {
                background: none;
                border: none;
                padding: 0;
                cursor: pointer;
                color: #3182ce;
                text-decoration: none;
                font-size: 0.9rem;
            }
            .link-reset:hover,
            .link-back:hover {
                color: #2b6cb0;
                text-decoration: underline;
            }

            .btn-animated { position: relative; overflow: hidden; }
            .btn-animated::after {
                content: "";
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
                transition: left 0.5s;
            }
            .btn-animated:hover::after { left: 100%; }

            .w-100 { width: 100%; }
            .back-link { text-align: center; margin-top: 1rem; }

            .bottom-img{
                height: 90px;
            }
            .mobile-help-section {
                border-top: 1px solid #e2e8f0;
                text-align: center;
            }
            .mobile-help-section .help-label { color: #777; font-size: 0.85rem; margin-bottom: 6px; }
            .mobile-help-section .help-phone,
            .mobile-help-section .help-email { margin: 4px 0; font-size: 0.9rem; }
            .mobile-help-section .help-phone { font-weight: 600; color: #333; }
            /* Responsive Fixes */
            @media (min-width: 769px) {
                .mobile-logo-section{ display: none !important; }
            }

            @media (max-width: 768px) {
                .desktop-logo-section { display: none !important; }

                .login-wrapper {
                    flex-direction: column;
                    gap: 0;
                    box-shadow: none;
                    max-width: 100%;
                }

                .login-sidebar { display: none; }
                .login-card {
                    border-radius: 12px;
                    padding: 1.8rem 1.5rem;
                    box-shadow: 0 6px 20px rgba(0,0,0,0.1);
                }

                .login-header { margin-bottom: 1.5rem; }
                .login-title { font-size: 1.6rem; }


            }

            /* Icon Pop-in Animation */
            @keyframes popInIcon {
                0% { transform: scale(0.4) rotate(-10deg); opacity: 0; }
                70% { transform: scale(1.2); opacity: 1; }
                100% { transform: scale(1) rotate(0); }
            }
            .input-icon-left {
                animation: popInIcon 0.6s ease-out forwards;
                animation-delay: calc(var(--order, 0) * 0.2s);d
            }
            #email ~ .input-icon-left { --order: 1; }
            #password ~ .input-icon-left { --order: 2; }
            `}</style>
        </div>
    );
};

export default MPanelLogin;
