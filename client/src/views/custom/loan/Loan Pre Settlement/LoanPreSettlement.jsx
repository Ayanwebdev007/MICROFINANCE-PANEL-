import React from "react";

// reactstrap components
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
import CstNotification from "../../components/CstNotification";
import ReactBSAlert from "react-bootstrap-sweetalert";
import axios from "axios";
import {useSelector} from "react-redux";

const LoanPreSettlement = () => {
    const branchOptions = ["Branch1", "Branch2", "Branch3", "Branch4"];
    const paymentMethods = ["Cash", "Cheque", "Online", "Card"];

    const initInput = {
        loanId:"",
        loanDate: "",
        codeName: "",
        relativeDetails: "",
        mobileNo: "",
        branchName: "",
        planName: "",
        term: "",
        loanMode: "",
        loanAmount: "",
        loanROI: "",
        roiType: "",
        emiAmount: "",
        totalInterest: "",
        totalPrincipal: "",
        totalPayable: "",
        paymentDetails: {
            paidInterest: "",
            paidPrincipal: "",
            totalPaid: "",
            payBranch: "",
            advancePaid: "",
            closingCharge:"",
            fineDue:"",
            interestDue:"",
            principalDue:"",
            totalAmountDue:"",
            paymentDate: new Date().toISOString().slice(0, 10),
            paymentBy:"",
            advisorCode: "",
            advisorName: "",
            remarks: "",
        },
        uuid: crypto.randomUUID(),
    };

    const [formData, setFormData]  = React.useState(initInput);
    const [cstError, setCstError] = React.useState({
        loanId:"",
        loanDate: "",
        codeName: "",
        mobileNo: "",
        branchName: "",
        planName: "",
        term: "",
        loanMode: "",
        loanAmount: "",
        loanROI: "",
        roiType: "",
        emiAmount: "",
        totalInterest: "",
        totalPrincipal: "",
        totalPayable: "",

        paymentDetails: {
            paidInterest: "",
            paidPrincipal: "",
            totalPaid: "",
            payBranch: "",
            advancePaid: "",
            closingCharge: "",
            fineDue: "",
            interestDue: "",
            principalDue: "",
            totalAmountDue: "",
            paymentDate: "",
            paymentBy: "",
            advisorCode: "",
            advisorName: "",
        },

    });
    const [progressbar, setProgressbar] = React.useState(false);
    const [alert, setAlert] = React.useState({
        color: "success",
        message: "Payment processed successfully",
        autoDismiss: 7,
        place: "tc",
        display: false,
        sweetAlert: false,
        timestamp: new Date().getTime(),
    });

    const authStatus = useSelector((state) => state.auth.authState);

    const validateForm = () => {
        let formErrors = {};
        let isValid = true;

        // Validate top-level fields
        if (!formData.loanId) {
            formErrors.loanId = "Loan ID is required.";
            isValid = false;
        }
        if (!formData.loanDate) {
            formErrors.loanDate = "Loan Date is required.";
            isValid = false;
        }
        if (!formData.codeName) {
            formErrors.codeName = "Code Name is required.";
            isValid = false;
        }
        if (!formData.mobileNo || formData.mobileNo.length !== 10) {
            formErrors.mobileNo = "A valid 10-digit Mobile No is required.";
            isValid = false;
        }
        if (!formData.branchName) {
            formErrors.branchName = "Branch Name is required.";
            isValid = false;
        }
        if (!formData.planName) {
            formErrors.planName = "Plan Name is required.";
            isValid = false;
        }
        if (!formData.term) {
            formErrors.term = "Term is required.";
            isValid = false;
        }
        if (!formData.loanMode) {
            formErrors.loanMode = "Loan Mode is required.";
            isValid = false;
        }
        if (!formData.loanAmount) {
            formErrors.loanAmount = "Loan Amount is required.";
            isValid = false;
        }
        if (!formData.loanROI) {
            formErrors.loanROI = "Loan ROI is required.";
            isValid = false;
        }
        if (!formData.roiType) {
            formErrors.roiType = "ROI Type is required.";
            isValid = false;
        }
        if (!formData.emiAmount) {
            formErrors.emiAmount = "EMI Amount is required.";
            isValid = false;
        }
        if (!formData.totalInterest) {
            formErrors.totalInterest = "Total Interest is required.";
            isValid = false;
        }
        if (!formData.totalPrincipal) {
            formErrors.totalPrincipal = "Total Principal is required.";
            isValid = false;
        }
        if (!formData.totalPayable) {
            formErrors.totalPayable = "Total Payable is required.";
            isValid = false;
        }

        // Validate nested paymentDetails fields
        const paymentDetails = formData.paymentDetails;
        if (!paymentDetails.paidInterest) {
            formErrors.paidInterest = "PaidInterest is required.";
            isValid = false;
        }
        if (!paymentDetails.paidPrincipal) {
            formErrors.paidPrincipal = "Paid Principal is required.";
            isValid = false;
        }
        if (!paymentDetails.totalPaid) {
            formErrors.totalPaid = "Total Paid is required.";
            isValid = false;
        }
        if (!paymentDetails.payBranch) {
            formErrors.payBranch = "Pay Branch is required.";
            isValid = false;
        }
        if (!paymentDetails.interestDue) {
            formErrors.interestDue = "Interest Due is required.";
            isValid = false;
        }
        if (!paymentDetails.advancePaid) {
            formErrors.advancePaid = "Advance Paid is required.";
            isValid = false;
        }
        if (!paymentDetails.closingCharge) {
            formErrors.closingCharge = "Closing Charge is required.";
            isValid = false;
        }
        if (!paymentDetails.fineDue) {
            formErrors.fineDue = "Fine Due is required.";
            isValid = false;
        }
        if (!paymentDetails.interestDue) {
            formErrors.interestDue = "Interest Due is required.";
            isValid = false;
        }
        if (!paymentDetails.principalDue) {
            formErrors.principalDue = "Principal Due is required.";
            isValid = false;
        }
        if (!paymentDetails.totalAmountDue) {
            formErrors.totalAmountDue = "Total Amount Due is required.";
            isValid = false;
        }
        if (!paymentDetails.paymentDate) {
            formErrors.paymentDate = "Payment Date is required.";
            isValid = false;
        }
        if (!paymentDetails.paymentBy) {
            formErrors.paymentBy = "Payment  By is required.";
            isValid = false;
        }
        if (!paymentDetails.advisorCode) {
            formErrors.advisorCode = "Advisor Code is required.";
            isValid = false;
        }
        if (!paymentDetails.advisorName) {
            formErrors.advisorName = "Advisor Name is required.";
            isValid = false;
        }

        setCstError(formErrors);
        return isValid;
    };


    // Handle input change for simple fields
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    // Handle input change for nested fields
    const handleNestedInputChange = (section, field, value) => {
        setFormData({
            ...formData,
            [section]: {
                ...formData[section],
                [field]: value,
            },
        });
    };



    const handleSubmit = async () => {
        if (validateForm()) {
            try {
                setProgressbar(true);
                const submitData = await axios.post("/api/loan/pay-emi", formData);
                if (submitData.data.success) {
                    setFormData({...initInput,uuid:crypto.randomUUID(),});
                    setAlert({
                        color: "success",
                        message: submitData.data.success,
                        autoDismiss: 7,
                        place: "tc",
                        display: true,
                        sweetAlert: true,
                        timestamp: new Date().getTime(),
                    });
                } else {
                    setAlert({
                        color: "warning",
                        message: submitData.data.error,
                        autoDismiss: 7,
                        place: "tc",
                        display: true,
                        sweetAlert: false,
                        timestamp: new Date().getTime(),
                    });
                }
                setProgressbar(false);
            } catch (error) {
                setAlert({
                    color: "danger",
                    message: error.toString(),
                    autoDismiss: 7,
                    place: "tc",
                    display: true,
                    sweetAlert: false,
                    timestamp: new Date().getTime(),
                });
            }
        }


    }


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
                        onCancel={() => setAlert({ ...alert, sweetAlert: false })}
                        confirmBtnBsStyle="success"
                    >
                        {alert.message}
                    </ReactBSAlert>
                )}
            </div>
            <div className="content">
                <Row>
                    <Col md="12">
                        <Card>
                            <CardHeader>
                                <CardTitle tag="h3">Loan Pre Settlement</CardTitle>
                            </CardHeader>
                            <CardBody>
                                <Form>
                                    <Row>
                                        <Col md="6">
                                            <FormGroup>
                                                <Label for="loanId" className="text-center w-100">
                                                    Select by LoanID
                                                </Label>
                                                <Input
                                                    type="select"
                                                    id="loanId"
                                                    name="loanId"
                                                    value={formData.loanId}
                                                    onChange={handleInputChange}
                                                >
                                                    <option value="">Select LoanID</option>
                                                    <option value="loan1">Loan ID 1</option>
                                                    <option value="loan2">Loan ID 2</option>
                                                    <option value="loan3">Loan ID 3</option>
                                                </Input>
                                                <p style={{ color: "red" }}>{cstError.loanId}</p>
                                                {/*<FormGroup>  for dynamic use*/    }
                                                {/*    <Input*/}
                                                {/*        type="select"*/}
                                                {/*        name="loanId"*/}
                                                {/*        value={formData.loanId}*/}
                                                {/*        onChange={handleInputChange}*/}
                                                {/*    >*/}
                                                {/*        <option value="">Select LoanID</option>*/}
                                                {/*        {loanIds.map((id) => (*/}
                                                {/*            <option key={id} value={id}>*/}
                                                {/*                {id}*/}
                                                {/*            </option>*/}
                                                {/*        ))}*/}
                                                {/*    </Input>*/}
                                                {/*</FormGroup>*/}
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                </Form>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
                <Row>
                    <Col md="12">
                        <Card>
                            <CardHeader>
                                <CardTitle tag="h3">Loan Details</CardTitle>
                            </CardHeader>
                            <CardBody>
                                <Form>
                                <Row>

                                                <Col md="3">
                                                    <Label>Loan Date*</Label>
                                                    <FormGroup>
                                                        <Input
                                                            type="date"
                                                            name="loanDate"
                                                            value={formData.loanDate}
                                                            onChange={handleInputChange}
                                                        />
                                                        <p style={{color: 'red'}}>{cstError.loanDate}</p>
                                                    </FormGroup>
                                                </Col>

                                                <Col md="3">
                                                    <Label>Code & Name</Label>
                                                    <FormGroup>
                                                        <Input
                                                            type="text"
                                                            name="codeName"
                                                            value={formData.codeName}
                                                            onChange={handleInputChange}
                                                        />
                                                        <p style={{color: 'red'}}>{cstError.codeName}</p>
                                                    </FormGroup>
                                                </Col>
                                                <Col md="3">
                                                    <Label>Relative Details</Label>
                                                    <FormGroup>
                                                        <Input
                                                            type="text"
                                                            name="relativeDetails"
                                                            value={formData.relativeDetails}
                                                            onChange={handleInputChange}
                                                        />
                                                        <p style={{color: 'red'}}>{cstError.relativeDetails}</p>
                                                    </FormGroup>
                                                </Col>
                                                <Col md="3">
                                                    <Label>Mobile No</Label>
                                                    <FormGroup>
                                                        <Input
                                                            type="number"
                                                            name="mobileNo"
                                                            value={formData.mobileNo}
                                                            onChange={handleInputChange}
                                                        />
                                                        <p style={{color: 'red'}}>{cstError.mobileNo}</p>
                                                    </FormGroup>
                                                </Col>
                                                <Col md="3">
                                                    <Label>Branch Name</Label>
                                                    <FormGroup>
                                                        <Input
                                                            type="text"
                                                            name="branchName"
                                                            value={formData.branchName}
                                                            onChange={handleInputChange}
                                                        />
                                                        <p style={{color: 'red'}}>{cstError.branchName}</p>
                                                    </FormGroup>
                                                </Col>
                                                <Col md="3">
                                                    <Label>Plan Name</Label>
                                                    <FormGroup>
                                                        <Input
                                                            type="text"
                                                            name="branchName"
                                                            value={formData.planName}
                                                            onChange={handleInputChange}
                                                        />
                                                        <p style={{color: 'red'}}>{cstError.planName}</p>
                                                    </FormGroup>
                                                </Col>
                                                <Col md="3">
                                                    <Label>Term</Label>
                                                    <FormGroup>
                                                        <Input
                                                            type="text"
                                                            name="term"
                                                            value={formData.term}
                                                            onChange={handleInputChange}
                                                        />
                                                        <p style={{color: 'red'}}>{cstError.term}</p>
                                                    </FormGroup>
                                                </Col>
                                                <Col md="3">
                                                    <Label>Loan Amount</Label>
                                                    <FormGroup>
                                                        <Input
                                                            type="text"
                                                            name="term"
                                                            value={formData.loanAmount}
                                                            onChange={handleInputChange}
                                                        />
                                                        <p style={{color: 'red'}}>{cstError.loanAmount}</p>
                                                    </FormGroup>
                                                </Col>
                                                <Col md="3">
                                                    <Label>Loan ROI</Label>
                                                    <FormGroup>
                                                        <Input
                                                            type="number"
                                                            name="loanROI"
                                                            value={formData.loanROI}
                                                            onChange={handleInputChange}
                                                        />
                                                        <p style={{color: 'red'}}>{cstError.loanROI}</p>
                                                    </FormGroup>
                                                </Col>
                                                <Col md="3">
                                                    <Label>ROI Type</Label>
                                                    <FormGroup>
                                                        <Input
                                                            type="text"
                                                            name="roiType"
                                                            value={formData.roiType}
                                                            onChange={handleInputChange}
                                                        />
                                                        <p style={{color: 'red'}}>{cstError.roiType}</p>
                                                    </FormGroup>
                                                </Col>
                                                <Col md="3">
                                                    <Label>EMI Amount</Label>
                                                    <FormGroup>
                                                        <Input
                                                            type="number"
                                                            name="emiAmount"
                                                            value={formData.emiAmount}
                                                            onChange={handleInputChange}
                                                        />
                                                        <p style={{color: 'red'}}>{cstError.emiAmount}</p>
                                                    </FormGroup>
                                                </Col>
                                                <Col md="3">
                                                    <Label>Total Interest</Label>
                                                    <FormGroup>
                                                        <Input
                                                            type="number"
                                                            name="totalInterest"
                                                            value={formData.totalInterest}
                                                            onChange={handleInputChange}
                                                        />
                                                        <p style={{color: 'red'}}>{cstError.totalInterest}</p>
                                                    </FormGroup>
                                                </Col>
                                                <Col md="3">
                                                    <Label>Total Principal</Label>
                                                    <FormGroup>
                                                        <Input
                                                            type="number"
                                                            name="totalPrincipal"
                                                            value={formData.totalPrincipal}
                                                            onChange={handleInputChange}
                                                        />
                                                        <p style={{color: 'red'}}>{cstError.totalPrincipal}</p>
                                                    </FormGroup>
                                                </Col>
                                                <Col md="3">
                                                    <Label>Total Payable</Label>
                                                    <FormGroup>
                                                        <Input
                                                            type="number"
                                                            name="totalPayable"
                                                            value={formData.totalPayable}
                                                            onChange={handleInputChange}
                                                        />
                                                        <p style={{color: 'red'}}>{cstError.totalPayable}</p>
                                                    </FormGroup>
                                                </Col>



                                </Row>
                               </Form>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>

                {/*Payment Details */}

                <Row>
                    <Col md="12">
                        <Card>
                            <CardHeader>
                                <CardTitle tag="h3">Payment Details</CardTitle>
                            </CardHeader>
                            <CardBody>
                                <Form>
                                    <Row>
                                        <Col md="3">
                                            <Label>Paid Interest</Label>
                                            <FormGroup>
                                                <Input
                                                    type="number"
                                                    name="paidInterest"
                                                    value={formData.paymentDetails.paidInterest}
                                                    onChange={(e) => handleNestedInputChange('paymentDetails', 'paidInterest', e.target.value)}
                                                />
                                                <p style={{color: 'red'}}>{cstError.paymentDetails?.paidInterest}</p>
                                            </FormGroup>
                                        </Col>
                                        <Col md="3">
                                            <Label>Paid Principal</Label>
                                            <FormGroup>
                                                <Input
                                                    type="number"
                                                    name="paidPrincipal"
                                                    value={formData.paymentDetails.paidPrincipal}
                                                    onChange={(e) => handleNestedInputChange('paymentDetails', 'paidPrincipal', e.target.value)}
                                                />
                                                <p style={{color: 'red'}}>{cstError.paymentDetails?.paidPrincipal}</p>
                                            </FormGroup>
                                        </Col>
                                        <Col md="3">
                                            <Label>Total Paid</Label>
                                            <FormGroup>
                                                <Input
                                                    type="number"
                                                    name="totalPaid"
                                                    value={formData.paymentDetails.totalPaid}
                                                    onChange={(e) => handleNestedInputChange('paymentDetails', 'totalPaid', e.target.value)}
                                                />
                                                <p style={{color: 'red'}}>{cstError.paymentDetails?.totalPaid}</p>
                                            </FormGroup>
                                        </Col>

                                        <Col md="3">
                                            <Label>Pay Branch</Label>
                                            <FormGroup>
                                                <Input
                                                    type="select"
                                                    name="payBranch"
                                                    value={formData.paymentDetails.payBranch}
                                                    onChange={(e) => handleNestedInputChange('paymentDetails', 'payBranch', e.target.value)}
                                                >
                                                    <option value="">Select Pay Branch</option>
                                                    {branchOptions.map((branch, index) => (
                                                        <option key={index} value={branch}>
                                                            {branch}
                                                        </option>
                                                    ))}
                                                </Input>
                                                <p style={{ color: 'red' }}>{cstError.paymentDetails?.payBranch}</p>
                                            </FormGroup>
                                        </Col>
                                        <Col md="3">
                                            <Label>Advance Paid</Label>
                                            <FormGroup>
                                                <Input
                                                    type="number"
                                                    name="advancePaid"
                                                    value={formData.paymentDetails.advancePaid}
                                                    onChange={(e) => handleNestedInputChange('paymentDetails', 'advancePaid', e.target.value)}
                                                />
                                                <p style={{color: 'red'}}>{cstError.paymentDetails?.advancePaid}</p>
                                            </FormGroup>
                                        </Col>
                                        <Col md="3">
                                            <Label>Closing Charge</Label>
                                            <FormGroup>
                                                <Input
                                                    type="number"
                                                    name="closingCharge"
                                                    value={formData.paymentDetails.closingCharge}
                                                    onChange={(e) => handleNestedInputChange('paymentDetails', 'closingCharge', e.target.value)}
                                                />
                                                <p style={{color: 'red'}}>{cstError.paymentDetails?.closingCharge}</p>
                                            </FormGroup>
                                        </Col>
                                        <Col md="3">
                                            <Label>Fine Due</Label>
                                            <FormGroup>
                                                <Input
                                                    type="number"
                                                    name="fineDue"
                                                    value={formData.paymentDetails.fineDue}
                                                    onChange={(e) => handleNestedInputChange('paymentDetails', 'fineDue', e.target.value)}
                                                />
                                                <p style={{color: 'red'}}>{cstError.paymentDetails?.fineDue}</p>
                                            </FormGroup>
                                        </Col>

                                        <Col md="3">
                                            <Label>Interest Due</Label>
                                            <FormGroup>
                                                <Input
                                                    type="number"
                                                    name="interestDue"
                                                    value={formData.paymentDetails.interestDue}
                                                    onChange={(e) => handleNestedInputChange('paymentDetails', 'interestDue', e.target.value)}
                                                />
                                                <p style={{color: 'red'}}>{cstError.paymentDetails?.interestDue}</p>
                                            </FormGroup>
                                        </Col>

                                        <Col md="3">
                                            <Label>Principal Due</Label>
                                            <FormGroup>
                                                <Input
                                                    type="number"
                                                    name="principalDue"
                                                    value={formData.paymentDetails.principalDue}
                                                    onChange={(e) => handleNestedInputChange('paymentDetails', 'principalDue', e.target.value)}
                                                />
                                                <p style={{color: 'red'}}>{cstError.paymentDetails?.principalDue}</p>
                                            </FormGroup>
                                        </Col>

                                        <Col md="3">
                                            <Label>Total AmountDue</Label>
                                            <FormGroup>
                                                <Input
                                                    type="number"
                                                    name="totalAmountDue"
                                                    value={formData.paymentDetails.totalAmountDue}
                                                    onChange={(e) => handleNestedInputChange('paymentDetails', 'totalAmountDue', e.target.value)}
                                                />
                                                <p style={{color: 'red'}}>{cstError.paymentDetails?.totalAmountDue}</p>
                                            </FormGroup>
                                        </Col>

                                        <Col md="3">
                                            <Label>Payment Date</Label>
                                            <FormGroup>
                                                <Input
                                                    type="date"
                                                    name="paymentDate"
                                                    value={formData.paymentDetails.paymentDate}
                                                    onChange={(e) => handleNestedInputChange('paymentDetails', 'paymentDate', e.target.value)}
                                                />
                                                <p style={{color: 'red'}}>{cstError.paymentDetails?.paymentDate}</p>
                                            </FormGroup>
                                        </Col>
                                        <Col md="3">
                                            <Label>Payment By</Label>
                                            <FormGroup>
                                                <Input
                                                    type="select"
                                                    name="paymentBy"
                                                    value={formData.paymentDetails.paymentBy}
                                                    onChange={(e) => handleNestedInputChange('paymentDetails', 'paymentBy', e.target.value)}
                                                >
                                                    <option value="">Select Payment By</option>
                                                    {paymentMethods.map((method, index) => (
                                                        <option key={index} value={method}>
                                                            {method}
                                                        </option>
                                                    ))}
                                                </Input>
                                                <p style={{ color: 'red' }}>{cstError.paymentDetails?.paymentBy}</p>
                                            </FormGroup>
                                        </Col>

                                        <Col md="3">
                                            <Label>Advisor Code</Label>
                                            <FormGroup>
                                                <Input
                                                    type="text"
                                                    name="advisorCode"
                                                    value={formData.paymentDetails.advisorCode}
                                                    onChange={(e) => handleNestedInputChange('paymentDetails', 'advisorCode', e.target.value)}
                                                />
                                                <p style={{color: 'red'}}>{cstError.paymentDetails?.advisorCode}</p>
                                            </FormGroup>
                                        </Col>
                                        <Col md="3">
                                            <Label>Advisor Name</Label>
                                            <FormGroup>
                                                <Input
                                                    type="text"
                                                    name="advisorName"
                                                    value={formData.paymentDetails.advisorName}
                                                    onChange={(e) => handleNestedInputChange('paymentDetails', 'advisorName', e.target.value)}
                                                />
                                                <p style={{color: 'red'}}>{cstError.paymentDetails?.advisorName}</p>
                                            </FormGroup>
                                        </Col>

                                        <Col md="3">
                                            <Label>remarks</Label>
                                            <FormGroup>
                                                <Input
                                                    type="text"
                                                    name="remarks"
                                                    value={formData.paymentDetails.remarks}
                                                    onChange={(e) => handleNestedInputChange('paymentDetails', 'remarks', e.target.value)}
                                                />
                                            </FormGroup>
                                        </Col>

                                    </Row>
                                </Form>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>


            </div>
        </>
    );
};

export default LoanPreSettlement;