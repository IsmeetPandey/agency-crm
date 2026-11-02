import React, { useEffect, useState } from "react";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { ErrorBoundary } from "./components/feedback/ErrorBoundary";
import { CommandPalette } from "./components/layout/CommandPalette";
import { Sidebar } from "./components/layout/Sidebar";
import { Topbar } from "./components/layout/Topbar";
import { ClientModal } from "./components/modals/ClientModal";
import { ContactModal } from "./components/modals/ContactModal";
import { ConvertLeadModal } from "./components/modals/ConvertLeadModal";
import { FinanceModal } from "./components/modals/FinanceModal";
import { HandoffModal } from "./components/modals/HandoffModal";
import { LeadModal } from "./components/modals/LeadModal";
import { OpportunityModal } from "./components/modals/OpportunityModal";
import { ProjectModal } from "./components/modals/ProjectModal";
import { ScopeChangeModal } from "./components/modals/ScopeChangeModal";
import { TaskModal } from "./components/modals/TaskModal";
import { ToastContainer } from "./components/ui/Toast";
import { ApprovalsView } from "./features/approvals/ApprovalsView";
import { ArchiveView } from "./features/archive/ArchiveView";
import { AuthView } from "./features/auth/AuthView";
import { ClientsView } from "./features/clients/ClientsView";
import { ContactsView } from "./features/contacts/ContactsView";
import { DashboardOverview } from "./features/dashboard/DashboardOverview";
import { FinanceView } from "./features/finance/FinanceView";
import { HandoffsView } from "./features/handoffs/HandoffsView";
import { PipelineView } from "./features/leads/PipelineView";
import { OpportunitiesView } from "./features/opportunities/OpportunitiesView";
import { OpportunityDetailView } from "./features/opportunities/OpportunityDetailView";
import { ProjectDetailView } from "./features/projects/ProjectDetailView";
import { ProjectsView } from "./features/projects/ProjectsView";
import { RaciView } from "./features/raci/RaciView";
import { SettingsView } from "./features/settings/SettingsView";
import { TasksView } from "./features/tasks/TasksView";
import { TeamView } from "./features/team/TeamView";
import { AuthProvider, useAuth } from "./lib/auth/auth.context";
import { DEPARTMENTS, getISTHour } from "./lib/constants/agency";
import { ToastProvider } from "./lib/feedback/toast.context";
import { activityRepository } from "./lib/repositories/activity.repository";
import { clientsRepository } from "./lib/repositories/clients.repository";
import { contactsRepository } from "./lib/repositories/contacts.repository";
import { financeRepository } from "./lib/repositories/finance.repository";
import { handoffsRepository } from "./lib/repositories/handoffs.repository";
import { leadsRepository } from "./lib/repositories/leads.repository";
import { opportunitiesRepository } from "./lib/repositories/opportunities.repository";
import { projectsRepository } from "./lib/repositories/projects.repository";
import { tasksRepository } from "./lib/repositories/tasks.repository";
import { teamRepository } from "./lib/repositories/team.repository";
import { workflowRepository } from "./lib/repositories/workflow.repository";
import { ThemeProvider } from "./lib/theme/theme.context";
import type {
	Activity,
	ApprovalRequest,
	Client,
	Contact,
	FinanceItem,
	Handoff,
	Lead,
	Opportunity,
	Project,
	Task,
	TeamMemberDetail,
} from "./types";

