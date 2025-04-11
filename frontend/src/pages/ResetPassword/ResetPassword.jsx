import { useState } from "react";
import { toast } from "react-toastify";
import "./ResetPassword.css";
import { Link, useNavigate, useParams } from "react-router-dom";

function ResetPassword() {
	const [utorid, setUtorid] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");

	const navigate = useNavigate();
	const { resetToken } = useParams();

	const validatePassword = (value) => {
		const regex =
			/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,20}$/;

		if (!regex.test(value)) {
			setError(
				"Password must be 8–20 characters, include an uppercase letter, a number, and a special character."
			);
		} else {
			setError("");
		}
	};

	const resetPassword = async (utorid, password) => {
		try {
			const response = await fetch(
				`${import.meta.env.VITE_BACKEND_URL}/auth/resets/${resetToken}`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						utorid: utorid,
						password: password,
					}),
				}
			);

			if (!response.ok) {
				const errorData = await response.json();
				toast.error(errorData.error, {
					position: "top-right",
					autoClose: 1500,
					pauseOnHover: true,
					closeOnClick: true,
					hideProgressBar: true,
				});
			}

			toast.success("Password Reset", {
				position: "top-right",
				autoClose: 1500,
				pauseOnHover: true,
				closeOnClick: true,
				hideProgressBar: true,
			});
			navigate("/");
		} catch (error) {
			console.log(error.message);
		}
	};

	const handle_submit = async (e) => {
		e.preventDefault();
		await resetPassword(utorid, password);
	};

	return (
		<div className="flex-col page-container">
			<h2>Reset Password</h2>
			<form className="flex-col" onSubmit={(e) => handle_submit(e)}>
				<div className="flex-col">
					<input
						type="text"
						className="login-input margin-bottom"
						id="utorid"
						name="utorid"
						placeholder="Utorid"
						value={utorid}
						onChange={(e) => setUtorid(e.target.value)}
						required
					/>
					<input
						type="password"
						className="login-input margin-bottom"
						id="password"
						name="password"
						placeholder="Password"
						value={password}
						onChange={(e) => {
							setPassword(e.target.value);
							validatePassword(e.target.value);
						}}
						required
					/>
				</div>

				<div>
					<button
						className={
							"btn " +
							(password.length === 0 || error.length !== 0 ? "invalid" : "")
						}
						type="submit"
						disabled={password.length === 0 || error.length !== 0}
					>
						Reset Password
					</button>
				</div>
				{/* <p className="error">{error}</p> */}
			</form>
			{error && <p className="error">{error}</p>}
		</div>
	);
}

export default ResetPassword;
