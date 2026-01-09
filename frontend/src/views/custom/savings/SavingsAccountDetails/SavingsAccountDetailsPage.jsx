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

const SavingsAccountDetailsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { account } = useParams(); // account number from URL
  const authStatus = useSelector((state) => state.auth?.authState);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [collapseStates, setCollapseStates] = useState({
    documents: false,
    comments: false,
    accountInfo: false,
    updateInfo: false,
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
        const res = await axios.get(`/api/reports/accounts/savings/${account}`, {
          withCredentials: true,
        });
        if (res.data?.details?.length > 0) {
          const detail = res.data.details[0];
          setData({
            account: detail.account || account,
            memberName: detail.name || "",
            memberNo: detail.memberNo || "",
            branch: location.state?.branch || "",
            accountType: detail.accountType || "Savings",
            status: detail.status || "Active",
            balance: detail.balance || 0,
            openingAmount: detail.openingAmount || 0,
            openingDate: detail.openingDate || "",
            modeOfOperation: detail.modeOfOperation || "Single",
            remarks: detail.remarks || "",
            smsSend: detail.smsSend || false,
            phone: detail.phone || "",
            referrer: detail.referrer || "",
            transactions: res.data.transactions || [],
            bankId: detail.bankId || authStatus?.bankId || "",
            uuid: detail.uuid || "#",

            planDetails: detail.planDetails || {},
          });
        } else {
          setData(null);
        }
      } catch (err) {
        console.error("Error fetching savings account details:", err);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    if (account) fetchAccountDetails();
  }, [account, authStatus?.bankId]);

  const calculateAccountAge = (openDate) => {
    if (!openDate) return 0;
    const today = new Date();
    const openDateObj = new Date(openDate);
    const timeDiff = Math.abs(today.getTime() - openDateObj.getTime());
    return Math.floor(timeDiff / (1000 * 3600 * 24));
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "success";
      case "closed":
        return "secondary";
      case "frozen":
        return "warning";
      default:
        return "primary";
    }
  };
  const handleViewTransactionsClick = () => {
    navigate(`/deposit/savings-accounts/details/${data.account}/transactions`, {

      state: {
        accountData: {
          account: data.account,
          memberName: data.memberName,
          balance: data.balance,
          openingAmount: data.openingAmount,
          status: data.status,
          openingDate: data.openingDate,
        },
        transactions: data.transactions || [],
      },
    });
  };

  const handleDepositClick = () => {
    navigate("/deposit/savings-deposit-transactions", {
      state: { prefillAccountNo: data.account }

    });
  };
  const handleStatementClick = () => {
    navigate("/deposit/savings-deposit-statement", {
      state: {
        prefillAccountNo: data.account,
        prefillAccountType: data.accountType?.toLowerCase() || "savings",
      },
    });
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner color="info" />
        <p>Loading account details...</p>
      </div>
    );
  }

  if (!data) {
    return <div className="text-center mt-5">No savings account data found.</div>;
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
              <h4 className="mb-0">Savings Account Details - {data.account}</h4>
            </div>
            <div>
              <Button
                onClick={handleViewTransactionsClick}
                className="me-2"
                color="success"
                disabled={!data.transactions}
              >
                View Transactions
              </Button>
              <Button onClick={handleDepositClick} className="me-2" color="success">
                Make Transaction
              </Button>
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
          {/* Account Details */}
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
                      <strong>Account Type:</strong> {data.accountType}
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
                      <strong>Referrer id:</strong> {data.referrer}
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
            <CardBody style={{ maxHeight: "400px", overflowY: "auto" }}>
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
                        <td>{tx.date}</td>
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
                    <td colSpan="4" className="text-center text-muted">
                      No transactions found.
                    </td>
                  </tr>
                )}
                </tbody>
              </Table>
            </CardBody>
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
                    {/* ProfileScreen Photo */}
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
                  <span>
                    <strong>Current Balance</strong>
                  </span>
                  <span className="text-primary fw-bold">₹{data.balance?.toFixed(2)}</span>
                </li>
                <li className="list-group-item d-flex justify-content-between">
                  <span>
                    <strong>Opening Deposit</strong>
                  </span>
                  <span className="text-success">₹{data.openingAmount?.toFixed(2)}</span>
                </li>
                <li className="list-group-item d-flex justify-content-between">
                  <span>
                    <strong>Account Age</strong>
                  </span>
                  <span>{calculateAccountAge(data.openingDate)} days</span>
                </li>
              </ul>
            </CardBody>
          </Card>
          {/* Plan Details (Collapsible) */}
          <Card className="shadow-lg border-0 mb-4">
            <CardHeader className="bg-light">
              <Button
                color="link"
                className="p-0 text-dark text-decoration-none"
                onClick={() => toggleCollapse("accountInfo")}
              >
                <CardTitle tag="h5" className="mb-0 d-inline">
                  Plan Details
                </CardTitle>
                <i className={`fas fa-chevron-${collapseStates.accountInfo ? "up" : "down"} ms-2`}></i>
              </Button>
            </CardHeader>
            <Collapse isOpen={collapseStates.accountInfo}>
              <CardBody>
                {data.planDetails && Object.keys(data.planDetails).length > 0 ? (
                  <ul className="list-group list-group-flush">
                    <li className="list-group-item">
                      <strong>Scheme Name:</strong> {data.planDetails?.schemeName || "N/A"}
                    </li>
                    <li className="list-group-item">
                      <strong>Scheme Code:</strong> {data.planDetails?.schemeCode || "N/A"}
                    </li>
                    <li className="list-group-item">
                      <strong>Annual Interest Rate:</strong> {data.planDetails?.annualInterestRate}% per annum
                    </li>
                    <li className="list-group-item">
                      <strong>Interest Payout:</strong> {data.planDetails?.interestPayout}
                    </li>
                    <li className="list-group-item">
                      <strong>Minimum Opening Balance:</strong> ₹{data.planDetails?.minOpeningBalance}
                    </li>
                    <li className="list-group-item">
                      <strong>Min. Monthly Avg. Balance:</strong> ₹{data.planDetails?.minMonthlyAvgBalance}
                    </li>
                    <li className="list-group-item">
                      <strong>Service Charges:</strong> ₹{data.planDetails?.serviceCharges}
                    </li>
                    <li className="list-group-item">
                      <strong>SMS Charges:</strong> ₹{data.planDetails?.smsCharges}
                    </li>
                    <li className="list-group-item">
                      <strong>Senior Citizen Add-on Rate:</strong> +{data.planDetails?.srCitizenAddonRate}% p.a.
                    </li>
                    {data.planDetails?.lockInAmount > 0 && (
                      <li className="list-group-item">
                        <strong>Lock-in Amount:</strong> ₹{data.planDetails?.lockInAmount}
                      </li>
                    )}
                    {data.planDetails?.minMonthlyAvgCharge > 0 && (
                      <li className="list-group-item">
                        <strong>Penalty for Low Balance:</strong> ₹{data.planDetails?.minMonthlyAvgCharge}
                      </li>
                    )}
                  </ul>
                ) : (
                  <p className="text-muted text-center py-3">
                    <em>No plan found for this account.</em>
                  </p>
                )}
              </CardBody>
            </Collapse>
          </Card>

        </Col>
      </Row>
    </div>
  );
};

export default SavingsAccountDetailsPage;