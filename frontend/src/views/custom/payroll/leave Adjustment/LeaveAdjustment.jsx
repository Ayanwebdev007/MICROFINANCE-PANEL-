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
import { useSelector } from "react-redux";

const LeaveAdjustment = () => {
    const initInput = {
        employeeCode: "",
        employeeName: "",
        joiningDate: new Date().toISOString().slice(0, 10),
        totalCL: "",
        totalSL: "",
        totalEL: "",
        remainingCL: "",
        remainingSL: "",
        remainingEL: "",
        applyCL: "",
        applySL: "",
        applyEL: "",
        leaveDate: new Date().toISOString().slice(0, 10),
        purpose: "",
        uuid: crypto.randomUUID(),
    };

    const [leaveData, setLeaveData] = React.useState(initInput);
    const [errors, setErrors] = React.useState({});
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
    const authStatus = useSelector((state) => state.auth.authState);

    const validateInput = () => {
        const tempErrors = {};
        let isValid = true;

        // Required fields validation
        if (!leaveData.employeeCode.trim()) {
            tempErrors.employeeCode = "Employee code is required";
            isValid = false;
        }
        if (!leaveData.employeeName.trim()) {
            tempErrors.employeeName = "Employee name is required";
            isValid = false;
        }
        if (!leaveData.joiningDate) {
            tempErrors.joiningDate = "Joining date is required";
            isValid = false;
        }
        if (!leaveData.leaveDate) {
            tempErrors.leaveDate = "Leave date is required";
            isValid = false;
        }

        // Numeric fields validation
        const numericFields = ["totalCL", "totalSL", "totalEL", "applyCL", "applySL", "applyEL"];
        numericFields.forEach((field) => {
            if (isNaN(leaveData[field])) {
                tempErrors[field] = "Must be a valid number";
                isValid = false;
            }
        });

        setErrors(tempErrors);
        return isValid;
    };

    const handleSubmit = async () => {
        if (!validateInput()) return;

        try {
            setLoading(true);
            const response = await axios.post("/api/leaveAdjustment/add", leaveData);

            setAlert({
                color: "success",
                message: "Leave adjusted successfully",
                display: true,
                sweetAlert: true,
                timestamp: new Date().getTime(),
            });

            setLeaveData({ ...initInput, uuid: crypto.randomUUID() });

        } catch (error) {
            setAlert({
                color: "danger",
                message: error.response?.data?.error || "Adjustment failed",
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
                {/* Employee Information Section */}
                <Row>
                    <Col md="12">
                        <Card>
                            <CardHeader>
                                <CardTitle tag="h3">Employee Information</CardTitle>
                            </CardHeader>
                            <CardBody>
                                <Form>
                                    <Row>
                                        <Col className="pr-1" md="4">
                                            <FormGroup>
                                                <Label>Employee Code*</Label>
                                                <Input
                                                    type="text"
                                                    name="employeeCode"
                                                    placeholder="Enter Employee Code"
                                                    value={leaveData.employeeCode}
                                                    onChange={(e) => setLeaveData({ ...leaveData, employeeCode: e.target.value })}
                                                />
                                                <p style={{ color: "red" }}>{errors.employeeCode}</p>
                                            </FormGroup>
                                        </Col>
                                        <Col className="pr-1" md="4">
                                            <FormGroup>
                                                <Label>Employee Name*</Label>
                                                <Input
                                                    type="text"
                                                    name="employeeName"
                                                    placeholder="Enter Employee Name"
                                                    value={leaveData.employeeName}
                                                    onChange={(e) => setLeaveData({ ...leaveData, employeeName: e.target.value })}
                                                />
                                                <p style={{ color: "red" }}>{errors.employeeName}</p>
                                            </FormGroup>
                                        </Col>
                                        <Col className="pr-1" md="4">
                                            <FormGroup>
                                                <Label>Joining Date*</Label>
                                                <Input
                                                    type="date"
                                                    name="joiningDate"
                                                    value={leaveData.joiningDate}
                                                    onChange={(e) => setLeaveData({ ...leaveData, joiningDate: e.target.value })}
                                                />
                                                <p style={{ color: "red" }}>{errors.joiningDate}</p>
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                </Form>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>

                {/* Leave Details Section */}
                <Row>
                    <Col md="12">
                        <Card>
                            <CardHeader>
                                <CardTitle tag="h3">Leave Adjustment Details</CardTitle>
                            </CardHeader>
                            <CardBody>
                                <Form>
                                    <Row>
                                        {/* Leave Balances */}
                                        <Col md="4">
                                            <FormGroup>
                                                <Label>Total CL</Label>
                                                <Input
                                                    type="number"
                                                    name="totalCL"
                                                    placeholder="0"
                                                    value={leaveData.totalCL}
                                                    onChange={(e) => setLeaveData({ ...leaveData, totalCL: parseInt(e.target.value) || 0 })}
                                                />
                                                <p style={{ color: "red" }}>{errors.totalCL}</p>
                                            </FormGroup>
                                        </Col>
                                        <Col md="4">
                                            <FormGroup>
                                                <Label>Total SL</Label>
                                                <Input
                                                    type="number"
                                                    name="totalSL"
                                                    placeholder="0"
                                                    value={leaveData.totalSL}
                                                    onChange={(e) => setLeaveData({ ...leaveData, totalSL: parseInt(e.target.value) || 0 })}
                                                />
                                                <p style={{ color: "red" }}>{errors.totalSL}</p>
                                            </FormGroup>
                                        </Col>
                                        <Col md="4">
                                            <FormGroup>
                                                <Label>Total EL/PL</Label>
                                                <Input
                                                    type="number"
                                                    name="totalEL"
                                                    placeholder="0"
                                                    value={leaveData.totalEL}
                                                    onChange={(e) => setLeaveData({ ...leaveData, totalEL: parseInt(e.target.value) || 0 })}
                                                />
                                                <p style={{ color: "red" }}>{errors.totalEL}</p>
                                            </FormGroup>
                                        </Col>

                                        {/* Remaining Leaves */}
                                        <Col md="4">
                                            <FormGroup>
                                                <Label>Remaining CL</Label>
                                                <Input
                                                    type="number"
                                                    name="remainingCL"
                                                    placeholder="0"
                                                    value={leaveData.remainingCL}
                                                    onChange={(e) => setLeaveData({ ...leaveData, remainingCL: parseInt(e.target.value) || 0 })}
                                                />
                                            </FormGroup>
                                        </Col>
                                        <Col md="4">
                                            <FormGroup>
                                                <Label>Remaining SL</Label>
                                                <Input
                                                    type="number"
                                                    name="remainingSL"
                                                    placeholder="0"
                                                    value={leaveData.remainingSL}
                                                    onChange={(e) => setLeaveData({ ...leaveData, remainingSL: parseInt(e.target.value) || 0 })}
                                                />
                                            </FormGroup>
                                        </Col>
                                        <Col md="4">
                                            <FormGroup>
                                                <Label>Remaining EL/PL</Label>
                                                <Input
                                                    type="number"
                                                    name="remainingEL"
                                                    placeholder="0"
                                                    value={leaveData.remainingEL}
                                                    onChange={(e) => setLeaveData({ ...leaveData, remainingEL: parseInt(e.target.value) || 0 })}
                                                />
                                            </FormGroup>
                                        </Col>

                                        {/* Leave Application */}
                                        <Col md="4">
                                            <FormGroup>
                                                <Label>Apply CL</Label>
                                                <Input
                                                    type="number"
                                                    name="applyCL"
                                                    placeholder="0"
                                                    value={leaveData.applyCL}
                                                    onChange={(e) => setLeaveData({ ...leaveData, applyCL: parseInt(e.target.value) || 0 })}
                                                />
                                                <p style={{ color: "red" }}>{errors.applyCL}</p>
                                            </FormGroup>
                                        </Col>
                                        <Col md="4">
                                            <FormGroup>
                                                <Label>Apply SL</Label>
                                                <Input
                                                    type="number"
                                                    name="applySL"
                                                    placeholder="0"
                                                    value={leaveData.applySL}
                                                    onChange={(e) => setLeaveData({ ...leaveData, applySL: parseInt(e.target.value) || 0 })}
                                                />
                                                <p style={{ color: "red" }}>{errors.applySL}</p>
                                            </FormGroup>
                                        </Col>
                                        <Col md="4">
                                            <FormGroup>
                                                <Label>Apply EL/PL</Label>
                                                <Input
                                                    type="number"
                                                    name="applyEL"
                                                    placeholder="0"
                                                    value={leaveData.applyEL}
                                                    onChange={(e) => setLeaveData({ ...leaveData, applyEL: parseInt(e.target.value) || 0 })}
                                                />
                                                <p style={{ color: "red" }}>{errors.applyEL}</p>
                                            </FormGroup>
                                        </Col>
                                        <Col md="4">
                                            <FormGroup>
                                                <Label>Leave Date</Label>
                                                <Input
                                                    type="date"
                                                    name="leaveDate"
                                                    value={leaveData.leaveDate}
                                                    onChange={(e) => setLeaveData({ ...leaveData, leaveDate: e.target.value })}
                                                />
                                                <p style={{ color: "red" }}>{errors.leaveDate}</p>
                                            </FormGroup>
                                        </Col>
                                        <Col md="8">
                                            <FormGroup>
                                                <Label>Purpose of Leave</Label>
                                                <Input
                                                    type="textarea"
                                                    name="purpose"
                                                    placeholder="Enter leave purpose"
                                                    value={leaveData.purpose}
                                                    onChange={(e) => setLeaveData({ ...leaveData, purpose: e.target.value })}
                                                />
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                </Form>
                            </CardBody>
                            <CardFooter>
                                <center>
                                    <Spinner color="info" hidden={!loading} />
                                </center>
                                <Button
                                    className="btn-fill"
                                    color="info"
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={loading}
                                >
                                    {loading ? "Adjusting..." : "Adjust Leave"}
                                </Button>
                            </CardFooter>
                        </Card>
                    </Col>
                </Row>
            </div>
        </>
    );
};

export default LeaveAdjustment;