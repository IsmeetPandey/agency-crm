import type React from "react";
import { useState } from "react";
import { handoffsRepository } from "../../lib/repositories/handoffs.repository";
import type { Department, Project } from "../../types";

interface HandoffModalProps {
	projects: Project[];
	departments: Department[];
	initialProjectId?: string;
	onClose: () => void;
	onSuccess: () => void;
}

export const HandoffModal: React.FC<HandoffModalProps> = ({
	projects,
	departments,
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
		const title = String(fd.get("title") || "").trim();
		const projectId = String(fd.get("projectId") || "");

		if (!title || !projectId) {
			setError("Handoff title and project are required");
			return;
		}

		setIsSubmitting(true);
		try {
			await handoffsRepository.create({
				projectId,
				title,
				from: String(fd.get("from") || "Design"),
				to: String(fd.get("to") || "Frontend"),
				status: "Pending",
				due: String(fd.get("due") || ""),
				description: String(fd.get("description") || ""),
			});
			onSuccess();
			onClose();
		} catch (err: any) {
			setError(err.message || "Failed to create handoff");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
			<div className="studio-modal w-full max-w-md p-6 space-y-4">
				<div className="flex items-center justify-between pb-3 border-b border-[#DEDEDE]">
					<h3 className="text-[16px] font-[700] text-[#111111]">
						New Department Handoff • Flow
					</h3>
					<button
						type="button"
						onClick={onClose}
						className="text-[#767676] hover:text-[#111111] text-[18px] transition-colors"
					>
						×
					</button>
				</div>

				{error && (
					<div className="p-2.5 rounded-[4px] bg-[#C62828]/10 text-[#C62828] text-[12px] font-[500]">
						{error}
					</div>
				)}

				<form onSubmit={handleSubmit} className="space-y-3">
					<div>
						<label className="text-[11px] font-[600] uppercase tracking-wider text-[#767676] mb-1 block">
							Project *
						</label>
						<select
							name="projectId"
							defaultValue={initialProjectId || projects[0]?.id}
							required
							className="studio-input"
						>
							{projects.map((p) => (
								<option key={p.id} value={p.id}>
									{p.name}
								</option>
							))}
						</select>
					</div>

					<div>
						<label className="text-[11px] font-[600] uppercase tracking-wider text-[#767676] mb-1 block">
							Handoff Deliverable Summary *
						</label>
						<input
							name="title"
							required
							placeholder="e.g. Design Tokens & UI Specs Package"
							className="studio-input"
						/>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="text-[11px] font-[600] uppercase tracking-wider text-[#767676] mb-1 block">
								From Department
							</label>
							<select
								name="from"
								defaultValue="Design"
								className="studio-input"
							>
								{departments.map((d) => (
									<option key={d.id} value={d.code}>
										{d.code}
									</option>
								))}
							</select>
						</div>
						<div>
							<label className="text-[11px] font-[600] uppercase tracking-wider text-[#767676] mb-1 block">
								To Department
							</label>
							<select
								name="to"
								defaultValue="Frontend"
								className="studio-input"
							>
								{departments.map((d) => (
									<option key={d.id} value={d.code}>
										{d.code}
									</option>
								))}
							</select>
						</div>
					</div>

					<div>
						<label className="text-[11px] font-[600] uppercase tracking-wider text-[#767676] mb-1 block">
							Target Acceptance Date
						</label>
						<input name="due" type="date" className="studio-input" />
					</div>

					<div>
						<label className="text-[11px] font-[600] uppercase tracking-wider text-[#767676] mb-1 block">
							Handoff Context / Notes
						</label>
						<textarea
							name="description"
							rows={2}
							placeholder="Figma links, build notes, review checklist..."
							className="studio-input !h-auto py-2"
						/>
					</div>

					<div className="flex justify-end gap-2 pt-3 border-t border-[#DEDEDE]">
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
							className="btn-primary !h-[34px]"
						>
							{isSubmitting ? "Submitting..." : "Initiate Handoff"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};
