import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import "./Home.css";
import PreviewTransaction from "../../components/PreviewTransactions/PreviewTransaction";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

function Home() {
	const { user } = useAuth();
	const [userInfo, setUserInfo] = useState({});
	const [transactionPrev, setTransactionPrev] = useState([]);
	const navigate = useNavigate();

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
			const data = await response.json();
			setUserInfo({ ...data });
		};
		const fetchTransactionData = async () => {
			const response = await fetch(
				`${import.meta.env.VITE_BACKEND_URL}/users/me/transactions?limit=5`,
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
			setTransactionPrev(data.results);
		};
		fetchUserData().then().catch(console.error);
		fetchTransactionData().then().catch(console.error);
	}, []);

	return (
		<div className="home-page-container">
			<h1 className="welcome-header">Welcome {userInfo.name}!</h1>
			<div className="dashboard-card">
				<div className="dashboard-tab">My Dashboard</div>
				<div className="points-card">
					<div className="points-value">{userInfo.points}</div>
					<div className="points-label">Points</div>
				</div>

				<PreviewTransaction transactions={transactionPrev} />

				<div
					className="card-button margin-left"
					onClick={() => {
						navigate("/transactions");
					}}
				>
					<p>See More Transaction →</p>
				</div>
			</div>
			<div className="dashboard-card">
				<div className="dashboard-tab">Transaction</div>
				<div
					className="card-button"
					onClick={() => {
						navigate("/transactions/redemption");
					}}
				>
					<p>Redeem Points →</p>
				</div>
				<div
					className="card-button margin-left"
					onClick={() => {
						navigate("/transactions/transfer");
					}}
				>
					<p>Transfer Points →</p>
				</div>
				{user.currentRole !== "regular" ? (
					<div
						className="card-button margin-left"
						onClick={() => {
							navigate("/transactions/purchase");
						}}
					>
						<p>Create A Purchase Transaction →</p>
					</div>
				) : (
					<></>
				)}
				{user.currentRole === "manager" || user.currentRole === "superuser" ? (
					<>
						<div
							className="card-button margin-left"
							onClick={() => {
								navigate("/transactions/adjustment");
							}}
						>
							<p>Adjust Points →</p>
						</div>
					</>
				) : (
					<></>
				)}
			</div>

			<div className="dashboard-card">
				<div className="dashboard-tab">
					Events, Promotions
					{user.currentRole === "manager" || user.currentRole === "superuser"
						? ", Users"
						: ""}
				</div>
				<div
					className="card-button"
					onClick={() => {
						navigate("/events");
					}}
				>
					<p>Events</p>
				</div>
				<div
					className="card-button margin-left"
					onClick={() => {
						navigate("/allpromotions");
					}}
				>
					<p>View Promotions →</p>
				</div>
				{user.currentRole === "manager" || user.currentRole === "superuser" ? (
					<>
						<div
							className="card-button margin-left"
							onClick={() => {
								navigate("/promotions");
							}}
						>
							<p>Promotion Management →</p>
						</div>
						<div
							className="card-button margin-left"
							onClick={() => {
								navigate("/users");
							}}
						>
							<p>User Management →</p>
						</div>
					</>
				) : (
					<></>
				)}
			</div>

			<div className="dashboard-card">
				<div className="dashboard-tab">Quick Access</div>
				<div
					className="card-button"
					onClick={() => {
						navigate("/profile");
					}}
				>
					<p>Profile</p>
				</div>
				{user.currentRole !== "regular" ? (
					<>
						<div
							className="card-button margin-left"
							onClick={() => {
								navigate("/register");
							}}
						>
							<p>Register a New User →</p>
						</div>
					</>
				) : (
					<></>
				)}
			</div>

			{/* {console.log(userInfo)}
			{console.log(transactionPrev)} */}
		</div>
	);
}

export default Home;
