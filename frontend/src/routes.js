/*!

=========================================================
* Black Dashboard PRO React - v1.2.4
=========================================================

* Product Page: https://www.creative-tim.com/product/black-dashboard-pro-react
* Copyright 2024 Creative Tim (https://www.creative-tim.com)

* Coded by Creative Tim

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

*/
// import VectorMap from "views/maps/VectorMap.js";
// import GoogleMaps from "views/maps/GoogleMaps.js";
// import FullScreenMap from "views/maps/FullScreenMap.js";
// import ReactTables from "views/tables/ReactTables.js";
// import RegularTables from "views/tables/RegularTables.js";
// import ExtendedTables from "views/tables/ExtendedTables.js";
// import Wizard from "views/forms/Wizard.js";
// import ValidationForms from "views/forms/ValidationForms.js";
// import ExtendedForms from "views/forms/ExtendedForms.js";
// import RegularForms from "views/forms/RegularForms.js";
// import Calendar from "views/Calendar.js";
// import Widgets from "views/Widgets.js";
// import Charts from "views/Charts.js";
// import Buttons from "views/components/Buttons.js";
// import SweetAlert from "views/components/SweetAlert.js";
// import Notifications from "views/components/Notifications.js";
// import Grid from "views/components/Grid.js";
// import Typography from "views/components/Typography.js";
// import Panels from "views/components/Panels.js";
// import Icons from "views/components/Icons.js";
// import Pricing from "views/pages/Pricing.js";
// import Register from "views/pages/Register.js";
// import Timeline from "views/pages/Timeline.js";
// import User from "views/pages/User.js";
// import Login from "views/pages/Login.js";
// import Rtl from "views/pages/Rtl.js";
// import Lock from "views/pages/Lock.js";

import Dashboard from "views/Dashboard.js";

// import Buttons from "views/components/Buttons.js";
// import SweetAlert from "views/components/SweetAlert.js";
// import Notifications from "views/components/Notifications.js";
// import Grid from "views/components/Grid.js";
// import Typography from "views/components/Typography.js";
// import Panels from "views/components/Panels.js";
// import Icons from "views/components/Icons.js";
// import Pricing from "views/pages/Pricing.js";
// import Register from "views/pages/Register.js";
// import Timeline from "views/pages/Timeline.js";
// import User from "views/pages/User.js";
// import Login from "views/pages/Login.js";
// import Rtl from "views/pages/Rtl.js";
// import Lock from "views/pages/Lock.js";

// Custom Pages
import AddMember from "./views/custom/member/addMember/AddMember";
import ViewMembers from "./views/custom/member/viewMember/ViewMember";
import SearchMembers from "./views/custom/member/searchMember/SearchMembers";
import EditMember from "./views/custom/member/editMember/EditMember";
import AddAdvisor from "./views/custom/advisor/addAdvisor/AddAdvisor";
import UpdateAdvisor from "./views/custom/advisor/updateAdvisor/UpdateAdvisor";
import AdvisorTree from "./views/custom/advisor/advisorTree/AdvisorTree";
import ViewAdvisor from "./views/custom/advisor/viewAdvisor/ViewAdvisor";

// Employee Section
import AddEmployee from "./views/custom/employee/AddEmployeeKYC/AddEmployeeKYC";
import AddDesignationMaster from "./views/custom/employee/AddDesignation/AddDesignationMaster";
import AddDepartment from "./views/custom/employee/AddDepartment/AddDepartment";
import SearchEmployee from "./views/custom/employee/SearchEmployee/SearchEmployee";
import OfferLetter from "./views/custom/employee/OfferLetter/OfferLetter";
import SalaryMaster from "./views/custom/employee/SaleryMaster/SalaryMaster";
import SalaryPayment from "./views/custom/employee/SaleryPayment/SalaryPayment";
import SalarySlipPrint from "./views/custom/employee/SalerySlipPrint/SalarySlipPrint";

// Deposit
import DepositPlanMaster from "./views/custom/deposits/planMaster/PlanMaster";
import DepositAccountOpening from "./views/custom/deposits/accountOpening/AccountOpening";
import DepositTransaction from "./views/custom/deposits/transaction/DepositTransaction";
import DepositStatement from "./views/custom/deposits/accountStatement/AccountStatement";
import DepositBulkTransaction from "./views/custom/deposits/bulkTransaction/BulkTransaction";
import ViewDepositAccounts from "./views/custom/deposits/depositAccounts/ViewDepositAccounts";

// OT Deposit
import OTDepositPlanMaster from "./views/custom/otDeposit/planMaster/PlanMaster";
import OTDepositAccountOpening from "./views/custom/otDeposit/accountOpening/AccountOpening";
import OTDepositStatement from "./views/custom/otDeposit/accountStatement/AccountStatement";
import OTDepositAccounts from "./views/custom/otDeposit/depositAccounts/ViewDepositAccounts";

// Savings
import SavingsPlanMaster from "./views/custom/savings/planMaster/PlanMaster";
import SavingsAccountOpening from "./views/custom/savings/accountOpening/AccountOpening";
import SavingsTransaction from "./views/custom/savings/transaction/DepositTransaction";
import SavingsStatement from "./views/custom/savings/accountStatement/AccountStatement";

// Loan
import LoanPlanCreation from "./views/custom/loan/planCreation/PlanCreation";
import LoanOpening from "./views/custom/loan/LoanOpening/LoanOpening";
import LoanCalculator from "./views/custom/loan/Calculator/Calculator";
import LoanRepaymentForm from "./views/custom/loan/loanRepayment/LoanRepayment";
import LoanBulkRepayment from "./views/custom/loan/BulkRepayment/LoanBulkRepayment";
import LoanAccountStatement from "./views/custom/loan/LoanAccountStatement/LoanAccountStatement";
import LoanDemandSheet from "./views/custom/loan/demandSheet/DemandSheet";

