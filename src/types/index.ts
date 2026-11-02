export interface TeamMemberDetail {
	id: string;
	legacyId?: string;
	name: string;
	roleTitle: string;
	initials: string;
	stack: string[];
	avail: number;
	focus: number;
	slotRaw: string;
	slots: { start: number; end: number }[];
	departments: string[];
	learning?: string[];
	accent: string;
	overload: boolean;
	email: string;
	status?: "active" | "hiring" | "inactive";
}

export interface Department {
	id: string;
	code: string;
	label: string;
	members: string[];
	learning?: string[];
	dot: string;
	color?: string;
}

export interface LeadershipRole {
	role: string;
	name: string;
	status: "active" | "hiring" | "interim";
	tint: string;
	color: string;
}

export type LeadStage =
	| "New"
	| "Contacted"
	| "Qualified"
	| "Proposal"
	| "Won"
	| "Lost";

export interface Lead {
	id: string;
	legacyId?: string;
	name: string;
	contact: string;
	email: string;
	service: string;
	value: number;
	stage: LeadStage;
	owner: string;
	followup: string;
	notes: string;
	projectId?: string;
	convertedClientId?: string;
	convertedOpportunityId?: string;
	convertedOpportunityNo?: string;
	convertedAt?: string;
	status?: "active" | "archived";
	createdAt?: string;
}

export type OpportunityStage =
	| "Open"
	| "Qualified"
	| "Proposal"
	| "Negotiation"
	| "Won"
	| "Lost"
	| "Hold";

export interface Opportunity {
	id: string;
	legacyId?: string;
	opportunityNo: string; // Permanent, unique, e.g. "KW-OPP-000001"
	clientId: string;
	sourceLeadId?: string;
	title: string;
	service: string;
	description?: string;
	value: number;
	currency: string;
	stage: OpportunityStage;
	owner: string;
	expectedCloseDate?: string;
	status?: "active" | "archived";
	createdAt?: string;
	updatedAt?: string;
}

export interface Contact {
	id: string;
	clientId: string;
	name: string;
	role: string;
	email: string;
	phone?: string;
	isPrimary: boolean;
	notes?: string;
	createdAt?: string;
}

export interface Client {
	id: string;
	legacyId?: string;
	name: string;
	contact: string;
	email: string;
	notes: string;
	phone?: string;
	status?: "active" | "archived";
	createdAt?: string;
}

export type FinanceType = "proposal" | "quotation" | "invoice";
export type FinanceStatus =
	| "Draft"
	| "Sent"
	| "Accepted"
	| "Paid"
	| "Overdue"
	| "Declined";

export interface FinanceItem {
	id: string;
	legacyId?: string;
	clientId: string;
	projectId?: string;
	opportunityId?: string;
	opportunityNo?: string;
	type: FinanceType;
	title: string;
	amount: number;
	status: FinanceStatus;
	issuedDate: string; // Canonical contract
	issueDate?: string; // Backward compatibility alias
	dueDate?: string;
	paidDate?: string;
	notes?: string;
	createdAt?: string;
}

export interface Note {
	id: string;
	entityType: "lead" | "client" | "opportunity" | "project" | "task";
	entityId: string;
	author: string;
	content: string;
	createdAt: string;
}

export type ProjectPhase =
	| "Kickoff"
	| "Discovery"
	| "Design"
	| "Prototype"
	| "Build"
	| "QA"
	| "UAT"
	| "Launch"
	| "Close";

export interface Project {
	id: string;
	legacyId?: string;
	name: string;
	clientId: string;
	opportunityId?: string;
	opportunityNo?: string;
	phase: ProjectPhase;
	stackNeeded: string;
	budget: number;
	due: string;
	owner: string;
	scope: string;
	assignedTeam: string[];
	progress: number;
	status?: "active" | "completed" | "archived";
}

export type TaskStatus = "Todo" | "In progress" | "Blocked" | "Completed";
export type TaskPriority = "Low" | "Medium" | "High" | "Urgent";

export interface Task {
	id: string;
	legacyId?: string;
	projectId: string;
	name: string;
	dept: string;
	owner: string;
	status: TaskStatus;
	priority?: TaskPriority;
	due: string;
	description?: string;
	completedAt?: string;
}

export type HandoffStatus =
	| "Pending"
	| "Accepted"
	| "Rejected"
	| "Changes Requested"
	| "Completed";

export interface Handoff {
	id: string;
	legacyId?: string;
	projectId: string;
	title: string;
	from: string;
	to: string;
	status: HandoffStatus;
	due: string;
	description?: string;
	acceptedBy?: string;
}

export interface Activity {
	id: string;
	text: string;
	at: string;
	actor: string;
	entityType?: string;
	entityId?: string;
}

export interface ProjectGate {
	id: string;
	projectId: string;
	stepNumber: number;
	name: string;
	ownerDept: string;
	status: "Pending" | "In Review" | "Approved" | "Rejected";
	notes?: string;
	approvedBy?: string;
	approvedAt?: string;
}

export interface ApprovalRequest {
	id: string;
	projectId: string;
	gateId?: string;
	title: string;
	status: "Pending" | "Approved" | "Rejected" | "Changes Requested";
	requestedBy: string;
	assignedApprover?: string;
	decisionNotes?: string;
	createdAt: string;
}

export interface ScopeChange {
	id: string;
	projectId: string;
	title: string;
	category: "Scope" | "Timeline" | "Budget" | "Stack" | "Other";
	description: string;
	reason?: string;
	costDelta: number;
	daysDelta: number;
	mitigation?: string;
	status: "Pending" | "Approved" | "Rejected";
	requestedBy: string;
	createdAt: string;
}

export interface ProjectChecklistItem {
	id: string;
	checklistId: string;
	itemIndex: number;
	title: string;
	isCompleted: boolean;
	completedBy?: string;
}

export interface RACIAssignment {
	deliverable: string;
	roleCode: string;
	assignment: "R" | "A" | "C" | "I" | "—" | "A/R";
}
