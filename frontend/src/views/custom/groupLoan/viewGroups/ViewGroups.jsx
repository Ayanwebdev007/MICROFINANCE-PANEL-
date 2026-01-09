import React, {useEffect} from "react";
import 'firebase/compat/app-check';
import axios from "axios";
import NotificationAlert from "react-notification-alert";
import {LinearProgress} from "@mui/material";
import {AgGridReact} from 'ag-grid-react';
import {
    Card,
    CardBody, CardHeader, CardTitle, Col, FormGroup, Row,
} from "reactstrap";
import { useNavigate } from "react-router-dom"
// import printJS from "print-js";
import Select from "react-select";

function ViewGroups(){
    const initValue = {
        agent: '',
        bankId: '',
    }
    const navigate = useNavigate();
    const notificationAlertRef = React.useRef(null);
    const [fetched, setFetched] = React.useState(false);
    const [details, setDetails] = React.useState(initValue);
    const [showProgress, setShowProgress] = React.useState(false);
    const [groupDetails, setGroupDetails] = React.useState([]);
    const [gridApi, setGridApi] = React.useState(null);
    const [bankDropDown, setBankDropDown] = React.useState([]);

    const columnDefs = [
        {
            field: 'slNo',
            headerName: 'Sl',
            valueGetter: (params) => params.node.rowIndex + 1,
            sortable: true,
            filter: true
        },
        {
            field: 'id', headerName: 'Group Id', sortable: true, filter: true,
            cellRenderer: (params) => (
                <span
                    className="text-info"
                    style={{cursor: "pointer"}}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleGroupViewDetails(params.value);
                    }}
                >
              <span style={{userSelect: 'text', WebkitUserSelect: 'text', MozUserSelect: 'text', msUserSelect: 'text'}}>
                  {params.value} </span>
            </span>
            )
        },
        {field: 'name', headerName: 'Group Name', sortable: true, filter: true},
        {field: 'agentName', headerName: 'Associate Name', sortable: true, filter: true},
        {field: 'agentEmail', headerName: 'Associate Email', sortable: true, filter: true},
        {field: 'agentPhone', headerName: 'Associate Phone', sortable: true, filter: true},
    ];

    const defaultColDef = {
        resizable: true,
        selectable: true,
        floatingFilter: true,
    };

    const onGridReady = (params) => {
        setGridApi(params.api);
    };

    const notify = (message, color) => {
        const options = {
            place: 'tc',
            message: (
                <div>{message}</div>
            ),
            type: color,
            icon: "tim-icons icon-bell-55",
            autoDismiss: 5,
        };
        // Safeguard the ref to avoid calling on null during early renders
        if (notificationAlertRef.current?.notificationAlert) {
            notificationAlertRef.current.notificationAlert(options);
        }

    };
    if (!fetched) {
        setFetched(true);
        axios.get('/api/member/get-associated-branch-restrictive')
            .then(function (value) {
                if (value.data.success) {
                    setBankDropDown(value.data.data);
                } else {
                    notify(value.data.error || "Failed to fetch bank details", "warning");
                }
            })
            .catch(function (error) {
                notify(error.toString(), "danger");
            });
    }

    useEffect(() => {
        fetchGroups();
    }, [fetched]);

    async function fetchGroups(bankId = "") {
        setShowProgress(true);
        try {
            const body = bankId ? { bankId } : {};
            const res = await axios.post("/api/reports/loan/get-all-group", body);

            if (res.data.success) {
                notify("Groups fetched successfully", "success");
                setGroupDetails(res.data.details || []);
            } else {
                notify(res.data.error || "No groups found", "danger");
                setGroupDetails([]);
            }
        } catch (err) {
            console.error(err);
            notify("Error: " + err.toString(), "danger");
            setGroupDetails([]);
        } finally {
            setShowProgress(false);
        }
    }

    const handleBankSelect = (selectedOption) => {
        const bankId = selectedOption?.key || "";
        fetchGroups(bankId);
    };

    const handleGroupViewDetails = (groupId) => {
        navigate("/loan/loan-group-edit", {
            state: {
                groupId: groupId,
            }
        })
    }

    return (
        <>
            <div className="rna-container">
                <NotificationAlert ref={notificationAlertRef} />
            </div>
            <div className={'content'}>
                <Row>
                    <Col md="12">
                        <Card>
                            <CardHeader>
                                <CardTitle tag="h3">Branch Selection</CardTitle>
                            </CardHeader>
                            <CardBody>
                                <Row>
                                    <Col md="6">
                                        <label>Select a Branch</label>
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
                <div className={'mb-2'}>
                    {showProgress ? <LinearProgress /> : null}
                </div>
                <Card>
                    <CardBody>

                        <div className="ag-theme-alpine" style={{height: 600, width: '100%'}}>
                            <AgGridReact
                                rowData={groupDetails}
                                columnDefs={columnDefs}
                                defaultColDef={defaultColDef}
                                onGridReady={onGridReady}
                                pagination={true}
                                paginationPageSize={50}
                                paginationPageSizeSelector={[50, 100, 300, 500]}
                                suppressCellSelection={true}
                                enableCellTextSelection={true}
                            />
                        </div>
                    </CardBody>
                </Card>
            </div>
        </>
    )
}

export default ViewGroups;