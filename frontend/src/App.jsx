import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout/Layout";
import Login from "./pages/Login/Login";
import { AuthProvider } from "./contexts/AuthContext";
import Home from "./pages/Home/Home";
import PrivateRoute from "./components/PrivateRoute/PrivateRoute";
import NotFound from "./pages/NotFound/NotFound";
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword";
import ResetPassword from "./pages/ResetPassword/ResetPassword";
import Profile from "./pages/Profile/Profile";
import Register from "./pages/Register/Register";
import Users from "./pages/Users/Users";
import UserEdit from "./pages/UserEdit/UserEdit";
import PurchaseTransaction from "./pages/Transactions/PurchaseTransaction";
import RedemptionRequest from "./pages/Transactions/RedemptionRequest";
import AdjustmentTransaction from "./pages/Transactions/AdjustmentTransaction";
import TransferTransaction from "./pages/Transactions/TransferTransaction";
import TransactionList from "./pages/Transactions/TransactionList";
import PromotionManagement from "./pages/Transactions/PromotionManagement";
import AllPromotions from "./pages/AllPromotions/AllPromotions";
import SinglePromotion from "./pages/SinglePromotion/SinglePromotion";
import Event from "./pages/Event/Event";
import Events from "./pages/Events/Events";
import EventCreate from "./pages/EventCreate/EventCreate";
import EventUpdate from "./pages/EventUpdate/EventUpdate";

// import toast
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const MyRoutes = () => {
	return (
		<Routes>
			<Route path="/" element={<Layout />}>
				{/* Below are public routes*/}
				<Route path="/" element={<Login />} />
				<Route path="/forgot-password" element={<ForgotPassword />} />
				<Route
					path="/forgot-password/:resetToken"
					element={<ResetPassword />}
				/>
				<Route element={<PrivateRoute />}>
					{/* Below are private routes */}
					<Route path="/home" element={<Home />} />
					<Route path="/profile" element={<Profile />} />
					<Route path="/register" element={<Register />} />
					<Route path="/users" element={<Users />} />
					<Route path="/users/edit/:userId" element={<UserEdit />} />

					{/* Transactions routes */}
					<Route
						path="/transactions/purchase"
						element={<PurchaseTransaction />}
					/>
					<Route
						path="/transactions/redemption"
						element={<RedemptionRequest />}
					/>
					<Route
						path="/transactions/adjustment"
						element={<AdjustmentTransaction />}
					/>
					<Route
						path="/transactions/transfer"
						element={<TransferTransaction />}
					/>
					<Route path="/transactions" element={<TransactionList />} />
					{/* Promotion management route */}
					<Route path="/promotions" element={<PromotionManagement />} />
					<Route path="promotions/:promotionId" element={<SinglePromotion />} />
					<Route path="allpromotions" element={<AllPromotions />} />
					{/* Event Routes */}
					<Route path="events" element={<Events />} />
					<Route path="events/:eventId" element={<Event />} />
					<Route path="events/create" element={<EventCreate />} />
					<Route path="events/:eventId/update" element={<EventUpdate />} />
				</Route>
				<Route path="*" element={<NotFound />} />
			</Route>
		</Routes>
	);
};

function App() {
	return (
		<BrowserRouter>
			<ToastContainer />
			<AuthProvider>
				<MyRoutes />
			</AuthProvider>
		</BrowserRouter>
	);
}

export default App;
