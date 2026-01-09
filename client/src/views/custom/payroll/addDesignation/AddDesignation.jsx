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
import axios from "axios";
import CstNotification from "../../../components/Notifications";
import ReactBSAlert from "react-bootstrap-sweetalert";
import { useSelector } from "react-redux";


const AddDesignation = () => {
    const initialState = {
        designationName: "",
    };

    const [formData, setFormData] = React.useState(initialState);
    const [designationList, setDesignationList] = React.useState([
        { sno: 1, designationCode: "101", designationName: "Manager" },
        { sno: 2, designationCode: "102", designationName: "Field Officer" },
    ]);
    const [cstError, setCstError] = React.useState({
        designationName: '',
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
        if (!formData.designationName) {
            formErrors.designationName = "Designation Name is required.";
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
            // Simulate API call to add designation
            const newDesignation = {
                sno: designationList.length + 1,
                designationCode: `10${designationList.length + 1}`,
                designationName: formData.designationName,
            };
            setDesignationList([...designationList, newDesignation]);
            setFormData(initialState);
            setAlert({
                color: 'success',
                message: 'Designation added successfully!',
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
                                <CardTitle tag="h3">Add Designation</CardTitle>
                            </CardHeader>
                            <CardBody>
                                <Form>
                                    <Row>
                                        <Col md="6">
                                            <FormGroup>
                                                <Label>Designation Name*</Label>
                                                <Input
                                                    type="text"
                                                    name="designationName"
                                                    value={formData.designationName}
                                                    onChange={handleInputChange}
                                                />
                                                <p style={{ color: 'red' }}>{cstError.designationName}</p>
                                            </FormGroup>
                                        </Col>
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

                {/* Designation List Section */}
                <Row>
                    <Col md="12">
                        <Card>
                            <CardHeader>
                                <CardTitle tag="h3">Designation List</CardTitle>
                            </CardHeader>
                            <CardBody>
                                <Table responsive>
                                    <thead>
                                    <tr>
                                        <th>SNo</th>
                                        <th>Designation Code</th>
                                        <th>Designation Name</th>
                                        <th>Action</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {designationList.map((designation) => (
                                        <tr key={designation.sno}>
                                            <td>{designation.sno}</td>
                                            <td>{designation.designationCode}</td>
                                            <td>{designation.designationName}</td>
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

export default AddDesignation;