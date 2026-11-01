import type React from "react";
import { useEffect, useState } from "react";
import { RACI_DELIVERABLES, RACI_ROLES } from "../../lib/constants/agency";
import { workflowRepository } from "../../lib/repositories/workflow.repository";
import type { Project, RACIAssignment } from "../../types";

interface RaciViewProps {
	projects: Project[];
}

export const RaciView: React.FC<RaciViewProps> = ({ projects }) => {
	const [selectedProjectId, setSelectedProjectId] = useState<string>(
		projects[0]?.id || "p1",
	);
	const [raciList, setRaciList] = useState<RACIAssignment[]>([]);
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		async function load() {
			if (!selectedProjectId) return;
			const list = await workflowRepository.getProjectRaci(selectedProjectId);
			setRaciList(list);
		}
		load();
	}, [selectedProjectId]);

	const handleChange = async (
		deliverable: string,
		roleCode: string,
		assignment: "R" | "A" | "C" | "I" | "—" | "A/R",
	) => {
		setIsSaving(true);
		await workflowRepository.updateRaciAssignment(
			selectedProjectId,
			deliverable,
			roleCode,
			assignment,
		);
		const updated = await workflowRepository.getProjectRaci(selectedProjectId);
		setRaciList(updated);
		setTimeout(() => setIsSaving(false), 300);
	};

	return (
		<div className="space-y-4">
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
				<div>
					<h2 className="text-[18px] font-[700] tracking-[-0.02em] text-[#1D1D1F]">
						Global RACI Governance Matrix
					</h2>
					<p className="text-[12px] text-[#86868B]">
						Enforce clear ownership: Responsible (R), Accountable (A), Consulted
						(C), Informed (I)
					</p>
				</div>

				<div className="flex items-center gap-3">
					<label className="text-[12px] font-[500] text-[#86868B]">
						Project:
					</label>
					<select
						value={selectedProjectId}
						onChange={(e) => setSelectedProjectId(e.target.value)}
						className="input-glass !w-[220px] !h-[32px] text-[12px]"
					>
						{projects.map((p) => (
							<option key={p.id} value={p.id}>
								{p.name}
							</option>
						))}
					</select>
					{isSaving && (
						<span className="text-[11px] text-[#30D158] font-[600] animate-pulse">
							Saving...
						</span>
					)}
				</div>
			</div>

			<div className="liquid-card p-6">
				<div className="overflow-x-auto mac-scroll">
					<table className="w-full text-[13px] min-w-[650px]">
						<thead>
							<tr className="border-b border-black/[0.08]">
								<th className="text-left font-[700] p-3 text-[#1D1D1F]">
									Deliverable Work Item
								</th>
								{RACI_ROLES.map((r) => (
									<th
										key={r}
										className="p-3 font-[700] text-center text-[#1D1D1F]"
									>
										<span className="w-8 h-8 rounded-[10px] bg-black/[0.04] inline-flex items-center justify-center text-[12px] font-[650]">
											{r}
										</span>
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{RACI_DELIVERABLES.map((deliv) => (
								<tr
									key={deliv}
									className="border-b border-black/[0.04] hover:bg-white/50 transition"
								>
									<td className="p-3 font-[650] text-[#1D1D1F]">{deliv}</td>
									{RACI_ROLES.map((roleCode) => {
										const item = raciList.find(
											(x) => x.deliverable === deliv && x.roleCode === roleCode,
										);
										const currentVal = item?.assignment || "—";

										return (
											<td key={roleCode} className="p-3 text-center">
												<select
													value={currentVal}
													onChange={(e) =>
														handleChange(deliv, roleCode, e.target.value as any)
													}
													className="input-glass !h-[32px] !w-[64px] !px-1 text-center font-[600] !rounded-[8px]"
												>
													{["R", "A", "C", "I", "—", "A/R"].map((opt) => (
														<option key={opt} value={opt}>
															{opt}
														</option>
													))}
												</select>
											</td>
										);
									})}
								</tr>
							))}
						</tbody>
					</table>
				</div>

				{/* Legend */}
				<div className="mt-6 pt-4 border-t border-black/[0.06] grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] text-[#86868B]">
					<div>
						<strong className="text-[#1D1D1F]">R</strong> = Responsible (Does
						the work)
					</div>
					<div>
						<strong className="text-[#1D1D1F]">A</strong> = Accountable (Final
						approval)
					</div>
					<div>
						<strong className="text-[#1D1D1F]">C</strong> = Consulted (Provides
						input)
					</div>
					<div>
						<strong className="text-[#1D1D1F]">I</strong> = Informed (Kept
						updated)
					</div>
				</div>
			</div>
		</div>
	);
};
