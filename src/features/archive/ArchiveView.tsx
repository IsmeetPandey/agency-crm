import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { Building2, FolderKanban, Target, Zap } from "lucide-react";
import { OpportunityChip } from "../../components/ui/OpportunityChip";
import { useToast } from "../../lib/feedback/toast.context";
import { clientsRepository } from "../../lib/repositories/clients.repository";
import { leadsRepository } from "../../lib/repositories/leads.repository";
import { opportunitiesRepository } from "../../lib/repositories/opportunities.repository";
import { projectsRepository } from "../../lib/repositories/projects.repository";
import type { Client, Lead, Opportunity, Project } from "../../types";

interface ArchiveViewProps {
	onRefresh: () => void;
	search?: string;
}

type ArchiveTab = "leads" | "opportunities" | "clients" | "projects";

export const ArchiveView: React.FC<ArchiveViewProps> = ({
	onRefresh,
	search: externalSearch = "",
}) => {
	const { toast } = useToast();
	const [activeTab, setActiveTab] = useState<ArchiveTab>("leads");
	const [archivedLeads, setArchivedLeads] = useState<Lead[]>([]);
	const [archivedOpportunities, setArchivedOpportunities] = useState<
		Opportunity[]
	>([]);
	const [archivedClients, setArchivedClients] = useState<Client[]>([]);
	const [archivedProjects, setArchivedProjects] = useState<Project[]>([]);
	const [localSearch, setLocalSearch] = useState("");
	const [loading, setLoading] = useState(true);

	const searchQuery = (externalSearch || localSearch).toLowerCase().trim();

	const loadAllArchived = async () => {
		setLoading(true);
		try {
			const [l, o, c, p] = await Promise.all([
				leadsRepository.listArchived(),
				opportunitiesRepository.listArchived(),
				clientsRepository.listArchived(),
				projectsRepository.listArchived(),
			]);
			setArchivedLeads(l);
			setArchivedOpportunities(o);
			setArchivedClients(c);
			setArchivedProjects(p);
		} catch (err: any) {
			toast({
				title: "Failed to Load Archive",
				description: err?.message || "Could not retrieve archived records.",
				type: "error",
			});
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadAllArchived();
	}, []);

	// Filtered lists
	const filteredLeads = useMemo(() => {
		if (!searchQuery) return archivedLeads;
		return archivedLeads.filter(
			(l) =>
				l.name.toLowerCase().includes(searchQuery) ||
				l.contact.toLowerCase().includes(searchQuery) ||
				l.service.toLowerCase().includes(searchQuery) ||
				l.owner.toLowerCase().includes(searchQuery),
		);
	}, [archivedLeads, searchQuery]);

	const filteredOpportunities = useMemo(() => {
		if (!searchQuery) return archivedOpportunities;
		return archivedOpportunities.filter(
			(o) =>
				o.opportunityNo.toLowerCase().includes(searchQuery) ||
				o.title.toLowerCase().includes(searchQuery) ||
				o.service.toLowerCase().includes(searchQuery) ||
				o.owner.toLowerCase().includes(searchQuery),
		);
	}, [archivedOpportunities, searchQuery]);

	const filteredClients = useMemo(() => {
		if (!searchQuery) return archivedClients;
		return archivedClients.filter(
			(c) =>
				c.name.toLowerCase().includes(searchQuery) ||
				c.contact.toLowerCase().includes(searchQuery) ||
				(c.email && c.email.toLowerCase().includes(searchQuery)),
		);
	}, [archivedClients, searchQuery]);

	const filteredProjects = useMemo(() => {
		if (!searchQuery) return archivedProjects;
		return archivedProjects.filter(
			(p) =>
				p.name.toLowerCase().includes(searchQuery) ||
				p.phase.toLowerCase().includes(searchQuery) ||
				p.owner.toLowerCase().includes(searchQuery) ||
				(p.opportunityNo &&
					p.opportunityNo.toLowerCase().includes(searchQuery)),
		);
	}, [archivedProjects, searchQuery]);

	// Actions for Leads
	const handleRestoreLead = async (lead: Lead) => {
		try {
			await leadsRepository.restore(lead.id);
			toast({
				title: "Lead Restored",
				description: `"${lead.name}" restored to sales pipeline.`,
				type: "success",
			});
			await loadAllArchived();
			onRefresh();
		} catch (err: any) {
			toast({
				title: "Restore Failed",
				description: err?.message || "Could not restore lead.",
				type: "error",
			});
		}
	};

	const handleDeleteLeadPermanently = async (lead: Lead) => {
		if (
			!window.confirm(
				`WARNING: Permanently purge lead "${lead.name}"? This operation cannot be undone.`,
			)
		) {
			return;
		}
		try {
			await leadsRepository.deletePermanently(lead.id);
			toast({
				title: "Lead Purged",
				description: `"${lead.name}" was permanently removed.`,
				type: "info",
			});
			await loadAllArchived();
			onRefresh();
		} catch (err: any) {
			toast({
				title: "Purge Failed",
				description: err?.message || "Could not permanently delete lead.",
				type: "error",
			});
		}
	};

	// Actions for Opportunities
	const handleRestoreOpportunity = async (opp: Opportunity) => {
		try {
			await opportunitiesRepository.restore(opp.id);
			toast({
				title: "Opportunity Restored",
				description: `${opp.opportunityNo} - "${opp.title}" restored to active deals.`,
				type: "success",
			});
			await loadAllArchived();
			onRefresh();
		} catch (err: any) {
			toast({
				title: "Restore Failed",
				description: err?.message || "Could not restore opportunity.",
				type: "error",
			});
		}
	};

	const handleDeleteOpportunityPermanently = async (opp: Opportunity) => {
		if (
			!window.confirm(
				`WARNING: Permanently purge opportunity ${opp.opportunityNo} - "${opp.title}"? This cannot be undone.`,
			)
		) {
			return;
		}
		try {
			await opportunitiesRepository.deletePermanently(opp.id);
			toast({
				title: "Opportunity Purged",
				description: `${opp.opportunityNo} was permanently removed.`,
				type: "info",
			});
			await loadAllArchived();
			onRefresh();
		} catch (err: any) {
			toast({
				title: "Purge Failed",
				description:
					err?.message || "Could not permanently delete opportunity.",
				type: "error",
			});
		}
	};

	// Actions for Clients
	const handleRestoreClient = async (client: Client) => {
		try {
			await clientsRepository.restore(client.id);
			toast({
				title: "Client Restored",
				description: `"${client.name}" restored to active accounts.`,
				type: "success",
			});
			await loadAllArchived();
			onRefresh();
		} catch (err: any) {
			toast({
				title: "Restore Failed",
				description: err?.message || "Could not restore client.",
				type: "error",
			});
		}
	};

	const handleDeleteClientPermanently = async (client: Client) => {
		if (
			!window.confirm(
				`WARNING: Permanently purge client account "${client.name}"? This cannot be undone.`,
			)
		) {
			return;
		}
		try {
			await clientsRepository.deletePermanently(client.id);
			toast({
				title: "Client Purged",
				description: `"${client.name}" was permanently removed.`,
				type: "info",
			});
			await loadAllArchived();
			onRefresh();
		} catch (err: any) {
			toast({
				title: "Purge Failed",
				description: err?.message || "Could not permanently delete client.",
				type: "error",
			});
		}
	};

	// Actions for Projects
	const handleRestoreProject = async (project: Project) => {
		try {
			await projectsRepository.restore(project.id);
			toast({
				title: "Project Restored",
				description: `"${project.name}" restored to delivery operations.`,
				type: "success",
			});
			await loadAllArchived();
			onRefresh();
		} catch (err: any) {
			toast({
				title: "Restore Failed",
				description: err?.message || "Could not restore project.",
				type: "error",
			});
		}
	};

	const handleDeleteProjectPermanently = async (project: Project) => {
		if (
			!window.confirm(
				`WARNING: Permanently purge project "${project.name}"? This cannot be undone.`,
			)
		) {
			return;
		}
		try {
			await projectsRepository.deletePermanently(project.id);
			toast({
				title: "Project Purged",
				description: `"${project.name}" was permanently removed.`,
				type: "info",
			});
			await loadAllArchived();
			onRefresh();
		} catch (err: any) {
			toast({
				title: "Purge Failed",
				description: err?.message || "Could not permanently delete project.",
				type: "error",
			});
		}
	};

	const totalArchivedCount =
		archivedLeads.length +
		archivedOpportunities.length +
		archivedClients.length +
		archivedProjects.length;

	return (
		<div className="space-y-6">
			{/* Top Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EBEBEB]">
				<div>
					<div className="flex items-center gap-2">
						<h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111111]">
							Recycle & Archive Bin
						</h1>
						<span className="text-[12px] font-mono px-2 py-0.5 rounded-full bg-[#EDEDED] text-[#444444] font-semibold">
							{totalArchivedCount} Archived Records
						</span>
					</div>
					<p className="text-[13px] text-[#666666] mt-1">
						Protected multi-entity holding bin for leads, commercial
						opportunities, clients, and projects.
					</p>
				</div>

				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={loadAllArchived}
						className="px-3.5 py-1.5 rounded-lg border border-[#DEDEDE] text-[#444444] hover:bg-[#F5F5F5] text-[12px] font-medium transition cursor-pointer"
					>
						Refresh Bin
					</button>
				</div>
			</div>

			{/* Navigation Tabs */}
			<div className="flex items-center gap-2 border-b border-slate-200">
				<button
					type="button"
					onClick={() => setActiveTab("leads")}
					className={`flex items-center gap-2 px-4 py-2 text-[13px] font-medium border-b-2 transition -mb-px cursor-pointer ${
						activeTab === "leads"
							? "border-blue-600 text-blue-600 font-semibold"
							: "border-transparent text-slate-500 hover:text-slate-800"
					}`}
				>
					<span>Sales Leads</span>
					<span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold">
						{archivedLeads.length}
					</span>
				</button>

				<button
					type="button"
					onClick={() => setActiveTab("opportunities")}
					className={`flex items-center gap-2 px-4 py-2 text-[13px] font-medium border-b-2 transition -mb-px cursor-pointer ${
						activeTab === "opportunities"
							? "border-blue-600 text-blue-600 font-semibold"
							: "border-transparent text-slate-500 hover:text-slate-800"
					}`}
				>
					<span>Opportunities (KW-OPP-)</span>
					<span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold">
						{archivedOpportunities.length}
					</span>
				</button>

				<button
					type="button"
					onClick={() => setActiveTab("clients")}
					className={`flex items-center gap-2 px-4 py-2 text-[13px] font-medium border-b-2 transition -mb-px cursor-pointer ${
						activeTab === "clients"
							? "border-blue-600 text-blue-600 font-semibold"
							: "border-transparent text-slate-500 hover:text-slate-800"
					}`}
				>
					<span>Clients</span>
					<span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold">
						{archivedClients.length}
					</span>
				</button>

				<button
					type="button"
					onClick={() => setActiveTab("projects")}
					className={`flex items-center gap-2 px-4 py-2 text-[13px] font-medium border-b-2 transition -mb-px cursor-pointer ${
						activeTab === "projects"
							? "border-blue-600 text-blue-600 font-semibold"
							: "border-transparent text-slate-500 hover:text-slate-800"
					}`}
				>
					<span>Projects</span>
					<span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold">
						{archivedProjects.length}
					</span>
				</button>
			</div>

			{/* Search */}
			<div className="flex items-center justify-between gap-3 p-3 bg-white border border-[#EDEDED] rounded-xl shadow-xs">
				<input
					type="text"
					value={localSearch}
					onChange={(e) => setLocalSearch(e.target.value)}
					placeholder={`Search archived ${activeTab}...`}
					className="w-full max-w-md px-3 py-1.5 text-[12px] bg-[#F7F7F7] border border-[#E0E0E0] rounded-lg focus:outline-none focus:border-[#49B3FC]"
				/>
				<div className="text-[11px] font-mono text-[#777777]">
					Safe Retention Mode
				</div>
			</div>

			{/* Content per Tab */}
			{loading ? (
				<div className="py-20 text-center text-[#777777] text-[13px] font-mono">
					Loading archived records...
				</div>
			) : (
				<>
					{/* Leads Tab */}
					{activeTab === "leads" &&
						(filteredLeads.length === 0 ? (
							<div className="text-center py-16 bg-white border border-[#EDEDED] rounded-xl">
								<Target className="w-10 h-10 text-slate-300 mx-auto mb-2 stroke-[1.5]" />
								<h3 className="text-[14px] font-bold text-[#222222]">
									No archived leads
								</h3>
								<p className="text-[12px] text-[#777777] max-w-md mx-auto mt-1">
									{searchQuery
										? "No archived leads matched your search query."
										: "Decommissioned sales leads will appear here."}
								</p>
							</div>
						) : (
							<div className="overflow-x-auto bg-white border border-[#EDEDED] rounded-xl shadow-xs">
								<table className="w-full text-left border-collapse text-[12px]">
									<thead>
										<tr className="border-b border-[#EDEDED] bg-[#FAFAFA] text-[11px] font-mono uppercase tracking-wider text-[#777777]">
											<th className="py-3 px-4">Lead Opportunity</th>
											<th className="py-3 px-4">Service</th>
											<th className="py-3 px-4">Pipeline Stage</th>
											<th className="py-3 px-4">Estimated Value</th>
											<th className="py-3 px-4">Owner</th>
											<th className="py-3 px-4 text-right">Actions</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-[#F0F0F0]">
										{filteredLeads.map((lead) => (
											<tr
												key={lead.id}
												className="hover:bg-[#F9F9F9] transition"
											>
												<td className="py-3 px-4">
													<div className="font-semibold text-[#111111]">
														{lead.name}
													</div>
													<div className="text-[11px] text-[#777777] mt-0.5">
														{lead.contact} {lead.email && `• ${lead.email}`}
													</div>
												</td>
												<td className="py-3 px-4 text-[#444444]">
													{lead.service}
												</td>
												<td className="py-3 px-4">
													<span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#EDEDED] text-[#444444]">
														{lead.stage}
													</span>
												</td>
												<td className="py-3 px-4 font-mono font-medium text-[#222222]">
													₹{lead.value.toLocaleString()}
												</td>
												<td className="py-3 px-4 text-[#555555]">
													{lead.owner}
												</td>
												<td className="py-3 px-4 text-right whitespace-nowrap">
													<div className="inline-flex items-center gap-2">
														<button
															type="button"
															onClick={() => handleRestoreLead(lead)}
															className="px-2.5 py-1 rounded text-[11px] font-semibold bg-[#EBF6FE] hover:bg-[#D5EEFD] text-[#0070BA]"
														>
															Restore ↺
														</button>
														<button
															type="button"
															onClick={() => handleDeleteLeadPermanently(lead)}
															className="px-2 py-1 rounded text-[11px] font-medium text-rose-600 hover:bg-rose-50"
														>
															Purge
														</button>
													</div>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						))}

					{/* Opportunities Tab */}
					{activeTab === "opportunities" &&
						(filteredOpportunities.length === 0 ? (
							<div className="text-center py-16 bg-white border border-[#EDEDED] rounded-xl">
								<Zap className="w-10 h-10 text-slate-300 mx-auto mb-2 stroke-[1.5]" />
								<h3 className="text-[14px] font-bold text-[#222222]">
									No archived opportunities
								</h3>
								<p className="text-[12px] text-[#777777] max-w-md mx-auto mt-1">
									{searchQuery
										? "No archived opportunities matched your search query."
										: "Decommissioned commercial opportunities will appear here."}
								</p>
							</div>
						) : (
							<div className="overflow-x-auto bg-white border border-[#EDEDED] rounded-xl shadow-xs">
								<table className="w-full text-left border-collapse text-[12px]">
									<thead>
										<tr className="border-b border-[#EDEDED] bg-[#FAFAFA] text-[11px] font-mono uppercase tracking-wider text-[#777777]">
											<th className="py-3 px-4">Deal Number</th>
											<th className="py-3 px-4">Title</th>
											<th className="py-3 px-4">Service</th>
											<th className="py-3 px-4">Stage</th>
											<th className="py-3 px-4">Value</th>
											<th className="py-3 px-4">Owner</th>
											<th className="py-3 px-4 text-right">Actions</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-[#F0F0F0]">
										{filteredOpportunities.map((opp) => (
											<tr
												key={opp.id}
												className="hover:bg-[#F9F9F9] transition"
											>
												<td className="py-3 px-4">
													<OpportunityChip opportunityNo={opp.opportunityNo} />
												</td>
												<td className="py-3 px-4">
													<div className="font-semibold text-[#111111]">
														{opp.title}
													</div>
													{opp.description && (
														<div className="text-[11px] text-[#777777] truncate max-w-xs">
															{opp.description}
														</div>
													)}
												</td>
												<td className="py-3 px-4 text-[#444444]">
													{opp.service}
												</td>
												<td className="py-3 px-4">
													<span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#EDEDED] text-[#444444]">
														{opp.stage}
													</span>
												</td>
												<td className="py-3 px-4 font-mono font-medium text-[#222222]">
													₹{opp.value.toLocaleString()}
												</td>
												<td className="py-3 px-4 text-[#555555]">
													{opp.owner}
												</td>
												<td className="py-3 px-4 text-right whitespace-nowrap">
													<div className="inline-flex items-center gap-2">
														<button
															type="button"
															onClick={() => handleRestoreOpportunity(opp)}
															className="px-2.5 py-1 rounded text-[11px] font-semibold bg-[#EBF6FE] hover:bg-[#D5EEFD] text-[#0070BA]"
														>
															Restore ↺
														</button>
														<button
															type="button"
															onClick={() =>
																handleDeleteOpportunityPermanently(opp)
															}
															className="px-2 py-1 rounded text-[11px] font-medium text-rose-600 hover:bg-rose-50"
														>
															Purge
														</button>
													</div>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						))}

					{/* Clients Tab */}
					{activeTab === "clients" &&
						(filteredClients.length === 0 ? (
							<div className="text-center py-16 bg-white border border-[#EDEDED] rounded-xl">
								<Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2 stroke-[1.5]" />
								<h3 className="text-[14px] font-bold text-[#222222]">
									No archived clients
								</h3>
								<p className="text-[12px] text-[#777777] max-w-md mx-auto mt-1">
									{searchQuery
										? "No archived clients matched your search query."
										: "Decommissioned client accounts will appear here."}
								</p>
							</div>
						) : (
							<div className="overflow-x-auto bg-white border border-[#EDEDED] rounded-xl shadow-xs">
								<table className="w-full text-left border-collapse text-[12px]">
									<thead>
										<tr className="border-b border-[#EDEDED] bg-[#FAFAFA] text-[11px] font-mono uppercase tracking-wider text-[#777777]">
											<th className="py-3 px-4">Client Name</th>
											<th className="py-3 px-4">Contact</th>
											<th className="py-3 px-4">Email</th>
											<th className="py-3 px-4">Notes</th>
											<th className="py-3 px-4 text-right">Actions</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-[#F0F0F0]">
										{filteredClients.map((client) => (
											<tr
												key={client.id}
												className="hover:bg-[#F9F9F9] transition"
											>
												<td className="py-3 px-4">
													<div className="font-semibold text-[#111111]">
														{client.name}
													</div>
												</td>
												<td className="py-3 px-4 text-[#444444]">
													{client.contact}
												</td>
												<td className="py-3 px-4 font-mono text-[11px] text-[#555555]">
													{client.email || "—"}
												</td>
												<td className="py-3 px-4 max-w-xs truncate text-[11px] text-[#777777]">
													{client.notes || "—"}
												</td>
												<td className="py-3 px-4 text-right whitespace-nowrap">
													<div className="inline-flex items-center gap-2">
														<button
															type="button"
															onClick={() => handleRestoreClient(client)}
															className="px-2.5 py-1 rounded text-[11px] font-semibold bg-[#EBF6FE] hover:bg-[#D5EEFD] text-[#0070BA]"
														>
															Restore ↺
														</button>
														<button
															type="button"
															onClick={() =>
																handleDeleteClientPermanently(client)
															}
															className="px-2 py-1 rounded text-[11px] font-medium text-rose-600 hover:bg-rose-50"
														>
															Purge
														</button>
													</div>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						))}

					{/* Projects Tab */}
					{activeTab === "projects" &&
						(filteredProjects.length === 0 ? (
							<div className="text-center py-16 bg-white border border-[#EDEDED] rounded-xl">
								<FolderKanban className="w-10 h-10 text-slate-300 mx-auto mb-2 stroke-[1.5]" />
								<h3 className="text-[14px] font-bold text-[#222222]">
									No archived projects
								</h3>
								<p className="text-[12px] text-[#777777] max-w-md mx-auto mt-1">
									{searchQuery
										? "No archived projects matched your search query."
										: "Decommissioned projects will appear here."}
								</p>
							</div>
						) : (
							<div className="overflow-x-auto bg-white border border-[#EDEDED] rounded-xl shadow-xs">
								<table className="w-full text-left border-collapse text-[12px]">
									<thead>
										<tr className="border-b border-[#EDEDED] bg-[#FAFAFA] text-[11px] font-mono uppercase tracking-wider text-[#777777]">
											<th className="py-3 px-4">Project Name</th>
											<th className="py-3 px-4">Opportunity #</th>
											<th className="py-3 px-4">Phase</th>
											<th className="py-3 px-4">Budget</th>
											<th className="py-3 px-4">Owner</th>
											<th className="py-3 px-4 text-right">Actions</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-[#F0F0F0]">
										{filteredProjects.map((project) => (
											<tr
												key={project.id}
												className="hover:bg-[#F9F9F9] transition"
											>
												<td className="py-3 px-4">
													<div className="font-semibold text-[#111111]">
														{project.name}
													</div>
													<div className="text-[11px] text-[#777777] mt-0.5">
														{project.stackNeeded}
													</div>
												</td>
												<td className="py-3 px-4">
													{project.opportunityNo ? (
														<OpportunityChip
															opportunityNo={project.opportunityNo}
														/>
													) : (
														<span className="text-[#999999] text-[11px] font-mono">
															—
														</span>
													)}
												</td>
												<td className="py-3 px-4">
													<span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#EDEDED] text-[#444444]">
														{project.phase}
													</span>
												</td>
												<td className="py-3 px-4 font-mono font-medium text-[#222222]">
													₹{project.budget.toLocaleString()}
												</td>
												<td className="py-3 px-4 text-[#555555]">
													{project.owner}
												</td>
												<td className="py-3 px-4 text-right whitespace-nowrap">
													<div className="inline-flex items-center gap-2">
														<button
															type="button"
															onClick={() => handleRestoreProject(project)}
															className="px-2.5 py-1 rounded text-[11px] font-semibold bg-[#EBF6FE] hover:bg-[#D5EEFD] text-[#0070BA]"
														>
															Restore ↺
														</button>
														<button
															type="button"
															onClick={() =>
																handleDeleteProjectPermanently(project)
															}
															className="px-2 py-1 rounded text-[11px] font-medium text-rose-600 hover:bg-rose-50"
														>
															Purge
														</button>
													</div>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						))}
				</>
			)}
		</div>
	);
};
