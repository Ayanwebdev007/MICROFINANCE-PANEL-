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

        savingsAccountPrefix: "",
        savingsAccountValue: 1,
        savingsIteratorUsed: true,
        hasSavingsAccount: true,

        depositAccountPrefix: "",
        depositAccountValue: 1,
        depositIteratorUsed: true,
        hasDepositAccount: true,

        loanAccountPrefix: "",
        loanAccountValue: 1,
        loanIteratorUsed: true,
        hasLoanAccount: true,

        groupLoanAccountPrefix: "",
        groupLoanAccountValue: 1,
        groupLoanIteratorUsed: true,
        hasGroupLoanAccount: true,

        advisorPrefix: "",
        advisorValue: 1,
        advisorIteratorUsed: true,
        hasAdvisor: true,

        employeePrefix: "",
        employeeValue: 1,
        employeeIteratorUsed: true,
        hasEmployee: true,

        groupPrefix: "",
        groupValue: 1,
        groupIteratorUsed: true,
        hasGroup: true,

        kycPrefix: "",
        kycValue: 1,
        kycIteratorUsed: true,
        hasKyc: true,
    };
    const [formData, setFormData] = React.useState(initialState);
    const [bankDropDown, setBankDropDown] = React.useState([]);

    const [cstError, setCstError] = React.useState({
        bankId: '',

        savingsAccountPrefix: "",
        savingsAccountValue: "",

        depositAccountPrefix: "",
        depositAccountValue: "",

        loanAccountPrefix: "",
        loanAccountValue: "",

        groupLoanAccountPrefix: "",
        groupLoanAccountValue: "",

        advisorPrefix: "",
        advisorValue: "",

        employeePrefix: "",
        employeeValue: "",

        groupPrefix: "",
        groupValue: "",

        kycPrefix: "",
        kycValue: "",
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

        const requiredFields = [
            {
                field: "savingsAccountValue",
                msg: "Savings Account value must be greater than 0.",
                check: val => val <= 0
            },

            {
                field: "depositAccountValue",
                msg: "Deposit Account value must be greater than 0.",
                check: val => val <= 0
            },

            {field: "loanAccountValue", msg: "Loan Account value must be greater than 0.", check: val => val <= 0},

            {field: "groupLoanAccountValue", msg: "Group Loan value must be greater than 0.", check: val => val <= 0},

            {field: "advisorValue", msg: "Advisor value must be greater than 0.", check: val => val <= 0},

            {field: "employeeValue", msg: "Employee value must be greater than 0.", check: val => val <= 0},

            {field: "groupValue", msg: "Group value must be greater than 0.", check: val => val <= 0},

            {field: "kycValue", msg: "KYC value must be greater than 0.", check: val => val <= 0},
        ];

        requiredFields.forEach(({field, msg, check}) => {
            const value = formData[field];
            const isInvalid = typeof value === "string" ? !value.trim() : check?.(value);
            if (isInvalid) {
                errors[field] = msg;
                isValid = false;
            }
        });

        setCstError(errors);
        return isValid;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setProgressbar(true);

        try {
            const payload = {
                bankId: formData.bankId,
                iterators: {
                    "savings": {
                        prefix: formData.savingsAccountPrefix,
                        incrementalValue: formData.savingsAccountValue,
                    },
                    "deposit": {
                        prefix: formData.depositAccountPrefix,
                        incrementalValue: formData.depositAccountValue,
                    },
                    "loan": {
                        prefix: formData.loanAccountPrefix,
                        incrementalValue: formData.loanAccountValue,
                    },
                    "group-loan": {
                        prefix: formData.groupLoanAccountPrefix,
                        incrementalValue: formData.groupLoanAccountValue,
                    },
                    "advisor": {
                        prefix: formData.advisorPrefix,
                        incrementalValue: formData.advisorValue,
                    },
                    "employee": {
                        prefix: formData.employeePrefix,
                        incrementalValue: formData.employeeValue,
                    },
                    "group": {
                        prefix: formData.groupPrefix,
                        incrementalValue: formData.groupValue,
                    },
                    "kyc": {
                        prefix: formData.kycPrefix,
                        incrementalValue: formData.kycValue,
                    },
                },
            };

            const response = await axios.post("/api/admin/update-iterators", payload);

            if (response.data.success) {
                setAlert({
                    color: "success",
                    message: response.data.message || "Iterators updated successfully!",
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
        });
        fetchBankIterator(data.key);
    }

    function fetchBankIterator(bankId) {
        axios
            .get("/api/admin/get-iterator-list/" + bankId)
            .then((response) => {
                if (response.data.success) {
                    const iterators = response.data.iteratorList;

                    setFormData({
                        bankId: bankId,

                        savingsAccountPrefix: iterators["savings"]?.prefix || "",
                        savingsAccountValue: iterators["savings"]?.value || 1,
                        savingsIteratorUsed: iterators["savings"]?.isUsed || false,
                        hasSavingsAccount: iterators["savings"]?.hasDocument || false,

                        depositAccountPrefix: iterators["deposit"]?.prefix || "",
                        depositAccountValue: iterators["deposit"]?.value || 1,
                        depositIteratorUsed: iterators["deposit"]?.isUsed || false,
                        hasDepositAccount: iterators["deposit"]?.hasDocument || false,

                        loanAccountPrefix: iterators["loan"]?.prefix || "",
                        loanAccountValue: iterators["loan"]?.value || 1,
                        loanIteratorUsed: iterators["loan"]?.isUsed || false,
                        hasLoanAccount: iterators["loan"]?.hasDocument || false,

                        groupLoanAccountPrefix: iterators["group-loan"]?.prefix || "",
                        groupLoanAccountValue: iterators["group-loan"]?.value || 1,
                        groupLoanIteratorUsed: iterators["group-loan"]?.isUsed || false,
                        hasGroupLoanAccount: iterators["group-loan"]?.hasDocument || false,

                        advisorPrefix: iterators["advisor"]?.prefix || "",
                        advisorValue: iterators["advisor"]?.value || 1,
                        advisorIteratorUsed: iterators["advisor"]?.isUsed || false,
                        hasAdvisor: iterators["advisor"]?.hasDocument || false,

                        employeePrefix: iterators["employee"]?.prefix || "",
                        employeeValue: iterators["employee"]?.value || 1,
                        employeeIteratorUsed: iterators["employee"]?.isUsed || false,
                        hasEmployee: iterators["employee"]?.hasDocument || false,

                        groupPrefix: iterators["group"]?.prefix || "",
                        groupValue: iterators["group"]?.value || 1,
                        groupIteratorUsed: iterators["group"]?.isUsed || false,
                        hasGroup: iterators["group"]?.hasDocument || false,

                        kycPrefix: iterators["kyc"]?.prefix || "",
                        kycValue: iterators["kyc"]?.value || 1,
                        kycIteratorUsed: iterators["kyc"]?.isUsed || false,
                        hasKyc: iterators["kyc"]?.hasDocument || false,
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
                            <CardHeader>
                                <CardTitle tag="h3">Customize Iterator Format</CardTitle>
                            </CardHeader>
                            <CardBody className="form-horizontal">
                                {/* Savings Account */}
                                <Row className="form-horizontal">
                                    <Label sm="2">Savings Account</Label>
                                    <Col sm="10">
                                        <Row>
                                            <Col md="3">
                                                <FormGroup>
                                                    <Input
                                                        type="text"
                                                        placeholder={'Prefix'}
                                                        value={formData.savingsAccountPrefix}
                                                        readOnly={formData.savingsIteratorUsed && formData.hasSavingsAccount}
                                                        onChange={(e) =>
                                                            setFormData({
                                                                ...formData,
                                                                savingsAccountPrefix: e.target.value,
                                                            })
                                                        }
                                                    />
                                                    <p style={{color: "red"}}>{cstError.savingsAccountPrefix}</p>
                                                </FormGroup>
                                            </Col>
                                            <Col md="4">
                                                <FormGroup>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        placeholder={'Increment Value'}
                                                        readOnly={formData.savingsIteratorUsed && formData.hasSavingsAccount}
                                                        value={formData.savingsAccountValue}
                                                        onChange={(e) =>
                                                            setFormData({
                                                                ...formData,
                                                                savingsAccountValue: e.target.value,
                                                            })
                                                        }
                                                    />
                                                    <p style={{color: "red"}}>{cstError.savingsAccountValue}</p>
                                                </FormGroup>
                                            </Col>
                                            <Col md="5">
                                                <FormGroup>
                                                    <Input placeholder="Savings Number" type="text"
                                                           value={`${formData.savingsAccountPrefix}${formData.savingsAccountValue}`}
                                                           readOnly={true}/>
                                                </FormGroup>
                                            </Col>
                                        </Row>
                                    </Col>
                                </Row>

                                {/* Deposit Account */}
                                <Row>
                                    <Label sm="2">Deposit Account</Label>
                                    <Col sm="10">
                                        <Row>
                                            <Col md="3">
                                                <FormGroup>
                                                    <Input
                                                        type="text"
                                                        placeholder={'Prefix'}
                                                        value={formData.depositAccountPrefix}
                                                        readOnly={formData.depositIteratorUsed && formData.hasDepositAccount}
                                                        onChange={(e) =>
                                                            setFormData({
                                                                ...formData,
                                                                depositAccountPrefix: e.target.value,
                                                            })
                                                        }
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md="4">
                                                <FormGroup>
                                                    <Input
                                                        type="number"
                                                        placeholder={'Increment Value'}
                                                        min="1"
                                                        value={formData.depositAccountValue}
                                                        readOnly={formData.depositIteratorUsed && formData.hasDepositAccount}
                                                        onChange={(e) =>
                                                            setFormData({
                                                                ...formData,
                                                                depositAccountValue: e.target.value,
                                                            })
                                                        }
                                                    />
                                                    <p style={{color: "red"}}>{cstError.depositAccountValue}</p>
                                                </FormGroup>
                                            </Col>
                                            <Col md="5">
                                                <FormGroup>
                                                    <Input placeholder=".col-md-5" type="text" readOnly={true}
                                                           value={`${formData.depositAccountPrefix}${formData.depositAccountValue}`}/>
                                                </FormGroup>
                                            </Col>
                                        </Row>
                                    </Col>
                                </Row>

                                {/* Loan Account */}
                                <Row className="form-horizontal">
                                    <Label sm="2">Loan Account</Label>
                                    <Col sm="10">
                                        <Row>
                                            <Col md="3">
                                                <FormGroup>
                                                    <Input
                                                        type="text"
                                                        placeholder={'Prefix'}
                                                        readOnly={formData.loanIteratorUsed && formData.hasLoanAccount}
                                                        value={formData.loanAccountPrefix}
                                                        onChange={(e) =>
                                                            setFormData({
                                                                ...formData,
                                                                loanAccountPrefix: e.target.value,
                                                            })
                                                        }
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md="4">
                                                <FormGroup>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        placeholder={'Increment Value'}
                                                        readOnly={formData.loanIteratorUsed && formData.hasLoanAccount}
                                                        value={formData.loanAccountValue}
                                                        onChange={(e) =>
                                                            setFormData({
                                                                ...formData,
                                                                loanAccountValue: e.target.value,
                                                            })
                                                        }
                                                    />
                                                    <p style={{color: "red"}}>{cstError.loanAccountValue}</p>
                                                </FormGroup>
                                            </Col>
                                            <Col md="5">
                                                <FormGroup>
                                                    <Input placeholder="Savings Number" type="text"
                                                           value={`${formData.loanAccountPrefix}${formData.loanAccountValue}`}
                                                           readOnly={true}/>
                                                </FormGroup>
                                            </Col>
                                        </Row>
                                    </Col>
                                </Row>

                                {/* Group Loan Account */}
                                <Row className="form-horizontal">
                                    <Label sm="2">Group Loan Account</Label>
                                    <Col sm="10">
                                        <Row>
                                            <Col md="3">
                                                <FormGroup>
                                                    <Input
                                                        type="text"
                                                        placeholder={'Prefix'}
                                                        readOnly={formData.groupLoanIteratorUsed && formData.hasGroupLoanAccount}
                                                        value={formData.groupLoanAccountPrefix}
                                                        onChange={(e) =>
                                                            setFormData({
                                                                ...formData,
                                                                groupLoanAccountPrefix: e.target.value,
                                                            })
                                                        }
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md="4">
                                                <FormGroup>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        placeholder={'Increment Value'}
                                                        readOnly={formData.groupLoanIteratorUsed && formData.hasGroupLoanAccount}
                                                        value={formData.groupLoanAccountValue}
                                                        onChange={(e) =>
                                                            setFormData({
                                                                ...formData,
                                                                groupLoanAccountValue: e.target.value,
                                                            })
                                                        }
                                                    />
                                                    <p style={{color: "red"}}>{cstError.groupLoanAccountValue}</p>
                                                </FormGroup>
                                            </Col>
                                            <Col md="5">
                                                <FormGroup>
                                                    <Input placeholder="Savings Number" type="text"
                                                           value={`${formData.groupLoanAccountPrefix}${formData.groupLoanAccountValue}`}
                                                           readOnly={true}/>
                                                </FormGroup>
                                            </Col>
                                        </Row>
                                    </Col>
                                </Row>

                                {/* Advisor */}
                                <Row className="form-horizontal">
                                    <Label sm="2">Advisor</Label>
                                    <Col sm="10">
                                        <Row>
                                            <Col md="3">
                                                <FormGroup>
                                                    <Input
                                                        type="text"
                                                        placeholder={'Prefix'}
                                                        readOnly={formData.advisorIteratorUsed && formData.hasAdvisor}
                                                        value={formData.advisorPrefix}
                                                        onChange={(e) =>
                                                            setFormData({
                                                                ...formData,
                                                                advisorPrefix: e.target.value,
                                                            })
                                                        }
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md="4">
                                                <FormGroup>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        placeholder={'Increment Value'}
                                                        readOnly={formData.advisorIteratorUsed && formData.hasAdvisor}
                                                        value={formData.advisorValue}
                                                        onChange={(e) =>
                                                            setFormData({
                                                                ...formData,
                                                                advisorValue: e.target.value,
                                                            })
                                                        }
                                                    />
                                                    <p style={{color: "red"}}>{cstError.advisorValue}</p>
                                                </FormGroup>
                                            </Col>
                                            <Col md="5">
                                                <FormGroup>
                                                    <Input placeholder="Savings Number" type="text"
                                                           value={`${formData.advisorPrefix}${formData.advisorValue}`}
                                                           readOnly={true}/>
                                                </FormGroup>
                                            </Col>
                                        </Row>
                                    </Col>
                                </Row>

                                {/* Employee */}
                                <Row className="form-horizontal">
                                    <Label sm="2">Employee</Label>
                                    <Col sm="10">
                                        <Row>
                                            <Col md="3">
                                                <FormGroup>
                                                    <Input
                                                        type="text"
                                                        placeholder={'Prefix'}
                                                        readOnly={formData.employeeIteratorUsed && formData.hasEmployee}
                                                        value={formData.employeePrefix}
                                                        onChange={(e) =>
                                                            setFormData({
                                                                ...formData,
                                                                employeePrefix: e.target.value,
                                                            })
                                                        }
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md="4">
                                                <FormGroup>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        placeholder={'Increment Value'}
                                                        readOnly={formData.employeeIteratorUsed && formData.hasEmployee}
                                                        value={formData.employeeValue}
                                                        onChange={(e) =>
                                                            setFormData({
                                                                ...formData,
                                                                employeeValue: e.target.value,
                                                            })
                                                        }
                                                    />
                                                    <p style={{color: "red"}}>{cstError.employeeValue}</p>
                                                </FormGroup>
                                            </Col>
                                            <Col md="5">
                                                <FormGroup>
                                                    <Input placeholder="Savings Number" type="text"
                                                           value={`${formData.employeePrefix}${formData.employeeValue}`}
                                                           readOnly={true}/>
                                                </FormGroup>
                                            </Col>
                                        </Row>
                                    </Col>
                                </Row>

                                {/* Group */}
                                <Row className="form-horizontal">
                                    <Label sm="2">Group</Label>
                                    <Col sm="10">
                                        <Row>
                                            <Col md="3">
                                                <FormGroup>
                                                    <Input
                                                        type="text"
                                                        placeholder={'Prefix'}
                                                        readOnly={formData.groupIteratorUsed && formData.hasGroup}
                                                        value={formData.groupPrefix}
                                                        onChange={(e) =>
                                                            setFormData({
                                                                ...formData,
                                                                groupPrefix: e.target.value,
                                                            })
                                                        }
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md="4">
                                                <FormGroup>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        placeholder={'Increment Value'}
                                                        readOnly={formData.groupIteratorUsed && formData.hasGroup}
                                                        value={formData.groupValue}
                                                        onChange={(e) =>
                                                            setFormData({
                                                                ...formData,
                                                                groupValue: e.target.value,
                                                            })
                                                        }
                                                    />
                                                    <p style={{color: "red"}}>{cstError.groupValue}</p>
                                                </FormGroup>
                                            </Col>
                                            <Col md="5">
                                                <FormGroup>
                                                    <Input placeholder="Savings Number" type="text"
                                                           value={`${formData.groupPrefix}${formData.groupValue}`}
                                                           readOnly={true}/>
                                                </FormGroup>
                                            </Col>
                                        </Row>
                                    </Col>
                                </Row>

                                {/* KYC (Member) */}
                                <Row className="form-horizontal">
                                    <Label sm="2">Member KYC</Label>
                                    <Col sm="10">
                                        <Row>
                                            <Col md="3">
                                                <FormGroup>
                                                    <Input
                                                        type="text"
                                                        placeholder={'Prefix'}
                                                        readOnly={formData.kycIteratorUsed && formData.hasKyc}
                                                        value={formData.kycPrefix}
                                                        onChange={(e) =>
                                                            setFormData({
                                                                ...formData,
                                                                kycPrefix: e.target.value,
                                                            })
                                                        }
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md="4">
                                                <FormGroup>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        placeholder={'Increment Value'}
                                                        readOnly={formData.kycIteratorUsed && formData.hasKyc}
                                                        value={formData.kycValue}
                                                        onChange={(e) =>
                                                            setFormData({
                                                                ...formData,
                                                                kycValue: e.target.value,
                                                            })
                                                        }
                                                    />
                                                    <p style={{color: "red"}}>{cstError.kycValue}</p>
                                                </FormGroup>
                                            </Col>
                                            <Col md="5">
                                                <FormGroup>
                                                    <Input placeholder="Savings Number" type="text"
                                                           value={`${formData.kycPrefix}${formData.kycValue}`}
                                                           readOnly={true}/>
                                                </FormGroup>
                                            </Col>
                                        </Row>
                                    </Col>
                                </Row>
                            </CardBody>

                            <center className="text-center">
                                <Button color="success" onClick={handleSubmit} disabled={progressbar}>
                                    {progressbar ? <Spinner size="sm" color="light"/> : "Save All"}
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