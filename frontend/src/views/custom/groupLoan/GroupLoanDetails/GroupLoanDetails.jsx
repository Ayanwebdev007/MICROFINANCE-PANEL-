import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
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
    Input, UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem
} from 'reactstrap';
import axios from 'axios';
import ProfileImageUpload from '../../components/ProfileImageUpload';
import { useSelector } from 'react-redux';
import {CircularProgress} from "@mui/material";

const GroupLoanDetailsPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { loanNo } = useParams();
    const authStatus = useSelector((state) => state.auth?.authState);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [collapseStates, setCollapseStates] = useState({
        documents: false,
        comments: false,
        businessLoan: false,
        updateInfo: false,
    });
    const [alert, setAlert] = useState({
        color: 'success',
        message: '',
        autoDismiss: 7,
        place: 'tc',
        display: false,
        sweetAlert: false,
        timestamp: new Date().getTime(),
    });

    const [firstEmiDate, setFirstEmiDate] = useState('');
    const [isEditingFirstEmi, setIsEditingFirstEmi] = useState(false);
    const [tempFirstEmiDate, setTempFirstEmiDate] = useState('');

    const toggleCollapse = (section) => {
        setCollapseStates((prev) => ({
            ...prev,
            [section]: !prev[section],
        }));
    };

    useEffect(() => {
        const fetchLoanDetails = async () => {
            try {
                const res = await axios.get(`/api/reports/loan/active-accounts/group-loan/${loanNo}`, {
                    withCredentials: true,
                });

                if (res.data?.details?.length > 0) {

                    console.log(res.data);
                    const detail = res.data.details[0];
                    const paidEMI = detail.paidEMI || 0;
                    const totalEMI = detail.totalEMI || 0;
                    const installmentAmount = detail.installmentAmount || 0;
                    const remainingEMI = totalEMI - paidEMI;
                    const currentDebt = remainingEMI * installmentAmount;

                    setData({
                        loanNo,
                        memberName: detail.name || '',
                        memberNo: detail.memberNo || '',
                        branch: location.state?.branch || '',
                        scheme: detail.scheme || '',
                        status: detail.status || '',
                        loanAmount: detail.disbursement || 0,
                        currentDebt,
                        openDate: detail.openingDate || '',
                        loanType: detail.planDetails?.type || 'N/A',
                        emiCollection: detail.emiCollection || '',
                        installmentAmount,
                        paidEMI,
                        totalEMI,
                        phone: detail.phone || '',
                        groupName: detail.groupName || detail.group?.name || 'N/A',
                        foreclosureStatus:detail.foreclosureStatus || 'N/A',
                        foreclosureRequestId:detail.foreclosureRequestId  || 'N/A',
                        coApplicant: detail.coApplicant || {},
                        guarantor: detail.guarantor || {},
                        transactions: res.data.transactions || [],
                        deductionDetails: detail.deductionDetails || {},
                        planDetails: detail.planDetails || {},
                        bankId: detail.bankId || authStatus?.bankId || '',
                        uuid: detail.uuid || '#',
                        account: detail.account || loanNo,
                    });
                    const actualFirstEmiDate = detail.firstEmiDate || '';
                    setFirstEmiDate(actualFirstEmiDate);
                    setTempFirstEmiDate(actualFirstEmiDate);

                } else {
                    setData(null);
                }
            } catch (err) {
                console.error('Error fetching group loan details:', err);
                setData(null);
            } finally {
                setLoading(false);
            }
        };

        fetchLoanDetails();
    }, [loanNo, authStatus?.bankId]);

    const calculateDueDays = (openDate) => {
        if (!openDate) return 0;
        const today = new Date();
        const openDateObj = new Date(openDate);
        const timeDiff = Math.abs(today.getTime() - openDateObj.getTime());
        return Math.ceil(timeDiff / (1000 * 3600 * 24));
    };

    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case 'active':
                return 'success';
            case 'closed':
                return 'secondary';
            case 'overdue':
                return 'danger';
            default:
                return 'primary';
        }
    };

    const getFromDate = (days) => {
        const date = new Date();
        date.setDate(date.getDate() - days);
        return date.toISOString().split('T')[0]; // YYYY-MM-DD
    };


    const handleLoanStatementClick = () => {
        navigate('/loan/Loan-Statement', {
            state: {
                prefillAccountNo: loanNo,
                prefillFrom: getFromDate(30),
                prefillTo: new Date().toISOString().slice(0, 10),
            },
        });
    };

    const handleViewTransactionsClick = () => {
        navigate(`/Active-Loan-Account/Details/${loanNo}/Transactions`, {
            state: {
                transactions: data?.transactions || [],
                loanData: {
                    loanNo: data?.loanNo || loanNo,
                    memberName: data?.memberName || '',
                    loanAmount: data?.loanAmount || 0,
                    currentDebt: data?.currentDebt || 0,
                    status: data?.status || '',
                },
            },
        });
    };

    const handleLoanRepaymentClick = () => {
        navigate('/loan/group-loan-repayment', {
            state: {
                prefillAccountNo: loanNo,
                loanData: data,
                transactions: data?.transactions,
            },
        });
    };

    const handleViewScheduleClick = () => {
        navigate(`/loan/loan-accounts/details/${loanNo}/emiSchedule`, {
            state: {
                loanData: data,
                bankInfo: authStatus?.bankInfo,
            },
        });


    };
    const accountType = "group-loan";
    const handleForeClose= () => {
        navigate(`/loan/loan-accounts/details/foreclose/${loanNo}`, {
            state: {
                loanData: data,
                bankInfo: authStatus?.bankInfo,
                accountType: accountType,
            },
        });
    };

    const handleUpdateFirstEmiDate = async () => {
        if (!tempFirstEmiDate) return;
        try {
            await axios.post(
                `/api/loan/update-first-emi-date/group-loan`,
                { account: loanNo, firstEmiDate: tempFirstEmiDate },
                { withCredentials: true }
            );
            setFirstEmiDate(tempFirstEmiDate);
            setIsEditingFirstEmi(false);
            setAlert({
                display: true,
                color: 'success',
                message: 'First EMI date updated successfully!',
                autoDismiss: 5,
                place: 'tc',
            });
        } catch (err) {
            const msg = err.response?.data?.error || 'Failed to update First EMI Date';
            setAlert({
                display: true,
                color: 'danger',
                message: msg,
                autoDismiss: 5,
                place: 'tc',
            });
        }
    };

    const handelGroupLoanSanctionLetter = async  () => {
        try {
            const res = await axios.get(
                `/api/group-loan/${data.loanNo}/sanction-letter/print`,
                {
                    responseType: "blob", // 🚨 REQUIRED
                    withCredentials: true // keep if auth needed
                }
            );

            // ✅ res.data IS THE PDF
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement("a");
            a.href = url;
            a.download = `Group_Loan_sanction.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            console.log("api fatch");

        } catch (err) {
            console.error("PDF download failed:", err);
        }
    }


    if (loading) {
        return (
            <div className="text-center mt-5">
                <Spinner color="info" />
                <p>Loading loan details...</p>
            </div>
        );
    }

    if (!data) {
        return <div className="text-center mt-5">No loan data found.</div>;
    }

    const documentUuid = data.uuid;
    const documentBankId = authStatus?.bankId;

    return (
        <div className="content" style={{ padding: '2rem' }}>
            {/* Top Navigation */}
            {/*<Row className="mb-4">*/}
            {/*    <Col md="12">*/}
            {/*        <div className="d-flex justify-content-between align-items-center p-3 bg-white rounded shadow-sm">*/}
            {/*            <div>*/}
            {/*                <h4 className="mb-0">Group Loan Account Details - {loanNo}</h4>*/}
            {/*            </div>*/}
            {/*            <div>*/}
            {/*                <Button onClick={handleViewScheduleClick} className="me-2" color="info">*/}
            {/*                    View Repayment Schedule*/}
            {/*                </Button>*/}
            {/*                <Button onClick={handleForeClose} color="info">*/}
            {/*                    ForeClose*/}
            {/*                </Button>*/}
            {/*                <Button onClick={handleViewTransactionsClick} className="me-2" color="primary">*/}
            {/*                    View Transactions*/}
            {/*                </Button>*/}
            {/*                <Button onClick={handleLoanRepaymentClick} className="me-2" color="warning">*/}
            {/*                    Loan Repayment*/}
            {/*                </Button>*/}
            {/*                <Button color="light" onClick={() => navigate(-1)} className="me-2">*/}
            {/*                    Back*/}
            {/*                </Button>*/}
            {/*            </div>*/}
            {/*        </div>*/}
            {/*    </Col>*/}
            {/*</Row>*/}

            {/*New design top header| start*/}
            <Row className="mb-4">
                <Col md="12">
                    <div className="d-flex justify-content-between align-items-center p-3 bg-white rounded shadow-sm">
                        {/* Left Side: Action Buttons */}
                        <div className="d-flex gap-2">
                            <Button color="info" onClick={handleForeClose}>
                                ForeClose
                            </Button>
                            <Button onClick={handleViewTransactionsClick} color="primary">
                                View Transactions
                            </Button>
                            <Button onClick={handleLoanRepaymentClick} color="warning">
                                Loan RePayment
                            </Button>
                            <Button onClick={handleLoanStatementClick} color="dark" className="me-2">
                                Loan Statement
                            </Button>
                        </div>
                        {/* Right Side: Print Dropdown & Back */}
                        <div className="d-flex gap-2">
                            {/*{progressbar ? <CircularProgress className={'mr-2'} color="secondary"/>: null}*/}
                            <UncontrolledDropdown className="me-2">
                                <DropdownToggle color="dark" caret>
                                    🖨️ Print
                                </DropdownToggle>
                                <DropdownMenu>
                                    <DropdownItem >
                                        Loan Repayment Schedule
                                    </DropdownItem>

                                    <DropdownItem >
                                        Loan Agreement
                                    </DropdownItem>

                                    <DropdownItem onClick={handelGroupLoanSanctionLetter}>
                                        Loan Sanction Latter
                                    </DropdownItem>
                                    {data?.foreclosureStatus === "pending" && (
                                        <DropdownItem >
                                            Foreclosure Request
                                        </DropdownItem>
                                    )}
                                </DropdownMenu>
                            </UncontrolledDropdown>

                            <Button color="dark" onClick={() => navigate(-1)}>
                                Back
                            </Button>
                        </div>
                    </div>
                </Col>
            </Row>

            {/*New design top header| END*/}

            <Row>
                {/* Loan Details */}
                <Col md="8">
                    <Card className="shadow-lg border-0 mb-4">
                        {/*<CardHeader className="bg-light">*/}
                        {/*    <CardTitle tag="h5" className="mb-0">*/}
                        {/*        Loan Details*/}
                        {/*    </CardTitle>*/}
                        {/*</CardHeader>*/}
                        <CardHeader
                            className="bg-light d-flex align-items-center"
                            style={{
                                padding: '14px 20px',
                                borderBottom: '1px solid #dee2e6',
                            }}
                        >
                            <CardTitle
                                tag="h5"
                                className="mb-0"
                                style={{
                                    fontWeight: 600,
                                    fontSize: '1.05rem',
                                    color: '#2c3e50',
                                    letterSpacing: '0.3px',
                                }}
                            >
                                Loan Details
                            </CardTitle>
                        </CardHeader>
                        {/*<CardHeader*/}
                        {/*    className="bg-light d-flex flex-column"*/}
                        {/*    style={{ padding: '14px 20px', borderBottom: '1px solid #dee2e6' }}*/}
                        {/*>*/}
                        {/*    <CardTitle*/}
                        {/*        tag="h5"*/}
                        {/*        className="mb-1"*/}
                        {/*        style={{ fontWeight: 600, fontSize: '1.05rem', color: '#2c3e50' }}*/}
                        {/*    >*/}
                        {/*        Loan Details*/}
                        {/*    </CardTitle>*/}

                        {/*    {data?.groupName && (*/}
                        {/*        <small style={{ color: '#6c757d' }}>*/}
                        {/*            Group: <strong>{data.groupName}</strong>*/}
                        {/*        </small>*/}
                        {/*    )}*/}
                        {/*</CardHeader>*/}

                        <CardBody>
                            <Row>
                                <Col md="6">
                                    <ul className="list-group list-group-flush">
                                        <li className="list-group-item">
                                            <strong>Group Name:</strong> {data.groupName || 'N/A'}
                                        </li>
                                        <li className="list-group-item">
                                            <strong>Loan No(Account No) :</strong> {data.loanNo}
                                        </li>
                                        <li className="list-group-item">
                                            <strong>Member Name:</strong> {data.memberName}
                                        </li>
                                        <li className="list-group-item">
                                            <strong>Member No:</strong> {data.memberNo}
                                        </li>
                                        <li className="list-group-item">
                                            <strong>EMI: ₹</strong> {data.installmentAmount}
                                        </li>
                                        <li className="list-group-item">
                                            <strong>Scheme:</strong> {data.scheme}
                                        </li>
                                        <li className="list-group-item">
                                            <strong>Status:</strong>
                                            <Badge color={getStatusBadge(data.status)} className="ms-2">
                                                {data.status}
                                            </Badge>
                                        </li>
                                    </ul>
                                </Col>
                                <Col md="6">
                                    <ul className="list-group list-group-flush">
                                        <li className="list-group-item">
                                            <strong>Loan Amount:</strong> ₹{data.loanAmount?.toFixed(2)}
                                        </li>
                                        <li className="list-group-item">
                                            <strong>Current Debt:</strong> ₹{data.currentDebt?.toFixed(2)}
                                        </li>
                                        <li className="list-group-item">
                                            <strong>Open Date:</strong> {data.openDate}
                                        </li>
                                        <li className="list-group-item">
                                            <strong>Loan Type:</strong> {data.loanType}
                                        </li>
                                        <li className="list-group-item">
                                            <strong>EMI Collection:</strong> {data.emiCollection}
                                        </li>
                                        <li className="list-group-item">
                                            <strong>Phone:</strong> {data.phone}
                                        </li>
                                    </ul>
                                </Col>
                            </Row>
                        </CardBody>
                    </Card>

                    {/* Transaction History */}
                    <Card className="shadow-lg border-0 mb-4">
                        <CardHeader className="bg-light">
                            <CardTitle tag="h5" className="mb-0">
                                Transaction History
                            </CardTitle>
                        </CardHeader>
                        <CardBody>
                            <Table striped hover responsive>
                                <thead>
                                <tr>
                                    <th>SL No.</th>
                                    <th>Date</th>
                                    <th>Principal</th>
                                    <th>Interest</th>
                                    <th>Amount</th>
                                    <th>Type</th>
                                </tr>
                                </thead>
                                <tbody>
                                {data.transactions.map((transaction, index) => (
                                    <tr key={index}>
                                        <td>{index + 1}</td>
                                        <td>{transaction.entryDate || '-'}</td>
                                        <td>{transaction.principle?.toFixed(2) || 'NA'}</td>
                                        <td>{transaction.interest?.toFixed(2) || 'NA'}</td>
                                        <td>₹{transaction.amount?.toFixed(2) || '0.00'}</td>
                                        <td>{transaction.type}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </Table>
                        </CardBody>
                    </Card>

                    {/* Documents Section */}
                    <Card className="shadow-lg border-0 mb-4">
                        <CardHeader className="bg-light">
                            <Button
                                color="link"
                                className="p-0 text-dark text-decoration-none"
                                onClick={() => toggleCollapse('documents')}
                            >
                                <CardTitle tag="h5" className="mb-0 d-inline">
                                    Documents
                                </CardTitle>
                                <i className={`fas fa-chevron-${collapseStates.documents ? 'up' : 'down'} ms-2`}></i>
                            </Button>
                        </CardHeader>
                        <Collapse isOpen={collapseStates.documents}>
                            <CardBody>
                                {documentBankId ? (
                                    <Row>
                                        {/* Loan Agreement */}
                                        <Col md={3} className="mb-3">
                                            <ProfileImageUpload
                                                id="loan-agreement"
                                                setAlert={setAlert}
                                                uuid={documentUuid}
                                                bankId={documentBankId}
                                                changeBtnClasses="btn-simple"
                                                addBtnClasses="btn-simple"
                                                removeBtnClasses="btn-simple"
                                            />
                                            <p className="mt-1 mb-0 text-muted small">Upload Loan Agreement.</p>
                                        </Col>
                                        {/* ID Proof */}
                                        <Col md={3} className="mb-3">
                                            <ProfileImageUpload
                                                id="id-proof"
                                                setAlert={setAlert}
                                                uuid={documentUuid}
                                                bankId={documentBankId}
                                                changeBtnClasses="btn-simple"
                                                addBtnClasses="btn-simple"
                                                removeBtnClasses="btn-simple"
                                            />
                                            <p className="mt-1 mb-0 text-muted small">Upload ID Proof Document.</p>
                                        </Col>
                                        <Col md={3} className="mb-3">
                                            <ProfileImageUpload
                                                id="profile"
                                                setAlert={setAlert}
                                                uuid={documentUuid}
                                                bankId={documentBankId}
                                                changeBtnClasses="btn-simple"
                                                addBtnClasses="btn-simple"
                                                removeBtnClasses="btn-simple"
                                            />
                                            <p className="mt-1 mb-0 text-muted small">Upload Profile Image.</p>
                                        </Col>
                                        {/* Signature */}
                                        <Col md={3} className="mb-3">
                                            <ProfileImageUpload
                                                id="signature"
                                                setAlert={setAlert}
                                                uuid={documentUuid}
                                                bankId={documentBankId}
                                                changeBtnClasses="btn-simple"
                                                addBtnClasses="btn-simple"
                                                removeBtnClasses="btn-simple"
                                            />
                                            <p className="mt-1 mb-0 text-muted small">Upload Loan Signature.</p>
                                        </Col>
                                    </Row>
                                ) : (
                                    <p className="text-muted">Bank ID not available. Document uploads disabled.</p>
                                )}
                            </CardBody>
                        </Collapse>
                    </Card>
                </Col>

                {/* Sidebar */}
                <Col md="4">
                    {/* Balance Report */}
                    <Card className="shadow-lg border-0 mb-4">
                        <CardHeader className="bg-light">
                            <CardTitle tag="h5" className="mb-0">
                                Balance Report
                            </CardTitle>
                        </CardHeader>
                        <CardBody>
                            <ul className="list-group list-group-flush">
                                <li className="list-group-item d-flex justify-content-between">
                  <span>
                    <strong>Outstanding Balance</strong>
                  </span>
                                    <span className="text-danger">₹{data.currentDebt?.toFixed(2)}</span>
                                </li>
                                <li className="list-group-item d-flex justify-content-between">
                  <span>
                    <strong>Sanctioned Loan Amount</strong>
                  </span>
                                    <span className="text-success">₹{data.loanAmount?.toFixed(2)}</span>
                                </li>
                                <li className="list-group-item d-flex justify-content-between">
                  <span>
                    <strong>Days Since Loan Opened</strong>
                  </span>
                                    <span>{calculateDueDays(data.openDate)}</span>
                                </li>
                                <li className="list-group-item">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <strong>First EMI Date</strong>
                                        {firstEmiDate ? (
                                            <span className="text-success">{firstEmiDate}</span>
                                        ) : (
                                            <Badge color="warning" className="text-dark">Missing</Badge>
                                        )}
                                    </div>

                                    {isEditingFirstEmi ? (
                                        <div className="mt-2 d-flex flex-column gap-2">
                                            <Input
                                                type="date"
                                                value={tempFirstEmiDate}
                                                onChange={(e) => setTempFirstEmiDate(e.target.value)}
                                                max={new Date().toISOString().split('T')[0]}
                                            />
                                            <div className="d-flex gap-2">
                                                <Button size="sm" color="success" onClick={handleUpdateFirstEmiDate}>
                                                    Save
                                                </Button>
                                                <Button size="sm" color="secondary" onClick={() => setIsEditingFirstEmi(false)}>
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <Button
                                            size="sm"
                                            color={firstEmiDate ? "secondary" : "info"}
                                            className="mt-1"
                                            onClick={() => {
                                                setTempFirstEmiDate(firstEmiDate || '');
                                                setIsEditingFirstEmi(true);
                                            }}
                                        >
                                            {firstEmiDate ? "Edit First EMI Date" : "Set First EMI Date"}
                                        </Button>
                                    )}
                                </li>


                            </ul>
                        </CardBody>
                    </Card>

                    {/* Business Loan Scheme */}
                    <Card className="shadow-lg border-0 mb-4">
                        <CardHeader className="bg-light">
                            <Button
                                color="link"
                                className="p-0 text-dark text-decoration-none"
                                onClick={() => toggleCollapse('businessLoan')}
                            >
                                <CardTitle tag="h5" className="mb-0 d-inline">
                                    Business Loan Scheme
                                </CardTitle>
                                <i className={`fas fa-chevron-${collapseStates.businessLoan ? 'up' : 'down'} ms-2`}></i>
                            </Button>
                        </CardHeader>
                        <Collapse isOpen={collapseStates.businessLoan}>
                            <CardBody>
                                <ul className="list-group list-group-flush">
                                    <li className="list-group-item">
                                        <strong>Scheme ID:</strong> {data.planDetails.id || 'N/A'}
                                    </li>
                                    <li className="list-group-item">
                                        <strong>Name:</strong> {data.planDetails.name || 'N/A'}
                                    </li>
                                    <li className="list-group-item">
                                        <strong>Type:</strong> {data.planDetails.type || 'N/A'}
                                    </li>
                                    <li className="list-group-item">
                                        <strong>EMI Mode:</strong> {data.planDetails.emiMode || 'N/A'}
                                    </li>
                                    <li className="list-group-item">
                                        <strong>Loan Term:</strong>{' '}
                                        {data.planDetails.minTerm && data.planDetails.maxTerm
                                            ? `${data.planDetails.minTerm}–${data.planDetails.maxTerm} months`
                                            : data.planDetails.loanTerm
                                                ? `${data.planDetails.loanTerm} months`
                                                : 'N/A'}
                                    </li>
                                </ul>
                            </CardBody>
                        </Collapse>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default GroupLoanDetailsPage;

// import React from "react";
// import { Button } from "reactstrap";
// import { useNavigate } from "react-router-dom";
//
// /**
//  * Header bar exactly like the screenshot
//  * Props:
//  *  - loanNo
//  *  - onForeClose
//  *  - onViewTransactions
//  *  - onLoanRepayment
//  *  - onLoanStatement
//  */
// const GroupLoanHeader = ({
//                              loanNo,
//                              onForeClose,
//                              onViewTransactions,
//                              onLoanRepayment,
//                              onLoanStatement,
//                          }) => {
//     const navigate = useNavigate();
//
//     return (
//         <div className="bg-white rounded shadow-sm px-4 py-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
//             {/* Left buttons */}
//             <div className="d-flex flex-wrap gap-2">
//                 <Button
//                     style={{ background: "linear-gradient(135deg,#2b6cff,#4b8bff)", border: "none" }}
//                     onClick={onForeClose}
//                 >
//                     ForeClose
//                 </Button>
//
//                 <Button
//                     style={{ background: "linear-gradient(135deg,#b44cff,#e070ff)", border: "none" }}
//                     onClick={onViewTransactions}
//                 >
//                     View Transactions
//                 </Button>
//
//                 <Button
//                     style={{ background: "linear-gradient(135deg,#ff6a6a,#ff8e8e)", border: "none" }}
//                     onClick={onLoanRepayment}
//                 >
//                     Loan RePayment
//                 </Button>
//
//                 <Button
//                     style={{ background: "linear-gradient(135deg,#1f2a44,#3a4a6b)", border: "none" }}
//                     onClick={onLoanStatement}
//                 >
//                     Loan Statement
//                 </Button>
//             </div>
//
//             {/* Right buttons */}
//             <div className="d-flex gap-2">
//                 <Button
//                     style={{ background: "linear-gradient(135deg,#1f2a44,#3a4a6b)", border: "none" }}
//                     onClick={() => window.print()}
//                 >
//                     <i className="fas fa-print me-1" /> Print
//                 </Button>
//
//                 <Button
//                     style={{ background: "linear-gradient(135deg,#1f2a44,#3a4a6b)", border: "none" }}
//                     onClick={() => navigate(-1)}
//                 >
//                     Back
//                 </Button>
//             </div>
//         </div>
//     );
// };
//
// export default GroupLoanHeader;
