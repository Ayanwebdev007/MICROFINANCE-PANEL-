import React from "react";
import {
    Button,
    Card,
    CardHeader,
    CardTitle,
    CardBody,
    FormGroup,
    Row,
    Col,
    Label,
    Spinner,
} from "reactstrap";
import {AgGridReact} from 'ag-grid-react';
import axios from "axios";
import CstNotification from "../../components/CstNotification";
import ReactBSAlert from "react-bootstrap-sweetalert";
import Select from "react-select";

const IteratorForm = () => {
    const initialState = {
        bankId: '',
        userId: '',
    };
    const [formData, setFormData] = React.useState(initialState);
    const [bankDropDown, setBankDropDown] = React.useState([]);
    const [memberList, setMemberList] = React.useState([]);

    const [cstError, setCstError] = React.useState({
        bankId: '',
        userId: '',
    });

    const [alert, setAlert] = React.useState({
        color: "success",
        message: "",
        autoDismiss: 7,
        place: "tc",
        display: false,
        sweetAlert: false,
        timestamp: '',
    });

    const [progressbar, setProgressbar] = React.useState(false);
    const [fetched, setFetched] = React.useState(false);
    const [userDropDown, setUserDropDown] = React.useState([]);
    const [selectedMembers, setSelectedMembers] = React.useState([]);

    // Fetch existing iterator data on a page-load
    if (!fetched) {
        setFetched(true);
        axios.get('/api/admin/get-associated-branch')
            .then(function (value) {
                if (value.data.success) {
                    setBankDropDown(value.data.data);
                } else {
                    setAlert({
                        color: 'warning',
                        message: value.data.error,
                        autoDismiss: 7,
                        place: 'tc',
                        display: true,
                        sweetAlert: false,
                        timestamp: new Date().getTime(),
                    });
                }
            }).catch(function (error) {
            setAlert({
                color: 'warning',
                message: error.toLocaleString(),
                autoDismiss: 7,
                place: 'tc',
                display: true,
                sweetAlert: false,
                timestamp: new Date().getTime(),
            });
        });
    }

    const validateForm = () => {
        let errors = {...cstError};
        let isValid = true;

        if (!formData.bankId) {
            errors.bankId = "Bank is required.";
            isValid = false;
        }

        if (!formData.userId) {
            errors.userId = "Employee is required.";
            isValid = false;
        }

        setCstError(errors);
        return isValid;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setProgressbar(true);

        const eligibleAccountCount = selectedMembers.length;
        for (let i = 0; i < eligibleAccountCount; i++) {
            setAlert({
                color: 'success',
                message: `Updated ${i+1} out of ${eligibleAccountCount} accounts. Please wait till all processed`,
                autoDismiss: 7,
                place: 'tc',
                display: false,
                sweetAlert: true,
                timestamp: new Date().getTime(),
            });
            try {
                const submit = await axios.post(`/api/tools/bulk-update-employee-mapping`, {...formData, memberId: selectedMembers[i]});
                if (submit.data.error){
                    setAlert({
                        color: 'danger',
                        message: submit.data.error,
                        autoDismiss: 7,
                        place: 'tc',
                        display: true,
                        sweetAlert: false,
                    });
                }
            }catch (e) {
                setAlert({
                    color: 'danger',
                    message: e.toLocaleString(),
                    autoDismiss: 7,
                    place: 'tc',
                    display: true,
                    sweetAlert: false,
                })
            }finally {
                setProgressbar(false);
            }
        }
        setAlert({
            color: 'success',
            message: `All members have been updated successfully. Please wait few seconds then refresh the page to see the changes.`,
            autoDismiss: 7,
            place: 'tc',
            display: false,
            sweetAlert: true,
            timestamp: new Date().getTime(),
        });
        fetchMemberList(formData.bankId);
    };

    function handleBankSelect(data) {
        setFormData({
            ...formData,
            bankId: data.key,
        });
        fetchBankIterator(data.key);
    }

    function fetchBankIterator(bankId) {
        fetchMemberList(bankId);
        axios.post(`/api/admin/get-users-by-bank`, {
            bankId: bankId,
        }).then((fetchData) => {
            if (fetchData.data.success) {
                setUserDropDown(fetchData.data.data);
            }else {
                setAlert({
                    color: 'warning',
                    message: fetchData.data.error,
                    autoDismiss: 7,
                    place: 'tc',
                    display: true,
                    timestamp: new Date().getTime(),
                });
            }
        }).catch((error) => {
            setAlert({
                color: 'warning',
                message: error.toLocaleString(),
                autoDismiss: 7,
                place: 'tc',
                display: true,
                timestamp: new Date().getTime(),
            });
        }).finally();
    }

    function fetchMemberList(bankId) {
        setProgressbar(true);

        axios
            .get("/api/member/get-all-members", {
                params: {bankId}
            })
            .then((response) => {
                if (response.data.success) {
                    setMemberList(response.data.data);
                }else {
                    setAlert({
                        color: "danger",
                        message: response.data.error,
                        autoDismiss: 5,
                        place: "tc",
                        display: true,
                        sweetAlert: false,
                        timestamp: new Date().toLocaleString(),
                    });
                }
            })
            .catch((error) => {
                setAlert({
                    color: "danger",
                    message: error.toLocaleString(),
                    autoDismiss: 5,
                    place: "tc",
                    display: true,
                    sweetAlert: false,
                    timestamp: new Date().toLocaleString(),
                });
            }).finally(()=> {
            setProgressbar(false);
        });
    }

    return (
        <>
            <div className="rna-container">
                {alert.display &&
                    <CstNotification color={alert.color} message={alert.message} autoDismiss={alert.autoDismiss}
                                     place={alert.place} timestamp={alert.timestamp}/>}
                {alert.sweetAlert && (
                    <ReactBSAlert
                        success
                        style={{display: "block", marginTop: "-100px"}}
                        title="Success!"
                        onConfirm={() => setAlert({...alert, sweetAlert: false})}
                        confirmBtnBsStyle="success"
                        btnSize=""
                    >
                        {alert.message}
                    </ReactBSAlert>
                )}
            </div>

            <div className="content">
                <Row>
                    <Card>
                        <CardBody className={'mt-2'}>
                            <Row>
                                <Col md={6}>
                                    <Label>Select a Bank</Label>
                                    <FormGroup>
                                        <Select
                                            className="react-select info"
                                            classNamePrefix="react-select"
                                            name="bankSelect"
                                            onChange={handleBankSelect}
                                            options={bankDropDown}
                                            placeholder=''
                                        />
                                        <p style={{color: 'red'}}>{cstError.bankId}</p>
                                    </FormGroup>
                                </Col>
                                <Col md={4}>
                                    <Label>Select an Employee</Label>
                                    <FormGroup>
                                        <Select
                                            className="react-select info"
                                            classNamePrefix="react-select"
                                            name="bankSelect"
                                            onChange={(data) => setFormData({...formData, userId: data.key})}
                                            options={userDropDown}
                                            placeholder=''
                                        />
                                        <p style={{color: 'red'}}>{cstError.userId}</p>
                                    </FormGroup>
                                </Col>
                            </Row>
                        </CardBody>
                    </Card>
                    <Col md="12">
                        <Card>
                            <CardHeader>
                                <CardTitle tag="h3">Customize Iterator Format</CardTitle>
                            </CardHeader>
                            <CardBody>
                                <div className="ag-theme-alpine" style={{height: 400, width: '100%'}}>
                                    <AgGridReact
                                        rowData={memberList}
                                        columnDefs={[
                                            {
                                                headerCheckboxSelection: true,
                                                checkboxSelection: true,
                                                width: 50
                                            },
                                            {field: 'id', headerName: 'Member ID', floatingFilter: true, filter: true},
                                            {field: 'name', headerName: 'Name', floatingFilter: true, filter: true},
                                            {field: 'guardianName', headerName: 'Guardian Name', floatingFilter: true, filter: true},
                                            {field: 'date', headerName: 'Joining Date', floatingFilter: true, filter: true},
                                            {field: 'agentName', headerName: 'Employee Name', floatingFilter: true, filter: true},
                                            {field: 'agentEmail', headerName: 'Employee Email', floatingFilter: true, filter: true},
                                        ]}
                                        rowSelection="multiple"
                                        onSelectionChanged={(event) => {
                                            const selectedRows = event.api.getSelectedRows();
                                            setSelectedMembers(selectedRows.map(row => row.id));
                                        }}
                                    />
                                </div>
                            </CardBody>
                            <center className="text-center">
                                <Button color="success" onClick={handleSubmit} disabled={progressbar}>
                                    {progressbar ? <Spinner size="sm" color="light"/> : "Transfer Members"}
                                </Button>
                            </center>
                        </Card>
                    </Col>
                </Row>
            </div>
        </>
    );
};

export default IteratorForm;