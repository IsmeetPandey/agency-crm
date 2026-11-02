import type React from "react";
import { useState } from "react";
import { useAuth } from "../../lib/auth/auth.context";
import { isSupabaseConfigured } from "../../lib/supabase/client";
import { ThemeToggle } from "../ui/ThemeToggle";

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
					className="lg:hidden p-1.5 rounded-lg text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-sunken)] transition"
					aria-label="Open mobile navigation"
				>
					☰
				</button>
				<div className="flex items-center gap-2 text-[13px]">
					<span className="font-semibold text-[var(--ink-muted)] hidden sm:inline font-mono">
						STUDIO
					</span>
					<span className="text-[var(--border)] hidden sm:inline">/</span>
					<div className="flex items-center gap-2">
						<span className="w-2 h-2 rounded-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent-glow)]" />
						<h1 className="text-[14px] font-bold text-[var(--ink-strong)] tracking-tight truncate">
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
					className="w-full flex items-center justify-between px-3 py-1.5 rounded-md bg-[var(--surface-sunken)] hover:bg-[var(--surface-raised)] border border-[var(--border)] text-[12px] text-[var(--ink-muted)] transition group"
				>
					<span className="flex items-center gap-2">
						<span className="text-[var(--ink-muted)] group-hover:text-[var(--accent)] transition">
							🔍
						</span>
						<span>Search opportunities, projects, team...</span>
					</span>
					<kbd className="font-mono text-[10px] bg-[var(--surface)] border border-[var(--border)] px-1.5 py-0.5 rounded text-[var(--ink-muted)] shadow-xs">
						⌘K
					</kbd>
				</button>
			</div>

			{/* Right Actions & Profile */}
			<div className="flex items-center gap-2 sm:gap-2.5">
				{/* Theme Selector Toggle */}
				<ThemeToggle showLabel />

				{/* Supabase Engine Status Pill */}
				<div className="relative">
					<button
						type="button"
						onClick={() => setShowSyncInfo((v) => !v)}
						className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border transition cursor-pointer bg-[var(--surface)] border-[var(--border)] hover:border-[var(--border-strong)] shadow-xs"
					>
						<span
							className={`w-2 h-2 rounded-full ${
								isConnected
									? "bg-[#16834A] shadow-[0_0_6px_rgba(22,131,74,0.7)]"
									: "bg-[#A96500] shadow-[0_0_6px_rgba(169,101,0,0.7)]"
							}`}
						/>
						<span className="hidden sm:inline text-[var(--ink)] font-mono">
							{isConnected ? "Supabase Live" : "Local Engine"}
						</span>
					</button>

					{showSyncInfo && (
						<div className="absolute right-0 top-10 w-80 p-4 studio-modal shadow-lg z-50 text-left space-y-3 border border-[var(--border)] animate-in fade-in">
							<div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
								<span className="text-[12px] font-bold text-[var(--ink-strong)] tracking-tight">
									Infrastructure & Persistence
								</span>
								<button
									type="button"
									onClick={() => setShowSyncInfo(false)}
									className="text-[var(--ink-muted)] text-[14px] hover:text-[var(--ink)] leading-none"
								>
									×
								</button>
							</div>

							<div className="space-y-2 text-[11px]">
								<div className="flex justify-between">
									<span className="text-[var(--ink-muted)]">
										Database Engine:
									</span>
									<span
										className={`font-mono font-semibold ${isConnected ? "text-[#16834A]" : "text-[#A96500]"}`}
									>
										{isConnected
											? "Supabase PostgreSQL"
											: "Local Offline Engine"}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-[var(--ink-muted)]">
										Security Layer:
									</span>
									<span className="text-[var(--ink)] font-medium font-mono">
										{isConnected
											? "Row-Level Security (RLS)"
											: "Client RBAC Enforcement"}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-[var(--ink-muted)]">
										Storage Integrity:
									</span>
									<span className="text-[var(--success-text)] font-medium">
										Zero-Loss Guaranteed
									</span>
								</div>
							</div>

							<p className="text-[11px] text-[var(--ink-muted)] leading-relaxed pt-2 border-t border-[var(--border)]">
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
					onClick={() => openModal("opportunity")}
					className="hidden md:inline-flex btn-primary !bg-[var(--accent-secondary)] !h-[28px] !text-[12px] !px-2.5"
				>
					+ Deal
				</button>
				<button
					type="button"
					onClick={() => openModal("project")}
					className="hidden sm:inline-flex btn-secondary !h-[28px] !text-[12px] !px-2.5"
				>
					+ Project
				</button>

				{/* User Avatar, Role & Signout */}
				<div className="flex items-center gap-2 pl-2 border-l border-[var(--border)]">
					<span className="text-[10px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded bg-[var(--surface-sunken)] text-[var(--ink-muted)] border border-[var(--border)]">
						{role}
					</span>
					<div
						className="w-7 h-7 rounded-full bg-[var(--surface-raised)] text-[var(--accent)] border border-[var(--border)] flex items-center justify-center font-bold text-[11px] font-mono shadow-xs"
						title={user?.email || user?.name || "User"}
					>
						{user?.name?.slice(0, 2).toUpperCase() || "ME"}
					</div>
					<button
						type="button"
						onClick={() => signOut()}
						className="text-[11px] font-mono text-[var(--ink-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger-bg)] px-1.5 py-1 rounded transition"
						title="Sign Out of Studio"
					>
						Exit
					</button>
				</div>
			</div>
		</header>
	);
};
