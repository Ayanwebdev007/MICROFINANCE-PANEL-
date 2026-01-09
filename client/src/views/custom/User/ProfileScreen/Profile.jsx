import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardBody, Row, Col, Button, CardHeader, Spinner } from "reactstrap";
import axios from "axios";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import ReactBSAlert from "react-bootstrap-sweetalert";

export default function Profile() {
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [resetLoading, setResetLoading] = useState(false);
    const [alert, setAlert] = useState(null);

    const auth = getAuth();

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const response = await axios.post("/api/user/user-profile");
                if (response.data.success) {
                    setUserData(response.data.data);
                } else {
                    setError("Failed to fetch user data.");
                }
            } catch (err) {
                console.error("API call failed: ", err);
                setError("An error occurred while fetching data.");
            } finally {
                setLoading(false);
            }
        };

        fetchUserProfile();
    }, []);

    // Reset password function
    const handleResetPassword = () => {
        if (!userData?.email) {
            setAlert(
                <ReactBSAlert
                    warning
                    style={{ display: "block", marginTop: "-100px" }}
                    title="Error"
                    onConfirm={() => setAlert(null)}
                    confirmBtnBsStyle="danger"
                    confirmBtnText="OK"
                >
                    No email associated with this account.
                </ReactBSAlert>
            );
            return;
        }
        setResetLoading(true);
        sendPasswordResetEmail(auth, userData.email)
            .then(() => {
                setAlert(
                    <ReactBSAlert
                        success
                        style={{ display: "block", marginTop: "-100px" }}
                        title="Email Sent!"
                        onConfirm={() => setAlert(null)}
                        confirmBtnBsStyle="success"
                        confirmBtnText="OK"
                    >
                        Password reset email has been sent to <b>{userData.email}</b>.
                        Please check your inbox.
                    </ReactBSAlert>
                );
                setResetLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setAlert(
                    <ReactBSAlert
                        danger
                        style={{ display: "block", marginTop: "-100px" }}
                        title="Failed"
                        onConfirm={() => setAlert(null)}
                        confirmBtnBsStyle="danger"
                        confirmBtnText="OK"
                    >
                        {err.message}
                    </ReactBSAlert>
                );
                setResetLoading(false);
            });
    };

    if (loading) {
        return (
            <div
                className="content d-flex justify-content-center align-items-center"
                style={{ minHeight: "80vh" }}
            >
                <Spinner color="primary" />
                <span className="ms-2">Loading profile...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div
                className="content d-flex justify-content-center align-items-center"
                style={{ minHeight: "80vh" }}
            >
                <p className="text-danger">{error}</p>
            </div>
        );
    }

    if (!userData) {
        return (
            <div
                className="content d-flex justify-content-center align-items-center"
                style={{ minHeight: "80vh" }}
            >
                <p>No user data found.</p>
            </div>
        );
    }

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const options = {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    return (
        <div className="content" style={{ padding: "2rem" }}>
            {alert} {/* ✅ Render SweetAlert here */}
            <Row>
                <Col md="12">
                    <Card className="shadow-lg border-0 rounded-3">
                        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white d-flex justify-content-between align-items-center shadow-sm rounded-top px-4 py-3">
                            <h4 className="mb-0 fw-bold d-flex align-items-center gap-2">
                                Hi, {userData.name}
                            </h4>
                            <div className="d-flex align-items-center gap-2">
                                <Button
                                    color="light"
                                    onClick={() => navigate(-1)}
                                    className="btn-outline-secondary border-0 shadow-sm"
                                    title="Go Back"
                                >
                                    Back
                                </Button>
                            </div>
                        </CardHeader>
                    </Card>
                </Col>
            </Row>
            <Row>
                {/* Profile Card */}
                <Col md="4">
                    <Card className="card-user shadow-lg">
                        <CardBody>
                            <div className="author text-center">
                                {userData.logo ? (
                                    <img
                                        src={userData.logo}
                                        alt="Bank Logo"
                                        style={{ width: "80%", height: "150px", objectFit: "contain" }}
                                    />
                                ) : (
                                    <i
                                        className="tim-icons icon-single-02"
                                        style={{
                                            fontSize: "4rem",
                                            background: "#172b4d",
                                            color: "#fff",
                                            padding: "20px",
                                            borderRadius: "50%",
                                        }}
                                    />
                                )}
                                <h5 className="title mt-3">{userData.name}</h5>
                                <p className="description">Role: {userData.role}</p>
                            </div>
                            <div className="text-center mt-3">
                                <Button
                                    className="btn btn-primary btn-sm"
                                    onClick={handleResetPassword}
                                    disabled={resetLoading}
                                >
                                    {resetLoading ? <Spinner size="sm" /> : "Reset Password"}
                                </Button>
                                <button className="btn btn-danger btn-sm ml-2"><a href={'/sessionLogout'} className='text-white font-weight-bold'>Logout</a></button>
                            </div>
                        </CardBody>
                    </Card>
                </Col>

                {/* Account Details */}
                <Col md="8">
                    <Card className="shadow-lg">
                        <CardBody>
                            <h4 className="mb-4">User Information</h4>
                            <Row>
                                <Col md="6">
                                    <p>
                                        <strong>Email:</strong> {userData.email}
                                    </p>
                                    <p>
                                        <strong>Phone:</strong> {userData.phone || "N/A"}
                                    </p>
                                    <p>
                                        <strong>Address:</strong> {userData.address || "N/A"}
                                    </p>
                                </Col>
                                <Col md="6">
                                    <p>
                                        <strong>PAN:</strong> {userData.pan || "N/A"}
                                    </p>
                                    <p>
                                        <strong>Registration Code:</strong>{" "}
                                        {userData.registrationCode || "N/A"}
                                    </p>
                                    <p>
                                        <strong>Role:</strong> {userData.role}
                                    </p>
                                </Col>
                            </Row>
                        </CardBody>
                    </Card>

                    {/* Metadata */}
                    <Card className="mt-3 shadow-lg">
                        <CardBody>
                            <h4 className="mb-4">Account Metadata</h4>
                            <Row>
                                <Col md="6">
                                    <p>
                                        <strong>Account Created:</strong>{" "}
                                        {formatDate(userData.createdAt)}
                                    </p>
                                </Col>
                            </Row>
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
