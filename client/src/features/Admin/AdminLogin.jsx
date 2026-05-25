import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { ShieldIcon } from "../../components/common/Icons";

/**
 * Admin Login Component
 * Secure admin portal with JWT authentication
 */
const AdminLogin = () => {
	const navigate = useNavigate();
	const { login, loading, error: authError } = useAuth();
	const [formData, setFormData] = useState({ email: "", password: "" });
	const [errors, setErrors] = useState({});
	const [submitError, setSubmitError] = useState("");

	const validateForm = () => {
		const newErrors = {};

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

		const result = await login(formData.email, formData.password);
		if (result) {
			navigate("/admin/dashboard");
		} else {
			setSubmitError(authError || "Login failed. Please try again.");
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black flex items-center justify-center px-4">
			{/* Background Animation */}
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				<div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
				<div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
			</div>

			{/* Login Container */}
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
								Admin Portal - Secure Access
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
							placeholder="Enter your password"
							value={formData.password}
							onChange={handleInputChange}
							error={errors.password}
							required
						/>

						{/* Remember & Forgot */}
						<div className="flex items-center justify-between text-sm">
							<label className="flex items-center gap-2 cursor-pointer">
								<input
									type="checkbox"
									className="w-4 h-4 rounded bg-zinc-800 border-zinc-700 cursor-pointer"
								/>
								<span className="text-zinc-400 hover:text-zinc-300">
									Remember me
								</span>
							</label>
							<a
								href="#forgot"
								className="text-purple-400 hover:text-purple-300"
							>
								Forgot password?
							</a>
						</div>

						{/* Submit Button */}
						<Button
							type="submit"
							disabled={loading}
							className="w-full"
							size="lg"
						>
							{loading ? "Signing in..." : "Sign In"}
						</Button>

						{/* Register Link */}
						{/* <div className="text-center pt-4 border-t border-zinc-800">
							<p className="text-zinc-400 text-sm">
								First time?
								<button
									type="button"
									onClick={() => navigate("/admin/register")}
									className="ml-1 text-purple-400 hover:text-purple-300 font-semibold"
								>
									Create admin account
								</button>
							</p>
						</div> */}
					</form>
				</div>

				{/* Security Notice */}
				<div className="mt-6 bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-4 text-center">
					<p className="text-yellow-200 text-xs">
						🔒 This is a secure admin portal. Only authorized
						personnel should access. Do not share your credentials
						with anyone.
					</p>
				</div>
			</div>
		</div>
	);
};

export default AdminLogin;
