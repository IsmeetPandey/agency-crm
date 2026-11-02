import type React from "react";
import { useState } from "react";
import { STAGES } from "../../lib/constants/agency";
import { leadsRepository } from "../../lib/repositories/leads.repository";
import type { Lead, LeadStage } from "../../types";

interface LeadModalProps {
	initialLead?: Lead | null;
	onClose: () => void;
	onSuccess: () => void;
}

export const LeadModal: React.FC<LeadModalProps> = ({
	initialLead,
	onClose,
	onSuccess,
}) => {
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const isEditing = !!initialLead;

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (isSubmitting) return;

		setError(null);
		const fd = new FormData(e.currentTarget);
		const name = String(fd.get("name") || "").trim();
		if (!name) {
			setError("Company or opportunity name is required");
			return;
		}

		setIsSubmitting(true);
		try {
			if (isEditing && initialLead) {
				await leadsRepository.update(initialLead.id, {
					name,
					contact: String(fd.get("contact") || "").trim(),
					email: String(fd.get("email") || "").trim(),
					service: String(fd.get("service") || "").trim(),
					value: Number(fd.get("value") || 0),
					stage: String(fd.get("stage") || "New") as LeadStage,
					owner: String(fd.get("owner") || "Abhishek").trim(),
					followup: String(fd.get("followup") || ""),
					notes: String(fd.get("notes") || "").trim(),
				});
			} else {
				await leadsRepository.create({
					name,
					contact: String(fd.get("contact") || "").trim(),
					email: String(fd.get("email") || "").trim(),
					service: String(fd.get("service") || "").trim(),
					value: Number(fd.get("value") || 0),
					stage: String(fd.get("stage") || "New") as LeadStage,
					owner: String(fd.get("owner") || "Abhishek").trim(),
					followup: String(fd.get("followup") || ""),
					notes: String(fd.get("notes") || "").trim(),
				});
			}
			onSuccess();
			onClose();
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : "Failed to save lead";
			setError(msg);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs animate-in fade-in">
			<div className="studio-modal w-full max-w-lg p-6 space-y-4 bg-white border border-[#DEDEDE] shadow-xl rounded-xl">
				<div className="flex items-center justify-between pb-3 border-b border-[#EDEDED]">
					<h3 className="text-[16px] font-bold text-[#111111]">
						{isEditing ? "Edit Opportunity" : "New Opportunity"} • Sales
						Pipeline
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
							Opportunity / Brand Name *
						</label>
						<input
							name="name"
							required
							defaultValue={initialLead?.name || ""}
							placeholder="e.g. Acme Health"
							className="studio-input"
						/>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#666666] mb-1 block">
								Primary Contact
							</label>
							<input
								name="contact"
								defaultValue={initialLead?.contact || ""}
								placeholder="e.g. Jordan Lee"
								className="studio-input"
							/>
						</div>
						<div>
							<label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#666666] mb-1 block">
								Contact Email
							</label>
							<input
								name="email"
								type="email"
								defaultValue={initialLead?.email || ""}
								placeholder="jordan@acme.example"
								className="studio-input"
							/>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#666666] mb-1 block">
								Service Required
							</label>
							<input
								name="service"
								defaultValue={initialLead?.service || ""}
								placeholder="e.g. Next.js Commerce + Brand"
								className="studio-input"
							/>
						</div>
						<div>
							<label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#666666] mb-1 block">
								Estimated Value (₹)
							</label>
							<input
								name="value"
								type="number"
								defaultValue={initialLead?.value || 250000}
								placeholder="250000"
								className="studio-input font-mono"
							/>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#666666] mb-1 block">
								Stage
							</label>
							<select
								name="stage"
								defaultValue={initialLead?.stage || "New"}
								className="studio-input font-medium"
							>
								{STAGES.map((s) => (
									<option key={s} value={s}>
										{s}
									</option>
								))}
							</select>
						</div>
						<div>
							<label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#666666] mb-1 block">
								Owner
							</label>
							<input
								name="owner"
								defaultValue={initialLead?.owner || "Abhishek"}
								className="studio-input font-medium"
							/>
						</div>
					</div>

					<div>
						<label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#666666] mb-1 block">
							Follow-up Date
						</label>
						<input
							name="followup"
							type="date"
							defaultValue={initialLead?.followup || ""}
							className="studio-input font-mono"
						/>
					</div>

					<div>
						<label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#666666] mb-1 block">
							Discovery Notes
						</label>
						<textarea
							name="notes"
							rows={2}
							defaultValue={initialLead?.notes || ""}
							placeholder="Key client requirements, scope notes..."
							className="studio-input !h-auto py-2"
						/>
					</div>

					<div className="flex items-center justify-between gap-2.5 pt-3 border-t border-[#EDEDED]">
						{isEditing && initialLead && (
							<button
								type="button"
								disabled={isSubmitting}
								onClick={async () => {
									if (confirm(`Archive opportunity "${initialLead.name}"?`)) {
										setIsSubmitting(true);
										try {
											await leadsRepository.archive(initialLead.id);
											onSuccess();
											onClose();
										} catch (err: unknown) {
											const msg =
												err instanceof Error
													? err.message
													: "Failed to archive opportunity";
											setError(msg);
											setIsSubmitting(false);
										}
									}
								}}
								className="text-[12px] text-rose-600 hover:text-rose-700 font-semibold px-2 py-1 mr-auto transition cursor-pointer"
							>
								Archive
							</button>
						)}
						<div className="flex items-center gap-2.5 ml-auto">
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
								{isSubmitting
									? "Saving..."
									: isEditing
										? "Update Opportunity"
										: "Create Opportunity"}
							</button>
						</div>
					</div>
				</form>
			</div>
		</div>
	);
};
