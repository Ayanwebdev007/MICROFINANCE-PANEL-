import React from "react";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  FormGroup,
  Form,
  Input,
  Row,
  Col,
  Table,
  Label, Spinner
} from "reactstrap";
import axios from "axios";
import CstNotification from "../../components/CstNotification";
import ReactBSAlert from "react-bootstrap-sweetalert";

const AddDesignationMaster = () => {
  const initialState = {
    designationName: '',
    designationId: '',
  };

  const [formData, setFormData] = React.useState(initialState);
  const [designationList, setDesignationList] = React.useState([]);
  const [cstError, setCstError] = React.useState({
    designationName: '',
    designationId: '',
  });
  const [alert, setAlert] = React.useState({
    color: 'success',
    message: 'test message',
    autoDismiss: 7,
    place: 'tc',
    display: false,
    sweetAlert: false,
    timestamp: new Date().getTime(),
  });
  const [progressbar, setProgressbar] = React.useState(false);
  const [fetched, setFetched] = React.useState(false);

  if (!fetched){
    setFetched(true);
    axios.get('/api/employee/get-designations')
      .then(function (value){
        if (value.data.success){
          setDesignationList(Object.values(value.data.success));
        }else {
          setAlert({
            color: 'danger',
            message: value.data.error,
            autoDismiss: 7,
            place: 'tc',
            display: true,
            sweetAlert: false,
            timestamp: new Date().getTime(),
          });
        }
      }).catch(function (error){
      setAlert({
        color: 'danger',
        message: error.toLocaleString(),
        autoDismiss: 7,
        place: 'tc',
        display: true,
        sweetAlert: false,
        timestamp: new Date().getTime(),
      });
    });
  }

  const validateForm = () => {
    let formErrors = {};
    let isValid = true;
    if (!formData.designationName) {
      formErrors.designationName = "Designation Name is required.";
      isValid = false;
    }
    setCstError(formErrors);
    return isValid;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleClear = () => {
    setFormData(initialState);
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      setProgressbar(true);
      try {
        const submitData = await axios.post('/api/employee/add-designation', formData);
        if (submitData.data.success) {
          setDesignationList([...designationList, formData]);
          setAlert({
            color: 'success',
            message: submitData.data.success,
            autoDismiss: 7,
            place: 'tc',
            display: false,
            sweetAlert: true,
            timestamp: new Date().getTime(),
          });
        }else {
          setAlert({
            color: 'danger',
            message: 'Failed to add designation!',
            autoDismiss: 7,
            place: 'tc',
            display: false,
            sweetAlert: true,
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
          display: false,
          sweetAlert: true,
          timestamp: new Date().getTime(),
        });
      }
    }
  };

  return (
    <>
      <div className="rna-container">
        {alert.display && <CstNotification color={alert.color} message={alert.message} autoDismiss={alert.autoDismiss} place={alert.place} timestamp={alert.timestamp} />}
        {alert.sweetAlert && <ReactBSAlert
          success
          style={{ display: "block", marginTop: "-100px" }}
          title="Good job!"
          onConfirm={() => setAlert({ ...alert, sweetAlert: false })}
          onCancel={() => setAlert({ ...alert, sweetAlert: false })}
          confirmBtnBsStyle="success"
          btnSize=""
        >
          {alert.message}
        </ReactBSAlert>}
      </div>
      <div className="content">
        <Row>
          <Col md="12">
            <Card>
              <CardHeader>
                <CardTitle tag="h3">Add Designation Master</CardTitle>
              </CardHeader>
              <CardBody>
                <Form>
                  <Row>
                    <Col md="4">
                      <FormGroup>
                        <Label>Designation Id *</Label>
                        <Input
                          type="text"
                          name="designationId"
                          value={formData.designationId}
                          onChange={handleInputChange}
                        />
                        <p style={{ color: 'red' }}>{cstError.designationId}</p>
                      </FormGroup>
                    </Col>
                    <Col md="4">
                      <FormGroup>
                        <Label>Designation Name *</Label>
                        <Input
                          type="text"
                          name="designationName"
                          value={formData.designationName}
                          onChange={handleInputChange}
                        />
                        <p style={{ color: 'red' }}>{cstError.designationName}</p>
                      </FormGroup>
                    </Col>
                    <Col md="4">
                      <Spinner color="info" className={'mt-4'} hidden={!progressbar} />
                      <Button className="btn-fill mt-4" color="info" type="button" onClick={handleSubmit}>
                        Submit
                      </Button>
                      <Button className="btn-fill ml-2 mt-4" color="secondary" type="button" onClick={handleClear}>
                        Clear
                      </Button>
                    </Col>
                  </Row>
                </Form>
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* Designation List Section */}
        <Row>
          <Col md="12">
            <Card>
              <CardHeader>
                <CardTitle tag="h3">Designation List</CardTitle>
              </CardHeader>
              <CardBody>
                <Table responsive>
                  <thead>
                  <tr>
                    <th>SNo</th>
                    <th>Designation Code</th>
                    <th>Designation Name</th>
                    <th>Action</th>
                  </tr>
                  </thead>
                  <tbody>
                  {designationList.map((designation, index) => (
                    <tr key={designation.designationId}>
                      <td>{index + 1}</td>
                      <td>{designation.designationId}</td>
                      <td>{designation.designationName}</td>
                      <td>
                        <Button color="primary" size="sm" onClick={() => setFormData({ designationName: designation.designationName, designationId: designation.designationId })}>
                          ➡
                        </Button>
                      </td>
                    </tr>
                  ))}
                  </tbody>
                </Table>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </div>
    </>
  );
};

export default AddDesignationMaster;