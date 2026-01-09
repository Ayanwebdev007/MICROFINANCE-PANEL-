import React from 'react';
import axios from 'axios';
import {Card, CardBody, Col, FormGroup, Label, Row} from "reactstrap";
import Select from "react-select";
import CstNotification from "../../components/CstNotification";
import ReactBSAlert from "react-bootstrap-sweetalert";
import LoanApplicationForm from "./LoanForm";
import GroupLoanApplicationForm from "./GroupLoanForm";
import {LinearProgress} from "@mui/material";

const LoanOpeningApproval = () => {
  const initInput = {
    // Loan Details
    loanDate: new Date().toISOString().slice(0, 10),
    firstEmiDate: "",
    repaymentEmiDate: "",
    account: '',
    loanType: '',
    memberId: "",
    memberName: "",
    uuid: '#',
    amount: 0,
    emiAmount: 0,
    principleEMI: 0,
    interestEMI: 0,
    loanTerm: 0,
    emiCount: 0,
    groupId: '',
    groupName: '',
    // Loan Plan Details
    planDetails: {
      id: '',
      name: '',
      type: '',
      emiMode: '',
      emiInterval: '',
      minAge: '',
      maxAge: '',
      minAmount: '',
      maxAmount: '',
      minTerm: '',
      maxTerm: '',
      interestRate: '',
      interestType: '',
      security: '',
      processingFee: 0,
      legalFee: 0,
      insuranceFeeRate: 0,
      gstRate: 0,
      valuerFeeRate: 0,
      gracePeriod: 0,
      penaltyType: '',
      penaltyRate: '',
    },
    // Guarantor Details
    guarantor: {
      memberCode: "",
      guarantorName: "",
      address: "",
      pinCode: "",
      phone: "",
      securityType: "",
    },
    // Co-Applicant Details
    coApplicant: {
      memberCode: "",
      coApplicantname: "",
      address: "",
      pinCode: "",
      phone: "",
      securityDetails: "",
    },
    // Deduction Details
    deductionDetails: {
      processingFee: "",
      legalAmount: "",
      gst: "",
      insuranceAmount: "",
    },
  };
  const initMemberInfo = {
    name: '',
    guardian: '',
    gender: '',
    dob: '',
    materialStatus: '',
    email: '',
    phone: '',
    address: '',
    aadhar: '',
    voter: '',
    pan: '',
    occupation: '',
    income: '',
    education: '',
  };
  const [userInput, setUserInput] = React.useState(initInput);
  const [memberData, setMemberData] = React.useState(initMemberInfo);
  const [loanApplications, setLoanApplications] = React.useState([]);
  const [progressbar, setProgressbar] = React.useState(false);
  const [alert, setAlert] = React.useState({
    color: 'success',
    message: 'test message',
    autoDismiss: 7,
    place: 'tc',
    display: false,
    sweetAlert: false,
    timestamp: new Date().getTime(),
  });

  async function handleLoanTypeSelect(loanType) {
    setUserInput({...userInput, loanType: loanType});
    try {
      setProgressbar(true);
      const fetchDate = await axios.post(`/api/loan/get-loan-application-waiting-approval`, {accountType: loanType});
      if (fetchDate.data.success){
        setLoanApplications(fetchDate.data.success);
      }else {
        setAlert({
          color: 'danger',
          message: fetchDate.data.error,
          autoDismiss: 7,
          place: 'tc',
          display: true,
          sweetAlert: false,
          timestamp: new Date().getTime(),
        });
        setLoanApplications([]);
      }
    }catch (e) {
      setAlert({
        color: 'danger',
        message: e.toLocaleString(),
        autoDismiss: 7,
        place: 'tc',
        display: true,
        sweetAlert: false,
        timestamp: new Date().getTime(),
      });
    }finally {
      setProgressbar(false);
    }
  }

  function handleAccountSelect(value) {
    setUserInput({
      ...userInput,
      ...value.formData,
      account: value.account,
    });
    setMemberData(value.memberData);
  }

  function resetData(){
    const filteredApplications = loanApplications.filter(item => item.account !== userInput.account);
    setUserInput({
      ...initInput,
      loanType: userInput.loanType,
    });
    setMemberData(initMemberInfo);
    setLoanApplications(filteredApplications);
  }

  return (<>
    <div className="rna-container">
      {alert.display && <CstNotification color={alert.color} message={alert.message} autoDismiss={alert.autoDismiss} place={alert.place} timestamp={alert.timestamp}/>}
      {alert.sweetAlert && <ReactBSAlert
        success
        style={{ display: "block", marginTop: "-100px" }}
        title="Success!"
        onConfirm={() => setAlert({...alert, sweetAlert: false})}
        onCancel={() => setAlert({...alert, sweetAlert: false})}
        confirmBtnBsStyle="success"
        btnSize=""
      >
        {alert.message}
      </ReactBSAlert>}
    </div>
    <div className="content">
      <div className={'mb-2'}>
        {progressbar ? <LinearProgress /> : null}
      </div>
      <Row>
        <Col md="12">
          <Card>
            <CardBody className={'mt-2'}>
              <Row>
                <Col md={4} className={'mb-2'}>
                  <Label>Select a Loan Type</Label>
                  <FormGroup>
                    <Select
                      className="react-select info"
                      classNamePrefix="react-select"
                      name="typeSelect"
                      // onChange={(value) => setFormData({...formData, account: value, ...value})}
                      onChange={(value) => handleLoanTypeSelect(value.value)}
                      options={[
                        {value: 'loan', label: 'Loan Application'},
                        {value: 'group-loan', label: 'Group Loan Application'},
                      ]}
                      placeholder=''
                    />
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <Label>Select a Loan Application</Label>
                  <FormGroup>
                    <Select
                      className="react-select info"
                      classNamePrefix="react-select"
                      name="loanSelect"
                      // onChange={(value) => setFormData({...formData, account: value, ...value})}
                      onChange={(value) => handleAccountSelect(value)}
                      options={loanApplications}
                      placeholder=''
                    />
                  </FormGroup>
                </Col>
              </Row>
              {userInput.loanType === 'loan' ? <LoanApplicationForm userInput={userInput} setUserInput={setUserInput} memberData={memberData} resetData={resetData} /> : null}
              {userInput.loanType === 'group-loan' ? <GroupLoanApplicationForm userInput={userInput} setUserInput={setUserInput} memberData={memberData} resetData={resetData} /> : null}
            </CardBody>
          </Card>
        </Col>
      </Row>
    </div>
  </>)
}

export default LoanOpeningApproval;