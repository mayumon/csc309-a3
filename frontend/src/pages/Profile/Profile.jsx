import { useState, useEffect } from "react";
import "./Profile.css";
import { toast } from "react-toastify";
import { QRCodeSVG } from "qrcode.react";

function Profile() {
	const [form, setForm] = useState({
		name: "",
		email: "",
		birthday: "",
		avatar: "",
	});

	const [passwordForm, setPasswordForm] = useState({
		oldPassword: "",
		password: "",
		confirmPassword: "",
	});

	const [userInfo, setUserInfo] = useState({});

	useEffect(() => {
		const fetchUserData = async () => {
			const response = await fetch(
				`${import.meta.env.VITE_BACKEND_URL}/users/me`,
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
				name: data.name || "",
				email: data.email || "",
				birthday: data.birthday || "",
				avatar: data.avatarUrl || "",
			});
		};
		fetchUserData().then().catch(console.error);
	}, []);

	const [isInvalidUpdateProfile, setIsValidUpdateProfile] = useState(true);
	const [error, setError] = useState("");
	useEffect(() => {
		const validatePassword = (value) => {
			const regex =
				/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,20}$/;

			if (!regex.test(value) && value !== "") {
				setError(
					"Password must be 8–20 characters, include an uppercase letter, a number, and a special character."
				);
			} else {
				setError("");
				if (
					passwordForm.password.length !== 0 &&
					passwordForm.password !== passwordForm.confirmPassword
				) {
					setError("Confirm Password must be same as Password.");
				}
			}
		};
		validatePassword(passwordForm.password);
		setIsValidUpdateProfile(
			form.name === userInfo.name &&
				form.email === userInfo.email &&
				form.birthday === userInfo.birthday &&
				form.avatar === userInfo.avatarUrl
		);
	}, [form, passwordForm]);

	const handleChange = (e) => {
		setForm({ ...form, [e.target.name]: e.target.value });
	};

	const handlePasswordChange = (e) => {
		setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
	};

	const updateProfile = async () => {
		const response = await fetch(
			`${import.meta.env.VITE_BACKEND_URL}/users/me`,
			{
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					Authorization: "Bearer " + localStorage.getItem("token"),
				},
				body: JSON.stringify({
					name: form.name === userInfo.name ? null : form.name,
					email: form.email === userInfo.email ? null : form.email,
					birthday: form.birthday === userInfo.birthday ? null : form.birthday,
					avatar: form.avatar === userInfo.avatar ? null : form.avatar,
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

		toast.success("Profile Updated!", {
			position: "top-right",
			autoClose: 1500,
			pauseOnHover: true,
			closeOnClick: true,
			hideProgressBar: true,
		});
		return;
	};

	const updatePassword = async () => {
		const response = await fetch(
			`${import.meta.env.VITE_BACKEND_URL}/users/me/password`,
			{
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					Authorization: "Bearer " + localStorage.getItem("token"),
				},
				body: JSON.stringify({
					old: passwordForm.oldPassword,
					new: passwordForm.password,
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

		toast.success("Password Updated!", {
			position: "top-right",
			autoClose: 1500,
			pauseOnHover: true,
			closeOnClick: true,
			hideProgressBar: true,
		});
		setPasswordForm({
			oldPassword: "",
			password: "",
			confirmPassword: "",
		});
		return;
	};

	const handlePasswordUpdate = async (e) => {
		e.preventDefault();
		await updatePassword();
	};

	const handleProfileUpdate = async (e) => {
		e.preventDefault();
		await updateProfile();
	};

	return (
		<div className="profile-container">
			<div className="profile-card">
				<h2>User QR Code</h2>
				<QRCodeSVG
					value={userInfo.id + ""}
					title={"User Id"}
					size={200}
					bgColor={"#ffffff"}
					fgColor={"#000000"}
					level={"L"}
				/>
			</div>
			<div className="profile-card">
				<h2>Edit Profile</h2>
				<div className="form-group">
					<label>Name</label>
					<input name="name" value={form.name} onChange={handleChange} />
				</div>
				<div className="form-group">
					<label>Email</label>
					<input
						name="email"
						type="email"
						value={form.email}
						onChange={handleChange}
					/>
				</div>
				<div className="form-group">
					<label>Birthday</label>
					<input
						name="birthday"
						type="date"
						value={form.birthday}
						onChange={handleChange}
					/>
				</div>
				<div className="form-group">
					<label>Avatar (URL)</label>
					<input name="avatar" value={form.avatar} onChange={handleChange} />
				</div>
				<button
					className={
						isInvalidUpdateProfile ? "invalid-save-button" : "save-button "
					}
					disabled={isInvalidUpdateProfile}
					onClick={(e) => handleProfileUpdate(e)}
				>
					Save Profile
				</button>
			</div>

			<div className="profile-card">
				<h2>Update Password</h2>
				<div className="form-group">
					<label>Old Password</label>
					<input
						type="password"
						name="oldPassword"
						value={passwordForm.oldPassword}
						onChange={handlePasswordChange}
					/>
				</div>
				<div className="form-group">
					<label>New Password</label>
					<input
						type="password"
						name="password"
						value={passwordForm.password}
						onChange={handlePasswordChange}
					/>
				</div>
				<div className="form-group">
					<label>Confirm Password</label>
					<input
						type="password"
						name="confirmPassword"
						value={passwordForm.confirmPassword}
						onChange={handlePasswordChange}
					/>
				</div>
				<button
					className={
						error || passwordForm.password.length === 0
							? "invalid-save-button"
							: "save-button"
					}
					disabled={error || passwordForm.password.length === 0}
					onClick={(e) => handlePasswordUpdate(e)}
				>
					Update Password
				</button>
				{error && <p className="profile-update-error">{error}</p>}
			</div>
		</div>
	);
}
export default Profile;
