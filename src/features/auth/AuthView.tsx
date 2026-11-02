import type React from "react";
import { useState } from "react";
import { useAuth } from "../../lib/auth/auth.context";

export const AuthView: React.FC = () => {
	const { signIn, signUp, resetPassword, isCloudConfigured } = useAuth();
	const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [name, setName] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [message, setMessage] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setMessage(null);
		setLoading(true);

		try {
			if (mode === "signin") {
				const res = await signIn(email, password);
				if (res.error) setError(res.error);
			} else if (mode === "signup") {
				if (!name.trim()) {
					setError("Please enter your full name.");
					setLoading(false);
					return;
				}
				if (password.length < 6) {
					setError("Password must be at least 6 characters.");
					setLoading(false);
					return;
				}
				const res = await signUp(name, email, password);
				if (res.error) setError(res.error);
				if (res.message) setMessage(res.message);
			} else if (mode === "forgot") {
				const res = await resetPassword(email);
				if (res.error) setError(res.error);
				if (res.message) setMessage(res.message);
			}
		} catch (err: any) {
			setError(err?.message || "Authentication request failed.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#0F1117] relative overflow-hidden font-sans">
			{/* Ambient background glow */}
			<div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#49B3FC]/10 blur-[120px] rounded-full pointer-events-none" />
			<div className="absolute -bottom-10 right-10 w-[400px] h-[250px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />

			<div className="w-full max-w-[460px] relative z-10">
				{/* Brand Header */}
				<div className="text-center mb-8">
					<div className="inline-flex items-center gap-3 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.08] backdrop-blur-md mb-4">
						<span
							className={`w-2 h-2 rounded-full ${
								isCloudConfigured ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
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
							KREATIWIT <span className="text-slate-400 font-light">AgencyOS</span>
						</h1>
					</div>
					<p className="text-[13px] text-slate-400 max-w-sm mx-auto">
						High-velocity studio operations, opportunities, client delivery, and team capacity command.
					</p>
				</div>

				{/* Unconfigured State Card */}
				{!isCloudConfigured ? (
					<div className="bg-[#181C26]/90 border border-amber-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-4">
						<div className="flex items-center gap-2 text-amber-400 text-[14px] font-bold">
							<span>⚠</span>
							<span>Supabase Cloud Credentials Required</span>
						</div>
						<p className="text-[13px] text-slate-300 leading-relaxed">
							In accordance with production security standards, simulated authentication and plaintext credentials have been disabled.
						</p>
						<div className="p-3.5 rounded-lg bg-black/40 border border-white/[0.06] text-[11px] font-mono text-slate-400 space-y-1.5">
							<div className="text-slate-200 font-semibold mb-1">
								Required Environment Variables:
							</div>
							<div>VITE_SUPABASE_URL=https://your-project.supabase.co</div>
							<div>VITE_SUPABASE_ANON_KEY=your-anon-key</div>
						</div>
						<p className="text-[12px] text-slate-400 leading-relaxed">
							Provide valid credentials in your environment or <code className="text-slate-200">.env</code> file to enable genuine authentication and cloud persistence.
						</p>
					</div>
				) : (
					/* Authenticated Form Container */
					<div className="bg-[#181C26]/90 border border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
						{/* Mode Switch Tabs */}
						<div className="flex border-b border-white/[0.08] mb-6">
							<button
								type="button"
								onClick={() => {
									setMode("signin");
									setError(null);
									setMessage(null);
								}}
								className={`flex-1 pb-3 text-center text-[13px] font-medium border-b-2 transition ${
									mode === "signin"
										? "border-[#49B3FC] text-white"
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
								className={`flex-1 pb-3 text-center text-[13px] font-medium border-b-2 transition ${
									mode === "signup"
										? "border-[#49B3FC] text-white"
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
								className={`flex-1 pb-3 text-center text-[13px] font-medium border-b-2 transition ${
									mode === "forgot"
										? "border-[#49B3FC] text-white"
										: "border-transparent text-slate-400 hover:text-slate-200"
								}`}
							>
								Recovery
							</button>
						</div>

						{error && (
							<div className="mb-4 p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[12px] flex items-center gap-2">
								<span>⚠</span>
								<span>{error}</span>
							</div>
						)}

						{message && (
							<div className="mb-4 p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[12px] flex items-center gap-2">
								<span>✓</span>
								<span>{message}</span>
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

							{mode !== "forgot" && (
								<div>
									<div className="flex items-center justify-between mb-1.5">
										<label className="block text-[11px] font-mono uppercase tracking-wider text-slate-300">
											Password
										</label>
										{mode === "signin" && (
											<button
												type="button"
												onClick={() => setMode("forgot")}
												className="text-[11px] text-[#49B3FC] hover:underline"
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
								) : (
									"Send Recovery Instructions"
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
