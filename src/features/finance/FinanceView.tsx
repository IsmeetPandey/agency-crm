import type React from "react";
import { useMemo, useState } from "react";
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
	onRefresh: () => void;
	search?: string;
}

export const FinanceView: React.FC<FinanceViewProps> = ({
	finance,
	clients,
	projects,
	onOpenModal,
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
				return "bg-emerald-100 text-emerald-800 border-emerald-300";
			case "Sent":
			case "Accepted":
				return "bg-sky-100 text-sky-800 border-sky-300";
			case "Overdue":
				return "bg-rose-100 text-rose-800 border-rose-300 font-bold";
			case "Declined":
				return "bg-slate-100 text-slate-700 border-slate-300";
			default:
				return "bg-amber-100 text-amber-800 border-amber-300";
		}
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EBEBEB]">
				<div>
					<div className="flex items-center gap-2">
						<h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111111]">
							Invoices & Proposals
						</h1>
						<span className="text-[12px] font-mono px-2 py-0.5 rounded-full bg-[#EDEDED] text-[#444444] font-semibold">
							{finance.length} Ledger Records
						</span>
					</div>
					<p className="text-[13px] text-[#666666] mt-1">
						Commercial milestone billing, proposal pipeline, and payment
						tracking for client accounts.
					</p>
				</div>

				<div className="flex items-center gap-2.5">
					<button
						type="button"
						onClick={exportCSV}
						className="px-3.5 py-2 rounded-lg border border-[#DEDEDE] text-[#444444] hover:bg-[#F5F5F5] text-[13px] font-medium transition cursor-pointer"
					>
						Export CSV
					</button>
					<button
						type="button"
						onClick={() => onOpenModal("finance")}
						className="px-4 py-2 rounded-lg bg-[#222222] hover:bg-[#111111] text-white text-[13px] font-medium transition flex items-center gap-2 shadow-xs cursor-pointer"
					>
						<span>+</span>
						<span>Create Record</span>
					</button>
				</div>
			</div>

			{/* Metric KPI Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
				<div className="p-3.5 rounded-xl bg-white border border-[#EDEDED] shadow-xs">
					<div className="text-[11px] font-mono uppercase tracking-wider text-[#777777]">
						Total Invoiced
					</div>
					<div className="text-xl font-bold font-mono text-[#111111] mt-1">
						₹{(stats.totalInvoiced / 100000).toFixed(2)}L
					</div>
					<div className="text-[11px] text-[#777777] mt-0.5">
						All issued invoices
					</div>
				</div>

				<div className="p-3.5 rounded-xl bg-white border border-[#EDEDED] shadow-xs">
					<div className="text-[11px] font-mono uppercase tracking-wider text-[#777777]">
						Settled / Paid
					</div>
					<div className="text-xl font-bold font-mono text-emerald-600 mt-1">
						₹{(stats.totalPaid / 100000).toFixed(2)}L
					</div>
					<div className="text-[11px] text-[#777777] mt-0.5">
						Collected agency revenue
					</div>
				</div>

				<div className="p-3.5 rounded-xl bg-white border border-[#EDEDED] shadow-xs">
					<div className="text-[11px] font-mono uppercase tracking-wider text-[#777777]">
						Overdue Invoices
					</div>
					<div
						className={`text-xl font-bold font-mono mt-1 ${stats.totalOverdue > 0 ? "text-rose-600" : "text-[#777777]"}`}
					>
						₹{(stats.totalOverdue / 100000).toFixed(2)}L
					</div>
					<div className="text-[11px] text-[#777777] mt-0.5">
						Requiring payment follow-up
					</div>
				</div>

				<div className="p-3.5 rounded-xl bg-white border border-[#EDEDED] shadow-xs">
					<div className="text-[11px] font-mono uppercase tracking-wider text-[#777777]">
						Open Proposals
					</div>
					<div className="text-xl font-bold font-mono text-[#49B3FC] mt-1">
						₹{(stats.pendingProposals / 100000).toFixed(2)}L
					</div>
					<div className="text-[11px] text-[#777777] mt-0.5">
						Sent quotes pending signoff
					</div>
				</div>
			</div>

			{/* Filters & Search */}
			<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white border border-[#EDEDED] rounded-xl shadow-xs">
				<div className="flex-1 max-w-sm">
					<input
						type="text"
						value={localSearch}
						onChange={(e) => setLocalSearch(e.target.value)}
						placeholder="Search by title, client, or project..."
						className="w-full px-3 py-1.5 text-[13px] bg-[#F7F7F7] border border-[#E0E0E0] rounded-lg focus:outline-none focus:border-[#49B3FC]"
					/>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<select
						value={typeFilter}
						onChange={(e) => setTypeFilter(e.target.value)}
						className="px-2.5 py-1.5 text-[12px] bg-[#F7F7F7] border border-[#E0E0E0] rounded-lg focus:outline-none text-[#222222]"
					>
						<option value="all">All Types</option>
						<option value="invoice">Invoices</option>
						<option value="proposal">Proposals</option>
						<option value="quotation">Quotations</option>
					</select>

					<select
						value={statusFilter}
						onChange={(e) => setStatusFilter(e.target.value)}
						className="px-2.5 py-1.5 text-[12px] bg-[#F7F7F7] border border-[#E0E0E0] rounded-lg focus:outline-none text-[#222222]"
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
						className="px-2.5 py-1.5 text-[12px] bg-[#F7F7F7] border border-[#E0E0E0] rounded-lg focus:outline-none text-[#222222]"
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
						className="mt-4 px-4 py-2 rounded-lg bg-[#222222] hover:bg-[#111111] text-white text-[13px] font-medium"
					>
						+ Create Finance Record
					</button>
				</div>
			) : (
				<div className="overflow-x-auto bg-white border border-[#EDEDED] rounded-xl shadow-xs">
					<table className="w-full text-left border-collapse text-[13px]">
						<thead>
							<tr className="border-b border-[#EDEDED] bg-[#FAFAFA] text-[11px] font-mono uppercase tracking-wider text-[#777777]">
								<th className="py-3 px-4">Item & Deliverable</th>
								<th className="py-3 px-4">Type</th>
								<th className="py-3 px-4">Account / Project</th>
								<th className="py-3 px-4">Amount</th>
								<th className="py-3 px-4">Status</th>
								<th className="py-3 px-4">Timeline</th>
								<th className="py-3 px-4 text-right">Actions</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-[#F0F0F0]">
							{filteredItems.map((item) => {
								const client = clientMap.get(item.clientId);
								const project = item.projectId
									? projectMap.get(item.projectId)
									: null;
								return (
									<tr key={item.id} className="hover:bg-[#F9F9F9] transition">
										<td className="py-3 px-4">
											<div className="font-semibold text-[#111111]">
												{item.title}
											</div>
											{item.notes && (
												<div className="text-[11px] text-[#777777] truncate max-w-xs mt-0.5">
													{item.notes}
												</div>
											)}
										</td>

										<td className="py-3 px-4">
											<span className="font-mono text-[11px] uppercase px-2 py-0.5 rounded bg-[#F0F0F0] text-[#555555] font-medium">
												{item.type}
											</span>
										</td>

										<td className="py-3 px-4">
											<div className="font-medium text-[#222222]">
												{client?.name || "Client Account"}
											</div>
											{project && (
												<div className="text-[11px] text-[#777777] font-mono mt-0.5">
													↳ {project.name}
												</div>
											)}
										</td>

										<td className="py-3 px-4 font-mono font-bold text-[#111111]">
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

										<td className="py-3 px-4 text-[12px] font-mono text-[#666666]">
											<div>Issued: {item.issueDate}</div>
											{item.dueDate && <div>Due: {item.dueDate}</div>}
										</td>

										<td className="py-3 px-4 text-right whitespace-nowrap">
											<div className="inline-flex items-center gap-1.5">
												{item.status !== "Paid" && item.type === "invoice" && (
													<button
														type="button"
														onClick={() => handleStatusChange(item, "Paid")}
														className="px-2 py-1 rounded text-[11px] font-medium text-emerald-700 hover:bg-emerald-50"
													>
														Mark Paid
													</button>
												)}
												{item.status === "Draft" && (
													<button
														type="button"
														onClick={() => handleStatusChange(item, "Sent")}
														className="px-2 py-1 rounded text-[11px] font-medium text-sky-700 hover:bg-sky-50"
													>
														Mark Sent
													</button>
												)}
												<button
													type="button"
													onClick={() => onOpenModal("finance", { item })}
													className="px-2 py-1 rounded text-[11px] font-medium text-[#49B3FC] hover:bg-[#EBF6FE]"
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
