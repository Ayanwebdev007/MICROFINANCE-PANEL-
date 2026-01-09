import React, { useState } from "react";
import {
    Button,
    Card,
    CardHeader,
    CardBody,
    CardFooter,
    Label,
    FormGroup,
    Input,
    Row,
    Col,
    Spinner,
} from "reactstrap";

import CstNotification from "../../components/CstNotification";
import axios from "axios";

const SalarySlip = () => {
    const months = [
        "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
        "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"
    ];

    const [formData, setFormData] = useState({
        selectedMonth: new Date().toLocaleString("default", { month: "short" }).toUpperCase(),
        selectedYear: new Date().getFullYear().toString(),
        selectedEmployee: "",
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const validateInput = () => {
        const tempErrors = {};
        let isValid = true;

        if (!formData.selectedEmployee) {
            tempErrors.employee = "Please select an employee";
            isValid = false;
        }
        if (!formData.selectedMonth || !months.includes(formData.selectedMonth)) {
            tempErrors.month = "Please select a valid month";
            isValid = false;
        }
        if (!formData.selectedYear.match(/^\d{4}$/)) {
            tempErrors.year = "Please enter a valid year (YYYY)";
            isValid = false;
        }

        setErrors(tempErrors);
        return isValid;
    };

    const handleSubmit = async () => {
        if (!validateInput()) return;

        try {
            setLoading(true);
            await axios.post("/api/salary/pay", {
                monthYear: `${formData.selectedMonth} - ${formData.selectedYear}`,
                selectedEmployee: formData.selectedEmployee
            });
            alert("Salary processed successfully");
        } catch (error) {
            alert(error.response?.data?.error || "Payment failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="content">
            <Card className="shadow p-4">
                <CardHeader>
                    <h3 className="font-bold text-2xl">Salary Slip Print</h3>
                </CardHeader>

                <CardBody>
                    <Row className="mb-4">
                        <Col md="3">
                            <Label>Month</Label>
                            <Input
                                type="select"
                                value={formData.selectedMonth}
                                onChange={(e) => setFormData({...formData, selectedMonth: e.target.value})}
                            >
                                {months.map((month) => (
                                    <option key={month} value={month}>
                                        {month}
                                    </option>
                                ))}
                            </Input>
                            <p style={{color: "red"}}>{errors.month}</p>
                        </Col>

                        <Col md="3">
                            <Label>Year</Label>
                            <Input
                                type="text"
                                value={formData.selectedYear}
                                onChange={(e) => setFormData({...formData, selectedYear: e.target.value})}
                                placeholder="YYYY"
                            />
                            <p style={{color: "red"}}>{errors.year}</p>
                        </Col>

                        <Col md="2" className="d-flex align-items-end">
                            <Button color="warning">Previous Month</Button>
                        </Col>

                        <Col md="2" className="d-flex align-items-end">
                            <Button color="warning">Next Month</Button>
                        </Col>

                        <Col md="4">
                            <Label>Select Employee</Label>
                            <Input
                                type="select"
                                value={formData.selectedEmployee}
                                onChange={(e) => setFormData({...formData, selectedEmployee: e.target.value})}
                            >
                                <option value="">Select Employee</option>
                                <option value="EMP001">EMP001 - Samim Shaikh</option>
                                <option value="EMP002">EMP002 - Bappa Sardar</option>
                            </Input>
                            <p style={{color: "red"}}>{errors.employee}</p>
                        </Col>
                        <Col md="2" className="d-flex align-items-end">
                            <Button color="success" onClick={handleSubmit} disabled={loading}>
                                {loading ? <Spinner size="sm"/> : <> SEARCH</>}
                            </Button>
                        </Col>

                    </Row>

                </CardBody>

                <div className="border-t border-green-500 my-4"></div>

                <CardFooter>
                    <h4>Search Result</h4>
                </CardFooter>
            </Card>
        </div>
    );
};


export default SalarySlip;
