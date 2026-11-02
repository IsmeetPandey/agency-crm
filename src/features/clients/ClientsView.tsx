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
					<h2 className="text-[18px] font-bold text-[var(--ink)] tracking-tight">
						Client Accounts & Partnerships
					</h2>
					<p className="text-[12px] text-[var(--ink-muted)]">
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
						<div key={client.id} className="studio-card p-5 space-y-4">
							{/* Client Title & Actions */}
							<div className="flex items-start justify-between gap-2">
								<div className="min-w-0">
									<h3 className="text-[16px] font-bold text-[var(--ink)] truncate">
										{client.name}
									</h3>
									<div className="text-[12px] text-[var(--ink-muted)] mt-0.5">
										Contact:{" "}
										<span className="text-[var(--ink)] font-semibold">
											{client.contact || "—"}
										</span>
									</div>
								</div>
								<div className="flex items-center gap-1.5 shrink-0">
									<button
										type="button"
										onClick={() => onOpenModal("client", { client })}
										className="p-1 rounded text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-sunken)] transition text-[12px]"
										title="Edit Client"
										aria-label="Edit Client"
									>
										✎
									</button>
									<span className="w-7 h-7 rounded-md bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-[var(--ink-secondary)] flex items-center justify-center text-[12px] font-bold">
										◈
									</span>
								</div>
							</div>

							{/* Email & Phone */}
							<div className="space-y-1 font-mono text-[11px] bg-[var(--surface-sunken)] p-2.5 rounded-lg border border-[var(--border)]">
								{client.email && (
									<div className="text-[#49B3FC] font-medium truncate">
										✉ {client.email}
									</div>
								)}
								{client.phone && (
									<div className="text-[var(--ink-secondary)] font-medium">
										📞 {client.phone}
									</div>
								)}
								{!client.email && !client.phone && (
									<div className="text-[var(--ink-muted)] italic">
										No direct contact info logged
									</div>
								)}
							</div>

							{client.notes && (
								<p className="text-[12px] text-[var(--ink-muted)] italic line-clamp-2">
									&quot;{client.notes}&quot;
								</p>
							)}

							{/* Linked Opportunities Section */}
							<div className="pt-3 border-t border-[var(--border-subtle)]">
								<div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--ink-muted)] mb-2 flex items-center justify-between">
									<span>Commercial Opportunities</span>
									<div className="flex items-center gap-1.5">
										<button
											type="button"
											onClick={() =>
												onOpenModal("opportunity", { clientId: client.id })
											}
											className="text-[10px] text-[#49B3FC] hover:underline font-sans font-semibold"
										>
											+ Deal
										</button>
										<span className="font-semibold text-[var(--ink-secondary)]">
											{clientOpps.length}
										</span>
									</div>
								</div>

								{clientOpps.length > 0 ? (
									<div className="space-y-1.5">
										{clientOpps.map((o) => (
											<div
												key={o.id}
												className="text-[12px] p-2 rounded-md hover:bg-[var(--surface-sunken)] border border-[var(--border)] flex items-center justify-between transition"
											>
												<div className="flex items-center gap-2 min-w-0">
													<OpportunityChip
														opportunityNo={o.opportunityNo}
														opportunityId={o.id}
														onNavigate={onNavigateToOpportunity}
													/>
													<span className="truncate text-[var(--ink)] font-medium">
														{o.title}
													</span>
												</div>
												<span className="font-mono text-[11px] font-bold text-[var(--ink)] shrink-0">
													{formatCompactCurrency(o.value, o.currency)}
												</span>
											</div>
										))}
									</div>
								) : (
									<div className="text-[11px] text-[var(--ink-muted)] italic py-1">
										No commercial deals logged
									</div>
								)}
							</div>

							{/* Linked Projects Section */}
							<div className="pt-3 border-t border-[var(--border-subtle)]">
								<div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--ink-muted)] mb-2 flex items-center justify-between">
									<span>Linked Delivery Projects</span>
									<span className="font-semibold text-[var(--ink-secondary)]">
										{clientProjects.length}
									</span>
								</div>

								{clientProjects.length > 0 ? (
									<div className="space-y-1.5">
										{clientProjects.map((p) => (
											<div
												key={p.id}
												onClick={() => onNavigate("project", p.id)}
												className="text-[12px] p-2 rounded-md hover:bg-[var(--surface-sunken)] border border-[var(--border)] cursor-pointer text-[var(--ink)] flex items-center justify-between transition"
											>
												<span className="truncate font-semibold">{p.name}</span>
												<span className="badge-status badge-cobalt text-[10px] font-mono">
													{p.phase}
												</span>
											</div>
										))}
									</div>
								) : (
									<div className="text-[11px] text-[var(--ink-muted)] italic py-1">
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
