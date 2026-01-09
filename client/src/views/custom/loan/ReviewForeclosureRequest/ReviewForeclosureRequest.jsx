import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardBody,
  Form,
  Button,
  Row,
  Col,
  Label,
  Input,
  Table,
  Alert,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "reactstrap";
import axios from "axios";
import SweetAlert from "react-bootstrap-sweetalert";
import CstNotification from "../../components/CstNotification";

const ReviewForeclosureRequest = () => {
  const { transactionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState(null);
  const [formData, setFormData] = useState(() => ({
    foreClosurePrincipal: "0.00",
    closureDiscount: "0.00",
    remarks: "",
    payMode: "Cash",
    transactionDate: new Date().toISOString().split("T")[0],

    overdueInterest: { amount: "0.00", gstRate: "18", total: "0.00" },
    noticeCharges: { amount: "0.00", gstRate: "18", total: "0.00" },
    serviceCharges: { amount: "0.00", gstRate: "18", total: "0.00" },
    overduePenalty: { amount: "0.00", gstRate: "18", total: "0.00" },
    foreclosureCharges: { amount: "0.00", gstRate: "18", total: "0.00" },
  }));

  const [rejectLoading, setRejectLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const [sweetAlert, setSweetAlert] = useState(null);
  const [notification, setNotification] = useState(null);

  const showNotification = (color, message) => {
    const newNotification = { color, message, timestamp: Date.now() };
    setNotification(newNotification);

    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        let reqData = null;

        if (location.state?.req && location.state.req.transactionId === transactionId) {
          reqData = location.state.req;
        } else {
          const res = await axios.get("/api/loan/foreclosure/pending/loan");
          reqData = res.data.pendingRequests?.find((r) => r.transactionId === transactionId);
        }

        if (!reqData) {
          setSweetAlert(
            <SweetAlert
              danger
              title="Not Found!"
              onConfirm={() => {
                setSweetAlert(null);
                navigate("/loan/Loan-Foreclose-PendingRequest");
              }}
              confirmBtnBsStyle="danger"
              showCloseButton={false}
            >
              Request not found or already processed.
            </SweetAlert>
          );
          showNotification("danger", "Request not found.");
          return;
        }

        setRequest(reqData);
        const charges = reqData.charges || {};
        setFormData({
          foreClosurePrincipal: (charges.foreClosurePrincipal || 0).toFixed(2),
          closureDiscount: (charges.closureDiscount || 0).toFixed(2),
          remarks: charges.remarks || "",
          payMode: charges.payMode || "Cash",

          overdueInterest: {
            amount: (charges.overdueInterest?.amount || 0).toFixed(2),
            gstRate: charges.overdueInterest?.gstRate?.toString() || "18",
            total: (charges.overdueInterest?.total || 0).toFixed(2),
          },
          noticeCharges: {
            amount: (charges.noticeCharges?.amount || 0).toFixed(2),
            gstRate: charges.noticeCharges?.gstRate?.toString() || "18",
            total: (charges.noticeCharges?.total || 0).toFixed(2),
          },
          serviceCharges: {
            amount: (charges.serviceCharges?.amount || 0).toFixed(2),
            gstRate: charges.serviceCharges?.gstRate?.toString() || "18",
            total: (charges.serviceCharges?.total || 0).toFixed(2),
          },
          overduePenalty: {
            amount: (charges.overduePenalty?.amount || 0).toFixed(2),
            gstRate: charges.overduePenalty?.gstRate?.toString() || "18",
            total: (charges.overduePenalty?.total || 0).toFixed(2),
          },
          foreclosureCharges: {
            amount: (charges.foreClosureCharges?.amount || 0).toFixed(2),
            gstRate: charges.foreClosureCharges?.gstRate?.toString() || "18",
            total: (charges.foreClosureCharges?.total || 0).toFixed(2),
          },
        });
      } catch (err) {
        console.error("Failed to load request:", err);
        setSweetAlert(
          <SweetAlert
            danger
            title="Error!"
            onConfirm={() => {
              setSweetAlert(null);
              navigate("/loan/Loan-Foreclose-PendingRequest");
            }}
            confirmBtnBsStyle="danger"
            showCloseButton={false}
          >
             Failed to load request.
          </SweetAlert>
        );
        showNotification("danger", "Failed to load request.");
      } finally {
        setLoading(false);
      }
    };

    if (transactionId) {
      fetchData();
    }
  }, [transactionId, navigate, location.state]);

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

  const calculateTotal = (amount, gstRate) => {
    const amt = parseFloat(amount) || 0;
    const rate = parseFloat(gstRate) || 18;
    return Math.round((amt + (amt * rate) / 100) * 100) / 100; // 2 decimal precision
  };

  useEffect(() => {
    const updateTotals = () => {
      const updated = { ...formData };

      [
        "overdueInterest",
        "noticeCharges",
        "serviceCharges",
        "overduePenalty",
        "foreclosureCharges",
      ].forEach((field) => {
        const amount = parseFloat(updated[field]?.amount) || 0;
        const gstRate = parseFloat(updated[field]?.gstRate) || 18;
        const total = calculateTotal(amount, gstRate);
        updated[field] = {
          amount: amount.toFixed(2),
          gstRate: gstRate.toString(),
          total: total.toFixed(2),
        };
      });

      setFormData(updated);
    };

    updateTotals();
  }, [
    formData.foreClosurePrincipal,
    formData.closureDiscount,
    formData.payMode,
    formData.remarks,
    formData.overdueInterest?.amount,
    formData.overdueInterest?.gstRate,
    formData.noticeCharges?.amount,
    formData.noticeCharges?.gstRate,
    formData.serviceCharges?.amount,
    formData.serviceCharges?.gstRate,
    formData.overduePenalty?.amount,
    formData.overduePenalty?.gstRate,
    formData.foreclosureCharges?.amount,
    formData.foreclosureCharges?.gstRate,
  ]);

  const calculateTotalAmount = () => {
    const fields = [
      parseFloat(formData.foreClosurePrincipal) || 0,
      parseFloat(formData.overdueInterest.total) || 0,
      parseFloat(formData.noticeCharges.total) || 0,
      parseFloat(formData.serviceCharges.total) || 0,
      parseFloat(formData.overduePenalty.total) || 0,
      parseFloat(formData.foreclosureCharges.total) || 0,
    ].reduce((sum, val) => sum + val, 0);

    return Math.round(fields * 100) / 100;
  };

  const totalAmount = calculateTotalAmount();
  const netAmount = Math.max(0, totalAmount - (parseFloat(formData.closureDiscount) || 0));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!window.confirm("Approve this foreclosure with updated values?")) return;

    try {
      const getNested = (field, key) => {
        return parseFloat(formData[field]?.[key]) || 0;
      };

      const payload = {
        transactionId,
        charges: {
          foreClosurePrincipal: parseFloat(formData.foreClosurePrincipal) || 0,
          closureDiscount: parseFloat(formData.closureDiscount) || 0,
          payMode: formData.payMode,
          remarks: formData.remarks,

          overdueInterest: {
            amount: getNested("overdueInterest", "amount"),
            gstRate: getNested("overdueInterest", "gstRate"),
            total: getNested("overdueInterest", "total"),
          },
          noticeCharges: {
            amount: getNested("noticeCharges", "amount"),
            gstRate: getNested("noticeCharges", "gstRate"),
            total: getNested("noticeCharges", "total"),
          },
          serviceCharges: {
            amount: getNested("serviceCharges", "amount"),
            gstRate: getNested("serviceCharges", "gstRate"),
            total: getNested("serviceCharges", "total"),
          },
          overduePenalty: {
            amount: getNested("overduePenalty", "amount"),
            gstRate: getNested("overduePenalty", "gstRate"),
            total: getNested("overduePenalty", "total"),
          },
          foreclosureCharges: {
            amount: getNested("foreclosureCharges", "amount"),
            gstRate: getNested("foreclosureCharges", "gstRate"),
            total: getNested("foreclosureCharges", "total"),
          },
        },
      };

      const response = await axios.post("/api/loan/authorize-foreclosure", payload);

      // ✅ Replace alert with SweetAlert + Notification
      setSweetAlert(
        <SweetAlert
          success
          title="Approved!"
          onConfirm={() => {
            setSweetAlert(null);
            navigate(`/loan/Loan-Foreclose-PendingRequest`);
          }}
          confirmBtnBsStyle="success"
          showCloseButton={false}
        >
          {response.data.success}
          <br />
          <strong>Transaction ID: {transactionId}</strong>
        </SweetAlert>
      );
      showNotification("success", "Foreclosure approved successfully.");
    } catch (err) {
      console.error("Approval failed:", err);
      // ✅ Replace alert with SweetAlert + Notification
      setSweetAlert(
        <SweetAlert
          danger
          title="Error!"
          onConfirm={() => setSweetAlert(null)}
          confirmBtnBsStyle="danger"
          showCloseButton={false}
        >
          Failed: {err.response?.data?.error || "Try again"}
        </SweetAlert>
      );
      showNotification("danger", "Failed to approve foreclosure.");
    }
  };

  const handleRejectClick = () => {
    setRejectionReason("");
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (!rejectionReason.trim()) {
      setSweetAlert(
        <SweetAlert
          warning
          title="Missing Info!"
          onConfirm={() => setSweetAlert(null)}
          confirmBtnBsStyle="warning"
          showCloseButton={false}
        >
          Rejection reason is required.
        </SweetAlert>
      );
      showNotification("warning", "Rejection reason is required.");
      return;
    }

    setRejectLoading(true);
    try {
      const response = await axios.post("/api/loan/foreclose/reject", {
        transactionId,
        rejectionReason: rejectionReason.trim(),
      });

      setSweetAlert(
        <SweetAlert
          success
          title="Rejected!"
          onConfirm={() => {
            setSweetAlert(null);
            setShowRejectModal(false);
            navigate("/loan/Loan-Foreclose-PendingRequest");
          }}
          confirmBtnBsStyle="success"
          showCloseButton={false}
        >
          {response.data.success}
        </SweetAlert>
      );
      showNotification("info", "Request rejected successfully.");
    } catch (err) {
      console.error("Rejection failed:", err);
      setSweetAlert(
        <SweetAlert
          danger
          title="Error!"
          onConfirm={() => setSweetAlert(null)}
          confirmBtnBsStyle="danger"
          showCloseButton={false}
        >
          ❌ Failed: {err.response?.data?.error || "Try again"}
        </SweetAlert>
      );
      showNotification("danger", "Failed to reject request.");
    } finally {
      setRejectLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="content text-center mt-5">
        <h5>Loading request details...</h5>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="content text-center mt-5">
        <Alert color="danger">Request not found.</Alert>
        <Button color="secondary" onClick={() => navigate(-1)}>
          ← Back
        </Button>
      </div>
    );
  }

  return (
    <>
      {notification && (
        <CstNotification
          color={notification.color}
          message={notification.message}
          autoDismiss={5}
          place="tc"
          timestamp={notification.timestamp}
        />
      )}
      {sweetAlert}

      <div className="content" style={{ padding: "2rem" }}>
        <Card className="shadow-lg border-0 rounded-3">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-red-600 text-white d-flex justify-content-between align-items-center px-4 py-3">
            <h4 className="mb-0 fw-bold">Review & Approve Foreclosure</h4>
            <Button color="light" onClick={() => navigate(-1)}>
              ← Back
            </Button>
          </CardHeader>

          <CardBody className="p-4">
            <Form onSubmit={handleSubmit}>
              <Row>
                <Col md="12">
                  <div
                    style={{
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      padding: "20px",
                    }}
                  >
                    <h5 className="mb-4">Review ForeClosure</h5>

                    <div className="mb-3">
                      <Label>Principal Amount (A)*</Label>
                      <Input
                        type="number"
                        name="foreClosurePrincipal"
                        value={formData.foreClosurePrincipal}
                        onChange={handleChange}
                        step="0.01"
                        className="form-control"
                        required
                      />
                    </div>

                    {[
                      "overdueInterest",
                      "noticeCharges",
                      "serviceCharges",
                      "overduePenalty",
                      "foreclosureCharges",
                    ].map((field) => (
                      <div key={field} className="mb-3">
                        <Label>
                          {{
                            overdueInterest: "Overdue Interest (C)*",
                            noticeCharges: "Notice Charges (D)*",
                            serviceCharges: "Service Charges (E)*",
                            overduePenalty: "Overdue Penalty (F)*",
                            foreclosureCharges: "Fore Closure Charges (G)*",
                          }[field]}
                        </Label>
                        <div className="d-flex gap-2">
                          <Input
                            type="number"
                            name={`${field}.amount`}
                            value={formData[field].amount}
                            onChange={handleChange}
                            placeholder="Amount"
                            step="0.01"
                            className="form-control"
                          />
                          <Input
                            type="number"
                            name={`${field}.gstRate`}
                            value={formData[field].gstRate}
                            onChange={handleChange}
                            placeholder="GST %"
                            step="0.1"
                            className="form-control"
                            style={{ width: "100px" }}
                          />
                          <Input
                            type="text"
                            value={formData[field].total}
                            readOnly
                            className="form-control"
                            placeholder="Total"
                          />
                        </div>
                      </div>
                    ))}

                    <div className="mb-3">
                      <Label>Total Amount (H = A+C+D+E+F+G)</Label>
                      <Input
                        type="text"
                        value={totalAmount.toFixed(2)}
                        readOnly
                        className="form-control"
                        style={{ background: "#f8f9fa" }}
                      />
                    </div>

                    <div className="mb-3">
                      <Label>Closure Discount (I)*</Label>
                      <Input
                        type="number"
                        name="closureDiscount"
                        value={formData.closureDiscount}
                        onChange={handleChange}
                        step="0.01"
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
                        style={{ background: "#f8f9fa", fontWeight: "bold" }}
                      />
                    </div>

                    <div className="mb-3">
                      <Label>Remarks (if any)</Label>
                      <Input
                        type="textarea"
                        name="remarks"
                        value={formData.remarks}
                        onChange={handleChange}
                        rows="2"
                        className="form-control"
                      />
                    </div>

                    <div className="mb-3">
                      <Label>Pay Mode *</Label>
                      <div className="d-flex mt-2" style={{ gap: "60px" }}>
                        {["Cash", "Online Tr.", "Cheque", "Saving Ac.", "RD/DD Ac."].map(
                          (mode) => (
                            <label key={mode}>
                              <Input
                                type="radio"
                                name="payMode"
                                value={mode}
                                checked={formData.payMode === mode}
                                onChange={handleChange}
                                style={{ marginRight: "7px" }}
                              />
                              {mode}
                            </label>
                          )
                        )}
                      </div>
                    </div>

                    <div className="text-center mt-4">
                      <Button type="submit" color="success" className="me-2 px-4 py-2">
                        ✅ Approve Request
                      </Button>

                      <Button
                        color="danger"
                        className="me-2 px-4 py-2"
                        onClick={handleRejectClick}
                        disabled={rejectLoading}
                      >
                        ❌ Reject Request
                      </Button>

                      <Button
                        type="button"
                        color="secondary"
                        onClick={() => navigate("/loan/foreclosure/pending")}
                        className="px-4 py-2"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </Col>
              </Row>
            </Form>
          </CardBody>
        </Card>

        <Modal
          isOpen={showRejectModal}
          toggle={() => setShowRejectModal(false)}
          centered
        >
          <ModalHeader toggle={() => setShowRejectModal(false)}>
            Reject Foreclosure Request
          </ModalHeader>
          <ModalBody>
            <Label>Rejection Reason *</Label>
            <Input
              type="textarea"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter reason for rejection"
              rows="4"
              autoFocus
            />
          </ModalBody>
          <ModalFooter>
            <Button
              color="secondary"
              onClick={() => setShowRejectModal(false)}
              disabled={rejectLoading}
            >
              Cancel
            </Button>
            <Button
              color="danger"
              onClick={confirmReject}
              disabled={rejectLoading || !rejectionReason.trim()}
            >
              {rejectLoading ? "Rejecting..." : "Reject"}
            </Button>
          </ModalFooter>
        </Modal>
      </div>
    </>
  );
};

export default ReviewForeclosureRequest;