
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
  CustomInput
} from "reactstrap";
import ProfileImageUpload from "../../../components/ProfileImageUpload";
import axios from "axios";
import CstNotification from "../../../components/CstNotification";
import ReactBSAlert from "react-bootstrap-sweetalert";
import { useSelector } from "react-redux";
import './PaymentRemarksForm.css'
const SavingsAccountOpening = () => {
  const initialState = {
    openingDate: new Date().toISOString().slice(0, 10),
    selectbyMember :"",
    memberName: "",
    dob: "",
    relativeDetails:"",
    mobileNo: "",
    nomineeName: "",
    nomineeAge: "",
    nomineeRelation: "",
    address: "",
    district: "",
    branchName: "",
    state: "",
    pinCode: "",
    modeOfOperation: "Single",
    jointSurvivorCode:"",
    jointSurvivorName:"",
    relation:"",
    plan: "Savings",
    openingAmount: "",
    advisorCode: "",
    advisorName: "",
    openingFees: "",
    paymentMethod: "Cash",
    remarks: "",
    accountStatus: true,
    smsSend: true,
    debitCardIssue: false,
    photo: null,
    signature: null,
    jointPhoto: null,
    uuid: crypto.randomUUID(),
  };

  const [formData, setFormData] = React.useState(initialState);
  const [cstError, setCstError] = React.useState({
    openingDate:'',
    selectbyMember:'',
    memberName:'',
    dob:'',
    mobileNo:'',
    address:'',
    district:'',
    branchName:'',
    state:'',
    pinCode:'',
    modeOfOperation:'',
    plan:'',
    openingAmount:'',
    paymentMethod:'',
    advisorName:'',


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
  const [errors, setErrors] = React.useState({});
  const [loading, setLoading] = React.useState(false);


  const validateForm = () => {
    let formErrors = {};
    let isValid = true;
    if (!formData.openingDate) {
      formErrors.openingDate = "Opening Date is required.";
      isValid = false;
    }
    if (!formData.selectbyMember) {
      formErrors.selectbyMember = "This field is required.";
      isValid = false;
    }
    if (!formData.memberName) {
      formErrors.memberName = "Member Name is required.";
      isValid = false;
    }
    if (!formData.dob) {
      formErrors.dob = "Date of Birth  is required.";
      isValid = false;
    }
    if (!formData.mobileNo || formData.mobileNo.length !== 10) {
      formErrors.mobileNo = "A valid 10-digit Mobile No is required.";
      isValid = false;
    }
    if (!formData.address) {
      formErrors.address = "Address is required.";
      isValid = false;
    }
    if (!formData.district) {
      formErrors.district = "District is required.";
      isValid = false;
    }
    if (!formData.branchName) {
      formErrors.branchName = "Please Select Branch Name.";
      isValid = false;
    }
    if (!formData.state) {
      formErrors.state = "State is required.";
      isValid = false;
    }
    if (!formData.pinCode) {
      formErrors.pinCode = "Pin Code is required.";
      isValid = false;
    }
    if (!formData.modeOfOperation) {
      formErrors.modeOfOperation = "This Field is required.";
      isValid = false;
    }
    if (!formData.plan) {
      formErrors.plan = "Select A plan.";
      isValid = false;
    }
    if (!formData.openingAmount) {
      formErrors.openingAmount = "Opening Amount is required.";
      isValid = false;
    }
    if (!formData.paymentMethod) {
      formErrors.paymentMethod = "Select Payment Method.";
      isValid = false;
    }
    if (!formData.advisorName) {
      formErrors.advisorName = "Advisor Name is required.";
      isValid = false;
    }
    if (!formData.advisorName) {
      formErrors.advisorName = "Advisor Name is required.";
      isValid = false;
    }
    setCstError(formErrors);
    return isValid;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };
  const handleToggleChange = (field) => {
    setFormData({ ...formData, [field]: !formData[field] });
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      /* try {
           setProgressbar(true);
           const submitData = await axios.post("/api/sb-account/add", formData);
           if (submitData.data.success) {
               setFormData({...initialState,uuid:crypto.randomUUID(),});
               setAlert({
                   color: 'success',
                   message: submitData.data.success,
                   autoDismiss: 7,
                   place: 'tc',
                   display: true,
                   sweetAlert: true,
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
           setAlert({
               color: 'danger',
               message: e.toLocaleString(),
               autoDismiss: 7,
               place: 'tc',
               display: true,
               sweetAlert: false,
               timestamp: new Date().getTime(),
           });
       }*/
      console.log(formData)
    }
  };

  return (
    <>
      <div className="rna-container">
        {alert.display && <CstNotification color={alert.color} message={alert.message} autoDismiss={alert.autoDismiss} place={alert.place} timestamp={alert.timestamp} />}
        {alert.sweetAlert && <ReactBSAlert
          success
          style={{ display: "block", marginTop: "-100px" }}
          title="Good job!"
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
            <Card >
              <CardHeader>
                <CardTitle tag="h3">Basic Details</CardTitle>
              </CardHeader>
              <CardBody>
                <Row>
                  <Col md={9}>
                    <Form>
                      {/* Saving Details */}

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
                            <Label>Select By Member</Label>
                            <Input
                              type="text"
                              name="selectbyMember"
                              value={formData.selectbyMember}
                              onChange={handleInputChange}
                            />
                            <p style={{color: 'red'}}>{cstError.selectbyMember}</p>
                          </FormGroup>
                        </Col>
                        <Col md="3">
                          <FormGroup>
                            <Label>Member Name</Label>
                            <Input
                              type="text"
                              name="memberName"
                              value={formData.memberName}
                              onChange={handleInputChange}
                            />

                            <p style={{color: 'red'}}>{cstError.memberName}</p>
                          </FormGroup>
                        </Col>

                        <Col md="3">
                          <FormGroup>
                            <Label>Date Of Birth</Label>
                            <Input
                              type="date"
                              name="dob"
                              value={formData.dob}
                              onChange={handleInputChange}
                            />

                            <p style={{color: 'red'}}>{cstError.dob}</p>
                          </FormGroup>
                        </Col>

                        <Col md="3">
                          <FormGroup>
                            <Label>Relative Details</Label>
                            <Input
                              type="text"
                              name="relativeDetails"
                              value={formData.relativeDetails}
                              onChange={handleInputChange}
                            />

                            <p style={{color: 'red'}}>{cstError.relativeDetails}</p>
                          </FormGroup>
                        </Col>
                        <Col md="3">
                          <FormGroup>
                            <Label>Mobile No</Label>
                            <Input
                              type="number"
                              name="mobileNo"
                              value={formData.mobileNo}
                              onChange={handleInputChange}
                            />

                            <p style={{color: 'red'}}>{cstError.mobileNo}</p>
                          </FormGroup>
                        </Col>

                        <Col md="3">
                          <FormGroup>
                            <Label>Nominee Name</Label>
                            <Input
                              type="text"
                              name="nomineeName"
                              value={formData.nomineeName}
                              onChange={handleInputChange}
                            />

                            <p style={{color: 'red'}}>{cstError.nomineeName}</p>
                          </FormGroup>
                        </Col>

                        <Col md="3">
                          <FormGroup>
                            <Label>Nominee Age</Label>
                            <Input
                              type="number"
                              name="nomineeAge"
                              value={formData.nomineeAge}
                              onChange={handleInputChange}
                            />

                            <p style={{color: 'red'}}>{cstError.nomineeAge}</p>
                          </FormGroup>
                        </Col>

                        <Col md="3">
                          <FormGroup>
                            <Label>Nominee Relation</Label>
                            <Input
                              type="text"
                              name="nomineeRelation"
                              value={formData.nomineeRelation}
                              onChange={handleInputChange}
                            />

                            <p style={{color: 'red'}}>{cstError.nomineeRelation}</p>
                          </FormGroup>
                        </Col>

                        <Col md="3">
                          <FormGroup>
                            <Label>Address</Label>
                            <Input
                              type="text"
                              name="address"
                              value={formData.address}
                              onChange={handleInputChange}
                            />

                            <p style={{color: 'red'}}>{cstError.address}</p>
                          </FormGroup>
                        </Col>
                        <Col md="3">
                          <FormGroup>
                            <Label>District</Label>
                            <Input
                              type="text"
                              name="district"
                              value={formData.district}
                              onChange={handleInputChange}
                            />

                            <p style={{color: 'red'}}>{cstError.district}</p>
                          </FormGroup>
                        </Col>

                        <Col md="3">
                          <FormGroup>
                            <Label>Branch Name</Label>
                            <Input
                              type="text"
                              name="branchName"
                              value={formData.branchName}
                              onChange={handleInputChange}
                            />

                            <p style={{color: 'red'}}>{cstError.branchName}</p>
                          </FormGroup>
                        </Col>


                        <Col md="3">
                          <FormGroup>
                            <Label>State</Label>
                            <Input
                              type="text"
                              name="state"
                              value={formData.state}
                              onChange={handleInputChange}
                            />

                            <p style={{color: 'red'}}>{cstError.state}</p>
                          </FormGroup>
                        </Col>
                        <Col md="3">
                          <FormGroup>
                            <Label>Pin Code</Label>
                            <Input
                              type="number"
                              name="pinCode"
                              value={formData.pinCode}
                              onChange={handleInputChange}
                            />

                            <p style={{color: 'red'}}>{cstError.pinCode}</p>
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

                        <Col md="3">
                          <FormGroup>
                            <Label>Select Plan</Label>
                            <Input
                              type="text"
                              name="plan"
                              value={formData.plan}
                              onChange={handleInputChange}
                            />

                            <p style={{color: 'red'}}>{cstError.plan}</p>
                          </FormGroup>
                        </Col>
                        <Col md="3">
                          <FormGroup>
                            <Label>Opening Amount</Label>
                            <Input
                              type="number"
                              name="openingAmount"
                              value={formData.openingAmount}
                              onChange={handleInputChange}
                            />

                            <p style={{color: 'red'}}>{cstError.openingAmount}</p>
                          </FormGroup>
                        </Col>


                        <Col md="3">
                          <FormGroup>
                            <Label>Advisor/Collector*</Label>
                            <Input
                              type="text"
                              name="advisorCode"
                              value={formData.advisorCode}
                              onChange={handleInputChange}
                            />

                            <p style={{color: 'red'}}>{cstError.advisorCode}</p>
                          </FormGroup>
                        </Col>

                        <Col md="3">
                          <FormGroup>
                            <Label>Advisor Name</Label>
                            <Input
                              type="text"
                              name="advisorName"
                              value={formData.advisorName}
                              onChange={handleInputChange}
                            />

                            <p style={{color: 'red'}}>{cstError.advisorName}</p>
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

                      </Row>

                    </Form>
                  </Col>


                </Row>
              </CardBody>


            </Card>
          </Col>
        </Row>

        <Row>
          <Col>
            <Card>
              <CardHeader tag="h3">Photo Upload</CardHeader>
              <CardBody>
                <Form>
                  <Row>
                    <Col md="4">
                      <ProfileImageUpload
                        label="Photo"
                        onUpload={(file) =>
                          setFormData({...formData, photo: file})
                        }
                      />
                      <p className="mt-2">Upload the photo
                        here.</p> {/* Text under the first upload field */}
                    </Col>

                    <Col md="4">
                      <ProfileImageUpload
                        label="Joint Photo"
                        onUpload={(file) =>
                          setFormData({...formData, jointPhoto: file})
                        }
                      />
                      <p className="mt-2">Upload the joint photo
                        here.</p> {/* Text under the second upload field */}
                    </Col>

                    <Col md="4">
                      <ProfileImageUpload
                        label="Signature"
                        onUpload={(file) =>
                          setFormData({...formData, signature: file})
                        }
                      />
                      <p className="mt-2">Upload the Signature
                        here.</p> {/* Text under the third upload field */}
                    </Col>


                  </Row>

                </Form>
              </CardBody>
            </Card>
          </Col>

        </Row>

        <Row>
          <Col>
            <Card>
              <CardHeader tag="h3">Payment Details

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
                          value={formData.paymentBy}
                          onChange={(e) =>
                            setFormData({ ...formData, paymentBy: e.target.value })
                          }
                        >
                          <option value="Cash">Cash</option>
                          <option value="Cheque">Cheque</option>
                          <option value="Online">Online</option>
                          <option value="NEFT">NEFT</option>
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
                            setFormData({ ...formData, remarks: e.target.value })
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
                          <div className="toggle-knob" />
                        </div>
                      </FormGroup>

                      <FormGroup>
                        <Label>SMS Send <span className="text-danger">*</span></Label>
                        <div
                          className={`toggle-switch ${formData.smsSend ? 'on' : 'off'}`}
                          onClick={() => handleToggleChange('smsSend')}
                        >
                          <div className="toggle-knob" />
                        </div>
                      </FormGroup>

                      <FormGroup>
                        <Label>Debit Card Issue <span className="text-danger">*</span></Label>
                        <div
                          className={`toggle-switch ${formData.debitCardIssue ? 'on' : 'off'}`}
                          onClick={() => handleToggleChange('debitCardIssue')}
                        >
                          <div className="toggle-knob" />
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

export default SavingsAccountOpening;


