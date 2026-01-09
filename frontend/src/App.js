import {BrowserRouter, Navigate, Route, Routes} from "react-router-dom";
import AuthLayout from "./layouts/Auth/Auth";
import AdminLayout from "./layouts/Admin/Admin";
import RTLLayout from "./layouts/RTL/RTL";
import React from "react";

import axios from "axios";
import {getAuthState} from "./reducers/authReducer";
import {useDispatch} from "react-redux";

import {AllCommunityModule, ModuleRegistry} from 'ag-grid-community';
import LoanDetailsPage from "./views/custom/loan/loanDetails/LoanDetails";
import ViewTransaction from "./views/custom/loan/ViewTransaction/ViewTransaction";
import GroupLoanDetailsPage from "./views/custom/groupLoan/GroupLoanDetails/GroupLoanDetails";
import SavingsAccountDetailsPage from "./views/custom/savings/SavingsAccountDetails/SavingsAccountDetailsPage";
import SavingsAccountTransactions from "./views/custom/savings/Transactions/SavingsAccountTransactions";
import LoanSchedulePage from "./views/custom/loan/LoanSchedule/LoanSchedulePage";
import ForecloseLoanForm from "./views/custom/loan/Foreclose/ForecloseLoanForm";
// import PendingForeclosureList from "./views/custom/loan/PendingForeclosureList/PendingForeclosureList";
import ReviewForeclosureRequest from "./views/custom/loan/ReviewForeclosureRequest/ReviewForeclosureRequest";
import DepositAccountDetailsPage from "./views/custom/deposits/accountDetails/DepositAccountDetailsPage";
// import DepositAccountTransactions from "./views/custom/deposits/transaction/DepositTransaction";
import TransactionHistory from "./views/custom/deposits/transaction/TransactionHistory";
import Profile from "./views/custom/User/ProfileScreen/Profile";
import MemberDetailsPage from "./views/custom/member/MemberDetails/MemberDetailsPage";
import MembershipFeeForm from "./views/custom/member/MembershipFee/MembershipFeeForm";
import MPanelLogin from "./views/custom/auth/MPanelLogin";

import ReviewGroupForeclosureRequest
    from "./views/custom/groupLoan/ReviewForeClosureRequest/ReviewGroupForeclosureRequest";

// const INACTIVITY_TIMEOUT = (process.env.REACT_APP_ENV === 'dev' ? 60 : 15) * 60 * 1000; // 15 minutes in milliseconds

