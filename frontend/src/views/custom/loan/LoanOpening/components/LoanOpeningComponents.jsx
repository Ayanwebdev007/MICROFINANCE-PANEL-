import React from 'react';
import {
    Row, Col, Label, FormGroup, Input, Card, CardHeader, CardBody, CardTitle, Form
} from "reactstrap";
import Select from "react-select";
import ProfileImageUpload from "../../../components/ProfileImageUpload";

export const LoanDetailsFields = ({ formData, cstError, planList, handleInputChange, handlePlanSelect, handleLoanAmount, setFormData }) => (
    <Card>
        <CardHeader>
            <CardTitle tag="h3">Loan Details</CardTitle>
        </CardHeader>
        <CardBody>
            <Row className="d-flex flex-wrap">
                <Col md="3">
                    <Label>Loan Date*</Label>
                    <FormGroup>
                        <Input
                            type="date"
                            name="loanDate"
                            value={formData.loanDate}
                            onChange={handleInputChange}
                        />
                        <p style={{ color: 'red' }}>{cstError.loanDate}</p>
                    </FormGroup>
                </Col>
                <Col md="3">
                    <Label>Loan Plan Name*</Label>
                    <Select
                        className="react-select info"
                        classNamePrefix="react-select"
                        name="planSelect"
                        onChange={(value) => handlePlanSelect(value)}
                        options={planList}
                        placeholder="Select an Option"
                    />
                    <p style={{ color: 'red' }}>{cstError.planId}</p>
                </Col>
                <Col md="3">
                    <FormGroup>
                        <Label>Loan Name *</Label>
                        <Input
                            type="text"
                            name="name"
                            value={formData.planDetails.name}
                            readOnly
                        />
                    </FormGroup>
                </Col>
                <Col md="3">
                    <FormGroup>
                        <Label>Loan Type *</Label>
                        <Input
                            type="text"
                            name="name"
                            value={formData.planDetails.type}
                            readOnly
                        />
                    </FormGroup>
                </Col>
                <Col md="3">
                    <FormGroup>
                        <Label>Loan EMI Mode *</Label>
                        <Input
                            type="text"
                            name="name"
                            value={formData.planDetails.emiMode}
                            readOnly
                        />
                    </FormGroup>
                </Col>
                <Col md="3">
                    <FormGroup>
                        <Label>Interest Calculation Method</Label>
                        <Input
                            type="text"
                            name="name"
                            value={formData.planDetails.calculationMethod}
                            readOnly
                        />
                    </FormGroup>
                </Col>
                <Col md="3">
                    <FormGroup>
                        <Label>Min Age *</Label>
                        <Input
                            type="number"
                            name="minAge"
                            value={formData.planDetails.minAge}
                            readOnly
                        />
                    </FormGroup>
                </Col>
                <Col md="3">
                    <FormGroup>
                        <Label>Max Age *</Label>
                        <Input
                            type="number"
                            name="maxAge"
                            value={formData.planDetails.maxAge}
                            readOnly
                        />
                    </FormGroup>
                </Col>
                <Col md="3">
                    <FormGroup>
                        <Label>Min Amount *</Label>
                        <Input
                            type="number"
                            name="minAmount"
                            value={formData.planDetails.minAmount}
                            readOnly
                        />
                    </FormGroup>
                </Col>
                <Col md="3">
                    <FormGroup>
                        <Label>Max Amount *</Label>
                        <Input
                            type="number"
                            name="maxAmount"
                            value={formData.planDetails.maxAmount}
                            readOnly
                        />
                    </FormGroup>
                </Col>
                <Col md="3">
                    <FormGroup>
                        <Label>{`Total Tenure (${formData.planDetails.emiInterval})`}</Label>
                        <Input
                            type="number"
                            name="minTerm"
                            value={formData.planDetails.emiCount}
                            readOnly
                        />
                    </FormGroup>
                </Col>
                <Col md="3">
                    <FormGroup>
                        <Label>Interest Rate *</Label>
                        <Input
                            type="number"
                            name="interestRate"
                            value={formData.planDetails.interestRate}
                            readOnly
                        />
                    </FormGroup>
                </Col>
                <Col md="3">
                    <FormGroup>
                        <Label>Security Type</Label>
                        <Input
                            type='text'
                            name="security"
                            value={formData.planDetails.security}
                            readOnly
                        />
                    </FormGroup>
                </Col>
                <Col md={3}>
                    <FormGroup>
                        <Label>Loan Amount *</Label>
                        <Input
                            type='number'
                            name="amount"
                            value={formData.amount}
                            onChange={(event) => handleLoanAmount(event.target.value)}
                        />
                    </FormGroup>
                </Col>
                <Col md={3}>
                    <FormGroup>
                        <Label>EMI Amount *</Label>
                        <Input
                            type='text'
                            name="security"
                            value={formData.emiAmount}
                            readOnly
                        />
                    </FormGroup>
                </Col>
                <Col md="3">
                    <FormGroup>
                        <Label>First EMI Date *</Label>
                        <Input
                            type="date"
                            value={formData.firstEmiDate}
                            min={new Date().toISOString().slice(0, 10)}
                            onChange={(e) => {
                                const dateStr = e.target.value;
                                if (dateStr) {
                                    const selectedDate = new Date(dateStr);
                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);
                                    selectedDate.setHours(0, 0, 0, 0);

                                    if (selectedDate <= today) {
                                        setFormData(prev => ({ ...prev, firstEmiDate: "" }));
                                        return;
                                    }
                                    setFormData(prev => ({ ...prev, firstEmiDate: dateStr }));
                                } else {
                                    setFormData(prev => ({ ...prev, firstEmiDate: "" }));
                                }
                            }}
                        />
                    </FormGroup>
                </Col>
            </Row>
        </CardBody>
    </Card>
);

