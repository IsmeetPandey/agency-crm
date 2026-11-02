import type React from "react";
import { useMemo, useState } from "react";
import { useToast } from "../../lib/feedback/toast.context";
import { leadsRepository } from "../../lib/repositories/leads.repository";
import { formatCurrency } from "../../lib/utils/format";
import type {
	Client,
	Lead,
	Opportunity,
	OpportunityStage,
	TeamMemberDetail,
} from "../../types";
import { OpportunityChip } from "../ui/OpportunityChip";

interface ConvertLeadModalProps {
	lead: Lead;
	clients: Client[];
	team: TeamMemberDetail[];
	onClose: () => void;
	onSuccess: (opportunity: Opportunity, client: Client) => void;
	onNavigateOpportunity?: (opportunityId: string) => void;
}

const STAGES: OpportunityStage[] = [
	"Qualified",
	"Open",
	"Proposal",
	"Negotiation",
	"Won",
];

export const ConvertLeadModal: React.FC<ConvertLeadModalProps> = ({
	lead,
	clients,
	team,
	onClose,
	onSuccess,
	onNavigateOpportunity,
}) => {
	const { toast } = useToast();
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const isAlreadyConverted = Boolean(
		lead.convertedOpportunityId || lead.convertedOpportunityNo,
	);

	// Auto-match existing client by email or name
	const matchedExistingClient = useMemo(() => {
		const leadEmail = lead.email?.trim().toLowerCase();
		const leadName = lead.name.trim().toLowerCase();

		return (
			clients.find(
				(c) =>
					(leadEmail && c.email?.trim().toLowerCase() === leadEmail) ||
					c.name.trim().toLowerCase() === leadName,
			) || null
		);
	}, [clients, lead]);

	const [clientMode, setClientMode] = useState<"existing" | "new">(
		matchedExistingClient ? "existing" : "new",
	);
	const [selectedClientId, setSelectedClientId] = useState<string>(
		matchedExistingClient?.id || clients[0]?.id || "",
	);

	// New client fields
	const [newClientName, setNewClientName] = useState(lead.name);
	const [newClientContact, setNewClientContact] = useState(lead.contact || "");
	const [newClientEmail, setNewClientEmail] = useState(lead.email || "");
	const [newClientNotes, setNewClientNotes] = useState(lead.notes || "");

	// Opportunity parameters
	const [title, setTitle] = useState(
		`${lead.name} / ${lead.service || "Commercial Engagement"}`,
	);
	const [stage, setStage] = useState<OpportunityStage>("Qualified");
	const [value, setValue] = useState(lead.value || 0);
	const [owner, setOwner] = useState(lead.owner || team[0]?.name || "Abhishek");
	const [expectedCloseDate, setExpectedCloseDate] = useState(
		new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
	);

	// Duplicate warning when typing a new client that matches an existing one
	const duplicateWarning = useMemo(() => {
		if (clientMode !== "new") return null;
		const nameTrim = newClientName.trim().toLowerCase();
		const emailTrim = newClientEmail.trim().toLowerCase();

		const match = clients.find(
			(c) =>
				(emailTrim && c.email?.trim().toLowerCase() === emailTrim) ||
				(nameTrim && c.name.trim().toLowerCase() === nameTrim),
		);
		return match ? match.name : null;
	}, [clientMode, newClientName, newClientEmail, clients]);

	const handleViewExisting = () => {
		if (lead.convertedOpportunityId && onNavigateOpportunity) {
			onNavigateOpportunity(lead.convertedOpportunityId);
			onClose();
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (isSubmitting || isAlreadyConverted) return;

		setError(null);
		setIsSubmitting(true);

		try {
			const targetClientId =
				clientMode === "existing" ? selectedClientId : undefined;

			const result = await leadsRepository.convertToOpportunityAndClient(
				lead.id,
				{
					targetClientId,
					initialStage: stage,
					title: title.trim(),
					value: Number(value) || 0,
					expectedCloseDate,
					actor: owner,
				},
			);

			toast({
				type: "success",
				title: "Opportunity Created",
				message: `Assigned permanent reference ${result.opportunity.opportunityNo} linked to "${result.client.name}".`,
			});

			onSuccess(result.opportunity, result.client);
			onClose();
		} catch (err: any) {
			console.error("Conversion failed:", err);
			setError(err.message || "Failed to convert lead into opportunity.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in overflow-y-auto">
			<div className="studio-modal w-full max-w-xl p-6 space-y-5 my-8 max-h-[90vh] overflow-y-auto">
				{/* Header */}
				<div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
					<div>
						<h3 className="text-[17px] font-bold text-[var(--ink)] tracking-tight">
							Convert Lead to Tracked Opportunity
						</h3>
						<p className="text-[12px] text-[var(--ink-muted)]">
							Generates a permanent company-wide reference SKU (e.g.
							KW-OPP-XXXXXX)
						</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="text-[var(--ink-muted)] hover:text-[var(--ink)] text-[20px] transition"
					>
						×
					</button>
				</div>

				{/* Already Converted Notice */}
				{isAlreadyConverted && (
					<div className="p-4 rounded-lg bg-[var(--surface-sunken)] border border-[var(--border)] space-y-3">
						<div className="flex items-center gap-2 text-[#0D9488] font-bold text-[13px]">
							<span>✓</span>
							<span>
								This lead has already been converted into an opportunity.
							</span>
						</div>
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<span className="text-[12px] text-[var(--ink-muted)]">
									Permanent Reference:
								</span>
								<OpportunityChip
									opportunityNo={lead.convertedOpportunityNo || "KW-OPP"}
									opportunityId={lead.convertedOpportunityId}
									onNavigate={() => handleViewExisting()}
								/>
							</div>
							<button
								type="button"
								onClick={handleViewExisting}
								className="btn-primary !h-[30px] !text-[12px]"
							>
								View Opportunity →
							</button>
						</div>
					</div>
				)}

				{error && (
					<div className="p-3 rounded bg-[var(--danger-bg)] text-[var(--danger-text)] text-[12px] font-medium border border-[var(--danger-border)]">
						{error}
					</div>
				)}

				{/* Source Lead Context Card */}
				<div className="p-3.5 rounded-lg bg-[var(--surface-sunken)] border border-[var(--border)] text-[12px] space-y-1">
					<div className="flex items-center justify-between font-semibold">
						<span className="text-[var(--ink)]">{lead.name}</span>
						<span className="font-mono text-[var(--accent-text)]">
							{formatCurrency(lead.value)}
						</span>
					</div>
					<div className="text-[var(--ink-muted)] flex items-center gap-3 text-[11px]">
						<span>Service: {lead.service || "Consulting"}</span>
						<span>•</span>
						<span>Contact: {lead.contact || "—"}</span>
						<span>•</span>
						<span>Current Pipeline: {lead.stage}</span>
					</div>
					{lead.notes && (
						<p className="text-[11px] text-[var(--ink-muted)] italic pt-1 truncate">
							"{lead.notes}"
						</p>
					)}
				</div>

				{!isAlreadyConverted && (
					<form onSubmit={handleSubmit} className="space-y-4">
						{/* Step 1: Client Account Association */}
						<div className="space-y-2">
							<label className="text-[11px] font-mono uppercase tracking-wider text-[var(--ink-muted)] block font-semibold">
								1. Client Account Association
							</label>

							<div className="flex rounded-md border border-[var(--border)] p-1 bg-[var(--surface-sunken)]">
								<button
									type="button"
									onClick={() => setClientMode("existing")}
									className={`flex-1 py-1 text-[12px] font-medium rounded transition ${
										clientMode === "existing"
											? "bg-[var(--surface)] text-[var(--ink)] shadow-xs"
											: "text-[var(--ink-muted)] hover:text-[var(--ink)]"
									}`}
								>
									Associate Existing Client
								</button>
								<button
									type="button"
									onClick={() => setClientMode("new")}
									className={`flex-1 py-1 text-[12px] font-medium rounded transition ${
										clientMode === "new"
											? "bg-[var(--surface)] text-[var(--ink)] shadow-xs"
											: "text-[var(--ink-muted)] hover:text-[var(--ink)]"
									}`}
								>
									Create New Client
								</button>
							</div>

							{clientMode === "existing" ? (
								<div>
									<select
										value={selectedClientId}
										onChange={(e) => {
											setSelectedClientId(e.target.value);
											const cl = clients.find((c) => c.id === e.target.value);
											if (cl) {
												setTitle(
													`${cl.name} / ${lead.service || "Commercial Engagement"}`,
												);
											}
										}}
										className="studio-input"
										required
									>
										{clients.map((c) => (
											<option key={c.id} value={c.id}>
												{c.name} {c.email ? `(${c.email})` : ""}
											</option>
										))}
									</select>
									{matchedExistingClient && (
										<p className="text-[11px] text-[#0D9488] mt-1 font-medium">
											Matched existing client account:{" "}
											<strong>{matchedExistingClient.name}</strong>
										</p>
									)}
								</div>
							) : (
								<div className="space-y-2.5 p-3 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
									<div>
										<label className="text-[11px] text-[var(--ink-muted)] mb-1 block">
											Client Legal / Brand Name *
										</label>
										<input
											value={newClientName}
											onChange={(e) => {
												setNewClientName(e.target.value);
												setTitle(
													`${e.target.value} / ${lead.service || "Commercial Engagement"}`,
												);
											}}
											className="studio-input"
											required
										/>
									</div>

									<div className="grid grid-cols-2 gap-2">
										<div>
											<label className="text-[11px] text-[var(--ink-muted)] mb-1 block">
												Key Contact
											</label>
											<input
												value={newClientContact}
												onChange={(e) => setNewClientContact(e.target.value)}
												className="studio-input"
												placeholder="Full Name"
											/>
										</div>
										<div>
											<label className="text-[11px] text-[var(--ink-muted)] mb-1 block">
												Billing / Primary Email
											</label>
											<input
												type="email"
												value={newClientEmail}
												onChange={(e) => setNewClientEmail(e.target.value)}
												className="studio-input"
												placeholder="contact@company.com"
											/>
										</div>
									</div>

									{duplicateWarning && (
										<div className="p-2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] border border-amber-500/20">
											⚠️ A client named "<strong>{duplicateWarning}</strong>"
											already exists. Switch to "Associate Existing Client" to
											prevent duplicate records.
										</div>
									)}
								</div>
							)}
						</div>

						{/* Step 2: Opportunity Scope & Lifecycle */}
						<div className="space-y-2 pt-2 border-t border-[var(--border)]">
							<label className="text-[11px] font-mono uppercase tracking-wider text-[var(--ink-muted)] block font-semibold">
								2. Opportunity Deal Parameters
							</label>

							<div>
								<label className="text-[11px] text-[var(--ink-muted)] mb-1 block">
									Opportunity Title *
								</label>
								<input
									value={title}
									onChange={(e) => setTitle(e.target.value)}
									className="studio-input"
									required
								/>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<div>
									<label className="text-[11px] text-[var(--ink-muted)] mb-1 block">
										Initial Deal Stage
									</label>
									<select
										value={stage}
										onChange={(e) =>
											setStage(e.target.value as OpportunityStage)
										}
										className="studio-input"
									>
										{STAGES.map((s) => (
											<option key={s} value={s}>
												{s} {s === "Qualified" ? "(Recommended)" : ""}
											</option>
										))}
									</select>
									<p className="text-[10px] text-[var(--ink-muted)] mt-1">
										Conversion creates a tracked deal without falsely claiming
										it as "Won".
									</p>
								</div>

								<div>
									<label className="text-[11px] text-[var(--ink-muted)] mb-1 block">
										Estimated Value (₹)
									</label>
									<input
										type="number"
										value={value}
										onChange={(e) => setValue(Number(e.target.value))}
										className="studio-input font-mono"
										min={0}
									/>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<div>
									<label className="text-[11px] text-[var(--ink-muted)] mb-1 block">
										Opportunity Owner
									</label>
									<select
										value={owner}
										onChange={(e) => setOwner(e.target.value)}
										className="studio-input"
									>
										{team.map((m) => (
											<option key={m.id} value={m.name}>
												{m.name} ({m.roleTitle})
											</option>
										))}
									</select>
								</div>
								<div>
									<label className="text-[11px] text-[var(--ink-muted)] mb-1 block">
										Target Close Date
									</label>
									<input
										type="date"
										value={expectedCloseDate}
										onChange={(e) => setExpectedCloseDate(e.target.value)}
										className="studio-input"
									/>
								</div>
							</div>
						</div>

						{/* Actions */}
						<div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border)]">
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
								className="btn-primary !h-[34px] flex items-center gap-2"
							>
								{isSubmitting ? (
									<>
										<span className="animate-spin text-[12px]">⟳</span>
										<span>Converting...</span>
									</>
								) : (
									<span>Convert to Opportunity →</span>
								)}
							</button>
						</div>
					</form>
				)}
			</div>
		</div>
	);
};
