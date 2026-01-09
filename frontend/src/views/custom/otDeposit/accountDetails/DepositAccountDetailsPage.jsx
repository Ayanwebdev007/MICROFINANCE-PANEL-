import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
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
} from "reactstrap";
import axios from "axios";
import ProfileImageUpload from "../../components/ProfileImageUpload";
import { useSelector } from "react-redux";

const DepositAccountDetailsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { accountId, accountType } = useParams();

  const authStatus = useSelector((state) => state.auth?.authState);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [collapseStates, setCollapseStates] = useState({
    documents: false,
    comments: false,
    accountInfo: false,
    planDetails: false,
    transactionHistory: true,
  });
  const [alert, setAlert] = useState({
    color: "success",
    message: "",
    autoDismiss: 7,
    place: "tc",
    display: false,
    sweetAlert: false,
    timestamp: new Date().getTime(),
  });

  const toggleCollapse = (section) => {
    setCollapseStates((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  useEffect(() => {
    const fetchAccountDetails = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/api/reports/accounts/${accountType}/${accountId}`, {
          withCredentials: true,
        });

        console.log("API Response:", res.data);

        if (res.data.success && Array.isArray(res.data.details) && res.data.details.length > 0) {
          const detail = res.data.details[0];

          const enrichedData = {
            account: detail.account || accountId,
            memberName: detail.name || "N/A",
            memberNo: detail.memberNo || "N/A",
            branch: location.state?.branch || "",
            accountType: accountType,
            status: detail.status || "Active",
            balance: detail.balance || 0,
            openingAmount: detail.openingAmount || 0,
            openingDate: detail.openingDate || "",
            modeOfOperation: detail.modeOfOperation || "Single",
            remarks: detail.remarks || "",
            smsSend: detail.smsSend || false,
            phone: detail.phone || "",
            referrer: detail.referrer || "",
            author: detail.author || "",
            createdAt: detail.createdAt || "",
            updatedAt: detail.updatedAt || "",
            uuid: detail.uuid || "#",
            bankId: detail.bankId || authStatus?.bankId || "",
            jointSurvivorName: detail.jointSurvivorName || "",
            jointSurvivorCode: detail.jointSurvivorCode || "",
            debitCardIssue: detail.debitCardIssue || false,

            planDetails: detail.planDetails || {},
            scheme: detail.scheme || "",
            label: detail.label || "",

            minMonthlyAvgBalance: detail.minMonthlyAvgBalance || 0,
            serviceCharges: detail.serviceCharges || 0,
            smsCharges: detail.smsCharges || 0,
            annualInterestRate: detail.annualInterestRate || "",
            interestPayout: detail.interestPayout || "",
            maturityDate: detail.maturityDate || "",
            payoutType: detail.payoutType || "",
            monthlyInstallment: detail.monthlyInstallment || 0,
            tenureMonths: detail.tenureMonths || "",
            expiryDate: detail.expiryDate || "",
            certificateNumber: detail.certificateNumber || "",
            monthlyContribution: detail.monthlyContribution || 0,

            transactions: res.data.transactions || [],
          };

          setData(enrichedData);
        } else {
          const errorMsg = res.data?.error || "Account not found or inaccessible.";
          console.error("Backend Error:", errorMsg);
          setAlert({
            color: "danger",
            message: errorMsg,
            display: true,
            timestamp: Date.now(),
          });
          setData(null);
        }
      } catch (err) {
        const message = err.response?.data?.error || err.message || "Network error occurred.";
        console.error("Network or server error:", message);
        setAlert({
          color: "danger",
          message: message,
          display: true,
          timestamp: Date.now(),
        });
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    if (accountId && accountType) {
      fetchAccountDetails();
    }
  }, [accountId, accountType, authStatus?.bankId, location.state]);

  const calculateAccountAge = (openDate) => {
    if (!openDate) return 0;
    const today = new Date();
    const openDateObj = new Date(openDate);
    const timeDiff = Math.abs(today.getTime() - openDateObj.getTime());
    return Math.floor(timeDiff / (1000 * 3600 * 24));
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "active": return "success";
      case "closed": return "secondary";
      case "frozen": return "warning";
      default: return "primary";
    }
  };

  const getDepositTypeName = (type) => {
    const map = {
      savings: "Savings Account",
      "daily-savings": "Daily Savings",
      "fixed-deposit": "Fixed Deposit",
      "recurring-deposit": "Recurring Deposit",
      "thrift-fund": "Thrift Fund",
      "cash-certificate": "Cash Certificate",
    };
    return map[type] || type;
  };

  const handleViewTransactionsClick = () => {
    navigate(`/deposit/accounts-details/${data.account}/transactionslist`, {
      state: {
        accountData: {
          account: data?.account,
          memberName: data?.memberName,
          balance: data?.balance,
          openingAmount: data?.openingAmount,
          status: data?.status,
          openingDate: data?.openingDate,
          accountType: data?.accountType,
        },
        transactions: data?.transactions || [],
      },
    });
  };

  const handleDepositClick = () => {
    navigate("/deposit/deposit-transactions", {
      state: { prefillAccountNo: data?.account, prefillAccountType: data?.accountType },
    });
  };

  const handleStatementClick = () => {
    navigate("/deposit/deposit-statement", {
      state: {
        prefillAccountNo: data?.account,
        prefillAccountType: data?.accountType?.toLowerCase() ,
      },
    });
  };



  if (!accountId || !accountType) {
    return (
      <div className="text-center mt-5 py-5">
        <h5 className="text-danger">Invalid Account</h5>
        <p className="text-muted">The account ID or type is missing.</p>
        <Button color="primary" onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center mt-5 py-5">
        <h5 className="text-danger">Account Not Found</h5>
        <p className="text-muted">The requested deposit account could not be found.</p>
        {alert.display && (
          <div className={`alert alert-${alert.color} alert-with-icon d-inline-block mt-3`} role="alert">
            <span className="tim-icons icon-bell-55 me-2"></span>
            {alert.message}
          </div>
        )}
        <Button color="primary" onClick={() => navigate(-1)}>
          Back to Accounts List
        </Button>
      </div>
    );
  }

  const documentUuid = data.uuid;
  const documentBankId = authStatus?.bankId;

  return (
    <div className="content" style={{ padding: "2rem" }}>
      {/* Alert Container */}
      <div className="rna-container">
        {alert.display && (
          <div className={`alert alert-${alert.color} alert-with-icon`} data-notify="container">
            <span data-notify="icon" className="tim-icons icon-bell-55"></span>
            <span data-notify="message">{alert.message}</span>
            {alert.autoDismiss > 0 && (
              <button
                type="button"
                className="close"
                data-dismiss="alert"
                aria-label="Close"
                onClick={() => setAlert((prev) => ({ ...prev, display: false }))}
              >
                <span aria-hidden="true">&times;</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Top Navigation */}
      <Row className="mb-4">
        <Col md="12">
          <div className="d-flex justify-content-between align-items-center p-3 bg-white rounded shadow-sm">
            <div>
              <h4 className="mb-0">
                {getDepositTypeName(data.accountType)} Details — {data.account}
              </h4>
            </div>
            <div>
              <Button
                onClick={handleViewTransactionsClick}
                className="me-2"
                color="success"
                disabled={!data.transactions || data.transactions.length === 0}
              >
                View Transactions
              </Button>
              {/*<Button onClick={handleDepositClick} className="me-2" color="info">*/}
              {/*  Make Transaction*/}
              {/*</Button>*/}
              <Button
                onClick={handleStatementClick}
                className="me-2"
                color="success"
              >
                Statement
              </Button>
              <Button color="light" onClick={() => navigate(-1)} className="btn-round">
                Back
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      <Row>
        <Col md="8">
          {/* Account Information */}
          <Card className="shadow-lg border-0 mb-4">
            <CardHeader className="bg-light">
              <CardTitle tag="h5" className="mb-0">
                Account Information
              </CardTitle>
            </CardHeader>
            <CardBody>
              <Row>
                <Col md="6">
                  <ul className="list-group list-group-flush">
                    <li className="list-group-item">
                      <strong>Account No:</strong> {data.account}
                    </li>
                    <li className="list-group-item">
                      <strong>Member Name:</strong> {data.memberName}
                    </li>
                    <li className="list-group-item">
                      <strong>Member No:</strong> {data.memberNo}
                    </li>
                    <li className="list-group-item">
                      <strong>Account Type:</strong> {getDepositTypeName(data.accountType)}
                    </li>
                    <li className="list-group-item">
                      <strong>Mode of Operation:</strong> {data.modeOfOperation}
                    </li>
                  </ul>
                </Col>
                <Col md="6">
                  <ul className="list-group list-group-flush">
                    <li className="list-group-item">
                      <strong>Opening Date:</strong> {data.openingDate}
                    </li>
                    <li className="list-group-item">
                      <strong>Phone:</strong> {data.phone}
                    </li>
                    <li className="list-group-item">
                      <strong>Referrer ID:</strong> {data.referrer || "N/A"}
                    </li>
                    <li className="list-group-item">
                      <strong>SMS Alerts:</strong> {data.smsSend ? "Enabled" : "Disabled"}
                    </li>
                    <li className="list-group-item">
                      <strong>Status:</strong>
                      <Badge color={getStatusBadge(data.status)} className="ms-2">
                        {data.status}
                      </Badge>
                    </li>
                    {data.jointSurvivorName && (
                      <li className="list-group-item">
                        <strong>Joint Survivor:</strong> {data.jointSurvivorName}
                      </li>
                    )}
                  </ul>
                </Col>
              </Row>
            </CardBody>
          </Card>

          {/* Transaction History */}
          <Card className="shadow-lg border-0 mb-4">
            <CardHeader className="bg-light">
              <Button
                color="link"
                className="p-0 text-dark text-decoration-none"
                onClick={() => toggleCollapse("transactionHistory")}
              >
                <CardTitle tag="h5" className="mb-0 d-inline">
                  Transaction History
                </CardTitle>
                <i className={`fas fa-chevron-${collapseStates.transactionHistory ? "up" : "down"} ms-2`}></i>
              </Button>
            </CardHeader>
            <Collapse isOpen={collapseStates.transactionHistory}>
              <CardBody>
                <Table striped hover responsive>
                  <thead>
                  <tr>
                    <th>Sl No</th>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Amount</th>
                  </tr>
                  </thead>
                  <tbody>
                  {data.transactions.length > 0 ? (
                    data.transactions.map((tx, index) => {
                      const isCredit = tx.type === "credit";
                      const isDebit = tx.type === "debit";
                      const amount = parseFloat(tx.amount) || 0;

                      const displayType = isCredit ? "Deposit" : isDebit ? "Withdrawal" : tx.type;
                      const sign = isCredit ? "+" : isDebit ? "-" : "";
                      const displayAmount = `${sign} ₹${amount.toFixed(2)}`;
                      const badgeColor = isCredit ? "success" : isDebit ? "danger" : "secondary";
                      const textColor = isCredit ? "text-success" : isDebit ? "text-danger" : "";

                      return (
                        <tr key={tx.id || index}>
                          <td>{index + 1}</td>
                          <td>{new Date(tx.createdAt?.toDate?.() || tx.date || tx.createdAt).toLocaleDateString()}</td>
                          <td>
                            <Badge color={badgeColor}>{displayType}</Badge>
                          </td>
                          <td className={textColor}>
                            <strong>{displayAmount}</strong>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center text-muted">
                        No transactions found.
                      </td>
                    </tr>
                  )}
                  </tbody>
                </Table>
              </CardBody>
            </Collapse>
          </Card>

          {/* Documents Section */}
          <Card className="shadow-lg border-0 mb-4">
            <CardHeader className="bg-light">
              <Button color="link" className="p-0 text-dark text-decoration-none" onClick={() => toggleCollapse("documents")}>
                <CardTitle tag="h5" className="mb-0 d-inline">
                  Photo & Signature Upload
                </CardTitle>
                <i className={`fas fa-chevron-${collapseStates.documents ? "up" : "down"} ms-2`}></i>
              </Button>
            </CardHeader>
            <Collapse isOpen={collapseStates.documents}>
              <CardBody>
                {documentBankId ? (
                  <Row className="align-items-start">
                    {/* Profile Photo */}
                    <Col md="4" className="text-center">
                      <ProfileImageUpload
                        id="profile"
                        setAlert={setAlert}
                        uuid={documentUuid}
                        bankId={documentBankId}
                        changeBtnClasses="btn-simple"
                        addBtnClasses="btn-simple"
                        removeBtnClasses="btn-simple"
                      />
                      <p className="mt-2 mb-0 text-muted"><strong>Profile Photo</strong></p>
                      <p className="text-muted small">Upload the primary applicant’s photo.</p>
                    </Col>

                    {/* Joint Holder Photo */}
                    <Col md="4" className="text-center">
                      <ProfileImageUpload
                        id="profile-joint"
                        setAlert={setAlert}
                        uuid={documentUuid}
                        bankId={documentBankId}
                        changeBtnClasses="btn-simple"
                        addBtnClasses="btn-simple"
                        removeBtnClasses="btn-simple"
                      />
                      <p className="mt-2 mb-0 text-muted"><strong>Joint Holder Photo</strong></p>
                      <p className="text-muted small">Upload the joint applicant’s photo (if any).</p>
                    </Col>

                    {/* Signature */}
                    <Col md="4" className="text-center">
                      <ProfileImageUpload
                        id="signature"
                        setAlert={setAlert}
                        uuid={documentUuid}
                        bankId={documentBankId}
                        changeBtnClasses="btn-simple"
                        addBtnClasses="btn-simple"
                        removeBtnClasses="btn-simple"
                      />
                      <p className="mt-2 mb-0 text-muted"><strong>Signature</strong></p>
                      <p className="text-muted small">Upload the member’s signature.</p>
                    </Col>
                  </Row>
                ) : (
                  <div className="text-center">
                    <p className="text-danger">Unable to load document upload: Bank ID missing.</p>
                  </div>
                )}
              </CardBody>
            </Collapse>
          </Card>
        </Col>

        <Col md="4">
          {/* Balance Summary */}
          <Card className="shadow-lg border-0 mb-4">
            <CardHeader className="bg-light">
              <CardTitle tag="h5" className="mb-0">
                Balance Summary
              </CardTitle>
            </CardHeader>
            <CardBody>
              <ul className="list-group list-group-flush">
                <li className="list-group-item d-flex justify-content-between">
                  <span><strong>Current Balance</strong></span>
                  <span className="text-primary fw-bold">₹{data.balance?.toFixed(2)}</span>
                </li>
                <li className="list-group-item d-flex justify-content-between">
                  <span><strong>Opening Amount</strong></span>
                  <span className="text-success">₹{data.openingAmount?.toFixed(2)}</span>
                </li>
                <li className="list-group-item d-flex justify-content-between">
                  <span><strong>Account Age</strong></span>
                  <span>{calculateAccountAge(data.openingDate)} days</span>
                </li>
                {data.maturityDate && (
                  <li className="list-group-item d-flex justify-content-between">
                    <span><strong>Maturity Date</strong></span>
                    <span>{data.maturityDate}</span>
                  </li>
                )}
              </ul>
            </CardBody>
          </Card>



          {/* Remarks Section */}
          <Card className="shadow-lg border-0 mb-4">
            <CardHeader className="bg-light">
              <CardTitle tag="h5" className="mb-0">
                Remarks
              </CardTitle>
            </CardHeader>
            <CardBody>
              <p className="mb-0">
                {data.remarks || "No remarks added."}
              </p>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DepositAccountDetailsPage;