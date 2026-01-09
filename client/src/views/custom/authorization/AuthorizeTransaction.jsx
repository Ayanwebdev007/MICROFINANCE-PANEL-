/*!

=========================================================
* Black Dashboard PRO React - v1.2.4
=========================================================

* Product Page: https://www.creative-tim.com/product/black-dashboard-pro-react
* Copyright 2024 Creative Tim (https://www.creative-tim.com)

* Coded by Creative Tim

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

*/
import React from "react";

// reactstrap components
import {
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  Row,
  Col,
  Label,
  Form,
  Input,
  FormGroup,
  Button,
  Spinner
} from "reactstrap";
import { AgGridReact } from 'ag-grid-react';
import axios from "axios";
import CstNotification from "../components/CstNotification";
import ReactBSAlert from "react-bootstrap-sweetalert";


const AuthorizeTransaction = () => {
  const [userInput, setUserInput] = React.useState({parameter: ''});
  const [cstError, setCstError] = React.useState({parameter: ''});
  const [progressbar, setProgressbar] = React.useState(false);
  const [alert, setAlert] = React.useState({
    color: 'success',
    message: '',
    autoDismiss: 7,
    place: 'tc',
    display: false,
    transType: '',
    transId: '',
    sweetAlert: false,
    timestamp: new Date().getTime(),
  });
  const [rowData, setRowData] = React.useState([]);

  const CustomButtonComponent = (props) => {
    return <div className="form-inline">
      <Button className="fa fa-check btn-icon" color="success" size="sm" disabled={progressbar}
                onClick={()=> handleApprove(props.data.transactionType, props.data.id)}
      />
      <Button className="fa fa-ban" color="danger" size="sm" aria-hidden="true" disabled={progressbar}
              onClick={()=> setAlert({
                color: 'warning',
                message: `Are you sure you want to reject transaction ${props.data.id}?`,
                autoDismiss: 7,
                place: 'tc',
                display: false,
                transType: props.data.transactionType,
                transId: props.data.id,
                sweetAlert: true,
                timestamp: new Date().getTime(),
              })}
      />
    </div>
  };
  const [colDefs, setColDefs] = React.useState([
    {field: "id", headerName: "Transaction ID"},
    {field: "transactionDate", headerName: "Date"},
    {field: "name", headerName: "NAME"},
    {headerName: "Trans Type", valueGetter: p => p.data.type === 'credit' ? 'CREDIT' : 'DEBIT'},
    {field: "narration", headerName: "Narration"},
    {field: "method", headerName: "Method"},
    {field: "amount", headerName: "Amount"},
    {field: "action", headerName: 'Action', cellRenderer: CustomButtonComponent, filter: false,},
  ]);
  const defaultColDef = {
    flex: 1,
    filter: true,
    floatingFilter: false
  }

  async function onSubmit(){
    setCstError({
      parameter: '',
    });
    if(userInput.parameter !== ''){
      try {
        setProgressbar(true);
        const submitData = await axios.post('/api/payment-instructions/get-transactions', userInput);
        if(submitData.data.success){
          setRowData(submitData.data.data);
        }else {
          setAlert({
            color: 'warning',
            message: submitData.data.error,
            autoDismiss: 7,
            place: 'tc',
            transType: '',
            transId: '',
            display: true,
            sweetAlert: false,
            timestamp: new Date().getTime(),
          });
        }
        setProgressbar(false);
      }catch (e) {
        setAlert({
          color: 'danger',
          message: e.toLocaleString(),
          autoDismiss: 7,
          place: 'tc',
          transType: '',
          transId: '',
          display: true,
          sweetAlert: false,
          timestamp: new Date().getTime(),
        });
      }
    }else {
      setCstError({
        parameter: 'Please select a parameter',
      });
    }
  }

  async function handleReject(parameter, transactionId){
    setAlert({
      color: 'info',
      message: '',
      autoDismiss: 7,
      place: 'tc',
      transType: '',
      transId: '',
      display: false,
      sweetAlert: false,
      timestamp: new Date().getTime(),
    });
    try {
      setProgressbar(true);
      const reject = await axios.get(`/api/authorise-reject/${parameter}/${transactionId}`);
      if (reject.data.success){
        setProgressbar(false);
        setRowData(rowData.filter((item) => item.id !== transactionId));
        setAlert({
          color: 'success',
          message: reject.data.success,
          autoDismiss: 7,
          place: 'tc',
          transType: '',
          transId: '',
          display: true,
          sweetAlert: false,
          timestamp: new Date().getTime(),
        });
      }else {
        setProgressbar(false);
        setAlert({
          color: 'danger',
          message: reject.data.error,
          autoDismiss: 7,
          place: 'tc',
          transType: '',
          transId: '',
          display: true,
          sweetAlert: false,
          timestamp: new Date().getTime(),
        });
      }
    }catch (e) {
      setProgressbar(false);
      setAlert({
        color: 'danger',
        message: e.toLocaleString(),
        autoDismiss: 7,
        place: 'tc',
        transType: '',
        transId: '',
        display: true,
        sweetAlert: false,
        timestamp: new Date().getTime(),
      });
    }
  }

  async function handleApprove(parameter, transactionId){
    setAlert({
      color: 'info',
      message: '',
      autoDismiss: 7,
      place: 'tc',
      transType: '',
      transId: '',
      display: false,
      sweetAlert: false,
      timestamp: new Date().getTime(),
    });
    let authoriseSubmit;
    setProgressbar(true);
    try {
      if (parameter === 'deposit'){
        authoriseSubmit = await axios.get(`/api/authorize/deposit/${transactionId}`);
      }else if (parameter === 'loan-disbursement'){
        authoriseSubmit = await axios.get(`/api/authorize/loan-disbursement/${transactionId}`);
      }else if (parameter === 'loan-repayment'){
        authoriseSubmit = await axios.get(`/api/authorise/loan-repayment/${transactionId}`);
      }else if (parameter === 'voucher'){
        authoriseSubmit = await axios.get(`/api/authorise/voucher/${transactionId}`);
      }else {
        setAlert({
          color: 'warning',
          message: 'Unsupported Authorized method. You can only reject it',
          autoDismiss: 7,
          place: 'tc',
          transType: '',
          transId: '',
          display: true,
          sweetAlert: false,
          timestamp: new Date().getTime(),
        });

      }
      if (authoriseSubmit.data.success){
        setAlert({
          color: 'success',
          message: authoriseSubmit.data.success,
          autoDismiss: 7,
          place: 'tc',
          transType: '',
          transId: '',
          display: true,
          sweetAlert: false,
          timestamp: new Date().getTime(),
        });
        if (authoriseSubmit.data.autoAuthorize){
          for (const piInfo of authoriseSubmit.data.autoAuthorize) {
            await triggerAuthorization(piInfo.type, piInfo.id);
          }
        }
        setRowData(authoriseSubmit.data.transactions);
      }else if (authoriseSubmit.data.warning){
        setRowData(authoriseSubmit.data.transactions);
        setAlert({
          color: 'warning',
          message: authoriseSubmit.data.warning,
          autoDismiss: 7,
          place: 'tc',
          transType: '',
          transId: '',
          display: true,
          sweetAlert: false,
          timestamp: new Date().getTime(),
        });
      }else {
        setAlert({
          color: 'danger',
          message: authoriseSubmit.data.error,
          autoDismiss: 7,
          place: 'tc',
          transType: '',
          transId: '',
          display: true,
          sweetAlert: false,
          timestamp: new Date().getTime(),
        });
      }
      setProgressbar(false);
    }catch (e) {
      setProgressbar(false);
      setAlert({
        color: 'danger',
        message: e.toLocaleString(),
        autoDismiss: 7,
        place: 'tc',
        transType: '',
        transId: '',
        display: true,
        sweetAlert: false,
        timestamp: new Date().getTime(),
      });
    }
  }

  async function triggerAuthorization(parameter, transactionId){
    if (parameter === 'deposit'){
      await axios.get(`/api/authorize/deposit/${transactionId}`);
    }else if (parameter === 'voucher'){
      await axios.get(`/api/authorise/voucher/${transactionId}`);
    }
  }

  return (
    <>
      <div className="rna-container">
        {alert.display && <CstNotification color={alert.color} message={alert.message} autoDismiss={alert.autoDismiss} place={alert.place} timestamp={alert.timestamp}/>}
        {alert.sweetAlert && <ReactBSAlert
          warning
          style={{ display: "block", marginTop: "-100px" }}
          title="Are you sure?"
          onConfirm={() => handleReject(alert.transType, alert.transId)}
          onCancel={() => setAlert({...alert, sweetAlert: false})}
          confirmBtnBsStyle="success"
          cancelBtnBsStyle="danger"
          confirmBtnText="Yes, delete it!"
          cancelBtnText="Cancel"
          showCancel
          btnSize=""
        >
          {alert.message}
        </ReactBSAlert>}
      </div>
      <div className="content">
        <Row>
          <Col>
            <Card>
              <CardBody>
                <Form>
                  <Row>
                    <Col md={3}>
                      <Label>Transaction Type</Label>
                      <FormGroup>
                        <Input type="select" name="select" id="parameterSelect"
                               value={userInput.parameter}
                               onChange={(event) => setUserInput({...userInput, parameter: event.target.value})}
                        >
                          <option value={''}>Select Transaction Type</option>
                          <option value={'deposit'}>Deposit Transactions</option>
                          <option value={'voucher'}>Voucher Transactions</option>
                          <option value={'loan-disbursement'}>Loan Disbursement</option>
                          <option value={'loan-repayment'}>Loan Repayment</option>
                        </Input>
                        <p style={{color: 'red'}}>{cstError.parameter}</p>
                      </FormGroup>
                    </Col>
                    <Col md={2}>
                      <Row>
                        <Spinner color="info" className={'mt-4'} hidden={!progressbar} />
                        <Button className={"btn-fill ml-2 mt-4"} color="info" type="button" onClick={onSubmit}>
                          Search
                        </Button>
                      </Row>
                    </Col>
                  </Row>
                </Form>
              </CardBody>
            </Card>
          </Col>
          <Col className="mb-5" md="12">
            <Card>
              <CardHeader>
                <CardTitle tag="h4">Simple Table</CardTitle>
              </CardHeader>
              <CardBody style={{height: window.innerHeight - 200}}>
                <AgGridReact
                  rowData={rowData}
                  columnDefs={colDefs}
                  defaultColDef={defaultColDef}
                  enableCellTextSelection={true}
                />
              </CardBody>
            </Card>
          </Col>
        </Row>
      </div>
    </>
  );
};

export default AuthorizeTransaction;
