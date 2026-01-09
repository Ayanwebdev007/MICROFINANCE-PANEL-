import React, { useRef, useState } from "react";
import {
    Card,
    CardHeader,
    CardBody,
    CardTitle,
    Row,
    Col,
    Button,
    Input,
    Label,
    FormGroup,
    Form,
    Spinner,
} from "reactstrap";
import { AgGridReact } from "ag-grid-react";
import axios from "axios";
import CstNotification from "../components/CstNotification";
import { LinearProgress } from "@mui/material";

const ViewMobileTransaction = () => {
    const gridRef = useRef(null);
    const [rowData, setRowData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [bulkLoading, setBulkLoading] = useState(false);
    const [transactionType, setTransactionType] = useState("");
    const [alert, setAlert] = useState({
        color: "success",
        message: "",
        autoDismiss: 7,
        place: "tc",
        display: false,
        timestamp: new Date().getTime(),
    });

    const colDefs = [
        {
            headerName: "",
            checkboxSelection: true,
            headerCheckboxSelection: true,
            width: 20,
        },
        { field: "name", headerName: "Name" },
        { field: "account", headerName: "Account Number" },
        { field: "accountType", headerName: "Type" },
        { field: "amount", headerName: "Amount" },
        { field: "date", headerName: "Date" },
        { field: "method", headerName: "Method" },
        { field: "phone", headerName: "Phone" },
        { field: "type", headerName: "Transaction Type" },
    ];

    const defaultColDef = {
        flex: 1,
        filter: false,
        floatingFilter: false,
    };

    // Get transactions by type
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!transactionType) return;

        setLoading(true);
        try {
            const response = await axios.post("/api/admin/get-mobile-transactions", {
                transactionType,
            });

            if (response.data.success) {
                const transactions = response.data.data.map((item) => ({
                    ...item.data,
                    key: item.key,
                    id: item.data.id || item.key, // Ensure `id` is passed
                }));
                setRowData(transactions);
            }
        } catch (err) {
            console.error("Fetch error:", err);
            setAlert({
                ...alert,
                display: true,
                color: "danger",
                message: "Failed to fetch transactions.",
                timestamp: new Date().getTime(),
            });
        } finally {
            setLoading(false);
        }
    };

    // Save selected transactions in bulk
    const handleBulkTransaction = async () => {
        const selectedNodes = gridRef.current.api.getSelectedNodes();
        const selectedData = selectedNodes.map((node) => node.data);

        if (selectedData.length === 0) {
            setAlert({
                color: "warning",
                message: "No transactions selected!",
                autoDismiss: 5,
                place: "tc",
                display: true,
                timestamp: new Date().getTime(),
            });
            return;
        }

        if (!transactionType) {
            setAlert({
                color: "warning",
                message: "Please select a transaction type first!",
                autoDismiss: 5,
                place: "tc",
                display: true,
                timestamp: new Date().getTime(),
            });
            return;
        }

        setBulkLoading(true);

        try {
            const res = await axios.post('/api/admin/mobile-bulk-transaction', {
                transactions: selectedData,
                transactionType,
                accountType: selectedData[0]?.accountType || "",
                transDate: new Date().toISOString().slice(0, 10),
            });

            if (res.data.success) {
                const remainingData = rowData.filter(
                    (row) => !selectedData.some((txn) => txn.id === row.id)
                );
                setRowData(remainingData);

                setAlert({
                    color: "success",
                    message: res.data.message || "Transactions saved successfully!",
                    autoDismiss: 5,
                    place: "tc",
                    display: true,
                    timestamp: new Date().getTime(),
                });
            }
        } catch (err) {
            console.error("Bulk save error:", err);
            setAlert({
                color: "danger",
                message: "Error saving transactions.",
                autoDismiss: 5,
                place: "tc",
                display: true,
                timestamp: new Date().getTime(),
            });
        } finally {
            setBulkLoading(false);
        }
    };

    return (
        <div className="content">
            {loading && <LinearProgress />}
            {alert.display && (
                <CstNotification
                    color={alert.color}
                    message={alert.message}
                    autoDismiss={alert.autoDismiss}
                    place={alert.place}
                    timestamp={alert.timestamp}
                />
            )}

            <Row>
                <Card>
                    <CardBody className={"mt-2"}>
                        <Col md="12" className="mb-3">
                            <Form
                                onSubmit={handleSubmit}
                                className="d-flex justify-around-between align-items-center"
                            >
                                <FormGroup className="mr-3">
                                    <Label for="transactionType" className="mr-2">
                                        Transaction Type
                                    </Label>
                                    <Input
                                        type="select"
                                        id="transactionType"
                                        value={transactionType}
                                        onChange={(e) => setTransactionType(e.target.value)}
                                        style={{ width: "500px", padding: "5px" }}
                                    >
                                        <option value="" disabled>
                                            Select Transaction Type
                                        </option>
                                        <option value="deposit">Deposit</option>
                                        <option value="loan">Loan</option>
                                    </Input>
                                </FormGroup>
                                <Button color="primary" type="submit" disabled={!transactionType}>
                                    Submit
                                </Button>
                            </Form>
                        </Col>
                    </CardBody>
                </Card>

                {/* Grid */}
                <Col md="12">
                    <Card>
                        <CardHeader>
                            <CardTitle tag="h4">Mobile Transactions</CardTitle>
                        </CardHeader>
                        <CardBody style={{ height: window.innerHeight - 300 }}>
                            <div className="ag-theme-alpine" style={{ height: "100%", width: "100%" }}>
                                <AgGridReact
                                    ref={gridRef}
                                    rowData={rowData}
                                    columnDefs={colDefs}
                                    defaultColDef={defaultColDef}
                                    rowSelection="multiple"
                                    enableCellTextSelection={true}
                                    overlayNoRowsTemplate="<span style='padding:10px;'>No transactions found</span>"
                                />
                            </div>
                        </CardBody>
                    </Card>
                </Col>

                {/* Bulk Transaction Button */}
                <Col md="12">
                    <Card>
                        <CardBody className="mt-2 d-flex justify-content-center">
                            <Button
                                color="primary"
                                onClick={handleBulkTransaction}
                                disabled={bulkLoading}
                            >
                                {bulkLoading && (
                                    <Spinner size="sm" color="light" className="mr-2" />
                                )}
                                Bulk Transaction
                            </Button>
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default ViewMobileTransaction;
