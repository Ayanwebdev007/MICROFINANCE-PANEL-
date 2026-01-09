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
import {useSelector} from "react-redux";
import Select from "react-select";

const BranchCreation = () => {
    const initInput = {
        bankId: '',
        bankName: '',
        displayName: '',
        registrationCode: '',
        address: '',
        pan: '',
        tan: '',
        gst: '',
        email: '',
        phone: '',
        branchCode: '',
        logo: '',
        uuid: crypto.randomUUID(),
    };
    const [userInput, setUserInput] = React.useState(initInput);
    const [cstError, setCstError] = React.useState({
        bankId: '',
        bankName: '',
        displayName: '',
        registrationCode: '',
        logo: '',
    });
    const [module, setModule] = React.useState({
        member: false,
        tools: false,
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
    const [bankDropDown, setBankDropDown] = React.useState([]);
    const [fetched, setFetched] = React.useState(false);
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
                    const mainBanks = value.data.data.filter((bank) => bank.isMainBranch);
                    setBankDropDown(mainBanks);
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
    const authStatus = useSelector((state) => state.auth.authState);

    async function onSubmit() {
        const inputValid = await validateInput(userInput);

        if (inputValid) {
            try {
                setProgressbar(true);
                const submitData = await axios.post('/api/admin/create-new-branch', {...userInput, module: module});
                if (submitData.data.success) {
                    setUserInput({...initInput, uuid: crypto.randomUUID(),});
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

    async function validateInput(inputValue) {
        let temp = {
            bankId: '',
            bankName: '',
            displayName: '',
            registrationCode: '',
            logo: '',
        };
        let isValid = true;
        if (!inputValue.bankId) {
            temp = {...temp, bankId: 'this is required'};
            isValid = false;
        }
        if (!inputValue.bankName) {
            temp = {...temp, bankName: 'this is required'};
            isValid = false;
        }
        if (!inputValue.displayName) {
            temp = {...temp, displayName: 'this is required'};
            isValid = false;
        }
        if (!inputValue.registrationCode) {
            temp = {...temp, registrationCode: 'this is required'};
            isValid = false;
        }
        if (!inputValue.branchCode) {
            temp = {...temp, branchCode: 'this is required'};
            isValid = false;
        }
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
        // Validate if Branch Code exists for different branch
        try {
            setProgressbar(true);
            const validateBranchCode = await axios.post('/api/admin/validate-branch-code', {
                branchCode: inputValue.branchCode,
                mainBranchId: inputValue.bankId,
            });
            if (!validateBranchCode.data.success) {
                temp = {...temp, branchCode: validateBranchCode.data.error || 'Please select different branch code'};
                isValid = false;
            }
        }catch(err) {
            setAlert({
                color: 'danger',
                message: err.toLocaleString(),
                autoDismiss: 7,
                place: 'tc',
                display: true,
                sweetAlert: false,
                timestamp: new Date().getTime(),
            });
        }finally {
            setProgressbar(false);
        }

        setCstError(temp);
        return isValid;
    }

    function getImageUrl(imageUrl) {
        setUserInput({...userInput, logo: imageUrl});
    }

    function handleBankSelect(data) {
        setUserInput({
            ...userInput,
            bankId: data.key,
        });
        setModule(data.data.module);
    }

    return (
        <>
            <div className="rna-container">
                {alert.display &&
                    <CstNotification color={alert.color} message={alert.message} autoDismiss={alert.autoDismiss}
                                     place={alert.place} timestamp={alert.timestamp}/>}
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
                                    <Col md={9}>
                                        <Form>
                                            <Row>
                                                <Col className="pr-1" md="12">
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
                                                    <Label>Branch Name</Label>
                                                    <FormGroup>
                                                        <Input type={'text'} value={userInput.bankName}
                                                               onChange={(event) => setUserInput({
                                                                   ...userInput,
                                                                   bankName: event.target.value.toUpperCase()
                                                               })}/>
                                                        <p style={{color: 'red'}}>{cstError.bankName}</p>
                                                    </FormGroup>
                                                </Col>
                                                <Col className="pr-1" md="6">
                                                    <Label>Brand Name (Short)</Label>
                                                    <FormGroup>
                                                        <Input type={'text'} value={userInput.displayName}
                                                               onChange={(event) => setUserInput({
                                                                   ...userInput,
                                                                   displayName: event.target.value
                                                               })}/>
                                                        <p style={{color: 'red'}}>{cstError.displayName}</p>
                                                    </FormGroup>
                                                </Col>
                                                <Col className="pr-1" md="4">
                                                    <Label>Registration Number</Label>
                                                    <FormGroup>
                                                        <Input type={'text'} value={userInput.registrationCode}
                                                               onChange={(event) => setUserInput({
                                                                   ...userInput,
                                                                   registrationCode: event.target.value
                                                               })}/>
                                                        <p style={{color: 'red'}}>{cstError.registrationCode}</p>
                                                    </FormGroup>
                                                </Col>
                                                <Col className="pr-1" md="4">
                                                    <Label>Email Id</Label>
                                                    <FormGroup>
                                                        <Input type={'text'} value={userInput.email}
                                                               onChange={(event) => setUserInput({
                                                                   ...userInput,
                                                                   email: event.target.value
                                                               })}/>
                                                    </FormGroup>
                                                </Col>
                                                <Col className="pr-1" md="4">
                                                    <Label>Branch Code</Label>
                                                    <FormGroup>
                                                        <Input type={'text'} value={userInput.branchCode}
                                                               onChange={(event) => setUserInput({
                                                                   ...userInput,
                                                                   branchCode: event.target.value
                                                               })}/>
                                                        <p style={{color: 'red'}}>{cstError.branchCode}</p>
                                                    </FormGroup>
                                                </Col>
                                                <Col className="pr-1" md="4">
                                                    <Label>PAN Id</Label>
                                                    <FormGroup>
                                                        <Input type={'text'} value={userInput.pan}
                                                               onChange={(event) => setUserInput({
                                                                   ...userInput,
                                                                   pan: event.target.value
                                                               })}/>
                                                    </FormGroup>
                                                </Col>
                                                <Col className="pr-1" md="4">
                                                    <Label>TAN Id</Label>
                                                    <FormGroup>
                                                        <Input type={'text'} value={userInput.tan}
                                                               onChange={(event) => setUserInput({
                                                                   ...userInput,
                                                                   tan: event.target.value
                                                               })}/>
                                                    </FormGroup>
                                                </Col>
                                                <Col className="pr-1" md="4">
                                                    <Label>GST Id</Label>
                                                    <FormGroup>
                                                        <Input type={'text'} value={userInput.gst}
                                                               onChange={(event) => setUserInput({
                                                                   ...userInput,
                                                                   gst: event.target.value
                                                               })}/>
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
                                                               })}/>
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
                                    {authStatus.module.verificationAPI && authStatus.permissions.verificationAPI ?
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
                                        </Col> : null}
                                    {authStatus.module.member && authStatus.permissions.member ?
                                        <Col className="d-flex align-items-center mt-2" md={6}>
                                            <span className="mr-2">(False)</span>
                                            <CustomInput
                                                type="switch"
                                                id="switch-member"
                                                className="mt-n4"
                                                checked={module.member}
                                                onChange={() => setModule({...module, member: !module.member})}
                                            />
                                            <span className="ml-n2">(True) : Member Module</span>
                                        </Col> : null}
                                    {authStatus.module.advisor && authStatus.permissions.advisor ?
                                        <Col className="d-flex align-items-center mt-2" md={6}>
                                            <span className="mr-2">(False)</span>
                                            <CustomInput
                                                type="switch"
                                                id="switch-advisor"
                                                className="mt-n4"
                                                checked={module.advisor}
                                                onChange={() => setModule({...module, advisor: !module.advisor})}
                                            />
                                            <span className="ml-n2">(True) : Advisor Module</span>
                                        </Col> : null}
                                    {authStatus.module.employee && authStatus.permissions.employee ?
                                        <Col className="d-flex align-items-center mt-2" md={6}>
                                            <span className="mr-2">(False)</span>
                                            <CustomInput
                                                type="switch"
                                                id="switch-employee"
                                                className="mt-n4"
                                                checked={module.employee}
                                                onChange={() => setModule({...module, employee: !module.employee})}
                                            />
                                            <span className="ml-n2">(True) : Employee Module</span>
                                        </Col> : null}
                                    {authStatus.module.savings && authStatus.permissions.savings ?
                                        <Col className="d-flex align-items-center mt-2" md={6}>
                                            <span className="mr-2">(False)</span>
                                            <CustomInput
                                                type="switch"
                                                id="switch-savings"
                                                className="mt-n4"
                                                checked={module.savings}
                                                onChange={() => setModule({...module, savings: !module.savings})}
                                            />
                                            <span className="ml-n2">(True) : Savings Module</span>
                                        </Col> : null}
                                    {authStatus.module.deposit && authStatus.permissions.deposit ?
                                        <Col className="d-flex align-items-center mt-2" md={6}>
                                            <span className="mr-2">(False)</span>
                                            <CustomInput
                                                type="switch"
                                                id="switch-deposit"
                                                className="mt-n4"
                                                checked={module.deposit}
                                                onChange={() => setModule({...module, deposit: !module.deposit})}
                                            />
                                            <span className="ml-n2">(True) : Deposit Module</span>
                                        </Col> : null}
                                    {authStatus.module.loan && authStatus.permissions.loan ?
                                        <Col className="d-flex align-items-center mt-2" md={6}>
                                            <span className="mr-2">(False)</span>
                                            <CustomInput
                                                type="switch"
                                                id="switch-loan"
                                                className="mt-n4"
                                                checked={module.loan}
                                                onChange={() => setModule({...module, loan: !module.loan})}
                                            />
                                            <span className="ml-n2">(True) : Loan Module</span>
                                        </Col> : null}
                                    {authStatus.module.groupLoan && authStatus.permissions.groupLoan ?
                                        <Col className="d-flex align-items-center mt-2" md={6}>
                                            <span className="mr-2">(False)</span>
                                            <CustomInput
                                                type="switch"
                                                id="switch-groupLoan"
                                                className="mt-n4"
                                                checked={module.groupLoan}
                                                onChange={() => setModule({...module, groupLoan: !module.groupLoan})}
                                            />
                                            <span className="ml-n2">(True) : Group Loan Module</span>
                                        </Col> : null}
                                    {authStatus.module.journal && authStatus.permissions.journal ?
                                        <Col className="d-flex align-items-center mt-2" md={6}>
                                            <span className="mr-2">(False)</span>
                                            <CustomInput
                                                type="switch"
                                                id="switch-journal"
                                                className="mt-n4"
                                                checked={module.journal}
                                                onChange={() => setModule({...module, journal: !module.journal})}
                                            />
                                            <span className="ml-n2">(True) : Journal Module</span>
                                        </Col> : null}
                                    {authStatus.module.authorize && authStatus.permissions.authorize ?
                                        <Col className="d-flex align-items-center mt-2" md={6}>
                                            <span className="mr-2">(False)</span>
                                            <CustomInput
                                                type="switch"
                                                id="switch-authorize"
                                                className="mt-n4"
                                                checked={module.authorize}
                                                onChange={() => setModule({...module, authorize: !module.authorize})}
                                            />
                                            <span className="ml-n2">(True) : Authorization Module</span>
                                        </Col> : null}
                                    {authStatus.module.report && authStatus.permissions.report ?
                                        <Col className="d-flex align-items-center mt-2" md={6}>
                                            <span className="mr-2">(False)</span>
                                            <CustomInput
                                                type="switch"
                                                id="switch-report"
                                                className="mt-n4"
                                                checked={module.report}
                                                onChange={() => setModule({...module, report: !module.report})}
                                            />
                                            <span className="ml-n2">(True) : Report Module</span>
                                        </Col> : null}
                                    {authStatus.module.mobile && authStatus.permissions.mobile ?
                                        <Col className="d-flex align-items-center mt-2" md={6}>
                                            <span className="mr-2">(False)</span>
                                            <CustomInput
                                                type="switch"
                                                id="switch-mobile"
                                                className="mt-n4"
                                                checked={module.mobile}
                                                onChange={() => setModule({...module, mobile: !module.mobile})}
                                            />
                                            <span className="ml-n2">(True) : Mobile APP Module</span>
                                        </Col> : null}
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

export default BranchCreation;
