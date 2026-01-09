import React from "react";

import {
  Button,
  Card,
  CardBody,
  CardFooter,
  Label,
  FormGroup,
  Input,
  Row,
  Col,
  Spinner,
  CardHeader,
  CardTitle,
  CustomInput,
} from "reactstrap";
import axios from "axios";
import CstNotification from "../../components/CstNotification";
import ReactBSAlert from "react-bootstrap-sweetalert";
import Select from "react-select";
import { LinearProgress } from "@mui/material";



const Wallet = () => {
    const [userInput, setUserInput] = React.useState();
    const [walletConfiguration, setWalletConfiguration] = React.useState({
        equifaxCIBIL: { enabled: false, cost: 0 },
    });
    const [progressbar, setProgressbar] = React.useState(false);
    const [fetched, setFetched] = React.useState(false);
    const [bankDropDown, setBankDropDown] = React.useState([]);
    const [alert, setAlert] = React.useState({
        color: "success",
        message: "test message",
        autoDismiss: 7,
        place: "tc",
        display: false,
        sweetAlert: false,
        timestamp: new Date().getTime(),
    });

    if (!fetched) {
        setFetched(true);
        setProgressbar(true);
        axios
            .get("/api/admin/get-registered-banks")
            .then((value) => {
                if (value.data.success) {
                    const mainBanks = value.data.data.filter((bank) => bank.isMainBranch);
                    setBankDropDown(mainBanks);
                } else {
                    setAlert({
                        color: "warning",
                        message: value.data.error,
                        autoDismiss: 7,
                        place: "tc",
                        display: true,
                        sweetAlert: false,
                        timestamp: new Date().getTime(),
                    });
                }
            })
            .catch((error) => {
                setAlert({
                    color: "danger",
                    message: error.toLocaleString(),
                    autoDismiss: 7,
                    place: "tc",
                    display: true,
                    sweetAlert: false,
                    timestamp: new Date().getTime(),
                });
            })
            .finally(() => setProgressbar(false));
    }

    async function onSubmit() {
        setProgressbar(true);
        try {
            const submitData = await axios.post("/api/admin/add-wallet-balance-main-branch", {
                ...userInput,
                ...walletConfiguration,
            });
            if (submitData.data.success) {
                setAlert({
                    color: "success",
                    message: submitData.data.success,
                    autoDismiss: 7,
                    place: "tc",
                    display: false,
                    sweetAlert: true,
                    timestamp: new Date().getTime(),
                });
            } else {
                setAlert({
                    color: "warning",
                    message: submitData.data.error,
                    autoDismiss: 7,
                    place: "tc",
                    display: true,
                    sweetAlert: false,
                    timestamp: new Date().getTime(),
                });
            }
        } catch (e) {
            setAlert({
                color: "danger",
                message: e.toLocaleString(),
                autoDismiss: 7,
                place: "tc",
                display: true,
                sweetAlert: false,
                timestamp: new Date().getTime(),
            });
        } finally {
            setProgressbar(false);
        }
    }

    const handleBankSelect = async (data) => {
        try {
            console.log(data)
            setProgressbar(true);
            const result = await axios.post("/api/admin/get-wallet-balance-and-configuration", {
                bankId: data.key,
            });
            if (result.data.success) {
                setUserInput({
                    ...data.data,
                    bankName: data.label,
                    bankId: data.key,
                    walletBalance: result.data.data.walletBalance,
                });
                setWalletConfiguration(result.data.data.walletConfiguration);
            } else {
                setAlert({
                    color: "warning",
                    message: result.data.error,
                    autoDismiss: 7,
                    place: "tc",
                    display: true,
                    sweetAlert: false,
                    timestamp: new Date().getTime(),
                });
            }
        } catch (error) {
            setAlert({
                color: "danger",
                message: error.toLocaleString(),
                autoDismiss: 7,
                place: "tc",
                display: true,
                sweetAlert: false,
                timestamp: new Date().getTime(),
            });
        } finally {
            setProgressbar(false);
        }
    };

  return (
      <>
        <div className="rna-container">
          {alert.display && <CstNotification color={alert.color} message={alert.message} autoDismiss={alert.autoDismiss} place={alert.place} timestamp={alert.timestamp}/>}
          {alert.sweetAlert && (
              <ReactBSAlert
                  success
                  style={{ display: "block", marginTop: "-100px" }}
                  title="Success!"
                  onConfirm={() => setAlert({ ...alert, sweetAlert: false })}
                  onCancel={() => setAlert({ ...alert, sweetAlert: false })}
                  confirmBtnBsStyle="success"
                  btnSize=""
              >
                {alert.message}
              </ReactBSAlert>
          )}
        </div>
        <div className="content">
          {progressbar && <LinearProgress color="info" />}
          <Row>
            <Card>
              <CardBody className={"mt-2"}>
                <Row>
                  <Col md={9}>
                    <Label>Select a Bank</Label>
                    <FormGroup>
                      <Select
                          className="react-select info"
                          classNamePrefix="react-select"
                          name="bankSelect"
                          onChange={handleBankSelect}
                          options={bankDropDown}
                          placeholder=""
                      />
                    </FormGroup>
                  </Col>
                </Row>
              </CardBody>
            </Card>
            {userInput?.bankName && (
                <Card>
                  <CardBody className={"mt-2"}>
                    <Row className="mt-3">
                      <Col md={4}>
                        <Label>Bank Name</Label>
                        <Input type="text" readOnly value={userInput.bankName || ""} />
                      </Col>
                      <Col md={4}>
                        <Label>Registration Code</Label>
                        <Input type="text" readOnly value={userInput.registrationCode || ""} />
                      </Col>
                      <Col md={4}>
                        <Label>Email</Label>
                        <Input type="text" readOnly value={userInput.email || ""} />
                      </Col>
                      <Col md={12}>
                        <Label>Address</Label>
                        <Input type={"textarea"} readOnly value={userInput.address || ""} />
                      </Col>
                    </Row>
                    <Row className="mt-4">
                      <Col md={4}>
                        <Label>Current Balance</Label>
                        <Input type="number" readOnly value={userInput?.walletBalance || 0} />
                      </Col>
                      <Col md={4}>
                        <Label>Amount Being Loaded</Label>
                        <Input
                            type="number"
                            value={userInput?.amount || ""}
                            onChange={(e) =>
                                setUserInput({
                                  ...userInput,
                                  amount: e.target.value,
                                })
                            }
                        />
                      </Col>
                      <Col md={4}>
                        <Label>Updated Balance</Label>
                        <Input
                            type="number"
                            readOnly
                            value={(parseFloat(userInput?.walletBalance || 0) + parseFloat(userInput?.amount || 0)).toFixed(2)}
                        />
                      </Col>
                    </Row>
                  </CardBody>
                </Card>
            )}
          </Row>
          {userInput?.bankName && (
              <Row>
                <Card>
                  <CardHeader>
                    <CardTitle tag="h3">Wallet Configuration</CardTitle>
                  </CardHeader>
                  <CardBody>
                    <Row>
                      <Col md={12}>
                        <Row>
                          <Col className="d-flex align-items-center" md={4}>
                            <span className="mr-2">(Disable)</span>
                            <CustomInput
                                type="switch"
                                id="switch-equifaxCIBIL"
                                className="mt-n4"
                                checked={walletConfiguration.equifaxCIBIL?.enabled}
                                onChange={(e) =>
                                    setWalletConfiguration({
                                      ...walletConfiguration,
                                      equifaxCIBIL: {
                                        enabled: e.target.checked,
                                        cost: walletConfiguration.equifaxCIBIL?.cost || 0,
                                      },
                                    })
                                }
                                label=""
                            />
                            <span className="ml-n2">(Enable) : Equifax CIBIL API</span>
                          </Col>
                          <Col className="d-flex align-items-sm-start mt-1" md={8}>
                            <Row>
                              <span className={"mt-2"}>Equifax CIBIL API Cost per request</span>
                              <Col md="4">
                                <FormGroup>
                                  <Input
                                      type="number"
                                      onChange={(e) =>
                                          setWalletConfiguration({
                                            ...walletConfiguration,
                                            equifaxCIBIL: {
                                              ...walletConfiguration.equifaxCIBIL,
                                              cost: parseInt(e.target.value),
                                            },
                                          })
                                      }
                                      value={walletConfiguration.equifaxCIBIL?.cost || 0}
                                  />
                                </FormGroup>
                              </Col>
                            </Row>
                          </Col>
                        </Row>
                      </Col>
                    </Row>
                  </CardBody>
                </Card>
              </Row>
          )}
          <Row>
            <Col md="12" className={"text-center"}>
              <CardFooter>
                <center>
                  <Spinner color="info" hidden={!progressbar} />
                </center>
                <Button className="btn-fill" color="info" type="button" onClick={onSubmit}>
                  Submit
                </Button>
              </CardFooter>
            </Col>
          </Row>
        </div>

      </>
  );
};

export default Wallet;
