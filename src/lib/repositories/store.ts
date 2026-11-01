import type {
	Activity,
	ApprovalRequest,
	Client,
	Handoff,
	Lead,
	Project,
	ProjectGate,
	RACIAssignment,
	ScopeChange,
	Task,
	TeamMemberDetail,
} from "../../types";
import {
	GATES_TEMPLATE,
	RACI_DELIVERABLES,
	RACI_ROLES,
	TEAM,
} from "../constants/agency";

// Canonical seed data matching original prototype exactly
const INITIAL_LEADS: Lead[] = [
	{
		id: "l1",
		legacyId: "l1",
		name: "Aster Living",
		contact: "Casey Morgan",
		email: "casey@aster.example",
		service: "Website & branding",
		value: 260000,
		stage: "New",
		owner: "Riya Kapoor",
		followup: "2025-09-12",
		notes: "Discovery call requested.",
	},
	{
		id: "l2",
		legacyId: "l2",
		name: "Meridian Health",
		contact: "Parker Blake",
		email: "parker@meridian.example",
		service: "Next.js Commerce",
		value: 420000,
		stage: "Qualified",
		owner: "Arnav",
		followup: "2025-09-10",
		notes: "React + Node required",
	},
	{
		id: "l3",
		legacyId: "l3",
		name: "Arc Collective",
		contact: "Drew Lane",
		email: "drew@arc.example",
		service: "Flutter App",
		value: 185000,
		stage: "Proposal",
		owner: "Darshan",
		followup: "2025-09-14",
		notes: "Flutter + Firebase",
	},
	{
		id: "l4",
		legacyId: "l4",
		name: "Vela Systems",
		contact: "Skyler Drew",
		email: "skyler@vela.example",
		service: "AI workflow",
		value: 350000,
		stage: "Contacted",
		owner: "Shradha",
		followup: "2025-09-11",
		notes: "AI/ML + Research",
	},
	{
		id: "l5",
		legacyId: "l5",
		name: "Northpeak",
		contact: "Alex Kim",
		email: "alex@north.example",
		service: "Brand + SEO",
		value: 125000,
		stage: "Won",
		owner: "Abhishek",
		followup: "2025-09-09",
		notes: "Won!",
	},
];

const INITIAL_CLIENTS: Client[] = [
	{
		id: "c1",
		legacyId: "c1",
		name: "Orbit Technologies",
		contact: "Avery Quinn",
		email: "avery@orbit.example",
		notes: "B2B tech client",
	},
	{
		id: "c2",
		legacyId: "c2",
		name: "Serein Studio",
		contact: "Taylor Reed",
		email: "taylor@serein.example",
		notes: "Commerce brand",
	},
	{
		id: "c3",
		legacyId: "c3",
		name: "Northstar Ventures",
		contact: "Jamie Ellis",
		email: "jamie@northstar.example",
		notes: "Campaign client",
	},
];

const INITIAL_PROJECTS: Project[] = [
	{
		id: "p1",
		legacyId: "p1",
		name: "Orbit / Digital Experience",
		clientId: "c1",
		phase: "Design",
		stackNeeded: "React, Next.js, Figma",
		budget: 240000,
		due: "2025-10-20",
		owner: "Shradha",
		scope: "Enterprise website with commerce.",
		assignedTeam: ["ansul", "shradha", "rahul"],
		progress: 45,
	},
	{
		id: "p2",
		legacyId: "p2",
		name: "Serein / Brand & commerce",
		clientId: "c2",
		phase: "Build",
		stackNeeded: "Next.js, Shopify, three.js",
		budget: 180000,
		due: "2025-10-05",
		owner: "Ansul",
		scope: "Brand + storefront.",
		assignedTeam: ["ismeet", "vipul"],
		progress: 68,
	},
];

const INITIAL_TASKS: Task[] = [
	{
		id: "t1",
		legacyId: "t1",
		projectId: "p1",
		name: "Product page implementation",
		dept: "Frontend",
		owner: "Ansul",
		status: "In progress",
		due: "2025-09-13",
	},
	{
		id: "t2",
		legacyId: "t2",
		projectId: "p1",
		name: "CRM integration credentials",
		dept: "Backend",
		owner: "Rahul",
		status: "Blocked",
		due: "2025-09-10",
	},
	{
		id: "t3",
		legacyId: "t3",
		projectId: "p2",
		name: "Checkout interaction states",
		dept: "Design",
		owner: "Shradha",
		status: "In progress",
		due: "2025-09-12",
	},
];

