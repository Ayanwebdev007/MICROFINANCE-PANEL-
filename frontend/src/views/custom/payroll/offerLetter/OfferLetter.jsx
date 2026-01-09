import React from "react";
import {
    Button,
    Card,
    CardHeader,
    CardBody,
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

const OfferLetter = () => {
    const [employeeCode, setEmployeeCode] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    const [errors, setErrors] = React.useState({});
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
        const tempErrors = {};
        let isValid = true;

        if (!employeeCode.trim()) {
            tempErrors.employeeCode = "Employee code is required";
            isValid = false;
        }

        setErrors(tempErrors);
        return isValid;
    };

    const handlePrint = async () => {
        if (!validateInput()) return;

        try {
            setLoading(true);
            const response = await axios.get(`/api/offer-letter/${employeeCode}`);

            setAlert({
                color: "success",
                message: "Offer letter ready for printing",
                display: true,
                sweetAlert: true,
                timestamp: new Date().getTime(),
            });

        } catch (error) {
            setAlert({
                color: "danger",
                message: error.response?.data?.error || "Employee not found",
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
                                <CardTitle tag="h3">Print Offer Letter</CardTitle>
                            </CardHeader>
                            <CardBody>
                                <Form>
                                    <Row>
                                        <Col md="4">
                                            <FormGroup>
                                                <Label>Employee Code*</Label>
                                                <Input
                                                    type="text"
                                                    name="employeeCode"
                                                    placeholder="Enter Employee Code"
                                                    value={employeeCode}
                                                    onChange={(e) => setEmployeeCode(e.target.value)}
                                                />
                                                <p style={{ color: "red" }}>{errors.employeeCode}</p>
                                            </FormGroup>
                                        </Col>
                                        <Col md="2" className="d-flex align-items-end">
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

export default OfferLetter;