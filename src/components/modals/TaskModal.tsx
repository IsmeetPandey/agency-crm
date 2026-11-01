import type React from "react";
import { useState } from "react";
import { tasksRepository } from "../../lib/repositories/tasks.repository";
import type { Department, Project, TeamMemberDetail } from "../../types";

interface TaskModalProps {
	projects: Project[];
	departments: Department[];
	team: TeamMemberDetail[];
	initialProjectId?: string;
	onClose: () => void;
	onSuccess: () => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({
	projects,
	departments,
	team,
	initialProjectId,
	onClose,
	onSuccess,
}) => {
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError(null);
		const fd = new FormData(e.currentTarget);
		const name = String(fd.get("name") || "").trim();
		const projectId = String(fd.get("projectId") || "");

		if (!name || !projectId) {
			setError("Task title and project are required");
			return;
		}

		setIsSubmitting(true);
		try {
			await tasksRepository.create({
				projectId,
				name,
				dept: String(fd.get("dept") || "Frontend"),
				owner: String(fd.get("owner") || "Ansul"),
				status: String(fd.get("status") || "In progress") as any,
				priority: String(fd.get("priority") || "Medium") as any,
				due: String(fd.get("due") || ""),
				description: String(fd.get("description") || ""),
			});
			onSuccess();
			onClose();
		} catch (err: any) {
			setError(err.message || "Failed to create task");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
			<div className="liquid-modal w-full max-w-md p-6 space-y-4">
				<div className="flex items-center justify-between pb-3 border-b border-black/[0.08]">
					<h3 className="text-[16px] font-[700] text-[#1D1D1F]">
						New Deliverable Task • Liquid Flow
					</h3>
					<button
						type="button"
						onClick={onClose}
						className="text-[#86868B] hover:text-[#1D1D1F] text-[18px]"
					>
						×
					</button>
				</div>

				{error && (
					<div className="p-2.5 rounded-[8px] bg-[#FF2D55]/10 text-[#FF2D55] text-[12px] font-[500]">
						{error}
					</div>
				)}

				<form onSubmit={handleSubmit} className="space-y-3">
					<div>
						<label className="text-[11px] font-[600] uppercase text-[#86868B] mb-1 block">
							Project *
						</label>
						<select
							name="projectId"
							defaultValue={initialProjectId || projects[0]?.id}
							required
							className="input-glass"
						>
							{projects.map((p) => (
								<option key={p.id} value={p.id}>
									{p.name}
								</option>
							))}
						</select>
					</div>

					<div>
						<label className="text-[11px] font-[600] uppercase text-[#86868B] mb-1 block">
							Task Deliverable Title *
						</label>
						<input
							name="name"
							required
							placeholder="e.g. Implement Cart Checkout Interaction"
							className="input-glass"
						/>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="text-[11px] font-[600] uppercase text-[#86868B] mb-1 block">
								Department
							</label>
							<select
								name="dept"
								defaultValue="Frontend"
								className="input-glass"
							>
								{departments.map((d) => (
									<option key={d.id} value={d.code}>
										{d.code} ({d.label})
									</option>
								))}
							</select>
						</div>
						<div>
							<label className="text-[11px] font-[600] uppercase text-[#86868B] mb-1 block">
								Assignee
							</label>
							<select name="owner" defaultValue="Ansul" className="input-glass">
								{team.map((m) => (
									<option key={m.id} value={m.name}>
										{m.name} ({m.roleTitle})
									</option>
								))}
							</select>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="text-[11px] font-[600] uppercase text-[#86868B] mb-1 block">
								Status
							</label>
							<select
								name="status"
								defaultValue="In progress"
								className="input-glass"
							>
								<option value="Todo">Todo</option>
								<option value="In progress">In progress</option>
								<option value="Blocked">Blocked</option>
								<option value="Completed">Completed</option>
							</select>
						</div>
						<div>
							<label className="text-[11px] font-[600] uppercase text-[#86868B] mb-1 block">
								Due Date
							</label>
							<input name="due" type="date" className="input-glass" />
						</div>
					</div>

					<div>
						<label className="text-[11px] font-[600] uppercase text-[#86868B] mb-1 block">
							Description
						</label>
						<textarea
							name="description"
							rows={2}
							placeholder="Task acceptance criteria..."
							className="input-glass !h-auto py-2"
						/>
					</div>

					<div className="flex justify-end gap-2 pt-3 border-t border-black/[0.08]">
						<button
							type="button"
							onClick={onClose}
							className="btn-liquid !h-[32px]"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={isSubmitting}
							className="btn-liquid btn-liquid-primary !h-[32px]"
						>
							{isSubmitting ? "Creating..." : "Create Task"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};
