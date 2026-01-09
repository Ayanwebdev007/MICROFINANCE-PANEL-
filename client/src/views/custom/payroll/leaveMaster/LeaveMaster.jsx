import React, { useState } from "react";
import {
    Button,
    Card,
    CardHeader,
    CardBody,
    CardFooter,
    CardTitle,
    FormGroup,
    Form,
    Input,
    Row,
    Col,
    Table,
} from "reactstrap";
import axios from "axios";

const LeaveMaster = () => {
    const [leaveData, setLeaveData] = useState({
        empCode: "",
        financialYear: "",
        cl: "",
        sl: "",
        el: "",
    });

    const [leaveList, setLeaveList] = useState([
        { empCode: "EMP0001", fYear: "2024-2025", cl: 0, sl: 0, el: 0 },
    ]);

    const handleChange = (e) => {
        setLeaveData({ ...leaveData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async () => {
        try {
            const response = await axios.post("/api/leave/add", leaveData);
            console.log("Leave Added Successfully", response.data);
        } catch (error) {
            console.error("Error adding leave data:", error);
        }
    };

    return (
        <div className="content">
            {/* Search Details */}
            <Row>
                <Col md="12">
                    <Card>
                        <CardHeader>
                            <CardTitle tag="h3">Search Details</CardTitle>
                        </CardHeader>
                        <CardBody>
                            <Form>
                                <Row>
                                    <Col md="4">
                                        <FormGroup>
                                            <Input
                                                type="select"
                                                name="empCode"
                                                value={leaveData.empCode}
                                                onChange={handleChange}
                                            >
                                                <option value="">Select by Code</option>
                                                <option value="EMP001">EMP001</option>
                                            </Input>
                                        </FormGroup>
                                    </Col>
                                    <Col md="4">
                                        <FormGroup>
                                            <Input
                                                type="text"
                                                name="financialYear"
                                                placeholder="Financial Year"
                                                value={leaveData.financialYear}
                                                onChange={handleChange}
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md="4">
                                        <Button color="warning">Search</Button>
                                    </Col>
                                </Row>
                            </Form>
                        </CardBody>
                    </Card>
                </Col>
            </Row>

            {/* Employee Leave Details */}
            <Row>
                <Col md="12">
                    <Card>
                        <CardHeader>
                            <CardTitle tag="h3">Employee Leave Details</CardTitle>
                        </CardHeader>
                        <CardBody>
                            <Form>
                                <Row>
                                    {['cl', 'sl', 'el'].map((field) => (
                                        <Col md="4" key={field}>
                                            <FormGroup>
                                                <Input
                                                    type="text"
                                                    name={field}
                                                    placeholder={`Enter ${field.toUpperCase()}`}
                                                    value={leaveData[field]}
                                                    onChange={handleChange}
                                                />
                                            </FormGroup>
                                        </Col>
                                    ))}
                                    <Col md="4">
                                        <Button color="warning" onClick={handleSubmit}>Save</Button>
                                    </Col>
                                </Row>
                            </Form>
                        </CardBody>
                    </Card>
                </Col>
            </Row>

            {/* Leave Details Table */}
            <Row>
                <Col md="12">
                    <Card>
                        <CardHeader>
                            <CardTitle tag="h3">Leave Details</CardTitle>
                        </CardHeader>
                        <CardBody>
                            <Table bordered>
                                <thead>
                                <tr>
                                    <th>EMP CODE</th>
                                    <th>FYear</th>
                                    <th>CL</th>
                                    <th>SL</th>
                                    <th>EL</th>
                                </tr>
                                </thead>
                                <tbody>
                                {leaveList.map((data, index) => (
                                    <tr key={index}>
                                        <td>{data.empCode}</td>
                                        <td>{data.fYear}</td>
                                        <td>{data.cl}</td>
                                        <td>{data.sl}</td>
                                        <td>{data.el}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </Table>
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default LeaveMaster;
