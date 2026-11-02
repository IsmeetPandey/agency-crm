import type React from "react";
import { useMemo, useState } from "react";
import { User } from "lucide-react";
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

	const sortedClients = useMemo(() => {
		return [...clients].sort((a, b) => a.name.localeCompare(b.name));
	}, [clients]);

	const contactsCountByClient = useMemo(() => {
		const map = new Map<string, number>();
		for (const con of contacts) {
			map.set(con.clientId, (map.get(con.clientId) || 0) + 1);
		}
		return map;
	}, [contacts]);

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
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
				<div>
					<div className="flex items-center gap-2">
						<h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--ink)]">
							Key Client Contacts
						</h1>
						<span className="text-[12px] font-mono px-2 py-0.5 rounded-full bg-[var(--surface-raised)] border border-[var(--border-subtle)] text-[var(--ink-secondary)] font-semibold">
							{contacts.length} Records
						</span>
					</div>
					<p className="text-[13px] text-[var(--ink-muted)] mt-1">
						Roster of company stakeholders, decision-makers, and technical
						liaisons across accounts.
					</p>
				</div>

				<div className="flex items-center gap-3">
					<button
						type="button"
						onClick={() => onOpenModal("contact")}
						className="px-4 py-2 rounded-lg btn-primary text-[13px] font-medium transition flex items-center gap-2 shadow-xs cursor-pointer"
					>
						<span>+</span>
						<span>Add Contact</span>
					</button>
				</div>
			</div>

			{/* Operational Metric Tiles */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
				<div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
					<div className="text-[11px] font-mono uppercase tracking-wider text-[var(--ink-muted)]">
						Total Stakeholders
					</div>
					<div className="text-xl font-bold font-mono text-[var(--ink)] mt-1">
						{contacts.length}
					</div>
					<div className="text-[11px] text-[var(--ink-muted)] mt-0.5">
						Active in CRM database
					</div>
				</div>

				<div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
					<div className="text-[11px] font-mono uppercase tracking-wider text-[var(--ink-muted)]">
						Designated Primary
					</div>
					<div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
						{primaryCount}
					</div>
					<div className="text-[11px] text-[var(--ink-muted)] mt-0.5">
						Lead account signatories
					</div>
				</div>

				<div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
					<div className="text-[11px] font-mono uppercase tracking-wider text-[var(--ink-muted)]">
						Accounts Represented
					</div>
					<div className="text-xl font-bold font-mono text-[#49B3FC] mt-1">
						{coveredClientIds} / {clients.length}
					</div>
					<div className="text-[11px] text-[var(--ink-muted)] mt-0.5">
						Client accounts with key contacts
					</div>
				</div>
			</div>

			{/* Filter & Search Bar */}
			<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xs">
				<div className="flex-1 max-w-md">
					<input
						type="text"
						value={localSearch}
						onChange={(e) => setLocalSearch(e.target.value)}
						placeholder="Search by contact name, role, email, or client..."
						className="w-full px-3 py-1.5 text-[13px] bg-[var(--surface-sunken)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[#49B3FC] text-[var(--ink)] placeholder:text-[var(--ink-muted)]"
					/>
				</div>

				<div className="flex items-center gap-2">
					<span className="text-[12px] font-medium text-[var(--ink-muted)] whitespace-nowrap">
						Filter Account:
					</span>
					<select
						value={selectedClientId}
						onChange={(e) => setSelectedClientId(e.target.value)}
						className="px-2.5 py-1.5 text-[12px] bg-[var(--surface-sunken)] border border-[var(--border)] rounded-lg focus:outline-none text-[var(--ink)] cursor-pointer"
					>
						<option value="all">All Client Accounts ({contacts.length})</option>
						{sortedClients.map((c) => (
							<option key={c.id} value={c.id}>
								{c.name} ({contactsCountByClient.get(c.id) || 0})
							</option>
						))}
					</select>
				</div>
			</div>

			{/* Contacts Roster Table */}
			{filteredContacts.length === 0 ? (
				<div className="text-center py-16 bg-[var(--surface)] border border-[var(--border)] rounded-xl">
					<User className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2 stroke-[1.5]" />
					<h3 className="text-[15px] font-bold text-[var(--ink)]">
						No contacts found
					</h3>
					<p className="text-[13px] text-[var(--ink-muted)] max-w-sm mx-auto mt-1">
						{searchQuery || selectedClientId !== "all"
							? "No contacts matched your search filter."
							: "No contacts recorded yet. Add primary stakeholders and coordinators."}
					</p>
					<button
						type="button"
						onClick={() => onOpenModal("contact")}
						className="mt-4 px-4 py-2 rounded-lg btn-primary text-[13px] font-medium"
					>
						+ Add First Contact
					</button>
				</div>
			) : (
				<div className="overflow-x-auto bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xs">
					<table className="w-full text-left border-collapse text-[13px]">
						<thead>
							<tr className="border-b border-[var(--border)] bg-[var(--surface-sunken)] text-[11px] font-mono uppercase tracking-wider text-[var(--ink-muted)]">
								<th className="py-3 px-4">Contact Person</th>
								<th className="py-3 px-4">Company Account</th>
								<th className="py-3 px-4">Role / Title</th>
								<th className="py-3 px-4">Email</th>
								<th className="py-3 px-4">Phone</th>
								<th className="py-3 px-4">Status & Notes</th>
								<th className="py-3 px-4 text-right">Actions</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-[var(--border-subtle)]">
							{filteredContacts.map((contact) => {
								const client = clientMap.get(contact.clientId);
								return (
									<tr
										key={contact.id}
										className="hover:bg-[var(--surface-sunken)] transition"
									>
										<td className="py-3 px-4">
											<div className="font-semibold text-[var(--ink)] flex items-center gap-2">
												{contact.name}
												{contact.isPrimary && (
													<span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
														PRIMARY
													</span>
												)}
											</div>
										</td>
										<td className="py-3 px-4">
											<span className="font-medium text-[var(--ink)]">
												{client?.name || "Unassigned"}
											</span>
										</td>
										<td className="py-3 px-4 text-[var(--ink-secondary)]">
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
												<span className="text-[var(--ink-muted)]">—</span>
											)}
										</td>
										<td className="py-3 px-4 font-mono text-[12px] text-[var(--ink-secondary)]">
											{contact.phone ? (
												<a
													href={`tel:${contact.phone}`}
													className="hover:text-[var(--ink)]"
												>
													{contact.phone}
												</a>
											) : (
												<span className="text-[var(--ink-muted)]">—</span>
											)}
										</td>
										<td className="py-3 px-4 max-w-[200px] truncate text-[12px] text-[var(--ink-muted)]">
											{contact.notes || "—"}
										</td>
										<td className="py-3 px-4 text-right whitespace-nowrap">
											<div className="inline-flex items-center gap-1.5">
												{!contact.isPrimary && (
													<button
														type="button"
														onClick={() => handleSetPrimary(contact)}
														className="px-2 py-1 rounded text-[11px] font-medium text-[var(--ink-secondary)] hover:bg-[var(--surface-sunken)]"
														title="Set as Primary Contact"
													>
														Set Primary
													</button>
												)}
												<button
													type="button"
													onClick={() => onOpenModal("contact", { contact })}
													className="px-2 py-1 rounded text-[11px] font-medium text-[#49B3FC] hover:bg-[#49B3FC]/10"
												>
													Edit
												</button>
												<button
													type="button"
													onClick={() => handleDelete(contact)}
													className="px-2 py-1 rounded text-[11px] font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
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
