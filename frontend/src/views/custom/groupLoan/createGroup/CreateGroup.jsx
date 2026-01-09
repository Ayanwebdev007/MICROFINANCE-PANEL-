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
import $ from "jquery";

function GroupCreation() {
    const initValue = {
        name: '',
        creationDate: new Date().toISOString().slice(0, 10),
        associatedEmployee: '',
        centerHead: '',
        groupHead: '',
        joinedMembers: {},

    };
    const notificationAlertRef = React.useRef(null);
    const [fetched, setFetched] = React.useState(false);
    const [employeeSelect, setEmployeeSelect] = React.useState([]);
    const [sweetAlert, setSweetAlert] = React.useState({render: false, message: '', type: 'success', title: 'Success'});
    const [details, setDetails] = React.useState(initValue);
    const [cstError, setCstError] = React.useState(initValue);
    const [showProgress, setShowProgress] = React.useState(false);
    const [memberTable, setMemberTable] = React.useState([]);
    const [validMembers, setValidMembers] = React.useState({});

    const debounceTimers = React.useRef({});

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

    async function onSubmit() {
        const checkInput = validateInput(details);
        const checkMember = validateMember(details.joinedMembers);

        if (checkInput && checkMember){
            setCstError(initValue);
            setDetails({
                ...initValue,
                creationDate: details.date,
                associatedEmployee: details.associatedEmployee,
            });
            setMemberTable([]);
            setShowProgress(true);

            try {
                const submit = await axios.post('/api/master/mFinanceGroup', details);
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

    function generateMemberRow(){
        const numberOfRow = parseInt($('#nomineeRow').val());
        if (parseInt(numberOfRow || '0') > 0){
            setMemberTable(Array.from(Array(numberOfRow).keys()));
        } else {
            setMemberTable([]);
            notify('enter a valid count and try again', 'danger');
        }
    }

    function handleKYCChange(event) {
        const { name, value } = event.target;
        const [lineId, type] = name.split('-');

        const oldKyc = details.joinedMembers?.[lineId]?.kyc;

        setDetails(prev => ({
            ...prev,
            joinedMembers: {
                ...prev.joinedMembers,
                [lineId]: {
                    ...(prev.joinedMembers[lineId] || {}),
                    [type]: value
                }
            }
        }));

        // 🔥 If KYC edited or cleared → remove from validMembers
        if (type === 'kyc' && oldKyc && oldKyc !== value) {
            setValidMembers(prev => {
                const copy = { ...prev };
                delete copy[oldKyc];
                return copy;
            });

            clearHeadsIfInvalid(oldKyc);
        }
    }

    const clearHeadsIfInvalid = (removedKyc) => {
        setDetails(prev => ({
            ...prev,
            centerHead: prev.centerHead === removedKyc ? '' : prev.centerHead,
            groupHead: prev.groupHead === removedKyc ? '' : prev.groupHead
        }));
    };
    const memberOptions = React.useMemo(() => {
        return Object.values(validMembers).map(m => ({
            label: `${m.name} - ${m.kyc}`,
            value: m.kyc
        }));
    }, [validMembers]);

    async function handleKYCSubmit(event, lineId) {
        event.preventDefault();

        const identifier = details.joinedMembers[lineId]?.kyc;
        if (!identifier) return;

        try {
            const fetchDetails = await axios.get(
                `/api/member/get-member-by-id/${identifier}`
            );

            if (fetchDetails.data.success) {
                const responseObj = fetchDetails.data;

                const memberObj = {
                    account: '',
                    name: responseObj.name,
                    kyc: responseObj.id,
                    guardian: responseObj.guardian,
                    address: responseObj.address,
                };

                // update joinedMembers
                setDetails(prev => ({
                    ...prev,
                    joinedMembers: {
                        ...prev.joinedMembers,
                        [lineId]: memberObj
                    }
                }));

                // 🔥 add ONLY valid member to dropdown source
                setValidMembers(prev => ({
                    ...prev,
                    [responseObj.id]: {
                        name: responseObj.name,
                        kyc: responseObj.id
                    }
                }));

                notify(responseObj.success, 'success');
            } else {
                // invalid KYC → remove from dropdown
                setValidMembers(prev => {
                    const copy = { ...prev };
                    delete copy[identifier];
                    return copy;
                });

                clearHeadsIfInvalid(identifier);

                notify(fetchDetails.data.error, 'danger');
            }
        } catch (error) {
            console.error(error);
        }
    }
    React.useEffect(() => {
        return () => {
            Object.values(debounceTimers.current).forEach(timer => clearTimeout(timer));
        };
    }, []);

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
                    <div>
                        <CardHeader>
                            <CardTitle tag="h4">Basic Details</CardTitle>
                        </CardHeader>
                        <CardBody>
                            <Card>
                                <Row>
                                    <Col md={'4'}>
                                        <Label>Group Name</Label>
                                        <FormGroup className={cstError.name? 'has-danger' : 'has-success'}>
                                            <Input type={'text'} id={'name'} value={details.name}
                                                   onChange={(event) => setDetails({...details, name: (event.target.value).toUpperCase()})}
                                            />
                                            <p style={{color: 'red'}}>{cstError.name}</p>
                                        </FormGroup>
                                    </Col>
                                    <Col md={'4'}>
                                        <Label>Established On</Label>
                                        <FormGroup>
                                            <FormGroup>
                                                <Input type={'date'} id={'creationDate'} value={details.creationDate}
                                                       onChange={(event) => setDetails({...details, creationDate: event.target.value})}
                                                />
                                            </FormGroup>
                                        </FormGroup>
                                    </Col>

                                </Row>
                            </Card>
                        </CardBody>
                        <CardHeader>
                            <CardTitle>Member Details</CardTitle>
                        </CardHeader>
                        <CardBody>
                            <Card>
                                <Row>
                                    <Col md={'2'}>
                                        <Label>Count</Label>
                                        <FormGroup>
                                            <Input type="number" autoComplete="off" id={'nomineeRow'} className={cstError.members? 'has-danger' : 'has-success'}/>
                                            <p style={{color: 'red'}}>{cstError.members}</p>
                                        </FormGroup>
                                    </Col>
                                    <Col md={'.5'}>
                                        <Label/>
                                        <FormGroup>
                                            <Button className="btn-icon" color="primary" type="button" onClick={generateMemberRow}>
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
                                    <Col md={4}>
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
                                    </Col> <Col md={4}>
                                        <Label>Select Center Head</Label>
                                        <FormGroup>
                                            <Select
                                                className="react-select info"
                                                classNamePrefix="react-select"
                                                name="centerHead"
                                                options={memberOptions}
                                                value={memberOptions.find(o => o.value === details.centerHead) || null}
                                                onChange={(opt) =>
                                                    setDetails(prev => ({ ...prev, centerHead: opt.value }))
                                                }
                                                placeholder="Select Center Head"
                                            />
                                            <p style={{color: 'red'}}>{cstError.centerHead}</p>
                                        </FormGroup>
                                    </Col> <Col md={4}>
                                        <Label>Select Group Head</Label>
                                        <FormGroup>
                                            <Select
                                                className="react-select info"
                                                classNamePrefix="react-select"
                                                name="groupHead"
                                                options={memberOptions}
                                                value={memberOptions.find(o => o.value === details.groupHead) || null}
                                                onChange={(opt) =>
                                                    setDetails(prev => ({ ...prev, groupHead: opt.value }))
                                                }
                                                placeholder="Select Group Head"
                                            />
                                            <p style={{color: 'red'}}>{cstError.groupHead}</p>
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
                                            {/*<Input type="text" autoComplete="off" value={details.joinedMembers[key] ? details.joinedMembers[key].kyc : ''}*/}
                                            {/*       onChange={handleKYCInput} name={key + '-kyc'}/>*/}
                                            <form onSubmit={(e) => handleKYCSubmit(e, key)}>
                                                <div className="d-flex">
                                                    <Input
                                                        type="text"
                                                        autoComplete="off"
                                                        name={`${key}-kyc`}
                                                        value={details.joinedMembers[key]?.kyc || ''}
                                                        onChange={handleKYCChange}
                                                    />

                                                    <div className="d-flex align-items-center h-auto">
                                                        <button
                                                            type="submit"
                                                            className="pill-btn"
                                                            style={{
                                                                marginLeft: "-55px",
                                                                background: "#5e72e4",
                                                                width: "50px",
                                                                borderRadius: "7px",
                                                                border: "2px solid #5e72e4",
                                                                color: "white",
                                                                fontWeight: "bold",
                                                            }}
                                                        >
                                                            →
                                                        </button>
                                                    </div>
                                                </div>
                                            </form>
                                        </th>
                                        {/*<th className={'text-center'}>*/}
                                        {/*    <Input type="text" autoComplete="off" readOnly={true} value={details.joinedMembers[key] ? details.joinedMembers[key].kyc : ''}/>*/}
                                        {/*</th>*/}
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
                        <CardFooter className={'text-center'}>
                            <div className={'mb-2'}>
                                {showProgress ? <CircularProgress style={{color: '#75E6DA'}} /> : null}
                            </div>
                            <Button className="btn-fill" color="success" type="button" onClick={onSubmit}>
                                Submit
                            </Button>
                        </CardFooter>
                    </div>
                </Card>
            </div>
        </>
    )
}

export default GroupCreation;