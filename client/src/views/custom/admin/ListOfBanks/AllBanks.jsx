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
import {LinearProgress} from "@mui/material";

const AllBanks = () => {
    const [rowData, setRowData] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [fetched, setFetched] = React.useState(false);
    const [alert, setAlert] = React.useState({
        color: 'success',
        message: '',
        autoDismiss: 7,
        place: 'tc',
        display: false,
        transType: '',
        transId: '',
        timestamp: new Date().getTime(),
    });

    const CustomButtonComponent = (props) => {
        const isDisabled = props.data.disabled;
        return <div className="form-inline">
            <Button className="btn" color={isDisabled? 'success' : 'danger'} size="sm" disabled={loading}
                    onClick={()=> handleActionClick(props.data.key, !isDisabled)}
            >{isDisabled ? 'ENABLE' : 'DISABLE'}</Button>
        </div>
    };

    const [colDefs] = React.useState([
        {
            headerName: "SR.NO",
            valueGetter: "node.rowIndex + 1",
            filter: false,
            width: 100
        },
        { field: "bankName", headerName: "BANK NAME"},
        { field: "startDate", headerName: "START DATE"},
        { field: "renewDate", headerName: "RENEWAL DATE"},
        { field: "address", headerName: "ADDRESS"},
        { field: "domainName", headerName: "DOMAIN"},
        {field: "action", headerName: 'Action', cellRenderer: CustomButtonComponent, filter: false,},
    ]);

    const defaultColDef = {
        flex: 1,
        filter: true,
        floatingFilter: true
    };

    async function handleActionClick(bankId, actionValue){
        try {
            setLoading(true);
            const submitData = await axios.post('/api/admin/update-bank-status', {
                bankId,
                actionValue,
            });
            if(submitData.data.success){
                setAlert({
                    color: 'success',
                    message: submitData.data.success,
                    autoDismiss: 7,
                    place: 'tc',
                    transType: '',
                    transId: '',
                    display: true,
                    timestamp: new Date().getTime(),
                });
                const banks = submitData.data.data.map((item) => ({
                    ...item.data,
                    key: item.key,
                    label: item.label,
                }));
                setRowData(banks);
            }else {
                setAlert({
                    color: 'warning',
                    message: submitData.data.error,
                    autoDismiss: 7,
                    place: 'tc',
                    transType: '',
                    transId: '',
                    display: true,
                    timestamp: new Date().getTime(),
                });
            }
        }catch (e) {
            setAlert({
                color: 'danger',
                message: e.toLocaleString(),
                autoDismiss: 7,
                place: 'tc',
                transType: '',
                transId: '',
                display: true,
                timestamp: new Date().getTime(),
            });
        }finally {
            setLoading(false);
        }
    }

    if (!fetched) {
        setFetched(true);
        setLoading(true);

        axios.get("/api/admin/get-registered-banks")
            .then((response) => {
                if (response.data.success) {
                    const banks = response.data.data.map((item) => ({
                        ...item.data,
                        key: item.key,
                        label: item.label,
                    }));
                    setRowData(banks);
                }
                setLoading(false);
            })
            .catch(() => {
                setLoading(false);
            });
    }

    return (
        <div className="content">
            {loading && <LinearProgress />}
            {alert.display && <CstNotification color={alert.color} message={alert.message} autoDismiss={alert.autoDismiss} place={alert.place} timestamp={alert.timestamp}/>}
            <Row>
                <Col md="12" className="mb-5">
                    <Card>
                        <CardHeader>
                            <CardTitle tag="h4">List of Banks</CardTitle>
                        </CardHeader>
                        <CardBody style={{ height: window.innerHeight - 300 }}>
                            {/*{loading ? (*/}
                            {/*    <div className="text-center">*/}
                            {/*        <Spinner color="primary" />*/}
                            {/*    </div>*/}
                            {/*) : (*/}
                            {/*    */}
                            {/*)}*/}
                            <AgGridReact
                              rowData={rowData}
                              columnDefs={colDefs}
                              defaultColDef={defaultColDef}
                              enableCellTextSelection={true}
                            />
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default AllBanks;