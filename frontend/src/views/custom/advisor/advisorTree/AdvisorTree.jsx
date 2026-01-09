import React from "react";
import 'firebase/compat/app-check';
import axios from "axios";
import NotificationAlert from "react-notification-alert";
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import {Card, CardBody, CardHeader, CardTitle, Col, FormGroup, Label, Row,Button} from "reactstrap";
import Select from "react-select";
// import ReactToExcel from "react-html-table-to-excel";

function AdvisorTree(props){
    const initValue = {
        id: '',
        type: ''
    };

    const [details, setDetails] = React.useState(initValue);
    const [cstError, setCstError] = React.useState(initValue);
    const notificationAlertRef = React.useRef(null);
    const [fetched, setFetched] = React.useState(false);
    const [fetchedData, setFetchedData] = React.useState({});
    const [upLine, setUpLine] = React.useState([]);
    const [downLine, setDownLine] = React.useState([]);
    const [allDownLine, setAllDownLine] = React.useState([]);
    const [agentSelect, setAgentSelect] = React.useState([]);

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
        // axios.get('/api/reports/agents/get-All-agents')
            .then(function (value) {
                if (value.data.success) {
                    processAgents(value.data.advisorList);
                    const agentsArray = value.data.advisorList;
                    let agents = {};
                    agentsArray.map(function (agent){
                        agents = {
                            ...agents,
                            [agent.id]: {
                                id: agent.id,
                                ...agent,
                            }
                        };
                    });
                    setFetchedData(agents);
                    notify('successfully fetched agents info', 'success');
                }else {
                    notify(value.data.error, 'danger');
                }
            }).catch(function (error) {
            notify(error, 'danger');
        });
        // axios.get('/api/advisor/get-advisor-list')
        //     .then(function (value){
        //         if (value.data.success){
        //             processAgents(value.data.success);
        //         }else if (value.data.info){
        //             notify(value.data.info, 'info');
        //         }else {
        //             notify(value.data.error, 'danger');
        //         }
        //     }).catch(function (error){
        //     notify(error, 'danger');
        // });
    }

    async function onSubmit() {
        const checkInput = validateInput(details);

        if (checkInput){
            setCstError(initValue);
            handleClick(fetchedData, details.id === 'CP0000' ? '' : details.id);
        }
    }

    function validateInput(userInput) {
        let valid = true;
        let errorObj = {};
        if (!userInput.id){
            errorObj = {...errorObj, id: 'this field is required'};
            valid = false;
        }

        setCstError({...initValue, ...errorObj});
        return valid
    }

    function handleClick(agents, referrer){
        if (details.type === 'table'){
            renderTableView(agents, referrer);
        }else {
            renderCardView(agents, referrer)
        }
    }

    function renderCardView(agents, referrer){
        const agentArray = Object.values(agents);
        const upLineDisplay = [
            {
                name: 'MASTER Code',
                id: 'CP0000',
                date: '2020-01-01',
            }
        ];
        const downLineDisplay = [];
        if (referrer !== ''){
            for (let i = 0; i < agents[referrer].upLine.length; i++) {
                upLineDisplay.push({
                    name: agents[agents[referrer].upLine[i]].name,
                    id: agents[agents[referrer].upLine[i]].id,
                    date: agents[agents[referrer].upLine[i]].date,
                });
            }
            upLineDisplay.push({
                name: agents[referrer].name,
                id: agents[referrer].id,
                date: agents[referrer].date,
            });
        }
        for (let i = 0; i < agentArray.length; i++) {
            if (agentArray[i].referrer === referrer){
                downLineDisplay.push({
                    name: agentArray[i].name,
                    id: agentArray[i].id,
                    rank: agentArray[i].rank,
                });
            }
        }
        setUpLine(upLineDisplay);
        setDownLine(downLineDisplay);
    }

    function renderTableView(agents, referrer){
        const filteredAgent = [];
        const agentArray = Object.values(agents);
        const agentCount = agentArray.length;

        for (let i = 0; i < agentCount; i++) {
            if (agentArray[i].id === referrer || referrer === '' || agentArray[i].upLine.includes(referrer)){
                filteredAgent.push(agentArray[i]);
            }
        }
        setAllDownLine(filteredAgent);
    }

    function processAgents(agents){
        const agentArray = [];

        // agentArray.push({
        //     value: "",
        //     label: "Select an Option",
        //     isDisabled: true,
        // });
        agentArray.push({
            key: 'CP0000',
            label: 'MASTER Code',
            value: 'CP0000'
        });

        agents.map(function (agent){
            agentArray.push({
                key: agent.id,
                label: `${agent.id} - ${agent.name}`,
                value: agent.id
            });
        });
        setAgentSelect(agentArray);
    }

    return (
        <>
            <div className="rna-container">
                <NotificationAlert ref={notificationAlertRef} />
            </div>
            <div className={'content'}>
                <Card>
                    <CardHeader>
                        <CardTitle>Account Details</CardTitle>
                    </CardHeader>
                    <CardBody>
                        <Card>
                            <Row>
                                <Col md={3}>
                                    <Label>View Type</Label>
                                    <FormGroup>
                                        <Select
                                          className="react-select info"
                                          classNamePrefix="react-select"
                                          name="typeSelect"
                                          style={{backgroundColor: props.color}}
                                          onChange={(value) => setDetails({...details, type: value.value})}
                                          options={[
                                              {value: 'card', label: "Tree View"},
                                              {value: 'table', label: 'Table View'},
                                          ]}
                                          placeholder="Select an Option"
                                        />
                                    </FormGroup>
                                </Col>
                                <Col md={3}>
                                    <Label>Referrer Client Id</Label>
                                    <FormGroup>
                                        <Select
                                          className="react-select info"
                                          classNamePrefix="react-select"
                                          name="cpSelect"
                                          onChange={(value) => setDetails({...details, id: value.value})}
                                          options={agentSelect}
                                          placeholder="Select an Option"
                                        />
                                        <p style={{color: 'red'}}>{cstError.referrer}</p>
                                    </FormGroup>
                                </Col>
                                <Col md={2}>
                                    <Button className={"btn-fill mt-4 ml-2"} color="success" type="button" onClick={onSubmit}>
                                        Submit
                                    </Button>
                                </Col>
                                {/*{details.type === 'table' ? <Col md={2}>*/}
                                {/*    <ReactToExcel*/}
                                {/*        className="btn btn-primary ml-3 mt-4"*/}
                                {/*        table="tableData"*/}
                                {/*        filename={`cpTree_export-${details.cif}`}*/}
                                {/*        sheet={'data'}*/}
                                {/*        ButtonText="Export"*/}
                                {/*        style={{width:'6rem'}}*/}
                                {/*    />*/}
                                {/*</Col> : null}*/}
                            </Row>
                        </Card>
                    </CardBody>
                </Card>
                {details.type === 'table' ? null: <Row>
                    <Col className="ml-auto mr-auto" md={4}
                         style={{background: 'linearGradient(#000, #000) noRepeat center/2px 100%'}}>
                        {upLine.map(function (value) {
                            return (
                              <>
                                  <Card key={value.id}>
                                      <CardBody className="text-center" style={{padding: 0, margin: 0}}>
                                          <h1 className={'text-info'} style={{padding: 0, margin: 0}}>
                                              <strong>{value.name}</strong></h1>
                                          <h4 className={'text-muted'} style={{padding: 0, margin: 0}}>
                                              <strong>ID: {value.id}</strong><strong
                                            className={'offset-3'}>Date: {value.date}</strong></h4>
                                      </CardBody>
                                      <span className={'text-center'}><ArrowDownwardIcon/></span>
                                  </Card>
                              </>
                            )
                        })}
                    </Col>
                </Row>}
                {details.type === 'table' ?
                  null:
                  <div>
                      <hr className={'bg-primary'}/>
                      <Row className={''}>
                          <Col className="ml-auto mr-auto" md={3}><ArrowDownwardIcon/></Col>
                          <Col className="ml-auto mr-auto" md={3}><ArrowDownwardIcon/></Col>
                          <Col className="ml-auto mr-auto" md={3}><ArrowDownwardIcon/></Col>
                          <Col className="ml-auto mr-auto" md={3}><ArrowDownwardIcon/></Col>
                      </Row>
                  </div>
                }
                {details.type === 'table' ? null: <Row>
                    {downLine.map(function (value){
                        return (
                          <Col className="ml-auto mr-auto" md={3} key={value.id}>
                              <Card>
                                  <CardBody className="text-center" style={{padding: 0, margin: 0}}>
                                      <h3 className={'text-info'} style={{padding: 0, margin: 0}}><strong>{value.name}</strong></h3>
                                      <p className={'text-muted'} style={{padding: 0, margin: 0}}><strong>ID: {value.id}</strong><strong className={'offset-3'}>Rank: {value.rank}</strong></p>
                                  </CardBody>
                              </Card>
                          </Col>
                        )
                    })}
                </Row>}
                {details.type === 'table' ? <CardBody>
                    <table className='table table-striped' id={'tableData'}>
                        <thead>
                        <tr>
                            <th className={'text-center'}>CP Code</th>
                            <th className={'text-center'}>CP Name</th>
                            <th className={'text-center'}>CP Rank</th>
                            <th className={'text-center'}>Parent Code</th>
                            <th className={'text-center'}>Parent Name</th>
                            <th className={'text-center'}>Parent Rank</th>
                        </tr>
                        </thead>
                        <tbody>
                        {allDownLine.map(value =>
                          <tr key={value.id}>
                              <th className={'text-center'}>{value.id}</th>
                              <th className={'text-center'}>{value.name}</th>
                              <th className={'text-center'}>{value.rank}</th>
                              <th className={'text-center'}>{fetchedData[value.referrer] ? fetchedData[value.referrer].id : ''}</th>
                              <th className={'text-center'}>{fetchedData[value.referrer] ? fetchedData[value.referrer].name : ''}</th>
                              <th className={'text-center'}>{fetchedData[value.referrer] ? fetchedData[value.referrer].rank : ''}</th>
                          </tr>
                        )}
                        </tbody>
                    </table>
                </CardBody>: null}
            </div>
        </>
    )
}

export default AdvisorTree;