import type React from "react";
import { useToast } from "../../lib/feedback/toast.context";
import { handoffsRepository } from "../../lib/repositories/handoffs.repository";
import type { Handoff, Project } from "../../types";

interface HandoffsViewProps {
	handoffs: Handoff[];
	projects: Project[];
	onOpenModal: (type: string) => void;
	onRefresh: () => void;
}

export const HandoffsView: React.FC<HandoffsViewProps> = ({
	handoffs,
	projects,
	onOpenModal,
	onRefresh,
}) => {
	const { showToast } = useToast();

	const getProjectName = (projectId: string) => {
		return projects.find((p) => p.id === projectId)?.name || "Project";
	};

	const handleUpdateStatus = async (id: string, status: any, title: string) => {
		await handoffsRepository.updateStatus(id, status);
		showToast({
			type: status === "Accepted" ? "success" : "info",
			title: "Handoff Updated",
			message: `"${title}" status updated to ${status}`,
		});
		onRefresh();
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
				<div>
					<h2 className="text-[18px] font-bold text-slate-900 tracking-tight">
						Department Transit & Handoff Pipeline
					</h2>
					<p className="text-[12px] text-slate-500">
						Deliverable handoffs moving across Design, Frontend, Backend, AI
						Systems, and QA
					</p>
				</div>
				<button
					type="button"
					onClick={() => onOpenModal("handoff")}
					className="btn-primary !h-[34px]"
				>
					+ New Handoff
				</button>
			</div>

			<div className="space-y-3">
				{handoffs.length === 0 ? (
					<div className="studio-card p-12 text-center text-slate-400 text-[13px] bg-white">
						No department handoffs in queue.
					</div>
				) : (
					handoffs.map((h) => {
						const projectName = getProjectName(h.projectId);

						return (
							<div
								key={h.id}
								className="studio-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white hover:border-slate-300 transition"
							>
								<div className="space-y-1 min-w-0">
									<div className="text-[11px] font-mono uppercase tracking-wider text-blue-600 font-bold">
										{projectName}
									</div>
									<h3 className="text-[15px] font-bold text-slate-900 truncate">
										{h.title || (h as any).deliverable}
									</h3>
									<div className="text-[12px] text-slate-500 flex items-center gap-2 font-mono">
										<span className="font-semibold text-slate-800">
											{h.from || (h as any).fromDept}
										</span>
										<span className="text-blue-600">→</span>
										<span className="font-semibold text-slate-800">
											{h.to || (h as any).toDept}
										</span>
										{(h.description || (h as any).notes) && (
											<span className="font-sans text-slate-400">
												• {h.description || (h as any).notes}
											</span>
										)}
									</div>
								</div>

								<div className="flex items-center gap-3 shrink-0">
									<select
										value={h.status}
										onChange={(e) =>
											handleUpdateStatus(
												h.id,
												e.target.value,
												h.title || (h as any).deliverable || "Handoff",
											)
										}
										className={`text-[12px] font-mono font-semibold rounded-md px-3 py-1.5 border outline-none ${
											h.status === "Accepted"
												? "bg-emerald-50 text-emerald-700 border-emerald-200"
												: h.status === "Rejected"
													? "bg-rose-50 text-rose-700 border-rose-200"
													: "bg-amber-50 text-amber-700 border-amber-200"
										}`}
									>
										<option value="Pending">Pending</option>
										<option value="Accepted">Accepted</option>
										<option value="Changes Requested">Changes Requested</option>
										<option value="Rejected">Rejected</option>
									</select>
								</div>
							</div>
						);
					})
				)}
			</div>
		</div>
	);
};
