import React from "react";
import {
    Button,
    Card,
    CardHeader,
    CardBody,
    CardFooter,
    CardTitle,
    Label,
    FormGroup,
    Form,
    Input,
    Row,
    Col,
    Spinner,
} from "reactstrap";
import CstNotification from "../../components/CstNotification";
import ReactBSAlert from "react-bootstrap-sweetalert";
import axios from "axios";

const PrintAppointmentLetter = () => {
    const [employeeCode, setEmployeeCode] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    const [alert, setAlert] = React.useState({
        color: "success",
        message: "",
        autoDismiss: 7,
        place: "tc",
        display: false,
        sweetAlert: false,
        timestamp: new Date().getTime(),
    });

    const validateInput = () => {
        if (!employeeCode.trim()) {
            setAlert({
                color: "danger",
                message: "Employee code is required",
                display: true,
                timestamp: new Date().getTime(),
            });
            return false;
        }
        return true;
    };

    const handlePrint = async () => {
        if (!validateInput()) return;

        try {
            setLoading(true);
            const response = await axios.get(`/api/appointment/print/${employeeCode}`);

            setAlert({
                color: "success",
                message: "Document sent to printer",
                display: true,
                sweetAlert: true,
                timestamp: new Date().getTime(),
            });

        } catch (error) {
            setAlert({
                color: "danger",
                message: error.message || "Printing failed",
                display: true,
                timestamp: new Date().getTime(),
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="rna-container">
                {alert.display && (
                    <CstNotification
                        color={alert.color}
                        message={alert.message}
                        autoDismiss={alert.autoDismiss}
                        place={alert.place}
                        timestamp={alert.timestamp}
                    />
                )}
                {alert.sweetAlert && (
                    <ReactBSAlert
                        success
                        style={{ display: "block", marginTop: "-100px" }}
                        title="Success!"
                        onConfirm={() => setAlert({ ...alert, sweetAlert: false })}
                        confirmBtnBsStyle="success"
                    >
                        {alert.message}
                    </ReactBSAlert>
                )}
            </div>

            <div className="content">
                <Row>
                    <Col md="12">
                        <Card>
                            <CardHeader>
                                <CardTitle tag="h3">Print Appointment Letter</CardTitle>
                            </CardHeader>
                            <CardBody>
                                <Form>
                                    <Row>
                                        <Col md="8">
                                            <FormGroup>
                                                <Label>Employee Code</Label>
                                                <Input
                                                    type="text"
                                                    name="employeeCode"
                                                    placeholder="Enter employee code"
                                                    value={employeeCode}
                                                    onChange={(e) => setEmployeeCode(e.target.value)}
                                                />
                                            </FormGroup>
                                        </Col>
                                        <Col md="4" className="d-flex align-items-center">
                                            <Button
                                                className="btn-fill"
                                                color="warning"
                                                onClick={handlePrint}
                                                disabled={loading}
                                            >
                                                {loading ? <Spinner size="sm" /> : "Print Letter"}
                                            </Button>
                                        </Col>
                                    </Row>
                                </Form>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </div>
        </>
    );
};

export default PrintAppointmentLetter;