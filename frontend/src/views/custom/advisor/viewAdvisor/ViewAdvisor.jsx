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
} from "reactstrap";
import { AgGridReact } from 'ag-grid-react';
import {LinearProgress} from "@mui/material";

// core components
import axios from "axios";
import CstNotification from "../../components/CstNotification";

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
  const [colDefs, setColDefs] = React.useState([
    {field: "id", headerName: "ADVISOR ID"},
    {field: "name", headerName: "NAME"},
    {field: "guardian", headerName: "FATHER/MOTHER/SPOUSE"},
    {field: "date", headerName: "JOINING DATE"},
    {field: "address", headerName: "ADDRESS"},
    {field: "phone", headerName: "PHONE NUMBER"},
  ]);
  const defaultColDef = {
    flex: 1,
    filter: true,
    floatingFilter: true
  }
  React.useEffect(() => {
    setProgressbar(true);
    if (!fetched) {
      setFetched(true);
      axios.get('/api/advisor/get-advisor-list')
        .then(res => {
          if (res.data.success) {
            setRowData(res.data.advisorList);
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

  return (
    <>
      <div className="rna-container">
        {progressbar && <LinearProgress />}
        {alert.display && <CstNotification color={alert.color} message={alert.message} autoDismiss={alert.autoDismiss} place={alert.place} timestamp={alert.timestamp}/>}
      </div>
      <div className="content">
        <Row>
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

export default ViewAdvisor;