import type {
	Activity,
	ApprovalRequest,
	Client,
	Contact,
	FinanceItem,
	Handoff,
	Lead,
	Note,
	Opportunity,
	Project,
	ProjectGate,
	RACIAssignment,
	ScopeChange,
	Task,
	TeamMemberDetail,
} from "../../types";
import { activityRepository } from "../repositories/activity.repository";
import { clientsRepository } from "../repositories/clients.repository";
import { contactsRepository } from "../repositories/contacts.repository";
import { financeRepository } from "../repositories/finance.repository";
import { handoffsRepository } from "../repositories/handoffs.repository";
import { leadsRepository } from "../repositories/leads.repository";
import { opportunitiesRepository } from "../repositories/opportunities.repository";
import { projectsRepository } from "../repositories/projects.repository";
import { loadLocalState } from "../repositories/store";
import { tasksRepository } from "../repositories/tasks.repository";
import { teamRepository } from "../repositories/team.repository";
import { isSupabaseConfigured, supabase } from "../supabase/client";

export interface AgencyBackupData {
	leads: Lead[];
	opportunities: Opportunity[];
	clients: Client[];
	contacts: Contact[];
	projects: Project[];
	tasks: Task[];
	finance: FinanceItem[];
	handoffs: Handoff[];
	team: TeamMemberDetail[];
	activity: Activity[];
	notes: Note[];
	gates: Record<string, ProjectGate[]>;
	raci: Record<string, RACIAssignment[]>;
	checklists: Record<string, Record<string, boolean>>;
	approvals: ApprovalRequest[];
	scopeChanges: ScopeChange[];
}

export interface AgencyBackupArchive {
	agency: "Kreatiwit AgencyOS";
	schemaVersion: "3.2.0";
	exportedAt: string;
	exportedBy: string;
	userRole: string;
	counts: {
		leads: number;
		opportunities: number;
		clients: number;
		contacts: number;
		projects: number;
		tasks: number;
		finance: number;
		handoffs: number;
		team: number;
		activity: number;
		notes: number;
		gates: number;
		raci: number;
		checklists: number;
		approvals: number;
		scopeChanges: number;
	};
	data: AgencyBackupData;
}

