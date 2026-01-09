import React, {useCallback, useRef} from "react";
import 'firebase/compat/app-check';
import axios from "axios";
import NotificationAlert from "react-notification-alert";
import {LinearProgress} from "@mui/material";
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    CardTitle,
    Col,
    Form,
    FormGroup,
    Label,
    Row
} from "reactstrap";
import Select from "react-select";
import { AgGridReact } from 'ag-grid-react';
import {useNavigate} from "react-router-dom";

function DueListSummary() {
    const gridRef = useRef();
    const initValue = {
        agent: '',
        accountType: '',
    }
    const notificationAlertRef = React.useRef(null);
    const [fetched, setFetched] = React.useState(false);
    const [details, setDetails] = React.useState(initValue);
    const [cstError, setCstError] = React.useState(initValue);
    const [showProgress, setShowProgress] = React.useState(false);
    const [agentSelect, setAgentSelect] = React.useState([]);
    const [agentHolder, setAgentHolder] = React.useState([]);

    const navigate = useNavigate();
    
    const [rowData, setRowData] = React.useState([]);
    const [colDefs, setColDefs] = React.useState([
        {field: "sl", headerName: "Sl. No.", flex: 1},
        {field: "openingDate", headerName: "Opening Date", flex: 2},
        {field: "name", headerName: "Name", flex: 2},
        {field: "phone", headerName: "Phone No", flex: 2},
        {field: "account", headerName: "Account", flex: 2},
        {field: "disbursement", headerName: "Loan Amount", flex: 2},
        {field: "installmentAmount", headerName: "Installment Amount", flex: 2},
        {field: "termPeriod", headerName: "Total Inst No.", flex: 2},
        {field: "installmentTotal", headerName: "Total Inst Amount", flex: 2},
        {field: "installment", headerName: "Paid Inst. No.", flex: 2},
        {field: "installmentPaid", headerName: "Paid Amount", flex: 2},
        {field: "installmentDue", headerName: "Pending Inst. No.", flex: 2},
        {field: "dueAmount", headerName: "Pending Inst. Amount", flex: 2},
        {field: "dueTillDate", headerName: "Overdue Installment", flex: 2},
        {field: "dueAmountTillDate", headerName: "Overdue Installment Amount", flex: 2},
    ]);
    const defaultColDef = {
        flex: 1,
        filter: true,
        floatingFilter: true
    }
    
    let totalDisbursement = 0;
    let totalInstallment = 0;
    let totalPaid = 0;
    let totalPending = 0;
    let totalDue = 0;
    
    const notify = (message, color) => {
        const options = {
            place: 'tc',
            message: (
                <div>{message}</div>
            ),
            type: color,
            icon: "tim-icons icon-bell-55",
            autoDismiss: 5,
        };
        notificationAlertRef.current.notificationAlert(options);
    };
    
    if (!fetched) {
        setFetched(true);
        axios.get('/api/advisor/get-advisor-list')
            .then(function (value) {
                if (value.data.success) {
                    processAgents(value.data.advisorList);
                } else if (value.data.info) {
                    notify(value.data.info, 'info');
                } else {
                    notify(value.data.error, 'danger');
                }
            }).catch(function (error) {
            notify(error, 'danger');
        });
    }
    
    async function onSubmit() {
        const checkInput = validateInput(details);
        if (checkInput) {
            setCstError(initValue);
            setShowProgress(true);
            
            try {
                const fetchDetails = await axios.post('/api/reports/loan/repayment-report', details);
                if (fetchDetails.data.success) {
                    notify(fetchDetails.data.success, 'success');
                    setShowProgress(false);
                    processData(fetchDetails.data.details);
                } else {
                    notify(fetchDetails.data.error, 'danger');
                    setShowProgress(false);
                }
            } catch (e) {
                setShowProgress(false);
                console.log(e);
                notify(e.toString(), 'danger', 10);
            }
        }
    }

    const handleViewDetails = (rowData, accountType) => {
        if (accountType === 'group-loan'){
            navigate(`/Active-Group-Loan-Account/Details/${rowData}`, { state: rowData })
        }else {
            navigate(`/Active-Loan-Account/Details/${rowData}`, { state: rowData });
        }
    };

    function handleAccountSelect(value) {
        setDetails({...details, accountType: value});
        if (value === 'group-loan') {
            setColDefs([
                {field: "sl", headerName: "Sl. No.", flex: 1},
                {field: "openingDate", headerName: "Opening Date", flex: 2},
                {field: "agentName", headerName: "Agent Name", flex: 2},
                {field: "agentCode", headerName: "Agent Code", flex: 2},
                {field: "groupId", headerName: "Group Code", flex: 2},
                {field: "groupName", headerName: "Group Name", flex: 2},
                {field: "name", headerName: "Name", flex: 2},
                {field: "phone", headerName: "Phone No", flex: 2},
                {
                    field: "account", headerName: "Account", flex: 2,
                    cellRenderer: (params) => (
                        <Button
                            color="link"
                            size="sm"
                            className="p-0 text-info"
                            onClick={() => handleViewDetails(params.value, value)}
                        > <span style={{userSelect: 'text', WebkitUserSelect: 'text', MozUserSelect: 'text', msUserSelect: 'text'}}>
                  {params.value} </span>
                        </Button>
                    ),
                },
                {field: "disbursement", headerName: "Loan Amount", flex: 2},
                {field: "installmentAmount", headerName: "Installment Amount", flex: 2},
                {field: "termPeriod", headerName: "Total Inst No.", flex: 2},
                {field: "installmentTotal", headerName: "Total Inst Amount", flex: 2},
                {field: "installment", headerName: "Paid Inst. No.", flex: 2},
                {field: "installmentPaid", headerName: "Paid Amount", flex: 2},
                {field: "installmentDue", headerName: "Pending Inst. No.", flex: 2},
                {field: "dueAmount", headerName: "Pending Inst. Amount", flex: 2},
                {field: "dueTillDate", headerName: "Overdue Installment", flex: 2},
                {field: "dueAmountTillDate", headerName: "Overdue Installment Amount", flex: 2},
            ]);
        }else {
            setColDefs([
                {field: "sl", headerName: "Sl. No.", flex: 1},
                {field: "openingDate", headerName: "Opening Date", flex: 2},
                {field: "name", headerName: "Name", flex: 2},
                {field: "phone", headerName: "Phone No", flex: 2},
                {
                    field: "account", headerName: "Account", flex: 2,
                    cellRenderer: (params) => (
                        <Button
                            color="link"
                            size="sm"
                            className="p-0 text-info"
                            onClick={() => handleViewDetails(params.value, value)}
                        >
                            <span style={{userSelect: 'text', WebkitUserSelect: 'text', MozUserSelect: 'text', msUserSelect: 'text'}}>
                                {params.value}
                            </span>
                        </Button>
                    ),
                },
                {field: "disbursement", headerName: "Loan Amount", flex: 2},
                {field: "installmentAmount", headerName: "Installment Amount", flex: 2},
                {field: "termPeriod", headerName: "Total Inst No.", flex: 2},
                {field: "installmentTotal", headerName: "Total Inst Amount", flex: 2},
                {field: "installment", headerName: "Paid Inst. No.", flex: 2},
                {field: "installmentPaid", headerName: "Paid Amount", flex: 2},
                {field: "installmentDue", headerName: "Pending Inst. No.", flex: 2},
                {field: "dueAmount", headerName: "Pending Inst. Amount", flex: 2},
                {field: "dueTillDate", headerName: "Overdue Installment", flex: 2},
                {field: "dueAmountTillDate", headerName: "Overdue Installment Amount", flex: 2},
            ]);
        }
    }
    
    function processAgents(agents) {
        const agentArray = [];
        const agentObj = {};
        
        agentArray.push({
            value: "",
            key: 'default',
            label: "Select an Option",
            isDisabled: true,
        });
        
        agentArray.push({
            key: 'all',
            label: 'All Agents',
            obj: {
                name: 'All Agents',
                id: 'all',
            }
        });
        agents.map(function (agent){
            agentArray.push({
                key: agent.id,
                label: `${agent.id} - ${agent.name}`,
                obj: agent
            });
            agentObj[agent.id] = agent;
        });
        setAgentSelect(agentArray);
        setAgentHolder(agentObj);
    }
    
    function validateInput(userInput) {
        let valid = true;
        let errorObj = {}
        if (!userInput.accountType) {
            errorObj = {...errorObj, accountType: 'this field is required'};
            valid = false;
        }
        if (userInput.accountType === 'group-loan' && !userInput.agent) {
            errorObj = {...errorObj, agent: 'this field is required'};
        }
        
        setCstError({...cstError, ...errorObj});
        return valid
    }
    
    const onBtExport = useCallback(() => {
        gridRef.current.api.exportDataAsCsv({ fileName: `dueListExportFor${details.agent}.csv` });
    }, []);
    
    function processData(fetchedData) {
        const accountDetails = [];
        
        fetchedData.map((value, index) => {
            const installmentDue = Math.round((new Date() - new Date(value.openingDate)) / (3600 * 24 * 1000 * 7)) - parseInt(value.installment);
            const actualInstallmentDueAmount = (installmentDue + parseInt(value.installment) > parseInt(value.termPeriod)) ? ((parseInt(value.termPeriod) - parseInt(value.installment)) * parseFloat(value.installmentAmount)) : ((installmentDue * parseFloat(value.installmentAmount)));
            
            totalDisbursement += parseFloat(value.disbursement);
            totalInstallment += parseInt(value.termPeriod) * parseFloat(value.installmentAmount);
            totalPaid += parseInt(value.installment) * parseFloat(value.installmentAmount);
            totalDue += actualInstallmentDueAmount > 0 ? actualInstallmentDueAmount : 0;
            totalPending += (parseInt(value.termPeriod) - parseInt(value.installment)) * parseFloat(value.installmentAmount);
            
            accountDetails.push({
                sl: index + 1,
                openingDate: value.openingDate,
                agentName: agentHolder[value.referrer] ? agentHolder[value.referrer].name : '',
                agentCode: agentHolder[value.referrer] ? agentHolder[value.referrer].id : '',
                name: value.name,
                passbook: value.passbook,
                phone: value.phone,
                account: value.account,
                disbursement: value.disbursement,
                installmentAmount: value.installmentAmount,
                termPeriod: value.termPeriod,
                installmentTotal: (parseInt(value.termPeriod) * parseFloat(value.installmentAmount)),
                installment: value.installment,
                installmentPaid: parseInt(value.installment) * parseFloat(value.installmentAmount),
                installmentDue: parseInt(value.termPeriod) - parseInt(value.installment),
                dueAmount: ((parseInt(value.termPeriod) - parseInt(value.installment)) * parseFloat(value.installmentAmount)),
                dueTillDate: (installmentDue + parseInt(value.installment) > parseInt(value.termPeriod)) ? parseInt(value.termPeriod) - parseInt(value.installment) : installmentDue,
                dueAmountTillDate: actualInstallmentDueAmount,
                groupId: value.groupId,
                groupName: value.groupName,
            });
        });
        setRowData(accountDetails);
    }
    
    return (
        <>
            <div className="rna-container">
                <NotificationAlert ref={notificationAlertRef}/>
            </div>
            <div className="content">
                <div className={'mb-2'}>
                    {showProgress ? <LinearProgress/> : null}
                </div>
                <Card>
                    <Form autoComplete={'off'}>
                        <CardHeader>
                            <CardTitle>Account Details</CardTitle>
                        </CardHeader>
                        <CardBody>
                            <Card>
                                <Row>
                                    <Col md={3}>
                                        <Label>Select Account Type</Label>
                                        <FormGroup>
                                            <Select
                                                className="react-select info"
                                                classNamePrefix="react-select"
                                                name="accountSelect"
                                                onChange={(value) => handleAccountSelect(value.value)}
                                                options={[
                                                    {key: 'loan', value: 'loan', label: 'Loan'},
                                                    {key: 'group-loan', value: 'group-loan', label: 'Group Loan'},
                                                ]}
                                                placeholder="Select an Option"
                                            />
                                            <p style={{color: 'red'}}>{cstError.accountType}</p>
                                        </FormGroup>
                                    </Col>
                                    {details.accountType === 'group-loan' ? <Col md={3}>
                                        <Label>Select an Advisor</Label>
                                        <FormGroup>
                                            <Select
                                                className="react-select info"
                                                classNamePrefix="react-select"
                                                name="cpSelect"
                                                onChange={(value) => setDetails({...details, agent: value.key})}
                                                options={agentSelect}
                                                placeholder="Select an Option"
                                            />
                                            <p style={{color: 'red'}}>{cstError.agent}</p>
                                        </FormGroup>
                                    </Col>: null}
                                    <Col md={3}>
                                        <Label/>
                                        <Button className={"btn-fill mt-4"} color="success" type="button" onClick={onSubmit}>
                                            Submit
                                        </Button>
                                        <Button onClick={onBtExport} color={'secondary'} className={'btn-round btn-icon mt-4 ml-4'}><i className="tim-icons icon-cloud-download-93"/></Button>
                                    </Col>
                                    {/*<Col md={2} className={'mt-4'}>*/}
                                    {/*  */}
                                    {/*</Col>*/}
                                </Row>
                            </Card>
                        </CardBody>
                    </Form>
                </Card>
                <Card>
                    <div style={{overflowX: 'auto'}}>
                        <div className="ag-theme-alpine"
                             style={{height: window.innerHeight - 200, minWidth: '2000px'}}>
                        <AgGridReact
                                ref={gridRef}
                                rowData={rowData}
                                columnDefs={colDefs}
                                defaultColDef={defaultColDef}
                                enableCellTextSelection={true}
                            />
                        </div>
                    </div>
                </Card>
            </div>
        </>
    )
}

export default DueListSummary;
