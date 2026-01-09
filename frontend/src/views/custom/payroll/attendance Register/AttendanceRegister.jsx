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
    Table,
    CardFooter
} from "reactstrap";
import CstNotification from "../../components/CstNotification";
import ReactBSAlert from "react-bootstrap-sweetalert";
import axios from "axios";
import { useSelector } from "react-redux";

const AttendanceRegister = () => {
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

    const [selectedMonth, setSelectedMonth] = React.useState(currentMonth);
    const [selectedYear, setSelectedYear] = React.useState(currentYear.toString());
    const [selectedEmployee, setSelectedEmployee] = React.useState("");
    const [attendanceRecords, setAttendanceRecords] = React.useState([]);
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
    const authStatus = useSelector((state) => state.auth.authState);

    const validateInput = () => {
        const tempErrors = {};
        let isValid = true;

        if (!selectedMonth || !months.includes(selectedMonth)) {
            tempErrors.month = "Please select a valid month";
            isValid = false;
        }
        if (!selectedYear.match(/^\d{4}$/)) {
            tempErrors.year = "Please enter a valid year (YYYY)";
            isValid = false;
        }
        if (!selectedEmployee) {
            tempErrors.employee = "Please select an employee";
            isValid = false;
        }

        setErrors(tempErrors);
        return isValid;
    };

    const handleMonthChange = (direction) => {
        const currentIndex = months.indexOf(selectedMonth);
        const newMonthIndex = (currentIndex + direction + 12) % 12;
        const newMonth = months[newMonthIndex];

        let newYear = parseInt(selectedYear);
        if (direction === 1 && currentIndex === 11) newYear += 1;
        if (direction === -1 && currentIndex === 0) newYear -= 1;

        setSelectedMonth(newMonth);
        setSelectedYear(newYear.toString());
    };

    const handleEmployeeChange = (e) => {
        setSelectedEmployee(e.target.value);
    };

    const handleAttendanceChange = (empIndex, dayIndex, value) => {
        const updatedRecords = [...attendanceRecords];
        updatedRecords[empIndex].days[dayIndex] = value;
        setAttendanceRecords(updatedRecords);
    };

    const handleSubmit = async () => {
        if (!validateInput()) return;

        try {
            setLoading(true);
            const response = await axios.post("/api/attendance/submit", {
                monthYear: `${selectedMonth} - ${selectedYear}`,
                employeeCode: selectedEmployee,
                attendance: attendanceRecords,
            });

            setAlert({
                color: "success",
                message: "Attendance submitted successfully",
                display: true,
                sweetAlert: true,
                timestamp: new Date().getTime(),
            });

            setSelectedEmployee("");
            setAttendanceRecords([]);

        } catch (error) {
            setAlert({
                color: "danger",
                message: error.response?.data?.error || "Submission failed",
                display: true,
                timestamp: new Date().getTime(),
            });
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        if (selectedEmployee) {
            // Mock API response for demonstration
            setTimeout(() => {
                setAttendanceRecords([
                    {
                        empCode: selectedEmployee,
                        empName: "SAMIM SHAIKH",
                        days: Array(31).fill("-"),
                    },
                ]);
            }, 500);
        }
    }, [selectedEmployee]);

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
                                <CardTitle tag="h3">Attendance Search</CardTitle>
                            </CardHeader>
                            <CardBody>
                                <Form>
                                    <Row className="mb-3">
                                        {/* Month Dropdown */}
                                        <Col md="2">
                                            <FormGroup>
                                                <Label>Month</Label>
                                                <Input
                                                    type="select"
                                                    value={selectedMonth}
                                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                                >
                                                    {months.map((month) => (
                                                        <option key={month} value={month}>
                                                            {month}
                                                        </option>
                                                    ))}
                                                </Input>
                                                <p style={{ color: "red" }}>{errors.month}</p>
                                            </FormGroup>
                                        </Col>

                                        {/* Year Input */}
                                        <Col md="2">
                                            <FormGroup>
                                                <Label>Year</Label>
                                                <Input
                                                    type="text"
                                                    placeholder="YYYY"
                                                    value={selectedYear}
                                                    onChange={(e) => setSelectedYear(e.target.value)}
                                                />
                                                <p style={{ color: "red" }}>{errors.year}</p>
                                            </FormGroup>
                                        </Col>

                                        {/* Navigation Buttons */}
                                        <Col md="3" className="d-flex align-items-end">
                                            <Button
                                                className="btn-fill"
                                                color="warning"
                                                onClick={() => handleMonthChange(-1)}
                                                disabled={loading}
                                            >
                                                Previous Month
                                            </Button>
                                            <Button
                                                className="btn-fill ml-2"
                                                color="warning"
                                                onClick={() => handleMonthChange(1)}
                                                disabled={loading}
                                            >
                                                Next Month
                                            </Button>
                                        </Col>

                                        {/* Employee Selection */}
                                        <Col md="3">
                                            <FormGroup>
                                                <Label>Employee Code</Label>
                                                <Input
                                                    type="select"
                                                    name="employee"
                                                    value={selectedEmployee}
                                                    onChange={handleEmployeeChange}
                                                >
                                                    <option value="">Select Employee</option>
                                                    <option value="EMP001">EMP001 - SAMIM SHAIKH</option>
                                                    <option value="EMP002">EMP002 - SAMIM SHAIKH</option>
                                                    <option value="EMP003">EMP003 - BAPPA SARDAR</option>
                                                </Input>
                                                <p style={{ color: "red" }}>{errors.employee}</p>
                                            </FormGroup>
                                        </Col>

                                        {/* Submit Button */}
                                        <Col md="2" className="d-flex align-items-end">
                                            <Button
                                                className="btn-fill"
                                                color="info"
                                                onClick={handleSubmit}
                                                disabled={loading || !selectedEmployee}
                                            >
                                                {loading ? <Spinner size="sm" /> : "SUBMIT ATTENDANCE"}
                                            </Button>
                                        </Col>
                                    </Row>
                                </Form>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>

                {/* Attendance Table Section */}
                <Row>
                    <Col md="12">
                        <Card>
                            <CardHeader>
                                <CardTitle tag="h3">
                                    Attendance Register - {`${selectedMonth} - ${selectedYear}`}
                                </CardTitle>
                            </CardHeader>
                            <CardBody>
                                <Table bordered striped>
                                    <thead>
                                    <tr>
                                        <th>EmpCode</th>
                                        <th>EmpName</th>
                                        {Array.from({ length: 31 }, (_, i) => (
                                            <th key={i}>{(i + 1).toString().padStart(2, "0")}</th>
                                        ))}
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {attendanceRecords.map((record, empIdx) => (
                                        <tr key={empIdx}>
                                            <td>{record.empCode}</td>
                                            <td>{record.empName}</td>
                                            {record.days.map((status, dayIdx) => (
                                                <td key={dayIdx}>
                                                    <Input
                                                        type="select"
                                                        value={status}
                                                        onChange={(e) =>
                                                            handleAttendanceChange(empIdx, dayIdx, e.target.value)
                                                        }
                                                        style={{ minWidth: "80px" }}
                                                    >
                                                        <option value="-">-</option>
                                                        <option value="P">Present</option>
                                                        <option value="A">Absent</option>
                                                        <option value="CL">CL</option>
                                                        <option value="SL">SL</option>
                                                        <option value="EL">EL</option>
                                                        <option value="HD">HD</option>
                                                    </Input>
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                    </tbody>
                                </Table>
                            </CardBody>
                            <CardFooter>
                                <center>
                                    <Spinner color="info" hidden={!loading} />
                                </center>
                            </CardFooter>
                        </Card>
                    </Col>
                </Row>
            </div>
        </>
    );
};

export default AttendanceRegister;