export const MemberDetailsFields = ({ formData, memberData, cstError, getMemberData }) => (
    <Card>
        <CardHeader>
            <CardTitle tag="h3">Member Details</CardTitle>
        </CardHeader>
        <CardBody>
            <Row className="d-flex flex-wrap">
                <Col md="3">
                    <FormGroup>
                        <Label>Member ID</Label>
                        <Input
                            type="text"
                            name="memberId"
                            value={formData.memberId}
                            onChange={getMemberData}
                        />
                        <p style={{ color: 'red' }}>{cstError.memberId}</p>
                    </FormGroup>
                </Col>
                <Col className="pr-1" md="3">
                    <Label>Member Name</Label>
                    <FormGroup>
                        <Input type={'text'} value={memberData.name} readOnly={true} />
                    </FormGroup>
                </Col>
                <Col className="pr-1" md="3">
                    <Label>Father/Mother/Spouse</Label>
                    <FormGroup>
                        <Input type={'text'} value={memberData.guardian} readOnly={true} />
                    </FormGroup>
                </Col>
                <Col className="pr-1" md="3">
                    <Label>Gender</Label>
                    <Input type={'text'} value={memberData.gender} readOnly={true} />
                </Col>
                <Col className="pr-1" md="3">
                    <Label>Registration Date</Label>
                    <FormGroup>
                        <Input type={'date'} value={memberData.date} readOnly={true} />
                    </FormGroup>
                </Col>
                <Col className="pr-1" md="3">
                    <Label>Date of Birth</Label>
                    <FormGroup>
                        <Input type={'date'} value={memberData.dob} readOnly={true} />
                    </FormGroup>
                </Col>
                <Col className="pr-1" md={'3'}>
                    <Label>Material Status</Label>
                    <Input type="text" name="select" id="materialStatus" value={memberData.materialStatus} readOnly={true} />
                </Col>
                <Col className="pr-1" md={'3'}>
                    <Label>Phone Number</Label>
                    <FormGroup>
                        <Input type={'text'} value={memberData.phone} readOnly={true} />
                    </FormGroup>
                </Col>
                <Col className="pr-1" md={'3'}>
                    <Label>Email</Label>
                    <FormGroup>
                        <Input type={'email'} value={memberData.email} readOnly={true} />
                    </FormGroup>
                </Col>
                <Col className="pr-1" md={'3'}>
                    <Label>Aadhar Number</Label>
                    <FormGroup>
                        <Input type={'text'} value={memberData.aadhar} readOnly={true} />
                    </FormGroup>
                </Col>
                <Col className="pr-1" md={'3'}>
                    <Label>Voter Number</Label>
                    <FormGroup>
                        <Input type={'text'} value={memberData.voter} readOnly={true} />
                    </FormGroup>
                </Col>
                <Col className="pr-1" md={'3'}>
                    <Label>PAN Number</Label>
                    <FormGroup>
                        <Input type={'text'} value={memberData.pan} readOnly={true} />
                    </FormGroup>
                </Col>
                <Col className="pr-1" md={'3'}>
                    <Label>Monthly Income</Label>
                    <FormGroup>
                        <Input type={'number'} value={memberData.income} readOnly={true} />
                    </FormGroup>
                </Col>
                <Col className="pr-1" md={'3'}>
                    <Label>Occupation</Label>
                    <FormGroup>
                        <Input type={'text'} value={memberData.occupation} readOnly={true} />
                    </FormGroup>
                </Col>
                <Col className="pr-1" md={'3'}>
                    <Label>Educational Qualification</Label>
                    <FormGroup>
                        <Input type={'text'} value={memberData.education} readOnly={true} />
                    </FormGroup>
                </Col>
                <Col className="pr-1" md={'12'}>
                    <Label>Full Address with Pin Code</Label>
                    <FormGroup>
                        <Input type={'textarea'} value={memberData.address} readOnly={true} />
                    </FormGroup>
                </Col>
            </Row>
        </CardBody>
    </Card>
);

