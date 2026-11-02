import type React from "react";
import { useEffect, useRef, useState } from "react";
import type {
	Client,
	Contact,
	FinanceItem,
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
	contacts?: Contact[];
	finance?: FinanceItem[];
	onNavigate: (view: string, projectId?: string) => void;
	onOpenModal: (type: string) => void;
}

interface PaletteAction {
	id: string;
	title: string;
	subtitle?: string;
	badge?: string;
	icon: string;
	section: string;
	perform: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
	isOpen,
	onClose,
	leads,
	clients,
	projects,
	tasks,
	team,
	contacts = [],
	finance = [],
	onNavigate,
	onOpenModal,
}) => {
	const [query, setQuery] = useState("");
	const [selectedIndex, setSelectedIndex] = useState(0);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (isOpen) {
			setSelectedIndex(0);
			setTimeout(() => inputRef.current?.focus(), 50);
		} else {
			setQuery("");
		}
	}, [isOpen]);

	const q = query.toLowerCase().trim();

	const items: PaletteAction[] = [];

	if (!q) {
		items.push({
			id: "action-lead",
			title: "Create New Opportunity",
			subtitle: "Log pipeline lead with value and owner",
			badge: "+Lead",
			icon: "❖",
			section: "Quick Actions",
			perform: () => {
				onOpenModal("lead");
				onClose();
			},
		});
		items.push({
			id: "action-project",
			title: "New Project with Auto-Team",
			subtitle: "Allocate resources and setup gates",
			badge: "+Project",
			icon: "◼",
			section: "Quick Actions",
			perform: () => {
				onOpenModal("project");
				onClose();
			},
		});
		items.push({
			id: "action-client",
			title: "Add Client Company",
			subtitle: "Register brand account and contact",
			badge: "+Client",
			icon: "⚑",
			section: "Quick Actions",
			perform: () => {
				onOpenModal("client");
				onClose();
			},
		});
		items.push({
			id: "action-contact",
			title: "Add Client Contact",
			subtitle: "Register stakeholder or decision-maker",
			badge: "+Contact",
			icon: "👤",
			section: "Quick Actions",
			perform: () => {
				onOpenModal("contact");
				onClose();
			},
		});
		items.push({
			id: "action-finance",
			title: "Create Invoice / Proposal",
			subtitle: "Record commercial milestone or quote",
			badge: "+Finance",
			icon: "📑",
			section: "Quick Actions",
			perform: () => {
				onOpenModal("finance");
				onClose();
			},
		});
		items.push({
			id: "action-task",
			title: "Create Deliverable Task",
			subtitle: "Assign work item to department owner",
			badge: "+Task",
			icon: "✓",
			section: "Quick Actions",
			perform: () => {
				onOpenModal("task");
				onClose();
			},
		});
	} else {
		// Projects
		const matchingProjects = projects
			.filter(
				(p) =>
					p.name.toLowerCase().includes(q) ||
					p.stackNeeded.toLowerCase().includes(q),
			)
			.slice(0, 4);
		for (const p of matchingProjects) {
			items.push({
				id: `p-${p.id}`,
				title: p.name,
				subtitle: `${p.phase} • ${p.progress}% completed`,
				badge: "Project",
				icon: "◼",
				section: "Projects",
				perform: () => {
					onNavigate("project", p.id);
					onClose();
				},
			});
		}

		// Leads
		const matchingLeads = leads
			.filter(
				(l) =>
					l.name.toLowerCase().includes(q) ||
					l.service.toLowerCase().includes(q) ||
					l.contact.toLowerCase().includes(q),
			)
			.slice(0, 4);
		for (const l of matchingLeads) {
			items.push({
				id: `l-${l.id}`,
				title: l.name,
				subtitle: `${l.service} • Owner: ${l.owner}`,
				badge: `₹${(l.value / 1000).toFixed(0)}k • ${l.stage}`,
				icon: "❖",
				section: "Opportunities",
				perform: () => {
					onNavigate("pipeline");
					onClose();
				},
			});
		}

		// Clients
		const matchingClients = clients
			.filter(
				(c) =>
					c.name.toLowerCase().includes(q) ||
					c.contact.toLowerCase().includes(q),
			)
			.slice(0, 3);
		for (const c of matchingClients) {
			items.push({
				id: `c-${c.id}`,
				title: c.name,
				subtitle: `Contact: ${c.contact}`,
				badge: "Client",
				icon: "⚑",
				section: "Clients",
				perform: () => {
					onNavigate("clients");
					onClose();
				},
			});
		}

		// Tasks
		const matchingTasks = tasks
			.filter(
				(t) =>
					t.name.toLowerCase().includes(q) || t.owner.toLowerCase().includes(q),
			)
			.slice(0, 3);
		for (const t of matchingTasks) {
			items.push({
				id: `t-${t.id}`,
				title: t.name,
				subtitle: `Dept: ${t.dept} • Assignee: ${t.owner}`,
				badge: t.status,
				icon: "✓",
				section: "Tasks",
				perform: () => {
					onNavigate("project", t.projectId);
					onClose();
				},
			});
		}

		// Team
		const matchingTeam = team
			.filter(
				(m) =>
					m.name.toLowerCase().includes(q) ||
					m.roleTitle.toLowerCase().includes(q),
			)
			.slice(0, 3);
		for (const m of matchingTeam) {
			items.push({
				id: `m-${m.id}`,
				title: m.name,
				subtitle: m.roleTitle,
				badge: "Team",
				icon: "👤",
				section: "Team Directory",
				perform: () => {
					onNavigate("team");
					onClose();
				},
			});
		}

		// Contacts
		const matchingContacts = contacts
			.filter(
				(c) =>
					c.name.toLowerCase().includes(q) ||
					c.role.toLowerCase().includes(q) ||
					(c.email && c.email.toLowerCase().includes(q)),
			)
			.slice(0, 3);
		for (const c of matchingContacts) {
			items.push({
				id: `con-${c.id}`,
				title: c.name,
				subtitle: `${c.role} ${c.isPrimary ? "• Primary" : ""}`,
				badge: "Contact",
				icon: "👤",
				section: "Stakeholders",
				perform: () => {
					onNavigate("contacts");
					onClose();
				},
			});
		}

		// Finance
		const matchingFinance = finance
			.filter((f) => f.title.toLowerCase().includes(q))
			.slice(0, 3);
		for (const f of matchingFinance) {
			items.push({
				id: `fin-${f.id}`,
				title: f.title,
				subtitle: `${f.type.toUpperCase()} • ₹${f.amount.toLocaleString()}`,
				badge: f.status,
				icon: "📑",
				section: "Finance & Billing",
				perform: () => {
					onNavigate("finance");
					onClose();
				},
			});
		}
	}

	// Keyboard arrow navigation
	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "ArrowDown") {
			e.preventDefault();
			setSelectedIndex((prev) =>
				items.length ? (prev + 1) % items.length : 0,
			);
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			setSelectedIndex((prev) =>
				items.length ? (prev - 1 + items.length) % items.length : 0,
			);
		} else if (e.key === "Enter") {
			e.preventDefault();
			if (items[selectedIndex]) {
				items[selectedIndex].perform();
			}
		} else if (e.key === "Escape") {
			onClose();
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/25 backdrop-blur-xs animate-in fade-in">
			<div className="spotlight w-full max-w-xl overflow-hidden shadow-xl border border-[#DEDEDE] bg-white rounded-xl">
				{/* Search header */}
				<div className="flex items-center px-4 py-3.5 border-b border-[#EDEDED]">
					<span className="text-[#808080] mr-3 text-[14px]">🔍</span>
					<input
						ref={inputRef}
						type="text"
						placeholder="Search projects, leads, team, or run command... (↑↓ to navigate, ↵ to select)"
						value={query}
						onChange={(e) => {
							setQuery(e.target.value);
							setSelectedIndex(0);
						}}
						onKeyDown={handleKeyDown}
						className="w-full bg-transparent text-[14px] text-[#222222] outline-none placeholder-[#808080] font-medium"
					/>
					<button
						type="button"
						onClick={onClose}
						className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-[#F8F8F8] border border-[#DEDEDE] text-[#666666] hover:text-[#222222]"
					>
						ESC
					</button>
				</div>

				{/* Results or Quick Actions */}
				<div className="max-h-[380px] overflow-y-auto p-2 space-y-1">
					{q && items.length === 0 && (
						<div className="py-8 text-center text-[13px] text-[#808080]">
							No records found matching &ldquo;{query}&rdquo;
						</div>
					)}

					{items.map((item, idx) => {
						const isSelected = idx === selectedIndex;
						const showSectionHeader =
							idx === 0 || items[idx - 1].section !== item.section;

						return (
							<div key={item.id}>
								{showSectionHeader && (
									<div className="px-2 pt-2.5 pb-1 text-[10px] font-mono font-bold uppercase tracking-wider text-[#808080]">
										{item.section}
									</div>
								)}
								<button
									type="button"
									onClick={item.perform}
									onMouseEnter={() => setSelectedIndex(idx)}
									className={`w-full text-left px-3 py-2 rounded-lg text-[13px] transition flex items-center justify-between border ${
										isSelected
											? "bg-[#EAF6FF] text-[#168FCE] border-[#B8E2FE] shadow-2xs"
											: "hover:bg-[#F8F8F8] text-[#222222] border-transparent"
									}`}
								>
									<span className="flex items-center gap-2.5 min-w-0">
										<span className="text-[12px] opacity-75 shrink-0">
											{item.icon}
										</span>
										<span className="truncate">
											<span className="font-semibold">{item.title}</span>
											{item.subtitle && (
												<span className="text-[11px] text-[#666666] ml-2 font-normal truncate">
													{item.subtitle}
												</span>
											)}
										</span>
									</span>

									{item.badge && (
										<span
											className={`text-[11px] font-mono shrink-0 ml-2 ${
												isSelected
													? "text-[#168FCE] font-bold"
													: "text-[#808080]"
											}`}
										>
											{item.badge}
										</span>
									)}
								</button>
							</div>
						);
					})}
				</div>

				{/* Footer helper */}
				<div className="px-4 py-2.5 bg-[#F8F8F8] border-t border-[#EDEDED] flex items-center justify-between text-[11px] text-[#666666]">
					<div className="flex items-center gap-2 font-mono">
						<span>↑↓ Navigate</span>
						<span>•</span>
						<span>↵ Execute</span>
						<span>•</span>
						<span>esc Dismiss</span>
					</div>
					<span className="font-mono text-[10px] text-[#808080]">
						Studio Command Spotlight
					</span>
				</div>
			</div>
		</div>
	);
};
