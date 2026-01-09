// CivilScorePdfTemplate.jsx
import React from "react";

const CivilScorePdfTemplate = React.forwardRef(({ civilData, civilScore, authStatus }, ref) => {
    const name = civilData?.iDAndContactInfo?.personalInfo?.name?.fullName || 'N/A';

    return (
        <div ref={ref} style={{ padding: 30, fontFamily: "Arial", width: "800px" }}>
            <h2 style={{ textAlign: "center", color: "#0d6efd" }}>
                CIBIL REPORT
            </h2>

            <hr />

            <p><strong>Bank:</strong> {authStatus.bankInfo.bankName}</p>
            <p><strong>Name:</strong> {name}</p>
            <p><strong>Score:</strong> {civilScore} / 900</p>

            <hr />

            <h4>Personal Details</h4>
            <table width="100%" border="1" cellPadding="8" style={{ borderCollapse: "collapse" }}>
                <tbody>
                <tr>
                    <td>Name</td>
                    <td>{name}</td>
                </tr>
                <tr>
                    <td>PAN</td>
                    <td>{civilData?.iDAndContactInfo?.identityInfo?.pANId?.[0]?.idNumber}</td>
                </tr>
                </tbody>
            </table>

            <p style={{ marginTop: 30, fontSize: 12, textAlign: "center" }}>
                Generated electronically. No signature required.
            </p>
        </div>
    );
});

export default CivilScorePdfTemplate;