export const PhotoUploadSection = ({ uuid, bankId }) => (
    <Card>
        <CardHeader>
            <CardTitle tag="h3">Photo Upload </CardTitle>
        </CardHeader>
        <CardBody>
            <Row>
                <Col md="4" className={'text-center'}>
                    <ProfileImageUpload
                        id={'profile'}
                        uuid={uuid}
                        bankId={bankId}
                        changeBtnClasses="btn-simple"
                        addBtnClasses="btn-simple"
                        removeBtnClasses="btn-simple"
                    />
                    <p className="mt-2">Upload the profile photo here.</p>
                </Col>
                <Col md="4" className={'text-center'}>
                    <ProfileImageUpload
                        id={'profile-joint'}
                        uuid={uuid}
                        bankId={bankId}
                        changeBtnClasses="btn-simple"
                        addBtnClasses="btn-simple"
                        removeBtnClasses="btn-simple"
                    />
                    <p className="mt-2">Upload the joint photo here.</p>
                </Col>
                <Col md="4" className={'text-center'}>
                    <ProfileImageUpload
                        id={'signature'}
                        uuid={uuid}
                        bankId={bankId}
                        changeBtnClasses="btn-simple"
                        addBtnClasses="btn-simple"
                        removeBtnClasses="btn-simple"
                    />
                    <p className="mt-2">Upload the Signature here.</p>
                </Col>
            </Row>
        </CardBody>
    </Card>
);

export const GuarantorDetailsFields = ({ guarantor, cstError, handleNestedInputChange }) => (
    <Card>
        <CardHeader>
            <CardTitle tag="h3">Guarantor Details</CardTitle>
        </CardHeader>
        <CardBody>
            <Form>
                <Row>
                    <Col md="3">
                        <Label>Member Code</Label>
                        <FormGroup>
                            <Input
                                type="text"
                                name="memberCode"
                                value={guarantor.memberCode}
                                onChange={(e) => handleNestedInputChange('guarantor', 'memberCode', e.target.value)}
                            />
                            <p style={{ color: 'red' }}>{cstError.guarantor?.memberCode}</p>
                        </FormGroup>
                    </Col>
                    <Col md="3">
                        <Label>Guarantor Name</Label>
                        <FormGroup>
                            <Input
                                type="text"
                                name="guarantorName"
                                value={guarantor.guarantorName}
                                onChange={(e) => handleNestedInputChange('guarantor', 'guarantorName', e.target.value)}
                            />
                            <p style={{ color: 'red' }}>{cstError.guarantor?.guarantorName}</p>
                        </FormGroup>
                    </Col>
                    <Col md="3">
                        <Label>Address</Label>
                        <FormGroup>
                            <Input
                                type="text"
                                name="address"
                                value={guarantor.address}
                                onChange={(e) => handleNestedInputChange('guarantor', 'address', e.target.value)}
                            />
                            <p style={{ color: 'red' }}>{cstError.guarantor?.address}</p>
                        </FormGroup>
                    </Col>
                    <Col md="3">
                        <Label>Pin Code</Label>
                        <FormGroup>
                            <Input
                                type="number"
                                name="pinCode"
                                value={guarantor.pinCode}
                                onChange={(e) => handleNestedInputChange('guarantor', 'pinCode', e.target.value)}
                            />
                            <p style={{ color: 'red' }}>{cstError.guarantor?.pinCode}</p>
                        </FormGroup>
                    </Col>
                    <Col md="3">
                        <Label>Phone</Label>
                        <FormGroup>
                            <Input
                                type="number"
                                name="phone"
                                value={guarantor.phone}
                                onChange={(e) => handleNestedInputChange('guarantor', 'phone', e.target.value)}
                            />
                            <p style={{ color: 'red' }}>{cstError.guarantor?.phone}</p>
                        </FormGroup>
                    </Col>
                    <Col md="3">
                        <Label>Security Type</Label>
                        <FormGroup>
                            <Input
                                type="text"
                                name="securityType"
                                value={guarantor.securityType}
                                onChange={(e) => handleNestedInputChange('guarantor', 'securityType', e.target.value)}
                            />
                            <p style={{ color: 'red' }}>{cstError.guarantor?.securityType}</p>
                        </FormGroup>
                    </Col>
                </Row>
            </Form>
        </CardBody>
    </Card>
);

