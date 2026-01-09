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
  CardHeader,
  CardTitle,
  Col,
  Form,
  FormGroup,
  Input,
  Label,
  Row
} from "reactstrap";
import $ from "jquery";

function JournalBook(props){
  const initValue = {
    date: props.date,
  }
  const notificationAlertRef = React.useRef(null);
  const [details, setDetails] = React.useState(initValue);
  const [cstError, setCstError] = React.useState(initValue);
  const [showProgress, setShowProgress] = React.useState(false);
  const [sweetAlert, setSweetAlert] = React.useState({render: false, message: '', type: 'success', title: 'Success'});
  const [dayTransactions, setDayTransactions] = React.useState([]);
  const [grandTotal, setGrandTotal] = React.useState({
    cashDebitAmount: 0,
    cashCreditAmount: 0,
    transferDebitAmount: 0,
    transferCreditAmount: 0,
    debitAmount: 0,
    creditAmount: 0,
  });

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
      setCstError(initValue);
      setShowProgress(true);

      const submit = await axios.get(`/api/reports/general/day-book-v2/${details.date}`);
      if (submit.data.success){
        $('#currentDate').html((details.date).split("-").reverse().join("-"));
        notify('successfully fetched account details', 'success');
        setShowProgress(false);
        setDayTransactions(submit.data.success);
        setGrandTotal(submit.data.totalSum);
      }else {
        notify(submit.data.error, 'danger')
        setShowProgress(false);
      }
    }
  }

  function validateInput(userInput) {
    let valid = true;
    let errorObj = {}
    if (!userInput.date){
      errorObj = {...errorObj, date: 'this field is required'};
      valid = false;
    }

    setCstError({...cstError, ...errorObj});
    return valid
  }

  return (
    <>
      <div className="rna-container">
        <NotificationAlert ref={notificationAlertRef} />
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
                  <Col md={'3'}>
                    <Label>Report Date</Label>
                    <FormGroup>
                      <Input type={'date'} value={details.date}
                             onChange={(event)=> setDetails({date: event.target.value})}/>
                    </FormGroup>
                  </Col>
                  <Col md={'3'}>
                    <div className={'mb-2'}>
                      {showProgress ? <CircularProgress style={{color: '#75E6DA'}} /> : null}
                    </div>
                    <Button className={"btn-fill mt-3"} color="success" type="button" onClick={onSubmit}>
                      Submit
                    </Button>
                  </Col>
                </Row>
              </Card>
            </CardBody>
          </Form>
        </Card>
        <Card>
          <div>
            <div className="form-inline offset-5 mt-2">
              <h3 className="" style={{fontSize:'1.4rem', fontWeight: 'bold'}} id="daybook">Day Book As On: </h3>
              <h3 className="ml-2" id="currentDate" style={{fontSize:'1.7rem', }}/>
            </div>
          </div>
          <CardHeader>
            <CardTitle>Receipt</CardTitle>
          </CardHeader>
          <CardBody>
            <table className='table table-striped table-bordered'>
              <thead>
              <tr>
                <th className={'text-center'}>GL Code</th>
                <th className={'text-center'} colSpan={2}>GL Head</th>
                <th className={'text-right'}>Transfer Amount</th>
              </tr>
              </thead>
              {dayTransactions.map((transaction)=>{
                if (transaction.transferCreditAmount > 0 && transaction.transactions.length > 0){
                  return <tbody>
                  <tr className={'bg-success'}>
                    <th className={'text-center'}>{transaction.glCode}</th>
                    <th className={'text-center'} colSpan={2}>{transaction.glHead}</th>
                    <th className={'text-right'}>{(parseFloat(transaction.transferCreditAmount || 0)).toFixed(2)}</th>
                  </tr>
                  <tr>
                    <th className={'text-left'}>TransId</th>
                    <th className={'text-center'}>Account</th>
                    <th className={'text-center'}>Narration</th>
                    <th className={'text-right'}>Transfer Amount</th>
                  </tr>
                  {transaction.transactions.map((pi) => {
                    if (pi.details.type === 'credit' && pi.details.method !== 'cash'){
                      return <tr key={pi.id}>
                        <th className={'text-left'}><b>{pi.id}</b></th>
                        <th className={'text-center'}><b>{pi.details.account}</b></th>
                        <th className={"text-center"}><b>{pi.details.narration}</b></th>
                        <th className={"text-right"}><b>{(pi.details.method === 'cash' ? 0 : 1) * parseFloat(pi.details.amount)}</b></th>
                      </tr>
                    }
                  })}
                  </tbody>
                }
              })}
              <tbody>
              <tr className="bg-dark text-white">
                <th className="text-center" style={{fontSize:'25px', width:'15rem'}}/>
                <th colSpan={2} className="text-center" style={{fontSize:'25px'}}><strong>Grand Total</strong></th>
                <th className="text-right" id="totalTransferDebit" style={{fontSize:'25px'}}><b>{grandTotal.transferCreditAmount.toFixed(2)}</b></th>
              </tr>
              </tbody>
            </table>
          </CardBody>
          <CardHeader>
            <CardTitle>Payment</CardTitle>
          </CardHeader>
          <CardBody>
            <table className='table table-striped table-bordered'>
              <thead>
              <tr>
                <th className={'text-center'}>GL Code</th>
                <th className={'text-center'} colSpan={2}>GL Head</th>
                <th className={'text-right'}>Transfer Amount</th>
              </tr>
              </thead>
              {dayTransactions.map((transaction)=>{
                if (transaction.transferDebitAmount > 0 && transaction.transactions.length > 0){
                  return <tbody>
                  <tr className={'bg-success'}>
                    <th className={'text-center'}>{transaction.glCode}</th>
                    <th className={'text-center'} colSpan={2}>{transaction.glHead}</th>
                    <th className={'text-right'}>{(parseFloat(transaction.transferDebitAmount || 0)).toFixed(2)}</th>
                  </tr>
                  <tr>
                    <th className={'text-left'}>TransId</th>
                    <th className={'text-center'}>Account</th>
                    <th className={'text-center'}>Narration</th>
                    <th className={'text-right'}>Transfer Amount</th>
                  </tr>
                  {transaction.transactions.map((pi) => {
                    if (pi.details.type === 'debit' && pi.details.method !== 'cash'){
                      return <tr key={pi.id}>
                        <th className={'text-left'}><b>{pi.id}</b></th>
                        <th className={'text-center'}><b>{pi.details.account}</b></th>
                        <th className={"text-center"}><b>{pi.details.narration}</b></th>
                        <th className={"text-right"}><b>{(pi.details.method === 'cash' ? 0 : 1) * parseFloat(pi.details.amount)}</b></th>
                      </tr>
                    }
                  })}
                  </tbody>
                }
              })}
              <tbody>
              <tr className="bg-dark text-white">
                <th className="text-center" style={{fontSize:'25px', width:'15rem'}}/>
                <th colSpan={2} className="text-center" style={{fontSize:'25px'}}><strong>Grand Total</strong></th>
                <th className="text-right" id="totalTransferDebit" style={{fontSize:'25px'}}><b>{grandTotal.transferDebitAmount.toFixed(2)}</b></th>
              </tr>
              </tbody>
            </table>
          </CardBody>
          <CardBody>
            <div className={'row'}>
              <p className={'col-4'}><hr className="border-primary mt-5"/>
                <span className="offset-3"><b><i>Manager / Branch Incharge</i></b></span></p>
              <p className={'col-4'}><hr className="border-primary mt-5"/>
                <span className="offset-5"><b><i>Account</i></b></span></p>
              <p className={'col-4'}><hr className="border-primary mt-5"/>
                <span className="offset-5"><b><i>Secretary</i></b></span></p>
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  )
}

export default JournalBook;