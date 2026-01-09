/*!

=========================================================
* Black Dashboard PRO React - v1.2.4
=========================================================

* Product Page: https://www.creative-tim.com/product/black-dashboard-pro-react
* Copyright 2024 Creative Tim (https://www.creative-tim.com)

* Coded by Creative Tim

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

*/
import React from "react";

// reactstrap components
import {
    Card,
    CardHeader,
    CardBody,
    CardTitle,
    Row,
    Col, Label, FormGroup,
} from "reactstrap";
import { AgGridReact } from 'ag-grid-react';
import {LinearProgress} from "@mui/material";

// core components
import axios from "axios";
import CstNotification from "../../components/CstNotification";
import Select from "react-select";

const ViewAdvisor = () => {
    const [progressbar, setProgressbar] = React.useState(false);
    const [alert, setAlert] = React.useState({
        color: 'success',
        message: 'test message',
        autoDismiss: 7,
        place: 'tc',
        display: false,
        timestamp: new Date().getTime(),
    });
    const [rowData, setRowData] = React.useState([]);
    const [fetched, setFetched] = React.useState(false);
    const [fetchedBanks, setFetchedBanks] = React.useState(false);
    const [bankDropDown, setBankDropDown] = React.useState([]);
    const [colDefs, setColDefs] = React.useState([
        {field: "id", headerName: "EMPLOYEE ID"},
        {field: "employeeName", headerName: "NAME"},
        {field: "employeeCode", headerName: "EMPLOYEE CODE"},
        {field: "registrationDate", headerName: "JOINING DATE"},
        {field: "mobileNo", headerName: "PHONE NUMBER"},
        {field: "department", headerName: "DEPARTMENT"},
        {field: "designation", headerName: "DESIGNATION"},
    ]);
    const defaultColDef = {
        flex: 1,
        filter: true,
        floatingFilter: true
    }
    const fetchEmployees = async (bankId) => {
        return await axios.get('/api/employee/get-employee-list', {
            params: {
                bankId: bankId,
            }
        })
    }
    React.useEffect(() => {
        setProgressbar(true);
        if (!fetched) {
            setFetched(true);
            fetchEmployees()
              .then(res => {
                  if (res.data.success) {
                      setRowData(res.data.employeeList);
                  }else {
                      setAlert({
                          color: 'warning',
                          message: res.data.warning,
                          autoDismiss: 7,
                          place: 'tc',
                          display: true,
                          timestamp: new Date().getTime(),
                      });
                  }
                  setProgressbar(false);
              })
              .catch(err => {
                  setAlert({
                      color: 'danger',
                      message: err.message,
                      autoDismiss: 7,
                      place: 'tc',
                      display: true,
                      timestamp: new Date().getTime(),
                  });
                  setProgressbar(false);
              });
        }
    }, [fetched]);

    if (!fetchedBanks) {
        setFetchedBanks(true);
        axios.get('/api/member/get-associated-branch-restrictive')
            .then(function (value) {
                if (value.data.success) {
                    setBankDropDown(value.data.data);
                }else {
                    setAlert({
                        color: 'warning',
                        message: value.data.error,
                        autoDismiss: 7,
                        place: 'tc',
                        display: true,
                        sweetAlert: false,
                        timestamp: Date.now().toLocaleString(),
                    });
                }
            })
            .catch(function (error) {
                setAlert({
                    color: 'warning',
                    message: error.toLocaleString(),
                    autoDismiss: 7, place: 'tc',
                    display: true,
                    sweetAlert: false,
                    timestamp: Date.now().toLocaleString(),
                });
            });
    }
    async function handleBankSelect(selectedOption) {
        try {
            const fetchData = await fetchEmployees(selectedOption.key);
            if (fetchData.data.success) {
                setRowData(fetchData.data.employeeList || []);
            } else {
                setRowData([]);
                setAlert({
                    color: 'warning',
                    message: fetchData.data.error || "No employees found",
                    autoDismiss: 7,
                    place: 'tc',
                    display: true,
                    sweetAlert: false,
                    timestamp: Date.now().toLocaleString(),
                });
            }
        }catch (e) {
            setRowData([]);
            setAlert({
                color: 'danger',
                message: e.toLocaleString(),
                autoDismiss: 7,
                place: 'tc',
                display: true,
                sweetAlert: false,
                timestamp: Date.now().toLocaleString(),
            });
        }
    }

    return (
      <>
          <div className="rna-container">
              {progressbar && <LinearProgress />}
              {alert.display && <CstNotification color={alert.color} message={alert.message} autoDismiss={alert.autoDismiss} place={alert.place} timestamp={alert.timestamp}/>}
          </div>
          <div className="content">
              <Row>
                  <Col md="12">
                      <Card>
                          <CardHeader>
                              <CardTitle tag="h3">Branch Selection</CardTitle>
                          </CardHeader>
                          <CardBody>
                              <Row>
                                  <Col md="6">
                                      <Label>Select a Branch</Label>
                                      <FormGroup>
                                          <Select
                                              className="react-select info"
                                              classNamePrefix="react-select"
                                              name="bankSelect"
                                              onChange={handleBankSelect}
                                              options={bankDropDown}
                                              placeholder="Choose branch..."
                                          />
                                      </FormGroup>
                                  </Col>
                              </Row>
                          </CardBody>
                      </Card>
                  </Col>
              </Row>
              <Row>
                  <Col className="mb-5" md="12">
                      <Card>
                          <CardHeader>
                              <CardTitle tag="h4">Simple Table</CardTitle>
                          </CardHeader>
                          <CardBody style={{height: window.innerHeight - 150}}>
                              <AgGridReact
                                rowData={rowData}
                                columnDefs={colDefs}
                                defaultColDef={defaultColDef}
                                enableCellTextSelection={true}
                              />
                          </CardBody>
                      </Card>
                  </Col>
              </Row>
          </div>
      </>
    );
};

export default ViewAdvisor;