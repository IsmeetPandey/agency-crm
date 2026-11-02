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
import {
	GATES_TEMPLATE,
	RACI_DELIVERABLES,
	RACI_ROLES,
	TEAM,
} from "../constants/agency";

export const INITIAL_OPPORTUNITIES: Opportunity[] = [
	{
		id: "opp1",
		opportunityNo: "KW-OPP-000001",
		clientId: "c1",
		title: "Orbit / Global Digital Experience & Commerce",
		service: "Next.js & Design System",
		description:
			"Enterprise multi-region digital experience platform with unified design system.",
		value: 240000,
		currency: "INR",
		stage: "Won",
		owner: "Shradha",
		expectedCloseDate: "2025-10-20",
		status: "active",
		createdAt: "2025-08-01T10:00:00.000Z",
	},
	{
		id: "opp2",
		opportunityNo: "KW-OPP-000002",
		clientId: "c2",
		title: "Serein / Commerce Brand & Interactive Storefront",
		service: "Brand & Commerce",
		description:
			"Rebranding, three.js 3D catalog, and headless commerce implementation.",
		value: 180000,
		currency: "INR",
		stage: "Won",
		owner: "Ansul",
		expectedCloseDate: "2025-09-01",
		status: "active",
		createdAt: "2025-08-10T12:00:00.000Z",
	},
	{
		id: "opp3",
		opportunityNo: "KW-OPP-000003",
		clientId: "c3",
		sourceLeadId: "l5",
		title: "Northpeak / Brand Identity & Growth SEO",
		service: "Brand + SEO",
		description:
			"Corporate rebranding, design collateral, and comprehensive search engine optimization.",
		value: 125000,
		currency: "INR",
		stage: "Won",
		owner: "Abhishek",
		expectedCloseDate: "2025-09-09",
		status: "active",
		createdAt: "2025-09-09T09:30:00.000Z",
	},
];

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
		convertedClientId: "c3",
		convertedOpportunityId: "opp3",
		convertedOpportunityNo: "KW-OPP-000003",
		convertedAt: "2025-09-09T10:00:00.000Z",
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
		opportunityId: "opp1",
		opportunityNo: "KW-OPP-000001",
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
		opportunityId: "opp2",
		opportunityNo: "KW-OPP-000002",
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

const INITIAL_CONTACTS: Contact[] = [
	{
		id: "con1",
		clientId: "c1",
		name: "Avery Quinn",
		role: "VP Engineering",
		email: "avery@orbit.example",
		phone: "+91 98765 43210",
		isPrimary: true,
		notes: "Primary technical and budget decision-maker",
	},
	{
		id: "con2",
		clientId: "c1",
		name: "Morgan Chen",
		role: "Lead Product Manager",
		email: "morgan.c@orbit.example",
		phone: "+91 98765 43211",
		isPrimary: false,
		notes: "Coordinates weekly design sprints and sprint demos",
	},
	{
		id: "con3",
		clientId: "c2",
		name: "Taylor Reed",
		role: "Founder & Creative Director",
		email: "taylor@serein.example",
		phone: "+91 98111 22233",
		isPrimary: true,
		notes: "Final sign-off on visual direction and branding",
	},
	{
		id: "con4",
		clientId: "c2",
		name: "Elena Rostova",
		role: "Head of Marketing",
		email: "elena@serein.example",
		phone: "+91 98111 22234",
		isPrimary: false,
		notes: "Campaign and e-commerce launch lead",
	},
	{
		id: "con5",
		clientId: "c3",
		name: "Jamie Ellis",
		role: "Managing Partner",
		email: "jamie@northstar.example",
		phone: "+91 97000 88990",
		isPrimary: true,
		notes: "Portfolio brand partnerships and board review",
	},
];

