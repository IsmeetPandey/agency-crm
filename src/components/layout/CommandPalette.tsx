import type React from "react";
import { useEffect, useRef, useState } from "react";
import type {
	Client,
	Lead,
	Project,
	Task,
	TeamMemberDetail,
} from "../../types";

interface CommandPaletteProps {
	isOpen: boolean;
	onClose: () => void;
	leads: Lead[];
	clients: Client[];
	projects: Project[];
	tasks: Task[];
	team: TeamMemberDetail[];
	onNavigate: (view: string, projectId?: string) => void;
	onOpenModal: (type: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
	isOpen,
	onClose,
	leads,
	clients,
	projects,
	tasks,
	team,
	onNavigate,
	onOpenModal,
}) => {
	const [query, setQuery] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (isOpen) {
			setTimeout(() => inputRef.current?.focus(), 50);
		} else {
			setQuery("");
		}
	}, [isOpen]);

	if (!isOpen) return null;

	const q = query.toLowerCase().trim();

	const matchingLeads = q
		? leads
				.filter(
					(l) =>
						l.name.toLowerCase().includes(q) ||
						l.service.toLowerCase().includes(q),
				)
				.slice(0, 4)
		: [];
	const matchingProjects = q
		? projects
				.filter(
					(p) =>
						p.name.toLowerCase().includes(q) ||
						p.stackNeeded.toLowerCase().includes(q),
				)
				.slice(0, 4)
		: [];
	const matchingClients = q
		? clients
				.filter(
					(c) =>
						c.name.toLowerCase().includes(q) ||
						c.contact.toLowerCase().includes(q),
				)
				.slice(0, 3)
		: [];
	const matchingTasks = q
		? tasks.filter((t) => t.name.toLowerCase().includes(q)).slice(0, 3)
		: [];
	const matchingTeam = q
		? team
				.filter(
					(m) =>
						m.name.toLowerCase().includes(q) ||
						m.roleTitle.toLowerCase().includes(q),
				)
				.slice(0, 3)
		: [];

	const hasResults =
		matchingLeads.length > 0 ||
		matchingProjects.length > 0 ||
		matchingClients.length > 0 ||
		matchingTasks.length > 0 ||
		matchingTeam.length > 0;

	return (
		<div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/30 backdrop-blur-sm animate-in fade-in">
			<div className="spotlight w-full max-w-xl overflow-hidden shadow-2xl border border-black/10">
				{/* Search header */}
				<div className="flex items-center px-4 py-3 border-b border-black/[0.08]">
					<span className="text-[#86868B] mr-3 text-[14px]">🔍</span>
					<input
						ref={inputRef}
						type="text"
						placeholder="Type a command, project, lead, or team member..."
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						className="w-full bg-transparent text-[14px] text-[#1D1D1F] outline-none placeholder-[#86868B]"
					/>
					<button
						type="button"
						onClick={onClose}
						className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-black/[0.05] text-[#86868B] hover:text-[#1D1D1F]"
					>
						ESC
					</button>
				</div>

				{/* Results or Quick Actions */}
				<div className="max-h-[380px] overflow-y-auto p-2 space-y-3 mac-scroll">
					{q && !hasResults && (
						<div className="py-8 text-center text-[13px] text-[#86868B]">
							No records found matching &ldquo;{query}&rdquo;
						</div>
					)}

					{/* Quick Actions (when query is empty) */}
					{!q && (
						<div>
							<div className="px-2 py-1 text-[11px] font-[600] uppercase tracking-wider text-[#86868B]">
								Quick Actions
							</div>
							<div className="space-y-0.5">
								<button
									type="button"
									onClick={() => {
										onOpenModal("lead");
										onClose();
									}}
									className="w-full text-left px-3 py-2 rounded-lg text-[13px] hover:bg-black/[0.04] flex items-center justify-between"
								>
									<span className="flex items-center gap-2">
										<span className="text-[#6D28D9]">❖</span> Create New
										Opportunity
									</span>
									<span className="text-[11px] text-[#86868B] font-mono">
										+Lead
									</span>
								</button>
								<button
									type="button"
									onClick={() => {
										onOpenModal("project");
										onClose();
									}}
									className="w-full text-left px-3 py-2 rounded-lg text-[13px] hover:bg-black/[0.04] flex items-center justify-between"
								>
									<span className="flex items-center gap-2">
										<span className="text-[#007AFF]">◼</span> New Project with
										Auto-Team
									</span>
									<span className="text-[11px] text-[#86868B] font-mono">
										+Project
									</span>
								</button>
								<button
									type="button"
									onClick={() => {
										onOpenModal("client");
										onClose();
									}}
									className="w-full text-left px-3 py-2 rounded-lg text-[13px] hover:bg-black/[0.04] flex items-center justify-between"
								>
									<span className="flex items-center gap-2">
										<span className="text-[#30D158]">⚑</span> Add Client Company
									</span>
									<span className="text-[11px] text-[#86868B] font-mono">
										+Client
									</span>
								</button>
							</div>
						</div>
					)}

					{/* Matching Projects */}
					{matchingProjects.length > 0 && (
						<div>
							<div className="px-2 py-1 text-[11px] font-[600] uppercase tracking-wider text-[#86868B]">
								Projects
							</div>
							{matchingProjects.map((p) => (
								<button
									key={p.id}
									type="button"
									onClick={() => {
										onNavigate("project", p.id);
										onClose();
									}}
									className="w-full text-left px-3 py-2 rounded-lg text-[13px] hover:bg-black/[0.04] flex items-center justify-between"
								>
									<span className="font-[550]">{p.name}</span>
									<span className="text-[11px] text-[#86868B]">
										{p.phase} • {p.progress}%
									</span>
								</button>
							))}
						</div>
					)}

					{/* Matching Leads */}
					{matchingLeads.length > 0 && (
						<div>
							<div className="px-2 py-1 text-[11px] font-[600] uppercase tracking-wider text-[#86868B]">
								Opportunities
							</div>
							{matchingLeads.map((l) => (
								<button
									key={l.id}
									type="button"
									onClick={() => {
										onNavigate("pipeline");
										onClose();
									}}
									className="w-full text-left px-3 py-2 rounded-lg text-[13px] hover:bg-black/[0.04] flex items-center justify-between"
								>
									<span>
										<span className="font-[550]">{l.name}</span>
										<span className="text-[11px] text-[#86868B] ml-2 font-[400]">
											{l.service}
										</span>
									</span>
									<span className="text-[11px] font-[600] text-[#6D28D9]">
										₹{(l.value / 1000).toFixed(0)}k • {l.stage}
									</span>
								</button>
							))}
						</div>
					)}

					{/* Matching Team */}
					{matchingTeam.length > 0 && (
						<div>
							<div className="px-2 py-1 text-[11px] font-[600] uppercase tracking-wider text-[#86868B]">
								Team Directory
							</div>
							{matchingTeam.map((m) => (
								<button
									key={m.id}
									type="button"
									onClick={() => {
										onNavigate("team");
										onClose();
									}}
									className="w-full text-left px-3 py-2 rounded-lg text-[13px] hover:bg-black/[0.04] flex items-center justify-between"
								>
									<span className="font-[550]">{m.name}</span>
									<span className="text-[11px] text-[#86868B]">
										{m.roleTitle}
									</span>
								</button>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
