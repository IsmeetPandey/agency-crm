import type React from "react";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import type { UserRole } from "../permissions/permissions";
import {
	DEFAULT_ORG_ID,
	getActiveOrgId,
	isSupabaseConfigured,
	setActiveOrgId,
	supabase,
	validateSupabaseConfig,
} from "../supabase/client";

export type AuthState =
	| "initializing"
	| "unauthenticated"
	| "authenticated"
	| "membership_required"
	| "authorization_error"
	| "unconfigured";

export interface AuthUser {
	id: string;
	email: string;
	name: string;
	role?: UserRole;
	organizationId?: string;
}

export interface AuthContextType {
	isAuthenticated: boolean;
	isLoading: boolean;
	isCloudConfigured: boolean;
	configErrors: string[];
	authState: AuthState;
	user: AuthUser | null;
	role: UserRole;
	organizationId: string;
	authError: string | null;
	isPasswordRecoveryMode: boolean;
	signIn: (
		email: string,
		pass: string,
	) => Promise<{ error?: string; errorCode?: string }>;
	signUp: (
		name: string,
		email: string,
		pass: string,
	) => Promise<{ error?: string; message?: string }>;
	resetPassword: (
		email: string,
	) => Promise<{ error?: string; message?: string }>;
	updatePassword: (
		newPassword: string,
	) => Promise<{ error?: string; message?: string }>;
	retryMembershipResolution: () => Promise<void>;
	requestMembershipProvisioning: () => Promise<{
		error?: string;
		message?: string;
	}>;
	signOut: () => Promise<void>;
	continueInOfflineMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Authoritatively determines a user's full organization membership record.
 * Never trusts user-editable `user_metadata` or client-controlled tokens.
 * Returns null if no verified organization membership exists.
 */
export async function loadAuthoritativeMembership(
	userIdOrSession: string | { user?: { id?: string } } | null | undefined,
	targetOrgId: string = DEFAULT_ORG_ID,
): Promise<{ role: UserRole; organizationId: string } | null> {
	const userId =
		typeof userIdOrSession === "string"
			? userIdOrSession
			: userIdOrSession?.user?.id;

	if (!userId) {
		return null;
	}

	try {
		if (isSupabaseConfigured()) {
			const { data, error } = await supabase
				.from("organization_memberships")
				.select("role, organization_id")
				.eq("user_id", userId)
				.order("created_at", { ascending: true });

			if (!error && data && data.length > 0) {
				const targetMatch = data.find(
					(m: { organization_id: string }) => m.organization_id === targetOrgId,
				);
				const matched = targetMatch || data[0];
				const rawRole = matched.role as UserRole;
				if (["owner", "admin", "manager", "member"].includes(rawRole)) {
					return {
						role: rawRole,
						organizationId: matched.organization_id,
					};
				}
			}
		}
	} catch (e) {
		console.warn("Could not load organization membership role:", e);
		throw e;
	}

	return null;
}

/**
 * Authoritatively determines a user's role strictly from organization_memberships.
 * Never trusts user-editable `user_metadata` or client-controlled tokens.
 * Fails closed to "member" if no confirmed organization membership exists.
 */
export async function loadAuthoritativeRole(
	userIdOrSession: string | { user?: { id?: string } } | null | undefined,
	targetOrgId: string = DEFAULT_ORG_ID,
): Promise<UserRole> {
	try {
		const membership = await loadAuthoritativeMembership(
			userIdOrSession,
			targetOrgId,
		);
		if (membership?.role) return membership.role;
	} catch {}
	// Fail closed: Never grant elevated privileges without verified organization membership
	return "member";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [authState, setAuthState] = useState<AuthState>("initializing");
	const [role, setRole] = useState<UserRole>("member");
	const [user, setUser] = useState<AuthUser | null>(null);
	const [organizationId, setOrgIdState] = useState<string>(DEFAULT_ORG_ID);
	const [authError, setAuthError] = useState<string | null>(null);
	const [isPasswordRecoveryMode, setIsPasswordRecoveryMode] = useState(false);

	const configValidation = validateSupabaseConfig();
	const isCloudConfigured = configValidation.isValid;
	const configErrors = configValidation.errors;

	// Ref to track active resolution cycle and prevent stale async races
	const resolutionCycleRef = useRef(0);

	// Safe asynchronous membership resolver (isolated from onAuthStateChange callback)
	const resolveUserMembership = useCallback(
		async (
			sessionUser: {
				id: string;
				email?: string;
				user_metadata?: Record<string, any>;
			},
			cycle: number,
		) => {
			try {
				let membership = await loadAuthoritativeMembership(
					sessionUser.id,
					getActiveOrgId(),
				);

				// If cycle has changed due to newer event, discard stale result
				if (resolutionCycleRef.current !== cycle) return;

				// If no membership found, attempt automatic idempotent self-provisioning
				if (!membership && isCloudConfigured) {
					try {
						const { data: provData, error: provError } = await supabase.rpc(
							"rpc_provision_user_membership",
							{ p_org_id: getActiveOrgId() },
						);
						if (!provError && provData?.role) {
							membership = {
								role: provData.role as UserRole,
								organizationId: provData.organization_id || getActiveOrgId(),
							};
						}
					} catch (provErr) {
						console.warn(
							"Self-provisioning RPC failed or not present:",
							provErr,
						);
					}
				}

				if (resolutionCycleRef.current !== cycle) return;

				if (membership) {
					setActiveOrgId(membership.organizationId);
					setOrgIdState(membership.organizationId);
					setRole(membership.role);

					const u: AuthUser = {
						id: sessionUser.id,
						email: sessionUser.email || "",
						name:
							sessionUser.user_metadata?.full_name ||
							sessionUser.email?.split("@")[0] ||
							"Agency Member",
						role: membership.role,
						organizationId: membership.organizationId,
					};
					setUser(u);
					setAuthState("authenticated");
					setAuthError(null);
				} else {
					// User exists in auth.users, but has no confirmed organization membership
					setUser({
						id: sessionUser.id,
						email: sessionUser.email || "",
						name:
							sessionUser.user_metadata?.full_name ||
							sessionUser.email?.split("@")[0] ||
							"Agency Specialist",
						role: "member",
					});
					setRole("member");
					setAuthState("membership_required");
					setAuthError(
						"Your user account is authenticated, but no authorized organization membership was found. Please request an administrator invitation or use self-provisioning.",
					);
				}
			} catch (err: any) {
				if (resolutionCycleRef.current !== cycle) return;
				console.error("Membership resolution error:", err);
				setAuthState("authorization_error");
				setAuthError(
					err?.message ||
						"Failed to verify organization membership due to a network connection or database error. Please retry.",
				);
			}
		},
		[isCloudConfigured],
	);

	// Initial session evaluation on mount
	useEffect(() => {
		if (!isCloudConfigured) {
			setAuthState("unconfigured");
			return;
		}

		// Detect password recovery callback in URL hash
		if (
			typeof window !== "undefined" &&
			(window.location.hash.includes("type=recovery") ||
				window.location.href.includes("type=recovery"))
		) {
			setIsPasswordRecoveryMode(true);
		}

		let isMounted = true;
		const cycle = ++resolutionCycleRef.current;

		async function initSession() {
			try {
				const { data, error } = await supabase.auth.getSession();
				if (!isMounted) return;

				if (error) {
					console.error("Supabase getSession error:", error);
					setAuthState("unauthenticated");
					return;
				}

				if (data?.session?.user) {
					await resolveUserMembership(data.session.user, cycle);
				} else {
					setAuthState("unauthenticated");
					setUser(null);
				}
			} catch (err) {
				if (isMounted) {
					console.error("Initial auth check failed:", err);
					setAuthState("unauthenticated");
				}
			}
		}

		initSession();

		// Supabase auth state change listener (NON-BLOCKING: do not await inside callback)
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((event, session) => {
			if (!isMounted) return;

			if (event === "PASSWORD_RECOVERY") {
				setIsPasswordRecoveryMode(true);
			}

			if (event === "SIGNED_OUT" || !session?.user) {
				resolutionCycleRef.current++;
				setUser(null);
				setRole("member");
				setAuthState("unauthenticated");
				setAuthError(null);
				return;
			}

			// When signed in or refreshed, schedule async membership resolution
			const nextCycle = ++resolutionCycleRef.current;
			setTimeout(() => {
				if (isMounted) {
					resolveUserMembership(session.user, nextCycle);
				}
			}, 0);
		});

		return () => {
			isMounted = false;
			subscription.unsubscribe();
		};
	}, [isCloudConfigured, resolveUserMembership]);

	const signIn = async (email: string, pass: string) => {
		if (!isCloudConfigured) {
			return {
				error:
					"Database credentials not configured. Please supply valid VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to authenticate.",
			};
		}

		setAuthError(null);
		try {
			const { data, error } = await supabase.auth.signInWithPassword({
				email: email.trim(),
				password: pass,
			});

			if (error) {
				return {
					error: error.message,
					errorCode: (error as any).code || error.message,
				};
			}

			if (data.user) {
				const cycle = ++resolutionCycleRef.current;
				await resolveUserMembership(data.user, cycle);
			}

			return {};
		} catch (err: any) {
			const message =
				err?.message || "Failed to sign in. Please verify network credentials.";
			return { error: message };
		}
	};

	const signUp = async (name: string, email: string, pass: string) => {
		if (!isCloudConfigured) {
			return {
				error:
					"Database credentials not configured. Please supply VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to register.",
			};
		}

		setAuthError(null);
		try {
			const { data, error } = await supabase.auth.signUp({
				email: email.trim(),
				password: pass,
				options: {
					data: {
						full_name: name.trim(),
					},
					emailRedirectTo:
						typeof window !== "undefined" ? window.location.origin : undefined,
				},
			});

			if (error) {
				return { error: error.message };
			}

			if (data.session?.user) {
				const cycle = ++resolutionCycleRef.current;
				await resolveUserMembership(data.session.user, cycle);
				return { message: "Account created and authorized successfully." };
			}

			return {
				message:
					"Account registered. Please check your inbox for a confirmation email to complete authentication.",
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
			const redirectTo =
				typeof window !== "undefined"
					? `${window.location.origin}/#type=recovery`
					: undefined;
			const { error } = await supabase.auth.resetPasswordForEmail(
				email.trim(),
				{ redirectTo },
			);

			if (error) return { error: error.message };

			return {
				message:
					"Password recovery instructions dispatched. Please check your inbox.",
			};
		} catch (err: any) {
			return { error: err?.message || "Password reset request failed." };
		}
	};

	const updatePassword = async (newPassword: string) => {
		if (!isCloudConfigured) {
			return { error: "Database not configured." };
		}

		try {
			const { error } = await supabase.auth.updateUser({
				password: newPassword,
			});

			if (error) {
				return { error: error.message };
			}

			setIsPasswordRecoveryMode(false);
			if (typeof window !== "undefined" && window.location.hash) {
				window.location.hash = "";
			}

			return {
				message: "Password updated successfully. You are securely logged in.",
			};
		} catch (err: any) {
			return { error: err?.message || "Failed to update password." };
		}
	};

	const retryMembershipResolution = async () => {
		if (!user) return;
		setAuthState("initializing");
		const cycle = ++resolutionCycleRef.current;
		await resolveUserMembership(user, cycle);
	};

	const requestMembershipProvisioning = async () => {
		if (!user || !isCloudConfigured) {
			return { error: "User session required for provisioning." };
		}

		try {
			const { data, error } = await supabase.rpc(
				"rpc_provision_user_membership",
				{ p_org_id: getActiveOrgId() },
			);

			if (error) {
				return { error: error.message };
			}

			await retryMembershipResolution();
			return {
				message: `Membership provisioned successfully as ${data?.role || "member"}.`,
			};
		} catch (err: any) {
			return {
				error: err?.message || "Failed to provision organization membership.",
			};
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
		resolutionCycleRef.current++;
		setUser(null);
		setRole("member");
		setAuthState("unauthenticated");
		setAuthError(null);
		setIsPasswordRecoveryMode(false);
	};

	const continueInOfflineMode = () => {
		setUser({
			id: "offline-guest-specialist",
			email: "executive@kreatiwit.io",
			name: "Kreatiwit Executive",
			role: "owner",
			organizationId: DEFAULT_ORG_ID,
		});
		setRole("owner");
		setAuthState("authenticated");
		setAuthError(null);
	};

	const isLoading = authState === "initializing";
	const isAuthenticated = authState === "authenticated";

	return (
		<AuthContext.Provider
			value={{
				isAuthenticated,
				isLoading,
				isCloudConfigured,
				configErrors,
				authState,
				user,
				role,
				organizationId,
				authError,
				isPasswordRecoveryMode,
				signIn,
				signUp,
				resetPassword,
				updatePassword,
				retryMembershipResolution,
				requestMembershipProvisioning,
				signOut,
				continueInOfflineMode,
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
