import type React from "react";
import { useMemo, useState } from "react";
import { OpportunityChip } from "../../components/ui/OpportunityChip";
import { useToast } from "../../lib/feedback/toast.context";
import { opportunitiesRepository } from "../../lib/repositories/opportunities.repository";
import {
	formatCompactCurrency,
	formatCurrency,
	formatMultiCurrency,
	sumByCurrency,
} from "../../lib/utils/format";
import type {
	Client,
	Opportunity,
	OpportunityStage,
	TeamMemberDetail,
} from "../../types";

interface OpportunitiesViewProps {
	opportunities: Opportunity[];
	clients: Client[];
	team: TeamMemberDetail[];
	onOpenModal: (type: string, data?: any) => void;
	onSelectOpportunity: (opportunityId: string) => void;
	onRefresh: () => void;
	search: string;
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

const STAGE_COLORS: Record<
	OpportunityStage,
	{ bg: string; text: string; border: string }
> = {
	Open: {
		bg: "bg-blue-50 dark:bg-blue-950/50",
		text: "text-blue-700 dark:text-blue-300",
		border: "border-blue-200 dark:border-blue-800",
	},
	Qualified: {
		bg: "bg-purple-50 dark:bg-purple-950/50",
		text: "text-purple-700 dark:text-purple-300",
		border: "border-purple-200 dark:border-purple-800",
	},
	Proposal: {
		bg: "bg-amber-50 dark:bg-amber-950/50",
		text: "text-amber-700 dark:text-amber-300",
		border: "border-amber-200 dark:border-amber-800",
	},
	Negotiation: {
		bg: "bg-orange-50 dark:bg-orange-950/50",
		text: "text-orange-700 dark:text-orange-300",
		border: "border-orange-200 dark:border-orange-800",
	},
	Won: {
		bg: "bg-emerald-50 dark:bg-emerald-950/50",
		text: "text-emerald-700 dark:text-emerald-300",
		border: "border-emerald-200 dark:border-emerald-800",
	},
	Lost: {
		bg: "bg-rose-50 dark:bg-rose-950/50",
		text: "text-rose-700 dark:text-rose-300",
		border: "border-rose-200 dark:border-rose-800",
	},
	Hold: {
		bg: "bg-slate-100 dark:bg-slate-800",
		text: "text-slate-700 dark:text-slate-300",
		border: "border-slate-300 dark:border-slate-700",
	},
};

export const OpportunitiesView: React.FC<OpportunitiesViewProps> = ({
	opportunities,
	clients,
	team,
	onOpenModal,
	onSelectOpportunity,
	onRefresh,
	search: externalSearch,
}) => {
	const { toast } = useToast();
	const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
	const [localSearch, setLocalSearch] = useState("");
	const [selectedStage, setSelectedStage] = useState<string>("All");
	const [selectedClient, setSelectedClient] = useState<string>("All");
	const [selectedOwner, setSelectedOwner] = useState<string>("All");
	const [draggedOppId, setDraggedOppId] = useState<string | null>(null);

	const clientMap = useMemo(() => {
		const map = new Map<string, Client>();
		for (const c of clients) {
			map.set(c.id, c);
		}
		return map;
	}, [clients]);

	// Filtered list
	const searchQuery = (externalSearch || localSearch).toLowerCase().trim();

	const filteredOpportunities = useMemo(() => {
		return opportunities.filter((opp) => {
			if (selectedStage !== "All" && opp.stage !== selectedStage) return false;
			if (selectedClient !== "All" && opp.clientId !== selectedClient)
				return false;
			if (selectedOwner !== "All" && opp.owner !== selectedOwner) return false;

			if (!searchQuery) return true;

			const clientName = clientMap.get(opp.clientId)?.name || "";
			return (
				opp.opportunityNo.toLowerCase().includes(searchQuery) ||
				opp.title.toLowerCase().includes(searchQuery) ||
				opp.service.toLowerCase().includes(searchQuery) ||
				opp.owner.toLowerCase().includes(searchQuery) ||
				clientName.toLowerCase().includes(searchQuery)
			);
		});
	}, [
		opportunities,
		selectedStage,
		selectedClient,
		selectedOwner,
		searchQuery,
		clientMap,
	]);

	// Multi-Currency Metrics
	const metrics = useMemo(() => {
		const activeDeals = opportunities.filter(
			(o) => o.stage !== "Won" && o.stage !== "Lost",
		);
		const wonDeals = opportunities.filter((o) => o.stage === "Won");

		const activeSums = sumByCurrency(activeDeals);
		const wonSums = sumByCurrency(wonDeals);

		const avgActiveSums: Record<string, number> = {};
		if (activeDeals.length > 0) {
			for (const [curr, val] of Object.entries(activeSums)) {
				avgActiveSums[curr] = Math.round(val / activeDeals.length);
			}
		}

		return {
			activeCount: activeDeals.length,
			activeSums,
			wonCount: wonDeals.length,
			wonSums,
			avgActiveSums,
		};
	}, [opportunities]);

	// Owners for filter dropdown
	const owners = useMemo(() => {
		const set = new Set<string>();
		for (const o of opportunities) {
			if (o.owner) set.add(o.owner);
		}
		for (const m of team) {
			if (m.name) set.add(m.name);
		}
		return ["All", ...Array.from(set).sort()];
	}, [opportunities, team]);

	const handleStageChange = async (
		oppId: string,
		newStage: OpportunityStage,
	) => {
		try {
			await opportunitiesRepository.update(oppId, { stage: newStage });
			toast({
				title: "Stage Updated",
				description: `Opportunity stage updated to "${newStage}".`,
				type: "success",
			});
			onRefresh();
		} catch (err: unknown) {
			const msg =
				err instanceof Error ? err.message : "Could not update stage.";
			toast({
				title: "Update Failed",
				description: msg,
				type: "error",
			});
		}
	};

	const handleArchive = async (opp: Opportunity) => {
		if (
			!window.confirm(
				`Archive opportunity ${opp.opportunityNo} - "${opp.title}"?`,
			)
		)
			return;
		try {
			await opportunitiesRepository.archive(opp.id);
			toast({
				title: "Opportunity Archived",
				description: `"${opp.title}" moved to archive.`,
				type: "info",
			});
			onRefresh();
		} catch (err: unknown) {
			const msg =
				err instanceof Error ? err.message : "Could not archive opportunity.";
			toast({
				title: "Archive Failed",
				description: msg,
				type: "error",
			});
		}
	};

	const handleDragStart = (id: string) => {
		setDraggedOppId(id);
	};

	const handleDrop = async (stage: OpportunityStage) => {
		if (!draggedOppId) return;
		try {
			await opportunitiesRepository.update(draggedOppId, { stage });
			toast({
				title: "Opportunity Moved",
				description: `Moved deal to ${stage}`,
				type: "info",
			});
			onRefresh();
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : "Could not move deal";
			toast({
				title: "Update Failed",
				description: msg,
				type: "error",
			});
		} finally {
			setDraggedOppId(null);
		}
	};

	return (
		<div className="space-y-6">
			{/* Top Header */}
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
				<div>
					<div className="flex items-center gap-2.5">
						<h2 className="text-[18px] font-bold text-slate-900 tracking-tight">
							Commercial Opportunities
						</h2>
						<span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
							{opportunities.length} Total Deals
						</span>
					</div>
					<p className="text-[12px] text-slate-500 mt-0.5">
						Track multi-opportunity client portfolios with permanent sequential
						tracking (KW-OPP-00000X)
					</p>
				</div>

				<div className="flex items-center gap-2">
					{/* Toggle View Mode */}
					<div className="inline-flex rounded-md border border-slate-200 bg-slate-100 p-0.5 text-[11px] font-medium text-slate-600">
						<button
							type="button"
							onClick={() => setViewMode("table")}
							className={`px-3 py-1 rounded transition cursor-pointer ${
								viewMode === "table"
									? "bg-white text-slate-900 shadow-xs font-semibold"
									: "hover:text-slate-900"
							}`}
						>
							☰ List
						</button>
						<button
							type="button"
							onClick={() => setViewMode("kanban")}
							className={`px-3 py-1 rounded transition cursor-pointer ${
								viewMode === "kanban"
									? "bg-white text-slate-900 shadow-xs font-semibold"
									: "hover:text-slate-900"
							}`}
						>
							☷ Pipeline
						</button>
					</div>

					<button
						type="button"
						onClick={() => onOpenModal("opportunity")}
						className="btn-primary !h-[34px] flex items-center gap-1.5 cursor-pointer text-[12px]"
					>
						<span>+</span>
						<span>New Opportunity</span>
					</button>
				</div>
			</div>

			{/* Executive Metrics Bar */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				<div className="studio-card p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
					<div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-500">
						Active Deals
					</div>
					<div className="text-[22px] font-bold text-slate-900 mt-1">
						{metrics.activeCount}
					</div>
					<div className="text-[11px] text-slate-500 mt-0.5 font-mono">
						In commercial pipeline
					</div>
				</div>

				<div className="studio-card p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
					<div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-500">
						Active Pipeline Value
					</div>
					<div
						className="text-[20px] font-bold text-blue-600 mt-1 truncate"
						title={formatMultiCurrency(metrics.activeSums)}
					>
						{formatMultiCurrency(metrics.activeSums, true)}
					</div>
					<div className="text-[11px] text-slate-500 mt-0.5 font-mono truncate">
						{formatMultiCurrency(metrics.activeSums, false)}
					</div>
				</div>

				<div className="studio-card p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
					<div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-500">
						Closed Won Revenue
					</div>
					<div
						className="text-[20px] font-bold text-emerald-600 mt-1 truncate"
						title={formatMultiCurrency(metrics.wonSums)}
					>
						{formatMultiCurrency(metrics.wonSums, true)}
					</div>
					<div className="text-[11px] text-slate-500 mt-0.5 font-mono truncate">
						{metrics.wonCount} won contracts •{" "}
						{formatMultiCurrency(metrics.wonSums, false)}
					</div>
				</div>

				<div className="studio-card p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
					<div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-500">
						Avg Active Deal
					</div>
					<div
						className="text-[20px] font-bold text-purple-600 mt-1 truncate"
						title={formatMultiCurrency(metrics.avgActiveSums)}
					>
						{formatMultiCurrency(metrics.avgActiveSums, true)}
					</div>
					<div className="text-[11px] text-slate-500 mt-0.5 font-mono truncate">
						Commercial deal size
					</div>
				</div>
			</div>

			{/* Filters Bar */}
			<div className="studio-card p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-wrap items-center justify-between gap-3">
				<div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
					<div className="relative flex-1 min-w-[200px] max-w-sm">
						<input
							type="text"
							placeholder="Search by KW-OPP-, title, client, service..."
							value={externalSearch || localSearch}
							onChange={(e) => setLocalSearch(e.target.value)}
							className="w-full h-8 pl-8 pr-3 text-[12px] bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
						/>
						<span className="absolute left-2.5 top-2 text-[12px] text-slate-400">
							🔍
						</span>
					</div>

					{/* Stage Filter */}
					<div className="flex items-center gap-1.5 text-[12px]">
						<span className="text-slate-500 font-medium">Stage:</span>
						<select
							value={selectedStage}
							onChange={(e) => setSelectedStage(e.target.value)}
							className="h-8 px-2.5 text-[12px] bg-white border border-slate-200 rounded-lg text-slate-700 font-medium"
						>
							<option value="All">All Stages ({opportunities.length})</option>
							{STAGES.map((s) => (
								<option key={s} value={s}>
									{s} ({opportunities.filter((o) => o.stage === s).length})
								</option>
							))}
						</select>
					</div>

					{/* Client Filter */}
					<div className="flex items-center gap-1.5 text-[12px]">
						<span className="text-slate-500 font-medium">Client:</span>
						<select
							value={selectedClient}
							onChange={(e) => setSelectedClient(e.target.value)}
							className="h-8 px-2.5 text-[12px] bg-white border border-slate-200 rounded-lg text-slate-700 font-medium max-w-[160px] truncate"
						>
							<option value="All">All Clients</option>
							{clients.map((c) => (
								<option key={c.id} value={c.id}>
									{c.name}
								</option>
							))}
						</select>
					</div>

					{/* Owner Filter */}
					<div className="flex items-center gap-1.5 text-[12px]">
						<span className="text-slate-500 font-medium">Owner:</span>
						<select
							value={selectedOwner}
							onChange={(e) => setSelectedOwner(e.target.value)}
							className="h-8 px-2.5 text-[12px] bg-white border border-slate-200 rounded-lg text-slate-700 font-medium"
						>
							{owners.map((o) => (
								<option key={o} value={o}>
									{o}
								</option>
							))}
						</select>
					</div>
				</div>

				{(selectedStage !== "All" ||
					selectedClient !== "All" ||
					selectedOwner !== "All" ||
					searchQuery) && (
					<button
						type="button"
						onClick={() => {
							setSelectedStage("All");
							setSelectedClient("All");
							setSelectedOwner("All");
							setLocalSearch("");
						}}
						className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
					>
						Clear Filters
					</button>
				)}
			</div>

			{/* Views Content */}
			{viewMode === "table" ? (
				<div className="studio-card bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
					{filteredOpportunities.length === 0 ? (
						<div className="py-16 text-center space-y-2">
							<div className="text-[28px]">⚡</div>
							<div className="text-[14px] font-bold text-slate-800">
								No commercial opportunities found
							</div>
							<p className="text-[12px] text-slate-500 max-w-sm mx-auto">
								{searchQuery || selectedStage !== "All"
									? "Try adjusting your search criteria or stage filters."
									: "Log your first commercial opportunity or convert a qualified lead from the sales pipeline."}
							</p>
							<button
								type="button"
								onClick={() => onOpenModal("opportunity")}
								className="btn-primary !h-[32px] mt-2 text-[12px] cursor-pointer"
							>
								+ Create Opportunity
							</button>
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-left border-collapse text-[12px]">
								<thead>
									<tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-mono uppercase tracking-wider text-slate-500">
										<th className="py-3 px-4">Deal Number</th>
										<th className="py-3 px-4">Title & Client</th>
										<th className="py-3 px-4">Service</th>
										<th className="py-3 px-4">Value</th>
										<th className="py-3 px-4">Stage</th>
										<th className="py-3 px-4">Owner</th>
										<th className="py-3 px-4">Target Date</th>
										<th className="py-3 px-4 text-right">Actions</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100">
									{filteredOpportunities.map((opp) => {
										const client = clientMap.get(opp.clientId);
										const stageStyle = STAGE_COLORS[opp.stage] || {
											bg: "bg-slate-100",
											text: "text-slate-700",
											border: "border-slate-200",
										};

										return (
											<tr
												key={opp.id}
												className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
												onClick={() => onSelectOpportunity(opp.id)}
											>
												<td
													className="py-3 px-4"
													onClick={(e) => e.stopPropagation()}
												>
													<OpportunityChip
														opportunityNo={opp.opportunityNo}
														opportunityId={opp.id}
														onNavigate={() => onSelectOpportunity(opp.id)}
													/>
												</td>

												<td className="py-3 px-4">
													<div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
														{opp.title}
													</div>
													<div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
														<span className="font-medium text-slate-700">
															{client?.name || "Unassigned Client"}
														</span>
														{opp.sourceLeadId && (
															<span className="text-[10px] text-slate-400 font-mono">
																(from lead)
															</span>
														)}
													</div>
												</td>

												<td className="py-3 px-4 font-mono text-[11px] text-slate-600">
													{opp.service || "—"}
												</td>

												<td className="py-3 px-4 font-mono font-bold text-slate-900">
													{formatCurrency(opp.value, opp.currency)}
												</td>

												<td
													className="py-3 px-4"
													onClick={(e) => e.stopPropagation()}
												>
													<select
														value={opp.stage}
														onChange={(e) =>
															handleStageChange(
																opp.id,
																e.target.value as OpportunityStage,
															)
														}
														className={`text-[11px] font-semibold font-mono rounded-md px-2 py-1 border transition ${stageStyle.bg} ${stageStyle.text} ${stageStyle.border} cursor-pointer`}
													>
														{STAGES.map((s) => (
															<option key={s} value={s}>
																{s}
															</option>
														))}
													</select>
												</td>

												<td className="py-3 px-4 text-slate-700 font-medium">
													{opp.owner}
												</td>

												<td className="py-3 px-4 text-[11px] font-mono text-slate-500">
													{opp.expectedCloseDate || "—"}
												</td>

												<td
													className="py-3 px-4 text-right"
													onClick={(e) => e.stopPropagation()}
												>
													<div className="flex items-center justify-end gap-1">
														<button
															type="button"
															onClick={() =>
																onOpenModal("opportunity", { opportunity: opp })
															}
															className="p-1.5 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
															title="Edit Opportunity"
															aria-label="Edit Opportunity"
														>
															✎
														</button>
														<button
															type="button"
															onClick={() => handleArchive(opp)}
															className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
															title="Archive Opportunity"
															aria-label="Archive Opportunity"
														>
															🗑
														</button>
														<button
															type="button"
															onClick={() => onSelectOpportunity(opp.id)}
															className="px-2 py-1 rounded-md text-[11px] font-semibold text-blue-600 hover:bg-blue-50 transition cursor-pointer"
														>
															View →
														</button>
													</div>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					)}
				</div>
			) : (
				/* Kanban Pipeline View */
				<div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-3.5 items-start">
					{STAGES.map((stage) => {
						const stageOpps = filteredOpportunities.filter(
							(o) => o.stage === stage,
						);
						const stageSums = sumByCurrency(stageOpps);
						const style = STAGE_COLORS[stage];

						return (
							<div
								key={stage}
								onDragOver={(e) => e.preventDefault()}
								onDrop={() => handleDrop(stage)}
								className="flex flex-col bg-slate-50/70 rounded-xl border border-slate-200/80 p-3 min-h-[500px]"
							>
								{/* Column Header */}
								<div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200">
									<div className="flex items-center gap-1.5">
										<span
											className={`w-2 h-2 rounded-full ${style.bg.replace("50", "500")}`}
										/>
										<span className="text-[12px] font-bold text-slate-900">
											{stage}
										</span>
										<span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
											{stageOpps.length}
										</span>
									</div>
									<span
										className="text-[10px] font-mono font-bold text-slate-600 truncate max-w-[90px]"
										title={formatMultiCurrency(stageSums)}
									>
										{formatMultiCurrency(stageSums, true)}
									</span>
								</div>

								{/* Cards */}
								<div className="space-y-2 flex-1 overflow-y-auto">
									{stageOpps.length === 0 ? (
										<div className="h-24 border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-[10px] text-slate-400 font-medium">
											Drop deals here
										</div>
									) : (
										stageOpps.map((opp) => {
											const client = clientMap.get(opp.clientId);
											return (
												<div
													key={opp.id}
													draggable
													onDragStart={() => handleDragStart(opp.id)}
													onClick={() => onSelectOpportunity(opp.id)}
													className="p-3 rounded-lg bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md cursor-grab active:cursor-grabbing transition space-y-2 group"
												>
													<div className="flex items-center justify-between">
														<OpportunityChip
															opportunityNo={opp.opportunityNo}
															opportunityId={opp.id}
															onNavigate={() => onSelectOpportunity(opp.id)}
														/>
														<span className="text-[11px] font-mono font-bold text-blue-600">
															{formatCompactCurrency(opp.value, opp.currency)}
														</span>
													</div>

													<div className="text-[12px] font-bold text-slate-900 leading-tight group-hover:text-blue-600 transition">
														{opp.title}
													</div>

													<div className="text-[10px] text-slate-500 font-mono space-y-0.5">
														<div className="truncate text-slate-700 font-sans font-medium">
															{client?.name || "Client"}
														</div>
														<div className="truncate">
															Service: {opp.service}
														</div>
														<div>Owner: {opp.owner}</div>
													</div>

													<div
														className="pt-2 border-t border-slate-100 flex items-center justify-between"
														onClick={(e) => e.stopPropagation()}
													>
														<span className="text-[9px] font-mono text-slate-400">
															{opp.expectedCloseDate || "No target"}
														</span>
														<button
															type="button"
															onClick={() =>
																onOpenModal("opportunity", { opportunity: opp })
															}
															className="text-[10px] p-1 rounded text-slate-400 hover:text-slate-800 transition cursor-pointer"
															title="Edit"
														>
															✎
														</button>
													</div>
												</div>
											);
										})
									)}
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
};
