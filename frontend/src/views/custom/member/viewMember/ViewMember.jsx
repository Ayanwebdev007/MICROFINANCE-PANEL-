// import React, {useEffect, useRef, useState} from "react";
// import {Button, Card, CardBody, CardHeader, CardTitle, Col, FormGroup, Label, Row, Spinner,} from "reactstrap";
// import {AgGridReact} from "ag-grid-react";
// import axios from "axios";
// import {useLocation} from "react-router-dom";
// import CstNotification from "../../components/CstNotification";
// import Select from "react-select";
// import {getStorage, ref, getDownloadURL} from "firebase/storage";
// import {useSelector} from "react-redux";
//
// const ViewMembers = () => {
//     const gridRef = useRef(null);
//     const location = useLocation();
//     const prefillKycId = location.state?.kycId || "";
//     const [rowData, setRowData] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [message, setMessage] = useState("Loading members...");
//     const [fetched, setFetched] = React.useState(false);
//     const [bankDropDown, setBankDropDown] = React.useState([]);
//     const [profileImage, setProfileImage] = useState('#');
//     const [signatureImage, setSignatureImage] = useState('#');
//
//     const [alert, setAlert] = useState({
//         display: false,
//         color: "success",
//         message: "",
//         autoDismiss: 7,
//         place: "tc",
//         timestamp: new Date().getTime(),
//     });
//     const [currentView, setCurrentView] = useState('list'); // 'list' or 'form'
//     const [selectedMember, setSelectedMember] = useState(null);
//
//     const authStatus = useSelector((state) => state.auth.authState);
//     const storage = getStorage();
//
//     const COLUMN_DEFINITIONS = [
//         {
//             headerName: "KYC ID",
//             cellRenderer: (params) => (
//                 <div className="form-inline">
//                     {authStatus.accessLevel?.memberDelete || authStatus.role === 'admin' || authStatus.role === 'root' ?<Button
//                         className="fa fa-trash btn-icon mr-2"
//                         color="danger"
//                         type="button"
//                         size="sm"
//                         onClick={() => handleDelete(params.data)}
//                     />: null}
//                     <Button
//                         color="link"
//                         size="sm"
//                         className="p-0 text-info"
//                         onClick={() => {
//                             fetchImageSignature(params.data.uuid);
//                             setSelectedMember(params.data);
//                             setCurrentView('form');
//                         }}
//                     >{params.data.id}</Button>
//                 </div>
//             ),
//             suppressSorting: true,
//             suppressFilter: true,
//         },
//         { field: "name", headerName: "NAME" },
//         { field: "guardian", headerName: "FATHER/MOTHER/SPOUSE" },
//         { field: "date", headerName: "JOINING DATE" },
//         { field: "address", headerName: "ADDRESS" },
//         { field: "phone", headerName: "PHONE NUMBER" },
//         { field: "aadhar", headerName: "AADHAR NUMBER" },
//         { field: "pan", headerName: "PAN NUMBER" },
//     ];
//
//     const defaultColDef = {
//         filter: true,
//         floatingFilter: true,
//     };
//
//     useEffect(() => {
//         const fetchMembers = async () => {
//             try {
//                 setLoading(true);
//                 const response = await fetchAllMembers();
//                 if (response?.data?.success) {
//                     let members = response.data.data;
//
//                     if (prefillKycId) {
//                         members = members.filter((m) => m.id === prefillKycId);
//                         setMessage(`Showing result for KYC ID: ${prefillKycId}`);
//                     } else {
//                         setMessage("All Members.");
//                     }
//
//                     setRowData(members);
//                 } else {
//                     throw new Error(response.data.error || "Failed to load members");
//                 }
//             } catch (error) {
//                 const errorMessage = error.message || "Something went wrong.";
//                 setAlert({
//                     display: true,
//                     color: "danger",
//                     message: errorMessage,
//                     autoDismiss: 7,
//                     place: "tc",
//                     timestamp: new Date().getTime(),
//                 });
//                 setMessage("Could not load member data.");
//             } finally {
//                 setLoading(false);
//             }
//         };
//
//         fetchMembers();
//     }, [prefillKycId]);
//
//     const fetchAllMembers = async (bankId) => {
//         return await axios.get("/api/member/get-all-members", {
//             params: {bankId}
//         });
//     };
//
//     if (!fetched) {
//         setFetched(true);
//         axios.get('/api/member/get-associated-branch-restrictive')
//             .then(function (value) {
//                 if (value.data.success) {
//                     setBankDropDown(value.data.data);
//                 }else {
//                     setAlert({
//                         color: 'warning',
//                         message: value.data.error,
//                         autoDismiss: 7,
//                         place: 'tc',
//                         display: true,
//                         sweetAlert: false,
//                         timestamp: Date.now().toLocaleString(),
//                     });
//                 }
//             })
//             .catch(function (error) {
//                 setAlert({
//                     color: 'warning',
//                     message: error.toLocaleString(),
//                     autoDismiss: 7, place: 'tc',
//                     display: true,
//                     sweetAlert: false,
//                     timestamp: Date.now().toLocaleString(),
//                 });
//             });
//     }
//
//     async function handleBankSelect(selectedOption) {
//         try {
//             const fetchData = await fetchAllMembers(selectedOption.key);
//             if (fetchData.data.success) {
//                 setRowData(fetchData.data.data);
//                 setMessage(`Members of ${selectedOption.label}`);
//             } else {
//                 setRowData([]);
//                 setAlert({
//                     color: 'warning',
//                     message: fetchData.data.error,
//                     autoDismiss: 7,
//                     place: 'tc',
//                     display: true,
//                     sweetAlert: false,
//                     timestamp: Date.now().toLocaleString(),
//                 });
//             }
//         }catch (e) {
//             setRowData([]);
//             setAlert({
//                 color: 'danger',
//                 message: e.toLocaleString(),
//                 autoDismiss: 7,
//                 place: 'tc',
//                 display: true,
//                 sweetAlert: false,
//                 timestamp: Date.now().toLocaleString(),
//             });
//         }
//     }
//
//     const exportToCSV = () => {
//         if (gridRef.current?.api) {
//             const date = new Date().toISOString().slice(0, 10);
//             gridRef.current.api.exportDataAsCsv({
//                 fileName: `members_list_${date}.csv`,
//             });
//         }
//     };
//
//     const backToList = () => {
//         setCurrentView('list');
//         setSelectedMember(null);
//     };
//     const handleDelete = async (member) => {
//         const confirmDelete = window.confirm(
//             `Are you sure you want to delete member: ${member.name} (KYC ID: ${member.id})?`
//         );
//
//         if (!confirmDelete) return;
//         try {
//             const payload = { id: member.id, bankId: member.bankId };
//             const res = await axios.post('/api/member/delete-member', payload);
//
//             if (res.data && res.data.success) {
//                 setAlert({
//                     color: 'success',
//                     message: res.data.success,
//                     autoDismiss: 7,
//                     place: 'tc',
//                     display: true,
//                     sweetAlert: true,
//                     timestamp: new Date().getTime(),
//                 });
//
//                 // remove deleted member from rowData
//                 setRowData((prev) => prev.filter((m) => m.id !== member.id));
//             } else {
//                 setAlert({
//                     color: 'warning',
//                     message: (res.data && res.data.error) ? res.data.error : 'Failed to delete member',
//                     autoDismiss: 7,
//                     place: 'tc',
//                     display: true,
//                     sweetAlert: false,
//                     timestamp: new Date().getTime(),
//                 });
//             }
//         } catch (error) {
//             setAlert({
//                 color: 'danger',
//                 message: error.toString(),
//                 autoDismiss: 7,
//                 place: 'tc',
//                 display: true,
//                 sweetAlert: false,
//                 timestamp: new Date().getTime(),
//             });
//         }
//     }
//
//     function fetchImageSignature(uuid) {
//         if (uuid !== '' && uuid !== '#'){
//             const profileImageRef = ref(storage, `/${authStatus.bankId}/image-assets/profile/${uuid}`);
//             getDownloadURL(profileImageRef).then((url) => {
//                 setProfileImage(url);
//             }).catch(() => {
//                 setProfileImage('#');
//             });
//
//             const signatureImageRef = ref(storage, `/${authStatus.bankId}/image-assets/signature/${uuid}`);
//             getDownloadURL(signatureImageRef).then((url) => {
//                 setSignatureImage(url);
//             }).catch(() => {
//                 setSignatureImage('#');
//             });
//         }
//     }
//
//     const printMemberForm = async () => {
//         try {
//             setAlert({
//                 display: true,
//                 color: "info",
//                 message: "Generating PDF...",
//                 autoDismiss: 3,
//                 place: "tc",
//                 timestamp: new Date().getTime(),
//             });
//
//             const response = await axios.post('/api/member/print-kyc-form', {
//                 memberId: selectedMember.id,
//                 bankId: selectedMember.bankId
//             }, {
//                 responseType: 'blob' // Important for handling binary data
//             });
//
//             // Create blob and download
//             const blob = new Blob([response.data], { type: 'application/pdf' });
//             const url = window.URL.createObjectURL(blob);
//             const link = document.createElement('a');
//             link.href = url;
//             link.download = `KYC_Form_${selectedMember.id}.pdf`;
//             document.body.appendChild(link);
//             link.click();
//             document.body.removeChild(link);
//             window.URL.revokeObjectURL(url);
//
//             setAlert({
//                 display: true,
//                 color: "success",
//                 message: "PDF generated successfully!",
//                 autoDismiss: 5,
//                 place: "tc",
//                 timestamp: new Date().getTime(),
//             });
//
//         } catch (error) {
//             console.error('Error generating PDF:', error);
//             setAlert({
//                 display: true,
//                 color: "danger",
//                 message: "Failed to generate PDF. Please try again.",
//                 autoDismiss: 7,
//                 place: "tc",
//                 timestamp: new Date().getTime(),
//             });
//         }
//     };
//
//     const renderFormField = (label, value) => (
//         <div className="form-row" key={label}>
//             <div className="form-label">{label}:</div>
//             <div className="form-value">{value || ''}</div>
//         </div>
//     );
//
//     // Render Member List View
//     if (currentView === 'list') {
//         return (
//             <>
//                 <div className="rna-container">
//                     {alert.display && (
//                         <CstNotification
//                             color={alert.color}
//                             message={alert.message}
//                             autoDismiss={alert.autoDismiss}
//                             place={alert.place}
//                             timestamp={alert.timestamp}
//                         />
//                     )}
//                 </div>
//
//                 <div className="content">
//                     <Row>
//                         <Col md="12">
//                             <Card>
//                                 <CardHeader>
//                                     <CardTitle tag="h3">Branch Selection</CardTitle>
//                                 </CardHeader>
//                                 <CardBody>
//                                     <Row>
//                                         <Col md="6">
//                                             <Label>Select a Branch</Label>
//                                             <FormGroup>
//                                                 <Select
//                                                     className="react-select info"
//                                                     classNamePrefix="react-select"
//                                                     name="bankSelect"
//                                                     onChange={handleBankSelect}
//                                                     options={bankDropDown}
//                                                     placeholder="Choose branch..."
//                                                 />
//                                             </FormGroup>
//                                         </Col>
//                                     </Row>
//                                 </CardBody>
//                             </Card>
//                         </Col>
//                     </Row>
//
//                     <Row>
//                         <Col md="12" className="mb-5">
//                             <Card>
//                                 <CardHeader>
//                                     <CardTitle tag="h4">Member List</CardTitle>
//                                     <Button
//                                         color="success"
//                                         size="sm"
//                                         onClick={exportToCSV}
//                                         style={{ marginLeft: "10px" }}
//                                     >
//                                         Export to CSV
//                                     </Button>
//                                 </CardHeader>
//                                 <CardBody style={{ height: window.innerHeight - 300 }}>
//                                     <div
//                                         style={{
//                                             marginBottom: "1rem",
//                                             textAlign: "center",
//                                             fontStyle: "italic",
//                                             color: loading ? "gray" : "green",
//                                         }}
//                                     >
//                                         <Spinner color="info" hidden={!loading} />{" "}
//                                         {loading ? "Loading members..." : message}
//                                     </div>
//
//                                     <AgGridReact
//                                         ref={gridRef}
//                                         rowData={rowData}
//                                         columnDefs={COLUMN_DEFINITIONS}
//                                         defaultColDef={defaultColDef}
//                                         rowHeight={35}
//                                         headerHeight={40}
//                                         animateRows={true}
//                                         overlayNoRowsTemplate={'<span>No members found</span>'}
//                                         enableCellTextSelection={true}
//                                     />
//                                 </CardBody>
//                             </Card>
//                         </Col>
//                     </Row>
//                 </div>
//             </>
//         );
//     }
//
//     // Render KYC Form View
//     return (
//         <>
//             <div className="rna-container">
//                 {alert.display && (
//                     <CstNotification
//                         color={alert.color}
//                         message={alert.message}
//                         autoDismiss={alert.autoDismiss}
//                         place={alert.place}
//                         timestamp={alert.timestamp}
//                     />
//                 )}
//             </div>
//
//             <div className="content">
//                 <Row>
//                     <Col md="12">
//                         <Card>
//                             <CardHeader>
//                                 <CardTitle tag="h3">
//                                     KYC Form - {selectedMember?.name || "Member"}
//                                 </CardTitle>
//                                 <div className="no-print">
//                                     <Button color="secondary" onClick={backToList} className="mr-2">
//                                         <i className="fas fa-arrow-left"></i> Back to List
//                                     </Button>
//                                     <Button color="primary" onClick={printMemberForm}>
//                                         <i className="fas fa-download"></i> Download PDF
//                                     </Button>
//                                 </div>
//                             </CardHeader>
//                             <CardBody>
//                                 <div id="kyc-form-container" className="kyc-form-container">
//                                     {/* Form Header */}
//                                     <center>
//                                         <div className="form-header mt-2 mb-4">
//                                             <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
//                                                 KNOW YOUR CUSTOMER (KYC) FORM
//                                             </h2>
//                                             <p style={{ margin: '5px 0', fontSize: '14px' }}>Member Information Sheet</p>
//                                         </div>
//                                     </center>
//                                     <Row>
//                                         <Col md="8">
//                                             {/* Personal Information Section */}
//                                             <div className="form-section">
//                                                 <h4 style={{ borderBottom: '2px solid #000', paddingBottom: '5px', marginBottom: '15px' }}>
//                                                     PERSONAL INFORMATION
//                                                 </h4>
//                                                 <Row>
//                                                     <Col md="6">
//                                                         {renderFormField('KYC ID', selectedMember?.id)}
//                                                         {renderFormField('Full Name', selectedMember?.name)}
//                                                         {renderFormField('Father/Mother/Spouse Name', selectedMember?.guardian)}
//                                                         {renderFormField('Date of Birth', selectedMember?.dob)}
//                                                         {renderFormField('Gender', selectedMember?.gender)}
//                                                         {renderFormField('Religion', selectedMember?.religion)}
//                                                     </Col>
//                                                     <Col md="6">
//                                                         {renderFormField('Marital Status', selectedMember?.materialStatus)}
//                                                         {renderFormField('Email', selectedMember?.email)}
//                                                         {renderFormField('Phone Number', selectedMember?.phone)}
//                                                         {renderFormField('Joining Date', selectedMember?.date)}
//                                                     </Col>
//                                                 </Row>
//                                                 <Row>
//                                                     <Col md="12">
//                                                         {renderFormField('Address', selectedMember?.address)}
//                                                     </Col>
//                                                 </Row>
//                                             </div>
//
//                                             {/* Identification Documents */}
//                                             <div className="form-section">
//                                                 <h4 style={{ borderBottom: '2px solid #000', paddingBottom: '5px', marginBottom: '15px' }}>
//                                                     IDENTIFICATION DOCUMENTS
//                                                 </h4>
//                                                 <Row>
//                                                     <Col md="6">
//                                                         {renderFormField('Aadhar Number', selectedMember?.aadhar)}
//                                                         {renderFormField('PAN Number', selectedMember?.pan)}
//                                                     </Col>
//                                                     <Col md="6">
//                                                         {renderFormField('Voter ID', selectedMember?.voter)}
//                                                     </Col>
//                                                 </Row>
//                                             </div>
//
//                                             {/* Residential Information */}
//                                             <div className="form-section">
//                                                 <h4 style={{ borderBottom: '2px solid #000', paddingBottom: '5px', marginBottom: '15px' }}>
//                                                     RESIDENTIAL INFORMATION
//                                                 </h4>
//                                                 <Row>
//                                                     <Col md="6">
//                                                         {renderFormField('Area Type', selectedMember?.areaType)}
//                                                         {renderFormField('House Type', selectedMember?.houseType)}
//                                                         {renderFormField('Residing Since', selectedMember?.residingSince)}
//                                                     </Col>
//                                                     <Col md="6">
//                                                         {renderFormField('Residential Land', selectedMember?.residentialLand)}
//                                                         {renderFormField('Agriculture Land', selectedMember?.agricultureLand)}
//                                                     </Col>
//                                                 </Row>
//                                             </div>
//
//                                             {/* Professional Information */}
//                                             <div className="form-section">
//                                                 <h4 style={{ borderBottom: '2px solid #000', paddingBottom: '5px', marginBottom: '15px' }}>
//                                                     PROFESSIONAL INFORMATION
//                                                 </h4>
//                                                 <Row>
//                                                     <Col md="6">
//                                                         {renderFormField('Occupation', selectedMember?.occupation)}
//                                                         {renderFormField('Monthly Income', selectedMember?.income)}
//                                                     </Col>
//                                                     <Col md="6">
//                                                         {renderFormField('Education', selectedMember?.education)}
//                                                     </Col>
//                                                 </Row>
//                                             </div>
//                                         </Col>
//
//                                         <Col md="4">
//                                             {/* Photo and Signature Section */}
//                                             <div className="form-section">
//                                                 <h4 style={{ borderBottom: '2px solid #000', paddingBottom: '5px', marginBottom: '15px' }}>
//                                                     PHOTO & SIGNATURE
//                                                 </h4>
//                                                 <div style={{ textAlign: 'center', marginBottom: '20px' }}>
//                                                     <div className="photo-box" style={{
//                                                         width: '150px',
//                                                         height: '180px',
//                                                         border: '2px solid #000',
//                                                         margin: '0 auto 10px',
//                                                         display: 'flex',
//                                                         alignItems: 'center',
//                                                         justifyContent: 'center'
//                                                     }}>
//                                                         {selectedMember?.uuid ?
//                                                             <img src={profileImage} alt="Member" style={{width: '100%', height: '100%', objectFit: 'cover'}} /> :
//                                                             'PHOTO'
//                                                         }
//                                                     </div>
//                                                     <small>Member Photo</small>
//                                                 </div>
//                                                 <div style={{ textAlign: 'center' }}>
//                                                     <div className="signature-box" style={{
//                                                         width: '150px',
//                                                         height: '80px',
//                                                         border: '2px solid #000',
//                                                         margin: '0 auto 10px',
//                                                         display: 'flex',
//                                                         alignItems: 'center',
//                                                         justifyContent: 'center'
//                                                     }}>
//                                                         {selectedMember?.signature ?
//                                                             <img src={signatureImage} alt="Signature" style={{width: '100%', height: '100%', objectFit: 'cover'}} /> :
//                                                             'SIGNATURE'
//                                                         }
//                                                     </div>
//                                                     <small>Member Signature</small>
//                                                 </div>
//                                             </div>
//                                         </Col>
//                                     </Row>
//
//                                     {/* Nominee Information */}
//                                     <div className="form-section">
//                                         <h4 style={{ borderBottom: '2px solid #000', paddingBottom: '5px', marginBottom: '15px' }}>
//                                             NOMINEE INFORMATION
//                                         </h4>
//                                         <Row>
//                                             <Col md="6">
//                                                 {renderFormField('Nominee Name', selectedMember?.nominee?.name)}
//                                                 {renderFormField('Relation to Applicant', selectedMember?.nominee?.relation)}
//                                                 {renderFormField('Date of Birth', selectedMember?.nominee?.dob)}
//                                                 {renderFormField('Gender', selectedMember?.nominee?.gender)}
//                                             </Col>
//                                             <Col md="6">
//                                                 {renderFormField('Aadhar Number', selectedMember?.nominee?.aadhar)}
//                                                 {renderFormField('Voter ID', selectedMember?.nominee?.voter)}
//                                                 {renderFormField('PAN Number', selectedMember?.nominee?.pan)}
//                                             </Col>
//                                         </Row>
//                                     </div>
//
//                                     {/* Family Information */}
//                                     <div className="form-section">
//                                         <h4 style={{ borderBottom: '2px solid #000', paddingBottom: '5px', marginBottom: '15px' }}>
//                                             FAMILY INFORMATION
//                                         </h4>
//                                         <Row>
//                                             <Col md="6">
//                                                 {renderFormField('Members Above 18', selectedMember?.familyMembers?.membersAbove18)}
//                                                 {renderFormField('Members Below 18', selectedMember?.familyMembers?.membersBelow18)}
//                                                 {renderFormField('Male Members', selectedMember?.familyMembers?.male)}
//                                             </Col>
//                                             <Col md="6">
//                                                 {renderFormField('Female Members', selectedMember?.familyMembers?.female)}
//                                                 {renderFormField('Earning Members', selectedMember?.familyMembers?.earningMembers)}
//                                             </Col>
//                                         </Row>
//                                     </div>
//
//                                     {/* Bank Information */}
//                                     <div className="form-section">
//                                         <h4 style={{ borderBottom: '2px solid #000', paddingBottom: '5px', marginBottom: '15px' }}>
//                                             BANK INFORMATION
//                                         </h4>
//                                         <Row>
//                                             <Col md="6">
//                                                 {renderFormField('CRO Name', selectedMember?.croName)}
//                                                 {renderFormField('CRO Code', selectedMember?.croCode)}
//                                                 {renderFormField('BM Name', selectedMember?.bmName)}
//                                             </Col>
//                                             <Col md="6">
//                                                 {renderFormField('BM Code', selectedMember?.bmCode)}
//                                                 {renderFormField('Document Verified By', selectedMember?.documentVerifiedBy)}
//                                                 {renderFormField('Document Verified Date', selectedMember?.documentVerifiedDate)}
//                                             </Col>
//                                         </Row>
//                                     </div>
//
//                                     {/* Declaration and Signature Section */}
//                                     <div className="signature-section" style={{ marginTop: '30px', pageBreakInside: 'avoid' }}>
//                                         <p style={{ textAlign: 'justify', margin: '20px 0', fontSize: '12px' }}>
//                                             <strong>DECLARATION:</strong> I hereby declare that the information provided above is true and correct to the best of my knowledge.
//                                             I understand that any false information may lead to rejection of my application or termination of services.
//                                         </p>
//
//                                         <Row style={{ marginTop: '40px' }}>
//                                             <Col md="4" style={{ textAlign: 'center' }}>
//                                                 <div style={{ borderBottom: '1px solid black', width: '200px', height: '30px', margin: '0 auto' }}></div>
//                                                 <p style={{ margin: '5px 0', fontSize: '11px' }}>Member Signature</p>
//                                             </Col>
//                                             <Col md="4" style={{ textAlign: 'center' }}>
//                                                 <div style={{ borderBottom: '1px solid black', width: '200px', height: '30px', margin: '0 auto' }}></div>
//                                                 <p style={{ margin: '5px 0', fontSize: '11px' }}>Date</p>
//                                             </Col>
//                                             <Col md="4" style={{ textAlign: 'center' }}>
//                                                 <div style={{ borderBottom: '1px solid black', width: '200px', height: '30px', margin: '0 auto' }}></div>
//                                                 <p style={{ margin: '5px 0', fontSize: '11px' }}>Bank Official Signature</p>
//                                             </Col>
//                                         </Row>
//                                     </div>
//
//                                     {/* Form Footer */}
//                                     <div style={{ textAlign: 'center', marginTop: '30px', fontSize: '10px', borderTop: '1px solid #000', paddingTop: '10px' }}>
//                                         <p style={{ margin: '5px 0' }}>This is a computer generated form. Please verify all information before signing.</p>
//                                         <p style={{ margin: '5px 0' }}>Form Generated on: {new Date().toLocaleDateString()}</p>
//                                     </div>
//                                 </div>
//                             </CardBody>
//                         </Card>
//                     </Col>
//                 </Row>
//             </div>
//         </>
//     );
// };
//
// export default ViewMembers;

