import type React from "react";
import { useMemo, useState } from "react";
import { Check, Trash2, User } from "lucide-react";
import { useToast } from "../../lib/feedback/toast.context";
import { tasksRepository } from "../../lib/repositories/tasks.repository";
import type {
	Department,
	Project,
	Task,
	TaskPriority,
	TaskStatus,
	TeamMemberDetail,
} from "../../types";

interface TasksViewProps {
	tasks: Task[];
	projects: Project[];
	departments: Department[];
	team: TeamMemberDetail[];
	onOpenModal: (type: string, data?: any) => void;
	onOpenProject?: (projectId: string) => void;
	onRefresh: () => void;
	search?: string;
}

const STATUS_COLUMNS: TaskStatus[] = [
	"Todo",
	"In progress",
	"Blocked",
	"Completed",
];

export const TasksView: React.FC<TasksViewProps> = ({
	tasks,
	projects,
	departments,
	team,
	onOpenModal,
	onOpenProject,
	onRefresh,
	search: externalSearch = "",
}) => {
	const { toast } = useToast();
	const [viewMode, setViewMode] = useState<"board" | "table">("board");
	const [localSearch, setLocalSearch] = useState("");
	const [projectFilter, setProjectFilter] = useState<string>("all");
	const [deptFilter, setDeptFilter] = useState<string>("all");
	const [priorityFilter, setPriorityFilter] = useState<string>("all");

	const searchQuery = (externalSearch || localSearch).toLowerCase().trim();
	const todayStr = new Date().toISOString().split("T")[0];

	const projectMap = useMemo(() => {
		const m = new Map<string, Project>();
		for (const p of projects) m.set(p.id, p);
		return m;
	}, [projects]);

	const filteredTasks = useMemo(() => {
		return tasks.filter((task) => {
			if (projectFilter !== "all" && task.projectId !== projectFilter)
				return false;
			if (deptFilter !== "all" && task.dept !== deptFilter) return false;
			if (priorityFilter !== "all" && task.priority !== priorityFilter)
				return false;
			if (!searchQuery) return true;

			const projectName = projectMap.get(task.projectId)?.name || "";
			return (
				task.name.toLowerCase().includes(searchQuery) ||
				task.owner.toLowerCase().includes(searchQuery) ||
				task.dept.toLowerCase().includes(searchQuery) ||
				projectName.toLowerCase().includes(searchQuery)
			);
		});
	}, [
		tasks,
		projectFilter,
		deptFilter,
		priorityFilter,
		searchQuery,
		projectMap,
	]);

	const handleStatusChange = async (task: Task, nextStatus: TaskStatus) => {
		try {
			await tasksRepository.update(task.id, { status: nextStatus });
			toast({
				title: "Task Updated",
				description: `"${task.name}" moved to ${nextStatus}.`,
				type: "success",
			});
			onRefresh();
		} catch (err: any) {
			toast({
				title: "Update Failed",
				description: err?.message || "Could not update task.",
				type: "error",
			});
		}
	};

	const handleDeleteTask = async (task: Task) => {
		if (!window.confirm(`Delete task "${task.name}"?`)) return;
		try {
			await tasksRepository.delete(task.id);
			toast({
				title: "Task Deleted",
				description: `"${task.name}" removed from project backlog.`,
				type: "info",
			});
			onRefresh();
		} catch (err: any) {
			toast({
				title: "Delete Failed",
				description: err?.message || "Could not delete task.",
				type: "error",
			});
		}
	};

	const overdueCount = useMemo(() => {
		return tasks.filter(
			(t) => t.status !== "Completed" && t.due && t.due < todayStr,
		).length;
	}, [tasks, todayStr]);

	const inProgressCount = useMemo(() => {
		return tasks.filter((t) => t.status === "In progress").length;
	}, [tasks]);

	const doneCount = useMemo(() => {
		return tasks.filter((t) => t.status === "Completed").length;
	}, [tasks]);

	return (
		<div className="space-y-6">
			{/* Top Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
				<div>
					<div className="flex items-center gap-2">
						<h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--ink)]">
							Tasks Masterboard
						</h1>
						<span className="text-[12px] font-mono px-2 py-0.5 rounded-full bg-[var(--surface-raised)] border border-[var(--border-subtle)] text-[var(--ink-secondary)] font-semibold">
							{tasks.length} Deliverables
						</span>
					</div>
					<p className="text-[13px] text-[var(--ink-muted)] mt-1">
						Cross-department workload, milestone tasks, and status tracking
						across all active accounts.
					</p>
				</div>

				<div className="flex items-center gap-2.5">
					<div className="flex items-center rounded-lg border border-[var(--border)] bg-[var(--surface)] p-0.5">
						<button
							type="button"
							onClick={() => setViewMode("board")}
							className={`px-3 py-1.5 text-[12px] font-medium rounded-md transition ${
								viewMode === "board"
									? "bg-[var(--ink)] text-[var(--canvas)]"
									: "text-[var(--ink-muted)] hover:text-[var(--ink)]"
							}`}
						>
							Board
						</button>
						<button
							type="button"
							onClick={() => setViewMode("table")}
							className={`px-3 py-1.5 text-[12px] font-medium rounded-md transition ${
								viewMode === "table"
									? "bg-[var(--ink)] text-[var(--canvas)]"
									: "text-[var(--ink-muted)] hover:text-[var(--ink)]"
							}`}
						>
							Table
						</button>
					</div>

					<button
						type="button"
						onClick={() => onOpenModal("task")}
						className="px-4 py-2 rounded-lg btn-primary text-[13px] font-medium transition flex items-center gap-2 shadow-xs cursor-pointer"
					>
						<span>+</span>
						<span>Add Task</span>
					</button>
				</div>
			</div>

			{/* KPI Metric Summary Strip */}
			<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
				<div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
					<div className="text-[11px] font-mono uppercase tracking-wider text-[var(--ink-muted)]">
						Backlog & Todo
					</div>
					<div className="text-xl font-bold font-mono text-[var(--ink)] mt-1">
						{tasks.filter((t) => t.status === "Todo").length}
					</div>
					<div className="text-[11px] text-[var(--ink-muted)] mt-0.5">
						Queued deliverables
					</div>
				</div>

				<div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
					<div className="text-[11px] font-mono uppercase tracking-wider text-[var(--ink-muted)]">
						In Progress
					</div>
					<div className="text-xl font-bold font-mono text-[#49B3FC] mt-1">
						{inProgressCount}
					</div>
					<div className="text-[11px] text-[var(--ink-muted)] mt-0.5">
						Active engineering / design
					</div>
				</div>

				<div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
					<div className="text-[11px] font-mono uppercase tracking-wider text-[var(--ink-muted)]">
						Review & Done
					</div>
					<div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
						{doneCount}
					</div>
					<div className="text-[11px] text-[var(--ink-muted)] mt-0.5">
						Verified & completed
					</div>
				</div>

				<div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
					<div className="text-[11px] font-mono uppercase tracking-wider text-[var(--ink-muted)]">
						Overdue Alerts
					</div>
					<div
						className={`text-xl font-bold font-mono mt-1 ${overdueCount > 0 ? "text-rose-600 dark:text-rose-400" : "text-[var(--ink-muted)]"}`}
					>
						{overdueCount}
					</div>
					<div className="text-[11px] text-[var(--ink-muted)] mt-0.5">
						Past target deadline
					</div>
				</div>
			</div>

			{/* Filter & Search Bar */}
			<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xs">
				<div className="flex-1 max-w-sm">
					<input
						type="text"
						value={localSearch}
						onChange={(e) => setLocalSearch(e.target.value)}
						placeholder="Search tasks, assignees, or projects..."
						className="w-full px-3 py-1.5 text-[13px] bg-[var(--surface-sunken)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[#49B3FC] text-[var(--ink)] placeholder:text-[var(--ink-muted)]"
					/>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<select
						value={projectFilter}
						onChange={(e) => setProjectFilter(e.target.value)}
						className="px-2.5 py-1.5 text-[12px] bg-[var(--surface-sunken)] border border-[var(--border)] rounded-lg focus:outline-none text-[var(--ink)]"
					>
						<option value="all">All Projects</option>
						{projects.map((p) => (
							<option key={p.id} value={p.id}>
								{p.name}
							</option>
						))}
					</select>

					<select
						value={deptFilter}
						onChange={(e) => setDeptFilter(e.target.value)}
						className="px-2.5 py-1.5 text-[12px] bg-[var(--surface-sunken)] border border-[var(--border)] rounded-lg focus:outline-none text-[var(--ink)]"
					>
						<option value="all">All Departments</option>
						{departments.map((d) => (
							<option key={d.code} value={d.code}>
								{d.label}
							</option>
						))}
					</select>

					<select
						value={priorityFilter}
						onChange={(e) => setPriorityFilter(e.target.value)}
						className="px-2.5 py-1.5 text-[12px] bg-[var(--surface-sunken)] border border-[var(--border)] rounded-lg focus:outline-none text-[var(--ink)]"
					>
						<option value="all">All Priorities</option>
						<option value="High">High Priority</option>
						<option value="Medium">Medium</option>
						<option value="Low">Low</option>
					</select>
				</div>
			</div>

			{/* Views: Kanban Board vs Table List */}
			{viewMode === "board" ? (
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
					{STATUS_COLUMNS.map((colStatus) => {
						const colTasks = filteredTasks.filter(
							(t) => t.status === colStatus,
						);
						return (
							<div
								key={colStatus}
								className="flex flex-col bg-[var(--surface-sunken)] border border-[var(--border)] rounded-xl p-3 min-h-[420px]"
							>
								<div className="flex items-center justify-between mb-3 px-1">
									<div className="flex items-center gap-2">
										<span className="text-[12px] font-bold text-[var(--ink)] uppercase tracking-wider font-mono">
											{colStatus}
										</span>
										<span className="w-5 h-5 rounded-full bg-[var(--surface)] text-[var(--ink-secondary)] border border-[var(--border)] flex items-center justify-center text-[10px] font-mono font-semibold">
											{colTasks.length}
										</span>
									</div>
								</div>

								<div className="space-y-2.5 flex-1 overflow-y-auto">
									{colTasks.length === 0 ? (
										<div className="h-28 flex items-center justify-center text-[11px] text-[var(--ink-muted)] border border-dashed border-[var(--border)] rounded-lg">
											No tasks in {colStatus}
										</div>
									) : (
										colTasks.map((task) => {
											const project = projectMap.get(task.projectId);
											const isOverdue =
												task.status !== "Completed" &&
												task.due &&
												task.due < todayStr;

											return (
												<div
													key={task.id}
													className={`p-3 rounded-lg bg-[var(--surface)] border transition shadow-xs hover:shadow-md ${
														isOverdue
															? "border-rose-400 dark:border-rose-700 ring-1 ring-rose-400/30"
															: "border-[var(--border)]"
													}`}
												>
													<div className="flex items-start justify-between gap-1 mb-1.5">
														<span className="text-[10px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded bg-[var(--surface-raised)] border border-[var(--border-subtle)] text-[var(--ink-secondary)]">
															{task.dept}
														</span>
														{isOverdue && (
															<span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
																OVERDUE
															</span>
														)}
														{!isOverdue && task.priority === "High" && (
															<span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
																HIGH
															</span>
														)}
													</div>

													<h4 className="text-[13px] font-semibold text-[var(--ink)] leading-snug">
														{task.name}
													</h4>

													{project && (
														<button
															type="button"
															onClick={() => onOpenProject?.(project.id)}
															className="text-[11px] text-[var(--ink-muted)] hover:text-[#49B3FC] font-mono truncate block mt-1 text-left"
														>
															↳ {project.name}
														</button>
													)}

													<div className="flex items-center justify-between text-[11px] text-[var(--ink-muted)] mt-3 pt-2 border-t border-[var(--border-subtle)]">
														<span className="font-medium text-[var(--ink-secondary)] flex items-center gap-1">
															<User className="w-3 h-3 text-slate-400" />
															<span>{task.owner}</span>
														</span>
														<span className="font-mono text-[10px]">
															{task.due ? task.due : "No due date"}
														</span>
													</div>

													{/* Workflow transition actions */}
													<div className="flex items-center justify-between gap-1 mt-2.5 pt-1.5 border-t border-[var(--border-subtle)]">
														<div className="flex items-center gap-1">
															{colStatus !== "Todo" && (
																<button
																	type="button"
																	onClick={() =>
																		handleStatusChange(task, "Todo")
																	}
																	className="px-1.5 py-0.5 text-[10px] rounded hover:bg-[var(--surface-sunken)] text-[var(--ink-muted)]"
																	title="Move to Todo"
																>
																	← Todo
																</button>
															)}
															{colStatus !== "Completed" && (
																<button
																	type="button"
																	onClick={() =>
																		handleStatusChange(
																			task,
																			colStatus === "Todo"
																				? "In progress"
																				: colStatus === "In progress"
																					? "Blocked"
																					: "Completed",
																		)
																	}
																	className="px-2 py-0.5 text-[10px] font-semibold rounded bg-[#49B3FC]/15 hover:bg-[#49B3FC]/25 text-[#49B3FC] flex items-center gap-1"
																>
																	{colStatus === "Todo" ? (
																		"Start →"
																	) : colStatus === "In progress" ? (
																		"Block / Review →"
																	) : (
																		<>
																			<Check className="w-3 h-3" />
																			<span>Done</span>
																		</>
																	)}
																</button>
															)}
														</div>

														<button
															type="button"
															onClick={() => handleDeleteTask(task)}
															className="text-[10px] text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50"
															title="Delete task"
														>
															<Trash2 className="w-3 h-3" />
														</button>
													</div>
												</div>
											);
										})
									)}
								</div>
							</div>
						);
					})}
				</div>
			) : (
				<div className="erp-table-container">
					<div className="overflow-x-auto">
						<table className="w-full text-left border-collapse text-[13px]">
							<thead>
								<tr className="erp-table-head border-b border-blue-200/50 dark:border-slate-800">
									<th className="py-3 px-4">Task Name</th>
									<th className="py-3 px-4">Project</th>
									<th className="py-3 px-4">Dept</th>
									<th className="py-3 px-4">Owner</th>
									<th className="py-3 px-4">Priority</th>
									<th className="py-3 px-4">Due Date</th>
									<th className="py-3 px-4">Status</th>
									<th className="py-3 px-4 text-right">Actions</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-[var(--border-subtle)]">
								{filteredTasks.map((task) => {
									const project = projectMap.get(task.projectId);
									const isOverdue =
										task.status !== "Completed" &&
										task.due &&
										task.due < todayStr;

									return (
										<tr
											key={task.id}
											className="hover:bg-[var(--surface-sunken)] transition"
										>
											<td className="py-3 px-4 font-semibold text-[var(--ink)]">
												{task.name}
											</td>
											<td className="py-3 px-4">
												{project ? (
													<button
														type="button"
														onClick={() => onOpenProject?.(project.id)}
														className="text-[#49B3FC] hover:underline font-mono text-[12px]"
													>
														{project.name}
													</button>
												) : (
													<span className="text-[var(--ink-muted)]">—</span>
												)}
											</td>
											<td className="py-3 px-4 font-mono text-[11px] uppercase text-[var(--ink-secondary)]">
												{task.dept}
											</td>
											<td className="py-3 px-4 text-[var(--ink-secondary)] font-medium">
												{task.owner}
											</td>
											<td className="py-3 px-4">
												<span
													className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold ${
														task.priority === "High"
															? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
															: task.priority === "Medium"
																? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
																: "bg-[var(--surface-raised)] border border-[var(--border-subtle)] text-[var(--ink-secondary)]"
													}`}
												>
													{task.priority || "Medium"}
												</span>
											</td>
											<td className="py-3 px-4 font-mono text-[12px]">
												<span
													className={
														isOverdue
															? "text-rose-600 dark:text-rose-400 font-bold"
															: "text-[var(--ink-muted)]"
													}
												>
													{task.due || "—"} {isOverdue && "(OVERDUE)"}
												</span>
											</td>
											<td className="py-3 px-4">
												<span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[var(--surface-raised)] border border-[var(--border-subtle)] text-[var(--ink-secondary)]">
													{task.status}
												</span>
											</td>
											<td className="py-3 px-4 text-right whitespace-nowrap">
												<div className="inline-flex items-center gap-2">
													{task.status !== "Completed" && (
														<button
															type="button"
															onClick={() =>
																handleStatusChange(task, "Completed")
															}
															className="text-[11px] font-medium text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40 px-2 py-1 rounded inline-flex items-center gap-1"
														>
															<Check className="w-3 h-3" />
															<span>Done</span>
														</button>
													)}
													<button
														type="button"
														onClick={() => handleDeleteTask(task)}
														className="text-[11px] font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 px-2 py-1 rounded"
													>
														Delete
													</button>
												</div>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				</div>
			)}
		</div>
	);
};
