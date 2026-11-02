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
			{/* Command Header Banner */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl bg-slate-900 text-white shadow-lg border border-slate-800">
				<div className="space-y-1">
					<div className="flex items-center gap-2">
						<span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
						<span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-emerald-400">
							Active Operations Window • IST {formatHour(istHour)}
						</span>
					</div>
					<h2 className="text-[20px] font-extrabold tracking-tight">
						Kreatiwit Operations Command Center
					</h2>
					<p className="text-[13px] text-slate-300">
						{activeProjects.length} active delivery projects •{" "}
						{activeLeads.length} pipeline opportunities • {onlineMembers.length}{" "}
						specialists scheduled on-duty
					</p>
				</div>

				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={() => onOpenModal("opportunity")}
						className="btn-primary !h-[34px] !text-[12px] !px-3"
					>
						+ Commercial Deal
					</button>
					<button
						type="button"
						onClick={() => onOpenModal("lead")}
						className="btn-secondary !h-[34px] !text-[12px] !px-3 !bg-white/10 !text-white !border-white/20 hover:!bg-white/20"
					>
						+ Lead
					</button>
					<button
						type="button"
						onClick={() => onOpenModal("project")}
						className="btn-secondary !h-[34px] !text-[12px] !px-3 !bg-white/10 !text-white !border-white/20 hover:!bg-white/20"
					>
						+ Project
					</button>
					<button
						type="button"
						onClick={() => onOpenModal("task")}
						className="btn-secondary !h-[34px] !text-[12px] !px-3 !bg-white/10 !text-white !border-white/20 hover:!bg-white/20"
					>
						+ Deliverable
					</button>
				</div>
			</div>

			{/* 4 Executive Pulse Metrics */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				{/* Card 1: Active Pipeline */}
				<div className="studio-card p-4 space-y-2">
					<div className="flex items-center justify-between text-slate-500 text-[11px] font-mono uppercase tracking-wider">
						<span>Active Pipeline</span>
						<span className="text-blue-600 font-semibold">Growth</span>
					</div>
					<div className="text-[26px] font-extrabold tracking-tight text-slate-900 font-mono">
						₹{(pipelineValue / 1000).toFixed(0)}k
					</div>
					<div className="text-[12px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
						<span>{activeLeads.length} Inbound Prospects</span>
						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={() => onNavigate("opportunities")}
								className="text-blue-600 font-semibold hover:underline"
							>
								Deals ⚡
							</button>
							<span className="text-slate-300">•</span>
							<button
								type="button"
								onClick={() => onNavigate("pipeline")}
								className="text-blue-600 font-semibold hover:underline"
							>
								Board →
							</button>
						</div>
					</div>
				</div>

				{/* Card 2: Won Revenue */}
				<div className="studio-card p-4 space-y-2">
					<div className="flex items-center justify-between text-slate-500 text-[11px] font-mono uppercase tracking-wider">
						<span>Won Contracts</span>
						<span className="text-emerald-600 font-semibold">Closed</span>
					</div>
					<div className="text-[26px] font-extrabold tracking-tight text-slate-900 font-mono">
						₹{(wonValue / 1000).toFixed(0)}k
					</div>
					<div className="text-[12px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
						<span>{wonLeads.length} Clients Won</span>
						<button
							type="button"
							onClick={() => onNavigate("clients")}
							className="text-blue-600 font-semibold hover:underline"
						>
							Client Roster →
						</button>
					</div>
				</div>

				{/* Card 3: Active Deliverables */}
				<div className="studio-card p-4 space-y-2">
					<div className="flex items-center justify-between text-slate-500 text-[11px] font-mono uppercase tracking-wider">
						<span>Deliverables</span>
						<span className="text-indigo-600 font-semibold">Delivery</span>
					</div>
					<div className="text-[26px] font-extrabold tracking-tight text-slate-900 font-mono">
						{tasksByStatus.inProgress}
						<span className="text-[14px] font-normal text-slate-500 ml-1.5">
							/ {tasks.length} total
						</span>
					</div>
					<div className="text-[12px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
						<span
							className={
								tasksByStatus.blocked > 0
									? "text-rose-600 font-medium"
									: "text-emerald-600 font-medium"
							}
						>
							{tasksByStatus.blocked} Blocked
						</span>
						<span className="text-slate-400 font-mono">
							{tasksByStatus.completed} Done
						</span>
					</div>
				</div>

				{/* Card 4: Daily Capacity */}
				<div className="studio-card p-4 space-y-2">
					<div className="flex items-center justify-between text-slate-500 text-[11px] font-mono uppercase tracking-wider">
						<span>Daily Workload</span>
						<span className="text-amber-600 font-semibold">Capacity</span>
					</div>
					<div className="text-[26px] font-extrabold tracking-tight text-slate-900 font-mono">
						{totalFocusHours}h
						<span className="text-[14px] font-normal text-slate-500 ml-1.5">
							/ {totalCapacityHours}h planned
						</span>
					</div>
					<div className="text-[12px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
						<span>{onlineMembers.length} Specialists On-Duty</span>
						<button
							type="button"
							onClick={() => onNavigate("team")}
							className="text-blue-600 font-semibold hover:underline"
						>
							Capacity Grid →
						</button>
					</div>
				</div>
			</div>

			{/* Operational Horizon: Action Inbox & Active Projects */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Action Inbox (Left 1 col) */}
				<div className="studio-card p-5 space-y-4">
					<div className="flex items-center justify-between pb-3 border-b border-slate-100">
						<h3 className="text-[14px] font-bold text-slate-900 tracking-tight flex items-center gap-2">
							<span>⚡</span> Priority Action Inbox
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
										<stop offset="5%" stopColor="#49B3FC" stopOpacity={0.25} />
										<stop offset="95%" stopColor="#49B3FC" stopOpacity={0.0} />
									</linearGradient>
								</defs>
								<XAxis
									dataKey="stage"
									tick={{ fontSize: 11, fill: "#767676" }}
									axisLine={{ stroke: "#DEDEDE" }}
									tickLine={false}
								/>
								<YAxis
									tick={{ fontSize: 11, fill: "#767676" }}
									axisLine={{ stroke: "#DEDEDE" }}
									tickLine={false}
									unit="k"
								/>
								<Tooltip
									formatter={(val: any) => [`₹${val}k`, "Value"]}
									contentStyle={{
										backgroundColor: "#FFFFFF",
										borderRadius: "4px",
										border: "1px solid #DEDEDE",
										boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
										color: "#111111",
										fontSize: "12px",
									}}
									itemStyle={{ color: "#111111", fontWeight: 600 }}
									labelStyle={{ color: "#767676", marginBottom: "4px" }}
								/>
								<Area
									type="monotone"
									dataKey="value"
									stroke="#49B3FC"
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
										<div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px] font-mono shrink-0">
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
