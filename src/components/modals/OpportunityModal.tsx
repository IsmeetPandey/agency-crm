import type React from "react";
import { useState } from "react";
import { useToast } from "../../lib/feedback/toast.context";
import { opportunitiesRepository } from "../../lib/repositories/opportunities.repository";
import type { Client, Opportunity, OpportunityStage, TeamMemberDetail } from "../../types";
import { OpportunityChip } from "../ui/OpportunityChip";

interface OpportunityModalProps {
	clients: Client[];
	team: TeamMemberDetail[];
	initialOpportunity?: Opportunity | null;
	initialClientId?: string;
	onClose: () => void;
	onSuccess: (opportunity?: Opportunity) => void;
}

const STAGES: OpportunityStage[] = [
	"Open",
	"Qualified",
	"Proposal",
	"Negotiation",
	"Won",
	"Lost",
	"Hold",
];

export const OpportunityModal: React.FC<OpportunityModalProps> = ({
	clients,
	team,
	initialOpportunity,
	initialClientId,
	onClose,
	onSuccess,
}) => {
	const { toast } = useToast();
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const isEditing = !!initialOpportunity;
	const defaultCloseDate = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError(null);
		const fd = new FormData(e.currentTarget);

		const title = String(fd.get("title") || "").trim();
		const clientId = String(fd.get("clientId") || "").trim();
		const service = String(fd.get("service") || "").trim();
		const value = Number(fd.get("value")) || 0;
		const stage = String(fd.get("stage") || "Open") as OpportunityStage;
		const owner = String(fd.get("owner") || "Abhishek").trim();
		const expectedCloseDate = String(fd.get("expectedCloseDate") || "");
		const description = String(fd.get("description") || "").trim();

		if (!title) {
			setError("Opportunity title is required");
			return;
		}
		if (!clientId) {
			setError("Client account association is required");
			return;
		}
		if (!service) {
			setError("Service / Engagement type is required");
			return;
		}
		if (value < 0) {
			setError("Commercial value cannot be negative");
			return;
		}

		setIsSubmitting(true);
		try {
			if (isEditing && initialOpportunity) {
				const updated = await opportunitiesRepository.update(initialOpportunity.id, {
					title,
					service,
					description,
					value,
					stage,
					owner,
					expectedCloseDate,
				});
				toast({
					title: "Opportunity Saved",
					description: `${updated.opportunityNo} • ${updated.title} updated.`,
					type: "success",
				});
				onSuccess(updated);
			} else {
				const created = await opportunitiesRepository.create({
					clientId,
					title,
					service,
					description,
					value,
					currency: "INR",
					stage,
					owner,
					expectedCloseDate,
				});
				toast({
					title: "Opportunity Created",
					description: `Generated permanent reference ${created.opportunityNo}`,
					type: "success",
				});
				onSuccess(created);
			}
			onClose();
		} catch (err: any) {
			setError(err?.message || "Failed to save opportunity.");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDelete = async () => {
		if (!initialOpportunity) return;
		if (
			!window.confirm(
				`Archive opportunity ${initialOpportunity.opportunityNo} (${initialOpportunity.title})?`,
			)
		) {
			return;
		}

		setIsDeleting(true);
		try {
			await opportunitiesRepository.archive(initialOpportunity.id);
			toast({
				title: "Opportunity Archived",
				description: `${initialOpportunity.opportunityNo} moved to archive.`,
				type: "info",
			});
			onSuccess();
			onClose();
		} catch (err: any) {
			setError(err?.message || "Failed to archive opportunity.");
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
			<div className="studio-modal w-full max-w-xl p-6 space-y-4 bg-white border border-[#DEDEDE] shadow-2xl rounded-xl">
				<div className="flex items-center justify-between pb-3 border-b border-[#EDEDED]">
					<div className="flex items-center gap-2.5">
						<h3 className="text-[16px] font-bold text-[#111111]">
							{isEditing ? "Edit Commercial Opportunity" : "New Opportunity Creator"}
						</h3>
						{initialOpportunity && (
							<OpportunityChip
								opportunityNo={initialOpportunity.opportunityNo}
								size="sm"
							/>
						)}
					</div>
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

				<form onSubmit={handleSubmit} className="space-y-3.5">
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<div>
							<label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#666666] mb-1 block">
								Client Account *
							</label>
							<select
								name="clientId"
								required
								disabled={isEditing}
								defaultValue={initialOpportunity?.clientId || initialClientId || clients[0]?.id || ""}
								className="studio-input"
							>
								{clients.map((c) => (
									<option key={c.id} value={c.id}>
										{c.name}
									</option>
								))}
							</select>
						</div>

						<div>
							<label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#666666] mb-1 block">
								Service / Engagement Type *
							</label>
							<input
								name="service"
								required
								defaultValue={initialOpportunity?.service || ""}
								placeholder="e.g. Next.js Commerce & Design System"
								className="studio-input"
							/>
						</div>
					</div>

					<div>
						<label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#666666] mb-1 block">
							Opportunity Title *
						</label>
						<input
							name="title"
							required
							defaultValue={initialOpportunity?.title || ""}
							placeholder="e.g. Orbit / Multi-Region Digital Experience Platform"
							className="studio-input"
						/>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
						<div>
							<label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#666666] mb-1 block">
								Estimated Value (INR ₹) *
							</label>
							<input
								name="value"
								type="number"
								required
								min="0"
								step="5000"
								defaultValue={initialOpportunity?.value || 250000}
								className="studio-input font-mono"
							/>
						</div>

						<div>
							<label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#666666] mb-1 block">
								Sales Stage *
							</label>
							<select
								name="stage"
								required
								defaultValue={initialOpportunity?.stage || "Open"}
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
								Assigned Owner
							</label>
							<select
								name="owner"
								defaultValue={initialOpportunity?.owner || "Abhishek"}
								className="studio-input"
							>
								{team.map((m) => (
									<option key={m.id} value={m.name}>
										{m.name}
									</option>
								))}
							</select>
						</div>
					</div>

					<div>
						<label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#666666] mb-1 block">
							Target Close Date
						</label>
						<input
							name="expectedCloseDate"
							type="date"
							defaultValue={initialOpportunity?.expectedCloseDate || defaultCloseDate}
							className="studio-input"
						/>
					</div>

					<div>
						<label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#666666] mb-1 block">
							Scope & Commercial Description
						</label>
						<textarea
							name="description"
							rows={3}
							defaultValue={initialOpportunity?.description || ""}
							placeholder="Briefly describe project deliverables, client objectives, and commercial terms..."
							className="studio-input resize-none"
						/>
					</div>

					<div className="flex items-center justify-between pt-3 border-t border-[#EDEDED]">
						{isEditing ? (
							<button
								type="button"
								onClick={handleDelete}
								disabled={isDeleting}
								className="text-[12px] font-medium text-rose-600 hover:text-rose-700 underline cursor-pointer"
							>
								{isDeleting ? "Archiving..." : "Archive Opportunity"}
							</button>
						) : (
							<div className="text-[11px] text-[#777777] font-mono">
								Opportunity # generated automatically by database sequence
							</div>
						)}

						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={onClose}
								className="px-4 py-2 rounded-lg border border-[#DEDEDE] text-[#666666] hover:bg-[#F5F5F5] text-[13px] font-medium"
							>
								Cancel
							</button>
							<button
								type="submit"
								disabled={isSubmitting}
								className="px-4 py-2 rounded-lg bg-[#222222] hover:bg-[#111111] text-white text-[13px] font-medium disabled:opacity-50"
							>
								{isSubmitting
									? "Saving..."
									: isEditing
									? "Save Changes"
									: "Generate Opportunity"}
							</button>
						</div>
					</div>
				</form>
			</div>
		</div>
	);
};
