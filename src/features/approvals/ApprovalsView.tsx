import type React from "react";
import { Check } from "lucide-react";
import { useAuth } from "../../lib/auth/auth.context";
import { useToast } from "../../lib/feedback/toast.context";
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
	const { user } = useAuth();
	const { showToast } = useToast();

	const handleDecision = async (
		id: string,
		decision: "Approved" | "Rejected" | "Changes Requested",
		title: string,
	) => {
		const actor = user?.name || "Abhishek";
		await workflowRepository.decideApproval(id, decision, undefined, actor);
		showToast({
			type: decision === "Approved" ? "success" : "warning",
			title: `Decision Recorded`,
			message: `"${title}" has been ${decision.toLowerCase()} by ${actor}`,
		});
		onRefresh();
	};

	const getProjectName = (projectId: string) => {
		return projects.find((p) => p.id === projectId)?.name || "Project";
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-[18px] font-bold text-slate-900 tracking-tight">
						Executive Approval Center
					</h2>
					<p className="text-[12px] text-slate-500">
						Formal sign-off queue for milestone progression, scope expansion,
						and client releases
					</p>
				</div>
			</div>

			<div className="space-y-3">
				{approvals.length === 0 ? (
					<div className="studio-card p-12 text-center text-slate-400 text-[13px] bg-white">
						No pending approval requests in queue.
					</div>
				) : (
					approvals.map((app) => {
						const projectName = getProjectName(app.projectId);

						return (
							<div
								key={app.id}
								className="studio-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white hover:border-slate-300 transition"
							>
								<div className="space-y-1 min-w-0">
									<div className="text-[11px] font-mono uppercase tracking-wider text-blue-600 font-bold">
										{projectName}
									</div>
									<h3 className="text-[15px] font-bold text-slate-900 truncate">
										{app.title}
									</h3>
									<div className="text-[12px] text-slate-500">
										Requested by{" "}
										<span className="font-semibold text-slate-800">
											{app.requestedBy}
										</span>
										{app.approverRole &&
											` • Required Signoff: ${app.approverRole}`}
									</div>
								</div>

								<div className="flex items-center gap-2 shrink-0">
									<button
										type="button"
										onClick={() => onOpenProject(app.projectId)}
										className="btn-secondary !h-[32px] !text-[12px]"
									>
										Review Spec →
									</button>

									{app.status === "Pending" ? (
										<>
											<button
												type="button"
												onClick={() =>
													handleDecision(app.id, "Approved", app.title)
												}
												className="btn-primary !h-[32px] !text-[12px] !bg-emerald-600 hover:!bg-emerald-700 flex items-center gap-1.5"
											>
												<Check className="w-3.5 h-3.5" />
												<span>Approve</span>
											</button>
											<button
												type="button"
												onClick={() =>
													handleDecision(app.id, "Rejected", app.title)
												}
												className="btn-secondary !h-[32px] !text-[12px] !text-rose-600 hover:!bg-rose-50"
											>
												Reject
											</button>
										</>
									) : (
										<span
											className={`badge-status ${
												app.status === "Approved"
													? "badge-emerald"
													: app.status === "Rejected"
														? "badge-rose"
														: "badge-amber"
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
