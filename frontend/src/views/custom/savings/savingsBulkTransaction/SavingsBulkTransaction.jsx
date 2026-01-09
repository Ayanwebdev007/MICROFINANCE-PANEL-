import React, { useState, useEffect, useRef } from "react";
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

function SavingsBulkTransaction() {
    const initValue = {
        transDate: new Date().toISOString().split("T")[0],
        method: "cash",
        narration: "",
        totalAmount: "",
        accountType: "savings",
        employee: "",
        employeeName: "",
        employeeId: "",
        denomination: {},
    };

    const notificationAlertRef = useRef(null);
    const [details, setDetails] = useState(initValue);
    const [cstError, setCstError] = useState({ employee: "" });
    const [cstTransError, setCstTransError] = useState({ account: "", amount: "" });
    const [transRow, setTransRow] = useState({
        account: "",
        name: "",
        currentBalance: "",
        amount: "",
        updatedBalance: "",
    });
    const [userInput, setUserInput] = useState([]);
    const [fetched, setFetched] = useState(false);
    const [showProgress, setShowProgress] = useState(false);
    const [sweetAlert, setSweetAlert] = useState({
        render: false,
        message: "",
        type: "success",
        title: "Success",
    });
    const [employeeSelect, setEmployeeSelect] = useState([]);
    const [accountSelect, setAccountSelect] = useState([]);
    const [enableSearch, setEnableSearch] = useState(false);

    const notify = (message, color) => {
        const options = {
            place: "tc",
            message: <div>{message}</div>,
            type: color,
            icon: "tim-icons icon-bell-55",
            autoDismiss: 5,
        };
        notificationAlertRef.current.notificationAlert(options);
    };

    // Fetch all employees once
    useEffect(() => {
        if (!fetched) {
            setFetched(true);
            axios
                .post("/api/member/get-users-by-bank-restrictive", {})
                .then((res) => {
                    if (res.data.success) {
                        setEmployeeSelect([
                            { value: "all", label: "All Employee" },
                            ...res.data.data.map((emp) => ({
                                value: emp.userId,
                                label: emp.label,
                                userId: emp.userId,
                            })),
                        ]);
                    } else if (res.data.info) {
                        notify(res.data.info, "info");
                    } else {
                        notify(res.data.error, "danger");
                    }
                })
                .catch((err) => notify(err.toString(), "danger"));
        }
    }, [fetched]);

    // Fetch associated accounts based on employee
    async function getAssociatedAccounts(value) {
        if (!value) return;

        setDetails({
            ...details,
            employee: value.value,
            employeeId: value.userId || "",
            employeeName: value.label,
        });

        if (value.value === "all") {
            setEnableSearch(true);
            return;
        }

        setShowProgress(true);
        try {
            const response = await axios.post(
                "/api/savings/get-employee-associated-accounts",
                { employeeId: value.userId }
            );

            if (response.data.success) {
                const accounts = response.data.accountDetails.map((acc) => ({
                    value: acc.account,
                    label: `${acc.account} - ${acc.name}`,
                    data: acc,
                }));
                setAccountSelect(accounts);
            } else if (response.data.info) {
                notify(response.data.info, "info");
            } else {
                notify(response.data.error, "danger");
            }
        } catch (e) {
            notify(e.toString(), "danger");
        } finally {
            setShowProgress(false);
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

    function validateTransInput(data) {
        if (!data.account) {
            setCstTransError({ ...cstTransError, account: "this field is required" });
            return false;
        }
        if (!data.amount) {
            setCstTransError({ ...cstTransError, amount: "amount is required" });
            return false;
        }
        return true;
    }

    function handleTansRowAdd() {
        if (!validateTransInput(transRow)) return;
        const newTrans = {
            ...transRow,
            key: `${transRow.account}-${Date.now()}`,
        };
        setUserInput((prev) => [...prev, newTrans]);
        calculateCredits([...userInput, newTrans]);
        setTransRow({
            account: "",
            name: "",
            currentBalance: "",
            amount: "",
            updatedBalance: "",
        });
    }

    function handleTransRemove(event) {
        const key = event.target.name;
        const updated = userInput.filter((t) => t.key !== key);
        setUserInput(updated);
        calculateCredits(updated);
    }

    function calculateCredits(transactions = userInput) {
        const totalCredit = transactions.reduce(
            (sum, t) => sum + parseFloat(t.amount || 0),
            0
        );
        setDetails({ ...details, totalAmount: totalCredit.toFixed(2) });
    }

    function validateInput(transactions) {
        if (transactions.length === 0) {
            notify("At least one transaction is required", "warning");
            return false;
        }

        for (let i = 0; i < transactions.length; i++) {
            if (!transactions[i].account) {
                notify(`Transaction Account missing at line ${i + 1}`, "warning");
                return false;
            }
            if (!transactions[i].amount) {
                notify(`Amount missing at line ${i + 1}`, "warning");
                return false;
            }
        }

        if (!details.employee) {
            setCstError({ ...cstError, employee: "This field is required" });
            notify("Please select an employee", "warning");
            return false;
        }

        return true;
    }

    function checkSum(transactions) {
        const totalCredit = transactions.reduce(
            (sum, t) => sum + parseFloat(t.amount || 0),
            0
        );
        if (parseFloat(details.totalAmount) === parseFloat(totalCredit.toFixed(2))) {
            return true;
        }
        notify("Please verify total amount before submit", "warning");
        return false;
    }

    async function onSubmit() {
        const checkInput = validateInput(userInput);
        const validateSum = checkSum(userInput);

        if (!checkInput || !validateSum) return;

        setShowProgress(true);
        try {
            const submit = await axios.post("/api/transaction/bulk-renewal", {
                ...details,
                trans: userInput,
                method: "cash",
            });

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
                    message: submit.data.error || "Failed to process!",
                    type: "danger",
                    title: "Failed!",
                });
            }
        } catch (e) {
            notify(e.toString(), "danger");
        } finally {
            setShowProgress(false);
        }
    }

    return (
        <>
            <div className="rna-container">
                <NotificationAlert ref={notificationAlertRef} />
            </div>
            <div className={"mb-2"}>{showProgress && <LinearProgress />}</div>

            {sweetAlert.render && (
                <SweetAlert
                    {...{ [sweetAlert.type]: sweetAlert.type }}
                    style={{ display: "block", marginTop: "-100px" }}
                    title={sweetAlert.title}
                    onConfirm={() =>
                        setSweetAlert({ render: false, message: "", type: "success", title: "" })
                    }
                    confirmBtnBsStyle="info"
                >
                    {sweetAlert.message}
                </SweetAlert>
            )}

            <div className="content">
                <Card>
                    <Form autoComplete={"off"}>
                        <CardHeader>
                            <CardTitle>Transaction Details</CardTitle>
                        </CardHeader>
                        <CardBody>
                            <Card>
                                <Row>
                                    <Col md="4">
                                        <Label>Transaction Date</Label>
                                        <FormGroup>
                                            <Input
                                                type="date"
                                                value={details.transDate}
                                                onChange={(e) =>
                                                    setDetails({ ...details, transDate: e.target.value })
                                                }
                                            />
                                        </FormGroup>
                                    </Col>

                                    <Col md="4">
                                        <Label>Select an Employee</Label>
                                        <FormGroup>
                                            <Select
                                                className="react-select info"
                                                classNamePrefix="react-select"
                                                name="employeeSelect"
                                                onChange={getAssociatedAccounts}
                                                options={employeeSelect}
                                                placeholder="Select an Employee"
                                            />
                                            <p style={{ color: "red" }}>{cstError.employee}</p>
                                        </FormGroup>
                                    </Col>

                                    <Col md="8">
                                        <Label>Narration</Label>
                                        <FormGroup>
                                            <Input
                                                type="textarea"
                                                value={details.narration}
                                                onChange={(e) =>
                                                    setDetails({ ...details, narration: e.target.value })
                                                }
                                            />
                                        </FormGroup>
                                    </Col>

                                    <Col md="2">
                                        <FormGroup>
                                            <Label>Total Credit</Label>
                                            <Input readOnly type="text" value={details.totalAmount} />
                                        </FormGroup>
                                    </Col>
                                    <Col md="1">
                                        <Label />
                                        <FormGroup>
                                            <Button
                                                className="btn-icon tim-icons icon-refresh-02"
                                                color="primary"
                                                type="button"
                                                onClick={() => calculateCredits()}
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
                                    <Col md="4">
                                        <Label>Select an Account</Label>
                                        <FormGroup>
                                            {enableSearch ? (
                                                <Select
                                                    className="react-select info"
                                                    classNamePrefix="react-select"
                                                    name="accountSelect"
                                                    onChange={handleAccountSelect}
                                                    options={accountSelect}
                                                    placeholder="Type at least 3 chars to search..."
                                                    onInputChange={(inputValue) => {
                                                        if (inputValue.length >= 3) {
                                                            setShowProgress(true);
                                                            axios
                                                                .post(`/api/reports/deposit/search-accounts`, {
                                                                    search: inputValue,
                                                                    accountType: details.accountType,
                                                                })
                                                                .then((response) => {
                                                                    if (response.data.success) {
                                                                        setAccountSelect(
                                                                            response.data.accounts.map((acc) => ({
                                                                                value: acc.account,
                                                                                label: `${acc.account} - ${acc.name}`,
                                                                                data: acc,
                                                                            }))
                                                                        );
                                                                    }
                                                                })
                                                                .catch((error) => notify(error.toString(), "danger"))
                                                                .finally(() => setShowProgress(false));
                                                        }
                                                        return inputValue;
                                                    }}
                                                    isLoading={showProgress}
                                                    filterOption={null}
                                                    isSearchable
                                                />
                                            ) : (
                                                <Select
                                                    className="react-select info"
                                                    classNamePrefix="react-select"
                                                    name="accountSelect"
                                                    onChange={handleAccountSelect}
                                                    options={accountSelect}
                                                    placeholder="Select an Option"
                                                />
                                            )}
                                            <p style={{ color: "red" }}>{cstTransError.account}</p>
                                        </FormGroup>
                                    </Col>

                                    <Col md="2">
                                        <Label>Transaction Amount *</Label>
                                        <Input
                                            type="number"
                                            value={transRow.amount}
                                            onChange={(e) => {
                                                const enteredAmount = parseFloat(e.target.value) || 0;
                                                setTransRow({
                                                    ...transRow,
                                                    amount: enteredAmount,
                                                    updatedBalance:
                                                        (parseFloat(transRow.currentBalance) || 0) + enteredAmount,
                                                });
                                            }}
                                        />
                                    </Col>

                                    <Col md="2">
                                        <Label>Current Balance</Label>
                                        <FormGroup>
                                            <Input type="number" value={transRow.currentBalance || 0} readOnly />
                                        </FormGroup>
                                    </Col>

                                    <Col md="3">
                                        <Label>Updated Balance</Label>
                                        <FormGroup>
                                            <Input type="number" value={transRow.updatedBalance || 0} readOnly />
                                        </FormGroup>
                                    </Col>

                                    <Col md="3">
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
                                    <th>Sl.</th>
                                    <th>Account Number</th>
                                    <th>Name</th>
                                    <th>Current Balance</th>
                                    <th>Transaction Amount</th>
                                    <th>Updated Balance</th>
                                    <th>Action</th>
                                </tr>
                                </thead>
                                <tbody>
                                {userInput.map((trans, index) => (
                                    <tr key={trans.key}>
                                        <td>{index + 1}</td>
                                        <td>{trans.account}</td>
                                        <td>{trans.name}</td>
                                        <td>{trans.currentBalance}</td>
                                        <td>{trans.amount}</td>
                                        <td>{trans.updatedBalance}</td>
                                        <td>
                                            <Button
                                                className="btn-icon tim-icons icon-simple-remove"
                                                color="primary"
                                                type="button"
                                                name={trans.key}
                                                onClick={handleTransRemove}
                                            />
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </CardBody>

                        <CardFooter className="text-center">
                            {showProgress && (
                                <div className="mb-2">
                                    <CircularProgress style={{ color: "#75E6DA" }} />
                                </div>
                            )}
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

export default SavingsBulkTransaction;
