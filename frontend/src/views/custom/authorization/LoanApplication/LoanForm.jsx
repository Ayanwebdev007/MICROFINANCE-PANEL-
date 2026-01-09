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
import {LinearProgress} from "@mui/material";

const LoanOpeningForm = ({userInput, setUserInput, memberData, resetData}) => {
  console.log(setUserInput);
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

  const authStatus = useSelector((state) => state.auth.authState);

  const validateForm = () => {
    let formErrors = {};
    let isValid = true;

    if (!userInput.amount){
      formErrors.amount = "Please enter disbursement amount";
      isValid = false;
    }
    if (!userInput.loanTerm){
      formErrors.loanTerm = "Please enter loan term";
      isValid = false;
    }
    if (!userInput.memberId) {
      formErrors.memberId = "Please enter member id";
      isValid = false;
    }
    if (!userInput.loanDate){
      formErrors.loanDate = "Loan Date is required.";
      isValid = false;
    }
    if (!userInput.emiCount || !userInput.principleEMI || !userInput.interestEMI){
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
    const { name, value } = e.target;
    setUserInput({ ...userInput, [name]: value });
  };

  // Handle input change for nested fields
  const handleNestedInputChange = (section, field, value) => {
    setUserInput({
      ...userInput,
      [section]: {
        ...userInput[section],
        [field]: value,
      },
    });
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      try {
        setProgressbar(true);
        const submitData = await axios.post("/api/loan/loan-opening", {
          ...userInput,
          accountType: userInput.loanType,
        });
        if (submitData.data.success) {
          resetData();
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
    }else {
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

  const handleReject = async () => {
    try {
      setProgressbar(true);
      const submitData = await axios.post("/api/loan/reject-loan-application", {
        accountType: userInput.loanType,
        account: userInput.account,
      });
      if (submitData.data.success) {
        resetData();
        setAlert({
          color: 'success',
          message: submitData.data.success,
          autoDismiss: 7,
          place: 'tc',
          display: false,
          sweetAlert: true,
          timestamp: new Date().getTime(),
        });
      }else {
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
    }catch (e) {
      setAlert({
        color: 'danger',
        message: e.toLocaleString(),
        autoDismiss: 7,
        place: 'tc',
        display: true,
        sweetAlert: false,
        timestamp: new Date().getTime(),
      });
    }finally {
      setProgressbar(false);
    }
  }

  const handleLoanAmount = (amount) => {
    if (userInput.planDetails.id){
      if (parseFloat(amount) <= userInput.planDetails.maxAmount){
        let totalPayment
        let term;
        if (userInput.planDetails.emiMode === 'daily'){
          term = Math.ceil(parseInt(userInput.planDetails.emiCount) / 30);
        }else if (userInput.planDetails.emiMode === 'weekly'){
          term = Math.ceil(parseInt(userInput.planDetails.emiCount) * 7 / 30);
        }else if (userInput.planDetails.emiMode === 'fortnightly') {
          term = Math.ceil(parseInt(userInput.planDetails.emiCount) * 14 / 30);
        }else if (userInput.planDetails.emiMode === 'monthly') {
          term = parseInt(userInput.planDetails.emiCount);
        }else if (userInput.planDetails.emiMode === 'quarterly') {
          term = Math.ceil(parseInt(userInput.planDetails.emiCount) * 3);
        }

        if (userInput.planDetails.calculationMethod === 'REDUCING'){
          let rate;
          if (userInput.planDetails.emiMode === 'daily'){
            rate = parseFloat(userInput.planDetails.interestRate)/(365 * 100);
          }else if (userInput.planDetails.emiMode === 'weekly'){
            rate = (parseFloat(userInput.planDetails.interestRate) * 7) /(365 * 100);
          }else if (userInput.planDetails.emiMode === 'fortnightly') {
            rate = (parseFloat(userInput.planDetails.interestRate) * 14) /(365 * 100);
          }else if (userInput.planDetails.emiMode === 'quarterly') {
            rate = (parseFloat(userInput.planDetails.interestRate) * 3)/(12*100);
          }else {
            // (userInput.planDetails.emiMode === 'monthly')
            rate = parseFloat(userInput.planDetails.interestRate)/(12*100);
          }
          const tenure = parseInt(userInput.planDetails.emiCount);
          const principle = parseFloat(amount);

          // Calculate EMI using reducing balance formula
          const emi = principle * rate * Math.pow(1 + rate, tenure) / (Math.pow(1 + rate, tenure) - 1);
          totalPayment = emi * tenure;
        }else {
          totalPayment = parseFloat(amount) + (parseFloat(amount) * parseInt(term) * parseFloat(userInput.planDetails.interestRate)) / (100 * 12);
        }
        const emiAmount = Math.ceil(totalPayment / parseInt(userInput.planDetails.emiCount));
        const principleEMI = Math.round(parseFloat(amount) / parseInt(userInput.planDetails.emiCount));

        setUserInput({
          ...userInput,
          amount: parseFloat(amount),
          loanTerm: parseInt(term),
          emiAmount: emiAmount,
          emiCount: parseInt(userInput.planDetails.emiCount),
          principleEMI: principleEMI,
          interestEMI: emiAmount - principleEMI,
          deductionDetails: {
            processingFee: (parseFloat(amount) * userInput.planDetails.processingFee / 100).toFixed(2),
            legalAmount: parseFloat(userInput.planDetails.legalFee).toFixed(2),
            insuranceAmount: (parseFloat(amount) * userInput.planDetails.insuranceFeeRate / 100).toFixed(2),
            gst: (parseFloat(amount) * userInput.planDetails.gstRate / 100).toFixed(2),
          }
        });
      }else {
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
    }else {
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

  return (
    <>
      <div className="rna-container">
        {alert.display && <CstNotification color={alert.color} message={alert.message} autoDismiss={alert.autoDismiss} place={alert.place} timestamp={alert.timestamp}/>}
        {alert.sweetAlert && <ReactBSAlert
          success
          style={{ display: "block", marginTop: "-100px" }}
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
          {progressbar ? <LinearProgress /> : null}
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
                            value={userInput.loanDate}
                            onChange={handleInputChange}
                          />
                          <p style={{color: 'red'}}>{cstError.loanDate}</p>
                        </FormGroup>
                      </Col>
                      <Col md="3">
                        <FormGroup>
                          <Label>Loan Name *</Label>
                          <Input
                            type="text"
                            name="name"
                            value={userInput.planDetails.name}
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
                            value={userInput.planDetails.type}
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
                            value={userInput.planDetails.emiMode}
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
                            value={userInput.planDetails.calculationMethod}
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
                            value={userInput.planDetails.minAge}
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
                            value={userInput.planDetails.maxAge}
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
                            value={userInput.planDetails.minAmount}
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
                            value={userInput.planDetails.maxAmount}
                            readOnly
                          />
                        </FormGroup>
                      </Col>
                      <Col md="3">
                        <FormGroup>
                          <Label>{`Total Tenure (${userInput.planDetails.emiInterval})`}</Label>
                          <Input
                            type="number"
                            name="minTerm"
                            value={userInput.planDetails.emiCount}
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
                            value={userInput.planDetails.interestRate}
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
                            value={userInput.planDetails.security}
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
                            value={userInput.amount}
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
                            value={userInput.emiAmount}
                            readOnly
                          />
                        </FormGroup>
                      </Col>
                      <Col md="3">
                        <FormGroup>
                          <Label>First EMI Date *</Label>
                          <Input
                            type="date"
                            name="firstEmiDate"
                            value={userInput.firstEmiDate || ""}
                            onChange={handleInputChange}
                            min={new Date().toISOString().slice(0, 10)}
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
                          <Label>Member ID</Label>
                          <Input
                            type="text"
                            name="memberId"
                            value={userInput.memberId}
                            readOnly={true}
                          />
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
                      uuid={userInput.uuid}
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
                      uuid={userInput.uuid}
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
                      uuid={userInput.uuid}
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
                          value={userInput.guarantor.memberCode}
                          readOnly={true}
                        />
                      </FormGroup>
                    </Col>

                    <Col md="3">
                      <Label>Guarantor Name</Label>
                      <FormGroup>
                        <Input
                          type="text"
                          name="guarantorName"
                          value={userInput.guarantor.guarantorName}
                          readOnly={true}
                        />
                      </FormGroup>
                    </Col>

                    <Col md="3">
                      <Label>Address</Label>
                      <FormGroup>
                        <Input
                          type="text"
                          name="address"
                          value={userInput.guarantor.address}
                          readOnly={true}
                        />
                      </FormGroup>
                    </Col>
                    <Col md="3">
                      <Label>Pin Code</Label>
                      <FormGroup>
                        <Input
                          type="number"
                          name="pinCode"
                          value={userInput.guarantor.pinCode}
                          readOnly={true}
                        />
                      </FormGroup>
                    </Col>

                    <Col md="3">
                      <Label>Phone</Label>
                      <FormGroup>
                        <Input
                          type="number"
                          name="phone"
                          value={userInput.guarantor.phone}
                          readOnly={true}
                        />
                      </FormGroup>
                    </Col>

                    <Col md="3">
                      <Label>Security Type</Label>
                      <FormGroup>
                        <Input
                          type="text"
                          name="securityType"
                          value={userInput.guarantor.securityType}
                          readOnly={true}
                        />
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
                          value={userInput.coApplicant.memberCode}
                          readOnly={true}
                        />
                      </FormGroup>
                    </Col>

                    <Col md="3">
                      <Label>Co-Applicant Name</Label>
                      <FormGroup>
                        <Input
                          type="text"
                          name="coApplicantname"
                          value={userInput.coApplicant.coApplicantname}
                          readOnly={true}
                        />
                      </FormGroup>
                    </Col>

                    <Col md="3">
                      <Label>Address</Label>
                      <FormGroup>
                        <Input
                          type="text"
                          name="address"
                          value={userInput.coApplicant.address}
                          readOnly={true}
                        />
                      </FormGroup>
                    </Col>

                    <Col md="3">
                      <Label>Pin Code</Label>
                      <FormGroup>
                        <Input
                          type="number"
                          name="pinCode"
                          value={userInput.coApplicant.pinCode}
                          readOnly={true}
                        />
                      </FormGroup>
                    </Col>

                    <Col md="3">
                      <Label>Phone</Label>
                      <FormGroup>
                        <Input
                          type="number"
                          name="phone"
                          value={userInput.coApplicant.phone}
                          readOnly={true}
                        />
                      </FormGroup>
                    </Col>
                    <Col md="3">
                      <Label>Security Details</Label>
                      <FormGroup>
                        <Input
                          type="text"
                          name="securityDetails"
                          value={userInput.coApplicant.securityDetails}
                          readOnly={true}
                        />
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
                          value={userInput.deductionDetails.processingFee}
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
                          value={userInput.deductionDetails.legalAmount}
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
                          value={userInput.deductionDetails.gst}
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
                          value={userInput.deductionDetails.insuranceAmount}
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
                  <Button className="btn-fill mr-4" color="success" type="button" onClick={handleSubmit}>
                    Approve
                  </Button>
                  <Button className="btn-fill" color="danger" type="button" onClick={handleReject}>
                    Reject
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