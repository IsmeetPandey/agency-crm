import type React from "react";
import { useEffect, useState } from "react";
import { useAuth } from "../../lib/auth/auth.context";
import { useToast } from "../../lib/feedback/toast.context";
import { tasksRepository } from "../../lib/repositories/tasks.repository";
import { workflowRepository } from "../../lib/repositories/workflow.repository";
import type {
	Client,
	Department,
	Handoff,
	Project,
	ProjectGate,
	RACIAssignment,
	ScopeChange,
	Task,
	TeamMemberDetail,
} from "../../types";

interface ProjectDetailViewProps {
	project: Project;
	client?: Client;
	team: TeamMemberDetail[];
	tasks: Task[];
	handoffs: Handoff[];
	departments: Department[];
	onBack: () => void;
	onOpenModal: (type: string, data?: any) => void;
	onRefresh: () => void;
}

export const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({
	project,
	client,
	team,
	tasks,
	handoffs,
	departments,
	onBack,
	onOpenModal,
	onRefresh,
}) => {
	const [tab, setTab] = useState<
		| "overview"
		| "tasks"
		| "checklists"
		| "gates"
		| "handoffs"
		| "raci"
		| "changes"
	>("overview");

	const [gates, setGates] = useState<ProjectGate[]>([]);
	const [checklistState, setChecklistState] = useState<Record<string, boolean>>(
		{},
	);
	const [raciList, setRaciList] = useState<RACIAssignment[]>([]);
	const [scopeChanges, setScopeChanges] = useState<ScopeChange[]>([]);
	const { user } = useAuth();
	const { showToast } = useToast();

	useEffect(() => {
		async function loadWorkflowData() {
			const g = await workflowRepository.getProjectGates(project.id);
			setGates(g);

			const chk = await workflowRepository.getChecklistState(project.id);
			setChecklistState(chk);

			const r = await workflowRepository.getProjectRaci(project.id);
			setRaciList(r);

			const sc = await workflowRepository.listScopeChanges(project.id);
			setScopeChanges(sc);
		}
		loadWorkflowData();
	}, [project.id]);

	const handleToggleChecklist = async (key: string, checked: boolean) => {
		const updated = { ...checklistState, [key]: checked };
		setChecklistState(updated);
		await workflowRepository.toggleChecklistItem(project.id, key, checked);
		showToast({
			type: "info",
			message: `Checklist item updated`,
			duration: 2000,
		});
	};

	const handleRaciChange = async (
		deliverable: string,
		roleCode: string,
		assignment: "R" | "A" | "C" | "I" | "—" | "A/R",
	) => {
		await workflowRepository.updateRaciAssignment(
			project.id,
			deliverable,
			roleCode,
			assignment,
		);
		const updated = await workflowRepository.getProjectRaci(project.id);
		setRaciList(updated);
		showToast({
			type: "info",
			message: `RACI updated for ${deliverable} (${roleCode}: ${assignment})`,
			duration: 2500,
		});
	};

	const handleGateStatus = async (
		stepNumber: number,
		status: "Pending" | "In Review" | "Approved" | "Rejected",
	) => {
		const actor = user?.name || "Abhishek";
		await workflowRepository.updateGateStatus(
			project.id,
			stepNumber,
			status,
			actor,
		);
		const updated = await workflowRepository.getProjectGates(project.id);
		setGates(updated);
		showToast({
			type: status === "Approved" ? "success" : "info",
			title: `Gate ${stepNumber} Updated`,
			message: `Marked as ${status} by ${actor}`,
		});
		onRefresh();
	};

	const projectTasks = tasks.filter((t) => t.projectId === project.id);
	const projectHandoffs = handoffs.filter((h) => h.projectId === project.id);

	return (
		<div className="space-y-6">
			{/* Top breadcrumb & project header */}
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
				<div className="flex items-center gap-3 min-w-0">
					<button
						type="button"
						onClick={onBack}
						className="btn-secondary !h-[32px] !px-2.5 text-[12px] shrink-0"
					>
						← Back to Projects
					</button>
					<div className="min-w-0">
						<div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-blue-600 mb-0.5">
							{client?.name || "Client Account"} • {project.phase}
						</div>
						<h2 className="text-[20px] font-bold text-slate-900 tracking-tight truncate">
							{project.name}
						</h2>
					</div>
				</div>

				<div className="flex items-center gap-2 shrink-0">
					<button
						type="button"
						onClick={() => onOpenModal("task", { projectId: project.id })}
						className="btn-primary !h-[32px] !text-[12px]"
					>
						+ Deliverable
					</button>
					<button
						type="button"
						onClick={() => onOpenModal("handoff", { projectId: project.id })}
						className="btn-secondary !h-[32px] !text-[12px]"
					>
						+ Handoff
					</button>
					<button
						type="button"
						onClick={() => onOpenModal("change", { projectId: project.id })}
						className="btn-secondary !h-[32px] !text-[12px]"
					>
						+ Scope Delta
					</button>
				</div>
			</div>

			{/* Studio Tabs Navigation Bar */}
			<div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200">
				{[
					{ id: "overview", label: "Project Spec & Overview" },
					{ id: "tasks", label: `Work Items (${projectTasks.length})` },
					{ id: "checklists", label: "Readiness Checklists" },
					{ id: "gates", label: "9 Milestone Gates" },
					{
						id: "handoffs",
						label: `Handoff Transit (${projectHandoffs.length})`,
					},
					{ id: "raci", label: "RACI Governance" },
					{ id: "changes", label: `Scope Deltas (${scopeChanges.length})` },
				].map((t) => (
					<button
						key={t.id}
						type="button"
						onClick={() => setTab(t.id as any)}
						className={`px-3.5 py-2 rounded-t-lg text-[13px] font-medium whitespace-nowrap transition border-b-2 ${
							tab === t.id
								? "border-blue-600 text-blue-600 font-bold bg-blue-50/50"
								: "border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50"
						}`}
					>
						{t.label}
					</button>
				))}
			</div>

			{/* TAB 1: OVERVIEW */}
			{tab === "overview" && (
				<div className="grid lg:grid-cols-3 gap-6">
					<div className="lg:col-span-2 space-y-6">
						{/* Scope Card */}
						<div className="studio-card p-5 space-y-4">
							<h3 className="text-[14px] font-bold text-slate-900 tracking-tight">
								Project Scope & Contract Specification
							</h3>
							<p className="text-[13px] text-slate-600 leading-relaxed">
								{project.scope || "No detailed scope description provided yet."}
							</p>

							<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
								<div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
									<div className="text-[11px] font-mono uppercase text-slate-400">
										Total Budget
									</div>
									<div className="text-[18px] font-bold font-mono text-slate-900">
										₹{(project.budget / 1000).toFixed(0)}k
									</div>
								</div>
								<div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
									<div className="text-[11px] font-mono uppercase text-slate-400">
										Deadline Target
									</div>
									<div className="text-[14px] font-semibold text-slate-900">
										{project.deadline || "TBD"}
									</div>
								</div>
								<div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
									<div className="text-[11px] font-mono uppercase text-slate-400">
										Lead Project Owner
									</div>
									<div className="text-[14px] font-semibold text-slate-900">
										{project.owner}
									</div>
								</div>
							</div>
						</div>

						{/* Tech Stack Needed */}
						<div className="studio-card p-5 space-y-3">
							<h3 className="text-[14px] font-bold text-slate-900 tracking-tight">
								Architecture & Required Tech Stack
							</h3>
							<div className="flex flex-wrap gap-2">
								{project.stackNeeded.split(",").map((st) => (
									<span
										key={st.trim()}
										className="font-mono text-[12px] px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-semibold"
									>
										{st.trim()}
									</span>
								))}
							</div>
						</div>
					</div>

					{/* Assigned Team sidebar */}
					<div className="space-y-4">
						<div className="studio-card p-5 space-y-3">
							<h3 className="text-[14px] font-bold text-slate-900 tracking-tight">
								Assigned Specialists ({project.assignedTeam.length})
							</h3>
							<div className="space-y-2">
								{project.assignedTeam.map((memberId) => {
									const m = team.find(
										(tm) => tm.id === memberId || tm.legacyId === memberId,
									);
									return (
										<div
											key={memberId}
											className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 flex items-center justify-between"
										>
											<div className="flex items-center gap-2.5">
												<div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold font-mono">
													{m?.initials || memberId.slice(0, 2).toUpperCase()}
												</div>
												<div>
													<div className="text-[12px] font-bold text-slate-900">
														{m?.name || memberId}
													</div>
													<div className="text-[10px] text-slate-500">
														{m?.roleTitle || "Specialist"}
													</div>
												</div>
											</div>
											<span className="font-mono text-[11px] font-semibold text-slate-600">
												{m?.avail || 4}h/day
											</span>
										</div>
									);
								})}
							</div>
						</div>
					</div>
				</div>
			)}

			{/* TAB 2: TASKS / WORK ITEMS */}
			{tab === "tasks" && (
				<div className="studio-card p-5 space-y-4">
					<div className="flex items-center justify-between">
						<div>
							<h3 className="text-[14px] font-bold text-slate-900 tracking-tight">
								Deliverables & Work Items
							</h3>
							<p className="text-[12px] text-slate-500">
								Scheduled milestones assigned across departments
							</p>
						</div>
						<button
							type="button"
							onClick={() => onOpenModal("task", { projectId: project.id })}
							className="btn-primary !h-[30px] !text-[12px]"
						>
							+ Add Deliverable
						</button>
					</div>

					<div className="space-y-2">
						{projectTasks.length === 0 ? (
							<div className="py-12 text-center text-[13px] text-slate-400">
								No work items logged for this project yet. Click &quot;+ Add
								Deliverable&quot; above.
							</div>
						) : (
							projectTasks.map((t) => (
								<div
									key={t.id}
									className="p-3.5 rounded-lg border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition"
								>
									<div className="space-y-1">
										<div className="text-[13px] font-bold text-slate-900">
											{t.name}
										</div>
										<div className="text-[11px] text-slate-500 font-mono">
											Dept:{" "}
											<span className="text-slate-800 font-semibold">
												{t.dept}
											</span>{" "}
											• Owner:{" "}
											<span className="text-slate-800 font-semibold">
												{t.owner}
											</span>
											{t.due && ` • Due ${t.due}`}
										</div>
									</div>

									<div className="flex items-center gap-2">
										<select
											value={t.status}
											onChange={async (e) => {
												await tasksRepository.update(t.id, {
													status: e.target.value as any,
												});
												onRefresh();
											}}
											className={`text-[11px] font-semibold font-mono rounded-md px-2.5 py-1 border outline-none ${
												t.status === "Completed"
													? "bg-emerald-50 text-emerald-700 border-emerald-200"
													: t.status === "Blocked"
														? "bg-rose-50 text-rose-700 border-rose-200"
														: "bg-blue-50 text-blue-700 border-blue-200"
											}`}
										>
											<option value="Todo">Todo</option>
											<option value="In progress">In progress</option>
											<option value="Blocked">Blocked</option>
											<option value="Completed">Completed</option>
										</select>
									</div>
								</div>
							))
						)}
					</div>
				</div>
			)}

			{/* TAB 3: CHECKLISTS */}
			{tab === "checklists" && (
				<div className="studio-card p-5 space-y-4">
					<div className="flex items-center justify-between pb-2 border-b border-slate-100">
						<div>
							<h3 className="text-[14px] font-bold text-slate-900 tracking-tight">
								Department Readiness Checklists
							</h3>
							<p className="text-[12px] text-slate-500">
								Persistent quality gates and verification criteria per
								department
							</p>
						</div>
					</div>

					<div className="grid md:grid-cols-2 gap-4">
						{departments.slice(0, 8).map((dept) => (
							<div
								key={dept.id}
								className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
							>
								<div className="text-[12px] font-bold text-slate-900 flex items-center gap-2 pb-1.5 border-b border-slate-200">
									<span
										className="w-2.5 h-2.5 rounded-full"
										style={{ backgroundColor: dept.dot }}
									/>
									{dept.code} • {dept.name}
								</div>

								<div className="space-y-2">
									{Array.from({ length: 4 }, (_, i) => {
										const itemKey = `${dept.code}-${i}`;
										const isChecked = !!checklistState[itemKey];

										return (
											<label
												key={itemKey}
												className="flex items-center gap-2.5 text-[12px] py-1 cursor-pointer hover:text-blue-600 transition"
											>
												<input
													type="checkbox"
													checked={isChecked}
													onChange={(e) =>
														handleToggleChecklist(itemKey, e.target.checked)
													}
													className="rounded w-4 h-4 accent-blue-600"
												/>
												<span
													className={
														isChecked
															? "line-through text-slate-400 font-medium"
															: "text-slate-700 font-medium"
													}
												>
													{dept.code} verification requirement #{i + 1}
												</span>
											</label>
										);
									})}
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* TAB 4: GATES & MILESTONES */}
			{tab === "gates" && (
				<div className="studio-card p-5 space-y-4">
					<div className="pb-2 border-b border-slate-100">
						<h3 className="text-[14px] font-bold text-slate-900 tracking-tight">
							9 Milestone Quality Gates
						</h3>
						<p className="text-[12px] text-slate-500">
							Sequential operational governance from discovery to production
							launch
						</p>
					</div>

					<div className="space-y-2.5">
						{gates.map((g) => (
							<div
								key={g.id}
								className="p-3.5 rounded-lg border border-slate-200 flex items-center justify-between bg-white hover:border-slate-300 transition"
							>
								<div className="flex items-center gap-3">
									<span
										className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-mono font-bold ${
											g.status === "Approved"
												? "bg-emerald-600 text-white shadow-xs"
												: "bg-slate-100 text-slate-500 border border-slate-200"
										}`}
									>
										{g.status === "Approved" ? "✓" : g.stepNumber}
									</span>
									<div>
										<div className="text-[13px] font-bold text-slate-900">
											Gate {g.stepNumber} • {g.name}
										</div>
										<div className="text-[11px] text-slate-500 font-mono">
											Dept: {g.ownerDept}
											{g.approvedBy && ` • Approved by ${g.approvedBy}`}
										</div>
									</div>
								</div>

								<div className="flex items-center gap-2">
									<select
										value={g.status}
										onChange={(e) =>
											handleGateStatus(g.stepNumber, e.target.value as any)
										}
										className={`text-[11px] font-mono font-semibold rounded-md px-2.5 py-1 border outline-none ${
											g.status === "Approved"
												? "bg-emerald-50 text-emerald-700 border-emerald-200"
												: g.status === "In Review"
													? "bg-amber-50 text-amber-700 border-amber-200"
													: "bg-slate-50 text-slate-600 border-slate-200"
										}`}
									>
										<option value="Pending">Pending</option>
										<option value="In Review">In Review</option>
										<option value="Approved">Approved</option>
										<option value="Rejected">Rejected</option>
									</select>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* TAB 5: HANDOFFS */}
			{tab === "handoffs" && (
				<div className="studio-card p-5 space-y-4">
					<div className="flex items-center justify-between pb-2 border-b border-slate-100">
						<div>
							<h3 className="text-[14px] font-bold text-slate-900 tracking-tight">
								Department Transit & Handoffs
							</h3>
							<p className="text-[12px] text-slate-500">
								Work deliverable packages passed across agency teams
							</p>
						</div>
						<button
							type="button"
							onClick={() => onOpenModal("handoff", { projectId: project.id })}
							className="btn-primary !h-[30px] !text-[12px]"
						>
							+ New Handoff
						</button>
					</div>

					<div className="space-y-2">
						{projectHandoffs.length === 0 ? (
							<div className="py-12 text-center text-[13px] text-slate-400">
								No department handoffs logged for this project yet.
							</div>
						) : (
							projectHandoffs.map((h) => (
								<div
									key={h.id}
									className="p-3.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between"
								>
									<div>
										<div className="text-[13px] font-bold text-slate-900">
											{h.deliverable}
										</div>
										<div className="text-[11px] text-slate-500 font-mono">
											{h.fromDept} → {h.toDept} {h.notes && `• ${h.notes}`}
										</div>
									</div>
									<span
										className={`badge-status text-[11px] ${
											h.status === "Accepted"
												? "badge-emerald"
												: h.status === "Rejected"
													? "badge-rose"
													: "badge-amber"
										}`}
									>
										{h.status}
									</span>
								</div>
							))
						)}
					</div>
				</div>
			)}

			{/* TAB 6: RACI MATRIX */}
			{tab === "raci" && (
				<div className="studio-card p-5 space-y-4">
					<div className="pb-2 border-b border-slate-100">
						<h3 className="text-[14px] font-bold text-slate-900 tracking-tight">
							Project RACI Governance Matrix
						</h3>
						<p className="text-[12px] text-slate-500">
							Responsible (R), Accountable (A), Consulted (C), Informed (I)
							roles
						</p>
					</div>

					<div className="overflow-x-auto">
						<table className="w-full text-left border-collapse text-[12px]">
							<thead>
								<tr className="border-b border-slate-200 text-slate-400 font-mono uppercase text-[10px]">
									<th className="py-2.5 px-3">Deliverable Area</th>
									<th className="py-2.5 px-3">Role Code</th>
									<th className="py-2.5 px-3">Assignment</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-100">
								{raciList.map((r, idx) => (
									<tr
										key={`${r.deliverable}-${r.roleCode}-${idx}`}
										className="hover:bg-slate-50/50"
									>
										<td className="py-2 px-3 font-semibold text-slate-900">
											{r.deliverable}
										</td>
										<td className="py-2 px-3 font-mono text-slate-500">
											{r.roleCode}
										</td>
										<td className="py-2 px-3">
											<select
												value={r.assignment}
												onChange={(e) =>
													handleRaciChange(
														r.deliverable,
														r.roleCode,
														e.target.value as any,
													)
												}
												className="font-mono text-[11px] font-bold px-2 py-0.5 rounded border border-slate-200 outline-none"
											>
												<option value="R">R (Responsible)</option>
												<option value="A">A (Accountable)</option>
												<option value="C">C (Consulted)</option>
												<option value="I">I (Informed)</option>
												<option value="A/R">A/R (Dual)</option>
												<option value="—">— (None)</option>
											</select>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			)}

			{/* TAB 7: SCOPE CHANGES */}
			{tab === "changes" && (
				<div className="studio-card p-5 space-y-4">
					<div className="flex items-center justify-between pb-2 border-b border-slate-100">
						<div>
							<h3 className="text-[14px] font-bold text-slate-900 tracking-tight">
								Scope Changes & Budget Amendments
							</h3>
							<p className="text-[12px] text-slate-500">
								Cost and schedule delta logs with approval tracking
							</p>
						</div>
						<button
							type="button"
							onClick={() => onOpenModal("change", { projectId: project.id })}
							className="btn-primary !h-[30px] !text-[12px]"
						>
							+ Log Scope Delta
						</button>
					</div>

					<div className="space-y-2">
						{scopeChanges.length === 0 ? (
							<div className="py-12 text-center text-[13px] text-slate-400">
								No scope changes submitted for this project.
							</div>
						) : (
							scopeChanges.map((sc) => (
								<div
									key={sc.id}
									className="p-3.5 rounded-lg border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3"
								>
									<div className="space-y-1">
										<div className="text-[13px] font-bold text-slate-900">
											{sc.title}
										</div>
										<p className="text-[12px] text-slate-500">{sc.reason}</p>
										<div className="text-[11px] text-slate-400 font-mono">
											Logged: {new Date(sc.createdAt).toLocaleDateString()}
										</div>
									</div>

									<div className="flex items-center gap-3 shrink-0">
										<div className="text-right font-mono text-[11px]">
											<div className="font-bold text-slate-900">
												+₹{sc.costDelta.toLocaleString()}
											</div>
											<div className="text-slate-500">+{sc.daysDelta} days</div>
										</div>
										<span
											className={`badge-status ${
												sc.status === "Approved"
													? "badge-emerald"
													: sc.status === "Rejected"
														? "badge-rose"
														: "badge-amber"
											}`}
										>
											{sc.status}
										</span>
									</div>
								</div>
							))
						)}
					</div>
				</div>
			)}
		</div>
	);
};
