import React from "react";
import 'firebase/compat/app-check';
import axios from "axios";
import NotificationAlert from "react-notification-alert";
import {LinearProgress} from "@mui/material";
import printJS from "print-js";
import ReactToExcel from "react-html-table-to-excel";

import {
    Button,
    Card,
    CardBody,
    CardHeader,
    CardTitle,
    Col,
    Form,
    FormGroup,
    Input,
    Label,
    Row
} from "reactstrap";

import '@firebase/storage';
import Select from "react-select";

function InputForm(){
    const initValue = {
        accountType: '',
        date: '',
    }
    
    const notificationAlertRef = React.useRef(null);
    const [details, setDetails] = React.useState(initValue);
    const [cstError, setCstError] = React.useState({accountType: '', dateInput: ''});
    const [showProgress, setShowProgress] = React.useState(false);
    const [transactions, setTransactions] = React.useState({details: [], total: 0});
    
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
            setCstError({accountType: '', dateInput: ''});
            setShowProgress(true);
            
            try {
                const submit = await axios.post('/api/report/deposit/get-detailList-updated', details);
                if (submit.data.success){
                    setTransactions(submit.data.details);
                    console.log(submit.data.details);
                    notify(submit.data.success, 'success');
                    setShowProgress(false);
                }else {
                    notify(submit.data.error, 'danger')
                    setShowProgress(false);
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
        if (!userInput.accountType){
            errorObj = {...errorObj, accountType: 'this field is required'};
            valid = false;
        }
        if (!userInput.date){
            errorObj = {...errorObj, dateInput: 'this field is required'};
            valid = false;
        }
        
        setCstError({...{accountType: '', dateInput: ''}, ...errorObj});
        return valid
    }
    
    function printForm() {
        printJS({
            printable: 'tableData',
            type: 'html',
            targetStyles: ['*'],
            honorColor: true,
            style: '#tableData { color: blue; display: inline-block; text-align: center; padding: 30px; margin: 15px; text-align: center; padding: 15px; vertical-align: top;} '
            // style: '#bankName {text-align: right; fontSize: 15px;} #registration {text-align: right} #address {text-align: right}'
            // targetStyles: ['margin','font-size','text-align','font-weight','border',],
            // borderBlock:4,
            // orientation: 'portrait',
            // unit: 'in',
            // format: [1200,1000],
        })
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
                <Card>
                    <Form autoComplete={'off'} >
                        <CardHeader>
                            <CardTitle>Account Details</CardTitle>
                        </CardHeader>
                        <CardBody>
                            <Card>
                                <Row>
                                    <Col md={3}>
                                        <Label>*Account Type</Label>
                                        <FormGroup>
                                            <Select
                                                className="react-select info"
                                                classNamePrefix="react-select"
                                                name="accountSelect"
                                                onChange={(value) => setDetails({...details, accountType: value.value})}
                                                options={[
                                                    {value: 'savings', label: "Savings Account"},
                                                    {value: 'thrift-fund', label: 'Thrift Fund'},
                                                    {value: 'cash-certificate', label: 'Cash Certificate'},
                                                    {value: 'fixed-deposit', label: 'Fixed Deposit'},
                                                    {value: 'recurring-deposit', label: 'Recurring Deposit'},
                                                    {value: 'daily-savings', label: 'Daily Savings/Home Savings'},
                                                ]}
                                                placeholder="Select an Option"
                                            />
                                            <p style={{color: 'red'}}>{cstError.accountType}</p>
                                        </FormGroup>
                                    </Col>
                                    <Col md={2}>
                                        <Label>From Date</Label>
                                        <FormGroup>
                                            <Input type={'date'} value={details.date}
                                                   onChange={(event)=> setDetails({...details, date: event.target.value})}/>
                                            <p style={{color: 'red'}}>{cstError.dateInput}</p>
                                        </FormGroup>
                                    </Col>
                                    <Col md={2}>
                                        <Button className={"btn-fill mt-4"} color="success" type="button" onClick={onSubmit}>
                                            Submit
                                        </Button>
                                    </Col>
                                    <Col md={2}>
                                        <Button className={"btn-fill mt-4"} color="dark" type="button" onClick={printForm}>
                                            🖨️Print
                                        </Button>

                                    </Col>
                                    <Col md={1}>
                                        <ReactToExcel
                                            className="btn btn-success ml-3 mt-4"
                                            table="tableData"
                                            filename={`details_list_export-${details.accountType}_${details.date}`}
                                            sheet={'data'}
                                            ButtonText="Excel Export"
                                            style={{width:'6rem'}}
                                        />
                                    </Col>
                                </Row>
                            </Card>
                        </CardBody>
                    </Form>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-center" style={{fontSize:'1.5rem'}}><b>Detail List As on: {((details.date).split("-").reverse().join("-"))}</b></CardTitle>
                    </CardHeader>
                    <CardBody>
                        <table className='table table-striped' id={'tableData'}>
                            <thead>
                            <tr>
                                <th className={'text-center'}>sl</th>
                                <th className={'text-center'}>Type</th>
                                <th className={'text-center'}>Opening Date</th>
                                <th className={'text-center'}>Account</th>
                                <th className={'text-center'}>Name</th>
                                <th className={'text-center'}>Guardian</th>
                                <th className={'text-center'}>Passbook</th>
                                <th className={'text-right'}>balance</th>
                            </tr>
                            </thead>
                            <tbody>
                            {transactions.details.map(value =>
                                <tr key={value.account}>
                                    <th className={'text-center'}>{value.serial}</th>
                                    <th className={'text-center'}>{value.product || ''}</th>
                                    <th className={'text-center'}>{value.openingDate}</th>
                                    <th className={'text-center'}>{value.account}</th>
                                    <th className={'text-center'}>{value.name}</th>
                                    <th className={'text-center'}>{value.guardian}</th>
                                    <th className={'text-center'}>{value.oldAccount}</th>
                                    <th className={'text-right'}>{value.amount}</th>
                                </tr>
                            )}
                            <tr  style={{ background: 'linear-gradient(90deg, #4facfe, #00f2fe)', color: 'white' }}>
                                <th className={'text-left'}/>
                                <th className={'text-left'}/>
                                <th className={'text-left'}/>
                                <th className={'text-left'}/>
                                <th className={'text-left'}/>
                                <th className={'text-left'}/>
                                <th className={'text-left'}><strong>Grand Total</strong></th>
                                <th className={'text-right'}>{transactions.totalPrinciple}</th>
                            </tr>
                            </tbody>
                        </table>
                    </CardBody>
                </Card>
            </div>
        </>
    )
}

export default InputForm;