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
} from "reactstrap";
import CstNotification from "../../components/CstNotification";
import ReactBSAlert from "react-bootstrap-sweetalert";
import axios from "axios";

const HolidayMaster = () => {
    const [monthYear, setMonthYear] = React.useState(new Date().toLocaleString('default', { month: 'short' }).toUpperCase() + " - " + new Date().getFullYear());
    const [holidays, setHolidays] = React.useState([]);
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

        if (!/^[A-Z]{3} - \d{4}$/.test(monthYear)) {
            tempErrors.monthYear = "Format should be MMM - YYYY (e.g., JAN - 2024)";
            isValid = false;
        }

        setErrors(tempErrors);
        return isValid;
    };

    const handleSearch = async () => {
        if (!validateInput()) return;

        try {
            setLoading(true);
            const response = await axios.get(`/api/holiday/search`, {
                params: { monthYear: monthYear.replace(' - ', '-') }
            });
            setHolidays(response.data.holidays || []);
            setAlert({
                color: "success",
                message: "Holidays loaded successfully",
                display: true,
                timestamp: new Date().getTime(),
            });
        } catch (error) {
            setAlert({
                color: "danger",
                message: error.response?.data?.error || "Failed to load holidays",
                display: true,
                timestamp: new Date().getTime(),
            });
        } finally {
            setLoading(false);
        }
    };

    const handlePrevMonth = () => {
        const [month, year] = monthYear.split(' - ');
        const date = new Date(`${month} 15, ${year}`);
        date.setMonth(date.getMonth() - 1);
        const newMonth = date.toLocaleString('default', { month: 'short' }).toUpperCase();
        setMonthYear(`${newMonth} - ${date.getFullYear()}`);
    };

    const handleNextMonth = () => {
        const [month, year] = monthYear.split(' - ');
        const date = new Date(`${month} 15, ${year}`);
        date.setMonth(date.getMonth() + 1);
        const newMonth = date.toLocaleString('default', { month: 'short' }).toUpperCase();
        setMonthYear(`${newMonth} - ${date.getFullYear()}`);
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
            </div>

            <div className="content">
                {/* Search Section */}
                <Row>
                    <Col md="12">
                        <Card>
                            <CardHeader>
                                <CardTitle tag="h3">Holiday Search</CardTitle>
                            </CardHeader>
                            <CardBody>
                                <Form>
                                    <Row>
                                        <Col md="4">
                                            <FormGroup>
                                                <Label>Month-Year (MMM - YYYY)</Label>
                                                <Input
                                                    type="text"
                                                    placeholder="Enter month-year"
                                                    value={monthYear}
                                                    onChange={(e) => setMonthYear(e.target.value)}
                                                />
                                                <p style={{ color: "red" }}>{errors.monthYear}</p>
                                            </FormGroup>
                                        </Col>
                                        <Col md="2" className="d-flex align-items-end">
                                            <Button
                                                className="btn-fill"
                                                color="warning"
                                                onClick={handlePrevMonth}
                                                disabled={loading}
                                            >
                                                Previous Month
                                            </Button>
                                        </Col>
                                        <Col md="2" className="d-flex align-items-end">
                                            <Button
                                                className="btn-fill"
                                                color="warning"
                                                onClick={handleNextMonth}
                                                disabled={loading}
                                            >
                                                Next Month
                                            </Button>
                                        </Col>
                                        <Col md="2" className="d-flex align-items-end">
                                            <Button
                                                className="btn-fill"
                                                color="info"
                                                onClick={handleSearch}
                                                disabled={loading}
                                            >
                                                {loading ? <Spinner size="sm" /> : "SEARCH"}
                                            </Button>
                                        </Col>
                                    </Row>
                                </Form>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>

                {/* Holiday List Section */}
                <Row>
                    <Col md="12">
                        <Card>
                            <CardHeader>
                                <CardTitle tag="h3">Holidays for {monthYear}</CardTitle>
                            </CardHeader>
                            <CardBody>
                                <Table striped>
                                    <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Day</th>
                                        <th>Holiday Name</th>
                                        <th>Type</th>
                                        <th>Description</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {holidays.map((holiday) => (
                                        <tr key={holiday.date}>
                                            <td>{holiday.date}</td>
                                            <td>{holiday.day}</td>
                                            <td>{holiday.name}</td>
                                            <td>{holiday.type}</td>
                                            <td>{holiday.description}</td>
                                        </tr>
                                    ))}
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

export default HolidayMaster;