import type React from "react";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, Plus, Search, X } from "lucide-react";
import { useAuth } from "../../lib/auth/auth.context";
import { isSupabaseConfigured } from "../../lib/supabase/client";
import { BrandMark } from "../ui/BrandMark";
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
	const [showQuickMenu, setShowQuickMenu] = useState(false);
	const quickMenuRef = useRef<HTMLDivElement>(null);
	const isConnected = isSupabaseConfigured();

	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (
				quickMenuRef.current &&
				!quickMenuRef.current.contains(e.target as Node)
			) {
				setShowQuickMenu(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	return (
		<header className="sticky top-0 z-30 studio-topbar flex items-center justify-between px-3 sm:px-4 lg:px-6 h-[54px] select-none gap-2">
			{/* Breadcrumb & mobile toggle */}
			<div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 sm:flex-initial">
				<button
					type="button"
					onClick={onMobileMenuToggle}
					className="lg:hidden p-1.5 rounded-lg text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-sunken)] transition shrink-0"
					aria-label="Open mobile navigation"
				>
					<Menu className="w-4 h-4" />
				</button>

				{/* Mobile Brand Mark */}
				<BrandMark size="sm" showWordmark={false} className="lg:hidden shrink-0" />

				<div className="flex items-center gap-1.5 sm:gap-2 text-[13px] min-w-0">
					<span className="font-semibold text-[var(--ink-muted)] hidden md:inline font-mono">
						STUDIO
					</span>
					<span className="text-[var(--border)] hidden md:inline">/</span>
					<div className="flex items-center gap-1.5 min-w-0">
						<span className="w-2 h-2 rounded-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent-glow)] shrink-0" />
						<h1 className="text-[13px] sm:text-[14px] font-bold text-[var(--ink-strong)] tracking-tight truncate max-w-[130px] sm:max-w-none">
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
						<Search className="w-3.5 h-3.5 text-[var(--ink-muted)] group-hover:text-[var(--accent)] transition shrink-0" />
						<span>Search opportunities, projects, team...</span>
					</span>
					<kbd className="font-mono text-[10px] bg-[var(--surface)] border border-[var(--border)] px-1.5 py-0.5 rounded text-[var(--ink-muted)] shadow-xs">
						⌘K
					</kbd>
				</button>
			</div>

			{/* Right Actions & Profile */}
			<div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
				{/* Reference CRM Module Pill & Branch Selector */}
				<div className="hidden xl:flex items-center gap-2 pr-2 border-r border-[var(--border)]">
					<span className="text-[11px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 font-mono">
						CRM
					</span>
					<div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[var(--border)] bg-[var(--surface-sunken)] text-[11px] text-[var(--ink-strong)] font-medium">
						<span className="text-slate-400">Branch:</span>
						<span>Main Studio</span>
						<ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
					</div>
				</div>

				{/* Theme Selector Toggle */}
				<ThemeToggle showLabel={false} />

				{/* Supabase Engine Status Pill */}
				<div className="relative">
					<button
						type="button"
						onClick={() => setShowSyncInfo((v) => !v)}
						className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-md text-[11px] font-medium border transition cursor-pointer bg-[var(--surface)] border-[var(--border)] hover:border-[var(--border-strong)] shadow-xs"
						title={
							isConnected ? "Database: Supabase Live" : "Database: Local Engine"
						}
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
									className="text-[var(--ink-muted)] hover:text-[var(--ink)] leading-none p-1 rounded hover:bg-[var(--surface-sunken)] transition cursor-pointer"
									aria-label="Close sync info"
								>
									<X className="w-4 h-4" />
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

				{/* Quick Actions (Responsive Dropdown on Mobile + Direct Pills on Desktop) */}
				<div className="relative" ref={quickMenuRef}>
					<button
						type="button"
						onClick={() => setShowQuickMenu(!showQuickMenu)}
						className="inline-flex sm:hidden btn-primary !h-[28px] !w-[28px] !p-0 items-center justify-center !bg-[#1A253C] hover:!bg-[#263554] !text-white rounded-lg shadow-xs cursor-pointer"
						aria-label="Quick Create Menu"
					>
						<Plus className="w-4 h-4" />
					</button>

					{showQuickMenu && (
						<div className="absolute right-0 top-9 w-44 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xl p-1.5 z-50 text-[12px] space-y-0.5 animate-in fade-in">
							<div className="px-2 py-1 text-[10px] font-mono uppercase text-[var(--ink-muted)] font-bold">
								Quick Create
							</div>
							<button
								type="button"
								onClick={() => {
									openModal("opportunity");
									setShowQuickMenu(false);
								}}
								className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[var(--surface-sunken)] text-[var(--ink)] font-medium transition"
							>
								+ Commercial Deal
							</button>
							<button
								type="button"
								onClick={() => {
									openModal("lead");
									setShowQuickMenu(false);
								}}
								className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[var(--surface-sunken)] text-[var(--ink)] font-medium transition"
							>
								+ Pipeline Lead
							</button>
							<button
								type="button"
								onClick={() => {
									openModal("project");
									setShowQuickMenu(false);
								}}
								className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[var(--surface-sunken)] text-[var(--ink)] font-medium transition"
							>
								+ Delivery Project
							</button>
							<button
								type="button"
								onClick={() => {
									openModal("finance");
									setShowQuickMenu(false);
								}}
								className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[var(--surface-sunken)] text-[var(--ink)] font-medium transition"
							>
								+ Sales Invoice
							</button>
						</div>
					)}
				</div>

				<button
					type="button"
					onClick={() => openModal("lead")}
					className="hidden sm:inline-flex btn-secondary !h-[28px] !text-[12px] !px-2.5 cursor-pointer"
				>
					+ Lead
				</button>
				<button
					type="button"
					onClick={() => openModal("opportunity")}
					className="hidden md:inline-flex btn-primary !h-[28px] !text-[12px] !px-3 !bg-[#1A253C] hover:!bg-[#263554] !text-white cursor-pointer shadow-xs"
				>
					+ Deal
				</button>
				<button
					type="button"
					onClick={() => openModal("project")}
					className="hidden lg:inline-flex btn-secondary !h-[28px] !text-[12px] !px-2.5 cursor-pointer"
				>
					+ Project
				</button>

				{/* User Avatar, Role & Signout */}
				<div className="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-2 border-l border-[var(--border)]">
					<span className="hidden sm:inline-block text-[10px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded bg-[var(--surface-sunken)] text-[var(--ink-muted)] border border-[var(--border)]">
						{role}
					</span>
					<div
						className="w-7 h-7 rounded-full bg-[#EA580C] text-white flex items-center justify-center font-bold text-[11px] font-mono shadow-xs shrink-0 ring-2 ring-orange-200 dark:ring-orange-900"
						title={user?.email || user?.name || "User"}
					>
						{user?.name?.slice(0, 2).toUpperCase() || "KR"}
					</div>
					<button
						type="button"
						onClick={() => signOut()}
						className="text-[11px] font-mono text-[var(--ink-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger-bg)] px-1 sm:px-1.5 py-1 rounded transition"
						title="Sign Out of Studio"
					>
						Exit
					</button>
				</div>
			</div>
		</header>
	);
};
