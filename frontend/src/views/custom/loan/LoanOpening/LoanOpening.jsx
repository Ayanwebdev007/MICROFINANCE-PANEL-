import React from "react";
import {
  Button,
  Row,
  Col, Spinner,
  CardFooter,
} from "reactstrap";
import ReactBSAlert from "react-bootstrap-sweetalert";
import { LinearProgress } from "@mui/material";
import CstNotification from "../../components/CstNotification";

// Hook
import { useLoanOpening } from "./hooks/useLoanOpening";

// Components
import {
  LoanDetailsFields,
  MemberDetailsFields,
  PhotoUploadSection,
  GuarantorDetailsFields,
  CoApplicantDetailsFields,
  DeductionDetailsFields
} from "./components/LoanOpeningComponents";

const LoanOpeningForm = () => {
  const notificationAlertRef = React.useRef(null);
  const [alertState, setAlertState] = React.useState({
    display: false,
    color: 'success',
    message: '',
    autoDismiss: 7,
    place: 'tc',
    timestamp: 0
  });

  const notify = React.useCallback((message, color = 'success') => {
    setAlertState({
      display: true,
      color,
      message,
      autoDismiss: 7,
      place: 'tc',
      timestamp: new Date().getTime()
    });
  }, []);

  const {
    formData,
    setFormData,
    memberData,
    planList,
    progressbar,
    cstError,
    sweetAlert, setSweetAlert,
    handleInputChange,
    handleNestedInputChange,
    handlePlanSelect,
    handleLoanAmount,
    getMemberData,
    handleSubmit,
    authStatus
  } = useLoanOpening(notify);

  return (
    <>
      <div className="rna-container">
        {alertState.display && (
          <CstNotification
            color={alertState.color}
            message={alertState.message}
            autoDismiss={alertState.autoDismiss}
            place={alertState.place}
            timestamp={alertState.timestamp}
          />
        )}
        {sweetAlert && (
          <ReactBSAlert
            success
            style={{ display: "block", marginTop: "-100px" }}
            title="Success!"
            onConfirm={() => setSweetAlert(false)}
            onCancel={() => setSweetAlert(false)}
            confirmBtnBsStyle="success"
          >
            {alertState.message}
          </ReactBSAlert>
        )}
      </div>
      <div className="content">
        <div className={'mb-2'}>
          {progressbar ? <LinearProgress /> : null}
        </div>

        <Row>
          <Col md="12">
            <LoanDetailsFields
              formData={formData}
              cstError={cstError}
              planList={planList}
              handleInputChange={handleInputChange}
              handlePlanSelect={handlePlanSelect}
              handleLoanAmount={handleLoanAmount}
              setFormData={setFormData}
            />
          </Col>
        </Row>

        <Row>
          <Col md="12">
            <MemberDetailsFields
              formData={formData}
              memberData={memberData}
              cstError={cstError}
              getMemberData={getMemberData}
            />
          </Col>
        </Row>

        <Row>
          <Col md="12">
            <PhotoUploadSection
              uuid={formData.uuid}
              bankId={authStatus.bankId}
            />
          </Col>
        </Row>

        <Row>
          <Col md="12">
            <GuarantorDetailsFields
              guarantor={formData.guarantor}
              cstError={cstError}
              handleNestedInputChange={handleNestedInputChange}
            />
          </Col>
        </Row>

        <Row>
          <Col md="12">
            <CoApplicantDetailsFields
              coApplicant={formData.coApplicant}
              cstError={cstError}
              handleNestedInputChange={handleNestedInputChange}
            />
          </Col>
        </Row>

        <Row>
          <Col md="12">
            <DeductionDetailsFields
              deductionDetails={formData.deductionDetails}
              cstError={cstError}
              handleNestedInputChange={handleNestedInputChange}
            />
          </Col>
        </Row>

        <Row>
          <Col md="12" className="text-center">
            <CardFooter>
              <center>
                <Spinner color="info" hidden={!progressbar} />
              </center>
              <Button className="btn-fill" color="info" type="button" onClick={handleSubmit}>
                Submit
              </Button>
            </CardFooter>
          </Col>
        </Row>
      </div>
    </>
  );
};

export default LoanOpeningForm;
