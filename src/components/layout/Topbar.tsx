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
		<header className="sticky top-0 z-30 studio-topbar flex items-center justify-between px-4 lg:px-6 h-[54px] select-none">
			{/* Breadcrumb & mobile toggle */}
			<div className="flex items-center gap-3 min-w-0">
				<button
					type="button"
					onClick={onMobileMenuToggle}
					className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
					aria-label="Open mobile navigation"
				>
					☰
				</button>
				<div className="flex items-center gap-2 text-[13px]">
					<span className="font-semibold text-slate-400 hidden sm:inline">
						STUDIO
					</span>
					<span className="text-slate-300 hidden sm:inline">/</span>
					<div className="flex items-center gap-2">
						<span className="w-2 h-2 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.6)]" />
						<h1 className="text-[14px] font-bold text-slate-900 tracking-tight truncate">
							{viewTitle}
						</h1>
					</div>
				</div>
			</div>

			{/* Center Search Pill */}
			<div className="hidden md:flex items-center flex-1 max-w-[360px] mx-4">
				<button
					type="button"
					onClick={openCmd}
					className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-100/80 hover:bg-slate-200/60 border border-slate-200/80 text-[12px] text-slate-500 transition group"
				>
					<span className="flex items-center gap-2">
						<span className="text-slate-400 group-hover:text-blue-600 transition">
							🔍
						</span>
						<span>Search opportunities, projects, team...</span>
					</span>
					<kbd className="font-mono text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-500 shadow-2xs">
						⌘K
					</kbd>
				</button>
			</div>

			{/* Right Actions & Profile */}
			<div className="flex items-center gap-2.5">
				{/* Supabase Engine Status Pill */}
				<div className="relative">
					<button
						type="button"
						onClick={() => setShowSyncInfo((v) => !v)}
						className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border transition cursor-pointer bg-white border-slate-200 hover:border-slate-300 shadow-2xs"
					>
						<span
							className={`w-2 h-2 rounded-full ${
								isConnected
									? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]"
									: "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.8)]"
							}`}
						/>
						<span className="hidden sm:inline text-slate-700 font-mono">
							{isConnected ? "Supabase Live" : "Local Engine"}
						</span>
					</button>

					{showSyncInfo && (
						<div className="absolute right-0 top-10 w-80 p-4 studio-modal shadow-xl z-50 text-left space-y-3 border border-slate-200 animate-in fade-in">
							<div className="flex items-center justify-between pb-2 border-b border-slate-100">
								<span className="text-[12px] font-bold text-slate-900 tracking-tight">
									Infrastructure & Persistence
								</span>
								<button
									type="button"
									onClick={() => setShowSyncInfo(false)}
									className="text-slate-400 text-[14px] hover:text-slate-700 leading-none"
								>
									×
								</button>
							</div>

							<div className="space-y-2 text-[11px]">
								<div className="flex justify-between">
									<span className="text-slate-500">Database Engine:</span>
									<span
										className={`font-mono font-semibold ${isConnected ? "text-emerald-600" : "text-amber-600"}`}
									>
										{isConnected
											? "Supabase PostgreSQL"
											: "Local Offline Engine"}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-slate-500">Security Layer:</span>
									<span className="text-slate-800 font-medium font-mono">
										{isConnected
											? "Row-Level Security (RLS)"
											: "Client RBAC Enforcement"}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-slate-500">Storage Integrity:</span>
									<span className="text-emerald-600 font-medium">
										Zero-Loss Guaranteed
									</span>
								</div>
							</div>

							<p className="text-[11px] text-slate-500 leading-relaxed pt-2 border-t border-slate-100">
								{isConnected
									? "Operating against real PostgreSQL tables with server-side RLS authorization policies enabled."
									: "Operating in resilient offline engine mode. Supply live VITE_SUPABASE_URL & ANON_KEY to synchronize across distributed teams."}
							</p>
						</div>
					)}
				</div>

				{/* Quick Actions */}
				<button
					type="button"
					onClick={() => openModal("lead")}
					className="btn-primary !h-[28px] !text-[12px] !px-2.5"
				>
					+ Lead
				</button>
				<button
					type="button"
					onClick={() => openModal("project")}
					className="hidden sm:inline-flex btn-secondary !h-[28px] !text-[12px] !px-2.5"
				>
					+ Project
				</button>

				{/* User Avatar & Role */}
				<div className="flex items-center gap-2 pl-2 border-l border-slate-200">
					<span className="text-[10px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
						{role}
					</span>
					<div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[11px] font-mono shadow-2xs">
						{user?.name?.slice(0, 2).toUpperCase() || "ME"}
					</div>
				</div>
			</div>
		</header>
	);
};
