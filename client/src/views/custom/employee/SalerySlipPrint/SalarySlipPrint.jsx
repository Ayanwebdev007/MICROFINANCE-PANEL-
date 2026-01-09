import React, { useState } from "react";
import {
    Button,
    Card,
    CardHeader,
    CardBody,
    Label,
    Input,
    Row,
    Col,
    Spinner,
} from "reactstrap";
import axios from "axios";
import Select from "react-select";
import {useSelector} from "react-redux";
import printJS from "print-js";
import CstNotification from "../../components/CstNotification";
import ReactBSAlert from "react-bootstrap-sweetalert";
import numWords from "num-words";

const SalarySlip = () => {
    const authStatus = useSelector((state) => state.auth.authState);
    const months = [
        "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
        "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"
    ];

    const [formData, setFormData] = useState({
        selectedMonth: new Date().toLocaleString("default", { month: "short" }).toUpperCase(),
        selectedYear: new Date().getFullYear().toString(),
        selectedEmployee: "",
        employeeName: "",
        employeeCode: "",
        department: "",
        designation: "",
        bankAccount: "",
        pfNumber: "",
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
        }
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
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

    const validateInput = () => {
        const tempErrors = {};
        let isValid = true;

        if (!formData.selectedEmployee) {
            tempErrors.employee = "Please select an employee";
            isValid = false;
        }
        if (!formData.selectedMonth || !months.includes(formData.selectedMonth)) {
            tempErrors.month = "Please select a valid month";
            isValid = false;
        }
        if (!formData.selectedYear.match(/^\d{4}$/)) {
            tempErrors.year = "Please enter a valid year (YYYY)";
            isValid = false;
        }

        setErrors(tempErrors);
        return isValid;
    };

    const handleSubmit = async () => {
        if (!validateInput()) return;

        try {
            setLoading(true);
            const fetchDetails = await axios.post("/api/employee/get-payslip-for-print", {
                salaryPeriod: `${formData.selectedYear}-${formData.selectedMonth}`,
                selectedEmployee: formData.selectedEmployee,
            });
            if (fetchDetails.data.success){
                setFormData({
                    ...formData,
                    ...fetchDetails.data.data,
                })
                setAlert({
                    color: 'success',
                    message: fetchDetails.data.success,
                    autoDismiss: 7,
                    place: 'tc',
                    display: true,
                    sweetAlert: false,
                    timestamp: new Date().getTime(),
                });
            }else {
                setAlert({
                    color: 'danger',
                    message: fetchDetails.data.error,
                    autoDismiss: 7,
                    place: 'tc',
                    display: true,
                    sweetAlert: false,
                    timestamp: new Date().getTime(),
                });
            }
        } catch (error) {
            setAlert({
                color: 'danger',
                message: error.message,
                autoDismiss: 7,
                place: 'tc',
                display: true,
                sweetAlert: false,
                timestamp: new Date().getTime(),
            });
        } finally {
            setLoading(false);
        }
    };

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

    function handleEmployeeSelect(value) {
        setFormData({
            ...formData,
            selectedEmployee: value.key
        });
    }

    async function printForm() {
        if (!formData.selectedEmployee) {
            setAlert({
                color: 'warning',
                message: 'Please select an employee to print salary slip.',
                autoDismiss: 7,
                place: 'tc',
                display: true,
                sweetAlert: false,
                timestamp: new Date().getTime(),
            });
            return;
        }

        printJS({

            printable: 'printable',
            type: 'html',
            css: [
                'https://stackpath.bootstrapcdn.com/bootstrap/4.6.2/css/bootstrap.min.css',
                'https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600&display=swap'
            ],
            style: `
                .salary-slip-container { font-family: 'Open Sans', sans-serif; }
                @media print {
                    body { -webkit-print-color-adjust: exact; }
                    .salary-slip-container { padding: 20px; }
                    .card { border: 1px solid #ddd; }
                    .card-header { background-color: #f8f9fa !important; }
                    .bg-light { background-color: #f8f9fa !important; }
                }
            `,
            targetStyles: ['*'],
            honorColor: true,
            maxWidth: 1000,
            font: 'Open Sans',
            documentTitle: `Salary_Slip_${formData.selectedMonth}_${formData.selectedYear}`,
            scanStyles: true,
            onLoadingStart: () => setLoading(true),
            onLoadingEnd: () => setLoading(false),
        });


        // printJS({
        //     printable: 'printable',
        //     type: 'html',
        //     targetStyles: ['*'],
        //     honorColor: false,
        // });
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
              <Card className="shadow p-4">
                  <CardHeader>
                      <h3 className="font-bold text-2xl">Salary Slip Print</h3>
                  </CardHeader>
                  <CardBody>
                      <Row className="mb-4">
                          <Col md="2">
                              <Label>Month</Label>
                              <Input
                                type="select"
                                value={formData.selectedMonth}
                                onChange={(e) => setFormData({...formData, selectedMonth: e.target.value})}
                              >
                                  {months.map((month) => (
                                    <option key={month} value={month}>
                                        {month}
                                    </option>
                                  ))}
                              </Input>
                              <p style={{color: "red"}}>{errors.month}</p>
                          </Col>
                          <Col md="2">
                              <Label>Year</Label>
                              <Input
                                type="text"
                                value={formData.selectedYear}
                                onChange={(e) => setFormData({...formData, selectedYear: e.target.value})}
                                placeholder="YYYY"
                              />
                              <p style={{color: "red"}}>{errors.year}</p>
                          </Col>
                          <Col md="3">
                              <Label>Select Employee</Label>
                              <Select
                                className="react-select info"
                                classNamePrefix="react-select"
                                name="employeeSelect"
                                onChange={handleEmployeeSelect}
                                options={employeeDropdown}
                                placeholder="Select an Employee"
                              />
                              <p style={{color: "red"}}>{errors.employee}</p>
                          </Col>
                          <Col md="4" className="d-flex align-items-end">
                              <Button color="success" onClick={handleSubmit} disabled={loading}>
                                  {loading ? <Spinner size="sm"/> : <> GET</>}
                              </Button>
                              <Button className={"btn bg-success mt-4"} type="button" onClick={printForm}>
                                  <i className="tim-icons icon-notes mr-2"/> Print Slip
                              </Button>
                          </Col>
                      </Row>
                  </CardBody>
                  <CardBody>
                      
                      <div className="salary-slip-container p-4" id="printable">
                          {/* Company Logo */}
                          <div className="text-center mb-4">
                              <img
                                src={authStatus.bankInfo.logo}
                                alt="Company Logo"
                                style={{height: '80px', maxWidth: '200px'}}
                              />
                          </div>
                          {/* Company Header */}
                          
                          <div className="text-center mb-4">
                              <h2 className="company-name" style={{margin: 0}}>{authStatus.bankInfo.bankName}</h2>
                              <p className="company-address">{authStatus.bankInfo.address}</p>
                              <h3 className="mt-3" style={{fontWeight: "bold"}}>SALARY SLIP for {formData.selectedMonth} {formData.selectedYear}</h3>
                              {/*<p>For the month of {formData.selectedMonth} {formData.selectedYear}</p>*/}
                          </div>

                          {/* Employee Details */}
                          
                          <div className="employee-details mb-4">
                              <table className="table table-bordered">
                                  <tbody>
                                  <tr>
                                      <td width="25%" className="bg-light"><strong>Employee Name</strong></td>
                                      <td width="25%">{formData.employeeName || ''}</td>
                                      <td width="25%" className="bg-light"><strong>Employee ID</strong></td>
                                      <td width="25%">{formData.employeeCode || ''}</td>
                                  </tr>
                                  <tr>
                                      <td className="bg-light"><strong>Department</strong></td>
                                      <td>{formData.department || ''}</td>
                                      <td className="bg-light"><strong>Designation</strong></td>
                                      <td>{formData.designation || ''}</td>
                                  </tr>
                                  <tr>
                                      <td className="bg-light"><strong>Bank Account</strong></td>
                                      <td colSpan="3">{formData.bankAccount || ''}</td>
                                  </tr>
                                  </tbody>
                              </table>
                          </div>

                          {/* Salary Details */}
                          <div className="salary-details-section mb-4">
                              <table className="table table-bordered">
                                  <thead className="bg-light">
                                  <tr>
                                      <th colSpan="2" className="text-center bg-success text-white">Earnings</th>
                                      <th colSpan="2" className="text-center bg-danger text-white">Deductions</th>
                                  </tr>
                                  </thead>
                                  <tbody>
                                  <tr>
                                      <td width="25%">Basic Pay</td>
                                      <td width="25%"
                                          className="text-right">₹ {new Intl.NumberFormat('en-IN').format(formData.salaryDetails?.basic || 0)}
                                      </td>
                                      <td width="25%">Provident Fund (PF)</td>
                                      <td width="25%"
                                          className="text-right">₹ {new Intl.NumberFormat('en-IN').format(formData.salaryDetails?.pf || 0)}
                                      </td>
                                  </tr>
                                  <tr>
                                      <td>House Rent Allowance (HRA)</td>
                                      <td
                                        className="text-right">₹ {new Intl.NumberFormat('en-IN').format(formData.salaryDetails?.hra || 0)}
                                      </td>
                                      <td>Employee State Insurance (ESI)</td>
                                      <td
                                        className="text-right">₹ {new Intl.NumberFormat('en-IN').format(formData.salaryDetails?.esi || 0)}
                                      </td>
                                  </tr>
                                  <tr>
                                      <td>Dearness Allowance (DA)</td>
                                      <td
                                        className="text-right">₹ {new Intl.NumberFormat('en-IN').format(formData.salaryDetails?.da || 0)}
                                      </td>
                                      <td></td>
                                      <td></td>
                                  </tr>
                                  <tr>
                                      <td>Travel Allowance (TA)</td>
                                      <td
                                        className="text-right">₹ {new Intl.NumberFormat('en-IN').format(formData.salaryDetails?.ta || 0)}</td>
                                      <td></td>
                                      <td></td>
                                  </tr>
                                  <tr>
                                      <td>Other Allowances</td>
                                      <td
                                        className="text-right">₹ {new Intl.NumberFormat('en-IN').format(formData.salaryDetails?.allowance || 0)}</td>
                                      <td></td>
                                      <td></td>
                                  </tr>
                                  <tr>
                                      <td>Other Benefit</td>
                                      <td
                                        className="text-right">₹ {new Intl.NumberFormat('en-IN').format(formData.salaryDetails?.others || 0)}</td>
                                      <td></td>
                                      <td></td>
                                  </tr>
                                  <tr className="bg-light font-weight-bold">
                                      <td>Total Earnings</td>
                                      <td
                                        className="text-right">₹ {new Intl.NumberFormat('en-IN').format(formData.salaryDetails?.grossPay || 0)}</td>
                                      <td>Total Deductions</td>
                                      <td
                                        className="text-right">₹ {new Intl.NumberFormat('en-IN').format((formData.salaryDetails?.pf || 0) + (formData.salaryDetails?.esi || 0))}</td>
                                  </tr>
                                  </tbody>
                              </table>
                          </div>

                          {/* Totals */}
                          <div className="net-pay-section p-3 bg-light border rounded">
                              <table className="table table-borderless mb-0">
                                  <tbody>
                                  <tr className="h5">
                                      <td className="text-right" width="50%">
                                          <strong>Net Pay:</strong>
                                      </td>
                                      <td className="text-left" width="50%">
                                          <strong>₹ {new Intl.NumberFormat('en-IN').format(formData.salaryDetails?.netPay || 0)}</strong>
                                      </td>
                                  </tr>
                                  
                                  <tr>
                                      <td colSpan="2" className="text-center">
                                          <small className="text-muted">Amount in words:
                                              Rupees {numWords(Math.floor(formData.salaryDetails?.netPay || 0))} Only</small>
                                      </td>
                                  </tr>
                                  </tbody>
                              </table>
                          </div>

                          {/* Signature Section */}
                          
                          <div className="signature-section mt-5">
                              <Row>
                                  <Col md={{size: 4, offset: 8}}>
                                      <div className="text-center">
                                          <div className="signature-line"
                                               style={{borderTop: '1px solid #000', marginTop: '50px'}}>
                                              <p className="mt-2">Authorized Signatory</p>
                                          </div>
                                      </div>
                                  </Col>
                              </Row>
                          </div>
                      </div>
                  </CardBody>
              </Card>
          </div>
      </>
    );
};


export default SalarySlip;
