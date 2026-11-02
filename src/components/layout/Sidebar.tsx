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
	tasksCount?: number;
	opportunitiesCount?: number;
	contactsCount?: number;
	financeCount?: number;
	archiveCount?: number;
	mobileOpen?: boolean;
	onCloseMobile?: () => void;
}

interface NavSection {
	title: string;
	items: {
		id: string;
		label: string;
		icon: string;
		badge?: number | null;
	}[];
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
	tasksCount,
	opportunitiesCount,
	contactsCount,
	financeCount,
	archiveCount,
	mobileOpen = false,
	onCloseMobile,
}) => {
	const sections: NavSection[] = [
		{
			title: "Studio",
			items: [{ id: "overview", label: "Command Center", icon: "❖" }],
		},
		{
			title: "Growth",
			items: [
				{
					id: "pipeline",
					label: "Sales Pipeline",
					icon: "⚑",
					badge: leadsCount,
				},
				{
					id: "opportunities",
					label: "Commercial Deals",
					icon: "⚡",
					badge: opportunitiesCount || null,
				},
				{ id: "clients", label: "Client Accounts", icon: "◈" },
				{
					id: "contacts",
					label: "Key Contacts",
					icon: "👤",
					badge: contactsCount || null,
				},
				{
					id: "finance",
					label: "Invoices & Proposals",
					icon: "📑",
					badge: financeCount || null,
				},
			],
		},
		{
			title: "Delivery",
			items: [
				{
					id: "projects",
					label: "Projects & Cockpit",
					icon: "◼",
					badge: projectsCount,
				},
				{
					id: "tasks",
					label: "Tasks Masterboard",
					icon: "☑",
					badge: tasksCount || null,
				},
				{
					id: "handoffs",
					label: "Handoff Transit",
					icon: "↳",
					badge: pendingHandoffsCount || null,
				},
			],
		},
		{
			title: "People & Governance",
			items: [
				{ id: "team", label: "Team & Capacity", icon: "👥" },
				{
					id: "approvals",
					label: "Approval Center",
					icon: "✓",
					badge: pendingApprovalsCount || null,
				},
				{ id: "raci", label: "RACI Governance", icon: "▦" },
			],
		},
		{
			title: "System",
			items: [
				{
					id: "archive",
					label: "Recycle & Archive",
					icon: "♻",
					badge: archiveCount || null,
				},
				{ id: "settings", label: "Settings & Storage", icon: "⚙" },
			],
		},
	];

	return (
		<>
			{/* Mobile Drawer Slide-over */}
			{mobileOpen && (
				<div
					className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs lg:hidden animate-in fade-in"
					onClick={onCloseMobile}
				>
					<div
						className="w-[280px] h-full studio-sidebar p-3 flex flex-col justify-between shadow-2xl"
						onClick={(e) => e.stopPropagation()}
					>
						<div>
							<div className="flex items-center justify-between px-2 py-2 mb-2 border-b border-white/[0.08]">
								<div className="flex items-center gap-2.5">
									<div className="w-8 h-8 rounded-lg bg-[#49B3FC] text-slate-950 flex items-center justify-center font-bold text-[14px]">
										K
									</div>
									<div>
										<div className="text-[14px] font-bold tracking-tight text-white leading-none">
											KREATIWIT
										</div>
										<div className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-wider">
											AgencyOS Studio
										</div>
									</div>
								</div>
								<button
									type="button"
									onClick={onCloseMobile}
									className="text-slate-400 hover:text-white p-1 text-[18px] leading-none"
									aria-label="Close menu"
								>
									×
								</button>
							</div>

							<nav className="space-y-4 mt-3 overflow-y-auto max-h-[calc(100vh-180px)] pr-1">
								{sections.map((section) => (
									<div key={section.title}>
										<div className="nav-section-title">{section.title}</div>
										<div className="space-y-0.5">
											{section.items.map((item) => {
												const active = view === item.id;
												return (
													<button
														key={item.id}
														type="button"
														onClick={() => {
															setView(item.id);
															onCloseMobile?.();
														}}
														className={`w-full nav-link justify-between ${active ? "active" : ""}`}
													>
														<div className="flex items-center gap-2.5 min-w-0">
															<span
																className={`text-[13px] font-mono shrink-0 ${active ? "text-[#49B3FC]" : "opacity-75"}`}
															>
																{item.icon}
															</span>
															<span className="truncate text-[13px]">
																{item.label}
															</span>
														</div>
														{item.badge !== undefined &&
															item.badge !== null && (
																<span
																	className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-semibold ${
																		active
																			? "bg-[#49B3FC] text-slate-950"
																			: "bg-white/[0.1] text-slate-300"
																	}`}
																>
																	{item.badge}
																</span>
															)}
													</button>
												);
											})}
										</div>
									</div>
								))}
							</nav>
						</div>

						<div className="pt-3 border-t border-white/[0.08]">
							<div className="p-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[11px]">
								<div className="flex items-center justify-between text-slate-300 mb-1">
									<span className="flex items-center gap-1.5 font-medium">
										<span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
										IST Operation
									</span>
									<span className="font-mono text-emerald-400 font-semibold">
										{formatHour(istHour)}
									</span>
								</div>
								<div className="text-[10px] text-slate-400 flex items-center justify-between">
									<span>Scheduled On-Duty:</span>
									<span className="font-mono text-white font-medium">
										{onlineCount} Specialists
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}

			<aside
				className={`hidden lg:flex shrink-0 flex-col sticky top-0 h-screen transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] studio-sidebar z-40 select-none ${
					collapsed ? "w-[68px]" : "w-[260px]"
				}`}
			>
				<div className="h-full flex flex-col justify-between p-3">
					{/* Top Area: Logo & Collapse Trigger */}
					<div>
						{/* Brand Header */}
						<div className="flex items-center justify-between px-2 py-2 mb-2 border-b border-white/[0.08]">
							<div className="flex items-center gap-2.5 min-w-0">
								<div className="w-8 h-8 rounded-lg bg-[#49B3FC] text-slate-950 flex items-center justify-center font-bold text-[14px] shrink-0 shadow-[0_0_12px_rgba(73,179,252,0.35)]">
									K
								</div>
								{!collapsed && (
									<div className="min-w-0">
										<div className="text-[14px] font-bold tracking-tight text-white leading-none">
											KREATIWIT
										</div>
										<div className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-wider">
											AgencyOS Studio
										</div>
									</div>
								)}
							</div>

							<button
								type="button"
								onClick={() => setCollapsed(!collapsed)}
								className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-white/[0.06] text-[11px] font-mono transition"
								title="Toggle sidebar (⌘B)"
								aria-label="Toggle sidebar"
							>
								{collapsed ? "»" : "«"}
							</button>
						</div>

						{/* Navigation Groups */}
						<nav className="space-y-4 mt-3 overflow-y-auto max-h-[calc(100vh-220px)] pr-1">
							{sections.map((section) => (
								<div key={section.title}>
									{!collapsed && (
										<div className="nav-section-title">{section.title}</div>
									)}
									<div className="space-y-0.5">
										{section.items.map((item) => {
											const active = view === item.id;
											return (
												<button
													key={item.id}
													type="button"
													onClick={() => setView(item.id)}
													className={`w-full nav-link ${active ? "active" : ""} ${
														collapsed
															? "justify-center !px-0"
															: "justify-between"
													}`}
													title={collapsed ? item.label : undefined}
												>
													<div className="flex items-center gap-2.5 min-w-0">
														<span
															className={`text-[13px] font-mono shrink-0 ${active ? "text-[#49B3FC]" : "opacity-75"}`}
														>
															{item.icon}
														</span>
														{!collapsed && (
															<span className="truncate text-[13px]">
																{item.label}
															</span>
														)}
													</div>
													{!collapsed &&
														item.badge !== undefined &&
														item.badge !== null && (
															<span
																className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-semibold ${
																	active
																		? "bg-[#49B3FC] text-slate-950"
																		: "bg-white/[0.1] text-slate-300"
																}`}
															>
																{item.badge}
															</span>
														)}
												</button>
											);
										})}
									</div>
								</div>
							))}
						</nav>
					</div>

					{/* Bottom Area: Operational IST Clock & Department Presence */}
					<div className="pt-3 border-t border-white/[0.08] space-y-2">
						{!collapsed ? (
							<div className="p-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[11px]">
								<div className="flex items-center justify-between text-slate-300 mb-1">
									<span className="flex items-center gap-1.5 font-medium">
										<span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
										IST Operation
									</span>
									<span className="font-mono text-emerald-400 font-semibold">
										{formatHour(istHour)}
									</span>
								</div>
								<div className="text-[10px] text-slate-400 flex items-center justify-between">
									<span>Scheduled On-Duty:</span>
									<span className="font-mono text-white font-medium">
										{onlineCount} Specialists
									</span>
								</div>
							</div>
						) : (
							<div
								className="flex justify-center p-1.5"
								title={`IST: ${formatHour(istHour)} • ${onlineCount} Specialists Scheduled`}
							>
								<span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
							</div>
						)}
					</div>
				</div>
			</aside>
		</>
	);
};
