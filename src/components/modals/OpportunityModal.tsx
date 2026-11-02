import type React from "react";
import { useState } from "react";
import { useToast } from "../../lib/feedback/toast.context";
import { opportunitiesRepository } from "../../lib/repositories/opportunities.repository";
import type {
	Client,
	Opportunity,
	OpportunityStage,
	TeamMemberDetail,
} from "../../types";
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

const DEFAULT_OWNERS = [
	"Abhishek",
	"Shradha",
	"Ansul",
	"Riya Kapoor",
	"Arnav",
	"Darshan",
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
	const defaultCloseDate = new Date(Date.now() + 30 * 86400000)
		.toISOString()
		.split("T")[0];

	// Combine team member names with defaults
	const ownerOptions = Array.from(
		new Set(
			[
				...team.map((m) => m.name).filter(Boolean),
				...DEFAULT_OWNERS,
				initialOpportunity?.owner,
			].filter((n): n is string => Boolean(n)),
		),
	);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (isSubmitting) return;

		setError(null);
		const fd = new FormData(e.currentTarget);

		const title = String(fd.get("title") || "").trim();
		const clientId = String(fd.get("clientId") || "").trim();
		const service = String(fd.get("service") || "").trim();
		const value = Number(fd.get("value")) || 0;
		const stage = String(fd.get("stage") || "Open") as OpportunityStage;
		const owner = String(
			fd.get("owner") || ownerOptions[0] || "Abhishek",
		).trim();
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
				const updated = await opportunitiesRepository.update(
					initialOpportunity.id,
					{
						title,
						service,
						description,
						value,
						stage,
						owner,
						expectedCloseDate,
					},
				);
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
		} catch (err: unknown) {
			const msg =
				err instanceof Error ? err.message : "Failed to save opportunity.";
			setError(msg);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDelete = async () => {
		if (!initialOpportunity || isDeleting) return;
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
		} catch (err: unknown) {
			const msg =
				err instanceof Error ? err.message : "Failed to archive opportunity.";
			setError(msg);
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in overflow-y-auto">
			<div className="studio-modal w-full max-w-xl p-6 space-y-4 my-8 max-h-[90vh] overflow-y-auto">
				<div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
					<div className="flex items-center gap-2.5">
						<h3 className="text-[16px] font-bold text-[var(--ink-strong)]">
							{isEditing
								? "Edit Commercial Opportunity"
								: "New Opportunity Creator"}
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
						className="text-[var(--ink-muted)] hover:text-[var(--ink)] text-[20px] transition"
						aria-label="Close"
					>
						×
					</button>
				</div>

				{isEditing && initialOpportunity && (
					<div className="flex items-center justify-between p-2.5 rounded-md bg-[var(--surface-sunken)] border border-[var(--border)] text-[12px]">
						<span className="text-[var(--ink-muted)]">
							Permanent SKU (Immutable):
						</span>
						<span className="font-mono font-bold text-[var(--accent-text)]">
							{initialOpportunity.opportunityNo}
						</span>
					</div>
				)}

				{error && (
					<div className="p-2.5 rounded-md bg-[var(--danger-bg)] text-[var(--danger-text)] border border-[var(--danger-border)] text-[12px] font-medium">
						{error}
					</div>
				)}

				<form onSubmit={handleSubmit} className="space-y-3.5">
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<div>
							<label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--ink-muted)] mb-1 block">
								Client Account *
							</label>
							<select
								name="clientId"
								required
								disabled={isEditing}
								defaultValue={
									initialOpportunity?.clientId ||
									initialClientId ||
									clients[0]?.id ||
									""
								}
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
							<label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--ink-muted)] mb-1 block">
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
						<label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--ink-muted)] mb-1 block">
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
							<label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--ink-muted)] mb-1 block">
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
							<label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--ink-muted)] mb-1 block">
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
							<label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--ink-muted)] mb-1 block">
								Assigned Owner
							</label>
							<select
								name="owner"
								defaultValue={
									initialOpportunity?.owner || ownerOptions[0] || "Abhishek"
								}
								className="studio-input font-medium"
							>
								{ownerOptions.map((name) => (
									<option key={name} value={name}>
										{name}
									</option>
								))}
							</select>
						</div>
					</div>

					<div>
						<label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--ink-muted)] mb-1 block">
							Target Close Date
						</label>
						<input
							name="expectedCloseDate"
							type="date"
							defaultValue={
								initialOpportunity?.expectedCloseDate || defaultCloseDate
							}
							className="studio-input"
						/>
					</div>

					<div>
						<label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--ink-muted)] mb-1 block">
							Scope & Commercial Description
						</label>
						<textarea
							name="description"
							rows={3}
							defaultValue={initialOpportunity?.description || ""}
							placeholder="Briefly describe project deliverables, client objectives, and commercial terms..."
							className="studio-input !h-auto py-2 resize-none"
						/>
					</div>

					<div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
						{isEditing ? (
							<button
								type="button"
								onClick={handleDelete}
								disabled={isDeleting}
								className="text-[12px] font-medium text-[var(--danger)] hover:underline cursor-pointer"
							>
								{isDeleting ? "Archiving..." : "Archive Opportunity"}
							</button>
						) : (
							<div className="text-[11px] text-[var(--ink-muted)] font-mono">
								Opportunity # generated automatically by sequence
								(KW-OPP-XXXXXX)
							</div>
						)}

						<div className="flex items-center gap-2">
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
