import React from "react";
import 'firebase/compat/app-check';
import axios from "axios";
import NotificationAlert from "react-notification-alert";
import { LinearProgress } from "@mui/material";
import printJS from "print-js";
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    CardTitle,
    Col, DropdownItem, DropdownMenu, DropdownToggle,
    Form,
    FormGroup,
    Input,
    Label,
    Row,
    Spinner, UncontrolledDropdown,
} from "reactstrap";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom"; // 👈 ADDED

function LoanAccountStatement() {
    const location = useLocation(); // 👈 READ NAVIGATION STATE

    const initValue = {
        fromDate: '',
        toDate: '',
        accountType: 'loan',
        account: '',
        passbook: '',
    };

    const notificationAlertRef = React.useRef(null);
    const [details, setDetails] = React.useState(initValue);
    const [cstError, setCstError] = React.useState(initValue);
    const [showProgress, setShowProgress] = React.useState(false);
    const [formIsVisible, setFormIsVisible] = React.useState(true);
    const [fetchedData, setFetchedData] = React.useState({
        name: '',
        guardian: '',
        address: '',
        cif: '',
        account: '',
        transactions: [],
        phone: '',
        cpName: '',
        cpCode: '',
        referrerCif: '',
        groupName: '',
        groupId: '',
        installmentPaid: 0,
        amountPaid: 0,
        installmentDue: 0,
        emiAmount: 0,
        amountDue: 0,
        installmentPending: 0,
        amountPending: 0,
    });

    const authStatus = useSelector((state) => state.auth.authState);

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

    // Helper to get date N days ago
    function getFromDate(daysAgo) {
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        return date.toISOString().slice(0, 10);
    }

    // Auto-fill on load from navigation
    React.useEffect(() => {
        const state = location.state;
        if (state?.prefillAccountNo) {
            setDetails(prev => ({
                ...prev,
                account: state.prefillAccountNo,
                fromDate: state.prefillFrom || getFromDate(30),
                toDate: state.prefillTo || new Date().toISOString().slice(0, 10),
            }));
        }
    }, [location.state]);

    async function onSubmit() {
        const checkInput = validateInput(details);

        if (checkInput) {
            setCstError(initValue);
            setShowProgress(true);

            try {
                const submit = await axios.post('/api/reports/loan/account-statement', details);

                if (submit.data.success) {
                    setFetchedData(submit.data.success);
                    notify('Successfully fetched account details', 'success');
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
        if (!userInput.account) {
            errorObj = { ...errorObj, account: 'Account number is required' };
            valid = false;
        }
        if ((userInput.fromDate && !userInput.toDate) || (userInput.toDate && !userInput.fromDate)) {
            errorObj = { ...errorObj, fromDate: 'Either both required', toDate: 'or clear both' };
            valid = false;
        }

        setCstError({ ...initValue, ...errorObj });
        return valid;
    }

    async function printForm() {
        if ( fetchedData.account=== '' || fetchedData.account=== undefined)
        {
            notify('Loan number is required. Please enter it to print the passbook.', 'danger');
            return;
        }
        printJS({
            printable: 'printable',
            type: 'html',
            targetStyles: ['*'],
            honorColor: false,
        });
    }

    const printPassbook = async () => {
        if ( fetchedData.account=== '' || fetchedData.account=== undefined)
        {
            notify('Loan number is required. Please enter it to print the passbook.', 'danger');
            return;
        }
        try {
            const res = await axios.get(
                `/api/loan/${fetchedData.account}/passbook/print`,
                {
                    responseType: "blob", // 🚨 REQUIRED
                    withCredentials: true // keep if auth needed
                }
            );

            // ✅ res.data IS THE PDF
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement("a");
            a.href = url;
            a.download = `Loan_passbook.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            console.log("api fatch");

        } catch (err) {
            console.error("PDF download failed:", err);
        }
    };





    async function printWindow() {
        setFormIsVisible(false);
        await new Promise(resolve => setTimeout(resolve, 1000));
        window.print();
        await new Promise(resolve => setTimeout(resolve, 500));
        setFormIsVisible(true);
    }
    window.onafterprint = () => {
        setFormIsVisible(true);
    };

    const cardHeaderStyle = {
        height: "32px",
        paddingTop: "0",
        paddingBottom: "0",
        display: "flex",
        alignItems: "center"
    };

    const cardTitleStyle = {
        fontSize:16,
        marginLeft:15,
        fontWeight:400,
        marginTop:13
    }

    return (
      <>
          <div className="rna-container">
              <NotificationAlert ref={notificationAlertRef} />
          </div>
          <div className="content">
              <div className={'mb-2'}>
                  {showProgress ? <LinearProgress /> : null}
              </div>

              {formIsVisible && (
                <Card>
                    <Form autoComplete={'off'}>
                        <CardHeader className="bg-light" style={cardHeaderStyle}>
                            <CardTitle style={cardTitleStyle}>Account Details</CardTitle>
                        </CardHeader>
                        <CardBody>
                            <Card>
                                <Row>
                                    <Col md={3}>
                                        <Label>Account Number</Label>
                                        <FormGroup>
                                            <Input
                                              type={'text'}
                                              value={details.account}
                                              onChange={(event) => setDetails({ ...details, account: event.target.value })}
                                              disabled={!!location.state?.prefillAccountNo} // 👈 LOCKED IF AUTO-FILLED
                                            />
                                            <p style={{ color: 'red' }}>{cstError.account}</p>
                                        </FormGroup>
                                    </Col>

                                    <Col md={3}>
                                        <Label>From Date</Label>
                                        <FormGroup>
                                            <Input
                                              type={'date'}
                                              value={details.fromDate}
                                              onChange={(event) => setDetails({ ...details, fromDate: event.target.value })}
                                              disabled={!!location.state?.prefillAccountNo} // 👈 LOCKED
                                            />
                                            <p style={{ color: 'red' }}>{cstError.fromDate}</p>
                                        </FormGroup>
                                    </Col>

                                    <Col md={3}>
                                        <Label>To Date</Label>
                                        <FormGroup>
                                            <Input
                                              type={'date'}
                                              value={details.toDate}
                                              onChange={(event) => setDetails({ ...details, toDate: event.target.value })}
                                              disabled={!!location.state?.prefillAccountNo} // 👈 LOCKED
                                            />
                                            <p style={{ color: 'red' }}>{cstError.toDate}</p>
                                        </FormGroup>
                                    </Col>

                                    <Col className="d-flex align-items-end mb-2">
                                        <center>
                                            <Spinner color="info" className={'mt-4'} hidden={!showProgress} />
                                        </center>
                                        <Button className={"btn-fill mt-4"} color="success" type="button" onClick={onSubmit}>
                                            Submit
                                        </Button>
                                        {/*<Button className={"btn-icon bg-success mt-4"} type="button" onClick={printForm}>*/}
                                        {/*    <i className="tim-icons icon-notes" />*/}
                                        {/*</Button>*/}
                                        {/*<Button className={"btn-icon bg-success mt-4"} type="button" onClick={printWindow}>*/}
                                        {/*    <i className="tim-icons icon-paper" />*/}
                                        {/*</Button>*/}

                                        <UncontrolledDropdown className="ml-2">
                                            <DropdownToggle color="dark" caret>
                                                🖨️ Print
                                            </DropdownToggle>
                                            <DropdownMenu>
                                                <DropdownItem className="text-dark" onClick={printForm}>
                                                    Statement
                                                </DropdownItem>

                                                <DropdownItem className="text-dark" onClick={printPassbook}>
                                                    Passbook
                                                </DropdownItem>
                                            </DropdownMenu>
                                        </UncontrolledDropdown>
                                    </Col>
                                </Row>
                            </Card>
                        </CardBody>
                    </Form>
                </Card>
              )}

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
                                  <p className="col-4 text-left">Guardian : <strong>{`${fetchedData.guardian}`}</strong></p>
                                  <p className="col-4 text-left">Customer No. : <strong>{fetchedData.cif}</strong></p>
                                  <p className="col-4 text-left">Address : <strong>{fetchedData.address}</strong></p>
                                  <p className="col-4 text-left">Phone : <strong>{fetchedData.phone}</strong></p>
                              </div>
                          </div>
                          <hr />
                          <div>
                              <div className="form-inline">
                                  <p className="col-4 text-left">Paid Installment : <strong>{fetchedData.installmentPaid}</strong></p>
                                  <p className="col-4 text-left">Installment Due : <strong>{fetchedData.installmentDue}</strong></p>
                                  <p className="col-4 text-left">Pending Installment : <strong>{fetchedData.installmentPending}</strong></p>

                                  <p className="col-4 text-left">Paid Amount : <strong>{fetchedData.amountPaid}</strong></p>
                                  <p className="col-4 text-left">Due Amount : <strong>{Number(fetchedData.amountDue).toFixed(3)}</strong></p>
                                  <p className="col-4 text-left">Pending Amount : <strong>{Number(fetchedData.amountPending).toFixed(3)}</strong></p>
                              </div>
                          </div>
                      </div>
                  </CardBody>
                  <CardBody>
                      <table className='table table-striped'>
                          <thead>
                          <tr>
                              <th className={'text-center'}>Sl.</th>
                              <th className={'text-center'}>Date</th>
                              <th className={'text-center'}>Voucher</th>
                              <th className={'text-center'}>Narration</th>
                              <th className={'text-center'}>Total EMI Paid</th>
                              <th className={'text-center'}>Type</th>
                              <th className={'text-center'}>amount</th>
                          </tr>
                          </thead>
                          <tbody>
                          {fetchedData.transactions.map((value, index) => {
                              const dateStr = new Date(value.entryDate).toISOString().slice(0, 10);
                              const dateFormat = `${dateStr.slice(8, 10)}-${dateStr.slice(5, 7)}-${dateStr.slice(0, 4)}`;

                              return <tr key={value.id}>
                                  <th className={'text-center'}>{index + 1}</th>
                                  <th className={'text-center'}>{dateFormat}</th>
                                  <th className={'text-center'}>{value.id}</th>
                                  <th className={'text-center'}>{value.narration}</th>
                                  <th className={'text-center'}>{value.paidEMI}</th>
                                  <th className={'text-center'}>{value.type}</th>
                                  <th className={'text-center'}>{parseFloat(value.amount).toFixed(2)}</th>
                              </tr>;
                          })}
                          </tbody>
                      </table>
                  </CardBody>
              </Card>
          </div>
      </>
    );
}

export default LoanAccountStatement;