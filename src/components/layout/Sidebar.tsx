import type React from "react";
import { useEffect, useState } from "react";
import {
	Archive,
	ArrowRightLeft,
	Building2,
	CheckCircle2,
	CheckSquare,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	FileText,
	FolderKanban,
	Grid,
	LayoutDashboard,
	type LucideIcon,
	Settings,
	Target,
	UserCheck,
	Users,
	X,
	Zap,
} from "lucide-react";
import { formatHour } from "../../lib/constants/agency";
import type { Department } from "../../types";
import { BrandMark } from "../ui/BrandMark";
import { ThemeToggle } from "../ui/ThemeToggle";

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

interface NavItem {
	id: string;
	label: string;
	icon: LucideIcon;
	badge?: number | null;
}

interface NavGroup {
	id: string;
	label: string;
	icon: LucideIcon;
	children: NavItem[];
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
	// Accordion state: track which groups are expanded
	const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
		{
			sales: true,
			delivery: true,
			finance: true,
			governance: false,
			system: false,
		},
	);

	// Ensure the parent group of the currently active view is expanded
	useEffect(() => {
		if (["pipeline", "opportunities", "clients", "contacts"].includes(view)) {
			setExpandedGroups((prev) => ({ ...prev, sales: true }));
		} else if (["projects", "tasks", "handoffs"].includes(view)) {
			setExpandedGroups((prev) => ({ ...prev, delivery: true }));
		} else if (["finance"].includes(view)) {
			setExpandedGroups((prev) => ({ ...prev, finance: true }));
		} else if (["team", "approvals", "raci"].includes(view)) {
			setExpandedGroups((prev) => ({ ...prev, governance: true }));
		} else if (["archive", "settings"].includes(view)) {
			setExpandedGroups((prev) => ({ ...prev, system: true }));
		}
	}, [view]);

	const toggleGroup = (groupId: string) => {
		setExpandedGroups((prev) => ({
			...prev,
			[groupId]: !prev[groupId],
		}));
	};

	const navGroups: NavGroup[] = [
		{
			id: "sales",
			label: "Sales & Deals",
			icon: Target,
			children: [
				{
					id: "pipeline",
					label: "Sales Pipeline",
					icon: Target,
					badge: leadsCount,
				},
				{
					id: "opportunities",
					label: "Commercial Deals",
					icon: Zap,
					badge: opportunitiesCount || null,
				},
				{
					id: "clients",
					label: "Client Accounts",
					icon: Building2,
				},
				{
					id: "contacts",
					label: "Key Contacts",
					icon: Users,
					badge: contactsCount || null,
				},
			],
		},
		{
			id: "delivery",
			label: "Delivery & Projects",
			icon: FolderKanban,
			children: [
				{
					id: "projects",
					label: "Projects & Cockpit",
					icon: FolderKanban,
					badge: projectsCount,
				},
				{
					id: "tasks",
					label: "Tasks Masterboard",
					icon: CheckSquare,
					badge: tasksCount || null,
				},
				{
					id: "handoffs",
					label: "Handoff Transit",
					icon: ArrowRightLeft,
					badge: pendingHandoffsCount || null,
				},
			],
		},
		{
			id: "finance",
			label: "Finance & Accounting",
			icon: FileText,
			children: [
				{
					id: "finance",
					label: "Sales Invoices & Reports",
					icon: FileText,
					badge: financeCount || null,
				},
			],
		},
		{
			id: "governance",
			label: "Governance & Team",
			icon: UserCheck,
			children: [
				{ id: "team", label: "Team & Capacity", icon: Users },
				{
					id: "approvals",
					label: "Approval Center",
					icon: CheckCircle2,
					badge: pendingApprovalsCount || null,
				},
				{ id: "raci", label: "RACI Governance", icon: Grid },
			],
		},
		{
			id: "system",
			label: "System & Settings",
			icon: Settings,
			children: [
				{
					id: "archive",
					label: "Recycle & Archive",
					icon: Archive,
					badge: archiveCount || null,
				},
				{ id: "settings", label: "Settings & Storage", icon: Settings },
			],
		},
	];

	const renderNavContent = (isMobile = false) => (
		<div className="flex flex-col justify-between h-full">
			<div>
				{/* Top Branding Section */}
				<div className="flex items-center justify-between px-2.5 py-3 mb-2 border-b border-[var(--nav-border)]">
					<BrandMark
						size="md"
						showWordmark={!collapsed || isMobile}
						subtitle="AgencyOS Studio"
					/>

					{isMobile ? (
						<button
							type="button"
							onClick={onCloseMobile}
							className="text-slate-500 hover:text-slate-900 dark:hover:text-white p-1 text-[20px] leading-none cursor-pointer"
							aria-label="Close menu"
						>
							<X className="w-5 h-5" />
						</button>
					) : (
						<button
							type="button"
							onClick={() => setCollapsed(!collapsed)}
							className="text-slate-500 hover:text-[#1A253C] dark:hover:text-white p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
							title="Toggle sidebar (⌘B)"
							aria-label="Toggle sidebar"
						>
							{collapsed ? (
								<ChevronRight className="w-4 h-4" />
							) : (
								<ChevronLeft className="w-4 h-4" />
							)}
						</button>
					)}
				</div>

				{/* Primary Navigation Rail */}
				<nav className="space-y-1.5 mt-2 overflow-y-auto max-h-[calc(100vh-210px)] pr-1 custom-scroll">
					{/* Top-Level Direct Dashboard Item (Matching Reference) */}
					<button
						type="button"
						data-nav="overview"
						onClick={() => {
							setView("overview");
							if (isMobile) onCloseMobile?.();
						}}
						className={`w-full nav-link justify-between ${
							view === "overview" ? "active" : ""
						}`}
					>
						<div className="flex items-center gap-2.5 min-w-0">
							<LayoutDashboard className="w-4 h-4 shrink-0" strokeWidth={1.8} />
							{(!collapsed || isMobile) && (
								<span className="truncate text-[13px] font-medium">
									Dashboard
								</span>
							)}
						</div>
					</button>

					{/* Expandable Navigation Groups */}
					{navGroups.map((group) => {
						const isExpanded = Boolean(expandedGroups[group.id]);
						const isGroupActive = group.children.some((c) => c.id === view);
						const GroupIcon = group.icon;

						return (
							<div key={group.id} className="space-y-0.5 pt-1">
								{/* Group Header Row */}
								{!collapsed || isMobile ? (
									<button
										type="button"
										onClick={() => toggleGroup(group.id)}
										className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[12px] font-semibold transition cursor-pointer select-none ${
											isGroupActive && !isExpanded
												? "bg-[#1A253C] text-white shadow-xs"
												: "text-slate-700 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5"
										}`}
									>
										<div className="flex items-center gap-2 min-w-0">
											<GroupIcon className="w-3.5 h-3.5 shrink-0 opacity-80" strokeWidth={1.8} />
											<span className="truncate">{group.label}</span>
										</div>
										<ChevronDown
											className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
												isExpanded ? "rotate-180" : ""
											}`}
										/>
									</button>
								) : null}

								{/* Group Children (Indented nested items) */}
								{((isExpanded && !collapsed) || isMobile) && (
									<div className="space-y-0.5 pl-2 mt-0.5 border-l border-slate-300/60 dark:border-slate-700/60 ml-3">
										{group.children.map((item) => {
											const active = view === item.id;
											const ItemIcon = item.icon;

											return (
												<button
													key={item.id}
													type="button"
													data-nav={item.id}
													onClick={() => {
														setView(item.id);
														if (isMobile) onCloseMobile?.();
													}}
													className={`w-full nav-sublink justify-between ${
														active ? "active" : ""
													}`}
												>
													<div className="flex items-center gap-2 min-w-0">
														<ItemIcon className="w-3.5 h-3.5 shrink-0 opacity-80" strokeWidth={1.8} />
														<span className="truncate text-[12.5px]">
															{item.label}
														</span>
													</div>
													{item.badge !== undefined && item.badge !== null && (
														<span
															className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-semibold ${
																active
																	? "bg-white/20 text-white"
																	: "bg-white/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
															}`}
														>
															{item.badge}
														</span>
													)}
												</button>
											);
										})}
									</div>
								)}

								{/* Collapsed Icon-Only Mode */}
								{collapsed && !isMobile && (
									<div className="space-y-1">
										{group.children.map((item) => {
											const active = view === item.id;
											const ItemIcon = item.icon;

											return (
												<button
													key={item.id}
													type="button"
													data-nav={item.id}
													onClick={() => setView(item.id)}
													title={item.label}
													className={`w-full h-9 flex items-center justify-center rounded-lg transition ${
														active
															? "bg-[#1A253C] text-white shadow-xs"
															: "text-slate-700 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10"
													}`}
												>
													<ItemIcon className="w-4 h-4" strokeWidth={1.8} />
												</button>
											);
										})}
									</div>
								)}
							</div>
						);
					})}
				</nav>
			</div>

			{/* Bottom Status & Schedule Footer */}
			<div className="pt-2 border-t border-[var(--nav-border)]">
				{(!collapsed || isMobile) && (
					<div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-[var(--nav-border)] text-[11px] mb-2 shadow-2xs">
						<div className="flex items-center justify-between text-slate-800 dark:text-slate-200 mb-1">
							<span className="flex items-center gap-1.5 font-semibold">
								<span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
								IST Operation
							</span>
							<span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
								{formatHour(istHour)}
							</span>
						</div>
						<div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
							<span>Active Duty:</span>
							<span className="font-mono text-slate-900 dark:text-slate-100 font-bold">
								{onlineCount} Specialists
							</span>
						</div>
					</div>
				)}

				<div className="flex items-center justify-between">
					<ThemeToggle showLabel={!collapsed || isMobile} />
				</div>
			</div>
		</div>
	);

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
						{renderNavContent(true)}
					</div>
				</div>
			)}

			{/* Desktop Landscape Sidebar Rail (Pale Lavender-Blue #DDE6F5) */}
			<aside
				className={`hidden lg:flex shrink-0 flex-col sticky top-0 h-screen transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] studio-sidebar z-40 select-none ${
					collapsed ? "w-[68px]" : "w-[250px]"
				}`}
			>
				<div className="h-full flex flex-col justify-between p-3">
					{renderNavContent(false)}
				</div>
			</aside>
		</>
	);
};
