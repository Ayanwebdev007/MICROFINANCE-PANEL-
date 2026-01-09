import React from "react";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  CardFooter,
  FormGroup,
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

const DepositTransaction = () => {
  const initialState = {
    transDate: new Date().toISOString().slice(0, 10),
    account: '',
    accountType: '',
    type: 'credit',
    amount: 0,
    narration: '',
    paymentMethod: 'cash',
  };
  const initAccountInfo = {
    balance: 0,
    modeOfOperation: "",
    jointSurvivorCode: "",
    jointSurvivorName: "",
    relation: "",
    advisorCode: "",
    advisorName: "",
    uuid: '#',
    name: '',
    kycId: '',
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
    transDate: '',
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
    timestamp: new Date().getTime(),
  });
  const authStatus = useSelector((state) => state.auth.authState);
  const [accountInfo, setAccountInfo] = React.useState(initAccountInfo);

  const validateForm = (userInput) => {
    console.log(userInput);
    let formErrors = {};
    let isValid = true;
    if (!userInput.transDate) {
      formErrors.transDate = "Transaction Date is required.";
      isValid = false;
    }
    if (!userInput.account) {
      formErrors.account = "This field is required.";
      isValid = false;
    }
    if (!userInput.accountType) {
      formErrors.accountType = "This Field is required.";
      isValid = false;
    }
    if (!userInput.type) {
      formErrors.type = "This Field is required.";
      isValid = false;
    }
    if (!userInput.amount || userInput.amount <= 0) {
      formErrors.paymentMethod = "Select Payment Method.";
      isValid = false;
    }
    setCstError(formErrors);
    return isValid;
  };

  const handleInputChange = (e) => {
    const {name, value, type, checked} = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async () => {
    setAlert({...alert, color: 'info', message: '', display: false,});
    if (validateForm(formData)) {
      try {
        setProgressbar(true);
        const submitData = await axios.post("/api/deposit/cash-transaction", formData);
        if (submitData.data.success) {
          setFormData(initialState);
          setAccountInfo(initAccountInfo);
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
    }
  };

  async function getAccountDetails(event) {
    setFormData({...formData, account: event.target.value});
    setAlert({...alert, color: 'info', message: '', display: false,});
    if (event.target.value && formData.accountType) {
      try {
        const fetchData = await axios.post('/api/deposit/get-deposit-details', {accountNumber: event.target.value, accountType: formData.accountType});
        if (fetchData.data.success) {
          setAccountInfo(fetchData.data.data);
          setFormData({
            ...formData,
            account: fetchData.data.data.account,
          });
          setAlert({
            color: 'success',
            message: fetchData.data.success,
            autoDismiss: 7,
            place: 'tc',
            display: true,
            sweetAlert: false,
            timestamp: new Date().getTime(),
          })
        }else {
          setAccountInfo(initAccountInfo);
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
        setAccountInfo(initAccountInfo);
        console.log(e);
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
                        <Label>Transaction Date</Label>
                        <FormGroup>
                          <Input
                            type="date"
                            name="transDate"
                            value={formData.transDate}
                            onChange={handleInputChange}
                          />
                          <p style={{color: 'red'}}>{cstError.transDate}</p>
                        </FormGroup>
                      </Col>
                      <Col md="3">
                        <FormGroup>
                          <Label>Account Type</Label>
                          <Input type="select" name="accountType" id="accountType"
                                 onChange={handleInputChange}
                          >
                            <option value={'recurring-deposit'}>Recurring Deposit</option>
                            <option value={'thrift-fund'}>Thrift Fund</option>
                            <option value={'daily-savings'}>Daily Savings/Home Savings</option>
                          </Input>
                          <p style={{color: 'red'}}>{cstError.accountType}</p>
                        </FormGroup>
                      </Col>
                      <Col md="3">
                        <FormGroup>
                          <Label>*Account Number</Label>
                          <Input
                            type="text"
                            name="account"
                            value={formData.account}
                            onChange={getAccountDetails}
                          />
                          <p style={{color: 'red'}}>{cstError.account}</p>
                        </FormGroup>
                      </Col>
                      <Col md="3">
                        <FormGroup>
                          <Label>Advisor/Collector*</Label>
                          <Input
                            type="text"
                            name="advisorCode"
                            value={accountInfo.advisorCode}
                            readOnly={true}
                          />
                        </FormGroup>
                      </Col>
                      <Col md="3">
                        <FormGroup>
                          <Label>Advisor Name</Label>
                          <Input
                            type="text"
                            name="advisorName"
                            value={accountInfo.advisorName}
                            readOnly={true}
                          />
                        </FormGroup>
                      </Col>
                      <Col md="3">
                        <FormGroup>
                          <Label>Mode Of Operation</Label>
                          <Input
                            type="text"
                            name="modeOfOperation" id='modeOfOperation'
                            value={accountInfo.modeOfOperation}
                            readOnly={true}
                          />
                        </FormGroup>
                      </Col>
                      <Col md="3">
                        <FormGroup>
                          <Label>Joint/Survivor Code</Label>
                          <Input
                            type="text"
                            name="jointSurvivorCode"
                            value={accountInfo.jointSurvivorCode}
                            readOnly={true}
                          />
                        </FormGroup>
                      </Col>
                      <Col md="3">
                        <FormGroup>
                          <Label>Joint/Survivor Name</Label>
                          <Input
                            type="text"
                            name="jointSurvivorName"
                            value={accountInfo.jointSurvivorName}
                            readOnly={true}
                          />
                        </FormGroup>
                      </Col>
                      <Col md="3">
                        <FormGroup>
                          <Label>Relation</Label>
                          <Input
                            type="text"
                            name="relation" id="relation"
                            value={accountInfo.relation}
                            readOnly={true}
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
                <CardTitle tag="h3">Transaction Details</CardTitle>
              </CardHeader>
              <CardBody>
                <Row>
                  <Col md={12}>
                    <Row className="d-flex flex-wrap">
                      <Col md="3">
                        <FormGroup>
                          <Label>*Transaction Type</Label>
                          <Input type="select" name="type" id="type"
                                 onChange={handleInputChange}
                          >
                            <option value={'credit'}>Credit (Deposit)</option>
                            <option value={'debit'}>Debit (Withdrawal)</option>
                          </Input>
                          <p style={{color: 'red'}}>{cstError.type}</p>
                        </FormGroup>
                      </Col>
                      <Col md="3">
                        <FormGroup>
                          <Label>*Amount</Label>
                          <Input
                            type="text"
                            name="jointSurvivorCode"
                            value={formData.amount}
                            onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
                          />
                          <p style={{color: 'red'}}>{cstError.amount}</p>
                        </FormGroup>
                      </Col>
                      <Col md="3">
                        <FormGroup>
                          <Label>Current Balance</Label>
                          <Input
                            type="text"
                            name="jointSurvivorCode"
                            value={accountInfo.balance}
                          />
                        </FormGroup>
                      </Col>
                      <Col md="3">
                        <FormGroup>
                          <Label>Updated Balance</Label>
                          <Input
                            type="text"
                            name="jointSurvivorCode"
                            value={parseFloat(accountInfo.balance) + (formData.type === 'credit'? 1 : -1) * formData.amount}
                          />
                        </FormGroup>
                      </Col>
                      <Col className="pr-1" md={'12'}>
                        <Label>Narration</Label>
                        <FormGroup>
                          <Input type={'textarea'} value={formData.narration} aria-colspan={2}
                                 onChange={(e) => setFormData({...formData, narration: e.target.value})}
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
                      <Col className="pr-1" md="3">
                        <Label>Member Id</Label>
                        <FormGroup>
                          <Input type={'text'} value={accountInfo.kycId} readOnly={true}/>
                        </FormGroup>
                      </Col>
                      <Col className="pr-1" md="3">
                        <Label>Member Name</Label>
                        <FormGroup>
                          <Input type={'text'} value={accountInfo.name} readOnly={true}/>
                        </FormGroup>
                      </Col>
                      <Col className="pr-1" md="3">
                        <Label>Father/Mother/Spouse</Label>
                        <FormGroup>
                          <Input type={'text'} value={accountInfo.guardian} readOnly={true} />
                        </FormGroup>
                      </Col>
                      <Col className="pr-1" md="3">
                        <Label>Gender</Label>
                        <Input type={'text'} value={accountInfo.gender} readOnly={true}/>
                      </Col>
                      <Col className="pr-1" md="3">
                        <Label>Registration Date</Label>
                        <FormGroup>
                          <Input type={'date'} value={accountInfo.date} readOnly={true}/>
                        </FormGroup>
                      </Col>
                      <Col className="pr-1" md="3">
                        <Label>Date of Birth</Label>
                        <FormGroup>
                          <Input type={'date'} value={accountInfo.dob} readOnly={true}/>
                        </FormGroup>
                      </Col>
                      <Col className="pr-1" md={'3'}>
                        <Label>Material Status</Label>
                        <Input type="text" name="select" id="materialSelect" value={accountInfo.materialStatus} readOnly={true}/>
                      </Col>
                      <Col className="pr-1" md={'3'}>
                        <Label>Phone Number</Label>
                        <FormGroup>
                          <Input type={'text'} value={accountInfo.phone} readOnly={true} />
                        </FormGroup>
                      </Col>
                      <Col className="pr-1" md={'3'}>
                        <Label>Email</Label>
                        <FormGroup>
                          <Input type={'email'} value={accountInfo.email} readOnly={true}/>
                        </FormGroup>
                      </Col>
                      <Col className="pr-1" md={'3'}>
                        <Label>Aadhar Number</Label>
                        <FormGroup>
                          <Input type={'text'} value={accountInfo.aadhar} readOnly={true}/>
                        </FormGroup>
                      </Col>
                      <Col className="pr-1" md={'3'}>
                        <Label>Voter Number</Label>
                        <FormGroup>
                          <Input type={'text'} value={accountInfo.voter} readOnly={true}/>
                        </FormGroup>
                      </Col>
                      <Col className="pr-1" md={'3'}>
                        <Label>PAN Number</Label>
                        <FormGroup>
                          <Input type={'text'} value={accountInfo.pan} readOnly={true}/>
                        </FormGroup>
                      </Col>
                      <Col className="pr-1" md={'3'}>
                        <Label>Monthly Income</Label>
                        <FormGroup>
                          <Input type={'number'} value={accountInfo.income} readOnly={true}/>
                        </FormGroup>
                      </Col>
                      <Col className="pr-1" md={'3'}>
                        <Label>Occupation</Label>
                        <FormGroup>
                          <Input type={'text'} value={accountInfo.occupation} readOnly={true}/>
                        </FormGroup>
                      </Col>
                      <Col className="pr-1" md={'3'}>
                        <Label>Educational Qualification</Label>
                        <FormGroup>
                          <Input type={'text'} value={accountInfo.education} readOnly={true}/>
                        </FormGroup>
                      </Col>
                      <Col className="pr-1" md={'12'}>
                        <Label>Full Address with Pin Code</Label>
                        <FormGroup>
                          <Input type={'textarea'} value={accountInfo.address} aria-colspan={3} readOnly={true}/>
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
                      disable={true}
                      uuid={accountInfo.uuid}
                      bankId={authStatus.bankId}
                      changeBtnClasses="btn-simple"
                      addBtnClasses="btn-simple"
                      removeBtnClasses="btn-simple"
                    />
                    <p className="mt-2">Uploaded profile photo</p>
                  </Col>
                  <Col md="4" className={'text-center'}>
                    <ProfileImageUpload
                      id={'profile-joint'}
                      disable={true}
                      uuid={accountInfo.uuid}
                      bankId={authStatus.bankId}
                      changeBtnClasses="btn-simple"
                      addBtnClasses="btn-simple"
                      removeBtnClasses="btn-simple"
                    />
                    <p className="mt-2">Uploaded joint photo</p>
                  </Col>
                  <Col md="4" className={'text-center'}>
                    <ProfileImageUpload
                      id={'signature'}
                      disable={true}
                      uuid={accountInfo.uuid}
                      bankId={authStatus.bankId}
                      changeBtnClasses="btn-simple"
                      addBtnClasses="btn-simple"
                      removeBtnClasses="btn-simple"
                      className="w-20"
                    />
                    <p className="mt-2">Uploaded Signature</p>
                  </Col>
                </Row>
              </CardBody>
              <CardFooter className={'text-center'}>
                <center>
                  <Spinner color="info" hidden={!progressbar}/>
                </center>
                <Button className="btn-fill" color="info" type="button" onClick={handleSubmit}>
                  Submit
                </Button>
              </CardFooter>
            </Card>
          </Col>
        </Row>
      </div>
    </>
  );
};

export default DepositTransaction;