import { useState, useEffect } from "react";
import "./UserEdit.css";
import { toast } from "react-toastify";
import { useParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

function UserEdit() {
	const [form, setForm] = useState({
		email: "",
		verified: "none",
		suspicious: "none",
		role: "",
	});

	const { user } = useAuth();

	const [userInfo, setUserInfo] = useState({});

	const { userId } = useParams();

	useEffect(() => {
		const fetchUserData = async () => {
			const response = await fetch(
				`${import.meta.env.VITE_BACKEND_URL}/users/` + userId,
				{
					method: "GET",
					headers: {
						Authorization: "Bearer " + localStorage.getItem("token"),
					},
				}
			);

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
			setUserInfo({ ...data });
			setForm({
				email: data.email,
				verified: data.verified ? "true" : "none",
				suspicious: "none",
				role: data.role,
			});
		};
		fetchUserData().then().catch(console.error);
	}, []);

	const handleChange = (e) => {
		setForm({ ...form, [e.target.name]: e.target.value });
	};

	const updateUser = async () => {
		const response = await fetch(
			`${import.meta.env.VITE_BACKEND_URL}/users/` + userId,
			{
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					Authorization: "Bearer " + localStorage.getItem("token"),
				},
				body: JSON.stringify({
					email: form.email === userInfo.email ? null : form.email,
					verified:
						form.verified === "none" ||
						(form.verified === "true") === userInfo.verified
							? null
							: form.verified === "true",
					suspicious:
						form.suspicious === "none" ? null : form.suspicious === "true",
					role: form.role === userInfo.role ? null : form.role,
				}),
			}
		)
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
		console.log(data);
		if (data.email) setUserInfo({ ...userInfo, email: data.email });
		if (data.verified)
			setUserInfo({ ...userInfo, verified: data.verified ? "true" : "false" });
		if (data.role) setUserInfo({ ...userInfo, role: data.role });

		toast.success("User Updated!", {
			position: "top-right",
			autoClose: 1500,
			pauseOnHover: true,
			closeOnClick: true,
			hideProgressBar: true,
		});
		return;
	};

	const handleUserUpdate = async (e) => {
		e.preventDefault();
		await updateUser();
	};

	return (
		<div className="user-edit-container">
			<div className="user-edit-card">
				<h2>User Details</h2>
				<div className="form-group">
					<label>Name: {userInfo.name}</label>
				</div>
				<div className="form-group">
					<label>Email: {userInfo.email}</label>
				</div>
				<div className="form-group">
					<label>Utorid: {userInfo.utorid}</label>
				</div>
				<div className="form-group">
					<label>Role: {userInfo.role}</label>
				</div>
				<div className="form-group">
					<label>Verified: {userInfo.verified ? "True" : "False"}</label>
				</div>
			</div>
			<div className="user-edit-card">
				<h2>Edit User</h2>
				<div className="form-group">
					<label>Email</label>
					<input name="email" value={form.email} onChange={handleChange} />
				</div>
				<div className="form-group">
					<label>Verified</label>
					<select
						type="text"
						className="user-table-select-bar"
						value={form.verified || "none"}
						onChange={(e) => {
							setForm({ ...form, verified: e.target.value });
						}}
					>
						<option value="none">-</option>
						<option value="true">True</option>
					</select>
				</div>
				<div className="form-group">
					<label>Role</label>
					<select
						type="text"
						className="user-table-select-bar"
						value={form.role}
						onChange={(e) => {
							setForm({ ...form, role: e.target.value });
						}}
					>
						<option value="none">-</option>
						<option value="regular">Regular</option>
						<option value="cashier">Cashier</option>
						{user.currentRole === "superuser" ? (
							<>
								<option value="manager">Manager</option>
								<option value="superuser">Superuser</option>
							</>
						) : (
							<></>
						)}
					</select>
				</div>
				<div className="form-group">
					<label>Suspicious</label>
					<select
						type="text"
						className="user-table-select-bar"
						value={form.suspicious}
						onChange={(e) => {
							setForm({ ...form, suspicious: e.target.value });
						}}
					>
						<option value="none">-</option>
						<option value="true">True</option>
						<option value="false">False</option>
					</select>
				</div>
				<button className={"save-button "} onClick={(e) => handleUserUpdate(e)}>
					Update User
				</button>
			</div>
		</div>
	);
}
export default UserEdit;