export const backupService = {
	async createBackup(
		exportedBy: string,
		userRole: string,
	): Promise<AgencyBackupArchive> {
		const local = loadLocalState();

		let leads: Lead[] = local.leads;
		let opportunities: Opportunity[] = local.opportunities;
		let clients: Client[] = local.clients;
		let contacts: Contact[] = local.contacts;
		let projects: Project[] = local.projects;
		let tasks: Task[] = local.tasks;
		let finance: FinanceItem[] = local.finance;
		let handoffs: Handoff[] = local.handoffs;
		let team: TeamMemberDetail[] = local.team;
		let activity: Activity[] = local.activity;
		let notes: Note[] = local.notes;
		const gates: Record<string, ProjectGate[]> = local.gates;
		const raci: Record<string, RACIAssignment[]> = local.raci;
		const checklists: Record<
			string,
			Record<string, boolean>
		> = local.checklists;
		let approvals: ApprovalRequest[] = local.approvals;
		let scopeChanges: ScopeChange[] = local.scopeChanges;

		try {
			const [
				repLeads,
				repOpps,
				repClients,
				repContacts,
				repProjects,
				repTasks,
				repFinance,
				repHandoffs,
				repTeam,
				repActivity,
			] = await Promise.all([
				leadsRepository.list().catch(() => local.leads),
				opportunitiesRepository.list().catch(() => local.opportunities),
				clientsRepository.list().catch(() => local.clients),
				contactsRepository.list().catch(() => local.contacts),
				projectsRepository.list().catch(() => local.projects),
				tasksRepository.list().catch(() => local.tasks),
				financeRepository.list().catch(() => local.finance),
				handoffsRepository.list().catch(() => local.handoffs),
				teamRepository.list().catch(() => local.team),
				activityRepository.list().catch(() => local.activity),
			]);

			if (repLeads?.length) leads = repLeads;
			if (repOpps?.length) opportunities = repOpps;
			if (repClients?.length) clients = repClients;
			if (repContacts?.length) contacts = repContacts;
			if (repProjects?.length) projects = repProjects;
			if (repTasks?.length) tasks = repTasks;
			if (repFinance?.length) finance = repFinance;
			if (repHandoffs?.length) handoffs = repHandoffs;
			if (repTeam?.length) team = repTeam;
			if (repActivity?.length) activity = repActivity;

			if (isSupabaseConfigured()) {
				const { data: dbNotes } = await supabase.from("notes").select("*");
				if (dbNotes && dbNotes.length > 0) {
					notes = dbNotes.map((n) => ({
						id: n.id,
						entityType: n.entity_type as any,
						entityId: n.entity_id,
						author: n.author_name,
						content: n.content,
						createdAt: n.created_at,
					}));
				}

				const { data: dbApprovals } = await supabase
					.from("approval_requests")
					.select("*");
				if (dbApprovals && dbApprovals.length > 0) {
					approvals = dbApprovals.map((a) => ({
						id: a.id,
						projectId: a.project_id,
						gateId: a.gate_id || undefined,
						title: a.title,
						status: a.status as any,
						requestedBy: a.requested_by,
						assignedApprover: a.assigned_approver || undefined,
						decisionNotes: a.decision_notes || undefined,
						createdAt: a.created_at,
					}));
				}

				const { data: dbScope } = await supabase
					.from("scope_changes")
					.select("*");
				if (dbScope && dbScope.length > 0) {
					scopeChanges = dbScope.map((s) => ({
						id: s.id,
						projectId: s.project_id,
						title: s.title,
						category: s.category as any,
						description: s.description,
						costDelta: s.cost_delta,
						daysDelta: s.days_delta,
						mitigation: s.mitigation || undefined,
						status: s.status as any,
						requestedBy: s.requested_by,
						createdAt: s.created_at,
					}));
				}
			}
		} catch (err) {
			console.warn(
				"Using local resilient snapshot for backup generation:",
				err,
			);
		}

		const totalGatesCount = Object.values(gates).reduce(
			(acc, g) => acc + (g?.length || 0),
			0,
		);
		const totalRaciCount = Object.values(raci).reduce(
			(acc, r) => acc + (r?.length || 0),
			0,
		);
		const totalChecklistItems = Object.values(checklists).reduce(
			(acc, c) => acc + Object.keys(c || {}).length,
			0,
		);

		const data: AgencyBackupData = {
			leads,
			opportunities,
			clients,
			contacts,
			projects,
			tasks,
			finance,
			handoffs,
			team,
			activity,
			notes,
			gates,
			raci,
			checklists,
			approvals,
			scopeChanges,
		};

		return {
			agency: "Kreatiwit AgencyOS",
			schemaVersion: "3.2.0",
			exportedAt: new Date().toISOString(),
			exportedBy: exportedBy || "Executive User",
			userRole: userRole || "owner",
			counts: {
				leads: leads.length,
				opportunities: opportunities.length,
				clients: clients.length,
				contacts: contacts.length,
				projects: projects.length,
				tasks: tasks.length,
				finance: finance.length,
				handoffs: handoffs.length,
				team: team.length,
				activity: activity.length,
				notes: notes.length,
				gates: totalGatesCount,
				raci: totalRaciCount,
				checklists: totalChecklistItems,
				approvals: approvals.length,
				scopeChanges: scopeChanges.length,
			},
			data,
		};
	},

	downloadArchive(archive: AgencyBackupArchive): void {
		const jsonString = JSON.stringify(archive, null, 2);
		const blob = new Blob([jsonString], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `kreatiwit-agencyos-backup-${new Date().toISOString().slice(0, 10)}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	},
};
