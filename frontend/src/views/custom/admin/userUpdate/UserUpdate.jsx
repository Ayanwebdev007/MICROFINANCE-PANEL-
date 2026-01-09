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
import axios from "axios";
import CstNotification from "../../components/CstNotification";
import ReactBSAlert from "react-bootstrap-sweetalert";
import BankLogoUpload from "../../components/BankLogoUpload";
import Select from "react-select";

const UserUpdate = () => {
    const initInput = {
        bankId: '',
        userId: '',
        name: '',
        email: '',
        phone: '',
        address: '',
        profilePic: '',
        uuid: crypto.randomUUID(),
    };
    const [userInput, setUserInput] = React.useState(initInput);
    const [cstError, setCstError] = React.useState({
        name: '',
        userId: '',
        email: '',
        profilePic: '',
    });
    const [module, setModule] = React.useState({
        tools: false,
        member: false,
        advisor: false,
        employee: false,
        savings: false,
        deposit: false,
        loan: false,
        groupLoan: false,
        journal: false,
        authorize: false,
        report: false,
        verificationAPI: false,
        mobile: false,
    });
    const [progressbar, setProgressbar] = React.useState(false);
    const [fetched, setFetched] = React.useState(false);
    const [bankDropDown, setBankDropDown] = React.useState([]);
    const [userDropDown, setUserDropDown] = React.useState([]);
    const [twoFAisEnabled, setTwoFAisEnabled] = React.useState(false);
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
        axios.get('/api/admin/get-registered-banks')
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

    async function onSubmit() {
        const inputValid = validateInput(userInput);
        if (inputValid) {
            try {
                setProgressbar(true);
                const submitData = await axios.post('/api/admin/update-user-permission', {
                    ...userInput,
                    module: module,
                    twoFAEnabled: twoFAisEnabled,
                });
                if (submitData.data.success) {
                    // setUserInput({...initInput, uuid: crypto.randomUUID(),});
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
            profilePic: '',
        };
        let isValid = true;
        if (!inputValue.name) {
            temp = { ...temp, name: 'this is required' };
            isValid = false;
        }
        if (!inputValue.email) {
            temp = { ...temp, email: 'this is required' };
            isValid = false;
        }
        if (!inputValue.profilePic) {
            setAlert({
                color: 'warning',
                message: 'Please select user profile picture',
                autoDismiss: 7,
                place: 'tc',
                display: true,
                sweetAlert: false,
                timestamp: new Date().getTime(),
            });
            isValid = false;
        }
        setCstError(temp);
        return isValid;
    }

    function getImageUrl(imageUrl) {
        setUserInput({ ...userInput, profilePic: imageUrl });
    }

    async function handleBankSelect(data) {
        setUserInput({
            ...initInput,
            bankId: data.key,
        });
        setUserDropDown([]);

        try {
            setProgressbar(true);
            const fetchData = await axios.post(`/api/admin/get-users-by-bank`, {
                bankId: data.key,
                limit: 100 // Fetch a larger initial batch for users
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

    async function handleUserSearch(inputValue) {
        if (inputValue.length < 2) return;
        try {
            const fetchData = await axios.post(`/api/admin/get-users-by-bank`, {
                bankId: userInput.bankId,
                search: inputValue,
                limit: 20
            });
            if (fetchData.data.success) {
                setUserDropDown(fetchData.data.data);
            }
        } catch (e) {
            console.error("User search failed", e);
        }
    }

    function handleUserSelect(data) {
        setUserInput({
            ...userInput,
            userId: data.key,
            ...data.data,
        });
        setModule(data.data.permissions);
        setTwoFAisEnabled(data.data.twoFAEnabled || false);
    }

    return (
        <>
            <div className="rna-container">
                {alert.display &&
                    <CstNotification color={alert.color} message={alert.message} autoDismiss={alert.autoDismiss}
                        place={alert.place} timestamp={alert.timestamp} />}
                {alert.sweetAlert && <ReactBSAlert
                    success
                    style={{ display: "block", marginTop: "-100px" }}
                    title="Success!"
                    onConfirm={() => setAlert({ ...alert, sweetAlert: false })}
                    onCancel={() => setAlert({ ...alert, sweetAlert: false })}
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
                                                        <p style={{ color: 'red' }}>{cstError.bankId}</p>
                                                    </FormGroup>
                                                </Col>
                                                <Col className="pr-1" md="6">
                                                    <Label>Select an User</Label>
                                                    <FormGroup>
                                                        <Select
                                                            className="react-select info"
                                                            classNamePrefix="react-select"
                                                            name="userSelect"
                                                            onChange={handleUserSelect}
                                                            onInputChange={handleUserSearch}
                                                            options={userDropDown}
                                                            placeholder='Search by Name/ID...'
                                                        />
                                                        <p style={{ color: 'red' }}>{cstError.userId}</p>
                                                    </FormGroup>
                                                </Col>
                                                <Col className="pr-1" md="4">
                                                    <Label>Name</Label>
                                                    <FormGroup>
                                                        <Input type={'text'} value={userInput.name}
                                                            onChange={(e) => setUserInput({ ...userInput, name: e.target.value.toUpperCase() })}
                                                        />
                                                    </FormGroup>
                                                </Col>
                                                <Col className="pr-1" md="4">
                                                    <Label>Email</Label>
                                                    <FormGroup>
                                                        <Input type={'text'} value={userInput.email} readOnly={true} />
                                                    </FormGroup>
                                                </Col>
                                                <Col className="pr-1" md="4">
                                                    <Label>Phone Number</Label>
                                                    <FormGroup>
                                                        <Input type={'text'} value={userInput.phone}
                                                            onChange={(e) => setUserInput({ ...userInput, phone: e.target.value })}
                                                        />
                                                    </FormGroup>
                                                </Col>
                                                <Col className="pr-1" md={'12'}>
                                                    <Label>Full Address with Pin Code</Label>
                                                    <FormGroup>
                                                        <Input type={'textarea'} value={userInput.address}
                                                            aria-colspan={3} readOnly={true} />
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
                                        <h4 className={'text-center'}><small className="text-muted">Set user profile
                                            photo</small></h4>
                                    </Col>
                                </Row>
                            </CardBody>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle tag="h3">Two-Factor Authentication (2FA)</CardTitle>
                            </CardHeader>
                            <CardBody>
                                <Row>
                                    <Col className="d-flex align-items-center mt-2" md={6}>
                                        <span className="">Two-Factor Authentication (Disabled) </span>
                                        <CustomInput
                                            type="switch"
                                            id="switch-2fa"
                                            className="mt-n4 ml-2"
                                            checked={twoFAisEnabled}
                                            onChange={() => setTwoFAisEnabled(!twoFAisEnabled)}
                                        />
                                        <span>(Enabled)</span>
                                    </Col>
                                </Row>
                            </CardBody>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle tag="h3">Select List of Permission to Enable</CardTitle>
                            </CardHeader>
                            <CardBody>
                                <Row>
                                    <Col className="d-flex align-items-center mt-2" md={6}>
                                        <span className="mr-2">(False)</span>
                                        <CustomInput
                                            type="switch"
                                            id="switch-tools"
                                            className="mt-n4"
                                            checked={module.tools}
                                            onChange={() => setModule({ ...module, tools: !module.tools })}
                                        />
                                        <span className="ml-n2">(True) : Tools Module</span>
                                    </Col>
                                    <Col className="d-flex align-items-center mt-2" md={6}>
                                        <span className="mr-2">(False)</span>
                                        <CustomInput
                                            type="switch"
                                            id="switch-verificationAPI"
                                            className="mt-n4"
                                            checked={module.verificationAPI}
                                            onChange={() => setModule({
                                                ...module,
                                                verificationAPI: !module.verificationAPI
                                            })}
                                        />
                                        <span className="ml-n2">(True) : API Module</span>
                                    </Col>
                                    <Col className="d-flex align-items-center mt-2" md={6}>
                                        <span className="mr-2">(False)</span>
                                        <CustomInput
                                            type="switch"
                                            id="switch-member"
                                            className="mt-n4"
                                            checked={module.member}
                                            onChange={() => setModule({ ...module, member: !module.member })}
                                        />
                                        <span className="ml-n2">(True) : Member Module</span>
                                    </Col>
                                    <Col className="d-flex align-items-center mt-2" md={6}>
                                        <span className="mr-2">(False)</span>
                                        <CustomInput
                                            type="switch"
                                            id="switch-advisor"
                                            className="mt-n4"
                                            checked={module.advisor}
                                            onChange={() => setModule({ ...module, advisor: !module.advisor })}
                                        />
                                        <span className="ml-n2">(True) : Advisor Module</span>
                                    </Col>
                                    <Col className="d-flex align-items-center mt-2" md={6}>
                                        <span className="mr-2">(False)</span>
                                        <CustomInput
                                            type="switch"
                                            id="switch-employee"
                                            className="mt-n4"
                                            checked={module.employee}
                                            onChange={() => setModule({ ...module, employee: !module.employee })}
                                        />
                                        <span className="ml-n2">(True) : Employee Module</span>
                                    </Col>
                                    <Col className="d-flex align-items-center mt-2" md={6}>
                                        <span className="mr-2">(False)</span>
                                        <CustomInput
                                            type="switch"
                                            id="switch-savings"
                                            className="mt-n4"
                                            checked={module.savings}
                                            onChange={() => setModule({ ...module, savings: !module.savings })}
                                        />
                                        <span className="ml-n2">(True) : Savings Module</span>
                                    </Col>
                                    <Col className="d-flex align-items-center mt-2" md={6}>
                                        <span className="mr-2">(False)</span>
                                        <CustomInput
                                            type="switch"
                                            id="switch-deposit"
                                            className="mt-n4"
                                            checked={module.deposit}
                                            onChange={() => setModule({ ...module, deposit: !module.deposit })}
                                        />
                                        <span className="ml-n2">(True) : Deposit Module</span>
                                    </Col>
                                    <Col className="d-flex align-items-center mt-2" md={6}>
                                        <span className="mr-2">(False)</span>
                                        <CustomInput
                                            type="switch"
                                            id="switch-loan"
                                            className="mt-n4"
                                            checked={module.loan}
                                            onChange={() => setModule({ ...module, loan: !module.loan })}
                                        />
                                        <span className="ml-n2">(True) : Loan Module</span>
                                    </Col>
                                    <Col className="d-flex align-items-center mt-2" md={6}>
                                        <span className="mr-2">(False)</span>
                                        <CustomInput
                                            type="switch"
                                            id="switch-groupLoan"
                                            className="mt-n4"
                                            checked={module.groupLoan}
                                            onChange={() => setModule({ ...module, groupLoan: !module.groupLoan })}
                                        />
                                        <span className="ml-n2">(True) : Group Loan Module</span>
                                    </Col>
                                    <Col className="d-flex align-items-center mt-2" md={6}>
                                        <span className="mr-2">(False)</span>
                                        <CustomInput
                                            type="switch"
                                            id="switch-journal"
                                            className="mt-n4"
                                            checked={module.journal}
                                            onChange={() => setModule({ ...module, journal: !module.journal })}
                                        />
                                        <span className="ml-n2">(True) : Journal Module</span>
                                    </Col>
                                    <Col className="d-flex align-items-center mt-2" md={6}>
                                        <span className="mr-2">(False)</span>
                                        <CustomInput
                                            type="switch"
                                            id="switch-authorize"
                                            className="mt-n4"
                                            checked={module.authorize}
                                            onChange={() => setModule({ ...module, authorize: !module.authorize })}
                                        />
                                        <span className="ml-n2">(True) : Authorization Module</span>
                                    </Col>
                                    <Col className="d-flex align-items-center mt-2" md={6}>
                                        <span className="mr-2">(False)</span>
                                        <CustomInput
                                            type="switch"
                                            id="switch-report"
                                            className="mt-n4"
                                            checked={module.report}
                                            onChange={() => setModule({ ...module, report: !module.report })}
                                        />
                                        <span className="ml-n2">(True) : Report Module</span>
                                    </Col>
                                    <Col className="d-flex align-items-center mt-2" md={6}>
                                        <span className="mr-2">(False)</span>
                                        <CustomInput
                                            type="switch"
                                            id="switch-mobile"
                                            className="mt-n4"
                                            checked={module.mobile}
                                            onChange={() => setModule({ ...module, mobile: !module.mobile })}
                                        />
                                        <span className="ml-n2">(True) : Mobile APP Module</span>
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
                                <Spinner color="info" hidden={!progressbar} />
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

export default UserUpdate;