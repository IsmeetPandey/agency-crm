import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import type { UserRole } from "../permissions/permissions";
import {
	DEFAULT_ORG_ID,
	isSupabaseConfigured,
	supabase,
} from "../supabase/client";

export interface AuthUser {
	id: string;
	email: string;
	name: string;
	role?: UserRole;
}

export interface AuthContextType {
	isAuthenticated: boolean;
	isLoading: boolean;
	isCloudConfigured: boolean;
	user: AuthUser | null;
	role: UserRole;
	signIn: (email: string, pass: string) => Promise<{ error?: string }>;
	signUp: (
		name: string,
		email: string,
		pass: string,
	) => Promise<{ error?: string; message?: string }>;
	resetPassword: (
		email: string,
	) => Promise<{ error?: string; message?: string }>;
	signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Authoritatively determines a user's role strictly from organization_memberships.
 * Never trusts user-editable `user_metadata` or client-controlled tokens.
 * Fails closed to "member" if no confirmed organization membership exists.
 */
export async function loadAuthoritativeRole(
	userIdOrSession: string | { user?: { id?: string } } | null | undefined,
): Promise<UserRole> {
	const userId =
		typeof userIdOrSession === "string"
			? userIdOrSession
			: userIdOrSession?.user?.id;

	if (!userId) {
		return "member";
	}

	try {
		if (isSupabaseConfigured()) {
			const { data, error } = await supabase
				.from("organization_memberships")
				.select("role")
				.eq("user_id", userId)
				.eq("organization_id", DEFAULT_ORG_ID)
				.maybeSingle();

			if (!error && data?.role) {
				const r = data.role as UserRole;
				if (["owner", "admin", "manager", "member"].includes(r)) {
					return r;
				}
			}
		}
	} catch (e) {
		console.warn("Could not load organization membership role:", e);
	}

	// Fail closed: Never grant elevated privileges without verified organization membership
	return "member";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [isLoading, setIsLoading] = useState(true);
	const [role, setRole] = useState<UserRole>("member");
	const [user, setUser] = useState<AuthUser | null>(null);
	const isCloudConfigured = isSupabaseConfigured();

	useEffect(() => {
		async function checkAuth() {
			if (!isCloudConfigured) {
				setUser(null);
				setIsLoading(false);
				return;
			}

			try {
				const { data } = await supabase.auth.getSession();
				if (data?.session?.user) {
					const authRole = await loadAuthoritativeRole(data.session.user.id);
					const u: AuthUser = {
						id: data.session.user.id,
						email: data.session.user.email || "",
						name:
							data.session.user.user_metadata?.full_name ||
							data.session.user.email?.split("@")[0] ||
							"Agency Member",
						role: authRole,
					};
					setUser(u);
					setRole(authRole);
				}
			} catch (e) {
				console.error("Auth session check error:", e);
			} finally {
				setIsLoading(false);
			}
		}

		checkAuth();

		if (isCloudConfigured) {
			const { data: authListener } = supabase.auth.onAuthStateChange(
				async (_event, session) => {
					if (session?.user) {
						const authRole = await loadAuthoritativeRole(session.user.id);
						const u: AuthUser = {
							id: session.user.id,
							email: session.user.email || "",
							name:
								session.user.user_metadata?.full_name ||
								session.user.email?.split("@")[0] ||
								"Agency Member",
							role: authRole,
						};
						setUser(u);
						setRole(authRole);
					} else {
						setUser(null);
						setRole("member");
					}
				},
			);

			return () => {
				authListener.subscription.unsubscribe();
			};
		}
	}, [isCloudConfigured]);

	const signIn = async (email: string, pass: string) => {
		if (!isCloudConfigured) {
			return {
				error:
					"Database credentials not configured. Please supply VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment to authenticate.",
			};
		}

		try {
			const { data, error } = await supabase.auth.signInWithPassword({
				email: email.trim(),
				password: pass,
			});

			if (error) {
				return { error: error.message };
			}

			if (data.user) {
				const authRole = await loadAuthoritativeRole(data.user.id);
				const u: AuthUser = {
					id: data.user.id,
					email: data.user.email || "",
					name:
						data.user.user_metadata?.full_name ||
						data.user.email?.split("@")[0] ||
						"Agency Member",
					role: authRole,
				};
				setUser(u);
				setRole(authRole);
			}

			return {};
		} catch (err: any) {
			return {
				error: err?.message || "Failed to sign in. Please verify credentials.",
			};
		}
	};

	const signUp = async (name: string, email: string, pass: string) => {
		if (!isCloudConfigured) {
			return {
				error:
					"Database credentials not configured. Please supply VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment to create an account.",
			};
		}

		try {
			const { data, error } = await supabase.auth.signUp({
				email: email.trim(),
				password: pass,
				options: {
					data: {
						full_name: name.trim(),
						role: "member", // Authoritative default registration role
					},
				},
			});

			if (error) {
				return { error: error.message };
			}

			if (data.session?.user) {
				const authRole = await loadAuthoritativeRole(data.session.user.id);
				const u: AuthUser = {
					id: data.session.user.id,
					email: data.session.user.email || "",
					name: name.trim() || "Agency Member",
					role: authRole,
				};
				setUser(u);
				setRole(authRole);
				return { message: "Account created successfully." };
			}

			return {
				message:
					"Account registered. Please verify your email address to complete authentication.",
			};
		} catch (err: any) {
			return { error: err?.message || "Registration failed." };
		}
	};

	const resetPassword = async (email: string) => {
		if (!isCloudConfigured) {
			return {
				error: "Cannot reset password: Cloud database is not configured.",
			};
		}

		try {
			const { error } = await supabase.auth.resetPasswordForEmail(
				email.trim(),
				{
					redirectTo: window.location.origin,
				},
			);
			if (error) return { error: error.message };
			return {
				message:
					"Password recovery email dispatched. Please check your inbox for instructions.",
			};
		} catch (err: any) {
			return { error: err?.message || "Password reset failed." };
		}
	};

	const signOut = async () => {
		if (isCloudConfigured) {
			try {
				await supabase.auth.signOut();
			} catch (e) {
				console.error("Sign out error:", e);
			}
		}
		setUser(null);
		setRole("member");
	};

	return (
		<AuthContext.Provider
			value={{
				isAuthenticated: !!user,
				isLoading,
				isCloudConfigured,
				user,
				role,
				signIn,
				signUp,
				resetPassword,
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
