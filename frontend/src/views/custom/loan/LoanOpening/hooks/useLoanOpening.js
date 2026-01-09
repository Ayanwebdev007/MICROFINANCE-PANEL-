import React from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';

const initInput = {
    loanDate: new Date().toISOString().slice(0, 10),
    accountType: 'loan',
    memberId: "",
    memberName: "",
    uuid: '#',
    amount: 0,
    emiAmount: 0,
    principleEMI: 0,
    interestEMI: 0,
    loanTerm: 0,
    emiCount: 0,
    firstEmiDate: "",
    planDetails: {
        id: '',
        name: '',
        type: '',
        emiMode: '',
        emiInterval: '',
        minAge: '',
        maxAge: '',
        minAmount: '',
        maxAmount: '',
        minTerm: '',
        maxTerm: '',
        interestRate: '',
        interestType: '',
        security: '',
        processingFee: 0,
        legalFee: 0,
        insuranceFeeRate: 0,
        gstRate: 0,
        valuerFeeRate: 0,
        gracePeriod: 0,
        penaltyType: '',
        penaltyRate: '',
        calculationMethod: '',
    },
    guarantor: {
        memberCode: "",
        guarantorName: "",
        address: "",
        pinCode: "",
        phone: "",
        securityType: "",
    },
    coApplicant: {
        memberCode: "",
        coApplicantname: "",
        address: "",
        pinCode: "",
        phone: "",
        securityDetails: "",
    },
    deductionDetails: {
        processingFee: "",
        legalAmount: "",
        gst: "",
        insuranceAmount: "",
    },
};

const initMemberInfo = {
    name: '',
    guardian: '',
    gender: '',
    dob: '',
    materialStatus: '',
    email: '',
    phone: '',
    address: '',
    aadhar: '',
    voter: '',
    pan: '',
    occupation: '',
    income: '',
    education: '',
};

