import React, { useEffect, useState } from "react";
import { ErrorBoundary } from "./components/feedback/ErrorBoundary";
import { CommandPalette } from "./components/layout/CommandPalette";
import { Sidebar } from "./components/layout/Sidebar";
import { Topbar } from "./components/layout/Topbar";
import { ClientModal } from "./components/modals/ClientModal";
import { HandoffModal } from "./components/modals/HandoffModal";
import { LeadModal } from "./components/modals/LeadModal";
import { ProjectModal } from "./components/modals/ProjectModal";
import { ScopeChangeModal } from "./components/modals/ScopeChangeModal";
import { TaskModal } from "./components/modals/TaskModal";
import { ToastContainer } from "./components/ui/Toast";
import { ApprovalsView } from "./features/approvals/ApprovalsView";
import { ClientsView } from "./features/clients/ClientsView";
import { DashboardOverview } from "./features/dashboard/DashboardOverview";
import { HandoffsView } from "./features/handoffs/HandoffsView";
import { PipelineView } from "./features/leads/PipelineView";
import { ProjectDetailView } from "./features/projects/ProjectDetailView";
import { ProjectsView } from "./features/projects/ProjectsView";
import { RaciView } from "./features/raci/RaciView";
import { SettingsView } from "./features/settings/SettingsView";
import { TeamView } from "./features/team/TeamView";
import { AuthProvider } from "./lib/auth/auth.context";
import { DEPARTMENTS, getISTHour } from "./lib/constants/agency";
import { ToastProvider } from "./lib/feedback/toast.context";
import { activityRepository } from "./lib/repositories/activity.repository";
import { clientsRepository } from "./lib/repositories/clients.repository";
import { handoffsRepository } from "./lib/repositories/handoffs.repository";
import { leadsRepository } from "./lib/repositories/leads.repository";
import { projectsRepository } from "./lib/repositories/projects.repository";
import { tasksRepository } from "./lib/repositories/tasks.repository";
import { teamRepository } from "./lib/repositories/team.repository";
import { workflowRepository } from "./lib/repositories/workflow.repository";
import type {
	Activity,
	ApprovalRequest,
	Client,
	Handoff,
	Lead,
	Project,
	Task,
	TeamMemberDetail,
} from "./types";

