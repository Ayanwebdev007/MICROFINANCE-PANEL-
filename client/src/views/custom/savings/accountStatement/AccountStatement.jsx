import React from "react";
import axios from "axios";
import NotificationAlert from "react-notification-alert";
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
  Row,
  Spinner,
} from "reactstrap";
import Select from "react-select";
import printJS from "print-js";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";

function AccountStatement() {
  const location = useLocation();
  const authStatus = useSelector((state) => state.auth.authState);

  const notificationAlertRef = React.useRef(null);

  // Default
  const initValue = {
    fromDate: "",
    toDate: "",
    accountType: "savings",
    account: "",
    passbook: "",
  };

  const [details, setDetails] = React.useState(initValue);
  const [cstError, setCstError] = React.useState(initValue);
  const [showProgress, setShowProgress] = React.useState(false);
  const [fetchedData, setFetchedData] = React.useState({
    name: "",
    guardian: "",
    address: "",
    cpCode: "",
    cpName: "",
    cif: "",
    account: "",
    openingDate: "",
    passbook: "",
    balance: 0,
    transactions: [],
    phone: "",
    referrerName: "",
    referrerId: "",
    referrerCif: "",
    groupName: "",
    groupId: "",
    term: 0,
  });

  // Auto-fill
  React.useEffect(() => {
    const prefillAccountNo = location.state?.prefillAccountNo;
    const prefillAccountType = location.state?.prefillAccountType || "savings";

    if (prefillAccountNo && !details.account) {
      setDetails((prev) => ({
        ...prev,
        account: prefillAccountNo,
        accountType: prefillAccountType,
      }));
    }
  }, []);

  // Notifications
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


  Date.prototype.addDays = function (days) {
    let date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
  };


  async function onSubmit() {
    const checkInput = validateInput(details);

    if (checkInput) {
      setCstError(initValue);
      setShowProgress(true);

      try {
        const submit = await axios.post("/api/reports/deposit/account-statement", details);
        if (submit.data.success) {
          setFetchedData({ ...submit.data.success });
          if (submit.data.success.isClosed) {
            notify("This account is already closed", "warning");
          } else {
            notify("Successfully fetched account details", "success");
          }
        } else {
          notify(submit.data.error, "danger");
        }
      } catch (e) {
        console.log(e);
        notify(e.toString(), "danger");
      } finally {
        setShowProgress(false);
      }
    }
  }

  // Validate
  function validateInput(userInput) {
    let valid = true;
    let errorObj = {};

    if (!userInput.account && !userInput.passbook) {
      errorObj = {
        ...errorObj,
        account: "Account or passbook is required",
        passbook: "Account or passbook is required",
      };
      valid = false;
    }

    if ((userInput.fromDate && !userInput.toDate) || (userInput.toDate && !userInput.fromDate)) {
      errorObj = { ...errorObj, fromDate: "Either both required", toDate: "or clear both" };
      valid = false;
    }

    setCstError({ ...initValue, ...errorObj });
    return valid;
  }

  // Print handler
  function printForm() {
    printJS({
      printable: "printable",
      type: "html",
      targetStyles: ["*"],
      honorColor: false,
    });
  }

  return (
    <>
      <div className="rna-container">
        <NotificationAlert ref={notificationAlertRef} />
      </div>
      <div className="content">
        <Card>
          <Form autoComplete="off">
            <CardHeader>
              <CardTitle>Account Statement</CardTitle>
            </CardHeader>
            <CardBody>
              <Row>
                <Col md={3}>
                  <Label>Account Type</Label>
                  <FormGroup>
                    <Select
                      className="react-select info"
                      classNamePrefix="react-select"
                      value={{
                        value: details.accountType,
                        label: "Savings Account",
                      }}
                      onChange={(selected) =>
                        setDetails({ ...details, accountType: selected.value })
                      }
                      options={[{ value: "savings", label: "Savings Account" }]}
                      placeholder="Select Account Type"
                    />
                  </FormGroup>
                </Col>
                <Col md={3}>
                  <Label>Account Number</Label>
                  <FormGroup>
                    <Input
                      type="text"
                      value={details.account}
                      onChange={(e) =>
                        setDetails({ ...details, account: e.target.value })
                      }
                      placeholder="Enter account number"
                    />
                    <p style={{ color: "red" }}>{cstError.account}</p>
                  </FormGroup>
                </Col>
                <Col md={2}>
                  <Label>From Date</Label>
                  <FormGroup>
                    <Input
                      type="date"
                      value={details.fromDate}
                      onChange={(e) =>
                        setDetails({ ...details, fromDate: e.target.value })
                      }
                    />
                    <p style={{ color: "red" }}>{cstError.fromDate}</p>
                  </FormGroup>
                </Col>
                <Col md={2}>
                  <Label>To Date</Label>
                  <FormGroup>
                    <Input
                      type="date"
                      value={details.toDate}
                      onChange={(e) =>
                        setDetails({ ...details, toDate: e.target.value })
                      }
                    />
                    <p style={{ color: "red" }}>{cstError.toDate}</p>
                  </FormGroup>
                </Col>
                <Col md={2}>
                  <center>
                    <Spinner color="info" className="mt-4" hidden={!showProgress} />
                  </center>
                  <Button
                    className="btn-fill mt-4"
                    color="success"
                    type="button"
                    onClick={onSubmit}
                  >
                    Submit
                  </Button>
                  <Button
                    className="btn-icon bg-success mt-4"
                    type="button"
                    onClick={printForm}
                  >
                    <i className="tim-icons icon-notes" />
                  </Button>
                </Col>
              </Row>
            </CardBody>
          </Form>
        </Card>

        {/* Printable Statement */}
        <Card id="printable">
          <CardBody>
            <div className="border-primary mt-1" id="details">
              <div className="text-center" id="bankDetails">
                <p style={{ fontSize: "2.7em" }}>
                  <strong>{authStatus.bankInfo.bankName || ""}</strong>
                </p>
                <p style={{ fontSize: "1.5em" }}>
                  <strong>
                    Reg No.- {authStatus.bankInfo.registrationCode || ""}
                  </strong>
                </p>
                <p style={{ fontSize: "2em" }}>
                  <strong>Account Statement</strong>
                </p>
              </div>
              <hr />
              <div>
                <div className="form-inline">
                  <p className="col-4 text-left">
                    Name : <strong>{fetchedData.name}</strong>
                  </p>
                  <p className="col-4 text-left">
                    Account No. : <strong>{fetchedData.account}</strong>
                  </p>
                  <p className="col-4 text-left">
                    Group Code : <strong>{fetchedData.groupId}</strong>
                  </p>
                  <p className="col-4 text-left">
                    Guardian : <strong>{fetchedData.guardian}</strong>
                  </p>
                  <p className="col-4 text-left">
                    Member No. : <strong>{fetchedData.cif}</strong>
                  </p>
                  <p className="col-4 text-left">
                    Group Name : <strong>{fetchedData.groupName}</strong>
                  </p>
                  <p className="col-4 text-left">
                    Phone : <strong>{fetchedData.phone}</strong>
                  </p>
                  <p className="col-8 text-left">
                    Address : <strong>{fetchedData.address}</strong>
                  </p>
                </div>
              </div>
              <hr />
            </div>
          </CardBody>
          <CardBody>
            <table className="table table-striped">
              <thead>
              <tr>
                <th className="text-left">Sl.</th>
                <th className="text-left">Date</th>
                <th className="text-left">Transaction Id</th>
                <th className="text-left">Narration</th>
                <th className="text-left">Type</th>
                <th className="text-right">Amount</th>
                <th className="text-right">Balance</th>
              </tr>
              </thead>
              <tbody>
              {fetchedData.transactions.map((value, index) => {
                const dateStr = new Date(value.date).toISOString().slice(0, 10);
                const dateFormat = `${dateStr.slice(8, 10)}-${dateStr.slice(
                  5,
                  7
                )}-${dateStr.slice(0, 4)}`;

                return (
                  <tr key={value.id}>
                    <th className="text-left">{index + 1}</th>
                    <th className="text-left">{dateFormat}</th>
                    <th className="text-left">{value.id}</th>
                    <th className="text-left">{value.narration}</th>
                    <th className="text-left">{value.type}</th>
                    <th className="text-right">
                      {parseFloat(value.amount).toFixed(2)}
                    </th>
                    <th className="text-right">
                      {(
                        parseFloat(value.balance) +
                        (value.type === "credit" ? 1 : -1) * parseFloat(value.amount)
                      ).toFixed(2)}
                    </th>
                  </tr>
                );
              })}
              </tbody>
            </table>
          </CardBody>
        </Card>
      </div>
    </>
  );
}

export default AccountStatement;