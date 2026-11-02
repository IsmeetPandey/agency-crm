import type React from "react";
import { useMemo, useState } from "react";
import { Pencil } from "lucide-react";
import { OpportunityChip } from "../../components/ui/OpportunityChip";
import { STAGE_META, STAGES } from "../../lib/constants/agency";
import { useToast } from "../../lib/feedback/toast.context";
import { leadsRepository } from "../../lib/repositories/leads.repository";
import type { Lead, LeadStage } from "../../types";

interface PipelineViewProps {
	leads: Lead[];
	onRefresh: () => void;
	onOpenModal: (type: string, data?: any) => void;
	onNavigate?: (view: string, id?: string) => void;
	search: string;
}

export const PipelineView: React.FC<PipelineViewProps> = ({
	leads,
	onRefresh,
	onOpenModal,
	onNavigate,
	search,
}) => {
	const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
	const [selectedOwner, setSelectedOwner] = useState<string>("All");
	const [selectedService, setSelectedService] = useState<string>("All");
	const { toast } = useToast();

	// Distinct owners & services for filtering
	const owners = useMemo(() => {
		const set = new Set<string>();
		for (const l of leads) {
			if (l.owner) set.add(l.owner);
		}
		return ["All", ...Array.from(set).sort()];
	}, [leads]);

	const services = useMemo(() => {
		const set = new Set<string>();
		for (const l of leads) {
			if (l.service) set.add(l.service);
		}
		return ["All", ...Array.from(set).sort()];
	}, [leads]);

	const filteredLeads = leads.filter((l) => {
		if (selectedOwner !== "All" && l.owner !== selectedOwner) return false;
		if (selectedService !== "All" && l.service !== selectedService)
			return false;
		if (!search) return true;
		const s = search.toLowerCase();
		return (
			l.name.toLowerCase().includes(s) ||
			l.service.toLowerCase().includes(s) ||
			l.contact.toLowerCase().includes(s) ||
			l.owner.toLowerCase().includes(s)
		);
	});

	const handleDragStart = (id: string) => {
		setDraggedLeadId(id);
	};

	const handleDrop = async (stage: LeadStage) => {
		if (!draggedLeadId) return;
		try {
			await leadsRepository.updateStage(draggedLeadId, stage);
			toast({
				type: "info",
				title: "Pipeline Updated",
				message: `Lead moved to "${stage}"`,
			});
			onRefresh();
		} catch (e: any) {
			toast({
				type: "error",
				title: "Update Failed",
				message: e.message || "Failed to update stage",
			});
		} finally {
			setDraggedLeadId(null);
		}
	};

	return (
		<div className="space-y-6">
			{/* Top Header */}
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
				<div>
					<h2 className="text-[18px] font-bold text-[var(--ink-strong)] tracking-tight">
						Sales Pipeline & Opportunity Engine
					</h2>
					<p className="text-[12px] text-[var(--ink-muted)]">
						Qualify prospective engagements, drag across pipeline stages, and
						convert to permanent commercial opportunities
					</p>
				</div>
				<button
					type="button"
					onClick={() => onOpenModal("lead")}
					className="btn-primary !h-[34px]"
				>
					+ New Prospective Lead
				</button>
			</div>

			{/* Filter Controls Bar */}
			<div className="studio-card p-3 flex flex-wrap items-center gap-4 text-[12px]">
				<div className="flex items-center gap-2">
					<span className="text-[var(--ink-muted)] font-mono text-[10px] uppercase font-bold tracking-wider">
						Owner:
					</span>
					<select
						value={selectedOwner}
						onChange={(e) => setSelectedOwner(e.target.value)}
						className="studio-input !h-[30px] !py-0 !text-[12px] !px-2 rounded-md max-w-[160px]"
					>
						{owners.map((o) => (
							<option key={o} value={o}>
								{o}
							</option>
						))}
					</select>
				</div>

				<div className="flex items-center gap-2">
					<span className="text-[var(--ink-muted)] font-mono text-[10px] uppercase font-bold tracking-wider">
						Service:
					</span>
					<select
						value={selectedService}
						onChange={(e) => setSelectedService(e.target.value)}
						className="studio-input !h-[30px] !py-0 !text-[12px] !px-2 rounded-md max-w-[200px]"
					>
						{services.map((s) => (
							<option key={s} value={s}>
								{s}
							</option>
						))}
					</select>
				</div>

				{(selectedOwner !== "All" || selectedService !== "All") && (
					<button
						type="button"
						onClick={() => {
							setSelectedOwner("All");
							setSelectedService("All");
						}}
						className="text-[11px] text-[var(--accent)] font-semibold hover:underline ml-auto"
					>
						Reset Filters
					</button>
				)}
			</div>

			{/* Kanban Board - 6 stages */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
				{STAGES.map((stage) => {
					const meta = STAGE_META[stage];
					const stageLeads = filteredLeads.filter((l) => l.stage === stage);
					const totalVal = stageLeads.reduce(
						(s, l) => s + (Number(l.value) || 0),
						0,
					);

					return (
						<div
							key={stage}
							onDragOver={(e) => e.preventDefault()}
							onDrop={() => handleDrop(stage as LeadStage)}
							className="studio-card p-3 min-h-[520px] flex flex-col bg-[var(--surface-sunken)] border-[var(--border)]"
						>
							{/* Column Header */}
							<div className="flex items-center justify-between pb-2 mb-3 border-b border-[var(--border)]">
								<div className="flex items-center gap-1.5">
									<span
										className="w-2.5 h-2.5 rounded-full"
										style={{ backgroundColor: meta.dot }}
									/>
									<span className="text-[12px] font-bold text-[var(--ink-strong)]">
										{stage}
									</span>
									<span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-[var(--surface)] text-[var(--ink-secondary)] border border-[var(--border)]">
										{stageLeads.length}
									</span>
								</div>
								<span className="text-[11px] font-mono font-bold text-[var(--ink-secondary)]">
									₹{(totalVal / 1000).toFixed(0)}k
								</span>
							</div>

							{/* Cards List */}
							<div className="space-y-2.5 flex-1 overflow-y-auto pr-0.5">
								{stageLeads.length === 0 && (
									<div className="h-28 border border-dashed border-[var(--border)] rounded-lg flex items-center justify-center text-[11px] text-[var(--ink-muted)] font-medium">
										Drop leads here
									</div>
								)}
								{stageLeads.map((lead) => (
									<div
										key={lead.id}
										draggable
										onDragStart={() => handleDragStart(lead.id)}
										className="p-3.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] hover:shadow-md cursor-grab active:cursor-grabbing transition space-y-2.5 group"
									>
										<div className="flex items-start justify-between gap-2">
											<button
												type="button"
												onClick={() => onOpenModal("lead", { lead })}
												className="text-[13px] font-bold text-[var(--ink-strong)] leading-tight text-left hover:text-[var(--accent)] transition truncate"
											>
												{lead.name}
											</button>
											<span className="text-[11px] font-mono font-bold text-[var(--accent-text)] shrink-0">
												₹{(lead.value / 1000).toFixed(0)}k
											</span>
										</div>

										<div className="text-[11px] text-[var(--ink-muted)] space-y-0.5 font-mono">
											<div className="truncate font-sans font-medium text-[var(--ink)]">
												{lead.service}
											</div>
											<div className="truncate text-[10px]">
												Contact: {lead.contact || "—"}
											</div>
											<div className="text-[10px]">
												Owner:{" "}
												<span className="font-semibold text-[var(--ink)]">
													{lead.owner}
												</span>
											</div>
										</div>

										{lead.notes && (
											<div className="text-[10px] text-[var(--ink-muted)] italic bg-[var(--surface-sunken)] p-2 rounded border border-[var(--border)] truncate">
												{lead.notes}
											</div>
										)}

										{lead.convertedOpportunityNo && (
											<div className="pt-0.5">
												<OpportunityChip
													opportunityNo={lead.convertedOpportunityNo}
													opportunityId={lead.convertedOpportunityId}
													onNavigate={(id) => onNavigate?.("opportunity", id)}
												/>
											</div>
										)}

										{/* Quick actions */}
										<div className="pt-2 border-t border-[var(--border)] flex items-center justify-between gap-1">
											{lead.convertedOpportunityNo ? (
												<button
													type="button"
													onClick={() =>
														onNavigate?.(
															"opportunity",
															lead.convertedOpportunityId,
														)
													}
													className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[var(--accent-tint)] text-[var(--accent-text)] hover:opacity-90 border border-[var(--accent-border)] transition flex items-center gap-1 font-mono"
												>
													<span>View Deal →</span>
												</button>
											) : (
												<button
													type="button"
													onClick={() => onOpenModal("convert-lead", { lead })}
													className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[var(--accent-tint)] text-[var(--accent-text)] hover:opacity-90 border border-[var(--accent-border)] transition"
												>
													Convert to Opportunity →
												</button>
											)}

											<div className="flex items-center gap-1">
												<button
													type="button"
													onClick={() => onOpenModal("lead", { lead })}
													className="p-1 rounded text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-sunken)] transition"
													title="Edit Lead"
													aria-label="Edit Lead"
												>
													<Pencil className="w-3.5 h-3.5" />
												</button>
												<select
													value={lead.stage}
													onChange={(e) => {
														leadsRepository
															.updateStage(lead.id, e.target.value as LeadStage)
															.then(() => {
																toast({
																	type: "info",
																	message: `Stage set to ${e.target.value}`,
																});
																onRefresh();
															});
													}}
													className="text-[10px] font-mono bg-[var(--surface)] border border-[var(--border)] rounded px-1.5 py-0.5 text-[var(--ink-secondary)]"
												>
													{STAGES.map((s) => (
														<option key={s} value={s}>
															{s}
														</option>
													))}
												</select>
											</div>
										</div>
									</div>
								))}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
};