function App() {


    // Get Current Auth state
    const authDispatch = useDispatch();
    ModuleRegistry.registerModules([AllCommunityModule]);
    const [fetched, setFetched] = React.useState(false);
    // const [lastActivity, setLastActivity] = React.useState(Date.now());

// Dispatch Auth validation on DOM load or auth state change
//   const resetActivityTimer = React.useCallback(() => {
//     setLastActivity(Date.now());
//   }, []);

    // const handleInactivityTimeout = React.useCallback(() => {
    //   if (window.location.pathname !== "/"){
    //     window.location.href = "/sessionLogout";
    //   }
    //   resetActivityTimer();
    // }, []);

    // const isMPanelDomain = ['mpanel.co.in', 'www.mpanel.co.in','localhost'].includes(window.location.hostname);

    React.useEffect(() => {
        document.body.classList.remove("dark-content");
        document.body.classList.remove("sidebar-mini");
        setFetched(true);
        axios.get("/api/auth/get-user").then((fetchUser) => {
            authDispatch(getAuthState(fetchUser.data));
        }).catch(() => {
            authDispatch(
                getAuthState({
                    loggedIn: false,
                    bankId: "",
                    email: "",
                    name: "",
                    permissions: {},
                    module: {},
                    accessLevel: {},
                    bankInfo: {},
                })
            );
            if (window.location.pathname !== "/") {
                window.location.href = "/";
            }
        });
    }, []);

    function subscriptionCheck() {
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

    React.useEffect(() => {
        // Setup Axios interceptor to handle 401 errors
        axios.interceptors.response.use(
            (response) => {
                // Any status code that lie within the range of 2xx cause this function to trigger
                return response;
            },
            (error) => {
                // Any status codes that falls outside the range of 2xx cause this function to trigger
                if (error.response && error.response.status === 401) {
                    if (window.location.pathname !== "/") {
                        window.alert("Session has Expired. Please login again to continue.");
                        window.location.href = "/";
                    }
                }
                return Promise.reject(error);
            }
        );
    }, []);


    React.useEffect(() => {
        axios.get("/open-api/auth/get-domain-branding").then((getDomainBranding) => {
            if (getDomainBranding.data.success) {
                document.title = getDomainBranding.data.data.branding;
                document.getElementById("favicon").href = getDomainBranding.data.data.favicon;
            }
        }).catch((e) => {
            console.log(e);
        });
        subscriptionCheck();
    }, [fetched]);

    return (<>
        <BrowserRouter>
            <Routes>
                <Route path="/auth/*" element={<AuthLayout/>}/>
                <Route path="/admin/*" element={<AdminLayout/>}/>

                {/*Custom Layout Routes*/}
                <Route path="/member/*" element={<AdminLayout/>}/>
                <Route path="/deposit/*" element={<AdminLayout/>}/>
                <Route path="/loan/*" element={<AdminLayout/>}/>
                <Route path="/authorization/*" element={<AdminLayout/>}/>
                <Route path="/reports/*" element={<AdminLayout/>}/>
                <Route path="/admin/*" element={<AdminLayout/>}/>

                <Route
                    exact
                    path="/"
                    element={<MPanelLogin/>}
                />

                <Route path="*" element={<Navigate to="/" replace/>}/>

                {/*Standalone Route */}
                <Route path="/Active-Loan-Account/Details/:loanNo" element={<LoanDetailsPage/>}/>
                <Route path="/Active-Loan-Account/Details/:loanNo/Transactions" element={<ViewTransaction/>}/>
                <Route path="/Active-Group-Loan-Account/Details/:loanNo" element={<GroupLoanDetailsPage/>}/>
                <Route path="/loan/loan-accounts/details/:account/emiSchedule" elemGroupLoanDetailsent={<LoanSchedulePage/>}/>

                <Route path="/loan/loan-accounts/details/foreclose/:loanNo" element={<ForecloseLoanForm/>}/>
                <Route path="/loan/foreclosure/review/:transactionId" element={<ReviewForeclosureRequest/>}/>

                <Route path="/group-loan/foreclosure/review/:transactionId" element={<ReviewGroupForeclosureRequest/>}/>
                {/*savings route*/}
                <Route path="/deposit/savings-accounts/details/:account" element={<SavingsAccountDetailsPage/>}/>
                <Route path="/deposit/savings-accounts/details/:account/transactions"
                       element={<SavingsAccountTransactions/>}/>

                {/*Deposit route*/}
                <Route path="/deposit/accounts/details/:accountType/:accountId" element={<DepositAccountDetailsPage/>}/>
                <Route path="/deposit/accounts-details/:account/transactionslist" element={<TransactionHistory/>}/>

                {/*Member details */}
                <Route path="/member/view-members/member-details/:id" element={<MemberDetailsPage/>}/>
                <Route path="/member/view-members/member-details/membership-fee" element={<MembershipFeeForm/>}/>


                {/*ProfileScreen Route */}
                <Route path="/user-profile" element={<Profile/>}/>
                {/*<Route path="/user-profile/reset-password" element={<ResetPassword/>} />*/}

                {/* This is OOB Layout, will be implemented later if required*/}
                <Route path="/rtl/*" element={<RTLLayout/>}/>
            </Routes>
        </BrowserRouter>
    </>)
}

export default App;











