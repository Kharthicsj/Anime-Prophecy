import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { ShieldIcon } from "../../components/common/Icons";

/**
 * Admin Registration Component
 * Create new admin accounts
 */
const AdminRegister = () => {
	const navigate = useNavigate();
	const { register, loading, error: authError } = useAuth();
	const [formData, setFormData] = useState({
		username: "",
		email: "",
		password: "",
		confirmPassword: "",
	});
	const [errors, setErrors] = useState({});
	const [submitError, setSubmitError] = useState("");

	const validateForm = () => {
		const newErrors = {};

		if (!formData.username) {
			newErrors.username = "Username is required";
		} else if (formData.username.length < 3) {
			newErrors.username = "Username must be at least 3 characters";
		}

		if (!formData.email) {
			newErrors.email = "Email is required";
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
			newErrors.email = "Invalid email format";
		}

		if (!formData.password) {
			newErrors.password = "Password is required";
		} else if (formData.password.length < 6) {
			newErrors.password = "Password must be at least 6 characters";
		}

		if (!formData.confirmPassword) {
			newErrors.confirmPassword = "Confirm password is required";
		} else if (formData.password !== formData.confirmPassword) {
			newErrors.confirmPassword = "Passwords do not match";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
		setErrors((prev) => ({ ...prev, [name]: "" }));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setSubmitError("");

		if (!validateForm()) return;

		const result = await register(
			formData.username,
			formData.email,
			formData.password,
			formData.confirmPassword,
		);

		if (result) {
			navigate("/admin/dashboard");
		} else {
			setSubmitError(
				authError || "Registration failed. Please try again.",
			);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black flex items-center justify-center px-4 py-8">
			{/* Background Animation */}
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				<div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
				<div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
			</div>

			{/* Registration Container */}
			<div className="relative z-10 w-full max-w-md">
				{/* Card */}
				<div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl shadow-purple-500/10 overflow-hidden">
					{/* Header */}
					<div className="bg-gradient-to-r from-purple-900/30 to-black p-8 border-b border-zinc-800">
						<div className="space-y-2 text-center">
							<div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-950 text-purple-300">
								<ShieldIcon className="h-7 w-7" />
							</div>
							<h1 className="text-2xl font-bold text-white">
								Prophecy Hub
							</h1>
							<p className="text-zinc-400 text-sm">
								Admin Registration - Create Account
							</p>
						</div>
					</div>

					{/* Form */}
					<form onSubmit={handleSubmit} className="p-8 space-y-6">
						{/* Global Error */}
						{submitError && (
							<div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-red-200 text-sm">
								{submitError}
							</div>
						)}

						{/* Username Input */}
						<Input
							label="Username"
							type="text"
							name="username"
							placeholder="admin_user"
							value={formData.username}
							onChange={handleInputChange}
							error={errors.username}
							required
						/>

						{/* Email Input */}
						<Input
							label="Email Address"
							type="email"
							name="email"
							placeholder="admin@example.com"
							value={formData.email}
							onChange={handleInputChange}
							error={errors.email}
							required
						/>

						{/* Password Input */}
						<Input
							label="Password"
							type="password"
							name="password"
							placeholder="Create a strong password"
							value={formData.password}
							onChange={handleInputChange}
							error={errors.password}
							required
						/>

						{/* Confirm Password Input */}
						<Input
							label="Confirm Password"
							type="password"
							name="confirmPassword"
							placeholder="Repeat your password"
							value={formData.confirmPassword}
							onChange={handleInputChange}
							error={errors.confirmPassword}
							required
						/>

						{/* Submit Button */}
						<Button
							type="submit"
							disabled={loading}
							className="w-full"
							size="lg"
						>
							{loading
								? "Creating account..."
								: "Create Admin Account"}
						</Button>

						{/* Login Link */}
						<div className="text-center pt-4 border-t border-zinc-800">
							<p className="text-zinc-400 text-sm">
								Already have an account?
								<button
									type="button"
									onClick={() => navigate("/admin/login")}
									className="ml-1 text-purple-400 hover:text-purple-300 font-semibold"
								>
									Sign in
								</button>
							</p>
						</div>
					</form>
				</div>

				{/* Terms Notice */}
				<div className="mt-6 bg-blue-900/20 border border-blue-700/30 rounded-lg p-4 text-center">
					<p className="text-blue-200 text-xs">
						By registering, you agree to our Terms & Conditions.
						Admin accounts have access to sensitive platform data.
					</p>
				</div>
			</div>
		</div>
	);
};

export default AdminRegister;
