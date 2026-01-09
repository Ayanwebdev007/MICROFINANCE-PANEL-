import React from "react";
import 'firebase/compat/app-check';
import axios from "axios";
import NotificationAlert from "react-notification-alert";
import {CircularProgress, LinearProgress} from "@mui/material";
import SweetAlert from "react-bootstrap-sweetalert";
import {
    Button,
    Card,
    CardBody,
    CardFooter,
    CardHeader,
    CardTitle,
    Col,
    Form,
    FormGroup,
    Input,
    Label,
    Row
} from "reactstrap";
import Select from "react-select";
import {AgGridReact} from "ag-grid-react";


function GlCodeModification() {
    const initValue = {
        code: '',
        nomenclature: '',
        type: '',
        headType: '',
        classification: '',
        bankBalance: false,
    };

    const [rowData, setRowData] = React.useState([]);
    const notificationAlertRef = React.useRef(null);
    const [details, setDetails] = React.useState(initValue);
    const [cstError, setCstError] = React.useState(initValue);
    const [showProgress, setShowProgress] = React.useState(false);
    const [sweetAlert, setSweetAlert] = React.useState({ render: false, message: '', type: 'success', title: 'Success' });
    const [fetched, setFetched] = React.useState(false);
    const [alert, setAlert] = React.useState({
        color: 'success',
        message: 'test message',
        autoDismiss: 7,
        place: 'tc',
        display: false,
        sweetAlert: false,
    });

    const [colDefs] = React.useState([
        { field: "code", headerName: "GL CODE" },
        { field: "nomenclature", headerName: "GL HEAD" },
        { field: "headType", headerName: "HEAD TYPE" },
        { field: "type", headerName: "TYPE" },
        { field: "classification", headerName: "CLASSIFICATION" },
    ]);

    const defaultColDef = {
        flex: 1,
        filter: true,
        floatingFilter: true
    };

    React.useEffect(() => {
        if (!fetched) {
            setFetched(true);
            setShowProgress(true);
            axios.get('/api/admin/get-gl-codes')
                .then(function (response) {
                    if (response.data.success) {
                        const allCodes = response.data.data.map((item, index) => ({
                            ...item,
                            id: index + 1,

                        }));
                        setRowData(allCodes);
                    } else {
                        setAlert({
                            color: 'warning',
                            message: response.data.error,
                            autoDismiss: 7,
                            place: 'tc',
                            display: true,
                            sweetAlert: false,
                        });
                    }
                })
                .catch((error) => {
                    setShowProgress(false);
                }).finally(()=> {
                    setShowProgress(false);
            });
        }
    }, [fetched]);

    const notify = (message, color) => {
        const options = {
            place: 'tc',
            message: (<div>{message}</div>),
            type: color,
            icon: "tim-icons icon-bell-55",
            autoDismiss: 5,
        };
        notificationAlertRef.current.notificationAlert(options);
    };

    async function onSubmit() {
        const checkInput = validateInput(details);

        if (checkInput) {
            setCstError(initValue);
            setShowProgress(true);

            try {
                const submit = await axios.post('/api/admin/update-gl-code', {
                    gl: details
                });

                setShowProgress(false);

                if (submit.data.success) {
                    const newItem = submit.data.data;

                    setRowData(prevData => {
                        const index = prevData.findIndex(item => item.code === newItem.code);
                        if (index !== -1) {
                            const updated = [...prevData];
                            updated[index] = { ...updated[index], ...newItem };
                            return updated;
                        } else {
                            return [...prevData, newItem];
                        }
                    });

                    setSweetAlert({
                        render: true,
                        message: submit.data.success,
                        type: 'success',
                        title: 'Success!'
                    });

                    setDetails(initValue);
                } else {
                    setSweetAlert({
                        render: true,
                        message: submit.data.error,
                        type: 'danger',
                        title: 'Failed to process!'
                    });
                }
            } catch (e) {
                console.error(e);
                notify(e.toString(), 'danger');
                setShowProgress(false);
            }
        }
    }

    function validateInput(userInput) {
        let valid = true;
        let errorObj = {};
        if (!userInput.code) {
            errorObj.code = 'Code is required';
            valid = false;
        }
        if (!userInput.nomenclature) {
            errorObj.nomenclature = 'GL Head is required';
            valid = false;
        }
        if (!userInput.type) {
            errorObj.type = 'Type is required';
            valid = false;
        }
        if (!userInput.headType) {
            errorObj.headType = 'Head Type is required';
            valid = false;
        }

        setCstError({ ...cstError, ...errorObj });
        return valid;
    }

    return (
        <>
            <div className="rna-container">
                <NotificationAlert ref={notificationAlertRef} />
            </div>
            <div className='content'>
                {showProgress && <LinearProgress />}
                {sweetAlert.render && <SweetAlert
                    {...{ [sweetAlert.type]: sweetAlert.type }}
                    style={{ display: "block", marginTop: "-100px" }}
                    title={sweetAlert.title}
                    onConfirm={() => setSweetAlert({ render: false, message: '', type: 'success', title: '' })}
                    onCancel={() => setSweetAlert({ render: false, message: '', type: 'success', title: '' })}
                    confirmBtnBsStyle="info"
                >
                    {sweetAlert.message}
                </SweetAlert>}
                <Card>
                    <Form autoComplete='off'>
                        <CardHeader><CardTitle>GL Code Modification</CardTitle></CardHeader>
                        <CardBody>
                            <Row>
                                <Col md='4'>
                                    <Label>CODE *</Label>
                                    <FormGroup>
                                        <Input
                                            type='text'
                                            value={details.code}
                                            onChange={(e) => setDetails({ ...details, code: e.target.value })}
                                        />
                                        <p style={{ color: 'red' }}>{cstError.code}</p>
                                    </FormGroup>
                                </Col>
                                <Col md='4'>
                                    <Label>GL Head *</Label>
                                    <FormGroup>
                                        <Input
                                            type='text'
                                            value={details.nomenclature}
                                            onChange={(e) => setDetails({ ...details, nomenclature: e.target.value.toUpperCase() })}
                                        />
                                        <p style={{ color: 'red' }}>{cstError.nomenclature}</p>
                                    </FormGroup>
                                </Col>
                                <Col md='4'>
                                    <Label>Head Type *</Label>
                                    <FormGroup>
                                        <Select
                                            className="react-select info"
                                            classNamePrefix="react-select"
                                            name="headSelect"
                                            onChange={(value) => setDetails({ ...details, headType: value.value })}
                                            options={["asset", "expenditure", "income", "liability", "trading"].map(v => ({ value: v, label: v.toUpperCase() }))}
                                            placeholder="Select an Option"
                                        />
                                        <p style={{ color: 'red' }}>{cstError.headType}</p>
                                    </FormGroup>
                                </Col>
                                <Col md='4'>
                                    <Label>Type *</Label>
                                    <FormGroup>
                                        <Select
                                            className="react-select info"
                                            classNamePrefix="react-select"
                                            name="typeSelect"
                                            onChange={(value) => setDetails({ ...details, type: value.value })}
                                            options={["BORROWING", "DEPOSIT", "GENERAL", "INVESTMENT", "LOAN", "MIGRATION", "PAID", "PAYABLE", "PURCHASE", "RECEIVABLE", "RECEIVED", "SALES", "SHARE", "STOCK"].map(v => ({ value: v.toLowerCase(), label: v }))}
                                            placeholder="Select an Option"
                                        />
                                        <p style={{ color: 'red' }}>{cstError.type}</p>
                                    </FormGroup>
                                </Col>
                                <Col md='4'>
                                    <Label>CLASSIFICATION</Label>
                                    <FormGroup>
                                        <Input
                                            type='text'
                                            value={details.classification}
                                            onChange={(e) => setDetails({ ...details, classification: e.target.value.toUpperCase() })}
                                        />
                                    </FormGroup>
                                </Col>
                                <Col>
                                    <Label>Balance with Other Bank</Label>
                                    <FormGroup>
                                        <Select
                                            className="react-select info"
                                            classNamePrefix="react-select"
                                            name="balanceSelect"
                                            onChange={(value) => setDetails({ ...details, bankBalance: value.value })}
                                            options={[{ value: true, label: 'Yes' }, { value: false, label: 'No' }]}
                                        />
                                    </FormGroup>
                                </Col>
                            </Row>
                        </CardBody>
                        <CardFooter className='text-center'>
                            {showProgress && <CircularProgress style={{ color: '#75E6DA' }} />}
                            <Button className="btn-fill" color="success" disabled={showProgress} type="button" onClick={onSubmit}>
                                Submit
                            </Button>
                        </CardFooter>
                    </Form>
                </Card>

                <Row>
                    <Col md="12" className="mb-5">
                        <Card>
                            <CardHeader><CardTitle tag="h4">List of GL Codes</CardTitle></CardHeader>
                            <CardBody style={{ height: window.innerHeight - 300 }}>
                                <div className="ag-theme-alpine" style={{ height: "100%", width: "100%" }}>
                                    <AgGridReact
                                        rowData={rowData}
                                        columnDefs={colDefs}
                                        defaultColDef={defaultColDef}
                                        enableCellTextSelection={true}
                                    />
                                </div>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </div>
        </>
    );
}

export default GlCodeModification;