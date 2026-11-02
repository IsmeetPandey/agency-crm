import type React from "react";
import { OpportunityChip } from "../../components/ui/OpportunityChip";
import { formatCompactCurrency } from "../../lib/utils/format";
import type { Client, Opportunity, Project } from "../../types";

interface ClientsViewProps {
	clients: Client[];
	projects: Project[];
	opportunities?: Opportunity[];
	onOpenModal: (type: string, data?: any) => void;
	onNavigate: (view: string, projectId?: string) => void;
	onNavigateToOpportunity?: (opportunityId: string) => void;
	search: string;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
	clients,
	projects,
	opportunities = [],
	onOpenModal,
	onNavigate,
	onNavigateToOpportunity,
	search,
}) => {
	const filteredClients = clients.filter((c) => {
		if (!search) return true;
		const s = search.toLowerCase();
		const clientOpps = opportunities.filter((o) => o.clientId === c.id);
		const hasMatchingOpp = clientOpps.some(
			(o) =>
				o.title.toLowerCase().includes(s) ||
				o.opportunityNo.toLowerCase().includes(s) ||
				o.service.toLowerCase().includes(s),
		);

		return (
			c.name.toLowerCase().includes(s) ||
			c.contact.toLowerCase().includes(s) ||
			c.email.toLowerCase().includes(s) ||
			(c.phone && c.phone.includes(s)) ||
			hasMatchingOpp
		);
	});

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
				<div>
					<h2 className="text-[18px] font-bold text-slate-900 tracking-tight">
						Client Accounts & Partnerships
					</h2>
					<p className="text-[12px] text-slate-500">
						B2B enterprise client directory, key contacts, and connected active
						projects & opportunities
					</p>
				</div>
				<button
					type="button"
					onClick={() => onOpenModal("client")}
					className="btn-primary !h-[34px]"
				>
					+ Add Client Account
				</button>
			</div>

			{/* Client Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
				{filteredClients.map((client) => {
					const clientProjects = projects.filter(
						(p) => p.clientId === client.id,
					);

					const clientOpps = opportunities.filter(
						(o) => o.clientId === client.id,
					);

					return (
						<div
							key={client.id}
							className="studio-card p-5 space-y-4 bg-white border border-slate-200 rounded-xl shadow-xs"
						>
							{/* Client Title & Actions */}
							<div className="flex items-start justify-between gap-2">
								<div className="min-w-0">
									<h3 className="text-[16px] font-bold text-slate-900 truncate">
										{client.name}
									</h3>
									<div className="text-[12px] text-slate-500 mt-0.5">
										Contact:{" "}
										<span className="text-slate-800 font-semibold">
											{client.contact || "—"}
										</span>
									</div>
								</div>
								<div className="flex items-center gap-1.5 shrink-0">
									<button
										type="button"
										onClick={() => onOpenModal("client", { client })}
										className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition text-[12px]"
										title="Edit Client"
										aria-label="Edit Client"
									>
										✎
									</button>
									<span className="w-7 h-7 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center text-[12px] font-bold">
										◈
									</span>
								</div>
							</div>

							{/* Email & Phone */}
							<div className="space-y-1 font-mono text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-100">
								{client.email && (
									<div className="text-blue-600 font-medium truncate">
										✉ {client.email}
									</div>
								)}
								{client.phone && (
									<div className="text-slate-600 font-medium">
										📞 {client.phone}
									</div>
								)}
								{!client.email && !client.phone && (
									<div className="text-slate-400 italic">
										No direct contact info logged
									</div>
								)}
							</div>

							{client.notes && (
								<p className="text-[12px] text-slate-500 italic line-clamp-2">
									&quot;{client.notes}&quot;
								</p>
							)}

							{/* Linked Opportunities Section */}
							<div className="pt-3 border-t border-slate-100">
								<div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
									<span>Commercial Opportunities</span>
									<div className="flex items-center gap-1.5">
										<button
											type="button"
											onClick={() =>
												onOpenModal("opportunity", { clientId: client.id })
											}
											className="text-[10px] text-blue-600 hover:underline font-sans font-semibold"
										>
											+ Deal
										</button>
										<span className="font-semibold text-slate-700">
											{clientOpps.length}
										</span>
									</div>
								</div>

								{clientOpps.length > 0 ? (
									<div className="space-y-1.5">
										{clientOpps.map((o) => (
											<div
												key={o.id}
												className="text-[12px] p-2 rounded-md hover:bg-slate-50 border border-slate-100 flex items-center justify-between transition"
											>
												<div className="flex items-center gap-2 min-w-0">
													<OpportunityChip
														opportunityNo={o.opportunityNo}
														opportunityId={o.id}
														onNavigate={onNavigateToOpportunity}
													/>
													<span className="truncate text-slate-800 font-medium">
														{o.title}
													</span>
												</div>
												<span className="font-mono text-[11px] font-bold text-slate-700 shrink-0">
													{formatCompactCurrency(o.value, o.currency)}
												</span>
											</div>
										))}
									</div>
								) : (
									<div className="text-[11px] text-slate-400 italic py-1">
										No commercial deals logged
									</div>
								)}
							</div>

							{/* Linked Projects Section */}
							<div className="pt-3 border-t border-slate-100">
								<div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
									<span>Linked Delivery Projects</span>
									<span className="font-semibold text-slate-700">
										{clientProjects.length}
									</span>
								</div>

								{clientProjects.length > 0 ? (
									<div className="space-y-1.5">
										{clientProjects.map((p) => (
											<div
												key={p.id}
												onClick={() => onNavigate("project", p.id)}
												className="text-[12px] p-2 rounded-md hover:bg-blue-50/60 border border-slate-100 hover:border-blue-200 cursor-pointer text-slate-800 flex items-center justify-between transition"
											>
												<span className="truncate font-semibold">{p.name}</span>
												<span className="badge-status badge-cobalt text-[10px] font-mono">
													{p.phase}
												</span>
											</div>
										))}
									</div>
								) : (
									<div className="text-[11px] text-slate-400 italic py-1">
										No active delivery projects
									</div>
								)}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
};
