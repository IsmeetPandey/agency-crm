import type React from "react";
import { useState } from "react";
import { STAGES } from "../../lib/constants/agency";
import { leadsRepository } from "../../lib/repositories/leads.repository";
import type { Lead } from "../../types";

interface LeadModalProps {
	onClose: () => void;
	onSuccess: () => void;
}

export const LeadModal: React.FC<LeadModalProps> = ({ onClose, onSuccess }) => {
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError(null);
		const fd = new FormData(e.currentTarget);
		const name = String(fd.get("name") || "").trim();
		if (!name) {
			setError("Company or opportunity name is required");
			return;
		}

		setIsSubmitting(true);
		try {
			await leadsRepository.create({
				name,
				contact: String(fd.get("contact") || ""),
				email: String(fd.get("email") || ""),
				service: String(fd.get("service") || ""),
				value: Number(fd.get("value") || 0),
				stage: String(fd.get("stage") || "New") as any,
				owner: String(fd.get("owner") || "Abhishek"),
				followup: String(fd.get("followup") || ""),
				notes: String(fd.get("notes") || ""),
			});
			onSuccess();
			onClose();
		} catch (err: any) {
			setError(err.message || "Failed to create lead");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
			<div className="liquid-modal w-full max-w-lg p-6 space-y-4">
				<div className="flex items-center justify-between pb-3 border-b border-black/[0.08]">
					<h3 className="text-[16px] font-[700] text-[#1D1D1F]">
						New Opportunity • Sales Pipeline
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
							Opportunity / Brand Name *
						</label>
						<input
							name="name"
							required
							placeholder="e.g. Acme Health"
							className="input-glass"
						/>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="text-[11px] font-[600] uppercase text-[#86868B] mb-1 block">
								Primary Contact
							</label>
							<input
								name="contact"
								placeholder="e.g. Jordan Lee"
								className="input-glass"
							/>
						</div>
						<div>
							<label className="text-[11px] font-[600] uppercase text-[#86868B] mb-1 block">
								Contact Email
							</label>
							<input
								name="email"
								type="email"
								placeholder="jordan@acme.example"
								className="input-glass"
							/>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="text-[11px] font-[600] uppercase text-[#86868B] mb-1 block">
								Service Required
							</label>
							<input
								name="service"
								placeholder="e.g. Next.js Commerce + Brand"
								className="input-glass"
							/>
						</div>
						<div>
							<label className="text-[11px] font-[600] uppercase text-[#86868B] mb-1 block">
								Estimated Value (₹)
							</label>
							<input
								name="value"
								type="number"
								placeholder="250000"
								className="input-glass"
							/>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="text-[11px] font-[600] uppercase text-[#86868B] mb-1 block">
								Initial Stage
							</label>
							<select name="stage" defaultValue="New" className="input-glass">
								{STAGES.map((s) => (
									<option key={s} value={s}>
										{s}
									</option>
								))}
							</select>
						</div>
						<div>
							<label className="text-[11px] font-[600] uppercase text-[#86868B] mb-1 block">
								Owner
							</label>
							<input
								name="owner"
								defaultValue="Abhishek"
								className="input-glass"
							/>
						</div>
					</div>

					<div>
						<label className="text-[11px] font-[600] uppercase text-[#86868B] mb-1 block">
							Follow-up Date
						</label>
						<input name="followup" type="date" className="input-glass" />
					</div>

					<div>
						<label className="text-[11px] font-[600] uppercase text-[#86868B] mb-1 block">
							Discovery Notes
						</label>
						<textarea
							name="notes"
							rows={2}
							placeholder="Key client requirements, scope notes..."
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
							{isSubmitting ? "Saving..." : "Create Opportunity"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};
