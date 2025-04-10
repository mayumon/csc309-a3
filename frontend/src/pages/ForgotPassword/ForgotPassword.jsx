import { useState } from "react";
import { toast } from "react-toastify";
import "./ForgotPassword.css";
import { Link, useLocation } from "react-router-dom";

function ForgotPassword() {
	const [utorid, setUtorid] = useState("");
	const [resetLink, setResetLink] = useState(null);

	const location = useLocation();
	const url = location.pathname;

	const resetPasswordRequest = async (utorid) => {
		try {
			const response = await fetch(
				import.meta.env.VITE_BACKEND_URL + "/auth/resets",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						utorid: utorid,
					}),
				}
			);

			if (!response.ok) {
				const errorData = await response.json();
				return { data: null, error: errorData.error };
			}

			const data = await response.json();
			setResetLink(url + "/" + data.resetToken);
			return { data: data, error: null };
		} catch (error) {
			console.log(error.message);
			return { data: null, error: null };
		}
	};

	const handle_submit = async (e) => {
		e.preventDefault();
		const resPassRes = await resetPasswordRequest(utorid);
		if (resPassRes.error != null) {
			toast.error(resPassRes.error, {
				position: "top-right",
				autoClose: 1500,
				pauseOnHover: true,
				closeOnClick: true,
				hideProgressBar: true,
			});
		} else if (resPassRes.data != null) {
			toast.success("Link Generated", {
				position: "top-right",
				autoClose: 1500,
				pauseOnHover: true,
				closeOnClick: true,
				hideProgressBar: true,
			});
		}
	};

	return (
		<div className="flex-col page-container">
			<h2>Forgot Password</h2>
			<form className="flex-col" onSubmit={(e) => handle_submit(e)}>
				<div className="flex-col">
					{/* <label className="item1" htmlFor="username">
						Utorid
					</label> */}
					<input
						type="text"
						className="forgot-password-input margin-bottom"
						id="utorid"
						name="utorid"
						placeholder="Utorid"
						value={utorid}
						onChange={(e) => setUtorid(e.target.value)}
						required
					/>
				</div>
				<div>
					<button className="btn" type="submit">
						Generate Reset Password Link
					</button>
				</div>
				{/* <p className="error">{error}</p> */}
			</form>
			{resetLink ? <Link to={resetLink}> Reset Password </Link> : <></>}
		</div>
	);
}

export default ForgotPassword;
