
import React from "react";
import axios from "axios";
import NotificationAlert from "react-notification-alert";
import { CircularProgress, LinearProgress } from "@mui/material";
import SweetAlert from "react-bootstrap-sweetalert";
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
import defaultSign from "../../../../assets/img/signature_placeholder.png";
import defaultImage from "../../../../assets/img/image_placeholder.jpg";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom"; // Added import

function LoanRepayment(props) {
    const initValue = {
        transDate: new Date().toISOString().slice(0, 10),
        accountType: 'loan',
        method: 'cash',
        account: '',
        disbursement: 0,
        disbursementDate: '',
        totalEMI: 0,
        paidEMI: 0,
        dueAmount: 0,
        emiCollection: 0,
        emiAmount: 0,
        totalAmount: 0,
        lateFee: 0,
        narration: '',
        name: '',
        emiMode: '',       // new – carry-forward balance (replaces previousRemainingBalance)
        partialEmiDueAmount: 0,               // new – stores remaining unpaid amount for partial EMI
        userEnteredAmount: 0,
        previousRemainingBalance: 0,
    }

    const notificationAlertRef = React.useRef(null);
    const [details, setDetails] = React.useState(initValue);
    const [cstError, setCstError] = React.useState({ ...initValue, cif: '', emiCollection: '' });
    const [showProgress, setShowProgress] = React.useState(false);
    const [sweetAlert, setSweetAlert] = React.useState({ render: false, message: '', type: 'success', title: 'Success' });
    const [profilePreviewUrl, setProfilePreviewUrl] = React.useState(defaultImage);
    const [signPreviewUrl, setSignPreviewUrl] = React.useState(defaultSign);
    const [applicants, setApplicants] = React.useState([]);
    const authStatus = useSelector((state) => state.auth.authState);
    const location = useLocation(); // Added hook
    const debounceTimer = React.useRef(null);
    //  useEffect for auto-fill
    React.useEffect(() => {
        const prefillAccountNo = location.state?.prefillAccountNo;
        if (prefillAccountNo) {
            // Set the account
            setDetails(prevDetails => ({ ...prevDetails, account: prefillAccountNo }));
            fetchAccountDetails(prefillAccountNo);
        }
    }, [location.state]);

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

        // Guard against null ref during initial mount
        if (notificationAlertRef.current?.notificationAlert) {
            notificationAlertRef.current.notificationAlert(options);
        } else {
            // Fallback to console (prevents runtime crash)
            console.warn('[notify]', color, message);
        }

    };

    async function onSubmit() {
        const checkInput = validateInput(details);
        if (checkInput) {
            setCstError({ ...initValue, cif: '', emiCollection: '' });
            setShowProgress(true);
            setProfilePreviewUrl(defaultImage);
            setSignPreviewUrl(defaultSign);
            setApplicants([]);
            try {
                const submit = await axios.post('/api/loan/loan-repayment-transaction', details);
                if (submit.data.success) {
                    setDetails(initValue);
                    setShowProgress(false);
                    setSweetAlert({
                        render: true,
                        message: submit.data.success,
                        type: 'success',
                        title: 'Success!'
                    });
                } else {
                    setShowProgress(false);
                    setSweetAlert({
                        render: true,
                        message: submit.data.error,
                        type: 'danger',
                        title: 'Failed to process!'
                    });
                }
            } catch (e) {
                setShowProgress(false);
                console.log(e);
                notify(e.toString(), 'danger', 10);
            }
        }
    }

    function validateInput(userInput) {
        let valid = true;
        let errorObj = {}
        if (!userInput.account) {
            errorObj = { ...errorObj, account: 'valid account is required' };
            valid = false;
        }
        if (userInput.emiCollection < 0) {
            errorObj = { ...errorObj, emiCollection: 'Collected EMI cannot be negative' };
            valid = false;
        }
        if (userInput.emiCollection > (userInput.totalEMI - userInput.paidEMI)) {
            errorObj = { ...errorObj, emiCollection: 'EMI collection cannot be greater than pending EMI' };
            valid = false;
        }
        setCstError({ ...cstError, ...errorObj });
        return valid
    }

    function getImage(uuid) {
        const storage = getStorage();
        const imageRef = ref(storage, `/${authStatus.bankId}/image-assets/profile/${uuid}`);
        getDownloadURL(imageRef).then((url) => {
            setProfilePreviewUrl(url);
        }).catch(() => {
            setProfilePreviewUrl(defaultImage);
            // notify('profile image is not loaded', 'warning');
        });
        const signImageRef = ref(storage, `/${authStatus.bankId}/image-assets/signature/${uuid}`);
        getDownloadURL(signImageRef).then((url) => {
            setSignPreviewUrl(url);
        }).catch(() => {
            setSignPreviewUrl(defaultSign);
            // notify('signature image is not loaded', 'warning');
        });
    }

    async function fetchAccountDetails(account) {
        try {
            const getAccountDetails = await axios.get(`/api/get-loan-account/${details.accountType}/${account}/${details.transDate}`);
            if (getAccountDetails.data.success) {
                const responseObj = getAccountDetails.data.success;
                setApplicants(responseObj.applicants);
                if (responseObj.closed === true) {
                    setSweetAlert({
                        render: true,
                        message: 'Account is already closed. Over payment is not allowed.',
                        type: 'danger',
                        title: 'Closed Account!'
                    });
                }
                setDetails({
                    ...details,
                    account: account,
                    disbursement: responseObj.disbursement,
                    totalEMI: responseObj.totalEMI,
                    paidEMI: responseObj.paidEMI,
                    emiCollection: 0,
                    emiAmount: parseInt(responseObj.emiAmount),
                    narration: '',
                    name: responseObj.applicants[0].name,
                    disbursementDate: responseObj.disbursementDate,
                    emiMode: responseObj.emiMode,
                    previousDue: responseObj.previousDue,
                    previousRemainingBalance: responseObj.partialEmiDueAmount,
                });
                getImage(responseObj.uuid);
            } else {
                setDetails({
                    ...details,
                    account: account,
                    disbursement: 0,
                    totalEMI: 0,
                    paidEMI: 0,
                    emiCollection: 0,
                    emiAmount: 0,
                    narration: '',
                    name: '',
                });
            }
        } catch (e) {
            setShowProgress(false);
            console.log(e);
            notify(e.toString(), 'danger', 10);
        }
    }

    function handleAccountInput(event) {
        const account = event.target.value;

        // Update state immediately for responsive input
        setDetails(prev => ({ ...prev, account: account }));

        // Clear existing timer
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        // Set new debounced API call
        if (account) {
            debounceTimer.current = setTimeout(() => {
                fetchAccountDetails(account);
            }, 800); // Wait 800ms after user stops typing
        } else {
            // Clear data if account is empty
            setDetails(prev => ({
                ...prev,
                account: '',
                disbursement: 0,
                totalEMI: 0,
                paidEMI: 0,
                emiCollection: 0,
                emiAmount: 0,
                narration: '',
                name: '',
            }));
            setProfilePreviewUrl(defaultImage);
            setSignPreviewUrl(defaultSign);
            setApplicants([]);
        }
    }

    // Cleanup timer on unmount
    React.useEffect(() => {
        return () => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
        };
    }, []);

    // due amount
    const dueAmount = details.previousRemainingBalance;

    const toDate = new Date(details?.transDate);
    const fromDate = new Date(details?.disbursementDate);

    // Days between dates
    const days = Math.max(
        0,
        Math.floor((toDate - fromDate) / (1000 * 60 * 60 * 24))
    );

    // Frequency divisor need to update with all emiMode
    let divisor;
    if (details?.emiMode === "daily") {
        divisor = 1;
    } else if (details?.emiMode === "weekly") {
        divisor = 7;
    } else if (details?.emiMode === "fortnightly") {
        divisor = 14;
    } else if (details?.emiMode === "monthly") {
        divisor = 30;
    } else if (details?.emiMode === "quarterly") {
        divisor = 90;
    } else {
        divisor = 1;
    }

    // EMIs expected up to 'toDate'
    let expected = Math.floor(days / divisor);

    const totalEMI = Number(details?.totalEMI || details?.tenure || 0);
    const paidEMI  = Number(details?.paidEMI || 0);

    expected = Math.min(Math.max(expected, 0), totalEMI);

    // Pending cannot be negative or exceed remaining
    const remaining = Math.max(totalEMI - paidEMI, 0);
    const emiPending = Math.min(Math.max(expected - paidEMI, 0), remaining);
    const emiAmountNeedToPay = (emiPending * details.emiAmount);

    const handleCollectionAmountChange = (enteredAmount, lateFeeValue) => {
        const entered = parseInt(enteredAmount) || 0;
        const lateFee = parseInt(lateFeeValue) || 0;

        const previousPartialDueAmount = Number(details.previousRemainingBalance || 0);
        const emiAmount = Number(details.emiAmount || 0);

        let availableAmount = entered - previousPartialDueAmount - lateFee;
        availableAmount = Math.max(availableAmount, 0);

        let emiCollected = 0;
        let newPartialEmiDueAmount = 0;

        if (availableAmount > 0) {
            const fullEmis = Math.floor(availableAmount / emiAmount);
            const partialEmi = availableAmount % emiAmount;

            if (partialEmi > 0) {
                // Has partial EMI
                emiCollected = fullEmis + 1;
                newPartialEmiDueAmount = emiAmount - partialEmi;
            } else {
                // Only full EMIs
                emiCollected = fullEmis;
                newPartialEmiDueAmount = 0;
            }
        }

        setDetails({
            ...details,
            userEnteredAmount: entered,
            lateFee,
            emiCollection: emiCollected,
            partialEmiDueAmount: newPartialEmiDueAmount,
            totalAmount: entered,
        });
    };

    return (
        <>
            <div className="rna-container">
                <NotificationAlert ref={notificationAlertRef} />
            </div>
            <div className={'mb-2'}>
                {showProgress ? <LinearProgress /> : null}
            </div>
            {sweetAlert.render ? <SweetAlert
                {...{ [sweetAlert.type]: sweetAlert.type }}
                style={{ display: "block", marginTop: "-100px" }}
                title={sweetAlert.title}
                onConfirm={() => setSweetAlert({ render: false, message: '', type: 'success', title: '' })}
                onCancel={() => setSweetAlert({ render: false, message: '', type: 'success', title: '' })}
                confirmBtnBsStyle="info"
            >
                {sweetAlert.message}
            </SweetAlert> : null}
            <div className="content">
                <Card>
                    <Form autoComplete={'off'} >
                        <CardHeader>
                            <CardTitle style={{fontSize:16,marginLeft:15,fontWeight:400 }}>Account Details</CardTitle>
                        </CardHeader>
                        <CardBody>
                            <Card>
                                <Row>
                                    <Col md={9}>
                                        <Row>
                                            <Col md={'4'}>
                                                <Label>Transaction Date</Label>
                                                <FormGroup>
                                                    <Input type={'date'} value={details.transDate}
                                                           style={{ backgroundColor: props.color }}
                                                           onChange={(event => setDetails({ ...details, transDate: event.target.value }))}
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md={'4'}>
                                                <Label>Account Number</Label>
                                                <FormGroup className={cstError.account ? 'has-danger' : 'has-success'}>
                                                    <Input type={'text'} value={details.account}
                                                           style={{ backgroundColor: props.color }}
                                                           onChange={handleAccountInput}
                                                    />
                                                    <p style={{ color: 'red' }}>{cstError.account}</p>
                                                </FormGroup>
                                            </Col>
                                            <Col md={'4'}>
                                                <Label>Total Loan Amount</Label>
                                                <FormGroup>
                                                    <Input type={'text'} readOnly={true} value={details.disbursement} className={'text-info'} style={{ backgroundColor: props.color }} />
                                                </FormGroup>
                                            </Col>
                                            <Col md={4}>
                                                <Label>Total EMI Count</Label>
                                                <FormGroup>
                                                    <Input type={'text'} readOnly={true} value={details.totalEMI} className={'text-info'} style={{ backgroundColor: props.color }} />
                                                </FormGroup>
                                            </Col>
                                            <Col md={4}>
                                                <Label>Paid EMI Count</Label>
                                                <FormGroup>
                                                    <Input type={'text'} readOnly={true} value={details.paidEMI} className={'text-info'} style={{ backgroundColor: props.color }} />
                                                </FormGroup>
                                            </Col>
                                            <Col md={4}>
                                                <Label>Total Collection Amount</Label>
                                                <FormGroup>
                                                    <Input
                                                        type="text"
                                                        value={details.userEnteredAmount || ""}   // only show what user typed
                                                        className="text-info"
                                                        style={{ backgroundColor: props.color }}
                                                        onChange={(e) => handleCollectionAmountChange(e.target.value, details.lateFee)}
                                                    />
                                                    <p style={{ color: 'red' }}>{cstError.emiCollection}</p>
                                                </FormGroup>
                                            </Col>

                                            <Col md={4}>
                                                <Label>Late Fee Amount</Label>
                                                <FormGroup>
                                                    <Input type={'text'} value={details.lateFee} className={'text-info'} style={{ backgroundColor: props.color }}
                                                           onChange={(e) => handleCollectionAmountChange(details.userEnteredAmount, e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md={4}>
                                                <Label>Previous EMI Due Amount</Label>
                                                <FormGroup>
                                                    <Input type={'text'} readOnly={true} value={dueAmount} className={'text-info'} style={{ backgroundColor: props.color }} />
                                                </FormGroup>
                                            </Col>
                                            <Col md={4}>
                                                <Label>Total Due EMI</Label>
                                                <FormGroup>
                                                    <Input type={'text'} readOnly={true} value={remaining} className={'text-info'} style={{ backgroundColor: props.color }} />
                                                </FormGroup>
                                            </Col>
                                            <Col md={4}>
                                                <Label>Pending EMI Till Date</Label>
                                                <FormGroup>
                                                    <Input type={'text'} readOnly={true} value={emiPending || 0} className={'text-info'} style={{ backgroundColor: props.color }} />
                                                </FormGroup>
                                            </Col>
                                            <Col md={4}>
                                                <Label>EMI Amount</Label>
                                                <FormGroup>
                                                    <Input type={'text'} readOnly={true} value={details.emiAmount} className={'text-info'} style={{ backgroundColor: props.color }} />
                                                </FormGroup>
                                            </Col>
                                            <Col md={4}>
                                                <Label>Total Amount Of Pending EMI</Label>
                                                <FormGroup>
                                                    <Input type={'text'} readOnly={true} value={emiAmountNeedToPay || 0} className={'text-info'} style={{ backgroundColor: props.color }} />
                                                </FormGroup>
                                            </Col>
                                            <Col md={12}>
                                                <Label>Narration</Label>
                                                <FormGroup>
                                                    <Input type={'text'} className={'text-info'} value={details.narration}
                                                           style={{ backgroundColor: props.color }}
                                                           onChange={(event => setDetails({ ...details, narration: event.target.value }))}
                                                    />
                                                </FormGroup>
                                            </Col>
                                        </Row>
                                    </Col>
                                    <Col md={3}>
                                        <Row>
                                            <Col md={'12'}>
                                                <div className={'thumbnail border border-secondary text-center'}>
                                                    <img src={profilePreviewUrl} alt="..." />
                                                </div>
                                            </Col>
                                            <Col md={'12'} className={'bg-white'}>
                                                <div className={'thumbnail border border-secondary'}>
                                                    <img src={signPreviewUrl} alt="..." />
                                                </div>
                                            </Col>
                                        </Row>
                                    </Col>
                                </Row>
                            </Card>
                        </CardBody>
                        <CardHeader>
                            <CardTitle style={{fontSize:16,marginLeft:15,fontWeight:400 }}>Account Holder Details</CardTitle>
                        </CardHeader>
                        <CardBody>
                            <table className="table table-borderless">
                                <thead>
                                <tr>
                                    <th className={'text-center'}>CIF ID</th>
                                    <th className={'text-center'}>Name</th>
                                    <th className={'text-center'}>Guardian/Loader</th>
                                    <th className={'text-center'}>Address</th>
                                    <th className={'text-center'}>Phone</th>
                                </tr>
                                </thead>
                                <tbody>
                                {applicants.map((applicant) => {
                                    return <tr key={applicant.cif}>
                                        <th className={'text-center text-info'}>{applicant.cif}</th>
                                        <th className={'text-center text-info'}>{applicant.name}</th>
                                        <th className={'text-center text-info'}>{applicant.guardian}</th>
                                        <th className={'text-center text-info'}>{applicant.address}</th>
                                        <th className={'text-center text-info'}>{applicant.phone}</th>
                                    </tr>
                                })}
                                </tbody>
                            </table>
                        </CardBody>
                        <CardFooter className={'text-center'}>
                            <div className={'mb-2'}>
                                {showProgress ? <CircularProgress style={{ color: '#75E6DA' }} /> : null}
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

export default LoanRepayment;