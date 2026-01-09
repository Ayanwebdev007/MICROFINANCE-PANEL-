import React from "react";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  CardFooter,
  FormGroup,
  Form,
  Input,
  Row,
  Col,
  Spinner,
  Label,
} from "reactstrap";
import ProfileImageUpload from "../../components/ProfileImageUpload";
import axios from "axios";
import CstNotification from "../../components/CstNotification";
import ReactBSAlert from "react-bootstrap-sweetalert";
import {useSelector} from "react-redux";
import './PaymentRemarksForm.css'
import Select from "react-select";
import { useLocation } from 'react-router-dom';

const AccountOpening = () => {
  const location = useLocation();

  React.useEffect(() => {
    const { memberId } = location.state || {};
    if (memberId) {
      const fakeEvent = { target: { value: memberId } };
      getMemberData(fakeEvent);
    }
  }, [location.state]);
  const initialState = {
    openingDate: new Date().toISOString().slice(0, 10),
    memberId: "",
    memberName: "",
    modeOfOperation: "Single",
    jointSurvivorCode: "",
    jointSurvivorName: "",
    relation: "brother",
    accountType: "",
    amount: 0,
    openingFees: 0,
    paymentMethod: "cash",
    remarks: "",
    accountStatus: true,
    smsSend: true,
    debitCardIssue: false,
    uuid: '#',
    termPeriod: 0,
    interestRate: 0.0,
    maturityDate: new Date().toISOString().slice(0, 10),
    maturityAmount: 0,
    planDetails: {
      schemeName: "",
      schemeCode: "",
      minRdDdAmount: "",
      annualInterestRate: "",
      bonusRateType: "%",
      bonusRateValue: "0.0",
      rdDdFrequency: "",
      srCitizenAddonRate: "",
      interestCompoundingInterval: "",
      rdDdLockInPeriod: "",
      interestLockInPeriod: "",
      tenureOfRdDdUnit: "MONTHS",
      tenureOfRdDdValue: "",
      typeOfScheme: "",
      cancellationChargesType: "FIXED",
      cancellationChargesValue: "",
      stationaryCharges: "",
      penaltyChargesType: "%",
      penaltyChargesValue: "0.0%",
      penalCharge: "",
    }
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
  const [formData, setFormData] = React.useState(initialState);
  const [cstError, setCstError] = React.useState({
    openingDate: '',
    memberId: '',
    memberName: '',
    modeOfOperation: '',
    accountType: '',
    paymentMethod: '',
  });
  const [progressbar, setProgressbar] = React.useState(false);
  const [alert, setAlert] = React.useState({
    color: 'success',
    message: 'test message',
    autoDismiss: 7,
    place: 'tc',
    display: false,
    sweetAlert: false,
    timestamp: new Date().toISOString(),
  });
  const authStatus = useSelector((state) => state.auth.authState);
  const [memberData, setMemberData] = React.useState(initMemberInfo);
  const [planList, setPlanList] = React.useState([]);
  React.useEffect(() => {
    console.log('fetched account list');
    fetchPlanList();
  }, []);

  const fetchPlanList = async () => {
    try {
      const response = await axios.get("/api/loan/get-plans/deposit");
      if (response.data.success && response.data.plans.length > 0) {
        const formattedPlans = response.data.plans
            .filter(plan => plan.schemeName && plan.schemeCode)
            .map(plan => ({
              value: plan.id || plan.schemeCode,
              label: `${plan.schemeName} (${plan.schemeCode})`,
              ...plan
            }));
        setPlanList(formattedPlans);
      } else {
        setAlert({
          color: "warning",
          message: "No plans found.",
          autoDismiss: 7,
          place: "tc",
          display: true,
          sweetAlert: false,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      setAlert({
        color: "danger",
        message: error.toString(),
        autoDismiss: 7,
        place: "tc",
        display: true,
        sweetAlert: false,
        timestamp: new Date().toISOString(),
      });
    }
  };


  const validateForm = () => {
    let formErrors = {};
    let isValid = true;
    if (!formData.openingDate) {
      formErrors.openingDate = "Opening Date is required.";
      isValid = false;
    }
    if (!formData.memberId) {
      formErrors.memberId = "This field is required.";
      isValid = false;
    }
    if (!formData.modeOfOperation) {
      formErrors.modeOfOperation = "This Field is required.";
      isValid = false;
    }
    if (!formData.accountType) {
      formErrors.accountType = "This Field is required.";
      isValid = false;
    }
    if (formData.amount && !formData.paymentMethod) {
      formErrors.paymentMethod = "Select Payment Method.";
      isValid = false;
    }
    setCstError(formErrors);
    if (!isValid){
      setAlert({
        color: "warning",
        message: "Please provide all required field value to continue",
        autoDismiss: 7,
        place: "tc",
        display: true,
        sweetAlert: false,
        timestamp: new Date().toISOString(),
      });
    }
    return isValid;
  };

  const handleInputChange = (e) => {
    const {name, value, type, checked} = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };
  const handleToggleChange = (field) => {
    setFormData({...formData, [field]: !formData[field]});
  };

  const handleSubmit = async () => {
    setAlert({...alert, color: 'info', message: '', display: false,});
    if (validateForm()) {
      try {
        setProgressbar(true);
        const submitData = await axios.post("/api/deposit/account-opening", formData);
        if (submitData.data.success) {
          setFormData(initialState);
          setMemberData(initMemberInfo);
          setAlert({
            color: 'success',
            message: submitData.data.success,
            autoDismiss: 7,
            place: 'tc',
            display: true,
            sweetAlert: true,
            timestamp: new Date().toISOString(),
          });
        } else {
          setAlert({
            color: 'warning',
            message: submitData.data.error,
            autoDismiss: 7,
            place: 'tc',
            display: true,
            sweetAlert: false,
            timestamp: new Date().toISOString(),
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
          timestamp: new Date().toISOString(),
        });
      }
    }
  };

  function handelOnchange(event){
    setFormData({...formData, memberId: event.target.value});
  }
  async function getMemberData(event) {
    event.preventDefault();
    setAlert({...alert, color: 'info', message: '', display: false,});

      if (formData.memberId) {
        try {
          const fetchData = await axios.get(`/api/member/get-member-by-id/${formData.memberId}`);
          if (fetchData.data.success) {
            setMemberData(fetchData.data);
            setFormData({
              ...formData,
              memberId: fetchData.data.id,
              memberName: fetchData.data.name,
              uuid: fetchData.data.uuid,
            });
            setAlert({
              color: 'success',
              message: fetchData.data.success,
              autoDismiss: 7,
              place: 'tc',
              display: true,
              sweetAlert: false,
              timestamp: new Date().toISOString(),
            });
          }else {
            setMemberData(initMemberInfo);
            setAlert({
              color: 'warning',
              message: fetchData.data.error,
              autoDismiss: 7,
              place: 'tc',
              display: true,
              sweetAlert: false,
              timestamp: new Date().getTime(),
            });
          }
        } catch (e) {
          setMemberData(initMemberInfo);
          console.log(e);
          setAlert({
            color: 'danger',
            message: e.toLocaleString(),
            autoDismiss: 7,
            place: 'tc',
            display: true,
            sweetAlert: false,
            timestamp: new Date().toISOString(),
          })
        }
      }
  }
  const handlePlanSelect = (selectedOption) => {
    if (!selectedOption) {
      setFormData({
        ...formData,
        schemeName: "",
        schemeCode: "",
        minRdDdAmount: "",
        annualInterestRate: "",
        bonusRateType: "%",
        bonusRateValue: "0.0",
        rdDdFrequency: "",
        srCitizenAddonRate: "",
        interestCompoundingInterval: "",
        rdDdLockInPeriod: "",
        interestLockInPeriod: "",
        tenureOfRdDdUnit: "MONTHS",
        tenureOfRdDdValue: "",
        typeOfScheme: "",
        cancellationChargesType: "FIXED",
        cancellationChargesValue: "",
        stationaryCharges: "",
        penaltyChargesType: "%",
        penaltyChargesValue: "0.0%",
        penalCharge: "",
      });
      return;
    }

    setFormData({
      ...formData,
      planDetails: {
        schemeName: selectedOption.schemeName || "",
        schemeCode: selectedOption.schemeCode || "",
        minRdDdAmount: selectedOption.minRdDdAmount || "",
        annualInterestRate: selectedOption.annualInterestRate || "",
        bonusRateType: selectedOption.bonusRateType || "%",
        bonusRateValue: selectedOption.bonusRateValue || "0.0",
        rdDdFrequency: selectedOption.rdDdFrequency || "",
        srCitizenAddonRate: selectedOption.srCitizenAddonRate || "",
        interestCompoundingInterval: selectedOption.interestCompoundingInterval || "",
        rdDdLockInPeriod: selectedOption.rdDdLockInPeriod || "",
        interestLockInPeriod: selectedOption.interestLockInPeriod || "",
        tenureOfRdDdUnit: selectedOption.tenureOfRdDdUnit || "MONTHS",
        tenureOfRdDdValue: selectedOption.tenureOfRdDdValue || "",
        typeOfScheme: selectedOption.typeOfScheme || "",
        cancellationChargesType: selectedOption.cancellationChargesType || "FIXED",
        cancellationChargesValue: selectedOption.cancellationChargesValue || "",
        stationaryCharges: selectedOption.stationaryCharges || "",
        penaltyChargesType: selectedOption.penaltyChargesType || "%",
        penaltyChargesValue: selectedOption.penaltyChargesValue || "0.0%",
        penalCharge: selectedOption.penalCharge || "",
      },
    });
  };

  return (
      <>
        <div className="rna-container">
          {alert.display && <CstNotification color={alert.color} message={alert.message} autoDismiss={alert.autoDismiss} place={alert.place} timestamp={alert.timestamp}/>}
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
                  <CardTitle tag="h3">Basic Details</CardTitle>
                </CardHeader>
                <CardBody>
                  <Row>
                    <Col md={12}>
                      <Row className="d-flex flex-wrap">
                        <Col md="3">
                          <Label>Opening Date</Label>
                          <FormGroup>
                            <Input
                                type="date"
                                name="openingDate"
                                value={formData.openingDate}
                                onChange={handleInputChange}
                            />
                            <p style={{color: 'red'}}>{cstError.openingDate}</p>
                          </FormGroup>
                        </Col>
                        <Col md="3">
                          <FormGroup>
                            <Label>Account Type</Label>
                            <Input type="select" name="accountType" id="accountType"
                                   onChange={handleInputChange}
                            >
                              <option value={''}>Select an Account Type</option>
                              <option value={'recurring-deposit'}>Recurring Deposit</option>
                              <option value={'daily-savings'}>Daily Savings/Home Savings</option>
                              <option value={'thrift-fund'}>Thrift Fund</option>
                            </Input>
                            <p style={{color: 'red'}}>{cstError.accountType}</p>
                          </FormGroup>
                        </Col>
                        <Col md="3">
                          <FormGroup>
                            <Label>Deposit Amount</Label>
                            <Input
                                type="number"
                                name="amount"
                                value={formData.amount}
                                onChange={handleInputChange}
                            />
                          </FormGroup>
                        </Col>
                        <Col md="3">
                          <FormGroup>
                            <Label>Opening Fees</Label>
                            <Input
                                type="number"
                                name="openingFees"
                                value={formData.openingFees}
                                onChange={handleInputChange}
                            />
                            <p style={{color: 'red'}}>{cstError.openingFees}</p>
                          </FormGroup>
                        </Col>
                        <Col md="3">
                          <FormGroup>
                            <Label>Mode Of Operation</Label>
                            <Input
                                type="select"
                                name="modeOfOperation" id='modeOfOperation'
                                value={formData.modeOfOperation}
                                onChange={handleInputChange}
                            >
                              <option value={'single'}>Single</option>
                              <option value={'joint'}>Joint</option>
                              <option value={'survivor'}>Survivor</option>
                            </Input>
                            <p style={{color: 'red'}}>{cstError.modeOfOperation}</p>
                          </FormGroup>
                        </Col>
                        <Col md="3">
                          <FormGroup>
                            <Label>Joint/Survivor Code</Label>
                            <Input
                                type="text"
                                name="jointSurvivorCode"
                                value={formData.jointSurvivorCode}
                                onChange={handleInputChange}
                            />
                            <p style={{color: 'red'}}>{cstError.jointSurvivorCode}</p>
                          </FormGroup>
                        </Col>
                        <Col md="3">
                          <FormGroup>
                            <Label>Joint/Survivor Name</Label>
                            <Input
                                type="text"
                                name="jointSurvivorName"
                                value={formData.jointSurvivorName}
                                onChange={handleInputChange}
                            />
                            <p style={{color: 'red'}}>{cstError.jointSurvivorName}</p>
                          </FormGroup>
                        </Col>
                        <Col md="3">
                          <FormGroup>
                            <Label>Relation</Label>
                            <Input
                                type="select"
                                name="relation" id="relation"
                                value={formData.relation}
                                onChange={handleInputChange}
                            >
                              <option value={'brother'}>Brother</option>
                              <option value={'daughter'}>Daughter</option>
                              <option value={'father'}>father</option>
                              <option value={'friend'}>Friend</option>
                              <option value={'husband'}>Husband</option>
                              <option value={'mother'}>Mother</option>
                              <option value={'sister'}>Sister</option>
                              <option value={'son'}>Son</option>
                              <option value={'wife'}>Wife</option>
                              <option value={'daughterInLaw'}>Daughter In Law</option>
                              <option value={'brotherInlAw'}>Brother In Law</option>
                              <option value={'grandDaughter'}>Grand Daughter</option>
                              <option value={'grandSon'}>Grand Son</option>
                              <option value={'other'}>Other</option>
                            </Input>
                            <p style={{color: 'red'}}>{cstError.relation}</p>
                          </FormGroup>
                        </Col>
                      </Row>
                    </Col>
                  </Row>
                </CardBody>
              </Card>
            </Col>
          </Row>
          {/*{(['cash-certificate', 'fixed-deposit', 'recurring-deposit'].includes(formData.accountType)) && <Row>*/}
          {/*  <Col md="12">*/}
          {/*    <Card>*/}
          {/*      <CardHeader>*/}
          {/*        <CardTitle tag="h3">Term Details</CardTitle>*/}
          {/*      </CardHeader>*/}
          {/*      <CardBody>*/}
          {/*        <Row>*/}
          {/*          <Col md="3">*/}
          {/*            <FormGroup>*/}
          {/*              <Label>Term Period (Month)</Label>*/}
          {/*              <Input*/}
          {/*                type="number"*/}
          {/*                name="termPeriod"*/}
          {/*                value={formData.termPeriod}*/}
          {/*                onChange={(e) => calculateMaturity('termPeriod', parseInt(e.target.value))}*/}
          {/*              />*/}
          {/*              <p style={{color: 'red'}}>{cstError.termPeriod}</p>*/}
          {/*            </FormGroup>*/}
          {/*          </Col>*/}
          {/*          <Col md="3">*/}
          {/*            <FormGroup>*/}
          {/*              <Label>Interest Rate</Label>*/}
          {/*              <Input*/}
          {/*                type="number"*/}
          {/*                step="0.01"*/}
          {/*                name="interestRate"*/}
          {/*                value={formData.interestRate}*/}
          {/*                onChange={(e) => calculateMaturity('interestRate', parseFloat(e.target.value))}*/}
          {/*              />*/}
          {/*              <p style={{color: 'red'}}>{cstError.interestRate}</p>*/}
          {/*            </FormGroup>*/}
          {/*          </Col>*/}
          {/*          <Col md="3">*/}
          {/*            <FormGroup>*/}
          {/*              <Label>Maturity Amount</Label>*/}
          {/*              <Input*/}
          {/*                type="number"*/}
          {/*                name="maturityAmount"*/}
          {/*                value={formData.maturityAmount}*/}
          {/*              />*/}
          {/*            </FormGroup>*/}
          {/*          </Col>*/}
          {/*          <Col md="3">*/}
          {/*            <FormGroup>*/}
          {/*              <Label>Maturity Date</Label>*/}
          {/*              <Input*/}
          {/*                type="date"*/}
          {/*                name="maturityDate"*/}
          {/*                value={formData.maturityDate}*/}
          {/*              />*/}
          {/*            </FormGroup>*/}
          {/*          </Col>*/}
          {/*        </Row>*/}
          {/*      </CardBody>*/}
          {/*    </Card>*/}
          {/*  </Col>*/}
          {/*</Row>}*/}
          <Row>
            <Col md="12">
              <Card>
                <CardHeader><CardTitle tag="h3">Scheme Details</CardTitle></CardHeader>
                <CardBody>
                  <Row>
                    <Col md="3">
                      <FormGroup>
                        <Label>Scheme Name</Label>
                        <Select
                            className="react-select info"
                            classNamePrefix="react-select"
                            options={planList}
                            getOptionLabel={(option) => option.schemeName}
                            getOptionValue={(option) => option.schemeCode}
                            onChange={handlePlanSelect}
                            placeholder="Select a Scheme"
                        />
                      </FormGroup>
                    </Col>
                    <Col md="3">
                      <FormGroup><Label>Scheme Code</Label><Input value={formData.planDetails.schemeCode} readOnly /></FormGroup>
                    </Col>
                    <Col md="3">
                      <FormGroup><Label>Min RD/DD Amount</Label><Input value={formData.planDetails.minRdDdAmount} readOnly /></FormGroup>
                    </Col>
                    <Col md="3">
                      <FormGroup><Label>Annual Interest Rate (%)</Label><Input value={formData.planDetails.annualInterestRate} readOnly /></FormGroup>
                    </Col>
                    <Col md="3">
                      <FormGroup><Label>Bonus Rate Type</Label><Input value={formData.planDetails.bonusRateType} readOnly /></FormGroup>
                    </Col>
                    <Col md="3">
                      <FormGroup><Label>Bonus Rate Value</Label><Input value={formData.planDetails.bonusRateValue} readOnly /></FormGroup>
                    </Col>
                    <Col md="3">
                      <FormGroup><Label>RDD Frequency</Label><Input value={formData.planDetails.rdDdFrequency} readOnly /></FormGroup>
                    </Col>
                    <Col md="3">
                      <FormGroup><Label>Senior Citizen Add-on Rate</Label><Input value={formData.planDetails.srCitizenAddonRate} readOnly /></FormGroup>
                    </Col>
                    <Col md="3">
                      <FormGroup><Label>Interest Compounding Interval</Label><Input value={formData.planDetails.interestCompoundingInterval} readOnly /></FormGroup>
                    </Col>
                    <Col md="3">
                      <FormGroup><Label>RDD Lock-In Period</Label><Input value={formData.planDetails.rdDdLockInPeriod} readOnly /></FormGroup>
                    </Col>
                    <Col md="3">
                      <FormGroup><Label>Interest Lock-In Period</Label><Input value={formData.planDetails.interestLockInPeriod} readOnly /></FormGroup>
                    </Col>
                    <Col md="3">
                      <FormGroup><Label>Tenure Unit</Label><Input value={formData.planDetails.tenureOfRdDdUnit} readOnly /></FormGroup>
                    </Col>
                    <Col md="3">
                      <FormGroup><Label>Tenure Value</Label><Input value={formData.planDetails.tenureOfRdDdValue} readOnly /></FormGroup>
                    </Col>
                    <Col md="3">
                      <FormGroup><Label>Type of Scheme</Label><Input value={formData.planDetails.typeOfScheme} readOnly /></FormGroup>
                    </Col>
                    <Col md="3">
                      <FormGroup><Label>Cancellation Charges Type</Label><Input value={formData.planDetails.cancellationChargesType} readOnly /></FormGroup>
                    </Col>
                    <Col md="3">
                      <FormGroup><Label>Cancellation Charges Value</Label><Input value={formData.planDetails.cancellationChargesValue} readOnly /></FormGroup>
                    </Col>
                    <Col md="3">
                      <FormGroup><Label>Stationary Charges</Label><Input value={formData.planDetails.stationaryCharges} readOnly /></FormGroup>
                    </Col>
                    <Col md="3">
                      <FormGroup><Label>Penalty Charges Type</Label><Input value={formData.planDetails.penaltyChargesType} readOnly /></FormGroup>
                    </Col>
                    <Col md="3">
                      <FormGroup><Label>Penalty Charges Value</Label><Input value={formData.planDetails.penaltyChargesValue} readOnly /></FormGroup>
                    </Col>
                    <Col md="3">
                      <FormGroup><Label>Penal Charge</Label><Input value={formData.planDetails.penalCharge} readOnly /></FormGroup>
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
                            <form onSubmit={getMemberData}>
                            <Label>Member ID</Label>
                              <div className="d-flex" >
                            <Input
                                type="text"
                                name="memberId"
                                value={formData.memberId}
                                onChange={handelOnchange}
                            />
                                <div className={"d-flex align-items-center h-auto"}>
                                  <button
                                      type="submit"
                                      className="pill-btn "
                                      style={{
                                        marginLeft: "-55px",
                                        background:"#5e72e4",
                                        width: "50px",
                                        borderRadius: "7px",
                                        border: "2px solid #5e72e4",
                                        color: "white",
                                        fontWeight: "bold",
                                      }}
                                  >
                                    →
                                  </button>
                                </div>
                              </div>
                            </form>
                            <p style={{color: 'red'}}>{cstError.memberId}</p>
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
                            <Input type={'text'} value={memberData.guardian} readOnly={true} />
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
                          <Input type="text" name="select" id="materialSelect" value={memberData.materialStatus} readOnly={true}/>
                        </Col>
                        <Col className="pr-1" md={'3'}>
                          <Label>Phone Number</Label>
                          <FormGroup>
                            <Input type={'text'} value={memberData.phone} readOnly={true} />
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
                            <Input type={'textarea'} value={memberData.address} aria-colspan={3} readOnly={true}/>
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
          <Row>
            <Col>
              <Card>
                <CardHeader>
                  <CardTitle tag="h3">Payment Setup</CardTitle>
                </CardHeader>
                <CardBody>
                  <Form>
                    <Row className="d-flex justify-content-between">
                      {/* Left Side: Payment By and Remarks */}
                      <Col md="6">
                        <FormGroup>
                          <Label for="paymentBy">Payment By <span className="text-danger">*</span></Label>
                          <Input
                              type="select"
                              name="paymentBy"
                              id="paymentBy"
                              value={formData.paymentMethod}
                              onChange={(e) =>
                                  setFormData({...formData, paymentMethod: e.target.value})
                              }
                          >
                            <option value="cash">Cash</option>
                            {/*<option value="Cheque">Cheque</option>*/}
                            {/*<option value="Online">Online</option>*/}
                            {/*<option value="NEFT">NEFT</option>*/}
                          </Input>
                        </FormGroup>
                        <FormGroup>
                          <Label for="remarks">Remarks</Label>
                          <Input
                              type="textarea"
                              name="remarks"
                              id="remarks"
                              placeholder="Enter Remarks if any"
                              value={formData.remarks}
                              onChange={(e) =>
                                  setFormData({...formData, remarks: e.target.value})
                              }
                          />
                        </FormGroup>
                      </Col>

                      {/* Right Side: Toggle Buttons (stacked vertically) */}
                      <Col md="6" className="d-flex flex-column justify-content-start">
                        <FormGroup>
                          <Label>Account Status <span className="text-danger">*</span></Label>
                          <div
                              className={`toggle-switch ${formData.accountStatus ? 'on' : 'off'}`}
                              onClick={() => handleToggleChange('accountStatus')}
                          >
                            <div className="toggle-knob"/>
                          </div>
                        </FormGroup>

                        <FormGroup>
                          <Label>SMS Send <span className="text-danger">*</span></Label>
                          <div
                              className={`toggle-switch ${formData.smsSend ? 'on' : 'off'}`}
                              onClick={() => handleToggleChange('smsSend')}
                          >
                            <div className="toggle-knob"/>
                          </div>
                        </FormGroup>

                        <FormGroup>
                          <Label>Debit Card Issue <span className="text-danger">*</span></Label>
                          <div
                              className={`toggle-switch ${formData.debitCardIssue ? 'on' : 'off'}`}
                              onClick={() => handleToggleChange('debitCardIssue')}
                          >
                            <div className="toggle-knob"/>
                          </div>
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
                      Create Account
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

export default AccountOpening;