export const useLoanOpening = (notify) => {
    const location = useLocation();
    const authStatus = useSelector((state) => state.auth.authState);

    const [formData, setFormData] = React.useState(initInput);
    const [memberData, setMemberData] = React.useState(initMemberInfo);
    const [planWarningShown, setPlanWarningShown] = React.useState(false);
    const [progressbar, setProgressbar] = React.useState(false);
    const [planList, setPlanList] = React.useState([]);
    const [cstError, setCstError] = React.useState({});
    const [sweetAlert, setSweetAlert] = React.useState(false);

    // Initial fetch of plans
    React.useEffect(() => {
        const fetchPlans = async () => {
            try {
                const response = await axios.get('/api/loan/get-plans/loan');
                if (response.data.success) {
                    if (response.data.plans.length > 0) {
                        setPlanList(response.data.plans);
                    } else {
                        notify('No plan found! Please add a plan.', 'warning');
                    }
                } else {
                    notify(response.data.error, 'danger');
                }
            } catch (error) {
                notify(error.toLocaleString(), 'danger');
            }
        };
        fetchPlans();
    }, [notify]);

    // Handle prefill from location state
    React.useEffect(() => {
        const { memberId } = location.state || {};
        if (memberId) {
            getMemberData({ target: { value: memberId } });
        }
    }, [location.state]);

    const validateForm = () => {
        let formErrors = {};
        let isValid = true;

        if (!formData.planDetails.id) {
            formErrors.planId = "Loan Plan is required.";
            isValid = false;
        }
        if (!formData.amount) {
            formErrors.amount = "Please enter disbursement amount";
            isValid = false;
        }
        if (!formData.loanTerm) {
            formErrors.loanTerm = "Please enter loan term";
            isValid = false;
        }
        if (!formData.memberId) {
            formErrors.memberId = "Please enter member id";
            isValid = false;
        }
        if (!formData.loanDate) {
            formErrors.loanDate = "Loan Date is required.";
            isValid = false;
        }
        if (!formData.firstEmiDate) {
            formErrors.firstEmiDate = "First Emi Date is required.";
            isValid = false;
        }
        if (!formData.emiCount || !formData.principleEMI || !formData.interestEMI) {
            notify('Please select plan details then Loan Amount', 'danger');
            isValid = false;
        }

        setCstError(formErrors);
        return isValid;
    };

    const checkIfExistingLoan = async (memberId) => {
        try {
            const fetchData = await axios.post('/api/loan/check-existing-loan', {
                memberId: memberId,
                loanType: 'loan'
            });
            if (fetchData.data.success) {
                notify('No Active Loan Found for the member. You can apply for a new loan.', 'success');
            } else if (fetchData.data.warning) {
                window.alert(fetchData.data.warning);
            } else {
                notify(fetchData.data.error, 'danger');
            }
        } catch (error) {
            notify('Error checking existing loan: ' + error.toLocaleString(), 'danger');
        }
    };

    const getMemberData = async (event) => {
        const memberId = event.target.value;
        setFormData(prev => ({ ...prev, memberId }));

        if (memberId) {
            try {
                const fetchData = await axios.get(`/api/member/get-member-by-id/${memberId}`);
                if (fetchData.data.success) {
                    await checkIfExistingLoan(memberId);
                    setMemberData(fetchData.data);
                    setFormData(prev => ({
                        ...prev,
                        memberId: fetchData.data.id,
                        memberName: fetchData.data.name,
                        uuid: fetchData.data.uuid,
                    }));
                } else {
                    setMemberData(initMemberInfo);
                    notify(fetchData.data.error, 'warning');
                }
            } catch (e) {
                setMemberData(initMemberInfo);
                notify(e.toLocaleString(), 'danger');
            }
        }
    };

    const handlePlanSelect = (plan) => {
        setFormData(prev => ({
            ...prev,
            planDetails: plan,
        }));
        setPlanWarningShown(false);
    };

    const handleLoanAmount = async (amount) => {
        if (!formData.planDetails.id) {
            if (!planWarningShown) {
                notify('Please select a loan plan first.', 'warning');
                setPlanWarningShown(true);
            }
            return;
        }

        const loanAmount = parseFloat(amount);
        if (loanAmount > formData.planDetails.maxAmount || loanAmount < formData.planDetails.minAmount) {
            if (!planWarningShown) {
                notify('Amount should be less than max amount and greater than min amount.', 'warning');
                setPlanWarningShown(true);
            }
        }

        // Call backend API for calculations (Logic Pushdown)
        try {
            const response = await axios.post('/api/loan/calculate-loan-terms', {
                amount: loanAmount,
                planDetails: formData.planDetails
            });

            if (response.data.success) {
                const calcResult = response.data;
                setFormData(prev => ({
                    ...prev,
                    amount: amount,
                    loanTerm: calcResult.loanTerm,
                    emiAmount: calcResult.emiAmount,
                    emiCount: calcResult.emiCount,
                    principleEMI: calcResult.principleEMI,
                    interestEMI: calcResult.interestEMI,
                    deductionDetails: calcResult.deductionDetails
                }));
            } else {
                notify(response.data.error || 'Failed to calculate loan terms', 'danger');
            }
        } catch (error) {
            notify('Error calculating loan terms: ' + error.toLocaleString(), 'danger');
        }
    };

    const handleSubmit = async () => {
        if (validateForm()) {
            try {
                setProgressbar(true);
                const submitData = await axios.post("/api/loan/loan-opening-application", {
                    formData,
                    memberData,
                    accountType: 'loan',
                });
                if (submitData.data.success) {
                    setFormData(initInput);
                    setMemberData(initMemberInfo);
                    setSweetAlert(true);
                    notify(submitData.data.success, 'success');
                } else {
                    notify(submitData.data.error, 'warning');
                }
            } catch (e) {
                notify(e.toLocaleString(), 'danger');
            } finally {
                setProgressbar(false);
            }
        } else {
            notify('Please fill mandatory details and try again', 'danger');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleNestedInputChange = (section, field, value) => {
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value,
            },
        }));
    };

    return {
        formData, setFormData,
        memberData, setMemberData,
        planList,
        progressbar,
        cstError,
        sweetAlert, setSweetAlert,
        handleInputChange,
        handleNestedInputChange,
        handlePlanSelect,
        handleLoanAmount,
        getMemberData,
        handleSubmit,
        authStatus
    };
};
