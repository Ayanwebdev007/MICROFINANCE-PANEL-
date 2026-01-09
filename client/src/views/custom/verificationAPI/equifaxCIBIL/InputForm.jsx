import React from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Form,
  FormGroup,
  Label,
  Input,
  Button,
  Row,
  Col, CardTitle,
} from "reactstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./Datepicker.css"


const InputForm = ({formData, setFormData, handleSubmit, resetCibilReport}) => {

  const handleInputChange = (e) => {
    const {name, value} = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle tag="h3">User Details</CardTitle>
        </CardHeader>
        <CardBody>
          <Form autoComplete={'off'}>
            <Row>
              <Col md="6">
                <FormGroup>
                  <Label>Full Name</Label>
                  <Input
                    type="text"
                    name="fullname"
                    value={formData.fullname}
                    onChange={handleInputChange}
                    required
                  />
                </FormGroup>
              </Col>
              <Col md="6">
                <FormGroup>
                  <Label>Mobile Number</Label>
                  <Input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    pattern="[0-9]{10}"
                    required
                  />
                </FormGroup>
              </Col>
            </Row>
            <Row>
              <Col md="6">
                <FormGroup>
                  <Label>PAN Number</Label>
                  <Input
                    type="text"
                    name="pan"
                    value={formData.pan}
                    onChange={handleInputChange}
                    pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
                    required
                  />
                </FormGroup>
              </Col>
              <Col md="6">
                <FormGroup>
                  <Label>Date of Birth</Label>
                  <div style={{ width: '100%' }}>
                    <DatePicker
                        selected={formData.dob ? new Date(formData.dob) : null}
                        onChange={(date) =>
                            setFormData((prev) => ({
                              ...prev,
                              dob: date.toISOString().split("T")[0], // save as yyyy-mm-dd
                            }))
                        }
                        dateFormat="dd/MM/yyyy"
                        placeholderText="Select date"
                        className="form-control"
                        maxDate={new Date()}
                        showMonthDropdown
                        showYearDropdown
                        dropdownMode="select"
                        popperClassName="react-datepicker-popper"
                        popperPlacement="bottom-start"
                    />
                  </div>

                </FormGroup>
              </Col>
            </Row>
            <Row>
              <Col md="4">
                <FormGroup>
                  <Label>Pincode</Label>
                  <Input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    pattern="[0-9]{6}"
                    required
                  />
                </FormGroup>
              </Col>
            </Row>
            <center>
              <Button color="info" type="button" onClick={() => handleSubmit(false)}>
                Submit
              </Button>
              <Button color="primary" onClick={resetCibilReport}>
                <i className="tim-icons icon-refresh-02 mr-2" /> Check New CIBIL Report
              </Button>

            </center>
          </Form>
        </CardBody>
      </Card>
    </div>);
};

export default InputForm;