import React from "react";
import 'firebase/compat/app-check';
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

import '@firebase/storage';
import Select from "react-select";
import printJS from "print-js";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";

function AccountStatement(props) {
  const location = useLocation();

  const initValue = {
    fromDate: '',
    toDate: '',
    accountType: '',
    account: '',
    passbook: '',
  };

  const authStatus = useSelector((state) => state.auth.authState);

  const notificationAlertRef = React.useRef(null);
  const [details, setDetails] = React.useState(initValue);
  const [cstError, setCstError] = React.useState(initValue);
  const [showProgress, setShowProgress] = React.useState(false);
  const [fetchedData, setFetchedData] = React.useState({
    name: '',
    guardian: '',
    address: '',
    cpCode: '',
    cpName: '',
    cif: '',
    account: '',
    openingDate: props.date,
    passbook: '',
    balance: 0,
    transactions: [],
    phone: '',
    referrerName: '',
    referrerId: '',
    referrerCif: '',
    groupName: '',
    groupId: '',
    term: 0,
  });

  Date.prototype.addDays = function(days) {
    let date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
  }

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
    if (notificationAlertRef.current?.notificationAlert) {
      notificationAlertRef.current.notificationAlert(options);
    }
  };

  React.useEffect(() => {
    const state = location.state;
    if (state?.prefillAccountNo || state?.prefillAccountType) {
      setDetails(prev => ({
        ...prev,
        account: state.prefillAccountNo || prev.account,
        accountType: state.prefillAccountType || prev.accountType,
      }));
    }
  }, [location.state]);

  async function onSubmit() {
    const checkInput = validateInput(details);

    if (checkInput) {
      setCstError(initValue);
      setShowProgress(true);

      try {
        const submit = await axios.post('/api/reports/deposit/account-statement', details);
        if (submit.data.success) {
          setFetchedData({ ...submit.data.success });
          if (submit.data.success.isClosed) {
            notify('This Account is already closed', 'warning');
          } else {
            notify('Successfully fetched account details', 'success');
          }
          setShowProgress(false);
        } else {
          notify(submit.data.error, 'danger');
          setShowProgress(false);
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
    let errorObj = {};
    if (!userInput.accountType) {
      errorObj = { ...errorObj, accountType: 'this field is required' };
      valid = false;
    }
    if (!userInput.account && !userInput.passbook) {
      errorObj = {
        ...errorObj,
        account: 'account or passbook is required',
        passbook: 'account or passbook is required'
      };
      valid = false;
    }
    if ((userInput.fromDate && !userInput.toDate) || (userInput.toDate && !userInput.fromDate)) {
      errorObj = {
        ...errorObj,
        fromDate: 'either both required',
        toDate: 'or clear both'
      };
      valid = false;
    }

    setCstError({ ...initValue, ...errorObj });
    return valid;
  }

  async function printForm() {
    printJS({
      printable: 'printable',
      type: 'html',
      targetStyles: ['*'],
      honorColor: false,
    });
  }

  return (
    <>
      <div className="rna-container">
        <NotificationAlert ref={notificationAlertRef} />
      </div>
      <div className={'mb-2'}>
      </div>
      <div className="content">
        <Card>
          <Form autoComplete={'off'}>
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
            </CardHeader>
            <CardBody>
              <Card>
                <Row>
                  <Col md={3}>
                    <Label>Account Type</Label>
                    <FormGroup>
                      <Select
                        className="react-select info"
                        classNamePrefix="react-select"
                        name="accountSelect"
                        style={{ backgroundColor: props.color }}
                        onChange={(value) => setDetails({ ...details, accountType: value.value })}
                        options={[
                          { value: 'cash-certificate', label: 'Cash Certificate' },
                          { value: 'fixed-deposit', label: 'Fixed Deposit' },
                          { value: 'mis-deposit', label: 'MIS Deposit' },
                        ]}
                        placeholder="Select an Option"
                        value={details.accountType ? { value: details.accountType, label: getLabelForType(details.accountType) } : null}
                      />
                      <p style={{ color: 'red' }}>{cstError.accountType}</p>
                    </FormGroup>
                  </Col>
                  <Col md={3}>
                    <Label>Account Number</Label>
                    <FormGroup>
                      <Input
                        type={'text'}
                        value={details.account}
                        onChange={(event) => setDetails({ ...details, account: event.target.value })}
                      />
                      <p style={{ color: 'red' }}>{cstError.account}</p>
                    </FormGroup>
                  </Col>
                  <Col md={2}>
                    <Label>From Date</Label>
                    <FormGroup>
                      <Input
                        type={'date'}
                        value={details.fromDate}
                        onChange={(event) => setDetails({ ...details, fromDate: event.target.value })}
                      />
                      <p style={{ color: 'red' }}>{cstError.fromDate}</p>
                    </FormGroup>
                  </Col>
                  <Col md={2}>
                    <Label>To Date</Label>
                    <FormGroup>
                      <Input
                        type={'date'}
                        value={details.toDate}
                        onChange={(event) => setDetails({ ...details, toDate: event.target.value })}
                      />
                      <p style={{ color: 'red' }}>{cstError.toDate}</p>
                    </FormGroup>
                  </Col>
                  <Col md={2}>
                    <center>
                      <Spinner color="info" className={'mt-4'} hidden={!showProgress} />
                    </center>
                    <Button className={"btn-fill mt-4"} color="success" type="button" onClick={onSubmit}>
                      Submit
                    </Button>
                    <Button className={"btn-icon bg-success mt-4"} type="button" onClick={printForm}>
                      <i className="tim-icons icon-notes" />
                    </Button>
                  </Col>
                </Row>
              </Card>
            </CardBody>
          </Form>
        </Card>

        {/* Rest of your print section remains unchanged */}
        <Card id={'printable'}>
          <CardBody>
            <div className="border-primary mt-1" id="details">
              <div className="text-center" id="bankDetails">
                <p style={{ fontSize: '2.7em' }}><strong>{authStatus.bankInfo.bankName || ''}</strong></p>
                <p style={{ fontSize: '1.5em' }}><strong>{`Reg No.- ${authStatus.bankInfo.registrationCode || ''}`}</strong></p>
                <p style={{ fontSize: '2em' }}><strong>Account Statement</strong></p>
              </div>
              <hr />
              <div>
                <div className="form-inline">
                  <p className="col-4 text-left">Name : <strong>{`${fetchedData.name}`}</strong></p>
                  <p className="col-4 text-left">Account No. : <strong>{fetchedData.account}</strong></p>
                  <p className="col-4 text-left">Group Code : <strong>{fetchedData.groupId}</strong></p>
                  <p className="col-4 text-left">Guardian : <strong>{`${fetchedData.guardian}`}</strong></p>
                  <p className="col-4 text-left">Member No. : <strong>{fetchedData.cif}</strong></p>
                  <p className="col-4 text-left">Group Name : <strong>{fetchedData.groupName}</strong></p>
                  <p className="col-4 text-left">Phone : <strong>{fetchedData.phone}</strong></p>
                  <p className="col-8 text-left">Address : <strong>{fetchedData.address}</strong></p>
                </div>
              </div>
              <hr />
            </div>
          </CardBody>
          <CardBody>
            <table className='table table-striped'>
              <thead>
              <tr>
                <th className={'text-left'}>Sl.</th>
                <th className={'text-left'}>Date</th>
                <th className={'text-left'}>Transaction Id</th>
                <th className={'text-left'}>Narration</th>
                <th className={'text-left'}>Type</th>
                <th className={'text-right'}>amount</th>
                <th className={'text-right'}>balance</th>
              </tr>
              </thead>
              <tbody>
              {fetchedData.transactions.map((value, index) => {
                const dateStr = new Date(value.date).toISOString().slice(0, 10);
                const dateFormat = `${dateStr.slice(8, 10)}-${dateStr.slice(5, 7)}-${dateStr.slice(0, 4)}`;

                return <tr key={value.id}>
                  <th className={'text-left'}>{index + 1}</th>
                  <th className={'text-left'}>{dateFormat}</th>
                  <th className={'text-left'}>{value.id}</th>
                  <th className={'text-left'}>{value.narration}</th>
                  <th className={'text-left'}>{value.type}</th>
                  <th className={'text-right'}>{parseFloat(value.amount).toFixed(2)}</th>
                  <th
                    className={'text-right'}>{((parseFloat(value.balance) || 0) + (value.type === 'credit' ? 1 : -1) * parseFloat(value.amount)).toFixed(2)}</th>
                </tr>
              })}
              </tbody>
            </table>
          </CardBody>
        </Card>
      </div>
    </>
  );
}

function getLabelForType(type) {
  const map = {
    'cash-certificate': 'Cash Certificate',
    'fixed-deposit': 'Fixed Deposit',
    'mis-deposit': 'MIS Deposit',
    'recurring-deposit': 'Recurring Deposit',
    'thrift-fund': 'Thrift Fund',
    'daily-savings': 'Daily Savings',
  };
  return map[type] || type;
}

export default AccountStatement;