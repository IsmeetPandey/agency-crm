import type React from "react";
import { useEffect, useState } from "react";
import { useAuth } from "../../lib/auth/auth.context";

export const AuthView: React.FC = () => {
	const {
		signIn,
		signUp,
		resetPassword,
		updatePassword,
		isCloudConfigured,
		configErrors,
		isPasswordRecoveryMode,
		continueInOfflineMode,
	} = useAuth();

	const [mode, setMode] = useState<"signin" | "signup" | "forgot" | "reset">(
		isPasswordRecoveryMode ? "reset" : "signin",
	);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [name, setName] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [message, setMessage] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (isPasswordRecoveryMode) {
			setMode("reset");
		}
	}, [isPasswordRecoveryMode]);

	const formatAuthError = (rawError: string): string => {
		const lower = rawError.toLowerCase();
		if (lower.includes("invalid login credentials")) {
			return "Invalid email or password. Please verify your credentials and try again.";
		}
		if (lower.includes("email not confirmed")) {
			return "Your email address has not been confirmed yet. Please check your inbox for the confirmation link.";
		}
		if (lower.includes("user already registered")) {
			return "An account with this email address already exists. Please sign in or reset your password.";
		}
		if (lower.includes("network") || lower.includes("failed to fetch")) {
			return "Network error connecting to Supabase. Please verify your internet connection.";
		}
		if (lower.includes("password should be at least")) {
			return "Password must be at least 6 characters long.";
		}
		return rawError;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setMessage(null);
		setLoading(true);

		try {
			if (mode === "signin") {
				const res = await signIn(email, password);
				if (res.error) {
					setError(formatAuthError(res.error));
				}
			} else if (mode === "signup") {
				if (!name.trim()) {
					setError("Please enter your full name.");
					setLoading(false);
					return;
				}
				if (password.length < 6) {
					setError("Password must be at least 6 characters long.");
					setLoading(false);
					return;
				}
				const res = await signUp(name, email, password);
				if (res.error) {
					setError(formatAuthError(res.error));
				} else if (res.message) {
					setMessage(res.message);
				}
			} else if (mode === "forgot") {
				const res = await resetPassword(email);
				if (res.error) {
					setError(formatAuthError(res.error));
				} else if (res.message) {
					setMessage(res.message);
				}
			} else if (mode === "reset") {
				if (newPassword.length < 6) {
					setError("New password must be at least 6 characters long.");
					setLoading(false);
					return;
				}
				const res = await updatePassword(newPassword);
				if (res.error) {
					setError(formatAuthError(res.error));
				} else if (res.message) {
					setMessage(res.message);
					setTimeout(() => setMode("signin"), 2000);
				}
			}
		} catch (err: any) {
			setError(
				formatAuthError(err?.message || "Authentication request failed."),
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#0F1117] relative overflow-hidden font-sans">
			{/* Ambient background glow */}
			<div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#49B3FC]/10 blur-[120px] rounded-full pointer-events-none" />
			<div className="absolute -bottom-10 right-10 w-[400px] h-[250px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />

			<div className="w-full max-w-[480px] relative z-10">
				{/* Brand Header */}
				<div className="text-center mb-8">
					<div className="inline-flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.08] backdrop-blur-md mb-4 shadow-sm">
						<span
							className={`w-2 h-2 rounded-full ${
								isCloudConfigured
									? "bg-emerald-400 animate-pulse"
									: "bg-amber-400"
							}`}
						/>
						<span className="text-[11px] font-mono tracking-wider uppercase text-slate-300">
							{isCloudConfigured
								? "Supabase Production Auth Active"
								: "Cloud Storage Unconfigured"}
						</span>
					</div>

					<div className="flex items-center justify-center gap-3 mb-2">
						<div className="w-10 h-10 rounded-xl bg-[#49B3FC] text-slate-950 flex items-center justify-center font-bold text-lg shadow-[0_0_20px_rgba(73,179,252,0.4)]">
							K
						</div>
						<h1 className="text-2xl font-bold tracking-tight text-white">
							KREATIWIT{" "}
							<span className="text-slate-400 font-light">AgencyOS</span>
						</h1>
					</div>
					<p className="text-[13px] text-slate-400 max-w-sm mx-auto">
						Studio command CRM for agency pipeline, delivery, approvals, and
						team capacity.
					</p>
				</div>

				{/* Unconfigured State Card with Detailed Diagnostics & Offline Mode Option */}
				{!isCloudConfigured ? (
					<div className="bg-[#181C26]/90 border border-amber-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-4">
						<div className="flex items-center gap-2 text-amber-400 text-[14px] font-bold">
							<span>⚠</span>
							<span>Supabase Configuration Required</span>
						</div>
						<p className="text-[13px] text-slate-300 leading-relaxed">
							Real Supabase authentication requires valid environment variables.
							The following issues were identified:
						</p>

						<div className="p-3.5 rounded-lg bg-black/50 border border-amber-500/20 text-[11px] font-mono text-amber-300/90 space-y-1.5">
							{configErrors.length > 0 ? (
								configErrors.map((err) => (
									<div key={err} className="flex items-start gap-1.5">
										<span className="text-rose-400">•</span>
										<span>{err}</span>
									</div>
								))
							) : (
								<div>Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY</div>
							)}
						</div>

						<div className="p-3.5 rounded-lg bg-black/40 border border-white/[0.06] text-[11px] font-mono text-slate-400 space-y-1">
							<div className="text-slate-200 font-semibold mb-1">
								Expected in .env:
							</div>
							<div>VITE_SUPABASE_URL=https://&lt;project&gt;.supabase.co</div>
							<div>VITE_SUPABASE_ANON_KEY=&lt;jwt-anon-key&gt;</div>
							<div>
								VITE_ORGANIZATION_ID=11111111-1111-1111-1111-111111111111
							</div>
						</div>

						<div className="pt-2">
							<button
								type="button"
								onClick={continueInOfflineMode}
								className="w-full py-2.5 px-4 rounded-lg bg-white/10 hover:bg-white/15 text-white text-[13px] font-medium transition flex items-center justify-center gap-2 cursor-pointer border border-white/20"
							>
								<span>⚡</span>
								<span>Launch Studio in Offline Resilient Engine Mode</span>
							</button>
						</div>
					</div>
				) : (
					/* Authenticated Form Container */
					<div className="bg-[#181C26]/90 border border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
						{/* Mode Switch Tabs */}
						{mode !== "reset" ? (
							<div className="flex border-b border-white/[0.08] mb-6">
								<button
									type="button"
									onClick={() => {
										setMode("signin");
										setError(null);
										setMessage(null);
									}}
									className={`flex-1 pb-3 text-center text-[13px] font-medium border-b-2 transition cursor-pointer ${
										mode === "signin"
											? "border-[#49B3FC] text-white font-semibold"
											: "border-transparent text-slate-400 hover:text-slate-200"
									}`}
								>
									Sign In
								</button>
								<button
									type="button"
									onClick={() => {
										setMode("signup");
										setError(null);
										setMessage(null);
									}}
									className={`flex-1 pb-3 text-center text-[13px] font-medium border-b-2 transition cursor-pointer ${
										mode === "signup"
											? "border-[#49B3FC] text-white font-semibold"
											: "border-transparent text-slate-400 hover:text-slate-200"
									}`}
								>
									Create Account
								</button>
								<button
									type="button"
									onClick={() => {
										setMode("forgot");
										setError(null);
										setMessage(null);
									}}
									className={`flex-1 pb-3 text-center text-[13px] font-medium border-b-2 transition cursor-pointer ${
										mode === "forgot"
											? "border-[#49B3FC] text-white font-semibold"
											: "border-transparent text-slate-400 hover:text-slate-200"
									}`}
								>
									Recovery
								</button>
							</div>
						) : (
							<div className="mb-6 pb-3 border-b border-white/[0.08] flex items-center justify-between">
								<h2 className="text-[14px] font-bold text-white">
									Set New Password
								</h2>
								<button
									type="button"
									onClick={() => setMode("signin")}
									className="text-[11px] text-[#49B3FC] hover:underline"
								>
									Back to Sign In
								</button>
							</div>
						)}

						{error && (
							<div className="mb-4 p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[12px] flex items-start gap-2">
								<span className="font-bold text-rose-400 mt-0.5">⚠</span>
								<span className="flex-1 leading-snug">{error}</span>
							</div>
						)}

						{message && (
							<div className="mb-4 p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[12px] flex items-start gap-2">
								<span className="font-bold text-emerald-400 mt-0.5">✓</span>
								<span className="flex-1 leading-snug">{message}</span>
							</div>
						)}

						<form onSubmit={handleSubmit} className="space-y-4">
							{mode === "signup" && (
								<div>
									<label className="block text-[11px] font-mono uppercase tracking-wider text-slate-300 mb-1.5">
										Full Name
									</label>
									<input
										type="text"
										required
										value={name}
										onChange={(e) => setName(e.target.value)}
										placeholder="e.g. Alex Henderson"
										className="w-full px-3.5 py-2.5 rounded-lg bg-white/[0.05] border border-white/[0.1] text-white text-[13px] placeholder:text-slate-500 focus:outline-none focus:border-[#49B3FC] transition"
									/>
								</div>
							)}

							{mode !== "reset" && (
								<div>
									<label className="block text-[11px] font-mono uppercase tracking-wider text-slate-300 mb-1.5">
										Studio Email Address
									</label>
									<input
										type="email"
										required
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										placeholder="name@kreatiwit.io"
										className="w-full px-3.5 py-2.5 rounded-lg bg-white/[0.05] border border-white/[0.1] text-white text-[13px] placeholder:text-slate-500 focus:outline-none focus:border-[#49B3FC] transition"
									/>
								</div>
							)}

							{mode === "reset" && (
								<div>
									<label className="block text-[11px] font-mono uppercase tracking-wider text-slate-300 mb-1.5">
										New Password
									</label>
									<input
										type="password"
										required
										minLength={6}
										value={newPassword}
										onChange={(e) => setNewPassword(e.target.value)}
										placeholder="Minimum 6 characters"
										className="w-full px-3.5 py-2.5 rounded-lg bg-white/[0.05] border border-white/[0.1] text-white text-[13px] placeholder:text-slate-500 focus:outline-none focus:border-[#49B3FC] transition"
									/>
								</div>
							)}

							{mode !== "forgot" && mode !== "reset" && (
								<div>
									<div className="flex items-center justify-between mb-1.5">
										<label className="block text-[11px] font-mono uppercase tracking-wider text-slate-300">
											Password
										</label>
										{mode === "signin" && (
											<button
												type="button"
												onClick={() => {
													setMode("forgot");
													setError(null);
													setMessage(null);
												}}
												className="text-[11px] text-[#49B3FC] hover:underline cursor-pointer"
											>
												Forgot?
											</button>
										)}
									</div>
									<input
										type="password"
										required
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										placeholder="••••••••••••"
										className="w-full px-3.5 py-2.5 rounded-lg bg-white/[0.05] border border-white/[0.1] text-white text-[13px] placeholder:text-slate-500 focus:outline-none focus:border-[#49B3FC] transition"
									/>
								</div>
							)}

							<button
								type="submit"
								disabled={loading}
								className="w-full py-2.5 px-4 rounded-lg bg-[#49B3FC] hover:bg-[#3ba4ea] text-slate-950 text-[13px] font-semibold transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#49B3FC]/20 disabled:opacity-50"
							>
								{loading ? (
									<span className="inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
								) : mode === "signin" ? (
									"Authenticate & Enter Studio"
								) : mode === "signup" ? (
									"Register Agency Account"
								) : mode === "forgot" ? (
									"Send Recovery Instructions"
								) : (
									"Update Password & Continue"
								)}
							</button>
						</form>
					</div>
				)}

				<div className="mt-6 text-center text-[11px] text-slate-500 font-mono">
					KREATIWIT AgencyOS v3.2 • Enterprise Creative Architecture
				</div>
			</div>
		</div>
	);
};
