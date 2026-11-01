import type React from "react";
import { useState } from "react";
import { workflowRepository } from "../../lib/repositories/workflow.repository";
import type { Project } from "../../types";

interface ScopeChangeModalProps {
	projects: Project[];
	initialProjectId?: string;
	onClose: () => void;
	onSuccess: () => void;
}

export const ScopeChangeModal: React.FC<ScopeChangeModalProps> = ({
	projects,
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
			setError("Change title and project are required");
			return;
		}

		setIsSubmitting(true);
		try {
			await workflowRepository.createScopeChange({
				projectId,
				title,
				category: String(fd.get("category") || "Scope") as any,
				description: String(fd.get("description") || ""),
				costDelta: Number(fd.get("costDelta") || 0),
				daysDelta: Number(fd.get("daysDelta") || 0),
				mitigation: String(fd.get("mitigation") || ""),
				requestedBy: String(fd.get("requestedBy") || "Shradha"),
			});
			onSuccess();
			onClose();
		} catch (err: any) {
			setError(err.message || "Failed to log scope change");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
			<div className="liquid-modal w-full max-w-md p-6 space-y-4">
				<div className="flex items-center justify-between pb-3 border-b border-black/[0.08]">
					<h3 className="text-[16px] font-[700] text-[#1D1D1F]">
						Log Scope Change & Schedule Impact
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
							Scope Change Title *
						</label>
						<input
							name="title"
							required
							placeholder="e.g. Add Multi-Currency Checkout Gateway"
							className="input-glass"
						/>
					</div>

					<div className="grid grid-cols-3 gap-3">
						<div>
							<label className="text-[11px] font-[600] uppercase text-[#86868B] mb-1 block">
								Category
							</label>
							<select
								name="category"
								defaultValue="Scope"
								className="input-glass"
							>
								<option value="Scope">Scope</option>
								<option value="Timeline">Timeline</option>
								<option value="Budget">Budget</option>
								<option value="Stack">Stack</option>
								<option value="Other">Other</option>
							</select>
						</div>
						<div>
							<label className="text-[11px] font-[600] uppercase text-[#86868B] mb-1 block">
								Cost Delta (₹)
							</label>
							<input
								name="costDelta"
								type="number"
								defaultValue={45000}
								className="input-glass"
							/>
						</div>
						<div>
							<label className="text-[11px] font-[600] uppercase text-[#86868B] mb-1 block">
								Schedule (+Days)
							</label>
							<input
								name="daysDelta"
								type="number"
								defaultValue={5}
								className="input-glass"
							/>
						</div>
					</div>

					<div>
						<label className="text-[11px] font-[600] uppercase text-[#86868B] mb-1 block">
							Requested By
						</label>
						<input
							name="requestedBy"
							defaultValue="Shradha"
							className="input-glass"
						/>
					</div>

					<div>
						<label className="text-[11px] font-[600] uppercase text-[#86868B] mb-1 block">
							Change Description & Impact
						</label>
						<textarea
							name="description"
							rows={2}
							placeholder="Why this change is required and impact on milestones..."
							className="input-glass !h-auto py-2"
						/>
					</div>

					<div>
						<label className="text-[11px] font-[600] uppercase text-[#86868B] mb-1 block">
							Mitigation Strategy
						</label>
						<input
							name="mitigation"
							placeholder="e.g. Reallocate 2 devs from night shift..."
							className="input-glass"
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
							{isSubmitting ? "Logging..." : "Log Scope Change"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};
