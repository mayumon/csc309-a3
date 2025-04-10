import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { toast } from "react-toastify";

const AuthContext = createContext(null);
/*
 * This provider should export a `user` context state that is
 * set (to non-null) when:
 *     1. a hard reload happens while a user is logged in.
 *     2. the user just logged in.
 * `user` should be set to null when:
 *     1. a hard reload happens when no users are logged in.
 *     2. the user just logged out.
 */
export const AuthProvider = ({ children }) => {
	const navigate = useNavigate();
	const [user, setUser] = useState({});

	useEffect(() => {
		const token = localStorage.getItem("token");
		if (token) {
			const decodedJwt = jwtDecode(token);
			let currentDate = new Date();
			if (decodedJwt.exp * 1000 < currentDate.getTime()) {
				// console.log("Logged In Session expired.");
				toast.error("Logged In Session expired.", {
					position: "top-right",
					autoClose: 1500,
					pauseOnHover: true,
					closeOnClick: true,
					hideProgressBar: true,
				});
				localStorage.removeItem("token");
				setUser(null);
				navigate("/");
			}
			setUser({
				utorid: decodedJwt.utorid,
				role: decodedJwt.role,
				currentRole: decodedJwt.role,
			});
		} else {
			setUser(null);
		}
	}, []);

	const login = async (utorid, password) => {
		try {
			const response = await fetch(
				import.meta.env.VITE_BACKEND_URL + "/auth/tokens",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						utorid: utorid,
						password: password,
					}),
				}
			)
				.then()
				.catch(console.error);

			if (!response.ok) {
				const errorData = await response.json();
				return { data: null, error: errorData.error };
			}

			const data = await response.json().then().catch(console.error);
			// console.log(data);
			localStorage.setItem("token", data.token);
			const decodedJwt = jwtDecode(data.token);
			setUser({
				utorid: decodedJwt.utorid,
				role: decodedJwt.role,
				currentRole: decodedJwt.role,
			});
			// setCurrentRole(decodedJwt.role);
			console.log(decodedJwt);
			navigate("/home");

			toast.success("Logged In Successfully", {
				position: "top-right",
				autoClose: 1500,
				pauseOnHover: true,
				closeOnClick: true,
				hideProgressBar: true,
			});
			return { data: user, error: null };
		} catch (error) {
			console.log(error.message);
			return { data: null, error: null };
		}
	};

	const logout = () => {
		localStorage.removeItem("token");
		setUser(null);
	};

	return (
		<AuthContext.Provider value={{ user, login, logout, setUser }}>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => {
	return useContext(AuthContext);
};
