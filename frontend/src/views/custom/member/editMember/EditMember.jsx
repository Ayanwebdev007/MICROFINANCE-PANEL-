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

// reactstrap components
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
  Col, Spinner, CustomInput,
} from "reactstrap";
import ProfileImageUpload from "../../components/ProfileImageUpload";
import axios from "axios";
import CstNotification from "../../components/CstNotification";
import ReactBSAlert from "react-bootstrap-sweetalert";
import {useSelector} from "react-redux";
import Select from "react-select";
import {debounce} from "@mui/material";
import { useLocation } from 'react-router-dom';

const EditMember = () => {
  const location = useLocation();

  const initInput = {
    id: '',
    selectedUserEmail: '',
    bankId: '',
    searchType: '',
    userId: '',
    date: '',
    name: '',
    guardian: '',
    gender: 'male',
    dob: '',
    religion: "",
    materialStatus: 'unmarried',
    email: '',
    phone: '',
    address: '',
    areaType: "",
    houseType: "",
    residingSince: "",
    residentialLand: "",
    agricultureLand: "",
    aadhar: '',
    voter: '',
    pan: '',
    occupation: '',
    income: '',
    education: '',
    nominee: {
      name: '',
      relation: '',
      dob: '',
      gender: '',
      aadhar: '',
      voter: '',
      pan: '',
    },
    familyMembers: {
      membersAbove18: '',
      membersBelow18: '',
      male: '',
      female: '',
      earningMembers: ''
    },
    croName: '',
    croCode: '',
    bmName: '',
    bmCode: '',
    documentVerifiedBy: '',
    documentVerifiedDate: '',
    uuid: crypto.randomUUID(),
    active: true,
  };
  const [userInput, setUserInput] = React.useState(initInput);
  const [cstError, setCstError] = React.useState({
    name: '',
    guardian: '',
    phone: '',
    date: '',
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
  const [members, setMembers] = React.useState([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isSearching, setIsSearching] = React.useState(false);
  const [fetched, setFetched] = React.useState(false);

  const [bankDropDown, setBankDropDown] = React.useState([]);
  const [userDropDown, setUserDropDown] = React.useState([]);

  const authStatus = useSelector((state) => state.auth.authState);

  React.useEffect(() => {
    const { member } = location.state || {};
    if (member && authStatus?.bankId) {
      setUserInput(prev => ({
        ...initInput,
        ...member,
        nominee: member.nominee || initInput.nominee,
        familyMembers: member.familyMembers || initInput.familyMembers,
        active: member.active !== false,
        bankId: member.bankId || authStatus.bankId,
      }));
    }
  }, [location.state, authStatus?.bankId]);


  if (!fetched) {
    setFetched(true);
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

    // axios.get('/api/member/get-all-members').then((res) => {
    //   if (res.data.success) {
    //     setMembers(res.data.data);
    //   }else {
    //     setAlert({
    //       color: 'warning',
    //       message: res.data.error,
    //       autoDismiss: 7,
    //       place: 'tc',
    //       display: true,
    //       sweetAlert: false,
    //     });
    //   }
    // });
  }

  async function onSubmit(){
      const { isValid, errors } = validateInput(userInput);
      console.log(isValid, errors);

    if(isValid){
      try {
        setProgressbar(true);
        const submitData = await axios.post('/api/member/update-member', userInput);
        if(submitData.data.success){
          setUserInput({...initInput, bankId: userInput.bankId, userId: userInput.userId});
          setMembers([]);
          setAlert({
            color: 'success',
            message: submitData.data.success,
            autoDismiss: 7,
            place: 'tc',
            display: true,
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
        setProgressbar(false);
      }catch (e) {
          const errorMessage = e.response
              ? e.response.data.error || 'An unexpected error occurred.'
              : e.toLocaleString(); // Fallback for network errors

          setAlert({
              color: 'danger',
              message: errorMessage, // Use the extracted message
              autoDismiss: 7,
              place: 'tc',
              display: true,
              sweetAlert: false,
              timestamp: new Date().getTime(),
          });
          setProgressbar(false);
      }
    }else {
        const fields = Object.keys(errors);

        let message = "";

        if (fields.length === 1) {
            // Single error → clean message
            message = `${fields[0]} is required`;
        } else {
            // Multiple errors → join with commas and "and"
            const last = fields.pop();
            message = `${fields.join(", ")} and ${last} are required`;
        }

        setAlert({
            color: 'warning',
            message: message || 'Please fill all required fields',
            autoDismiss: 7,
            place: 'tc',
            display: true,
            sweetAlert: false,
            timestamp: new Date().getTime(),
        });
    }
  }

  function validateInput(inputValue) {
    let temp = {};
    let isValid = true;
    if (!inputValue.name){
      temp = {...temp, name: 'name is required'};
      isValid = false;
    }
    if (!inputValue.guardian){
      temp = {...temp, guardian: 'guardian is required'};
      isValid = false;
    }
    if (!inputValue.dob){
        temp= {...temp, dob: 'dob is required'};
        isValid = false;
    }
    if (!inputValue.gender){
        temp= {...temp, gender: 'gender is required'};
    }
    if (!inputValue.phone || inputValue.phone.trim() === "") {
        temp = { ...temp, phone: "phone no is required" };
        isValid = false;
    } else if (inputValue.phone.length !== 10) {
        temp = { ...temp, phone: "enter 10 digit number" };
        isValid = false;
    }
      if (inputValue.aadhar && inputValue.aadhar.length !== 12){
          temp.aadhar = 'enter 12 digit Aadhar number';
          isValid = false;
      }

      if (inputValue.pan && inputValue.pan.length !== 10){
          temp.pan = 'enter 10 digit PAN number';
          isValid = false;
      }
      if (!inputValue.date){
      temp = {...temp, date: 'this is required'};
      isValid = false;
    }
    setCstError(temp);
      return { isValid, errors: temp }
  }

  const debouncedSearch = debounce(async (searchValue) => {
      if (userInput.bankId === '') {
        setAlert({
          color: 'warning',
          message: 'Please select a Branch first',
          autoDismiss: 7,
          place: 'tc',
          display: true,
          sweetAlert: false,
          timestamp: new Date().getTime(),
        });
        setIsSearching(false);
        return;
      }
      if (userInput.searchType === '') {
        setAlert({
          color: 'warning',
          message: 'Please select search criteria',
          autoDismiss: 7,
          place: 'tc',
          display: true,
          sweetAlert: false,
          timestamp: new Date().getTime(),
        });
        setIsSearching(false);
        return;
      }
      try {
        const response = await axios.post(`/api/member/search-members`, {
          parameter: userInput.searchType,
          value: searchValue.toUpperCase(),
          bankId: userInput.bankId,
        });

        if (response.data.success) {
          setMembers(response.data.data);
          setAlert({
            color: 'success',
            message: `Please select Members from the dropdown to edit.`,
            autoDismiss: 7,
            place: 'tc',
            display: true,
            sweetAlert: false,
            timestamp: new Date().getTime(),
          });
        }else {
          setAlert({
            color: 'warning',
            message: response.data.error,
            autoDismiss: 7,
            place: 'tc',
            display: true,
            sweetAlert: false,
            timestamp: new Date().getTime(),
          });
        }
        setIsSearching(false);
      } catch (error) {
        setAlert({
          color: 'danger',
          message: error.toString(),
          autoDismiss: 7,
          place: 'tc',
          display: true,
          sweetAlert: false,
          timestamp: new Date().getTime(),
        });
        setIsSearching(false);
      }
    }, 500);

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
    }

    setUserInput({
      ...userInput,
      bankId: data.key,
      selectedUserEmail: '',
      userId: '',
    });
  }

  function handleUserSelect(data) {
    setUserInput({
      ...userInput,
      userId: data.key,
      selectedUserEmail: data.email,
    });
  }

  function handleKycInput(data) {
    setUserInput({
      ...userInput,
      ...data,
      active: data.active,
      uuid: data.uuid || userInput.uuid,
    });

  }

  function handleSearchType(data) {
    setUserInput({
      ...userInput,
      searchType: data,
    });

    setMembers([]);
    setIsSearching(false);
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
        <Row>
          <Col md="12">
            <Card>
              <CardBody className={'mt-2'}>
                <Row>
                  <Col md={4}>
                    <Label>Search By</Label>
                    <FormGroup>
                      <Input type="select" name="typeSelect" id="parameterSelect"
                             value={userInput.searchType}
                             onChange={(event) => handleSearchType(event.target.value)}
                      >
                        <option value={''}>Select search criteria</option>
                        <option value={'name'}>Name</option>
                        <option value={'phone'}>Phone Number</option>
                        <option value={'aadhar'}>Aadhar Number</option>
                        <option value={'pan'}>PAN Number</option>
                      </Input>
                      <p style={{color: 'red'}}>{cstError.searchType}</p>
                    </FormGroup>
                  </Col>
                  <Col md={8}>
                    <Label>Select a Member to Edit (Type at-lest 4 digit to show dropdown value)</Label>
                    <FormGroup>
                      {isSearching && <Spinner size="sm" color="info"/>}
                      {members.length > 0 ? (
                        <Select
                          className="react-select info"
                          classNamePrefix="react-select"
                          name="memberSelect"
                          onChange={handleKycInput}
                          options={members}
                          placeholder="Select member..."
                        />
                      ) : <Input
                        type="text"
                        placeholder="Search member by entering at least 4 digits..."
                        value={searchTerm}
                        onChange={(e) => {
                          const value = e.target.value;
                          setSearchTerm(value);
                          if (value.length >= 4) {
                            setIsSearching(true);
                            debouncedSearch(value, userInput.bankId, userInput.searchType);
                          } else {
                            setMembers([]);
                          }
                        }}
                      />}
                      <p style={{color: 'red'}}>{cstError.referrer}</p>
                    </FormGroup>
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
                <CardTitle tag="h3">Member's Details</CardTitle>
              </CardHeader>
              <CardBody>
                <Row>
                  <Col md={12}>
                    <Form>
                      <Row>
                        <Col className="pr-1" md="3">
                          <Label>Member Name *</Label>
                          <FormGroup>
                            <Input type={'text'} value={userInput.name}
                                   onChange={(event) => setUserInput({...userInput, name: event.target.value.toUpperCase()})}/>
                            <p style={{color: 'red'}}>{cstError.name}</p>
                          </FormGroup>
                        </Col>
                        <Col className="pr-1" md="3">
                          <Label>Father/Mother/Spouse *</Label>
                          <FormGroup>
                            <Input type={'text'} value={userInput.guardian}
                                   onChange={(event) => setUserInput({...userInput, guardian: event.target.value.toUpperCase()})}/>
                            <p style={{color: 'red'}}>{cstError.guardian}</p>
                          </FormGroup>
                        </Col>
                        <Col className="pr-1" md="3">
                          <Label>Gender *</Label>
                          <Input type="select" name="select" id="genderSelect"
                                 value={userInput.gender}
                                 onChange={(event) => setUserInput({...userInput, gender: event.target.value})}
                          >
                            <option value={'male'}>Male</option>
                            <option value={'female'}>Female</option>
                            <option value={'other'}>Other</option>
                          </Input>
                            <p style={{color: 'red'}}>{cstError.gender}</p>
                        </Col>
                        <Col className="pr-1" md="3">
                          <Label>Registration Date *</Label>
                          <FormGroup>
                            <Input type={'date'} value={userInput.date}
                                   onChange={(event) => setUserInput({...userInput, date: event.target.value})}/>
                            <p style={{color: 'red'}}>{cstError.date}</p>
                          </FormGroup>
                        </Col>
                        <Col className="pr-1" md="3">
                          <Label>Date of Birth *</Label>
                          <FormGroup>
                            <Input type={'date'} value={userInput.dob}
                                   onChange={(event) => setUserInput({...userInput, dob: event.target.value})}/>
                              <p style={{color: 'red'}}>{cstError.dob}</p>
                          </FormGroup>
                        </Col>
                        <Col className="pr-1" md={'3'}>
                          <Label>Material Status</Label>
                          <Input type="select" name="select" id="materialSelect"
                                 value={userInput.materialStatus}
                                 onChange={(event) => setUserInput({...userInput, materialStatus: event.target.value})}
                          >
                            <option value={'unmarried'}>Unmarried</option>
                            <option value={'married'}>Married</option>
                            <option value={'divorced'}>Divorced</option>
                            <option value={'widow'}>Widow</option>
                          </Input>
                        </Col>
                        <Col className="pr-1" md={'3'}>
                          <Label>Phone Number *</Label>
                          <FormGroup>
                            <Input type={'text'} value={userInput.phone}
                                   onChange={(event) => setUserInput({...userInput, phone: event.target.value})}/>
                            <p style={{color: 'red'}}>{cstError.phone}</p>
                          </FormGroup>
                        </Col>
                        <Col className="pr-1" md={'3'}>
                          <Label>Email</Label>
                          <FormGroup>
                            <Input type={'email'} value={userInput.email}
                                   onChange={(event) => setUserInput({...userInput, email: event.target.value})}/>
                          </FormGroup>
                        </Col>

                        <Col className="pr-1" md={'3'}>
                          <Label>Monthly Income</Label>
                          <FormGroup>
                            <Input type={'number'} value={userInput.income}
                                   onChange={(event) => setUserInput({...userInput, income: event.target.value})}/>
                          </FormGroup>
                        </Col>
                        <Col className="pr-1" md={'3'}>
                          <Label>Occupation</Label>
                          <FormGroup>
                            <Input type={'text'} value={userInput.occupation}
                                   onChange={(event) => setUserInput({...userInput, occupation: event.target.value})}/>
                          </FormGroup>
                        </Col>
                        <Col className="pr-1" md={'3'}>
                          <Label>Educational Qualification</Label>
                          <FormGroup>
                            <Input type={'text'} value={userInput.education}
                                   onChange={(event) => setUserInput({...userInput, education: event.target.value})}/>
                          </FormGroup>
                        </Col>
                        <Col className="pr-1" md="3">
                          <Label>Religion</Label>
                          <Input type="text" value={userInput.religion}
                                 onChange={(event) => setUserInput({...userInput, religion: event.target.value})}
                          />
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
          <Col md="12">
            <Card>
              <CardHeader>
                <CardTitle tag="h3">Member's KYC</CardTitle>
              </CardHeader>
              <CardBody>
                <Row>
                  <Col md={'6'}>
                    <Label>Aadhar Number</Label>
                    <FormGroup>
                      <Input type={'text'} value={userInput.aadhar}
                             onChange={(event) => setUserInput({...userInput, aadhar: event.target.value})}/>
                      <p style={{color: 'red'}}>{cstError.aadhar}</p>
                    </FormGroup>
                  </Col>
                  <Col md={'6'}>
                    <Label>Voter Number</Label>
                    <FormGroup>
                      <Input type={'text'} value={userInput.voter}
                             onChange={(event) => setUserInput({...userInput, voter: event.target.value})}
                      />
                    </FormGroup>
                  </Col>
                  <Col md={'6'}>
                    <Label>PAN Number</Label>
                    <FormGroup>
                      <Input type={'text'} value={userInput.pan}
                             onChange={(event) => setUserInput({...userInput, pan: event.target.value})}
                      />
                      <p style={{color: 'red'}}>{cstError.pan}</p>
                    </FormGroup>
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
                <CardTitle tag="h3">Member's Corresponding Address</CardTitle>
              </CardHeader>
              <CardBody>
                <Row>
                  <Col md={'6'}>
                    <Label>Full Address with Pin Code</Label>
                    <FormGroup>
                      <Input type="text" value={userInput.address}
                             onChange={(event) => setUserInput({...userInput, address: event.target.value})}/>
                    </FormGroup>
                  </Col>
                  <Col md={'3'}>
                    <Label>Area Type</Label>
                    <FormGroup>
                      <Input type="text" value={userInput.areaType}
                             onChange={(event) => setUserInput({...userInput, areaType: event.target.value})}/>
                    </FormGroup>
                  </Col>
                  <Col md={'3'}>
                    <Label>House Type</Label>
                    <FormGroup>
                      <Input type="text" value={userInput.houseType}
                             onChange={(event) => setUserInput({...userInput, houseType: event.target.value})}/>
                    </FormGroup>
                  </Col>
                  <Col md={'3'}>
                    <Label>Residing Since</Label>
                    <FormGroup>
                      <Input type="text" value={userInput.residingSince}
                             onChange={(event) => setUserInput({...userInput, residingSince: event.target.value})}/>
                    </FormGroup>
                  </Col>
                  <Col md={'3'}>
                    <Label>Residential Land</Label>
                    <FormGroup>
                      <Input type="text" value={userInput.residentialLand}
                             onChange={(event) => setUserInput({...userInput, residentialLand: event.target.value})}/>
                    </FormGroup>
                  </Col>
                  <Col md={'3'}>
                    <Label>Agriculture Land</Label>
                    <FormGroup>
                      <Input type="text" value={userInput.agricultureLand}
                             onChange={(event) => setUserInput({...userInput, agricultureLand: event.target.value})}/>
                    </FormGroup>
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
                <CardTitle tag="h3">Document Upload</CardTitle>
              </CardHeader>
              <CardBody>
                <Row>
                  <Col md={3} className={'mt-auto mb-auto'}>
                    <ProfileImageUpload
                      key={`profile-${userInput.uuid}-${userInput.bankId || authStatus.bankId}`}
                      id={'profile'}
                      setAlert={setAlert}
                      uuid={userInput.uuid}
                      bankId={userInput.bankId || authStatus.bankId}
                      changeBtnClasses="btn-simple"
                      addBtnClasses="btn-simple"
                      removeBtnClasses="btn-simple"
                    />
                    <p className="mt-2 text-center">Upload the profile photo here</p>
                  </Col>
                  <Col md={3} className={'mt-auto mb-auto'}>
                    <ProfileImageUpload
                      key={`signature-${userInput.uuid}-${userInput.bankId || authStatus.bankId}`}
                      id={'signature'}
                      setAlert={setAlert}
                      uuid={userInput.uuid}
                      bankId={userInput.bankId || authStatus.bankId}
                      changeBtnClasses="btn-simple"
                      addBtnClasses="btn-simple"
                      removeBtnClasses="btn-simple"
                    />
                    <p className="mt-2 text-center">Upload Signature here</p>
                  </Col>
                  <Col md={3} className={'mt-auto mb-auto'}>
                    <ProfileImageUpload
                      key={`address-proof-${userInput.uuid}-${userInput.bankId || authStatus.bankId}`}
                      id={'address-proof'}
                      setAlert={setAlert}
                      uuid={userInput.uuid}
                      bankId={userInput.bankId || authStatus.bankId}
                      changeBtnClasses="btn-simple"
                      addBtnClasses="btn-simple"
                      removeBtnClasses="btn-simple"
                    />
                    <p className="mt-2 text-center">Upload Address Proof Document</p>
                  </Col>
                  <Col md={3} className={'mt-auto mb-auto'}>
                    <ProfileImageUpload
                      key={`id-proof-${userInput.uuid}-${userInput.bankId || authStatus.bankId}`}
                      id={'id-proof'}
                      setAlert={setAlert}
                      uuid={userInput.uuid}
                      bankId={userInput.bankId || authStatus.bankId}
                      changeBtnClasses="btn-simple"
                      addBtnClasses="btn-simple"
                      removeBtnClasses="btn-simple"
                    />
                    <p className="mt-2 text-center">Upload ID Document</p>
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
                <CardTitle tag="h3">Nominee Details</CardTitle>
              </CardHeader>
              <CardBody>
                <Form>
                  <Row>
                    <Col className="pr-1" md="3">
                      <Label>Nominee Name</Label>
                      <FormGroup>
                        <Input type={'text'} value={userInput.nominee.name}
                               onChange={(event) => setUserInput({
                                 ...userInput,
                                 nominee: {...userInput.nominee, name: event.target.value}
                               })}/>
                      </FormGroup>
                    </Col>
                    <Col className="pr-1" md="3">
                      <Label>Relation</Label>
                      <FormGroup>
                        <Input type={'text'} value={userInput.nominee.relation}
                               onChange={(event) => setUserInput({
                                 ...userInput,
                                 nominee: {...userInput.nominee, relation: event.target.value}
                               })}/>
                      </FormGroup>
                    </Col>
                    <Col className="pr-1" md="3">
                      <Label>Date of Birth</Label>
                      <FormGroup>
                        <Input type={'date'} value={userInput.nominee.dob}
                               onChange={(event) => setUserInput({
                                 ...userInput,
                                 nominee: {...userInput.nominee, dob: event.target.value}
                               })}/>
                      </FormGroup>
                    </Col>
                    <Col className="pr-1" md="3">
                      <Label>Gender</Label>
                      <Input type="select" name="select" id="genderSelect"
                             value={userInput.nominee.gender}
                             onChange={(event) => setUserInput({
                               ...userInput,
                               nominee: {...userInput.nominee, gender: event.target.value}})}
                      >
                        <option value={'male'}>Male</option>
                        <option value={'female'}>Female</option>
                        <option value={'other'}>Other</option>
                      </Input>
                    </Col>
                    <Col className="pr-1" md="3">
                      <Label>Aadhar Number</Label>
                      <FormGroup>
                        <Input type={'text'} value={userInput.nominee.aadhar}
                               onChange={(event) => setUserInput({
                                 ...userInput,
                                 nominee: {...userInput.nominee, aadhar: event.target.value}
                               })}/>
                      </FormGroup>
                    </Col>
                    <Col className="pr-1" md="3">
                      <Label>Voter Number</Label>
                      <FormGroup>
                        <Input type={'text'} value={userInput.nominee.voter}
                               onChange={(event) => setUserInput({
                                 ...userInput,
                                 nominee: {...userInput.nominee, voter: event.target.value}
                               })}/>
                      </FormGroup>
                    </Col>
                    <Col className="pr-1" md="3">
                      <Label>PAN Number</Label>
                      <FormGroup>
                        <Input type={'text'} value={userInput.nominee.pan}
                               onChange={(event) => setUserInput({
                                 ...userInput,
                                 nominee: {...userInput.nominee, pan: event.target.value}
                               })}/>
                      </FormGroup>
                    </Col>
                  </Row>
                </Form>
              </CardBody>
            </Card>
          </Col>
        </Row>
        <Row>
          <Col md="12">
            <Card>
              <CardHeader>
                <CardTitle tag="h3">Family Details</CardTitle>
              </CardHeader>
              <CardBody>
                <Row>
                  <Col className="pr-1" md="3">
                    <Label>Members Above 18</Label>
                    <FormGroup>
                      <Input type={'text'} value={userInput.familyMembers.membersAbove18}
                             onChange={(event) => setUserInput({
                               ...userInput,
                               familyMembers: {...userInput.familyMembers, membersAbove18: event.target.value}
                             })}/>
                    </FormGroup>
                  </Col>
                  <Col className="pr-1" md="3">
                    <Label>Members Below 18</Label>
                    <FormGroup>
                      <Input type={'text'} value={userInput.familyMembers.membersBelow18}
                             onChange={(event) => setUserInput({
                               ...userInput,
                               familyMembers: {...userInput.familyMembers, membersBelow18: event.target.value}
                             })}/>
                    </FormGroup>
                  </Col>
                  <Col className="pr-1" md="3">
                    <Label>No. of Males</Label>
                    <FormGroup>
                      <Input type={'text'} value={userInput.familyMembers.male}
                             onChange={(event) => setUserInput({
                               ...userInput,
                               familyMembers: {...userInput.familyMembers, male: event.target.value}
                             })}/>
                    </FormGroup>
                  </Col>
                  <Col className="pr-1" md="3">
                    <Label>No. of Females</Label>
                    <FormGroup>
                      <Input type={'text'} value={userInput.familyMembers.female}
                             onChange={(event) => setUserInput({
                               ...userInput,
                               familyMembers: {...userInput.familyMembers, female: event.target.value}
                             })}/>
                    </FormGroup>
                  </Col>
                  <Col className="pr-1" md="3">
                    <Label>Earning Members</Label>
                    <FormGroup>
                      <Input type={'text'} value={userInput.familyMembers.earningMembers}
                             onChange={(event) => setUserInput({
                               ...userInput,
                               familyMembers: {...userInput.familyMembers, earningMembers: event.target.value}
                             })}/>
                    </FormGroup>
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
                <CardTitle tag="h3">Other's Details</CardTitle>
              </CardHeader>
              <CardBody>
                <Row>
                  <Col className="pr-1" md="6">
                    <Label>CRO(Customer Relationship Officer) Name</Label>
                    <FormGroup>
                      <Input type={'text'} value={userInput.croName}
                             onChange={(event) => setUserInput({...userInput, croName: event.target.value})}/>
                    </FormGroup>
                  </Col>
                  <Col className="pr-1" md="6">
                    <Label>CRO(Customer Relationship Officer) Code</Label>
                    <FormGroup>
                      <Input type={'text'} value={userInput.croCode}
                             onChange={(event) => setUserInput({...userInput, croCode: event.target.value})}/>
                    </FormGroup>
                  </Col>
                  <Col className="pr-1" md="6">
                    <Label>BM(Branch Manager) Name</Label>
                    <FormGroup>
                      <Input type={'text'} value={userInput.bmName}
                             onChange={(event) => setUserInput({...userInput, bmName: event.target.value})}/>
                    </FormGroup>
                  </Col>
                  <Col className="pr-1" md="6">
                    <Label>BM(Branch Manager) Code</Label>
                    <FormGroup>
                      <Input type={'text'} value={userInput.bmCode}
                             onChange={(event) => setUserInput({...userInput, bmCode: event.target.value})}/>
                    </FormGroup>
                  </Col>
                  <Col className="pr-1" md="6">
                    <Label>Document Verified By</Label>
                    <FormGroup>
                      <Input type={'text'} value={userInput.documentVerifiedBy}
                             onChange={(event) => setUserInput({...userInput, documentVerifiedBy: event.target.value})}/>
                    </FormGroup>
                  </Col>
                  <Col className="pr-1" md="6">
                    <Label>Document Verified Date</Label>
                    <FormGroup>
                      <Input type={'date'} value={userInput.documentVerifiedDate}
                             onChange={(event) => setUserInput({...userInput, documentVerifiedDate: event.target.value})}/>
                    </FormGroup>
                  </Col>
                </Row>
              </CardBody>
            </Card>
          </Col>
        </Row>
        <Row>
          <Col md="12" className="text-center d-flex justify-content-center align-items-center">
            <CardFooter className="d-flex align-items-center flex-wrap justify-content-center">
              <Spinner color="info" hidden={!progressbar} className="mr-3" />

              <Button
                  className="btn-fill mr-3"
                  color="info"
                  type="button"
                  onClick={onSubmit}
              >
                Save the Update
              </Button>

              {/* Editable Active Status Toggle */}
              <div className="d-flex align-items-center ml-4">
                <span className="mr-2">Status:</span>
                <CustomInput
                    type="switch"
                    id="switch-member-status"
                    className="mb-1"
                    checked={userInput.active === true}
                    onChange={(e) =>
                        setUserInput({
                          ...userInput,
                          active: e.target.checked,
                        })
                    }
                    label=""
                />
                <span
                    className={`ml-2 font-weight-bold ${
                        userInput.active ? 'text-success' : 'text-danger'
                    }`}
                >
                  {userInput.active ? 'Active' : 'Disabled'}
                </span>
              </div>
            </CardFooter>
          </Col>
        </Row>
      </div>
    </>
  );
};

export default EditMember;
