import React, {useEffect, useState} from 'react';
import {useLocation, useNavigate, useParams} from 'react-router-dom';
import {
    Badge, Button, Card, CardBody, CardHeader, CardTitle, Col, Collapse, Row, Spinner, Table, UncontrolledDropdown,
    DropdownToggle,
    DropdownMenu,
    DropdownItem,
    Input
} from 'reactstrap';
import axios from 'axios';
import ProfileImageUpload from "../../components/ProfileImageUpload";
import {useSelector} from 'react-redux';
import {CircularProgress} from "@mui/material";
import CstNotification from "../../components/CstNotification";
import ReactBSAlert from "react-bootstrap-sweetalert";

const LoanDetailsPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const {loanNo} = useParams();
    const authStatus = useSelector((state) => state.auth?.authState);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [progressbar, setProgressbar] = useState(false);
    const [collapseStates, setCollapseStates] = useState({
        documents: false,
        comments: false,
        businessLoan: false,
        updateInfo: false
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
        setCollapseStates(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };
    const getFromDate = (daysAgo) => {
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        return date.toISOString().slice(0, 10);
    };

    useEffect(() => {
        const fetchLoanDetails = async () => {
            try {
                const res = await axios.get(
                    `/api/reports/loan/active-accounts/loan/${loanNo}`,
                    {withCredentials: true}
                );
                if (res.data?.details?.length > 0) {
                    console.log(res.data.details);
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
                        currentDebt: currentDebt,
                        principleDue: detail.principleDue,
                        openDate: detail.openingDate || '',
                        loanType: detail.planDetails?.type || 'N/A',
                        emiCollection: detail.emiCollection || '',
                        installmentAmount: installmentAmount,
                        paidEMI: paidEMI,
                        totalEMI: totalEMI,
                        extraPayment: detail.extraPayment || 0,
                        phone: detail.phone || '',
                        foreclosureStatus: detail.foreclosureStatus || 'N/A',
                        foreclosureRequestId: detail.foreclosureRequestId || 'N/A',
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
                console.error(err);
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
                }
            }
        });
    };

    const handleLoanRepaymentClick = () => {
        navigate('/loan/Loan-RePayment', {
            state: {
                prefillAccountNo: loanNo,
                loanData: data,
                transactions: data?.transactions
            }
        });
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


    const handlePrint = async () => {
        try {
            setProgressbar(true);
            const res = await axios.get(
                `/api/loan/loan-accounts/${loanNo}/emi-schedule/print`,
                {
                    responseType: "blob",
                    withCredentials: true,
                }
            );
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement("a");
            a.href = url;
            a.download = `${data?.memberName}_Repayment_Schedule.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            setProgressbar(false);
        } catch (err) {
            setProgressbar(false);
            console.error("Failed to generate PDF:", err.message);
            setAlert({
                display: true,
                color: 'danger',
                message: `Failed to generate PDF: ${err.message}`,
                autoDismiss: 5,
                place: 'tc',
                sweetAlert: false,
                timestamp: new Date().getTime()
            });
        }
    };

    const handleLoanAgreement = async () => {
        try {
            setProgressbar(true);
            const res = await axios.get(
                `/api/loan/generate-agreement/${loanNo}`,
                {
                    responseType: "blob",
                    withCredentials: true,
                }
            );

            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement("a");
            a.href = url;
            a.download = `${data?.memberName}_Loan_agreement.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            setProgressbar(false);
        } catch (err) {
            setProgressbar(false);
            console.error("Failed to generate PDF:", err.message);
            setAlert({
                display: true,
                color: 'danger',
                message: `Failed to generate PDF: ${err.message}`,
                autoDismiss: 5,
                place: 'tc',
                sweetAlert: false,
                timestamp: new Date().getTime()
            });
        }
    };
    const handleLoanSanction = async () => {
        try {
            setProgressbar(true);
            const res = await axios.get(
                `/api/loan/generate-sanction-letter/${loanNo}`,
                {
                    responseType: "blob",
                    withCredentials: true,
                }
            );

            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement("a");
            a.href = url;
            a.download = `${data?.memberName}_Loan_Sanction.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            setProgressbar(false);
        } catch (err) {
            setProgressbar(false);
            setAlert({
                display: true,
                color: 'danger',
                message: `Failed to generate PDF: ${err.message}`,
                autoDismiss: 5,
                place: 'tc',
                sweetAlert: false,
                timestamp: new Date().getTime()
            });
        }
    };
    const handleForeclosureSlip = async () => {
        try {
            setProgressbar(true);
            if (!data?.foreclosureRequestId) return; // just skip if not found
            const response = await axios.get(
                `/api/loan/foreclose/request-slip/${data.foreclosureRequestId}`,
                {responseType: "blob"}
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const a = document.createElement("a");
            a.href = url;
            a.download = `${data?.memberName}_Foreclosure_Request.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setProgressbar(false);
        } catch (err) {
            setProgressbar(false);
            setAlert({
                display: true,
                color: 'danger',
                message: `Failed to download foreclosure request slip: ${err.message}`,
                autoDismiss: 5,
                place: 'tc',
                sweetAlert: false,
                timestamp: new Date().getTime()
            });
        }
    };


    const accountType = "loan";
    const handleForeClose = () => {
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
                `/api/loan/update-first-emi-date/loan`,
                {account: loanNo, firstEmiDate: tempFirstEmiDate},
                {withCredentials: true}
            );
            setFirstEmiDate(tempFirstEmiDate);
            setIsEditingFirstEmi(false);
            setAlert({
                display: true,
                color: 'success',
                message: 'First EMI date updated successfully!',
                autoDismiss: 5,
                place: 'tc',
                sweetAlert: false,
                timestamp: new Date().getTime()
            });
        } catch (err) {
            const msg = err.response?.data?.error || 'Failed to update First EMI Date';
            setAlert({
                display: true,
                color: 'danger',
                message: msg,
                autoDismiss: 5,
                place: 'tc',
                sweetAlert: false,
                timestamp: new Date().getTime()
            });
        }
    };

    if (loading) {
        return (
            <div className="text-center mt-5">
                <Spinner color="info"/>
                <p>Loading loan details...</p>
            </div>
        );
    }

    if (!data) {
        return <div className="text-center mt-5">No loan data found.</div>;
    }

    const documentUuid = data?.uuid;
    const documentBankId = authStatus?.bankId;

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
        <>
            <div className="rna-container">
                {alert.display && <CstNotification color={alert.color} message={alert.message} autoDismiss={alert.autoDismiss} place={alert.place} timestamp={alert.timestamp}/>}
                {alert.sweetAlert && <ReactBSAlert
                    success
                    style={{ display: "block", marginTop: "-100px" }}
                    title="Success!"
                    onConfirm={() => setAlert({...alert, sweetAlert: false})}
                    onCancel={() => setAlert({...alert, sweetAlert: false})}
                    confirmBtnBsStyle="success"
                    btnSize=""
                >
                    {alert.message}
                </ReactBSAlert>}
            </div>
            <div className="content" style={{padding: '2rem'}}>
                <Row className="mb-4">
                    <Col md="12">
                        <div className="
                        d-flex
                        justify-content-between
                        align-items-center
                        flex-column flex-md-row
                        align-items-stretch align-items-md-center
                        p-3 bg-white rounded shadow-sm">
                            {/* Left Side: Action Buttons */}
                            <div className="
                            d-flex
                            gap-2
                            flex-wrap
                            justify-content-center justify-content-md-start
                            mb-3 mb-md-0
                            ">
                                <Button onClick={handleForeClose} color="info" >
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
                            <div className="
                            d-flex
                            gap-2
                            flex-wrap
                            justify-content-center justify-content-md-end
                            ">
                                {progressbar ? <CircularProgress className={'mr-2'} color="secondary"/>: null}
                                <UncontrolledDropdown className="me-2">
                                    <DropdownToggle color="dark" caret>
                                        🖨️ Print
                                    </DropdownToggle>
                                    <DropdownMenu>
                                        <DropdownItem onClick={handlePrint}>
                                            Loan Repayment Schedule
                                        </DropdownItem>

                                        <DropdownItem onClick={handleLoanAgreement}>
                                            Loan Agreement
                                        </DropdownItem>

                                        <DropdownItem onClick={handleLoanSanction}>
                                            Loan Sanction Letter
                                        </DropdownItem>
                                        {data?.foreclosureStatus === "pending" && (
                                            <DropdownItem onClick={handleForeclosureSlip}>
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
                <Row>
                    <Col md="8">
                        <Card className="shadow-lg border-0 mb-4">
                            <CardHeader className="bg-light" style={cardHeaderStyle}>
                                <CardTitle tag="h5" className="mb-0" style={cardTitleStyle}>Loan Details</CardTitle>
                            </CardHeader>
                            <CardBody>
                                <Row>
                                    <Col md="6">
                                        <ul className="list-group list-group-flush">
                                            <li className="list-group-item">
                                                <strong>Loan No:</strong> {data.loanNo}
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
                                                <strong>Loan Amount:</strong> ₹{Number(data?.loanAmount || 0).toFixed(2)}
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
                            <CardHeader className="bg-light" style={cardHeaderStyle}>
                                <CardTitle tag="h5" className="mb-0" style={cardTitleStyle}>Transaction History</CardTitle>
                            </CardHeader>
                            <CardBody style={{maxHeight: "400px", overflowY: "auto"}}>
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
                                            <td>{transaction.principle != null ? Number(transaction.principle).toFixed(2) : 'NA'}</td>
                                            <td>{transaction.interest?.toFixed(2) || 'NA'}</td>
                                            <td>₹{Number(transaction?.amount || 0).toFixed(2)}</td>
                                            <td>{transaction.type}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </Table>
                            </CardBody>
                        </Card>


                        {/* Documents Section  */}
                        <Card className="shadow-lg border-0 mb-4">
                            <CardHeader className="bg-light" style={cardHeaderStyle}>
                                <Button
                                    color="link"
                                    className="p-0 text-dark text-decoration-none"
                                    onClick={() => toggleCollapse('documents')}
                                >
                                    <CardTitle tag="h5" className="mb-0 d-inline" style={cardTitleStyle}>
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
                                            {/* ProfileScreen Image */}
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

                    <Col md="4">
                        {/* Balance Report */}
                        <Card className="shadow-lg border-0 mb-4">
                            <CardHeader className="bg-light" style={cardHeaderStyle}>
                                <CardTitle tag="h5" className="mb-0" style={cardTitleStyle}>Balance Report</CardTitle>
                            </CardHeader>
                            <CardBody>
                                <ul className="list-group list-group-flush">
                                    <li className="list-group-item d-flex justify-content-between">
                                        <span><strong>Outstanding Balance</strong></span>
                                        <span className="text-danger">₹{data.currentDebt?.toFixed(2)}</span>
                                    </li>
                                    <li className="list-group-item d-flex justify-content-between">
                                        <span><strong>Sanctioned Loan Amount</strong></span>
                                        <span className="text-success">₹{Number(data?.loanAmount || 0).toFixed(2)}</span>
                                    </li>
                                    <li className="list-group-item d-flex justify-content-between">
                                        <span><strong>Days Since Loan Opened</strong></span>
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
                                                    <Button size="sm" color="secondary"
                                                            onClick={() => setIsEditingFirstEmi(false)}>
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
                            <CardHeader className="bg-light" style={cardHeaderStyle}>
                                <Button
                                    color="link"
                                    className="p-0 text-dark text-decoration-none"
                                    onClick={() => toggleCollapse('businessLoan')}
                                >
                                    <CardTitle tag="h5" className="mb-0 d-inline" style={cardTitleStyle}>
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

                        {/* Update Info */}
                        {/*<Card className="shadow-lg border-0 mb-4">*/}
                        {/*    <CardHeader className="bg-light">*/}
                        {/*        <Button*/}
                        {/*            color="link"*/}
                        {/*            className="p-0 text-dark text-decoration-none"*/}
                        {/*            onClick={() => toggleCollapse('updateInfo')}*/}
                        {/*        >*/}
                        {/*            <CardTitle tag="h5" className="mb-0 d-inline">*/}
                        {/*                Update Info*/}
                        {/*            </CardTitle>*/}
                        {/*            <i className={`fas fa-chevron-${collapseStates.updateInfo ? 'up' : 'down'} ms-2`}></i>*/}
                        {/*        </Button>*/}
                        {/*    </CardHeader>*/}
                        {/*    <Collapse isOpen={collapseStates.updateInfo}>*/}
                        {/*        <CardBody>*/}
                        {/*            <FormGroup>*/}
                        {/*                <Label for="branch">Branch</Label>*/}
                        {/*                <Input type="select" id="branch" defaultValue={data.branch}>*/}
                        {/*                    <option>Branch 1</option>*/}
                        {/*                    <option>Branch 2</option>*/}
                        {/*                    <option>Branch 3</option>*/}
                        {/*                </Input>*/}
                        {/*            </FormGroup>*/}
                        {/*            <FormGroup>*/}
                        {/*                <Label for="associate">Associate</Label>*/}
                        {/*                <Input type="text" id="associate" placeholder="Enter associate name" />*/}
                        {/*            </FormGroup>*/}
                        {/*            <FormGroup>*/}
                        {/*                <Label for="guarantor">Guarantor</Label>*/}
                        {/*                <Input type="text" id="guarantor" placeholder="Enter guarantor name" />*/}
                        {/*            </FormGroup>*/}
                        {/*            <Button color="primary" block size="sm">*/}
                        {/*                Update*/}
                        {/*            </Button>*/}
                        {/*        </CardBody>*/}
                        {/*    </Collapse>*/}
                        {/*</Card>*/}
                    </Col>
                </Row>
            </div>
        </>
    );
};

export default LoanDetailsPage;