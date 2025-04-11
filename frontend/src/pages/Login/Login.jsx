import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../../contexts/AuthContext";
import "./Login.css";
import { Link, useNavigate } from "react-router-dom";

function Login() {
	const [utorid, setUtorid] = useState("");
	const [password, setPassword] = useState("");

	const navigate = useNavigate();

	const { login, setUser } = useAuth();

	const handle_submit = async (e) => {
		e.preventDefault();
		const loginRes = await login(utorid, password);
		if (loginRes.error != null) {
			toast.error(loginRes.error, {
				position: "top-right",
				autoClose: 1500,
				pauseOnHover: true,
				closeOnClick: true,
				hideProgressBar: true,
			});
		}
	};

	return (
		<div className="flex-col login-page-container">
			<h2>Login</h2>
			<form className="flex-col" onSubmit={(e) => handle_submit(e)}>
				<div className="flex-col">
					{/* <label className="item1" htmlFor="username">
						Utorid
					</label> */}
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

					{/* <label className="item3" htmlFor="password">
						Password
					</label> */}
					<input
						type="password"
						className="login-input"
						id="password"
						name="password"
						placeholder="Password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
					/>
				</div>
				<div className="flex-row forgot-link-container margin-bottom">
					<Link to="/forgot-password" className="link">
						Forgot Password?
					</Link>
				</div>

				<div>
					<button className="btn" type="submit">
						Login
					</button>
				</div>
			</form>
		</div>
	);
}

export default Login;
