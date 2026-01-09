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

function InputForm(){
    const initValue = {
        type: '',
    };
    const notificationAlertRef = React.useRef(null);
    const [details, setDetails] = React.useState(initValue);
    const [cstError, setCstError] = React.useState({...initValue});
    const [showProgress, setShowProgress] = React.useState(false);
    const [sweetAlert, setSweetAlert] = React.useState({render: false, message: '', type: 'success', title: 'Success', transId: ''});
    const [sweetWarningAlert, setSweetWarningAlert] = React.useState({render: false, message: '', type: 'success', title: 'Success'});
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
                // const submit = await axios.get(`/api/get-authorization/${details.type}`);
                const submit = await axios.post(`/api/payment-instructions/get-transactions`, {parameter: details.type} );
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
        let errorObj = {}
        if (!userInput.type){
            errorObj = {...errorObj, type: 'this field is required'};
            valid = false;
        }
        
        setCstError({...initValue, ...errorObj});
        return valid
    }
    
    async function handleApprove(event){
        let index = 0;
        const transaction = event.target.value;
        if (details.type){
            setShowProgress(true);
            const allInstruction = paymentInstructions;
            setPaymentInstructions([]);
            let url = '/api/authorise/bulk-renewal/';
            if (details.type === 'loan-bulk-repayment'){
                url = '/api/authorise/bulk-loan-repayment/';
            }
            try {
                const authorise = await axios.get(`${url}${transaction}`);
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
                }else if (authorise.data.warning){
                    setPaymentInstructions(allInstruction);
                    setShowProgress(false);
                    setSweetWarningAlert({render: true, message: authorise.data.warning, type: 'warning', title: 'Warning'});
                    allInstruction.forEach(function (pi){
                        if (transaction === pi.id){
                            let temp = allInstruction;
                            temp.splice(index, 1);
                            setPaymentInstructions(temp);
                            return;
                        }
                        index++;
                    });
                }else {
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
    
    async function handleAuthoriseAll(){
        const totalCount = paymentInstructions.length;
        
        let url = '/api/authorise/bulk-renewal/';
        if (details.type === 'loan-bulk-repayment'){
            url = '/api/authorise/bulk-loan-repayment/';
        }
        setShowProgress(true);
        for (let i = 0; i < totalCount; i++) {
            setSweetWarningAlert({render: true, message: `${i+1} transaction authorized out of ${totalCount}`, type: 'warning', title: 'In Progress'});
            try {
                const authorise = await axios.get(`${url}${paymentInstructions[i].id}`);
                if (authorise.data.success){
                }else if (authorise.data.warning){
                    notify(authorise.data.warning, "warning");
                }else {
                    notify(authorise.data.error, 'danger');
                }
            }catch (e) {
                setShowProgress(false);
                console.log(e);
                notify(e.toString(), 'danger', 10);
            }
        }
        setPaymentInstructions([]);
        setSweetWarningAlert({render: true, message: `All Transaction are authorized. Fetch again to make sure no failures`, type: 'success', title: 'Success'});
        setShowProgress(false);
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
                {sweetAlert.render ? <SweetAlert
                    {...{[sweetAlert.type]: !!sweetAlert.type}}
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
                {sweetWarningAlert.render ? <SweetAlert
                    warning
                    style={{display: "block",marginTop: "-100px"}}
                    title={sweetWarningAlert.title}
                    onConfirm={() => setSweetWarningAlert({render: false, message: '', type: 'success', title: ''})}
                    confirmBtnBsStyle={"warning"}
                    confirmBtnText={"Yes, I Understood!"}
                    btnSize=""
                >
                    {sweetWarningAlert.message}
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
                                                    {value: 'bulk-renewal', label: "Bulk Deposit Transactions"},
                                                    {value: 'loan-bulk-repayment', label: "Bulk Loan Repayment"},
                                                ]}
                                                placeholder="Select an Option"
                                            />
                                            <p style={{color: 'red'}}>{cstError.type}</p>
                                        </FormGroup>
                                    </Col>
                                    <Col md={3}>
                                        <FormGroup>
                                            <Button color="success" className="btn-fill mt-4" type="button" onClick={onSubmit}>
                                                Get Details
                                            </Button>
                                        </FormGroup>
                                    </Col>
                                    <Col md={5}>
                                        <FormGroup>
                                            <Button color="primary" className="btn-fill mt-4" type="button" onClick={handleAuthoriseAll}>
                                                Authorise All
                                            </Button>
                                        </FormGroup>
                                    </Col>
                                </Row>
                            </Card>
                        </CardBody>
                    </Form>
                    <CardBody>
                        <table className="table table-striped table-bordered" cellSpacing="0" width="100%">
                            <thead>
                            <tr>
                                <th className="th-sm text-center">Id</th>
                                <th className="th-sm">Date</th>
                                <th className="th-sm text-center">Account Type</th>
                                <th className="th-sm text-center">Narration</th>
                                <th className="th-sm">Group ID</th>
                                <th className="th-sm">Group Name</th>
                                <th className="th-sm">Amount</th>
                                <th className="th-sm">Author</th>
                                <th className="th-sm" colSpan={2}>Action</th>
                            </tr>
                            </thead>
                            <tbody>
                            {paymentInstructions.map((value) =>{
                                return <tr key={value.id} id={value.id}>
                                    <td><strong>{value.id}</strong></td>
                                    <td>{value.date || value.transDate}</td>
                                    <td>{(value.accountType || '').replace('-', ' ').toUpperCase()}</td>
                                    <td>{value.narration}</td>
                                    <td>{value.groupId}</td>
                                    <td>{value.groupName}</td>
                                    <td>{value.totalAmount}</td>
                                    <td>{value.author}</td>
                                    <td colSpan={2}>
                                        <div className="form-inline">
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

export default InputForm;