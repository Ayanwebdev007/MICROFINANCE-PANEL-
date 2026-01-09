import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Card,
    CardBody,
    Button,
    Form,
    FormGroup,
    Label,
    Input,
    Alert,
    Spinner,
    Col,
} from "reactstrap";
import axios from "axios";

export default function ResetPassword() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (formData.newPassword !== formData.confirmPassword) {
            setError("New password and confirm password do not match.");
            return;
        }

        try {
            setLoading(true);
            const response = await axios.post("/api/user/reset-password", {
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword,
            });

            if (response.data.success) {
                setSuccess("Password updated successfully!");
                setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" });
                setTimeout(() => navigate("/profile"), 1500);
            } else {
                setError(response.data.message || "Password reset failed.");
            }
        } catch (err) {
            setError("An error occurred while resetting password.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="content d-flex justify-content-center align-items-center"
            style={{ minHeight: "80vh" }}
        >
            <Card className="shadow-lg p-4" style={{ maxWidth: "600px", width: "100%" }}>
                <CardBody>
                    <h4 className="mb-4 text-center">Reset Password</h4>

                    {error && <Alert color="danger">{error}</Alert>}
                    {success && <Alert color="success">{success}</Alert>}

                    <Form onSubmit={handleSubmit}>
                        {/* Current Password */}
                        <FormGroup row>
                            <Label sm="4" className="fw-bold">
                                Current Password <span className="text-danger">*</span>
                            </Label>
                            <Col sm="8">
                                <Input
                                    type="password"
                                    placeholder="Enter Current Password"
                                    value={formData.currentPassword}
                                    onChange={(e) =>
                                        setFormData({ ...formData, currentPassword: e.target.value })
                                    }
                                    required
                                />
                                <small className="text-muted">
                                    (we need your current password to confirm your changes)
                                </small>
                            </Col>
                        </FormGroup>

                        {/* New Password */}
                        <FormGroup row>
                            <Label sm="4" className="fw-bold">
                                New Password <span className="text-danger">*</span>
                            </Label>
                            <Col sm="8">
                                <Input
                                    type="password"
                                    placeholder="Enter New Password"
                                    value={formData.newPassword}
                                    onChange={(e) =>
                                        setFormData({ ...formData, newPassword: e.target.value })
                                    }
                                    required
                                />
                            </Col>
                        </FormGroup>

                        {/* Confirm Password */}
                        <FormGroup row>
                            <Label sm="4" className="fw-bold">
                                Password Confirmation <span className="text-danger">*</span>
                            </Label>
                            <Col sm="8">
                                <Input
                                    type="password"
                                    placeholder="Confirm New Password"
                                    value={formData.confirmPassword}
                                    onChange={(e) =>
                                        setFormData({ ...formData, confirmPassword: e.target.value })
                                    }
                                    required
                                />
                            </Col>
                        </FormGroup>

                        {/* Buttons */}
                        <div className="text-center mt-4">
                            <Button
                                type="submit"
                                color="success"
                                className="px-4"
                                disabled={loading}
                            >
                                {loading ? <Spinner size="sm" /> : "CHANGE"}
                            </Button>
                            <Button
                                type="button"
                                color="danger"
                                className="px-4 ms-2"
                                onClick={() => navigate(-1)}
                            >
                                CANCEL
                            </Button>
                        </div>
                    </Form>
                </CardBody>
            </Card>
        </div>
    );
}
