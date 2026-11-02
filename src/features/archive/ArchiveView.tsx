import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "../../lib/feedback/toast.context";
import { leadsRepository } from "../../lib/repositories/leads.repository";
import type { Lead } from "../../types";

interface ArchiveViewProps {
	onRefresh: () => void;
	search?: string;
}

export const ArchiveView: React.FC<ArchiveViewProps> = ({
	onRefresh,
	search: externalSearch = "",
}) => {
	const { toast } = useToast();
	const [archivedLeads, setArchivedLeads] = useState<Lead[]>([]);
	const [localSearch, setLocalSearch] = useState("");
	const [loading, setLoading] = useState(true);

	const searchQuery = (externalSearch || localSearch).toLowerCase().trim();

	const loadArchived = async () => {
		setLoading(true);
		try {
			const list = await leadsRepository.listArchived();
			setArchivedLeads(list);
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
		loadArchived();
	}, []);

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

	const handleRestore = async (lead: Lead) => {
		try {
			await leadsRepository.restore(lead.id);
			toast({
				title: "Record Restored",
				description: `"${lead.name}" returned to the active sales pipeline.`,
				type: "success",
			});
			await loadArchived();
			onRefresh();
		} catch (err: any) {
			toast({
				title: "Restore Failed",
				description: err?.message || "Could not restore lead.",
				type: "error",
			});
		}
	};

	const handleDeletePermanently = async (lead: Lead) => {
		if (
			!window.confirm(
				`WARNING: Permanently purge "${lead.name}"? This operation cannot be undone.`,
			)
		) {
			return;
		}

		try {
			await leadsRepository.deletePermanently(lead.id);
			toast({
				title: "Purged Permanently",
				description: `"${lead.name}" was permanently removed from records.`,
				type: "info",
			});
			await loadArchived();
			onRefresh();
		} catch (err: any) {
			toast({
				title: "Purge Failed",
				description: err?.message || "Could not permanently delete lead.",
				type: "error",
			});
		}
	};

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
							{archivedLeads.length} Archived
						</span>
					</div>
					<p className="text-[13px] text-[#666666] mt-1">
						Protected holding area for decommissioned leads and opportunities.
						Restore or permanently purge records.
					</p>
				</div>

				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={loadArchived}
						className="px-3.5 py-2 rounded-lg border border-[#DEDEDE] text-[#444444] hover:bg-[#F5F5F5] text-[13px] font-medium transition cursor-pointer"
					>
						Refresh Bin
					</button>
				</div>
			</div>

			{/* Search */}
			<div className="flex items-center justify-between gap-3 p-3 bg-white border border-[#EDEDED] rounded-xl shadow-xs">
				<input
					type="text"
					value={localSearch}
					onChange={(e) => setLocalSearch(e.target.value)}
					placeholder="Search archived leads by name, contact, service, or owner..."
					className="w-full max-w-md px-3 py-1.5 text-[13px] bg-[#F7F7F7] border border-[#E0E0E0] rounded-lg focus:outline-none focus:border-[#49B3FC]"
				/>
				<div className="text-[12px] font-mono text-[#777777]">
					Safe Retention Mode
				</div>
			</div>

			{/* Table / Empty State */}
			{loading ? (
				<div className="py-20 text-center text-[#777777] text-[13px] font-mono">
					Loading archived records...
				</div>
			) : filteredLeads.length === 0 ? (
				<div className="text-center py-20 bg-white border border-[#EDEDED] rounded-xl">
					<div className="text-3xl mb-2">♻️</div>
					<h3 className="text-[15px] font-bold text-[#222222]">
						The recycle bin is empty
					</h3>
					<p className="text-[13px] text-[#777777] max-w-md mx-auto mt-1">
						{searchQuery
							? "No archived records matched your search query."
							: "Active CRM records can be archived safely from the Sales Pipeline or Accounts tables instead of immediate permanent deletion."}
					</p>
				</div>
			) : (
				<div className="overflow-x-auto bg-white border border-[#EDEDED] rounded-xl shadow-xs">
					<table className="w-full text-left border-collapse text-[13px]">
						<thead>
							<tr className="border-b border-[#EDEDED] bg-[#FAFAFA] text-[11px] font-mono uppercase tracking-wider text-[#777777]">
								<th className="py-3 px-4">Lead Opportunity</th>
								<th className="py-3 px-4">Service</th>
								<th className="py-3 px-4">Pipeline Stage</th>
								<th className="py-3 px-4">Estimated Value</th>
								<th className="py-3 px-4">Owner</th>
								<th className="py-3 px-4">Notes</th>
								<th className="py-3 px-4 text-right">Actions</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-[#F0F0F0]">
							{filteredLeads.map((lead) => (
								<tr key={lead.id} className="hover:bg-[#F9F9F9] transition">
									<td className="py-3 px-4">
										<div className="font-semibold text-[#111111]">
											{lead.name}
										</div>
										<div className="text-[11px] text-[#777777] mt-0.5">
											{lead.contact} {lead.email && `• ${lead.email}`}
										</div>
									</td>
									<td className="py-3 px-4 text-[#444444]">{lead.service}</td>
									<td className="py-3 px-4">
										<span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#EDEDED] text-[#444444]">
											{lead.stage}
										</span>
									</td>
									<td className="py-3 px-4 font-mono font-medium text-[#222222]">
										₹{lead.value.toLocaleString()}
									</td>
									<td className="py-3 px-4 text-[#555555]">{lead.owner}</td>
									<td className="py-3 px-4 max-w-xs truncate text-[12px] text-[#777777]">
										{lead.notes || "—"}
									</td>
									<td className="py-3 px-4 text-right whitespace-nowrap">
										<div className="inline-flex items-center gap-2">
											<button
												type="button"
												onClick={() => handleRestore(lead)}
												className="px-2.5 py-1 rounded text-[11px] font-semibold bg-[#EBF6FE] hover:bg-[#D5EEFD] text-[#0070BA]"
											>
												Restore ↺
											</button>
											<button
												type="button"
												onClick={() => handleDeletePermanently(lead)}
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
			)}
		</div>
	);
};