function AgencyOSApp() {
	const {
		isAuthenticated,
		isLoading: isAuthLoading,
		authState,
		authError,
		user,
		signOut,
		retryMembershipResolution,
		requestMembershipProvisioning,
	} = useAuth();
	const [view, setView] = useState("overview");
	const [activeProjectId, setActiveProjectId] = useState<string>("p1");
	const [search, setSearch] = useState("");
	const [cmdOpen, setCmdOpen] = useState(false);
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [istHour, setIstHour] = useState(getISTHour());

	// Domain records state
	const [leads, setLeads] = useState<Lead[]>([]);
	const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
	const [activeOpportunityId, setActiveOpportunityId] = useState<string>("");
	const [clients, setClients] = useState<Client[]>([]);
	const [contacts, setContacts] = useState<Contact[]>([]);
	const [finance, setFinance] = useState<FinanceItem[]>([]);
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
			const [l, opps, c, con, fin, p, t, h, tm, a, app] = await Promise.all([
				leadsRepository.list(),
				opportunitiesRepository.list(),
				clientsRepository.list(),
				contactsRepository.list(),
				financeRepository.list(),
				projectsRepository.list(),
				tasksRepository.list(),
				handoffsRepository.list(),
				teamRepository.list(),
				activityRepository.list(),
				workflowRepository.listApprovals(),
			]);
			setLeads(l);
			setOpportunities(opps);
			setClients(c);
			setContacts(con);
			setFinance(fin);
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

	const openOpportunity = (oppId: string) => {
		setActiveOpportunityId(oppId);
		setView("opportunity");
	};

	const activeProject =
		projects.find((p) => p.id === activeProjectId) || projects[0];
	const activeClient = clients.find((c) => c.id === activeProject?.clientId);
	const activeOpportunity =
		opportunities.find((o) => o.id === activeOpportunityId) || opportunities[0];

	const viewTitles: Record<string, string> = {
		overview: "Command Center",
		pipeline: "Sales Pipeline",
		opportunities: "Commercial Opportunities",
		opportunity: activeOpportunity
			? `${activeOpportunity.opportunityNo} • ${activeOpportunity.title}`
			: "Commercial Opportunity",
		clients: "Client Accounts",
		contacts: "Key Client Stakeholders",
		finance: "Invoices & Proposals",
		projects: "Projects & Delivery",
		project: activeProject ? activeProject.name : "Project Cockpit",
		tasks: "Tasks Masterboard",
		handoffs: "Department Transit",
		approvals: "Approval Center",
		team: "Team & Capacity Intelligence",
		raci: "RACI Governance Matrix",
		archive: "Recycle & Archive Bin",
		settings: "Settings & Storage",
	};

	if (isAuthLoading) {
		return (
			<div className="flex h-screen w-full items-center justify-center studio-canvas">
				<div className="studio-card p-8 text-center space-y-3 bg-white shadow-xl">
					<div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin mx-auto" />
					<div className="text-[14px] font-bold text-slate-900 tracking-tight">
						Verifying Studio Credentials...
					</div>
					<div className="text-[12px] text-slate-500 font-mono">
						Secure Enterprise Authorization
					</div>
				</div>
			</div>
		);
	}

	if (authState === "membership_required") {
		return (
			<div className="flex h-screen w-full items-center justify-center studio-canvas p-4 bg-[#0F1117] font-sans">
				<div className="w-full max-w-[480px] bg-[#181C26]/95 border border-amber-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-4">
					<div className="flex items-center gap-2 text-amber-400 text-[14px] font-bold">
						<ShieldAlert className="w-4 h-4 shrink-0" />
						<span>Organization Membership Required</span>
					</div>
					<p className="text-[13px] text-slate-300 leading-relaxed">
						Authenticated as{" "}
						<strong className="text-white">{user?.email}</strong>. However, your
						user account does not have an active membership assigned in this
						studio organization.
					</p>
					<div className="p-3.5 rounded-lg bg-black/40 border border-white/[0.06] text-[11px] text-slate-400 leading-relaxed">
						Access is restricted to authorized studio personnel. You can request
						automatic member self-provisioning or ask an administrator to invite
						you.
					</div>
					<div className="flex items-center gap-3 pt-2">
						<button
							type="button"
							onClick={async () => {
								await requestMembershipProvisioning();
							}}
							className="flex-1 py-2.5 px-4 rounded-lg bg-[#49B3FC] hover:bg-[#3ba4ea] text-slate-950 text-[12px] font-semibold transition cursor-pointer"
						>
							Provision Membership
						</button>
						<button
							type="button"
							onClick={signOut}
							className="py-2.5 px-4 rounded-lg bg-white/10 hover:bg-white/15 text-white text-[12px] font-medium transition cursor-pointer"
						>
							Sign Out
						</button>
					</div>
				</div>
			</div>
		);
	}

	if (authState === "authorization_error") {
		return (
			<div className="flex h-screen w-full items-center justify-center studio-canvas p-4 bg-[#0F1117] font-sans">
				<div className="w-full max-w-[480px] bg-[#181C26]/95 border border-rose-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-4">
					<div className="flex items-center gap-2 text-rose-400 text-[14px] font-bold">
						<AlertTriangle className="w-4 h-4 shrink-0" />
						<span>Authorization Connection Disrupted</span>
					</div>
					<p className="text-[13px] text-slate-300 leading-relaxed">
						{authError ||
							"Unable to reach database to verify organization role. Please check network connectivity and retry."}
					</p>
					<div className="flex items-center gap-3 pt-2">
						<button
							type="button"
							onClick={retryMembershipResolution}
							className="flex-1 py-2.5 px-4 rounded-lg bg-[#49B3FC] hover:bg-[#3ba4ea] text-slate-950 text-[12px] font-semibold transition cursor-pointer"
						>
							Retry Connection
						</button>
						<button
							type="button"
							onClick={signOut}
							className="py-2.5 px-4 rounded-lg bg-white/10 hover:bg-white/15 text-white text-[12px] font-medium transition cursor-pointer"
						>
							Sign Out
						</button>
					</div>
				</div>
			</div>
		);
	}

	// Gated authentication flow
	if (!isAuthenticated) {
		return <AuthView />;
	}

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
				tasksCount={tasks.length}
				opportunitiesCount={opportunities.length}
				contactsCount={contacts.length}
				financeCount={finance.length}
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
							onNavigate={(v, id) => {
								if (v === "opportunity" && id) openOpportunity(id);
								else setView(v);
							}}
							search={search}
						/>
					)}

					{view === "opportunities" && (
						<OpportunitiesView
							opportunities={opportunities}
							clients={clients}
							team={team}
							onOpenModal={(t, data) => setModal({ type: t, data })}
							onSelectOpportunity={openOpportunity}
							onRefresh={loadData}
							search={search}
						/>
					)}

					{view === "opportunity" && activeOpportunity && (
						<OpportunityDetailView
							opportunity={activeOpportunity}
							client={clients.find((c) => c.id === activeOpportunity.clientId)}
							contacts={contacts.filter(
								(c) => c.clientId === activeOpportunity.clientId,
							)}
							projects={projects.filter(
								(p) => p.opportunityId === activeOpportunity.id,
							)}
							finance={finance.filter(
								(f) =>
									f.opportunityId === activeOpportunity.id ||
									f.opportunityNo === activeOpportunity.opportunityNo,
							)}
							sourceLead={leads.find(
								(l) =>
									l.id === activeOpportunity.sourceLeadId ||
									l.convertedOpportunityId === activeOpportunity.id,
							)}
							team={team}
							onBack={() => setView("opportunities")}
							onOpenModal={(t, data) => setModal({ type: t, data })}
							onOpenProject={openProject}
							onRefresh={loadData}
						/>
					)}

					{view === "clients" && (
						<ClientsView
							clients={clients}
							projects={projects}
							opportunities={opportunities}
							onOpenModal={(t, data) => setModal({ type: t, data })}
							onNavigate={(v, pId) => {
								if (pId) openProject(pId);
								else setView(v);
							}}
							onNavigateToOpportunity={openOpportunity}
							search={search}
						/>
					)}

					{view === "contacts" && (
						<ContactsView
							contacts={contacts}
							clients={clients}
							onOpenModal={(t, data) => setModal({ type: t, data })}
							onRefresh={loadData}
							search={search}
						/>
					)}

					{view === "finance" && (
						<FinanceView
							finance={finance}
							clients={clients}
							projects={projects}
							onOpenModal={(t, data) => setModal({ type: t, data })}
							onNavigateToOpportunity={openOpportunity}
							onRefresh={loadData}
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
							onNavigateToOpportunity={openOpportunity}
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
							onNavigateToOpportunity={openOpportunity}
							onRefresh={loadData}
						/>
					)}

					{view === "tasks" && (
						<TasksView
							tasks={tasks}
							projects={projects}
							departments={DEPARTMENTS}
							team={team}
							onOpenModal={(t, data) => setModal({ type: t, data })}
							onOpenProject={openProject}
							onRefresh={loadData}
							search={search}
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

					{view === "archive" && (
						<ArchiveView onRefresh={loadData} search={search} />
					)}

					{view === "settings" && (
						<SettingsView
							leads={leads}
							opportunities={opportunities}
							clients={clients}
							contacts={contacts}
							projects={projects}
							tasks={tasks}
							handoffs={handoffs}
							team={team}
							activity={activity}
							finance={finance}
							approvals={approvals}
						/>
					)}
				</main>
			</div>

			{/* Global Command Palette (⌘K) */}
			<CommandPalette
				isOpen={cmdOpen}
				onClose={() => setCmdOpen(false)}
				leads={leads}
				opportunities={opportunities}
				clients={clients}
				projects={projects}
				tasks={tasks}
				team={team}
				contacts={contacts}
				finance={finance}
				onNavigate={(v, entityId) => {
					if (v === "project" && entityId) openProject(entityId);
					else if (v === "opportunity" && entityId) openOpportunity(entityId);
					else setView(v);
				}}
				onOpenModal={(t) => setModal({ type: t })}
			/>

			{/* Modals */}
			{modal?.type === "convert-lead" && modal.data?.lead && (
				<ConvertLeadModal
					lead={modal.data.lead}
					clients={clients}
					team={team}
					onClose={() => setModal(null)}
					onSuccess={() => {
						loadData();
					}}
					onNavigateOpportunity={(oppId) => {
						openOpportunity(oppId);
					}}
				/>
			)}
			{modal?.type === "opportunity" && (
				<OpportunityModal
					clients={clients}
					team={team}
					initialOpportunity={modal.data?.opportunity}
					initialClientId={modal.data?.clientId}
					onClose={() => setModal(null)}
					onSuccess={loadData}
				/>
			)}
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
			{modal?.type === "contact" && (
				<ContactModal
					clients={clients}
					initialContact={modal.data?.contact}
					initialClientId={modal.data?.clientId}
					onClose={() => setModal(null)}
					onSuccess={loadData}
				/>
			)}
			{modal?.type === "finance" && (
				<FinanceModal
					clients={clients}
					projects={projects}
					opportunities={opportunities}
					initialItem={modal.data?.item}
					initialClientId={modal.data?.clientId}
					initialProjectId={modal.data?.projectId}
					initialOpportunityId={modal.data?.opportunityId}
					onClose={() => setModal(null)}
					onSuccess={loadData}
				/>
			)}
			{modal?.type === "project" && (
				<ProjectModal
					clients={clients}
					team={team}
					opportunities={opportunities}
					initialOpportunityId={modal.data?.opportunityId}
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
			<ThemeProvider>
				<AuthProvider>
					<ToastProvider>
						<AgencyOSApp />
					</ToastProvider>
				</AuthProvider>
			</ThemeProvider>
		</ErrorBoundary>
	);
}
