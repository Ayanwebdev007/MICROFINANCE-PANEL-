import React, { useState, useRef, useEffect } from "react";
import "firebase/compat/app-check";
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
    Row,
} from "reactstrap";
import Select from "react-select";

function LoanBulkRepayment(props) {
    const initValue = {
        transDate: new Date().toISOString().slice(0, 10),
        method: "cash",
        type: "credit",
        accountType: "loan",
        narration: "",
        totalAmount: "",
        denomination: {},
    };

    const lineDefaultInput = {
        cif: "",
        name: "",
        account: "",
        installmentAmount: "",
        interestInstallment: "",
        principleInstallment: "",
        openingDate: "",
        multiplier: 1,
        referrer: "",
        termPeriod: "",
        installment: "",
    };

    const notificationAlertRef = useRef(null);
    const [details, setDetails] = useState(initValue);
    const [transRow, setTransRow] = useState(lineDefaultInput);
    const [showProgress, setShowProgress] = useState(false);
    const [sweetAlert, setSweetAlert] = useState({
        render: false,
        message: "",
        type: "success",
        title: "Success",
    });
    const [fetched, setFetched] = useState(false);
    const [employeeSelect, setEmployeeSelect] = useState([]);
    const [accountSelect, setAccountSelect] = useState([
        { value: "", label: "Select an Option", isDisabled: true },
    ]);
    const [userInput, setUserInput] = useState([]);
    const [enableSearch, setEnableSearch] = React.useState(false);

    const notify = (message, color) => {
        const options = {
            place: "tc",
            message: <div>{message}</div>,
            type: color,
            icon: "tim-icons icon-bell-55",
            autoDismiss: 5,
        };
        notificationAlertRef.current?.notificationAlert(options);
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

    useEffect(() => {
        calculateCredits();
    }, [userInput]);

    async function onSubmit() {
        const checkInput = validateInput(userInput);
        const validateSum = checkSum(userInput);

        if (checkInput && validateSum) {
            setShowProgress(true);
            try {
                const submit = await axios.post(
                    "/api/transaction/loan/bulk-repayment",
                    {
                        ...details,
                        trans: userInput,
                        method: "cash",
                    }
                );

                if (submit.data.success) {
                    setDetails({ ...initValue, transDate: details.transDate });
                    setUserInput([]);
                    setSweetAlert({
                        render: true,
                        message: submit.data.success,
                        type: "success",
                        title: "Success!",
                    });
                } else {
                    setSweetAlert({
                        render: true,
                        message: submit.data.error,
                        type: "danger",
                        title: "Failed to process!",
                    });
                }
            } catch (e) {
                console.log(e);
                notify(e.toString(), "danger");
            } finally {
                setShowProgress(false);
            }
        }
    }

    function validateInput(transactions) {
        if (transactions.length > 0) {
            for (let i = 0; i < transactions.length; i++) {
                if (!transactions[i].account) {
                    notify(
                        `Transaction Account is required. Missing on line number ${i + 1}`,
                        "warning"
                    );
                    return false;
                }
                if (!transactions[i].multiplier) {
                    notify(
                        `Installment is required. Missing on line number ${i + 1}`,
                        "warning"
                    );
                    return false;
                }
            }
        } else {
            notify("At least one transaction is required", "warning");
            return false;
        }
        return true;
    }

    function checkSum(transactions){
        let totalCredit = 0;
        const transLength = transactions.length;
        if (transLength > 0){
            for (let i = 0; i < transLength; i++){
                totalCredit += (parseFloat(transactions[i].installmentAmount) * parseFloat(transactions[i].multiplier)) - ((parseInt(transactions[i].installment || '0') + transactions[i].multiplier) === parseInt(transactions[i].termPeriod) ? parseInt(transactions[i].extraAmount || '0'): 0);
            }
            if (details.totalAmount === totalCredit.toFixed(2)){
                return true;
            }
        }
        notify('Please check calculate the amount and check before submit', 'warning');
        return false
    }

    function handleAccountSelect(obj) {
        let divisor;
        if (obj.emiMode === "daily") {
            divisor = 1;
        } else if (obj.emiMode === "weekly") {
            divisor = 7;
        } else if (obj.emiMode === "fortnightly") {
            divisor = 14;
        } else if (obj.emiMode === "monthly") {
            divisor = 30;
        } else if (obj.emiMode === "quarterly") {
            divisor = 90;
        } else {
            divisor = 1;
        }
        const dateDifference = (new Date(details.transDate) - new Date(obj.data.openingDate))/(1000 * 60 * 60 * 24);

        let expectedEMI = Math.floor(dateDifference / divisor);
        const totalEMI = parseInt(obj.data?.termPeriod || 0);
        const emiDue = Math.min(Math.max(expectedEMI - obj.data.installment, 0), totalEMI);

        setTransRow({...obj, multiplier: 1, installmentDue: emiDue});


        console.log(obj)
        if (!obj || !obj.data) return;
        setTransRow({ ...obj.data, multiplier: 1, installmentDue: emiDue});
    }

    async function getAssociatedAccounts(value) {
        if (value.value === "all"){
            setDetails({
                ...details,
                groupId: '',
                groupName: 'All Groups',
            });
            setEnableSearch(true);
        }else {
            setShowProgress(true);
            try {
                const response = await axios.post(
                    "/api/loan/get-employee-associated-accounts",
                    { employeeId: value.userId }
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

    function calculateCredits(){
        let totalCredit = 0;
        const transactions = Object.values(userInput);
        if (transactions.length > 0){
            for (let i = 0; i < transactions.length; i++){
                totalCredit += (parseFloat(transactions[i].installmentAmount) * parseFloat(transactions[i].multiplier)) - ((parseInt(transactions[i].installment || '0') + transactions[i].multiplier) === parseInt(transactions[i].termPeriod) ? parseInt(transactions[i].extraAmount || '0'): 0);
            }
            setDetails({...details, totalAmount: totalCredit.toFixed(2), amountValidated: true});
        } else {
            setDetails({...details, totalAmount: '0.00'});
        }
    }

    function handleTansRowAdd() {
        setUserInput((prev) => [
            ...prev,
            { ...transRow, key: `${transRow.account}${transRow.installment}` },
        ]);
        setTransRow(lineDefaultInput);
    }

    function handleTransRemove(event) {
        const key = event.target.name;
        setUserInput((prev) => prev.filter((t) => t.key !== key));
    }

    return (
        <>
            <div className="rna-container">
                <NotificationAlert ref={notificationAlertRef} />
            </div>

            {sweetAlert.render ? (
                <SweetAlert
                    {...{ [sweetAlert.type]: sweetAlert.type }}
                    style={{ display: "block", marginTop: "-100px" }}
                    title={sweetAlert.title}
                    onConfirm={() =>
                        setSweetAlert({ render: false, message: "", type: "success", title: "" })
                    }
                    onCancel={() =>
                        setSweetAlert({ render: false, message: "", type: "success", title: "" })
                    }
                    confirmBtnBsStyle="info"
                >
                    {sweetAlert.message}
                </SweetAlert>
            ) : null}

            <div className="content">
                <div className={"mb-2"}>{showProgress ? <LinearProgress /> : null}</div>
                <Card>
                    <Form autoComplete={"off"}>
                        <CardHeader>
                            <CardTitle>Transaction Details</CardTitle>
                        </CardHeader>
                        <CardBody>
                            <Card>
                                <Row>
                                    <Col md={"4"}>
                                        <Label>Transaction Date</Label>
                                        <FormGroup>
                                            <Input
                                                type={"date"}
                                                value={details.transDate}
                                                onChange={(e) =>
                                                    setDetails({ ...details, transDate: e.target.value })
                                                }
                                                style={{ backgroundColor: props.color }}
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={"4"}>
                                        <Label>Select an Employee</Label>
                                        <FormGroup>
                                            <Select
                                                className="react-select info"
                                                classNamePrefix="react-select"
                                                name="groupSelect"
                                                onChange={(value) => getAssociatedAccounts(value)}
                                                options={employeeSelect}
                                                placeholder="Select an Option"
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={8}>
                                        <Label>Narration</Label>
                                        <FormGroup>
                                            <Input
                                                type={"textarea"}
                                                value={details.narration}
                                                onChange={(e) =>
                                                    setDetails({ ...details, narration: e.target.value })
                                                }
                                                style={{ backgroundColor: props.color }}
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={2}>
                                        <FormGroup>
                                            <Label>Total Credit</Label>
                                            <Input
                                                readOnly
                                                type="text"
                                                value={details.totalAmount}
                                                className={"text-info"}
                                                style={{ backgroundColor: props.color }}
                                            />
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
                                    <Col md={3}>
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
                                                        placeholder="Type atleast 3 chat to search...."
                                                        onInputChange={(inputValue) => {
                                                            if (inputValue.length >= 3) {
                                                                setShowProgress(true);
                                                                axios.post(`/api/reports/loan/search-accounts`, {
                                                                    search: inputValue,
                                                                    accountType: 'loan'
                                                                }).then((response) => {
                                                                    if (response.data.success) {
                                                                        setAccountSelect(response.data.accounts.map(account => ({
                                                                            value: account.account,
                                                                            label: `${account.account} - ${account.name}`,
                                                                            data: account,
                                                                        })));
                                                                    }
                                                                }).catch((error) => {
                                                                    notify(error.toString(), 'danger');
                                                                }).finally(() => {
                                                                    setShowProgress(false);
                                                                });
                                                            }
                                                            return inputValue; // ensure a string is returned
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
                                                    name="religionSelect"
                                                    onChange={(value) => handleAccountSelect(value)}
                                                    options={accountSelect}
                                                    placeholder="Select an Option"
                                                />}
                                        </FormGroup>
                                    </Col>
                                    <Col md={3}>
                                        <Label>Paid Installment</Label>
                                        <FormGroup>
                                            <Input type={"text"} value={transRow.installment || ""} readOnly />
                                        </FormGroup>
                                    </Col>
                                    <Col md={3}>
                                        <Label>Installment Receivable</Label>
                                        <FormGroup>
                                            <Input type={"text"} value={(Math.round((new Date(details.transDate) - new Date(transRow.openingDate))/(3600*1000*24*7)) + 1) > (parseInt(transRow.termPeriod) - parseInt(transRow.installment)) ? (parseInt(transRow.termPeriod)  - parseInt(transRow.installment)) : (Math.round((new Date(details.transDate || props.date) - new Date(transRow.openingDate))/(3600*1000*24*7)) + 1) || ""} readOnly />
                                        </FormGroup>
                                    </Col>
                                    <Col md={3}>
                                        <Label>Number of Installment being Paid</Label>
                                        <FormGroup>
                                            <Input
                                                type={"number"}
                                                value={transRow.multiplier}
                                                onChange={(e) =>
                                                    setTransRow({
                                                        ...transRow,
                                                        multiplier: parseInt(e.target.value || 0),
                                                    })
                                                }
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={3}>
                                        <Label>Pending Principle</Label>
                                        <FormGroup>
                                            <Input type={'text'} value={parseInt(transRow.principle || '0') - (parseInt(transRow.principleInstallment || '0') * transRow.multiplier) > 0 ? parseInt(transRow.principle || '0') - (parseInt(transRow.principleInstallment || '0') * transRow.multiplier) : 0}
                                                   style={{backgroundColor: props.color}} readOnly={true}
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={3}>
                                        <Label>Transaction Amount</Label>
                                        <FormGroup>
                                            <Input type={'text'}
                                                   value={parseInt(transRow.installmentAmount || '0') * transRow.multiplier}
                                                   style={{backgroundColor: props.color}} readOnly={true}
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={3}>
                                        <Label>Principal Transaction Amount</Label>
                                        <FormGroup>
                                            <Input
                                                type={"text"}
                                                value={
                                                    parseInt(transRow.principleInstallment || "0") *
                                                    transRow.multiplier
                                                }
                                                readOnly
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={3}>
                                        <Label>Interest Transaction Amount</Label>
                                        <FormGroup>
                                            <Input
                                                type={"text"}
                                                value={parseInt(transRow.interestInstallment || "0") * transRow.multiplier}
                                                readOnly
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={3}>
                                        <Label />
                                        <FormGroup>
                                            <Button
                                                className="btn-fill"
                                                color="primary"
                                                type="button"
                                                onClick={handleTansRowAdd}
                                            >
                                                Add Transaction
                                            </Button>
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
                                    <th className="th-sm text-center border-primary">Passbook</th>
                                    <th className="th-sm text-center border-primary">Name</th>
                                    <th className="th-sm text-center border-primary" >Number of Installment</th>
                                    <th className="th-sm text-center border-primary" >Installment Paid</th>
                                    <th className="th-sm text-center border-primary" >Installment Due</th>
                                    <th className="th-sm text-center border-primary" >Transaction Amount</th>
                                    <th className="th-sm text-center border-primary" >Principle Amount</th>
                                    <th className="th-sm text-center border-primary" >Interest Amount</th>
                                    <th className="th-sm text-center border-primary" >Action</th>
                                </tr>
                                </thead>
                                <tbody>
                                {userInput.map((trans, index) =>{
                                    return <tr key={trans.key}>
                                        <th className="th-sm text-center border-primary">{index + 1}</th>
                                        <th className="th-sm text-center border-primary">{trans.account}</th>
                                        <th className="th-sm text-center border-primary">{trans.passbook}</th>
                                        <th className="th-sm text-center border-primary">{trans.name}</th>
                                        <th className="th-sm text-center border-primary" >{trans.multiplier}</th>
                                        <th className="th-sm text-center border-primary" >{trans.installment}</th>
                                        <th className="th-sm text-center border-primary" >{parseInt(trans.termPeriod) - parseInt(trans.installment)}</th>
                                        <th className="th-sm text-center border-primary" >{(parseInt(trans.installmentAmount || '0') * trans.multiplier) - ((parseInt(trans.installment || '0') + trans.multiplier) === parseInt(trans.termPeriod) ? parseInt(trans.extraAmount || 0): 0)}</th>
                                        <th className="th-sm text-center border-primary" >{(parseInt(trans.principleInstallment || '0') * trans.multiplier) - ((parseInt(trans.installment || '0') + trans.multiplier) === parseInt(trans.termPeriod) ? parseInt(trans.extraAmount || 0): 0)}</th>
                                        <th className="th-sm text-center border-primary" >{parseInt(trans.interestInstallment || '0') * trans.multiplier}</th>
                                        <th className="th-sm text-center border-primary">
                                            <Button className="btn-icon tim-icons icon-simple-remove" color="primary" type="button" name={trans.key} onClick={handleTransRemove}/>
                                        </th>
                                    </tr>
                                })}
                                </tbody>
                            </table>
                        </CardBody>

                        <CardFooter className={"text-center"}>
                            <div className={"mb-2"}>
                                {showProgress ? (
                                    <CircularProgress style={{ color: "#75E6DA" }} />
                                ) : null}
                            </div>
                            <Button
                                className="btn-fill"
                                color="success"
                                disabled={showProgress}
                                type="button"
                                onClick={onSubmit}
                            >
                                Submit
                            </Button>
                        </CardFooter>
                    </Form>
                </Card>
            </div>
        </>
    );
}

export default LoanBulkRepayment;
