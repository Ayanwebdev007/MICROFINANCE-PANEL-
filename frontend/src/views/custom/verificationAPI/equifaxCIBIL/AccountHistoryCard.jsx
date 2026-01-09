import React from 'react';
import { Card, CardBody } from 'reactstrap';

const AccountHistoryCard = ({ account, index }) => {
    console.log(account.AccountNumber);
    const {
        AccountNumber,
        AccountStatus,
        AccountType,
        Balance,
        DateOpened,
        DateReported,
        History48Months = [],
        Institution,
        LastPaymentDate,
        OwnershipType,
        PastDueAmount,
        SanctionAmount,
        Open,
    } = account;



    const monthMap = {
        '01': 'JAN', '02': 'FEB', '03': 'MAR', '04': 'APR',
        '05': 'MAY', '06': 'JUN', '07': 'JUL', '08': 'AUG',
        '09': 'SEP', '10': 'OCT', '11': 'NOV', '12': 'DEC'
    };

    const allMonths = [
        'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
        'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
    ];

    /* ---------------- Payment History Parsing ---------------- */
    const paymentHistory = {};

    History48Months.forEach(entry => {
        if (!entry?.key) return;

        const [mm, yy] = entry.key.split('-');
        const year = `20${yy}`;
        const month = monthMap[mm];

        const value = `${entry.PaymentStatus}/${entry.AssetClassificationStatus}`;

        if (!paymentHistory[year]) paymentHistory[year] = {};
        paymentHistory[year][month] = value;
    });

    /* ---------------- Active Logic ---------------- */
    const isActive =
        Open === 'Yes' ||
        /current|active|open|new/i.test(AccountStatus);

    return (
        <Card className={`mb-4 shadow ${isActive ? 'border-success' : ''}`}>
            <CardBody>

                {/* Header */}
                <div
                    className={`d-flex justify-content-between align-items-center p-2 ${
                        isActive ? 'bg-success text-white' : 'bg-light'
                    }`}
                >
                    <h5 className="mb-0 ms-2">
                        {index + 1}. Account Type:
                        <span className="text-danger fw-bold"> {AccountType || 'N/A'}</span>
                        <span className={`badge ms-2 ${isActive ? 'bg-success' : 'bg-danger'}`}>
                            {isActive ? 'Active' : 'Closed'}
                        </span>
                    </h5>
                    <strong>Info as of: {DateReported || 'N/A'}</strong>
                </div>

                {/* Account Details */}
                <div className="border p-3 mb-3 shadow-sm rounded small">
                    <div className="row">
                        <div className="col-md-6 mb-2">
                            <strong>Institution:</strong> {Institution || '-'}
                        </div>

                        <div className="col-md-6 mb-2">
                            <strong>Ownership:</strong> {OwnershipType || 'Individual'}
                        </div>

                        <div className="col-md-6 mb-2">
                            <strong>Account #:</strong> {AccountNumber}
                        </div>

                        <div className="col-md-6 mb-2">
                            <strong>Status:</strong> {AccountStatus}
                        </div>

                        <div className="col-md-6 mb-2">
                            <strong>Date Opened:</strong> {DateOpened}
                        </div>

                        <div className="col-md-6 mb-2">
                            <strong>Balance:</strong> ₹{Balance}
                        </div>

                        <div className="col-md-6 mb-2">
                            <strong>Sanction Amount:</strong> ₹{SanctionAmount || '-'}
                        </div>

                        <div className="col-md-6 mb-2">
                            <strong>Past Due:</strong> ₹{PastDueAmount || '0'}
                        </div>

                        <div className="col-md-6 mb-2">
                            <strong>Last Payment:</strong> {LastPaymentDate || '-'}
                        </div>
                    </div>
                </div>

                {/* Payment History */}
                <div className="table-responsive">
                    <h6 className="text-primary mb-2">Payment History (48 Months)</h6>

                    <table className="table table-bordered text-center small">
                        <thead className="table-light">
                        <tr>
                            <th>Year</th>
                            {allMonths.map(month => (
                                <th key={month}>{month}</th>
                            ))}
                        </tr>
                        </thead>

                        <tbody>
                        {Object.entries(paymentHistory)
                            .sort((a, b) => b[0] - a[0])
                            .map(([year, months]) => (
                                <tr key={year}>
                                    <td><strong>{year}</strong></td>
                                    {allMonths.map(month => {
                                        const val = months[month];
                                        const isLate =
                                            val &&
                                            val !== '000/*' &&
                                            !val.startsWith('NEW');

                                        return (
                                            <td
                                                key={month}
                                                className={isLate ? 'bg-danger text-white' : ''}
                                            >
                                                {val || '-'}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

            </CardBody>
        </Card>
    );
};

export default AccountHistoryCard;