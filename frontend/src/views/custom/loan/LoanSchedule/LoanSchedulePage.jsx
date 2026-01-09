import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Row,
  Col,
} from "reactstrap";
import printJS from "print-js";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(parseFloat(amount || 0));

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "2-digit",
  });
};

const LoanSchedulePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { loanData, bankInfo } = location.state || {};

  if (!loanData) {
    return (
      <div className="content text-center mt-5">
        <h5 className="text-danger mb-4">No loan data found. Please go back and try again.</h5>
        <Button color="primary" onClick={() => navigate(-1)} className="px-4 py-2">
          <i className="tim-icons icon-minimal-left me-2"></i> Back to Loan Details
        </Button>
      </div>
    );
  }

  const {
    account,
    memberName = "N/A",
    loanAmount,
    disbursementDate,
    openDate,
    totalEMI: totalEMIFromTotal,
    loanTerm,
    emiAmount,
    installmentAmount,
    principleEMI: principalPerEMI,
    interestEMI: interestPerEMI,
    planDetails = {},
    emiCollection,
    loanType,
    type,
    transactions = [],
  } = loanData;

  const paidEMICount = transactions
    .filter(txn => txn.type === "credit")
    .reduce((max, txn) => Math.max(max, txn.paidEMI || 0), 0);

  const effectiveDisbursementDate = disbursementDate || openDate;
  const effectiveLoanAmount = loanAmount;
  const effectiveTenure = totalEMIFromTotal || loanTerm || 1;
  const effectiveEmiAmount = emiAmount || installmentAmount;

  const emiMode = (
    planDetails.emiMode ||
    emiCollection?.toLowerCase() ||
    "daily"
  ).toLowerCase();

  if (
    !effectiveDisbursementDate ||
    !effectiveLoanAmount ||
    !effectiveTenure ||
    !effectiveEmiAmount
  ) {
    return (
      <div className="content text-center mt-5">
        <h5 className="text-warning mb-4">Missing required loan details: Date, Amount, Tenure, or EMI.</h5>
        <Button color="secondary" onClick={() => navigate(-1)} className="px-4 py-2">
          <i className="tim-icons icon-minimal-left me-2"></i> Back
        </Button>
      </div>
    );
  }

  // Calculate EMI breakdown
  const calculatedPrincipal = parseFloat(principalPerEMI) || effectiveLoanAmount / effectiveTenure;
  const calculatedInterest = parseFloat(interestPerEMI) || (parseFloat(effectiveEmiAmount) - calculatedPrincipal);

  // EMI Schedule generator
  const generateEMISchedule = () => {
    const startDate = new Date(effectiveDisbursementDate);
    const schedule = [];
    let balance = parseFloat(effectiveLoanAmount);
    for (let i = 1; i <= effectiveTenure; i++) {
      const emiDate = new Date(startDate);
      switch (emiMode) {
        case "daily":
          emiDate.setDate(startDate.getDate() + i - 1);
          break;
        case "weekly":
          emiDate.setDate(startDate.getDate() + (i - 1) * 7);
          break;
        case "fortnightly":
          emiDate.setDate(startDate.getDate() + (i - 1) * 14);
          break;
        case "monthly":
          emiDate.setMonth(startDate.getMonth() + i - 1);
          break;
        case "quarterly":
          emiDate.setMonth(startDate.getMonth() + (i - 1) * 3);
          break;
        default:
          emiDate.setDate(startDate.getDate() + i - 1);
      }
      const principal = calculatedPrincipal;
      const interest = calculatedInterest;
      const emi = principal + interest;
      balance -= principal;
      schedule.push({
        emiNo: i,
        date: formatDate(emiDate),
        principal: principal.toFixed(2),
        interest: interest.toFixed(2),
        emi: emi.toFixed(2),
        balance: Math.max(balance, 0).toFixed(2),
      });
    }
    return schedule;
  };

  let emiSchedule = [];
  try {
    emiSchedule = generateEMISchedule();
  } catch (err) {
    console.error("Failed to generate EMI schedule:", err);
  }

  const bankName = bankInfo?.bankName || "Your Financial Institution";
  const bankLogo = bankInfo?.logo;
  const bankAddress = bankInfo?.address || "Address not available";
  const bankPhone = bankInfo?.phone || "Phone not available";
  const bankEmail = bankInfo?.email || "Email not available";
  const bankRegistration = bankInfo?.registrationCode || "Registration not available";



  const handlePrint = () => {
    printJS({
      printable: "loan-schedule-print",
      type: "html",
      targetStyles: ["*"],
      header: "",
      honorColor: false,
      filename: `${memberName}_Repayment_Schedule`,
      ignoreElements: ['button']
    });
  };

  const printStyles = `
  @media print {
    body * {
      visibility: hidden;
      font-family: Arial, sans-serif;
    }
    #loan-schedule-print, #loan-schedule-print * {
      visibility: visible;
      font-family: Arial, sans-serif;
    }
    #loan-schedule-print {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      padding: 30px;
      font-family: Arial, sans-serif;
    }
    table {
      page-break-inside: auto;
      font-family: Arial, sans-serif;
    }
    tr {
      page-break-inside: avoid;
      page-break-after: auto;
      font-family: Arial, sans-serif;
    }
    tbody tr {
      page-break-inside: avoid;
      font-family: Arial, sans-serif;
    }
    tbody tr:last-child {
      page-break-after: avoid;
      font-family: Arial, sans-serif;
    }
    #loan-schedule-print {
      margin-bottom: 50px;
      font-family: Arial, sans-serif;
    }
    @page {
      margin: 20mm;
      @top-center { content: ""; }
      @bottom-center { content: ""; }
    }
    html, body {
      margin: 0;
      padding: 0;
    }

    /* Bank header print fix */
    .bank-header {
      display: block;
      margin-bottom: 30px !important; 
      page-break-inside: avoid; 
    }
    .bank-header h2,
    .bank-header p {
      white-space: normal !important;
      overflow-wrap: break-word !important;
      word-break: break-word !important;
      line-height: 1.4 !important;
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;
    }
    /* Force very long strings to break */
    .bank-header h2,
    .bank-header p {
      word-break: break-all !important;
    }
    /* Force next content to start on a new line */
    .after-bank-header {
      display: block;
      margin-top: 10px;
      clear: both;
    }
  }

  @page {
    margin: 20mm;
  }
`;


  return (
    <div className="content" style={{ padding: "2rem" }}>
      <Card className="shadow-lg border-0 rounded-3">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white d-flex justify-content-between align-items-center shadow-sm rounded-top px-4 py-3">
          <h4 className="mb-0 fw-bold d-flex align-items-center gap-2">
            <i className="tim-icons icon-chart-pie-36 fs-5"></i>
            Loan Repayment Schedule
          </h4>
          <div className="d-flex align-items-center gap-2">
            <Button color="light" onClick={() => navigate(-1)} className="btn-outline-secondary border-0 shadow-sm" title="Go Back">
              Back
            </Button>
            <Button color="success" onClick={handlePrint} className="btn-outline-secondary border-0 shadow-sm" title="Download & Print">
              Print
            </Button>
          </div>
        </CardHeader>

        <CardBody className="p-4">
          <div id="loan-schedule-print" style={{ padding: "30px", backgroundColor: "#fff" }}>
            <style>{printStyles}</style>

            {/* Header */}
            {/*<div style={{ textAlign: "center", marginBottom: "20px" }}>*/}
            {/*  {bankLogo && <img src={bankLogo} alt="Bank Logo" style={{ height: "80px", marginBottom: "10px" }} />}*/}
            {/*  <h2 className="fw-bold text-primary">{bankName}</h2>*/}
            {/*  <p className="text-muted mb-4 ">{bankAddress}</p>*/}
            {/*  <p className="text-muted mb-1">*/}
            {/*    <strong>Reg:</strong> {bankRegistration} | <strong>Phone:</strong> {bankPhone} | <strong>Email:</strong> {bankEmail}*/}
            {/*  </p>*/}
            {/*</div>*/}
            <div className="bank-header" style={{ textAlign: "center" }}>
              {bankLogo && (
                <img
                  src={bankLogo}
                  alt="Bank Logo"
                  style={{ height: "80px", marginBottom: "10px" }}
                />
              )}
              <h2 className="fw-bold text-primary">{bankName}</h2>
              <p className="text-muted mb-4">{bankAddress}</p>
              <p className="text-muted mb-1">
                <strong>Reg:</strong> {bankRegistration} |{" "}
                <strong>Phone:</strong> {bankPhone} |{" "}
                <strong>Email:</strong> {bankEmail}
              </p>
            </div>



            {/* Loan Info */}
            <Row className="mb-6">
              <Col md="6">
                <p><strong>Account No:</strong> {account}</p>
                <p><strong>Member Name:</strong> {memberName}</p>
                <p><strong>Loan Type:</strong> {type || loanType || "N/A"}</p>
              </Col>
              <Col md="8">
                <p><strong>Disbursed Amount:</strong> {formatCurrency(effectiveLoanAmount)}</p>
                <p><strong>EMI Amount:</strong> {formatCurrency(effectiveEmiAmount)}</p>
              </Col>
            </Row>

            {/* EMI Table */}
            <div
                            className="table-responsive mt-3"
                            style={{
                              overflowY: "visible",
                              overflowX: "visible",
                              maxHeight: "none",
                              height: "auto",
                            }}
                          >
              <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000" }}>
                <thead>
                <tr style={{ backgroundColor: "#e9ecef" }}>
                  <th style={thTdStyle}>#</th>
                  <th style={thTdStyle}>Date</th>
                  <th style={thTdStyle}>Principal (₹)</th>
                  <th style={thTdStyle}>Interest (₹)</th>
                  <th style={thTdStyle}>EMI (₹)</th>
                  <th style={thTdStyle}>Balance (₹)</th>
                </tr>
                </thead>
                <tbody>
                {emiSchedule.length > 0 ? (
                  emiSchedule.map((item, idx) => {
                    const isPaid = idx + 1 <= paidEMICount;
                    const paidStyle = isPaid
                      ? {
                        backgroundColor: "#d4edda",
                        fontWeight: "bold",
                        color: "#155724",
                        WebkitPrintColorAdjust: "exact",
                        printColorAdjust: "exact",
                      }
                      : {};

                    return (
                      <tr key={idx} style={paidStyle}>
                        <td style={{ ...thTdStyle, ...paidStyle }}>{item.emiNo}</td>
                        <td style={{ ...thTdStyle, ...paidStyle }}>{item.date}</td>
                        <td style={{ ...thTdStyle, ...paidStyle }}>{formatCurrency(item.principal)}</td>
                        <td style={{ ...thTdStyle, ...paidStyle }}>{formatCurrency(item.interest)}</td>
                        <td style={{ ...thTdStyle, ...paidStyle }}>{formatCurrency(item.emi)}</td>
                        <td style={{ ...thTdStyle, ...paidStyle }}>{formatCurrency(item.balance)}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" style={{ ...thTdStyle, color: "red", textAlign: "center" }}>
                      Failed to generate EMI schedule.
                    </td>
                  </tr>
                )}
                </tbody>

              </table>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

// styles
const thTdStyle = {
  border: "1px solid #000",
  padding: "8px",
  textAlign: "center",
  fontSize: "12px",
};

export default LoanSchedulePage;
