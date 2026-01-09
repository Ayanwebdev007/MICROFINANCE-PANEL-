import React from "react";
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  Label,
  FormGroup,
  Form,
  Row,
  Col,
} from "reactstrap";
import CstNotification from "../../components/CstNotification";
import ReactBSAlert from "react-bootstrap-sweetalert";
import axios from "axios";
import printJS from "print-js";
import styled from '@emotion/styled';
import Select from "react-select";
import {useSelector} from "react-redux";
import {LinearProgress, TextField} from "@mui/material";

// Styled components should be created outside the component to preserve identity across renders
const Container = styled.div`
    font-family: Arial, sans-serif;
    line-height: 1.6;
    margin: 40px;
`;

const Header = styled.div`
    text-align: center;
    margin-bottom: 30px;
`;

const Logo = styled.img`
    max-width: 150px;
`;

const CompanyInfo = styled.div`
    margin-bottom: 15px;
`;

const StyledDate = styled.div`
    text-align: right;
    margin-bottom: 20px;
`;

const Content = styled.div`
    margin-bottom: 30px;
`;

const Signature = styled.div`
    margin-top: 50px;
`;

const Table = styled.table`
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;

    th, td {
        padding: 8px;
        border: 1px solid #ddd;
    }

    th {
        background-color: #f5f5f5;
    }
`;

