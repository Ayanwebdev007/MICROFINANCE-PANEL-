import React, { useEffect, useRef, useState, useCallback } from "react";
import axios from "axios";
import NotificationAlert from "react-notification-alert";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Col,
  FormGroup,
  Label,
  Row,
} from "reactstrap";
import { AgGridReact } from "ag-grid-react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";

const ViewDepositAccounts = () => {
  const gridRef = useRef();
  const notificationAlertRef = useRef(null);
  const [rowData, setRowData] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [bankDropDown, setBankDropDown] = useState([]);
  const [depositTypeDropDown, setDepositTypeDropDown] = useState([
      { value: "fixed-deposit", label: "Fixed Deposit" },
      { value: "cash-certificate", label: "Cash Certificate" },
      { value: 'mis-deposit', label: 'MIS Deposit' },
  ]);
  const [selectedDepositType, setSelectedDepositType] = useState("savings");

  const formatDate = (dateStr) => {
    if (!dateStr || dateStr === "N/A") return "N/A";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "N/A";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined || isNaN(parseFloat(value))) {
      return "₹0.00";
    }
    return `₹${parseFloat(value).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  };

  const colDefs = [
    { field: "slNo", headerName: "Sl. No.", flex: 1 },
    {
      field: "account",
      headerName: "ACCOUNT NO",
      flex: 1.5,
      cellRenderer: (params) => (
        <Button
          color="link"
          size="sm"
          className="p-0 text-primary"
          onClick={() => handleViewDetails(params.data)}
        >
          <span style={{userSelect: 'text', WebkitUserSelect: 'text', MozUserSelect: 'text', msUserSelect: 'text'}}>
                  {params.value} </span>
        </Button>
      ),
    },
    {
      field: "memberNo",
      headerName: "MEMBER NO",
      flex: 1.5,
      cellRenderer: (params) => (
        <Button
          color="link"
          size="sm"
          className="p-0 text-info"
          onClick={() => handleMemberClick(params.value)}
        >
         <span style={{userSelect: 'text', WebkitUserSelect: 'text', MozUserSelect: 'text', msUserSelect: 'text'}}>
                  {params.value} </span>
        </Button>
      ),
    },
    { field: "name", headerName: "NAME", flex: 2 },
    { field: "employeeName", headerName: "EMPLOYEE", flex: 2 },
    { field: "phone", headerName: "PHONE", flex: 1.5 },
    {
      field: "balance",
      headerName: "BALANCE",
      flex: 1.5,
      valueFormatter: (params) => formatCurrency(params.value),
      cellClass: "fw-bold",
    },
    { field: "modeOfOperation", headerName: "MODE", flex: 1.5 },
    { field: "accountType", headerName: "TYPE", flex: 1.5 },
    {
      field: "status",
      headerName: "STATUS",
      flex: 1.3,
      cellClass: (params) =>
          params.value === "Active"
              ? "fw-bold text-success"
              : "fw-bold text-danger",
    },
    {
      headerName: "ACTION",
      cellRenderer: (params) => (
          <Button
              color="primary"
              size="sm"
              className="btn-round px-3 py-1"
              onClick={() => handleViewDetails(params.data)}
          >
            ➡
          </Button>
      ),
      flex: 1,
      sortable: false,
      filter: false,
      resizable: false,
      cellClass: "text-center",
    },
  ];

  const defaultColDef = {
    flex: 1,
    filter: true,
    floatingFilter: true,
    sortable: true,
    resizable: true,
    wrapText: true,
    autoHeight: true,
  };

  const notify = (message, color = "info") => {
    if (!notificationAlertRef.current) return;
    notificationAlertRef.current.notificationAlert({
      place: "tc",
      message: <div>{message}</div>,
      type: color,
      icon: "tim-icons icon-bell-55",
      autoDismiss: 5,
    });
  };

  // Fetch accounts by deposit type and bank — unchanged
  const fetchDepositAccounts = async (bankId, depositType) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/reports/deposit/active-accounts/${depositType}`, {
        withCredentials: true,
        params: { bankId: bankId || "" },
      });

      if (response.data.success && Array.isArray(response.data.details)) {
        setRowData(response.data.details);
        notify(`${response.data.details.length} ${depositType.replace('-', ' ')} account(s) loaded.`, "success");
      } else {
        const errorMsg = response.data.error || response.data.message || "No data found";
        notify(errorMsg, "warning");
        setRowData([]);
      }
    } catch (err) {
      console.error(`Error fetching ${depositType} accounts:`, err);
      const message = err.response?.data?.error || `Failed to load ${depositType} accounts`;
      notify(message, "danger");
      setRowData([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle deposit type change
  const handleDepositTypeChange = useCallback((selectedOption) => {
    const type = selectedOption?.value || "daily-savings";
    setSelectedDepositType(type);
    setRowData([]); // Clear grid on type switch
    fetchDepositAccounts("", type); // Always reset to all branches
  }, []);

  // Handle bank selection
  const handleBankSelect = async (selectedOption) => {
    try {
      const bankId = selectedOption?.key || "";
      fetchDepositAccounts(bankId, selectedDepositType);
    } catch (e) {
      console.error(e);
      setRowData([]);
      notify("Error fetching accounts: " + e.toString(), "danger");
    }
  };

  // Export to CSV — now uses fixed colDefs
  const onBtExport = useCallback(() => {
    const columnKeys = colDefs.map(col => col.field).filter(Boolean);

    gridRef.current.api.exportDataAsCsv({
      fileName: `${selectedDepositType}_accounts_active_${new Date().toISOString().split("T")[0]}.csv`,
      columnKeys,
      processCellCallback: (params) => {
        const colId = params.column.getColId();
        const val = params.value;

        if (colId === "balance") {
          return formatCurrency(val);
        }
        if (colId === "openingDate" || colId === "maturityDate" || colId === "expiryDate") {
          return formatDate(val);
        }
        return val;
      },
    });
    notify(`${selectedDepositType} accounts exported to CSV`, "success");
  }, [selectedDepositType, colDefs]);

  const handleViewDetails = (data) => {
    navigate(`/deposit/accounts/details/${selectedDepositType}/${data.account}`, {
      state: { accountData: data, depositType: selectedDepositType },
    });
  };

  const handleMemberClick = useCallback((memberNo) => {
    navigate("/member/view-members", { state: { kycId: memberNo } });
  }, [navigate]);

  // Initialize banks and deposit types on mount
  useEffect(() => {
    const init = async () => {
      try {
        const bankRes = await axios.get('/api/member/get-associated-branch-restrictive', { withCredentials: true });
        if (bankRes.data.success) {
          setBankDropDown([
            { key: "", label: "" },
            ...bankRes.data.data,
          ]);
        } else {
          notify(bankRes.data.error || "Failed to fetch branches", "warning");
        }

        setSelectedDepositType("daily-savings");

      } catch (error) {
        notify(error.toString(), "danger");
      }
    };

    init();
  }, []);

  return (
      <>
        {/* Notification Alert */}
        <div className="rna-container">
          <NotificationAlert ref={notificationAlertRef} />
        </div>

        <div className="content">
          <Row>
            <Col md="12">
              <Card>
                <CardHeader>
                  <CardTitle tag="h3">Deposit Account Filter</CardTitle>
                </CardHeader>
                <CardBody>
                  <Row>
                    <Col md="6">
                      <Label>Select a Branch</Label>
                      <FormGroup>
                        <Select
                            className="react-select info"
                            classNamePrefix="react-select"
                            name="bankSelect"
                            onChange={handleBankSelect}
                            options={bankDropDown}
                            placeholder="Choose branch..."
                            defaultValue={bankDropDown.find(b => b.key === "")}
                        />
                      </FormGroup>
                    </Col>
                    <Col md="6">
                      <Label>Select Deposit Type</Label>
                      <FormGroup>
                        <Select
                            className="react-select info"
                            classNamePrefix="react-select"
                            name="depositTypeSelect"
                            onChange={handleDepositTypeChange}
                            options={depositTypeDropDown}
                            value={depositTypeDropDown.find(opt => opt.value === selectedDepositType)}
                            placeholder="Choose deposit type..."
                        />
                      </FormGroup>
                    </Col>
                  </Row>
                </CardBody>
              </Card>
            </Col>
          </Row>

          <Row>
            <Col md="12">
              <Card>
                <CardHeader className="d-flex justify-content-between align-items-center flex-wrap text-white py-3 px-4">
                  <CardTitle tag="h4" className="mb-2 mb-md-0">
                    {depositTypeDropDown.find(t => t.value === selectedDepositType)?.label || "Deposit Accounts"}
                  </CardTitle>
                  <div className="d-flex gap-2 mt-2 mt-md-0">
                    <Button color="light" size="sm" onClick={onBtExport}>
                      <i className="tim-icons icon-cloud-download-93 me-1" />
                      Export CSV
                    </Button>
                    <Button color="secondary" size="sm" onClick={() => fetchDepositAccounts("", selectedDepositType)}>
                      <i className="tim-icons icon-refresh-01" />
                    </Button>
                  </div>
                </CardHeader>

                <CardBody>
                  {loading ? (
                      <div className="text-center my-5">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden"></span>
                        </div>
                        <p className="mt-3 text-muted">Fetching accounts...</p>
                      </div>
                  ) : rowData.length === 0 ? (
                      <div className="text-center my-5">
                        <p className="text-muted">
                          No {selectedDepositType.replace('-', ' ')} accounts found.
                        </p>
                        <Button color="secondary" size="sm" onClick={() => fetchDepositAccounts("", selectedDepositType)}>
                          Retry
                        </Button>
                      </div>
                  ) : (
                      <div
                          className="ag-theme-alpine shadow-sm rounded"
                          style={{ height: "600px", width: "100%" }}
                      >
                        <AgGridReact
                            ref={gridRef}
                            rowData={rowData}
                            columnDefs={colDefs}
                            defaultColDef={defaultColDef}
                            animateRows={true}
                            rowHeight={40}
                            headerHeight={45}
                            enableCellTextSelection={true}
                            suppressRowVirtualisation={true}
                            ensureDomOrder={true}
                        />
                      </div>
                  )}
                </CardBody>
              </Card>
            </Col>
          </Row>
        </div>
      </>
  );
};

export default ViewDepositAccounts;