function AgencyOSApp() {
	const [view, setView] = useState("overview");
	const [activeProjectId, setActiveProjectId] = useState<string>("p1");
	const [search, setSearch] = useState("");
	const [cmdOpen, setCmdOpen] = useState(false);
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [istHour, setIstHour] = useState(getISTHour());

	// Domain records state
	const [leads, setLeads] = useState<Lead[]>([]);
	const [clients, setClients] = useState<Client[]>([]);
	const [projects, setProjects] = useState<Project[]>([]);
	const [tasks, setTasks] = useState<Task[]>([]);
	const [handoffs, setHandoffs] = useState<Handoff[]>([]);
	const [team, setTeam] = useState<TeamMemberDetail[]>([]);
	const [activity, setActivity] = useState<Activity[]>([]);
	const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	// Modal state
	const [modal, setModal] = useState<{ type: string; data?: any } | null>(null);

	// Load authoritative data
	const loadData = async () => {
		try {
			const [l, c, p, t, h, tm, a, app] = await Promise.all([
				leadsRepository.list(),
				clientsRepository.list(),
				projectsRepository.list(),
				tasksRepository.list(),
				handoffsRepository.list(),
				teamRepository.list(),
				activityRepository.list(),
				workflowRepository.listApprovals(),
			]);
			setLeads(l);
			setClients(c);
			setProjects(p);
			setTasks(t);
			setHandoffs(h);
			setTeam(tm);
			setActivity(a);
			setApprovals(app);
		} catch (err) {
			console.error("Error loading agency data:", err);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		loadData();

		// Sync IST clock every 60 seconds
		const interval = setInterval(() => setIstHour(getISTHour()), 60000);

		// Listen for local state changes
		const onStateChange = () => loadData();
		window.addEventListener("kreatiwit-state-change", onStateChange);

		return () => {
			clearInterval(interval);
			window.removeEventListener("kreatiwit-state-change", onStateChange);
		};
	}, []);

	// Keyboard shortcuts (⌘K for command palette, ⌘B for sidebar)
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
				e.preventDefault();
				setCmdOpen((v) => !v);
			}
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
				e.preventDefault();
				setSidebarCollapsed((v) => !v);
			}
			if (e.key === "Escape") {
				setCmdOpen(false);
				setModal(null);
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);

	const openProject = (projectId: string) => {
		setActiveProjectId(projectId);
		setView("project");
	};

	const activeProject =
		projects.find((p) => p.id === activeProjectId) || projects[0];
	const activeClient = clients.find((c) => c.id === activeProject?.clientId);

	const viewTitles: Record<string, string> = {
		overview: "Command Center",
		pipeline: "Sales Pipeline",
		clients: "Client Accounts",
		projects: "Projects & Delivery",
		project: activeProject ? activeProject.name : "Project Cockpit",
		handoffs: "Department Transit",
		approvals: "Approval Center",
		team: "Team & Capacity Intelligence",
		raci: "RACI Governance Matrix",
		settings: "Settings & Storage",
	};

	if (isLoading) {
		return (
			<div className="flex h-screen w-full items-center justify-center studio-canvas">
				<div className="studio-card p-8 text-center space-y-3 bg-white shadow-xl">
					<div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin mx-auto" />
					<div className="text-[14px] font-bold text-slate-900 tracking-tight">
						Loading Kreatiwit AgencyOS Studio...
					</div>
					<div className="text-[12px] text-slate-500 font-mono">
						Synchronizing Operational State
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen w-full studio-canvas text-slate-900">
			{/* Obsidian Studio Sidebar */}
			<Sidebar
				view={view}
				setView={setView}
				collapsed={sidebarCollapsed}
				setCollapsed={setSidebarCollapsed}
				leadsCount={leads.length}
				projectsCount={projects.length}
				pendingApprovalsCount={
					approvals.filter((a) => a.status === "Pending").length
				}
				pendingHandoffsCount={
					handoffs.filter((h) => h.status === "Pending").length
				}
				onlineCount={team.length}
				istHour={istHour}
				departments={DEPARTMENTS}
				mobileOpen={mobileMenuOpen}
				onCloseMobile={() => setMobileMenuOpen(false)}
			/>

			{/* Main Workspace Area */}
			<div className="flex-1 flex flex-col min-w-0">
				<Topbar
					viewTitle={viewTitles[view] || "AgencyOS Studio"}
					search={search}
					setSearch={setSearch}
					openCmd={() => setCmdOpen(true)}
					openModal={(type) => setModal({ type })}
					onMobileMenuToggle={() => setMobileMenuOpen((v) => !v)}
				/>

				<main className="flex-1 p-4 lg:p-7 overflow-x-hidden">
					{view === "overview" && (
						<DashboardOverview
							leads={leads}
							clients={clients}
							projects={projects}
							tasks={tasks}
							handoffs={handoffs}
							team={team}
							activity={activity}
							approvals={approvals}
							istHour={istHour}
							departments={DEPARTMENTS}
							onNavigate={(v, pId) => {
								if (pId) openProject(pId);
								else setView(v);
							}}
							onOpenModal={(t) => setModal({ type: t })}
						/>
					)}

					{view === "pipeline" && (
						<PipelineView
							leads={leads}
							onRefresh={loadData}
							onOpenModal={(t, data) => setModal({ type: t, data })}
							search={search}
						/>
					)}

					{view === "clients" && (
						<ClientsView
							clients={clients}
							projects={projects}
							onOpenModal={(t, data) => setModal({ type: t, data })}
							onNavigate={(v, pId) => {
								if (pId) openProject(pId);
								else setView(v);
							}}
							search={search}
						/>
					)}

					{view === "projects" && (
						<ProjectsView
							projects={projects}
							clients={clients}
							team={team}
							onOpenModal={(t) => setModal({ type: t })}
							onOpenProject={openProject}
							search={search}
						/>
					)}

					{view === "project" && activeProject && (
						<ProjectDetailView
							project={activeProject}
							client={activeClient}
							team={team}
							tasks={tasks}
							handoffs={handoffs}
							departments={DEPARTMENTS}
							onBack={() => setView("projects")}
							onOpenModal={(t, data) => setModal({ type: t, data })}
							onRefresh={loadData}
						/>
					)}

					{view === "handoffs" && (
						<HandoffsView
							handoffs={handoffs}
							projects={projects}
							onOpenModal={(t) => setModal({ type: t })}
							onRefresh={loadData}
						/>
					)}

					{view === "approvals" && (
						<ApprovalsView
							approvals={approvals}
							projects={projects}
							onRefresh={loadData}
							onOpenProject={openProject}
						/>
					)}

					{view === "team" && (
						<TeamView team={team} departments={DEPARTMENTS} istHour={istHour} />
					)}

					{view === "raci" && <RaciView projects={projects} />}

					{view === "settings" && (
						<SettingsView
							leads={leads}
							clients={clients}
							projects={projects}
							tasks={tasks}
							handoffs={handoffs}
							team={team}
							activity={activity}
						/>
					)}
				</main>
			</div>

			{/* Global Command Palette (⌘K) */}
			<CommandPalette
				isOpen={cmdOpen}
				onClose={() => setCmdOpen(false)}
				leads={leads}
				clients={clients}
				projects={projects}
				tasks={tasks}
				team={team}
				onNavigate={(v, pId) => {
					if (pId) openProject(pId);
					else setView(v);
				}}
				onOpenModal={(t) => setModal({ type: t })}
			/>

			{/* Modals */}
			{modal?.type === "lead" && (
				<LeadModal
					initialLead={modal.data?.lead}
					onClose={() => setModal(null)}
					onSuccess={loadData}
				/>
			)}
			{modal?.type === "client" && (
				<ClientModal
					initialClient={modal.data?.client}
					onClose={() => setModal(null)}
					onSuccess={loadData}
				/>
			)}
			{modal?.type === "project" && (
				<ProjectModal
					clients={clients}
					team={team}
					onClose={() => setModal(null)}
					onSuccess={loadData}
				/>
			)}
			{modal?.type === "task" && (
				<TaskModal
					projects={projects}
					departments={DEPARTMENTS}
					team={team}
					initialProjectId={modal.data?.projectId || activeProjectId}
					onClose={() => setModal(null)}
					onSuccess={loadData}
				/>
			)}
			{modal?.type === "handoff" && (
				<HandoffModal
					projects={projects}
					departments={DEPARTMENTS}
					initialProjectId={modal.data?.projectId || activeProjectId}
					onClose={() => setModal(null)}
					onSuccess={loadData}
				/>
			)}
			{modal?.type === "change" && (
				<ScopeChangeModal
					projects={projects}
					initialProjectId={modal.data?.projectId || activeProjectId}
					onClose={() => setModal(null)}
					onSuccess={loadData}
				/>
			)}

			{/* Global Toast Feedback Container */}
			<ToastContainer />
		</div>
	);
}

export default function App() {
	return (
		<ErrorBoundary>
			<AuthProvider>
				<ToastProvider>
					<AgencyOSApp />
				</ToastProvider>
			</AuthProvider>
		</ErrorBoundary>
	);
}
