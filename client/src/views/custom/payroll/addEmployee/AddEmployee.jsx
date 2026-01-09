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
import ProfileImageUpload from "../../components/ProfileImageUpload";
import CstNotification from "../../components/CstNotification";
import ReactBSAlert from "react-bootstrap-sweetalert";
import axios from "axios";
import { useSelector } from "react-redux";

const AddEmployeeM = () => {
    const initInput = {
        empType: "New",
        joiningDate: new Date().toISOString().slice(0, 10),
        branchName: "",
        empName: "",
        dob: "",
        relativeName: "",
        relativeRelation: "",
        mobileNo: "",
        empStatus: true,
        email: "",
        address: "",
        pan: "",
        bankAc: "",
        ifscCode: "",
        designation: "",
        department: "",
        degree: "",
        college: "",
        yearOfPass: "",
        grade: "",
        companyName: "",
        post: "",
        totalExp: "",
        salary: "",
        uuid: crypto.randomUUID(),
    };

    const [employeeData, setEmployeeData] = React.useState(initInput);
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

        // Employee Details Validation
        if (!employeeData.empName) {
            tempErrors.empName = "Employee name is required";
            isValid = false;
        }
        if (!employeeData.mobileNo || employeeData.mobileNo.length !== 10) {
            tempErrors.mobileNo = "Valid 10-digit mobile number required";
            isValid = false;
        }
        if (!employeeData.joiningDate) {
            tempErrors.joiningDate = "Joining date is required";
            isValid = false;
        }
        if (!employeeData.branchName) {
            tempErrors.branchName = "Branch name is required";
            isValid = false;
        }
        if (!employeeData.designation) {
            tempErrors.designation = "Designation is required";
            isValid = false;
        }
        if (!employeeData.department) {
            tempErrors.department = "Department is required";
            isValid = false;
        }

        // Experience Details Validation
        if (!employeeData.salary) {
            tempErrors.salary = "Salary information is required";
            isValid = false;
        }

        setErrors(tempErrors);
        return isValid;
    };

    const handleSubmit = async () => {
        if (validateInput()) {
            try {
                setLoading(true);
                const response = await axios.post("/api/employee/add", employeeData);

                setAlert({
                    color: "success",
                    message: "Employee added successfully",
                    display: true,
                    sweetAlert: true,
                    timestamp: new Date().getTime(),
                });

                setEmployeeData({ ...initInput, uuid: crypto.randomUUID() });

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
                {/* Employee Details Section */}
                <Row>
                    <Col md="12">
                        <Card>
                            <CardHeader>
                                <CardTitle tag="h3">Employee Details</CardTitle>
                            </CardHeader>
                            <CardBody>
                                <Row>
                                    <Col md={9}>
                                        <Form>
                                            <Row>
                                                <Col className="pr-1" md="4">
                                                    <Label>Employee Type</Label>
                                                    <Input
                                                        type="select"
                                                        name="empType"
                                                        value={employeeData.empType}
                                                        onChange={(e) => setEmployeeData({ ...employeeData, empType: e.target.value })}
                                                    >
                                                        <option value="New">New</option>
                                                        <option value="Existing">Existing</option>
                                                    </Input>
                                                </Col>
                                                <Col className="pr-1" md="4">
                                                    <Label>Joining Date</Label>
                                                    <FormGroup>
                                                        <Input
                                                            type="date"
                                                            name="joiningDate"
                                                            value={employeeData.joiningDate}
                                                            onChange={(e) => setEmployeeData({ ...employeeData, joiningDate: e.target.value })}
                                                        />
                                                        <p style={{ color: "red" }}>{errors.joiningDate}</p>
                                                    </FormGroup>
                                                </Col>
                                                <Col className="pr-1" md="4">
                                                    <Label>Branch Name</Label>
                                                    <FormGroup>
                                                        <Input
                                                            type="text"
                                                            name="branchName"
                                                            value={employeeData.branchName}
                                                            onChange={(e) => setEmployeeData({ ...employeeData, branchName: e.target.value })}
                                                        />
                                                        <p style={{ color: "red" }}>{errors.branchName}</p>
                                                    </FormGroup>
                                                </Col>
                                                <Col className="pr-1" md="4">
                                                    <Label>Employee Name</Label>
                                                    <FormGroup>
                                                        <Input
                                                            type="text"
                                                            name="empName"
                                                            value={employeeData.empName}
                                                            onChange={(e) => setEmployeeData({ ...employeeData, empName: e.target.value })}
                                                        />
                                                        <p style={{ color: "red" }}>{errors.empName}</p>
                                                    </FormGroup>
                                                </Col>
                                                <Col className="pr-1" md="4">
                                                    <Label>Date of Birth</Label>
                                                    <FormGroup>
                                                        <Input
                                                            type="date"
                                                            name="dob"
                                                            value={employeeData.dob}
                                                            onChange={(e) => setEmployeeData({ ...employeeData, dob: e.target.value })}
                                                        />
                                                    </FormGroup>
                                                </Col>
                                                <Col className="pr-1" md="4">
                                                    <Label>Relative Name</Label>
                                                    <FormGroup>
                                                        <Input
                                                            type="text"
                                                            name="relativeName"
                                                            value={employeeData.relativeName}
                                                            onChange={(e) => setEmployeeData({ ...employeeData, relativeName: e.target.value })}
                                                        />
                                                    </FormGroup>
                                                </Col>
                                                <Col className="pr-1" md="4">
                                                    <Label>Relative Relation</Label>
                                                    <FormGroup>
                                                        <Input
                                                            type="text"
                                                            name="relativeRelation"
                                                            value={employeeData.relativeRelation}
                                                            onChange={(e) => setEmployeeData({ ...employeeData, relativeRelation: e.target.value })}
                                                        />
                                                    </FormGroup>
                                                </Col>
                                                <Col className="pr-1" md="4">
                                                    <Label>Mobile Number</Label>
                                                    <FormGroup>
                                                        <Input
                                                            type="text"
                                                            name="mobileNo"
                                                            value={employeeData.mobileNo}
                                                            onChange={(e) => setEmployeeData({ ...employeeData, mobileNo: e.target.value })}
                                                        />
                                                        <p style={{ color: "red" }}>{errors.mobileNo}</p>
                                                    </FormGroup>
                                                </Col>
                                                <Col className="pr-1" md="4">
                                                    <Label>Email</Label>
                                                    <FormGroup>
                                                        <Input
                                                            type="email"
                                                            name="email"
                                                            value={employeeData.email}
                                                            onChange={(e) => setEmployeeData({ ...employeeData, email: e.target.value })}
                                                        />
                                                    </FormGroup>
                                                </Col>
                                                <Col className="pr-1" md="4">
                                                    <Label>Address</Label>
                                                    <FormGroup>
                                                        <Input
                                                            type="textarea"
                                                            name="address"
                                                            value={employeeData.address}
                                                            onChange={(e) => setEmployeeData({ ...employeeData, address: e.target.value })}
                                                        />
                                                    </FormGroup>
                                                </Col>
                                                <Col className="pr-1" md="4">
                                                    <Label>PAN Number</Label>
                                                    <FormGroup>
                                                        <Input
                                                            type="text"
                                                            name="pan"
                                                            value={employeeData.pan}
                                                            onChange={(e) => setEmployeeData({ ...employeeData, pan: e.target.value })}
                                                        />
                                                    </FormGroup>
                                                </Col>
                                                <Col className="pr-1" md="4">
                                                    <Label>Bank Account</Label>
                                                    <FormGroup>
                                                        <Input
                                                            type="text"
                                                            name="bankAc"
                                                            value={employeeData.bankAc}
                                                            onChange={(e) => setEmployeeData({ ...employeeData, bankAc: e.target.value })}
                                                        />
                                                    </FormGroup>
                                                </Col>
                                                <Col className="pr-1" md="4">
                                                    <Label>IFSC Code</Label>
                                                    <FormGroup>
                                                        <Input
                                                            type="text"
                                                            name="ifscCode"
                                                            value={employeeData.ifscCode}
                                                            onChange={(e) => setEmployeeData({ ...employeeData, ifscCode: e.target.value })}
                                                        />
                                                    </FormGroup>
                                                </Col>
                                                <Col className="pr-1" md="4">
                                                    <Label>Designation</Label>
                                                    <FormGroup>
                                                        <Input
                                                            type="text"
                                                            name="designation"
                                                            value={employeeData.designation}
                                                            onChange={(e) => setEmployeeData({ ...employeeData, designation: e.target.value })}
                                                        />
                                                        <p style={{ color: "red" }}>{errors.designation}</p>
                                                    </FormGroup>
                                                </Col>
                                                <Col className="pr-1" md="4">
                                                    <Label>Department</Label>
                                                    <FormGroup>
                                                        <Input
                                                            type="text"
                                                            name="department"
                                                            value={employeeData.department}
                                                            onChange={(e) => setEmployeeData({ ...employeeData, department: e.target.value })}
                                                        />
                                                        <p style={{ color: "red" }}>{errors.department}</p>
                                                    </FormGroup>
                                                </Col>
                                            </Row>
                                        </Form>
                                    </Col>
                                    <Col md={3} className="mt-auto mb-auto">
                                        <ProfileImageUpload
                                            id="profile"
                                            uuid={employeeData.uuid}
                                            bankId={authStatus.bankId}
                                            changeBtnClasses="btn-simple"
                                            addBtnClasses="btn-simple"
                                            removeBtnClasses="btn-simple"
                                        />
                                    </Col>
                                </Row>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>

                {/* Qualification Details Section */}
                <Row>
                    <Col md="12">
                        <Card>
                            <CardHeader>
                                <CardTitle tag="h3">Qualification Details</CardTitle>
                            </CardHeader>
                            <CardBody>
                                <Form>
                                    <Row>
                                        <Col className="pr-1" md="4">
                                            <Label>Degree</Label>
                                            <FormGroup>
                                                <Input
                                                    type="text"
                                                    name="degree"
                                                    value={employeeData.degree}
                                                    onChange={(e) => setEmployeeData({ ...employeeData, degree: e.target.value })}
                                                />
                                            </FormGroup>
                                        </Col>
                                        <Col className="pr-1" md="4">
                                            <Label>College</Label>
                                            <FormGroup>
                                                <Input
                                                    type="text"
                                                    name="college"
                                                    value={employeeData.college}
                                                    onChange={(e) => setEmployeeData({ ...employeeData, college: e.target.value })}
                                                />
                                            </FormGroup>
                                        </Col>
                                        <Col className="pr-1" md="4">
                                            <Label>Year of Passing</Label>
                                            <FormGroup>
                                                <Input
                                                    type="number"
                                                    name="yearOfPass"
                                                    value={employeeData.yearOfPass}
                                                    onChange={(e) => setEmployeeData({ ...employeeData, yearOfPass: e.target.value })}
                                                />
                                            </FormGroup>
                                        </Col>
                                        <Col className="pr-1" md="4">
                                            <Label>Grade/Percentage</Label>
                                            <FormGroup>
                                                <Input
                                                    type="text"
                                                    name="grade"
                                                    value={employeeData.grade}
                                                    onChange={(e) => setEmployeeData({ ...employeeData, grade: e.target.value })}
                                                />
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                </Form>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>

                {/* Experience Details Section */}
                <Row>
                    <Col md="12">
                        <Card>
                            <CardHeader>
                                <CardTitle tag="h3">Experience Details</CardTitle>
                            </CardHeader>
                            <CardBody>
                                <Form>
                                    <Row>
                                        <Col className="pr-1" md="4">
                                            <Label>Previous Company</Label>
                                            <FormGroup>
                                                <Input
                                                    type="text"
                                                    name="companyName"
                                                    value={employeeData.companyName}
                                                    onChange={(e) => setEmployeeData({ ...employeeData, companyName: e.target.value })}
                                                />
                                            </FormGroup>
                                        </Col>
                                        <Col className="pr-1" md="4">
                                            <Label>Previous Post</Label>
                                            <FormGroup>
                                                <Input
                                                    type="text"
                                                    name="post"
                                                    value={employeeData.post}
                                                    onChange={(e) => setEmployeeData({ ...employeeData, post: e.target.value })}
                                                />
                                            </FormGroup>
                                        </Col>
                                        <Col className="pr-1" md="4">
                                            <Label>Total Experience</Label>
                                            <FormGroup>
                                                <Input
                                                    type="text"
                                                    name="totalExp"
                                                    value={employeeData.totalExp}
                                                    onChange={(e) => setEmployeeData({ ...employeeData, totalExp: e.target.value })}
                                                />
                                            </FormGroup>
                                        </Col>
                                        <Col className="pr-1" md="4">
                                            <Label>Salary</Label>
                                            <FormGroup>
                                                <Input
                                                    type="number"
                                                    name="salary"
                                                    value={employeeData.salary}
                                                    onChange={(e) => setEmployeeData({ ...employeeData, salary: e.target.value })}
                                                />
                                                <p style={{ color: "red" }}>{errors.salary}</p>
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                </Form>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>

                {/* Action Footer */}
                <Row>
                    <Col md="12" className="text-center">
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
                                Add Employee
                            </Button>
                        </CardFooter>
                    </Col>
                </Row>
            </div>
        </>
    );
};

export default AddEmployeeM;