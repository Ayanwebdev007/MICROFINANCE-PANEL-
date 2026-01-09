import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  Row,
  Col,
  Input,
  Label,
  FormGroup,
  Table,
} from "reactstrap";
import { AgGridReact } from "ag-grid-react";


const SavingsAccountTransactions = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const gridRef = useRef();

  const { accountData, transactions = [] } = location.state || {};

  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [typeFilter, setTypeFilter] = useState(""); // credit/debit
  const [rowData, setRowData] = useState([]);
  const [filteredRowData, setFilteredRowData] = useState([]);

  useEffect(() => {
    const transformedData = transactions.map((tx, index) => {
      const isCredit = tx.type === "credit";
      const amount = parseFloat(tx.amount) || 0;
      return {
        slNo: index + 1,
        id: tx.id || `TXN${index + 1}`,
        date: tx.date || tx.entryDate || "",
        method: tx.method || "N/A",
        narration: tx.narration || "N/A",
        type: isCredit ? "Deposit" : "Withdrawal",
        amount: amount,
        sign: isCredit ? "+" : "-",
        balance: tx.balance?.toFixed(2) || "0.00",
        raw: tx,
      };
    });

    setRowData(transformedData);
    setFilteredRowData(transformedData);
  }, [transactions]);

  // Filter logic
  const filterTransactions = () => {
    let filtered = [...rowData];

    if (searchTerm) {
      filtered = filtered.filter(
        (t) =>
          t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.narration.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (fromDate && toDate) {
      const start = new Date(fromDate);
      const end = new Date(toDate);
      filtered = filtered.filter((t) => {
        const d = new Date(t.date);
        return d >= start && d <= end;
      });
    }

    if (typeFilter) {
      filtered = filtered.filter((t) => t.type === typeFilter);
    }

    if (fromAmount !== "" && toAmount !== "") {
      const min = parseFloat(fromAmount);
      const max = parseFloat(toAmount);
      filtered = filtered.filter((t) => t.amount >= min && t.amount <= max);
    }

    setFilteredRowData(filtered);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFromDate("");
    setToDate("");
    setFromAmount("");
    setToAmount("");
    setTypeFilter("");
    setFilteredRowData(rowData);
  };

  // Export to CSV
  const onBtnExport = () => {
    if (gridRef.current?.api) {
      gridRef.current.api.exportDataAsCsv({
        fileName: `savings_transactions_${accountData?.account}.csv`,
        columnKeys: ["slNo", "id", "date", "method", "narration", "type", "amount"],
      });
    }
  };



  // Column Definitions
  const [columnDefs] = useState([
    { headerName: "Sl No", field: "slNo", sortable: true, filter: true, width: 100 },
    { headerName: "Trans ID", field: "id", sortable: true, filter: true, width: 150 },
    {
      headerName: "Date",
      field: "date",
      sortable: true,
      filter: true,
      width: 130,
      valueFormatter: (params) =>
        new Date(params.value).toLocaleDateString("en-IN"),
    },
    { headerName: "Type", field: "type", sortable: true, filter: true, width: 120 },
    {
      headerName: "Amount",
      field: "amount",
      sortable: true,
      filter: true,
      width: 130,
      cellClass: (params) => (params.data.type === "Deposit" ? "text-success" : "text-danger"),
      valueFormatter: (params) =>
        `${params.data.sign} ₹${parseFloat(params.value).toFixed(2)}`,
    },
    {
      headerName: "Balance",
      field: "balance",
      sortable: true,
      filter: true,
      width: 130,
      valueFormatter: (params) => `₹${params.value}`,
    },
    { headerName: "Method", field: "method", sortable: true, filter: true, flex: 1 },
    { headerName: "Narration", field: "narration", sortable: true, filter: true, flex: 2 },
  ]);

  return (
    <div className="content">
      {/* Account Summary */}
      <Card>
        <CardHeader>
          <div className="d-flex justify-content-between align-items-center">
            <CardTitle tag="h3">Transaction History</CardTitle>
            <Button color="light" onClick={() => navigate(-1)} size="sm">
              Back
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          <Row>
            <Col md="3">
              <strong>Account:</strong> {accountData?.account}
            </Col>
            <Col md="3">
              <strong>Member:</strong> {accountData?.memberName}
            </Col>
            <Col md="3">
              <strong>Status:</strong>{" "}
              <span
                className={`badge bg-${
                  accountData?.status === "Active" ? "success" : "secondary"
                }`}
              >
                {accountData?.status}
              </span>
            </Col>
            <Col md="3">
              <strong>Balance:</strong> ₹{accountData?.balance?.toFixed(2)}
            </Col>
          </Row>
        </CardBody>
      </Card>

      {/* Filters */}
      <Row className="mb-4">
        <Col md="12">
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-light">
              <CardTitle tag="h5" className="mb-0">
                Filter Transactions
              </CardTitle>
            </CardHeader>
            <CardBody>
              <Row>
                <Col md="3">
                  <FormGroup>
                    <Label>Search ID/Narration:</Label>
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </FormGroup>
                </Col>
                <Col md="3">
                  <FormGroup>
                    <Label>Date From:</Label>
                    <Input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                    />
                  </FormGroup>
                </Col>
                <Col md="3">
                  <FormGroup>
                    <Label>Date To:</Label>
                    <Input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                    />
                  </FormGroup>
                </Col>
                <Col md="3">
                  <FormGroup>
                    <Label>Type:</Label>
                    <Input
                      type="select"
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                    >
                      <option value="">All</option>
                      <option value="Deposit">Deposit</option>
                      <option value="Withdrawal">Withdrawal</option>
                    </Input>
                  </FormGroup>
                </Col>
                <Col md="3">
                  <FormGroup>
                    <Label>From Amount:</Label>
                    <Input
                      type="number"
                      value={fromAmount}
                      onChange={(e) => setFromAmount(e.target.value)}
                    />
                  </FormGroup>
                </Col>
                <Col md="3">
                  <FormGroup>
                    <Label>To Amount:</Label>
                    <Input
                      type="number"
                      value={toAmount}
                      onChange={(e) => setToAmount(e.target.value)}
                    />
                  </FormGroup>
                </Col>
              </Row>
              <Row className="mt-3">
                <Col>
                  <Button color="success" onClick={filterTransactions} className="me-2">
                    <i className="fas fa-search me-1"></i> Search
                  </Button>
                  <Button color="danger" onClick={clearFilters} className="me-2">
                    <i className="fas fa-eraser me-1"></i> Clear
                  </Button>
                  <Button color="info" onClick={onBtnExport} className="me-2">
                    <i className="fas fa-download me-1"></i> Export CSV
                  </Button>
                </Col>
              </Row>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* AG Grid */}
      <Row>
        <Col md="12">
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-light d-flex justify-content-between align-items-center">
              <CardTitle tag="h5" className="mb-0">
                Transactions ({filteredRowData.length})
              </CardTitle>
            </CardHeader>
            <CardBody>
              {filteredRowData.length === 0 ? (
                <p className="text-center text-muted">
                  {rowData.length === 0
                    ? "No transaction data available."
                    : "No matching transactions found."}
                </p>
              ) : (
                <div
                  className="ag-theme-alpine"
                  style={{ height: "600px", width: "100%" }}
                >
                  <AgGridReact
                    ref={gridRef}
                    rowData={filteredRowData}
                    columnDefs={columnDefs}
                    defaultColDef={{
                      sortable: true,
                      filter: true,
                      resizable: true,
                      flex: 1,
                    }}
                    pagination={true}
                    paginationPageSize={10}
                    onGridReady={(params) => params.api.sizeColumnsToFit()}
                  />
                </div>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default SavingsAccountTransactions;