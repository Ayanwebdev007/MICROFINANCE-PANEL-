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
// reactstrap components
import {
    Button,
    Card,
    CardHeader,
    CardBody,
    CardTitle,
    Label,
    FormGroup,
    Input,
    Row,
    Col,
} from "reactstrap";
import axios from "axios";
import CstNotification from "../../components/CstNotification";
import ReactBSAlert from "react-bootstrap-sweetalert";
import Select from "react-select";
import * as XLSX from "xlsx";
import { AgGridReact } from "ag-grid-react";

const DataUtility = () => {
    const initInput = {
        bankId: '',
        type: '',
    };
    const [userInput, setUserInput] = React.useState(initInput);
    const [cstError, setCstError] = React.useState({
        bankId: '',
        type: '',
    });
    const [fetched, setFetched] = React.useState(false);
    const [bankDropDown, setBankDropDown] = React.useState([]);
    const [alert, setAlert] = React.useState({
        color: 'success',
        message: 'test message',
        autoDismiss: 7,
        place: 'tc',
        display: false,
        sweetAlert: false,
        timestamp: Date.now(),
    });

    const [dbFields, setDbFields] = React.useState([]);
    const [excelHeaders, setExcelHeaders] = React.useState([]);
    const [excelRows, setExcelRows] = React.useState([]);
    const [fieldMapping, setFieldMapping] = React.useState({});
    const [mappedData, setMappedData] = React.useState([]);
    const [sheetNames, setSheetNames] = React.useState([]);
    const [selectedSheet, setSelectedSheet] = React.useState(null);
    const workbookRef = React.useRef(null);
    const gridRef = React.useRef(null);
    const [loadProgress, setLoadProgress] = React.useState(false);

    const defaultColDef = React.useMemo(() => ({
        flex: 1,
        filter: true,
        floatingFilter: true,
        sortable: true,
        resizable: true,
    }), []);

    if (!fetched) {
        setFetched(true);
        axios.get('/api/admin/get-registered-banks')
            .then(function (value) {
                if (value.data.success) {
                    setBankDropDown(value.data.data);
                } else {
                    setAlert({
                        color: 'warning',
                        message: value.data.error,
                        autoDismiss: 7,
                        place: 'tc',
                        display: true,
                        sweetAlert: false,
                        timestamp: Date.now(),
                    });
                }
            }).catch(function (error) {
                setAlert({
                    color: 'warning',
                    message: error.toLocaleString(),
                    autoDismiss: 7,
                    place: 'tc',
                    display: true,
                    sweetAlert: false,
                    timestamp: Date.now(),
                });
            });
    }

    function handleBankSelect(data) {
        setUserInput({
            ...userInput,
            ...data.data,
            bankName: data.label,
            bankId: data.key,
        });
    }

    function handleTypeSelect(data) {
        const type = data?.value || '';
        setUserInput({ ...userInput, type });

        // Configure DB fields based on selected data type
        if (type === 'member-kyc') {
            // Member Creation fields (including nested nominee.* paths)
            const fields = [
                'id',
                'date',
                'selectedUserEmail',
                'bankId',
                'userId',
                'name',
                'guardian',
                'gender',
                'dob',
                'materialStatus',
                'email',
                'phone',
                'address',
                'aadhar',
                'voter',
                'pan',
                'occupation',
                'income',
                'education',
                'nominee.name',
                'nominee.relation',
                'nominee.dob',
                'nominee.aadhar',
                'nominee.voter',
                'nominee.pan',
                'uuid',
                'active',
            ];
            setDbFields(fields);
        } else if (type === 'loan-account') {
            const fields = [
                'id',
                'disbursement',
                'disbursementDate',
                'emiAmount',
                'principleEMI',
                'interestEMI',
                'loanTerm',
                'totalEMI',
                'paidEMI',
                'memberId',
                'planDetails.calculationMethod',
                'planDetails.emiInterval',
                'planDetails.emiMode',
                'planDetails.interestRate',
                'deductionDetails.gst',
                'deductionDetails.insuranceAmount',
                'deductionDetails.legalAmount',
                'deductionDetails.processingFee',
                'associatedEmployee',
            ];
            setDbFields(fields);
        } else if (type === 'loan-transaction') {
            const fields = [
                'transactionDate',
                'totalAmount',
                'interest',
                'principal',
                'accountNumber',
                'paidEMICount',
                'lateFee'
            ];
            setDbFields(fields);
        } else {
            setDbFields([]);
        }

        // Reset mapping and preview when type changes
        setFieldMapping({});
        setMappedData([]);
    }

    const [fileName, setFileName] = React.useState('');

    async function handleFileChange(e) {
        try {
            const file = e.target.files?.[0];
            if (!file) return;

            setFileName(file.name);

            const arrayBuffer = await file.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            workbookRef.current = workbook;

            const sheets = workbook.SheetNames;
            setSheetNames(sheets);

            if (sheets.length > 0) {
                processSheet(sheets[0]);
            }
        } catch (err) {
            setAlert({
                color: 'danger',
                message: `Failed to read Excel file: ${err?.message || String(err)}`,
                autoDismiss: 7,
                place: 'tc',
                display: true,
                sweetAlert: false,
                timestamp: Date.now(),
            });
        }
    }

    function processSheet(sheetName) {
        if (!workbookRef.current) return;

        setSelectedSheet(sheetName);
        const worksheet = workbookRef.current.Sheets[sheetName];

        // Get headers from first row
        const headerAoa = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false });
        const headers = (headerAoa[0] || []).map((h) => String(h).trim());
        setExcelHeaders(headers);

        // Get rows as objects keyed by header
        const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        setExcelRows(rows);

        // Initialize mapping: Try to auto-match DB fields with Excel headers (case-insensitive)
        const initMap = {};
        dbFields.forEach(dbField => {
            const match = headers.find(h =>
                h.toLowerCase() === dbField.toLowerCase() ||
                h.toLowerCase().replace(/[^a-z0-9]/g, '') === dbField.toLowerCase().replace(/[^a-z0-9]/g, '')
            );
            if (match) {
                initMap[dbField] = match;
            } else {
                initMap[dbField] = '';
            }
        });

        setFieldMapping(initMap);
        setMappedData([]);

        if (!headers.length) {
            setAlert({
                color: 'warning',
                message: `No header row found in sheet "${sheetName}". Please ensure the first row contains column names.`,
                autoDismiss: 7,
                place: 'tc',
                display: true,
                sweetAlert: false,
                timestamp: Date.now(),
            });
        }
    }

    function handleSheetChange(e) {
        processSheet(e.value);
    }

    function applyMapping() {
        if (!excelRows.length) return;

        // Ensure at least one mapping exists
        const mappedCount = Object.values(fieldMapping).filter(Boolean).length;
        if (!mappedCount) {
            setAlert({
                color: 'warning',
                message: 'Please map at least one DB field to an Excel column.',
                autoDismiss: 7,
                place: 'tc',
                display: true,
                sweetAlert: false,
                timestamp: new Date().getTime(),
            });
            return;
        }

        // Helper to assign deep path like "nominee.name"
        const setDeep = (obj, path, value) => {
            const parts = path.split('.');
            let cur = obj;
            for (let i = 0; i < parts.length - 1; i++) {
                const key = parts[i];
                if (cur[key] == null || typeof cur[key] !== 'object') {
                    cur[key] = {};
                }
                cur = cur[key];
            }
            cur[parts[parts.length - 1]] = value;
        };

        const mapped = excelRows.map((row) => {
            const obj = {};
            // Iterate over DB fields and pull value from mapped Excel Header
            for (const [dbField, excelHeader] of Object.entries(fieldMapping)) {
                if (!excelHeader) continue; // Skip if not mapped

                // Get value from excel row using header name
                // The row object keys are the headers from sheet_to_json
                if (Object.hasOwn(row, excelHeader)) {
                    setDeep(obj, dbField, row[excelHeader]);
                } else {
                    // Fallback try trim
                    if (Object.hasOwn(row, excelHeader.trim())) {
                        setDeep(obj, dbField, row[excelHeader.trim()]);
                    }
                }
            }
            return obj;
        });

        setMappedData(mapped);
    }

    function resetUpload() {
        setExcelHeaders([]);
        setExcelRows([]);
        setFieldMapping({});
        setMappedData([]);
        setFileName('');
        setSheetNames([]);
        setSelectedSheet(null);
        workbookRef.current = null;
    }


    const excelHeaderOptions = React.useMemo(
        () => excelHeaders.map((h) => ({ label: h, value: h })),
        [excelHeaders]
    );

    async function handleLoadData() {
        if (!userInput?.type) {
            setAlert({
                color: 'warning',
                message: 'Please select "Type of Data".',
                autoDismiss: 7,
                place: 'tc',
                display: true,
                sweetAlert: false,
                timestamp: Date.now(),
            });
            return;
        }
        if (!userInput?.bankId) {
            setAlert({
                color: 'warning',
                message: 'Please select a Bank.',
                autoDismiss: 7,
                place: 'tc',
                display: true,
                sweetAlert: false,
                timestamp: Date.now(),
            });
            return;
        }
        if (!mappedData.length) {
            setAlert({
                color: 'warning',
                message: 'No mapped data to load. Please upload, map, and apply mapping first.',
                autoDismiss: 7,
                place: 'tc',
                display: true,
                sweetAlert: false,
                timestamp: Date.now(),
            });
            return;
        }

        try {
            setLoadProgress(true);
            console.log({
                type: userInput.type,
                bankId: userInput.bankId,
                rows: mappedData,
                mapping: fieldMapping,
                headers: excelHeaders,
            });

            const res = await axios.post('/api/admin/load-data-from-excel', {
                type: userInput.type,
                bankId: userInput.bankId,
                rows: mappedData,
                mapping: fieldMapping,
                headers: excelHeaders,
            });
            if (res.data?.success) {
                setAlert({
                    color: 'success',
                    message: res.data.success || `Loaded ${mappedData.length} row(s) successfully.`,
                    autoDismiss: 7,
                    place: 'tc',
                    display: true,
                    sweetAlert: true,
                    timestamp: new Date().getTime(),
                });
            } else {
                setAlert({
                    color: 'warning',
                    message: res.data?.error || 'Data load completed with warnings or errors.',
                    autoDismiss: 7,
                    place: 'tc',
                    display: true,
                    sweetAlert: false,
                    timestamp: new Date().getTime(),
                });
            }
        } catch (e) {
            setAlert({
                color: 'danger',
                message: e?.toString() || 'Failed to load data.',
                autoDismiss: 7,
                place: 'tc',
                display: true,
                sweetAlert: false,
                timestamp: new Date().getTime(),
            });
        } finally {
            setLoadProgress(false);
        }
    }


    const colDefs = React.useMemo(() => {
        // Show all DB fields that are mapped
        const cols = Object.keys(fieldMapping).filter(k => fieldMapping[k]);
        // Or better, just show columns present in mappedData[0] to be safe, 
        // but using mapping keys is deterministic.
        return cols.map((col) => ({
            field: col,
            headerName: col,
            flex: 1,
        }));
    }, [fieldMapping]);

    return (
        <>
            <div className="rna-container">
                {alert.display &&
                    <CstNotification color={alert.color} message={alert.message} autoDismiss={alert.autoDismiss}
                        place={alert.place} timestamp={alert.timestamp} />}
                {alert.sweetAlert && <ReactBSAlert
                    success
                    style={{ display: "block", marginTop: "-100px" }}
                    title="Success!"
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
                    <Card>
                        <CardBody className={'mt-2'}>
                            <Row>
                                <Col md={8}>
                                    <Label>Select a Bank</Label>
                                    <FormGroup>
                                        <Select
                                            className="react-select info"
                                            classNamePrefix="react-select"
                                            name="bankSelect"
                                            onChange={handleBankSelect}
                                            options={bankDropDown}
                                            placeholder=''
                                        />
                                        <p style={{ color: 'red' }}>{cstError.bankId}</p>
                                    </FormGroup>
                                </Col>
                                <Col md={4}>
                                    <Label>Type of Data</Label>
                                    <FormGroup>
                                        <Select
                                            className="react-select info"
                                            classNamePrefix="react-select"
                                            name="typeSelect"
                                            onChange={handleTypeSelect}
                                            options={[
                                                { label: 'Member', value: 'member-kyc' },
                                                { label: 'Loan Account Information', value: 'loan-account' },
                                                { label: 'Loan Transactions', value: 'loan-transaction' },
                                            ]}
                                            placeholder=''
                                        />
                                        <p style={{ color: 'red' }}>{cstError.type}</p>
                                    </FormGroup>
                                </Col>
                            </Row>
                        </CardBody>
                    </Card>
                    <Col md="12">
                        <Card>
                            <CardHeader>
                                <CardTitle tag="h3">Data Mapping</CardTitle>
                            </CardHeader>
                            <CardBody>
                                <Row className="align-items-end">
                                    <Col md={12}>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            background: '#f8f9fa',
                                            padding: '15px',
                                            borderRadius: '5px',
                                            border: '1px solid #e9ecef'
                                        }}>
                                            <div className="d-flex align-items-center">
                                                <div className="file-upload-btn-wrapper mr-3">
                                                    <Button color="primary" className="btn-simple btn-icon btn-round">
                                                        <i className="tim-icons icon-upload" />
                                                    </Button>
                                                    <Input
                                                        type="file"
                                                        accept=".xlsx,.xls"
                                                        onChange={handleFileChange}
                                                        disabled={!userInput.type}
                                                        style={{
                                                            position: 'absolute',
                                                            top: 0,
                                                            left: 0,
                                                            width: '100%',
                                                            height: '100%',
                                                            opacity: 0,
                                                            cursor: userInput.type ? 'pointer' : 'not-allowed'
                                                        }}
                                                    />
                                                </div>
                                                <div>
                                                    <h5 className="mb-0 text-dark">
                                                        {fileName ? fileName : 'Upload Excel File'}
                                                    </h5>
                                                    <small className="text-muted">
                                                        {userInput.type ? 'Supported formats: .xlsx, .xls' : 'Select "Type of Data" first to upload'}
                                                    </small>
                                                </div>
                                            </div>

                                            <div>
                                                {excelHeaders.length > 0 && (
                                                    <Button color="danger" size="sm" onClick={resetUpload} className="btn-simple">
                                                        <i className="tim-icons icon-simple-remove" /> Clear
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </Col>
                                </Row>

                                {sheetNames.length > 0 && (
                                    <Row className="mt-3">
                                        <Col md={12}>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                background: '#f8f9fa',
                                                padding: '10px 15px',
                                                borderRadius: '5px',
                                                border: '1px solid #e9ecef'
                                            }}>
                                                <span style={{ marginRight: '15px', fontWeight: 'bold' }}>Select Sheet:</span>
                                                <div style={{ minWidth: '200px' }}>
                                                    <Select
                                                        className="react-select info"
                                                        classNamePrefix="react-select"
                                                        placeholder="Choose Sheet"
                                                        value={selectedSheet ? { label: selectedSheet, value: selectedSheet } : null}
                                                        onChange={handleSheetChange}
                                                        options={sheetNames.map(name => ({ label: name, value: name }))}
                                                    />
                                                </div>
                                                <span className="ml-3 text-muted">
                                                    {excelRows.length} rows found
                                                </span>
                                            </div>
                                        </Col>
                                    </Row>
                                )}

                                {excelHeaders.length > 0 && (
                                    <>
                                        <div className="mt-4 mb-2 d-flex justify-content-between align-items-center">
                                            <h4 className="title mb-0">Map Fields</h4>
                                            <Button color="info" onClick={applyMapping}
                                                disabled={!excelRows.length}>
                                                Apply Mapping & Preview
                                            </Button>
                                        </div>


                                        <div style={{
                                            maxHeight: '500px',
                                            overflowY: 'auto',
                                            border: '1px solid #eee',
                                            borderRadius: '5px'
                                        }}>
                                            <table className="table table-striped table-hover mb-0">
                                                <thead className="text-primary">
                                                    <tr>
                                                        <th style={{ width: '40%', paddingLeft: '20px' }}>Database Field</th>
                                                        <th style={{ width: '10%' }} className="text-center"><i className="tim-icons icon-double-right" /></th>
                                                        <th style={{ width: '50%', paddingRight: '20px' }}>Excel Header</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {dbFields.map((field) => (
                                                        <tr key={field}>
                                                            <td style={{ verticalAlign: 'middle', paddingLeft: '20px' }}>
                                                                <span className="font-weight-bold text-dark">{field}</span>
                                                            </td>
                                                            <td className="text-center" style={{ verticalAlign: 'middle' }}>
                                                                <span className="text-muted">maps to</span>
                                                            </td>
                                                            <td style={{ paddingRight: '20px' }}>
                                                                <Select
                                                                    className="react-select info"
                                                                    classNamePrefix="react-select"
                                                                    placeholder="Select Excel Header..."
                                                                    isClearable
                                                                    value={
                                                                        fieldMapping[field]
                                                                            ? {
                                                                                label: fieldMapping[field],
                                                                                value: fieldMapping[field]
                                                                            }
                                                                            : null
                                                                    }
                                                                    onChange={(opt) => {
                                                                        const next = {
                                                                            ...fieldMapping,
                                                                            [field]: opt?.value || ''
                                                                        };
                                                                        setFieldMapping(next);
                                                                    }}
                                                                    options={excelHeaderOptions}
                                                                    menuPortalTarget={document.body}
                                                                    styles={{
                                                                        menuPortal: base => ({ ...base, zIndex: 9999 })
                                                                    }}
                                                                />
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                )}

                                {mappedData.length > 0 && (
                                    <>
                                        <div
                                            className="ag-theme-alpine mt-4"
                                            style={{ height: "600px", width: "100%" }}
                                        >
                                            <AgGridReact
                                                ref={gridRef}
                                                rowData={mappedData}
                                                columnDefs={colDefs}
                                                defaultColDef={defaultColDef}
                                                animateRows={true}
                                                rowHeight={40}
                                                headerHeight={45}
                                                enableCellTextSelection={true}
                                            />
                                        </div>

                                        <div className="d-flex justify-content-between align-items-center mt-3">
                                            <small className="text-muted">
                                                Rows ready to load: {mappedData.length}
                                            </small>
                                            <Button
                                                color="success"
                                                onClick={handleLoadData}
                                                disabled={
                                                    loadProgress ||
                                                    !mappedData.length ||
                                                    !userInput?.type ||
                                                    !userInput?.bankId
                                                }
                                            >
                                                {loadProgress ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm mr-2"
                                                            role="status" aria-hidden="true"></span>
                                                        Loading...
                                                    </>
                                                ) : (
                                                    'Load Data'
                                                )}
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </CardBody>
                        </Card >
                    </Col >
                </Row >
            </div >
        </>
    );
};

export default DataUtility;
