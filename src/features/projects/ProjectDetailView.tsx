import type React from "react";
import { useEffect, useState } from "react";
import {
	GATES_TEMPLATE,
	RACI_DELIVERABLES,
	RACI_ROLES,
} from "../../lib/constants/agency";
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
	};

	const handleGateStatus = async (
		stepNumber: number,
		status: "Pending" | "In Review" | "Approved" | "Rejected",
	) => {
		await workflowRepository.updateGateStatus(project.id, stepNumber, status);
		const updated = await workflowRepository.getProjectGates(project.id);
		setGates(updated);
		onRefresh();
	};

	const projectTasks = tasks.filter((t) => t.projectId === project.id);
	const projectHandoffs = handoffs.filter((h) => h.projectId === project.id);

	return (
		<div className="space-y-5">
			{/* Top breadcrumb & project header */}
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
				<div className="flex items-center gap-3">
					<button
						type="button"
						onClick={onBack}
						className="btn-liquid !h-[30px] !px-2.5 text-[12px]"
					>
						← Back
					</button>
					<div>
						<div className="text-[11px] font-[600] uppercase tracking-wider text-[#007AFF]">
							{client?.name || "Client"} • {project.phase}
						</div>
						<h2 className="text-[20px] font-[750] tracking-[-0.02em] text-[#1D1D1F]">
							{project.name}
						</h2>
					</div>
				</div>

				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={() => onOpenModal("task", { projectId: project.id })}
						className="btn-liquid btn-liquid-primary !h-[30px] !text-[12px]"
					>
						+ Task
					</button>
					<button
						type="button"
						onClick={() => onOpenModal("handoff", { projectId: project.id })}
						className="btn-liquid !h-[30px] !text-[12px]"
					>
						+ Handoff
					</button>
				</div>
			</div>

			{/* Tabs Bar */}
			<div className="flex items-center gap-1.5 overflow-x-auto pb-1 mac-scroll">
				{[
					{ id: "overview", label: "Overview" },
					{ id: "tasks", label: `Tasks (${projectTasks.length})` },
					{ id: "checklists", label: "Department Checklists" },
					{ id: "gates", label: "Milestones / Gates (9)" },
					{ id: "handoffs", label: `Handoffs (${projectHandoffs.length})` },
					{ id: "raci", label: "RACI Matrix" },
					{ id: "changes", label: `Scope Changes (${scopeChanges.length})` },
				].map((t) => (
					<button
						key={t.id}
						type="button"
						onClick={() => setTab(t.id as any)}
						className={`px-3.5 py-1.5 rounded-full text-[12px] font-[590] whitespace-nowrap transition border ${
							tab === t.id
								? "bg-[#1D1D1F] text-white border-[#1D1D1F] shadow-[0_2px_8px_rgba(0,0,0,0.12)]"
								: "bg-white/70 backdrop-blur text-[#86868B] border-black/[0.06] hover:border-black/[0.10] hover:text-[#1D1D1F]"
						}`}
					>
						{t.label}
					</button>
				))}
			</div>

			{/* TAB 1: OVERVIEW */}
			{tab === "overview" && (
				<div className="grid lg:grid-cols-3 gap-5">
					<div className="lg:col-span-2 space-y-4">
						<div className="liquid-card p-5 space-y-4">
							<h3 className="text-[14px] font-[650] text-[#1D1D1F]">
								Project Scope & Deliverable Spec
							</h3>
							<p className="text-[13px] text-[#86868B] leading-relaxed">
								{project.scope || "No detailed scope description provided yet."}
							</p>

							<div className="grid sm:grid-cols-3 gap-3 pt-3 border-t border-black/[0.06]">
								<div className="p-3 rounded-[10px] bg-white/60 border border-black/[0.04]">
									<div className="text-[11px] text-[#86868B]">Budget</div>
									<div className="text-[16px] font-[700] text-[#1D1D1F]">
										₹{(project.budget / 1000).toFixed(0)}k
									</div>
								</div>
								<div className="p-3 rounded-[10px] bg-white/60 border border-black/[0.04]">
									<div className="text-[11px] text-[#86868B]">Due Date</div>
									<div className="text-[14px] font-[650] text-[#1D1D1F]">
										{project.due || "TBD"}
									</div>
								</div>
								<div className="p-3 rounded-[10px] bg-white/60 border border-black/[0.04]">
									<div className="text-[11px] text-[#86868B]">Lead Owner</div>
									<div className="text-[14px] font-[650] text-[#1D1D1F]">
										{project.owner}
									</div>
								</div>
							</div>

							{/* Required Tech Stack */}
							<div>
								<div className="text-[11px] font-[600] uppercase tracking-wider text-[#86868B] mb-2">
									Required Technology Stack
								</div>
								<div className="flex flex-wrap gap-1.5">
									{(project.stackNeeded || "")
										.split(/[, ]+/)
										.filter(Boolean)
										.map((tech) => (
											<span
												key={tech}
												className="text-[11px] font-[600] px-2.5 py-1 rounded-full bg-[#007AFF]/10 text-[#007AFF] border border-[#007AFF]/15"
											>
												{tech}
											</span>
										))}
								</div>
							</div>
						</div>
					</div>

					{/* Assigned Team sidebar */}
					<div className="space-y-4">
						<div className="liquid-card p-5 space-y-3">
							<h3 className="text-[13px] font-[650] text-[#1D1D1F]">
								Assigned Team Members
							</h3>
							<div className="space-y-2">
								{project.assignedTeam.map((memberId) => {
									const m = team.find(
										(tm) => tm.id === memberId || tm.legacyId === memberId,
									);
									return (
										<div
											key={memberId}
											className="p-2.5 rounded-[10px] bg-white/60 border border-black/[0.04] flex items-center justify-between"
										>
											<div className="flex items-center gap-2.5">
												<div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#6D28D9] to-[#007AFF] text-white flex items-center justify-center text-[10px] font-[700]">
													{m?.initials || memberId.slice(0, 2).toUpperCase()}
												</div>
												<div>
													<div className="text-[12px] font-[650] text-[#1D1D1F]">
														{m?.name || memberId}
													</div>
													<div className="text-[10px] text-[#86868B]">
														{m?.roleTitle || "Team Member"}
													</div>
												</div>
											</div>
											<span className="text-[10px] font-mono text-[#86868B]">
												{m?.avail || 4}h/d
											</span>
										</div>
									);
								})}
							</div>
						</div>
					</div>
				</div>
			)}

			{/* TAB 2: TASKS */}
			{tab === "tasks" && (
				<div className="liquid-card p-5 space-y-4">
					<div className="flex items-center justify-between">
						<h3 className="text-[14px] font-[650] text-[#1D1D1F]">
							Project Deliverables & Work Items
						</h3>
						<button
							type="button"
							onClick={() => onOpenModal("task", { projectId: project.id })}
							className="btn-liquid btn-liquid-primary !h-[28px] !text-[11px]"
						>
							+ Add Task
						</button>
					</div>

					<div className="space-y-2">
						{projectTasks.length === 0 ? (
							<div className="py-8 text-center text-[13px] text-[#86868B]">
								No tasks logged for this project yet.
							</div>
						) : (
							projectTasks.map((t) => (
								<div
									key={t.id}
									className="p-3.5 rounded-[12px] bg-white/60 backdrop-blur border border-black/[0.06] flex items-center justify-between hover:bg-white/80 transition"
								>
									<div className="space-y-0.5">
										<div className="text-[13px] font-[600] text-[#1D1D1F]">
											{t.name}
										</div>
										<div className="text-[11px] text-[#86868B]">
											Dept:{" "}
											<span className="font-[500] text-[#1D1D1F]">
												{t.dept}
											</span>{" "}
											• Assignee:{" "}
											<span className="font-[500] text-[#1D1D1F]">
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
											className={`text-[11px] font-[600] rounded-full px-2.5 py-1 border outline-none ${
												t.status === "Completed"
													? "bg-[#30D158]/10 text-[#30D158] border-[#30D158]/20"
													: t.status === "Blocked"
														? "bg-[#FF2D55]/10 text-[#FF2D55] border-[#FF2D55]/20"
														: "bg-[#007AFF]/10 text-[#007AFF] border-[#007AFF]/20"
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
				<div className="liquid-card p-5 space-y-4">
					<div className="flex items-center justify-between mb-2">
						<div>
							<h3 className="text-[14px] font-[650] text-[#1D1D1F]">
								Department Readiness Checklists
							</h3>
							<p className="text-[11px] text-[#86868B]">
								Interactive and persisted per-project readiness verification
								items
							</p>
						</div>
					</div>

					<div className="grid md:grid-cols-2 gap-3">
						{departments.slice(0, 8).map((dept) => (
							<div
								key={dept.id}
								className="p-3.5 rounded-[12px] bg-white/60 backdrop-blur border border-black/[0.06] space-y-2"
							>
								<div className="text-[12px] font-[650] text-[#1D1D1F] flex items-center gap-2">
									<span
										className="w-2 h-2 rounded-full"
										style={{ backgroundColor: dept.dot }}
									/>
									{dept.code} • {dept.members.join(", ") || "—"}
								</div>

								<div className="space-y-1.5">
									{Array.from({ length: 4 }, (_, i) => {
										const itemKey = `${dept.code}-${i}`;
										const isChecked = !!checklistState[itemKey];

										return (
											<label
												key={itemKey}
												className="flex items-center gap-2.5 text-[12px] py-1 cursor-pointer hover:text-[#007AFF] transition font-[450]"
											>
												<input
													type="checkbox"
													checked={isChecked}
													onChange={(e) =>
														handleToggleChecklist(itemKey, e.target.checked)
													}
													className="rounded-[5px] w-4 h-4 accent-[#007AFF]"
												/>
												<span
													className={
														isChecked ? "line-through text-[#86868B]" : ""
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
				<div className="liquid-card p-5 space-y-4">
					<h3 className="text-[14px] font-[650] text-[#1D1D1F]">
						Milestone Gates • 9 Gates Verification
					</h3>

					<div className="space-y-2">
						{gates.map((g) => (
							<div
								key={g.id}
								className="p-3.5 rounded-[12px] border border-black/[0.06] flex items-center justify-between bg-white/60 backdrop-blur hover:bg-white/80 transition"
							>
								<div className="flex items-center gap-3">
									<span
										className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-[700] ${
											g.status === "Approved"
												? "bg-[#30D158] text-white shadow-[0_1px_3px_rgba(48,209,88,0.3)]"
												: "bg-white border border-black/[0.1] text-[#86868B]"
										}`}
									>
										{g.status === "Approved" ? "✓" : g.stepNumber}
									</span>
									<div>
										<div className="text-[13px] font-[650] text-[#1D1D1F]">
											Gate {g.stepNumber} • {g.name}
										</div>
										<div className="text-[11px] text-[#86868B]">
											Owner Dept: {g.ownerDept}
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
										className={`text-[11px] font-[600] rounded-full px-2.5 py-1 border outline-none ${
											g.status === "Approved"
												? "bg-[#30D158]/10 text-[#30D158] border-[#30D158]/20"
												: g.status === "In Review"
													? "bg-[#FF9500]/10 text-[#FF9500] border-[#FF9500]/20"
													: "bg-black/[0.04] text-[#86868B] border-black/[0.08]"
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
				<div className="liquid-card p-5 space-y-4">
					<div className="flex items-center justify-between">
						<h3 className="text-[14px] font-[650] text-[#1D1D1F]">
							Department Flow & Transitions
						</h3>
						<button
							type="button"
							onClick={() => onOpenModal("handoff", { projectId: project.id })}
							className="btn-liquid btn-liquid-primary !h-[28px] !text-[11px]"
						>
							+ New Handoff
						</button>
					</div>

					<div className="space-y-2">
						{projectHandoffs.length === 0 ? (
							<div className="py-8 text-center text-[13px] text-[#86868B]">
								No department handoffs recorded for this project yet.
							</div>
						) : (
							projectHandoffs.map((h) => (
								<div
									key={h.id}
									className="p-3.5 rounded-[12px] bg-white/60 backdrop-blur border border-black/[0.06] flex items-center justify-between"
								>
									<div>
										<div className="text-[13px] font-[650] text-[#1D1D1F]">
											{h.title}
										</div>
										<div className="text-[11px] text-[#86868B]">
											{h.from} → {h.to} {h.due && `• Due ${h.due}`}
										</div>
									</div>
									<span
										className={`text-[11px] font-[600] px-2.5 py-1 rounded-full border ${
											h.status === "Accepted"
												? "bg-[#30D158]/10 text-[#30D158] border-[#30D158]/20"
												: "bg-[#007AFF]/10 text-[#007AFF] border-[#007AFF]/20"
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
				<div className="liquid-card p-5 space-y-4">
					<h3 className="text-[14px] font-[650] text-[#1D1D1F]">
						RACI Matrix • Deliverable Responsibilities
					</h3>
					<div className="overflow-x-auto mac-scroll">
						<table className="w-full text-[12px] min-w-[600px]">
							<thead>
								<tr className="border-b border-black/[0.08]">
									<th className="text-left font-[650] p-2.5 text-[#1D1D1F]">
										Deliverable
									</th>
									{RACI_ROLES.map((r) => (
										<th
											key={r}
											className="p-2.5 font-[650] text-center text-[#1D1D1F]"
										>
											<span className="w-7 h-7 rounded-[8px] bg-black/[0.04] inline-flex items-center justify-center text-[11px] font-[600]">
												{r}
											</span>
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{RACI_DELIVERABLES.map((deliv) => (
									<tr
										key={deliv}
										className="border-b border-black/[0.04] hover:bg-white/40 transition"
									>
										<td className="p-2.5 font-[600] text-[#1D1D1F]">{deliv}</td>
										{RACI_ROLES.map((roleCode) => {
											const item = raciList.find(
												(x) =>
													x.deliverable === deliv && x.roleCode === roleCode,
											);
											const currentVal = item?.assignment || "—";

											return (
												<td key={roleCode} className="p-2.5 text-center">
													<select
														value={currentVal}
														onChange={(e) =>
															handleRaciChange(
																deliv,
																roleCode,
																e.target.value as any,
															)
														}
														className="input-glass !h-[28px] !w-[56px] !px-1 !text-[11px] !rounded-[8px]"
													>
														{["R", "A", "C", "I", "—", "A/R"].map((opt) => (
															<option key={opt} value={opt}>
																{opt}
															</option>
														))}
													</select>
												</td>
											);
										})}
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			)}

			{/* TAB 7: SCOPE CHANGES */}
			{tab === "changes" && (
				<div className="liquid-card p-5 space-y-4">
					<div className="flex items-center justify-between">
						<div>
							<h3 className="text-[14px] font-[650] text-[#1D1D1F]">
								Scope Changes & Cost/Schedule Impact
							</h3>
							<p className="text-[11px] text-[#86868B]">
								Track authorized scope variances, mitigation options, and
								schedule shifts
							</p>
						</div>
						<button
							type="button"
							onClick={() => onOpenModal("change", { projectId: project.id })}
							className="btn-liquid btn-liquid-primary !h-[28px] !text-[11px]"
						>
							+ Log Scope Change
						</button>
					</div>

					<div className="space-y-2">
						{scopeChanges.length === 0 ? (
							<div className="py-8 text-center text-[13px] text-[#86868B]">
								No scope changes logged for this project yet.
							</div>
						) : (
							scopeChanges.map((sc) => (
								<div
									key={sc.id}
									className="p-3.5 rounded-[12px] bg-white/60 backdrop-blur border border-black/[0.06] flex items-center justify-between"
								>
									<div>
										<div className="text-[13px] font-[650] text-[#1D1D1F]">
											{sc.title}
										</div>
										<div className="text-[11px] text-[#86868B]">
											Category: {sc.category} • Cost: ₹{sc.costDelta} •
											Schedule: +{sc.daysDelta} days
										</div>
										{sc.description && (
											<div className="text-[11px] text-[#1D1D1F]/70 mt-1">
												{sc.description}
											</div>
										)}
									</div>
									<span className="text-[11px] font-[600] px-2.5 py-1 rounded-full bg-[#FF9500]/10 text-[#FF9500] border border-[#FF9500]/20">
										{sc.status}
									</span>
								</div>
							))
						)}
					</div>
				</div>
			)}
		</div>
	);
};
