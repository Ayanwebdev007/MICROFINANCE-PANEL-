import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    Card,
    CardHeader,
    CardBody,
    Button,
    Row,
    Col,
    Form,
    Label,
    Input,
} from "reactstrap";
import axios from "axios";
import SweetAlert from "react-bootstrap-sweetalert";
import CstNotification from "../../components/CstNotification";

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

const ForecloseLoanForm = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { loanData, bankInfo,accountType } = location.state || {};
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        remainingAmountType: "currentDebt",
        remainingAmount: "",
        overdueInterest: { amount: "", gstRate: 18, total: "" },
        noticeCharges: { amount: "", gstRate: 18, total: "" },
        serviceCharges: { amount: "", gstRate: 18, total: "" },
        overduePenalty: { amount: "", gstRate: 18, total: "" },
        foreClosureCharges: { amount: "", gstRate: 18, total: "" },
        closureDiscount: "0",
        transactionDate: new Date().toISOString().split("T")[0],
        remarks: "",
        payMode: "Cash",
    });

    const [sweetAlert, setSweetAlert] = useState(null);
    const [notification, setNotification] = useState({ color: '', message: '', timestamp: Date.now() });

    const showNotification = (color, message) => {
        setNotification({ color, message, timestamp: Date.now() });
    };

    // Populate defaults
    useEffect(() => {
        if (!loanData) return;
        const { currentDebt, deductionDetails = {} } = loanData;
        const remainingPrincipal = parseFloat(currentDebt) || 0;
        setFormData((prev) => ({
            ...prev,
            remainingAmount: remainingPrincipal.toFixed(2),
            serviceCharges: {
                ...prev.serviceCharges,
                amount: deductionDetails.processingFee || "0",
            },
            noticeCharges: {
                ...prev.noticeCharges,
                amount: deductionDetails.legalAmount || "0",
            },
            foreClosureCharges: {
                ...prev.foreClosureCharges,
                amount: "0",
            },
        }));
    }, [loanData]);


    const calculateTotalAmount = () => {
        const fields = [
            "remainingAmount",
            "overdueInterest.total",
            "noticeCharges.total",
            "serviceCharges.total",
            "overduePenalty.total",
            "foreClosureCharges.total",
        ];
        return fields.reduce((sum, key) => {
            const value = key.includes(".")
              ? parseFloat(formData[key.split(".")[0]][key.split(".")[1]]) || 0
              : parseFloat(formData[key]) || 0;
            return sum + value;
        }, 0);
    };

    const totalAmount = calculateTotalAmount();




