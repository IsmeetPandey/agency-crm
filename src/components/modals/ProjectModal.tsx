import type React from "react";
import { useState } from "react";
import { PHASES } from "../../lib/constants/agency";
import { projectsRepository } from "../../lib/repositories/projects.repository";
import { suggestTeamForProject } from "../../lib/utils/team-match";
import type { Client, Opportunity, TeamMemberDetail } from "../../types";

interface ProjectModalProps {
	clients: Client[];
	team: TeamMemberDetail[];
	opportunities?: Opportunity[];
	initialOpportunityId?: string;
	onClose: () => void;
	onSuccess: () => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
	clients,
	team,
	opportunities = [],
	initialOpportunityId,
	onClose,
	onSuccess,
}) => {
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [techQuery, setTechQuery] = useState("Next.js, Tailwind");
	const [assigned, setAssigned] = useState<string[]>([]);

	const suggested = suggestTeamForProject(techQuery, team);

	const toggleAssign = (memberId: string) => {
		if (assigned.includes(memberId)) {
			setAssigned(assigned.filter((id) => id !== memberId));
		} else {
			setAssigned([...assigned, memberId]);
		}
	};

	const [selectedOppId, setSelectedOppId] = useState<string>(
		initialOpportunityId || "",
	);

	const initialOpp = opportunities.find((o) => o.id === selectedOppId);
	const [selectedClientId, setSelectedClientId] = useState<string>(
		initialOpp ? initialOpp.clientId : "",
	);

	const handleOppChange = (oppId: string) => {
		setSelectedOppId(oppId);
		const opp = opportunities.find((o) => o.id === oppId);
		if (opp && opp.clientId) {
			setSelectedClientId(opp.clientId);
		}
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError(null);
		const fd = new FormData(e.currentTarget);
		const name = String(fd.get("name") || "").trim();
		const clientId = String(fd.get("clientId") || selectedClientId).trim();

		if (!name || !clientId) {
			setError("Project name and client are required");
			return;
		}

		const linkedOpp = opportunities.find((o) => o.id === selectedOppId);

		setIsSubmitting(true);
		try {
			await projectsRepository.create({
				name,
				clientId,
				opportunityId: linkedOpp ? linkedOpp.id : undefined,
				opportunityNo: linkedOpp ? linkedOpp.opportunityNo : undefined,
				phase: String(fd.get("phase") || "Discovery"),
				budget: Number(fd.get("budget") || (linkedOpp ? linkedOpp.value : 0)),
				due: String(fd.get("deadline") || "2026-12-31"),
				deadline: String(fd.get("deadline") || "2026-12-31"),
				stackNeeded: techQuery,
				assignedTeam:
					assigned.length > 0
						? assigned
						: suggested.slice(0, 3).map((s) => s.member.id),
				owner: String(fd.get("owner") || "Shradha"),
				scope: String(fd.get("scope") || (linkedOpp?.description || "")),
				progress: 0,
			});
			onSuccess();
			onClose();
		} catch (err: any) {
			setError(err.message || "Failed to create project");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs animate-in fade-in">
			<div className="studio-modal w-full max-w-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto bg-white border border-[#DEDEDE] shadow-xl rounded-xl">
				<div className="flex items-center justify-between pb-3 border-b border-[#EDEDED]">
					<h3 className="text-[16px] font-bold text-[#111111]">
						New Project • Auto-Team Recommendation
					</h3>
					<button
						type="button"
						onClick={onClose}
						className="text-[#808080] hover:text-[#111111] text-[18px]"
						aria-label="Close"
					>
						×
					</button>
				</div>

				{error && (
					<div className="p-2.5 rounded-md bg-[#FFF0F0] text-[#C62828] border border-[#F8C2C2] text-[12px] font-medium">
						{error}
					</div>
				)}

				<form onSubmit={handleSubmit} className="space-y-3">
					{opportunities.length > 0 && (
						<div>
							<label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#666666] mb-1 block">
								Linked Commercial Deal (Optional)
							</label>
							<select
								value={selectedOppId}
								onChange={(e) => handleOppChange(e.target.value)}
								className="studio-input font-medium"
							>
								<option value="">No linked commercial deal</option>
								{opportunities.map((o) => (
									<option key={o.id} value={o.id}>
										{o.opportunityNo} • {o.title} (₹{(o.value / 1000).toFixed(0)}k)
									</option>
								))}
							</select>
						</div>
					)}

					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#666666] mb-1 block">
								Project Name *
							</label>
							<input
								name="name"
								required
								placeholder="e.g. Apex / Web Platform"
								className="studio-input"
							/>
						</div>
						<div>
							<label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#666666] mb-1 block">
								Client Company *
							</label>
							<select
								name="clientId"
								required
								value={selectedClientId}
								onChange={(e) => setSelectedClientId(e.target.value)}
								className="studio-input font-medium"
							>
								<option value="">Select client...</option>
								{clients.map((c) => (
									<option key={c.id} value={c.id}>
										{c.name}
									</option>
								))}
							</select>
						</div>
					</div>

					<div className="grid grid-cols-3 gap-3">
						<div>
							<label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#666666] mb-1 block">
								Initial Phase
							</label>
							<select name="phase" className="studio-input font-medium">
								{PHASES.map((p) => (
									<option key={p} value={p}>
										{p}
									</option>
								))}
							</select>
						</div>
						<div>
							<label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#666666] mb-1 block">
								Budget (₹)
							</label>
							<input
								name="budget"
								type="number"
								defaultValue={350000}
								className="studio-input font-mono"
							/>
						</div>
						<div>
							<label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#666666] mb-1 block">
								Target Deadline
							</label>
							<input
								name="deadline"
								type="date"
								className="studio-input font-mono"
							/>
						</div>
					</div>

					<div>
						<label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#666666] mb-1 block">
							Required Stack (Triggers Real-time Auto-Suggest)
						</label>
						<input
							value={techQuery}
							onChange={(e) => setTechQuery(e.target.value)}
							placeholder="e.g. Next.js, three.js, Shopify"
							className="studio-input"
						/>
					</div>

					{/* Auto-suggested team members */}
					<div className="p-3.5 rounded-lg bg-[#F8F8F8] border border-[#DEDEDE] space-y-2">
						<div className="text-[11px] font-mono font-bold text-[#222222] flex items-center justify-between uppercase">
							<span>Smart Team Allocation Recommendation</span>
							<span className="text-[10px] text-[#168FCE] font-bold">
								{suggested.length} matches
							</span>
						</div>
						<div className="grid grid-cols-2 gap-2">
							{suggested.map(({ member }) => {
								const isAssigned = assigned.includes(member.id);
								return (
									<div
										key={member.id}
										onClick={() => toggleAssign(member.id)}
										className={`p-2.5 rounded-md border text-left cursor-pointer transition flex items-center justify-between ${
											isAssigned
												? "bg-[#EAF6FF] border-[#B8E2FE] text-[#168FCE]"
												: "bg-white border-[#DEDEDE] text-[#222222] hover:border-[#C8C8C8]"
										}`}
									>
										<div>
											<div className="text-[12px] font-semibold flex items-center gap-1">
												{member.name}{" "}
												<span className="text-[10px] font-mono text-[#808080]">
													({member.avail}h/d)
												</span>
											</div>
											<div className="text-[10px] text-[#666666] truncate max-w-[140px]">
												{member.roleTitle}
											</div>
										</div>
										<span className="text-[11px] font-bold">
											{isAssigned ? "✓" : "+"}
										</span>
									</div>
								);
							})}
						</div>
					</div>

					<div>
						<label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#666666] mb-1 block">
							Project Lead
						</label>
						<input
							name="owner"
							defaultValue="Shradha"
							className="studio-input font-medium"
						/>
					</div>

					<div>
						<label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#666666] mb-1 block">
							Scope Summary
						</label>
						<textarea
							name="scope"
							rows={2}
							placeholder="Enterprise digital experience, responsive e-commerce storefront..."
							className="studio-input !h-auto py-2"
						/>
					</div>

					<div className="flex justify-end gap-2.5 pt-3 border-t border-[#EDEDED]">
						<button
							type="button"
							onClick={onClose}
							className="btn-secondary !h-[34px]"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={isSubmitting}
							className="btn-primary !h-[34px]"
						>
							{isSubmitting ? "Creating..." : "Create Project"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};
