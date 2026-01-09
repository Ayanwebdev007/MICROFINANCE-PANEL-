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
    Col, Spinner,
} from "reactstrap";
import axios from "axios";
import CstNotification from "../../components/CstNotification";
import ReactBSAlert from "react-bootstrap-sweetalert";
import BankLogoUpload from "../../components/BankLogoUpload";
import Select from "react-select";

const UserSignup = () => {
    const initInput = {
        bankId: '',
        name: '',
        userId: '',
        email: '',
        appPermissionExist: '',
        phone: '',
        address: '',
        profilePic: '',
        uuid: crypto.randomUUID(),
    };
    const [userInput, setUserInput] = React.useState(initInput);
    const [cstError, setCstError] = React.useState({
        name: '',
        email: '',
    });
    const [progressbar, setProgressbar] = React.useState(false);
    const [fetched, setFetched] = React.useState(false);
    const [bankDropDown, setBankDropDown] = React.useState([]);
    const [userDropDown, setUserDropDown] = React.useState([]);
    const [alert, setAlert] = React.useState({
        color: 'success',
        message: 'test message',
        autoDismiss: 7,
        place: 'tc',
        display: false,
        sweetAlert: false,
        timestamp: new Date().getTime(),

    });

    if (!fetched) {
        setFetched(true);
        axios.get('/api/admin/get-associated-branch')
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
    }

    async function onSubmit(){
        const inputValid = validateInput(userInput);
        if(inputValid){
            try {
                setProgressbar(true);
                const submitData = await axios.post('/api/admin/create-new-mobile-app-user', userInput);
                if(submitData.data.success){
                    setUserInput({...initInput, uuid: crypto.randomUUID(),});
                    if(submitData.data.existingUser){
                        setAlert({
                            color: 'success',
                            message: submitData.data.success,
                            autoDismiss: 7,
                            place: 'tc',
                            display: true,
                            sweetAlert: false,
                            timestamp: new Date().getTime(),
                        });
                    }else {
                        setAlert({
                            color: 'success',
                            message: submitData.data.success,
                            autoDismiss: 7,
                            place: 'tc',
                            display: true,
                            sweetAlert: true,
                            timestamp: new Date().getTime(),
                        });
                    }
                }else {
                    setAlert({
                        color: 'warning',
                        message: submitData.data.message,
                        autoDismiss: 7,
                        place: 'tc',
                        display: true,
                        sweetAlert: false,
                        timestamp: new Date().getTime(),
                    });
                }
                setProgressbar(false);
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
        }
    }

    function validateInput(inputValue) {
        let temp = {
            name: '',
            email: '',
            userId: '',
        };
        let isValid = true;
        if (!inputValue.userId){
            temp = {...temp, userId: 'this is required'};
            isValid = false;
        }

        setCstError(temp);
        return isValid;
    }

    function getImageUrl(imageUrl){
        setUserInput({...userInput, profilePic: imageUrl});
    }

    async function handleBankSelect(data) {
        setUserInput({
            ...userInput,
            bankId: data.key,
        });
        try {
            setProgressbar(true);
            const fetchData = await axios.post(`/api/admin/get-users-by-bank`, {
                bankId: data.key,
            });
            setProgressbar(false);
            if (fetchData.data.success) {
                setUserDropDown(fetchData.data.data);
            } else {
                setAlert({
                    color: 'warning',
                    message: fetchData.data.error,
                    autoDismiss: 7,
                    place: 'tc',
                    display: true,
                    timestamp: new Date().getTime(),
                });
            }
        } catch (e) {
            console.log(e.toLocaleString())
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

    function handleUserSelect(data) {
        setUserInput({
            ...userInput,
            appPermissionExist: data.data.agentAppPermission,
            userId: data.key,
            ...data.data,
        });

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
                                <CardTitle tag="h3">Basic Details</CardTitle>
                            </CardHeader>
                            <CardBody>
                                <Row>
                                    <Col md={9}>
                                        <Form>
                                            <Row>
                                                <Col className="pr-1" md="6">
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
                                                <Col className="pr-1" md="6">
                                                    <Label>Full Name</Label>
                                                    <FormGroup>
                                                        <Input type={'text'} value={userInput.name} readOnly={true} />
                                                    </FormGroup>
                                                </Col>
                                                <Col className="pr-1" md="6">
                                                    <Label>Email</Label>
                                                    <FormGroup>
                                                        <Input type={'text'} value={userInput.email} readOnly={true}/>
                                                    </FormGroup>
                                                </Col>
                                                <Col className="pr-1" md="6">
                                                    <Label>Phone Number</Label>
                                                    <FormGroup>
                                                        <Input type={'text'} value={userInput.phone} readOnly={true}/>
                                                    </FormGroup>
                                                </Col>
                                                <Col className="pr-1" md="6">
                                                    <Label>App Permission Exist(YES/NO)</Label>
                                                    <FormGroup>
                                                        <Input
                                                            type="text"
                                                            value={
                                                                userInput.appPermissionExist === '' ? '' : userInput.appPermissionExist ? 'YES' : 'NO'
                                                            }
                                                            readOnly
                                                        />

                                                    </FormGroup>
                                                </Col>
                                                <Col className="pr-1" md={'12'}>
                                                    <Label>Full Address with Pin Code</Label>
                                                    <FormGroup>
                                                        <Input type={'textarea'} value={userInput.address} aria-colspan={3} readOnly={true}/>
                                                    </FormGroup>
                                                </Col>
                                            </Row>
                                        </Form>
                                    </Col>
                                    <Col md={3} className={'mt-auto mb-auto'}>
                                        <BankLogoUpload
                                            uuid={userInput.uuid}
                                            type={'profile-image'}
                                            logoUrl={userInput.profilePic}
                                            setAlert={setAlert}
                                            getImageUrl={getImageUrl}
                                            changeBtnClasses="btn-simple"
                                            addBtnClasses="btn-simple"
                                            removeBtnClasses="btn-simple"
                                        />
                                        <h4 className={'text-center'}><small className="text-muted">Set user profile photo</small></h4>
                                    </Col>
                                </Row>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
                <Row>
                    <Col md="12" className={'text-center'}>
                        <CardFooter>
                            <center>
                                <Spinner color="info" hidden={!progressbar}/>
                            </center>
                            <Button className="btn-fill" color="info" type="button" onClick={onSubmit}>
                                Submit
                            </Button>
                        </CardFooter>
                    </Col>
                </Row>
            </div>
        </>
    );
};

export default UserSignup;