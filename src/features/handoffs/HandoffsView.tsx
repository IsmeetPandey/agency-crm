import type React from "react";
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
	const getProjectName = (projectId: string) => {
		return projects.find((p) => p.id === projectId)?.name || "Project";
	};

	const handleUpdateStatus = async (id: string, status: any) => {
		await handoffsRepository.updateStatus(id, status);
		onRefresh();
	};

	return (
		<div className="space-y-4">
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
				<div>
					<h2 className="text-[18px] font-[700] tracking-[-0.02em] text-[#1D1D1F]">
						Department Handoffs • Flow Pipeline
					</h2>
					<p className="text-[12px] text-[#86868B]">
						Manage cross-department asset deliveries, review gates, and
						acceptance
					</p>
				</div>
				<button
					type="button"
					onClick={() => onOpenModal("handoff")}
					className="btn-liquid btn-liquid-primary !h-[32px]"
				>
					+ New Handoff
				</button>
			</div>

			<div className="space-y-3">
				{handoffs.map((h) => {
					const projectName = getProjectName(h.projectId);

					return (
						<div
							key={h.id}
							className="liquid-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
						>
							<div>
								<div className="text-[11px] font-[600] uppercase tracking-wider text-[#007AFF] mb-0.5">
									{projectName}
								</div>
								<h3 className="text-[14px] font-[650] text-[#1D1D1F]">
									{h.title}
								</h3>
								<div className="text-[12px] text-[#86868B] mt-1 flex items-center gap-2">
									<span className="font-[600] text-[#6D28D9]">{h.from}</span>
									<span>→</span>
									<span className="font-[600] text-[#007AFF]">{h.to}</span>
									{h.due && <span>• Due {h.due}</span>}
								</div>
							</div>

							<div className="flex items-center gap-2">
								<select
									value={h.status}
									onChange={(e) => handleUpdateStatus(h.id, e.target.value)}
									className={`text-[12px] font-[600] rounded-full px-3 py-1 border outline-none ${
										h.status === "Accepted"
											? "bg-[#30D158]/10 text-[#30D158] border-[#30D158]/20"
											: h.status === "Pending"
												? "bg-[#FF9500]/10 text-[#FF9500] border-[#FF9500]/20"
												: "bg-[#007AFF]/10 text-[#007AFF] border-[#007AFF]/20"
									}`}
								>
									<option value="Pending">Pending</option>
									<option value="Accepted">Accepted</option>
									<option value="Changes Requested">Changes Requested</option>
									<option value="Rejected">Rejected</option>
									<option value="Completed">Completed</option>
								</select>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
};
