
import React, { useState, useEffect } from "react";
import {
    Card,
    CardHeader,
    CardTitle,
    CardBody,
    CardFooter,
    Button,
    Input,
    Label,
    Row,
    Col,
    FormGroup,
    Spinner,
    Table,

} from "reactstrap";
import axios from "axios";
import CstNotification from "../../components/CstNotification";
import ReactBSAlert from "react-bootstrap-sweetalert";

const AddSavingScheme = () => {
    const initialFormData = {
        schemeName: "",
        schemeCode: "",
        minOpeningBalance: "",
        minMonthlyAvgBalance: "",
        annualInterestRate: "",
        srCitizenAddonRate: "",
        interestPayout: "",
        lockInAmount: "",
        minMonthlyAvgCharge: "",
        serviceChargeFreq: "",
        serviceCharges: "",
        smsChargeFreq: "",
        smsCharges: "",
        schemeActive: "No",
    };

    const [formData, setFormData] = useState({ ...initialFormData });
    const [errors, setErrors] = useState({});
    const [schemes, setSchemes] = useState([]);
    const [progressbar, setProgressbar] = useState(false);
    const [fetched, setFetched] = useState(false);
    const [alert, setAlert] = useState({
        color: "success",
        message: "",
        autoDismiss: 7,
        place: "tc",
        display: false,
        sweetAlert: false,
        timestamp: new Date().getTime(),
    });

    // Fetch data on mount
    useEffect(() => {
        if (!fetched) {
            axios
                .get("/api/loan/get-plans/scheme")

                .then(function (value){
                    if (value.data.success){
                        if (value.data.plans.length > 0){
                            setSchemes(value.data.plans);
                        }else {
                            setAlert({
                                color: 'warning',
                                message: "No schemes found! Please add one.",
                                autoDismiss: 7,
                                place: 'tc',
                                display: true,
                                sweetAlert: false,
                                timestamp: new Date().getTime(),
                            });
                        }
                    } else {
                        setAlert({
                            color: "danger",
                            message: value.data.error ,
                            autoDismiss: 7,
                            place: "tc",
                            display: true,
                            sweetAlert: false,
                            timestamp: new Date().getTime(),
                        });
                    }
                })
                .catch((err) => {
                    setAlert({
                        color: "danger",
                        message: err.message || "Error fetching schemes.",
                        autoDismiss: 7,
                        place: "tc",
                        display: true,
                        sweetAlert: false,
                        timestamp: new Date().getTime(),
                    });
                });
            setFetched(true);
        }
    }, [fetched]);

    const handleChange = (key, value) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
    };

    const validate = () => {
        const temp = {};
        let isValid = true;

        if (!formData.schemeName)
            temp.schemeName = "Scheme name is required.";
        if (!formData.schemeCode)
            temp.schemeCode = "Scheme code is required.";
        if (!formData.minOpeningBalance)
            temp.minOpeningBalance = "Min opening balance is required.";
        if (!formData.minMonthlyAvgBalance)
            temp.minMonthlyAvgBalance = "Min monthly avg balance is required.";
        if (!formData.annualInterestRate)
            temp.annualInterestRate = "Annual interest rate is required.";
        if (!formData.srCitizenAddonRate)
            temp.srCitizenAddonRate = "Sr Citizen addon rate is required.";
        if (!formData.interestPayout)
            temp.interestPayout = "Interest payout is required.";
        if (!formData.lockInAmount)
            temp.lockInAmount = "Lock-in amount is required.";
        if (!formData.minMonthlyAvgCharge)
            temp.minMonthlyAvgCharge = "Min monthly avg charge is required.";

        setErrors(temp);
        return Object.values(temp).every((x) => x === "");
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setProgressbar(true);
        try {
            const response = await axios.post(
                "/api/loan/plan-creation/scheme",
                formData
            );
            if (response.data.success) {
                setSchemes([...schemes, formData]);
                setAlert({
                    color: "success",
                    message: response.data.success,
                    autoDismiss: 7,
                    place: "tc",
                    display: true,
                    sweetAlert: true,
                    timestamp: new Date().getTime(),
                });
                setFormData({ ...initialFormData });
            } else {
                setAlert({
                    color: "danger",
                    message: response.data.error || "Failed to save scheme.",
                    autoDismiss: 7,
                    place: "tc",
                    display: true,
                    sweetAlert: false,
                    timestamp: new Date().getTime(),
                });
            }
        } catch (error) {
            setAlert({
                color: "danger",
                message: error.message || "API Error.",
                autoDismiss: 7,
                place: "tc",
                display: true,
                sweetAlert: false,
                timestamp: new Date().getTime(),
            });
        } finally {
            setProgressbar(false);
        }
    };

    const handleClear = () => {
        setFormData({ ...initialFormData });
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
                        btnSize=""
                    >
                        {alert.message}
                    </ReactBSAlert>
                )}
            </div>

            <div className="content">
                {/* Scheme Form */}
                <Card className="shadow p-4 mb-4">
                    <CardHeader>
                        <CardTitle tag="h3">Add Saving Scheme</CardTitle>
                    </CardHeader>
                    <CardBody>
                        <h5 className="text-primary mb-3">Scheme Details</h5>
                        <Row className="mb-3">
                            <Col md="6">
                                <FormGroup>
                                    <Label>Scheme Name *</Label>
                                    <Input
                                        type="text"
                                        value={formData.schemeName}
                                        onChange={(e) =>
                                            handleChange("schemeName", e.target.value)
                                        }
                                    />
                                    <small className="text-danger">{errors.schemeName}</small>
                                </FormGroup>
                            </Col>
                            <Col md="6">
                                <FormGroup>
                                    <Label>Scheme Code *</Label>
                                    <Input
                                        type="text"
                                        value={formData.schemeCode}
                                        onChange={(e) =>
                                            handleChange("schemeCode", e.target.value)
                                        }
                                    />
                                    <small className="text-danger">{errors.schemeCode}</small>
                                </FormGroup>
                            </Col>
                        </Row>
                        <Row className="mb-3">
                            <Col md="6">
                                <FormGroup>
                                    <Label>Min Opening Balance *</Label>
                                    <Input
                                        type="number"
                                        value={formData.minOpeningBalance}
                                        onChange={(e) =>
                                            handleChange("minOpeningBalance", e.target.value)
                                        }
                                    />
                                    <small className="text-danger">
                                        {errors.minOpeningBalance}
                                    </small>
                                </FormGroup>
                            </Col>
                            <Col md="6">
                                <FormGroup>
                                    <Label>Min Monthly Avg Balance *</Label>
                                    <Input
                                        type="number"
                                        value={formData.minMonthlyAvgBalance}
                                        onChange={(e) =>
                                            handleChange("minMonthlyAvgBalance", e.target.value)
                                        }
                                    />
                                    <small className="text-danger">
                                        {errors.minMonthlyAvgBalance}
                                    </small>
                                </FormGroup>
                            </Col>
                        </Row>
                        <Row className="mb-3">
                            <Col md="6">
                                <FormGroup>
                                    <Label>Annual Interest Rate (%) *</Label>
                                    <Input
                                        type="number"
                                        value={formData.annualInterestRate}
                                        onChange={(e) =>
                                            handleChange("annualInterestRate", e.target.value)
                                        }
                                    />
                                    <small className="text-danger">
                                        {errors.annualInterestRate}
                                    </small>
                                </FormGroup>
                            </Col>
                            <Col md="6">
                                <FormGroup>
                                    <Label>Sr. Citizen Add-on Rate (%) *</Label>
                                    <Input
                                        type="number"
                                        value={formData.srCitizenAddonRate}
                                        onChange={(e) =>
                                            handleChange("srCitizenAddonRate", e.target.value)
                                        }
                                    />
                                    <small className="text-danger">
                                        {errors.srCitizenAddonRate}
                                    </small>
                                </FormGroup>
                            </Col>
                        </Row>
                        <Row className="mb-3">
                            <Col md="6">
                                <FormGroup>
                                    <Label>Interest Payout *</Label>
                                    <Input
                                        type="select"
                                        value={formData.interestPayout}
                                        onChange={(e) =>
                                            handleChange("interestPayout", e.target.value)
                                        }
                                    >
                                        <option value="">Select Payout</option>
                                        <option value="Monthly">Monthly</option>
                                        <option value="Quarterly">Quarterly</option>
                                        <option value="HalfYearly">Half-Yearly</option>
                                        <option value="Yearly">Yearly</option>
                                    </Input>
                                    <small className="text-danger">
                                        {errors.interestPayout}
                                    </small>
                                </FormGroup>
                            </Col>
                            <Col md="6">
                                <FormGroup>
                                    <Label>Lock In Amount *</Label>
                                    <Input
                                        type="number"
                                        value={formData.lockInAmount}
                                        onChange={(e) =>
                                            handleChange("lockInAmount", e.target.value)
                                        }
                                    />
                                    <small className="text-danger">{errors.lockInAmount}</small>
                                </FormGroup>
                            </Col>
                        </Row>
                        <Row className="mb-3">
                            <Col md="6">
                                <FormGroup>
                                    <Label>Min Monthly Avg Charge *</Label>
                                    <Input
                                        type="number"
                                        value={formData.minMonthlyAvgCharge}
                                        onChange={(e) =>
                                            handleChange("minMonthlyAvgCharge", e.target.value)
                                        }
                                    />
                                    <small className="text-danger">
                                        {errors.minMonthlyAvgCharge}
                                    </small>
                                </FormGroup>
                            </Col>
                        </Row>

                        <h5 className="text-primary mt-4">Service Charges</h5>
                        <Row className="mb-3">
                            <Col md="6">
                                <FormGroup>
                                    <Label>Charge Frequency</Label>
                                    <Input
                                        type="select"
                                        value={formData.serviceChargeFreq}
                                        onChange={(e) =>
                                            handleChange("serviceChargeFreq", e.target.value)
                                        }
                                    >
                                        <option value="">Select Frequency</option>
                                        <option value="BeginningOfMonth">Beginning of Month</option>
                                        <option value="EndOfMonth">End of Month</option>
                                        <option value="BeginningOfQuarter">Beginning of Quarter</option>
                                        <option value="EndOfQuarter">End of Quarter</option>
                                    </Input>
                                </FormGroup>
                            </Col>
                            <Col md="6">
                                <FormGroup>
                                    <Label>Service Charges</Label>
                                    <Input
                                        type="number"
                                        value={formData.serviceCharges}
                                        onChange={(e) =>
                                            handleChange("serviceCharges", e.target.value)
                                        }
                                    />
                                </FormGroup>
                            </Col>
                        </Row>

                        <h5 className="text-primary mt-4">SMS Charges</h5>
                        <Row className="mb-3">
                            <Col md="6">
                                <FormGroup>
                                    <Label>SMS Charge Frequency</Label>
                                    <Input
                                        type="select"
                                        value={formData.smsChargeFreq}
                                        onChange={(e) =>
                                            handleChange("smsChargeFreq", e.target.value)
                                        }
                                    >
                                        <option value="">Select Frequency</option>
                                        <option value="BeginningOfMonth">Beginning of Month</option>
                                        <option value="EndOfMonth">End of Month</option>
                                    </Input>
                                </FormGroup>
                            </Col>
                            <Col md="6">
                                <FormGroup>
                                    <Label>SMS Charges</Label>
                                    <Input
                                        type="number"
                                        value={formData.smsCharges}
                                        onChange={(e) =>
                                            handleChange("smsCharges", e.target.value)
                                        }
                                    />
                                </FormGroup>
                            </Col>
                        </Row>

                        <h5 className="text-primary mt-4">Scheme Status</h5>
                        <Row>
                            <Col md="6">
                                <FormGroup check inline>
                                    <Label check>
                                        <Input
                                            type="radio"
                                            value="Yes"
                                            checked={formData.schemeActive === "Yes"}
                                            onChange={(e) =>
                                                handleChange("schemeActive", e.target.value)
                                            }
                                        />{" "}
                                        Yes
                                    </Label>
                                </FormGroup>
                                <FormGroup check inline>
                                    <Label check>
                                        <Input
                                            type="radio"
                                            value="No"
                                            checked={formData.schemeActive === "No"}
                                            onChange={(e) =>
                                                handleChange("schemeActive", e.target.value)
                                            }
                                        />{" "}
                                        No
                                    </Label>
                                </FormGroup>
                            </Col>
                        </Row>
                    </CardBody>
                    <CardFooter className="d-flex justify-content-center gap-2">
                        <Button
                            color="success"
                            onClick={handleSubmit}
                            disabled={progressbar}
                        >
                            {progressbar ? (
                                <Spinner size="sm" color="light" />
                            ) : (
                                "Submit"
                            )}
                        </Button>
                        <Button color="danger" onClick={handleClear}>
                            Delete
                        </Button>
                    </CardFooter>
                </Card>

                {/* Display fetched schemes */}
                <Card>
                    <CardHeader>
                        <CardTitle tag="h3">Saved Schemes</CardTitle>
                    </CardHeader>
                    <CardBody>
                        <Table responsive hover>
                            <thead>
                            <tr>
                                <th>#</th>
                                <th>Scheme Name</th>
                                <th>Scheme Code</th>
                                <th>Min Opening</th>
                                <th>Annual Rate</th>
                                <th>Action</th>
                            </tr>
                            </thead>
                            <tbody>
                            {schemes.map((scheme, index) => (
                                <tr key={index}>
                                    <td>{index + 1}</td>
                                    <td>{scheme.schemeName}</td>
                                    <td>{scheme.schemeCode}</td>
                                    <td>{scheme.minOpeningBalance}</td>
                                    <td>{scheme.annualInterestRate}%</td>
                                    <td>
                                        <Button
                                            color="primary"
                                            size="sm"
                                            onClick={() => setFormData(scheme)}
                                        >
                                            ➡
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </Table>
                    </CardBody>
                </Card>
            </div>
        </>
    );
};

export default AddSavingScheme;