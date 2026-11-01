import type React from "react";
import type { Client, Project } from "../../types";

interface ClientsViewProps {
	clients: Client[];
	projects: Project[];
	onOpenModal: (type: string, data?: any) => void;
	onNavigate: (view: string, projectId?: string) => void;
	search: string;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
	clients,
	projects,
	onOpenModal,
	onNavigate,
	search,
}) => {
	const filteredClients = clients.filter((c) => {
		if (!search) return true;
		const s = search.toLowerCase();
		return (
			c.name.toLowerCase().includes(s) ||
			c.contact.toLowerCase().includes(s) ||
			c.email.toLowerCase().includes(s) ||
			(c.phone && c.phone.includes(s))
		);
	});

	return (
		<div className="space-y-4">
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
				<div>
					<h2 className="text-[18px] font-[700] tracking-[-0.02em] text-[#1D1D1F]">
						Client Management • Liquid Glass Directory
					</h2>
					<p className="text-[12px] text-[#86868B]">
						Manage client relationships, contacts, and linked deliverables
					</p>
				</div>
				<button
					type="button"
					onClick={() => onOpenModal("client")}
					className="btn-liquid btn-liquid-primary !h-[32px]"
				>
					+ Add Client
				</button>
			</div>

			<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
				{filteredClients.map((client) => {
					const clientProjects = projects.filter(
						(p) => p.clientId === client.id,
					);

					return (
						<div key={client.id} className="liquid-card p-5 space-y-3">
							<div className="flex items-start justify-between">
								<div>
									<h3 className="text-[15px] font-[650] text-[#1D1D1F]">
										{client.name}
									</h3>
									<div className="text-[12px] text-[#86868B] mt-0.5">
										Contact:{" "}
										<span className="text-[#1D1D1F] font-[500]">
											{client.contact || "—"}
										</span>
									</div>
								</div>
								<div className="flex items-center gap-1.5">
									<button
										type="button"
										onClick={() => onOpenModal("client", { client })}
										className="p-1 rounded text-[#86868B] hover:text-[#007AFF] hover:bg-black/[0.04] transition text-[12px]"
										title="Edit Client"
									>
										✎
									</button>
									<span className="w-7 h-7 rounded-[8px] bg-black/[0.04] flex items-center justify-center text-[11px]">
										⚑
									</span>
								</div>
							</div>

							<div className="space-y-1">
								{client.email && (
									<div className="text-[12px] text-[#007AFF] font-mono truncate">
										{client.email}
									</div>
								)}
								{client.phone && (
									<div className="text-[11px] text-[#86868B] font-mono">
										📞 {client.phone}
									</div>
								)}
							</div>

							{client.notes && (
								<div className="p-2.5 rounded-[8px] bg-black/[0.02] border border-black/[0.04] text-[11px] text-[#86868B]">
									{client.notes}
								</div>
							)}

							{/* Linked Projects */}
							<div className="pt-2 border-t border-black/[0.06]">
								<div className="text-[11px] font-[600] uppercase tracking-wider text-[#86868B] mb-1.5 flex items-center justify-between">
									<span>Linked Projects</span>
									<span>{clientProjects.length}</span>
								</div>
								{clientProjects.length > 0 ? (
									<div className="space-y-1">
										{clientProjects.map((p) => (
											<div
												key={p.id}
												onClick={() => onNavigate("project", p.id)}
												className="text-[12px] p-1.5 rounded hover:bg-black/[0.04] cursor-pointer text-[#1D1D1F] flex items-center justify-between transition"
											>
												<span className="truncate font-[500]">{p.name}</span>
												<span className="text-[10px] text-[#007AFF] shrink-0 font-[600]">
													{p.phase}
												</span>
											</div>
										))}
									</div>
								) : (
									<div className="text-[11px] text-[#86868B] italic">
										No active projects linked
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
