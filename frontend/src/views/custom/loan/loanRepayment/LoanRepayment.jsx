import React from "react";
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
    Form
} from "reactstrap";
import { useLoanRepayment } from "./hooks/useLoanRepayment";
import { ProfileImages, ApplicantDetailsTable, RepaymentFormFields } from "./components/LoanRepaymentComponents";

function LoanRepayment() {
    const notificationAlertRef = React.useRef(null);

    const notify = React.useCallback((message, color) => {
        const options = {
            place: 'tc',
            message: <div>{message}</div>,
            type: color,
            icon: "tim-icons icon-bell-55",
            autoDismiss: 5,
        };
        if (notificationAlertRef.current?.notificationAlert) {
            notificationAlertRef.current.notificationAlert(options);
        } else {
            console.warn('[notify]', color, message);
        }
    }, []);

    const {
        details,
        setDetails,
        cstError,
        showProgress,
        sweetAlert,
        setSweetAlert,
        profilePreviewUrl,
        signPreviewUrl,
        applicants,
        handleAccountInput,
        handleCollectionAmountChange,
        onSubmit,
        fetchAccountDetails
    } = useLoanRepayment(notify);

    return (
        <>
            <div className="rna-container">
                <NotificationAlert ref={notificationAlertRef} />
            </div>
            <div className={'mb-2'}>
                {showProgress ? <LinearProgress /> : null}
            </div>
            {sweetAlert.render && (
                <SweetAlert
                    {...{ [sweetAlert.type]: true }}
                    style={{ display: "block", marginTop: "-100px" }}
                    title={sweetAlert.title}
                    onConfirm={() => setSweetAlert({ render: false, message: '', type: 'success', title: '' })}
                    onCancel={() => setSweetAlert({ render: false, message: '', type: 'success', title: '' })}
                    confirmBtnBsStyle="info"
                >
                    {sweetAlert.message}
                </SweetAlert>
            )}
            <div className="content">
                <Card>
                    <Form autoComplete={'off'}>
                        <CardHeader>
                            <CardTitle style={{ fontSize: 16, marginLeft: 15, fontWeight: 400 }}>Account Details</CardTitle>
                        </CardHeader>
                        <CardBody>
                            <Card>
                                <div className="row p-3">
                                    <RepaymentFormFields
                                        details={details}
                                        cstError={cstError}
                                        handleAccountInput={handleAccountInput}
                                        handleCollectionAmountChange={handleCollectionAmountChange}
                                        setDetails={setDetails}
                                        fetchAccountDetails={fetchAccountDetails}
                                    />
                                    <ProfileImages profileUrl={profilePreviewUrl} signUrl={signPreviewUrl} />
                                </div>
                            </Card>
                        </CardBody>
                        <CardHeader>
                            <CardTitle style={{ fontSize: 16, marginLeft: 15, fontWeight: 400 }}>Account Holder Details</CardTitle>
                        </CardHeader>
                        <ApplicantDetailsTable applicants={applicants} />
                        <CardFooter className={'text-center'}>
                            <div className={'mb-2'}>
                                {showProgress ? <CircularProgress style={{ color: '#75E6DA' }} /> : null}
                            </div>
                            <Button className="btn-fill" color="success" disabled={showProgress} type="button" onClick={onSubmit}>
                                Submit
                            </Button>
                        </CardFooter>
                    </Form>
                </Card>
            </div>
        </>
    );
}

export default LoanRepayment;