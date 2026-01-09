import React, { useEffect, useState } from 'react';
import {
    Badge,
    Button,
    Card,
    CardBody,
    CardHeader,
    CardTitle,
    Col,
    Collapse,
    Row,
    Spinner,
    Table,
    CustomInput
} from 'reactstrap';
import axios from 'axios';
import ProfileImageUpload from "../../components/ProfileImageUpload";
import { useLocation,useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import CstNotification from "../../components/CstNotification";

const MemberDetailsPage = () => {
    const { id: memberId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const bankId = location.state?.bankId
    const authStatus = useSelector((state) => state.auth?.authState);
    const [loadingAppPermission, setLoadingAppPermission] = useState(false);

    const [isKycPrinting, setIsKycPrinting] = useState(false);
    const [member, setMember] = useState(null);
    const [accounts, setAccounts] = useState({});
    const [loading, setLoading] = useState(true);
    const [alert, setAlert] = useState({
        display: false,
        color: "success",
        message: "",
        autoDismiss: 7,
        place: "tc",
        timestamp: new Date().getTime(),
    });
    const [collapseStates, setCollapseStates] = useState({
        address: true,
        kyc: true,
        nominee: true,
        bankAccounts: true,
    });

    const toggleCollapse = (section) => {
        setCollapseStates((prev) => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    useEffect(() => {
        const fetchMemberDetails = async () => {
            try {
                const res = await axios.get(`/api/member/view-member-details/${memberId}`, {
                    params:{bankId},
                    withCredentials: true
                });
                if (res.data?.member) {
                    setMember(res.data.member);
                    setAccounts(res.data.accounts || {});
                } else {
                    setMember(null);
                }
            } catch (err) {
                console.error('Failed to fetch member:', err);
                setMember(null);
            } finally {
                setLoading(false);
            }
        };

        if (memberId) fetchMemberDetails();
    }, [memberId]);

    const handleEditClick = () => {
        navigate(`/member/update-member`, {
            state: { member }
        });
    };
    const handlePrintKYC = async () => {
        if (!member?.id || !bankId || isKycPrinting) {
            if (!isKycPrinting) {
                setAlert({
                    display: true,
                    color: "warning",
                    message: "Member KYC form not available for printing.",
                    autoDismiss: 5,
                    place: "tc",
                    timestamp: new Date().getTime(),
                });
            }
            return;
        }

        setIsKycPrinting(true);

        try {
            const response = await axios.post(
                '/api/member/print-kyc-form',
                {
                    memberId: member.id,
                    bankId: bankId,
                },
                {
                    responseType: 'blob',
                    withCredentials: true,
                }
            );
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `KYC_Form_${member.id}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error('PDF download failed:', error);
            setAlert({
                display: true,
                color: "danger",
                message: error.response?.data?.error || "Failed to generate KYC PDF",
                autoDismiss: 7,
                place: "tc",
                timestamp: new Date().getTime(),
            });
        } finally {
            setIsKycPrinting(false);
        }
    };



    const handleViewTransactions = (acc) => {
        const accountNo = acc.account || acc.id;
        const openDate =
            acc.accountType === "loan" || acc.accountType === "group-loan"
                ? acc.loanDate
                : acc.openingDate;

        if (acc.accountType === "loan" || acc.accountType === "group-loan") {
            navigate(`/Active-Loan-Account/Details/${accountNo}/Transactions`, {
                state: {
                    transactions: acc.transactions || [],
                    loanData: {
                        loanNo: accountNo,
                        memberName: member?.name || "",
                        loanAmount: Number(acc.loanAmount || acc.disbursement || 0),
                        currentDebt:
                            ((Number(acc.totalEMI) || 0) - (Number(acc.paidEMI) || 0)) *
                            (Number(acc.emiAmount) || 0),
                        status: acc.status || "Active",
                    },
                },
            });
        } else if (acc.accountType === "savings") {
            navigate(`/deposit/savings-accounts/details/${accountNo}/transactions`, {
                state: {
                    transactions: acc.transactions || [],
                    accountData: {
                        account: accountNo,
                        memberName: member?.name || "N/A",
                        balance: Number(acc.balance) || 0,
                        openingAmount: Number(acc.openingAmount) || 0,
                        status: acc.status || "Active",
                        openingDate: openDate,
                        accountType: acc.accountType,
                    },
                },
            });
        } else {
            navigate(`/deposit/accounts-details/${accountNo}/transactionslist`, {
                state: {
                    transactions: acc.transactions || [],
                    accountData: {
                        account: accountNo,
                        memberName: member?.name || "N/A",
                        balance: Number(acc.balance) || 0,
                        openingAmount: Number(acc.openingAmount) || 0,
                        status: acc.status || "Active",
                        openingDate: openDate,
                        accountType: acc.accountType,
                    },
                },
            });
        }
    };

    const handleUserAppPermission = async (status) => {
        try {
            setLoadingAppPermission(true);
            const res = await axios.post("/api/member/user-app-permission", {
                memberId: member.id,
                bankId: bankId,
                userAppEnabled: status
            }, {
                withCredentials: true
            });

            // Check if response contains an error (from your backend error handling)
            if (res.data.error) {
                setAlert({
                    display: true,
                    color: "danger",
                    message: res.data.error,
                    autoDismiss: 7,
                    place: "tc",
                    timestamp: new Date().getTime(),
                });
                return;
            }

            // Success case
            if (res.data.success) {
                setMember(prev => ({
                    ...prev,
                    userAppEnabled: status
                }));

                setAlert({
                    display: true,
                    color: "success",
                    message: res.data.message || "User app permissions updated successfully!",
                    autoDismiss: 7,
                    place: "tc",
                    timestamp: new Date().getTime(),
                });
            }

        } catch (err) {
            console.error("Error updating user app permission:", err);

            // Handle error response
            const errorMessage = err.response?.data?.error ||
                err.message ||
                "Failed to update user permissions";

            setAlert({
                display: true,
                color: "danger",
                message: errorMessage,
                autoDismiss: 7,
                place: "tc",
                timestamp: new Date().getTime(),
            });
        } finally {
            setLoadingAppPermission(false);
        }
    };



    const handleViewAccount = (accountType, account) => {
        const accountNo = account.account || account.id;

        // Map account types to their routes
        const routeMap = {
            'savings': `/deposit/savings-accounts/details/${accountNo}`,
            'fixed-deposit': `/deposit/accounts/details/fixed-deposit/${accountNo}`,
            'recurring-deposit': `/deposit/accounts/details/recurring-deposit/${accountNo}`,
            'cash-certificate': `/deposit/accounts/details/cash-certificate/${accountNo}`,
            'daily-savings': `/deposit/daily-savings/details/${accountNo}`,
            'mis-deposit': `/deposit/accounts/details/mis-deposit/${accountNo}`,
            'thrift-fund': `/deposit/accounts/details/thrift-fund/${accountNo}`,
            'group-loan':`/Active-Group-Loan-Account/Details/${accountNo}`,
            'loan':`/Active-Loan-Account/Details/${accountNo}`
        };

        const route = routeMap[accountType];
        if (route) {
            navigate(route);
        } else {
            console.warn(`No route defined for account type: ${accountType}`);
        }

    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="text-center mt-5">
                <Spinner color="info" />
                <p>Loading member details...</p>
            </div>
        );
    }

    if (!member) {
        return <div className="text-center mt-5">Member not found.</div>;
    }

    const accountTypeLabels = {
        loan: 'Individual Loan',
        'group-loan': 'Group Loan',
        savings: 'Savings Account',
        'fixed-deposit': 'Fixed Deposit',
        'recurring-deposit': 'Recurring Deposit',
        'cash-certificate': 'Cash Certificate',
        'daily-savings': 'Daily Savings',
        'mis-deposit': 'MIS Deposit',
        'thrift-fund': 'Thrift Fund'
    };

    const cardHeaderStyle = {
        height: "32px",
        paddingTop: "0",
        paddingBottom: "0",
        display: "flex",
        alignItems: "center"
    };

    const cardTitleStyle = {
        fontSize:16,
        marginLeft:15,
        fontWeight:400
    }

    return (
        <div className="content" style={{ padding: '2rem' }}>
            {alert.display && <CstNotification color={alert.color} message={alert.message} autoDismiss={alert.autoDismiss} place={alert.place} timestamp={alert.timestamp}/>}
            {/* Header with Actions */}
            <Row className="mb-4">
                <Col md="12">
                    <div className="d-flex justify-content-between align-items-center p-3 bg-white rounded shadow-sm">
                        <div className="d-flex gap-2">
                            <Button color="primary" onClick={handleEditClick}>
                                Edit Member
                            </Button>
                            <Button color="primary"  onClick={() => {
                                navigate('/member/view-members/member-details/membership-fee')}}>
                                MemberShip Fee
                            </Button>
                        </div>
                        <div className="d-flex gap-2">
                            <Button color='info' onClick={handlePrintKYC} className="d-flex align-items-center">
                                {isKycPrinting ? (
                                    <>
                                        <Spinner size="sm" className="mr-2" />
                                        <span>Downloading...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Member KYC Form</span>
                                        {/* Assuming 'fa-download' is available in your icon library */}
                                        <i className="fa fa-download ml-2" style={{ marginLeft: '8px' }}></i>
                                    </>
                                )}
                            </Button>
                            <Button color="dark" onClick={() => navigate(-1)}>
                                Back
                            </Button>
                        </div>
                    </div>
                </Col>
            </Row>

            <Row>
                {/* Left Column */}
                <Col md="8">
                    {/* Personal Info */}
                    <Card className="shadow-lg border-0 mb-4">
                        {/*<CardHeader className="bg-light">*/}
                        {/*</CardHeader>*/}
                        {/*<CardHeader className="bg-light py-1">*/}
                        {/*    <CardTitle tag="h5" className="mb-0 text-black" style={{fontSize:16,marginLeft:15,fontWeight:400 }}>Member Details</CardTitle>*/}
                        {/*</CardHeader>*/}
                        <CardHeader
                            className="bg-light my-1"
                            style={cardHeaderStyle}
                        >
                            <CardTitle
                                tag="h5"
                                className="mb-0 text-black"
                                style={cardTitleStyle}
                            >
                                Member Details
                            </CardTitle>
                        </CardHeader>

                        <CardBody>
                            <Row>
                                <Col md="6">
                                    <ul className="list-group list-group-flush">
                                        <li className="list-group-item">
                                            <strong>Member ID:</strong> {member.id}
                                        </li>
                                        <li className="list-group-item">
                                            <strong>Name:</strong> {member.name || 'N/A'}
                                        </li>
                                        <li className="list-group-item">
                                            <strong>Father/Guardian:</strong> {member.guardian || 'N/A'}
                                        </li>
                                        <li className="list-group-item">
                                            <strong>Date of Birth:</strong> {member.dob ? formatDate(member.dob) : 'N/A'}
                                        </li>
                                        <li className="list-group-item">
                                            <strong>Gender:</strong> {member.gender || 'N/A'}
                                        </li>
                                        <li className="list-group-item">
                                            <strong>Marital Status:</strong> {member.materialStatus || 'N/A'}
                                        </li>
                                        <li className="list-group-item">
                                            <strong>Monthly Income:</strong> ₹{member.income || 'N/A'}
                                        </li>
                                    </ul>
                                </Col>
                                <Col md="6">
                                    <ul className="list-group list-group-flush">
                                        <li className="list-group-item">
                                            <strong>Phone:</strong> {member.phone || 'N/A'}
                                        </li>
                                        <li className="list-group-item">
                                            <strong>Email:</strong> {member.email || 'N/A'}
                                        </li>
                                        <li className="list-group-item">
                                            <strong>Aadhar:</strong> {member.aadhar || 'N/A'}
                                        </li>
                                        <li className="list-group-item">
                                            <strong>PAN:</strong> {member.pan || 'N/A'}
                                        </li>
                                        <li className="list-group-item">
                                            <strong>Voter ID:</strong> {member.voter || 'N/A'}
                                        </li>
                                        <li className="list-group-item">
                                            <strong>Joining Date:</strong> {member.date ? formatDate(member.date) : 'N/A'}
                                        </li>
                                        <li className="list-group-item">
                                            <strong>Status:</strong>
                                            <Badge color={member.active !== false ? 'success' : 'danger'} className="ms-2">
                                                {member.active !== false ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </li>
                                    </ul>
                                </Col>
                            </Row>
                        </CardBody>
                    </Card>
                    {/* KYC Section */}
                    <Card className="shadow-lg border-0 mb-4">
                        <CardHeader className="bg-light" style={cardHeaderStyle}>
                            <Button
                                color="link"
                                className="p-0 text-dark text-decoration-none"
                                onClick={() => toggleCollapse('kyc')}
                            >
                                <CardTitle tag="h5" className="mb-0 d-inline" style={cardTitleStyle}>
                                    KYC
                                </CardTitle>
                                <i className={`fas fa-chevron-${collapseStates.kyc ? 'up' : 'down'} ms-2`}></i>
                            </Button>
                        </CardHeader>
                        <Collapse isOpen={collapseStates.kyc}>
                            <CardBody>
                                <Row className="mb-4">
                                    <Col md="4">
                                        <ul className="list-group list-group-flush">
                                            <li className="list-group-item">
                                                <strong>Aadhar:</strong> {member.aadhar || 'N/A'}
                                            </li>
                                        </ul>
                                    </Col>
                                    <Col md="4">
                                        <ul className="list-group list-group-flush">
                                            <li className="list-group-item">
                                                <strong>PAN:</strong> {member.pan || 'N/A'}
                                            </li>
                                        </ul>
                                    </Col>
                                    <Col md="4">
                                        <ul className="list-group list-group-flush">
                                            <li className="list-group-item">
                                                <strong>Voter ID:</strong> {member.voter || 'N/A'}
                                            </li>
                                        </ul>
                                    </Col>
                                </Row>
                                <div className="mt-4 pt-3 border-top">
                                    <h6 className="mb-3 text-center"><strong>Documents</strong></h6>
                                    {authStatus?.bankId && member?.uuid ? (
                                        <Row className="g-4 justify-content-center">
                                            <Col md="3" className="text-center">
                                                <ProfileImageUpload
                                                    id="profile"
                                                    setAlert={setAlert}
                                                    uuid={member.uuid}
                                                    bankId={authStatus.bankId}
                                                    changeBtnClasses="btn-simple"
                                                    addBtnClasses="btn-simple"
                                                    removeBtnClasses="btn-simple"
                                                />
                                                <p className="mt-1 mb-0 text-muted small">Profile Photo</p>
                                            </Col>
                                            <Col md="3" className="text-center">
                                                <ProfileImageUpload
                                                    id="signature"
                                                    setAlert={setAlert}
                                                    uuid={member.uuid}
                                                    bankId={authStatus.bankId}
                                                    changeBtnClasses="btn-simple"
                                                    addBtnClasses="btn-simple"
                                                    removeBtnClasses="btn-simple"
                                                />
                                                <p className="mt-1 mb-0 text-muted small">Signature</p>
                                            </Col>
                                            <Col md="3" className="text-center">
                                                <ProfileImageUpload
                                                    id="id-proof"
                                                    setAlert={setAlert}
                                                    uuid={member.uuid}
                                                    bankId={authStatus.bankId}
                                                    changeBtnClasses="btn-simple"
                                                    addBtnClasses="btn-simple"
                                                    removeBtnClasses="btn-simple"
                                                />
                                                <p className="mt-1 mb-0 text-muted small">ID Proof</p>
                                            </Col>
                                            <Col md="3" className="text-center">
                                                <ProfileImageUpload
                                                    id="address-proof"
                                                    setAlert={setAlert}
                                                    uuid={member.uuid}
                                                    bankId={authStatus.bankId}
                                                    changeBtnClasses="btn-simple"
                                                    addBtnClasses="btn-simple"
                                                    removeBtnClasses="btn-simple"
                                                />
                                                <p className="mt-1 mb-0 text-muted small">Address Proof</p>
                                            </Col>
                                        </Row>
                                    ) : (
                                        <div className="text-center py-2">
                                            <p className="text-muted">Documents not available.</p>
                                        </div>
                                    )}
                                </div>
                            </CardBody>
                        </Collapse>
                    </Card>

                    {/* Bank Accounts  */}
                    <Card className="shadow-lg border-0 mb-4">
                        <CardHeader className="bg-light" style={cardHeaderStyle}>
                            <Button
                                color="link"
                                className="p-0 text-dark text-decoration-none"
                                onClick={() => toggleCollapse('bankAccounts')}
                            >
                                <CardTitle tag="h5" className="mb-0 d-inline" style={cardTitleStyle}>
                                    Bank Accounts
                                </CardTitle>
                                <i className={`fas fa-chevron-${collapseStates.bankAccounts ? 'up' : 'down'} ms-2`}></i>
                            </Button>
                        </CardHeader>
                        <Collapse isOpen={collapseStates.bankAccounts}>
                            <CardBody style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                <Table striped hover responsive size="sm">
                                    <thead>
                                    <tr>
                                        <th>Account Type</th>
                                        <th>Account No</th>
                                        <th>Open Date</th>
                                        <th>Transactions</th> {/* 👈 New column */}
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {(() => {
                                        const allAccountTypes = [
                                            'savings',
                                            'fixed-deposit',
                                            'recurring-deposit',
                                            'cash-certificate',
                                            'daily-savings',
                                            'mis-deposit',
                                            'thrift-fund',
                                            'loan',
                                            'group-loan'
                                        ];

                                        const allAccounts = [];
                                        allAccountTypes.forEach(type => {
                                            const list = accounts[type] || [];
                                            list.forEach(acc => {
                                                allAccounts.push({ ...acc, accountType: type });
                                            });
                                        });

                                        if (allAccounts.length === 0) {
                                            return (
                                                <tr>
                                                    <td colSpan="4" className="text-center text-muted">
                                                        No accounts found.
                                                    </td>
                                                </tr>
                                            );
                                        }

                                        // map — over allAccounts
                                        return allAccounts.map((acc) => {
                                            const openDate =
                                                acc.accountType === 'loan' || acc.accountType === 'group-loan'
                                                    ? acc.loanDate
                                                    : acc.openingDate;

                                            return (
                                                <tr key={acc.id || acc.account}>
                                                    <td>{accountTypeLabels[acc.accountType] || acc.accountType}</td>
                                                    <td>
                                                        <Button
                                                            color="link"
                                                            size="sm"
                                                            className="p-0 text-info"
                                                            onClick={() => handleViewAccount(acc.accountType, acc)}
                                                        >
                                                            {acc.account || acc.id}
                                                        </Button>
                                                    </td>
                                                    <td>{formatDate(openDate)}</td>
                                                    <td>
                                                        <Button
                                                            color="link"
                                                            size="sm"
                                                            className="p-0 text-primary"
                                                            onClick={() => handleViewTransactions(acc)} // ✅ pass acc
                                                        >
                                                            View Transactions
                                                        </Button>
                                                    </td>
                                                </tr>
                                            );
                                        });
                                    })()}
                                    </tbody>
                                </Table>
                            </CardBody>
                        </Collapse>
                    </Card>
                </Col>

                {/* Right Column */}
                <Col md="4">
                    {/* Member Summary */}
                    <Card className="shadow-lg border-0 mb-4">
                        <CardHeader className="bg-light" style={cardHeaderStyle}>
                            <CardTitle tag="h5" className="mb-0 text-black" style={cardTitleStyle}>Member Summary</CardTitle>
                        </CardHeader>
                        <CardBody>
                            <ul className="list-group list-group-flush">
                                <li className="list-group-item d-flex justify-content-between">
                                    <span>Total Accounts</span>
                                    <strong>
                                        {Object.values(accounts).reduce((sum, list) => sum + list.length, 0)}
                                    </strong>
                                </li>
                                {(() => {
                                    const balanceAccountTypes = [
                                        'savings',
                                        'fixed-deposit',
                                        'recurring-deposit',
                                        'cash-certificate',
                                        'daily-savings',
                                        'mis-deposit',
                                        'thrift-fund'
                                    ];
                                    const totalBalance = balanceAccountTypes.reduce((sum, type) => {
                                        const list = accounts[type] || [];
                                        return sum + list.reduce((acc, account) => {
                                            const bal = parseFloat(account.balance) || 0;
                                            return acc + bal;
                                        }, 0);
                                    }, 0);
                                    return totalBalance > 0 ? (
                                        <li className="list-group-item d-flex justify-content-between">
                                            <span><strong>Total Balance</strong></span>
                                            <strong className="text-success">₹{totalBalance.toFixed(2)}</strong>
                                        </li>
                                    ) : null;
                                })()}
                                {(() => {
                                    const individualLoans = accounts.loan || [];
                                    const individualDue = individualLoans.reduce((sum, loan) => {
                                        const remainingEMI = (loan.totalEMI || 0) - (loan.paidEMI || 0);
                                        return sum + (remainingEMI * (loan.emiAmount || 0));
                                    }, 0);
                                    const groupLoans = accounts['group-loan'] || [];
                                    const groupDue = groupLoans.reduce((sum, loan) => {
                                        const remainingEMI = (loan.totalEMI || 0) - (loan.paidEMI || 0);
                                        return sum + (remainingEMI * (loan.emiAmount || 0));
                                    }, 0);
                                    const totalLoanDue = individualDue + groupDue;
                                    return totalLoanDue > 0 ? (
                                        <li className="list-group-item d-flex justify-content-between">
                                            <span><strong>Total Loan Due</strong></span>
                                            <strong className="text-danger">₹{totalLoanDue.toFixed(2)}</strong>
                                        </li>
                                    ) : null;
                                })()}
                            </ul>
                        </CardBody>
                    </Card>

                    {/*  Internet Banking */}
                    <Card className="shadow-lg border-0 mb-4">
                        <CardHeader className="bg-light" style={cardHeaderStyle}>
                            <CardTitle tag="h5" className="mb-0" style={cardTitleStyle}>Internet Banking</CardTitle>
                        </CardHeader>
                        <CardBody>
                            <ul className="list-group list-group-flush">
                                <li className="list-group-item d-flex justify-content-between">
                                    <span><strong>Username</strong></span>
                                    <span>{member.phone || 'N/A'}</span>
                                </li>
                                <li className="list-group-item">
                                    <div className="d-flex align-items-center">
                                        <span className="mr-2"><strong>Internet Banking / Mobile App:</strong></span>
                                        <CustomInput
                                            type="switch"
                                            id="internet-banking-status"
                                            className="mb-4"
                                            checked={member.userAppEnabled === true}
                                            onChange={(e) => handleUserAppPermission(e.target.checked)}
                                            label=""
                                            disabled={loadingAppPermission}
                                        />
                                        {loadingAppPermission && (
                                            <div><Spinner color="info" className="spinner-border-sm"/></div>
                                        )}

                                        <span
                                            className={`ml-2 font-weight-bold ${
                                                member.userAppEnabled ? 'text-success' : 'text-danger'
                                            }`}
                                        >
                {member.userAppEnabled ? 'Enabled' : 'Disabled'}
                </span>
                                    </div>
                                </li>
                            </ul>
                        </CardBody>
                    </Card>
                    {/* Address*/}
                    <Card className="shadow-lg border-0 mb-4">
                        <CardHeader className="bg-light" style={cardHeaderStyle}>
                            <Button
                                color="link"
                                className="p-0 text-dark text-decoration-none"
                                onClick={() => toggleCollapse('address')}
                            >
                                <CardTitle tag="h5" className="mb-0 d-inline" style={cardTitleStyle}>
                                    Address
                                </CardTitle>
                                <i className={`fas fa-chevron-${collapseStates.address ? 'up' : 'down'} ms-2`}></i>
                            </Button>
                        </CardHeader>
                        <Collapse isOpen={collapseStates.address}>
                            <CardBody>
                                <p className="mb-1">{member.address || 'N/A'}</p>
                            </CardBody>
                        </Collapse>
                    </Card>

                    {/* Nominee Info */}
                    <Card className="shadow-lg border-0 mb-4">
                        <CardHeader className="bg-light" style={cardHeaderStyle}>
                            <Button
                                color="link"
                                className="p-0 text-dark text-decoration-none"
                                onClick={() => toggleCollapse('nominee')}
                            >
                                <CardTitle tag="h5" className="mb-0 d-inline" style={cardTitleStyle}>
                                    Nominee Information
                                </CardTitle>
                                <i className={`fas fa-chevron-${collapseStates.nominee ? 'up' : 'down'} ms-2`}></i>
                            </Button>
                        </CardHeader>
                        <Collapse isOpen={collapseStates.nominee}>
                            <CardBody>
                                <Row>
                                    <Col md="6">
                                        <ul className="list-group list-group-flush">
                                            <li className="list-group-item">
                                                <strong>Name:</strong> {member.nominee?.name || 'N/A'}
                                            </li>
                                            <li className="list-group-item">
                                                <strong>Relation:</strong> {member.nominee?.relation || 'N/A'}
                                            </li>
                                            <li className="list-group-item">
                                                <strong>Date of Birth:</strong> {member.nominee?.dob ? formatDate(member.nominee.dob) : 'N/A'}
                                            </li>
                                        </ul>
                                    </Col>
                                    <Col md="6">
                                        <ul className="list-group list-group-flush">
                                            <li className="list-group-item">
                                                <strong>Aadhar:</strong> {member.nominee?.aadhar || 'N/A'}
                                            </li>
                                            <li className="list-group-item">
                                                <strong>PAN:</strong> {member.nominee?.pan || 'N/A'}
                                            </li>
                                            <li className="list-group-item">
                                                <strong>Voter ID:</strong> {member.nominee?.voter || 'N/A'}
                                            </li>
                                        </ul>
                                    </Col>
                                </Row>
                            </CardBody>
                        </Collapse>
                    </Card>

                    {/* Quick Actions */}
                    <Card className="shadow-lg border-0 mb-4">
                        <CardHeader className="bg-light" style={cardHeaderStyle}>
                            <CardTitle tag="h5" className="mb-0" style={cardTitleStyle}>Quick Actions</CardTitle>
                        </CardHeader>
                        <CardBody>
                            <Button
                                color="success"
                                block
                                className="mb-2"
                                onClick={() => {
                                    navigate('/loan/loan-application', {
                                        state: { memberId: member.id }
                                    });
                                }}
                            >
                                + New Loan Account
                            </Button>
                            <Button
                                color="info"
                                block
                                className="mb-2"
                                onClick={() => {
                                    navigate('/deposit/savings-account-opening', {
                                        state: { memberId: member.id }
                                    });
                                }}
                            >
                                + New Savings
                            </Button>
                            <Button
                                color="primary"
                                block
                                className="mb-2"
                                onClick={() => {
                                    navigate('/deposit/account-opening', {
                                        state: { memberId: member.id }
                                    });
                                }}
                            >
                                + New Term Deposit
                            </Button>
                            <Button
                                color="warning"
                                block
                                className="mb-2"
                                onClick={() => {
                                    navigate('/deposit/ot-account-opening', {
                                        state: { memberId: member.id }
                                    });
                                }}
                            >
                                + New FD/CC/MIS
                            </Button>
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default MemberDetailsPage;