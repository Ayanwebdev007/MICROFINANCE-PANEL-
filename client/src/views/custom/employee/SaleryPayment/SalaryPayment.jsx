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
import CstNotification from "../../components/CstNotification";
import ReactBSAlert from "react-bootstrap-sweetalert";
import axios from "axios";
import Select from "react-select";

const SalaryPayment = () => {
  const months = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];
  const currentMonth = new Date().toLocaleString("default", { month: "short" }).toUpperCase();
  const currentYear = new Date().getFullYear();

  const initInput = {
    selectedMonth: currentMonth,
    selectedYear: currentYear.toString(),
    selectedEmployee: "",
    salaryDetails: {
      basic: "",
      hra: "",
      da: "",
      ta: "",
      allowance: "",
      others: "",
      pf: "",
      esi: "",
      netPay: "",
      payBranch: "",
    },
    payDate: "",
    narration: "",
  };

  const [formData, setFormData] = React.useState(initInput);
  const [errors, setErrors] = React.useState({});
  const [loading, setLoading] = React.useState(false);
  const [fetched, setFetched] = React.useState(false);
  const [employeeDropdown, setEmployeeDropdown] = React.useState([]);
  const [alert, setAlert] = React.useState({
    color: "success",
    message: "",
    autoDismiss: 7,
    place: "tc",
    display: false,
    sweetAlert: false,
    timestamp: new Date().getTime(),
  });

  React.useEffect(() => {
    if (!fetched) {
      setFetched(true);
      setLoading(true);
      axios.get('/api/employee/get-employee-list')
        .then(res => {
          if (res.data.success) {
            processEmployeeData(res.data.employeeList);
          }else {
            setAlert({
              color: 'warning',
              message: res.data.warning,
              autoDismiss: 7,
              place: 'tc',
              display: true,
              sweetAlert: false,
              timestamp: new Date().getTime(),
            });
          }
          setLoading(false);
        })
        .catch(err => {
          setAlert({
            color: 'danger',
            message: err.message,
            autoDismiss: 7,
            place: 'tc',
            display: true,
            sweetAlert: false,
            timestamp: new Date().getTime(),
          });
          setLoading(false);
        });
    }
  }, [fetched]);

  function processEmployeeData(data) {
    const employeeList = [];
    data.forEach(element => {
      employeeList.push({
        label: `${element.employeeName} (${element.employeeCode})`,
        obj: element,
        key: element.id,
      });
    });
    setEmployeeDropdown(employeeList);
  }

  const validateInput = () => {
    const tempErrors = {};
    let isValid = true;

    if (!formData.selectedMonth || !months.includes(formData.selectedMonth)) {
      tempErrors.month = "Please select a valid month";
      isValid = false;
    }
    if (!formData.selectedYear.match(/^\d{4}$/)) {
      tempErrors.year = "Please enter a valid year (YYYY)";
      isValid = false;
    }
    if (!formData.selectedEmployee) {
      tempErrors.employee = "Please select an employee";
      isValid = false;
    }
    if (!formData.salaryDetails.netPay || isNaN(formData.salaryDetails.netPay)) {
      tempErrors.netPay = "Net pay is required and must be numeric";
      isValid = false;
    }
    if (!formData.salaryDetails.payDate) {
      tempErrors.payDate = "Payment date is required";
      isValid = false;
    }

    setErrors(tempErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateInput()) return;

    try {
      setLoading(true);
      const response = await axios.post("/api/employee/salary-payment", {
        salaryPeriod: `${formData.selectedYear}-${formData.selectedMonth}`,
        employeeCode: formData.selectedEmployee,
        ...formData,
      });
      if (response.data.success) {
        setAlert({
          color: "success",
          message:  response.data.success,
          autoDismiss: 7,
          place: "tc",
          display: false,
          sweetAlert: true,
          timestamp: new Date().getTime(),
        });
      }else {
        setAlert({
          color: "warning",
          message:  response.data.error,
          autoDismiss: 7,
          place: "tc",
          display: true,
          sweetAlert: false,
          timestamp: new Date().getTime(),
        })
      }

      // Reset form fields
      setFormData({ ...initInput, selectedMonth: currentMonth, selectedYear: currentYear.toString() });

    } catch (error) {
      setAlert({
        color: "danger",
        message: error.toLocaleString(),
        display: true,
        autoDismiss: 7,
        place: 'tc',
        sweetAlert: false,
        timestamp: new Date().getTime(),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      salaryDetails: { ...formData.salaryDetails, [name]: value },
    });
  };

  function handleEmployeeSelect(value) {
    setFormData({
      ...formData,
      selectedEmployee: value.key,
      narration: `${formData.selectedMonth} month Salary payment for ${value.obj.employeeName}(${value.obj.employeeCode})`,
      salaryDetails: {
        ...value.obj.salary,
        basic: value.obj.salary.basic || 0,
        hra: value.obj.salary.hra || 0,
        da: value.obj.salary.da || 0,
        ta: value.obj.salary.ta || 0,
        allowance: value.obj.salary.allowance || 0,
        others: value.obj.salary.others || 0,
        grossPay: value.obj.salary.grossPay || 0,
        pf: value.obj.salary.pf || 0,
        esi: value.obj.salary.esi || 0,
        netPay: value.obj.salary.netPay || 0,
      },
    });
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
                <CardTitle tag="h3">Salary Payment</CardTitle>
              </CardHeader>
              <CardBody>
                <Row>
                  {/* Search Section */}
                  <Col md={12}>
                    <Form>
                      <Row>
                        <Col className="pr-1" md="3">
                          <Label>Month</Label>
                          <Input
                            type="select"
                            value={formData.selectedMonth}
                            onChange={(e) =>
                              setFormData({ ...formData, selectedMonth: e.target.value })
                            }
                          >
                            {months.map((month) => (
                              <option key={month} value={month}>
                                {month}
                              </option>
                            ))}
                          </Input>
                          <p style={{ color: "red" }}>{errors.month}</p>
                        </Col>
                        <Col className="pr-1" md="3">
                          <Label>Year</Label>
                          <FormGroup>
                            <Input
                              type="text"
                              placeholder="YYYY"
                              value={formData.selectedYear}
                              onChange={(e) =>
                                setFormData({ ...formData, selectedYear: e.target.value })
                              }
                            />
                            <p style={{ color: "red" }}>{errors.year}</p>
                          </FormGroup>
                        </Col>
                        <Col className="pr-1" md="3">
                          <Label>Select Employee</Label>
                          <FormGroup>
                            <Select
                              className="react-select info"
                              classNamePrefix="react-select"
                              name="employeeSelect"
                              onChange={handleEmployeeSelect}
                              options={employeeDropdown}
                              placeholder="Select an Employee"
                            />
                            <p style={{ color: "red" }}>{errors.employee}</p>
                          </FormGroup>
                        </Col>
                      </Row>

                      <div className="border-t border-green-500 my-4"></div>

                      {/* Salary Details Section */}
                      <Row>
                        {/* Row 1 */}
                        <Col md="3">
                          <FormGroup>
                            <Label>Basic</Label>
                            <Input
                              type="text"
                              name="basic"
                              value={formData.salaryDetails.basic}
                              readOnly={true}
                            />
                          </FormGroup>
                        </Col>

                        <Col md="3">
                          <FormGroup>
                            <Label>HRA</Label>
                            <Input
                              type="text"
                              name="hra"
                              value={formData.salaryDetails.hra}
                              readOnly={true}
                            />
                          </FormGroup>
                        </Col>

                        <Col md="3">
                          <FormGroup>
                            <Label>DA</Label>
                            <Input
                              type="text"
                              name="da"
                              value={formData.salaryDetails.da}
                              readOnly={true}
                            />
                          </FormGroup>
                        </Col>

                        <Col md="3">
                          <FormGroup>
                            <Label>TA</Label>
                            <Input
                              type="text"
                              name="ta"
                              value={formData.salaryDetails.ta}
                              readOnly={true}
                            />
                          </FormGroup>
                        </Col>

                        {/* Row 2 */}
                        <Col md="3">
                          <FormGroup>
                            <Label>Allowance</Label>
                            <Input
                              type="text"
                              name="allowance"
                              value={formData.salaryDetails.allowance}
                              readOnly={true}
                            />
                          </FormGroup>
                        </Col>

                        <Col md="3">
                          <FormGroup>
                            <Label>Others</Label>
                            <Input
                              type="text"
                              name="others"
                              value={formData.salaryDetails.others}
                              readOnly={true}
                            />
                          </FormGroup>
                        </Col>

                        <Col md="3">
                          <FormGroup>
                            <Label>PF</Label>
                            <Input
                              type="text"
                              name="pf"
                              value={formData.salaryDetails.pf}
                              readOnly={true}
                            />
                          </FormGroup>
                        </Col>

                        <Col md="3">
                          <FormGroup>
                            <Label>ESI</Label>
                            <Input
                              type="text"
                              name="esi"
                              value={formData.salaryDetails.esi}
                              readOnly={true}
                            />
                          </FormGroup>
                        </Col>

                        <Col md="3">
                          <FormGroup>
                            <Label>Gross Pay</Label>
                            <Input
                              type="text"
                              name="netPay"
                              value={formData.salaryDetails.grossPay}
                              readOnly={true}
                            />
                          </FormGroup>
                        </Col>
                        <Col md="3">
                          <FormGroup>
                            <Label>Net Pay</Label>
                            <Input
                              type="text"
                              name="netPay"
                              value={formData.salaryDetails.netPay}
                              readOnly={true}
                            />
                          </FormGroup>
                        </Col>
                        <Col md="3">
                          <FormGroup>
                            <Label>Pay Date</Label>
                            <Input
                              type="date"
                              name="payDate"
                              value={formData.salaryDetails.payDate}
                              onChange={handleChange}
                            />
                            <p style={{ color: "red" }}>{errors.payDate}</p>
                          </FormGroup>
                        </Col>
                        <Col md="12">
                          <FormGroup>
                            <Label>Narration</Label>
                            <FormGroup>
                              <Input type={'textarea'} value={formData.narration} aria-colspan={3}
                                     onChange={(event) => setFormData({...formData, narration: event.target.value})}
                              />
                            </FormGroup>
                          </FormGroup>
                        </Col>
                      </Row>
                    </Form>
                  </Col>
                </Row>
              </CardBody>
              <CardFooter className="d-flex justify-content-center mt-4">
                <Button
                  className="btn-fill"
                  color="info"
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? <Spinner size="sm" /> : "PAY SALARY"}
                </Button>
              </CardFooter>

            </Card>
          </Col>
        </Row>
      </div>
    </>
  );
};

export default SalaryPayment;