export const CoApplicantDetailsFields = ({ coApplicant, cstError, handleNestedInputChange }) => (
    <Card>
        <CardHeader>
            <CardTitle tag="h3">Co-Applicant Details</CardTitle>
        </CardHeader>
        <CardBody>
            <Form>
                <Row>
                    <Col md="3">
                        <Label>Member Code</Label>
                        <FormGroup>
                            <Input
                                type="text"
                                name="memberCode"
                                value={coApplicant.memberCode}
                                onChange={(e) => handleNestedInputChange('coApplicant', 'memberCode', e.target.value)}
                            />
                            <p style={{ color: 'red' }}>{cstError.coApplicant?.memberCode}</p>
                        </FormGroup>
                    </Col>
                    <Col md="3">
                        <Label>Co-Applicant Name</Label>
                        <FormGroup>
                            <Input
                                type="text"
                                name="coApplicantname"
                                value={coApplicant.coApplicantname}
                                onChange={(e) => handleNestedInputChange('coApplicant', 'coApplicantname', e.target.value)}
                            />
                            <p style={{ color: 'red' }}>{cstError.coApplicant?.coApplicantname}</p>
                        </FormGroup>
                    </Col>
                    <Col md="3">
                        <Label>Address</Label>
                        <FormGroup>
                            <Input
                                type="text"
                                name="address"
                                value={coApplicant.address}
                                onChange={(e) => handleNestedInputChange('coApplicant', 'address', e.target.value)}
                            />
                            <p style={{ color: 'red' }}>{cstError.coApplicant?.address}</p>
                        </FormGroup>
                    </Col>
                    <Col md="3">
                        <Label>Pin Code</Label>
                        <FormGroup>
                            <Input
                                type="number"
                                name="pinCode"
                                value={coApplicant.pinCode}
                                onChange={(e) => handleNestedInputChange('coApplicant', 'pinCode', e.target.value)}
                            />
                            <p style={{ color: 'red' }}>{cstError.coApplicant?.pinCode}</p>
                        </FormGroup>
                    </Col>
                    <Col md="3">
                        <Label>Phone</Label>
                        <FormGroup>
                            <Input
                                type="number"
                                name="phone"
                                value={coApplicant.phone}
                                onChange={(e) => handleNestedInputChange('coApplicant', 'phone', e.target.value)}
                            />
                            <p style={{ color: 'red' }}>{cstError.coApplicant?.phone}</p>
                        </FormGroup>
                    </Col>
                    <Col md="3">
                        <Label>Security Details</Label>
                        <FormGroup>
                            <Input
                                type="text"
                                name="securityDetails"
                                value={coApplicant.securityDetails}
                                onChange={(e) => handleNestedInputChange('coApplicant', 'securityDetails', e.target.value)}
                            />
                            <p style={{ color: 'red' }}>{cstError.coApplicant?.securityDetails}</p>
                        </FormGroup>
                    </Col>
                </Row>
            </Form>
        </CardBody>
    </Card>
);

export const DeductionDetailsFields = ({ deductionDetails, cstError, handleNestedInputChange }) => (
    <Card>
        <CardHeader>
            <CardTitle tag="h3">Deduction Details</CardTitle>
        </CardHeader>
        <CardBody>
            <Form>
                <Row>
                    <Col md="3">
                        <Label>Processing Fee</Label>
                        <FormGroup>
                            <Input
                                type="number"
                                name="processingFee"
                                value={deductionDetails.processingFee}
                                onChange={(e) => handleNestedInputChange('deductionDetails', 'processingFee', e.target.value)}
                            />
                            <p style={{ color: 'red' }}>{cstError.deductionDetails?.processingFee}</p>
                        </FormGroup>
                    </Col>
                    <Col md="3">
                        <Label>Legal Amount</Label>
                        <FormGroup>
                            <Input
                                type="number"
                                name="legalAmount"
                                value={deductionDetails.legalAmount}
                                onChange={(e) => handleNestedInputChange('deductionDetails', 'legalAmount', e.target.value)}
                            />
                            <p style={{ color: 'red' }}>{cstError.deductionDetails?.legalAmount}</p>
                        </FormGroup>
                    </Col>
                    <Col md="3">
                        <Label>GST</Label>
                        <FormGroup>
                            <Input
                                type="text"
                                name="gst"
                                value={deductionDetails.gst}
                                onChange={(e) => handleNestedInputChange('deductionDetails', 'gst', e.target.value)}
                            />
                            <p style={{ color: 'red' }}>{cstError.deductionDetails?.gst}</p>
                        </FormGroup>
                    </Col>
                    <Col md="3">
                        <Label>Insurance Amount</Label>
                        <FormGroup>
                            <Input
                                type="number"
                                name="insuranceAmount"
                                value={deductionDetails.insuranceAmount}
                                onChange={(e) => handleNestedInputChange('deductionDetails', 'insuranceAmount', e.target.value)}
                            />
                            <p style={{ color: 'red' }}>{cstError.deductionDetails?.insuranceAmount}</p>
                        </FormGroup>
                    </Col>
                </Row>
            </Form>
        </CardBody>
    </Card>
);
