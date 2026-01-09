import React from "react";
import 'firebase/compat/app-check';
import {
    Button,
    Card,
    CardBody,
    CardFooter,
    CardHeader,
    CardTitle,
    Col,
    Form,
    FormGroup,
    Input,
    Label,
    Row
} from "reactstrap";
import Select from "react-select";
import axios from "axios";
import NotificationAlert from "react-notification-alert";
import SweetAlert from 'react-bootstrap-sweetalert';
import {CircularProgress, LinearProgress} from "@mui/material";
import { useLocation } from "react-router-dom";
import $ from "jquery";
import {useNavigate} from "react-router-dom";

function InputForm(props) {
    const initValue = {
        centerHead: '',
        groupHead: '',
        groupId: '',
        name: '',
        updateDate: props.date,
        associatedEmployee: '',
        joinedMembers: {},
        existingMembers: [],
    };

    const location = useLocation();
    const groupId = location.state?.groupId;
    const notificationAlertRef = React.useRef(null);
    const [fetched, setFetched] = React.useState(false);
    const [employeeSelect, setEmployeeSelect] = React.useState([]);
    const [sweetAlert, setSweetAlert] = React.useState({render: false, message: '', type: 'success', title: 'Success'});
    const [details, setDetails] = React.useState({
        ...initValue,
    });
    const [cstError, setCstError] = React.useState(initValue);
    const [showProgress, setShowProgress] = React.useState(false);
    const [memberTable, setMemberTable] = React.useState([]);
    const navigate = useNavigate();

    const notify = (message, color) => {
        const options = {
            place: 'tc',
            message: (
                <div>{message}</div>
            ),
            type: color,
            icon: "tim-icons icon-bell-55",
            autoDismiss: 5,
            // add display propaty : true / falsh like that
        };
        notificationAlertRef.current.notificationAlert(options);
    };

    if (!fetched){
        setFetched(true);
        axios.post('/api/member/get-users-by-bank-restrictive', {})
            .then(function (value){
                if (value.data.success){
                    setEmployeeSelect(value.data.data);
                }else if (value.data.info){
                    notify(value.data.info, 'info');
                }else {
                    notify(value.data.error, 'danger');
                }
            }).catch(function (error){
            notify(error, 'danger');
        });
    }
    React.useEffect(() => {
        if (groupId) {
            groupIdInputHandler({ target: { value: groupId } });
        }
    }, [groupId]);

    async function onSubmit() {
        const checkInput = validateInput(details);
        const checkMember = validateMember(details.joinedMembers);

        if (checkInput && checkMember){
            setCstError(initValue);
            setDetails({
                ...initValue,
                updateDate: details.date,
                associatedEmployee: details.associatedEmployee,
            });
            setMemberTable([]);
            setShowProgress(true);

            try {
                const submit = await axios.post('/api/master/update-mFinanceGroup', details);
                if (submit.data.success){
                    setShowProgress(false);
                    setSweetAlert({
                        render: true,
                        message: submit.data.success,
                        type: 'success',
                        title: 'Success!'
                    });
                }else {
                    setShowProgress(false);
                    setSweetAlert({
                        render: true,
                        message: submit.data.error,
                        type: 'danger',
                        title: 'Failed to process!'
                    });
                }
            }catch (e) {
                setShowProgress(false);
                console.log(e);
                notify(e.toString(), 'danger', 10);
            }
        }
    }


    function validateInput(userInput) {
        let valid = true;
        let errorObj = {...initValue};
        if (!userInput.name){
            errorObj = {...errorObj, name: 'this field is required'};
            valid = false;
        }
        if (!userInput.associatedEmployee){
            errorObj = {...errorObj, associatedEmployee: 'this field is required'};
            valid = false;
        }

        setCstError({...errorObj});
        return valid
    }

    const timerRef = React.useRef(null);
    async function groupIdInputHandler(event) {
        setDetails({...initValue, groupId: event.target.value});

        // debouncing
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(async () => {
        if (event.target.value) {
            const groupId = event.target.value;
            const fetchDetails = await axios.get(`/api/master/get-mFinanceGroup-for-edit/${groupId}`);
            console.log(fetchDetails);
            if (fetchDetails.data.success){
                notify(fetchDetails.data.success, 'success');
                setDetails({...fetchDetails.data.details, groupId: groupId});
                const members = Object.values(fetchDetails.data.details.joinedMembers);
                const membersKey = [];
                for (let i = 0; i < members.length; i++) {
                    membersKey.push(i);
                }
                setMemberTable(membersKey);
            }
        }
        }, 500);
    }

    function validateMember(membersObj){
        let validated = true;
        const memberArray = Object.values(membersObj);
        for (let i = 0; i < memberArray.length; i++) {
            if (!memberArray[i].kyc || !memberArray[i].name){
                validated = false;
                notify(`Invalid Member Info in Line Number ${i + 1}`, 'warning');
            }
        }
        return validated;
    }

    function onSweetAlertAccept(){
        setSweetAlert({render: false, message: '', type: 'success', title: ''});
    }

    function generateNomineeRow(){
        const numberOfRow = parseInt($('#nomineeRow').val());
        if (parseInt(numberOfRow || '0') > 0){
            setMemberTable(Array.from(Array(numberOfRow).keys()));
        } else {
            setMemberTable([]);
            notify('enter a valid count and try again', 'danger');
        }
    }

    async function kycSelectHandler(type, identifier, lineId){
        if (identifier){
            const fetchDetails = await axios.get(`/api/member/get-member-by-id/${identifier}`);
            if (fetchDetails.data.success){
                const responseObj = fetchDetails.data;
                const memberObj = {
                    account: '',
                    name: responseObj.name,
                    kyc: responseObj.id,
                    guardian: responseObj.guardian,
                    address: responseObj.address,
                };
                setDetails({...details, joinedMembers: {...details.joinedMembers, [lineId]: memberObj}});
                notify(fetchDetails.data.success, 'success');
            }else {
                const memberObj = {
                    account: '',
                    name: '',
                    kyc: identifier,
                    guardian: '',
                    address: '',
                };
                setDetails({...details, joinedMembers: {...details.joinedMembers, [lineId]: memberObj}});
            }
        }
    }

    function handleKYCInput(event){
        let temp = {};
        const id = event.target.name;
        const lineId = (id.split('-'))[0];
        const type = (id.split('-'))[1]
        if (event.target.value){
            kycSelectHandler(type, event.target.value, lineId);
            if (details.joinedMembers[lineId]){
                temp = {
                    ...details.joinedMembers[lineId],
                    [type]: event.target.value
                }
            }else {
                temp = {[type]: event.target.value}
            }
            setDetails({
                ...details,
                joinedMembers: {
                    ...details.joinedMembers,
                    [lineId]: temp
                }
            });
        }
    }

    const handleMemberClick = (memberNo) => {
        navigate("/member/view-members", { state: { kycId: memberNo } });
    };

    return (
        <>
            <div className="rna-container">
                <NotificationAlert ref={notificationAlertRef} />
            </div>
            {sweetAlert.render? <SweetAlert
                {...{[sweetAlert.type]: sweetAlert.type}}
                style={{display: "block",marginTop: "-100px"}}
                title={sweetAlert.title}
                onConfirm={() => onSweetAlertAccept()}
                onCancel={() => setSweetAlert({render: false, message: '', type: 'success', title: ''})}
                confirmBtnBsStyle="info"
            >
                {sweetAlert.message}
            </SweetAlert>: null}
            <div className="content">
                <div className={'mb-2'}>
                    {showProgress ? <LinearProgress /> : null}
                </div>
                <Card>
                    <Form autoComplete={'off'} >
                        <CardHeader>
                            <CardTitle tag="h4">Basic Details</CardTitle>
                        </CardHeader>
                        <CardBody>
                            <Card>
                                <Row>
                                    <Col md={'3'}>
                                        <Label>Group Id</Label>
                                        <FormGroup>
                                            <FormGroup>
                                                <Input
                                                    type="text"
                                                    id="groupId"
                                                    value={details.groupId}
                                                    onChange={(e) => groupIdInputHandler(e)}
                                                />
                                                <p style={{color: 'red'}}>{cstError.groupId}</p>
                                            </FormGroup>
                                        </FormGroup>
                                    </Col>
                                    <Col md={'3'}>
                                        <Label>Group Name</Label>
                                        <FormGroup className={cstError.name? 'has-danger' : 'has-success'}>
                                            <Input type={'text'} id={'name'} value={details.name}
                                                   style={{backgroundColor: props.color}}
                                                   onChange={(event) => setDetails({...details, name: (event.target.value).toUpperCase()})}
                                            />
                                            <p style={{color: 'red'}}>{cstError.name}</p>
                                        </FormGroup>
                                    </Col>
                                    <Col md={'3'}>
                                        <Label>Updated On</Label>
                                        <FormGroup>
                                            <FormGroup>
                                                <Input type={'date'} id={'updateDate'} value={details.updateDate}
                                                       style={{backgroundColor: props.color}}
                                                       onChange={(event) => setDetails({...details, updateDate: event.target.value})}
                                                />
                                            </FormGroup>
                                        </FormGroup>
                                    </Col>
                                </Row>
                            </Card>
                        </CardBody>

                        <CardHeader>
                            <CardTitle>Add New Members</CardTitle>
                        </CardHeader>
                        <CardBody>
                            <Card>
                                <Row>
                                    <Col md={'2'}>
                                        <Label>Count</Label>
                                        <FormGroup>
                                            <Input type="number" autoComplete="off" id={'nomineeRow'} className={cstError.members? 'has-danger' : 'has-success'} style={{backgroundColor: props.color}}/>
                                            <p style={{color: 'red'}}>{cstError.members}</p>
                                        </FormGroup>
                                    </Col>
                                    <Col md={'.5'}>
                                        <Label/>
                                        <FormGroup>
                                            <Button className="btn-icon" color="primary" type="button" onClick={generateNomineeRow}>
                                                <i className="tim-icons icon-tap-02"/>
                                            </Button>
                                        </FormGroup>
                                    </Col>
                                </Row>
                            </Card>
                        </CardBody>
                        <CardHeader>
                            <CardTitle tag="h4">Senior Details</CardTitle>
                        </CardHeader>
                        <CardBody>
                            <Card>
                                <Row>
                                    <Col md={3}>
                                        <Label>Select Associated Employee</Label>
                                        <FormGroup>
                                            <Select
                                                className="react-select info"
                                                classNamePrefix="react-select"
                                                name="agentSelect"
                                                onChange={(value) => setDetails({...details, associatedEmployee: value.key})}
                                                options={employeeSelect}
                                                placeholder="Select an Option"
                                            />
                                            <p style={{color: 'red'}}>{cstError.associatedEmployee}</p>
                                        </FormGroup>
                                    </Col>
                                    <Col md={4}>
                                        <Label>Center Head kyc Id</Label>
                                        <FormGroup>
                                            <p>{details.centerHead ? details.centerHead : ''}</p>
                                            <p style={{color: 'red'}}>{cstError.centerHead}</p>
                                        </FormGroup>
                                    </Col> <Col md={4}>
                                    <Label>Group Head kyc Id</Label>
                                    <FormGroup>
                                        <p>{details.centerHead ? details.groupHead : ''}</p>
                                        <p style={{color: 'red'}}>{cstError.associatedEmployee}</p>
                                    </FormGroup>
                                </Col>
                                </Row>
                            </Card>
                        </CardBody>
                        <CardBody>
                            <table className="table table-striped">
                                <thead>
                                <tr>
                                    <th className={'text-center'}>KYC ID</th>
                                    <th className={'text-center'}>Name</th>
                                    <th className={'text-center'}>Guardian</th>
                                    <th className={'text-center'}>Address</th>
                                </tr>
                                </thead>
                                <tbody>
                                {memberTable.map((key) =>{
                                    return <tr key={key}>
                                        <th className={'text-center'}>
                                            <Input type="text" autoComplete="off" value={details.joinedMembers[key] ? details.joinedMembers[key].kyc : ''}
                                                   onChange={handleKYCInput} name={key + '-kyc'}/>
                                        </th>
                                        <th className={'text-center'}>
                                            <Input type="text" autoComplete="off" readOnly={true} value={details.joinedMembers[key] ? details.joinedMembers[key].name : ''}/>
                                        </th>
                                        <th className={'text-center'}>
                                            <Input type="text" autoComplete="off" readOnly={true} value={details.joinedMembers[key] ? details.joinedMembers[key].guardian : ''}/>
                                        </th>
                                        <th className={'text-center'}>
                                            <Input type="text" autoComplete="off" readOnly={true} value={details.joinedMembers[key] ? details.joinedMembers[key].address : ''}/>
                                        </th>
                                    </tr>
                                })}
                                </tbody>
                            </table>
                        </CardBody>
                        <CardHeader>
                            <CardTitle>Existing Members</CardTitle>
                        </CardHeader>
                        <CardBody>
                            <table className="table table-striped">
                                <thead>
                                <tr>
                                    <th className={'text-center'}>Sl. No</th>
                                    <th className={'text-center'}>KYC ID</th>
                                    <th className={'text-center'}>Name</th>
                                    <th className={'text-center'}>Guardian</th>
                                    <th className={'text-center'}>Phone No</th>
                                    <th className={'text-center'}>Address</th>
                                    <th className={'text-center'}>VIEW</th>
                                </tr>
                                </thead>
                                <tbody>
                                {details.existingMembers.map((member, index) => <tr key={member.id}>
                                    <th className={'text-center'}>{index + 1}</th>
                                    <th className={'text-center'}>
                                        <div className={'text-info'} onClick={() => handleMemberClick(member.id)}>{member.id}</div>
                                    </th>
                                    <th className={'text-center'}>{member.name}</th>
                                    <th className={'text-center'}>{member.guardian}</th>
                                    <th className={'text-center'}>{member.phone}</th>
                                    <th className={'text-center'}>{member.address}</th>
                                    <th className={'text-center'}>
                                        <Button
                                            className="tim-icons icon-zoom-split btn-icon"
                                            color="info"
                                            type="button"
                                            onClick={() => handleMemberClick(member.id)}
                                        />
                                    </th>
                                </tr>)}
                                </tbody>
                            </table>
                        </CardBody>
                        <CardFooter className={'text-center'}>
                            <div className={'mb-2'}>
                                {showProgress ? <CircularProgress style={{color: '#75E6DA'}} /> : null}
                            </div>
                            <Button className="btn-fill" color="success" type="button" onClick={onSubmit}>
                                Update
                            </Button>
                        </CardFooter>
                    </Form>
                </Card>
            </div>
        </>
    )
}

export default InputForm;