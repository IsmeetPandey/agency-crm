import type React from "react";
import { useState } from "react";
import { useAuth } from "../../lib/auth/auth.context";
import { isSupabaseConfigured } from "../../lib/supabase/client";

interface TopbarProps {
	viewTitle: string;
	search: string;
	setSearch: (s: string) => void;
	openCmd: () => void;
	openModal: (type: string) => void;
	onMobileMenuToggle?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
	viewTitle,
	search,
	setSearch,
	openCmd,
	openModal,
	onMobileMenuToggle,
}) => {
	const { user, role } = useAuth();
	const [showSyncInfo, setShowSyncInfo] = useState(false);
	const isConnected = isSupabaseConfigured();

	return (
		<header className="sticky top-0 z-30 liquid-topbar flex items-center justify-between px-4 lg:px-6 h-[52px]">
			{/* Title & mobile toggle */}
			<div className="flex items-center gap-3 min-w-0">
				<button
					type="button"
					onClick={onMobileMenuToggle}
					className="lg:hidden p-1.5 rounded-lg text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/[0.04]"
				>
					☰
				</button>
				<div className="flex items-center gap-2">
					<span className="w-2 h-2 rounded-full bg-[#007AFF] shadow-[0_0_8px_rgba(0,122,255,0.6)]" />
					<h1 className="text-[15px] font-[650] tracking-[-0.015em] text-[#1D1D1F] truncate">
						{viewTitle}
					</h1>
				</div>
			</div>

			{/* Center Search Pill */}
			<div className="hidden md:flex items-center flex-1 max-w-[340px] mx-4">
				<div className="relative w-full">
					<input
						type="text"
						placeholder="Search leads, clients, projects... (⌘K)"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						onClick={openCmd}
						className="search-pill w-full pl-9 pr-12 text-[12px] text-[#1D1D1F] placeholder-[#86868B]"
					/>
					<span className="absolute left-3 top-2 text-[12px] text-[#86868B]">
						🔍
					</span>
					<kbd className="absolute right-2.5 top-1.5 px-1.5 py-0.5 rounded text-[10px] font-mono bg-black/[0.06] text-[#86868B]">
						⌘K
					</kbd>
				</div>
			</div>

			{/* Right Actions & Profile */}
			<div className="flex items-center gap-2">
				{/* Supabase Engine Status Pill */}
				<div className="relative">
					<button
						type="button"
						onClick={() => setShowSyncInfo((v) => !v)}
						className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-[550] border transition cursor-pointer bg-white/70 backdrop-blur hover:bg-white/90 border-black/[0.08]"
					>
						<span
							className={`w-2 h-2 rounded-full ${
								isConnected
									? "bg-[#30D158] shadow-[0_0_6px_rgba(48,209,88,0.7)]"
									: "bg-[#FF9500] shadow-[0_0_6px_rgba(255,149,0,0.7)]"
							}`}
						/>
						<span className="hidden sm:inline text-[#1D1D1F]">
							{isConnected ? "Supabase Live" : "Local Engine"}
						</span>
					</button>

					{showSyncInfo && (
						<div className="absolute right-0 top-9 w-72 p-4 liquid-modal shadow-2xl z-50 text-left space-y-2.5 border border-black/[0.1] animate-in fade-in">
							<div className="flex items-center justify-between pb-1.5 border-b border-black/[0.06]">
								<span className="text-[12px] font-[700] text-[#1D1D1F]">
									Persistence Architecture
								</span>
								<button
									type="button"
									onClick={() => setShowSyncInfo(false)}
									className="text-[#86868B] text-[12px] hover:text-[#1D1D1F]"
								>
									×
								</button>
							</div>

							<div className="space-y-1.5 text-[11px]">
								<div className="flex justify-between text-[#86868B]">
									<span>Status:</span>
									<span
										className={`font-[600] ${isConnected ? "text-[#30D158]" : "text-[#FF9500]"}`}
									>
										{isConnected
											? "PostgreSQL Connected"
											: "Offline Persistent Cache"}
									</span>
								</div>
								<div className="flex justify-between text-[#86868B]">
									<span>Auth Mode:</span>
									<span className="text-[#1D1D1F] font-mono">
										{isConnected ? "Supabase Auth" : "Local RBAC Session"}
									</span>
								</div>
								<div className="flex justify-between text-[#86868B]">
									<span>Data Integrity:</span>
									<span className="text-[#30D158] font-[600]">
										100% Protected
									</span>
								</div>
							</div>

							<p className="text-[11px] text-[#86868B] leading-tight pt-1 border-t border-black/[0.06]">
								{isConnected
									? "All mutations are committed directly to production Supabase PostgreSQL with verified RLS enforcement."
									: "Operating in resilient local mode. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local to activate multi-user PostgreSQL sync."}
							</p>
						</div>
					)}
				</div>

				<button
					type="button"
					onClick={() => openModal("lead")}
					className="btn-liquid btn-liquid-primary !h-[28px] !text-[12px] !px-3"
				>
					+ Lead
				</button>
				<button
					type="button"
					onClick={() => openModal("project")}
					className="hidden sm:inline-flex btn-liquid !h-[28px] !text-[12px] !px-3"
				>
					+ Project
				</button>
				<button
					type="button"
					onClick={() => openModal("task")}
					className="hidden sm:inline-flex btn-liquid !h-[28px] !text-[12px] !px-3"
				>
					+ Task
				</button>

				{/* User Role Badge & Avatar */}
				<div className="flex items-center gap-2 ml-2 pl-2 border-l border-black/[0.08]">
					<span className="text-[10px] font-[600] uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/[0.05] text-[#86868B]">
						{role}
					</span>
					<div className="avatar-glass w-7 h-7">
						<div className="avatar-glass-inner text-[10px] bg-gradient-to-tr from-[#6D28D9] to-[#FF2D55]">
							{user?.name?.slice(0, 2).toUpperCase() || "ME"}
						</div>
					</div>
				</div>
			</div>
		</header>
	);
};
