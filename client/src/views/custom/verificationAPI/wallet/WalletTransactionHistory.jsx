import React, { useState, useEffect } from "react";
import {
    Card, CardBody, Row, Col, CardHeader, CardTitle, Label, FormGroup
} from "reactstrap";
import Select from "react-select";
import { LinearProgress } from "@mui/material";
import { AgGridReact } from "ag-grid-react";
import axios from "axios";

const WalletTransactionHistory = () => {
    const [progressbar, setProgressbar] = useState(false);
    const [rowData, setRowData] = useState([]);
    const [alert, setAlert] = useState({
        color: "success",
        message: "test message",
        autoDismiss: 7,
        place: "tc",
        display: false,
        sweetAlert: false,
    });
    const [selectedTransactionType, setSelectedTransactionType] = useState("loaded-balance");

    const transactionOptions = [
        { label: "Loaded Balance Transaction", value: "loaded-balance" },
        { label: "API Usage Transaction", value: "api-usage" },
    ];

    const defaultColDef = {
        filter: false,
        resizable: true,
        sortable: true,
    };

    const getColDefs = (type) => {
        if (type === "loaded-balance") {
            return [
                { field: "amount", headerName: "Amount" },
                { field: "balance", headerName: "Balance" },
                { field: "type", headerName: "Type" },
                { field: "description", headerName: "Description" },
                {
                    field: "createdAt",
                    headerName: "Created At",
                    valueFormatter: (params) => {
                        const val = params.value;
                        if (val && typeof val._seconds === "number") {
                            const date = new Date(val._seconds * 1000);
                            return date.toLocaleString();
                        }
                        return "Invalid Date";
                    },
                },
                { field: "createdBy", headerName: "Created By" },
            ];
        } else {
            return [
                { field: "amount", headerName: "Amount" },
                { field: "type", headerName: "API Type" },
                { field: "status", headerName: "Status" },
                { field: "message", headerName: "Message" },
                {
                    field: "timestamp",
                    headerName: "Timestamp",
                    valueFormatter: (params) => {
                        try {
                            const timestamp = parseInt(params.value);
                            const date = new Date(timestamp);
                            return date.toLocaleString();
                        } catch {
                            return "Invalid Date";
                        }
                    },
                },
                { field: "userEmail", headerName: "User Email" },
            ];
        }
    };

    const fetchLoadedTransactions = async (collection = selectedTransactionType) => {
        setProgressbar(true);
        try {
            const res = await axios.post("/api/admin/get-loaded-wallet-transactions", {
                collection,
            });
            if (res.data.success) {
                setRowData(res.data.data);
            } else {
                setAlert({ ...alert, color: "warning", message: res.data.error, display: true });
            }
        } catch (error) {
            setAlert({ ...alert, color: "danger", message: error.toLocaleString(), display: true });
        } finally {
            setProgressbar(false);
        }
    };

    useEffect(() => {
        fetchLoadedTransactions();
    }, [selectedTransactionType]);

    return (
        <div className="content">
            {progressbar && <LinearProgress color="info" />}
            <Row>
                <Col md={12}>
                    <Card>
                        <CardBody>
                            <Label>Select Transaction Type</Label>
                            <FormGroup>
                                <Select
                                    className="react-select info"
                                    classNamePrefix="react-select"
                                    value={transactionOptions.find((opt) => opt.value === selectedTransactionType)}
                                    onChange={(selected) => setSelectedTransactionType(selected.value)}
                                    options={transactionOptions}
                                />
                            </FormGroup>
                        </CardBody>
                    </Card>
                </Col>
                <Col md={12}>
                    <Card>
                        <CardHeader className="d-flex justify-content-between align-items-center">
                            <CardTitle tag="h4" className="mb-0">Wallet Transactions</CardTitle>
                        </CardHeader>

                        <CardBody style={{ height: "400px" }}>
                            <AgGridReact
                                rowData={rowData}
                                columnDefs={getColDefs(selectedTransactionType)}
                                defaultColDef={defaultColDef}
                            />
                        </CardBody>
                    </Card>
                </Col>
            </Row>

        </div>
    );
};

export default WalletTransactionHistory;
