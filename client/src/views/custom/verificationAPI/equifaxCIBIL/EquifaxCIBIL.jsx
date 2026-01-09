import React, { useState, useRef } from 'react';
import axios from 'axios';
import GaugeChart from 'react-gauge-chart';
import {LinearProgress} from "@mui/material";
import InputForm from './InputForm';
import CstNotification from "../../components/CstNotification";
import {Button} from "reactstrap";
import ReactBSAlert from "react-bootstrap-sweetalert";
import {useSelector} from "react-redux";
import AccountHistoryCard from "./AccountHistoryCard";
import { printWithBrowserAPI } from "./pdfGeneration"
import {generatePdf, printCibilReport} from "./pdfGeneration2";
import CivilScorePdfTemplate from "./CivilScorePdfTemplate";
import {downloadCibilPdf} from "./downloadCibilPdf";
import {printPdf} from "./printPdf";

const safe = (v, d = "-") =>
    v !== undefined && v !== null && v !== "" ? v : d;

const CivilScoreDashboard = () => {
    const pdfRef = useRef(null);
    const [civilData, setCivilData] = useState(null);
    const [civilScore, setCivilScore] = useState(null);
    const authStatus = useSelector((state) => state.auth.authState);
    const [formData, setFormData] = useState({
        fullname: "",
        mobile: "",
        pan: "",
        dob: "",
        pincode: "",
    });

    const [showProgress, setShowProgress] = React.useState(false);
    const [alert, setAlert] = React.useState({
        color: 'success',
        message: '',
        autoDismiss: 7,
        place: 'tc',
        display: false,
        timestamp: new Date().toISOString(),
    });
    const [sweetAlert, setSweetAlert] = useState({
        display: false,
        message: ''
    });

    React.useEffect(() => {
        return function cleanup() {
            var id = window.setTimeout(null, 0);
            while (id--) {
                window.clearTimeout(id);
            }
        };
    });

    const hideAlert = () => {
        setSweetAlert({
            display: false,
            message: ''
        });
    };

    function handleSubmit(force) {
        setSweetAlert({
            display: false,
            message: ''
        });
        const isValid = validateInput(formData);
        if (!isValid) return;
        setAlert({
            color: '',
            message: '',
            autoDismiss: 7,
            place: 'tc',
            display: false,
            timestamp: new Date().toISOString(),
        })

        setShowProgress(true);
        axios.post(process.env.REACT_APP_ENV === 'prod' ? '/api/tools/equifax-cibil-check-proxy-call' : '/api/tools/cibi-score-api', {...formData, force: !!force})
        // axios.post(process.env.REACT_APP_ENV === 'dev' ? '/api/tools/cibi-score-api' : '/api/tools/equifax-cibil-check-proxy-call', {...formData, force: !!force})
            .then(res => {
                if (res.data?.success) {
                    setAlert({
                        color: 'success',
                        message: res.data?.success,
                        autoDismiss: 7,
                        place: 'tc',
                        display: true,
                        timestamp: new Date().toISOString(),
                    });
                    const data = res.data?.data;

                    if (data && typeof data === 'object') {
                        setCivilData(data);

                        const score = Number(data?.ScoreDetails?.[0]?.Value || 0);

                        if (score > 0) {
                            setCivilScore(score);
                        } else {
                            setAlert({
                                color: 'warning',
                                message: 'CIBIL Score not found.',
                                autoDismiss: 7,
                                place: 'tc',
                                display: true,
                                timestamp: new Date().toISOString(),
                            });
                        }
                    } else {
                        setAlert({
                            color: 'warning',
                            message: 'No CIBIL report data available.',
                            autoDismiss: 7,
                            place: 'tc',
                            display: true,
                            timestamp: new Date().toISOString(),
                        });
                    }
                    if (res.data.isCached){
                        setSweetAlert({
                            display: true,
                            message: 'Displayed cached report. Fetch latest CIBIL Report from Credit Beuro? Your wallet balance will be deducted.',
                        });
                    }else {
                        setFormData({
                            fullname: "",
                            mobile: "",
                            pan: "",
                            dob: "",
                            pincode: "",
                        });
                    }
                }else if (res.data.warning) {
                    setSweetAlert({
                        display: true,
                        message: res.data.warning,
                    });
                }else {
                    setAlert({
                        color: 'warning',
                        message: res.data?.error || 'Failed to fetch civil score.',
                        autoDismiss: 7,
                        place: 'tc',
                        display: true,
                        timestamp: new Date().toISOString(),
                    });
                    setFormData({
                        fullname: "",
                        mobile: "",
                        pan: "",
                        dob: "",
                        pincode: "",
                    });
                }
            })
            .catch((error) => {
                console.log(error);
                setAlert({
                    color: 'danger',
                    message: error?.response?.data?.error || 'Failed to fetch civil score.',
                    autoDismiss: 7,
                    place: 'tc',
                    display: true,
                    timestamp: new Date().toISOString(),
                });
            })
            .finally(() => {
                setShowProgress(false);
                // Clear the form if Data fetched from CIBIL API
            });
    }

    function validateInput(userInput) {
        let valid = true;
        let message = '';
        if (!userInput.fullname) {
            valid = false;
            message = 'Please enter valid Name.';
        } else if (!userInput.mobile || !userInput.mobile.match(/^[0-9]{10}$/)) {
            valid = false;
            message = 'Please enter valid Mobile Number.';
        } else if (!userInput.pan || !userInput.pan.match(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)) {
            valid = false;
            message = 'Please enter valid PAN Number.';
        }else if (!userInput.dob) {
            valid = false;
            message = 'Please enter valid Date of Birth.';
        }else if (!userInput.pincode && !userInput.pincode.match(/^[1-9][0-9]{5}$/)) {
            valid = false;
            message = 'Please enter valid Pincode.';
        }
        if (!valid) {
            setAlert({
                color: 'warning',
                message: message,
                autoDismiss: 7,
                place: 'tc',
                display: true,
                timestamp: new Date().toISOString(),
            });
        }
        return valid;
    }

    // check new civil report or reset existing cibil report
    function resetCibilReport() {
        setCivilData(null);
        setCivilScore(null);
        setFormData({
            fullname: "",
            mobile: "",
            pan: "",
            dob: null,
            pincode: "",
        });
        setAlert({
            color: 'info',
            message: 'Enter details to fetch new CIBIL report.',
            autoDismiss: 7,
            place: 'tc',
            display: true,
            timestamp: new Date().toISOString(),
        });
    }

    //  print civil report function
    const print = () => {
        // printWithBrowserAPI();
        // generatePdf(pdfRef.current);
        // printCibilReport(pdfRef.current);
        printPdf({
            name,
            dob,
            gender,
            pan,
            score: civilScore,
            requestDate: today,
            issueDate: today,
            inquiryCount: civilData?.enquirySummary?.past24Months,
            addressRows,
            phoneRows,
            emailRows,
            accountSummaryRows,
            ownership: "Individual",
            accountStatus: "New Account",
        });
        // printCibilReport({
        //     name: "GIRIDHARI DUTTA",
        //     score: 742,
        //     inquiryCount: 2,
        //     accountType: "Credit Card",
        //     ownership: "Individual",
        //     accountStatus: "New Account",
        //     dateOpened: "2022-09-03",
        //     paymentHistoryRows: null
        // });


    }


    // if (!civilData || civilScore === null) return <div className="text-center my-5">Loading...</div>;
    if (!civilData || civilScore === null){
        return <div>
            <div className="rna-container">
                {alert.display && <CstNotification color={alert.color} message={alert.message} autoDismiss={alert.autoDismiss} place={alert.place} timestamp={alert.timestamp}/>}
                {sweetAlert.display && <ReactBSAlert
                    warning
                    style={{ display: "block", marginTop: "-100px" }}
                    title="Are you sure?"
                    onConfirm={() => handleSubmit(true)}
                    onCancel={() => hideAlert()}
                    confirmBtnBsStyle="success"
                    cancelBtnBsStyle="danger"
                    confirmBtnText="Yes, I Confirm!"
                    cancelBtnText="Cancel"
                    showCancel
                >
                    {sweetAlert.message || 'Requesting CIBIL Report from Credit Beuro will deduct wallet balance.'}
                </ReactBSAlert>}
            </div>
            <div className="content my-5">
                <div className={'mb-2'}>
                    {showProgress ? <LinearProgress /> : null}
                </div>
                <InputForm formData={formData} setFormData={setFormData} handleSubmit={handleSubmit} />
            </div>
        </div>
    }

    // Normalize score
    const percent = (civilScore - 300) / 600;
    // Extract user info
    const name =
        civilData?.IDAndContactInfo?.PersonalInfo?.Name?.FullName || 'N/A';


    const dob =
        civilData?.IDAndContactInfo?.PersonalInfo?.DateOfBirth || 'N/A';

    const gender =
        civilData?.IDAndContactInfo?.PersonalInfo?.Gender || 'N/A';

    const pan =
        civilData?.IDAndContactInfo?.IdentityInfo?.PANId?.[0]?.IdNumber || 'N/A';

    const email =
        civilData?.IDAndContactInfo?.EmailAddressInfo?.[0]?.EmailAddress || 'N/A';

    const phone =
        civilData?.IDAndContactInfo?.PhoneInfo?.[0]?.Number || 'N/A';

    const address =
        civilData?.IDAndContactInfo?.AddressInfo?.[0]?.Address || 'N/A';




    const today = new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });

    const addressRows =
        civilData?.iDAndContactInfo?.addressInfo?.length
            ? civilData.iDAndContactInfo.addressInfo
                .map(
                    (a) => `
          <tr>
            <td>${safe(a.seq)}</td>
            <td>${safe(a.address)}</td>
            <td>${safe(a.state)}</td>
            <td>${safe(a.postal)}</td>
            <td>${safe(a.type)}</td>
            <td>${safe(a.reportedDate)}</td>
          </tr>`
                )
                .join("")
            : "";

    const phoneRows =
        civilData?.iDAndContactInfo?.phoneInfo?.length
            ? civilData.iDAndContactInfo.phoneInfo
                .map(
                    (p) => `
          <tr>
            <td>${safe(p.seq)}</td>
            <td>${safe(p.typeCode)}</td>
            <td>${safe(p.number)}</td>
            <td>${safe(p.reportedDate)}</td>
          </tr>`
                )
                .join("")
            : "";

    const emailRows =
        civilData?.iDAndContactInfo?.emailAddressInfo?.length
            ? civilData.iDAndContactInfo.emailAddressInfo
                .map(
                    (e) => `
          <tr>
            <td>${safe(e.seq)}</td>
            <td>${safe(e.emailAddress)}</td>
            <td>${safe(e.reportedDate)}</td>
          </tr>`
                )
                .join("")
            : "";

    // 🔽 DOWNLOAD HANDLER (ADD THIS HERE)
    const handleDownload = () => {
        downloadCibilPdf({
            name,
            dob,
            gender,
            pan,
            score: civilScore,
            requestDate: today,
            issueDate: today,
            inquiryCount: civilData?.enquirySummary?.past24Months,
        });
    };


    const accountSummaryRows = `
<tr>
  <td>Primary</td>
  <td>${safe(civilData?.retailAccountsSummary?.noOfAccounts, "0")}</td>
  <td>${safe(civilData?.retailAccountsSummary?.noOfActiveAccounts, "0")}</td>
  <td>${safe(civilData?.retailAccountsSummary?.noOfPastDueAccounts, "0")}</td>
  <td>${safe(civilData?.retailAccountsSummary?.totalBalanceAmount, "0")}</td>
  <td>${safe(civilData?.retailAccountsSummary?.singleHighestSanctionAmount, "0")}</td>
</tr>
`;


    return (
        <>
            <div className="rna-container">
                {alert.display && <CstNotification color={alert.color} message={alert.message} autoDismiss={alert.autoDismiss} place={alert.place} timestamp={alert.timestamp}/>}
                {sweetAlert.display && <ReactBSAlert
                    warning
                    style={{ display: "block", marginTop: "-100px" }}
                    title="Are you sure?"
                    onConfirm={() => handleSubmit(true)}
                    onCancel={() => hideAlert()}
                    confirmBtnBsStyle="success"
                    cancelBtnBsStyle="danger"
                    confirmBtnText="Yes, I Confirm!"
                    cancelBtnText="Cancel"
                    showCancel
                >
                    {sweetAlert.message || 'Requesting CIBIL Report from Credit Beuro will deduct wallet balance.'}
                </ReactBSAlert>}
            </div>
            <div className="content my-5">
                <div className={'mb-2'}>
                    {showProgress ? <LinearProgress /> : null}
                </div>
                <div>
                    <InputForm formData={formData} setFormData={setFormData} handleSubmit={handleSubmit} resetCibilReport={resetCibilReport}/>
                </div>

                <div className="card text-black shadow-lg" style={{ borderRadius: '16px' }} id="civil-score-card">
                    <div className="card-body">
                        {/* Title */}
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-around',
                                alignItems: 'center',


                            }}
                        >
                            {/* Left */}
                            <div style={{ width: '32%'}}>
                                <img
                                    src={authStatus.bankInfo.logo}
                                    alt="Bank Logo"
                                    style={{ height: '60px', marginBottom: '10px' }}
                                />
                                <h6 className="mt-2 fw-bold">{authStatus.bankInfo.bankName}</h6>
                            </div>

                            {/* Center */}
                            <div style={{ width: '32%', textAlign: 'center' }}>
                                <h4 className="font-weight-bold text-info mb-0">
                                    CIBIL Report Summary
                                </h4>
                                <span
                                    className="font-weight-normal text-dark"
                                    style={{ fontSize: '15px' }}
                                >
      For {name}
    </span>
                            </div>

                            <div style={{ width: '32%', textAlign: 'right' }}>
                                <h5 className="font-weight-bold mb-1">
                                    <span className="text-info">Prepared For:</span>{' '}
                                    <span className="text-dark">{name}</span>
                                </h5>
                                <h5 className="font-weight-bold mb-1">
                                    <span className="text-info">Date of Request:</span>{' '}
                                    <span className="text-dark">{today}</span>
                                </h5>
                                <h5 className="font-weight-bold mb-1">
                                    <span className="text-info">Date of Issue:</span>{' '}
                                    <span className="text-dark">{today}</span>
                                </h5>
                            </div>
                        </div>

                        {/*<div className="text-left d-flex gap-3 mt-3 mb-4">*/}
                        {/*  <div style={{ backgroundColor: '#FF4C4C', color: 'white', padding: '5px 10px', margin:'3px', borderRadius: '5px' }}>Poor</div>*/}
                        {/*  <div style={{ backgroundColor: '#FFD700', color: 'black', padding: '5px 10px', margin:'3px', borderRadius: '5px' }}>Average</div>*/}
                        {/*  <div style={{ backgroundColor: '#4CAF50', color: 'white', padding: '5px 10px', margin:'3px', borderRadius: '5px' }}>Excellent</div>*/}
                        {/*</div>*/}

                        {/* Gauge */}
                        <div className="d-flex justify-content-center">
                            <GaugeChart
                                id="civil-score-gauge"
                                nrOfLevels={3}
                                arcsLength={[0.33, 0.33, 0.34]}
                                colors={['#D32F2F', '#FFD600', '#00C853']}
                                percent={percent}
                                arcPadding={0.02}
                                needleColor="#444"
                                needleBaseColor="#444"
                                textColor="#000000"
                                formatTextValue={() => `${civilScore}`}
                                style={{ width: '370px' }}
                            />
                        </div>

                        {/* Score Summary */}
                        <div className="text-center mt-3 mb-4">
                            <span className="fs-5">Score: <strong>{civilScore}</strong> / 900</span>
                        </div>

                        <hr className="border-light" />

                        {/* Personal Details */}
                        <div className="row mt-3">
                            <div className="col-md-6 mb-2"><strong>Full Name:</strong> {name}</div>
                            <div className="col-md-6 mb-2"><strong>Date of Birth:</strong> {dob}</div>
                            <div className="col-md-6 mb-2"><strong>Gender:</strong> {gender}</div>
                            <div className="col-md-6 mb-2"><strong>PAN:</strong> {pan}</div>
                            <div className="col-md-6 mb-2"><strong>Email:</strong> {email}</div>
                            <div className="col-md-6 mb-2"><strong>Phone:</strong> {phone}</div>
                            <div className="col-12 mb-2"><strong>Address:</strong> {address}</div>
                        </div>

                        {/* Personal Information table*/}
                        <div className="card my-5">
                            <div className="card-header p-2 bg-info text-white">
                                <strong>Personal Information</strong>
                            </div>
                            <div className="card-body">
                                <div className="table-responsive-sm">
                                    <table className="table table-bordered">
                                        <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Date of Birth</th>
                                            <th>Gender</th>
                                            <th>PAN</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        <tr>
                                            <td>{name}</td>
                                            <td>{dob}</td>
                                            <td>{gender}</td>
                                            <td>{pan}</td>
                                        </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                        {/* Contact Information Table */}
                        <div className="card my-4">
                            <div className="card-header p-2 bg-info text-white">
                                <strong>Contact Information</strong>
                            </div>
                            <div className="card-body">
                                {/*Address Info Tabel*/}
                                <h6><strong>Address Info</strong></h6>
                                <div className="table-responsive-sm">
                                    <table className="table table-striped table-bordered">
                                        <thead className="table-light">
                                        <tr>
                                            <th>Seq</th>
                                            <th>Address</th>
                                            <th>State</th>
                                            <th>Postal</th>
                                            <th>Type</th>
                                            <th>Reported Date</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {civilData?.IDAndContactInfo?.AddressInfo?.map((addr, idx) => (
                                            <tr key={idx}>
                                                <td>{addr.Seq}</td>
                                                <td>{addr.Address}</td>
                                                <td>{addr.State}</td>
                                                <td>{addr.Postal}</td>
                                                <td>{addr.Type || 'N/A'}</td>
                                                <td>{addr.ReportedDate}</td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                                {/*Phone Details*/}
                                <h6 className="mt-4"><strong>Phone Info</strong></h6>
                                <div className="table-responsive-sm">
                                    <table className="table table-striped table-bordered">
                                        <thead className="table-light">
                                        <tr>
                                            <th>Seq</th>
                                            <th>Type</th>
                                            <th>Number</th>
                                            <th>Reported Date</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {civilData?.IDAndContactInfo?.PhoneInfo?.map((phone, idx) => (
                                            <tr key={idx}>
                                                <td>{phone.seq}</td>
                                                <td>{phone.typeCode}</td>
                                                <td>{phone.Number}</td>
                                                <td>{phone.ReportedDate}</td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/*Email Info*/}
                                <h6 className="mt-4"><strong>Email Info</strong></h6>
                                <div className="table-responsive-sm">
                                    <table className="table table-striped table-bordered">
                                        <thead className="table-light">
                                        <tr>
                                            <th>Seq</th>
                                            <th>Email</th>
                                            <th>Reported Date</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {civilData?.IDAndContactInfo?.EmailAddressInfo?.map((email, idx) => (
                                            <tr key={idx}>
                                                <td>{email.seq}</td>
                                                <td>{email.EmailAddress}</td>
                                                <td>{email.ReportedDate}</td>
                                            </tr>
                                        ))}

                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Account Information Table */}
                        {/* Account Summary */}
                        <div className="card my-4">
                            <div className="card-header p-2 bg-primary text-white d-flex justify-content-between align-items-center">
                                <strong>Account Summary</strong>
                                <small>Tip: All amounts are in INR.</small>
                            </div>
                            <div className="card-body p-2">
                                {/*<small className="text-muted">*/}
                                {/*  Tip: Current Balance & Disbursed Amount is considered ONLY for ACTIVE accounts.*/}
                                {/*</small>*/}

                                <table className="table table-bordered text-center mt-2 mb-0 small">
                                    <thead className="table-light">
                                    <tr>
                                        <th>Type</th>
                                        <th>Number of Account(s)</th>
                                        <th>Active Account(s)</th>
                                        <th>Past due Account(s)</th>
                                        <th>Current Balance</th>
                                        <th>Amt Disbd/ High Credit</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    <tr>
                                        <td><strong>Primary Match</strong></td>
                                        <td>{civilData?.RetailAccountsSummary?.NoOfAccounts || '0'}</td>
                                        <td>{civilData?.RetailAccountsSummary?.NoOfActiveAccounts || '0'}</td>
                                        <td>{civilData?.RetailAccountsSummary?.NoOfPastDueAccounts || '0'}</td>
                                        <td>{civilData?.RetailAccountsSummary?.TotalBalanceAmount || '0'}</td>
                                        <td>{civilData?.RetailAccountsSummary?.SingleHighestSanctionAmount || '0'}</td>
                                    </tr>
                                    <tr className="bg-light">
                                        <td><strong>Total</strong></td>
                                        <td>{civilData?.RetailAccountsSummary?.NoOfAccounts || '0'}</td>
                                        <td>{civilData?.RetailAccountsSummary?.NoOfActiveAccounts || '0'}</td>
                                        <td>{civilData?.RetailAccountsSummary?.NoOfPastDueAccounts || '0'}</td>
                                        <td>{civilData?.RetailAccountsSummary?.TotalBalanceAmount || '0'}</td>
                                        <td>{civilData?.RetailAccountsSummary?.SingleHighestSanctionAmount || '0'}</td>
                                    </tr>
                                    </tbody>
                                </table>

                                <div className="d-flex justify-content-between mt-2 small px-2">
                                    <div><strong>Inquiries in last 24 Months:</strong> {civilData?.data?.EnquirySummary?.Past24Months || '0'}</div>
                                </div>
                            </div>
                        </div>

                        <div className="card my-4">
                            <div className="card-header p-2 bg-info text-white">
                                <strong>Account Information</strong>
                            </div>
                            {civilData?.RetailAccountDetails?.map((account, index) => (
                                <AccountHistoryCard
                                    key={index}
                                    account={account}
                                    index={index}
                                />
                            ))}

                        </div>


                    </div>
                </div>

                {/* Report Download Button */}
                <div className="text-center mt-4">
                    <div className="d-flex flex-wrap justify-content-center gap-2">
                        <Button className="btn btn-secondary mt-2" type="button" onClick={print}>
                            <i className="tim-icons icon-printer2 mr-2"/> Print Report
                        </Button>
                        <Button
                            className="btn btn-primary"
                            onClick={handleDownload}
                        >
                            <i className="tim-icons icon-cloud-download-93 mr-2" />
                            Download PDF
                        </Button>

                    </div>
                </div>
            </div>
            <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
                <CivilScorePdfTemplate
                    ref={pdfRef}
                    civilData={civilData}
                    civilScore={civilScore}
                    authStatus={authStatus}
                />
            </div>

        </>
    );
};

export default CivilScoreDashboard;
