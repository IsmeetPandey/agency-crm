import type React from "react";
import { useMemo } from "react";
import {
	Area,
	AreaChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { Zap } from "lucide-react";
import { PastelKpiCard } from "../../components/ui/PastelKpiCard";
import {
	formatHour,
	isMemberOnline,
	STAGE_META,
	STAGES,
} from "../../lib/constants/agency";
import type {
	Activity,
	ApprovalRequest,
	Client,
	Department,
	Handoff,
	Lead,
	Project,
	Task,
	TeamMemberDetail,
} from "../../types";

interface DashboardOverviewProps {
	leads: Lead[];
	clients: Client[];
	projects: Project[];
	tasks: Task[];
	handoffs: Handoff[];
	team: TeamMemberDetail[];
	activity: Activity[];
	approvals: ApprovalRequest[];
	istHour: number;
	departments: Department[];
	onNavigate: (view: string, projectId?: string) => void;
	onOpenModal: (type: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
	leads,
	clients,
	projects,
	tasks,
	handoffs,
	team,
	activity,
	approvals,
	istHour,
	departments,
	onNavigate,
	onOpenModal,
}) => {
	// Active Pipeline Volume (excluding Won & Lost)
	const activeLeads = useMemo(
		() => leads.filter((l) => !["Won", "Lost"].includes(l.stage)),
		[leads],
	);

	const pipelineValue = useMemo(
		() => activeLeads.reduce((sum, l) => sum + (Number(l.value) || 0), 0),
		[activeLeads],
	);

	// Won Contract Revenue
	const wonLeads = useMemo(
		() => leads.filter((l) => l.stage === "Won"),
		[leads],
	);
	const wonValue = useMemo(
		() => wonLeads.reduce((sum, l) => sum + (Number(l.value) || 0), 0),
		[wonLeads],
	);

	// Active Projects
	const activeProjects = useMemo(
		() =>
			projects.filter(
				(p) => p.status !== "completed" && p.status !== "archived",
			),
		[projects],
	);

	// Deliverable Tasks Breakdown
	const tasksByStatus = useMemo(() => {
		return {
			todo: tasks.filter((t) => t.status === "Todo").length,
			inProgress: tasks.filter((t) => t.status === "In progress").length,
			blocked: tasks.filter((t) => t.status === "Blocked").length,
			completed: tasks.filter((t) => t.status === "Completed").length,
		};
	}, [tasks]);

	// Pending Items
	const pendingApprovals = useMemo(
		() => approvals.filter((a) => a.status === "Pending"),
		[approvals],
	);

	const pendingHandoffs = useMemo(
		() => handoffs.filter((h) => h.status === "Pending"),
		[handoffs],
	);

	// Scheduled Team Availability (IST)
	const onlineMembers = useMemo(
		() => team.filter((m) => isMemberOnline(m, istHour)),
		[team, istHour],
	);

	const totalCapacityHours = useMemo(
		() => team.reduce((s, m) => s + m.avail, 0),
		[team],
	);
	const totalFocusHours = useMemo(
		() => team.reduce((s, m) => s + m.focus, 0),
		[team],
	);

	// Pipeline Stage Distribution
	const stageDistribution = useMemo(() => {
		return STAGES.map((st) => {
			const stageLeads = leads.filter((l) => l.stage === st);
			const val = stageLeads.reduce(
				(acc, l) => acc + (Number(l.value) || 0),
				0,
			);
			return {
				stage: st,
				count: stageLeads.length,
				value: Math.round(val / 1000), // in ₹k
			};
		});
	}, [leads]);

	return (
		<div className="space-y-6">
			{/* Reference ERP Workspace Header */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
				<div className="space-y-1">
					<div className="flex items-center gap-2">
						<span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
						<span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
							Active Operations Window • IST {formatHour(istHour)}
						</span>
					</div>
					<h2 className="text-[20px] font-extrabold tracking-tight text-slate-900 dark:text-white">
						Operations Dashboard & Command Center
					</h2>
					<p className="text-[13px] text-slate-500 dark:text-slate-400">
						{activeProjects.length} active delivery projects •{" "}
						{activeLeads.length} pipeline opportunities • {onlineMembers.length}{" "}
						specialists scheduled on-duty
					</p>
				</div>

				<div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
					<button
						type="button"
						onClick={() => onOpenModal("opportunity")}
						className="btn-primary !h-[34px] !text-[12px] !px-3.5 justify-center text-center whitespace-nowrap !bg-[#1A253C] hover:!bg-[#263554] !text-white"
					>
						+ Deal
					</button>
					<button
						type="button"
						onClick={() => onOpenModal("lead")}
						className="btn-secondary !h-[34px] !text-[12px] !px-3.5 justify-center text-center !bg-slate-100 hover:!bg-slate-200 dark:!bg-slate-800 dark:hover:!bg-slate-700 !text-slate-800 dark:!text-slate-200 !border-slate-200 dark:!border-slate-700"
					>
						+ Lead
					</button>
					<button
						type="button"
						onClick={() => onOpenModal("project")}
						className="btn-secondary !h-[34px] !text-[12px] !px-3.5 justify-center text-center !bg-slate-100 hover:!bg-slate-200 dark:!bg-slate-800 dark:hover:!bg-slate-700 !text-slate-800 dark:!text-slate-200 !border-slate-200 dark:!border-slate-700"
					>
						+ Project
					</button>
					<button
						type="button"
						onClick={() => onOpenModal("task")}
						className="btn-secondary !h-[34px] !text-[12px] !px-3.5 justify-center text-center !bg-slate-100 hover:!bg-slate-200 dark:!bg-slate-800 dark:hover:!bg-slate-700 !text-slate-800 dark:!text-slate-200 !border-slate-200 dark:!border-slate-700"
					>
						+ Deliverable
					</button>
				</div>
			</div>

			{/* 4 Pastel Summary KPI Cards (Reference Matching) */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				{/* 1. Mint Green: Total Clients */}
				<PastelKpiCard
					title="Total Clients"
					value={clients.length}
					color="green"
					caption={`${clients.filter((c) => c.status === "active").length || clients.length} active enterprise accounts`}
					progressPercent={Math.min(
						100,
						Math.max(30, Math.round((clients.length / 25) * 100)),
					)}
					icon={
						<svg
							className="w-4 h-4"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							role="img"
							aria-label="Clients Icon"
						>
							<title>Clients</title>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
							/>
						</svg>
					}
					onClick={() => onNavigate("clients")}
				/>

				{/* 2. Pastel Yellow: Commercial Deals */}
				<PastelKpiCard
					title="Commercial Deals"
					value={activeLeads.length}
					color="yellow"
					caption={`₹${(pipelineValue / 1000).toFixed(0)}k active pipeline volume`}
					progressPercent={65}
					icon={
						<svg
							className="w-4 h-4"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							role="img"
							aria-label="Deals Icon"
						>
							<title>Deals</title>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M13 10V3L4 14h7v7l9-11h-7z"
							/>
						</svg>
					}
					onClick={() => onNavigate("opportunities")}
				/>

				{/* 3. Pastel Rose: Active Projects */}
				<PastelKpiCard
					title="Active Projects"
					value={activeProjects.length}
					color="pink"
					caption={`${tasksByStatus.inProgress} in progress deliverables`}
					progressPercent={Math.min(
						100,
						Math.max(25, Math.round((activeProjects.length / 8) * 100)),
					)}
					icon={
						<svg
							className="w-4 h-4"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							role="img"
							aria-label="Projects Icon"
						>
							<title>Projects</title>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
							/>
						</svg>
					}
					onClick={() => onNavigate("projects")}
				/>

				{/* 4. Pastel Soft Blue: Won Revenue */}
				<PastelKpiCard
					title="Won Revenue"
					value={`₹${(wonValue / 1000).toFixed(0)}k`}
					color="blue"
					caption={`${wonLeads.length} closed won client contracts`}
					progressPercent={82}
					icon={
						<svg
							className="w-4 h-4"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							role="img"
							aria-label="Revenue Icon"
						>
							<title>Revenue</title>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
					}
					onClick={() => onNavigate("finance")}
				/>
			</div>

			{/* Operational Horizon: Action Inbox & Active Projects */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Action Inbox (Left 1 col) */}
				<div className="studio-card p-5 space-y-4">
					<div className="flex items-center justify-between pb-3 border-b border-slate-100">
						<h3 className="text-[14px] font-bold text-slate-900 tracking-tight flex items-center gap-2">
							<Zap className="w-4 h-4 text-amber-500 fill-amber-500/20" /> Priority Action Inbox
						</h3>
						<span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">
							{pendingApprovals.length + pendingHandoffs.length} Pending
						</span>
					</div>

					<div className="space-y-3">
						{/* Approvals Section */}
						<div>
							<div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5 font-bold">
								Executive Approvals Awaiting Decision
							</div>
							{pendingApprovals.length === 0 ? (
								<div className="text-[12px] text-slate-400 italic p-2 rounded bg-slate-50 border border-slate-100">
									No pending approvals
								</div>
							) : (
								<div className="space-y-1.5">
									{pendingApprovals.slice(0, 3).map((app) => (
										<div
											key={app.id}
											onClick={() => onNavigate("approvals")}
											className="p-2.5 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 cursor-pointer transition flex items-center justify-between"
										>
											<div className="min-w-0 pr-2">
												<div className="text-[12px] font-semibold text-slate-900 truncate">
													{app.title}
												</div>
												<div className="text-[10px] text-slate-500">
													Req by:{" "}
													<span className="text-slate-700">
														{app.requestedBy}
													</span>{" "}
													• Approver: {app.approverRole}
												</div>
											</div>
											<span className="badge-status badge-amber shrink-0 text-[10px]">
												Decide →
											</span>
										</div>
									))}
								</div>
							)}
						</div>

						{/* Handoffs Section */}
						<div>
							<div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5 font-bold">
								Department Transit Handoffs
							</div>
							{pendingHandoffs.length === 0 ? (
								<div className="text-[12px] text-slate-400 italic p-2 rounded bg-slate-50 border border-slate-100">
									No pending handoffs
								</div>
							) : (
								<div className="space-y-1.5">
									{pendingHandoffs.slice(0, 3).map((h) => (
										<div
											key={h.id}
											onClick={() => onNavigate("handoffs")}
											className="p-2.5 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 cursor-pointer transition flex items-center justify-between"
										>
											<div className="min-w-0 pr-2">
												<div className="text-[12px] font-semibold text-slate-900 truncate">
													{h.title || (h as any).deliverable}
												</div>
												<div className="text-[10px] text-slate-500 font-mono">
													{h.from || (h as any).fromDept} →{" "}
													{h.to || (h as any).toDept}
												</div>
											</div>
											<span className="badge-status badge-cobalt shrink-0 text-[10px]">
												Review →
											</span>
										</div>
									))}
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Active Projects Roster (Right 2 cols) */}
				<div className="lg:col-span-2 studio-card p-5 space-y-4">
					<div className="flex items-center justify-between pb-3 border-b border-slate-100">
						<div>
							<h3 className="text-[14px] font-bold text-slate-900 tracking-tight">
								Active Projects & Delivery Health
							</h3>
							<p className="text-[12px] text-slate-500">
								Current operational phase, completion velocity, and tech stacks
							</p>
						</div>
						<button
							type="button"
							onClick={() => onNavigate("projects")}
							className="text-[12px] text-blue-600 font-semibold hover:underline"
						>
							View All ({projects.length}) →
						</button>
					</div>

					<div className="space-y-2.5">
						{activeProjects.map((proj) => {
							const client = clients.find((c) => c.id === proj.clientId);
							return (
								<div
									key={proj.id}
									onClick={() => onNavigate("project", proj.id)}
									className="p-3.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-sm cursor-pointer transition bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3"
								>
									<div className="space-y-1 min-w-0">
										<div className="flex items-center gap-2">
											<span className="text-[13px] font-bold text-slate-900 hover:text-blue-600 transition truncate">
												{proj.name}
											</span>
											<span className="badge-status badge-neutral text-[10px]">
												{client?.name || "Client"}
											</span>
										</div>
										<div className="text-[11px] text-slate-500 flex items-center gap-2">
											<span className="font-mono text-blue-600 font-semibold">
												{proj.phase}
											</span>
											<span>•</span>
											<span>
												Budget:{" "}
												<span className="font-mono font-medium text-slate-700">
													₹{(proj.budget / 1000).toFixed(0)}k
												</span>
											</span>
											<span>•</span>
											<span>
												Deadline: {proj.due || (proj as any).deadline || "TBD"}
											</span>
										</div>
									</div>

									{/* Progress bar */}
									<div className="flex items-center gap-3 shrink-0">
										<div className="w-28 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
											<div
												className="bg-blue-600 h-full rounded-full transition-all duration-300"
												style={{ width: `${proj.progress}%` }}
											/>
										</div>
										<span className="font-mono text-[12px] font-bold text-slate-700 w-9 text-right">
											{proj.progress}%
										</span>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			</div>

			{/* Pipeline Volume Chart & Team Duty Overview */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Opportunity Volume by Stage */}
				<div className="studio-card p-5 space-y-4">
					<div className="flex items-center justify-between">
						<div>
							<h3 className="text-[14px] font-bold text-slate-900 tracking-tight">
								Sales Pipeline Value by Stage
							</h3>
							<p className="text-[12px] text-slate-500">
								Weighted distribution across live sales stages (in ₹ thousands)
							</p>
						</div>
						<span className="font-mono text-[12px] font-bold text-blue-600">
							₹{(pipelineValue / 1000).toFixed(0)}k Active
						</span>
					</div>

					<div className="h-[220px] w-full pt-2">
						<ResponsiveContainer width="100%" height="100%">
							<AreaChart data={stageDistribution}>
								<defs>
									<linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
										<stop offset="5%" stopColor="#0D9488" stopOpacity={0.35} />
										<stop offset="95%" stopColor="#0D9488" stopOpacity={0.0} />
									</linearGradient>
								</defs>
								<XAxis
									dataKey="stage"
									tick={{ fontSize: 11, fill: "var(--ink-muted)" }}
									axisLine={{ stroke: "var(--border)" }}
									tickLine={false}
								/>
								<YAxis
									tick={{ fontSize: 11, fill: "var(--ink-muted)" }}
									axisLine={{ stroke: "var(--border)" }}
									tickLine={false}
									unit="k"
								/>
								<Tooltip
									formatter={(val: any) => [`₹${val}k`, "Value"]}
									contentStyle={{
										backgroundColor: "var(--surface)",
										borderRadius: "8px",
										border: "1px solid var(--border)",
										boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
										color: "var(--ink)",
										fontSize: "12px",
									}}
									itemStyle={{ color: "var(--ink)", fontWeight: 600 }}
									labelStyle={{
										color: "var(--ink-muted)",
										marginBottom: "4px",
									}}
								/>
								<Area
									type="monotone"
									dataKey="value"
									stroke="#0D9488"
									strokeWidth={2}
									fillOpacity={1}
									fill="url(#colorVal)"
								/>
							</AreaChart>
						</ResponsiveContainer>
					</div>
				</div>

				{/* Scheduled Team Roster */}
				<div className="studio-card p-5 space-y-4">
					<div className="flex items-center justify-between">
						<div>
							<h3 className="text-[14px] font-bold text-slate-900 tracking-tight">
								Specialist Capacity & IST Shifts
							</h3>
							<p className="text-[12px] text-slate-500">
								Real-time scheduled availability and daily allocation
							</p>
						</div>
						<button
							type="button"
							onClick={() => onNavigate("team")}
							className="text-[12px] text-blue-600 font-semibold hover:underline"
						>
							Directory →
						</button>
					</div>

					<div className="space-y-2">
						{team.map((member) => {
							const isOnline = isMemberOnline(member, istHour);
							return (
								<div
									key={member.id}
									className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/60 flex items-center justify-between text-[12px]"
								>
									<div className="flex items-center gap-2.5 min-w-0">
										<div className="w-7 h-7 rounded-full bg-slate-800 dark:bg-slate-700 text-white border border-slate-700/40 dark:border-slate-600/50 flex items-center justify-center font-bold text-[10px] font-mono shrink-0">
											{member.initials}
										</div>
										<div className="min-w-0">
											<div className="font-semibold text-slate-900 truncate">
												{member.name}
											</div>
											<div className="text-[10px] text-slate-500 truncate">
												{member.roleTitle}
											</div>
										</div>
									</div>

									<div className="flex items-center gap-3 shrink-0">
										<span className="font-mono text-[11px] text-slate-600">
											{member.focus}h / {member.avail}h
										</span>
										<span
											className={`w-2 h-2 rounded-full ${
												isOnline
													? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]"
													: "bg-slate-300"
											}`}
											title={isOnline ? "Scheduled On-Duty" : "Off-Shift"}
										/>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			</div>

			{/* Recent Agency Audit Stream */}
			<div className="studio-card p-5 space-y-3">
				<div className="flex items-center justify-between pb-2 border-b border-slate-100">
					<h3 className="text-[14px] font-bold text-slate-900 tracking-tight">
						Recent Operational Activity
					</h3>
					<span className="text-[11px] text-slate-500 font-mono">
						Live Audit Trail
					</span>
				</div>

				<div className="divide-y divide-slate-100">
					{activity.slice(0, 5).map((act) => (
						<div
							key={act.id}
							className="py-2.5 flex items-center justify-between text-[12px]"
						>
							<div className="flex items-center gap-2.5 min-w-0 pr-4">
								<span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
								<span className="font-medium text-slate-800 truncate">
									{act.text}
								</span>
							</div>
							<div className="flex items-center gap-3 shrink-0 text-[11px] text-slate-400 font-mono">
								<span>{act.actor}</span>
								<span>•</span>
								<span>
									{new Date(
										act.at || (act as any).timestamp || Date.now(),
									).toLocaleTimeString([], {
										hour: "2-digit",
										minute: "2-digit",
									})}
								</span>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};
