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
import {
    Button,
    Card,
    CardHeader,
    CardBody,
    CardFooter,
    CardTitle,
    Label,
    FormGroup,
    Form,
    Input,
    Row,
    Col, Spinner,
} from "reactstrap";
import ProfileImageUpload from "../../components/ProfileImageUpload";
import axios from "axios";
import CstNotification from "../../components/CstNotification";
import ReactBSAlert from "react-bootstrap-sweetalert";
import {useSelector} from "react-redux";
import Select from "react-select";
import {LinearProgress} from "@mui/material";

const LoanOpeningForm = () => {
    // Initialize the default state for the form inputs
    const initInput = {
        // Loan Details
        loanDate: new Date().toISOString().slice(0, 10),
        accountType: 'group-loan',
        memberId: "",
        memberName: "",
        uuid: '#',
        amount: 0,
        emiAmount: 0,
        principleEMI: 0,
        interestEMI: 0,
        loanTerm: 0,
        emiCount: 0,
        groupId: '',
        firstEmiDate: "",
        // Loan Plan Details
        planDetails: {
            id: '',
            name: '',
            type: '',
            emiMode: '',
            emiInterval: '',
            minAge: '',
            maxAge: '',
            minAmount: '',
            maxAmount: '',
            minTerm: '',
            maxTerm: '',
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
        },
        // Guarantor Details
        guarantor: {
            memberCode: "",
            guarantorName: "",
            address: "",
            pinCode: "",
            phone: "",
            securityType: "",
        },
        // Co-Applicant Details
        coApplicant: {
            memberCode: "",
            coApplicantname: "",
            address: "",
            pinCode: "",
            phone: "",
            securityDetails: "",
        },
        // Deduction Details
        deductionDetails: {
            processingFee: "",
            legalAmount: "",
            gst: "",
            insuranceAmount: "",
        },
    };
    const initMemberInfo = {
        name: '',
        guardian: '',
        gender: '',
        dob: '',
        materialStatus: '',
        email: '',
        phone: '',
        address: '',
        aadhar: '',
        voter: '',
        pan: '',
        occupation: '',
        income: '',
        education: '',
    };

    const [formData, setFormData] = React.useState(initInput);
    const [memberData, setMemberData] = React.useState(initMemberInfo);
    const [applicableKyc, setApplicableKyc] = React.useState([]);
    const [groupList, setGroupList] = React.useState([]);

    // Initialize the state for error tracking
    const [cstError, setCstError] = React.useState({
        planId: '',
        loanDate: '',
        memberId: "",
        amount: '',
        emiAmount: '',
        principleEMI: '',
        interestEMI: '',
        loanTerm: '',
        firstEmiDate:'',
        emiCount: '',
    });
    const [progressbar, setProgressbar] = React.useState(false);
    const [alert, setAlert] = React.useState({
        color: 'success',
        message: 'test message',
        autoDismiss: 7,
        place: 'tc',
        display: false,
        sweetAlert: false,
        timestamp: new Date().getTime(),
    });
    const [fetched, setFetched] = React.useState(false);
    const [planList, setPlanList] = React.useState([]);

    const authStatus = useSelector((state) => state.auth.authState);

    if (!fetched) {
        setFetched(true);
        axios.get('/api/loan/get-plans/group-loan')
            .then(function (value) {
                if (value.data.success) {
                    if (value.data.plans.length > 0) {
                        setPlanList(value.data.plans);
                    } else {
                        setAlert({
                            color: 'warning',
                            message: 'No plan found! Please add a plan.',
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

        axios.post('/api/reports/loan/get-all-group')
            .then(function (value) {
                if (value.data.success) {
                    setGroupList(value.data.details);
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
    }

    const validateForm = () => {
        let formErrors = {};
        let isValid = true;

        if (!formData.planDetails.id) {
            formErrors.planId = "Loan Date is required.";
            isValid = false;
        }
        if (!formData.amount) {
            formErrors.amount = "Please enter disbursement amount";
            isValid = false;
        }
        if (!formData.loanTerm) {
            formErrors.loanTerm = "Please enter loan term";
            isValid = false;
        }
        if (!formData.memberId) {
            formErrors.memberId = "Please enter member id";
            isValid = false;
        }
        if (!formData.loanDate) {
            formErrors.loanDate = "Loan Date is required.";
            isValid = false;
        }
        if (!formData.firstEmiDate) {
            formErrors.firstEmiDate = "Emi Date is required.";
            isValid = false;
        }
        if (!formData.emiCount || !formData.principleEMI || !formData.interestEMI) {
            setAlert({
                color: 'danger',
                message: 'Please select plan details then Loan Amount',
                autoDismiss: 7,
                place: 'tc',
                display: true,
                sweetAlert: false,
                timestamp: new Date().getTime(),
            });
            isValid = false;
        }

        setCstError(formErrors);
        return isValid;
    };
    // Handle input change for simple fields
    const handleInputChange = (e) => {
        const {name, value} = e.target;
        setFormData({...formData, [name]: value});
    };

    // Handle input change for nested fields
    const handleNestedInputChange = (section, field, value) => {
        setFormData({
            ...formData,
            [section]: {
                ...formData[section],
                [field]: value,
            },
        });
    };

    const handleSubmit = async () => {
        if (validateForm()) {
            try {
                setProgressbar(true);
                const submitData = await axios.post("/api/loan/loan-opening-application", {
                    formData,
                    memberData,
                    accountType: 'group-loan',
                });
                if (submitData.data.success) {
                    setFormData(initInput);
                    setMemberData(initMemberInfo);
                    setAlert({
                        color: 'success',
                        message: submitData.data.success,
                        autoDismiss: 7,
                        place: 'tc',
                        display: true,
                        sweetAlert: true,
                        timestamp: new Date().getTime(),
                    });
                } else {
                    setAlert({
                        color: 'warning',
                        message: submitData.data.error,
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
                    display: true,
                    sweetAlert: false,
                    timestamp: new Date().getTime(),
                });
            }
        } else {
            setAlert({
                color: 'danger',
                message: 'Please fill mandatory details and try again',
                autoDismiss: 7,
                place: 'tc',
                display: true,
                sweetAlert: false,
                timestamp: new Date().getTime(),
            });
        }
    };

    const handlePlanSelect = (plan) => {
        setFormData({
            ...formData,
            planDetails: plan,
        })
    }

    const handleLoanAmount = (amount) => {
        if (formData.planDetails.id) {
            if (parseFloat(amount) <= formData.planDetails.maxAmount) {
                let totalPayment
                let term;
                if (formData.planDetails.emiMode === 'daily') {
                    term = Math.ceil(parseInt(formData.planDetails.emiCount) / 30);
                } else if (formData.planDetails.emiMode === 'weekly') {
                    term = Math.ceil(parseInt(formData.planDetails.emiCount) * 7 / 30);
                } else if (formData.planDetails.emiMode === 'fortnightly') {
                    term = Math.ceil(parseInt(formData.planDetails.emiCount) * 14 / 30);
                } else if (formData.planDetails.emiMode === 'monthly') {
                    term = parseInt(formData.planDetails.emiCount);
                } else if (formData.planDetails.emiMode === 'quarterly') {
                    term = Math.ceil(parseInt(formData.planDetails.emiCount) * 3);
                }

                if (formData.planDetails.calculationMethod === 'REDUCING') {
                    let rate;
                    if (formData.planDetails.emiMode === 'daily') {
                        rate = parseFloat(formData.planDetails.interestRate) / (365 * 100);
                    } else if (formData.planDetails.emiMode === 'weekly') {
                        rate = (parseFloat(formData.planDetails.interestRate) * 7) / (365 * 100);
                    } else if (formData.planDetails.emiMode === 'fortnightly') {
                        rate = (parseFloat(formData.planDetails.interestRate) * 14) / (365 * 100);
                    } else if (formData.planDetails.emiMode === 'quarterly') {
                        rate = (parseFloat(formData.planDetails.interestRate) * 3) / (12 * 100);
                    } else {
                        // (formData.planDetails.emiMode === 'monthly')
                        rate = parseFloat(formData.planDetails.interestRate) / (12 * 100);
                    }
                    const tenure = parseInt(formData.planDetails.emiCount);
                    const principle = parseFloat(amount);

                    // Calculate EMI using reducing balance formula
                    const emi = principle * rate * Math.pow(1 + rate, tenure) / (Math.pow(1 + rate, tenure) - 1);
                    totalPayment = emi * tenure;
                } else {
                    totalPayment = parseFloat(amount) + (parseFloat(amount) * parseInt(term) * parseFloat(formData.planDetails.interestRate)) / (100 * 12);
                }
                const emiAmount = Math.ceil(totalPayment / parseInt(formData.planDetails.emiCount));
                const principleEMI = Math.round(parseFloat(amount) / parseInt(formData.planDetails.emiCount));

                setFormData({
                    ...formData,
                    amount: parseFloat(amount),
                    loanTerm: parseInt(term),
                    emiAmount: emiAmount,
                    emiCount: parseInt(formData.planDetails.emiCount),
                    principleEMI: principleEMI,
                    interestEMI: emiAmount - principleEMI,
                    deductionDetails: {
                        processingFee: (parseFloat(amount) * formData.planDetails.processingFee / 100).toFixed(2),
                        legalAmount: parseFloat(formData.planDetails.legalFee).toFixed(2),
                        insuranceAmount: (parseFloat(amount) * formData.planDetails.insuranceFeeRate / 100).toFixed(2),
                        gst: (parseFloat(amount) * formData.planDetails.gstRate / 100).toFixed(2),
                    }
                });
            } else {
                setAlert({
                    color: 'warning',
                    message: 'Amount should be less than max amount and greater than min amount.',
                    autoDismiss: 7,
                    place: 'tc',
                    display: true,
                    sweetAlert: false,
                    timestamp: new Date().getTime(),
                });
            }
        } else {
            setAlert({
                color: 'warning',
                message: 'Please select a loan plan first.',
                autoDismiss: 7,
                place: 'tc',
                display: true,
                sweetAlert: false,
                timestamp: new Date().getTime(),
            });
        }
    }

    async function getMemberData(memberId) {
        setAlert({...alert, color: 'info', message: '', display: false,});
        if (memberId) {
            try {
                const fetchData = await axios.get(`/api/member/get-member-by-id/${memberId}`);
                if (fetchData.data.success) {
                    setMemberData(fetchData.data);
                    setFormData({
                        ...formData,
                        memberId: fetchData.data.id,
                        memberName: fetchData.data.name,
                        uuid: fetchData.data.uuid,
                    });
                } else {
                    setMemberData(initMemberInfo);
                    // setAlert({
                    //     color: 'warning',
                    //     message: fetchData.data.error,
                    //     autoDismiss: 7,
                    //     place: 'tc',
                    //     display: true,
                    //     sweetAlert: false,
                    //     timestamp: new Date().getTime(),
                    // });
                }
            } catch (e) {
                setMemberData(initMemberInfo);
                setAlert({
                    color: 'danger',
                    message: e.toLocaleString(),
                    autoDismiss: 7,
                    place: 'tc',
                    display: true,
                    sweetAlert: false,
                    timestamp: new Date().getTime(),
                })
            }
        }
    }

    async function groupIdInputHandler(value) {
        const groupId = value.id;
        const fetchDetails = await axios.get(`/api/master/get-mFinanceGroup-for-edit/${groupId}`);
        if (fetchDetails.data.success) {
            const employeeName = value.agentName ? `(${value.agentName})`: ''
            setFormData({...formData, groupId: groupId, groupName: `${fetchDetails.data.details.name} ${employeeName}`});
            const existingMembers = fetchDetails.data.details.existingMembers;
            const membersDropdown = [];
            for (let i = 0; i < existingMembers.length; i++) {
                membersDropdown.push({
                    value: existingMembers[i],
                    label: `${existingMembers[i].id} - ${existingMembers[i].name}`,
                });
            }
            setApplicableKyc(membersDropdown);
        } else {
            setAlert({
                color: 'danger',
                message: fetchDetails.data.error,
                autoDismiss: 7,
                place: 'tc',
                display: true,
                sweetAlert: false,
                timestamp: new Date().getTime(),
            });
        }
    }

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
                <div className={'mb-2'}>
                    {progressbar ? <LinearProgress/> : null}
                </div>
                <Row>
                    <Col md="12">
                        <Card>
                            <CardHeader>
                                <CardTitle tag="h3">Loan Details</CardTitle>
                            </CardHeader>
                            <CardBody>
                                <Row>
                                    <Col md={12}>
                                        <Row className="d-flex flex-wrap">
                                            <Col md="3">
                                                <Label>Loan Date*</Label>
                                                <FormGroup>
                                                    <Input
                                                        type="date"
                                                        name="loanDate"
                                                        value={formData.loanDate}
                                                        onChange={handleInputChange}
                                                    />
                                                    <p style={{color: 'red'}}>{cstError.loanDate}</p>
                                                </FormGroup>
                                            </Col>
                                            <Col md="3">
                                                <Label>Loan Plan Name*</Label>
                                                <Select
                                                    className="react-select info"
                                                    classNamePrefix="react-select"
                                                    name="planSelect"
                                                    onChange={(value) => handlePlanSelect(value)}
                                                    options={planList}
                                                    placeholder="Select an Option"
                                                />
                                                <p style={{color: 'red'}}>{cstError.planId}</p>
                                            </Col>
                                            <Col md="3">
                                                <FormGroup>
                                                    <Label>Loan Name *</Label>
                                                    <Input
                                                        type="text"
                                                        name="name"
                                                        value={formData.planDetails.name}
                                                        readOnly
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md="3">
                                                <FormGroup>
                                                    <Label>Loan Type *</Label>
                                                    <Input
                                                        type="text"
                                                        name="name"
                                                        value={formData.planDetails.type}
                                                        readOnly
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md="3">
                                                <FormGroup>
                                                    <Label>Loan EMI Mode *</Label>
                                                    <Input
                                                        type="text"
                                                        name="name"
                                                        value={formData.planDetails.emiMode}
                                                        readOnly
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md="3">
                                                <FormGroup>
                                                    <Label>Interest Calculation Method</Label>
                                                    <Input
                                                        type="text"
                                                        name="name"
                                                        value={formData.planDetails.calculationMethod}
                                                        readOnly
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md="3">
                                                <FormGroup>
                                                    <Label>Min Age *</Label>
                                                    <Input
                                                        type="number"
                                                        name="minAge"
                                                        value={formData.planDetails.minAge}
                                                        readOnly
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md="3">
                                                <FormGroup>
                                                    <Label>Max Age *</Label>
                                                    <Input
                                                        type="number"
                                                        name="maxAge"
                                                        value={formData.planDetails.maxAge}
                                                        readOnly
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md="3">
                                                <FormGroup>
                                                    <Label>Min Amount *</Label>
                                                    <Input
                                                        type="number"
                                                        name="minAmount"
                                                        value={formData.planDetails.minAmount}
                                                        readOnly
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md="3">
                                                <FormGroup>
                                                    <Label>Max Amount *</Label>
                                                    <Input
                                                        type="number"
                                                        name="maxAmount"
                                                        value={formData.planDetails.maxAmount}
                                                        readOnly
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md="3">
                                                <FormGroup>
                                                    <Label>{`Total Tenure (${formData.planDetails.emiInterval})`}</Label>
                                                    <Input
                                                        type="number"
                                                        name="minTerm"
                                                        value={formData.planDetails.emiCount}
                                                        readOnly
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md="3">
                                                <FormGroup>
                                                    <Label>Interest Rate *</Label>
                                                    <Input
                                                        type="number"
                                                        name="interestRate"
                                                        value={formData.planDetails.interestRate}
                                                        readOnly
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md="3">
                                                <FormGroup>
                                                    <Label>Security Type</Label>
                                                    <Input
                                                        type='text'
                                                        name="security"
                                                        value={formData.planDetails.security}
                                                        readOnly
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>Loan Amount *</Label>
                                                    <Input
                                                        type='text'
                                                        name="security"
                                                        value={formData.amount}
                                                        onChange={(event) => handleLoanAmount(event.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label>EMI Amount *</Label>
                                                    <Input
                                                        type='text'
                                                        name="security"
                                                        value={formData.emiAmount}
                                                        readOnly
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md="3">
                                                <FormGroup>
                                                    <Label>First EMI Date *</Label>
                                                    <Input
                                                      type="date"
                                                      value={formData.firstEmiDate}
                                                      min={new Date().toISOString().slice(0, 10)} // disables past dates
                                                      onChange={(e) => {
                                                          const dateStr = e.target.value; // "YYYY-MM-DD"
                                                          if (dateStr) {
                                                              const selectedDate = new Date(dateStr);
                                                              const today = new Date();
                                                              today.setHours(0, 0, 0, 0);
                                                              selectedDate.setHours(0, 0, 0, 0);

                                                              if (selectedDate <= today) {
                                                                  // Should not happen due to `min`, but extra safety
                                                                  setFormData(prev => ({
                                                                      ...prev,
                                                                      firstEmiDate: "",
                                                                  }));
                                                                  return;
                                                              }

                                                              const day = String(selectedDate.getDate()).padStart(2, '0');
                                                              setFormData(prev => ({
                                                                  ...prev,
                                                                  firstEmiDate: dateStr,
                                                              }));
                                                          } else {
                                                              setFormData(prev => ({
                                                                  ...prev,
                                                                  firstEmiDate: "",
                                                              }));
                                                          }
                                                      }}
                                                    />
                                                </FormGroup>
                                            </Col>
                                        </Row>
                                    </Col>
                                </Row>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
                <Row>
                    <Col md="12">
                        <Card>
                            <CardHeader>
                                <CardTitle tag="h3">Member Details</CardTitle>
                            </CardHeader>
                            <CardBody>
                                <Row>
                                    <Col md={12}>
                                        <Row className="d-flex flex-wrap">
                                            <Col md="3">
                                                <FormGroup>
                                                    <Label>Select a Group</Label>
                                                    <Select
                                                        className="react-select info"
                                                        classNamePrefix="react-select"
                                                        name="groupSelect"
                                                        onChange={groupIdInputHandler}
                                                        options={groupList}
                                                        placeholder="Select an Option"
                                                    />
                                                    <p style={{color: 'red'}}>{cstError.groupId}</p>
                                                </FormGroup>
                                            </Col>
                                            <Col md="3">
                                                <FormGroup>
                                                    <Label>Group Name</Label>
                                                    <Input
                                                        type="text"
                                                        name="groupName"
                                                        value={formData.groupName}
                                                        readOnly={true}
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md={3}>
                                                <Label>Select a Member</Label>
                                                <FormGroup>
                                                    <Select
                                                        className="react-select info"
                                                        classNamePrefix="react-select"
                                                        name="memberSelect"
                                                        onChange={(value) => getMemberData(value.value.id)}
                                                        options={applicableKyc}
                                                        placeholder="Select an Option"
                                                    />
                                                    <p style={{color: 'red'}}>{cstError.referrer}</p>
                                                </FormGroup>
                                            </Col>
                                            <Col className="pr-1" md="3">
                                                <Label>Member Name</Label>
                                                <FormGroup>
                                                    <Input type={'text'} value={memberData.name} readOnly={true}/>
                                                </FormGroup>
                                            </Col>
                                            <Col className="pr-1" md="3">
                                                <Label>Father/Mother/Spouse</Label>
                                                <FormGroup>
                                                    <Input type={'text'} value={memberData.guardian} readOnly={true}/>
                                                </FormGroup>
                                            </Col>
                                            <Col className="pr-1" md="3">
                                                <Label>Gender</Label>
                                                <Input type={'text'} value={memberData.gender} readOnly={true}/>
                                            </Col>
                                            <Col className="pr-1" md="3">
                                                <Label>Registration Date</Label>
                                                <FormGroup>
                                                    <Input type={'date'} value={memberData.date} readOnly={true}/>
                                                </FormGroup>
                                            </Col>
                                            <Col className="pr-1" md="3">
                                                <Label>Date of Birth</Label>
                                                <FormGroup>
                                                    <Input type={'date'} value={memberData.dob} readOnly={true}/>
                                                </FormGroup>
                                            </Col>
                                            <Col className="pr-1" md={'3'}>
                                                <Label>Material Status</Label>
                                                <Input type="text" name="select" id="materialSelect"
                                                       value={memberData.materialStatus} readOnly={true}/>
                                            </Col>
                                            <Col className="pr-1" md={'3'}>
                                                <Label>Phone Number</Label>
                                                <FormGroup>
                                                    <Input type={'text'} value={memberData.phone} readOnly={true}/>
                                                </FormGroup>
                                            </Col>
                                            <Col className="pr-1" md={'3'}>
                                                <Label>Email</Label>
                                                <FormGroup>
                                                    <Input type={'email'} value={memberData.email} readOnly={true}/>
                                                </FormGroup>
                                            </Col>
                                            <Col className="pr-1" md={'3'}>
                                                <Label>Aadhar Number</Label>
                                                <FormGroup>
                                                    <Input type={'text'} value={memberData.aadhar} readOnly={true}/>
                                                </FormGroup>
                                            </Col>
                                            <Col className="pr-1" md={'3'}>
                                                <Label>Voter Number</Label>
                                                <FormGroup>
                                                    <Input type={'text'} value={memberData.voter} readOnly={true}/>
                                                </FormGroup>
                                            </Col>
                                            <Col className="pr-1" md={'3'}>
                                                <Label>PAN Number</Label>
                                                <FormGroup>
                                                    <Input type={'text'} value={memberData.pan} readOnly={true}/>
                                                </FormGroup>
                                            </Col>
                                            <Col className="pr-1" md={'3'}>
                                                <Label>Monthly Income</Label>
                                                <FormGroup>
                                                    <Input type={'number'} value={memberData.income} readOnly={true}/>
                                                </FormGroup>
                                            </Col>
                                            <Col className="pr-1" md={'3'}>
                                                <Label>Occupation</Label>
                                                <FormGroup>
                                                    <Input type={'text'} value={memberData.occupation} readOnly={true}/>
                                                </FormGroup>
                                            </Col>
                                            <Col className="pr-1" md={'3'}>
                                                <Label>Educational Qualification</Label>
                                                <FormGroup>
                                                    <Input type={'text'} value={memberData.education} readOnly={true}/>
                                                </FormGroup>
                                            </Col>
                                            <Col className="pr-1" md={'12'}>
                                                <Label>Full Address with Pin Code</Label>
                                                <FormGroup>
                                                    <Input type={'textarea'} value={memberData.address} aria-colspan={3}
                                                           readOnly={true}/>
                                                </FormGroup>
                                            </Col>
                                        </Row>
                                    </Col>
                                </Row>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
                <Row>
                    <Col>
                        <Card>
                            <CardHeader>
                                <CardTitle tag="h3">Photo Upload </CardTitle>
                            </CardHeader>
                            <CardBody>
                                <Row>
                                    <Col md="4" className={'text-center'}>
                                        <ProfileImageUpload
                                            id={'profile'}
                                            uuid={formData.uuid}
                                            bankId={authStatus.bankId}
                                            changeBtnClasses="btn-simple"
                                            addBtnClasses="btn-simple"
                                            removeBtnClasses="btn-simple"
                                        />
                                        <p className="mt-2">Upload the profile photo here.</p>
                                    </Col>
                                    <Col md="4" className={'text-center'}>
                                        <ProfileImageUpload
                                            id={'profile-joint'}
                                            uuid={formData.uuid}
                                            bankId={authStatus.bankId}
                                            changeBtnClasses="btn-simple"
                                            addBtnClasses="btn-simple"
                                            removeBtnClasses="btn-simple"
                                        />
                                        <p className="mt-2">Upload the joint photo
                                            here.</p> {/* Text under the second upload field */}
                                    </Col>
                                    <Col md="4" className={'text-center'}>
                                        <ProfileImageUpload
                                            id={'signature'}
                                            uuid={formData.uuid}
                                            bankId={authStatus.bankId}
                                            changeBtnClasses="btn-simple"
                                            addBtnClasses="btn-simple"
                                            removeBtnClasses="btn-simple"
                                        />
                                        <p className="mt-2">Upload the Signature
                                            here.</p> {/* Text under the third upload field */}
                                    </Col>
                                </Row>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
                {/*Guarantor Details*/}
                <Row>
                    <Col md="12">
                        <Card>
                            <CardHeader>
                                <CardTitle tag="h3">Guarantor Details</CardTitle>
                            </CardHeader>
                            <CardBody>
                                <Form>
                                    <Row>
                                        <Col md="3">
                                            <Label>Member Code</Label>
                                            <FormGroup>
                                                <Input
                                                    type="text"
                                                    name="memberCode"
                                                    value={formData.guarantor.memberCode}
                                                    onChange={(e) => handleNestedInputChange('guarantor', 'memberCode', e.target.value)}
                                                />
                                                <p style={{color: 'red'}}>{cstError.guarantor?.memberCode}</p>
                                            </FormGroup>
                                        </Col>

                                        <Col md="3">
                                            <Label>Guarantor Name</Label>
                                            <FormGroup>
                                                <Input
                                                    type="text"
                                                    name="guarantorName"
                                                    value={formData.guarantor.guarantorName}
                                                    onChange={(e) => handleNestedInputChange('guarantor', 'guarantorName', e.target.value)}
                                                />
                                                <p style={{color: 'red'}}>{cstError.guarantor?.guarantorName}</p>
                                            </FormGroup>
                                        </Col>

                                        <Col md="3">
                                            <Label>Address</Label>
                                            <FormGroup>
                                                <Input
                                                    type="text"
                                                    name="address"
                                                    value={formData.guarantor.address}
                                                    onChange={(e) => handleNestedInputChange('guarantor', 'address', e.target.value)}
                                                />
                                                <p style={{color: 'red'}}>{cstError.guarantor?.address}</p>
                                            </FormGroup>
                                        </Col>

                                        <Col md="3">
                                            <Label>Pin Code</Label>
                                            <FormGroup>
                                                <Input
                                                    type="number"
                                                    name="pinCode"
                                                    value={formData.guarantor.pinCode}
                                                    onChange={(e) => handleNestedInputChange('guarantor', 'pinCode', e.target.value)}
                                                />
                                                <p style={{color: 'red'}}>{cstError.guarantor?.pinCode}</p>
                                            </FormGroup>
                                        </Col>

                                        <Col md="3">
                                            <Label>Phone</Label>
                                            <FormGroup>
                                                <Input
                                                    type="number"
                                                    name="phone"
                                                    value={formData.guarantor.phone}
                                                    onChange={(e) => handleNestedInputChange('guarantor', 'phone', e.target.value)}
                                                />
                                                <p style={{color: 'red'}}>{cstError.guarantor?.phone}</p>
                                            </FormGroup>
                                        </Col>

                                        <Col md="3">
                                            <Label>Security Type</Label>
                                            <FormGroup>
                                                <Input
                                                    type="text"
                                                    name="securityType"
                                                    value={formData.guarantor.securityType}
                                                    onChange={(e) => handleNestedInputChange('guarantor', 'securityType', e.target.value)}
                                                />
                                                <p style={{color: 'red'}}>{cstError.guarantor?.securityType}</p>
                                            </FormGroup>
                                        </Col>

                                    </Row>
                                </Form>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
                {/*Co-Applicant Details*/}
                <Row>
                    <Col md="12">
                        <Card>
                            <CardHeader>
                                <CardTitle tag="h3">Co-Applicant Details</CardTitle>
                            </CardHeader>
                            <CardBody>
                                <Form>
                                    <Row>
                                        <Col md="3">
                                            <Label>Member Code</Label>
                                            <FormGroup>
                                                <Input
                                                    type="text"
                                                    name="memberCode"
                                                    value={formData.coApplicant.memberCode}
                                                    onChange={(e) => handleNestedInputChange('coApplicant', 'memberCode', e.target.value)}
                                                />
                                                <p style={{color: 'red'}}>{cstError.coApplicant?.memberCode}</p>
                                            </FormGroup>
                                        </Col>

                                        <Col md="3">
                                            <Label>Co-Applicant Name</Label>
                                            <FormGroup>
                                                <Input
                                                    type="text"
                                                    name="coApplicantname"
                                                    value={formData.coApplicant.coApplicantname}
                                                    onChange={(e) => handleNestedInputChange('coApplicant', 'coApplicantname', e.target.value)}
                                                />
                                                <p style={{color: 'red'}}>{cstError.coApplicant?.coApplicantname}</p>
                                            </FormGroup>
                                        </Col>

                                        <Col md="3">
                                            <Label>Address</Label>
                                            <FormGroup>
                                                <Input
                                                    type="text"
                                                    name="address"
                                                    value={formData.coApplicant.address}
                                                    onChange={(e) => handleNestedInputChange('coApplicant', 'address', e.target.value)}
                                                />
                                                <p style={{color: 'red'}}>{cstError.coApplicant?.address}</p>
                                            </FormGroup>
                                        </Col>

                                        <Col md="3">
                                            <Label>Pin Code</Label>
                                            <FormGroup>
                                                <Input
                                                    type="number"
                                                    name="pinCode"
                                                    value={formData.coApplicant.pinCode}
                                                    onChange={(e) => handleNestedInputChange('coApplicant', 'pinCode', e.target.value)}
                                                />
                                                <p style={{color: 'red'}}>{cstError.coApplicant?.pinCode}</p>
                                            </FormGroup>
                                        </Col>

                                        <Col md="3">
                                            <Label>Phone</Label>
                                            <FormGroup>
                                                <Input
                                                    type="number"
                                                    name="phone"
                                                    value={formData.coApplicant.phone}
                                                    onChange={(e) => handleNestedInputChange('coApplicant', 'phone', e.target.value)}
                                                />
                                                <p style={{color: 'red'}}>{cstError.coApplicant?.phone}</p>
                                            </FormGroup>
                                        </Col>

                                        <Col md="3">
                                            <Label>Security Details</Label>
                                            <FormGroup>
                                                <Input
                                                    type="text"
                                                    name="securityDetails"
                                                    value={formData.coApplicant.securityDetails}
                                                    onChange={(e) => handleNestedInputChange('coApplicant', 'securityDetails', e.target.value)}
                                                />
                                                <p style={{color: 'red'}}>{cstError.coApplicant?.securityDetails}</p>
                                            </FormGroup>
                                        </Col>

                                    </Row>
                                </Form>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>

                {/*Deduction Details*/}
                <Row>
                    <Col md="12">
                        <Card>
                            <CardHeader>
                                <CardTitle tag="h3">Deduction Details</CardTitle>
                            </CardHeader>
                            <CardBody>
                                <Form>
                                    <Row>
                                        <Col md="3">
                                            <Label>Processing Fee</Label>
                                            <FormGroup>
                                                <Input
                                                    type="number"
                                                    name="processingFee"
                                                    value={formData.deductionDetails.processingFee}
                                                    onChange={(e) => handleNestedInputChange('deductionDetails', 'processingFee', e.target.value)}
                                                />
                                                <p style={{color: 'red'}}>{cstError.deductionDetails?.processingFee}</p>
                                            </FormGroup>
                                        </Col>

                                        <Col md="3">
                                            <Label>Legal Amount</Label>
                                            <FormGroup>
                                                <Input
                                                    type="number"
                                                    name="legalAmount"
                                                    value={formData.deductionDetails.legalAmount}
                                                    onChange={(e) => handleNestedInputChange('deductionDetails', 'legalAmount', e.target.value)}
                                                />
                                                <p style={{color: 'red'}}>{cstError.deductionDetails?.legalAmount}</p>
                                            </FormGroup>
                                        </Col>
                                        <Col md="3">
                                            <Label>GST</Label>
                                            <FormGroup>
                                                <Input
                                                    type="text"
                                                    name="gst"
                                                    value={formData.deductionDetails.gst}
                                                    onChange={(e) => handleNestedInputChange('deductionDetails', 'gst', e.target.value)}
                                                />
                                                <p style={{color: 'red'}}>{cstError.deductionDetails?.gst}</p>
                                            </FormGroup>
                                        </Col>
                                        <Col md="3">
                                            <Label>Insurance Amount</Label>
                                            <FormGroup>
                                                <Input
                                                    type="number"
                                                    name="insuranceAmount"
                                                    value={formData.deductionDetails.insuranceAmount}
                                                    onChange={(e) => handleNestedInputChange('deductionDetails', 'insuranceAmount', e.target.value)}
                                                />
                                                <p style={{color: 'red'}}>{cstError.deductionDetails?.insuranceAmount}</p>
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                </Form>
                            </CardBody>
                            <Col md="12" className={'text-center'}>
                                <CardFooter>
                                    <center>
                                        <Spinner color="info" hidden={!progressbar}/>
                                    </center>
                                    <Button className="btn-fill" color="info" type="button" onClick={handleSubmit}>
                                        Submit
                                    </Button>
                                </CardFooter>
                            </Col>
                        </Card>
                    </Col>
                </Row>
            </div>
        </>
    );
};

export default LoanOpeningForm;


