import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import type { UserRole } from "../permissions/permissions";
import { isSupabaseConfigured, supabase } from "../supabase/client";

export interface AuthContextType {
	isAuthenticated: boolean;
	isLoading: boolean;
	user: {
		id: string;
		email: string;
		name: string;
	} | null;
	role: UserRole;
	setRole: (role: UserRole) => void;
	signIn: (email: string, pass: string) => Promise<{ error?: string }>;
	signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [isLoading, setIsLoading] = useState(true);
	const [role, setRole] = useState<UserRole>("owner");
	const [user, setUser] = useState<{
		id: string;
		email: string;
		name: string;
	} | null>({
		id: "usr_admin",
		name: "Abhishek",
		email: "abhishek@kreatiwit.io",
	});

	useEffect(() => {
		async function checkAuth() {
			if (isSupabaseConfigured()) {
				try {
					const { data } = await supabase.auth.getSession();
					if (data?.session?.user) {
						setUser({
							id: data.session.user.id,
							email: data.session.user.email || "",
							name:
								data.session.user.user_metadata?.full_name || "Agency Member",
						});
					}
				} catch (e) {
					console.error("Auth session check error:", e);
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
				setUser({
					id: data.user.id,
					email: data.user.email || "",
					name: data.user.user_metadata?.full_name || "Agency Member",
				});
			}
			return {};
		}

		// Local fallback sign in
		setUser({
			id: "usr_local",
			name: email.split("@")[0] || "User",
			email,
		});
		return {};
	};

	const signOut = async () => {
		if (isSupabaseConfigured()) {
			await supabase.auth.signOut();
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