const OfferLetter = () => {
  const defaultBenefits = JSON.stringify([
    'Health Insurance coverage for you and immediate family',
    '20 days of paid annual leave',
    'Performance bonus up to 15% of annual salary',
    'Retirement plan with company matching'
  ]);
  const defaultTerms = JSON.stringify([
    "Your employment is subject to a probationary period of 3 months.",
    "Working hours are from Monday to Friday, 9:00 AM to 6:00 PM.",
    "You will be required to sign a non-disclosure agreement.",
    "Your employment may be terminated with one month's notice from either party.",
    "This offer is contingent upon satisfactory background verification.",
    "You will be required to comply with all company policies and procedures.",
    "The company reserves the right to modify terms of employment as necessary.",
    "Unauthorized absence for more than 3 consecutive days will result in termination.",
    "Any disputes will be subject to the jurisdiction of local courts."
  ]);
  const [benefits, setBenefits] = React.useState(JSON.parse(defaultBenefits));
  const [terms, setTerms] = React.useState(JSON.parse(defaultTerms));
  const [editMode, setEditMode] = React.useState(false);
  const initInput = {
    employeeName: '',
    employeeCode: '',
    jobTitle: '',
    date: '',
    salary: {},
  }
  const [loading, setLoading] = React.useState(true);
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
  const [employeeDetails, setEmployeeDetails] = React.useState(initInput);
  const authStatus = useSelector((state) => state.auth.authState);

  React.useEffect(() => {
    if (!fetched) {
      setFetched(true);
      setLoading(true);
      // Fetch offer letter defaults first
      axios.get('/api/employee/offer-letter-defaults')
        .then(def => {
          if (def.data && (def.data.success || def.data.warning)) {
            const data = (def.data.data) || {};
            if (Array.isArray(data.benefits) && data.benefits.length > 0) {
              setBenefits(data.benefits);
            }
            if (Array.isArray(data.terms) && data.terms.length > 0) {
              setTerms(data.terms);
            }
          }
        })
        .catch(() => {/* ignore defaults fetch errors, fall back to defaults */})
        .finally(() => {
          // Then fetch employees
          axios.get('/api/employee/get-employee-list')
            .then(res => {
              if (res.data.success) {
                processEmployeeData(res.data.employeeList);
              } else {
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

  function handleEmployeeSelect(value) {
    setEmployeeDetails({
      ...employeeDetails,
      ...value.obj,
    });
  }

  async function printForm() {
    if (!employeeDetails.employeeCode) {
      setAlert({
        color: 'warning',
        message: 'Please select an employee to print offer letter.',
        autoDismiss: 7,
        place: 'tc',
        display: true,
        sweetAlert: false,
        timestamp: new Date().getTime(),
      });
    }
    printJS({
      printable: 'printable',
      type: 'html',
      targetStyles: ['*'],
      honorColor: false,
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
        <div className={'mb-2'}>
          {loading ? <LinearProgress /> : null}
        </div>
        <Row>
          <Col md="12">
            <Card>
              <CardHeader>
                <CardTitle tag="h3">Print Offer Letter</CardTitle>
              </CardHeader>
              <CardBody>
                <Form>
                  <Row>
                    <Col md="4">
                      <FormGroup>
                        <Label>Employee Code*</Label>
                        <Select
                          className="react-select info"
                          classNamePrefix="react-select"
                          name="employeeSelect"
                          onChange={handleEmployeeSelect}
                          options={employeeDropdown}
                          placeholder="Select an Employee"
                        />
                      </FormGroup>
                    </Col>
                    <Col md="4" className="d-flex align-items-end">
                      <Button className={"btn bg-success mt-4"} type="button" onClick={printForm}>
                        <i className="tim-icons icon-notes mr-2"/> Print Offer Letter
                      </Button>
                    </Col>
                  </Row>
                </Form>
              </CardBody>
            </Card>
            {employeeDetails.employeeCode ? <Card>
              <CardHeader>
                <div className="d-flex justify-content-between align-items-center">
                  <CardTitle tag="h3" className={'text-center mb-0'}>Offer Letter</CardTitle>
                  <div>
                    {!editMode ? (
                      <Button type="button" className="btn btn-info btn-sm" onClick={() => setEditMode(true)}>
                        <i className="tim-icons icon-pencil mr-2"/> Edit Benefits & Terms
                      </Button>
                    ) : (
                      <>
                        <Button type="button" className="btn btn-success btn-sm mr-2" onClick={async () => {
                          try {
                            setLoading(true);
                            const payload = { benefits, terms };
                            const res = await axios.post('/api/employee/offer-letter-defaults', payload);
                            if (res.data && res.data.success) {
                              setAlert({ color: 'success', message: 'Offer Letter defaults saved.', autoDismiss: 5, place: 'tc', display: true, sweetAlert: false, timestamp: new Date().getTime() });
                              setEditMode(false);
                            } else if (res.data && res.data.error) {
                              setAlert({ color: 'danger', message: res.data.error, autoDismiss: 7, place: 'tc', display: true, sweetAlert: false, timestamp: new Date().getTime() });
                            } else {
                              setAlert({ color: 'warning', message: 'Unexpected response while saving defaults.', autoDismiss: 7, place: 'tc', display: true, sweetAlert: false, timestamp: new Date().getTime() });
                            }
                          } catch (e) {
                            setAlert({ color: 'danger', message: e.message, autoDismiss: 7, place: 'tc', display: true, sweetAlert: false, timestamp: new Date().getTime() });
                          } finally {
                            setLoading(false);
                          }
                        }}>
                          <i className="tim-icons icon-check-2 mr-2"/> Save
                        </Button>
                        <Button type="button" className="btn btn-danger btn-sm" onClick={() => setEditMode(false)}>
                          <i className="tim-icons icon-simple-remove mr-2"/> Cancel
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                <Container id="printable">
                  <Header>
                    <Logo
                      src={authStatus.bankInfo.logo}
                      alt="Company Logo"
                    />
                    <CompanyInfo>
                      <h1 style={{margin: 0}}>{authStatus.bankInfo.bankName}</h1>
                      {/*<h3>Registration Code - {authStatus.bankInfo.registrationCode}</h3>*/}
                      <p>{authStatus.bankInfo.address}</p>
                    </CompanyInfo>
                  </Header>
                  <StyledDate>
                    <p>Date: {employeeDetails.registrationDate}</p>
                    <p>Employee Code: {employeeDetails.employeeCode}</p>
                  </StyledDate>

                  <Content>
                    <p>Dear {employeeDetails.employeeName},</p>

                    <p>We are pleased to offer you the position of {employeeDetails.designation} in the department of {employeeDetails.department} at ${authStatus.bankInfo.bankName}. Your employment will
                      commence from {employeeDetails.startDate}.</p>

                    <h3 className={'mt-4'} style={{margin: 0, fontWeight: "bold"}}>Compensation Package:</h3>
                    <Table>
                      <thead>
                      <tr>
                        <th>Salary Component</th>
                        <th>Monthly (INR)</th>
                        <th>Annual (INR)</th>
                      </tr>
                      </thead>
                      <tbody>
                      {employeeDetails.salary.basic && <tr>
                        <td>Basic Salary</td>
                        <td>{employeeDetails.salary.basic}</td>
                        <td>{employeeDetails.salary.basic * 12}</td>
                      </tr>}
                      {employeeDetails.salary.hra ? <tr>
                        <td>House Rent Allowance</td>
                        <td>{employeeDetails.salary.hra}</td>
                        <td>{employeeDetails.salary.hra * 12}</td>
                      </tr>: null}
                      {employeeDetails.salary.da ? <tr>
                        <td>Transportation Allowance</td>
                        <td>{employeeDetails.salary.da}</td>
                        <td>{employeeDetails.salary.da * 12}</td>
                      </tr> : null}
                      {employeeDetails.salary.da ? <tr>
                        <td>Dearness Allowance (DA)</td>
                        <td>{employeeDetails.salary.da}</td>
                        <td>{employeeDetails.salary.da * 12}</td>
                      </tr> : null}
                      {employeeDetails.salary.ta ? <tr>
                        <td>Transportation Allowance</td>
                        <td>{employeeDetails.salary.ta}</td>
                        <td>{employeeDetails.salary.ta * 12}</td>
                      </tr> : null}
                      {employeeDetails.salary.allowance ? <tr>
                        <td>Other Allowance</td>
                        <td>{employeeDetails.salary.allowance}</td>
                        <td>{employeeDetails.salary.allowance * 12}</td>
                      </tr> : null}
                      {employeeDetails.salary.others ? <tr>
                        <td>Other Benefits</td>
                        <td>{employeeDetails.salary.others}</td>
                        <td>{employeeDetails.salary.others * 12}</td>
                      </tr> : null}
                      {employeeDetails.salary.pf ? <tr>
                        <td>Provident Fund (PF)</td>
                        <td>{employeeDetails.salary.pf}</td>
                        <td>{employeeDetails.salary.pf * 12}</td>
                      </tr> : null}
                      {employeeDetails.salary.esi ? <tr>
                        <td>Employee State Insurance</td>
                        <td>{employeeDetails.salary.esi}</td>
                        <td>{employeeDetails.salary.esi * 12}</td>
                      </tr> : null}
                      {employeeDetails.salary.grossPay ? <tr>
                        <td><strong>Total Gross Pay</strong></td>
                        <td><strong>{employeeDetails.salary.grossPay}</strong></td>
                        <td><strong>{employeeDetails.salary.grossPay * 12}</strong></td>
                      </tr>: null}
                      </tbody>
                    </Table>
                    <h3 style={{margin: 0, fontWeight: "bold"}}>Benefits:</h3>
                    {!editMode ? (
                      <ul>
                        {benefits.map((b, idx) => (
                          <li key={`benefit-${idx}`}>{b}</li>
                        ))}
                      </ul>
                    ) : (
                      <div>
                        {benefits.map((b, idx) => (
                          <div key={`benefit-edit-${idx}`} className="d-flex align-items-center mb-2">
                            <TextField size="small" fullWidth value={b} onChange={(e) => {
                              const arr = [...benefits];
                              arr[idx] = e.target.value;
                              setBenefits(arr);
                            }} />
                            <Button type="button" className="btn btn-danger btn-sm ml-2 fa fa-trash btn-icon" onClick={() => {
                              const arr = benefits.filter((_, i) => i !== idx);
                              setBenefits(arr);
                            }}/>
                          </div>
                        ))}
                        <Button type="button" className="btn btn-secondary btn-sm" onClick={() => setBenefits([...benefits, ""]) }>
                          + Add Benefit
                        </Button>
                      </div>
                    )}

                    <h3 style={{margin: 0, fontWeight: "bold"}}>Terms & Conditions:</h3>
                    {!editMode ? (
                      <ol>
                        {terms.map((t, idx) => (
                          <li key={`term-${idx}`}>{t}</li>
                        ))}
                      </ol>
                    ) : (
                      <div>
                        {terms.map((t, idx) => (
                          <div key={`term-edit-${idx}`} className="d-flex align-items-center mb-2">
                            <TextField size="small" fullWidth value={t} onChange={(e) => {
                              const arr = [...terms];
                              arr[idx] = e.target.value;
                              setTerms(arr);
                            }} />
                            <Button type="button" className="btn btn-danger btn-sm ml-2 fa fa-trash btn-icon" onClick={() => {
                              const arr = terms.filter((_, i) => i !== idx);
                              setTerms(arr);
                            }}/>
                          </div>
                        ))}
                        <Button type="button" className="btn btn-secondary btn-sm" onClick={() => setTerms([...terms, ""]) }>
                          + Add Term
                        </Button>
                      </div>
                    )}
                  </Content>
                  <Signature>
                    <div style={{display: 'flex', justifyContent: 'space-between', width: '100%'}}>
                      <div>
                        <p>Employee Signature</p>
                        <br/><br/>
                        <p>____________________</p>
                        <p>{employeeDetails.employeeName}</p>
                      </div>
                      <div>
                        <p>For Tech Solutions Inc.</p>
                        <br/><br/>
                        <p>____________________</p>
                        <p>Official Seal & Signature</p>
                      </div>
                    </div>
                  </Signature>
                  
                </Container>
              </CardBody>
            </Card>: null}
          </Col>
        </Row>
      </div>
    </>
  );
};

export default OfferLetter;