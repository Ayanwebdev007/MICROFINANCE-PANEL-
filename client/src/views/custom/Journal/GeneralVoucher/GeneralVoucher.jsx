import React from "react";
import 'firebase/compat/app-check';
import axios from "axios";
import NotificationAlert from "react-notification-alert";
import {CircularProgress, LinearProgress} from "@mui/material";
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
import Select from "react-select";

function InputForm(){
    const initValue = {
        transDate: new Date().toISOString().substr(0, 10),
        method: 'cash',
        voucher: '',
        glCode: '',
        glHead: '',
        amount: '',
        type: '',
        narration: '',
        denomination: {
            c2000: 0,
            c500: 0,
            c200: 0,
            c100: 0,
            c50: 0,
            c20: 0,
            c10: 0,
            c5: 0,
            c2: 0,
            c1: 0,
        },
        bankBalance: false,
    }
    const notificationAlertRef = React.useRef(null);
    const [details, setDetails] = React.useState(initValue);
    const [cstError, setCstError] = React.useState(initValue);
    const [showProgress, setShowProgress] = React.useState(false);
    const [sweetAlert, setSweetAlert] = React.useState({render: false, message: '', type: 'success', title: 'Success'});
    const [fetched, setFetched] = React.useState(false);
    // const [userDenomination, setUserDenomination] = React.useState(initValue.denomination);
    const [loadedGl, setLoadedGL] = React.useState([]);
    
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
    
    if (!fetched) {
        setFetched(true);
        axios.get('/api/admin/get-gl-codes')
            .then(function (value) {
                if (value.data.success) {
                    processGLSelect(value.data.data);
                }else {
                    notify(value.data.error, 'danger');
                }
            }).catch(function (error) {
            notify(error, 'danger');
        });
    }
    
    async function onSubmit() {
        const checkInput = validateInput(details);
        
        if (checkInput){
            setCstError(initValue);
            setDetails({
                ...initValue,
                glCode: details.glCode,
                glHead: details.glHead,
            });
            setShowProgress(true);
            
            try {
                const submit = await axios.post('/api/transaction/cash/general-voucher', details);
                if (submit.data.success){
                    setShowProgress(false);
                    // setUserDenomination(submit.data.denomination);
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
                console.log(e);
                notify(e.toString(), 'danger', 10);
            }
        }
    }
    
    function validateInput(userInput) {
        let valid = true;
        let errorObj = {}
        if (!userInput.glCode || !userInput.glHead){
            errorObj = {...errorObj, glHead: 'this field is required'};
            valid = false;
        }
        if (!userInput.type){
            errorObj = {...errorObj, type: 'this field is required'};
            valid = false;
        }
        if (!userInput.amount || userInput.amount <= 0){
            errorObj = {...errorObj, amount: 'valid amount is required'};
            valid = false;
        }
        
        setCstError({...cstError, ...errorObj});
        return valid
    }
    
    function processGLSelect(codes){
        const processedData = [];
        for (let i = 0; i < codes.length; i++){
            processedData.push({
                label: '(' + codes[i].code + ') ' + codes[i].nomenclature,
                glCode: codes[i].code,
                glHead: codes[i].nomenclature,
                bankBalance: !!codes[i].bankBalance,
            });
        }
        setLoadedGL(processedData);
    }
    
    return (
        <>
            <div className="rna-container">
                <NotificationAlert ref={notificationAlertRef} />
            </div>
            <div className={'content'}>
                <div className={'mb-2'}>
                    {showProgress ? <LinearProgress /> : null}
                </div>
                {sweetAlert.render? <SweetAlert
                    {...{[sweetAlert.type]: sweetAlert.type}}
                    style={{display: "block",marginTop: "-100px"}}
                    title={sweetAlert.title}
                    onConfirm={() => setSweetAlert({render: false, message: '', type: 'success', title: ''})}
                    onCancel={() => setSweetAlert({render: false, message: '', type: 'success', title: ''})}
                    confirmBtnBsStyle="info"
                >
                    {sweetAlert.message}
                </SweetAlert>: null}
                <Card>
                    <Form autoComplete={'off'} >
                        <CardHeader>
                            <CardTitle>Transaction Details</CardTitle>
                        </CardHeader>
                        <CardBody>
                            <Card>
                                <Row>
                                    <Col md={'4'}>
                                        <Label>Transaction Date</Label>
                                        <FormGroup>
                                            <Input type={'date'} value={details.transDate} onChange={(event) => setDetails({...details, transDate: event.target.value})}/>
                                        </FormGroup>
                                    </Col>
                                    <Col md={'4'}>
                                        <Label>Voucher Number</Label>
                                        <FormGroup>
                                            <Input type={'text'} value={details.voucher} onChange={(event) => setDetails({...details, voucher: event.target.value})}/>
                                        </FormGroup>
                                    </Col>
                                    <Col md={'4'}>
                                        <Label>GL Code</Label>
                                        <FormGroup>
                                            <Select
                                                className="react-select info"
                                                classNamePrefix="react-select"
                                                name="glSelect"
                                                onChange={(value) => setDetails({...details, glCode: value.glCode, glHead: value.glHead, bankBalance: value.bankBalance})}
                                                options={loadedGl}
                                                placeholder="Select an Option"
                                            />
                                            <p style={{color: 'red'}}>{cstError.glHead}</p>
                                        </FormGroup>
                                    </Col>
                                </Row>
                            </Card>
                        </CardBody>
                        <CardHeader>
                            <CardTitle>Transaction Details</CardTitle>
                        </CardHeader>
                        <CardBody>
                            <Card>
                                <Row>
                                    <Col md={4}>
                                        <Label>Transaction Type</Label>
                                        <FormGroup>
                                            <Select
                                                className="react-select info"
                                                classNamePrefix="react-select"
                                                name="accountSelect"
                                                onChange={(value) => setDetails({...details, type: value.value})}
                                                options={[
                                                    {value: 'credit', label: "Cash Received (Credit)"},
                                                    {value: 'debit', label: "Cash Paid (Debit)"},
                                                ]}
                                                placeholder="Select an Option"
                                            />
                                            <p style={{color: 'red'}}>{cstError.type}</p>
                                        </FormGroup>
                                    </Col>
                                    <Col md={4}>
                                        <Label>Transaction Amount</Label>
                                        <FormGroup>
                                            <Input type={'text'} className={'text-info'} value={details.amount}
                                                   onChange={(event) => setDetails({...details, amount: (parseInt(event.target.value) || 0).toString()})}
                                            />
                                            <p style={{color: 'red'}}>{cstError.amount}</p>
                                        </FormGroup>
                                    </Col>
                                    <Col md={8}>
                                        <Label>Narration</Label>
                                        <FormGroup>
                                            <Input type={'textarea'} className={'text-info'} value={details.narration}
                                                   onChange={(event => setDetails({...details, narration: event.target.value}))}
                                            />
                                        </FormGroup>
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

export default InputForm;