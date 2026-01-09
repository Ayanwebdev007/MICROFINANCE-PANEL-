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
  Spinner,
} from "reactstrap";
import { AgGridReact } from "ag-grid-react";
import Select from "react-select";
import { useNavigate } from "react-router-dom";

const GroupDemandSheetPage = () => {
  const gridRef = useRef();
  const notificationAlertRef = useRef(null);
  const navigate = useNavigate();

  const [rowData, setRowData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedLoanType, setSelectedLoanType] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [employeeDropDown, setEmployeeDropDown] = useState([]);
  const [groupDropDown, setGroupDropDown] = useState([]);

  const loanTypeOptions = [
    { value: "", label: "All Loan Types" },
    { value: "day", label: "Daily" },
    { value: "week", label: "Weekly" },
    { value: "fortnight", label: "Fortnightly" },
    { value: "month", label: "Monthly" },
  ];

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

  // fetch employees from new API endpoint
  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`/api/admin/users`, {
        withCredentials: true,
      });

      if (res.data?.users && Array.isArray(res.data.users)) {
        const employees = res.data.users.map((emp) => ({
          value: emp.id,
          label: emp.name,
        }));
        setEmployeeDropDown(employees);
      } else {
        notify("Unexpected response format from user API.", "warning");
        setEmployeeDropDown([]);
      }
    } catch (err) {
      console.error("Error fetching employees:", err);
      notify("Failed to load employee list: " + (err.response?.data?.message || err.message), "danger");
      setEmployeeDropDown([]);
    }
  };

  // Fetch All Groups
  const fetchGroups = async () => {
    try {
      const res = await axios.post(
        `/api/reports/loan/get-all-group`,
        {},
        { withCredentials: true }
      );
      if (res.data.success) {
        const groups = res.data.details.map((grp) => ({
          value: grp.id,
          label: `${grp.id} - ${grp.name}`,
        }));
        setGroupDropDown([{ value: "", label: "All Groups" }, ...groups]);
      }
    } catch (err) {
      notify("Failed to load groups: " + err.message, "danger");
    }
  };

  const fetchDemandSheet = async () => {
    setLoading(true);
    try {
      const params = {
        loanType: selectedLoanType || undefined,
        employeeId: selectedEmployee || undefined,
        groupId: selectedGroup || undefined,
      };

      const response = await axios.get(`/api/reports/group-loan/demand-sheet/${selectedDate}`, {
        withCredentials: true,
        params,
      });
      if (response.data.success && Array.isArray(response.data.demand)) {
        setRowData(response.data.demand);
        notify(`${response.data.totalRecords} EMI demand record(s) loaded.`, "success");
      } else {
        setRowData([]);
        notify(response.data.error || "No EMI demands found.", "warning");
      }
    } catch (err) {
      console.error("Error fetching demand sheet:", err);
      const message = err.response?.data?.error || "Failed to generate demand sheet.";
      notify(message, "danger");
      setRowData([]);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    setPdfLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedLoanType) params.append("loanType", selectedLoanType);
      if (selectedEmployee) params.append("employeeId", selectedEmployee);
      if (selectedGroup) params.append("groupId", selectedGroup);

      const url = `/api/reports/group-loan/demand-sheet-pdf/${selectedDate}?${params.toString()}`;

      const response = await axios.get(url, {
        withCredentials: true,
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      const groupName = groupDropDown.find(g => g.value === selectedGroup)?.label || "All";
      link.download = `Demand_Sheet_${selectedDate}_${groupName.replace(/\s+/g, '_')}.pdf`;
      link.click();
      window.URL.revokeObjectURL(link.href);

      notify("PDF downloaded successfully!", "success");
    } catch (err) {
      console.error("PDF download failed:", err);
      const message = err.response?.data?.error || "Failed to generate PDF.";
      notify(message, "danger");
    } finally {
      setPdfLoading(false);
    }
  };

  const handleFetch = useCallback(() => {
    fetchDemandSheet();
  }, [selectedDate, selectedLoanType, selectedEmployee, selectedGroup]);

  useEffect(() => {
    fetchEmployees();
    fetchGroups();
    fetchDemandSheet();
  }, []);

  const onBtExport = useCallback(() => {
    const columnKeys = [
      "date",
      "employee",
      "clientId",
      "clientName",
      "emiAmount",
      "arrear",
      "totalDemand",
      "installment",
    ];

    gridRef.current.api.exportDataAsCsv({
      fileName: `emi_demand_sheet_${selectedDate}.csv`,
      columnKeys,
      processCellCallback: (params) => {
        const colId = params.column.getColId();
        const val = params.value;
        if (["emiAmount", "principal", "interest"].includes(colId)) {
          return `₹${parseFloat(val || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
        }
        return val;
      },
    });
    notify("EMI Demand Sheet exported to CSV", "success");
  }, [selectedDate]);

  const colDefs = [
    { field: "date", headerName: "Date", flex: 1 },
    { field: "employee", headerName: "EMPLOYEE NAME", flex: 1.5, cellStyle: { fontWeight: "bold" } },
    {
      field: "loanAccount",
      headerName: "LOAN ACCOUNT",
      flex: 1.5,
      cellRenderer: (params) => {
        const loanAccount = params.value;
        if (!loanAccount || loanAccount === "N/A") {
          return <span className="text-muted">N/A</span>;
        }
        return (
          <Button
            color="link"
            size="sm"
            className="p-0 text-primary"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate(`/Active-Group-Loan-Account/Details/${loanAccount}`, {
                state: params.data,
              });
            }}
          >
            {loanAccount}
          </Button>
        );
      },
    },
    { field: "clientId", headerName: "CLIENT ID", flex: 1.2, cellStyle: { color: "#6c757d" } },
    {
      field: "clientName",
      headerName: "MEMBER / GROUP",
      flex: 1.8,
    },
    { field: "loanType", headerName: "EMI FREQUENCY", flex: 1.2, cellStyle: { textTransform: "capitalize" } },
    {
      field: "emiAmount",
      headerName: "EMI AMOUNT",
      flex: 1.2,
      valueFormatter: (p) => `₹${parseFloat(p.value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      cellClass: "fw-bold",
    },
    {
      field: "arrear",
      headerName: "Arrear",
      flex: 1.2,
      valueFormatter: (p) =>
        `₹${parseFloat(p.value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
    },
    {
      field: "totalDemand",
      headerName: "Current Demand",
      flex: 1.2,
      valueFormatter: (p) =>
        `₹${parseFloat(p.value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
    },
    {
      field: "installment",
      headerName: "INSTALLMENT #",
      flex: 1.2,
      cellStyle: { fontWeight: "bold", color: "#007bff" },
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

  return (
    <>
      <div className="rna-container">
        <NotificationAlert ref={notificationAlertRef} />
      </div>

      <div className="content">
        <Row>
          <Col md="12">
            <Card>
              <CardHeader className="bg-light">
                <CardTitle tag="h3">EMI Demand Sheet</CardTitle>
              </CardHeader>
              <CardBody>
                <Row>
                  <Col md="2">
                    <Label for="date">Select Date</Label>
                    <FormGroup>
                      <input
                        type="date"
                        className="form-control"
                        id="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                      />
                    </FormGroup>
                  </Col>

                  <Col md="2">
                    <Label for="loanType">Loan Type</Label>
                    <FormGroup>
                      <Select
                        className="react-select info"
                        classNamePrefix="react-select"
                        name="loanType"
                        value={loanTypeOptions.find((opt) => opt.value === selectedLoanType)}
                        onChange={(opt) => setSelectedLoanType(opt?.value || "")}
                        options={loanTypeOptions}
                        placeholder="All Types"
                      />
                    </FormGroup>
                  </Col>

                  <Col md="2">
                    <Label for="group">Group</Label>
                    <FormGroup>
                      <Select
                        className="react-select info"
                        classNamePrefix="react-select"
                        name="group"
                        value={groupDropDown.find((g) => g.value === selectedGroup)}
                        onChange={(opt) => setSelectedGroup(opt?.value || "")}
                        options={groupDropDown}
                        placeholder="All Groups"
                        isClearable={false}
                      />
                    </FormGroup>
                  </Col>

                  <Col md="2">
                    <Label for="employee">Assigned To</Label>
                    <FormGroup>
                      <Select
                        className="react-select info"
                        classNamePrefix="react-select"
                        name="employee"
                        value={employeeDropDown.find((emp) => emp.value === selectedEmployee)}
                        onChange={(opt) => setSelectedEmployee(opt?.value || "")}
                        options={employeeDropDown}
                        placeholder="All Employees"
                      />
                    </FormGroup>
                  </Col>

                  <Col md="4" className="d-flex align-items-end gap-2">
                    <Button
                      color="primary"
                      size="sm"
                      onClick={handleFetch}
                      disabled={loading}
                      className="flex-fill"
                    >
                      {loading ? (
                        <>
                          <Spinner size="sm" /> Loading...
                        </>
                      ) : (
                        "Generate Sheet"
                      )}
                    </Button>

                    <Button
                      color="light"
                      size="sm"
                      onClick={onBtExport}
                      disabled={rowData.length === 0}
                      className="flex-fill"
                    >
                      Export CSV
                    </Button>

                    <Button
                      color="success"
                      size="sm"
                      onClick={downloadPDF}
                      disabled={rowData.length === 0 || pdfLoading}
                      className="flex-fill"
                    >
                      {pdfLoading ? (
                        <>
                          <Spinner size="sm" /> Generating PDF...
                        </>
                      ) : (
                        <>
                          <i className="tim-icons icon-cloud-download-93 me-1" />
                          Download PDF
                        </>
                      )}
                    </Button>
                  </Col>
                </Row>
              </CardBody>
            </Card>
          </Col>
        </Row>

        <Row>
          <Col md="12">
            <Card>
              <CardHeader className="d-flex justify-content-between align-items-center flex-wrap text-white py-3 px-4 bg-light">
                <CardTitle tag="h4" className="mb-2 mb-md-0">
                  Demand Sheet for {selectedDate} —{" "}
                  {loanTypeOptions.find((o) => o.value === selectedLoanType)?.label || "All Types"}
                  {selectedGroup ? ` | Group: ${groupDropDown.find((g) => g.value === selectedGroup)?.label}` : ""}
                  {selectedEmployee ? ` | Employee: ${employeeDropDown.find((e) => e.value === selectedEmployee)?.label}` : ""}
                </CardTitle>
              </CardHeader>

              <CardBody>
                {loading ? (
                  <div className="text-center my-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden"></span>
                    </div>
                    <p className="mt-3 text-muted">Generating EMI demand sheet...</p>
                  </div>
                ) : rowData.length === 0 ? (
                  <div className="text-center my-5">
                    <p className="text-muted">
                      {selectedDate ? "No EMI demands found for this selection." : "Please select a date and click 'Generate Sheet'."}
                    </p>
                    <Button color="secondary" size="sm" onClick={handleFetch}>
                      Try Again
                    </Button>
                  </div>
                ) : (
                  <div className="ag-theme-alpine shadow-sm rounded" style={{ height: "600px", width: "100%" }}>
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

export default GroupDemandSheetPage;