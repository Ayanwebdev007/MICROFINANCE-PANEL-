import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardBody,
  Table,
  Button,
  Row,
  Col,
  Badge,
  Spinner,
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
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "2-digit",
  });
};

const PendingForeclosureList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);

  // ✅ Add SweetAlert & Notification state
  const [sweetAlert, setSweetAlert] = useState(null);
  const [notification, setNotification] = useState({ color: '', message: '', timestamp: Date.now() });

  // ✅ Helper to trigger CstNotification
  const showNotification = (color, message) => {
    setNotification({ color, message, timestamp: Date.now() });
  };

  useEffect(() => {
    const fetchPendingRequests = async () => {
      try {
        const response = await axios.get("/api/loan/foreclosure/pending/loan");
        setRequests(response.data.pendingRequests || []);
      } catch (err) {
        setSweetAlert(
          <SweetAlert
            danger
            title="Error!"
            onConfirm={() => setSweetAlert(null)}
            confirmBtnBsStyle="danger"
          >
            ❌ Failed to load pending requests.
          </SweetAlert>
        );
        showNotification("danger", "Failed to load pending requests.");
      } finally {
        setLoading(false);
      }
    };

    fetchPendingRequests();
  }, []);


  const handleForeCloseReview = (req) => {
    navigate(`/loan/foreclosure/review/${req.transactionId}`, {
      state: { req: JSON.stringify(req) },
    });
  };


  const handleApproveRequest = async (transactionId) => {
    try {
      const response = await axios.post("/api/loan/authorize-foreclosure", {
        transactionId,
      });

      // ✅ Show SweetAlert on success
      setSweetAlert(
        <SweetAlert
          success
          title="Approved!"
          onConfirm={() => {
            setSweetAlert(null);
            // window.open(`/api/loan/foreclose/receipt/${transactionId}`, "_blank");
          }}
          confirmBtnBsStyle="success"
          confirmBtnText="OK"
        >
          {response.data.success}
          <br />
          <strong>Transaction ID: {transactionId}</strong>
        </SweetAlert>
      );

      // ✅ Show toast notification
      showNotification("success", `Foreclosure approved: ${transactionId}`);

      // Refresh list
      const refresh = await axios.get("/api/loan/foreclosure/pending/loan");
      setRequests(refresh.data.pendingRequests || []);
    } catch (err) {
      console.error("Approval failed:", err);

      // ✅ Replace alert with SweetAlert + Notification
      setSweetAlert(
        <SweetAlert
          danger
          title="Error!"
          onConfirm={() => setSweetAlert(null)}
          confirmBtnBsStyle="danger"
        >
          ❌ Failed to approve: {err.response?.data?.error || "Check console"}
        </SweetAlert>
      );
      showNotification("danger", "Failed to approve foreclosure request.");
    }
  };

  return (
    <>
      {/* ✅ Render CstNotification */}
      <CstNotification
        color={notification.color}
        message={notification.message}
        autoDismiss={5}
        place="tc"
        timestamp={notification.timestamp}
      />

      {/* ✅ Render SweetAlert if active */}
      {sweetAlert}

      <div className="content" style={{ padding: "2rem" }}>
        <Card className="shadow-lg border-0 rounded-3">
          <CardBody className="p-0">
            {loading ? (
              <div className="text-center py-5">
                <Spinner color="primary" />{" "}
                <span className="ms-2">Loading requests...</span>
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <h5>No pending foreclosure requests</h5>
              </div>
            ) : (
              <div className="table-responsive">
                <Table className="mb-0" hover>
                  <thead className="bg-light">
                  <tr>
                    <th>Account</th>
                    <th>Borrower</th>
                    <th>Transaction Id</th>
                    <th>Total</th>
                    <th>Request Date</th>
                    <th>Status</th>
                    <th>Requested By</th>
                    <th>Actions</th>
                  </tr>
                  </thead>
                  <tbody>
                  {requests.map((req) => (
                    <tr key={req.transactionId}>
                      <td>
                        <strong>{req.accountNumber}</strong>
                      </td>
                      <td>{req.borrowerName}</td>
                      <td>{req.transactionId}</td>
                      <td>
                        <strong>{formatCurrency(req.totalForeclosureAmount)}</strong>
                      </td>
                      <td>{formatDate(req.createdAt)}</td>
                      <td>
                        <Badge
                          color="warning"
                          style={{
                            fontSize: "0.8em",
                            padding: "0.5em 0.8em",
                          }}
                        >
                          {req.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td>{req.createdBy.split("@")[0]}</td>
                      <td>

                        <Button
                          color="secondary"
                          size="sm"
                          onClick={() => handleForeCloseReview(req)}
                        >
                          View & Edit
                        </Button>

                      </td>
                    </tr>
                  ))}
                  </tbody>
                </Table>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
};

export default PendingForeclosureList;