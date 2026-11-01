import type React from "react";
import { workflowRepository } from "../../lib/repositories/workflow.repository";
import type { ApprovalRequest, Project } from "../../types";

interface ApprovalsViewProps {
	approvals: ApprovalRequest[];
	projects: Project[];
	onRefresh: () => void;
	onOpenProject: (projectId: string) => void;
}

export const ApprovalsView: React.FC<ApprovalsViewProps> = ({
	approvals,
	projects,
	onRefresh,
	onOpenProject,
}) => {
	const handleDecision = async (id: string, decision: any) => {
		await workflowRepository.decideApproval(id, decision);
		onRefresh();
	};

	const getProjectName = (projectId: string) => {
		return projects.find((p) => p.id === projectId)?.name || "Project";
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-[18px] font-[700] tracking-[-0.02em] text-[#1D1D1F]">
						Approval Center • Signoff Gates
					</h2>
					<p className="text-[12px] text-[#86868B]">
						Authorize milestone gates, scope expansions, and deliverables
					</p>
				</div>
			</div>

			<div className="space-y-3">
				{approvals.length === 0 ? (
					<div className="liquid-card p-10 text-center text-[#86868B] text-[13px]">
						No pending approval requests in queue.
					</div>
				) : (
					approvals.map((app) => {
						const projectName = getProjectName(app.projectId);

						return (
							<div
								key={app.id}
								className="liquid-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
							>
								<div>
									<div className="text-[11px] font-[600] uppercase tracking-wider text-[#6D28D9] mb-1">
										{projectName}
									</div>
									<h3 className="text-[15px] font-[650] text-[#1D1D1F]">
										{app.title}
									</h3>
									<div className="text-[12px] text-[#86868B] mt-1">
										Requested by{" "}
										<span className="text-[#1D1D1F] font-[500]">
											{app.requestedBy}
										</span>
										{app.assignedApprover &&
											` • Approver: ${app.assignedApprover}`}
									</div>
								</div>

								<div className="flex items-center gap-2">
									<button
										type="button"
										onClick={() => onOpenProject(app.projectId)}
										className="btn-liquid !h-[30px] !text-[11px]"
									>
										Review Context →
									</button>

									{app.status === "Pending" ? (
										<>
											<button
												type="button"
												onClick={() => handleDecision(app.id, "Approved")}
												className="btn-liquid !h-[30px] !text-[11px] !bg-[#30D158] !text-white"
											>
												Approve ✓
											</button>
											<button
												type="button"
												onClick={() => handleDecision(app.id, "Rejected")}
												className="btn-liquid !h-[30px] !text-[11px] !text-[#FF2D55]"
											>
												Reject
											</button>
										</>
									) : (
										<span
											className={`text-[11px] font-[600] px-3 py-1 rounded-full ${
												app.status === "Approved"
													? "bg-[#30D158]/10 text-[#30D158]"
													: "bg-[#FF2D55]/10 text-[#FF2D55]"
											}`}
										>
											{app.status}
										</span>
									)}
								</div>
							</div>
						);
					})
				)}
			</div>
		</div>
	);
};
