import React, {useState, useEffect} from "react";
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
// import $ from "jquery";

function BulkTransaction(){
    const initValue = {
        transDate: new Date().toISOString().split('T')[0],
        method: 'cash',
        narration: '',
        totalAmount: '',
        accountType: 'daily-savings',
        // employee: '',
        // employeeName: '',
        employeeId: '',
        denomination: {},
    }
    const notificationAlertRef = React.useRef(null);
    const [details, setDetails] = React.useState(initValue);
    const [cstError, setCstError] = React.useState({agent: '', amount: ''});
    const [transRow, setTransRow] = React.useState({account: '', name: '', currentBalance: '', amount: ''});
    const [cstTransError, setCstTransError] = React.useState({account: '', amount: '', referrer: '', installment: ''});
    const [showProgress, setShowProgress] = React.useState(false);
    const [sweetAlert, setSweetAlert] = React.useState({render: false, message: '', type: 'success', title: 'Success'});
    const [fetched, setFetched] = React.useState(false);
    const [employeeSelect, setEmployeeSelect] = useState([]);
    const [accountSelect, setAccountSelect] = useState([
        { value: "", label: "Select an Option", isDisabled: true },
    ]);
    const [userInput, setUserInput] = React.useState([]);
    const [enableSearch, setEnableSearch] = React.useState(false);

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

    useEffect(() => {
        if (!fetched) {
            setFetched(true);
            axios
                .post("/api/member/get-users-by-bank-restrictive", {})
                .then((value) => {
                    if (value.data.success) {
                        setEmployeeSelect([{
                            value: "all",
                            key: "all",
                            label: "All Employee",
                            isDisabled: false,
                        }, ...value.data.data]);
                    } else if (value.data.info) {
                        notify(value.data.info, "info");
                    } else {
                        notify(value.data.error, "danger");
                    }
                })
                .catch((error) => {
                    notify(error.toString(), "danger");
                });
        }
    }, [fetched]);

    async function onSubmit() {
        const checkInput = validateInput(userInput);
        const validateSum = checkSum(userInput);

        if (checkInput && validateSum){
            setShowProgress(true);

            try {
                const submit = await axios.post('/api/transaction/bulk-renewal', {
                    ...details,
                    trans: userInput,
                    method: 'cash',
                });

                if (submit.data.success){
                    setDetails({...initValue, transDate: details.transDate});
                    setUserInput([]);
                    setSweetAlert({
                        render: true,
                        message: submit.data.success,
                        type: 'success',
                        title: 'Success!'
                    });
                }else {
                    setSweetAlert({
                        render: true,
                        message: submit.data.error,
                        type: 'danger',
                        title: 'Failed to process!'
                    });
                }
            }catch (e) {
                setShowProgress(false);
                console.log(e);
                notify(e.toString(), 'danger', 10);
            }
            setShowProgress(false);
        }
    }

    function validateInput(transactions){
        const transLength = transactions.length
        if (transLength > 0){
            for (let i = 0; i < transLength; i++){
                if (!(transactions[i].account)){
                    notify(`Transaction Account is required. Missing on line number ${i+1}`, 'warning');
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

    function checkSum(transactions){
        let totalCredit = 0;
        const transLength = transactions.length;
        if (transLength > 0){
            for (let i = 0; i < transLength; i++){
                totalCredit += parseFloat(transactions[i].amount)
            }
            if (details.totalAmount === totalCredit.toFixed(2)){
                return true;
            }
        }
        notify('Please check calculate the amount and check before submit', 'warning');
        return false
    }

    function calculateCredits(){
        let totalCredit = 0;
        const transactions = Object.values(userInput);
        if (transactions.length > 0){
            for (let i = 0; i < transactions.length; i++){
                totalCredit += parseFloat(transactions[i].amount)
            }
            setDetails({...details, totalAmount: totalCredit.toFixed(2), amountValidated: true});
        } else {
            notify("Create Credit row first", 'warning');
        }
    }

    function handleAccountSelect(account) {
        if (!account) return;

        const currentBalance = account.data.currentBalance || 0;
        const termAmount = parseFloat(account.data.termAmount) || 0;

        setTransRow({
            account: account.data.account,
            name: account.data.name,
            amount: termAmount,
            currentBalance: currentBalance,
            updatedBalance: currentBalance + termAmount,
        });
    }

    async function getAssociatedAccounts(value) {
        if (value.value === "all"){
            setDetails({
                ...details,
            });
            setEnableSearch(true);
        }else {
            setShowProgress(true);
            try {
                const response = await axios.post(
                    "/api/savings/get-employee-associated-deposit-accounts",
                    {
                        employeeId: value.userId,
                        accountType: details.accountType,
                    }
                );

                if (response.data.success) {
                    const accounts = response.data.accountDetails.map((account) => ({
                        value: account.account,
                        label: account.label,
                        data: account,
                    }));
                    setAccountSelect(accounts);
                } else if (response.data.info) {
                    notify(response.data.info, "info");
                } else {
                    notify(response.data.error, "danger");
                }
            } catch (e) {
                console.log(e);
                notify(e.toString(), "danger");
            } finally {
                setShowProgress(false);
            }
        }
    }

    function handleTansRowAdd(){
        const isInputValidated = validateTransInput(transRow);
        if (isInputValidated){
            const temp = userInput;
            userInput.push({
                ...transRow,
                key: `${transRow.account}${transRow.installment}`
            });
            setUserInput(temp);
            calculateCredits();
            setTransRow({account: '', name: '', currentBalance: '', amount: ''});
        }
    }

    function handleTransRemove(event){
        const key = event.target.name;
        const transLength = userInput.length;
        for (let i = 0; i < transLength; i++) {
            if (userInput[i].key === key){
                userInput.splice(i, 1);
                break;
            }
        }
        calculateCredits();
    }
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setDetails({
            ...details,
            [name]: type === "checkbox" ? checked : value,
        });
    };


    function validateTransInput(data){
        if (!data.account){
            setCstTransError({...cstTransError, account: 'this field is required'});
            return false;
        }
        if (!data.amount){
            setCstTransError({...cstTransError, amount: 'amount is required'});
            return false;
        }
        return true;
    }

    return (
        <>
            <div className="rna-container">
                <NotificationAlert ref={notificationAlertRef} />
            </div>
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
            <div className="content">
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
                                    <Col md="3">
                                        <FormGroup>
                                            <Label>Account Type</Label>
                                            <Input
                                                type="select"
                                                name="accountType"
                                                id="accountType"
                                                value={details.accountType}
                                                onChange={handleInputChange}
                                            >
                                                <option value="">Select an Account Type</option>
                                                <option value="daily-savings">Daily Savings</option>
                                                <option value="recurring-deposit">Recurring Deposit</option>
                                                <option value="thrift-fund">Thrift Fund</option>
                                            </Input>
                                            <p style={{ color: "red" }}>{cstError.accountType}</p>
                                        </FormGroup>
                                    </Col>

                                    <Col md={'4'}>
                                        <Label>Select an Employee</Label>
                                        <FormGroup>
                                            <Select
                                                className="react-select info"
                                                classNamePrefix="react-select"
                                                name="religionSelect"
                                                onChange={(value) => getAssociatedAccounts(value)}
                                                options={employeeSelect}
                                                placeholder="Select an Option"
                                            />
                                            <p style={{color: 'red'}}>{cstError.agent}</p>
                                        </FormGroup>
                                    </Col>
                                    <Col md={8}>
                                        <Label>Narration</Label>
                                        <FormGroup>
                                            <Input type={'textarea'} value={details.narration} onChange={(event) => setDetails({...details, narration: event.target.value})}/>
                                        </FormGroup>
                                    </Col>
                                    <Col md={2}>
                                        <FormGroup>
                                            <Label>Total Credit</Label>
                                            <Input readOnly={true} type="text" value={details.totalAmount} className={'text-info'}/>
                                        </FormGroup>
                                    </Col>
                                    <Col md={'.5'}>
                                        <Label/>
                                        <FormGroup>
                                            <Button className="btn-icon tim-icons icon-refresh-02" color="primary" type="button" onClick={calculateCredits}/>
                                        </FormGroup>
                                    </Col>
                                </Row>
                            </Card>
                        </CardBody>
                        <CardHeader>
                            <CardTitle>Create Transaction</CardTitle>
                        </CardHeader>
                        <CardBody>
                            <Card>
                                <Row>
                                    <Col md={4}>
                                        <Label>Select an Account</Label>
                                        <FormGroup>
                                            {enableSearch ?
                                                <div>
                                                    <Select
                                                        className="react-select info"
                                                        classNamePrefix="react-select"
                                                        name="accountSelect"
                                                        onChange={(value) => handleAccountSelect(value)}
                                                        options={accountSelect}
                                                        placeholder="Type at least 3 chars to search..."
                                                        onInputChange={(inputValue) => {
                                                            if (inputValue.length >= 3) {
                                                                setShowProgress(true);
                                                                axios.post(`/api/reports/deposit/search-accounts`, {
                                                                    search: inputValue,
                                                                    accountType: details.accountType
                                                                }).then((response) => {
                                                                    if (response.data.success) {
                                                                        setAccountSelect(
                                                                            response.data.accounts.map(acc => ({
                                                                                value: acc.account,
                                                                                label: `${acc.account} - ${acc.name}`,
                                                                                data: acc,
                                                                            }))
                                                                        );
                                                                    }
                                                                }).catch((error) => {
                                                                    notify(error.toString(), 'danger');
                                                                }).finally(() => {
                                                                    setShowProgress(false);
                                                                });
                                                            }
                                                            return inputValue;
                                                        }}
                                                        isLoading={showProgress}
                                                        filterOption={null}
                                                        isSearchable={true}
                                                    />

                                                </div>
                                                :
                                                <Select
                                                    className="react-select info"
                                                    classNamePrefix="react-select"
                                                    name="accountSelect"
                                                    onChange={(value) => handleAccountSelect(value)}
                                                    options={accountSelect}
                                                    placeholder="Select an Option"
                                                />}
                                            <p style={{color: 'red'}}>{cstTransError.account}</p>
                                            <p style={{color: 'red'}}>{cstTransError.referrer}</p>
                                        </FormGroup>
                                    </Col>
                                    <Col md={2}>
                                        <Label>Transaction Amount *</Label>
                                        <Input
                                            type="number"
                                            value={transRow.amount}
                                            onChange={(event) => {
                                                const enteredAmount = parseFloat(event.target.value) || 0;
                                                setTransRow({
                                                    ...transRow,
                                                    amount: enteredAmount,
                                                    updatedBalance: (parseFloat(transRow.currentBalance) || 0) + enteredAmount
                                                });
                                            }}
                                        />
                                    </Col>


                                    <Col md={2}>
                                        <Label>Current Balance</Label>
                                        <FormGroup>
                                            <Input type="number" value={transRow.currentBalance || 0} readOnly />
                                        </FormGroup>
                                    </Col>

                                    <Col md={3}>
                                        <Label>Updated Balance</Label>
                                        <FormGroup>
                                            <Input type="number" value={transRow.updatedBalance || 0} readOnly />
                                        </FormGroup>
                                    </Col>
                                    <Col md={3}>
                                        <Label/>
                                        <FormGroup>
                                            <Button className="btn-fill" color="primary" type="button" onClick={handleTansRowAdd}>Add Transaction</Button>
                                        </FormGroup>
                                    </Col>
                                </Row>
                            </Card>
                        </CardBody>
                        <CardBody>
                            <table id="tableData" className="table table-striped">
                                <thead>
                                <tr>
                                    <th className="th-sm text-center border-primary">Sl.</th>
                                    <th className="th-sm text-center border-primary">Account Number</th>
                                    <th className="th-sm text-center border-primary">Name</th>
                                    <th className="th-sm text-center border-primary" >Current Balance</th>
                                    <th className="th-sm text-center border-primary" >Transaction Amount</th>
                                    <th className="th-sm text-center border-primary" >Updated Balance</th>
                                    <th className="th-sm text-center border-primary" >Action</th>
                                </tr>
                                </thead>
                                <tbody>
                                {userInput.map((trans, index) =>{
                                    return <tr key={trans.key}>
                                        <th className="th-sm text-center border-primary">{index + 1}</th>
                                        <th className="th-sm text-center border-primary">{trans.account}</th>
                                        <th className="th-sm text-center border-primary">{trans.name}</th>
                                        <th className="th-sm text-center border-primary" >{trans.currentBalance}</th>
                                        <th className="th-sm text-center border-primary" >{trans.amount}</th>
                                        <th className="th-sm text-center border-primary" >{trans.updatedBalance}</th>
                                        <th className="th-sm text-center border-primary">
                                            <Button className="btn-icon tim-icons icon-simple-remove" color="primary" type="button" name={trans.key} onClick={handleTransRemove}/>
                                        </th>
                                    </tr>
                                })}
                                </tbody>
                            </table>
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

export default BulkTransaction;