const INITIAL_HANDOFFS: Handoff[] = [
	{
		id: "h1",
		legacyId: "h1",
		projectId: "p1",
		title: "Product templates / implementation review",
		from: "Design",
		to: "Frontend",
		status: "Pending",
		due: "2025-09-13",
	},
	{
		id: "h2",
		legacyId: "h2",
		projectId: "p2",
		title: "Strategy / experience direction",
		from: "PM",
		to: "Design",
		status: "Accepted",
		due: "2025-09-09",
	},
];

const INITIAL_ACTIVITY: Activity[] = [
	{
		id: "a1",
		text: "Workspace initialized - AgencyOS v3 Liquid Glass live",
		at: new Date().toISOString(),
		actor: "System",
	},
	{
		id: "a2",
		text: "Lead created: Aster Living - Website & branding",
		at: new Date(Date.now() - 3600000).toISOString(),
		actor: "Shradha",
	},
	{
		id: "a3",
		text: "Client added: Orbit Technologies",
		at: new Date(Date.now() - 7200000).toISOString(),
		actor: "Abhishek",
	},
	{
		id: "a4",
		text: "Project created: Serein / Brand & commerce with auto-team",
		at: new Date(Date.now() - 10800000).toISOString(),
		actor: "Ansul",
	},
];

const STORAGE_KEY = "kreatiwit_agencyos_v3_state";

export interface AppStateData {
	leads: Lead[];
	clients: Client[];
	projects: Project[];
	tasks: Task[];
	handoffs: Handoff[];
	team: TeamMemberDetail[];
	activity: Activity[];
	gates: Record<string, ProjectGate[]>;
	approvals: ApprovalRequest[];
	scopeChanges: ScopeChange[];
	checklists: Record<string, Record<string, boolean>>; // projectId -> itemKey -> checked
	raci: Record<string, RACIAssignment[]>; // projectId -> assignments
}

function initDefaultGates(projects: Project[]): Record<string, ProjectGate[]> {
	const map: Record<string, ProjectGate[]> = {};
	for (const p of projects) {
		map[p.id] = GATES_TEMPLATE.map((g, idx) => ({
			id: `g_${p.id}_${g.step}`,
			projectId: p.id,
			stepNumber: g.step,
			name: g.name,
			ownerDept: g.ownerDept,
			status: idx < 3 ? "Approved" : "Pending",
		}));
	}
	return map;
}

function initDefaultRaci(
	projects: Project[],
): Record<string, RACIAssignment[]> {
	const map: Record<string, RACIAssignment[]> = {};
	for (const p of projects) {
		const list: RACIAssignment[] = [];
		RACI_DELIVERABLES.forEach((deliv) => {
			RACI_ROLES.forEach((r, j) => {
				list.push({
					deliverable: deliv,
					roleCode: r,
					assignment: (["R", "A", "C", "I", "—"][j % 5] as any) || "—",
				});
			});
		});
		map[p.id] = list;
	}
	return map;
}

let inMemoryState: AppStateData | null = null;

export function loadLocalState(): AppStateData {
	if (inMemoryState) {
		return inMemoryState;
	}

	try {
		if (typeof localStorage !== "undefined") {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (raw) {
				const parsed = JSON.parse(raw);
				if (parsed.leads?.length && parsed.projects?.length) {
					inMemoryState = parsed;
					return parsed;
				}
			}
		}
	} catch {}

	const defaultState: AppStateData = {
		leads: INITIAL_LEADS,
		clients: INITIAL_CLIENTS,
		projects: INITIAL_PROJECTS,
		tasks: INITIAL_TASKS,
		handoffs: INITIAL_HANDOFFS,
		team: TEAM,
		activity: INITIAL_ACTIVITY,
		gates: initDefaultGates(INITIAL_PROJECTS),
		approvals: [
			{
				id: "app1",
				projectId: "p1",
				title: "Orbit / Digital Experience • Gate 4 Prototype Approval",
				status: "Pending",
				requestedBy: "Ansul",
				assignedApprover: "Shradha",
				createdAt: new Date().toISOString(),
			},
		],
		scopeChanges: [],
		checklists: {
			p1: { "PM-0": true, "PM-1": true, "Design-0": true },
			p2: { "PM-0": true, "Frontend-0": true },
		},
		raci: initDefaultRaci(INITIAL_PROJECTS),
	};

	inMemoryState = defaultState;
	saveLocalState(defaultState);
	return defaultState;
}

export function saveLocalState(state: AppStateData) {
	inMemoryState = state;
	try {
		if (typeof localStorage !== "undefined") {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
		}
		if (typeof window !== "undefined") {
			window.dispatchEvent(
				new CustomEvent("kreatiwit-state-change", { detail: state }),
			);
		}
	} catch {}
}
