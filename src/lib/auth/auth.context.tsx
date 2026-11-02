import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import type { UserRole } from "../permissions/permissions";
import { isSupabaseConfigured, supabase } from "../supabase/client";

export interface AuthUser {
	id: string;
	email: string;
	name: string;
	role?: UserRole;
}

export interface AuthContextType {
	isAuthenticated: boolean;
	isLoading: boolean;
	user: AuthUser | null;
	role: UserRole;
	setRole: (role: UserRole) => void;
	signIn: (email: string, pass: string) => Promise<{ error?: string }>;
	signUp: (
		name: string,
		email: string,
		pass: string,
	) => Promise<{ error?: string }>;
	signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_SESSION_KEY = "kreatiwit_auth_session";
const LOCAL_USERS_KEY = "kreatiwit_registered_users";

const PRESET_USERS: Array<AuthUser & { pass: string }> = [
	{
		id: "usr_abhishek",
		name: "Abhishek",
		email: "abhishek@kreatiwit.io",
		role: "owner",
		pass: "kreatiwit2025",
	},
	{
		id: "usr_shradha",
		name: "Shradha",
		email: "shradha@kreatiwit.io",
		role: "pm",
		pass: "kreatiwit2025",
	},
	{
		id: "usr_ansul",
		name: "Ansul",
		email: "ansul@kreatiwit.io",
		role: "designer",
		pass: "kreatiwit2025",
	},
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [isLoading, setIsLoading] = useState(true);
	const [role, setRole] = useState<UserRole>("owner");
	const [user, setUser] = useState<AuthUser | null>(null);

	useEffect(() => {
		async function checkAuth() {
			if (isSupabaseConfigured()) {
				try {
					const { data } = await supabase.auth.getSession();
					if (data?.session?.user) {
						const u: AuthUser = {
							id: data.session.user.id,
							email: data.session.user.email || "",
							name:
								data.session.user.user_metadata?.full_name || "Agency Member",
						};
						setUser(u);
						setIsLoading(false);
						return;
					}
				} catch (e) {
					console.error("Auth session check error:", e);
				}
			}

			// Check local storage session
			if (typeof window !== "undefined") {
				try {
					const saved = localStorage.getItem(LOCAL_SESSION_KEY);
					if (saved) {
						const parsed = JSON.parse(saved) as AuthUser;
						setUser(parsed);
						if (parsed.role) {
							setRole(parsed.role);
						}
					}
				} catch (err) {
					console.error("Failed to parse local session:", err);
				}
			}
			setIsLoading(false);
		}
		checkAuth();
	}, []);

	const signIn = async (email: string, pass: string) => {
		if (isSupabaseConfigured()) {
			const { data, error } = await supabase.auth.signInWithPassword({
				email,
				password: pass,
			});
			if (error) return { error: error.message };
			if (data.user) {
				const u: AuthUser = {
					id: data.user.id,
					email: data.user.email || "",
					name: data.user.user_metadata?.full_name || "Agency Member",
				};
				setUser(u);
			}
			return {};
		}

		// Local authentication flow
		const trimmedEmail = email.trim().toLowerCase();
		let allUsers = [...PRESET_USERS];

		if (typeof window !== "undefined") {
			try {
				const stored = localStorage.getItem(LOCAL_USERS_KEY);
				if (stored) {
					allUsers = [...allUsers, ...JSON.parse(stored)];
				}
			} catch {
				// ignore
			}
		}

		const match = allUsers.find(
			(u) =>
				u.email.toLowerCase() === trimmedEmail &&
				(!u.pass || u.pass === pass || pass === "demo"),
		);

		if (
			!match &&
			pass !== "demo" &&
			pass !== "kreatiwit2025" &&
			pass.length < 4
		) {
			return {
				error:
					"Invalid credentials. Minimum 4 characters required or try Quick Demo.",
			};
		}

		const loggedInUser: AuthUser = match
			? {
					id: match.id,
					name: match.name,
					email: match.email,
					role: match.role || "owner",
				}
			: {
					id: `usr_${Date.now()}`,
					name: email.split("@")[0].replace(/[._-]/g, " ") || "Agency Member",
					email: trimmedEmail,
					role: "owner",
				};

		setUser(loggedInUser);
		if (loggedInUser.role) {
			setRole(loggedInUser.role);
		}

		if (typeof window !== "undefined") {
			localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(loggedInUser));
		}

		return {};
	};

	const signUp = async (name: string, email: string, pass: string) => {
		if (isSupabaseConfigured()) {
			const { data, error } = await supabase.auth.signUp({
				email,
				password: pass,
				options: {
					data: { full_name: name },
				},
			});
			if (error) return { error: error.message };
			if (data.user) {
				const u: AuthUser = {
					id: data.user.id,
					email: data.user.email || "",
					name,
				};
				setUser(u);
			}
			return {};
		}

		// Local registration
		const trimmedEmail = email.trim().toLowerCase();
		const newUser = {
			id: `usr_${Date.now()}`,
			name: name.trim() || trimmedEmail.split("@")[0],
			email: trimmedEmail,
			role: "owner" as UserRole,
			pass,
		};

		if (typeof window !== "undefined") {
			try {
				const stored = localStorage.getItem(LOCAL_USERS_KEY);
				const existing = stored ? JSON.parse(stored) : [];
				localStorage.setItem(
					LOCAL_USERS_KEY,
					JSON.stringify([...existing, newUser]),
				);
				localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(newUser));
			} catch (err) {
				console.error("Local storage error:", err);
			}
		}

		setUser({
			id: newUser.id,
			name: newUser.name,
			email: newUser.email,
			role: newUser.role,
		});
		setRole(newUser.role);

		return {};
	};

	const signOut = async () => {
		if (isSupabaseConfigured()) {
			await supabase.auth.signOut();
		}
		if (typeof window !== "undefined") {
			localStorage.removeItem(LOCAL_SESSION_KEY);
		}
		setUser(null);
	};

	return (
		<AuthContext.Provider
			value={{
				isAuthenticated: !!user,
				isLoading,
				user,
				role,
				setRole,
				signIn,
				signUp,
				signOut,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
	return ctx;
}
