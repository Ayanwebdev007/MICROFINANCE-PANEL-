import React from "react";
import {
    Button,
    Card,
    CardHeader,
    CardTitle,
    CardBody,
    FormGroup,
    Form,
    Input,
    Row,
    Col,
    Table,
    Label
} from "reactstrap";
import CstNotification from "../../../components/Notifications";
import ReactBSAlert from "react-bootstrap-sweetalert";
import { useSelector } from "react-redux";

const AddDepartment = () => {
    const initialState = {
        departmentName: "",
    };

    const [formData, setFormData] = React.useState(initialState);
    const [departmentList, setDepartmentList] = React.useState([
        { sno: 1, departmentCode: "101", departmentName: "HR" },
        { sno: 2, departmentCode: "102", departmentName: "Finance" },
    ]);
    const [cstError, setCstError] = React.useState({
        departmentName: '',
    });
    const [alert, setAlert] = React.useState({
        color: 'success',
        message: 'test message',
        autoDismiss: 7,
        place: 'tc',
        display: false,
        sweetAlert: false,
        timestamp: new Date().getTime(),
    });
    const authStatus = useSelector((state) => state.auth.authState);
    const [errors, setErrors] = React.useState({});

    const validateForm = () => {
        let formErrors = {};
        let isValid = true;
        if (!formData.departmentName) {
            formErrors.departmentName = "Department Name is required.";
            isValid = false;
        }
        setCstError(formErrors);
        return isValid;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handleClear = () => {
        setFormData(initialState);
    };

    const handleSubmit = async () => {
        if (validateForm()) {
            // Simulate API call to add department
            const newDepartment = {
                sno: departmentList.length + 1,
                departmentCode: `10${departmentList.length + 1}`,
                departmentName: formData.departmentName,
            };
            setDepartmentList([...departmentList, newDepartment]);
            setFormData(initialState);
            setAlert({
                color: 'success',
                message: 'Department added successfully!',
                autoDismiss: 7,
                place: 'tc',
                display: true,
                sweetAlert: true,
                timestamp: new Date().getTime(),
            });
        }
    };

    return (
        <>
            <div className="rna-container">
                {alert.display && <CstNotification color={alert.color} message={alert.message} autoDismiss={alert.autoDismiss} place={alert.place} timestamp={alert.timestamp} />}
                {alert.sweetAlert && <ReactBSAlert
                    success
                    style={{ display: "block", marginTop: "-100px" }}
                    title="Good job!"
                    onConfirm={() => setAlert({ ...alert, sweetAlert: false })}
                    onCancel={() => setAlert({ ...alert, sweetAlert: false })}
                    confirmBtnBsStyle="success"
                    btnSize=""
                >
                    {alert.message}
                </ReactBSAlert>}
            </div>
            <div className="content">
                <Row>
                    <Col md="12">
                        <Card>
                            <CardHeader>
                                <CardTitle tag="h3">Add Department</CardTitle>
                            </CardHeader>
                            <CardBody>
                                <Form>
                                    <Row>
                                        {/* Search Input */}
                                        <Col md="6">
                                            <FormGroup>
                                                <Label>Search Department</Label>
                                                <Input
                                                    type="text"
                                                    placeholder="Search department..."
                                                />
                                            </FormGroup>
                                        </Col>

                                        {/* Buttons */}
                                        <Col md="6" className="d-flex align-items-end">
                                            <Button className="btn-fill" color="info" type="button" onClick={handleSubmit}>
                                                Add
                                            </Button>
                                            <Button className="btn-fill ml-2" color="secondary" type="button" onClick={handleClear}>
                                                Clear
                                            </Button>
                                        </Col>
                                    </Row>
                                </Form>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>

                {/* Department List Section */}
                <Row>
                    <Col md="12">
                        <Card>
                            <CardHeader>
                                <CardTitle tag="h3">Department List</CardTitle>
                            </CardHeader>
                            <CardBody>
                                <Table responsive>
                                    <thead>
                                    <tr>
                                        <th>SNo</th>
                                        <th>Department Code</th>
                                        <th>Department Name</th>
                                        <th>Action</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {departmentList.map((department) => (
                                        <tr key={department.sno}>
                                            <td>{department.sno}</td>
                                            <td>{department.departmentCode}</td>
                                            <td>{department.departmentName}</td>
                                            <td>
                                                <Button color="primary" size="sm">
                                                    ➡
                                                </Button>
                                            </td>
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

export default AddDepartment;