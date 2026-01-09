import React from "react";
import 'firebase/compat/app-check';
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
import axios from "axios";
import NotificationAlert from "react-notification-alert";
import SweetAlert from 'react-bootstrap-sweetalert';
import {CircularProgress, LinearProgress} from "@mui/material";
import ProfileImageUpload from "../../components/ProfileImageUpload";
import {useSelector} from "react-redux";

function KycForm(props) {
  const initValue = {
    name: '',
    guardian: '',
    gender: '',
    dateOfBirth: '',
    membership: true,
    accountType: '',
    rank: '',
    referrer: '',
    phone: '',
    income: '',
    religion: '',
    education: '',
    idType: '',
    idNumber: '',
    fee: 0,
    date: new Date().toISOString().split('T')[0],
    address: '',
  };
  const notificationAlertRef = React.useRef(null);
  const [fetched, setFetched] = React.useState(false);
  const [agentSelect, setAgentSelect] = React.useState([]);
  const [uuid, setUuid] = React.useState('');
  const [sweetAlert, setSweetAlert] = React.useState({render: false, message: '', type: 'success', title: 'Success'});
  const [details, setDetails] = React.useState(initValue);
  const [cstError, setCstError] = React.useState({...initValue, installment: ''});
  const [showProgress, setShowProgress] = React.useState(false);
  const [referrerDetails, setReferrerDetails] = React.useState({rank: 16, info: ''});

  const authStatus = useSelector((state) => state.auth.authState);

  const notify = (message, color) => {
    const options = {
      place: 'tc',
      message: (
        <div>{message}</div>
      ),
      type: color,
      icon: "tim-icons icon-bell-55",
      autoDismiss: 5,
    };
    notificationAlertRef.current.notificationAlert(options);
  };

  if (!fetched){
    setFetched(true);
    setUuid(create_UUID());
    axios.get('/api/advisor/get-advisor-list')
      .then(function (value){
        if (value.data.success){
          processAgents(value.data.advisorList);
        }else if (value.data.info){
          notify(value.data.info, 'info');
        }else {
          // notify('No Advisor found', 'danger');
          notify(value.data.error, 'danger');
        }
      }).catch(function (error){
      notify(error, 'danger');
    });
  }

  async function onSubmit() {
    const checkInput = validateInput(details);

    if (checkInput){
      setShowProgress(true);

      try {
        const submit = await axios.post('/api/advisor/add-new-advisor', {...details, uuid: uuid});
        if (submit.data.success){
          setUuid(crypto.randomUUID());
          setDetails({
            ...initValue,
            date: details.date,
            referrer: details.referrer,
            gender: details.gender,
          });

          setShowProgress(false);
          setSweetAlert({
            render: true,
            message: submit.data.success,
            type: 'success',
            title: 'Success!'
          });
        }else {
          setShowProgress(false);
          setSweetAlert({
            render: true,
            message: submit.data.error,
            type: 'danger',
            title: 'Failed to process!'
          });
        }
      }catch (e) {
        setShowProgress(false);
        console.log(e);
        notify(e.toString(), 'danger', 10);
      }
    }
  }

  function validateInput(userInput) {
    let valid = true;
    let errorObj = {};
    if (!userInput.name){
      errorObj = {...errorObj, name: 'this field is required'};
      valid = false;
    }
    if (!userInput.rank){
      errorObj = {...errorObj, rank: 'this field is required'};
      valid = false;
    }else if (parseInt(userInput.rank) >= referrerDetails.rank){
      errorObj = {...errorObj, rank: 'should be less than referrer and max 15'};
      valid = false;
    }
    if (!userInput.phone && userInput.phone.length !== 10){
      errorObj = {...errorObj, phone: 'enter 10 digit phone number'};
      valid = false;
    }

    setCstError({...cstError, ...errorObj});
    return valid
  }

  function processAgents(agents){
    const agentArray = [];

    agentArray.push({
      value: "",
      label: "Select an Option",
      isDisabled: true,
    });

    agents.map(function (agent){
      agentArray.push({
        key: agent.id,
        label: `${agent.id} - ${agent.name}`,
        obj: agent
      });
    });
    setAgentSelect(agentArray);
  }

  function handleAgentSelect(value){
    setReferrerDetails({
      rank: parseInt(value.rank),
      info: `${value.name} [Rank - ${value.rank}]`,
    });
    setDetails({
      ...details,
      rank: ((parseInt(value.rank) - 1) || '0'),
      referrer: value.id,
    });
  }

  function create_UUID(){
    let dt = new Date().getTime();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (dt + Math.random() * 16) % 16 | 0;
      dt = Math.floor(dt / 16);
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  function onSweetAlertAccept(){
    setSweetAlert({render: false, message: '', type: 'success', title: ''});
    setUuid(create_UUID());
  }

  return (
    <>
      <div className="rna-container">
        <NotificationAlert ref={notificationAlertRef} />
      </div>
      <div className={'mb-2'}>
        {showProgress ? <LinearProgress /> : null}
      </div>
      {sweetAlert.render? <SweetAlert
        {...{[sweetAlert.type]: sweetAlert.type}}
        style={{display: "block",marginTop: "-100px"}}
        title={sweetAlert.title}
        onConfirm={() => onSweetAlertAccept()}
        onCancel={() => setSweetAlert({render: false, message: '', type: 'success', title: ''})}
        confirmBtnBsStyle="info"
      >
        {sweetAlert.message}
      </SweetAlert>: null}
      <div className="content">
        <Card >
          <Form autoComplete={'off'} >
            <CardHeader>
              <CardTitle tag="h4">Basic Details</CardTitle>
            </CardHeader>
            <CardBody>
              <Card>
                <Row>
                  <Col md={'3'}>
                    <Label>Name</Label>
                    <FormGroup className={cstError.name? 'has-danger' : 'has-success'}>
                      <Input type={'text'} id={'name'} value={details.name}
                             style={{backgroundColor: props.color}}
                             onChange={(event) => setDetails({...details, name: (event.target.value).toUpperCase()})}
                      />
                      <p style={{color: 'red'}}>{cstError.name}</p>
                    </FormGroup>
                  </Col>
                  <Col md={3}>
                    <Label>Guardian Name</Label>
                    <FormGroup className={cstError.guardian? 'has-danger' : 'has-success'}>
                      <Input type={'text'}
                             id={'guardian'} value={details.guardian}
                             style={{backgroundColor: props.color}}
                             onChange={(event) => setDetails({...details, guardian: (event.target.value).toUpperCase()})}
                      />
                      <p style={{color: 'red'}}>{cstError.guardian}</p>
                    </FormGroup>
                  </Col>
                  <Col md={'3'}>
                    <Label>Date of Birth</Label>
                    <FormGroup>
                      <FormGroup>
                        <Input type={'date'} id={'dateOfBirth'} value={details.dateOfBirth}
                               style={{backgroundColor: props.color}}
                               onChange={(event) => setDetails({...details, dateOfBirth: event.target.value})}
                        />
                      </FormGroup>
                    </FormGroup>
                  </Col>
                  <Col md={'3'}>
                    <Label>Gender</Label>
                    <FormGroup>
                      <Select
                        className={`react-select info ${cstError.gender? 'has-danger' : 'has-success'}`}
                        classNamePrefix="react-select"
                        name="genderSelect"
                        onChange={(value) => setDetails({...details, gender: value.value})}
                        options={[
                          {
                            value: "",
                            label: "Select an Option",
                            isDisabled: true,
                          },
                          {value: "M", label: "Male"},
                          {value: "F", label: "Female"},
                        ]}
                        placeholder="Select an Option"
                      />
                      <p style={{color: 'red'}}>{cstError.gender}</p>
                    </FormGroup>
                  </Col>
                  <Col md={3}>
                    <Label>Member Joining Date</Label>
                    <FormGroup>
                      <FormGroup>
                        <Input type={'date'} id={'date'} value={details.date}
                               style={{backgroundColor: props.color}}
                               onChange={(event) => setDetails({...details, date: event.target.value})}
                        />
                      </FormGroup>
                    </FormGroup>
                  </Col>
                  <Col md={3}>
                    <Label>Membership Fee</Label>
                    <FormGroup>
                      <Input type={'text'}
                             id={'fee'} value={details.fee}
                             style={{backgroundColor: props.color}}
                             onChange={(event) => setDetails({...details, fee: parseInt(event.target.value) || 0})}
                      />
                    </FormGroup>
                  </Col>
                </Row>
              </Card>
            </CardBody>
            <CardHeader>
              <CardTitle tag="h4">Referral Details</CardTitle>
            </CardHeader>
            <CardBody>
              <Card>
                <Row>
                  <Col md={3}>
                    <Label>Referrer Client Id</Label>
                    <FormGroup>
                      <Select
                        className="react-select info"
                        classNamePrefix="react-select"
                        name="agentSelect"
                        onChange={(value) => handleAgentSelect(value.obj)}
                        options={agentSelect}
                        placeholder="Select an Option"
                      />
                      <p style={{color: 'red'}}>{cstError.referrer}</p>
                    </FormGroup>
                  </Col>
                  <Col md={3}>
                    <Label>Referrer Details</Label>
                    <FormGroup>
                      <Input type={'text'}
                             id={'rank'} value={referrerDetails.info}
                             style={{backgroundColor: props.color}}
                      />
                    </FormGroup>
                  </Col>
                  <Col md={3}>
                    <Label>User Rank</Label>
                    <FormGroup className={cstError.rank? 'has-danger' : 'has-success'}>
                      <Input type={'text'}
                             id={'rank'} value={details.rank}
                             style={{backgroundColor: props.color}}
                             onChange={(event) => setDetails({...details, rank: (parseInt(event.target.value) || '').toString()})}
                      />
                      <p style={{color: 'red'}}>{cstError.rank}</p>
                    </FormGroup>
                  </Col>
                </Row>
              </Card>
            </CardBody>
            <CardHeader>
              <CardTitle tag="h4">Other Details</CardTitle>
            </CardHeader>
            <CardBody>
              <Card>
                <Row>
                  <Col md={3}>
                    <Label>Phone Number</Label>
                    <FormGroup className={cstError.phone? 'has-danger' : 'has-success'}>
                      <Input type={'text'}
                             id={'phone'} value={details.phone}
                             style={{backgroundColor: props.color}}
                             onChange={(event) => setDetails({...details, phone: (parseInt(event.target.value) || '').toString()})}
                      />
                      <p style={{color: 'red'}}>{cstError.phone}</p>
                    </FormGroup>
                  </Col>
                  <Col md={3}>
                    <Label>Educational Qualification</Label>
                    <FormGroup>
                      <Select
                        className="react-select info"
                        classNamePrefix="react-select"
                        name="educationSelect"
                        onChange={(value) => setDetails({...details, education: value.value})}
                        options={[
                          {
                            value: "",
                            label: "Select an Option",
                            isDisabled: true,
                          },
                          {value: 'Secondary', label: 'Secondary'},
                          {value: 'Higher Secondary', label: 'Higher Secondary'},
                          {value: 'Graduate', label: 'Graduate'},
                          {value: 'Post Graduate', label: 'Post Graduate'},
                          {value: 'Other', label: 'Other'}
                        ]}
                        placeholder="Select an Option"
                      />
                    </FormGroup>
                  </Col>
                  <Col md={3}>
                    <Label>Monthly Income</Label>
                    <FormGroup>
                      <Input type="text" autoComplete="off" value={details.income}
                             style={{backgroundColor: props.color}}
                             onChange={(event) => setDetails({...details, income: (parseInt(event.target.value) || '').toString()})}
                      />
                    </FormGroup>
                  </Col>
                  <Col md={3}>
                    <Label>ID Type</Label>
                    <FormGroup >
                      <Select
                        className={`react-select info`}
                        classNamePrefix="react-select"
                        name="idTypeSelect"
                        onChange={(value) => setDetails({...details, idType: value.value})}
                        options={[
                          {
                            value: "",
                            label: "Select an Option",
                            isDisabled: true,
                          },
                          {value: "Aadher Card", label: "Aadher Card"},
                          {value: "Voter Id", label: "Voter Id"},
                          {value: "Ration Card", label: "Ration Card"},
                          {value: "Passport", label: "Passport"},
                          {value: "Pan Card", label: "Pan Card"},
                        ]}
                        placeholder="Select an Option"
                      />
                    </FormGroup>
                  </Col>
                  <Col md={3}>
                    <Label>Religion</Label>
                    <FormGroup>
                      <Select
                        className="react-select info"
                        classNamePrefix="react-select"
                        name="religionSelect"
                        onChange={(value) => setDetails({...details, religion: value.value})}
                        options={[
                          {
                            value: "",
                            label: "Select an Option",
                            isDisabled: true,
                          },
                          {value: 'Islam', label: 'Islam'},
                          {value: 'Hindu', label: 'Hindu'},
                          {value: 'Christian', label: 'Christian'},
                          {value: 'Other', label: 'Other'}
                        ]}
                        placeholder="Select an Option"
                      />
                    </FormGroup>
                  </Col>
                  <Col md={3}>
                    <Label>ID Number</Label>
                    <FormGroup >
                      <Input type="text" autoComplete="off" value={details.idNumber}
                             style={{backgroundColor: props.color}}
                             onChange={(event) => setDetails({...details, idNumber: event.target.value})}
                      />
                    </FormGroup>
                  </Col>
                  <Col className="pr-1" md={'12'}>
                    <Label>Full Address with Pin Code</Label>
                    <FormGroup>
                      <Input type={'textarea'} value={details.address} aria-colspan={3}
                             onChange={(event) => setDetails({...details, address: event.target.value})}/>
                    </FormGroup>
                  </Col>
                </Row>
              </Card>
            </CardBody>
            <CardBody>
              <Card>
                <Row className={'text-center'}>
                  <Col md="4" sm="4">
                    <CardTitle tag="h4">Profile Image</CardTitle>
                    <ProfileImageUpload
                      id={'profile'}
                      uuid={details.uuid}
                      bankId={authStatus.bankId}
                      changeBtnClasses="btn-simple"
                      addBtnClasses="btn-simple"
                      removeBtnClasses="btn-simple"
                    />
                  </Col>
                  <Col md="4" sm="4">
                    <CardTitle tag="h4">Signature Image</CardTitle>
                    <ProfileImageUpload
                      id={'signature'}
                      uuid={details.uuid}
                      bankId={authStatus.bankId}
                      changeBtnClasses="btn-simple"
                      addBtnClasses="btn-simple"
                      removeBtnClasses="btn-simple"
                    />
                  </Col>
                  <Col md="4" sm="4">
                    <CardTitle tag="h4">Scanned ID Card</CardTitle>
                    <ProfileImageUpload
                      id={'idCard'}
                      uuid={details.uuid}
                      bankId={authStatus.bankId}
                      changeBtnClasses="btn-simple"
                      addBtnClasses="btn-simple"
                      removeBtnClasses="btn-simple"
                    />
                  </Col>
                </Row>
              </Card>
            </CardBody>
            <CardFooter className={'text-center'}>
              <div className={'mb-2'}>
                {showProgress ? <CircularProgress style={{color: '#75E6DA'}} /> : null}
              </div>
              <Button className="btn-fill" color="success" disabled={showProgress} type="button" onClick={onSubmit}>
                Submit
              </Button>
            </CardFooter>
          </Form>
        </Card>
      </div>
    </>
  )
}

export default KycForm;
