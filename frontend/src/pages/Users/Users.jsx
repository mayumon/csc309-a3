import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import "./Users.css";
const USERS_PER_PAGE = 10;

export default function Users() {
	const [users, setUsers] = useState([]);
	const [searchParams, setSearchParams] = useSearchParams();
	const [count, setCount] = useState(0);

	const [nameSearch, setNameSearch] = useState(searchParams.get("name") || "");
	const [roleSearch, setRoleSearch] = useState(searchParams.get("role") || "");
	const [verifiedCheck, setVerifiedCheck] = useState(
		searchParams.get("verified") || "none"
	);
	const [activatedCheck, setActivatedCheck] = useState(
		searchParams.get("activated") || "none"
	);

	const navigate = useNavigate();

	// Params
	const page = parseInt(searchParams.get("page") || "1");
	const name = searchParams.get("name") || "";
	const role = searchParams.get("role") || "";
	const verified = searchParams.get("verified") || "";
	const activated = searchParams.get("activated") || "";

	useEffect(() => {
		const fetchUserData = async () => {
			const response = await fetch(
				`${import.meta.env.VITE_BACKEND_URL}/users?${
					name ? "name=" + name : ""
				}&${role ? "role=" + role : ""}&${
					verified ? "verified=" + verified : ""
				}&${
					activated ? "activated=" + activated : ""
				}&page=${page}&limit=${USERS_PER_PAGE}`,
				{
					method: "GET",
					headers: {
						Authorization: "Bearer " + localStorage.getItem("token"),
					},
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

			const data = await response.json().then().catch();
			setUsers(data.results);
			setCount(data.count);
		};
		fetchUserData().then().catch(console.error);
	}, [page, name, role, verified, activated]);

	const updateParam = (key, value) => {
		console.log("updating params", searchParams);
		searchParams.set(key, value);
		setSearchParams(searchParams);
	};

	// const handleSort = (column) => {
	// 	const newOrder = sort === column && order === "asc" ? "desc" : "asc";
	// 	updateParam("sort", column);
	// 	updateParam("order", newOrder);
	// };

	const handleNameSearchChange = (e) => {
		setNameSearch(e.target.value);
		updateParam("name", e.target.value);
		updateParam("page", 1); // Reset to first page when filtering
	};

	const handleRoleSearchChange = (e) => {
		console.log(e.target.value);
		setRoleSearch(e.target.value);
		updateParam("page", 1);
		if (e.target.value === "none") {
			searchParams.delete("role");
			setSearchParams(searchParams);
		} else {
			updateParam("role", e.target.value);
		}
	};

	const handleVerifiedChange = (e) => {
		setVerifiedCheck(e.target.value);
		updateParam("page", 1);
		if (e.target.value === "none") {
			searchParams.delete("verified");
			setSearchParams(searchParams);
		} else {
			updateParam("verified", e.target.value);
		}
	};

	const handleActivatedChange = (e) => {
		setActivatedCheck(e.target.value);
		updateParam("page", 1);
		if (e.target.value === "none") {
			searchParams.delete("activated");
			setSearchParams(searchParams);
		} else {
			updateParam("activated", e.target.value);
		}
	};

	const goToPage = (p) => {
		updateParam("page", p);
	};

	const handleRowClick = (user) => {
		console.log(user);
		navigate("/users/edit/" + user.id);
	};

	return (
		<div className="users-page-container">
			<h2>User List</h2>
			<div className="user-table-container">
				<div className="user-table-filters-container">
					<input
						type="text"
						className="user-table-search-bar"
						placeholder="Filter by name or email"
						value={nameSearch}
						onChange={handleNameSearchChange}
					/>

					<select
						type="text"
						className="user-table-select-bar"
						placeholder="Filter by name or email"
						value={roleSearch}
						onChange={handleRoleSearchChange}
					>
						<option value="none">Filter Role</option>
						<option value="regular">regular</option>
						<option value="cashier">cashier</option>
						<option value="manager">manager</option>
						<option value="superuser">superuser</option>
					</select>
					<select
						type="text"
						className="user-table-select-bar"
						value={verifiedCheck}
						onChange={handleVerifiedChange}
					>
						<option value="none">Filter Verified</option>
						<option value="true">True</option>
						<option value="false">False</option>
					</select>
					<select
						type="text"
						className="user-table-select-bar"
						value={activatedCheck}
						onChange={handleActivatedChange}
					>
						<option value="none">Filter Activated</option>
						<option value="true">True</option>
						<option value="false">False</option>
					</select>
					<span className="user-table-note">(Click a User To Edit)</span>
				</div>

				<table className="user-table">
					<thead>
						<tr>
							{/* <th onClick={() => handleSort("id")}>Utorid</th> */}
							<th className="short-value">id</th>
							<th className="medium-value">Utorid</th>
							<th className="medium-value">Name</th>
							<th className="long-value">Email</th>
							<th className="medium-value">Role</th>
							<th className="short-value">Verified</th>
							<th className="long-value">CreatedAt</th>
							<th className="long-value">lastLogin</th>
							<th className="short-value">Points</th>
						</tr>
					</thead>
					<tbody>
						{users.length > 0 ? (
							users.map((user, index) => (
								<tr key={index} onClick={() => handleRowClick(user)}>
									<td className="short-value">{user.id}</td>
									<td className="medium-value">{user.utorid}</td>
									<td className="medium-value">{user.name}</td>
									<td className="long-value">{user.email}</td>
									<td className="medium-value">{user.role}</td>
									<td className="short-value">
										{user.verified ? "True" : "False"}
									</td>
									<td className="long-value">{user.createdAt}</td>
									<td className="long-value">{user.lastLogin || "-"}</td>
									<td className="short-value">{user.points}</td>
								</tr>
							))
						) : (
							<tr>
								<td colSpan="4">No users found.</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
			<div className="pagination">
				<span>
					Showing {(page - 1) * USERS_PER_PAGE + 1}-
					{page * USERS_PER_PAGE < count ? page * USERS_PER_PAGE : count} out of{" "}
					{count}
				</span>
				<button disabled={page <= 1} onClick={() => goToPage(page - 1)}>
					Previous
				</button>
				<span>Page {page}</span>
				<button
					disabled={(page + 1) * USERS_PER_PAGE > count}
					onClick={() => goToPage(page + 1)}
				>
					Next
				</button>
			</div>
		</div>
	);
}
