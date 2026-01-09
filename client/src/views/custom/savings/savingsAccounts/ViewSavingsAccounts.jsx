import React, { useEffect, useRef, useState, useCallback } from "react";
import axios from "axios";
import NotificationAlert from "react-notification-alert";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Col, FormGroup, Label,
  Row,
} from "reactstrap";
import { AgGridReact } from "ag-grid-react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import {useSelector} from "react-redux";

const ViewSavingsAccounts = () => {
  const gridRef = useRef();
  const notificationAlertRef = useRef(null);
  const [rowData, setRowData] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [fetched, setFetched] = React.useState(false);
  const [bankDropDown, setBankDropDown] = React.useState([]);

  const authStatus = useSelector((state) => state.auth.authState);

  const formatDate = (dateStr) => {
    if (!dateStr || dateStr === "N/A") return "N/A";
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Column Definitions
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
        ><span style={{userSelect: 'text', WebkitUserSelect: 'text', MozUserSelect: 'text', msUserSelect: 'text'}}>
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
      valueFormatter: (p) =>
        `₹${p.value.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
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
          <div className="form-inline">
              <Button
                  color="success"
                  size="sm"
                  type={'button'}
                  className="fa fa-search btn-icon"
                  onClick={() => handleViewDetails(params.data)}
              />
              {authStatus.accessLevel?.loanDelete || authStatus.role === 'admin' || authStatus.role === 'root' ? <Button
                  className="fa fa-trash btn-icon"
                  color="danger"
                  type="button"
                  size="sm"
                  onClick={() => handleDelete(params.data)}
              />: null}
          </div>
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

    async function handleDelete(row) {
        try {
            if (!row || !row.account) {
                notify("Missing Account account information", "warning");
                return;
            }

            const proceed = window.confirm(
                `Are you sure you want to delete the account: ${row.account} and all associated transactions? This action cannot be undone.`
            );
            if (!proceed) return;

            setLoading(true);

            const payload = { loanId: row.loanNo, accountType: 'loan'};

            const res = await axios.post("/api/deposit/delete-deposit-account", {
                accountType: 'savings',
                account: row.account,
            });

            if (res.data && res.data.success) {
                notify(res.data.success, "success");

                // refresh grid after deletion
                await fetchSavingsAccounts();
            } else {
                notify(res.data?.error || "Failed to delete the account", "warning");
            }
        } catch (e) {
            console.error(e);
            notify("Error deleting the account: " + e.toString(), "danger");
        } finally {
            setLoading(false);
        }
    }

  const fetchSavingsAccounts = async (bankId) => {
    setLoading(true);
    try {
      const response = await axios.get("/api/reports/deposit/active-accounts/savings", {
        withCredentials: true,
        params: {
          bankId: bankId || ""
        }
      });

      if (response.data.success && Array.isArray(response.data.details)) {
        setRowData(response.data.details);
        notify(`${response.data.details.length} active savings account(s) loaded.`, "success");
      } else {
        const errorMsg = response.data.error || response.data.message || "No data found";
        notify(errorMsg, "warning");
      }
    } catch (err) {
      console.error("Error fetching savings accounts:", err);
      const message = err.response?.data?.error || "Failed to load savings accounts";
      notify(message, "danger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavingsAccounts();
  }, []);

  const onBtExport = useCallback(() => {
    gridRef.current.api.exportDataAsCsv({
      fileName: `savings_accounts_active_${new Date().toISOString().split("T")[0]}.csv`,
      columnKeys: [
        "slNo",
        "name",
        "account",
        "memberNo",
        "phone",
        "balance",
        "openingAmount",
        "openingDate",
        "modeOfOperation",
        "accountType",
        "status",
      ],
      processCellCallback: (params) => {
        const colId = params.column.getColId();
        if (colId === "balance" || colId === "openingAmount") {
          return `₹${parseFloat(params.value || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
          })}`;
        }
        if (colId === "openingDate" && params.value) {
          return formatDate(params.value);
        }
        return params.value;
      },
    });
    notify("Savings accounts exported to CSV", "success");
  }, []);

  const handleViewDetails = (data) => {
    navigate(`/deposit/savings-accounts/details/${data.account}`, {
      state: { accountData: data },
    });
  };

  const handleMemberClick = (memberNo) => {
    navigate("/member/view-members", { state: { kycId: memberNo } });
  };

  if (!fetched) {
    setFetched(true);
    axios.get('/api/member/get-associated-branch-restrictive')
        .then(function (value) {
          if (value.data.success) {
            setBankDropDown(value.data.data);
          }else {
            notify(value.data.error || "Failed to fetch bank details", "warning");
          }
        })
        .catch(function (error) {
          notify(error.toString(), "danger");
        });
  }
  async function handleBankSelect(selectedOption) {
    try {
      const bankId = selectedOption?.key; // undefined → backend uses token.bankId
      await fetchSavingsAccounts(bankId); // fetch + update grid
    } catch (e) {
      console.error(e);
      setRowData([]);
      notify("Error fetching savings accounts: " + e.toString(), "danger");
    }
  }

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
                <CardTitle tag="h3">Branch Selection</CardTitle>
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
              {/* Header */}
              <CardHeader className="d-flex justify-content-between align-items-center flex-wrap  text-white py-3 px-4">
                <CardTitle tag="h4" className="mb-2 mb-md-0">
                  Active Savings Accounts
                </CardTitle>
                <div className="d-flex gap-2 mt-2 mt-md-0">
                  <Button color="light" size="sm" onClick={onBtExport}>
                    <i className="tim-icons icon-cloud-download-93 me-1" />
                    Export CSV
                  </Button>
                  <Button color="secondary" size="sm" onClick={fetchSavingsAccounts}>
                    <i className="tim-icons icon-refresh-01" />
                  </Button>
                </div>
              </CardHeader>

              <CardBody>
                {loading ? (
                  /* Loading  */
                  <div className="text-center my-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden"></span>
                    </div>
                    <p className="mt-3 text-muted">Fetching accounts...</p>
                  </div>
                ) : rowData.length === 0 ? (
                  /* No Data State */
                  <div className="text-center my-5">
                    <p className="text-muted">No active savings accounts found.</p>
                    <Button color="secondary" size="sm" onClick={fetchSavingsAccounts}>
                      Retry
                    </Button>
                  </div>
                ) : (
                  /* AG Grid Table */
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

export default ViewSavingsAccounts;