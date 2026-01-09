import React, { useState } from "react";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  FormGroup,
  Form,
  Input,
  Row,
  Col,
  Spinner,
  Label, CardFooter,
} from "reactstrap";
import ProfileImageUpload from "../../components/ProfileImageUpload";
import axios from "axios";
import CstNotification from "../../components/CstNotification";
import ReactBSAlert from "react-bootstrap-sweetalert";
import Select from "react-select";
import {useSelector} from "react-redux";

const AddEmployeeKYC = () => {
  const initialState = {
    bankId: '',
    userId: '',
    employeeName: "",
    employeeCode: "",
    mobileNo: "",
    registrationDate: new Date().toISOString().slice(0, 10),
    panNo: "",
    voterNo: "",
    rationCardNo: "",
    dlNo: "",
    department: "",
    designation: "",
    salary: "",
    bankName: "",
    bankBranch: "",
    accountNo: "",
    ifscCode: "",
    uuid: crypto.randomUUID(),
  };

  const [formData, setFormData] = useState(initialState);
  const [cstError, setCstError] = useState({
    employeeName: "",
    employeeCode: "",
    mobileNo: "",
    registrationDate: "",
    department: "",
    designation: "",
  })
  const [progressbar, setProgressbar] = useState(false);
  const [bankDropDown, setBankDropDown] = React.useState([]);
  const [userDropDown, setUserDropDown] = React.useState([]);
  const [alert, setAlert] = useState({
    color: "success",
    message: "test message",
    autoDismiss: 7,
    place: "tc",
    display: false,
    sweetAlert: false,
    timestamp: new Date().getTime(),
  });
  const [fetchedBank, setFetchedBank] = React.useState(false);
  const [fetched, setFetched] = React.useState(false);
  const [designationSelect, setDesignationSelect] = React.useState([]);
  const [departmentSelect, setDepartmentSelect] = React.useState([]);
  const authStatus = useSelector((state) => state.auth.authState);

  if (!fetchedBank) {
    setFetchedBank(true);
    axios.get('/api/member/get-associated-branch-restrictive')
        .then(function (value) {
          if (value.data.success) {
            setBankDropDown(value.data.data);
          }else {
            setAlert({
              color: 'warning',
              message: value.data.error,
              autoDismiss: 7,
              place: 'tc',
              display: true,
              sweetAlert: false,
              timestamp: Date.now().toLocaleString(),
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
        timestamp: Date.now().toLocaleString(),
      });
    });
  }

  React.useEffect(() => {
    setProgressbar(true);
    if (!fetched) {
      setFetched(true);
      axios.get('/api/employee/get-designations')
        .then(res => {
          if (res.data.success) {
            const designations = Object.values(res.data.success);
            const designationArray = [];

            designations.push({
              value: "",
              label: "Select an Option",
              isDisabled: true,
            });

            designations.map(function (value){
              designationArray.push({
                key: value.designationId,
                label: value.designationName,
              });
            });
            console.log(designationArray);
            setDesignationSelect(designationArray);
          }else {
            setAlert({
              color: 'warning',
              message: res.data.error,
              autoDismiss: 7,
              place: 'tc',
              display: true,
              sweetAlert: false,
              timestamp: new Date().getTime(),
            });
          }
          setProgressbar(false);
        })
        .catch(err => {
          setAlert({
            color: 'danger',
            message: err.message,
            autoDismiss: 7,
            place: 'tc',
            display: true,
            sweetAlert: false,
            timestamp: new Date().getTime(),
          });
          setProgressbar(false);
        });
      axios.get('/api/employee/get-departments')
        .then(res => {
          if (res.data.success) {
            const departments = Object.values(res.data.success);
            const departmentArray = [];

            departmentArray.push({
              value: "",
              label: "Select an Option",
              isDisabled: true,
            });

            departments.map(function (value){
              departmentArray.push({
                key: value.departmentId,
                label: value.departmentName,
              });
            });
            console.log(departmentArray);
            setDepartmentSelect(departmentArray);
          }else {
            setAlert({
              color: 'warning',
              message: res.data.error,
              autoDismiss: 7,
              place: 'tc',
              display: true,
              sweetAlert: false,
              timestamp: new Date().getTime(),
            });
          }
          setProgressbar(false);
        })
        .catch(err => {
          setAlert({
            color: 'danger',
            message: err.message,
            autoDismiss: 7,
            place: 'tc',
            display: true,
            sweetAlert: false,
            timestamp: new Date().getTime(),
          });
          setProgressbar(false);
        });
    }
  }, [fetched]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async () => {
    const isValid = validateInput(formData);
    if (!isValid) {
      return;
    }
    try {
      setProgressbar(true);
      const submitData = await axios.post('/api/employee/add-employee', formData);
      if (submitData.data.success) {
        setFormData(initialState);
        setAlert({
          color: "success",
          message: submitData.data.success,
          autoDismiss: 7,
          place: "tc",
          display: false,
          sweetAlert: true,
          timestamp: new Date().getTime(),
        });
        setProgressbar(false);
      }else {
        setProgressbar(false);
        setAlert({
          color: "danger",
          message: submitData.data.error,
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
        message: error.message || "Failed to update employee data.",
        autoDismiss: 7,
        place: "tc",
        display: true,
        sweetAlert: false,
        timestamp: new Date().getTime(),
      });
      setProgressbar(false);
    }
  };

  function validateInput(userInput) {
    let formErrors = {
      employeeName: "",
      employeeCode: "",
      mobileNo: "",
      registrationDate: "",
      department: "",
      designation: "",
    };
    let isValid = true;
    if (!userInput.employeeCode) {
      formErrors["employeeCode"] = "this field is required";
      isValid = false;
    }
    if (!userInput.employeeName){
      formErrors["employeeName"] = "this field is required";
      isValid = false;
    }
    if (!userInput.mobileNo){
      formErrors["mobileNo"] = "this field is required";
      isValid = false;
    }
    if (!userInput.registrationDate){
      formErrors["registrationDate"] = "this field is required";
      isValid = false;
    }
    if (!userInput.department){
      formErrors["department"] = "this field is required";
      isValid = false;
    }
    if (!userInput.designation){
      formErrors["designation"] = "this field is required";
      isValid = false;
    }
    if (!userInput.bankId){
        formErrors["bankId"] = "this field is required";
        isValid = false;
    }
    if (!userInput.userId){
        formErrors["userId"] = "this field is required";
        isValid = false;
    }
    setCstError(formErrors);

    return isValid;
  }

  async function handleBankSelect(data) {
    try {
      setProgressbar(true);
      const fetchData = await axios.post(`/api/member/get-users-by-bank-restrictive`, {
        bankId: data.key,
      });
      setProgressbar(false);
      if (fetchData.data.success) {
        setUserDropDown(fetchData.data.data);
      }else {
        setAlert({
          color: 'warning',
          message: fetchData.data.error,
          autoDismiss: 7,
          place: 'tc',
          display: true,
          sweetAlert: false,
          timestamp: Date.now().toLocaleString(),
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
        timestamp: Date.now().toLocaleString(),
      });
    }

    setFormData({
      ...formData,
      bankId: data.key,
      selectedUserEmail: '',
      userId: '',
    });
  }

  function handleUserSelect(data) {
    setFormData({
      ...formData,
      userId: data.key,
      selectedUserEmail: data.email,
    });
  }


  return (
    <>
      {/* Notification */}
      <div className="rna-container">
        {alert.display && <CstNotification {...alert} />}
        {alert.sweetAlert && (
          <ReactBSAlert
            success
            style={{display: "block", marginTop: "-100px"}}
            title="Success"
            onConfirm={() => setAlert({...alert, sweetAlert: false})}
            onCancel={() => setAlert({...alert, sweetAlert: false})}
            confirmBtnBsStyle="success"
            btnSize=""
          >
            {alert.message}
          </ReactBSAlert>
        )}
      </div>
      {/* Employee KYC Form */}
      <div className="content">
        <Row>
          <Col md="12">
            <Card>
              <CardHeader>
                <CardTitle tag="h3">Branch Selection</CardTitle>
              </CardHeader>
              <CardBody>
                <Row>
                  <Col className="pr-1" md="6">
                    <Label>Select a Branch</Label>
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
                  <Col className="pr-1" md="6">
                    <Label>Select an User</Label>
                    <FormGroup>
                      <Select
                          className="react-select info"
                          classNamePrefix="react-select"
                          name="bankSelect"
                          onChange={handleUserSelect}
                          options={userDropDown}
                          placeholder=''
                      />
                      <p style={{color: 'red'}}>{cstError.userId}</p>
                    </FormGroup>
                  </Col>
                </Row>
              </CardBody>
            </Card>
          </Col>
        </Row>
        <Col md="12">
          <Card>
            <CardHeader>
              <CardTitle tag="h3">Employee Details</CardTitle>
            </CardHeader>
            <CardBody>
              <Form>
                <Row>
                  <Col md="3">
                    <FormGroup>
                      <Label for="employeeName">Employee Name</Label>
                      <Input
                        type="text"
                        name="employeeName"
                        id="employeeName"
                        value={formData.employeeName}
                        onChange={handleInputChange}
                        placeholder="Enter Employee Name"
                      />
                      <p style={{color: 'red'}}>{cstError.employeeName}</p>
                    </FormGroup>
                  </Col>
                  <Col md="3">
                    <FormGroup>
                      <Label for="memberCode">Employee Code</Label>
                      <Input
                        type="text"
                        name="employeeCode"
                        id="employeeCode"
                        value={formData.employeeCode}
                        onChange={handleInputChange}
                        placeholder="Enter Member Code"
                      />
                      <p style={{color: 'red'}}>{cstError.employeeCode}</p>
                    </FormGroup>
                  </Col>
                  <Col md="3">
                    <FormGroup>
                      <Label for="mobileNo">Mobile No</Label>
                      <Input
                        type="text"
                        name="mobileNo"
                        id="mobileNo"
                        value={formData.mobileNo}
                        onChange={handleInputChange}
                        placeholder="Enter Mobile No"
                      />
                      <p style={{color: 'red'}}>{cstError.mobileNo}</p>
                    </FormGroup>
                  </Col>
                  <Col md="3">
                    <FormGroup>
                      <Label for="registrationDate">Registration Date</Label>
                      <Input
                        type="date"
                        name="registrationDate"
                        id="registrationDate"
                        value={formData.registrationDate}
                        onChange={handleInputChange}
                      />
                      <p style={{color: 'red'}}>{cstError.registrationDate}</p>
                    </FormGroup>
                  </Col>
                  <Col md="3">
                    <FormGroup>
                      <Label for="panNo">PAN No</Label>
                      <Input
                        type="text"
                        name="panNo"
                        id="panNo"
                        value={formData.panNo}
                        onChange={handleInputChange}
                        placeholder="Enter PAN No"
                      />
                    </FormGroup>
                  </Col>
                  <Col md="3">
                    <FormGroup>
                      <Label for="voterNo">Voter No</Label>
                      <Input
                        type="text"
                        name="voterNo"
                        id="voterNo"
                        value={formData.voterNo}
                        onChange={handleInputChange}
                        placeholder="Enter Voter No"
                      />
                    </FormGroup>
                  </Col>
                  <Col md="3">
                    <FormGroup>
                      <Label for="rationCardNo">Ration Card No</Label>
                      <Input
                        type="text"
                        name="rationCardNo"
                        id="rationCardNo"
                        value={formData.rationCardNo}
                        onChange={handleInputChange}
                        placeholder="Enter Ration Card No"
                      />
                    </FormGroup>
                  </Col>
                  <Col md="3">
                    <FormGroup>
                      <Label for="dlNo">Driving License No</Label>
                      <Input
                        type="text"
                        name="dlNo"
                        id="dlNo"
                        value={formData.dlNo}
                        onChange={handleInputChange}
                        placeholder="Enter Driving License No"
                      />
                    </FormGroup>
                  </Col>
                  <Col md="3">
                    <FormGroup>
                      <Label>Department*</Label>
                      <Select
                        className="react-select info"
                        classNamePrefix="react-select"
                        name="departmentSelect"
                        onChange={(value) => setFormData({...formData, department: value.label})}
                        options={departmentSelect}
                        placeholder="Select an Option"
                      />
                      <p style={{ color: "red" }}>{cstError.department}</p>
                    </FormGroup>
                  </Col>
                  <Col md="3">
                    <FormGroup>
                      <Label>Designation*</Label>
                      <Select
                        className="react-select info"
                        classNamePrefix="react-select"
                        name="designationSelect"
                        onChange={(value) => setFormData({...formData, designation: value.label})}
                        options={designationSelect}
                        placeholder="Select an Option"
                      />
                      <p style={{ color: "red" }}>{cstError.designation}</p>
                    </FormGroup>
                  </Col>
                  <Col md="3">
                    <FormGroup>
                      <Label for="salary">Salary</Label>
                      <Input
                        type="number"
                        name="salary"
                        id="salary"
                        value={formData.salary}
                        onChange={handleInputChange}
                        placeholder="Enter Salary amount"
                      />
                    </FormGroup>
                  </Col>
                </Row>
                <Row>
                  <Col md="12">
                    <Card>
                      <CardHeader>
                        <CardTitle tag="h3">Bank Details</CardTitle>
                      </CardHeader>
                      <CardBody>
                        <Form>
                          <Row>
                            <Col md="3">
                              <FormGroup>
                                <Label for="bankName">Bank Name</Label>
                                <Input
                                  type="text"
                                  name="bankName"
                                  id="bankName"
                                  value={formData.bankName}
                                  onChange={handleInputChange}
                                  placeholder="Enter Bank Name"
                                />
                              </FormGroup>
                            </Col>
                            <Col md="3">
                              <FormGroup>
                                <Label for="bankBranch">Bank Branch</Label>
                                <Input
                                  type="text"
                                  name="bankBranch"
                                  id="bankBranch"
                                  value={formData.bankBranch}
                                  onChange={handleInputChange}
                                  placeholder="Enter Bank Branch"
                                />
                              </FormGroup>
                            </Col>
                            <Col md="3">
                              <FormGroup>
                                <Label for="accountNo">Account No</Label>
                                <Input
                                  type="text"
                                  name="accountNo"
                                  id="accountNo"
                                  value={formData.accountNo}
                                  onChange={handleInputChange}
                                  placeholder="Enter Account No"
                                />
                              </FormGroup>
                            </Col>
                            <Col md="3">
                              <FormGroup>
                                <Label for="ifscCode">IFSC Code</Label>
                                <Input
                                  type="text"
                                  name="ifscCode"
                                  id="ifscCode"
                                  value={formData.ifscCode}
                                  onChange={handleInputChange}
                                  placeholder="Enter IFSC Code"
                                />
                              </FormGroup>
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
                          <Col md="4" className={'text-center'}>
                            <ProfileImageUpload
                              id={'document'}
                              uuid={formData.uuid}
                              bankId={authStatus.bankId}
                              changeBtnClasses="btn-simple"
                              addBtnClasses="btn-simple"
                              removeBtnClasses="btn-simple"
                            />
                            <p className="mt-2">Upload a document
                              here.</p> {/* Text under the second upload field */}
                          </Col>
                        </Row>
                      </CardBody>
                    </Card>
                  </Col>
                </Row>
              </Form>
            </CardBody>
            <Col md="12" className={'text-center'}>
              <CardFooter>
                <center>
                  <Spinner color="info" hidden={!progressbar}/>
                </center>
                <Button className="btn-fill" color="info" type="button" disabled={progressbar} onClick={handleSubmit}>
                  Create Employee
                </Button>
              </CardFooter>
            </Col>
          </Card>
        </Col>
      </div>

    </>
  );
};

export default AddEmployeeKYC;