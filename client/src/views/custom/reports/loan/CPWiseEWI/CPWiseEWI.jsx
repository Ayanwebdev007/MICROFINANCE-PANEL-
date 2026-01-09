import React from "react";
import 'firebase/compat/app-check';
import axios from "axios";
import NotificationAlert from "react-notification-alert";
import {LinearProgress} from "@mui/material";
import ReactToExcel from "react-html-table-to-excel";
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    CardTitle,
    Col,
    Form,
    FormGroup, Input,
    Label,
    Row
} from "reactstrap";
// import printJS from "print-js";
import Select from "react-select";

function InputForm(){
    const initValue = {
        agent: '',
        bankId: '',
        fromDate: '',
        toDate: '',
    }
    const notificationAlertRef = React.useRef(null);
    const [fetched, setFetched] = React.useState(false);
    const [details, setDetails] = React.useState(initValue);
    const [cstError, setCstError] = React.useState(initValue);
    const [showProgress, setShowProgress] = React.useState(false);
    const [transDetails, setTransDetails] = React.useState([]);
    const [agentSelect, setAgentSelect] = React.useState([]);
    const [sumObj, setSumObj] = React.useState({
        totalDebit: 0,
        totalCredit: 0,
        totalPrinciple: 0,
        totalInterest: 0,
    });
    
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
    
    if (!fetched){
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
        if (checkInput){
            setCstError(initValue);
            setShowProgress(true);
            
            try {
                const fetchDetails = await axios.post('/api/reports/loan/loan-cp-ewi-report', details);
                if (fetchDetails.data.success){
                    notify(fetchDetails.data.success, 'success');
                    setShowProgress(false);
                    setTransDetails(fetchDetails.data.details);
                    setSumObj({
                        totalDebit: fetchDetails.data.totalDebit,
                        totalCredit: fetchDetails.data.totalCredit,
                        totalPrinciple: fetchDetails.data.totalPrinciple,
                        totalInterest: fetchDetails.data.totalInterest,
                    })
                }else {
                    notify(fetchDetails.data.error, 'danger');
                    setShowProgress(false);
                }
            }catch (e) {
                setShowProgress(false);
                notify(e.toLocaleString(), 'danger');
            }
        }
    }
    
    function processAgents(agents){
        const agentArray = [];
        
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
        });
        setAgentSelect(agentArray);
    }
    
    function validateInput(userInput) {
        let valid = true;
        let errorObj = {}
        if (!userInput.agent){
            errorObj = {...errorObj, agent: 'this field is required'};
            valid = false;
        }
        if (!userInput.fromDate){
            errorObj = {...errorObj, fromDate: 'this field is required'};
            valid = false;
        }
        if (!userInput.toDate){
            errorObj = {...errorObj, toDate: 'this field is required'};
            valid = false;
        }
        
        setCstError({...cstError, ...errorObj});
        return valid
    }
    
    return (
        <>
            <div className="rna-container">
                <NotificationAlert ref={notificationAlertRef} />
            </div>
            <div className={'content'}>
                <div className={'mb-2'}>
                    {showProgress ? <LinearProgress /> : null}
                </div>
                <Card>
                    <Form autoComplete={'off'} >
                        <CardHeader>
                            <CardTitle>Account Details</CardTitle>
                        </CardHeader>
                        <CardBody>
                            <Card>
                                <Row>
                                    <Col md={3}>
                                        <Label>Select Advisor/CP</Label>
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
                                    </Col>
                                    <Col md={2}>
                                        <Label>From Date</Label>
                                        <FormGroup>
                                            <Input type={'date'} value={details.fromDate}
                                                   onChange={(event)=> setDetails({...details, fromDate: event.target.value})}/>
                                            <p style={{color: 'red'}}>{cstError.fromDate}</p>
                                        </FormGroup>
                                    </Col>
                                    <Col md={2}>
                                        <Label>To Date</Label>
                                        <FormGroup>
                                            <Input type={'date'} value={details.toDate}
                                                   onChange={(event)=> setDetails({...details, toDate: event.target.value})}/>
                                            <p style={{color: 'red'}}>{cstError.toDate}</p>
                                        </FormGroup>
                                    </Col>
                                    <Col >
                                        <Label />
                                        <Button className={"btn mt-4"} color="success" type="button" onClick={onSubmit}>
                                            Submit
                                        </Button>
                                        <ReactToExcel
                                            className="btn btn-secondary btn-icon mt-4"
                                            table="tableData"
                                            filename={`loan_summary_report`}
                                            sheet={'data'}
                                            buttonText={<i className="tim-icons icon-cloud-download-93"/>}
                                        />
                                    </Col>
                                </Row>
                            </Card>
                        </CardBody>
                    </Form>
                </Card>
                <Card>
                    <CardBody>
                        <table className='table table-striped' id="tableData">
                            <thead>
                            <tr>
                                <th className={'text-center'}>Sl No.</th>
                                <th className={'text-center'}>CP Name</th>
                                <th className={'text-center'}>CP Code</th>
                                <th className={'text-center'}>Loan Disbursement</th>
                                <th className={'text-center'}>Principle Collection</th>
                                <th className={'text-center'}>Interest Collection</th>
                                <th className={'text-center'}>Total Collection</th>
                            </tr>
                            </thead>
                            <tbody>
                            {transDetails.map((value, index) => {
                                return <tr key={value.membershipNumber}>
                                    <th className={'text-center'}>{index + 1}</th>
                                    <th className={'text-center'}>{value.name}</th>
                                    <th className={'text-center'}>{value.membershipNumber}</th>
                                    <th className={'text-center'}>{value.debit}</th>
                                    <th className={'text-center'}>{value.principle}</th>
                                    <th className={'text-center'}>{value.interest}</th>
                                    <th className={'text-center'}>{value.credit}</th>
                                </tr>
                            })}
                            </tbody>
                            <tbody>
                            <tr className={'bg-success'}>
                                <th colSpan={3} className={'text-center'}>{'Grand Total'}</th>
                                <th className={'text-center'}>{sumObj.totalDebit}</th>
                                <th className={'text-center'}>{sumObj.totalPrinciple}</th>
                                <th className={'text-center'}>{sumObj.totalInterest}</th>
                                <th className={'text-center'}>{sumObj.totalCredit}</th>
                            </tr>
                            </tbody>
                        </table>
                    </CardBody>
                </Card>
            </div>
        </>
    )
}

export default InputForm;