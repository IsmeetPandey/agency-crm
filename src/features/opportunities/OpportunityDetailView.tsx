import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { OpportunityChip } from "../../components/ui/OpportunityChip";
import { useToast } from "../../lib/feedback/toast.context";
import { notesRepository } from "../../lib/repositories/notes.repository";
import { opportunitiesRepository } from "../../lib/repositories/opportunities.repository";
import { formatCurrency } from "../../lib/utils/format";
import type {
	Client,
	Contact,
	FinanceItem,
	Lead,
	Note,
	Opportunity,
	OpportunityStage,
	Project,
	TeamMemberDetail,
} from "../../types";

interface OpportunityDetailViewProps {
	opportunity: Opportunity;
	client?: Client | null;
	contacts: Contact[];
	projects: Project[];
	finance: FinanceItem[];
	sourceLead?: Lead | null;
	team: TeamMemberDetail[];
	onBack: () => void;
	onOpenModal: (type: string, data?: any) => void;
	onOpenProject?: (projectId: string) => void;
	onRefresh: () => void;
}

const STAGES: OpportunityStage[] = [
	"Open",
	"Qualified",
	"Proposal",
	"Negotiation",
	"Won",
	"Lost",
	"Hold",
];

export const OpportunityDetailView: React.FC<OpportunityDetailViewProps> = ({
	opportunity,
	client,
	contacts,
	projects,
	finance,
	sourceLead,
	team,
	onBack,
	onOpenModal,
	onOpenProject,
	onRefresh,
}) => {
	const { toast } = useToast();
	const [notes, setNotes] = useState<Note[]>([]);
	const [newNoteContent, setNewNoteContent] = useState("");
	const [isAddingNote, setIsAddingNote] = useState(false);
	const [currentStage, setCurrentStage] = useState<OpportunityStage>(
		opportunity.stage,
	);

	useEffect(() => {
		setCurrentStage(opportunity.stage);
		const loadNotes = async () => {
			try {
				const list = await notesRepository.list("opportunity", opportunity.id);
				setNotes(list);
			} catch (e) {
				console.error("Failed to load opportunity notes:", e);
			}
		};
		loadNotes();
	}, [opportunity]);

	const linkedProjects = useMemo(() => {
		return projects.filter(
			(p) =>
				p.opportunityId === opportunity.id ||
				(p.opportunityNo && p.opportunityNo === opportunity.opportunityNo) ||
				(p.clientId === opportunity.clientId && !p.opportunityId),
		);
	}, [projects, opportunity]);

	const linkedFinance = useMemo(() => {
		return finance.filter(
			(f) =>
				f.opportunityId === opportunity.id ||
				(f.opportunityNo && f.opportunityNo === opportunity.opportunityNo) ||
				(f.clientId === opportunity.clientId && !f.opportunityId),
		);
	}, [finance, opportunity]);

	const primaryContact = useMemo(() => {
		const clientContacts = contacts.filter(
			(c) => c.clientId === opportunity.clientId,
		);
		return clientContacts.find((c) => c.isPrimary) || clientContacts[0];
	}, [contacts, opportunity.clientId]);

	const handleStageChange = async (nextStage: OpportunityStage) => {
		setCurrentStage(nextStage);
		try {
			await opportunitiesRepository.update(opportunity.id, {
				stage: nextStage,
			});
			toast({
				title: "Stage Updated",
				description: `${opportunity.opportunityNo} is now ${nextStage}.`,
				type: "success",
			});
			onRefresh();
		} catch (err: unknown) {
			const msg =
				err instanceof Error ? err.message : "Could not update stage.";
			toast({
				title: "Update Failed",
				description: msg,
				type: "error",
			});
		}
	};

	const handleAddNote = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newNoteContent.trim() || isAddingNote) return;

		setIsAddingNote(true);
		try {
			const note = await notesRepository.create({
				entityType: "opportunity",
				entityId: opportunity.id,
				author: "Abhishek",
				content: newNoteContent.trim(),
			});
			setNotes([note, ...notes]);
			setNewNoteContent("");
			toast({
				title: "Note Recorded",
				description: "Internal note added to opportunity audit trail.",
				type: "success",
			});
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : "Could not save note.";
			toast({
				title: "Note Failed",
				description: msg,
				type: "error",
			});
		} finally {
			setIsAddingNote(false);
		}
	};

	const getStageBadgeColor = (stage: OpportunityStage) => {
		switch (stage) {
			case "Won":
				return "bg-emerald-100 text-emerald-800 border-emerald-300";
			case "Negotiation":
			case "Proposal":
				return "bg-sky-100 text-sky-800 border-sky-300";
			case "Qualified":
				return "bg-indigo-100 text-indigo-800 border-indigo-300";
			case "Lost":
				return "bg-rose-100 text-rose-800 border-rose-300";
			case "Hold":
				return "bg-slate-100 text-slate-700 border-slate-300";
			default:
				return "bg-amber-100 text-amber-800 border-amber-300";
		}
	};

	return (
		<div className="space-y-6">
			{/* Breadcrumb & Navigation Topbar */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EBEBEB]">
				<div className="flex items-center gap-3">
					<button
						type="button"
						onClick={onBack}
						className="px-3 py-1.5 rounded-lg border border-[#DEDEDE] text-[#666666] hover:bg-[#F5F5F5] text-[13px] font-medium transition cursor-pointer flex items-center gap-1.5"
					>
						<span>←</span>
						<span>All Opportunities</span>
					</button>

					<div className="h-4 w-px bg-[#DEDEDE]" />

					<div className="flex items-center gap-2">
						<OpportunityChip
							opportunityNo={opportunity.opportunityNo}
							size="md"
						/>
						<h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111111]">
							{opportunity.title}
						</h1>
					</div>
				</div>

				<div className="flex items-center gap-2.5">
					{/* Stage Transition Dropdown */}
					<div className="flex items-center gap-2">
						<span className="text-[12px] font-mono text-[#777777] uppercase">
							Stage:
						</span>
						<select
							value={currentStage}
							onChange={(e) =>
								handleStageChange(e.target.value as OpportunityStage)
							}
							className={`text-[12px] font-mono font-bold px-2.5 py-1.5 rounded-lg border shadow-xs cursor-pointer focus:outline-none ${getStageBadgeColor(
								currentStage,
							)}`}
						>
							{STAGES.map((s) => (
								<option key={s} value={s}>
									{s}
								</option>
							))}
						</select>
					</div>

					<button
						type="button"
						onClick={() => onOpenModal("opportunity", { opportunity })}
						className="px-3.5 py-1.5 rounded-lg bg-[#222222] hover:bg-[#111111] text-white text-[13px] font-medium transition cursor-pointer"
					>
						Edit Opportunity
					</button>
				</div>
			</div>

			{/* Core Context Cards Grid */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
				{/* 1. Commercial Summary Card */}
				<div className="p-5 rounded-xl bg-white border border-[#EDEDED] shadow-xs space-y-4">
					<div className="flex items-center justify-between">
						<div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#777777]">
							Commercial Terms
						</div>
						<span
							className={`text-[11px] font-mono px-2 py-0.5 rounded border font-semibold ${getStageBadgeColor(
								currentStage,
							)}`}
						>
							{currentStage}
						</span>
					</div>

					<div>
						<div className="text-[11px] text-[#777777] font-mono uppercase">
							Estimated Value
						</div>
						<div className="text-2xl font-bold font-mono text-[#111111] mt-0.5">
							{formatCurrency(opportunity.value, opportunity.currency)}
						</div>
					</div>

					<div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#F0F0F0] text-[12px]">
						<div>
							<div className="text-[10px] text-[#777777] font-mono uppercase">
								Service Scope
							</div>
							<div className="font-medium text-[#222222] mt-0.5">
								{opportunity.service}
							</div>
						</div>
						<div>
							<div className="text-[10px] text-[#777777] font-mono uppercase">
								Opportunity Owner
							</div>
							<div className="font-medium text-[#222222] mt-0.5">
								👤 {opportunity.owner}
							</div>
						</div>
						<div>
							<div className="text-[10px] text-[#777777] font-mono uppercase">
								Target Close Date
							</div>
							<div className="font-mono text-[#444444] mt-0.5">
								{opportunity.expectedCloseDate || "Open Timeline"}
							</div>
						</div>
						<div>
							<div className="text-[10px] text-[#777777] font-mono uppercase">
								Registered Date
							</div>
							<div className="font-mono text-[#444444] mt-0.5">
								{opportunity.createdAt
									? opportunity.createdAt.split("T")[0]
									: "—"}
							</div>
						</div>
					</div>

					{opportunity.description && (
						<div className="pt-3 border-t border-[#F0F0F0]">
							<div className="text-[10px] text-[#777777] font-mono uppercase mb-1">
								Scope Notes
							</div>
							<p className="text-[12px] text-[#555555] leading-relaxed">
								{opportunity.description}
							</p>
						</div>
					)}
				</div>

				{/* 2. Client Account & Contact Card */}
				<div className="p-5 rounded-xl bg-white border border-[#EDEDED] shadow-xs space-y-4">
					<div className="flex items-center justify-between">
						<div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#777777]">
							Client Account
						</div>
						{client && (
							<span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
								Active Client
							</span>
						)}
					</div>

					<div>
						<div className="text-lg font-bold text-[#111111]">
							{client?.name || "Client Record Pending"}
						</div>
						{client?.notes && (
							<p className="text-[12px] text-[#666666] mt-1 line-clamp-2">
								{client.notes}
							</p>
						)}
					</div>

					<div className="pt-3 border-t border-[#F0F0F0] space-y-2">
						<div className="text-[10px] text-[#777777] font-mono uppercase">
							Primary Stakeholder Liaison
						</div>
						{primaryContact ? (
							<div className="p-3 rounded-lg bg-[#F8F9FA] border border-[#E9ECEF] space-y-1">
								<div className="flex items-center justify-between">
									<div className="font-semibold text-[13px] text-[#222222]">
										{primaryContact.name}
									</div>
									<span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
										PRIMARY
									</span>
								</div>
								<div className="text-[11px] text-[#666666]">
									{primaryContact.role}
								</div>
								{primaryContact.email && (
									<div className="text-[11px] font-mono text-[#0070BA]">
										<a href={`mailto:${primaryContact.email}`}>
											{primaryContact.email}
										</a>
									</div>
								)}
								{primaryContact.phone && (
									<div className="text-[11px] font-mono text-[#666666]">
										{primaryContact.phone}
									</div>
								)}
							</div>
						) : (
							<div className="text-[12px] text-[#888888] italic py-2">
								No primary contact designated yet.
							</div>
						)}
					</div>

					<div className="pt-2 flex items-center justify-between">
						<button
							type="button"
							onClick={() =>
								onOpenModal("contact", { clientId: opportunity.clientId })
							}
							className="text-[12px] text-[#0070BA] hover:underline font-medium cursor-pointer"
						>
							+ Add Client Contact
						</button>
					</div>
				</div>

				{/* 3. Source Lead & Origin Card */}
				<div className="p-5 rounded-xl bg-white border border-[#EDEDED] shadow-xs space-y-4">
					<div className="flex items-center justify-between">
						<div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#777777]">
							Origin & Conversion
						</div>
						<span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#F0F0F0] text-[#555555]">
							Traceability Audit
						</span>
					</div>

					{sourceLead ? (
						<div className="space-y-3">
							<div>
								<div className="text-[11px] text-[#777777] font-mono uppercase">
									Source Lead
								</div>
								<div className="font-bold text-[14px] text-[#111111] mt-0.5">
									{sourceLead.name}
								</div>
								<div className="text-[12px] text-[#666666]">
									Contact: {sourceLead.contact} ({sourceLead.email})
								</div>
							</div>

							<div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-[12px] text-emerald-900 space-y-1">
								<div className="font-bold">Lead Converted Successfully</div>
								<div className="text-[11px] text-emerald-800">
									Converted At: {sourceLead.convertedAt || "Recorded"}
								</div>
								<div className="text-[11px] font-mono text-emerald-800">
									Target Opp Ref: {opportunity.opportunityNo}
								</div>
							</div>
						</div>
					) : (
						<div className="space-y-2 py-3 text-center">
							<div className="text-2xl">🏛</div>
							<div className="text-[13px] font-semibold text-[#222222]">
								Direct Commercial Engagement
							</div>
							<p className="text-[12px] text-[#777777]">
								Created directly for client account without prior lead
								conversion.
							</p>
						</div>
					)}
				</div>
			</div>

			{/* Linked Projects Section */}
			<div className="p-5 rounded-xl bg-white border border-[#EDEDED] shadow-xs space-y-4">
				<div className="flex items-center justify-between pb-3 border-b border-[#F0F0F0]">
					<div className="flex items-center gap-2">
						<h3 className="text-[15px] font-bold text-[#111111]">
							Linked Delivery Projects
						</h3>
						<span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#EDEDED] text-[#555555] font-semibold">
							{linkedProjects.length}
						</span>
					</div>

					<button
						type="button"
						onClick={() =>
							onOpenModal("project", {
								clientId: opportunity.clientId,
								opportunityId: opportunity.id,
								opportunityNo: opportunity.opportunityNo,
							})
						}
						className="px-3 py-1.5 rounded-lg border border-[#DEDEDE] text-[#222222] hover:bg-[#F5F5F5] text-[12px] font-medium transition cursor-pointer flex items-center gap-1.5"
					>
						<span>+</span>
						<span>Initiate Project for Opportunity</span>
					</button>
				</div>

				{linkedProjects.length === 0 ? (
					<div className="text-center py-8 text-[13px] text-[#888888]">
						No delivery projects initiated for this opportunity yet.
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
						{linkedProjects.map((p) => (
							<div
								key={p.id}
								className="p-4 rounded-xl border border-[#E5E7EB] hover:border-[#49B3FC] transition bg-[#FAFAFA] space-y-2.5"
							>
								<div className="flex items-start justify-between">
									<div>
										<h4 className="font-bold text-[14px] text-[#111111]">
											{p.name}
										</h4>
										<div className="text-[11px] text-[#666666] font-mono mt-0.5">
											Phase: {p.phase} • Budget: {formatCurrency(p.budget)}
										</div>
									</div>
									<OpportunityChip
										opportunityNo={opportunity.opportunityNo}
										size="sm"
									/>
								</div>

								{/* Progress bar */}
								<div className="space-y-1">
									<div className="flex justify-between text-[11px] font-mono text-[#666666]">
										<span>Progress</span>
										<span>{p.progress}%</span>
									</div>
									<div className="w-full h-1.5 rounded-full bg-[#E5E7EB] overflow-hidden">
										<div
											className="h-full bg-[#49B3FC] transition-all"
											style={{ width: `${p.progress}%` }}
										/>
									</div>
								</div>

								<div className="flex items-center justify-between pt-2 border-t border-[#EDEDED]">
									<span className="text-[11px] text-[#777777]">
										Lead: 👤 {p.owner}
									</span>
									<button
										type="button"
										onClick={() => onOpenProject?.(p.id)}
										className="text-[12px] font-semibold text-[#0070BA] hover:underline cursor-pointer"
									>
										Open Project Cockpit →
									</button>
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Linked Invoices & Commercial Proposals Section */}
			<div className="p-5 rounded-xl bg-white border border-[#EDEDED] shadow-xs space-y-4">
				<div className="flex items-center justify-between pb-3 border-b border-[#F0F0F0]">
					<div className="flex items-center gap-2">
						<h3 className="text-[15px] font-bold text-[#111111]">
							Invoices, Proposals & Quotations
						</h3>
						<span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#EDEDED] text-[#555555] font-semibold">
							{linkedFinance.length} Records
						</span>
					</div>

					<button
						type="button"
						onClick={() =>
							onOpenModal("finance", {
								clientId: opportunity.clientId,
								opportunityId: opportunity.id,
								opportunityNo: opportunity.opportunityNo,
							})
						}
						className="px-3 py-1.5 rounded-lg border border-[#DEDEDE] text-[#222222] hover:bg-[#F5F5F5] text-[12px] font-medium transition cursor-pointer flex items-center gap-1.5"
					>
						<span>+</span>
						<span>Issue Record for Opportunity</span>
					</button>
				</div>

				{linkedFinance.length === 0 ? (
					<div className="text-center py-8 text-[13px] text-[#888888]">
						No quotes or invoices recorded for this opportunity yet.
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-left text-[13px] border-collapse">
							<thead>
								<tr className="border-b border-[#EDEDED] text-[11px] font-mono uppercase tracking-wider text-[#777777]">
									<th className="py-2.5 px-3">Title</th>
									<th className="py-2.5 px-3">Type</th>
									<th className="py-2.5 px-3">Amount</th>
									<th className="py-2.5 px-3">Status</th>
									<th className="py-2.5 px-3">Issued Date</th>
									<th className="py-2.5 px-3">Due Date</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-[#F0F0F0]">
								{linkedFinance.map((item) => (
									<tr key={item.id} className="hover:bg-[#F9F9F9]">
										<td className="py-2.5 px-3 font-semibold text-[#111111]">
											{item.title}
										</td>
										<td className="py-2.5 px-3 font-mono text-[11px] uppercase">
											{item.type}
										</td>
										<td className="py-2.5 px-3 font-mono font-bold text-[#222222]">
											{formatCurrency(item.amount)}
										</td>
										<td className="py-2.5 px-3">
											<span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#EDEDED] text-[#333333]">
												{item.status}
											</span>
										</td>
										<td className="py-2.5 px-3 font-mono text-[12px] text-[#666666]">
											{item.issuedDate || (item as any).issueDate || "—"}
										</td>
										<td className="py-2.5 px-3 font-mono text-[12px] text-[#666666]">
											{item.dueDate || "—"}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>

			{/* Internal Notes & Opportunity Audit Trail */}
			<div className="p-5 rounded-xl bg-white border border-[#EDEDED] shadow-xs space-y-4">
				<h3 className="text-[15px] font-bold text-[#111111] pb-3 border-b border-[#F0F0F0]">
					Internal Opportunity Log & Notes
				</h3>

				<form onSubmit={handleAddNote} className="space-y-2">
					<textarea
						rows={2}
						required
						value={newNoteContent}
						onChange={(e) => setNewNoteContent(e.target.value)}
						placeholder="Log deal update, client meeting notes, or commercial negotiation steps..."
						className="studio-input resize-none text-[13px]"
					/>
					<div className="flex justify-end">
						<button
							type="submit"
							disabled={isAddingNote || !newNoteContent.trim()}
							className="px-3.5 py-1.5 rounded-lg bg-[#222222] hover:bg-[#111111] text-white text-[12px] font-medium transition cursor-pointer disabled:opacity-50"
						>
							{isAddingNote ? "Recording..." : "Record Note"}
						</button>
					</div>
				</form>

				<div className="space-y-2.5 pt-2">
					{notes.length === 0 ? (
						<div className="text-[12px] text-[#888888] italic">
							No internal notes logged yet.
						</div>
					) : (
						notes.map((n) => (
							<div
								key={n.id}
								className="p-3 rounded-lg bg-[#F8F9FA] border border-[#E9ECEF] space-y-1 text-[12px]"
							>
								<div className="flex items-center justify-between text-[#777777] text-[11px] font-mono">
									<span className="font-semibold text-[#222222]">
										👤 {n.author}
									</span>
									<span>{n.createdAt.split("T")[0]}</span>
								</div>
								<p className="text-[#333333] leading-relaxed">{n.content}</p>
							</div>
						))
					)}
				</div>
			</div>
		</div>
	);
};
