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

const BankCreation = () => {
    const currentDate = new Date().toISOString().split('T')[0];
    const initInput = {
        bankName: '',
        displayName: '',
        registrationCode: '',
        address: '',
        pan: '',
        tan: '',
        gst: '',
        domainName: '',
        startDate: currentDate,
        renewDate: '',
        email: '',
        phone: '',
        logo: '',
        uuid: crypto.randomUUID(),
    };

    console.log(initInput.startDate)
    const [userInput, setUserInput] = React.useState(initInput);
    const [cstError, setCstError] = React.useState({
        bankName: '',
        displayName: '',
        registrationCode: '',
        // domainName: '',
        logo: '',
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
    const [alert, setAlert] = React.useState({
        color: 'success',
        message: 'test message',
        autoDismiss: 7,
        place: 'tc',
        display: false,
        sweetAlert: false,
        timestamp: new Date().getTime(),
    });

    async function onSubmit() {
        const inputValid = validateInput(userInput);
        if (inputValid) {
            try {
                setProgressbar(true);
                const submitData = await axios.post('/api/admin/create-new-bank', { ...userInput, module: module });
                if (submitData.data.success) {
                    setUserInput({ ...initInput, uuid: crypto.randomUUID(), });
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
            bankName: '',
            displayName: '',
            registrationCode: '',
            logo: '',
            startDate: '',
            renewDate: ''
        };
        let isValid = true;
        if (!inputValue.bankName) {
            temp = { ...temp, bankName: 'this is required' };
            isValid = false;
        }
        if (!inputValue.displayName) {
            temp = { ...temp, displayName: 'this is required' };
            isValid = false;
        }
        if (!inputValue.startDate) {
            temp = { ...temp, startDate: 'this is required' };
            isValid = false;
        }
        if (!inputValue.renewDate) {
            temp = { ...temp, renewDate: 'this is required' };
            isValid = false;
        }
        if (!inputValue.registrationCode) {
            temp = { ...temp, registrationCode: 'this is required' };
            isValid = false;
        }
        // if (!inputValue.domainName) {
        //     temp = {...temp, domainName: 'this is required'};
        //     isValid = false;
        // }
        if (!inputValue.logo) {
            setAlert({
                color: 'warning',
                message: 'Please select a logo for the bank',
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
        setUserInput({ ...userInput, logo: imageUrl });
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
                                                    <Label>Bank/Microfinance Name</Label>
                                                    <FormGroup>
                                                        <Input type={'text'} value={userInput.bankName}
                                                            onChange={(event) => setUserInput({
                                                                ...userInput,
                                                                bankName: event.target.value.toUpperCase()
                                                            })} />
                                                        <p style={{ color: 'red' }}>{cstError.bankName}</p>
                                                    </FormGroup>
                                                </Col>
                                                <Col className="pr-1" md="6">
                                                    <Label>Brand Name (Short)</Label>
                                                    <FormGroup>
                                                        <Input type={'text'} value={userInput.displayName}
                                                            onChange={(event) => setUserInput({
                                                                ...userInput,
                                                                displayName: event.target.value
                                                            })} />
                                                        <p style={{ color: 'red' }}>{cstError.displayName}</p>
                                                    </FormGroup>
                                                </Col>
                                                <Col className="pr-1" md="6">
                                                    <Label>Registration Number</Label>
                                                    <FormGroup>
                                                        <Input type={'text'} value={userInput.registrationCode}
                                                            onChange={(event) => setUserInput({
                                                                ...userInput,
                                                                registrationCode: event.target.value
                                                            })} />
                                                        <p style={{ color: 'red' }}>{cstError.registrationCode}</p>
                                                    </FormGroup>
                                                </Col>
                                                <Col className="pr-1" md="6">
                                                    <Label>Email Id</Label>
                                                    <FormGroup>
                                                        <Input type={'text'} value={userInput.email}
                                                            onChange={(event) => setUserInput({
                                                                ...userInput,
                                                                email: event.target.value
                                                            })} />
                                                    </FormGroup>
                                                </Col>
                                                <Col className="pr-1" md="4">
                                                    <Label>PAN Id</Label>
                                                    <FormGroup>
                                                        <Input type={'text'} value={userInput.pan}
                                                            onChange={(event) => setUserInput({
                                                                ...userInput,
                                                                pan: event.target.value
                                                            })} />
                                                    </FormGroup>
                                                </Col>
                                                <Col className="pr-1" md="4">
                                                    <Label>TAN Id</Label>
                                                    <FormGroup>
                                                        <Input type={'text'} value={userInput.tan}
                                                            onChange={(event) => setUserInput({
                                                                ...userInput,
                                                                tan: event.target.value
                                                            })} />
                                                    </FormGroup>
                                                </Col>
                                                <Col className="pr-1" md="4">
                                                    <Label>GST Id</Label>
                                                    <FormGroup>
                                                        <Input type={'text'} value={userInput.gst}
                                                            onChange={(event) => setUserInput({
                                                                ...userInput,
                                                                gst: event.target.value
                                                            })} />
                                                    </FormGroup>
                                                </Col>
                                                {/* create three fields */}
                                                <Col className="pr-1" md="4">
                                                    <Label>Domain name(Optional)</Label>
                                                    <FormGroup>
                                                        <Input type={'text'} value={userInput.domainName}
                                                            onChange={(event) => setUserInput({
                                                                ...userInput,
                                                                domainName: event.target.value
                                                            })} />
                                                        <p style={{ color: 'red' }}>{cstError.domainName}</p>
                                                    </FormGroup>
                                                </Col>
                                                <Col className="pr-1" md="4">
                                                    <Label>Start date *</Label>
                                                    <FormGroup>
                                                        <Input type={'date'} value={userInput.startDate}
                                                            onChange={(event) => setUserInput({
                                                                ...userInput,
                                                                startDate: event.target.value
                                                            })} />
                                                        <p style={{ color: 'red' }}>{cstError.startDate}</p>
                                                    </FormGroup>
                                                </Col>
                                                <Col className="pr-1" md="4">
                                                    <Label>Renew date *</Label>
                                                    <FormGroup>
                                                        <Input type={'date'} value={userInput.renewDate}
                                                            onChange={(event) => setUserInput({
                                                                ...userInput,
                                                                renewDate: event.target.value
                                                            })} />
                                                        <p style={{ color: 'red' }}>{cstError.renewDate}</p>
                                                    </FormGroup>
                                                </Col>
                                                <Col className="pr-1" md={'12'}>
                                                    <Label>Full Address with Pin Code</Label>
                                                    <FormGroup>
                                                        <Input type={'textarea'} value={userInput.address}
                                                            aria-colspan={3}
                                                            onChange={(event) => setUserInput({
                                                                ...userInput,
                                                                address: event.target.value
                                                            })} />
                                                    </FormGroup>
                                                </Col>
                                            </Row>
                                        </Form>
                                    </Col>
                                    <Col md={3} className={'mt-auto mb-auto'}>
                                        <BankLogoUpload
                                            uuid={userInput.uuid}
                                            type={'brand-image'}
                                            getImageUrl={getImageUrl}
                                            setAlert={setAlert}
                                            changeBtnClasses="btn-simple"
                                            addBtnClasses="btn-simple"
                                            removeBtnClasses="btn-simple"
                                        />
                                        <h4 className={'text-center'}><small className="text-muted">Select Brand Logo
                                            here</small></h4>
                                    </Col>
                                </Row>
                            </CardBody>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle tag="h3">Select List of Modules to Enable</CardTitle>
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

export default AddMember;