// Final payable amount
    const netAmount =
      totalAmount -
      (parseFloat(formData.closureDiscount) || 0) ;

    const handleChange = (e) => {
        const { name, value } = e.target;
        const [parent, child] = name.split(".");
        if (parent && child) {
            setFormData((prev) => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value,
                },
            }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    // Submit foreclosure request
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                accountType: accountType ,
                account: loanData.account,
                transDate: formData.transactionDate,
                remarks: formData.remarks || "",
                payMode: formData.payMode,
                totalForeclosureAmount:netAmount,
                charges: {
                    foreClosurePrincipal: parseFloat(formData.remainingAmount) || 0,
                    closureDiscount: parseFloat(formData.closureDiscount) || 0,
                    payMode: formData.payMode,
                    remarks: formData.remarks || "",
                    overdueInterest: {
                        amount: parseFloat(formData.overdueInterest.amount) || 0,
                        gstRate: parseFloat(formData.overdueInterest.gstRate) || 18,
                        total: parseFloat(formData.overdueInterest.total) || 0,
                    },
                    noticeCharges: {
                        amount: parseFloat(formData.noticeCharges.amount) || 0,
                        gstRate: parseFloat(formData.noticeCharges.gstRate) || 18,
                        total: parseFloat(formData.noticeCharges.total) || 0,
                    },
                    serviceCharges: {
                        amount: parseFloat(formData.serviceCharges.amount) || 0,
                        gstRate: parseFloat(formData.serviceCharges.gstRate) || 18,
                        total: parseFloat(formData.serviceCharges.total) || 0,
                    },
                    overduePenalty: {
                        amount: parseFloat(formData.overduePenalty.amount) || 0,
                        gstRate: parseFloat(formData.overduePenalty.gstRate) || 18,
                        total: parseFloat(formData.overduePenalty.total) || 0,
                    },
                    foreClosureCharges: {
                        amount: parseFloat(formData.foreClosureCharges.amount) || 0,
                        gstRate: parseFloat(formData.foreClosureCharges.gstRate) || 18,
                        total: parseFloat(formData.foreClosureCharges.total) || 0,
                    },
                },
            };
 console.log(payload);
            const response = await axios.post("/api/loan/foreclose/request", payload);
            const { transactionId, success } = response.data;

            setSweetAlert(
              <SweetAlert
                success
                title="Success!"
                onConfirm={() => {
                    setSweetAlert(null);
                    window.open(`/api/loan/foreclose/request-slip/${transactionId}`, "_blank");
                    setFormData((prev) => ({
                        ...prev,
                        remarks: "",
                        payMode: "Cash",
                    }));
                    navigate(-1);
                }}
                confirmBtnBsStyle="success"
                confirmBtnText="View Slip & Close"
                timeout={10000}
              >
                  {success}
                  <br />
                  <strong>Transaction ID: {transactionId}</strong>
                  <br />
                  Click "View Slip" to print the request.
              </SweetAlert>
            );

            showNotification("success", `Foreclosure request submitted: ${transactionId}`);
        } catch (err) {
            console.error("Foreclosure request failed:", err);
            setSweetAlert(
              <SweetAlert
                danger
                title="Error!"
                onConfirm={() => setSweetAlert(null)}
                confirmBtnBsStyle="danger"
              >
                  Failed to submit: {err.response?.data?.error || "Try again"}
              </SweetAlert>
            );
            showNotification("danger", "Failed to submit foreclosure request.");
        } finally {
            setLoading(false);
        }
    };

    if (!loanData) {
        return (
          <div className="content text-center mt-5">
              <h5 className="text-danger mb-4">No loan data found. Please go back.</h5>
              <Button color="primary" onClick={() => navigate(-1)} className="px-4 py-2">
                  ← Back
              </Button>
          </div>
        );
    }

    const {
        account: loanNo,
        memberName,
        memberNo,
        openDate,
        scheme,
        loanAmount,
        currentDebt,
        emiCollection,
        totalEMI,
        paidEMI,
        planDetails = {},
        status,
        transactions = [],
    } = loanData;

    const paidEMICount = transactions
      .filter((tx) => tx.type === "credit")
      .reduce((max, tx) => Math.max(max, parseInt(tx.paidEMI || 0)), 0);

    const cardHeaderStyle = {
        height: "32px",
        paddingTop: "0",
        paddingBottom: "0",
        display: "flex",
        alignItems: "center"
    };

    const cardTitleStyle = {
        fontSize:16,
        marginLeft:20,
        fontWeight:400,
        marginTop:13
    }

    return (
      <>
          {/* Notification System */}
          <CstNotification
            color={notification.color}
            message={notification.message}
            autoDismiss={5}
            place="tc"
            timestamp={notification.timestamp}
          />

          {/* SweetAlert */}
          {sweetAlert}

          <div className="content" style={{ padding: "2rem" }}>
              <Card className="shadow-lg border-0 rounded-3">
                  <CardHeader
                    className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white d-flex justify-content-between align-items-center px-4 py-3"
                    style={{
                        background: "linear-gradient(90deg, #4A90E2, #6366F1)",
                    }}
                  >
                      <h4 className="mb-0 fw-bold d-flex align-items-center gap-2">
                          {loanData?.foreclosureStatus === 'pending' && loanData?.foreclosureRequestId ? (
                            <span
                              onClick={() => window.open(`/api/loan/foreclose/request-slip/${loanData.foreclosureRequestId}`, '_blank')}
                              style={{
                                  color: 'inherit',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                  userSelect: 'none',
                              }}
                              title="Click to print pending foreclosure slip"
                            >
                  FORECLOSURE REQUEST (Pending)
                </span>
                          ) : loanData?.closureType === 'foreclosure' && loanData?.foreclosureTransactionId ? (
                            <span
                              onClick={() => window.open(`/api/loan/foreclose/receipt/${loanData.account}`, '_blank')}
                              style={{
                                  color: 'inherit',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                  userSelect: 'none',
                              }}
                              title="Click to print final closure receipt"
                            >
                   FORECLOSURE REQUEST (Closed)
                </span>
                          ) : (
                            <span> FORECLOSURE REQUEST</span>
                          )}
                      </h4>
                      <Button color="light" onClick={() => navigate(-1)}>
                          ← Back
                      </Button>
                  </CardHeader>

                  <CardBody className="p-4">
                      <Form onSubmit={handleSubmit}>
                          <Row>
                              {/* Left Panel */}
                              <Col md="7">
                                  <div style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "20px" }}>
                                      <h5 className="mb-4">Charges</h5>

                                      {/* Remaining Amount */}
                                      <div className="mb-3">
                                          <Label>Remaining Amount (A)*</Label>
                                          <Input
                                            type="select"
                                            name="remainingAmountType"
                                            value={formData.remainingAmountType}
                                            onChange={(e) => {
                                                const value =
                                                  e.target.value === "currentDebt"
                                                    ? loanData.currentDebt
                                                    : loanData.principleDue;
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    remainingAmountType: e.target.value,
                                                    remainingAmount: parseFloat(value).toFixed(2),
                                                }));
                                            }}
                                          >
                                              <option value="currentDebt">Outstanding Balance</option>
                                              <option value="principleDue">Principal Due</option>
                                          </Input>
                                          <Input
                                            type="text"
                                            value={formData.remainingAmount}
                                            readOnly
                                            className="form-control mt-2"
                                          />
                                      </div>

                                      {/* Fee Fields */}
                                      {[
                                          "overdueInterest",
                                          "noticeCharges",
                                          "serviceCharges",
                                          "overduePenalty",
                                          "foreClosureCharges",
                                      ].map((field) => (
                                        <div key={field} className="mb-3">
                                            <Label className="mb-1 fw-bold">
                                                {{
                                                    overdueInterest: "Overdue Interest (C)*",
                                                    noticeCharges: "Notice Charges (D)*",
                                                    serviceCharges: "Service Charges (E)*",
                                                    overduePenalty: "Overdue Penalty (F)*",
                                                    foreClosureCharges: "Fore Closure Charges (G)*",
                                                }[field]}
                                            </Label>
                                            <div className="d-flex text-muted small fw-semibold mb-1">
                                                <div style={{flex: 1}}>Amount</div>
                                                <div style={{width: "100px"}}>GST %</div>
                                                <div style={{flex: 1}}>Total</div>
                                            </div>
                                            <div className="d-flex gap-2">
                                                <Input
                                                  type="number"
                                                  name={`${field}.amount`}
                                                  value={formData[field].amount}
                                                  onChange={(e) => {
                                                      const amount = parseFloat(e.target.value) || 0;
                                                      const percent = parseFloat(formData[field].gstRate) || 0;
                                                      const total = amount + (amount * percent) / 100;
                                                      setFormData((prev) => ({
                                                          ...prev,
                                                          [field]: {
                                                              ...prev[field],
                                                              amount: e.target.value,
                                                              total: total.toFixed(2),
                                                          },
                                                      }));
                                                  }}
                                                  placeholder="Amount"
                                                  className="form-control"
                                                  style={{flex: 1}}
                                                />
                                                <Input
                                                  type="number"
                                                  name={`${field}.gstRate`}
                                                  value={formData[field].gstRate}
                                                  onChange={(e) => {
                                                      const percent = parseFloat(e.target.value) || 0;
                                                      const amount = parseFloat(formData[field].amount) || 0;
                                                      const total = amount + (amount * percent) / 100;
                                                      setFormData((prev) => ({
                                                          ...prev,
                                                          [field]: {
                                                              ...prev[field],
                                                              gstRate: e.target.value,
                                                              total: total.toFixed(2),
                                                          },
                                                      }));
                                                  }}
                                                  placeholder="%"
                                                  className="form-control"
                                                  style={{width: "100px"}}
                                                />
                                                <Input
                                                  type="text"
                                                  value={formData[field].total}
                                                  readOnly
                                                  className="form-control"
                                                  placeholder="Total"
                                                  style={{
                                                      flex: 1,
                                                      fontWeight: "bold",
                                                      background: "#f8f9fa",
                                                  }}
                                                />
                                            </div>
                                        </div>
                                      ))}

                                      {/* Totals */}
                                      <div className="mb-3">
                                          <Label>Total Amount (H = A+C+D+E+F+G)</Label>
                                          <Input
                                            type="text"
                                            value={totalAmount.toFixed(2)}
                                            readOnly
                                            className="form-control"
                                            style={{background: "#f8f9fa"}}
                                          />
                                      </div>
                                      <div className="mb-3">
                                          <Label>Closure Discount (I)*</Label>
                                          <Input
                                            type="number"
                                            name="closureDiscount"
                                            value={formData.closureDiscount}
                                            onChange={(e) =>
                                              setFormData((prev) => ({
                                                  ...prev,
                                                  closureDiscount: e.target.value,
                                              }))
                                            }
                                            className="form-control"
                                          />
                                      </div>
                                      <div className="mb-3">
                                          <Label>Net Amount to Collect (K = H - I)*</Label>
                                          <Input
                                            type="text"
                                            value={netAmount.toFixed(2)}
                                            readOnly
                                            className="form-control"
                                            style={{
                                                background: "#f8f9fa",
                                                fontWeight: "bold",
                                            }}
                                          />
                                      </div>

                                      {/* Transaction Date */}
                                      <div className="mb-3">
                                          <Label>Request Date *</Label>
                                          <Input
                                            type="date"
                                            name="transactionDate"
                                            value={formData.transactionDate}
                                            onChange={(e) =>
                                              setFormData((prev) => ({
                                                  ...prev,
                                                  transactionDate: e.target.value,
                                              }))
                                            }
                                            required
                                          />
                                      </div>

                                      {/* Remarks */}
                                      <div className="mb-3">
                                          <Label>Remarks (if any)</Label>
                                          <Input
                                            type="textarea"
                                            name="remarks"
                                            value={formData.remarks}
                                            onChange={(e) =>
                                              setFormData((prev) => ({
                                                  ...prev,
                                                  remarks: e.target.value,
                                              }))
                                            }
                                            rows="2"
                                            className="form-control"
                                          />
                                      </div>

                                      {/* Pay Mode */}
                                      {/*<div className="mb-3">*/}
                                      {/*    <Label>Pay Mode *</Label>*/}
                                      {/*    <div className="d-flex gap-3 mt-2">*/}
                                      {/*        {["Cash", "Online Tr.", "Cheque", "Saving Ac.", "RD/DD Ac."].map((mode) => (*/}
                                      {/*          <label key={mode} style={{marginRight: "15px"}}>*/}
                                      {/*              <Input*/}
                                      {/*                type="radio"*/}
                                      {/*                name="payMode"*/}
                                      {/*                value={mode}*/}
                                      {/*                checked={formData.payMode === mode}*/}
                                      {/*                onChange={(e) =>*/}
                                      {/*                  setFormData((prev) => ({*/}
                                      {/*                      ...prev,*/}
                                      {/*                      payMode: e.target.value,*/}
                                      {/*                  }))*/}
                                      {/*                }*/}
                                      {/*                style={{marginRight: "5px"}}*/}
                                      {/*              />*/}
                                      {/*              {mode}*/}
                                      {/*          </label>*/}
                                      {/*        ))}*/}
                                      {/*    </div>*/}
                                      {/*</div>*/}
                                      <div className="mb-3">
                                          <Label>Pay Mode *</Label>

                                          <div className="d-flex flex-wrap gap-3 mt-2 content" style={{ padding: "2rem" }}>
                                              {["Cash", "Online Tr.", "Cheque", "Saving Ac.", "RD/DD Ac."].map((mode) => (
                                                  <label
                                                      key={mode}
                                                      className="d-flex align-items-center"
                                                      style={{ minWidth: "110px" }}
                                                  >
                                                      <Input
                                                          type="radio"
                                                          name="payMode"
                                                          value={mode}
                                                          checked={formData.payMode === mode}
                                                          onChange={(e) =>
                                                              setFormData((prev) => ({
                                                                  ...prev,
                                                                  payMode: e.target.value,
                                                              }))
                                                          }
                                                          style={{ marginRight: "6px" }}
                                                      />
                                                      <span>{mode}</span>
                                                  </label>
                                              ))}
                                          </div>
                                      </div>


                                      {/* Submit Buttons */}
                                      <div className="text-center mt-4">
                                          <Button
                                            type="submit"
                                            color="primary"
                                            disabled={loading}
                                            className="px-4 py-2 me-2"
                                          >
                                              {loading ? "Submitting..." : "SUBMIT REQUEST"}
                                          </Button>
                                          <Button
                                            type="button"
                                            color="secondary"
                                            onClick={() => navigate(-1)}
                                            className="px-4 py-2"
                                          >
                                              CANCEL
                                          </Button>
                                      </div>
                                  </div>
                              </Col>

                              {/* Right Panel: Loan Info */}
                              <Col md="5">
                                  <div className="bg-light" style={cardHeaderStyle}>
                                      <h5 style={cardTitleStyle}>Loan Account Info</h5>
                                  </div>
                                  <div
                                    style={{
                                        border: "1px solid #ddd",
                                        padding: "15px",
                                        borderRadius: "8px",
                                    }}
                                  >
                                      <table className="table table-sm">
                                          <tbody>
                                          <tr>
                                              <td>Account No.</td>
                                              <td>{loanNo}</td>
                                          </tr>
                                          <tr>
                                              <td>Borrower</td>
                                              <td>{memberNo} - {memberName}</td>
                                          </tr>
                                          <tr>
                                              <td>Open Date</td>
                                              <td>{formatDate(openDate)}</td>
                                          </tr>
                                          <tr>
                                              <td>Scheme</td>
                                              <td>{scheme}</td>
                                          </tr>
                                          <tr>
                                              <td>Loan Amount</td>
                                              <td>{formatCurrency(loanAmount)}</td>
                                          </tr>
                                          <tr>
                                              <td>Outstanding</td>
                                              <td>{formatCurrency(currentDebt)}</td>
                                          </tr>
                                          <tr>
                                              <td>Interest Rate</td>
                                              <td>{planDetails.interestRate}%</td>
                                          </tr>
                                          <tr>
                                              <td>Tenure</td>
                                              <td>{totalEMI} {emiCollection}</td>
                                          </tr>
                                          <tr>
                                              <td>Status</td>
                                              <td>{status}</td>
                                          </tr>
                                          </tbody>
                                      </table>
                                  </div>

                                  <div className="bg-light"
                                    style={cardHeaderStyle}
                                  >
                                      <h5 style={cardTitleStyle}>EMI Summary</h5>
                                  </div>

                                  <div style={{border: "1px solid #ddd", padding: "15px", borderRadius: "8px"}}>
                                      <table className="table table-sm">
                                          <tbody>
                                          <tr>
                                              <td>Total EMIs</td>
                                              <td>{totalEMI}</td>
                                          </tr>
                                          <tr>
                                              <td>Paid</td>
                                              <td>{paidEMI}</td>
                                          </tr>
                                          <tr>
                                              <td>Remaining</td>
                                              <td>{totalEMI - paidEMI}</td>
                                          </tr>
                                          <tr>
                                              <td>Due</td>
                                              <td>{Math.max(0, totalEMI - paidEMICount)}</td>
                                          </tr>
                                          <tr>
                                              <td>Overdue</td>
                                              <td>{Math.max(0, paidEMICount - paidEMI)}</td>
                                          </tr>
                                          </tbody>
                                      </table>
                                  </div>
                              </Col>
                          </Row>
                      </Form>
                  </CardBody>
              </Card>
          </div>
      </>
    );
};

export default ForecloseLoanForm;