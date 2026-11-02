import type React from "react";
import { useMemo, useState } from "react";
import {
	BarChart3,
	CheckCircle2,
	ChevronDown,
	Clock,
	FileDown,
	FileText,
	Filter,
	Receipt,
	Scale,
	Search,
} from "lucide-react";
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

type FinanceTab = "invoices" | "statements";
type StatementSubTab = "balance-sheet" | "profit-loss";
type DateFilterRange = "365" | "quarter" | "month" | "all";

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
	const [activeTab, setActiveTab] = useState<FinanceTab>("invoices");
	const [statementSubTab, setStatementSubTab] =
		useState<StatementSubTab>("balance-sheet");
	const [dateRange, setDateRange] = useState<DateFilterRange>("365");
	const [localSearch, setLocalSearch] = useState("");
	const [typeFilter, setTypeFilter] = useState<string>("all");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [clientFilter, setClientFilter] = useState<string>("all");
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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

	// Filtered invoices/proposals
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

	// Summary KPI metrics matching Reference ERP
	const stats = useMemo(() => {
		const invoices = finance.filter((f) => f.type === "invoice");
		const totalInvoiced = invoices.reduce((sum, i) => sum + (i.amount || 0), 0);
		const totalPaid = invoices
			.filter((i) => i.status === "Paid")
			.reduce((sum, i) => sum + (i.amount || 0), 0);
		const totalUnpaid = Math.max(0, totalInvoiced - totalPaid);
		const totalOverdue = invoices
			.filter((i) => i.status === "Overdue")
			.reduce((sum, i) => sum + (i.amount || 0), 0);
		const pendingProposals = finance
			.filter((f) => f.type === "proposal" && f.status === "Sent")
			.reduce((sum, p) => sum + (p.amount || 0), 0);

		return {
			totalInvoiced,
			totalPaid,
			totalUnpaid,
			totalOverdue,
			pendingProposals,
		};
	}, [finance]);

	// Multi-select handling
	const toggleSelectAll = () => {
		if (selectedIds.size === filteredItems.length) {
			setSelectedIds(new Set());
		} else {
			setSelectedIds(new Set(filteredItems.map((i) => i.id)));
		}
	};

	const toggleSelectItem = (id: string) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

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

	const handleDownloadStatementPDF = () => {
		window.print();
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
			{/* Primary Section Switcher Tabs */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[var(--border)] no-print">
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={() => setActiveTab("invoices")}
						className={`px-4 py-2 rounded-xl text-[13px] font-semibold transition-all flex items-center gap-2 ${
							activeTab === "invoices"
								? "bg-[#1A253C] text-white shadow-sm"
								: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
						}`}
					>
						<FileText className="w-4 h-4" />
						<span>Sales Invoices & Billing</span>
					</button>
					<button
						type="button"
						onClick={() => setActiveTab("statements")}
						className={`px-4 py-2 rounded-xl text-[13px] font-semibold transition-all flex items-center gap-2 ${
							activeTab === "statements"
								? "bg-[#1A253C] text-white shadow-sm"
								: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
						}`}
					>
						<Scale className="w-4 h-4" />
						<span>Financial Statements (Balance Sheet)</span>
					</button>
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
						className="btn-primary !h-[34px] text-[13px] font-medium flex items-center gap-2 cursor-pointer !bg-[#1A253C] hover:!bg-[#263554] !text-white"
					>
						<span>+</span>
						<span>Create Sales Invoice</span>
					</button>
				</div>
			</div>

			{/* ============================================================== */}
			{/* TAB 1: SALES INVOICES & BILLING VIEW                           */}
			{/* ============================================================== */}
			{activeTab === "invoices" && (
				<>
					{/* 3 Summary KPI Strip Cards (Exact Reference Match) */}
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
						{/* Total Sales */}
						<div className="p-4 rounded-xl border border-blue-200/60 dark:border-blue-900/50 bg-[#F4F8FE] dark:bg-blue-950/20 shadow-xs flex items-center justify-between">
							<div>
								<div className="text-[12px] font-semibold uppercase tracking-wider text-blue-900 dark:text-blue-300">
									Total Sales
								</div>
								<div className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white mt-1">
									₹{stats.totalInvoiced.toLocaleString("en-IN")}
								</div>
								<div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
									{filteredItems.filter((i) => i.type === "invoice").length}{" "}
									total billed invoices
								</div>
							</div>
							<div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center">
								<BarChart3 className="w-5 h-5" />
							</div>
						</div>

						{/* Paid */}
						<div className="p-4 rounded-xl border border-emerald-200/60 dark:border-emerald-900/50 bg-[#F0FDF4] dark:bg-emerald-950/20 shadow-xs flex items-center justify-between">
							<div>
								<div className="text-[12px] font-semibold uppercase tracking-wider text-emerald-900 dark:text-emerald-300">
									Paid Collections
								</div>
								<div className="text-2xl font-extrabold font-mono text-emerald-700 dark:text-emerald-400 mt-1">
									₹{stats.totalPaid.toLocaleString("en-IN")}
								</div>
								<div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
									Collected agency revenue
								</div>
							</div>
							<div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
								<CheckCircle2 className="w-5 h-5" />
							</div>
						</div>

						{/* Unpaid */}
						<div className="p-4 rounded-xl border border-amber-200/60 dark:border-amber-900/50 bg-[#FFFBEB] dark:bg-amber-950/20 shadow-xs flex items-center justify-between">
							<div>
								<div className="text-[12px] font-semibold uppercase tracking-wider text-amber-900 dark:text-amber-300">
									Unpaid Balance
								</div>
								<div className="text-2xl font-extrabold font-mono text-amber-700 dark:text-amber-400 mt-1">
									₹{stats.totalUnpaid.toLocaleString("en-IN")}
								</div>
								<div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
									Pending payment collection
								</div>
							</div>
							<div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center justify-center">
								<Clock className="w-5 h-5" />
							</div>
						</div>
					</div>

					{/* Filter & Action Bar (Matching Reference Screen 06) */}
					<div className="p-3.5 rounded-xl border border-[var(--border)] bg-white dark:bg-slate-900 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
						{/* Left: Date Range & Search */}
						<div className="flex flex-wrap items-center gap-2.5 flex-1">
							{/* Date Filter Dropdown */}
							<div className="relative">
								<select
									value={dateRange}
									onChange={(e) =>
										setDateRange(e.target.value as DateFilterRange)
									}
									className="h-[36px] pl-3 pr-8 text-[12.5px] font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none cursor-pointer"
								>
									<option value="365">Last 365 Days</option>
									<option value="quarter">This Quarter</option>
									<option value="month">This Month</option>
									<option value="all">All Time</option>
								</select>
								<ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
							</div>

							{/* Search Pill */}
							<div className="relative flex-1 min-w-[200px] max-w-sm">
								<input
									type="text"
									value={localSearch}
									onChange={(e) => setLocalSearch(e.target.value)}
									placeholder="Search invoice number, client, project..."
									className="w-full h-[36px] pl-9 pr-3 text-[12.5px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
								/>
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
							</div>

							{/* Type Filter */}
							<select
								value={typeFilter}
								onChange={(e) => setTypeFilter(e.target.value)}
								className="h-[36px] px-3 text-[12.5px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none"
							>
								<option value="all">All Types</option>
								<option value="invoice">Invoices</option>
								<option value="proposal">Proposals</option>
								<option value="quotation">Quotations</option>
							</select>

							{/* Status Filter */}
							<select
								value={statusFilter}
								onChange={(e) => setStatusFilter(e.target.value)}
								className="h-[36px] px-3 text-[12.5px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none"
							>
								<option value="all">All Statuses</option>
								<option value="Draft">Draft</option>
								<option value="Sent">Sent</option>
								<option value="Accepted">Accepted</option>
								<option value="Paid">Paid</option>
								<option value="Overdue">Overdue</option>
							</select>
						</div>

						{/* Right: Bulk Actions */}
						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={() => {
									if (selectedIds.size === 0) {
										toast({
											title: "No Selection",
											description: "Select items using checkboxes first.",
											type: "info",
										});
									} else {
										toast({
											title: "Bulk Action Triggered",
											description: `Processing ${selectedIds.size} records.`,
											type: "success",
										});
									}
								}}
								className="h-[36px] px-3.5 text-[12.5px] font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition cursor-pointer"
							>
								<span>Bulk Actions</span>
								<ChevronDown className="w-3.5 h-3.5" />
							</button>
						</div>
					</div>

					{/* ERP Table Container (Signature Light Blue Header #EBF2FB) */}
					{filteredItems.length === 0 ? (
						<div className="text-center py-16 bg-white dark:bg-slate-900 border border-[var(--border)] rounded-xl">
							<Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2 stroke-[1.5]" />
							<h3 className="text-[15px] font-bold text-slate-900 dark:text-white">
								No invoice records found
							</h3>
							<p className="text-[13px] text-slate-500 max-w-sm mx-auto mt-1">
								{searchQuery || typeFilter !== "all" || statusFilter !== "all"
									? "No finance items matched your active filters."
									: "No quotes or invoices logged yet. Create your first sales invoice."}
							</p>
							<button
								type="button"
								onClick={() => onOpenModal("finance")}
								className="mt-4 px-4 py-2 rounded-lg btn-primary text-[13px] font-medium !bg-[#1A253C]"
							>
								+ Create Sales Invoice
							</button>
						</div>
					) : (
						<div className="erp-table-container">
							<table className="w-full text-left border-collapse text-[13px]">
								<thead>
									<tr className="erp-table-head border-b border-blue-200/50 dark:border-slate-800">
										<th className="py-3 px-3.5 w-10 text-center">
											<input
												type="checkbox"
												checked={
													selectedIds.size === filteredItems.length &&
													filteredItems.length > 0
												}
												onChange={toggleSelectAll}
												className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
											/>
										</th>
										<th className="py-3 px-4">Sales Invoice / Item</th>
										<th className="py-3 px-3.5">Type</th>
										<th className="py-3 px-4">Client Account & Deal</th>
										<th className="py-3 px-4">Amount (INR)</th>
										<th className="py-3 px-3.5">Status</th>
										<th className="py-3 px-4">Billing Timeline</th>
										<th className="py-3 px-4 text-right">Actions</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-[var(--border-subtle)]">
									{filteredItems.map((item) => {
										const client = clientMap.get(item.clientId);
										const project = item.projectId
											? projectMap.get(item.projectId)
											: null;
										const isSelected = selectedIds.has(item.id);

										return (
											<tr
												key={item.id}
												className={`erp-table-row ${
													isSelected ? "bg-blue-50/50 dark:bg-blue-950/20" : ""
												}`}
											>
												<td className="py-3 px-3.5 text-center">
													<input
														type="checkbox"
														checked={isSelected}
														onChange={() => toggleSelectItem(item.id)}
														className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
													/>
												</td>

												<td className="py-3 px-4">
													<div className="font-semibold text-slate-900 dark:text-white">
														{item.title}
													</div>
													{item.notes && (
														<div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs mt-0.5">
															{item.notes}
														</div>
													)}
												</td>

												<td className="py-3 px-3.5">
													<span className="font-mono text-[11px] uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium">
														{item.type}
													</span>
												</td>

												<td className="py-3 px-4">
													<div className="font-medium text-slate-900 dark:text-white">
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
														<div className="text-[11px] text-slate-500 font-mono mt-0.5">
															↳ {project.name}
														</div>
													)}
												</td>

												<td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
													₹{item.amount.toLocaleString("en-IN")}
												</td>

												<td className="py-3 px-3.5">
													<span
														className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadge(
															item.status,
														)}`}
													>
														{item.status}
													</span>
												</td>

												<td className="py-3 px-4 text-[12px] font-mono text-slate-500 dark:text-slate-400">
													<div>Issued: {item.issueDate}</div>
													{item.dueDate && (
														<div className="text-[11px] text-slate-400">
															Due: {item.dueDate}
														</div>
													)}
												</td>

												<td className="py-3 px-4 text-right whitespace-nowrap">
													<div className="inline-flex items-center gap-1.5">
														{/* PDF Download Button (Reference Feature) */}
														<button
															type="button"
															onClick={() => {
																toast({
																	title: "Invoice PDF",
																	description: `Generating tax invoice for ${item.title}...`,
																	type: "info",
																});
																window.print();
															}}
															title="Download PDF Invoice"
															className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:bg-slate-800 transition"
														>
															<FileDown className="w-4 h-4" />
														</button>

														{item.status !== "Paid" &&
															item.type === "invoice" && (
																<button
																	type="button"
																	onClick={() =>
																		handleStatusChange(item, "Paid")
																	}
																	className="px-2.5 py-1 rounded-md text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-950/50 transition"
																>
																	Mark Paid
																</button>
															)}

														{item.status === "Draft" && (
															<button
																type="button"
																onClick={() => handleStatusChange(item, "Sent")}
																className="px-2.5 py-1 rounded-md text-[11px] font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 dark:text-sky-300 dark:bg-sky-950/50 transition"
															>
																Mark Sent
															</button>
														)}

														<button
															type="button"
															onClick={() => onOpenModal("finance", { item })}
															className="px-2.5 py-1 rounded-md text-[11px] font-semibold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition"
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
				</>
			)}

			{/* ============================================================== */}
			{/* TAB 2: FINANCIAL STATEMENTS (BALANCE SHEET & PROFIT & LOSS)      */}
			{/* Exact Reference match to late_23.0s.png                        */}
			{/* ============================================================== */}
			{activeTab === "statements" && (
				<div className="space-y-6">
					{/* Top Sub-Bar: Statement Switcher + Action Buttons */}
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-[var(--border)] bg-white dark:bg-slate-900 shadow-xs no-print">
						{/* Subtabs: Balance Sheet vs Profit & Loss */}
						<div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
							<button
								type="button"
								onClick={() => setStatementSubTab("balance-sheet")}
								className={`px-4 py-1.5 rounded-md text-[13px] font-semibold transition ${
									statementSubTab === "balance-sheet"
										? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
										: "text-slate-600 dark:text-slate-400 hover:text-slate-900"
								}`}
							>
								Balance Sheet
							</button>
							<button
								type="button"
								onClick={() => setStatementSubTab("profit-loss")}
								className={`px-4 py-1.5 rounded-md text-[13px] font-semibold transition ${
									statementSubTab === "profit-loss"
										? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
										: "text-slate-600 dark:text-slate-400 hover:text-slate-900"
								}`}
							>
								Profit & Loss
							</button>
						</div>

						{/* Right Actions: Show Filters (Blue) & Download PDF (Green) */}
						<div className="flex items-center gap-2.5">
							<button
								type="button"
								onClick={() =>
									toast({
										title: "Statement Filters",
										description: "Showing FY 2025-26 active accounts ledger.",
										type: "info",
									})
								}
								className="h-[36px] px-3.5 rounded-lg text-[12.5px] font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-xs transition"
							>
								<Filter className="w-3.5 h-3.5" />
								<span>Show Filters</span>
							</button>
							<button
								type="button"
								onClick={handleDownloadStatementPDF}
								className="h-[36px] px-3.5 rounded-lg text-[12.5px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-xs transition"
							>
								<FileDown className="w-3.5 h-3.5" />
								<span>Download PDF</span>
							</button>
						</div>
					</div>

					{/* Printed Statement Card Container (Centered Title & Dual Column) */}
					<div className="p-6 sm:p-8 rounded-2xl border border-[var(--border)] bg-white dark:bg-slate-900 shadow-sm space-y-6">
						{/* Centered Document Header */}
						<div className="text-center space-y-1 pb-4 border-b border-slate-200 dark:border-slate-800">
							<div className="text-[11px] font-mono font-bold tracking-widest uppercase text-slate-400">
								AGENCY STATEMENT OF ACCOUNTS
							</div>
							<h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
								KREATIWIT AGENCYOS
							</h2>
							<div className="text-[15px] font-semibold text-slate-700 dark:text-slate-300">
								{statementSubTab === "balance-sheet"
									? "Balance Sheet"
									: "Profit & Loss Account"}
							</div>
							<div className="text-[12px] font-mono text-slate-500 dark:text-slate-400">
								01 Apr 2025 to 31 Mar 2026 (Active Fiscal Period)
							</div>
						</div>

						{/* DUAL-COLUMN ACCOUNTING TABLE (Exact Reference Layout) */}
						{statementSubTab === "balance-sheet" ? (
							<div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden divide-y md:divide-y-0 md:divide-x divide-slate-300 dark:divide-slate-700">
								{/* Left Column: Liabilities */}
								<div className="flex flex-col">
									{/* Column Header */}
									<div className="erp-table-head py-3 px-4 border-b border-slate-300 dark:border-slate-700 flex justify-between items-center">
										<span className="font-bold uppercase tracking-wider">
											Liabilities & Equity
										</span>
										<span className="font-mono text-[11px]">Amount (₹)</span>
									</div>

									{/* Account Rows */}
									<div className="divide-y divide-slate-100 dark:divide-slate-800 flex-1">
										<div className="py-2.5 px-4 flex justify-between text-[13px]">
											<span className="font-semibold text-slate-800 dark:text-slate-200">
												Capital Account (Founders Equity)
											</span>
											<span className="font-mono font-bold text-slate-900 dark:text-white">
												₹25,00,000
											</span>
										</div>
										<div className="py-2.5 px-4 flex justify-between text-[13px]">
											<span className="text-slate-700 dark:text-slate-300 pl-3">
												↳ Retained Earnings & Agency Reserves
											</span>
											<span className="font-mono text-slate-800 dark:text-slate-200">
												₹{(stats.totalPaid * 0.4).toFixed(0).toLocaleString()}
											</span>
										</div>
										<div className="py-2.5 px-4 flex justify-between text-[13px]">
											<span className="font-semibold text-slate-800 dark:text-slate-200">
												Current Liabilities
											</span>
											<span className="font-mono font-bold text-slate-900 dark:text-white">
												₹4,85,000
											</span>
										</div>
										<div className="py-2.5 px-4 flex justify-between text-[13px]">
											<span className="text-slate-700 dark:text-slate-300 pl-3">
												↳ Sundry Creditors & Contractors
											</span>
											<span className="font-mono text-slate-800 dark:text-slate-200">
												₹3,15,000
											</span>
										</div>
										<div className="py-2.5 px-4 flex justify-between text-[13px]">
											<span className="text-slate-700 dark:text-slate-300 pl-3">
												↳ Advance Milestone Retainers
											</span>
											<span className="font-mono text-slate-800 dark:text-slate-200">
												₹1,70,000
											</span>
										</div>
										<div className="py-2.5 px-4 flex justify-between text-[13px]">
											<span className="font-semibold text-slate-800 dark:text-slate-200">
												Statutory Dues (GST & TDS Payable)
											</span>
											<span className="font-mono font-bold text-slate-900 dark:text-white">
												₹1,45,000
											</span>
										</div>
									</div>

									{/* Total Liabilities Footer */}
									<div className="py-3 px-4 bg-slate-100 dark:bg-slate-800 border-t border-slate-300 dark:border-slate-700 flex justify-between items-center text-[13px] font-bold">
										<span>Total Liabilities & Equity</span>
										<span className="font-mono text-[14px] text-slate-900 dark:text-white">
											₹
											{(
												3130000 + Math.round(stats.totalPaid * 0.4)
											).toLocaleString("en-IN")}
										</span>
									</div>
								</div>

								{/* Right Column: Assets */}
								<div className="flex flex-col">
									{/* Column Header */}
									<div className="erp-table-head py-3 px-4 border-b border-slate-300 dark:border-slate-700 flex justify-between items-center">
										<span className="font-bold uppercase tracking-wider">
											Assets
										</span>
										<span className="font-mono text-[11px]">Amount (₹)</span>
									</div>

									{/* Account Rows */}
									<div className="divide-y divide-slate-100 dark:divide-slate-800 flex-1">
										<div className="py-2.5 px-4 flex justify-between text-[13px]">
											<span className="font-semibold text-slate-800 dark:text-slate-200">
												Fixed Assets (Studio Hardware & Equipment)
											</span>
											<span className="font-mono font-bold text-slate-900 dark:text-white">
												₹12,50,000
											</span>
										</div>
										<div className="py-2.5 px-4 flex justify-between text-[13px]">
											<span className="font-semibold text-slate-800 dark:text-slate-200">
												Current Assets & Receivables
											</span>
											<span className="font-mono font-bold text-slate-900 dark:text-white">
												₹{stats.totalUnpaid.toLocaleString("en-IN")}
											</span>
										</div>
										<div className="py-2.5 px-4 flex justify-between text-[13px]">
											<span className="text-slate-700 dark:text-slate-300 pl-3">
												↳ Sundry Debtors (Open Invoices)
											</span>
											<span className="font-mono text-slate-800 dark:text-slate-200">
												₹{stats.totalUnpaid.toLocaleString("en-IN")}
											</span>
										</div>
										<div className="py-2.5 px-4 flex justify-between text-[13px]">
											<span className="font-semibold text-slate-800 dark:text-slate-200">
												Bank & Cash Balances
											</span>
											<span className="font-mono font-bold text-slate-900 dark:text-white">
												₹
												{(
													1880000 +
													Math.round(stats.totalPaid * 0.4) -
													stats.totalUnpaid
												).toLocaleString("en-IN")}
											</span>
										</div>
										<div className="py-2.5 px-4 flex justify-between text-[13px]">
											<span className="text-slate-700 dark:text-slate-300 pl-3">
												↳ Primary Operating Account (HDFC)
											</span>
											<span className="font-mono text-slate-800 dark:text-slate-200">
												₹15,40,000
											</span>
										</div>
										<div className="py-2.5 px-4 flex justify-between text-[13px]">
											<span className="text-slate-700 dark:text-slate-300 pl-3">
												↳ Liquid Treasury & Cash Reserves
											</span>
											<span className="font-mono text-slate-800 dark:text-slate-200">
												₹3,40,000
											</span>
										</div>
									</div>

									{/* Total Assets Footer */}
									<div className="py-3 px-4 bg-slate-100 dark:bg-slate-800 border-t border-slate-300 dark:border-slate-700 flex justify-between items-center text-[13px] font-bold">
										<span>Total Assets</span>
										<span className="font-mono text-[14px] text-slate-900 dark:text-white">
											₹
											{(
												3130000 + Math.round(stats.totalPaid * 0.4)
											).toLocaleString("en-IN")}
										</span>
									</div>
								</div>
							</div>
						) : (
							/* Profit & Loss Dual Column */
							<div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden divide-y md:divide-y-0 md:divide-x divide-slate-300 dark:divide-slate-700">
								{/* Left Column: Expenses */}
								<div className="flex flex-col">
									<div className="erp-table-head py-3 px-4 border-b border-slate-300 dark:border-slate-700 flex justify-between items-center">
										<span className="font-bold uppercase tracking-wider">
											Expenses
										</span>
										<span className="font-mono text-[11px]">Amount (₹)</span>
									</div>

									<div className="divide-y divide-slate-100 dark:divide-slate-800 flex-1">
										<div className="py-2.5 px-4 flex justify-between text-[13px]">
											<span className="font-semibold text-slate-800 dark:text-slate-200">
												Direct Delivery & Freelance Talent
											</span>
											<span className="font-mono font-bold text-slate-900 dark:text-white">
												₹8,50,000
											</span>
										</div>
										<div className="py-2.5 px-4 flex justify-between text-[13px]">
											<span className="font-semibold text-slate-800 dark:text-slate-200">
												Cloud Hosting, SaaS & Design Tools
											</span>
											<span className="font-mono font-bold text-slate-900 dark:text-white">
												₹2,20,000
											</span>
										</div>
										<div className="py-2.5 px-4 flex justify-between text-[13px]">
											<span className="font-semibold text-slate-800 dark:text-slate-200">
												Studio Operations & Legal
											</span>
											<span className="font-mono font-bold text-slate-900 dark:text-white">
												₹1,80,000
											</span>
										</div>
										<div className="py-2.5 px-4 flex justify-between text-[13px]">
											<span className="font-semibold text-slate-800 dark:text-slate-200">
												Sales & Client Acquisition Costs
											</span>
											<span className="font-mono font-bold text-slate-900 dark:text-white">
												₹1,40,000
											</span>
										</div>
										<div className="py-2.5 px-4 flex justify-between text-[13px] bg-emerald-50/50 dark:bg-emerald-950/20 font-bold">
											<span className="text-emerald-800 dark:text-emerald-300">
												Agency Net Operating Profit
											</span>
											<span className="font-mono text-emerald-700 dark:text-emerald-400">
												₹
												{Math.max(0, stats.totalPaid - 1390000).toLocaleString(
													"en-IN",
												)}
											</span>
										</div>
									</div>

									<div className="py-3 px-4 bg-slate-100 dark:bg-slate-800 border-t border-slate-300 dark:border-slate-700 flex justify-between items-center text-[13px] font-bold">
										<span>Total Operating Outlays</span>
										<span className="font-mono text-[14px] text-slate-900 dark:text-white">
											₹
											{Math.max(1390000, stats.totalPaid).toLocaleString(
												"en-IN",
											)}
										</span>
									</div>
								</div>

								{/* Right Column: Income */}
								<div className="flex flex-col">
									<div className="erp-table-head py-3 px-4 border-b border-slate-300 dark:border-slate-700 flex justify-between items-center">
										<span className="font-bold uppercase tracking-wider">
											Income & Revenue
										</span>
										<span className="font-mono text-[11px]">Amount (₹)</span>
									</div>

									<div className="divide-y divide-slate-100 dark:divide-slate-800 flex-1">
										<div className="py-2.5 px-4 flex justify-between text-[13px]">
											<span className="font-semibold text-slate-800 dark:text-slate-200">
												Client Billed Invoices (Total Sales)
											</span>
											<span className="font-mono font-bold text-slate-900 dark:text-white">
												₹{stats.totalInvoiced.toLocaleString("en-IN")}
											</span>
										</div>
										<div className="py-2.5 px-4 flex justify-between text-[13px]">
											<span className="text-slate-700 dark:text-slate-300 pl-3">
												↳ Retainer Service Contracts
											</span>
											<span className="font-mono text-slate-800 dark:text-slate-200">
												₹
												{Math.round(stats.totalInvoiced * 0.6).toLocaleString(
													"en-IN",
												)}
											</span>
										</div>
										<div className="py-2.5 px-4 flex justify-between text-[13px]">
											<span className="text-slate-700 dark:text-slate-300 pl-3">
												↳ Fixed-Scope Milestone Deliveries
											</span>
											<span className="font-mono text-slate-800 dark:text-slate-200">
												₹
												{Math.round(stats.totalInvoiced * 0.4).toLocaleString(
													"en-IN",
												)}
											</span>
										</div>
										<div className="py-2.5 px-4 flex justify-between text-[13px]">
											<span className="font-semibold text-slate-800 dark:text-slate-200">
												Other Advisory & Technical Fees
											</span>
											<span className="font-mono font-bold text-slate-900 dark:text-white">
												₹1,50,000
											</span>
										</div>
									</div>

									<div className="py-3 px-4 bg-slate-100 dark:bg-slate-800 border-t border-slate-300 dark:border-slate-700 flex justify-between items-center text-[13px] font-bold">
										<span>Total Operating Revenue</span>
										<span className="font-mono text-[14px] text-slate-900 dark:text-white">
											₹{(stats.totalInvoiced + 150000).toLocaleString("en-IN")}
										</span>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
};
