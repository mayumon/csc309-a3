import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import "./Layout.css";
import { Link, Outlet } from "react-router-dom";

const Options = ({ userRole }) => {
	let rolesAndOption = [
		{ role: "regular", text: "Regular View" },
		{ role: "cashier", text: "Cashier View" },
		{ role: "manager", text: "Manager View" },
		{ role: "superuser", text: "Superuser View" },
	];

	let slicedRolesAndOption = rolesAndOption.slice(
		0,
		rolesAndOption.findIndex((roleObj) => roleObj.role === userRole) + 1
	);

	return (
		<>
			{slicedRolesAndOption.map((item, index) => (
				<option key={index} value={item.role}>
					{item.text}
				</option>
			))}
		</>
	);
};

const Layout = () => {
	const { user, logout, setUser } = useAuth();
	const [selectedRole, setSelectedRole] = useState("regular");

	const get_academic_term = () => {
		const month = new Date().getMonth() + 1; // getMonth() is 0-indexed, so add 1
		const year = new Date().getFullYear();

		let season;

		if (month >= 1 && month <= 4) {
			season = "Winter";
		} else if (month >= 5 && month <= 8) {
			season = "Summer";
		} else {
			season = "Fall";
		}

		return `${season} ${year}`;
	};

	useEffect(() => {
		// console.log("user has been updated", user);
		if (user && user.currentRole) {
			setSelectedRole(user.currentRole);
		}
	}, [user]);

	return (
		<>
			<header>
				<div className="home-link-container">
					<Link to="/home" className="link">
						{user ? "Home" : "CSC309: Project"}
					</Link>
				</div>
				<div className="header-right-side flex-grow-1">
					{user && user.role !== "regular" ? (
						<select
							value={selectedRole}
							onChange={(e) => {
								setUser({ ...user, currentRole: e.target.value });
								setSelectedRole(e.target.value);
								// console.log(user);
								// setCurrentRole(e.target.value);
							}}
							className="role-select"
						>
							<Options userRole={user.role} />
						</select>
					) : (
						<></>
					)}

					{user ? (
						<Link to="/" className="link margin-left" onClick={() => logout()}>
							Logout
						</Link>
					) : (
						<></>
					)}
				</div>
			</header>
			<main>
				<Outlet />
			</main>
			<footer>
				&copy; CSC309, {get_academic_term()}, University of Toronto.
			</footer>
		</>
	);
};

export default Layout;
