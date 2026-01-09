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
    parameter: '',
    value: '',
  });
  const [cstError, setCstError] = React.useState({
    parameter: '',
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
    {field: "id", headerName: "KYC ID"},
    {field: "name", headerName: "NAME"},
    {field: "guardian", headerName: "FATHER/MOTHER/SPOUSE"},
    {field: "joiningDate", headerName: "JOINING DATE"},
    {field: "Address", headerName: "ADDRESS"},
    {field: "phone", headerName: "PHONE NUMBER"},
    {field: "aadhar", headerName: "AADHAR NUMBER"},
    {field: "pan", headerName: "PAN NUMBER"},
  ]);
  const defaultColDef = {
    filter: true,
    floatingFilter: true
  }

  async function onSubmit(){
    const inputValid = validateInput(userInput);
    if(inputValid){
      try {
        setProgressbar(true);
        const submitData = await axios.post('/api/member/search-members', userInput);
        if(submitData.data.success){
          setRowData(submitData.data.data);
        }else {
          setAlert({
            color: 'warning',
            message: submitData.data.error,
            autoDismiss: 7,
            place: 'tc',
            display: true,
            sweetAlert: false,
            timestamp: new Date().getTime(),
          });
        }
        setProgressbar(false);
      }catch (e) {
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
  }

  function validateInput(inputValue) {
    let temp = {};
    let isValid = true;
    if (!inputValue.parameter){
      temp = {...temp, parameter: 'this is required'};
      isValid = false;
    }
    if (!inputValue.value){
      temp = {...temp, value: 'this is required'};
      isValid = false;
    }
    setCstError(temp);
    return isValid;
  }

  return (
    <>
      <div className="rna-container">
        {alert.display && <CstNotification color={alert.color} message={alert.message} autoDismiss={alert.autoDismiss} place={alert.place} timestamp={alert.timestamp}/>}
      </div>
      <div className="content">
        <Row>
          <Col>
            <Card>
              <CardBody>
                <Form>
                  <Row>
                    <Col md={3}>
                      <Label>Search By</Label>
                      <FormGroup>
                        <Input type="select" name="select" id="parameterSelect"
                               value={userInput.parameter}
                               onChange={(event) => setUserInput({...userInput, parameter: event.target.value})}
                        >
                          <option value={''}>Select search criteria</option>
                          <option value={'name'}>Name</option>
                          <option value={'phone'}>Phone Number</option>
                          <option value={'aadhar'}>Aadhar Number</option>
                          <option value={'pan'}>PAN Number</option>
                        </Input>
                        <p style={{color: 'red'}}>{cstError.parameter}</p>
                      </FormGroup>
                    </Col>
                    <Col md={3}>
                      <Label>Search Value</Label>
                      <FormGroup>
                        <Input type={'text'} value={userInput.value}
                               onChange={(event) => setUserInput({...userInput, value: event.target.value})}/>
                        <p style={{color: 'red'}}>{cstError.value}</p>
                      </FormGroup>
                    </Col>
                    <Col md={2}>
                      <Row>
                        <Spinner color="info" hidden={!progressbar}/>
                        <Button className={"btn-fill mt-4 ml-2"} color="info" type="button" onClick={onSubmit}>
                          Search
                        </Button>
                      </Row>
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
              <CardBody style={{height: window.innerHeight - 300}}>
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
