import type React from "react";
import { useMemo, useState } from "react";
import { useToast } from "../../lib/feedback/toast.context";
import { contactsRepository } from "../../lib/repositories/contacts.repository";
import type { Client, Contact } from "../../types";

interface ContactsViewProps {
	contacts: Contact[];
	clients: Client[];
	onOpenModal: (type: string, data?: any) => void;
	onRefresh: () => void;
	search?: string;
}

export const ContactsView: React.FC<ContactsViewProps> = ({
	contacts,
	clients,
	onOpenModal,
	onRefresh,
	search: externalSearch = "",
}) => {
	const { toast } = useToast();
	const [localSearch, setLocalSearch] = useState("");
	const [selectedClientId, setSelectedClientId] = useState<string>("all");

	const searchQuery = (externalSearch || localSearch).toLowerCase().trim();

	const clientMap = useMemo(() => {
		const m = new Map<string, Client>();
		for (const c of clients) m.set(c.id, c);
		return m;
	}, [clients]);

	const filteredContacts = useMemo(() => {
		return contacts.filter((c) => {
			if (selectedClientId !== "all" && c.clientId !== selectedClientId) {
				return false;
			}
			if (!searchQuery) return true;
			const clientName = clientMap.get(c.clientId)?.name || "";
			return (
				c.name.toLowerCase().includes(searchQuery) ||
				c.role.toLowerCase().includes(searchQuery) ||
				(c.email && c.email.toLowerCase().includes(searchQuery)) ||
				(c.phone && c.phone.includes(searchQuery)) ||
				clientName.toLowerCase().includes(searchQuery)
			);
		});
	}, [contacts, selectedClientId, searchQuery, clientMap]);

	const handleSetPrimary = async (contact: Contact) => {
		try {
			await contactsRepository.setPrimary(contact.id, contact.clientId);
			toast({
				title: "Primary Contact Set",
				description: `${contact.name} is now the primary contact for ${clientMap.get(contact.clientId)?.name || "client"}.`,
				type: "success",
			});
			onRefresh();
		} catch (err: any) {
			toast({
				title: "Action Failed",
				description: err?.message || "Could not set primary contact.",
				type: "error",
			});
		}
	};

	const handleDelete = async (contact: Contact) => {
		if (
			!window.confirm(
				`Are you sure you want to delete contact ${contact.name}?`,
			)
		) {
			return;
		}
		try {
			await contactsRepository.delete(contact.id);
			toast({
				title: "Contact Deleted",
				description: `${contact.name} was removed.`,
				type: "info",
			});
			onRefresh();
		} catch (err: any) {
			toast({
				title: "Action Failed",
				description: err?.message || "Could not delete contact.",
				type: "error",
			});
		}
	};

	const primaryCount = contacts.filter((c) => c.isPrimary).length;
	const coveredClientIds = new Set(contacts.map((c) => c.clientId)).size;

	return (
		<div className="space-y-6">
			{/* Header with Title and Action */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EBEBEB]">
				<div>
					<div className="flex items-center gap-2">
						<h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111111]">
							Key Client Contacts
						</h1>
						<span className="text-[12px] font-mono px-2 py-0.5 rounded-full bg-[#EDEDED] text-[#444444] font-semibold">
							{contacts.length} Records
						</span>
					</div>
					<p className="text-[13px] text-[#666666] mt-1">
						Roster of company stakeholders, decision-makers, and technical
						liaisons across accounts.
					</p>
				</div>

				<div className="flex items-center gap-3">
					<button
						type="button"
						onClick={() => onOpenModal("contact")}
						className="px-4 py-2 rounded-lg bg-[#222222] hover:bg-[#111111] text-white text-[13px] font-medium transition flex items-center gap-2 shadow-xs cursor-pointer"
					>
						<span>+</span>
						<span>Add Contact</span>
					</button>
				</div>
			</div>

			{/* Operational Metric Tiles */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
				<div className="p-3.5 rounded-xl bg-white border border-[#EDEDED] shadow-xs">
					<div className="text-[11px] font-mono uppercase tracking-wider text-[#777777]">
						Total Stakeholders
					</div>
					<div className="text-xl font-bold font-mono text-[#111111] mt-1">
						{contacts.length}
					</div>
					<div className="text-[11px] text-[#777777] mt-0.5">
						Active in CRM database
					</div>
				</div>

				<div className="p-3.5 rounded-xl bg-white border border-[#EDEDED] shadow-xs">
					<div className="text-[11px] font-mono uppercase tracking-wider text-[#777777]">
						Designated Primary
					</div>
					<div className="text-xl font-bold font-mono text-emerald-600 mt-1">
						{primaryCount}
					</div>
					<div className="text-[11px] text-[#777777] mt-0.5">
						Lead account signatories
					</div>
				</div>

				<div className="p-3.5 rounded-xl bg-white border border-[#EDEDED] shadow-xs">
					<div className="text-[11px] font-mono uppercase tracking-wider text-[#777777]">
						Accounts Represented
					</div>
					<div className="text-xl font-bold font-mono text-[#49B3FC] mt-1">
						{coveredClientIds} / {clients.length}
					</div>
					<div className="text-[11px] text-[#777777] mt-0.5">
						Client accounts with key contacts
					</div>
				</div>
			</div>

			{/* Filter & Search Bar */}
			<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white border border-[#EDEDED] rounded-xl shadow-xs">
				<div className="flex-1 max-w-md">
					<input
						type="text"
						value={localSearch}
						onChange={(e) => setLocalSearch(e.target.value)}
						placeholder="Search by contact name, role, email, or client..."
						className="w-full px-3 py-1.5 text-[13px] bg-[#F7F7F7] border border-[#E0E0E0] rounded-lg focus:outline-none focus:border-[#49B3FC]"
					/>
				</div>

				<div className="flex items-center gap-2">
					<span className="text-[12px] font-medium text-[#777777] whitespace-nowrap">
						Filter Account:
					</span>
					<select
						value={selectedClientId}
						onChange={(e) => setSelectedClientId(e.target.value)}
						className="px-2.5 py-1.5 text-[12px] bg-[#F7F7F7] border border-[#E0E0E0] rounded-lg focus:outline-none text-[#222222]"
					>
						<option value="all">All Client Accounts</option>
						{clients.map((c) => (
							<option key={c.id} value={c.id}>
								{c.name}
							</option>
						))}
					</select>
				</div>
			</div>

			{/* Contacts Roster Table */}
			{filteredContacts.length === 0 ? (
				<div className="text-center py-16 bg-white border border-[#EDEDED] rounded-xl">
					<div className="text-3xl mb-2">👤</div>
					<h3 className="text-[15px] font-bold text-[#222222]">
						No contacts found
					</h3>
					<p className="text-[13px] text-[#777777] max-w-sm mx-auto mt-1">
						{searchQuery || selectedClientId !== "all"
							? "No contacts matched your search filter."
							: "No contacts recorded yet. Add primary stakeholders and coordinators."}
					</p>
					<button
						type="button"
						onClick={() => onOpenModal("contact")}
						className="mt-4 px-4 py-2 rounded-lg bg-[#222222] hover:bg-[#111111] text-white text-[13px] font-medium"
					>
						+ Add First Contact
					</button>
				</div>
			) : (
				<div className="overflow-x-auto bg-white border border-[#EDEDED] rounded-xl shadow-xs">
					<table className="w-full text-left border-collapse text-[13px]">
						<thead>
							<tr className="border-b border-[#EDEDED] bg-[#FAFAFA] text-[11px] font-mono uppercase tracking-wider text-[#777777]">
								<th className="py-3 px-4">Contact Person</th>
								<th className="py-3 px-4">Company Account</th>
								<th className="py-3 px-4">Role / Title</th>
								<th className="py-3 px-4">Email</th>
								<th className="py-3 px-4">Phone</th>
								<th className="py-3 px-4">Status & Notes</th>
								<th className="py-3 px-4 text-right">Actions</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-[#F0F0F0]">
							{filteredContacts.map((contact) => {
								const client = clientMap.get(contact.clientId);
								return (
									<tr
										key={contact.id}
										className="hover:bg-[#F9F9F9] transition"
									>
										<td className="py-3 px-4">
											<div className="font-semibold text-[#111111] flex items-center gap-2">
												{contact.name}
												{contact.isPrimary && (
													<span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
														PRIMARY
													</span>
												)}
											</div>
										</td>
										<td className="py-3 px-4">
											<span className="font-medium text-[#222222]">
												{client?.name || "Unassigned"}
											</span>
										</td>
										<td className="py-3 px-4 text-[#555555]">
											{contact.role || "—"}
										</td>
										<td className="py-3 px-4 font-mono text-[12px]">
											{contact.email ? (
												<a
													href={`mailto:${contact.email}`}
													className="text-[#49B3FC] hover:underline"
												>
													{contact.email}
												</a>
											) : (
												<span className="text-[#999999]">—</span>
											)}
										</td>
										<td className="py-3 px-4 font-mono text-[12px] text-[#555555]">
											{contact.phone ? (
												<a
													href={`tel:${contact.phone}`}
													className="hover:text-[#111111]"
												>
													{contact.phone}
												</a>
											) : (
												<span className="text-[#999999]">—</span>
											)}
										</td>
										<td className="py-3 px-4 max-w-[200px] truncate text-[12px] text-[#666666]">
											{contact.notes || "—"}
										</td>
										<td className="py-3 px-4 text-right whitespace-nowrap">
											<div className="inline-flex items-center gap-1.5">
												{!contact.isPrimary && (
													<button
														type="button"
														onClick={() => handleSetPrimary(contact)}
														className="px-2 py-1 rounded text-[11px] font-medium text-slate-600 hover:bg-[#EEEEEE]"
														title="Set as Primary Contact"
													>
														Set Primary
													</button>
												)}
												<button
													type="button"
													onClick={() => onOpenModal("contact", { contact })}
													className="px-2 py-1 rounded text-[11px] font-medium text-[#49B3FC] hover:bg-[#EBF6FE]"
												>
													Edit
												</button>
												<button
													type="button"
													onClick={() => handleDelete(contact)}
													className="px-2 py-1 rounded text-[11px] font-medium text-rose-600 hover:bg-rose-50"
												>
													Delete
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
	);
};
