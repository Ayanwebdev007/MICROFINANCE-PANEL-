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
    Table,
} from "reactstrap";
import CstNotification from "../../components/CstNotification";
import ReactBSAlert from "react-bootstrap-sweetalert";
import axios from "axios";
import { useSelector } from "react-redux";

const SalaryMaster = () => {
    const initInput = {
        empCode: "",
        basic: "",
        hra: "",
        da: "",
        ta: "",
        allowance: "",
        others: "",
        grossPay: "",
        pf: "",
        esi: "",
        netPay: "",
        uuid: crypto.randomUUID(),
    };

    const [salaryData, setSalaryData] = React.useState(initInput);
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

        if (!salaryData.empCode) {
            tempErrors.empCode = "Employee code is required";
            isValid = false;
        }
        if (!salaryData.basic) {
            tempErrors.basic = "Basic salary is required";
            isValid = false;
        }
        if (!salaryData.hra) {
            tempErrors.hra = "HRA is required";
            isValid = false;
        }
        if (!salaryData.da) {
            tempErrors.da = "DA is required";
            isValid = false;
        }
        if (!salaryData.ta) {
            tempErrors.ta = "TA is required";
            isValid = false;
        }
        if (!salaryData.netPay) {
            tempErrors.netPay = "Net pay is required";
            isValid = false;
        }

        setErrors(tempErrors);
        return isValid;
    };

    const handleSubmit = async () => {
        if (validateInput()) {
            try {
                setLoading(true);
                const response = await axios.post("/api/salary/add", salaryData);

                setAlert({
                    color: "success",
                    message: "Salary details added successfully",
                    display: true,
                    sweetAlert: true,
                    timestamp: new Date().getTime(),
                });

                setSalaryData({ ...initInput, uuid: crypto.randomUUID() });

            } catch (error) {
                setAlert({
                    color: "danger",
                    message: error.message || "Something went wrong",
                    display: true,
                    timestamp: new Date().getTime(),
                });
            } finally {
                setLoading(false);
            }
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
                {/* Search Section */}
                <Row>
                    <Col md="12">
                        <Card>
                            <CardHeader>
                                <CardTitle tag="h3">Search Employee</CardTitle>
                            </CardHeader>
                            <CardBody>
                                <Row>
                                    <Col md="4">
                                        <FormGroup>
                                            <Label>Employee Code</Label>
                                            <Input
                                                type="text"
                                                name="empCode"
                                                placeholder="Enter employee code"
                                                value={salaryData.empCode}
                                                onChange={(e) => setSalaryData({ ...salaryData, empCode: e.target.value })}
                                            />
                                            <p style={{ color: "red" }}>{errors.empCode}</p>
                                        </FormGroup>
                                    </Col>
                                </Row>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>

                {/* Salary Details Form */}
                <Row>
                    <Col md="12">
                        <Card>
                            <CardHeader>
                                <CardTitle tag="h3">Salary Details</CardTitle>
                            </CardHeader>
                            <CardBody>
                                <Row>
                                    <Col md="4">
                                        <FormGroup>
                                            <Label>Basic Salary</Label>
                                            <Input
                                                type="number"
                                                name="basic"
                                                placeholder="Enter basic salary"
                                                value={salaryData.basic}
                                                onChange={(e) => setSalaryData({ ...salaryData, basic: e.target.value })}
                                            />
                                            <p style={{ color: "red" }}>{errors.basic}</p>
                                        </FormGroup>
                                    </Col>
                                    <Col md="4">
                                        <FormGroup>
                                            <Label>HRA</Label>
                                            <Input
                                                type="number"
                                                name="hra"
                                                placeholder="Enter HRA"
                                                value={salaryData.hra}
                                                onChange={(e) => setSalaryData({ ...salaryData, hra: e.target.value })}
                                            />
                                            <p style={{ color: "red" }}>{errors.hra}</p>
                                        </FormGroup>
                                    </Col>
                                    <Col md="4">
                                        <FormGroup>
                                            <Label>DA</Label>
                                            <Input
                                                type="number"
                                                name="da"
                                                placeholder="Enter DA"
                                                value={salaryData.da}
                                                onChange={(e) => setSalaryData({ ...salaryData, da: e.target.value })}
                                            />
                                            <p style={{ color: "red" }}>{errors.da}</p>
                                        </FormGroup>
                                    </Col>
                                    <Col md="4">
                                        <FormGroup>
                                            <Label>TA</Label>
                                            <Input
                                                type="number"
                                                name="ta"
                                                placeholder="Enter TA"
                                                value={salaryData.ta}
                                                onChange={(e) => setSalaryData({ ...salaryData, ta: e.target.value })}
                                            />
                                            <p style={{ color: "red" }}>{errors.ta}</p>
                                        </FormGroup>
                                    </Col>
                                    <Col md="4">
                                        <FormGroup>
                                            <Label>Allowance</Label>
                                            <Input
                                                type="number"
                                                name="allowance"
                                                placeholder="Enter allowance"
                                                value={salaryData.allowance}
                                                onChange={(e) => setSalaryData({ ...salaryData, allowance: e.target.value })}
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md="4">
                                        <FormGroup>
                                            <Label>Others</Label>
                                            <Input
                                                type="number"
                                                name="others"
                                                placeholder="Enter others"
                                                value={salaryData.others}
                                                onChange={(e) => setSalaryData({ ...salaryData, others: e.target.value })}
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md="4">
                                        <FormGroup>
                                            <Label>Gross Pay</Label>
                                            <Input
                                                type="number"
                                                name="grossPay"
                                                placeholder="Enter gross pay"
                                                value={salaryData.grossPay}
                                                onChange={(e) => setSalaryData({ ...salaryData, grossPay: e.target.value })}
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md="4">
                                        <FormGroup>
                                            <Label>PF</Label>
                                            <Input
                                                type="number"
                                                name="pf"
                                                placeholder="Enter PF"
                                                value={salaryData.pf}
                                                onChange={(e) => setSalaryData({ ...salaryData, pf: e.target.value })}
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md="4">
                                        <FormGroup>
                                            <Label>ESI</Label>
                                            <Input
                                                type="number"
                                                name="esi"
                                                placeholder="Enter ESI"
                                                value={salaryData.esi}
                                                onChange={(e) => setSalaryData({ ...salaryData, esi: e.target.value })}
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md="4">
                                        <FormGroup>
                                            <Label>Net Pay</Label>
                                            <Input
                                                type="number"
                                                name="netPay"
                                                placeholder="Enter net pay"
                                                value={salaryData.netPay}
                                                onChange={(e) => setSalaryData({ ...salaryData, netPay: e.target.value })}
                                            />
                                            <p style={{ color: "red" }}>{errors.netPay}</p>
                                        </FormGroup>
                                    </Col>
                                </Row>
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
                                >
                                    Save Salary Details
                                </Button>
                            </CardFooter>
                        </Card>
                    </Col>
                </Row>

                {/* Salary Table */}
                <Row>
                    <Col md="12">
                        <Card>
                            <CardHeader>
                                <CardTitle tag="h3">Salary Records</CardTitle>
                            </CardHeader>
                            <CardBody>
                                <Table striped>
                                    <thead>
                                    <tr>
                                        <th>EMP CODE</th>
                                        <th>BASIC</th>
                                        <th>HRA</th>
                                        <th>DA</th>
                                        <th>TA</th>
                                        <th>ALLOWANCE</th>
                                        <th>OTHERS</th>
                                        <th>Gross Pay</th>
                                        <th>PF</th>
                                        <th>ESI</th>
                                        <th>Net Pay</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    <tr>
                                        <td>EMP0001</td>
                                        <td>5000</td>
                                        <td>1000</td>
                                        <td>0</td>
                                        <td>1560</td>
                                        <td>1000</td>
                                        <td>0</td>
                                        <td>8560</td>
                                        <td>0</td>
                                        <td>0</td>
                                        <td>8560</td>
                                    </tr>
                                    </tbody>
                                </Table>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </div>
        </>
    );
};

export default SalaryMaster;