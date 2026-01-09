import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardBody, Table, Button, Input, Spinner } from "reactstrap";
import axios from "axios";
import CstNotification from "../../components/CstNotification";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(parseFloat(amount || 0));

const formatDate = (dateString) => {
  if (!dateString || dateString === "N/A") return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "2-digit",
  });
};

const ForeclosedAccountsList = () => {
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [notification, setNotification] = useState({ color: "", message: "", timestamp: Date.now() });

  const showNotification = (color, message) => {
    setNotification({ color, message, timestamp: Date.now() });
  };

  useEffect(() => {
    const fetchForeclosedAccounts = async () => {
      try {
        const response = await axios.get("/api/loan/foreclosed-accounts");
        const data = response?.data?.accounts || [];
        setAccounts(data);
        setFilteredAccounts(data);
      } catch (err) {
        showNotification("danger", "Failed to load foreclosed accounts.");
      } finally {
        setLoading(false);
      }
    };

    fetchForeclosedAccounts();
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (!searchTerm.trim()) {
        setFilteredAccounts(accounts);
      } else {
        const lower = searchTerm.toLowerCase();
        const filtered = accounts.filter(
          (acc) =>
            acc.accountNumber?.toLowerCase().includes(lower) ||
            acc.borrowerName?.toLowerCase().includes(lower)
        );
        setFilteredAccounts(filtered);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm, accounts]);

  const handleDownloadNOC = (accountNumber) => {
    const url = `/api/loan/foreclose/noc/${accountNumber}`;
    window.open(url, "_blank");
  };

  return (
    <>
      {/*  Notification */}
      <CstNotification
        color={notification.color}
        message={notification.message}
        autoDismiss={5}
        place="tc"
        timestamp={notification.timestamp}
      />

      <div className="content" style={{ padding: "2rem" }}>
        <Card className="shadow-lg border-0 rounded-3">
          <CardHeader className="bg-light text-white d-flex justify-content-between align-items-center">
            <h4 className="mb-0">Foreclosed Loan Accounts</h4>


            <Input
              type="text"
              placeholder="Search by Account No. or Borrower Name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: "300px", borderRadius: "8px" }}
            />
          </CardHeader>

          <CardBody className="p-0">
            {loading ? (
              <div className="text-center py-5">
                <Spinner color="light" />{" "}
                <span className="ms-2">Loading foreclosed accounts...</span>
              </div>
            ) : filteredAccounts.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <h5>No matching accounts found</h5>
              </div>
            ) : (
              <div className="table-responsive">
                <Table className="mb-0" hover>
                  <thead className="bg-light">
                  <tr>
                    <th>Account</th>
                    <th>Borrower</th>
                    <th>Loan Amount</th>
                    <th>Foreclosure Amount</th>
                    <th>Closure Date</th>
                    <th>Approved By</th>
                    <th>Actions</th>
                  </tr>
                  </thead>
                  <tbody>
                  {filteredAccounts.map((acc) => (
                    <tr key={acc.accountNumber}>
                      <td>
                        <strong>{acc.accountNumber}</strong>
                      </td>
                      <td>{acc.borrowerName}</td>
                      <td>{formatCurrency(acc.loanAmount)}</td>
                      <td>
                        <strong>{formatCurrency(acc.foreclosureAmount)}</strong>
                      </td>
                      <td>{formatDate(acc.closureDate)}</td>
                      <td>{acc.foreclosureBy.split("@")[0]}</td>
                      <td>
                        <Button
                          color="info"
                          size="sm"
                          onClick={() => handleDownloadNOC(acc.accountNumber)}
                        >
                          Download NOC
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

export default ForeclosedAccountsList;
