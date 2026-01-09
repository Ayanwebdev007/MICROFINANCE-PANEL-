import React from "react";
import { Row, Col, Label, FormGroup, Input, Card, CardHeader, CardTitle, CardBody } from "reactstrap";

export const ProfileImages = ({ profileUrl, signUrl }) => (
    <Col md={3}>
        <Row>
            <Col md={12}>
                <div className={'thumbnail border border-secondary text-center'}>
                    <img src={profileUrl} alt="Profile" />
                </div>
            </Col>
            <Col md={12} className={'bg-white mt-2'}>
                <div className={'thumbnail border border-secondary'}>
                    <img src={signUrl} alt="Signature" />
                </div>
            </Col>
        </Row>
    </Col>
);

export const ApplicantDetailsTable = ({ applicants }) => (
    <CardBody>
        <table className="table table-borderless">
            <thead>
                <tr>
                    <th className={'text-center'}>CIF ID</th>
                    <th className={'text-center'}>Name</th>
                    <th className={'text-center'}>Guardian</th>
                    <th className={'text-center'}>Address</th>
                    <th className={'text-center'}>Phone</th>
                </tr>
            </thead>
            <tbody>
                {applicants.map((applicant) => (
                    <tr key={applicant.cif}>
                        <th className={'text-center text-info'}>{applicant.cif}</th>
                        <th className={'text-center text-info'}>{applicant.name}</th>
                        <th className={'text-center text-info'}>{applicant.guardian}</th>
                        <th className={'text-center text-info'}>{applicant.address}</th>
                        <th className={'text-center text-info'}>{applicant.phone}</th>
                    </tr>
                ))}
            </tbody>
        </table>
    </CardBody>
);

export const RepaymentFormFields = ({ details, cstError, handleAccountInput, handleCollectionAmountChange, setDetails, fetchAccountDetails }) => (
    <Row>
        <Col md={9}>
            <Row>
                <Col md={'4'}>
                    <Label>Transaction Date</Label>
                    <FormGroup>
                        <Input
                            type={'date'}
                            value={details.transDate}
                            onChange={(e) => {
                                const newDate = e.target.value;
                                setDetails(prev => ({ ...prev, transDate: newDate }));
                                if (details.account) fetchAccountDetails(details.account, newDate);
                            }}
                        />
                    </FormGroup>
                </Col>
                <Col md={'4'}>
                    <Label>Account Number</Label>
                    <FormGroup className={cstError.account ? 'has-danger' : 'has-success'}>
                        <Input type={'text'} value={details.account} onChange={handleAccountInput} />
                        <p style={{ color: 'red' }}>{cstError.account}</p>
                    </FormGroup>
                </Col>
                <Col md={'4'}>
                    <Label>Total Loan Amount</Label>
                    <FormGroup>
                        <Input type={'text'} readOnly value={details.disbursement} className={'text-info'} />
                    </FormGroup>
                </Col>
                <Col md={4}>
                    <Label>Total EMI Count</Label>
                    <FormGroup>
                        <Input type={'text'} readOnly value={details.totalEMI} className={'text-info'} />
                    </FormGroup>
                </Col>
                <Col md={4}>
                    <Label>Paid EMI Count</Label>
                    <FormGroup>
                        <Input type={'text'} readOnly value={details.paidEMI} className={'text-info'} />
                    </FormGroup>
                </Col>
                <Col md={4}>
                    <Label>Total Collection Amount</Label>
                    <FormGroup>
                        <Input
                            type="text"
                            value={details.userEnteredAmount || ""}
                            className="text-info"
                            onChange={(e) => handleCollectionAmountChange(e.target.value, details.lateFee)}
                        />
                        <p style={{ color: 'red' }}>{cstError.emiCollection}</p>
                    </FormGroup>
                </Col>
                <Col md={4}>
                    <Label>Late Fee Amount</Label>
                    <FormGroup>
                        <Input
                            type={'text'}
                            value={details.lateFee}
                            className={'text-info'}
                            onChange={(e) => handleCollectionAmountChange(details.userEnteredAmount, e.target.value)}
                        />
                    </FormGroup>
                </Col>
                <Col md={4}>
                    <Label>Previous EMI Due Amount</Label>
                    <FormGroup>
                        <Input type={'text'} readOnly value={details.previousRemainingBalance} className={'text-info'} />
                    </FormGroup>
                </Col>
                <Col md={4}>
                    <Label>Total Due EMI</Label>
                    <FormGroup>
                        <Input type={'text'} readOnly value={details.dueInfo.remaining} className={'text-info'} />
                    </FormGroup>
                </Col>
                <Col md={4}>
                    <Label>Pending EMI Till Date</Label>
                    <FormGroup>
                        <Input type={'text'} readOnly value={details.dueInfo.emiPending || 0} className={'text-info'} />
                    </FormGroup>
                </Col>
                <Col md={4}>
                    <Label>EMI Amount</Label>
                    <FormGroup>
                        <Input type={'text'} readOnly value={details.emiAmount} className={'text-info'} />
                    </FormGroup>
                </Col>
                <Col md={4}>
                    <Label>Total Amount Of Pending EMI</Label>
                    <FormGroup>
                        <Input type={'text'} readOnly value={details.dueInfo.emiAmountNeedToPay || 0} className={'text-info'} />
                    </FormGroup>
                </Col>
                <Col md={12}>
                    <Label>Narration</Label>
                    <FormGroup>
                        <Input
                            type={'text'}
                            className={'text-info'}
                            value={details.narration}
                            onChange={(e) => setDetails(prev => ({ ...prev, narration: e.target.value }))}
                        />
                    </FormGroup>
                </Col>
            </Row>
        </Col>
    </Row>
);