// Group Loan
import GroupCreation from "views/custom/groupLoan/createGroup/CreateGroup";
import GroupEdit from "views/custom/groupLoan/editGroup/EditGroup";
import ViewGroups from "views/custom/groupLoan/viewGroups/ViewGroups";
import GroupLoanPlanCreation from "./views/custom/groupLoan/planCreation/PlanCreation";
import GroupLoanCalculator from "./views/custom/groupLoan/Calculator/Calculator";
import GroupLoanOpening from "views/custom/groupLoan/LoanOpening/LoanOpening";
import GroupLoanRepayment from "views/custom/groupLoan/loanRepayment/LoanRepayment";
import BulkRepayment from "./views/custom/groupLoan/bulkRepayment/BulkRepayment";
import GroupLoanAccountStatement from "views/custom/groupLoan/LoanAccountStatement/LoanAccountStatement";

// Journal
import GeneralVoucher from "./views/custom/Journal/GeneralVoucher/GeneralVoucher";
import JournalTransfer from "./views/custom/Journal/journalTransfer/JournalTransfer";
import GlCodeModification from "./views/custom/Journal/GlCodeModification/GlCodeModification";

// Authorization
import AuthorizeTransaction from "./views/custom/authorization/AuthorizeTransaction";
import AuthorizeJournal from "./views/custom/authorization/AuthorizeJournal";
import BulkTransaction from "./views/custom/authorization/BulkTransaction";
import LoanOpeningApproval from "./views/custom/authorization/LoanApplication/LoanOpeningApproval";

// Reports
import DayBook from "./views/custom/reports/general/dayBook/DayBook";
import CashBook from "./views/custom/reports/general/cashBook/CashBook";
import JournalBook from "./views/custom/reports/general/journalBook/JournalBook";
import CashAccount from "./views/custom/reports/general/cashAccount/CashAccount";
import DueListSummary from "./views/custom/reports/loan/dueListSummary/DueListSummary";
import CPWiseEWI from "./views/custom/reports/loan/CPWiseEWI/CPWiseEWI";
import DetailList from "./views/custom/reports/deposit/detailList/DetailList";

// Admin Section
import BankCreation from "./views/custom/admin/BankCreation/BankCreation";
import SocietyRegistration from "./views/custom/admin/societyRegistration/SocietyRegistration";
import BankUpdate from "./views/custom/admin/BankUpdate/BankUpdate";
import UserCreation from "./views/custom/admin/userCreation/UserCreation";
import UserUpdate from "./views/custom/admin/userUpdate/UserUpdate";
import AllBanks from "./views/custom/admin/ListOfBanks/AllBanks"
import BranchCreation from "./views/custom/admin/BranchCreation/BranchCreation";
import Wallet from "./views/custom/admin/walletBalance/Wallet";
import ResetRequest from "./views/custom/admin/ResetRequest/ResetRequest";

// Tools Section
import BranchUpdate from "./views/custom/tools/BranchUpdate/BranchUpdate";
import BranchUserCreation from "./views/custom/tools/branchUserCreation/BranchUserCreation";
import BranchUserUpdate from "./views/custom/tools/branchUserUpdate/BranchUserUpdate";
import IteratorValue from "./views/custom/tools/IteratorForm/IteratorForm";
import MemberTransfer from "./views/custom/tools/memberTransfer/MemberTransfer";
import DataReset from "./views/custom/tools/dataReset/DataReset";

import EquifaxCIBIL from "./views/custom/verificationAPI/equifaxCIBIL/EquifaxCIBIL";
import WalletTransactionHistory from "./views/custom/verificationAPI/wallet/WalletTransactionHistory";
import ViewActiveLoans from "./views/custom/loan/activeLoan/ViewActiveLoans";
import ViewActiveGroupLoans from "./views/custom/groupLoan/ViewActiveGroupLoan/ViewActiveGroupLoan";
import DataUtility from "./views/custom/admin/DataUtility/DataUtility";

// Mobile App
import ViewMobileTransactions from "./views/custom/mobileApp/ViewMobileTransaction";
import UserSignup from "./views/custom/mobileApp/userSignup/UserSignup";

import ViewSavingsAccounts from "./views/custom/savings/savingsAccounts/ViewSavingsAccounts";
import SavingsBulkTransaction from "./views/custom/savings/savingsBulkTransaction/SavingsBulkTransaction"
import PendingForeclosureList from "./views/custom/loan/PendingForeclosureList/PendingForeclosureList";
import ForeclosedAccountsList from "./views/custom/loan/ForeclosedAccounts/ForeclosedAccountsList";
import GroupDemandSheetPage from "./views/custom/groupLoan/demandSheet/GroupDemandSheet";
import PendingGroupLoanForeclosureList from "./views/custom/groupLoan/pendingForeClosure/PendingGroupForeClosure";
import GroupForeclosedAccountsList from "./views/custom/groupLoan/ForeClosedAccount/GroupForeClosedAccount";
// import UserSignup from "./views/custom/MobileApp/userSignup/UserSignup";

