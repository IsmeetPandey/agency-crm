import type React from "react";
import { useState } from "react";
import { STAGE_META, STAGES } from "../../lib/constants/agency";
import { leadsRepository } from "../../lib/repositories/leads.repository";
import type { Lead, LeadStage } from "../../types";

interface PipelineViewProps {
	leads: Lead[];
	onRefresh: () => void;
	onOpenModal: (type: string) => void;
	search: string;
}

export const PipelineView: React.FC<PipelineViewProps> = ({
	leads,
	onRefresh,
	onOpenModal,
	search,
}) => {
	const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
	const [convertingId, setConvertingId] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);

	const filteredLeads = leads.filter((l) => {
		if (!search) return true;
		const s = search.toLowerCase();
		return (
			l.name.toLowerCase().includes(s) ||
			l.service.toLowerCase().includes(s) ||
			l.contact.toLowerCase().includes(s)
		);
	});

	const handleDragStart = (id: string) => {
		setDraggedLeadId(id);
	};

	const handleDrop = async (stage: LeadStage) => {
		if (!draggedLeadId) return;
		try {
			await leadsRepository.updateStage(draggedLeadId, stage);
			onRefresh();
		} catch (e) {
			console.error("Failed to update stage:", e);
		} finally {
			setDraggedLeadId(null);
		}
	};

	const handleConvert = async (leadId: string) => {
		setConvertingId(leadId);
		try {
			const { lead, client } = await leadsRepository.convertToClient(leadId);
			setSuccessMessage(
				`Converted "${lead.name}" to Client "${client.name}" successfully!`,
			);
			setTimeout(() => setSuccessMessage(null), 4000);
			onRefresh();
		} catch (e: any) {
			alert(`Conversion error: ${e.message}`);
		} finally {
			setConvertingId(null);
		}
	};

	return (
		<div className="space-y-4">
			{/* Header & Quick stats */}
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
				<div>
					<h2 className="text-[18px] font-[700] tracking-[-0.02em] text-[#1D1D1F]">
						Sales Pipeline • Liquid Board
					</h2>
					<p className="text-[12px] text-[#86868B]">
						Drag cards between stages or use quick actions to convert won
						opportunities to clients
					</p>
				</div>
				<button
					type="button"
					onClick={() => onOpenModal("lead")}
					className="btn-liquid btn-liquid-primary !h-[32px]"
				>
					+ New Opportunity
				</button>
			</div>

			{successMessage && (
				<div className="p-3 rounded-[12px] bg-[#30D158]/15 border border-[#30D158]/25 text-[#1D1D1F] text-[12px] font-[500] flex items-center justify-between animate-in fade-in">
					<span>✓ {successMessage}</span>
					<button
						type="button"
						onClick={() => setSuccessMessage(null)}
						className="text-[11px] font-[600] text-[#30D158]"
					>
						Dismiss
					</button>
				</div>
			)}

			{/* Kanban Board - 6 stages */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
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
							className="liquid-card p-3 min-h-[500px] flex flex-col"
						>
							{/* Column Header */}
							<div className="flex items-center justify-between pb-2 mb-2 border-b border-black/[0.06]">
								<div className="flex items-center gap-1.5">
									<span
										className="w-2 h-2 rounded-full"
										style={{ backgroundColor: meta.dot }}
									/>
									<span className="text-[12px] font-[650] text-[#1D1D1F]">
										{stage}
									</span>
									<span className="text-[10px] font-[600] px-1.5 py-0.2 rounded-full bg-black/[0.05] text-[#86868B]">
										{stageLeads.length}
									</span>
								</div>
								<span className="text-[11px] font-[600] text-[#86868B]">
									₹{(totalVal / 1000).toFixed(0)}k
								</span>
							</div>

							{/* Cards List */}
							<div className="space-y-2 flex-1 overflow-y-auto mac-scroll">
								{stageLeads.length === 0 && (
									<div className="h-24 border border-dashed border-black/[0.08] rounded-[10px] flex items-center justify-center text-[11px] text-[#86868B]">
										Drop here
									</div>
								)}
								{stageLeads.map((lead) => (
									<div
										key={lead.id}
										draggable
										onDragStart={() => handleDragStart(lead.id)}
										className="p-3 rounded-[12px] bg-white/75 backdrop-blur border border-black/[0.06] hover:bg-white hover:shadow-md cursor-grab active:cursor-grabbing transition space-y-2"
									>
										<div className="flex items-start justify-between">
											<span className="text-[13px] font-[650] text-[#1D1D1F] leading-tight">
												{lead.name}
											</span>
											<span className="text-[11px] font-[700] text-[#6D28D9]">
												₹{(lead.value / 1000).toFixed(0)}k
											</span>
										</div>

										<div className="text-[11px] text-[#86868B] space-y-0.5">
											<div className="truncate font-[500] text-[#1D1D1F]/70">
												{lead.service}
											</div>
											<div className="truncate text-[10px]">
												Contact: {lead.contact || "—"}
											</div>
											<div className="text-[10px]">
												Owner:{" "}
												<span className="text-[#1D1D1F] font-[500]">
													{lead.owner}
												</span>
											</div>
										</div>

										{lead.notes && (
											<div className="text-[10px] text-[#86868B] italic bg-black/[0.02] p-1.5 rounded truncate">
												{lead.notes}
											</div>
										)}

										{/* Quick stage transition buttons */}
										<div className="pt-2 border-t border-black/[0.04] flex items-center justify-between gap-1">
											{stage !== "Won" ? (
												<button
													type="button"
													onClick={() => handleConvert(lead.id)}
													disabled={convertingId === lead.id}
													className="btn-liquid !h-[22px] !text-[10px] !px-2 !bg-[#30D158]/10 !text-[#30D158] hover:!bg-[#30D158]/20"
												>
													{convertingId === lead.id
														? "Converting..."
														: "Convert →"}
												</button>
											) : (
												<span className="text-[10px] font-[600] text-[#30D158]">
													✓ Converted
												</span>
											)}

											<select
												value={lead.stage}
												onChange={(e) => {
													leadsRepository
														.updateStage(lead.id, e.target.value as LeadStage)
														.then(onRefresh);
												}}
												className="text-[10px] bg-transparent border border-black/[0.08] rounded px-1 py-0.5 text-[#86868B]"
											>
												{STAGES.map((s) => (
													<option key={s} value={s}>
														{s}
													</option>
												))}
											</select>
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
