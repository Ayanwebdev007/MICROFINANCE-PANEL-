import React from "react";
import axios from "axios";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import defaultSign from "../../../../assets/img/signature_placeholder.png";
import defaultImage from "../../../../assets/img/image_placeholder.jpg";

const initValue = {
    transDate: new Date().toISOString().slice(0, 10),
    accountType: 'loan',
    method: 'cash',
    account: '',
    disbursement: 0,
    disbursementDate: '',
    totalEMI: 0,
    paidEMI: 0,
    dueAmount: 0,
    emiCollection: 0,
    emiAmount: 0,
    totalAmount: 0,
    lateFee: 0,
    narration: '',
    name: '',
    emiMode: '',
    partialEmiDueAmount: 0,
    userEnteredAmount: 0,
    previousRemainingBalance: 0,
    dueInfo: {
        expected: 0,
        emiPending: 0,
        emiAmountNeedToPay: 0,
        remaining: 0
    }
}

export const useLoanRepayment = (notify) => {
    const authStatus = useSelector((state) => state.auth.authState);
    const location = useLocation();

    const [details, setDetails] = React.useState(initValue);
    const [cstError, setCstError] = React.useState({ ...initValue, cif: '', emiCollection: '' });
    const [showProgress, setShowProgress] = React.useState(false);
    const [sweetAlert, setSweetAlert] = React.useState({ render: false, message: '', type: 'success', title: 'Success' });
    const [profilePreviewUrl, setProfilePreviewUrl] = React.useState(defaultImage);
    const [signPreviewUrl, setSignPreviewUrl] = React.useState(defaultSign);
    const [applicants, setApplicants] = React.useState([]);

    const debounceTimer = React.useRef(null);

    const getImage = React.useCallback((uuid) => {
        const storage = getStorage();
        const imageRef = ref(storage, `/${authStatus.bankId}/image-assets/profile/${uuid}`);
        getDownloadURL(imageRef).then((url) => {
            setProfilePreviewUrl(url);
        }).catch(() => {
            setProfilePreviewUrl(defaultImage);
        });

        const signImageRef = ref(storage, `/${authStatus.bankId}/image-assets/signature/${uuid}`);
        getDownloadURL(signImageRef).then((url) => {
            setSignPreviewUrl(url);
        }).catch(() => {
            setSignPreviewUrl(defaultSign);
        });
    }, [authStatus.bankId]);

    const fetchAccountDetails = React.useCallback(async (account, transDate) => {
        try {
            const dateToUse = transDate || details.transDate;
            const res = await axios.get(`/api/get-loan-account/${details.accountType}/${account}/${dateToUse}`);
            if (res.data.success) {
                const responseObj = res.data.success;
                setApplicants(responseObj.applicants);

                if (responseObj.closed === true) {
                    setSweetAlert({
                        render: true,
                        message: 'Account is already closed. Over payment is not allowed.',
                        type: 'danger',
                        title: 'Closed Account!'
                    });
                }

                setDetails(prev => ({
                    ...prev,
                    account: account,
                    disbursement: responseObj.disbursement,
                    totalEMI: responseObj.totalEMI,
                    paidEMI: responseObj.paidEMI,
                    emiCollection: 0,
                    emiAmount: parseInt(responseObj.emiAmount),
                    narration: '',
                    name: responseObj.applicants[0].name,
                    disbursementDate: responseObj.disbursementDate,
                    emiMode: responseObj.emiMode,
                    previousDue: responseObj.previousDue,
                    previousRemainingBalance: responseObj.partialEmiDueAmount,
                    dueInfo: responseObj.dueInfo || initValue.dueInfo
                }));
                getImage(responseObj.uuid);
            } else {
                setDetails(prev => ({ ...initValue, account, transDate: prev.transDate }));
                setProfilePreviewUrl(defaultImage);
                setSignPreviewUrl(defaultSign);
                setApplicants([]);
            }
        } catch (e) {
            setShowProgress(false);
            notify(e.toString(), 'danger');
        }
    }, [details.accountType, details.transDate, getImage, notify]);

    const handleAccountInput = (e) => {
        const account = e.target.value;
        setDetails(prev => ({ ...prev, account }));

        if (debounceTimer.current) clearTimeout(debounceTimer.current);

        if (account) {
            debounceTimer.current = setTimeout(() => {
                fetchAccountDetails(account);
            }, 800);
        } else {
            setDetails(prev => ({ ...initValue, transDate: prev.transDate }));
            setProfilePreviewUrl(defaultImage);
            setSignPreviewUrl(defaultSign);
            setApplicants([]);
        }
    };

    const handleCollectionAmountChange = (enteredAmount, lateFeeValue) => {
        const entered = parseInt(enteredAmount) || 0;
        const lateFee = parseInt(lateFeeValue) || 0;

        const previousPartialDueAmount = Number(details.previousRemainingBalance || 0);
        const emiAmount = Number(details.emiAmount || 0);

        let availableAmount = entered - previousPartialDueAmount - lateFee;
        availableAmount = Math.max(availableAmount, 0);

        let emiCollected = 0;
        let newPartialEmiDueAmount = 0;

        if (availableAmount > 0 && emiAmount > 0) {
            const fullEmis = Math.floor(availableAmount / emiAmount);
            const partialEmi = availableAmount % emiAmount;

            if (partialEmi > 0) {
                emiCollected = fullEmis + 1;
                newPartialEmiDueAmount = emiAmount - partialEmi;
            } else {
                emiCollected = fullEmis;
                newPartialEmiDueAmount = 0;
            }
        }

        setDetails(prev => ({
            ...prev,
            userEnteredAmount: entered,
            lateFee,
            emiCollection: emiCollected,
            partialEmiDueAmount: newPartialEmiDueAmount,
            totalAmount: entered,
        }));
    };

    const onSubmit = async () => {
        if (!details.account) {
            setCstError(prev => ({ ...prev, account: 'valid account is required' }));
            return;
        }
        if (details.emiCollection < 0) {
            setCstError(prev => ({ ...prev, emiCollection: 'Collected EMI cannot be negative' }));
            return;
        }
        if (details.emiCollection > (details.totalEMI - details.paidEMI)) {
            setCstError(prev => ({ ...prev, emiCollection: 'EMI collection cannot be greater than pending EMI' }));
            return;
        }

        setCstError({ ...initValue, cif: '', emiCollection: '' });
        setShowProgress(true);

        try {
            const submit = await axios.post('/api/loan/loan-repayment-transaction', details);
            setShowProgress(false);
            if (submit.data.success) {
                setDetails(initValue);
                setProfilePreviewUrl(defaultImage);
                setSignPreviewUrl(defaultSign);
                setApplicants([]);
                setSweetAlert({
                    render: true,
                    message: submit.data.success,
                    type: 'success',
                    title: 'Success!'
                });
            } else {
                setSweetAlert({
                    render: true,
                    message: submit.data.error,
                    type: 'danger',
                    title: 'Failed to process!'
                });
            }
        } catch (e) {
            setShowProgress(false);
            notify(e.toString(), 'danger');
        }
    };

    React.useEffect(() => {
        const prefillAccountNo = location.state?.prefillAccountNo;
        if (prefillAccountNo) {
            setDetails(prev => ({ ...prev, account: prefillAccountNo }));
            fetchAccountDetails(prefillAccountNo);
        }
    }, [location.state, fetchAccountDetails]);

    return {
        details,
        setDetails,
        cstError,
        showProgress,
        sweetAlert,
        setSweetAlert,
        profilePreviewUrl,
        signPreviewUrl,
        applicants,
        handleAccountInput,
        handleCollectionAmountChange,
        onSubmit,
        fetchAccountDetails
    };
};
