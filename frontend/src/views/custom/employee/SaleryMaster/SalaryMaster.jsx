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
  Input,
  Row,
  Col,
  Spinner,
} from "reactstrap";
import CstNotification from "../../components/CstNotification";
import ReactBSAlert from "react-bootstrap-sweetalert";
import axios from "axios";
import Select from "react-select";

const SalaryMaster = () => {
  const initInput = {
    employeeCode: "",
    basic: "",
    hra: "",
    da: "",
    ta: "",
    allowance: "",
    others: "",
    grossPay: "",
    pf: "",
    esi: "",
    netPay: "",
  };

  const [salaryData, setSalaryData] = React.useState(initInput);
  const [errors, setErrors] = React.useState({employeeCode: ""});
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

    if (!salaryData.employeeCode) {
      tempErrors.employeeCode = "Employee code is required";
      isValid = false;
    }

    setErrors(tempErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (validateInput()) {
      try {
        setLoading(true);
        const response = await axios.post("/api/employee/salary-master", salaryData);
        if (response.data.success) {
          setAlert({
            color: 'success',
            message: response.data.success,
            autoDismiss: 7,
            place: 'tc',
            display: false,
            sweetAlert: true,
            timestamp: new Date().getTime(),
          });
          setSalaryData(initInput);
        }else {
          setAlert({
            color: 'success',
            message: response.data.error,
            autoDismiss: 7,
            place: 'tc',
            display: false,
            sweetAlert: true,
            timestamp: new Date().getTime(),
          });
        }
      } catch (error) {
        setAlert({
          color: "danger",
          message: error.message || "Something went wrong",
          display: true,
        });
      } finally {
        setLoading(false);
      }
    }
  };

  function handleEmployeeSelect(value) {
    setSalaryData({
      ...salaryData,
      employeeCode: value.key,
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
        {/* Search Section */}
        <Row>
          <Col md="12">
            <Card>
              <CardHeader>
                <CardTitle tag="h3">Search Employee</CardTitle>
              </CardHeader>
              <CardBody>
                <Row>
                  <Col md="4">
                    <FormGroup>
                      <Label>Employee Code</Label>
                      <Select
                        className="react-select info"
                        classNamePrefix="react-select"
                        name="employeeSelect"
                        onChange={handleEmployeeSelect}
                        options={employeeDropdown}
                        placeholder="Select an Employee"
                      />
                      <p style={{ color: "red" }}>{errors.employeeCode}</p>
                    </FormGroup>
                  </Col>
                </Row>
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* Salary Details Form */}
        <Row>
          <Col md="12">
            <Card>
              <CardHeader>
                <CardTitle tag="h3">Salary Details</CardTitle>
              </CardHeader>
              <CardBody>
                <Row>
                  <Col md="4">
                    <FormGroup>
                      <Label>Basic Salary</Label>
                      <Input
                        type="number"
                        name="basic"
                        placeholder="Enter basic salary"
                        value={salaryData.basic}
                        onChange={(e) => setSalaryData({ ...salaryData, basic: e.target.value })}
                      />
                    </FormGroup>
                  </Col>
                  <Col md="4">
                    <FormGroup>
                      <Label>HRA</Label>
                      <Input
                        type="number"
                        name="hra"
                        placeholder="Enter House Rent Allowance"
                        value={salaryData.hra}
                        onChange={(e) => setSalaryData({ ...salaryData, hra: e.target.value })}
                      />
                    </FormGroup>
                  </Col>
                  <Col md="4">
                    <FormGroup>
                      <Label>DA</Label>
                      <Input
                        type="number"
                        name="da"
                        placeholder="Enter DA"
                        value={salaryData.da}
                        onChange={(e) => setSalaryData({ ...salaryData, da: e.target.value })}
                      />
                    </FormGroup>
                  </Col>
                  <Col md="4">
                    <FormGroup>
                      <Label>TA</Label>
                      <Input
                        type="number"
                        name="ta"
                        placeholder="Enter TA"
                        value={salaryData.ta}
                        onChange={(e) => setSalaryData({ ...salaryData, ta: e.target.value })}
                      />
                    </FormGroup>
                  </Col>
                  <Col md="4">
                    <FormGroup>
                      <Label>Allowance</Label>
                      <Input
                        type="number"
                        name="allowance"
                        placeholder="Enter allowance"
                        value={salaryData.allowance}
                        onChange={(e) => setSalaryData({ ...salaryData, allowance: e.target.value })}
                      />
                    </FormGroup>
                  </Col>
                  <Col md="4">
                    <FormGroup>
                      <Label>Others</Label>
                      <Input
                        type="number"
                        name="others"
                        placeholder="Enter others"
                        value={salaryData.others}
                        onChange={(e) => setSalaryData({ ...salaryData, others: e.target.value })}
                      />
                    </FormGroup>
                  </Col>
                  <Col md="4">
                    <FormGroup>
                      <Label>Gross Pay</Label>
                      <Input
                        type="number"
                        name="grossPay"
                        placeholder="Enter gross pay"
                        value={salaryData.grossPay}
                        onChange={(e) => setSalaryData({ ...salaryData, grossPay: e.target.value })}
                      />
                    </FormGroup>
                  </Col>
                  <Col md="4">
                    <FormGroup>
                      <Label>PF</Label>
                      <Input
                        type="number"
                        name="pf"
                        placeholder="Enter PF"
                        value={salaryData.pf}
                        onChange={(e) => setSalaryData({ ...salaryData, pf: e.target.value })}
                      />
                    </FormGroup>
                  </Col>
                  <Col md="4">
                    <FormGroup>
                      <Label>ESI</Label>
                      <Input
                        type="number"
                        name="esi"
                        placeholder="Enter ESI"
                        value={salaryData.esi}
                        onChange={(e) => setSalaryData({ ...salaryData, esi: e.target.value })}
                      />
                    </FormGroup>
                  </Col>
                  <Col md="4">
                    <FormGroup>
                      <Label>Net Pay</Label>
                      <Input
                        type="number"
                        name="netPay"
                        placeholder="Enter net pay"
                        value={salaryData.netPay}
                        onChange={(e) => setSalaryData({ ...salaryData, netPay: e.target.value })}
                      />
                    </FormGroup>
                  </Col>
                </Row>
              </CardBody>
              <CardFooter>
                <center>
                  <Spinner color="info" hidden={!loading} />
                  <Button
                    className="btn-fill"
                    color="info"
                    type="button"
                    onClick={handleSubmit}
                  >
                    Save Salary Details
                  </Button>
                </center>
              </CardFooter>
            </Card>
          </Col>
        </Row>

        {/* Salary Table */}
        {/*<Row>*/}
        {/*  <Col md="12">*/}
        {/*    <Card>*/}
        {/*      <CardHeader>*/}
        {/*        <CardTitle tag="h3">Salary Records</CardTitle>*/}
        {/*      </CardHeader>*/}
        {/*      <CardBody>*/}
        {/*        <Table striped>*/}
        {/*          <thead>*/}
        {/*          <tr>*/}
        {/*            <th>EMP CODE</th>*/}
        {/*            <th>BASIC</th>*/}
        {/*            <th>HRA</th>*/}
        {/*            <th>DA</th>*/}
        {/*            <th>TA</th>*/}
        {/*            <th>ALLOWANCE</th>*/}
        {/*            <th>OTHERS</th>*/}
        {/*            <th>Gross Pay</th>*/}
        {/*            <th>PF</th>*/}
        {/*            <th>ESI</th>*/}
        {/*            <th>Net Pay</th>*/}
        {/*          </tr>*/}
        {/*          </thead>*/}
        {/*          <tbody>*/}
        {/*          <tr>*/}
        {/*            <td>EMP0001</td>*/}
        {/*            <td>5000</td>*/}
        {/*            <td>1000</td>*/}
        {/*            <td>0</td>*/}
        {/*            <td>1560</td>*/}
        {/*            <td>1000</td>*/}
        {/*            <td>0</td>*/}
        {/*            <td>8560</td>*/}
        {/*            <td>0</td>*/}
        {/*            <td>0</td>*/}
        {/*            <td>8560</td>*/}
        {/*          </tr>*/}
        {/*          </tbody>*/}
        {/*        </Table>*/}
        {/*      </CardBody>*/}
        {/*    </Card>*/}
        {/*  </Col>*/}
        {/*</Row>*/}
      </div>
    </>
  );
};

export default SalaryMaster;