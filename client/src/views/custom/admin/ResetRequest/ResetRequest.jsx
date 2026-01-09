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
import ReactBSAlert from "react-bootstrap-sweetalert";

const ResetRequest = () => {
    const [rowData, setRowData] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [fetched, setFetched] = React.useState(false);
    const [alert, setAlert] = React.useState({
        color: 'success',
        message: '',
        autoDismiss: 7,
        place: 'tc',
        display: false,
        requestId: '',
        sweetAlert: false,
        timestamp: new Date().getTime(),
    });

    if (!fetched) {
        setFetched(true);
        loadRequest();
    }

    function loadRequest() {
        setLoading(true);
        axios.get("/api/admin/get-reset-request")
            .then((response) => {
                if (response.data.success) {
                    const banks = response.data.data.map((item) => (item));
                    setRowData(banks);
                }
                setLoading(false);
            })
            .catch(() => {
                setLoading(false);
            });
    }

    const CustomButtonComponent = (props) => {
        return <div className="form-inline">
            <Button className="fa fa-check btn-icon" color="success" size="sm" aria-hidden="true" disabled={loading}
                    onClick={()=> setAlert({
                        color: 'warning',
                        message: `Are you sure you want to reset all the data for ${props.data.name}?`,
                        autoDismiss: 7,
                        place: 'tc',
                        display: false,
                        requestId: props.data.key,
                        sweetAlert: true,
                        timestamp: new Date().getTime(),
                    })}
            />
            <Button className="fa fa-trash btn-icon" color="danger" size="sm" disabled={loading}
                    onClick={()=> handleReject(props.data.key)}
            />
        </div>
    };

    const [colDefs] = React.useState([
        {field: "name", headerName: "NAME", flex: 3, minWidth: 300},
        {field: "bankName", headerName: "BANK NAME", flex: 2, minWidth: 150},
        {field: "isMainBranch", headerName: "MAIN BRANCH", flex: 2, minWidth: 100, cellStyle: {textAlign: 'center'}},
        {field: "date", headerName: "REQUEST DATE", flex: 2, minWidth: 100, cellStyle: {textAlign: 'center'}},
        {
            field: "action",
            headerName: 'Action',
            cellRenderer: CustomButtonComponent,
            filter: false,
            flex: 1,
            minWidth: 100,
            cellStyle: {textAlign: 'center'}
        },
    ]);

    const defaultColDef = {
        filter: true,
        floatingFilter: true,
        autoHeight: true
    };

    async function handleApproveClick(requestId){
        setAlert({
            color: 'success',
            message: '',
            autoDismiss: 7,
            place: 'tc',
            requestId: '',
            display: false,
            sweetAlert: false,
            timestamp: new Date().getTime(),
        });
        try {
            setLoading(true);
            const submitData = await axios.post('/api/admin/approve-reset-request', {requestId});
            if(submitData.data.success){
                setAlert({
                    color: 'success',
                    message: submitData.data.success,
                    autoDismiss: 7,
                    place: 'tc',
                    requestId: '',
                    display: true,
                    sweetAlert: false,
                    timestamp: new Date().getTime(),
                });
                loadRequest();
            }else {
                setAlert({
                    color: 'warning',
                    message: submitData.data.error,
                    autoDismiss: 7,
                    place: 'tc',
                    requestId: '',
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
                requestId: '',
                display: true,
                sweetAlert: false,
                timestamp: new Date().getTime(),
            });
        }finally {
            setLoading(false);
        }
    }

    async function handleReject(requestId){
        try {
            setLoading(true);
            const submitData = await axios.post('/api/admin/reject-reset-request', {requestId});
            if(submitData.data.success){
                setAlert({
                    color: 'success',
                    message: submitData.data.success,
                    autoDismiss: 7,
                    place: 'tc',
                    requestId: '',
                    display: true,
                    sweetAlert: false,
                    timestamp: new Date().getTime(),
                });
                loadRequest();
            }else {
                setAlert({
                    color: 'warning',
                    message: submitData.data.error,
                    autoDismiss: 7,
                    place: 'tc',
                    requestId: '',
                    display: true,
                    sweetAlert: false,
                    timestamp: new Date().getTime(),
                });
            }
            setLoading(false);
        }catch (e) {
            setLoading(false);
            setAlert({
                color: 'danger',
                message: e.toLocaleString(),
                autoDismiss: 7,
                place: 'tc',
                requestId: '',
                display: true,
                sweetAlert: false,
                timestamp: new Date().getTime(),
            })
        }
    }

    return (
        <div className="content">
            {loading && <LinearProgress />}
            {alert.display && <CstNotification color={alert.color} message={alert.message} autoDismiss={alert.autoDismiss} place={alert.place} timestamp={alert.timestamp}/>}
            {alert.sweetAlert && <ReactBSAlert
                warning
                style={{ display: "block", marginTop: "-100px" }}
                title="Are you sure?"
                onConfirm={() => handleApproveClick(alert.requestId)}
                onCancel={() => setAlert({...alert, sweetAlert: false})}
                confirmBtnBsStyle="success"
                cancelBtnBsStyle="danger"
                confirmBtnText="Yes, delete it!"
                cancelBtnText="Cancel"
                showCancel
                btnSize=""
            >
                {alert.message}
            </ReactBSAlert>}
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

export default ResetRequest;