const INITIAL_FINANCE: FinanceItem[] = [
	{
		id: "fin1",
		clientId: "c1",
		projectId: "p1",
		opportunityId: "opp1",
		opportunityNo: "KW-OPP-000001",
		type: "invoice",
		title: "Orbit / Milestone 1 - Architecture & UX Discovery",
		amount: 120000,
		status: "Paid",
		issuedDate: "2025-08-15",
		dueDate: "2025-08-30",
		paidDate: "2025-08-28",
		notes: "Wire transfer confirmed via HDFC",
	},
	{
		id: "fin2",
		clientId: "c1",
		projectId: "p1",
		opportunityId: "opp1",
		opportunityNo: "KW-OPP-000001",
		type: "invoice",
		title: "Orbit / Milestone 2 - Design System & Component Library",
		amount: 120000,
		status: "Sent",
		issuedDate: "2025-09-01",
		dueDate: "2025-09-20",
		notes: "Net-20 terms. Prototype review approved.",
	},
	{
		id: "fin3",
		clientId: "c2",
		projectId: "p2",
		opportunityId: "opp2",
		opportunityNo: "KW-OPP-000002",
		type: "proposal",
		title: "Serein / Brand Identity & Next.js Storefront Scope",
		amount: 180000,
		status: "Accepted",
		issuedDate: "2025-08-10",
		dueDate: "2025-08-25",
		notes: "Signed master services agreement on file",
	},
	{
		id: "fin4",
		clientId: "c2",
		projectId: "p2",
		opportunityId: "opp2",
		opportunityNo: "KW-OPP-000002",
		type: "invoice",
		title: "Serein / Retainer Advance 50%",
		amount: 90000,
		status: "Paid",
		issuedDate: "2025-08-12",
		dueDate: "2025-08-20",
		paidDate: "2025-08-18",
		notes: "Advance deposit cleared",
	},
	{
		id: "fin5",
		clientId: "c3",
		type: "quotation",
		title: "Northstar / Venture Brand Sprint & Pitch Deck",
		amount: 140000,
		status: "Draft",
		issuedDate: "2025-09-05",
		dueDate: "2025-09-25",
		notes: "Pending partner meeting feedback",
	},
];

const INITIAL_NOTES: Note[] = [
	{
		id: "n1",
		entityType: "lead",
		entityId: "l1",
		author: "Riya Kapoor",
		content:
			"Spoke with Casey Morgan. Focus on high-end luxury residential showcase with 3D floorplans.",
		createdAt: "2025-09-02T10:30:00.000Z",
	},
	{
		id: "n2",
		entityType: "lead",
		entityId: "l2",
		author: "Arnav",
		content:
			"Parker requested technical architecture proposal with HIPAA security compliance notes.",
		createdAt: "2025-09-03T14:15:00.000Z",
	},
	{
		id: "n3",
		entityType: "project",
		entityId: "p1",
		author: "Ansul",
		content:
			"Figma design tokens synced. Frontend build environment ready on Next.js 14.",
		createdAt: "2025-09-05T09:00:00.000Z",
	},
];

const STORAGE_KEY = "kreatiwit_agencyos_v3_state";

export interface AppStateData {
	leads: Lead[];
	clients: Client[];
	opportunities: Opportunity[];
	opportunitySeq: number;
	contacts: Contact[];
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
	finance: FinanceItem[];
	notes: Note[];
}

export function allocateNextOpportunityNumber(state: AppStateData): string {
	const existingNumbers = new Set(
		(state.opportunities || [])
			.map((o) => o.opportunityNo?.toUpperCase().trim())
			.filter(Boolean),
	);

	let maxNum = state.opportunitySeq || 0;
	for (const opp of state.opportunities || []) {
		const match = opp.opportunityNo?.match(/KW-OPP-(\d+)/i);
		if (match) {
			const val = Number.parseInt(match[1], 10);
			if (!Number.isNaN(val) && val > maxNum) {
				maxNum = val;
			}
		}
	}

	let candidateNum = Math.max(state.opportunitySeq || 0, maxNum) + 1;
	let candidateStr = `KW-OPP-${candidateNum.toString().padStart(6, "0")}`;

	while (existingNumbers.has(candidateStr.toUpperCase())) {
		candidateNum += 1;
		candidateStr = `KW-OPP-${candidateNum.toString().padStart(6, "0")}`;
	}

	state.opportunitySeq = candidateNum;
	return candidateStr;
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
					if (!parsed.contacts) parsed.contacts = INITIAL_CONTACTS;
					if (!parsed.finance) parsed.finance = INITIAL_FINANCE;
					if (!parsed.notes) parsed.notes = INITIAL_NOTES;
					if (!parsed.opportunities) {
						parsed.opportunities = INITIAL_OPPORTUNITIES;
						parsed.opportunitySeq = 3;
					} else {
						// Ensure all opportunities have valid, unique opportunityNo
						for (const opp of parsed.opportunities) {
							if (!opp.opportunityNo) {
								opp.opportunityNo = allocateNextOpportunityNumber(parsed);
							}
						}
					}
					inMemoryState = parsed;
					return parsed;
				}
			}
		}
	} catch {}

	const defaultState: AppStateData = {
		leads: INITIAL_LEADS,
		clients: INITIAL_CLIENTS,
		opportunities: INITIAL_OPPORTUNITIES,
		opportunitySeq: 3,
		contacts: INITIAL_CONTACTS,
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
		finance: INITIAL_FINANCE,
		notes: INITIAL_NOTES,
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
