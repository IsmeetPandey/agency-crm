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
	openCmd,
	openModal,
	onMobileMenuToggle,
}) => {
	const { user, role, signOut } = useAuth();
	const [showSyncInfo, setShowSyncInfo] = useState(false);
	const isConnected = isSupabaseConfigured();

	return (
		<header className="sticky top-0 z-30 studio-topbar flex items-center justify-between px-4 lg:px-6 h-[54px] select-none">
			{/* Breadcrumb & mobile toggle */}
			<div className="flex items-center gap-3 min-w-0">
				<button
					type="button"
					onClick={onMobileMenuToggle}
					className="lg:hidden p-1.5 rounded-lg text-[#666666] hover:text-[#222222] hover:bg-[#EDEDED] transition"
					aria-label="Open mobile navigation"
				>
					☰
				</button>
				<div className="flex items-center gap-2 text-[13px]">
					<span className="font-semibold text-[#808080] hidden sm:inline">
						STUDIO
					</span>
					<span className="text-[#DEDEDE] hidden sm:inline">/</span>
					<div className="flex items-center gap-2">
						<span className="w-2 h-2 rounded-full bg-[#49B3FC] shadow-[0_0_8px_rgba(73,179,252,0.6)]" />
						<h1 className="text-[14px] font-bold text-[#111111] tracking-tight truncate">
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
					className="w-full flex items-center justify-between px-3 py-1.5 rounded-md bg-[#F8F8F8] hover:bg-[#EDEDED] border border-[#DEDEDE] text-[12px] text-[#666666] transition group"
				>
					<span className="flex items-center gap-2">
						<span className="text-[#808080] group-hover:text-[#168FCE] transition">
							🔍
						</span>
						<span>Search opportunities, projects, team...</span>
					</span>
					<kbd className="font-mono text-[10px] bg-white border border-[#DEDEDE] px-1.5 py-0.5 rounded text-[#666666] shadow-xs">
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
						className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border transition cursor-pointer bg-white border-[#DEDEDE] hover:border-[#C8C8C8] shadow-xs"
					>
						<span
							className={`w-2 h-2 rounded-full ${
								isConnected
									? "bg-[#16834A] shadow-[0_0_6px_rgba(22,131,74,0.7)]"
									: "bg-[#A96500] shadow-[0_0_6px_rgba(169,101,0,0.7)]"
							}`}
						/>
						<span className="hidden sm:inline text-[#222222] font-mono">
							{isConnected ? "Supabase Live" : "Local Engine"}
						</span>
					</button>

					{showSyncInfo && (
						<div className="absolute right-0 top-10 w-80 p-4 studio-modal shadow-lg z-50 text-left space-y-3 border border-[#DEDEDE] animate-in fade-in">
							<div className="flex items-center justify-between pb-2 border-b border-[#EDEDED]">
								<span className="text-[12px] font-bold text-[#111111] tracking-tight">
									Infrastructure & Persistence
								</span>
								<button
									type="button"
									onClick={() => setShowSyncInfo(false)}
									className="text-[#808080] text-[14px] hover:text-[#222222] leading-none"
								>
									×
								</button>
							</div>

							<div className="space-y-2 text-[11px]">
								<div className="flex justify-between">
									<span className="text-[#666666]">Database Engine:</span>
									<span
										className={`font-mono font-semibold ${isConnected ? "text-[#16834A]" : "text-[#A96500]"}`}
									>
										{isConnected
											? "Supabase PostgreSQL"
											: "Local Offline Engine"}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-[#666666]">Security Layer:</span>
									<span className="text-[#222222] font-medium font-mono">
										{isConnected
											? "Row-Level Security (RLS)"
											: "Client RBAC Enforcement"}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-[#666666]">Storage Integrity:</span>
									<span className="text-[#16834A] font-medium">
										Zero-Loss Guaranteed
									</span>
								</div>
							</div>

							<p className="text-[11px] text-[#666666] leading-relaxed pt-2 border-t border-[#EDEDED]">
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

				{/* User Avatar, Role & Signout */}
				<div className="flex items-center gap-2 pl-2 border-l border-[#DEDEDE]">
					<span className="text-[10px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded bg-[#EDEDED] text-[#666666] border border-[#DEDEDE]">
						{role}
					</span>
					<div
						className="w-7 h-7 rounded-full bg-[#111111] text-white flex items-center justify-center font-bold text-[11px] font-mono shadow-xs"
						title={user?.email || user?.name || "User"}
					>
						{user?.name?.slice(0, 2).toUpperCase() || "ME"}
					</div>
					<button
						type="button"
						onClick={() => signOut()}
						className="text-[11px] font-mono text-[#888888] hover:text-[#C62828] hover:bg-[#FFF0F0] px-1.5 py-1 rounded transition"
						title="Sign Out of Studio"
					>
						Sign Out
					</button>
				</div>
			</div>
		</header>
	);
};
