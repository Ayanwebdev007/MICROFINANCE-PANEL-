import React from "react";
import {
    Button,
    Card,
    CardHeader,
    CardTitle,
    CardBody,
    FormGroup,
    Input,
    Row,
    Col,
    Label,
    Spinner,
} from "reactstrap";
import axios from "axios";
import CstNotification from "../../components/CstNotification";
import ReactBSAlert from "react-bootstrap-sweetalert";
import Select from "react-select";

const IteratorForm = () => {
    const initialState = {
        bankId: '',
        name: '',
    };
    const [formData, setFormData] = React.useState(initialState);
    const [bankDropDown, setBankDropDown] = React.useState([]);

    const [cstError, setCstError] = React.useState({
        bankId: '',
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
            isValid = false;
            errors.bankId = "Bank is required.";
        }

        setCstError(errors);
        return isValid;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setProgressbar(true);

        try {
            const response = await axios.post("/api/admin/send-reset-request", formData);

            if (response.data.success) {
                setAlert({
                    color: "success",
                    message: response.data.success,
                    autoDismiss: 7,
                    place: "tc",
                    display: true,
                    sweetAlert: true,
                    timestamp: new Date().toLocaleString(),
                });
            } else {
                setAlert({
                    color: "danger",
                    message: response.data.error || "Failed to process the request",
                    autoDismiss: 7,
                    place: "tc",
                    display: true,
                    sweetAlert: false,
                    timestamp: new Date().toLocaleString(),
                });
            }
        } catch (e) {
            setAlert({
                color: "danger",
                message: e.message || "An unexpected error occurred.",
                autoDismiss: 7,
                place: "tc",
                display: true,
                sweetAlert: false,
                timestamp: new Date().toLocaleString(),
            });
        } finally {
            setProgressbar(false);
        }
    };

    function handleBankSelect(data) {
        setFormData({
            ...formData,
            bankId: data.key,
            name: data.label || '',
            bankName: data.data.bankName,
            isMainBranch: data.data.isMainBranch,
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
                                <Col md={9}>
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
                            </Row>
                        </CardBody>
                    </Card>
                    <Col md="12">
                        <Card>
                            <CardBody className="form-horizontal">
                                <div className="alert alert-danger" role="alert">
                                    <h4 className="alert-heading">
                                        <i className="fas fa-exclamation-triangle mr-2"></i>
                                        Critical Warning: Data Reset Operation
                                    </h4>
                                    <p className="mb-2">This is a critical operation that will permanently erase all
                                        data for the selected bank. The following data will be irreversibly removed:</p>
                                    <ul className="mb-2">
                                        <li>All customer account balances and complete transaction history</li>
                                        <li>All savings accounts, fixed deposits, and recurring deposit records</li>
                                        <li>All loan accounts, EMI records, and payment histories</li>
                                        <li>All pending transactions and authorization requests</li>
                                        <li>All financial statements and audit trails</li>
                                        <li>All user activity logs and transaction records</li>
                                    </ul>
                                    <hr/>
                                    <p className="mb-0 font-weight-bold">Important Notes:</p>
                                    <ul className="mb-0">
                                        <li>This action cannot be undone</li>
                                        <li>All data will be permanently deleted once admin approves the request</li>
                                    </ul>
                                </div>
                                <center className="text-center">
                                    <Button color="success" onClick={handleSubmit} disabled={progressbar}>
                                        {progressbar ? <Spinner size="sm" color="light"/> : "Submit Request"}
                                    </Button>
                                </center>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </div>
        </>
    );
};

export default IteratorForm;