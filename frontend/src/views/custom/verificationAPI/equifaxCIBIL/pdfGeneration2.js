
const safe = (v, d = "-") =>
    v !== undefined && v !== null && v !== "" ? v : d;
// export const printCibilReport = (data = {}) => {
//     if (!data || Object.keys(data).length === 0) {
//         console.error("Print failed: No data supplied");
//         return;
//     }
//
//
//
//     const iframe = document.createElement("iframe");
//     iframe.style.position = "fixed";
//     iframe.style.right = "0";
//     iframe.style.bottom = "0";
//     iframe.style.width = "0";
//     iframe.style.height = "0";
//     iframe.style.border = "0";
//     document.body.appendChild(iframe);
//
//     const doc = iframe.contentWindow.document;
//     doc.open();
//
//     doc.write(`
export const printCibilReport = (data = {}) => {
    if (!data || Object.keys(data).length === 0) {
        return `<div>No Data Available</div>`;
    }

    return `
<!DOCTYPE html>
<html>
<head>
  <title>CIBIL Consumer Credit Report</title>

  <style>
    @page { size: A4; }

    body {
      font-family: "Segoe UI", Arial, sans-serif;
      font-size: 11px;
      color: #1a1a1a;
    }

    .primary { color: #0d47a1; }

    .header {
      text-align: center;
      border-bottom: 4px solid #0d47a1;
      padding-bottom: 10px;
      margin-bottom: 14px;
    }

    .header h1 {
      font-size: 16px;
      margin: 2px 0;
      font-weight: 700;
    }

    .header h2 {
      font-size: 12px;
      margin: 0;
      letter-spacing: 1px;
    }

    .section {
      margin-top: 14px;
      page-break-inside: avoid;
    }

    .section-title {
      background: #0d47a1;
      color: #fff;
      padding: 6px 10px;
      font-weight: 700;
      font-size: 12px;
    }

    .section-body {
      border: 1px solid #cfd8e3;
      border-top: none;
      padding: 10px;
    }

    .grid-2 {
      display: flex;
      gap: 12px;
    }

    .box {
      flex: 1;
      border: 1px solid #cfd8e3;
      padding: 8px;
      background: #f9fbfe;
    }

    .label {
      font-weight: 600;
      width: 150px;
      display: inline-block;
    }

    .score {
      font-size: 34px;
      font-weight: 800;
      color: #0d47a1;
      border: 4px solid #0d47a1;
      padding: 12px 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #e3f2fd;
      /*display: inline-block;*/
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 6px;
    }

    th, td {
      border: 1px solid #cfd8e3;
      padding: 5px;
      vertical-align: top;
    }

    th {
      background: #e3f2fd;
      color: #0d47a1;
      font-weight: 700;
      text-align: left;
    }

    .report-header {
  display: flex;
  align-items: center;
  border-bottom: 2px solid #0a3d91;
  padding: 12px 0;
  margin-bottom: 20px;
}

.bank-left {
  width: 120px;
  text-align: left;
}

.bank-logo {
  width: 90px;
  height: auto;
}

.header-right {
  flex: 1;
  text-align: left;
  padding-left: 15px;
}

.bank-name {
  font-size: 18px;
  font-weight: bold;
  color: #0a3d91;
  margin-bottom: 4px;
}

.report-title h2 {
  font-size: 13px;
  font-weight: 600;
  color: #555;
  margin: 2px 0;
}

.report-title h1 {
  font-size: 16px;
  font-weight: bold;
  color: #000;
  margin: 4px 0;
}


    .footer {
      margin-top: 22px;
      font-size: 9px;
      text-align: center;
      border-top: 1px solid #cfd8e3;
      padding-top: 6px;
      color: #555;
    }

    .page-break {
      page-break-before: always;
    }
  </style>
</head>

<body>


    <!-- BANK HEADER -->
<div class="bank-header">

  <div class="report-header">
  <div class="bank-left">
    <img
      src="https://images-platform.99static.com/C4X2T4gOTyMopKdpRxN4WWm63Yo=/500x500/top/smart/99designs-contests-attachments/7/7745/attachment_7745006"
      class="bank-logo"
      alt="Bank Logo"
      style="width: 100px;height: 100px"
    />
  </div>

  <div class="header-right">
    <div class="bank-name">
      GS3 FINANCE
    </div>

    <div class="report-title">
      <h2>IN ASSOCIATION WITH TRANSUNION</h2>
      <h1>CIBIL CONSUMER CREDIT INFORMATION REPORT</h1>
    </div>
  </div>
</div>



  <!-- SUMMARY -->
  <div class="section">
    <div class="section-title">CIBIL REPORT SUMMARY</div>
    <div class="section-body" style="display: flex; gap: 4px">
      <div class="section-body" style="flex-grow: 1; ">
        <div><span class="label">Prepared For</span>: ${safe(data.name)}</div>
        <div><span class="label">Date of Request</span>: ${safe(data.requestDate)}</div>
        <div><span class="label">Date of Issue</span>: ${safe(data.issueDate)}</div>
        <div><span class="label">CIBIL Score</span>: <b>${safe(data.score)} / 900</b></div>
        <div><span class="label">Inquiries (24 Months)</span>: ${safe(data.inquiryCount)}</div>
      </div>
      <div class="">
       <div class="section-title">CIBIL TRANSUNION SCORE</div>
        <div class="" style="margin-right: 6px">
          <div class="score" style="width: 100%">${safe(data.score)}</div>
        </div>
      </div>
    </div>
  </div>

  <!-- SCORE -->
  <!--
  <div class="section">
    <div class="section-title">CIBIL TRANSUNION SCORE</div>
    <div class="section-body">
      <div class="score">${safe(data.score)}</div>
    </div>
  </div>
  -->

  <!-- PERSONAL -->
  <div class="section">
    <div class="section-title">PERSONAL INFORMATION</div>
    <div class="section-body">
      <table>
        <tr><th>Name</th><th>Date of Birth</th><th>Gender</th><th>PAN</th></tr>
        <tr>
          <td>${safe(data.name)}</td>
          <td>${safe(data.dob)}</td>
          <td>${safe(data.gender)}</td>
          <td>${safe(data.pan)}</td>
        </tr>
      </table>
    </div>
  </div>

  <!-- CONTACT -->
  <div class="section">
    <div class="section-title">CONTACT INFORMATION</div>
    <div class="section-body">
      <b>Address Information</b>
      <table>
        <thead>
          <tr><th>Seq</th><th>Address</th><th>State</th><th>Postal</th><th>Type</th><th>Reported Date</th></tr>
        </thead>
        <tbody>
          ${safe(data.addressRows, `<tr><td colspan="6">No Address Data</td></tr>`)}
        </tbody>
      </table>

      <br/>

      <b>Phone Information</b>
      <table>
        <thead>
          <tr><th>Seq</th><th>Type</th><th>Number</th><th>Reported Date</th></tr>
        </thead>
        <tbody>
          ${safe(data.phoneRows, `<tr><td colspan="4">No Phone Data</td></tr>`)}
        </tbody>
      </table>

      <br/>

      <b>Email Information</b>
      <table>
        <thead>
          <tr><th>Seq</th><th>Email</th><th>Reported Date</th></tr>
        </thead>
        <tbody>
          ${safe(data.emailRows, `<tr><td colspan="3">No Email Data</td></tr>`)}
        </tbody>
      </table>
    </div>
  </div>

  <!-- ACCOUNT SUMMARY -->
  <div class="section">
    <div class="section-title">ACCOUNT SUMMARY</div>
    <div class="section-body">
      <table>
        <thead>
          <tr>
            <th>Type</th><th>Total</th><th>Active</th>
            <th>Past Due</th><th>Current Balance</th><th>High Credit</th>
          </tr>
        </thead>
        <tbody>
          ${safe(data.accountSummaryRows, `<tr><td colspan="6">No Account Summary</td></tr>`)}
        </tbody>
      </table>
    </div>
  </div>

  <!-- SUMMARY -->
<div class="section">
  <div class="section-title">CIBIL REPORT SUMMARY</div>
  <div class="section-body grid-2">
    <div class="box">
      <div><span class="label">Prepared For</span>: ${safe(data.name)}</div>
      <div><span class="label">Date of Request</span>: ${safe(data.requestDate)}</div>
      <div><span class="label">Date of Issue</span>: ${safe(data.issueDate)}</div>
    </div>
    <div class="box">
      <div><span class="label">CIBIL Score</span>: <b>${safe(data.score)} / 900</b></div>
      <div><span class="label">Inquiries (24 Months)</span>: ${safe(data.inquiryCount)}</div>
    </div>
  </div>
</div>

<!-- INQUIRIES -->
<div class="section">
  <div class="section-title">INQUIRIES</div>
  <div class="section-body">
    Inquiries in last 24 Months :
    <b>${safe(data.inquiryCount)}</b>
  </div>
</div>

<!-- ACCOUNT INFORMATION -->
<div class="section">
  <div class="section-title">ACCOUNT INFORMATION</div>

  <div class="account-header">
    1. Account Type:
    <span style="color:#c62828">${safe(data.accountType, "Credit Card")}</span>
    <span class="badge-active">ACTIVE</span>
    <span style="float:right">Info. as of: ${safe(data.accountInfoDate)}</span>
  </div>

  <div class="section-body">
    <div class="grid-2">
      <div class="box">
        <div><span class="label">Ownership</span>: ${safe(data.ownership)}</div>
        <div><span class="label">Status</span>: ${safe(data.accountStatus)}</div>
        <div><span class="label">Date Closed</span>: ${safe(data.dateClosed)}</div>
        <div><span class="label">Collateral Type</span>: ${safe(data.collateralType)}</div>
        <div><span class="label">Last Payment Date</span>: ${safe(data.lastPaymentDate)}</div>
      </div>

      <div class="box">
        <div><span class="label">Account #</span>: ${safe(data.accountNumber)}</div>
        <div><span class="label">Date Opened</span>: ${safe(data.dateOpened)}</div>
        <div><span class="label">Balance</span>: ₹${safe(data.balance, 0)}</div>
        <div><span class="label">Collateral Value</span>: ₹${safe(data.collateralValue)}</div>
      </div>
    </div>
  </div>
</div>

<!-- PAYMENT HISTORY -->
<div class="section">
  <div class="section-title">PAYMENT HISTORY (48 MONTHS)</div>
  <div class="section-body">
    <table>
      <thead>
        <tr>
          <th>YEAR</th>
          <th>JAN</th><th>FEB</th><th>MAR</th><th>APR</th>
          <th>MAY</th><th>JUN</th><th>JUL</th><th>AUG</th>
          <th>SEP</th><th>OCT</th><th>NOV</th><th>DEC</th>
        </tr>
      </thead>
      <tbody>
        ${safe(data.paymentHistoryRows, `
        <tr>
          <td>2022</td>
          <td>-</td><td>-</td><td>-</td><td>-</td>
          <td>-</td><td>-</td><td>-</td><td>-</td>
          <td class="payment-new">NEW/*</td>
          <td>-</td><td>-</td><td>-</td>
        </tr>
        `)}
      </tbody>
    </table>
  </div>
</div>

  <div class="footer">
    © Credit Information Bureau (India) Limited. All Rights Reserved.
  </div>

</body>
</html>
`;
};

//     doc.close();
//     iframe.contentWindow.focus();
//     iframe.contentWindow.print();
//
//     setTimeout(() => {
//         document.body.removeChild(iframe);
//     }, 2000);
// };







