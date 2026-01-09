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

const SalaryPayment = () => {
    const months = [
        "JAN",
        "FEB",
        "MAR",
        "APR",
        "MAY",
        "JUN",
        "JUL",
        "AUG",
        "SEP",
        "OCT",
        "NOV",
        "DEC",
    ];
    const currentMonth = new Date().toLocaleString("default", { month: "short" }).toUpperCase();
    const currentYear = new Date().getFullYear();

    const initInput = {
        selectedMonth: currentMonth,
        selectedYear: currentYear.toString(),
        selectedEmployee: "",
        salaryDetails: {
            basic: "",
            hra: "",
            da: "",
            ta: "",
            allowance: "",
            others: "",
            pf: "",
            esi: "",
            netPay: "",
            payBranch: "",
            payDate: "",
            paymentBy: "",
        },
    };

    const [formData, setFormData] = React.useState(initInput);
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

        if (!formData.selectedMonth || !months.includes(formData.selectedMonth)) {
            tempErrors.month = "Please select a valid month";
            isValid = false;
        }
        if (!formData.selectedYear.match(/^\d{4}$/)) {
            tempErrors.year = "Please enter a valid year (YYYY)";
            isValid = false;
        }
        if (!formData.selectedEmployee) {
            tempErrors.employee = "Please select an employee";
            isValid = false;
        }
        if (!formData.salaryDetails.basic || isNaN(formData.salaryDetails.basic)) {
            tempErrors.basic = "Basic salary is required and must be numeric";
            isValid = false;
        }
        if (!formData.salaryDetails.netPay || isNaN(formData.salaryDetails.netPay)) {
            tempErrors.netPay = "Net pay is required and must be numeric";
            isValid = false;
        }
        if (!formData.salaryDetails.payDate) {
            tempErrors.payDate = "Payment date is required";
            isValid = false;
        }

        setErrors(tempErrors);
        return isValid;
    };

    const handleSearch = async () => {
        // Mock API call to fetch employee salary details
        console.log("Fetching salary details for:", formData.selectedEmployee);
    };

    const handleSubmit = async () => {
        if (!validateInput()) return;

        try {
            setLoading(true);
            const response = await axios.post("/api/salary/pay", {
                monthYear: `${formData.selectedMonth} - ${formData.selectedYear}`,
                employeeCode: formData.selectedEmployee,
                ...formData.salaryDetails,
            });

            setAlert({
                color: "success",
                message: "Salary paid successfully",
                display: true,
                sweetAlert: true,
                timestamp: new Date().getTime(),
            });

            // Reset form fields
            setFormData({ ...initInput, selectedMonth: currentMonth, selectedYear: currentYear.toString() });

        } catch (error) {
            setAlert({
                color: "danger",
                message: error.response?.data?.error || "Payment failed",
                display: true,
                timestamp: new Date().getTime(),
            });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            salaryDetails: { ...formData.salaryDetails, [name]: value },
        });
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
                                <CardTitle tag="h3">Salary Payment</CardTitle>
                            </CardHeader>
                            <CardBody>
                                <Row>
                                    {/* Search Section */}
                                    <Col md={9}>
                                        <Form>
                                            <Row>
                                                <Col className="pr-1" md="3">
                                                    <Label>Month</Label>
                                                    <Input
                                                        type="select"
                                                        value={formData.selectedMonth}
                                                        onChange={(e) =>
                                                            setFormData({ ...formData, selectedMonth: e.target.value })
                                                        }
                                                    >
                                                        {months.map((month) => (
                                                            <option key={month} value={month}>
                                                                {month}
                                                            </option>
                                                        ))}
                                                    </Input>
                                                    <p style={{ color: "red" }}>{errors.month}</p>
                                                </Col>
                                                <Col className="pr-1" md="3">
                                                    <Label>Year</Label>
                                                    <FormGroup>
                                                        <Input
                                                            type="text"
                                                            placeholder="YYYY"
                                                            value={formData.selectedYear}
                                                            onChange={(e) =>
                                                                setFormData({ ...formData, selectedYear: e.target.value })
                                                            }
                                                        />
                                                        <p style={{ color: "red" }}>{errors.year}</p>
                                                    </FormGroup>
                                                </Col>
                                                <Col className="pr-1" md="3">
                                                    <Label>Select Employee</Label>
                                                    <FormGroup>
                                                        <Input
                                                            type="select"
                                                            value={formData.selectedEmployee}
                                                            onChange={(e) =>
                                                                setFormData({ ...formData, selectedEmployee: e.target.value })
                                                            }
                                                        >
                                                            <option value="">Select Employee</option>
                                                            <option value="EMP001">EMP001 - SAMIM SHAIKH</option>
                                                            <option value="EMP002">EMP002 - SAMIM SHAIKH</option>
                                                            <option value="EMP003">EMP003 - BAPPA SARDAR</option>
                                                        </Input>
                                                        <p style={{ color: "red" }}>{errors.employee}</p>
                                                    </FormGroup>
                                                </Col>
                                            </Row>

                                            <div className="border-t border-green-500 my-4"></div>

                                            {/* Salary Details Section */}
                                            <Row>
                                                {/* Row 1 */}
                                                <Col md="3">
                                                    <FormGroup>
                                                        <Label>Basic</Label>
                                                        <Input
                                                            type="text"
                                                            name="basic"
                                                            value={formData.salaryDetails.basic}
                                                            onChange={handleChange}
                                                        />
                                                        <p style={{ color: "red" }}>{errors.basic}</p>
                                                    </FormGroup>
                                                </Col>

                                                <Col md="3">
                                                    <FormGroup>
                                                        <Label>HRA</Label>
                                                        <Input
                                                            type="text"
                                                            name="hra"
                                                            value={formData.salaryDetails.hra}
                                                            onChange={handleChange}
                                                        />
                                                        <p style={{ color: "red" }}>{errors.hra}</p>
                                                    </FormGroup>
                                                </Col>

                                                <Col md="3">
                                                    <FormGroup>
                                                        <Label>DA</Label>
                                                        <Input
                                                            type="text"
                                                            name="da"
                                                            value={formData.salaryDetails.da}
                                                            onChange={handleChange}
                                                        />
                                                        <p style={{ color: "red" }}>{errors.da}</p>
                                                    </FormGroup>
                                                </Col>

                                                <Col md="3">
                                                    <FormGroup>
                                                        <Label>TA</Label>
                                                        <Input
                                                            type="text"
                                                            name="ta"
                                                            value={formData.salaryDetails.ta}
                                                            onChange={handleChange}
                                                        />
                                                        <p style={{ color: "red" }}>{errors.ta}</p>
                                                    </FormGroup>
                                                </Col>

                                                {/* Row 2 */}
                                                <Col md="3">
                                                    <FormGroup>
                                                        <Label>Allowance</Label>
                                                        <Input
                                                            type="text"
                                                            name="allowance"
                                                            value={formData.salaryDetails.allowance}
                                                            onChange={handleChange}
                                                        />
                                                        <p style={{ color: "red" }}>{errors.allowance}</p>
                                                    </FormGroup>
                                                </Col>

                                                <Col md="3">
                                                    <FormGroup>
                                                        <Label>Others</Label>
                                                        <Input
                                                            type="text"
                                                            name="others"
                                                            value={formData.salaryDetails.others}
                                                            onChange={handleChange}
                                                        />
                                                        <p style={{ color: "red" }}>{errors.others}</p>
                                                    </FormGroup>
                                                </Col>

                                                <Col md="3">
                                                    <FormGroup>
                                                        <Label>PF</Label>
                                                        <Input
                                                            type="text"
                                                            name="pf"
                                                            value={formData.salaryDetails.pf}
                                                            onChange={handleChange}
                                                        />
                                                        <p style={{ color: "red" }}>{errors.pf}</p>
                                                    </FormGroup>
                                                </Col>

                                                <Col md="3">
                                                    <FormGroup>
                                                        <Label>ESI</Label>
                                                        <Input
                                                            type="text"
                                                            name="esi"
                                                            value={formData.salaryDetails.esi}
                                                            onChange={handleChange}
                                                        />
                                                        <p style={{ color: "red" }}>{errors.esi}</p>
                                                    </FormGroup>
                                                </Col>

                                                {/* Row 3 */}
                                                <Col md="3">
                                                    <FormGroup>
                                                        <Label>Net Pay</Label>
                                                        <Input
                                                            type="text"
                                                            name="netPay"
                                                            value={formData.salaryDetails.netPay}
                                                            onChange={handleChange}
                                                        />
                                                        <p style={{ color: "red" }}>{errors.netPay}</p>
                                                    </FormGroup>
                                                </Col>

                                                <Col md="3">
                                                    <FormGroup>
                                                        <Label>Pay Branch</Label>
                                                        <Input
                                                            type="text"
                                                            name="payBranch"
                                                            value={formData.salaryDetails.payBranch}
                                                            onChange={handleChange}
                                                        />
                                                        <p style={{ color: "red" }}>{errors.payBranch}</p>
                                                    </FormGroup>
                                                </Col>

                                                <Col md="3">
                                                    <FormGroup>
                                                        <Label>Pay Date</Label>
                                                        <Input
                                                            type="date"
                                                            name="payDate"
                                                            value={formData.salaryDetails.payDate}
                                                            onChange={handleChange}
                                                        />
                                                        <p style={{ color: "red" }}>{errors.payDate}</p>
                                                    </FormGroup>
                                                </Col>

                                                <Col md="3">
                                                    <FormGroup>
                                                        <Label>Payment By</Label>
                                                        <Input
                                                            type="text"
                                                            name="paymentBy"
                                                            value={formData.salaryDetails.paymentBy}
                                                            onChange={handleChange}
                                                        />
                                                        <p style={{ color: "red" }}>{errors.paymentBy}</p>
                                                    </FormGroup>
                                                </Col>
                                            </Row>

                                        </Form>
                                    </Col>

                                </Row>
                            </CardBody>
                            <CardFooter className="d-flex justify-content-center mt-4">
                                <Button
                                    className="btn-fill"
                                    color="info"
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={loading}
                                >
                                    {loading ? <Spinner size="sm" /> : "PAY SALARY"}
                                </Button>
                            </CardFooter>

                        </Card>
                    </Col>
                </Row>
            </div>
        </>
    );
};

export default SalaryPayment;