import React, { useEffect, useRef, useState } from "react";
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    CardTitle,
    Col,
    FormGroup,
    Label,
    Row,
    Spinner,
} from "reactstrap";
import { AgGridReact } from "ag-grid-react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import CstNotification from "../../components/CstNotification";
import Select from "react-select";
import { useSelector } from "react-redux";

const ViewMembers = () => {
    const gridRef = useRef(null);
    const location = useLocation();
    const navigate = useNavigate();
    const prefillKycId = location.state?.kycId || "";
    const [rowData, setRowData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("Loading members...");
    const [fetched, setFetched] = React.useState(false);
    const [bankDropDown, setBankDropDown] = React.useState([]);

    const [alert, setAlert] = useState({
        display: false,
        color: "success",
        message: "",
        autoDismiss: 7,
        place: "tc",
        timestamp: new Date().getTime(),
    });

    const authStatus = useSelector((state) => state.auth.authState);

    const COLUMN_DEFINITIONS = [
        {
            headerName: "Sl.No",
            valueGetter: (params) => params.node.rowIndex + 1,
            width: 70,
            sortable: false,
            filter: false,
        },
        {
            headerName: "KYC ID",
            field: "id",
            cellRenderer: (params) => (
                <div className="form-inline">
                    {authStatus.accessLevel?.memberDelete ||
                        authStatus.role === "admin" ||
                        authStatus.role === "root" ? (
                        <Button
                            className="fa fa-trash btn-icon mr-2"
                            color="danger"
                            type="button"
                            size="sm"
                            onClick={() => handleDelete(params.data)}
                        />
                    ) : null}
                    <Button
                        color="link"
                        size="sm"
                        className="p-0 text-info"
                        onClick={() => {
                            navigate(`/member/view-members/member-details/${params.data.id}`, {
                                state: { bankId: params.data.bankId }
                            });
                        }}
                    >
                        <span style={{ userSelect: 'text', WebkitUserSelect: 'text', MozUserSelect: 'text', msUserSelect: 'text' }}>
                            {params.data.id}
                        </span>
                    </Button>
                </div>
            ),
            valueGetter: (params) => params.data.id,
            sortable: true,
            filter: true,
        },
        { field: "name", headerName: "NAME" },
        { field: "guardian", headerName: "FATHER/MOTHER/SPOUSE" },
        { field: "date", headerName: "JOINING DATE" },
        { field: "address", headerName: "ADDRESS" },
        { field: "phone", headerName: "PHONE NUMBER" },
        { field: "aadhar", headerName: "AADHAR NUMBER" },
        { field: "pan", headerName: "PAN NUMBER" },
    ];

    const defaultColDef = {
        filter: true,
        floatingFilter: true,
    };

    const [lastVisible, setLastVisible] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [searchText, setSearchText] = useState("");

    useEffect(() => {
        fetchMembers(true);
    }, [prefillKycId, authStatus.bankId]);

    const fetchAllMembers = async (bankId, lastDocId, search) => {
        return await axios.get("/api/member/get-all-members", {
            params: {
                bankId,
                lastVisible: lastDocId,
                limit: 50,
                search
            }
        });
    };

    const fetchMembers = async (reset = false) => {
        try {
            setLoading(true);
            const currentLastVisible = reset ? null : lastVisible;
            const response = await fetchAllMembers(authStatus.bankId, currentLastVisible, searchText || prefillKycId);

            if (response?.data?.success) {
                const newMembers = response.data.data;
                const nextLastVisible = response.data.lastVisible;

                if (reset) {
                    setRowData(newMembers);
                } else {
                    setRowData(prev => [...prev, ...newMembers]);
                }

                setLastVisible(nextLastVisible);
                setHasMore(newMembers.length === 50);
                setMessage(searchText ? `Search results for "${searchText}"` : "All Members");
            } else {
                if (reset) {
                    setRowData([]);
                    setHasMore(false);
                    setMessage(response.data.error || "No members found");
                }
            }
        } catch (error) {
            setAlert({
                display: true,
                color: "danger",
                message: error.message || "Failed to load members",
                autoDismiss: 7,
                place: "tc",
                timestamp: new Date().getTime(),
            });
        } finally {
            setLoading(false);
        }
    };

    if (!fetched) {
        setFetched(true);
        axios
            .get("/api/member/get-associated-branch-restrictive")
            .then(function (value) {
                if (value.data.success) {
                    setBankDropDown(value.data.data);
                } else {
                    setAlert({
                        color: "warning",
                        message: value.data.error,
                        autoDismiss: 7,
                        place: "tc",
                        display: true,
                        sweetAlert: false,
                        timestamp: Date.now().toLocaleString(),
                    });
                }
            })
            .catch(function (error) {
                setAlert({
                    color: "warning",
                    message: error.toString(),
                    autoDismiss: 7,
                    place: "tc",
                    display: true,
                    sweetAlert: false,
                    timestamp: Date.now().toLocaleString(),
                });
            });
    }

    async function handleBankSelect(selectedOption) {
        try {
            const fetchData = await fetchAllMembers(selectedOption.key);
            if (fetchData.data.success) {
                setRowData(fetchData.data.data);
                setMessage(`Members of ${selectedOption.label}`);
            } else {
                setRowData([]);
                setAlert({
                    color: "warning",
                    message: fetchData.data.error,
                    autoDismiss: 7,
                    place: "tc",
                    display: true,
                    sweetAlert: false,
                    timestamp: Date.now().toLocaleString(),
                });
            }
        } catch (e) {
            setRowData([]);
            setAlert({
                color: "danger",
                message: e.toString(),
                autoDismiss: 7,
                place: "tc",
                display: true,
                sweetAlert: false,
                timestamp: Date.now().toLocaleString(),
            });
        }
    }

    const exportToCSV = () => {
        if (gridRef.current?.api) {
            const date = new Date().toISOString().slice(0, 10);
            gridRef.current.api.exportDataAsCsv({
                fileName: `members_list_${date}.csv`,
            });
        }
    };

    const handleDelete = async (member) => {
        const confirmDelete = window.confirm(
            `Are you sure you want to delete member: ${member.name} (KYC ID: ${member.id})?`
        );

        if (!confirmDelete) return;
        try {
            const payload = { id: member.id, bankId: member.bankId };
            const res = await axios.post("/api/member/delete-member", payload);

            if (res.data && res.data.success) {
                setAlert({
                    color: "success",
                    message: res.data.success,
                    autoDismiss: 7,
                    place: "tc",
                    display: true,
                    sweetAlert: true,
                    timestamp: new Date().getTime(),
                });

                setRowData((prev) => prev.filter((m) => m.id !== member.id));
            } else {
                setAlert({
                    color: "warning",
                    message: res.data.error || "Failed to delete member",
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
                message: error.toString(),
                autoDismiss: 7,
                place: "tc",
                display: true,
                sweetAlert: false,
                timestamp: new Date().getTime(),
            });
        }
    };

    return (
        <>
            <div className="rna-container">
                {alert.display && (
                    <CstNotification
                        color={alert.color}
                        message={alert.message}
                        autoDismiss={alert.autoDismiss}
                        place={alert.place}
                        timestamp={alert.timestamp}
                    />
                )}
            </div>

            <div className="content">
                <Row>
                    <Col md="12">
                        <Card>
                            <CardHeader>
                                <CardTitle tag="h3">Branch Selection</CardTitle>
                            </CardHeader>
                            <CardBody>
                                <Row>
                                    <Col md="6">
                                        <Label>Select a Branch</Label>
                                        <FormGroup>
                                            <Select
                                                className="react-select info"
                                                classNamePrefix="react-select"
                                                name="bankSelect"
                                                onChange={handleBankSelect}
                                                options={bankDropDown}
                                                placeholder="Choose branch..."
                                            />
                                        </FormGroup>
                                    </Col>
                                </Row>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>

                <Row>
                    <Col md="12" className="mb-5">
                        <Card>
                            {/*<CardHeader>*/}
                            {/*    <CardTitle tag="h4">Member List</CardTitle>*/}
                            {/*    <div*/}
                            {/*        style={{*/}
                            {/*            marginBottom: "1rem",*/}
                            {/*            textAlign: "center",*/}
                            {/*            fontStyle: "italic",*/}
                            {/*            color: loading ? "gray" : "green",*/}
                            {/*        }}*/}
                            {/*    >*/}
                            {/*        <Spinner color="info" hidden={!loading} />{" "}*/}
                            {/*        {loading ? "Loading members..." : message}*/}
                            {/*    </div>*/}
                            {/*    <Button*/}
                            {/*      color="success"*/}
                            {/*      size="sm"*/}
                            {/*      onClick={exportToCSV}*/}
                            {/*      style={{ marginLeft: "10px" }}*/}
                            {/*    >*/}
                            {/*        Export to CSV*/}
                            {/*    </Button>*/}

                            {/*</CardHeader>*/}
                            <CardHeader>
                                <Row className="align-items-center">

                                    {/* Column 1 : Title */}
                                    <Col md="4">
                                        <CardTitle
                                            tag="h4"
                                            className="mb-0 float-xl-left float-lg-left float-md-left"
                                            style={{ textAlign: "center" }}>
                                            Member List
                                        </CardTitle>
                                    </Col>

                                    {/* Column 2 : Loading / Message */}
                                    <Col md="4" className="text-center">
                                        <div
                                            style={{
                                                fontStyle: "italic",
                                                color: loading ? "gray" : "green",
                                            }}
                                        >
                                            <Spinner color="info" size="sm" hidden={!loading} />{" "}
                                            {loading ? "Loading members..." : message}
                                        </div>
                                    </Col>

                                    {/* Column 3 : Export Button */}
                                    <Col md="4" >
                                        <div className="text-center text-md-right text-lg-right text-xl-right">
                                            <Button

                                                color="success"
                                                size="sm"
                                                onClick={exportToCSV}
                                            >
                                                Export to CSV
                                            </Button>
                                        </div>
                                    </Col>

                                </Row>
                            </CardHeader>

                            <CardBody style={{ height: window.innerHeight - 300 }}>


                                <AgGridReact
                                    ref={gridRef}
                                    rowData={rowData}
                                    columnDefs={COLUMN_DEFINITIONS}
                                    defaultColDef={defaultColDef}
                                    rowHeight={35}
                                    headerHeight={40}
                                    animateRows={true}
                                    overlayNoRowsTemplate={'<span>No members found</span>'}
                                    enableCellTextSelection={true}
                                />
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </div>
        </>
    );
};

export default ViewMembers;