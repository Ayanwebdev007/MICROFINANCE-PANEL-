import React, {useCallback, useEffect, useRef, useState} from "react";
import axios from "axios";
import NotificationAlert from "react-notification-alert";
import {Button, Card, CardBody, CardHeader, CardTitle, Col, FormGroup, Label, Row,} from "reactstrap";
import {AgGridReact} from "ag-grid-react";
import {useNavigate} from "react-router-dom";
import Select from "react-select";
import {useSelector} from "react-redux";

const ViewActiveLoans = () => {
    const gridRef = useRef();
    const notificationAlertRef = useRef(null);
    const [rowData, setRowData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("Loading active loans...");
    const [selectedBranch, setSelectedBranch] = useState(null);
    const navigate = useNavigate();
    const [fetched, setFetched] = React.useState(false);
    const [bankDropDown, setBankDropDown] = React.useState([]);

    const authStatus = useSelector((state) => state.auth.authState);

    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        const date = new Date(dateStr);
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const handleViewDetails = (rowData) => {
        navigate(`/Active-Loan-Account/Details/${rowData.loanNo}`, { state: rowData });
    };

    const handleMemberClick = (memberNo) => {
        navigate("/member/view-members", { state: { kycId: memberNo } });
    };

    const colDefs = [
        { field: "sl", headerName: "Sl. No.", flex: 1 },
        {
            field: "loanNo",
            headerName: "LOAN NO",
            flex: 1.5,
            cellRenderer: (params) => (
              <Button
                color="link"
                size="sm"
                className="p-0 text-primary"
                onClick={() => handleViewDetails(params.data)}
              > <span style={{userSelect: 'text', WebkitUserSelect: 'text', MozUserSelect: 'text', msUserSelect: 'text'}}>
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
        { field: "memberName", headerName: "MEMBER NAME", flex: 2 },
        { field: "employeeName", headerName: "EMPLOYEE", flex: 1.5 },
        { field: "scheme", headerName: "SCHEME", flex: 1.5 },
        { field: "emiCollection", headerName: "EMI COLLECTION", flex: 1.5 },
        { field: "openDate", headerName: "OPEN DATE", flex: 1.5 },
        { field: "loanType", headerName: "Type", flex: 1.5 },
        {
            field: "loanAmount",
            headerName: "LOAN AMT.",
            flex: 1.5,
            valueFormatter: (p) => `₹${p.value.toFixed(2)}`,
        },
        {
            field: "currentDebt",
            headerName: "CURRENT DEBT",
            flex: 1.5,
            valueFormatter: (p) => `₹${p.value.toFixed(2)}`,
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
            suppressSorting: true,
            suppressFilter: true,
        },
    ];

    const defaultColDef = {
        flex: 1,
        filter: true,
        floatingFilter: true,
        resizable: true,
        sortable: true,
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

    useEffect(() => {
    fetchLoanData();
    }, []);

    const fetchLoanData = async () => {
        setLoading(true);
        try {

            const response = await fetchAllLoans()

            if (response.data.success && Array.isArray(response.data.details)) {
                const mappedData = response.data.details.map((value, index) => ({
                    sl: index + 1,
                    loanNo: value.account || "N/A",
                    employeeName: value.employeeName || "",
                    memberNo: value.memberNo || "N/A",
                    memberName: value.name || "N/A",
                    scheme: value.scheme || "N/A",
                    emiCollection: value.emiCollection || "N/A",
                    openDate: formatDate(value.openingDate),
                    loanType: value.loanType,
                    loanAmount: parseFloat(value.disbursement || 0),
                    currentDebt: parseFloat(value.currentDebt || 0),
                }));
                setRowData(mappedData);
                notify("Active loans fetched successfully", "success");
            } else {
                notify(response.data.error || "No loan data found", "warning");
            }
        } catch (err) {
            console.error(err);
            notify("Failed to fetch active loans", "danger");
        } finally {
            setLoading(false);
        }
    };

    const fetchAllLoans = async (bankId) => {
        const payload = {};
        if (bankId) payload.bankId = bankId;
        return await axios.post(
            "/api/reports/loan/active-accounts/loan",
            payload,
            {withCredentials: true}
        );
    }

    const onBtExport = useCallback(() => {
        gridRef.current.api.exportDataAsCsv({
            fileName: `active_loans_export_${new Date().toISOString().slice(0, 10)}.csv`,
        });
        notify("Exported active loans to CSV", "success");
    }, []);

    async function handleDelete(row) {
        try {
            if (!row || !row.loanNo) {
                notify("Missing loan account information", "warning");
                return;
            }

            const proceed = window.confirm(
                `Are you sure you want to delete loan account: ${row.loanNo} and all associated transactions? This action cannot be undone.`
            );
            if (!proceed) return;

            setLoading(true);

            const payload = { loanId: row.loanNo, accountType: 'loan'};

            const res = await axios.post("/api/loan/delete-loan-account", payload, {
                withCredentials: true,
            });

            if (res.data && res.data.success) {
                notify(res.data.success, "success");

                // refresh grid after deletion
                await fetchLoanData();
            } else {
                notify(res.data?.error || "Failed to delete loan account", "warning");
            }
        } catch (e) {
            console.error(e);
            notify("Error deleting loan account: " + e.toString(), "danger");
        } finally {
            setLoading(false);
        }
    }

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
            setSelectedBranch(selectedOption);
            const bankId = selectedOption?.key; // if nothing selected, it will be undefined
            const fetchData = await fetchAllLoans(bankId);

            if (fetchData.data.success && Array.isArray(fetchData.data.details) && fetchData.data.details.length > 0) {
                const mappedData = fetchData.data.details.map((value, index) => ({
                    sl: index + 1,
                    loanNo: value.account || "N/A",
                    memberNo: value.memberNo || "N/A",
                    memberName: value.name || "N/A",
                    scheme: value.scheme || "WEEKLY LOAN",
                    emiCollection: value.emiCollection || "WEEKLY",
                    openDate: formatDate(value.openingDate),
                    loanType: value.loanType,
                    loanAmount: parseFloat(value.disbursement || 0),
                    currentDebt: parseFloat(value.currentDebt || 0),
                }));
                setRowData(mappedData);
            } else {
                setRowData([]);
                notify("No loan data found", "warning");
            }
        } catch (e) {
            console.error(e);
            setRowData([]);
            notify("Error fetching loan data: " + e.toString(), "danger");
        }
    }


    return (
      <>
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
                          <CardHeader className="d-flex justify-content-between align-items-center flex-wrap text-white py-3 px-4">
                              <CardTitle tag="h4" className="mb-2 mb-md-0">Active Loan Accounts</CardTitle>
                              <div>
                                  {/*{selectedBranch && (*/}
                                  {/*    <small className="text-light">*/}
                                  {/*        Branch: <strong>{selectedBranch.label}</strong>*/}
                                  {/*    </small>*/}
                                  {/*)}*/}
                                  {selectedBranch ? (
                                      <small className="text-light">
                                          Branch: <strong>{selectedBranch.label}</strong>
                                      </small>
                                  ) : (
                                      <small className="text-primary">
                                          Please select a branch to view active loan accounts
                                      </small>
                                  )}
                              </div>
                              <Button
                                onClick={onBtExport}
                                color="primary"
                                size="sm"
                                className="btn-round"
                              >
                                  <i className="tim-icons icon-cloud-download-93" /> Download CSV
                              </Button>
                          </CardHeader>
                          <CardBody>
                              {loading ? (
                                <div className="text-center my-5">
                                    <span className="spinner-border text-primary" /> Loading...
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
                                      rowHeight={35}
                                      headerHeight={40}
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

export default ViewActiveLoans;
