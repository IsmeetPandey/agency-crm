import type React from "react";
import { useMemo, useState } from "react";
import { OpportunityChip } from "../../components/ui/OpportunityChip";
import { useToast } from "../../lib/feedback/toast.context";
import { financeRepository } from "../../lib/repositories/finance.repository";
import type {
	Client,
	FinanceItem,
	FinanceStatus,
	FinanceType,
	Project,
} from "../../types";

interface FinanceViewProps {
	finance: FinanceItem[];
	clients: Client[];
	projects: Project[];
	onOpenModal: (type: string, data?: any) => void;
	onNavigateToOpportunity?: (id: string) => void;
	onRefresh: () => void;
	search?: string;
}

export const FinanceView: React.FC<FinanceViewProps> = ({
	finance,
	clients,
	projects,
	onOpenModal,
	onNavigateToOpportunity,
	onRefresh,
	search: externalSearch = "",
}) => {
	const { toast } = useToast();
	const [localSearch, setLocalSearch] = useState("");
	const [typeFilter, setTypeFilter] = useState<string>("all");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [clientFilter, setClientFilter] = useState<string>("all");

	const searchQuery = (externalSearch || localSearch).toLowerCase().trim();

	const clientMap = useMemo(() => {
		const m = new Map<string, Client>();
		for (const c of clients) m.set(c.id, c);
		return m;
	}, [clients]);

	const projectMap = useMemo(() => {
		const m = new Map<string, Project>();
		for (const p of projects) m.set(p.id, p);
		return m;
	}, [projects]);

	const filteredItems = useMemo(() => {
		return finance.filter((item) => {
			if (typeFilter !== "all" && item.type !== typeFilter) return false;
			if (statusFilter !== "all" && item.status !== statusFilter) return false;
			if (clientFilter !== "all" && item.clientId !== clientFilter)
				return false;
			if (!searchQuery) return true;

			const clientName = clientMap.get(item.clientId)?.name || "";
			const projectName = item.projectId
				? projectMap.get(item.projectId)?.name || ""
				: "";
			return (
				item.title.toLowerCase().includes(searchQuery) ||
				clientName.toLowerCase().includes(searchQuery) ||
				projectName.toLowerCase().includes(searchQuery) ||
				item.status.toLowerCase().includes(searchQuery)
			);
		});
	}, [
		finance,
		typeFilter,
		statusFilter,
		clientFilter,
		searchQuery,
		clientMap,
		projectMap,
	]);

	const stats = useMemo(() => {
		const invoices = finance.filter((f) => f.type === "invoice");
		const totalInvoiced = invoices.reduce((sum, i) => sum + (i.amount || 0), 0);
		const totalPaid = invoices
			.filter((i) => i.status === "Paid")
			.reduce((sum, i) => sum + (i.amount || 0), 0);
		const totalOverdue = invoices
			.filter((i) => i.status === "Overdue")
			.reduce((sum, i) => sum + (i.amount || 0), 0);
		const pendingProposals = finance
			.filter((f) => f.type === "proposal" && f.status === "Sent")
			.reduce((sum, p) => sum + (p.amount || 0), 0);

		return {
			totalInvoiced,
			totalPaid,
			totalOverdue,
			pendingProposals,
		};
	}, [finance]);

	const handleStatusChange = async (
		item: FinanceItem,
		nextStatus: FinanceStatus,
	) => {
		try {
			await financeRepository.updateStatus(item.id, nextStatus);
			toast({
				title: "Status Updated",
				description: `${item.title} marked as ${nextStatus}.`,
				type: "success",
			});
			onRefresh();
		} catch (err: any) {
			toast({
				title: "Update Failed",
				description: err?.message || "Failed to update record status.",
				type: "error",
			});
		}
	};

	const exportCSV = () => {
		const headers = [
			"ID",
			"Type",
			"Title",
			"Client",
			"Project",
			"Amount (INR)",
			"Status",
			"Issue Date",
			"Due Date",
		];
		const rows = filteredItems.map((i) => [
			i.id,
			i.type.toUpperCase(),
			`"${i.title.replace(/"/g, '""')}"`,
			`"${clientMap.get(i.clientId)?.name || ""}"`,
			`"${i.projectId ? projectMap.get(i.projectId)?.name || "" : ""}"`,
			i.amount,
			i.status,
			i.issueDate,
			i.dueDate || "",
		]);

		const csvContent =
			"data:text/csv;charset=utf-8," +
			[headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
		const encodedUri = encodeURI(csvContent);
		const link = document.createElement("a");
		link.setAttribute("href", encodedUri);
		link.setAttribute(
			"download",
			`kreatiwit_finance_${new Date().toISOString().split("T")[0]}.csv`,
		);
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);

		toast({
			title: "Ledger Exported",
			description: `Exported ${filteredItems.length} records to CSV.`,
			type: "info",
		});
	};

	const getStatusBadge = (status: FinanceStatus) => {
		switch (status) {
			case "Paid":
				return "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800";
			case "Sent":
			case "Accepted":
				return "bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800";
			case "Overdue":
				return "bg-rose-100 text-rose-800 border-rose-300 font-bold dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800";
			case "Declined":
				return "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700";
			default:
				return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800";
		}
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
				<div>
					<div className="flex items-center gap-2">
						<h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--ink-strong)]">
							Invoices & Proposals
						</h1>
						<span className="text-[12px] font-mono px-2 py-0.5 rounded-full bg-[var(--surface-raised)] text-[var(--ink-secondary)] border border-[var(--border)] font-semibold">
							{finance.length} Ledger Records
						</span>
					</div>
					<p className="text-[13px] text-[var(--ink-muted)] mt-1">
						Commercial milestone billing, proposal pipeline, and payment
						tracking for client accounts.
					</p>
				</div>

				<div className="flex items-center gap-2.5">
					<button
						type="button"
						onClick={exportCSV}
						className="btn-secondary !h-[34px] text-[13px] font-medium cursor-pointer"
					>
						Export CSV
					</button>
					<button
						type="button"
						onClick={() => onOpenModal("finance")}
						className="btn-primary !h-[34px] text-[13px] font-medium flex items-center gap-2 cursor-pointer"
					>
						<span>+</span>
						<span>Create Record</span>
					</button>
				</div>
			</div>

			{/* Metric KPI Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
				<div className="studio-card p-3.5">
					<div className="text-[11px] font-mono uppercase tracking-wider text-[var(--ink-muted)]">
						Total Invoiced
					</div>
					<div className="text-xl font-bold font-mono text-[var(--ink-strong)] mt-1">
						₹{(stats.totalInvoiced / 100000).toFixed(2)}L
					</div>
					<div className="text-[11px] text-[var(--ink-muted)] mt-0.5">
						All issued invoices
					</div>
				</div>

				<div className="studio-card p-3.5">
					<div className="text-[11px] font-mono uppercase tracking-wider text-[var(--ink-muted)]">
						Settled / Paid
					</div>
					<div className="text-xl font-bold font-mono text-emerald-500 mt-1">
						₹{(stats.totalPaid / 100000).toFixed(2)}L
					</div>
					<div className="text-[11px] text-[var(--ink-muted)] mt-0.5">
						Collected agency revenue
					</div>
				</div>

				<div className="studio-card p-3.5">
					<div className="text-[11px] font-mono uppercase tracking-wider text-[var(--ink-muted)]">
						Overdue Invoices
					</div>
					<div
						className={`text-xl font-bold font-mono mt-1 ${stats.totalOverdue > 0 ? "text-rose-500" : "text-[var(--ink-muted)]"}`}
					>
						₹{(stats.totalOverdue / 100000).toFixed(2)}L
					</div>
					<div className="text-[11px] text-[var(--ink-muted)] mt-0.5">
						Requiring payment follow-up
					</div>
				</div>

				<div className="studio-card p-3.5">
					<div className="text-[11px] font-mono uppercase tracking-wider text-[var(--ink-muted)]">
						Open Proposals
					</div>
					<div className="text-xl font-bold font-mono text-[var(--accent)] mt-1">
						₹{(stats.pendingProposals / 100000).toFixed(2)}L
					</div>
					<div className="text-[11px] text-[var(--ink-muted)] mt-0.5">
						Sent quotes pending signoff
					</div>
				</div>
			</div>

			{/* Filters & Search */}
			<div className="studio-card flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3">
				<div className="flex-1 max-w-sm">
					<input
						type="text"
						value={localSearch}
						onChange={(e) => setLocalSearch(e.target.value)}
						placeholder="Search by title, client, or project..."
						className="studio-input !h-[34px] text-[13px]"
					/>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<select
						value={typeFilter}
						onChange={(e) => setTypeFilter(e.target.value)}
						className="px-2.5 py-1.5 text-[12px] bg-[var(--surface-sunken)] border border-[var(--border)] rounded-lg focus:outline-none text-[var(--ink)]"
					>
						<option value="all">All Types</option>
						<option value="invoice">Invoices</option>
						<option value="proposal">Proposals</option>
						<option value="quotation">Quotations</option>
					</select>

					<select
						value={statusFilter}
						onChange={(e) => setStatusFilter(e.target.value)}
						className="px-2.5 py-1.5 text-[12px] bg-[var(--surface-sunken)] border border-[var(--border)] rounded-lg focus:outline-none text-[var(--ink)]"
					>
						<option value="all">All Statuses</option>
						<option value="Draft">Draft</option>
						<option value="Sent">Sent</option>
						<option value="Accepted">Accepted</option>
						<option value="Paid">Paid</option>
						<option value="Overdue">Overdue</option>
					</select>

					<select
						value={clientFilter}
						onChange={(e) => setClientFilter(e.target.value)}
						className="px-2.5 py-1.5 text-[12px] bg-[var(--surface-sunken)] border border-[var(--border)] rounded-lg focus:outline-none text-[var(--ink)] max-w-[160px] truncate"
					>
						<option value="all">All Accounts</option>
						{clients.map((c) => (
							<option key={c.id} value={c.id}>
								{c.name}
							</option>
						))}
					</select>
				</div>
			</div>

			{/* Finance Table */}
			{filteredItems.length === 0 ? (
				<div className="text-center py-16 bg-white border border-[#EDEDED] rounded-xl">
					<div className="text-3xl mb-2">📑</div>
					<h3 className="text-[15px] font-bold text-[#222222]">
						No records found
					</h3>
					<p className="text-[13px] text-[#777777] max-w-sm mx-auto mt-1">
						{searchQuery || typeFilter !== "all" || statusFilter !== "all"
							? "No finance items matched your active filters."
							: "No quotes or invoices logged yet. Create your first milestone invoice."}
					</p>
					<button
						type="button"
						onClick={() => onOpenModal("finance")}
						className="mt-4 px-4 py-2 rounded-lg btn-primary text-[13px] font-medium"
					>
						+ Create Finance Record
					</button>
				</div>
			) : (
				<div className="overflow-x-auto bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xs">
					<table className="w-full text-left border-collapse text-[13px]">
						<thead>
							<tr className="border-b border-[var(--border)] bg-[var(--surface-sunken)] text-[11px] font-mono uppercase tracking-wider text-[var(--ink-muted)]">
								<th className="py-3 px-4">Item & Deliverable</th>
								<th className="py-3 px-4">Type</th>
								<th className="py-3 px-4">Account / Project</th>
								<th className="py-3 px-4">Amount</th>
								<th className="py-3 px-4">Status</th>
								<th className="py-3 px-4">Timeline</th>
								<th className="py-3 px-4 text-right">Actions</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-[var(--border-subtle)]">
							{filteredItems.map((item) => {
								const client = clientMap.get(item.clientId);
								const project = item.projectId
									? projectMap.get(item.projectId)
									: null;
								return (
									<tr
										key={item.id}
										className="hover:bg-[var(--surface-sunken)] transition"
									>
										<td className="py-3 px-4">
											<div className="font-semibold text-[var(--ink)]">
												{item.title}
											</div>
											{item.notes && (
												<div className="text-[11px] text-[var(--ink-muted)] truncate max-w-xs mt-0.5">
													{item.notes}
												</div>
											)}
										</td>

										<td className="py-3 px-4">
											<span className="font-mono text-[11px] uppercase px-2 py-0.5 rounded bg-[var(--surface-raised)] border border-[var(--border-subtle)] text-[var(--ink-secondary)] font-medium">
												{item.type}
											</span>
										</td>

										<td className="py-3 px-4">
											<div className="font-medium text-[var(--ink)]">
												{client?.name || "Client Account"}
											</div>
											{item.opportunityNo && (
												<div className="mt-1">
													<OpportunityChip
														opportunityNo={item.opportunityNo}
														opportunityId={item.opportunityId}
														onNavigate={onNavigateToOpportunity}
													/>
												</div>
											)}
											{project && (
												<div className="text-[11px] text-[var(--ink-muted)] font-mono mt-0.5">
													↳ {project.name}
												</div>
											)}
										</td>

										<td className="py-3 px-4 font-mono font-bold text-[var(--ink)]">
											₹{item.amount.toLocaleString()}
										</td>

										<td className="py-3 px-4">
											<span
												className={`inline-block px-2 py-0.5 rounded text-[11px] font-mono border ${getStatusBadge(
													item.status,
												)}`}
											>
												{item.status}
											</span>
										</td>

										<td className="py-3 px-4 text-[12px] font-mono text-[var(--ink-muted)]">
											<div>Issued: {item.issueDate}</div>
											{item.dueDate && <div>Due: {item.dueDate}</div>}
										</td>

										<td className="py-3 px-4 text-right whitespace-nowrap">
											<div className="inline-flex items-center gap-1.5">
												{item.status !== "Paid" && item.type === "invoice" && (
													<button
														type="button"
														onClick={() => handleStatusChange(item, "Paid")}
														className="px-2 py-1 rounded text-[11px] font-medium text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
													>
														Mark Paid
													</button>
												)}
												{item.status === "Draft" && (
													<button
														type="button"
														onClick={() => handleStatusChange(item, "Sent")}
														className="px-2 py-1 rounded text-[11px] font-medium text-sky-700 hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-950/40"
													>
														Mark Sent
													</button>
												)}
												<button
													type="button"
													onClick={() => onOpenModal("finance", { item })}
													className="px-2 py-1 rounded text-[11px] font-medium text-[#49B3FC] hover:bg-[#EBF6FE] dark:hover:bg-[#49B3FC]/10"
												>
													Edit
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
