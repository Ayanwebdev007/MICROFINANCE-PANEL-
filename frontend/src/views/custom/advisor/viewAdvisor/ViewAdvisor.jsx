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
import { LinearProgress } from "@mui/material";

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
  const [lastVisible, setLastVisible] = React.useState(null);
  const [hasMore, setHasMore] = React.useState(true);
  const [searchText, setSearchText] = React.useState("");

  const [colDefs, setColDefs] = React.useState([
    { field: "id", headerName: "ADVISOR ID", width: 120 },
    { field: "name", headerName: "NAME", minWidth: 200 },
    { field: "guardian", headerName: "FATHER/MOTHER/SPOUSE", minWidth: 200 },
    { field: "date", headerName: "JOINING DATE", width: 150 },
    { field: "address", headerName: "ADDRESS", minWidth: 250 },
    { field: "phone", headerName: "PHONE NUMBER", width: 150 },
  ]);
  const defaultColDef = {
    flex: 1,
    filter: true,
    floatingFilter: true,
    resizable: true,
    sortable: true
  }

  const fetchAdvisors = async (reset = false) => {
    try {
      setProgressbar(true);
      const currentLastVisible = reset ? null : lastVisible;
      const response = await axios.get('/api/advisor/get-advisor-list', {
        params: {
          limit: 50,
          lastVisible: currentLastVisible,
          search: searchText
        }
      });

      if (response.data.success) {
        const newList = response.data.advisorList;
        if (reset) {
          setRowData(newList);
        } else {
          setRowData(prev => [...prev, ...newList]);
        }
        setLastVisible(response.data.lastVisible);
        setHasMore(newList.length === 50);
      } else {
        if (reset) setRowData([]);
        setHasMore(false);
        setAlert({
          color: 'warning',
          message: response.data.error || 'No advisors found',
          autoDismiss: 7,
          place: 'tc',
          display: true,
          timestamp: new Date().getTime(),
        });
      }
      setProgressbar(false);
    } catch (err) {
      setProgressbar(false);
      setAlert({
        color: 'danger',
        message: err.message,
        autoDismiss: 7,
        place: 'tc',
        display: true,
        timestamp: new Date().getTime(),
      });
    }
  };

  React.useEffect(() => {
    fetchAdvisors(true);
  }, []);

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    fetchAdvisors(true);
  };

  return (
    <>
      <div className="rna-container">
        {progressbar && <LinearProgress />}
        {alert.display && <CstNotification color={alert.color} message={alert.message} autoDismiss={alert.autoDismiss} place={alert.place} timestamp={alert.timestamp} />}
      </div>
      <div className="content">
        <Row>
          <Col md="12" className="mb-5">
            <Card>
              <CardHeader>
                <Row className="align-items-center">
                  <Col md="4">
                    <CardTitle tag="h4">Advisor List</CardTitle>
                  </Col>
                  <Col md="8">
                    <form onSubmit={handleSearch}>
                      <Row className="align-items-center">
                        <Col md="8">
                          <Input
                            placeholder="Search Name/ID/Phone..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                          />
                        </Col>
                        <Col md="4">
                          <Button color="info" size="sm" type="submit">Search</Button>
                        </Col>
                      </Row>
                    </form>
                  </Col>
                </Row>
              </CardHeader>
              <CardBody style={{ height: window.innerHeight - 350 }}>
                <AgGridReact
                  rowData={rowData}
                  columnDefs={colDefs}
                  defaultColDef={defaultColDef}
                  enableCellTextSelection={true}
                  overlayNoRowsTemplate={'<span>No advisors found</span>'}
                />
                {hasMore && (
                  <div className="text-center mt-3">
                    <Button color="info" outline size="sm" onClick={() => fetchAdvisors(false)} disabled={progressbar}>
                      {progressbar ? "Loading..." : "Load More"}
                    </Button>
                  </div>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </div>
    </>
  );
};

export default ViewAdvisor;