import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import "./Register.css";
import { Link, useNavigate } from "react-router-dom";

function Register() {
	const [utorid, setUtorid] = useState("");
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [resetLink, setResetLink] = useState("");

	const navigate = useNavigate();

	const register = async () => {
		const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: "Bearer " + localStorage.getItem("token"),
			},
			body: JSON.stringify({
				utorid: utorid,
				name: name,
				email: email,
			}),
		})
			.then()
			.catch(console.error);

		if (!response.ok) {
			const errorData = await response.json().then().catch(console.error);
			toast.error(errorData.error, {
				position: "top-right",
				autoClose: 1500,
				pauseOnHover: true,
				closeOnClick: true,
				hideProgressBar: true,
			});
			return;
		}

		const data = await response.json().then().catch(console.error);
		let resetToken = data.resetToken;

		toast.success("User Created!", {
			position: "top-right",
			autoClose: 1500,
			pauseOnHover: true,
			closeOnClick: true,
			hideProgressBar: true,
		});
		setUtorid("");
		setEmail("");
		setName("");
		setResetLink("/forgot-password/" + resetToken);
		return;
	};

	const handle_submit = async (e) => {
		e.preventDefault();
		await register();
	};

	return (
		<div className="flex-col login-page-container">
			<h2>Register a User</h2>
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
						type="text"
						className="login-input margin-bottom"
						id="name"
						name="name"
						placeholder="Name"
						value={name}
						onChange={(e) => setName(e.target.value)}
						required
					/>
					<input
						type="text"
						className="login-input margin-bottom"
						id="email"
						name="email"
						placeholder="Email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
					/>
				</div>

				<div>
					<button className="btn" type="submit">
						Register New User
					</button>
				</div>
			</form>
			{resetLink ? (
				<div>
					<p>Reset Password Link:</p>
					<Link to={resetLink}>
						{" "}
						{import.meta.env.VITE_BACKEND_URL + resetLink}{" "}
					</Link>
				</div>
			) : (
				<></>
			)}
		</div>
	);
}

export default Register;
