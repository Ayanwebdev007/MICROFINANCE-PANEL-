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
    Table,
    Label, Spinner
} from "reactstrap";
import axios from "axios";
import CstNotification from "../../components/CstNotification";
import ReactBSAlert from "react-bootstrap-sweetalert";
import Select from "react-select";
import {useSelector} from "react-redux";

const PlanCreation = () => {
    const initialState = {
        id: '',
        name: '',
        type: '',
        emiMode: '',
        emiInterval: '',
        minAge: '',
        maxAge: '',
        minAmount: '',
        maxAmount: '',
        emiCount: '',
        interestRate: '',
        interestType: '',
        security: '',
        processingFee: 0,
        legalFee: 0,
        insuranceFeeRate: 0,
        gstRate: 0,
        valuerFeeRate: 0,
        gracePeriod: 0,
        penaltyType: '',
        penaltyRate: '',
        calculationMethod: '',
        updateRequested: false,
    };

    const [formData, setFormData] = React.useState(initialState);
    const [cstError, setCstError] = React.useState({...initialState, gracePeriod: ''});
    const [planList, setPlanList] = React.useState([]);
    const [alert, setAlert] = React.useState({
        color: 'success',
        message: 'test message',
        autoDismiss: 7,
        place: 'tc',
        display: false,
        sweetAlert: false,
        timestamp: new Date().getTime(),
    });
    const [progressbar, setProgressbar] = React.useState(false);
    const [fetched, setFetched] = React.useState(false);

    const authStatus = useSelector((state) => state.auth.authState);

    if (!fetched) {
        setFetched(true);
        axios.get('/api/loan/get-plans/loan')
            .then(function (value) {
                if (value.data.success) {
                    if (value.data.plans.length > 0) {
                        setPlanList(value.data.plans);
                    } else {
                        setAlert({
                            color: 'warning',
                            message: 'No plan found! Please add first plan.',
                            autoDismiss: 7,
                            place: 'tc',
                            display: true,
                            sweetAlert: false,
                            timestamp: new Date().getTime(),
                        });
                    }
                } else {
                    setAlert({
                        color: 'danger',
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
                color: 'danger',
                message: error.toLocaleString(),
                autoDismiss: 7,
                place: 'tc',
                display: true,
                sweetAlert: false,
                timestamp: new Date().getTime(),
            });
        });

        if (!authStatus.accessLevel?.planCreation && authStatus.role !== 'admin' && authStatus.role !== 'root'){
            setAlert({
                color: "warning",
                message: "You don't have access to create schemes. Please contact your administrator.",
                autoDismiss: 7,
                place: "tc",
                display: true,
                sweetAlert: false,
                timestamp: new Date().getTime(),
            });
        }
    }

    const validateForm = () => {
        let formErrors = {...initialState, gracePeriod: ''};
        let isValid = true;

        const planExists = planList.some(plan => plan.id === formData.id);

        if (!formData.updateRequested && planExists) {
            setAlert({
                color: 'danger',
                message: 'Plan ID already exists. Please use a different Plan ID.',
                autoDismiss: 7,
                place: 'tc',
                display: true,
                sweetAlert: false,
                timestamp: new Date().getTime(),
            });
            return false;
        }

        if (formData.updateRequested && !planExists) {
            setAlert({
                color: 'danger',
                message: 'Cannot update - Plan ID does not exist.',
                autoDismiss: 7,
                place: 'tc',
                display: true,
                sweetAlert: false,
                timestamp: new Date().getTime(),
            });
            return false;
        }

        if (!formData.id) {
            formErrors.id = "Plan Id is required.";
            isValid = false;
        }
        if (!formData.name) {
            formErrors.name = "Plan name is required.";
            isValid = false;
        }
        if (!formData.type) {
            formErrors.type = "Loan type is required.";
            isValid = false;
        }
        if (!formData.emiMode) {
            formErrors.emiMode = "Loan EMI mode is required.";
            isValid = false;
        }
        if (!formData.minAmount) {
            formErrors.minAmount = "Min age is required.";
            isValid = false;
        }
        if (!formData.maxAmount) {
            formErrors.maxAmount = "Max age is required.";
            isValid = false;
        }
        if (!formData.emiCount) {
            formErrors.emiCount = "This field is required.";
            isValid = false;
        }
        if (!formData.interestRate) {
            formErrors.interestRate = "Interest rate is required.";
            isValid = false;
        }
        if (!formData.security) {
            formErrors.security = "Security type is required.";
            isValid = false;
        }
        if (!formData.gracePeriod) {
            formErrors.gracePeriod = "Grace period is required.";
            isValid = false;
        }
        if (!formData.penaltyType) {
            formErrors.penaltyType = "Penalty type is required.";
            isValid = false;
        }
        if (!formData.penaltyRate) {
            formErrors.penaltyRate = "Penalty rate is required.";
            isValid = false;
        }
        if (!formData.calculationMethod) {
            formErrors.calculationMethod = "Calculation method is required.";
            isValid = false;
        }
        
        setCstError(formErrors);
        return isValid;
    };

    // Delete Loan plan
    const handleDelete = async (planId) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this plan?");
        if (!confirmDelete) return;

        try {
            const response = await axios.post("/api/loan/delete-plan/loan", {
                schemeCode: planId,
            });

            if (response.data.success) {
                setPlanList((prev) => prev.filter((plan) => plan.id !== planId));

                setAlert({
                    color: "success",
                    message: response.data.success,
                    autoDismiss: 7,
                    place: "tc",
                    display: true,
                    sweetAlert: true,
                    timestamp: new Date().getTime(),
                });
            } else {
                setAlert({
                    color: "danger",
                    message: response.data.error || "Delete failed.",
                    autoDismiss: 7,
                    place: "tc",
                    display: true,
                    sweetAlert: false,
                    timestamp: new Date().getTime(),
                });
            }
        } catch (error) {
            setAlert({
                color: "danger",
                message: error.message || "API Error during delete.",
                autoDismiss: 7,
                place: "tc",
                display: true,
                sweetAlert: false,
                timestamp: new Date().getTime(),
            });
        }
    };


    const handleClear = () => {
        setFormData(initialState);
    };

    const handleSubmit = async () => {
        if (validateForm()) {
            setProgressbar(true);
            try {
                const submitData = await axios.post('/api/loan/plan-creation/loan', formData);
                if (submitData.data.success) {
                    const filteredPlans = planList.filter(({id}) => id !== formData.id);
                    setPlanList([...filteredPlans, formData]);
                    setFormData(initialState);
                    setAlert({
                        color: 'success',
                        message: submitData.data.success,
                        autoDismiss: 7,
                        place: 'tc',
                        display: false,
                        sweetAlert: true,
                        timestamp: new Date().getTime(),
                    });
                } else {
                    setAlert({
                        color: 'danger',
                        message: submitData.data.error || 'Failed to add Plan!',
                        autoDismiss: 7,
                        place: 'tc',
                        display: true,
                        sweetAlert: false,
                        timestamp: new Date().getTime(),
                    });
                }
                setProgressbar(false);
            } catch (e) {
                setProgressbar(false);
                setAlert({
                    color: 'danger',
                    message: e.toLocaleString(),
                    autoDismiss: 7,
                    place: 'tc',
                    display: false,
                    sweetAlert: true,
                    timestamp: new Date().getTime(),
                });
            }
        }
    };

    return (
        <>
            <div className="rna-container">
                {alert.display &&
                    <CstNotification color={alert.color} message={alert.message} autoDismiss={alert.autoDismiss}
                                     place={alert.place} timestamp={alert.timestamp}/>}
                {alert.sweetAlert && <ReactBSAlert
                    success
                    style={{display: "block", marginTop: "-100px"}}
                    title="Success!"
                    onConfirm={() => setAlert({...alert, sweetAlert: false})}
                    onCancel={() => setAlert({...alert, sweetAlert: false})}
                    confirmBtnBsStyle="success"
                    btnSize=""
                >
                    {alert.message}
                </ReactBSAlert>}
            </div>
            <div className="content">
                <Row>
                    <Col md="12">
                        <Card>
                            <CardHeader>
                                <CardTitle tag="h3">Plan Master</CardTitle>
                            </CardHeader>
                            <CardBody>
                                <Row>
                                    <Col md="3">
                                        <FormGroup>
                                            <Label>Loan Plan Id *</Label>
                                            <Input
                                                type="text"
                                                name="id"
                                                value={formData.id}
                                                onChange={({target}) => setFormData({...formData, id: target.value})}
                                            />
                                            <p style={{color: 'red'}}>{cstError.departmentId}</p>
                                        </FormGroup>
                                    </Col>
                                    <Col md="3">
                                        <FormGroup>
                                            <Label>Loan Name *</Label>
                                            <Input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={({target}) => setFormData({...formData, name: target.value})}
                                            />
                                            <p style={{color: 'red'}}>{cstError.name}</p>
                                        </FormGroup>
                                    </Col>
                                    <Col md="3">
                                        <FormGroup>
                                            <Label>Loan Type *</Label>
                                            <Select
                                                className="react-select info"
                                                classNamePrefix="react-select"
                                                value={
                                                    formData.type
                                                        ? { value: formData.type, label: formData.type }
                                                        : null
                                                }
                                                onChange={(selected) =>
                                                    setFormData({ ...formData, type: selected.value })
                                                }
                                                options={[
                                                    { value: 'Property Loan', label: 'Property Loan' },
                                                    { value: 'Personal Loan', label: 'Personal Loan' },
                                                    { value: 'Vehicle Loan', label: 'Vehicle Loan' },
                                                    { value: 'Business Loan', label: 'Business Loan' },
                                                    { value: 'Home Loan', label: 'Home Loan' },
                                                    { value: 'Micro Loan', label: 'Micro Loan' },
                                                    { value: 'Agriculture Loan', label: 'Agriculture Loan' },
                                                    { value: 'Two Wheeler Loan', label: 'Two Wheeler Loan' },
                                                    { value: 'Loan Against Policy', label: 'Loan Against Policy' },
                                                    { value: 'Other Loan', label: 'Other Loan' },
                                                ]}
                                                placeholder="Select an Option"
                                            />
                                            <p style={{color: 'red'}}>{cstError.type}</p>
                                        </FormGroup>
                                    </Col>
                                    <Col md="3">
                                        <FormGroup>
                                            <Label>Loan EMI Mode *</Label>
                                            <Select
                                                className="react-select info"
                                                classNamePrefix="react-select"
                                                name="emiModeSelect"
                                                value={
                                                    formData.emiMode
                                                    ?{value: formData.emiMode, label: formData.emiMode.charAt(0).toUpperCase() + formData.emiMode.slice(1),}
                                                        : null
                                                }
                                                onChange={({value, mode}) => setFormData({
                                                    ...formData,
                                                    emiMode: value,
                                                    emiInterval: mode
                                                })}
                                                options={[
                                                    {value: 'daily', mode: 'day', label: 'Daily'},
                                                    {value: 'weekly', mode: 'week', label: 'Weekly'},
                                                    {value: 'fortnightly', mode: 'fortnight', label: 'Fortnightly'},
                                                    {value: 'monthly', mode: 'month', label: 'Monthly'},
                                                    {value: 'quarterly', mode: 'quarter', label: 'Quarterly'},
                                                ]}
                                                placeholder="Select an Option"
                                            />
                                            <p style={{color: 'red'}}>{cstError.emiMode}</p>
                                        </FormGroup>
                                    </Col>
                                    <Col md="3">
                                        <FormGroup>
                                            <Label>Min Age</Label>
                                            <Input
                                                type="number"
                                                name="minAge"
                                                value={formData.minAge}
                                                onChange={({target}) => setFormData({
                                                    ...formData,
                                                    minAge: target.value
                                                })}
                                            />
                                            <p style={{color: 'red'}}>{cstError.minAge}</p>
                                        </FormGroup>
                                    </Col>
                                    <Col md="3">
                                        <FormGroup>
                                            <Label>Max Age</Label>
                                            <Input
                                                type="number"
                                                name="maxAge"
                                                value={formData.maxAge}
                                                onChange={({target}) => setFormData({
                                                    ...formData,
                                                    maxAge: target.value
                                                })}
                                            />
                                            <p style={{color: 'red'}}>{cstError.maxAge}</p>
                                        </FormGroup>
                                    </Col>
                                    <Col md="3">
                                        <FormGroup>
                                            <Label>Min Amount *</Label>
                                            <Input
                                                type="number"
                                                name="minAmount"
                                                value={formData.minAmount}
                                                onChange={({target}) => setFormData({
                                                    ...formData,
                                                    minAmount: target.value
                                                })}
                                            />
                                            <p style={{color: 'red'}}>{cstError.minAmount}</p>
                                        </FormGroup>
                                    </Col>
                                    <Col md="3">
                                        <FormGroup>
                                            <Label>Max Amount *</Label>
                                            <Input
                                                type="number"
                                                name="maxAmount"
                                                value={formData.maxAmount}
                                                onChange={({target}) => setFormData({
                                                    ...formData,
                                                    maxAmount: target.value
                                                })}
                                            />
                                            <p style={{color: 'red'}}>{cstError.maxAmount}</p>
                                        </FormGroup>
                                    </Col>
                                    <Col md="3">
                                        <FormGroup>
                                            <Label>{`Total Tenure (${formData.emiInterval})`}</Label>
                                            <Input
                                                type="number"
                                                name="tenure"
                                                value={formData.emiCount}
                                                onChange={({target}) => setFormData({
                                                    ...formData,
                                                    emiCount: target.value
                                                })}
                                            />
                                            <p style={{color: 'red'}}>{cstError.emiCount}</p>
                                        </FormGroup>
                                    </Col>
                                    <Col md="3">
                                        <FormGroup>
                                            <Label>Interest Rate *</Label>
                                            <Input
                                                type="number"
                                                name="interestRate"
                                                value={formData.interestRate}
                                                onChange={({target}) => setFormData({
                                                    ...formData,
                                                    interestRate: target.value
                                                })}
                                            />
                                            <p style={{color: 'red'}}>{cstError.interestRate}</p>
                                        </FormGroup>
                                    </Col>
                                    <Col md="3">
                                        <FormGroup>
                                            <Label>Security Type *</Label>
                                            <Select
                                                className="react-select info"
                                                classNamePrefix="react-select"
                                                name="securitySelect"
                                                value={
                                                    formData.security
                                                    ?{value: formData.security, label: formData.security}
                                                        : null
                                                }
                                                onChange={({value}) => setFormData({...formData, security: value})}
                                                options={[
                                                    {value: 'PLEDGE', label: 'PLEDGE'},
                                                    {value: 'GUARANTEE', label: 'GUARANTEE'},
                                                    {value: 'MORTGAGE', label: 'MORTGAGE'},
                                                    {value: 'OTHER', label: 'OTHER'},
                                                ]}
                                                placeholder="Select an Option"
                                            />
                                            <p style={{color: 'red'}}>{cstError.emiMode}</p>
                                        </FormGroup>
                                    </Col>
                                    <Col md="3">
                                        <FormGroup>
                                            <Label>Calculation Type *</Label>
                                            <Select
                                                className="react-select info"
                                                classNamePrefix="react-select"
                                                name="calculationMethodSelect"
                                                value={
                                                    formData.calculationMethod
                                                        ? {
                                                            value: formData.calculationMethod,
                                                            label:
                                                                formData.calculationMethod === 'FLAT'
                                                                    ? 'Flat Interest'
                                                                    : 'Reducing Interest',
                                                        }
                                                        : null
                                                }
                                                onChange={({value}) => setFormData({
                                                    ...formData,
                                                    calculationMethod: value
                                                })}
                                                options={[
                                                    {value: 'FLAT', label: 'Flat Interest'},
                                                    {value: 'REDUCING', label: 'Reducing Interest'},
                                                ]}
                                                placeholder="Select an Option"
                                            />
                                            <p style={{color: 'red'}}>{cstError.calculationMethod}</p>
                                        </FormGroup>
                                    </Col>
                                </Row>
                            </CardBody>
                        </Card>
                    </Col>
                    <Col md="12">
                        <Card>
                            <CardHeader>
                                <CardTitle tag="h3">Deduction Details</CardTitle>
                            </CardHeader>
                            <CardBody>
                                <Row>
                                    <Col md="3">
                                        <FormGroup>
                                            <Label>Processing Fee (%) *</Label>
                                            <Input
                                                type="number"
                                                name="processingFee"
                                                value={formData.processingFee}
                                                onChange={({target}) => setFormData({
                                                    ...formData,
                                                    processingFee: target.value
                                                })}
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md="3">
                                        <FormGroup>
                                            <Label>Legal Fee (₹) *</Label>
                                            <Input
                                                type="number"
                                                name="legalFee"
                                                value={formData.legalFee}
                                                onChange={({target}) => setFormData({
                                                    ...formData,
                                                    legalFee: target.value
                                                })}
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md="3">
                                        <FormGroup>
                                            <Label>Insurance Fee (%) *</Label>
                                            <Input
                                                type="number"
                                                name="insuranceFeeRate"
                                                value={formData.insuranceFeeRate}
                                                onChange={({target}) => setFormData({
                                                    ...formData,
                                                    insuranceFeeRate: target.value
                                                })}
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md="3">
                                        <FormGroup>
                                            <Label>GST (%) *</Label>
                                            <Input
                                                type="number"
                                                name="gstRate"
                                                value={formData.gstRate}
                                                onChange={({target}) => setFormData({
                                                    ...formData,
                                                    gstRate: target.value
                                                })}
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md="3">
                                        <FormGroup>
                                            <Label>Valuer Fee (%) *</Label>
                                            <Input
                                                type="number"
                                                name="valuerFeeRate"
                                                value={formData.valuerFeeRate}
                                                onChange={({target}) => setFormData({
                                                    ...formData,
                                                    valuerFeeRate: target.value
                                                })}
                                            />
                                        </FormGroup>
                                    </Col>
                                </Row>
                            </CardBody>
                        </Card>
                    </Col>
                    <Col md="12">
                        <Card>
                            <CardHeader>
                                <CardTitle tag="h3">Penalty Details</CardTitle>
                            </CardHeader>
                            <CardBody>
                                <Row>
                                    <Col md="3">
                                        <FormGroup>
                                            <Label>Grace Period (days) *</Label>
                                            <Input
                                                type="number"
                                                name="gracePeriod"
                                                value={formData.gracePeriod}
                                                onChange={({target}) => setFormData({
                                                    ...formData,
                                                    gracePeriod: target.value
                                                })}
                                            />
                                            <p style={{color: 'red'}}>{cstError.gracePeriod}</p>
                                        </FormGroup>
                                    </Col>
                                    <Col md="3">
                                        <FormGroup>
                                            <Label>Penalty Type *</Label>
                                            <Select
                                                className="react-select info"
                                                classNamePrefix="react-select"
                                                name="penaltyTypeSelect"
                                                value={
                                                    formData.penaltyType
                                                        ?{value: formData.penaltyType, label: formData.penaltyType} : null
                                                }
                                                onChange={({value}) => setFormData({...formData, penaltyType: value})}
                                                options={[
                                                    {value: 'amount', label: 'Amount'},
                                                    {value: 'percentage', label: 'Percentage'},
                                                ]}
                                            />
                                            <p style={{color: 'red'}}>{cstError.penaltyType}</p>
                                        </FormGroup>
                                    </Col>
                                    <Col md="3">
                                        <FormGroup>
                                            <Label>Penalty Rate *</Label>
                                            <Input
                                                type="number"
                                                name="penaltyRate"
                                                value={formData.penaltyRate}
                                                onChange={({target}) => setFormData({
                                                    ...formData,
                                                    penaltyRate: target.value
                                                })}
                                            />
                                            <p style={{color: 'red'}}>{cstError.penaltyRate}</p>
                                        </FormGroup>
                                    </Col>
                                </Row>
                            </CardBody>
                        </Card>
                    </Col>
                    <Col md="12" className={"text-center"}>
                        <Button color="success" onClick={handleSubmit} disabled={progressbar || (authStatus.accessLevel?.planCreation !== true && authStatus.role !== 'admin' && authStatus.role !== 'root')} className={"mr-2"}>
                            {progressbar ? <Spinner color="light" style={{width: '1rem', height: '1rem'}}/> : 'Submit'}
                        </Button>
                        <Button color="danger" onClick={handleClear}>
                            Reset
                        </Button>
                    </Col>
                </Row>
                <Row className={"mt-4"}>
                    <Col md="12">
                        <Card>
                            <CardHeader>
                                <CardTitle tag="h3">Loan Plan List</CardTitle>
                            </CardHeader>
                            <CardBody>
                                <Table responsive>
                                    <thead>
                                    <tr>
                                        <th>SNo</th>
                                        <th>Plan Code</th>
                                        <th>Plan Name</th>
                                        <th>EMI Mode</th>
                                        <th>Min Amount</th>
                                        <th>Max Amount</th>
                                        <th>Interest Rate</th>
                                        <th>Action</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {planList.map((value, index) => (
                                        <tr key={value.id}>
                                            <td>{index + 1}</td>
                                            <td>{value.id}</td>
                                            <td>{value.name}</td>
                                            <td>{value.emiMode}</td>
                                            <td>{value.minAmount}</td>
                                            <td>{value.maxAmount}</td>
                                            <td>{value.interestRate}</td>
                                            <td>
                                                <Button color="primary" size="sm" onClick={() => setFormData({...value, updateRequested: true})}>
                                                    <i className="tim-icons icon-pencil"/>
                                                </Button>
                                                {authStatus.accessLevel?.planCreation || authStatus.role === 'admin' || authStatus.role === 'root' ?
                                                    <Button color="danger" size="sm"
                                                         onClick={() => handleDelete(value.id)}>
                                                    <i className="tim-icons icon-trash-simple"/>
                                                </Button> : null}
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </Table>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </div>
        </>
    );
};

export default PlanCreation;