const routes = [
    {
        path: "/dashboard",
        name: "Dashboard",
        rtlName: "لوحة القيادة",
        icon: "tim-icons icon-chart-pie-36",
        component: <Dashboard/>,
        layout: "/admin",
        permission: "open",
        module: "open",
    },
    {
        collapse: true,
        name: "Admin",
        rtlName: "অ্যাডমিন",
        icon: "tim-icons icon-settings-gear-63",
        state: "adminCollapse",
        permission: "admin",
        module: "admin",
        views: [
            {
                path: "/add-bank",
                name: "New Bank",
                rtlName: "ব্যাঙ্ক যোগ",
                mini: "NEW",
                rtlMini: "ব্যাঙ্ক",
                component: <BankCreation/>,
                layout: "/admin",
            },
            {
                path: "/add-society-bank",
                name: "Society Registration",
                rtlName: "ব্যাঙ্ক যোগ",
                mini: "NEW",
                rtlMini: "ব্যাঙ্ক",
                component: <SocietyRegistration />,
                layout: "/admin",
            },
            {
                path: "/update-bank",
                name: "Update Bank",
                rtlName: "ব্যাঙ্ক সংশোধন",
                mini: "EDIT",
                rtlMini: "ব্যাঙ্ক",
                component: <BankUpdate/>,
                layout: "/admin",
            },
            {
                path: "/user-creation",
                name: "Admin User Creation",
                rtlName: "উজ্যুর যোগ",
                mini: "USER",
                rtlMini: "উজ্যুর",
                component: <UserCreation/>,
                layout: "/admin",
            },
            {
                path: "/user-permissions",
                name: "User Permissions",
                rtlName: "উজ্যুর সংশোধন",
                mini: "EDIT",
                rtlMini: "সংশোধন",
                component: <UserUpdate/>,
                layout: "/admin",
            },
            {
                path: "/all-banks",
                name: "Registered Banks",
                mini: "LOB",
                component: <AllBanks/>,
                layout: "/admin",
            },
            {
                path: "/add-branch",
                name: "Branch Creation",
                rtlName: "শাখা যোগ",
                mini: "NEW",
                rtlMini: "শাখা",
                component: <BranchCreation/>,
                layout: "/admin",
            },
            {
                path: "/wallet-balance",
                name: "Wallet Balance",
                mini: "WB",
                component: <Wallet/>,
                layout: "/admin",
            },
            {
                path: "/admin-dataUtility",
                name: "Data Utility",
                mini: "WB",
                component: <DataUtility/>,
                layout: "/admin",
            },
            {
                path: "/admin-reset-request",
                name: "Reset Request",
                mini: "RR",
                component: <ResetRequest/>,
                layout: "/admin",
            },
        ],
    },
    {
        collapse: true,
        name: "Mobile App",
        rtlName: "মোবাইল আপ্প",
        icon: "tim-icons icon-mobile",
        state: "mobileCollapse",
        permission: "mobile",
        module: "mobile",
        views: [
            {
                path: "/mobile-user-creation",
                name: "User Creation",
                rtlName: "উজ্যুর যোগ",
                mini: "USER",
                rtlMini: "উজ্যুর",
                component: <UserSignup/>,
                layout: "/admin",
            },
            {
                path: "/view-mobile-transactions",
                name: "View Transactions",
                mini: "VMT",
                component: <ViewMobileTransactions/>,
                layout: "/admin",
            },
        ],
    },
    {
        collapse: true,
        name: "Tools",
        rtlName: "অ্যাডমিন",
        icon: "tim-icons icon-settings",
        state: "toolsCollapse",
        permission: "tools",
        module: "tools",
        views: [

            {
                path: "/update-branch",
                name: "Branch Update",
                rtlName: "শাখা সংশোধন",
                mini: "UPD",
                rtlMini: "সংশোধন",
                component: <BranchUpdate/>,
                layout: "/admin",
            },
            {
                path: "/branch-user-creation",
                name: "Branch User Creation",
                rtlName: "শাখা উজ্যুর যোগ",
                mini: "BUC",
                rtlMini: "শাখা উজ্যুর",
                component: <BranchUserCreation/>,
                layout: "/admin",
            },
            {
                path: "/branch-user-permissions",
                name: "Branch User Permissions",
                rtlName: "শাখা উজ্যুর সংশোধন",
                mini: "EDIT",
                rtlMini: "সংশোধন",
                component: <BranchUserUpdate/>,
                layout: "/admin",
            },
            {
                path: "/iterator-settings",
                name: "Iterator Settings",
                rtlName: "সেটিং",
                mini: "SET",
                rtlMini: "সেটিং",
                component: <IteratorValue/>,
                layout: "/admin",
            },
            {
                path: "/member-transfer",
                name: "Member Transfer",
                rtlName: "সেটিং",
                mini: "TRA",
                rtlMini: "সেটিং",
                component: <MemberTransfer/>,
                layout: "/admin",
            },
            {
                path: "/data-reset",
                name: "Data Reset",
                rtlName: "",
                mini: "DEL",
                rtlMini: "",
                component: <DataReset/>,
                layout: "/admin",
            }
        ],
    },
    {
        collapse: true,
        name: "Verification API",
        rtlName: "অ্যাডমিন",
        icon: "tim-icons icon-planet",
        state: "apiVerificationCollapse",
        permission: "verificationAPI",
        module: "verificationAPI",
        views: [
            {
                path: "/api-equifax-cibil-core",
                name: "Equifax CIBIL",
                rtlName: "ইকুইফ্যাক্স সিভিল স্কোর",
                mini: "CSC",
                rtlMini: "ইকুইফ্যাক্স",
                component: <EquifaxCIBIL/>,
                layout: "/admin",
            },
            {
                path: "/wallet-transaction-history",
                name: "Wallet Transaction",
                rtlName: "",
                mini: "WTH",
                rtlMini: "",
                component: <WalletTransactionHistory/>,
                layout: "/admin",
            },
        ],
    },
    {
        collapse: true,
        name: "Member Management",
        rtlName: "সদস্য",
        icon: "tim-icons icon-badge",
        state: "memberCollapse",
        permission: "member",
        module: "member",
        views: [
            {
                path: "/add-member",
                name: "Add Member",
                rtlName: "সদস্য যোগ",
                mini: "ADD",
                rtlMini: "যোগ",
                component: <AddMember/>,
                layout: "/member",
            },
            {
                path: "/update-member",
                name: "Edit Member",
                rtlName: "সদস্য সংশোধন",
                mini: "EDIT",
                rtlMini: "সংশোধন",
                component: <EditMember/>,
                layout: "/member",
            },
            {
                path: "/view-members",
                name: "View Members",
                rtlName: "সদস্য তালিকা",
                mini: "VIEW",
                rtlMini: "তালিকা",
                component: <ViewMembers/>,
                layout: "/member",
            },
            {
                path: "/search-members",
                name: "Search Members",
                rtlName: "অনুসন্ধান করুন",
                mini: "FIND",
                rtlMini: "অনুসন্ধান",
                component: <SearchMembers/>,
                layout: "/member",
            },
        ],
    },
    {
        collapse: true,
        name: "Advisor/CP Agent",
        rtlName: "আমানত",
        icon: "tim-icons icon-user-run",
        state: "advisorCollapse",
        permission: "advisor",
        module: "advisor",
        views: [
            {
                path: "/add-advisor",
                name: "Create Advisor",
                rtlName: "যোগ করুন",
                mini: "ADD",
                rtlMini: "যোগ",
                component: <AddAdvisor/>,
                layout: "/member",
            },
            {
                path: "/update-advisor",
                name: "Update Advisor",
                rtlName: "সংশোধন করুন",
                mini: "EDIT",
                rtlMini: "সংশোধন",
                component: <UpdateAdvisor/>,
                layout: "/member",
            },
            {
                path: "/view-advisor",
                name: "Advisor List",
                rtlName: "গাছ",
                mini: "LIST",
                rtlMini: "গাছ",
                component: <ViewAdvisor/>,
                layout: "/member",
            },
            {
                path: "/advisor-tree",
                name: "Advisor Tree",
                rtlName: "গাছ",
                mini: "EDIT",
                rtlMini: "গাছ",
                component: <AdvisorTree/>,
                layout: "/member",
            },
        ],
    },
    {
        collapse: true,
        name: "Employee",
        rtlName: "সদস্য",
        icon: "tim-icons icon-laptop",
        state: "employeeCollapse",
        permission: "employee",
        module: "employee",
        views: [
            {
                path: "/add-designation",
                name: "Add Designation",
                rtlName: "সদস্য যোগ",
                mini: "DEG",
                rtlMini: "যোগ",
                component: <AddDesignationMaster/>,
                layout: "/member",
            },
            {
                path: "/add-department",
                name: "Add Department",
                rtlName: "সদস্য যোগ",
                mini: "DPT",
                rtlMini: "যোগ",
                component: <AddDepartment/>,
                layout: "/member",
            },
            {
                path: "/add-Employee",
                name: "Add Employee",
                rtlName: "সদস্য যোগ",
                mini: "EMP",
                rtlMini: "যোগ",
                component: <AddEmployee/>,
                layout: "/member",
            },
            {
                path: "/employee-list",
                name: "Employee List",
                rtlName: "সদস্য যোগ",
                mini: "LIST",
                rtlMini: "যোগ",
                component: <SearchEmployee/>,
                layout: "/member",
            },
            {
                path: "/employee-offer-letter",
                name: "Offer Letter",
                rtlName: "সদস্য যোগ",
                mini: "OFR",
                rtlMini: "যোগ",
                component: <OfferLetter/>,
                layout: "/member",
            },
            {
                path: "/employee-salary-master",
                name: "Salary Master",
                rtlName: "সদস্য যোগ",
                mini: "SLR",
                rtlMini: "যোগ",
                component: <SalaryMaster/>,
                layout: "/member",
            },
            {
                path: "/employee-salary-payment",
                name: "Salary Payment",
                rtlName: "সদস্য যোগ",
                mini: "PAY",
                rtlMini: "যোগ",
                component: <SalaryPayment/>,
                layout: "/member",
            },
            {
                path: "/employee-salary-statement",
                name: "Salary Statement",
                rtlName: "সদস্য যোগ",
                mini: "STAT",
                rtlMini: "যোগ",
                component: <SalarySlipPrint/>,
                layout: "/member",
            }
        ],
    },
    {
        collapse: true,
        name: "Savings",
        rtlName: "আমানত",
        icon: "tim-icons icon-wallet-43",
        state: "savingsCollapse",
        permission: "savings",
        module: "savings",
        views: [
            {
                path: "/savings-plan-master",
                name: "Plan Master",
                rtlName: "পরিকল্পনা যোগ",
                mini: "ADD",
                rtlMini: "পরিকল্পনা",
                component: <SavingsPlanMaster/>,
                layout: "/deposit",
            },
            {
                path: "/savings-account-opening",
                name: "Savings Opening",
                rtlName: "যোগ করুন",
                mini: "ADD",
                rtlMini: "যোগ",
                component: <SavingsAccountOpening/>,
                layout: "/deposit",
            },
            {
                path: "/savings-deposit-transactions",
                name: "Savings Transactions",
                rtlName: "যোগ করুন",
                mini: "TANS",
                rtlMini: "যোগ",
                component: <SavingsTransaction/>,
                layout: "/deposit",
            },
            {
                path: "/savings-bulk-collection",
                name: "Bulk Collection",
                rtlName: "যোগ করুন",
                mini: "SBR",
                rtlMini: "যোগ",
                component: <SavingsBulkTransaction/>,
                layout: "/deposit",
            },
            {
                path: "/savings-deposit-statement",
                name: "Account Statement",
                rtlName: "যোগ করুন",
                mini: "STAT",
                rtlMini: "যোগ",
                component: <SavingsStatement/>,
                layout: "/deposit",
            },
            {
                path: "/savings-accounts",
                name: "Savings Accounts",
                rtlName: "সেভিংস অ্যাকাউন্টস",
                mini: "SA",
                rtlMini: "সেভ",
                component: <ViewSavingsAccounts/>,
                layout: "/deposit",
            }

        ],
    },
    {
        collapse: true,
        name: "Term Deposits",
        rtlName: "আমানত",
        icon: "tim-icons icon-bank",
        state: "depositCollapse",
        permission: "deposit",
        module: "deposit",
        views: [
            {
                path: "/deposit-plan-master",
                name: "Plan Master",
                rtlName: "পরিকল্পনা যোগ",
                mini: "ADD",
                rtlMini: "যোগ",
                component: <DepositPlanMaster/>,
                layout: "/deposit",
            },
            {
                path: "/account-opening",
                name: "Deposit Opening",
                rtlName: "যোগ করুন",
                mini: "ADD",
                rtlMini: "যোগ",
                component: <DepositAccountOpening/>,
                layout: "/deposit",
            },
            {
                path: "/deposit-transactions",
                name: "Deposit Transactions",
                rtlName: "যোগ করুন",
                mini: "TANS",
                rtlMini: "যোগ",
                component: <DepositTransaction/>,
                layout: "/deposit",
            },
            {
                path: "/deposit-daily-collection",
                name: "Bulk Collection",
                rtlName: "যোগ করুন",
                mini: "DAILY",
                rtlMini: "যোগ",
                component: <DepositBulkTransaction/>,
                layout: "/deposit",
            },
            {
                path: "/deposit-statement",
                name: "Account Statement",
                rtlName: "যোগ করুন",
                mini: "STAT",
                rtlMini: "যোগ",
                component: <DepositStatement/>,
                layout: "/deposit",
            },
            {
                path: "/deposit-accounts",
                name: "Deposit Accounts",
                rtlName: "যোগ করুন",
                mini: "STAT",
                rtlMini: "যোগ",
                component: <ViewDepositAccounts/>,
                layout: "/deposit",
            },
        ],
    },
    {
        collapse: true,
        name: "FD/CC/MIS Account",
        rtlName: "আমানত",
        icon: "tim-icons icon-bank",
        state: "OTDepositCollapse",
        permission: "deposit",
        module: "deposit",
        views: [
            {
                path: "/ot-deposit-plan-master",
                name: "Plan Master",
                rtlName: "পরিকল্পনা যোগ",
                mini: "ADD",
                rtlMini: "যোগ",
                component: <OTDepositPlanMaster/>,
                layout: "/deposit",
            },
            {
                path: "/ot-account-opening",
                name: "Account Opening",
                rtlName: "যোগ করুন",
                mini: "ADD",
                rtlMini: "যোগ",
                component: <OTDepositAccountOpening/>,
                layout: "/deposit",
            },
            {
                path: "/ot-deposit-accounts",
                name: "Deposit Accounts",
                rtlName: "যোগ করুন",
                mini: "STAT",
                rtlMini: "যোগ",
                component: <OTDepositAccounts/>,
                layout: "/deposit",
            },
            {
                path: "/ot-deposit-statement",
                name: "Account Statement",
                rtlName: "যোগ করুন",
                mini: "STAT",
                rtlMini: "যোগ",
                component: <OTDepositStatement/>,
                layout: "/deposit",
            },
        ],
    },
    {
        collapse: true,
        name: "Loan",
        icon: "tim-icons icon-money-coins",
        state: "loanCollapse",
        permission: "loan",
        module: "loan",
        views: [
            {
                path: "/loan-plan-creation",
                name: "Plan Creation",
                mini: "PLAN",
                component: <LoanPlanCreation/>,
                layout: "/loan",
            },
            {
                path: "/loan-calculator",
                name: "Loan Calculator",
                mini: "STAT",
                component: <LoanCalculator/>,
                layout: "/loan",
            },
            {
                path: "/loan-application",
                name: "Loan Application",
                mini: "OPEN",
                component: <LoanOpening/>,
                layout: "/loan",
            },
            {
                path: "/Loan-RePayment",
                name: "Loan RePayment",
                mini: "PAY",
                component: <LoanRepaymentForm/>,
                layout: "/loan",
            },
            {
                path: "/Loan-Bulk-RePayment",
                name: "Bulk RePayment",
                mini: "BLK",
                component: <LoanBulkRepayment/>,
                layout: "/loan",
            },
            {
                path: "/Loan-Statement",
                name: "Loan Statement",
                mini: "STAT",
                component: <LoanAccountStatement/>,
                layout: "/loan",
            },
            {
                path: "/Active-Loan-Account",
                name: "Loan Accounts",
                mini: "STAT",
                component: <ViewActiveLoans/>,
                layout: "/loan",
            },
            {
                path: "/loan-demand-sheet",
                name: "Demand Sheet",
                mini: "DEM",
                component: <LoanDemandSheet />,
                layout: "/loan",
            },
            {
                path: "/Loan-Foreclose-PendingRequest",
                name: "Foreclosure Requests",
                mini: "STAT",
                component: <PendingForeclosureList/>,
                layout: "/loan",
            },
            {
                path: "/Loan-Foreclosed-AccountsList",
                name: "Foreclosure AccountsList",
                mini: "STAT",
                component: <ForeclosedAccountsList/>,
                layout: "/loan",
            },
        ],
    },
    {
        collapse: true,
        name: "Group Loan",
        icon: "tim-icons icon-coins",
        state: "groupLoanCollapse",
        permission: "groupLoan",
        module: "groupLoan",
        views: [
            {
                path: "/loan-group-creation",
                name: "Group Creation",
                mini: "GRP",
                component: <GroupCreation/>,
                layout: "/loan",
            },
            {
                path: "/loan-group-edit",
                name: "Group Edit",
                mini: "GRP",
                component: <GroupEdit/>,
                layout: "/loan",
            },

            {
                path: "/loan-group-view",
                name: "View Group",
                mini: "GRP",
                component: <ViewGroups/>,
                layout: "/loan",
            },
            {
                path: "/group-loan-plan-creation",
                name: "Plan Creation",
                mini: "PLAN",
                component: <GroupLoanPlanCreation/>,
                layout: "/loan",
            },
            {
                path: "/group-loan-calculator",
                name: "Loan Calculator",
                mini: "STAT",
                component: <GroupLoanCalculator/>,
                layout: "/loan",
            },
            {
                path: "/group-loan-application",
                name: "Loan Application",
                mini: "OPEN",
                component: <GroupLoanOpening/>,
                layout: "/loan",
            },
            {
                path: "/group-loan-repayment",
                name: "Loan RePayment",
                mini: "PAY",
                component: <GroupLoanRepayment/>,
                layout: "/loan",
            }, {
                path: "/group-loan-bulk-repayment",
                name: "Bulk RePayment",
                mini: "BLK",
                component: <BulkRepayment/>,
                layout: "/loan",
            },
            {
                path: "/group-loan-Statement",
                name: "Group Loan Statement",
                mini: "STAT",
                component: <GroupLoanAccountStatement/>,
                layout: "/loan",
            },
            {
                path: "/group-loan-ActiveLoan",
                name: "Loan Accounts",
                mini: "STAT",
                component: <ViewActiveGroupLoans/>,
                layout: "/loan",
            },
            {
                path: "/group-loan-DemandSheet",
                name: "Demand Sheet",
                mini: "STAT",
                component: <GroupDemandSheetPage/>,
                layout: "/loan",
            },
            {
                path: "/group-Loan-Foreclose-PendingRequest",
                name: "Foreclosure Requests",
                mini: "STAT",
                component: <PendingGroupLoanForeclosureList/>,
                layout: "/loan",
            },
            {
                path: "/group-Loan-Foreclosed-AccountsList",
                name: "Foreclosure AccountsList",
                mini: "STAT",
                component: <GroupForeclosedAccountsList/>,
                layout: "/loan",
            },
        ],
    },
    {
        collapse: true,
        name: "Journal",
        rtlName: "জার্নাল",
        icon: "tim-icons icon-paper",
        state: "journalCollapse",
        permission: "journal",
        module: "journal",
        views: [
            {
                path: "/gl-code-modification",
                name: "GL Master",
                rtlName: "",
                mini: "GLM",
                rtlMini: "",
                component: <GlCodeModification/>,
                layout: "/deposit",
            },
            {
                path: "/general-voucher",
                name: "General Voucher",
                rtlName: "অনুমোদন",
                mini: "GV",
                rtlMini: "অনু",
                component: <GeneralVoucher/>,
                layout: "/deposit",
            },
            {
                path: "/journal-transfer",
                name: "Journal Transfer",
                rtlName: "অনুমোদন",
                mini: "GL",
                rtlMini: "অনু",
                component: <JournalTransfer/>,
                layout: "/deposit",
            },
        ],
    },
    {
        collapse: true,
        name: "Authorization",
        rtlName: "আমানত",
        icon: "tim-icons icon-components",
        state: "authorizeCollapse",
        permission: "authorize",
        module: "authorize",
        views: [
            {
                path: "/transactions",
                name: "Transactions",
                rtlName: "অনুমোদন",
                mini: "TRAN",
                rtlMini: "অনু",
                component: <AuthorizeTransaction/>,
                layout: "/authorization",
            },
            {
                path: "/bulk-transactions",
                name: "Bulk Trans",
                rtlName: "অনুমোদন",
                mini: "BLK",
                rtlMini: "অনু",
                component: <BulkTransaction/>,
                layout: "/authorization",
            },
            {
                path: "/authorize-journal-transfer",
                name: "Journal Transfer",
                rtlName: "অনুমোদন",
                mini: "JRNL",
                rtlMini: "অনু",
                component: <AuthorizeJournal/>,
                layout: "/authorization",
            },
            {
                path: "/authorize-loan-application",
                name: "Loan Application",
                rtlName: "অনুমোদন",
                mini: "LOAN",
                rtlMini: "অনু",
                component: <LoanOpeningApproval/>,
                layout: "/authorization",
            },
        ],
    },
    {
        collapse: true,
        name: "Reports",
        rtlName: "রিপোর্ট",
        icon: "tim-icons icon-chart-bar-32",
        state: "reportCollapse",
        permission: "report",
        module: "report",
        views: [
            {
                collapse: true,
                name: "General",
                rtlName: "সাধারণ",
                mini: "GN",
                rtlMini: "ر",
                state: "generalReportCollapse",
                views: [
                    {
                        path: "/general-day-book",
                        name: "Day Book",
                        rtlName: "দিনের বই",
                        mini: "DY",
                        rtlMini: "দিন",
                        component: <DayBook/>,
                        layout: "/reports",
                    },
                    {
                        path: "/general-cash-book",
                        name: "Cash Book",
                        rtlName: "নগদ বই",
                        mini: "CS",
                        rtlMini: "নগদ",
                        component: <CashBook/>,
                        layout: "/reports",
                    },
                    {
                        path: "/general-journal-book",
                        name: "Journal Book",
                        rtlName: "জার্নাল বই",
                        mini: "JR",
                        rtlMini: "জার্নাল",
                        component: <JournalBook/>,
                        layout: "/reports",
                    },
                    {
                        path: "/general-cash-account",
                        name: "Cash Account",
                        rtlName: "নগদ অ্যাকাউন্ট",
                        mini: "GL",
                        rtlMini: "জিএল",
                        component: <CashAccount/>,
                        layout: "/reports",
                    },
                ],
            },
            {
                collapse: true,
                name: "Deposit",
                rtlName: "সাধারণ",
                mini: "DP",
                rtlMini: "ر",
                state: "depositReportCollapse",
                views: [
                    {
                        path: "/deposit-detail-list",
                        name: "Detail List",
                        rtlName: "দিনের বই",
                        mini: "DTL",
                        rtlMini: "দিন",
                        component: <DetailList/>,
                        layout: "/reports",
                    },
                ],
            },
            {
                collapse: true,
                name: "Loan",
                rtlName: "সাধারণ",
                mini: "GN",
                rtlMini: "ر",
                state: "loanReportCollapse",
                views: [
                    {
                        path: "/loan-due-list",
                        name: "Loan Due List",
                        rtlName: "দিনের বই",
                        mini: "DUE",
                        rtlMini: "দিন",
                        component: <DueListSummary/>,
                        layout: "/reports",
                    },
                    {
                        path: "/loan-collection-cp-wise",
                        name: "Agent Wise Collection",
                        rtlName: "দিনের বই",
                        mini: "CP",
                        rtlMini: "দিন",
                        component: <CPWiseEWI/>,
                        layout: "/reports",
                    },
                ],
            },
        ],
    },

    // //   OOB Pages
    // {
    //   collapse: true,
    //   name: "Pages",
    //   rtlName: "صفحات",
    //   icon: "tim-icons icon-image-02",
    //   state: "pagesCollapse",
    //   permission: "pages",
    //   module: "pages",
    //   views: [
    //     {
    //       path: "/pricing",
    //       name: "Pricing",
    //       rtlName: "عالتسعير",
    //       mini: "P",
    //       rtlMini: "ع",
    //       component: <Pricing/>,
    //       layout: "/auth",
    //     },
    //     {
    //       path: "/rtl-support",
    //       name: "RTL Support",
    //       rtlName: "صودعم رتل",
    //       mini: "RS",
    //       rtlMini: "صو",
    //       component: <Rtl/>,
    //       layout: "/rtl",
    //     },
    //     {
    //       path: "/timeline",
    //       name: "Timeline",
    //       rtlName: "تيالجدول الزمني",
    //       mini: "T",
    //       rtlMini: "تي",
    //       component: <Timeline/>,
    //       layout: "/admin",
    //     },
    //     {
    //       path: "/login",
    //       name: "Login",
    //       rtlName: "هعذاتسجيل الدخول",
    //       mini: "L",
    //       rtlMini: "هعذا",
    //       component: <Login/>,
    //       layout: "/auth",
    //     },
    //     {
    //       path: "/register",
    //       name: "Register",
    //       rtlName: "تسجيل",
    //       mini: "R",
    //       rtlMini: "صع",
    //       component: <Register/>,
    //       layout: "/auth",
    //     },
    //     {
    //       path: "/lock-screen",
    //       name: "Lock Screen",
    //       rtlName: "اقفل الشاشة",
    //       mini: "LS",
    //       rtlMini: "هذاع",
    //       component: <Lock/>,
    //       layout: "/auth",
    //     },
    //     {
    //       path: "/user-profile",
    //       name: "User Profile",
    //       rtlName: "ملف تعريفي للمستخدم",
    //       mini: "UP",
    //       rtlMini: "شع",
    //       component: <User/>,
    //       layout: "/admin",
    //     },
    //   ],
    // },
    // {
    //   collapse: true,
    //   name: "Components",
    //   rtlName: "المكونات",
    //   icon: "tim-icons icon-molecule-40",
    //   state: "componentsCollapse",
    //   permission: "components",
    //   module: "components",
    //   views: [
    //     {
    //       collapse: true,
    //       name: "Multi Level Collapse",
    //       rtlName: "انهيار متعدد المستويات",
    //       mini: "MLT",
    //       rtlMini: "ر",
    //       state: "multiCollapse",
    //       views: [
    //         {
    //           path: "/buttons",
    //           name: "Buttons",
    //           rtlName: "وصفت",
    //           mini: "B",
    //           rtlMini: "ب",
    //           component: <Buttons/>,
    //           layout: "/admin",
    //         },
    //       ],
    //     },
    //     {
    //       path: "/buttons",
    //       name: "Buttons",
    //       rtlName: "وصفت",
    //       mini: "B",
    //       rtlMini: "ب",
    //       component: <Buttons/>,
    //       layout: "/admin",
    //     },
    //     {
    //       path: "/grid-system",
    //       name: "Grid System",
    //       rtlName: "نظام الشبكة",
    //       mini: "GS",
    //       rtlMini: "زو",
    //       component: <Grid/>,
    //       layout: "/admin",
    //     },
    //     {
    //       path: "/panels",
    //       name: "Panels",
    //       rtlName: "لوحات",
    //       mini: "P",
    //       rtlMini: "ع",
    //       component: <Panels/>,
    //       layout: "/admin",
    //     },
    //     {
    //       path: "/sweet-alert",
    //       name: "Sweet Alert",
    //       rtlName: "الحلو تنبيه",
    //       mini: "SA",
    //       rtlMini: "ومن",
    //       component: <SweetAlert/>,
    //       layout: "/admin",
    //     },
    //     {
    //       path: "/notifications",
    //       name: "Notifications",
    //       rtlName: "إخطارات",
    //       mini: "N",
    //       rtlMini: "ن",
    //       component: <Notifications/>,
    //       layout: "/admin",
    //     },
    //     {
    //       path: "/icons",
    //       name: "Icons",
    //       rtlName: "الرموز",
    //       mini: "I",
    //       rtlMini: "و",
    //       component: <Icons/>,
    //       layout: "/admin",
    //     },
    //     {
    //       path: "/typography",
    //       name: "Typography",
    //       rtlName: "طباعة",
    //       mini: "T",
    //       rtlMini: "ر",
    //       component: <Typography/>,
    //       layout: "/admin",
    //     },
    //   ],
    // },
    // {
    //   collapse: true,
    //   name: "Forms",
    //   rtlName: "إستمارات",
    //   icon: "tim-icons icon-notes",
    //   state: "formsCollapse",
    //   permission: "forms",
    //   module: "forms",
    //   views: [
    //     {
    //       path: "/regular-forms",
    //       name: "Regular Forms",
    //       rtlName: "أشكال عادية",
    //       mini: "RF",
    //       rtlMini: "صو",
    //       component: <RegularForms/>,
    //       layout: "/admin",
    //     },
    //     {
    //       path: "/extended-forms",
    //       name: "Extended Forms",
    //       rtlName: "نماذج موسعة",
    //       mini: "EF",
    //       rtlMini: "هوو",
    //       component: <ExtendedForms/>,
    //       layout: "/admin",
    //     },
    //     {
    //       path: "/validation-forms",
    //       name: "Validation Forms",
    //       rtlName: "نماذج التحقق من الصحة",
    //       mini: "VF",
    //       rtlMini: "تو",
    //       component: <ValidationForms/>,
    //       layout: "/admin",
    //     },
    //     {
    //       path: "/wizard",
    //       name: "Wizard",
    //       rtlName: "ساحر",
    //       mini: "W",
    //       rtlMini: "ث",
    //       component: <Wizard/>,
    //       layout: "/admin",
    //     },
    //   ],
    // },
    // {
    //   collapse: true,
    //   name: "Tables",
    //   rtlName: "الجداول",
    //   icon: "tim-icons icon-puzzle-10",
    //   state: "tablesCollapse",
    //   permission: "tables",
    //   module: "tables",
    //   views: [
    //     {
    //       path: "/regular-tables",
    //       name: "Regular Tables",
    //       rtlName: "طاولات عادية",
    //       mini: "RT",
    //       rtlMini: "صر",
    //       component: <RegularTables/>,
    //       layout: "/admin",
    //     },
    //     {
    //       path: "/extended-tables",
    //       name: "Extended Tables",
    //       rtlName: "جداول ممتدة",
    //       mini: "ET",
    //       rtlMini: "هور",
    //       component: <ExtendedTables/>,
    //       layout: "/admin",
    //     },
    //     {
    //       path: "/react-tables",
    //       name: "React Tables",
    //       rtlName: "رد فعل الطاولة",
    //       mini: "RT",
    //       rtlMini: "در",
    //       component: <ReactTables/>,
    //       layout: "/admin",
    //     },
    //   ],
    // },
    // {
    //   collapse: true,
    //   name: "Maps",
    //   rtlName: "خرائط",
    //   icon: "tim-icons icon-pin",
    //   state: "mapsCollapse",
    //   permission: "maps",
    //   module: "maps",
    //   views: [
    //     {
    //       path: "/google-maps",
    //       name: "Google Maps",
    //       rtlName: "خرائط جوجل",
    //       mini: "GM",
    //       rtlMini: "زم",
    //       component: <GoogleMaps/>,
    //       layout: "/admin",
    //     },
    //     {
    //       path: "/full-screen-map",
    //       name: "Full Screen Map",
    //       rtlName: "خريطة كاملة الشاشة",
    //       mini: "FSM",
    //       rtlMini: "ووم",
    //       component: <FullScreenMap/>,
    //       layout: "/admin",
    //     },
    //     {
    //       path: "/vector-map",
    //       name: "Vector Map",
    //       rtlName: "خريطة المتجه",
    //       mini: "VM",
    //       rtlMini: "تم",
    //       component: <VectorMap/>,
    //       layout: "/admin",
    //     },
    //   ],
    // },
    // {
    //   path: "/widgets",
    //   name: "Widgets",
    //   rtlName: "الحاجيات",
    //   icon: "tim-icons icon-settings",
    //   component: <Widgets/>,
    //   layout: "/admin",
    //   permission: "widgets",
    //   module: "widgets",
    // },
    // {
    //   path: "/charts",
    //   name: "Charts",
    //   rtlName: "الرسوم البيانية",
    //   icon: "tim-icons icon-chart-bar-32",
    //   component: <Charts/>,
    //   layout: "/admin",
    //   permission: "charts",
    //   module: "charts",
    // },
    // {
    //   path: "/calendar",
    //   name: "Calendar",
    //   rtlName: "التقويم",
    //   icon: "tim-icons icon-time-alarm",
    //   component: <Calendar/>,
    //   layout: "/admin",
    //   permission: "calendar",
    //   module: "calendar",
    // },
];

export default routes;
