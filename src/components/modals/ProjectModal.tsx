import type React from "react";
import { useEffect, useState } from "react";
import { projectsRepository } from "../../lib/repositories/projects.repository";
import { teamRepository } from "../../lib/repositories/team.repository";
import type { Client, TeamMemberDetail } from "../../types";

interface ProjectModalProps {
	clients: Client[];
	team: TeamMemberDetail[];
	onClose: () => void;
	onSuccess: () => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
	clients,
	team,
	onClose,
	onSuccess,
}) => {
	const [techQuery, setTechQuery] = useState("React, Next.js, Figma");
	const [suggested, setSuggested] = useState<
		{ member: TeamMemberDetail; score: number }[]
	>([]);
	const [assigned, setAssigned] = useState<string[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		async function getSuggestions() {
			const res = await teamRepository.suggestTeam(techQuery);
			setSuggested(res);
			// Auto-assign top 2-3 by default
			if (assigned.length === 0 && res.length > 0) {
				setAssigned(res.slice(0, 3).map((r) => r.member.id));
			}
		}
		getSuggestions();
	}, [techQuery]);

	const toggleAssign = (id: string) => {
		setAssigned((prev) =>
			prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
		);
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError(null);
		const fd = new FormData(e.currentTarget);
		const name = String(fd.get("name") || "").trim();
		const clientId = String(fd.get("clientId") || "");

		if (!name || !clientId) {
			setError("Project name and client are required");
			return;
		}

		setIsSubmitting(true);
		try {
			await projectsRepository.create({
				name,
				clientId,
				phase: String(fd.get("phase") || "Discovery") as any,
				stackNeeded: techQuery,
				budget: Number(fd.get("budget") || 0),
				due: String(fd.get("due") || ""),
				owner: String(fd.get("owner") || "Shradha"),
				scope: String(fd.get("scope") || ""),
				assignedTeam: assigned,
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
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
			<div className="liquid-modal w-full max-w-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto mac-scroll">
				<div className="flex items-center justify-between pb-3 border-b border-black/[0.08]">
					<h3 className="text-[16px] font-[700] text-[#1D1D1F]">
						New Project • Auto-Team Suggested
					</h3>
					<button
						type="button"
						onClick={onClose}
						className="text-[#86868B] hover:text-[#1D1D1F] text-[18px]"
					>
						×
					</button>
				</div>

				{error && (
					<div className="p-2.5 rounded-[8px] bg-[#FF2D55]/10 text-[#FF2D55] text-[12px] font-[500]">
						{error}
					</div>
				)}

				<form onSubmit={handleSubmit} className="space-y-3">
					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="text-[11px] font-[600] uppercase text-[#86868B] mb-1 block">
								Project Name *
							</label>
							<input
								name="name"
								required
								placeholder="e.g. Apex / Web Platform"
								className="input-glass"
							/>
						</div>
						<div>
							<label className="text-[11px] font-[600] uppercase text-[#86868B] mb-1 block">
								Client Company *
							</label>
							<select name="clientId" required className="input-glass">
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
							<label className="text-[11px] font-[600] uppercase text-[#86868B] mb-1 block">
								Phase
							</label>
							<select
								name="phase"
								defaultValue="Discovery"
								className="input-glass"
							>
								{[
									"Kickoff",
									"Discovery",
									"Design",
									"Prototype",
									"Build",
									"QA",
									"UAT",
									"Launch",
									"Close",
								].map((ph) => (
									<option key={ph} value={ph}>
										{ph}
									</option>
								))}
							</select>
						</div>
						<div>
							<label className="text-[11px] font-[600] uppercase text-[#86868B] mb-1 block">
								Budget (₹)
							</label>
							<input
								name="budget"
								type="number"
								defaultValue={200000}
								className="input-glass"
							/>
						</div>
						<div>
							<label className="text-[11px] font-[600] uppercase text-[#86868B] mb-1 block">
								Due Date
							</label>
							<input name="due" type="date" className="input-glass" />
						</div>
					</div>

					<div>
						<label className="text-[11px] font-[600] uppercase text-[#86868B] mb-1 block">
							Required Stack (Triggers Real-time Auto-Suggest)
						</label>
						<input
							value={techQuery}
							onChange={(e) => setTechQuery(e.target.value)}
							placeholder="e.g. Next.js, three.js, Shopify"
							className="input-glass"
						/>
					</div>

					{/* Auto-suggested team members */}
					<div className="p-3.5 rounded-[12px] bg-white/70 border border-black/[0.06] space-y-2">
						<div className="text-[11px] font-[650] text-[#1D1D1F] flex items-center justify-between">
							<span>Smart Team Allocation Recommendation</span>
							<span className="text-[10px] text-[#007AFF] font-mono">
								{suggested.length} matches
							</span>
						</div>
						<div className="grid grid-cols-2 gap-2">
							{suggested.map(({ member, score }) => {
								const isAssigned = assigned.includes(member.id);
								return (
									<div
										key={member.id}
										onClick={() => toggleAssign(member.id)}
										className={`p-2 rounded-[8px] border text-left cursor-pointer transition flex items-center justify-between ${
											isAssigned
												? "bg-[#007AFF]/10 border-[#007AFF]/30 text-[#007AFF]"
												: "bg-white/80 border-black/[0.06] text-[#1D1D1F] hover:bg-white"
										}`}
									>
										<div>
											<div className="text-[12px] font-[650] flex items-center gap-1">
												{member.name}{" "}
												<span className="text-[10px] opacity-70">
													({member.avail}h/d)
												</span>
											</div>
											<div className="text-[10px] text-[#86868B] truncate max-w-[140px]">
												{member.roleTitle}
											</div>
										</div>
										<span className="text-[11px] font-[700]">
											{isAssigned ? "✓" : "+"}
										</span>
									</div>
								);
							})}
						</div>
					</div>

					<div>
						<label className="text-[11px] font-[600] uppercase text-[#86868B] mb-1 block">
							Project Lead
						</label>
						<input
							name="owner"
							defaultValue="Shradha"
							className="input-glass"
						/>
					</div>

					<div>
						<label className="text-[11px] font-[600] uppercase text-[#86868B] mb-1 block">
							Scope Summary
						</label>
						<textarea
							name="scope"
							rows={2}
							placeholder="Enterprise digital experience, responsive e-commerce storefront..."
							className="input-glass !h-auto py-2"
						/>
					</div>

					<div className="flex justify-end gap-2 pt-3 border-t border-black/[0.08]">
						<button
							type="button"
							onClick={onClose}
							className="btn-liquid !h-[32px]"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={isSubmitting}
							className="btn-liquid btn-liquid-primary !h-[32px]"
						>
							{isSubmitting ? "Creating..." : "Create Project"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};
