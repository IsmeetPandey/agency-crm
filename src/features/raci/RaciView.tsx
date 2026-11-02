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
		setTimeout(() => setIsSaving(false), 250);
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
				<div>
					<h2 className="text-[18px] font-bold text-[var(--ink)] tracking-tight">
						RACI Governance Matrix
					</h2>
					<p className="text-[12px] text-[var(--ink-muted)]">
						Cross-functional accountability: Responsible (R), Accountable (A),
						Consulted (C), Informed (I)
					</p>
				</div>

				<div className="flex items-center gap-3">
					<label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--ink-muted)]">
						Project:
					</label>
					<select
						value={selectedProjectId}
						onChange={(e) => setSelectedProjectId(e.target.value)}
						className="studio-input !w-[220px] !h-[34px] text-[12px] font-semibold"
					>
						{projects.map((p) => (
							<option key={p.id} value={p.id}>
								{p.name}
							</option>
						))}
					</select>
					{isSaving && (
						<span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold animate-pulse">
							Saving...
						</span>
					)}
				</div>
			</div>

			<div className="studio-card p-6 overflow-hidden">
				<div className="overflow-x-auto">
					<table className="w-full text-[13px] min-w-[700px] border-collapse">
						<thead>
							<tr className="border-b border-[var(--border)]">
								<th className="text-left font-bold p-3 text-[var(--ink)]">
									Deliverable Work Item
								</th>
								{RACI_ROLES.map((r) => (
									<th
										key={r}
										className="p-3 font-mono font-bold text-center text-[var(--ink-secondary)]"
									>
										<span className="px-2 py-1 rounded bg-[var(--surface-raised)] border border-[var(--border-subtle)] text-[var(--ink)] text-[11px]">
											{r}
										</span>
									</th>
								))}
							</tr>
						</thead>
						<tbody className="divide-y divide-[var(--border-subtle)]">
							{RACI_DELIVERABLES.map((deliv) => (
								<tr
									key={deliv}
									className="hover:bg-[var(--surface-sunken)] transition"
								>
									<td className="p-3 font-semibold text-[var(--ink)]">
										{deliv}
									</td>
									{RACI_ROLES.map((role) => {
										const current =
											raciList.find(
												(r) => r.deliverable === deliv && r.roleCode === role,
											)?.assignment || "—";

										return (
											<td key={role} className="p-3 text-center">
												<select
													value={current}
													onChange={(e) =>
														handleChange(deliv, role, e.target.value as any)
													}
													className={`font-mono text-[11px] font-bold px-2 py-1 rounded border outline-none cursor-pointer ${
														current === "R" || current === "A/R"
															? "bg-[#49B3FC]/15 text-[#49B3FC] border-[#49B3FC]/30"
															: current === "A"
																? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
																: current === "C"
																	? "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
																	: current === "I"
																		? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800"
																		: "bg-[var(--surface-sunken)] text-[var(--ink-muted)] border-[var(--border)]"
													}`}
												>
													<option value="—">—</option>
													<option value="R">R</option>
													<option value="A">A</option>
													<option value="C">C</option>
													<option value="I">I</option>
													<option value="A/R">A/R</option>
												</select>
											</td>
										);
									})}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
};
