import type React from "react";
import { OpportunityChip } from "../../components/ui/OpportunityChip";
import type { Client, Project, TeamMemberDetail } from "../../types";

interface ProjectsViewProps {
	projects: Project[];
	clients: Client[];
	team: TeamMemberDetail[];
	onOpenModal: (type: string) => void;
	onOpenProject: (projectId: string) => void;
	onNavigateToOpportunity?: (id: string) => void;
	search: string;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
	projects,
	clients,
	team,
	onOpenModal,
	onOpenProject,
	onNavigateToOpportunity,
	search,
}) => {
	const filteredProjects = projects.filter((p) => {
		if (!search) return true;
		const s = search.toLowerCase();
		return (
			p.name.toLowerCase().includes(s) ||
			p.stackNeeded.toLowerCase().includes(s) ||
			p.phase.toLowerCase().includes(s)
		);
	});

	const getClientName = (clientId: string) => {
		return clients.find((c) => c.id === clientId)?.name || "Client";
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
				<div>
					<h2 className="text-[18px] font-bold text-slate-900 tracking-tight">
						Projects & Delivery Operations
					</h2>
					<p className="text-[12px] text-slate-500">
						Active creative & engineering builds, milestones, tech stacks, and
						team assignments
					</p>
				</div>
				<button
					type="button"
					onClick={() => onOpenModal("project")}
					className="btn-primary !h-[34px]"
				>
					+ New Project
				</button>
			</div>

			{/* Project Cards Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
				{filteredProjects.map((project) => {
					const clientName = getClientName(project.clientId);

					return (
						<div
							key={project.id}
							onClick={() => onOpenProject(project.id)}
							className="studio-card p-5 cursor-pointer hover:border-blue-400 hover:shadow-md transition bg-white space-y-4 group"
						>
							{/* Top info */}
							<div className="flex items-start justify-between gap-3">
								<div className="min-w-0">
									<div className="flex items-center gap-2 mb-1 flex-wrap">
										<span className="text-[11px] font-mono uppercase tracking-wider text-blue-600 font-semibold">
											{clientName}
										</span>
										{project.opportunityNo && (
											<div onClick={(e) => e.stopPropagation()}>
												<OpportunityChip
													opportunityNo={project.opportunityNo}
													opportunityId={project.opportunityId}
													onNavigate={onNavigateToOpportunity}
												/>
											</div>
										)}
									</div>
									<h3 className="text-[16px] font-bold text-slate-900 group-hover:text-blue-600 transition truncate">
										{project.name}
									</h3>
								</div>
								<span className="badge-status badge-cobalt shrink-0 font-mono text-[11px]">
									{project.phase}
								</span>
							</div>

							{project.scope && (
								<p className="text-[12px] text-slate-500 line-clamp-2 leading-relaxed">
									{project.scope}
								</p>
							)}

							{/* Progress Bar */}
							<div className="space-y-1.5 pt-2 border-t border-slate-100">
								<div className="flex justify-between text-[11px] font-medium text-slate-500">
									<span>Delivery Velocity</span>
									<span className="font-mono font-bold text-slate-900">
										{project.progress}%
									</span>
								</div>
								<div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
									<div
										className="h-full bg-blue-600 rounded-full transition-all duration-300"
										style={{ width: `${project.progress}%` }}
									/>
								</div>
							</div>

							{/* Stack & Team & Budget Footer */}
							<div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
								<div className="flex items-center gap-1.5 overflow-hidden">
									{project.stackNeeded
										.split(",")
										.slice(0, 3)
										.map((tag) => (
											<span
												key={tag.trim()}
												className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200"
											>
												{tag.trim()}
											</span>
										))}
								</div>

								<div className="flex items-center gap-2 shrink-0">
									<span className="font-mono font-semibold text-slate-900">
										₹{(project.budget / 1000).toFixed(0)}k
									</span>
									<span className="text-slate-300">•</span>
									<span className="text-blue-600 font-semibold group-hover:underline">
										Cockpit →
									</span>
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
};
