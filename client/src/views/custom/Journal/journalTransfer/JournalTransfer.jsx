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
import $ from "jquery";

function InputForm(){
    const initValue = {
        transDate: new Date().toISOString().slice(0,10),
        method: 'transfer',
        voucher: '',
        narration: '',
    }
    const notificationAlertRef = React.useRef(null);
    const [details, setDetails] = React.useState(initValue);
    const [showProgress, setShowProgress] = React.useState(false);
    const [sweetAlert, setSweetAlert] = React.useState({render: false, message: '', type: 'success', title: 'Success'});
    const [fetched, setFetched] = React.useState(false);
    const [transTable, setTransTable] = React.useState([]);
    const [loadedGl, setLoadedGL] = React.useState([]);
    const [userInput, setUserInput] = React.useState({});
    
    const accountType = [
        {
            type: '',
            label: ''
        },
        {
            type: 'savings',
            label: 'Savings'
        },
        {
            type: 'thrift-fund',
            label: 'Thrift Fund'
        },
        {
            type: 'recurring-deposit',
            label: 'Recurring Deposit'
        },
        {
            type: 'daily-savings',
            label: 'Daily Savings'
        }
    ]
    
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
        const checkInput = validateInput(userInput);
        const validateSum = checkSum(userInput);
        
        if (checkInput && validateSum){
            setUserInput({});
            setTransTable([]);
            
            setShowProgress(true);
            
            const submit = await axios.post('/api/transaction/journal', {
                trans: userInput,
                method: 'transfer',
                voucher: details.voucher,
                narration: details.narration,
            });
            if (submit.data.success){
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
        }
    }
    
    function validateInput(data){
        const transactions = Object.values(data);
        
        if (transactions.length > 0){
            for (let i = 0; i < transactions.length; i++){
                if (!(transactions[i].type)){
                    notify(`Transaction Type is missing on line number ${i+1}`, 'warning');
                    return false;
                }
                if ((transactions[i].accountType && !(transactions[i].account)) || (transactions[i].account && !(transactions[i].accountType))){
                    notify(`Transaction Type and account number both are required for account transaction. Missing on line number ${i+1}`, 'warning');
                    return false;
                }
                if ( !transactions[i].glCode && !transactions[i].accountType){
                    notify(`Either GL Code or Account Type is required. Missing on line number ${i+1}`, 'warning');
                    return false;
                }
                if (!(transactions[i].amount)){
                    notify(`amount is missing on line number ${i+1}`, 'warning');
                    return false;
                }
            }
        }else {
            notify('at-least one transaction is required', 'warning');
            return false;
        }
        return true;
    }

    function processGLSelect(codes){
        const processedData = [
            {
                label: '',
                glCode: '',
                glHead: '',
                bankBalance: false,
            }
        ];
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
    
    function generateRow(){
        const numberOfRow = parseInt($('#numberOfRow').val());
        if (parseInt(numberOfRow || '0') > 0){
            setTransTable(Array.from(Array(numberOfRow).keys()));
        } else {
            setTransTable([]);
            notify('enter a valid count and try again', 'warning');
        }
    }
    
    function checkSum(data){
        let totalCredit = 0;
        let totalDebit = 0;
        const transactions = Object.values(data);
        if (transactions.length > 0){
            for (let i = 0; i < transactions.length; i++){
                if (transactions[i].type === 'debit'){
                    totalDebit += parseFloat(transactions[i].amount)
                }else if (transactions[i].type === 'credit'){
                    totalCredit += parseFloat(transactions[i].amount)
                }
            }
            if (totalDebit.toFixed(2) === totalCredit.toFixed(2)){
                return true;
            }
        }
        notify('Debit & Credits not matching', 'warning');
        return false
    }
    
    function calculateCredits(){
        let totalCredit = 0;
        let totalDebit = 0;
        const transactions = Object.values(userInput);
        if (transactions.length > 0){
            for (let i = 0; i < transactions.length; i++){
                if (transactions[i].type === 'debit'){
                    totalDebit += parseFloat(transactions[i].amount)
                }else if (transactions[i].type === 'credit'){
                    totalCredit += parseFloat(transactions[i].amount)
                }
            }
            if (totalDebit.toFixed(2) === totalCredit.toFixed(2)){
                notify('debit & Credit calculation is matching', 'success');
            }else {
                notify('debit & Credit calculation are different', 'warning');
            }
            $('#totalDebits').val(totalDebit.toFixed(2));
            $('#totalCredits').val(totalCredit.toFixed(2));
        } else {
            notify("Create Credit row first", 'warning');
        }
    }
    
    function handleGlValue(value, key){
        let temp;
        
        if (userInput[key]){
            temp = {
                ...userInput[key],
                glCode: value.glCode,
                glHead: value.glHead
            }
        }else {
            temp = {glCode: value.glCode, glHead: value.glHead}
        }
        setUserInput({
            ...userInput,
            [key]: temp
        });
    }
    
    function handleTypeValue(value, key){
        let temp = {};
        if (value){
            if (userInput[key]){
                temp = {
                    ...userInput[key],
                    accountType: value.type
                }
            }else {
                temp = {accountType: value.type}
            }
            setUserInput({
                ...userInput,
                [key]: temp
            });
        }
    }
    
    function handleInput(event){
        let temp;
        const id = event.target.name;
        const lineId = (id.split('-'))[0];
        if (userInput[lineId]){
            temp = {
                ...userInput[lineId],
                [(id.split('-'))[1]]: event.target.value
            }
        }else {
            temp = {[(id.split('-'))[1]]: event.target.value}
        }
        setUserInput({
            ...userInput,
            [lineId]: temp
        });
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
                                            <Input type={'date'} value={details.transDate} onChange={(event) => setDetails({...details, transDate: event.target.value})} />
                                        </FormGroup>
                                    </Col>
                                    <Col md={'4'}>
                                        <Label>Journal Number</Label>
                                        <FormGroup>
                                            <Input type={'text'} value={details.voucher} onChange={(event) => setDetails({...details, voucher: event.target.value})}/>
                                        </FormGroup>
                                    </Col>
                                    <Col md={8}>
                                        <Label>Narration</Label>
                                        <FormGroup>
                                            <Input type={'textarea'} value={details.narration} onChange={(event) => setDetails({...details, narration: event.target.value})}/>
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
                                    <Col md={'2'}>
                                        <Label>Count</Label>
                                        <FormGroup>
                                            <Input type="number" autoComplete="off" id={'numberOfRow'} />
                                        </FormGroup>
                                    </Col>
                                    <Col md={'.5'}>
                                        <Label/>
                                        <FormGroup>
                                            <Button className="btn-icon tim-icons icon-tap-02" color="primary" type="button" onClick={generateRow}/>
                                        </FormGroup>
                                    </Col>
                                    <Col md={2} className={"offset-4 col-2"}>
                                        <FormGroup>
                                            <Label>Total Debit</Label>
                                            <Input id="totalDebits" readOnly={true} type="text" className={'text-info'} />
                                        </FormGroup>
                                    </Col>
                                    <Col md={2}>
                                        <FormGroup>
                                            <Label>Total Credit</Label>
                                            <Input id="totalCredits" readOnly={true} type="text" className={'text-info'} />
                                        </FormGroup>
                                    </Col>
                                    <Col md={'.5'}>
                                        <Label/>
                                        <FormGroup>
                                            <Button className="btn-icon tim-icons icon-tap-02" color="primary" type="button" onClick={calculateCredits}/>
                                        </FormGroup>
                                    </Col>
                                </Row>
                            </Card>
                        </CardBody>
                        <CardBody>
                            <table id="tableData" className="table table-striped table-bordered">
                                <thead>
                                <tr>
                                    <th className="th-sm text-center border-primary" >Type</th>
                                    <th className="th-sm text-center border-primary" >Select Transaction -> GL Code & GL Head</th>
                                    <th className="th-sm text-center border-primary" >Select -> Account Type</th>
                                    <th className="th-sm text-center border-primary" >Account Number</th>
                                    <th className="th-sm text-center border-primary" >Amount</th>
                                </tr>
                                </thead>
                                <tbody>
                                {transTable.map((key) =>{
                                    return <tr key={key}>
                                        <td>
                                            <div>
                                                <select className="form-control form-control-sm" name={key + '-type'} onChange={handleInput} >
                                                    <option value="">Select...</option>
                                                    <option value="debit">DEBIT</option>
                                                    <option value="credit">CREDIT</option>
                                                </select>
                                            </div>
                                        </td>
                                        <td className={'text-info'}>
                                            <Select
                                                className="react-select info"
                                                classNamePrefix="react-select"
                                                name="glSelect"
                                                onChange={(value) => handleGlValue(value, key)}
                                                options={loadedGl}
                                                placeholder="Select an Option"
                                            />
                                        </td>
                                        <td>
                                            <Select
                                                className="react-select info"
                                                classNamePrefix="react-select"
                                                name="accountSelect"
                                                onChange={(value) => handleTypeValue(value, key)}
                                                options={accountType}
                                                placeholder="Select an Option"
                                            />
                                        </td>
                                        <td>
                                            <div className="form-group col-sm-12">
                                                <input type="text" className="form-control" name={key + '-account'} value={userInput[key]? userInput[key].account : ''}
                                                       onChange={handleInput}
                                                />
                                            </div>
                                        </td>
                                        <td>
                                            <div className="form-group col-sm-12">
                                                <input type="text" className="form-control" name={key + '-amount'} value={userInput[key]? userInput[key].amount : ''}
                                                       onChange={handleInput}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                })}
                                </tbody>
                            </table>
                        </CardBody>
                        
                        <CardFooter className={'text-center'}>
                            <div className={'mb-2'}>
                                {showProgress ? <CircularProgress style={{color: '#75E6DA'}} /> : null}
                            </div>
                            <Button className="btn-fill" color="success" type="button" onClick={onSubmit} disabled={showProgress}>
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