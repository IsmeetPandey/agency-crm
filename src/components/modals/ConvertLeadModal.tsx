import type React from "react";
import { useMemo, useState } from "react";
import { AlertTriangle, Check, Copy, X } from "lucide-react";
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
	const [allowDuplicateOverride, setAllowDuplicateOverride] = useState(false);
	const [convertedResult, setConvertedResult] = useState<{
		opportunity: Opportunity;
		client: Client;
	} | null>(null);

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

	// Duplicate match detection
	const matchedDuplicateClient = useMemo(() => {
		if (clientMode !== "new") return null;
		const nameTrim = newClientName.trim().toLowerCase();
		const emailTrim = newClientEmail.trim().toLowerCase();

		return (
			clients.find(
				(c) =>
					(emailTrim && c.email?.trim().toLowerCase() === emailTrim) ||
					(nameTrim && c.name.trim().toLowerCase() === nameTrim),
			) || null
		);
	}, [clientMode, newClientName, newClientEmail, clients]);

	const isDuplicateBlocked = Boolean(
		matchedDuplicateClient &&
			(matchedDuplicateClient.email?.trim().toLowerCase() ===
				newClientEmail.trim().toLowerCase() ||
				matchedDuplicateClient.name.trim().toLowerCase() ===
					newClientName.trim().toLowerCase()) &&
			!allowDuplicateOverride,
	);

	const [copiedSku, setCopiedSku] = useState(false);

	const handleCopySku = (sku: string) => {
		navigator.clipboard.writeText(sku);
		setCopiedSku(true);
		toast({
			type: "success",
			title: "Copied Reference",
			message: `${sku} copied to clipboard.`,
		});
		setTimeout(() => setCopiedSku(false), 2000);
	};

	const handleViewConverted = (oppId?: string) => {
		const targetId = oppId || lead.convertedOpportunityId;
		if (targetId && onNavigateOpportunity) {
			onNavigateOpportunity(targetId);
			onClose();
		}
	};

	const handleViewExisting = () => {
		handleViewConverted(lead.convertedOpportunityId);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (isSubmitting || isAlreadyConverted || isDuplicateBlocked) return;

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
					owner,
					actor: owner,
					newClientData:
						clientMode === "new"
							? {
									name: newClientName.trim(),
									contact: newClientContact.trim(),
									email: newClientEmail.trim(),
									notes: newClientNotes.trim(),
								}
							: undefined,
				},
			);

			toast({
				type: "success",
				title: "Opportunity Created",
				message: `Assigned permanent reference ${result.opportunity.opportunityNo} linked to "${result.client.name}".`,
			});

			onSuccess(result.opportunity, result.client);
			setConvertedResult({
				opportunity: result.opportunity,
				client: result.client,
			});
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
						className="text-[var(--ink-muted)] hover:text-[var(--ink)] p-1 rounded-lg transition"
						aria-label="Close"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				{/* Already Converted Notice */}
				{isAlreadyConverted && (
					<div className="p-4 rounded-lg bg-[var(--surface-sunken)] border border-[var(--border)] space-y-3">
						<div className="flex items-center gap-2 text-[#0D9488] font-bold text-[13px]">
							<Check className="w-4 h-4 shrink-0" />
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

				{/* Post-Conversion Success Card */}
				{convertedResult && (
					<div className="p-5 rounded-xl bg-teal-500/10 border border-teal-500/30 text-[var(--ink)] space-y-4">
						<div className="flex items-center gap-3">
							<div className="w-8 h-8 rounded-full bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
								<Check className="w-4 h-4" />
							</div>
							<div>
								<h4 className="font-bold text-[15px] text-[var(--ink)]">
									Opportunity Created Successfully
								</h4>
								<p className="text-[12px] text-[var(--ink-muted)]">
									Permanent tracking SKU assigned and linked to client account.
								</p>
							</div>
						</div>

						<div className="p-3.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-center justify-between">
							<div>
								<span className="text-[11px] font-mono uppercase text-[var(--ink-muted)] block">
									Permanent Reference SKU
								</span>
								<span className="text-[18px] font-bold font-mono text-[var(--accent-text)] tracking-wider">
									{convertedResult.opportunity.opportunityNo}
								</span>
							</div>
							<div className="flex items-center gap-2">
								<button
									type="button"
									onClick={() =>
										handleCopySku(convertedResult.opportunity.opportunityNo)
									}
									className="btn-secondary !h-[32px] !text-[12px] flex items-center gap-1.5"
								>
									{copiedSku ? (
										<>
											<Check className="w-3.5 h-3.5" />
											<span>Copied</span>
										</>
									) : (
										<>
											<Copy className="w-3.5 h-3.5" />
											<span>Copy SKU</span>
										</>
									)}
								</button>
								<button
									type="button"
									onClick={() =>
										handleViewConverted(convertedResult.opportunity.id)
									}
									className="btn-primary !h-[32px] !text-[12px] flex items-center gap-1"
								>
									<span>View Opportunity</span>
									<span>→</span>
								</button>
							</div>
						</div>

						<div className="text-[12px] space-y-1 text-[var(--ink-muted)] pt-1">
							<div>
								Client:{" "}
								<strong className="text-[var(--ink)]">
									{convertedResult.client.name}
								</strong>
							</div>
							<div>
								Deal Stage:{" "}
								<span className="inline-block px-2 py-0.5 text-[11px] font-medium rounded-full bg-[var(--surface-sunken)] border border-[var(--border)] text-[var(--ink)]">
									{convertedResult.opportunity.stage}
								</span>
							</div>
							<div>
								Expected Value:{" "}
								<strong className="text-[var(--ink)] font-mono">
									{formatCurrency(convertedResult.opportunity.value)}
								</strong>
							</div>
						</div>

						<div className="flex justify-end pt-2">
							<button
								type="button"
								onClick={onClose}
								className="btn-secondary !h-[32px] !text-[12px]"
							>
								Done
							</button>
						</div>
					</div>
				)}

				{!isAlreadyConverted && !convertedResult && (
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

									<div>
										<label className="text-[11px] text-[var(--ink-muted)] mb-1 block">
											Client Notes / Onboarding Context
										</label>
										<textarea
											value={newClientNotes}
											onChange={(e) => setNewClientNotes(e.target.value)}
											className="studio-input min-h-[60px] resize-none"
											placeholder="Specific client requirements, onboarding terms, etc."
										/>
									</div>

									{matchedDuplicateClient && (
										<div className="p-3 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[12px] border border-amber-500/20 space-y-2">
											<div className="font-semibold flex items-center gap-1.5">
												<AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
												<span>Potential Duplicate Client Account Detected:</span>
												<span>"{matchedDuplicateClient.name}"</span>
											</div>
											<p className="text-[11px] text-[var(--ink-muted)]">
												An existing client record matches this{" "}
												{matchedDuplicateClient.email?.toLowerCase() ===
												newClientEmail.trim().toLowerCase()
													? "email"
													: "name"}
												. To prevent fragmented client history, associate with
												the existing record.
											</p>
											<div className="flex items-center gap-2 pt-1">
												<button
													type="button"
													onClick={() => {
														setSelectedClientId(matchedDuplicateClient.id);
														setClientMode("existing");
														setTitle(
															`${matchedDuplicateClient.name} / ${lead.service || "Commercial Engagement"}`,
														);
													}}
													className="btn-primary !h-[28px] !text-[11px]"
												>
													Associate with "{matchedDuplicateClient.name}"
												</button>
												<label className="flex items-center gap-1.5 text-[11px] cursor-pointer">
													<input
														type="checkbox"
														checked={allowDuplicateOverride}
														onChange={(e) =>
															setAllowDuplicateOverride(e.target.checked)
														}
														className="rounded border-[var(--border)]"
													/>
													<span>Allow duplicate client creation</span>
												</label>
											</div>
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
						<div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
							{isDuplicateBlocked ? (
								<span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1.5">
									<AlertTriangle className="w-3.5 h-3.5 shrink-0" />
									<span>Resolve duplicate client match before converting</span>
								</span>
							) : (
								<span />
							)}
							<div className="flex items-center gap-3">
								<button
									type="button"
									onClick={onClose}
									className="btn-secondary !h-[34px]"
								>
									Cancel
								</button>
								<button
									type="submit"
									disabled={isSubmitting || isDuplicateBlocked}
									className="btn-primary !h-[34px] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
						</div>
					</form>
				)}
			</div>
		</div>
	);
};
