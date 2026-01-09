import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Row,
  Col,
  Form,
  FormGroup,
  Label,
  Input,
  Button,
} from "reactstrap";
import {useNavigate} from "react-router-dom";



const MembershipFeeForm = () => {
  const [formData, setFormData] = useState({
    transactionDate: new Date().toISOString().slice(0, 10),
    membershipFee: 0,
    gstRate: 0,
    totalAmount: 0,
    netFeeToCollect: 0,
    remarks: "",
    payMode: "cash",
  });

  const navigate = useNavigate();

  // Auto calculate
  useEffect(() => {
    const fee = parseFloat(formData.membershipFee) || 0;
    const gstRate = parseFloat(formData.gstRate) || 0;
    const gstAmount = (fee * gstRate) / 100;
    const total = fee + gstAmount;

    setFormData((prev) => ({
      ...prev,
      totalAmount: parseFloat(total.toFixed(2)),
      netFeeToCollect: parseFloat(total.toFixed(2)),
    }));
  }, [formData.membershipFee, formData.gstRate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "radio" ? value : type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form Submitted:", formData);
    alert("Membership Fee Saved!");
  };

  const handleCancel = () => {
    setFormData({
      transactionDate: new Date().toISOString().slice(0, 10),
      membershipFee: 0,
      gstRate: 0,
      totalAmount: 0,
      netFeeToCollect: 0,
      remarks: "",
      payMode: "cash",
    });
  };

  return (
    <div className="content d-flex justify-content-center align-items-start py-4">
      <Col md="8" lg="6">
        <Card className="shadow-lg border-0 rounded-3">
          <CardHeader className="bg-secondary text-white text-center py-3">
            <h4 className="mb-0">Membership Fee Form</h4>
          </CardHeader>
          <CardBody className="p-4">
            <Form onSubmit={handleSubmit}>
              {/* Transaction Date */}
              <FormGroup>
                <Label for="transactionDate">Transaction Date *</Label>
                <Input
                  type="date"
                  name="transactionDate"
                  id="transactionDate"
                  value={formData.transactionDate}
                  onChange={handleChange}
                  required
                />
              </FormGroup>

              {/* Membership Fee & GST */}
              <Row form className="mt-3">
                <Col md={6}>
                  <FormGroup>
                    <Label for="membershipFee">Membership Fee</Label>
                    <Input
                      type="number"
                      name="membershipFee"
                      id="membershipFee"
                      value={formData.membershipFee}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                    />
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label for="gstRate">GST Rate (%)</Label>
                    <Input
                      type="number"
                      name="gstRate"
                      id="gstRate"
                      value={formData.gstRate}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                    />
                  </FormGroup>
                </Col>
              </Row>

              {/* Total Amount */}
              <FormGroup className="mt-3">
                <Label for="totalAmount">Total Amount</Label>
                <Input
                  type="text"
                  name="totalAmount"
                  id="totalAmount"
                  value={formData.totalAmount}
                  readOnly
                  style={{ backgroundColor: "#f8f9fa", cursor: "not-allowed" }}
                />
              </FormGroup>

              {/* Net Fee */}
              <FormGroup className="mt-3">
                <Label for="netFeeToCollect">Net Fee to Collect *</Label>
                <Input
                  type="text"
                  name="netFeeToCollect"
                  id="netFeeToCollect"
                  value={formData.netFeeToCollect}
                  readOnly
                  style={{ backgroundColor: "#f8f9fa", cursor: "not-allowed" }}
                />
              </FormGroup>

              {/* Remarks */}
              <FormGroup className="mt-3">
                <Label for="remarks">Remarks (if any)</Label>
                <Input
                  type="textarea"
                  name="remarks"
                  id="remarks"
                  value={formData.remarks}
                  onChange={handleChange}
                  rows="2"
                />
              </FormGroup>

              {/* Pay Mode */}
              <FormGroup tag="fieldset" className="mt-3">
                <legend className="col-form-label">Pay Mode</legend>
                <Row>
                  <Col xs={12} sm={4}>
                    <FormGroup check>
                      <Label check>
                        <Input
                          type="radio"
                          name="payMode"
                          value="cash"
                          checked={formData.payMode === "cash"}
                          onChange={handleChange}
                        />
                        Cash
                      </Label>
                    </FormGroup>
                  </Col>
                  <Col xs={12} sm={4}>
                    <FormGroup check>
                      <Label check>
                        <Input
                          type="radio"
                          name="payMode"
                          value="online"
                          checked={formData.payMode === "online"}
                          onChange={handleChange}
                        />
                        Online
                      </Label>
                    </FormGroup>
                  </Col>
                  <Col xs={12} sm={4}>
                    <FormGroup check>
                      <Label check>
                        <Input
                          type="radio"
                          name="payMode"
                          value="cheque"
                          checked={formData.payMode === "cheque"}
                          onChange={handleChange}
                        />
                        Cheque
                      </Label>
                    </FormGroup>
                  </Col>
                </Row>
              </FormGroup>


              {/* Buttons */}
              <div className="d-flex justify-content-end mt-4">
                <Button color="success" className="me-2" type="submit">
                  SAVE
                </Button>
                {/*<Button color="secondary" type="button" onClick={handleCancel}>*/}
                <Button color="secondary" type="button" onClick={()=>navigate(-1)}>
                  CANCEL
                </Button>
              </div>
            </Form>
          </CardBody>
        </Card>
      </Col>
    </div>
  );
};

export default MembershipFeeForm;
