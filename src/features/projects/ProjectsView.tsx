import type React from "react";
import type { Client, Project, TeamMemberDetail } from "../../types";

interface ProjectsViewProps {
	projects: Project[];
	clients: Client[];
	team: TeamMemberDetail[];
	onOpenModal: (type: string) => void;
	onOpenProject: (projectId: string) => void;
	search: string;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
	projects,
	clients,
	team,
	onOpenModal,
	onOpenProject,
	search,
}) => {
	const filteredProjects = projects.filter((p) => {
		if (!search) return true;
		const s = search.toLowerCase();
		return (
			p.name.toLowerCase().includes(s) ||
			p.stackNeeded.toLowerCase().includes(s)
		);
	});

	const getClientName = (clientId: string) => {
		return clients.find((c) => c.id === clientId)?.name || "Client";
	};

	return (
		<div className="space-y-4">
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
				<div>
					<h2 className="text-[18px] font-[700] tracking-[-0.02em] text-[#1D1D1F]">
						Projects & Delivery • Operations
					</h2>
					<p className="text-[12px] text-[#86868B]">
						Track delivery progress, tech stacks, milestones, and team
						assignments
					</p>
				</div>
				<button
					type="button"
					onClick={() => onOpenModal("project")}
					className="btn-liquid btn-liquid-primary !h-[32px]"
				>
					+ New Project
				</button>
			</div>

			<div className="grid md:grid-cols-2 gap-4">
				{filteredProjects.map((project) => {
					const clientName = getClientName(project.clientId);

					return (
						<div
							key={project.id}
							onClick={() => onOpenProject(project.id)}
							className="liquid-card p-5 cursor-pointer hover:shadow-lg transition space-y-4"
						>
							<div className="flex items-start justify-between">
								<div>
									<div className="text-[11px] font-[600] uppercase tracking-wider text-[#007AFF] mb-1">
										{clientName}
									</div>
									<h3 className="text-[16px] font-[700] text-[#1D1D1F] leading-tight">
										{project.name}
									</h3>
								</div>
								<span className="text-[11px] font-[600] px-2.5 py-1 rounded-full bg-[#007AFF]/10 text-[#007AFF] border border-[#007AFF]/20">
									{project.phase}
								</span>
							</div>

							{project.scope && (
								<div className="text-[12px] text-[#86868B] line-clamp-2">
									{project.scope}
								</div>
							)}

							{/* Progress & Budget */}
							<div className="space-y-1.5 pt-2 border-t border-black/[0.04]">
								<div className="flex justify-between text-[11px] font-[500] text-[#86868B]">
									<span>Progress</span>
									<span className="font-[600] text-[#1D1D1F]">
										{project.progress}%
									</span>
								</div>
								<div className="w-full h-2 rounded-full bg-black/[0.06] overflow-hidden">
									<div
										className="h-full bg-gradient-to-r from-[#007AFF] to-[#30D158] rounded-full transition-all duration-300"
										style={{ width: `${project.progress}%` }}
									/>
								</div>
							</div>

							{/* Footer info: Budget, Due date, Assigned team pills */}
							<div className="flex items-center justify-between pt-2 border-t border-black/[0.04] text-[11px] text-[#86868B]">
								<div>
									Budget:{" "}
									<span className="font-[650] text-[#1D1D1F]">
										₹{(project.budget / 1000).toFixed(0)}k
									</span>
									{project.due && <span> • Due {project.due}</span>}
								</div>

								{/* Team Avatars */}
								<div className="flex -space-x-1.5">
									{project.assignedTeam.map((memberId) => {
										const member = team.find(
											(m) => m.id === memberId || m.legacyId === memberId,
										);
										return (
											<div
												key={memberId}
												title={member?.name || memberId}
												className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#6D28D9] to-[#007AFF] border-2 border-white flex items-center justify-center text-[9px] font-[700] text-white"
											>
												{member?.initials || memberId.slice(0, 2).toUpperCase()}
											</div>
										);
									})}
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
};
