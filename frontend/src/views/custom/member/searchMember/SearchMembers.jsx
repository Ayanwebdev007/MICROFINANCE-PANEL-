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
  Col,
  Label,
  Form,
  Input,
  FormGroup,
  Button,
  Spinner
} from "reactstrap";
import { AgGridReact } from 'ag-grid-react';
import axios from "axios";
import CstNotification from "../../components/CstNotification";


const SearchMembers = () => {
  const [userInput, setUserInput] = React.useState({
    value: '',
  });
  const [progressbar, setProgressbar] = React.useState(false);
  const [alert, setAlert] = React.useState({
    color: 'success',
    message: 'test message',
    autoDismiss: 7,
    place: 'tc',
    display: false,
    sweetAlert: false,
    timestamp: new Date().getTime(),
  });
  const [rowData, setRowData] = React.useState([]);
  const [colDefs, setColDefs] = React.useState([
    { field: "id", headerName: "KYC ID", width: 120 },
    { field: "name", headerName: "NAME", minWidth: 200 },
    { field: "guardian", headerName: "FATHER/MOTHER/SPOUSE", minWidth: 200 },
    { field: "joiningDate", headerName: "JOINING DATE", width: 150 },
    { field: "phone", headerName: "PHONE NUMBER", width: 150 },
    { field: "aadhar", headerName: "AADHAR NUMBER", width: 150 },
    { field: "pan", headerName: "PAN NUMBER", width: 150 },
    { field: "Address", headerName: "ADDRESS", minWidth: 250 },
  ]);
  const defaultColDef = {
    filter: true,
    floatingFilter: true,
    resizable: true,
    sortable: true
  }

  async function onSubmit(e) {
    if (e) e.preventDefault();
    if (!userInput.value) {
      return setAlert({
        color: 'warning',
        message: 'Please enter search value (Name, ID, Phone, etc.)',
        autoDismiss: 5,
        place: 'tc',
        display: true,
        sweetAlert: false,
        timestamp: new Date().getTime(),
      });
    }

    try {
      setProgressbar(true);
      const submitData = await axios.post('/api/member/search-members', { value: userInput.value });
      if (submitData.data.success) {
        setRowData(submitData.data.data);
      } else {
        setAlert({
          color: 'warning',
          message: submitData.data.error,
          autoDismiss: 7,
          place: 'tc',
          display: true,
          sweetAlert: false,
          timestamp: new Date().getTime(),
        });
        setRowData([]);
      }
      setProgressbar(false);
    } catch (e) {
      setProgressbar(false);
      setAlert({
        color: 'danger',
        message: e.toLocaleString(),
        autoDismiss: 7,
        place: 'tc',
        display: true,
        sweetAlert: false,
        timestamp: new Date().getTime(),
      });
    }
  }

  return (
    <>
      <div className="rna-container">
        {alert.display && <CstNotification color={alert.color} message={alert.message} autoDismiss={alert.autoDismiss} place={alert.place} timestamp={alert.timestamp} />}
      </div>
      <div className="content">
        <Row>
          <Col md={12}>
            <Card>
              <CardHeader>
                <CardTitle tag="h4">Member Global Search</CardTitle>
                <p className="category">Search by Name, ID, Phone, Aadhar, or PAN</p>
              </CardHeader>
              <CardBody>
                <Form onSubmit={onSubmit}>
                  <Row className="align-items-center">
                    <Col md={8}>
                      <FormGroup>
                        <Input
                          type={'text'}
                          placeholder="Type at least 3 characters to search..."
                          value={userInput.value}
                          onChange={(event) => setUserInput({ value: event.target.value })}
                        />
                      </FormGroup>
                    </Col>
                    <Col md={4}>
                      <Button className="btn-fill" color="info" type="submit" disabled={progressbar}>
                        {progressbar ? <Spinner size="sm" /> : "Search Members"}
                      </Button>
                    </Col>
                  </Row>
                </Form>
              </CardBody>
            </Card>
          </Col>
          <Col className="mb-5" md="12">
            <Card>
              <CardHeader>
                <CardTitle tag="h4">Simple Table</CardTitle>
              </CardHeader>
              <CardBody style={{ height: window.innerHeight - 300 }}>
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

export default SearchMembers;
