
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

const AddScheme = () => {
    // Initial Form Data
    const initialFormData = {
        schemeName: "",
        schemeCode: "",
        minRdDdAmount: "",
        annualInterestRate: "",
        bonusRateType: "%",
        bonusRateValue: "0.0",
        rdDdFrequency: "",
        srCitizenAddonRate: "",
        interestCompoundingInterval: "",
        rdDdLockInPeriod: "",
        interestLockInPeriod: "",
        tenureOfRdDdUnit: "MONTHS",
        tenureOfRdDdValue: "",
        typeOfScheme: "",
        cancellationChargesType: "FIXED",
        cancellationChargesValue: "",
        stationaryCharges: "",
        penaltyChargesType: "%",
        penaltyChargesValue: "0.0%",
        penalCharge: "",
        active: "Yes",
    };

    const [formData, setFormData] = useState(initialFormData);
    const [errors, setErrors] = useState({});
    const [schemes, setSchemes] = useState([]);
    const [progressbar, setProgressbar] = useState(false);
    const [alert, setAlert] = useState({
        color: "success",
        message: "",
        autoDismiss: 7,
        place: "tc",
        display: false,
        sweetAlert: false,
        timestamp: new Date().getTime(),
    });

    // Fetch existing schemes on mount
    useEffect(() => {
        axios
            .get("/api/loan/get-plans/RDDD") // adjust endpoint if needed
            .then((res) => {
                if (res.data.success && res.data.plans.length > 0) {
                    setSchemes(res.data.plans);
                } else {
                    setAlert({
                        color: "warning",
                        message: "No schemes found! Please add one.",
                        autoDismiss: 7,
                        place: "tc",
                        display: true,
                        sweetAlert: false,
                        timestamp: new Date().getTime(),
                    });
                }
            })
            .catch((err) =>
                setAlert({
                    color: "danger",
                    message: err.message || "Error fetching schemes.",
                    autoDismiss: 7,
                    place: "tc",
                    display: true,
                    sweetAlert: false,
                    timestamp: new Date().getTime(),
                })
            );
    }, []);

    // Handle input changes
    const handleChange = (key, value) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
    };

    // Validation
    const validate = () => {
        const temp = {};
        let isValid = true;

        if (!formData.schemeName)
            temp.schemeName = "Scheme name is required.";
        if (!formData.schemeCode)
            temp.schemeCode = "Scheme code is required.";
        if (!formData.minRdDdAmount)
            temp.minRdDdAmount = "Minimum RD/DD amount is required.";
        if (!formData.annualInterestRate)
            temp.annualInterestRate = "Annual interest rate is required.";
        if (!formData.rdDdFrequency)
            temp.rdDdFrequency = "RD/DD frequency is required.";
        if (!formData.srCitizenAddonRate)
            temp.srCitizenAddonRate = "Sr Citizen addon rate is required.";
        if (!formData.interestCompoundingInterval)
            temp.interestCompoundingInterval = "Interest compounding interval is required.";
        if (!formData.rdDdLockInPeriod)
            temp.rdDdLockInPeriod = "RD/DD lock-in period is required.";
        if (!formData.interestLockInPeriod)
            temp.interestLockInPeriod = "Interest Lock-In Period is required.";
        if (!formData.tenureOfRdDdValue)
            temp.tenureOfRdDdValue = "Tenure of RD/DD is required.";
        if (!formData.typeOfScheme)
            temp.typeOfScheme = "Type Of Scheme is required.";
        if (!formData.cancellationChargesValue)
            temp.cancellationChargesValue = "Cancellation charges are required.";
        if (!formData.stationaryCharges)
            temp.stationaryCharges = "Stationary charges are required.";
        if (!formData.penaltyChargesValue)
            temp.penaltyChargesValue = "Penalty charges are required.";

        setErrors(temp);
        return Object.values(temp).every((x) => x === "");
    };

    // Submit handler
    const handleSubmit = async () => {
        if (!validate()) return;
        setProgressbar(true);

        try {
            const response = await axios.post("/api/loan/plan-creation/RDDD", formData);
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
                setFormData(initialFormData);
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

    // Reset form
    const handleReset = () => {
        setFormData(initialFormData);
        setErrors({});
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
                {/* Scheme Form */}
                <Card className="shadow p-4 mb-4">
                    <CardHeader>
                        <CardTitle tag="h3">Add Scheme</CardTitle>
                    </CardHeader>
                    <CardBody>
                        {/* Scheme Details */}
                        <h5 className="text-primary mb-3">Scheme Details</h5>
                        <Row className="mb-3">
                            <Col md="6">
                                <Label>Scheme Name *</Label>
                                <Input
                                    value={formData.schemeName}
                                    onChange={(e) => handleChange("schemeName", e.target.value)}
                                    placeholder="Enter Scheme Name"
                                />
                                <small className="text-danger">{errors.schemeName}</small>
                            </Col>


                            <Col md="6">
                                <Label>Scheme Code*</Label>
                                <Input
                                    value={formData.schemeCode}
                                    onChange={(e) => handleChange("schemeCode", e.target.value)}
                                    placeholder="Scheme Code"
                                />
                                <small className="text-danger">{errors.schemeCode}</small>
                            </Col>
                        </Row>
                        <Row className="mb-3">

                            <Col md="6">
                                <Label>Min. RD/DD Amount *</Label>
                                <Input
                                    value={formData.minRdDdAmount}
                                    onChange={(e) => handleChange("minRdDdAmount", e.target.value)}
                                    placeholder="Enter Min. RD/DD Amount"
                                />
                                <small className="text-danger">{errors.minRdDdAmount}</small>
                            </Col>

                            <Col md="6">
                                <Label>RD/DD Frequency *</Label>
                                <Input
                                    type="select"
                                    value={formData.rdDdFrequency}
                                    onChange={(e) => handleChange("rdDdFrequency", e.target.value)}
                                >
                                    <option value="">Select Frequency</option>
                                    <option value="Daily">Daily</option>
                                    <option value="Weeekly">Weekly</option>
                                    <option value="BI-Weekly">BI_Weekly</option>
                                    <option value="Monthly">Monthly</option>
                                    <option value="Quarterly">Quarterly</option>
                                    <option value="Half-Yearly">Half_Yearly</option>
                                    <option value="Yearly">Yearly</option>
                                </Input>
                                <small className="text-danger">{errors.rdDdFrequency}</small>
                            </Col>
                        </Row>


                        <Row className="mb-3">
                            <Col md="6">
                                <Label>Annual Interest Rate (%) *</Label>
                                <Input
                                    value={formData.annualInterestRate}
                                    onChange={(e) => handleChange("annualInterestRate", e.target.value)}
                                    placeholder="Enter Annual Interest Rate"
                                />
                                <small className="text-danger">{errors.annualInterestRate}</small>
                            </Col>


                            <Col md="6">
                                <Label>Sr. Citizen Add-on Interest Rate (%) *</Label>
                                <Input
                                    value={formData.srCitizenAddonRate}
                                    onChange={(e) => handleChange("srCitizenAddonRate", e.target.value)}
                                    placeholder="Enter Sr. Citizen Add-on Interest Rate"
                                />
                                <small className="text-danger">{errors.srCitizenAddonRate}</small>
                            </Col>

                        </Row>

                        <Row className="mb-3">
                            <Col md="6">
                                <Label>Bonus Rate </Label>
                                <Row>
                                    <Col xs="2">
                                        <Input
                                            type="select"
                                            value={formData.bonusRateType}
                                            onChange={(e) => handleChange("bonusRateType", e.target.value)}
                                        >
                                            <option value="%">%</option>
                                            <option value="Fixed">Fixed</option>
                                        </Input>
                                    </Col>
                                    <Col xs="10">
                                        <Input
                                            value={formData.bonusRate}
                                            onChange={(e) => handleChange("bonusRateValue", e.target.value)}
                                            placeholder="Enter Bonus Rate"
                                        />
                                    </Col>
                                </Row>

                            </Col>



                            <Col md="6">
                                <Label>Interest Compounding Interval *</Label>
                                <Input
                                    type="select"
                                    value={formData.interestCompoundingInterval}
                                    onChange={(e) => handleChange("interestCompoundingInterval", e.target.value)}
                                >
                                    <option value="">Select Interval</option>
                                    <option value="Daily">Daily</option>
                                    <option value="Monthly">Monthly</option>
                                    <option value="Quarterly">Quarterly</option>
                                    <option value="Half-Yearly">Half-Yearly</option>
                                    <option value="Yearly">Yearly</option>
                                </Input>
                                <small className="text-danger">{errors.interestCompoundingInterval}</small>
                            </Col>
                            <Col md="6">
                                <Label>RD/DD Lock-In Period *</Label>
                                <Input
                                    type="select"
                                    value={formData.rdDdLockInPeriod}
                                    onChange={(e) => handleChange("rdDdLockInPeriod", e.target.value)}
                                >
                                    <option value="">Select Period</option>
                                    <option value="3 months">3 months</option>
                                    <option value="6 months">6 months</option>
                                    <option value="9 months">9 months</option>
                                    <option value="1 year">1 year</option>
                                </Input>
                                <small className="text-danger">{errors.rdDdLockInPeriod}</small>
                            </Col>
                            <Col md="6">
                                <Label>Interest Lock-In Period *</Label>
                                <Input
                                    type="select"
                                    value={formData.interestLockInPeriod}
                                    onChange={(e) => handleChange("interestLockInPeriod", e.target.value)}
                                >
                                    <option value="">Select Period</option>
                                    <option value="6 months">6 months</option>
                                    <option value="1 year">1 year</option>
                                    <option value="2 years">2 years</option>
                                    <option value="3 years">3 years</option>
                                </Input>
                                <small className="text-danger">{errors.interestLockInPeriod}</small>
                            </Col>
                        </Row>



                        <Row className="mb-3">
                            <Col md="6">
                                <Label>Tenure of RD/DD *</Label>
                                <Row>
                                    <Col xs="3">
                                        <Input
                                            type="select"
                                            value={formData.tenureOfRdDdUnit}
                                            onChange={(e) => handleChange("tenureOfRdDdUnit", e.target.value)}
                                        >
                                            <option value="MONTHS">MONTHS</option>
                                            <option value="YEARS">YEARS</option>
                                        </Input>
                                    </Col>
                                    <Col xs="9">
                                        <Input
                                            value={formData.tenureOfRdDdValue}
                                            onChange={(e) => handleChange("tenureOfRdDdValue", e.target.value)}
                                            placeholder="Enter Tenure of RD/DD"
                                        />
                                    </Col>
                                </Row>
                                <small className="text-danger">{errors.tenureOfRdDdValue}</small>
                            </Col>
                            <Col md="6">
                                <Label>Type Of Scheme *</Label>
                                <Input
                                    type="select"
                                    value={formData.typeOfScheme}
                                    onChange={(e) => handleChange("typeOfScheme", e.target.value)}

                                >
                                    <option value="">Select</option>
                                    <option value="RD">RD</option>
                                    <option value="DD">DD</option>
                                </Input>
                                <small className="text-danger">{errors.stationaryCharges}</small>
                            </Col>
                        </Row>
                        <Row className="mb-3">
                            <Col md="6">
                                <Label>Cancellation Charges </Label>
                                <Row>
                                    <Col xs="3">
                                        <Input
                                            type="select"
                                            value={formData.cancellationChargesType}
                                            onChange={(e) => handleChange("cancellationChargesType", e.target.value)}
                                        >
                                            <option value="FIXED">FIXED</option>
                                            <option value="%">% of Balance</option>
                                        </Input>
                                    </Col>
                                    <Col xs="9">
                                        <Input
                                            value={formData.cancellationChargesValue}
                                            onChange={(e) => handleChange("cancellationChargesValue", e.target.value)}
                                            placeholder="Enter Cancellation Charges"
                                        />
                                    </Col>
                                </Row>
                                <small className="text-danger">{errors.cancellationChargesValue}</small>
                            </Col>
                            <Col md="6">
                                <Label>Stationary Charges </Label>
                                <Input
                                    value={formData.stationaryCharges}
                                    onChange={(e) => handleChange("stationaryCharges", e.target.value)}
                                    placeholder="Enter Stationary Charges"
                                />
                                <small className="text-danger">{errors.stationaryCharges}</small>
                            </Col>
                        </Row>
                        <Row className="mb-3">
                            <Col md="6">
                                <Label>Penalty Charges (%) </Label>
                                <Row>
                                    <Col xs="2">
                                        <Input
                                            type="select"
                                            value={formData.penaltyChargesType}
                                            onChange={(e) => handleChange("penaltyChargesType", e.target.value)}
                                        >
                                            <option value="%">%</option>
                                        </Input>
                                    </Col>
                                    <Col xs="10">
                                        <Input
                                            value={formData.penaltyChargesValue}
                                            onChange={(e) => handleChange("penaltyChargesValue", e.target.value)}
                                            placeholder="Enter Penalty Charges"
                                        />
                                    </Col>
                                </Row>
                                <small className="text-danger">{errors.penaltyChargesValue}</small>
                            </Col>

                            <Col md="6">
                                <Label>Penal Charges (%) </Label>
                                <Input
                                    value={formData.penalCharge}
                                    onChange={(e) => handleChange("penalCharge", e.target.value)}
                                    placeholder="0.0%"
                                />

                            </Col>
                        </Row>
                        <h5 className="text-primary mt-4">Scheme Status</h5>
                        <Row>
                            <Col md="6">
                                <Label>Active *</Label>
                                <FormGroup check inline>
                                    <Label check>
                                        <Input
                                            type="radio"
                                            value="Yes"
                                            checked={formData.active === "Yes"}
                                            onChange={(e) => handleChange("active", e.target.value)}
                                        />{" "}
                                        Yes
                                    </Label>
                                </FormGroup>
                                <FormGroup check inline>
                                    <Label check>
                                        <Input
                                            type="radio"
                                            value="No"
                                            checked={formData.active === "No"}
                                            onChange={(e) => handleChange("active", e.target.value)}
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
                            {progressbar ? <Spinner size="sm" color="light" /> : "Submit"}
                        </Button>
                        <Button color="warning" onClick={handleReset}>
                            Reset
                        </Button>
                    </CardFooter>
                </Card>

                {/* Display Existing Schemes */}
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
                                <th>Min RD/DD Amount</th>
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
                                    <td>{scheme.minRdDdAmount}</td>
                                    <td>{scheme.annualInterestRate}%</td>
                                    <td>
                                        <Button
                                            color="primary"
                                            size="sm"
                                            onClick={() => setFormData(scheme)}
                                        >
                                            Edit
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

export default AddScheme;

