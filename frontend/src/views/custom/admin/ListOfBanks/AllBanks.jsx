/*!

=========================================================
* Black Dashboard PRO React - v1.2.4
=========================================================

* Product Page: https://www.creative-tim.com/product/black-dashboard-pro-react
* Copyright 2024 Creative Tim (https://www.creative-tim.com)

* Coded by Creative Tim

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

*/

import React from "react";
// reactstrap components
import {
    Card,
    CardHeader,
    CardBody,
    CardTitle,
    Row,
    Col,
    Button,
} from "reactstrap";
import { AgGridReact } from 'ag-grid-react';
import axios from "axios";
import CstNotification from "../../components/CstNotification";
import { LinearProgress, TextField } from "@mui/material";

const AllBanks = () => {
    const [rowData, setRowData] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [search, setSearch] = React.useState('');
    const [lastVisible, setLastVisible] = React.useState(null);
    const [hasMore, setHasMore] = React.useState(true);

    const [alert, setAlert] = React.useState({
        color: 'success',
        message: '',
        autoDismiss: 7,
        place: 'tc',
        display: false,
        timestamp: new Date().getTime(),
    });

    const fetchBanks = React.useCallback(async (isNewSearch = false) => {
        try {
            setLoading(true);
            const currentLastVisible = isNewSearch ? null : lastVisible;
            const response = await axios.get("/api/admin/get-registered-banks", {
                params: {
                    limit: 50,
                    lastVisible: currentLastVisible,
                    search: search
                }
            });

            if (response.data.success) {
                const banks = response.data.data.map((item) => ({
                    ...item.data,
                    key: item.key,
                    label: item.label,
                }));

                if (isNewSearch) {
                    setRowData(banks);
                } else {
                    setRowData(prev => [...prev, ...banks]);
                }

                setLastVisible(response.data.lastVisible);
                setHasMore(banks.length === 50);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [lastVisible, search]);

    React.useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchBanks(true);
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [search]);

    const CustomButtonComponent = (props) => {
        const isDisabled = props.data.disabled || false;
        return <div className="form-inline">
            <Button className="btn" color={isDisabled ? 'success' : 'danger'} size="sm" disabled={loading}
                onClick={() => handleActionClick(props.data.key, !isDisabled)}
            >{isDisabled ? 'ENABLE' : 'DISABLE'}</Button>
        </div>
    };

    async function handleActionClick(bankId, actionValue) {
        try {
            setLoading(true);
            const submitData = await axios.post('/api/admin/update-bank-status', {
                bankId,
                actionValue,
            });
            if (submitData.data.success) {
                setAlert({
                    color: 'success',
                    message: submitData.data.success,
                    display: true,
                    timestamp: new Date().getTime(),
                });
                const updatedBanks = rowData.map(bank =>
                    bank.key === bankId ? { ...bank, disabled: actionValue } : bank
                );
                setRowData(updatedBanks);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    const [colDefs] = React.useState([
        { headerName: "SR.NO", valueGetter: "node.rowIndex + 1", filter: false, width: 80 },
        { field: "bankName", headerName: "BANK NAME" },
        { field: "startDate", headerName: "START DATE" },
        { field: "renewDate", headerName: "RENEWAL DATE" },
        { field: "address", headerName: "ADDRESS" },
        { field: "domainName", headerName: "DOMAIN" },
        { field: "action", headerName: 'Action', cellRenderer: CustomButtonComponent, filter: false, },
    ]);

    const defaultColDef = { flex: 1, filter: true, floatingFilter: true };

    return (
        <div className="content">
            {loading && <LinearProgress />}
            {alert.display && <CstNotification color={alert.color} message={alert.message} autoDismiss={7} place="tc" timestamp={alert.timestamp} />}
            <Row>
                <Col md="12" className="mb-5">
                    <Card>
                        <CardHeader className="d-flex justify-content-between align-items-center">
                            <CardTitle tag="h4">List of Banks</CardTitle>
                            <TextField
                                label="Search Banks..."
                                variant="outlined"
                                size="small"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                sx={{ width: 300, input: { color: 'white' }, label: { color: 'gray' } }}
                            />
                        </CardHeader>
                        <CardBody style={{ height: window.innerHeight - 350 }}>
                            <AgGridReact
                                rowData={rowData}
                                columnDefs={colDefs}
                                defaultColDef={defaultColDef}
                                enableCellTextSelection={true}
                            />
                            {hasMore && (
                                <div className="text-center mt-3">
                                    <Button color="primary" onClick={() => fetchBanks()} disabled={loading}>
                                        {loading ? 'Loading...' : 'Load More'}
                                    </Button>
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default AllBanks;