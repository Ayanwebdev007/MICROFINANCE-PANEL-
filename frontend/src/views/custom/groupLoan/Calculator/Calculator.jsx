import React, {useState, useEffect} from "react";
import {
    Button,
    Card,
    CardHeader,
    CardTitle,
    CardBody,
    FormGroup,
    Input,
    Row,
    Col,
    Table,
    Label,
    CustomInput,
} from "reactstrap";
import axios from "axios";

const LoanCalculator = () => {
    const initialState = {
        scheme: "",
        tenureType: "Months",
        tenure: "",
        emiPayout: "Daily",
        loanAmount: "",
        advancedSettings: false,

        // Advanced Fields
        maxTenure: "",
        interestType: "Flat EMI",
        annualInterestRate: "",
        processingFee: "",
        legalFee: 0,
        insuranceCharges: "",
        foreclosureCharges: "",
        smsCharges: "",
        fuelCharges: "",
        stationaryCharges: "",
        collectionCharges: "",
        chargesPerEMIType: "ON PRINCIPAL",
    };

    const [formData, setFormData] = useState(initialState);
    const [schemes, setSchemes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [emiPlan, setEmiPlan] = useState(null);
    const [totalCharges, setTotalCharges] = useState(0);

    // Add Property in Date function
    Date.prototype.addDays = function (days) {
        let date = new Date(this.valueOf());
        date.setDate(date.getDate() + days);
        return date;
    }

    // Simulate fetching schemes from backend
    useEffect(() => {
        const fetchSchemes = async () => {
            try {
                setLoading(true);
                const response = await axios.get("/api/loan/get-plans/group-loan");
                if (response.data.success && Array.isArray(response.data.plans)) {
                    setSchemes(response.data.plans);
                }
            } catch (error) {
                console.error("Error fetching schemes:", error);
                alert("Failed to load loan schemes.");
            } finally {
                setLoading(false);
            }
        };
        fetchSchemes();
    }, []);

    const handleInputChange = (e) => {
        const {name, value, type, checked} = e.target;

        if (name === "scheme") {
            const selectedScheme = schemes.find((s) => s.id === value);

            if (selectedScheme) {
                let interestType =
                    selectedScheme.calculationMethod === "FLAT"
                        ? "Flat EMI"
                        : selectedScheme.calculationMethod === "REDUCING"
                            ? "Reducing EMI"
                            : "Flat Advanced Interest Deduction";

                if (selectedScheme.emiInterval === 'dai') {
                    selectedScheme.emiInterval = 'day'
                }
                setFormData({
                    ...formData,
                    scheme: value,
                    tenureType:
                        selectedScheme.emiInterval.charAt(0).toUpperCase() +
                        selectedScheme.emiInterval.slice(1),
                    emiPayout: selectedScheme.emiMode,
                    minAmount: selectedScheme.minAmount,
                    maxAmount: selectedScheme.maxAmount,
                    tenure: selectedScheme.emiCount,
                    annualInterestRate: selectedScheme.interestRate,
                    processingFee: selectedScheme.processingFee,
                    legalFee: selectedScheme.legalFee,
                    insuranceCharges: selectedScheme.insuranceFeeRate,
                    insuranceFeeRate: selectedScheme.insuranceFeeRate,
                    gstRate: selectedScheme.gstRate,
                    valuerFeeRate: selectedScheme.valuerFeeRate,
                    chargesPerEMIType: selectedScheme.chargesPerEMIType || "ON PRINCIPAL",
                    interestType,
                });
            }
        } else if (name === "emiPayout") {
            setFormData({
                ...formData,
                emiMode: value,
                emiPayout: value,
                emiInterval: value.charAt(0).toUpperCase() + value.slice(1, value.length - 2),
                tenureType: value.charAt(0).toUpperCase() + value.slice(1, value.length - 2),
            })
        } else {
            setFormData({...formData, [name]: type === "checkbox" ? checked : value});
        }
    };

    // Format numbers as INR
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 2,
        }).format(amount);
    };

    // Check if the field is empty
    const isFieldEmpty = (value) => {
        return !value && value !== 0;
    };

    // Calculate EMIs
    const calculateEMI = () => {
        const principal = parseFloat(formData.loanAmount);
        const tenure = parseInt(formData.tenure);
        const rate = parseFloat(formData.annualInterestRate);

        if (!principal || !tenure || !rate) {
            alert("Please fill all required fields marked with *");
            return;
        }

        // const interestRate = rate / 100 / 12; // Monthly rate
        const processingFee = principal * parseFloat(formData.processingFee || 0) / 100;
        const legalAmount = parseFloat(formData.legalFee || 0);
        const insuranceAmount = principal * parseFloat(formData.insuranceFeeRate || 0) / 100;
        const gst = principal * parseFloat(formData.gstRate || 0) / 100;
        const valuerFee = principal * parseFloat(formData.valuerFeeRate || 0) / 100;
        const totalCharges = processingFee + legalAmount + insuranceAmount + gst + valuerFee;
        setTotalCharges(totalCharges);

        let plan = [];

        switch (formData.interestType) {
            case "Reducing EMI":
                plan = calculateReducingEMI(principal, tenure, rate, totalCharges);
                break;
            case "Flat EMI":
                plan = calculateFlatEMI(principal, tenure, rate, totalCharges);
                break;
            // case "Flat Advanced Interest Deduction":
            //   plan = calculateFlatAdvancedEMI(principal, tenure, interestRate);
            //   break;
            default:
                alert("Invalid interest type");
                return;
        }
        setEmiPlan(plan);
    };

    // Reducing EMI Calculation (starts from next month)
    const calculateReducingEMI = (principal, tenure, interestRate) => {
        let rate;
        if (formData.emiPayout === 'daily') {
            rate = parseFloat(interestRate) / (365 * 100);
        } else if (formData.emiPayout === 'weekly') {
            rate = (parseFloat(interestRate) * 7) / (365 * 100);
        } else if (formData.emiPayout === 'fortnightly') {
            rate = (parseFloat(interestRate) * 14) / (365 * 100);
        } else if (formData.emiPayout === 'quarterly') {
            rate = (parseFloat(interestRate) * 3) / (12 * 100);
        } else {
            // (formData.planDetails.emiMode === 'monthly')
            rate = parseFloat(interestRate) / (12 * 100);
        }

        // Calculate EMI using reducing balance formula
        const emi = Math.ceil(principal * rate * Math.pow(1 + rate, tenure) / (Math.pow(1 + rate, tenure) - 1));

        let balance = principal;
        const plan = [];

        let currentDate = new Date();
        const baseDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1); // First day of next month

        for (let i = 1; i <= tenure; i++) {
            let nextMonth;
            let dueDate;
            const interest = balance * rate;
            if (formData.emiPayout === 'daily') {
                nextMonth = new Date().addDays(i);
                dueDate = new Date().addDays(i + 1);
            } else if (formData.emiPayout === 'weekly') {
                nextMonth = new Date().addDays((i * 7));
                dueDate = new Date().addDays((i + 1) * 7);
            } else if (formData.emiPayout === 'fortnightly') {
                nextMonth = new Date().addDays((i * 14));
                dueDate = new Date().addDays((i + 1) * 14);
            } else if (formData.emiPayout === 'monthly') {
                nextMonth = new Date(baseDate.getFullYear(), baseDate.getMonth() + i - 1, 0);
                dueDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 5);
            } else if (formData.emiPayout === 'quarterly') {
                nextMonth = new Date(baseDate.getFullYear(), baseDate.getMonth() + (i * 3) - 1, 0);
                dueDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 5);
            }

            const principalPart = emi - interest;
            balance -= principalPart;

            plan.push({
                emiNo: i,
                date: nextMonth.toLocaleDateString(),
                dueDate: dueDate.toLocaleDateString(),
                principal: principalPart.toFixed(2),
                interest: interest.toFixed(2),
                total: emi.toFixed(2),
                balance: balance < 0 ? '0.00' : balance.toFixed(2),
            });
        }

        return plan;
    };

    // Flat EMI Calculation (starts from next month)
    const calculateFlatEMI = (principal, tenure, interestRate) => {
        let months;
        if (formData.emiPayout === 'daily') {
            months = Math.ceil(parseInt(tenure) / 30);
        } else if (formData.emiPayout === 'weekly') {
            months = Math.ceil(parseInt(tenure) * 7 / 30);
        } else if (formData.emiPayout === 'fortnightly') {
            months = Math.ceil(parseInt(tenure) * 14 / 30);
        } else if (formData.emiPayout === 'monthly') {
            months = parseInt(tenure);
        } else if (formData.emiPayout === 'quarterly') {
            months = Math.ceil(parseInt(formData.planDetails.emiCount) * 3);
        }
        const totalInterest = (principal * interestRate * months) / (100 * 12);
        const totalAmount = principal + totalInterest;
        const emi = Math.ceil(totalAmount / tenure);
        const plan = [];

        let currentDate = new Date();
        const baseDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);

        for (let i = 1; i <= tenure; i++) {
            let nextMonth;
            let dueDate
            if (formData.emiPayout === 'daily') {
                nextMonth = new Date().addDays(i);
                dueDate = new Date().addDays(i + 1);
            } else if (formData.emiPayout === 'weekly') {
                nextMonth = new Date().addDays((i * 7));
                dueDate = new Date().addDays((i + 1) * 7);
            } else if (formData.emiPayout === 'fortnightly') {
                nextMonth = new Date().addDays((i * 14));
                dueDate = new Date().addDays((i + 1) * 14);
            } else if (formData.emiPayout === 'monthly') {
                nextMonth = new Date(baseDate.getFullYear(), baseDate.getMonth() + i - 1, 0);
                dueDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 5);
            } else if (formData.emiPayout === 'quarterly') {
                nextMonth = new Date(baseDate.getFullYear(), baseDate.getMonth() + (i * 3) - 1, 0);
                dueDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 5);
            }

            plan.push({
                emiNo: i,
                date: nextMonth.toLocaleDateString(),
                dueDate: dueDate.toLocaleDateString(),
                principal: principal / tenure,
                interest: (emi - principal / tenure),
                total: emi.toFixed(2),
                balance: (principal - (principal * i / tenure)).toFixed(2),
            });
        }

        return plan;
    };

    // Flat Advanced EMI Calculation (starts from next month)
    const calculateFlatAdvancedEMI = (principal, months, interestRate) => {
        const totalInterest = principal * interestRate * months;
        const totalAmount = principal + totalInterest;
        const emi = totalAmount / months;
        const plan = [];

        let currentDate = new Date();
        const baseDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);

        for (let i = 1; i <= months; i++) {
            const nextMonth = new Date(baseDate.getFullYear(), baseDate.getMonth() + i - 1, 0);
            const dueDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 5);

            plan.push({
                emiNo: i,
                date: nextMonth.toLocaleDateString(),
                dueDate: dueDate.toLocaleDateString(),
                principal: (principal / months).toFixed(2),
                interest: (totalInterest / months).toFixed(2),
                total: emi.toFixed(2),
                balance: (principal - (principal / months) * i).toFixed(2),
            });
        }

        return plan;
    };

    const resetForm = () => {
        setFormData(initialState);
        setEmiPlan(null);
    };

    return (
        <div className="content">
            <Row>
                <Col md="12">
                    <Card>
                        <CardHeader>
                            <CardTitle tag="h3">Loan Calculator</CardTitle>
                        </CardHeader>
                        <CardBody>
                            <Row>
                                {/* Scheme Select */}
                                <Col md="4">
                                    <FormGroup>
                                        <Label>Loan Scheme</Label>
                                        <Input
                                            type="select"
                                            name="scheme"
                                            value={formData.scheme}
                                            onChange={handleInputChange}
                                            disabled={loading || !schemes.length}
                                        >
                                            <option value="">Select Scheme</option>
                                            {loading ? (
                                                <option disabled>Loading...</option>
                                            ) : (
                                                schemes.map((scheme) => (
                                                    <option key={scheme.id} value={scheme.id}>
                                                        {scheme.label || scheme.name}
                                                    </option>
                                                ))
                                            )}
                                        </Input>
                                    </FormGroup>
                                </Col>

                                {/* Tenure Type */}
                                <Col md="4">
                                    <FormGroup>
                                        <Label>Tenure Type</Label>
                                        <Input
                                            type="text"
                                            name="tenureType"
                                            value={formData.tenureType}
                                            readOnly
                                        />
                                    </FormGroup>
                                </Col>

                                {/* TENURE - Required */}
                                <Col md="4">
                                    <FormGroup>
                                        <Label>
                                            Tenure ({formData.tenureType})<span style={{color: "red"}}> *</span>
                                        </Label>
                                        <Input
                                            type="number"
                                            name="tenure"
                                            value={formData.tenure}
                                            onChange={handleInputChange}
                                            invalid={isFieldEmpty(formData.tenure)}
                                        />
                                    </FormGroup>
                                </Col>

                                {/* Payment Frequency */}
                                <Col md="4">
                                    <FormGroup>
                                        <Label>Payment Frequency</Label>
                                        <Input
                                            type="select"
                                            name="emiPayout"
                                            value={formData.emiPayout}
                                            onChange={handleInputChange}
                                        >
                                            <option value="daily">Daily</option>
                                            <option value="weekly">Weekly</option>
                                            <option value="monthly">Monthly</option>
                                            <option value="fortnightly">Fortnightly</option>
                                            <option value="quarterly">Quarterly</option>
                                        </Input>
                                    </FormGroup>
                                </Col>

                                {/* LOAN AMOUNT - Required */}
                                <Col md="4">
                                    <FormGroup>
                                        <Label>
                                            Loan Amount (₹)<span style={{color: "red"}}> *</span>
                                        </Label>
                                        <Input
                                            type="number"
                                            name="loanAmount"
                                            value={formData.loanAmount}
                                            onChange={handleInputChange}
                                            placeholder="Enter amount"
                                            invalid={isFieldEmpty(formData.loanAmount)}
                                        />
                                    </FormGroup>
                                </Col>

                                {/* Advanced Settings Toggle */}
                                <Col md="4">
                                    <FormGroup>
                                        <Label>Advanced Settings</Label>
                                        <CustomInput
                                            type="switch"
                                            id="advancedSettings"
                                            name="advancedSettings"
                                            checked={formData.advancedSettings}
                                            onChange={handleInputChange}
                                            label="Show Advanced Settings"
                                        />
                                    </FormGroup>
                                </Col>
                            </Row>
                            {formData.advancedSettings && (
                                <Row>
                                    <Col md="4">
                                        <FormGroup>
                                            <Label>Interest Type</Label>
                                            <div>
                                                <CustomInput
                                                    type="radio"
                                                    id="reducingEMI"
                                                    name="interestType"
                                                    label="Reducing EMI"
                                                    value="Reducing EMI"
                                                    checked={formData.interestType === "Reducing EMI"}
                                                    onChange={handleInputChange}
                                                />
                                                <CustomInput
                                                    type="radio"
                                                    id="flatEMI"
                                                    name="interestType"
                                                    label="Flat EMI"
                                                    value="Flat EMI"
                                                    checked={formData.interestType === "Flat EMI"}
                                                    onChange={handleInputChange}
                                                />
                                                {/*<CustomInput*/}
                                                {/*  type="radio"*/}
                                                {/*  id="flatAdvanced"*/}
                                                {/*  name="interestType"*/}
                                                {/*  label="Flat Advanced"*/}
                                                {/*  value="Flat Advanced Interest Deduction"*/}
                                                {/*  checked={*/}
                                                {/*    formData.interestType === "Flat Advanced Interest Deduction"*/}
                                                {/*  }*/}
                                                {/*  onChange={handleInputChange}*/}
                                                {/*/>*/}
                                            </div>
                                        </FormGroup>
                                    </Col>

                                    {/* ANNUAL INTEREST RATE - Required */}
                                    <Col md="4">
                                        <FormGroup>
                                            <Label>
                                                Annual Interest Rate (%)<span style={{color: "red"}}> *</span>
                                            </Label>
                                            <Input
                                                type="number"
                                                name="annualInterestRate"
                                                value={formData.annualInterestRate}
                                                onChange={handleInputChange}
                                                placeholder="e.g., 18%"
                                                invalid={isFieldEmpty(formData.annualInterestRate)}
                                            />
                                        </FormGroup>
                                    </Col>

                                    <Col md="4">
                                        <FormGroup>
                                            <Label>Processing Fee (%)</Label>
                                            <Input
                                                type="number"
                                                name="processingFee"
                                                value={formData.processingFee}
                                                onChange={handleInputChange}
                                                placeholder="0.00"
                                            />
                                        </FormGroup>
                                    </Col>

                                    <Col md="4">
                                        <FormGroup>
                                            <Label>Insurance Fee (%)</Label>
                                            <Input
                                                type="number"
                                                name="insuranceFeeRate"
                                                value={formData.insuranceFeeRate}
                                                onChange={handleInputChange}
                                                placeholder="0.00"
                                            />
                                        </FormGroup>
                                    </Col>

                                    <Col md="4">
                                        <FormGroup>
                                            <Label>GST Rate (%)</Label>
                                            <Input
                                                type="number"
                                                name="gstRate"
                                                value={formData.gstRate}
                                                onChange={handleInputChange}
                                                placeholder="0"
                                            />
                                        </FormGroup>
                                    </Col>

                                    <Col md="4">
                                        <FormGroup>
                                            <Label>Valuer Fee (%)</Label>
                                            <Input
                                                type="number"
                                                name="valuerFeeRate"
                                                value={formData.valuerFeeRate}
                                                onChange={handleInputChange}
                                                placeholder="0.00"
                                            />
                                        </FormGroup>
                                    </Col>

                                    {/*<Col md="4">*/}
                                    {/*  <FormGroup>*/}
                                    {/*    <Label>Charge Type</Label>*/}
                                    {/*    <div>*/}
                                    {/*      <CustomInput*/}
                                    {/*        type="radio"*/}
                                    {/*        id="onEMI"*/}
                                    {/*        name="chargesPerEMIType"*/}
                                    {/*        label="On EMI"*/}
                                    {/*        value="ON EMI"*/}
                                    {/*        checked={formData.chargesPerEMIType === "ON EMI"}*/}
                                    {/*        onChange={handleInputChange}*/}
                                    {/*      />*/}
                                    {/*      <CustomInput*/}
                                    {/*        type="radio"*/}
                                    {/*        id="onPrincipal"*/}
                                    {/*        name="chargesPerEMIType"*/}
                                    {/*        label="On Principal"*/}
                                    {/*        value="ON PRINCIPAL"*/}
                                    {/*        checked={formData.chargesPerEMIType === "ON PRINCIPAL"}*/}
                                    {/*        onChange={handleInputChange}*/}
                                    {/*      />*/}
                                    {/*    </div>*/}
                                    {/*  </FormGroup>*/}
                                    {/*</Col>*/}
                                </Row>
                            )}
                            <Col md="12" className="text-center mt-3">
                                <Button color="primary" onClick={calculateEMI} className="mr-2">
                                    Calculate EMI
                                </Button>
                                <Button color="danger" onClick={resetForm}>
                                    Reset
                                </Button>
                            </Col>
                            {emiPlan && (
                                <>
                                    <Row className="mt-2">
                                        <Col md="3">
                                            <Card>
                                                <CardBody className="text-center">
                                                    <h6>Loan Amount</h6>
                                                    <h4>{formatCurrency(parseFloat(formData.loanAmount))}</h4>
                                                </CardBody>
                                            </Card>
                                        </Col>
                                        <Col md="2">
                                            <Card>
                                                <CardBody className="text-center">
                                                    <h6>Tenure</h6>
                                                    <h4>{formData.tenure} {formData.tenureType}</h4>
                                                </CardBody>
                                            </Card>
                                        </Col>
                                        <Col md="2">
                                            <Card>
                                                <CardBody className="text-center">
                                                    <h6>Interest Rate</h6>
                                                    <h4>{formData.annualInterestRate}%</h4>
                                                </CardBody>
                                            </Card>
                                        </Col>
                                        <Col md="2">
                                            <Card>
                                                <CardBody className="text-center">
                                                    <h6>Total Fee</h6>
                                                    <h4>
                                                        {formatCurrency(totalCharges)}
                                                    </h4>
                                                </CardBody>
                                            </Card>
                                        </Col>
                                        <Col md="3">
                                            <Card>
                                                <CardBody className="text-center">
                                                    <h6>Total Payment (P + I)</h6>
                                                    <h4>
                                                        {formatCurrency(
                                                            emiPlan.reduce((sum, item) => sum + parseFloat(item.total), 0)
                                                        )}
                                                    </h4>
                                                </CardBody>
                                            </Card>
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col md="12">
                                            <Card>
                                                <CardBody>
                                                    <Table responsive hover bordered striped>
                                                        <thead>
                                                        <tr>
                                                            <th>#</th>
                                                            <th>Date</th>
                                                            <th>Due Date</th>
                                                            <th>Principal</th>
                                                            <th>Interest</th>
                                                            <th>EMI Amount</th>
                                                            <th>Balance</th>
                                                        </tr>
                                                        </thead>
                                                        <tbody>
                                                        {emiPlan.map((item, index) => (
                                                            <tr key={index}>
                                                                <td>{item.emiNo}</td>
                                                                <td>{item.date}</td>
                                                                <td>{item.dueDate}</td>
                                                                <td>{formatCurrency(item.principal)}</td>
                                                                <td>{formatCurrency(item.interest)}</td>
                                                                <td>{formatCurrency(item.total)}</td>
                                                                <td>{formatCurrency(item.balance)}</td>
                                                            </tr>
                                                        ))}
                                                        </tbody>
                                                    </Table>
                                                </CardBody>
                                            </Card>
                                        </Col>
                                    </Row>

                                    {/*<Row className="mt-3">*/}
                                    {/*  <Col md="12" className="text-center">*/}
                                    {/*    <Button color="success" className="mr-2">*/}
                                    {/*      <i className="fas fa-download mr-2" /> Export as PDF*/}
                                    {/*    </Button>*/}
                                    {/*    <Button color="info">*/}
                                    {/*      <i className="fas fa-file-excel mr-2" /> Export as Excel*/}
                                    {/*    </Button>*/}
                                    {/*  </Col>*/}
                                    {/*</Row>*/}
                                </>
                            )}
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default LoanCalculator;