import type React from "react";
import { useMemo } from "react";
import {
	Area,
	AreaChart,
	Cell,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import {
	formatHour,
	isMemberOnline,
	PERSON_COLOR,
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
	// Real derived metrics
	const activeLeads = useMemo(
		() => leads.filter((l) => !["Won", "Lost"].includes(l.stage)),
		[leads],
	);

	const pipelineValue = useMemo(
		() => activeLeads.reduce((sum, l) => sum + (Number(l.value) || 0), 0),
		[activeLeads],
	);

	const wonLeads = useMemo(
		() => leads.filter((l) => l.stage === "Won"),
		[leads],
	);
	const wonValue = useMemo(
		() => wonLeads.reduce((sum, l) => sum + (Number(l.value) || 0), 0),
		[wonLeads],
	);

	const activeProjects = useMemo(
		() =>
			projects.filter(
				(p) => p.status !== "completed" && p.status !== "archived",
			),
		[projects],
	);

	const tasksByStatus = useMemo(() => {
		return {
			todo: tasks.filter((t) => t.status === "Todo").length,
			inProgress: tasks.filter((t) => t.status === "In progress").length,
			blocked: tasks.filter((t) => t.status === "Blocked").length,
			completed: tasks.filter((t) => t.status === "Completed").length,
		};
	}, [tasks]);

	const pendingApprovals = useMemo(
		() => approvals.filter((a) => a.status === "Pending"),
		[approvals],
	);

	const pendingHandoffs = useMemo(
		() => handoffs.filter((h) => h.status === "Pending"),
		[handoffs],
	);

	const onlineMembers = useMemo(
		() => team.filter((m) => isMemberOnline(m, istHour)),
		[team, istHour],
	);

	const overloadedMembers = useMemo(
		() => team.filter((m) => m.overload),
		[team],
	);

	const totalCapacityHours = useMemo(
		() => team.reduce((s, m) => s + m.avail, 0),
		[team],
	);
	const totalFocusHours = useMemo(
		() => team.reduce((s, m) => s + m.focus, 0),
		[team],
	);

	// Real stage breakdown chart data (computed from actual lead values)
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
				value: val / 1000, // in thousands (₹k)
				color: STAGE_META[st]?.dot || "#007AFF",
			};
		});
	}, [leads]);

	// Project phase distribution
	const phaseDistribution = useMemo(() => {
		const phases = ["Design", "Build", "QA", "Launch", "Discovery"];
		return phases
			.map((ph, idx) => {
				const count = projects.filter((p) => p.phase === ph).length;
				const colors = ["#FF2D55", "#6D28D9", "#00C7BE", "#FFCC02", "#007AFF"];
				return {
					name: ph,
					value: count || 1, // small visual baseline if 0
					realCount: count,
					color: colors[idx % colors.length],
				};
			})
			.filter((d) => d.realCount > 0 || projects.length === 0);
	}, [projects]);

	return (
		<div className="space-y-6">
			{/* Hero Liquid KPI Cards */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
				{/* Pipeline Value */}
				<div className="liquid-card p-4 lg:p-5 tint-violet">
					<div className="flex items-center justify-between text-[11px] font-[600] tracking-[-0.011em] text-[#6D28D9]">
						<span>Active Pipeline</span>
						<span className="w-2 h-2 rounded-full bg-[#6D28D9]" />
					</div>
					<div className="text-[24px] lg:text-[28px] font-[750] tracking-[-0.03em] text-[#1D1D1F] mt-1">
						₹{(pipelineValue / 1000).toFixed(0)}k
					</div>
					<div className="text-[11px] text-[#86868B] mt-1 font-[450]">
						{activeLeads.length} active opportunities
					</div>
				</div>

				{/* Won Value */}
				<div className="liquid-card p-4 lg:p-5 tint-green">
					<div className="flex items-center justify-between text-[11px] font-[600] tracking-[-0.011em] text-[#30D158]">
						<span>Won Deals</span>
						<span className="w-2 h-2 rounded-full bg-[#30D158]" />
					</div>
					<div className="text-[24px] lg:text-[28px] font-[750] tracking-[-0.03em] text-[#1D1D1F] mt-1">
						₹{(wonValue / 1000).toFixed(0)}k
					</div>
					<div className="text-[11px] text-[#86868B] mt-1 font-[450]">
						{wonLeads.length} closed won • {clients.length} clients
					</div>
				</div>

				{/* Active Projects */}
				<div className="liquid-card p-4 lg:p-5 tint-blue">
					<div className="flex items-center justify-between text-[11px] font-[600] tracking-[-0.011em] text-[#007AFF]">
						<span>Active Projects</span>
						<span className="w-2 h-2 rounded-full bg-[#007AFF]" />
					</div>
					<div className="text-[24px] lg:text-[28px] font-[750] tracking-[-0.03em] text-[#1D1D1F] mt-1">
						{activeProjects.length}
					</div>
					<div className="text-[11px] text-[#86868B] mt-1 font-[450]">
						{tasksByStatus.inProgress} tasks in progress
					</div>
				</div>

				{/* Team Capacity */}
				<div className="liquid-card p-4 lg:p-5 tint-orange">
					<div className="flex items-center justify-between text-[11px] font-[600] tracking-[-0.011em] text-[#FF9500]">
						<span>Capacity & Shifts</span>
						<span className="w-2 h-2 rounded-full bg-[#FF9500]" />
					</div>
					<div className="text-[24px] lg:text-[28px] font-[750] tracking-[-0.03em] text-[#1D1D1F] mt-1">
						{totalCapacityHours}h{" "}
						<span className="text-[13px] font-[500] text-[#86868B]">
							({totalFocusHours}h focus)
						</span>
					</div>
					<div className="text-[11px] text-[#86868B] mt-1 font-[450]">
						{onlineMembers.length} active • {overloadedMembers.length}{" "}
						overloaded
					</div>
				</div>
			</div>

			{/* Main Grid: Charts & Action items */}
			<div className="grid lg:grid-cols-3 gap-5">
				{/* Left 2 Cols: Pipeline Distribution & Project Delivery */}
				<div className="lg:col-span-2 space-y-5">
					{/* Pipeline Stage Distribution Chart */}
					<div className="liquid-card p-5">
						<div className="flex items-center justify-between mb-3">
							<div>
								<h3 className="text-[14px] font-[650] tracking-[-0.015em] text-[#1D1D1F]">
									Pipeline Stage Breakdown (₹k)
								</h3>
								<p className="text-[11px] text-[#86868B]">
									Derived from active opportunity values across all 6 stages
								</p>
							</div>
							<button
								type="button"
								onClick={() => onNavigate("pipeline")}
								className="btn-liquid !h-[26px] !text-[11px]"
							>
								View Pipeline →
							</button>
						</div>

						<div className="h-[180px] w-full">
							<ResponsiveContainer width="100%" height="100%">
								<AreaChart data={stageDistribution}>
									<defs>
										<linearGradient
											id="pipelineGrad"
											x1="0"
											y1="0"
											x2="0"
											y2="1"
										>
											<stop
												offset="5%"
												stopColor="#6D28D9"
												stopOpacity={0.25}
											/>
											<stop
												offset="95%"
												stopColor="#6D28D9"
												stopOpacity={0.0}
											/>
										</linearGradient>
									</defs>
									<XAxis
										dataKey="stage"
										stroke="#86868B"
										fontSize={11}
										tickLine={false}
									/>
									<YAxis stroke="#86868B" fontSize={11} tickLine={false} />
									<Tooltip
										contentStyle={{
											backgroundColor: "rgba(255, 255, 255, 0.9)",
											backdropFilter: "blur(12px)",
											borderRadius: "10px",
											border: "0.5px solid rgba(0,0,0,0.1)",
											fontSize: "12px",
										}}
										formatter={(val: any) => [`₹${val}k`, "Value"]}
									/>
									<Area
										type="monotone"
										dataKey="value"
										stroke="#6D28D9"
										strokeWidth={2}
										fillOpacity={1}
										fill="url(#pipelineGrad)"
									/>
								</AreaChart>
							</ResponsiveContainer>
						</div>
					</div>

					{/* Active Projects Quick Grid */}
					<div className="liquid-card p-5">
						<div className="flex items-center justify-between mb-3">
							<h3 className="text-[14px] font-[650] tracking-[-0.015em] text-[#1D1D1F]">
								Active Project Delivery
							</h3>
							<button
								type="button"
								onClick={() => onNavigate("projects")}
								className="btn-liquid !h-[26px] !text-[11px]"
							>
								All Projects ({projects.length}) →
							</button>
						</div>

						<div className="grid md:grid-cols-2 gap-3">
							{projects.map((p) => (
								<div
									key={p.id}
									onClick={() => onNavigate("project", p.id)}
									className="p-3.5 rounded-[12px] bg-white/60 backdrop-blur border border-black/[0.06] hover:bg-white/90 cursor-pointer transition space-y-2.5"
								>
									<div className="flex items-center justify-between">
										<span className="text-[13px] font-[650] text-[#1D1D1F] truncate">
											{p.name}
										</span>
										<span className="text-[10px] font-[600] px-2 py-0.5 rounded-full bg-[#007AFF]/10 text-[#007AFF]">
											{p.phase}
										</span>
									</div>
									<div className="text-[11px] text-[#86868B] truncate">
										Lead: {p.owner} • Stack: {p.stackNeeded || "—"}
									</div>
									{/* Progress bar */}
									<div>
										<div className="flex justify-between text-[10px] text-[#86868B] mb-1 font-[500]">
											<span>Progress</span>
											<span>{p.progress}%</span>
										</div>
										<div className="w-full h-1.5 rounded-full bg-black/[0.06] overflow-hidden">
											<div
												className="h-full bg-[#007AFF] rounded-full transition-all duration-300"
												style={{ width: `${p.progress}%` }}
											/>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>

				{/* Right Col: Approvals, Handoffs & Activity */}
				<div className="space-y-5">
					{/* Action Center: Pending Approvals & Handoffs */}
					<div className="liquid-card p-5">
						<h3 className="text-[13px] font-[650] tracking-[-0.015em] text-[#1D1D1F] mb-3 flex items-center justify-between">
							<span>Operational Signals</span>
							<span className="text-[10px] px-2 py-0.5 rounded-full bg-[#30D158]/10 text-[#30D158] font-[600]">
								Live
							</span>
						</h3>

						<div className="space-y-2">
							<div
								onClick={() => onNavigate("approvals")}
								className="p-3 rounded-[10px] bg-white/70 backdrop-blur border border-black/[0.06] flex items-center justify-between cursor-pointer hover:bg-white/90 transition"
							>
								<div>
									<div className="text-[12px] font-[600] text-[#1D1D1F]">
										Pending Approvals
									</div>
									<div className="text-[10px] text-[#86868B]">
										Milestone gate reviews & signoffs
									</div>
								</div>
								<span className="text-[13px] font-[700] text-[#6D28D9]">
									{pendingApprovals.length}
								</span>
							</div>

							<div
								onClick={() => onNavigate("handoffs")}
								className="p-3 rounded-[10px] bg-white/70 backdrop-blur border border-black/[0.06] flex items-center justify-between cursor-pointer hover:bg-white/90 transition"
							>
								<div>
									<div className="text-[12px] font-[600] text-[#1D1D1F]">
										Department Handoffs
									</div>
									<div className="text-[10px] text-[#86868B]">
										Design → Dev → QA transitions
									</div>
								</div>
								<span className="text-[13px] font-[700] text-[#007AFF]">
									{pendingHandoffs.length}
								</span>
							</div>

							<div className="p-3 rounded-[10px] bg-white/70 backdrop-blur border border-black/[0.06] flex items-center justify-between">
								<div>
									<div className="text-[12px] font-[600] text-[#1D1D1F]">
										Task Health
									</div>
									<div className="text-[10px] text-[#86868B]">
										{tasksByStatus.blocked} blocked • {tasksByStatus.todo} todo
									</div>
								</div>
								<span className="text-[13px] font-[700] text-[#30D158]">
									{tasksByStatus.completed}/{tasks.length}
								</span>
							</div>
						</div>
					</div>

					{/* Real Activity Stream */}
					<div className="liquid-card p-5">
						<h3 className="text-[13px] font-[650] tracking-[-0.015em] text-[#1D1D1F] mb-3 flex items-center justify-between">
							<span>Agency Activity</span>
							<span className="text-[10px] text-[#86868B] font-mono">
								{activity.length} events
							</span>
						</h3>

						<div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 mac-scroll">
							{activity.slice(0, 8).map((act) => (
								<div
									key={act.id}
									className="text-[12px] leading-tight pb-2 border-b border-black/[0.04] last:border-none"
								>
									<div className="text-[#1D1D1F] font-[500]">{act.text}</div>
									<div className="text-[10px] text-[#86868B] mt-1 flex items-center gap-2">
										<span className="font-[600] text-[#6D28D9]">
											{act.actor}
										</span>
										<span>•</span>
										<span>
											{new Date(act.at).toLocaleTimeString([], {
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
			</div>
		</div>
	);
};
