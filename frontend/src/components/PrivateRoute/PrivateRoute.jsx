import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const PrivateRoute = () => {
	const { user } = useAuth();

	return localStorage.getItem(`token`) && user ? (
		<Outlet />
	) : (
		<Navigate to="/" replace />
	);
};

export default PrivateRoute;
