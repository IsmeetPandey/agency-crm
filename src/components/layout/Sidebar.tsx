import type React from "react";
import { formatHour } from "../../lib/constants/agency";
import type { Department } from "../../types";

interface SidebarProps {
	view: string;
	setView: (view: string) => void;
	collapsed: boolean;
	setCollapsed: (collapsed: boolean) => void;
	leadsCount: number;
	projectsCount: number;
	pendingApprovalsCount: number;
	pendingHandoffsCount: number;
	onlineCount: number;
	istHour: number;
	departments: Department[];
}

export const Sidebar: React.FC<SidebarProps> = ({
	view,
	setView,
	collapsed,
	setCollapsed,
	leadsCount,
	projectsCount,
	pendingApprovalsCount,
	pendingHandoffsCount,
	onlineCount,
	istHour,
	departments,
}) => {
	const navItems = [
		{ id: "overview", label: "Agency Overview", icon: "✦", badge: null },
		{ id: "pipeline", label: "Sales Pipeline", icon: "❖", badge: leadsCount },
		{ id: "clients", label: "Clients", icon: "⚑", badge: null },
		{ id: "projects", label: "Projects", icon: "◼", badge: projectsCount },
		{
			id: "handoffs",
			label: "Handoffs",
			icon: "↳",
			badge: pendingHandoffsCount || null,
		},
		{
			id: "approvals",
			label: "Approval Center",
			icon: "✓",
			badge: pendingApprovalsCount || null,
		},
		{ id: "team", label: "Team & Capacity", icon: "◐", badge: null },
		{ id: "raci", label: "RACI Matrix", icon: "▦", badge: null },
		{ id: "settings", label: "Settings & Data", icon: "⚙", badge: null },
	];

	return (
		<aside
			className={`hidden lg:flex shrink-0 flex-col sticky h-screen overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
				collapsed ? "w-[72px]" : "w-[280px]"
			}`}
			style={{ top: "var(--safe-area-inset-top, 0px)" }}
		>
			<div className="liquid-sidebar h-full flex flex-col justify-between p-3.5">
				<div>
					{/* Header & macOS Traffic Lights */}
					<div className="flex items-center justify-between px-2 py-2 mb-3">
						<div className="flex items-center gap-2">
							<span className="traffic bg-[#FF5F56] border-[#E0443E]" />
							<span className="traffic bg-[#FFBD2E] border-[#DEA123]" />
							<span className="traffic bg-[#27C93F] border-[#1AAB29]" />
						</div>
						<button
							type="button"
							onClick={() => setCollapsed(!collapsed)}
							className="text-[#86868B] hover:text-[#1D1D1F] p-1 rounded-md hover:bg-black/[0.04] text-[11px] font-mono transition"
							title="Toggle sidebar (⌘B)"
						>
							⌘B
						</button>
					</div>

					{/* Agency Branding */}
					<div className="px-2 mb-4">
						<div className="flex items-center gap-2.5">
							<div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-[#6D28D9] to-[#007AFF] text-white flex items-center justify-center font-[700] text-[13px] shadow-[0_2px_8px_rgba(109,40,217,0.3)]">
								K
							</div>
							{!collapsed && (
								<div>
									<div className="text-[14px] font-[700] tracking-[-0.015em] text-[#1D1D1F] leading-tight">
										Kreatiwit
									</div>
									<div className="text-[11px] font-[500] text-[#86868B]">
										AgencyOS • Liquid Glass
									</div>
								</div>
							)}
						</div>
					</div>

					{/* Navigation Items */}
					<nav className="space-y-1">
						{navItems.map((item) => {
							const active = view === item.id;
							return (
								<button
									key={item.id}
									type="button"
									onClick={() => setView(item.id)}
									className={`nav-item ${active ? "active" : "text-[#1D1D1F]/80"} ${
										collapsed ? "justify-center !px-0" : "justify-between"
									}`}
									title={collapsed ? item.label : undefined}
								>
									<div className="flex items-center gap-2.5 min-w-0">
										<span className="text-[13px] w-4 text-center font-mono opacity-80">
											{item.icon}
										</span>
										{!collapsed && (
											<span className="truncate text-[13px] font-[500]">
												{item.label}
											</span>
										)}
									</div>
									{!collapsed && item.badge !== null && (
										<span
											className={`text-[10px] px-1.5 py-0.2 rounded-full font-[600] ${
												active
													? "bg-[#007AFF] text-white"
													: "bg-black/[0.05] text-[#86868B]"
											}`}
										>
											{item.badge}
										</span>
									)}
								</button>
							);
						})}
					</nav>

					{/* Departments Mini Directory */}
					{!collapsed && (
						<div className="mt-6 pt-4 border-t border-black/[0.06] px-2">
							<div className="text-[10px] font-[600] tracking-[0.05em] uppercase text-[#86868B] mb-2">
								Departments
							</div>
							<div className="space-y-1">
								{departments.slice(0, 6).map((dept) => (
									<div
										key={dept.id}
										className="flex items-center justify-between text-[11px] text-[#86868B] py-0.5"
									>
										<span className="flex items-center gap-1.5 truncate">
											<span
												className="w-1.5 h-1.5 rounded-full shrink-0"
												style={{ backgroundColor: dept.dot }}
											/>
											{dept.code}
										</span>
										<span className="text-[10px] opacity-70">
											{dept.members.length}
										</span>
									</div>
								))}
							</div>
						</div>
					)}
				</div>

				{/* Live IST Status & Online counter */}
				<div className="pt-3 border-t border-black/[0.06] px-2">
					{!collapsed ? (
						<div className="flex items-center justify-between text-[11px] font-[500] text-[#86868B]">
							<span className="flex items-center gap-1.5">
								<span className="w-2 h-2 rounded-full bg-[#30D158] animate-pulse" />
								{onlineCount} online now
							</span>
							<span className="font-mono text-[10px]">
								{formatHour(Math.floor(istHour))} IST
							</span>
						</div>
					) : (
						<div className="flex justify-center">
							<span
								className="w-2.5 h-2.5 rounded-full bg-[#30D158]"
								title={`${onlineCount} online`}
							/>
						</div>
					)}
				</div>
			</div>
		</aside>
	);
};
