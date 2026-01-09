import React from "react";
import 'firebase/app-check';
import axios from "axios";
import NotificationAlert from "react-notification-alert";
import {LinearProgress} from "@mui/material";
import SweetAlert from "react-bootstrap-sweetalert";
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    CardTitle,
    Col,
    Form,
    FormGroup,
    Label,
    Row
} from "reactstrap";
import Select from "react-select";
import $ from 'jquery';

function AuthorizeJournal(){
    const initValue = {
        type: '',
    };
    const notificationAlertRef = React.useRef(null);
    const [details, setDetails] = React.useState(initValue);
    const [cstError, setCstError] = React.useState({...initValue});
    const [showProgress, setShowProgress] = React.useState(false);
    const [sweetAlert, setSweetAlert] = React.useState({render: false, message: '', type: 'success', title: 'Success', transId: ''});
    const [paymentInstructions, setPaymentInstructions] = React.useState([]);
    
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
    
    async function onSubmit() {
        const checkInput = validateInput(details);
        
        if (checkInput){
            setShowProgress(true);
            try {
                const submit = await axios.post('/api/payment-instructions/get-transactions', {parameter: details.type} );
                if (submit.data.success){
                    setShowProgress(false);
                    setPaymentInstructions(submit.data.data);
                }else {
                    setShowProgress(false);
                    notify(submit.data.error, 'danger');
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
        let errorObj = {initValue}
        if (!userInput.type){
            errorObj = {...errorObj, type: 'this field is required'};
            valid = false;
        }
        
        setCstError({...cstError, ...errorObj});
        return valid
    }
    
    async function handleApprove(event){
        let index = 0;
        const transaction = event.target.value;
        if (details.type){
            setShowProgress(true);
            const allInstruction = paymentInstructions;
            setPaymentInstructions([]);
            try {
                const authorise = await axios.get('/api/authorise/journal/' + transaction);
                if (authorise.data.success){
                    setShowProgress(false);
                    notify(authorise.data.success, 'success');
                    allInstruction.forEach(function (pi){
                        if (transaction === pi.id){
                            let temp = allInstruction;
                            temp.splice(index, 1);
                            setPaymentInstructions(temp);
                            return;
                        }
                        index++;
                    });
                } else {
                    setPaymentInstructions(allInstruction);
                    setShowProgress(false);
                    notify(authorise.data.error, 'danger');
                }
            }catch (e) {
                setShowProgress(false);
                console.log(e);
                notify(e.toString(), 'danger', 10);
            }
        }else {
            notify('Please select Authorized For field value', 'warning');
        }
    }
    
    function rejectConfirmation(event){
        setSweetAlert({
            render: true,
            transId: event.target.value,
            message: `Are you sure? Transaction ${event.target.value} will be deleted if you confirm!`,
            type: 'warning',
            title: 'Confirmation!',
        });
    }
    
    async function handleReject(){
        let index = 0;
        const transaction = sweetAlert.transId;
        const type = details.type;
        if (type){
            setSweetAlert({render: false, message: '', type: 'success', title: 'Success', transId: ''});
            setShowProgress(true);
            const allInstruction = paymentInstructions;
            setPaymentInstructions([]);
            try {
                const reject = await axios.get('/api/authorise-reject/' + type + '/' + transaction);
                if (reject.data.success){
                    setShowProgress(false);
                    notify(reject.data.success, 'success');
                    allInstruction.forEach(function (pi){
                        if (transaction === pi.id){
                            let temp = allInstruction;
                            temp.splice(index, 1);
                            setPaymentInstructions(temp);
                            $('#' + transaction).css('text-decoration', 'line-through');
                            return;
                        }
                        index++;
                    });
                }else {
                    setShowProgress(false);
                    notify(reject.data.error, 'danger');
                }
            }catch (e) {
                setShowProgress(false);
                console.log(e);
                notify(e.toString(), 'danger', 10);
            }
        }else {
            notify('Select Authorization Type For field value', 'warning');
        }
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
                    onConfirm={handleReject}
                    onCancel={() => setSweetAlert({render: false, message: '', type: 'success', title: '', transId: ''})}
                    cancelBtnBsStyle={"info"}
                    confirmBtnBsStyle={"danger"}
                    confirmBtnText={"Yes, Reject it!"}
                    cancelBtnText={"Cancel"}
                    showCancel
                    btnSize=""
                >
                    {sweetAlert.message}
                </SweetAlert>: null}
                <Card>
                    <Form autoComplete={'off'} >
                        <CardHeader>
                            <CardTitle>Parameter</CardTitle>
                        </CardHeader>
                        <CardBody>
                            <Card>
                                <Row>
                                    <Col md={4}>
                                        <Label>Authorization Type</Label>
                                        <FormGroup>
                                            <Select
                                                className="react-select info"
                                                classNamePrefix="react-select"
                                                name="accountSelect"
                                                onChange={(value) => setDetails({...details, type: value.value})}
                                                options={[
                                                    {value: 'journal', label: "Journal Transactions"},
                                                ]}
                                                placeholder="Select an Option"
                                            />
                                            <p style={{color: 'red'}}>{cstError.type}</p>
                                        </FormGroup>
                                    </Col>
                                    <Col md={4}>
                                        <FormGroup>
                                            <Button color="success" className="btn-fill mt-4" type="button" onClick={onSubmit}>
                                                get Details
                                            </Button>
                                        </FormGroup>
                                    </Col>
                                </Row>
                            </Card>
                        </CardBody>
                    </Form>
                    <CardBody>
                        <table className="table table-striped table-bordered">
                            <thead>
                            <tr>
                                <th className="th-sm text-center">Payment Id</th>
                                <th className="th-sm text-center">Date</th>
                                <th colSpan={6} className="th-sm text-center">Transactions</th>
                                <th className="th-sm">Action</th>
                            </tr>
                            </thead>
                            <tbody>
                            {paymentInstructions.map((value) =>{
                                const trans = Object.values(value.trans);
                                return <tr key={value.id} id={value.id}>
                                    <td><strong>{value.id}</strong></td>
                                    <td>{value.entryDate}</td>
                                    <td colSpan={6}>
                                        <thead>
                                        <tr>
                                            <th className="th-sm">Type</th>
                                            <th className="th-sm">GL Code</th>
                                            <th className="th-sm">GL Head</th>
                                            <th className="th-sm">Account Type</th>
                                            <th className="th-sm">Account Number</th>
                                            <th className="th-sm">Amount</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {trans.map((pi) => {
                                            return <tr>
                                                <td>{pi.type}</td>
                                                <td>{pi.glCode}</td>
                                                <td>{pi.glHead}</td>
                                                <td>{pi.accountType}</td>
                                                <td>{pi.account}</td>
                                                <td>{pi.amount}</td>
                                            </tr>
                                        })}
                                        </tbody>
                                    </td>
                                    <td>
                                        <div className="form-inline text-center">
                                            <Button value={value.id} className="fa fa-check" color="success" size="sm" disabled={showProgress} onClick={handleApprove}/>
                                            <Button value={value.id} className="fa fa-ban" color="danger" size="sm" aria-hidden="true" disabled={showProgress} onClick={rejectConfirmation}/>
                                        </div>
                                    </td>
                                </tr>
                            })}
                            </tbody>
                        </table>
                    </CardBody>
                </Card>
            </div>
        </>
    )
}

export default AuthorizeJournal;