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
// nodejs library that concatenates classes
// import classNames from "classnames";
// react plugin used to create charts
import { Line, Bar } from "react-chartjs-2";
// react plugin for creating vector maps

// reactstrap components
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  CardTitle,
  Row,
  Col,
} from "reactstrap";

// core components
import {
  // chartExample1,
  chartExample2,
  chartExample3,
  chartExample4,
} from "variables/charts.js";
import axios from "axios";

const Dashboard = () => {
  const [bigChartData, setbigChartData] = React.useState("data1");
  const setBgChartData = (name) => {
    setbigChartData(name);
  };
  const [dashboardData, setDashboardData] = React.useState({
    kycCount: 0,
    advisorCount: 0,
    groupCount: 0,
    totalSavings: 0,
    totalDeposit: 0,
    totalLoan: 0,
    totalGroupLoan: 0,
    cashInHand: 0,
    bankBalance: 0,
  });
  const [fetched, setFetched] = React.useState(false);
  const [depositChartData, setDepositChartData] = React.useState([0, 0, 0, 0, 0, 0, 0]);
  const [loanChartData, setLoanChartData] = React.useState([0, 0, 0, 0, 0, 0, 0]);
  const [cashInHandChartData, setCashInHandChartData] = React.useState([0, 0, 0, 0, 0, 0, 0]);

  React.useEffect(() => {
    if (!fetched){
      setFetched(true);
      axios.get('/api/auth/dashboard-counts').then(res => {
        if (res.data.success){
          setDashboardData({
            kycCount: res.data.kycCount,
            advisorCount: res.data.advisorCount,
            groupCount: res.data.groupCount,
            totalSavings: res.data.totalSavings,
            totalDeposit: res.data.totalDeposit,
            totalLoan: res.data.totalLoan,
            totalGroupLoan: res.data.totalGroupLoan,
            cashInHand: res.data.cashInHand,
            bankBalance: res.data.bankBalance,
          });
          const performanceData = res.data.chartData
          setDepositChartData([
            performanceData.weekday0.depositAmount || 0,
            performanceData.weekday1.depositAmount || 0,
            performanceData.weekday2.depositAmount || 0,
            performanceData.weekday3.depositAmount || 0,
            performanceData.weekday4.depositAmount || 0,
            performanceData.weekday5.depositAmount || 0,
            performanceData.weekday6.depositAmount || 0,
          ]);
          setLoanChartData([
            performanceData.weekday0.loanCollection || 0,
            performanceData.weekday1.loanCollection || 0,
            performanceData.weekday2.loanCollection || 0,
            performanceData.weekday3.loanCollection || 0,
            performanceData.weekday4.loanCollection || 0,
            performanceData.weekday5.loanCollection || 0,
            performanceData.weekday6.loanCollection || 0,
          ]);
          setCashInHandChartData([
            performanceData.weekday0.cashInHand || 0,
            performanceData.weekday1.cashInHand || 0,
            performanceData.weekday2.cashInHand || 0,
            performanceData.weekday3.cashInHand || 0,
            performanceData.weekday4.cashInHand || 0,
            performanceData.weekday5.cashInHand || 0,
            performanceData.weekday6.cashInHand || 0,
          ]);
        }
      }).catch(err => {
        console.log(err);
      });
    }
  },[fetched]);

  let chartDeposit = {
    data: (canvas) => {
      let ctx = canvas.getContext("2d");

      let gradientStroke = ctx.createLinearGradient(0, 230, 0, 50);

      gradientStroke.addColorStop(1, "rgba(29,140,248,0.2)");
      gradientStroke.addColorStop(0.4, "rgba(29,140,248,0.0)");
      gradientStroke.addColorStop(0, "rgba(29,140,248,0)"); //blue colors

      return {
        labels: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        datasets: [
          {
            label: "Data",
            fill: true,
            backgroundColor: gradientStroke,
            borderColor: "#1f8ef1",
            borderWidth: 2,
            borderDash: [],
            borderDashOffset: 0.0,
            pointBackgroundColor: "#1f8ef1",
            pointBorderColor: "rgba(255,255,255,0)",
            pointHoverBackgroundColor: "#1f8ef1",
            pointBorderWidth: 20,
            pointHoverRadius: 4,
            pointHoverBorderWidth: 15,
            pointRadius: 4,
            data: depositChartData,
          },
        ],
      };
    },
    options: chartExample2.options,
  };

  let chartLoan = {
    data: (canvas) => {
      let ctx = canvas.getContext("2d");

      let gradientStroke = ctx.createLinearGradient(0, 230, 0, 50);

      gradientStroke.addColorStop(1, "rgba(72,72,176,0.1)");
      gradientStroke.addColorStop(0.4, "rgba(72,72,176,0.0)");
      gradientStroke.addColorStop(0, "rgba(119,52,169,0)"); //purple colors

      return {
        labels: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        datasets: [
          {
            label: "Countries",
            fill: true,
            backgroundColor: gradientStroke,
            hoverBackgroundColor: gradientStroke,
            borderColor: "#d048b6",
            borderWidth: 2,
            borderDash: [],
            borderDashOffset: 0.0,
            data: loanChartData,
          },
        ],
      };
    },
    options: chartExample3.options,
  };

  const chartCashInHand = {
    data: (canvas) => {
      let ctx = canvas.getContext("2d");

      let gradientStroke = ctx.createLinearGradient(0, 230, 0, 50);

      gradientStroke.addColorStop(1, "rgba(66,134,121,0.15)");
      gradientStroke.addColorStop(0.4, "rgba(66,134,121,0.0)"); //green colors
      gradientStroke.addColorStop(0, "rgba(66,134,121,0)"); //green colors

      return {
        labels: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        datasets: [
          {
            label: "My First dataset",
            fill: true,
            backgroundColor: gradientStroke,
            borderColor: "#00d6b4",
            borderWidth: 2,
            borderDash: [],
            borderDashOffset: 0.0,
            pointBackgroundColor: "#00d6b4",
            pointBorderColor: "rgba(255,255,255,0)",
            pointHoverBackgroundColor: "#00d6b4",
            pointBorderWidth: 20,
            pointHoverRadius: 4,
            pointHoverBorderWidth: 15,
            pointRadius: 4,
            data: cashInHandChartData,
          },
        ],
      };
    },
    options: chartExample4.options,
  };

  return (
    <>
      <div className="content">
        <Row>
          {/*<Col xs="12">*/}
            {/*<Card className="card-chart">*/}
            {/*  <CardHeader>*/}
            {/*    <Row>*/}
            {/*      <Col className="text-left" sm="6">*/}
            {/*        <h5 className="card-category">Total</h5>*/}
            {/*        <CardTitle tag="h2">Performance</CardTitle>*/}
            {/*      </Col>*/}
            {/*      <Col sm="6">*/}
            {/*        <ButtonGroup*/}
            {/*          className="btn-group-toggle float-right"*/}
            {/*          data-toggle="buttons"*/}
            {/*        >*/}
            {/*          <Button*/}
            {/*            color="info"*/}
            {/*            id="0"*/}
            {/*            size="sm"*/}
            {/*            tag="label"*/}
            {/*            className={classNames("btn-simple", {*/}
            {/*              active: bigChartData === "data1",*/}
            {/*            })}*/}
            {/*            onClick={() => setBgChartData("data1")}*/}
            {/*          >*/}
            {/*            <span className="d-none d-sm-block d-md-block d-lg-block d-xl-block">*/}
            {/*              Total Accounts*/}
            {/*            </span>*/}
            {/*            <span className="d-block d-sm-none">*/}
            {/*              <i className="tim-icons icon-single-02" />*/}
            {/*            </span>*/}
            {/*          </Button>*/}
            {/*          <Button*/}
            {/*            color="info"*/}
            {/*            id="1"*/}
            {/*            size="sm"*/}
            {/*            tag="label"*/}
            {/*            className={classNames("btn-simple", {*/}
            {/*              active: bigChartData === "data2",*/}
            {/*            })}*/}
            {/*            onClick={() => setBgChartData("data2")}*/}
            {/*          >*/}
            {/*            <span className="d-none d-sm-block d-md-block d-lg-block d-xl-block">*/}
            {/*              Deposits*/}
            {/*            </span>*/}
            {/*            <span className="d-block d-sm-none">*/}
            {/*              <i className="tim-icons icon-gift-2" />*/}
            {/*            </span>*/}
            {/*          </Button>*/}
            {/*          <Button*/}
            {/*            color="info"*/}
            {/*            id="2"*/}
            {/*            size="sm"*/}
            {/*            tag="label"*/}
            {/*            className={classNames("btn-simple", {*/}
            {/*              active: bigChartData === "data3",*/}
            {/*            })}*/}
            {/*            onClick={() => setBgChartData("data3")}*/}
            {/*          >*/}
            {/*            <span className="d-none d-sm-block d-md-block d-lg-block d-xl-block">*/}
            {/*              Loans*/}
            {/*            </span>*/}
            {/*            <span className="d-block d-sm-none">*/}
            {/*              <i className="tim-icons icon-tap-02" />*/}
            {/*            </span>*/}
            {/*          </Button>*/}
            {/*        </ButtonGroup>*/}
            {/*      </Col>*/}
            {/*    </Row>*/}
            {/*  </CardHeader>*/}
            {/*  <CardBody>*/}
            {/*    <div className="chart-area">*/}
            {/*      <Line*/}
            {/*        data={chartExample1[bigChartData]}*/}
            {/*        options={chartExample1.options}*/}
            {/*      />*/}
            {/*    </div>*/}
            {/*  </CardBody>*/}
            {/*</Card>*/}
          {/*</Col>*/}
          <Col lg="3" md="6">
            <Card className="card-stats">
              <CardBody>
                <Row>
                  <Col xs="2">
                    <div className="info-icon text-center icon-success">
                      <i className="tim-icons icon-wallet-43" />
                    </div>
                  </Col>
                  <Col xs="10">
                    <div className="numbers">
                      <p className="card-category">Savings</p>
                      <CardTitle tag="h3">
                        {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'INR'
                      }).format(dashboardData.totalSavings)}
                      </CardTitle>
                    </div>
                  </Col>
                </Row>
              </CardBody>
              <CardFooter>
                <hr />
                <div className="stats">
                  <i className="tim-icons icon-refresh-01" />Total Savings Deposits Amounts
                </div>
              </CardFooter>
            </Card>
          </Col>
          <Col lg="3" md="6">
            <Card className="card-stats">
              <CardBody>
                <Row>
                  <Col xs="2">
                    <div className="info-icon text-center icon-success">
                      <i className="tim-icons icon-bank" />
                    </div>
                  </Col>
                  <Col xs="10">
                    <div className="numbers">
                      <p className="card-category">Deposit</p>
                      <CardTitle tag="h3">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'INR'
                        }).format(dashboardData.totalDeposit)}
                      </CardTitle>
                    </div>
                  </Col>
                </Row>
              </CardBody>
              <CardFooter>
                <hr />
                <div className="stats">
                  <i className="tim-icons icon-refresh-01" />Total Other Deposits Amounts
                </div>
              </CardFooter>
            </Card>
          </Col>
          <Col lg="3" md="6">
            <Card className="card-stats">
              <CardBody>
                <Row>
                  <Col xs="2">
                    <div className="info-icon text-center icon-danger">
                      <i className="tim-icons icon-money-coins" />
                    </div>
                  </Col>
                  <Col xs="10">
                    <div className="numbers">
                      <p className="card-category">Loans</p>
                      <CardTitle tag="h3">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'INR'
                        }).format(dashboardData.totalLoan)}
                      </CardTitle>
                    </div>
                  </Col>
                </Row>
              </CardBody>
              <CardFooter>
                <hr />
                <div className="stats">
                  <i className="tim-icons icon-sound-wave" />Current Outstanding Balance
                </div>
              </CardFooter>
            </Card>
          </Col>
          <Col lg="3" md="6">
            <Card className="card-stats">
              <CardBody>
                <Row>
                  <Col xs="2">
                    <div className="info-icon text-center icon-danger">
                      <i className="tim-icons icon-money-coins" />
                    </div>
                  </Col>
                  <Col xs="10">
                    <div className="numbers">
                      <p className="card-category">Group Loans</p>
                      <CardTitle tag="h3">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'INR'
                        }).format(dashboardData.totalGroupLoan)}
                      </CardTitle>
                    </div>
                  </Col>
                </Row>
              </CardBody>
              <CardFooter>
                <hr />
                <div className="stats">
                  <i className="tim-icons icon-sound-wave" />Current Outstanding Balance
                </div>
              </CardFooter>
            </Card>
          </Col>
          <Col lg="3" md="6">
            <Card className="card-stats">
              <CardBody>
                <Row>
                  <Col xs="2">
                    <div className="info-icon text-center icon-primary">
                      <i className="tim-icons icon-single-02" />
                    </div>
                  </Col>
                  <Col xs="10">
                    <div className="numbers">
                      <p className="card-category">Members</p>
                      <CardTitle tag="h3">{dashboardData.kycCount}</CardTitle>
                    </div>
                  </Col>
                </Row>
              </CardBody>
              <CardFooter>
                <hr />
                <div className="stats">
                  <i className="tim-icons icon-paper" />Joined KYC Members
                </div>
              </CardFooter>
            </Card>
          </Col>
          <Col lg="3" md="6">
            <Card className="card-stats">
              <CardBody>
                <Row>
                  <Col xs="2">
                    <div className="info-icon text-center icon-warning">
                      <i className="tim-icons icon-molecule-40" />
                    </div>
                  </Col>
                  <Col xs="10">
                    <div className="numbers">
                      <p className="card-category">Groups</p>
                      <CardTitle tag="h3">{dashboardData.groupCount}</CardTitle>
                    </div>
                  </Col>
                </Row>
              </CardBody>
              <CardFooter>
                <hr />
                <div className="stats">
                  <i className="tim-icons icon-refresh-02" />Loan Groups Formed
                </div>
              </CardFooter>
            </Card>
          </Col>
          <Col lg="3" md="6">
            <Card className="card-stats">
              <CardBody>
                <Row>
                  <Col xs="2">
                    <div className="info-icon text-center icon-success">
                      <i className="tim-icons icon-credit-card" />
                    </div>
                  </Col>
                  <Col xs="10">
                    <div className="numbers">
                      <p className="card-category">Cash at Bank</p>
                      <CardTitle tag="h3">{new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'INR'
                      }).format(dashboardData.bankBalance)}</CardTitle>
                    </div>
                  </Col>
                </Row>
              </CardBody>
              <CardFooter>
                <hr />
                <div className="stats">
                  <i className="tim-icons icon-refresh-02" />Cash Deposited in Other Banks
                </div>
              </CardFooter>
            </Card>
          </Col>
          <Col lg="3" md="6">
            <Card className="card-stats">
              <CardBody>
                <Row>
                  <Col xs="2">
                    <div className="info-icon text-center icon-info">
                      <i className="tim-icons icon-coins" />
                    </div>
                  </Col>
                  <Col xs="10">
                    <div className="numbers">
                      <p className="card-category">Cash in Hand</p>
                      <CardTitle tag="h3">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'INR'
                        }).format(dashboardData.cashInHand)}
                      </CardTitle>
                    </div>
                  </Col>
                </Row>
              </CardBody>
              <CardFooter>
                <hr />
                <div className="stats">
                  <i className="tim-icons icon-sound-wave" />Current Cash at Bank
                </div>
              </CardFooter>
            </Card>
          </Col>
          <Col lg="4">
            <Card className="card-chart">
              <CardHeader>
                <h5 className="card-category">Weekly Deposits</h5>
                <CardTitle tag="h3">
                  <i className="tim-icons icon-wallet-43 text-primary" />{new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'INR'
                }).format(depositChartData[0] + depositChartData[1] + depositChartData[2] + depositChartData[3] + depositChartData[4] + depositChartData[5] + depositChartData[6])}
                </CardTitle>
              </CardHeader>
              <CardBody>
                <div className="chart-area">
                  <Line
                    data={chartDeposit.data}
                    options={chartDeposit.options}
                  />
                </div>
              </CardBody>
            </Card>
          </Col>
          <Col lg="4">
            <Card className="card-chart">
              <CardHeader>
                <h5 className="card-category">Weekly Loan Collection</h5>
                <CardTitle tag="h3">
                  <i className="tim-icons icon-bank text-info" />{" "}
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'INR'
                  }).format(loanChartData[0] + loanChartData[1] + loanChartData[2] + loanChartData[3] + loanChartData[4] + loanChartData[5] + loanChartData[6])}
                </CardTitle>
              </CardHeader>
              <CardBody>
                <div className="chart-area">
                  <Bar
                    data={chartLoan.data}
                    options={chartLoan.options}
                  />
                </div>
              </CardBody>
            </Card>
          </Col>
          <Col lg="4">
            <Card className="card-chart">
              <CardHeader>
                <h5 className="card-category">Weekly Cash</h5>
                <CardTitle tag="h3">
                  <i className="tim-icons icon-coins text-success" />{new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'INR'
                }).format(cashInHandChartData[0] + cashInHandChartData[1] + cashInHandChartData[2] + cashInHandChartData[3] + cashInHandChartData[4] + cashInHandChartData[5] + cashInHandChartData[6])}
                </CardTitle>
              </CardHeader>
              <CardBody>
                <div className="chart-area">
                  <Line
                    data={chartCashInHand.data}
                    options={chartCashInHand.options}
                  />
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </div>
    </>
  );
};

export default Dashboard;
