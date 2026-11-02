import type React from "react";
import { useState } from "react";
import { tasksRepository } from "../../lib/repositories/tasks.repository";
import type {
	Department,
	Project,
	TaskPriority,
	TaskStatus,
	TeamMemberDetail,
} from "../../types";

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
		if (isSubmitting) return;

		setError(null);
		const fd = new FormData(e.currentTarget);
		const name = String(fd.get("name") || "").trim();
		const projectId = String(
			fd.get("projectId") || initialProjectId || projects[0]?.id || "",
		);

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
				owner: String(fd.get("owner") || team[0]?.name || "Ansul"),
				status: String(fd.get("status") || "In progress") as TaskStatus,
				priority: String(fd.get("priority") || "Medium") as TaskPriority,
				due: String(fd.get("due") || ""),
				description: String(fd.get("description") || ""),
			});
			onSuccess();
			onClose();
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : "Failed to create task";
			setError(msg);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs animate-in fade-in">
			<div className="studio-modal w-full max-w-md p-6 space-y-4 bg-white border border-[#DEDEDE] shadow-xl rounded-xl">
				<div className="flex items-center justify-between pb-3 border-b border-[#EDEDED]">
					<h3 className="text-[16px] font-bold text-[#111111]">
						New Deliverable Work Item
					</h3>
					<button
						type="button"
						onClick={onClose}
						className="text-[#808080] hover:text-[#111111] text-[18px]"
						aria-label="Close"
					>
						×
					</button>
				</div>

				{error && (
					<div className="p-2.5 rounded-md bg-[#FFF0F0] text-[#C62828] border border-[#F8C2C2] text-[12px] font-medium">
						{error}
					</div>
				)}

				<form onSubmit={handleSubmit} className="space-y-3">
					<div>
						<label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#666666] mb-1 block">
							Project *
						</label>
						<select
							name="projectId"
							defaultValue={initialProjectId || projects[0]?.id}
							required
							className="studio-input font-medium"
						>
							{projects.map((p) => (
								<option key={p.id} value={p.id}>
									{p.name}
								</option>
							))}
						</select>
					</div>

					<div>
						<label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#666666] mb-1 block">
							Deliverable Title *
						</label>
						<input
							name="name"
							required
							placeholder="e.g. Implement WebGL Hero Animation"
							className="studio-input"
						/>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#666666] mb-1 block">
								Department
							</label>
							<select name="dept" className="studio-input font-medium">
								{departments.map((d) => (
									<option key={d.code} value={d.code}>
										{d.label || d.code}
									</option>
								))}
							</select>
						</div>
						<div>
							<label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#666666] mb-1 block">
								Assignee
							</label>
							<select name="owner" className="studio-input font-medium">
								{team.map((t) => (
									<option key={t.id} value={t.name}>
										{t.name} ({t.initials})
									</option>
								))}
							</select>
						</div>
					</div>

					<div className="grid grid-cols-3 gap-3">
						<div>
							<label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#666666] mb-1 block">
								Status
							</label>
							<select name="status" className="studio-input font-medium">
								<option value="Todo">Todo</option>
								<option value="In progress">In progress</option>
								<option value="Blocked">Blocked</option>
								<option value="Completed">Completed</option>
							</select>
						</div>
						<div>
							<label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#666666] mb-1 block">
								Priority
							</label>
							<select name="priority" className="studio-input font-medium">
								<option value="Low">Low</option>
								<option value="Medium">Medium</option>
								<option value="High">High</option>
								<option value="Urgent">Urgent</option>
							</select>
						</div>
						<div>
							<label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#666666] mb-1 block">
								Due Date
							</label>
							<input
								name="due"
								type="date"
								className="studio-input font-mono"
							/>
						</div>
					</div>

					<div>
						<label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#666666] mb-1 block">
							Technical Specification Notes
						</label>
						<textarea
							name="description"
							rows={2}
							placeholder="Deliverable dependencies, acceptance criteria..."
							className="studio-input !h-auto py-2"
						/>
					</div>

					<div className="flex justify-end gap-2.5 pt-3 border-t border-[#EDEDED]">
						<button
							type="button"
							onClick={onClose}
							className="btn-secondary !h-[34px]"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={isSubmitting}
							className="btn-primary !h-[34px] disabled:opacity-50"
						>
							{isSubmitting ? "Creating..." : "Create Deliverable"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};
