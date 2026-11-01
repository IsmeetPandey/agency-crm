import type {
	ApprovalRequest,
	ProjectGate,
	RACIAssignment,
	ScopeChange,
} from "../../types";
import { GATES_TEMPLATE } from "../constants/agency";
import { activityRepository } from "./activity.repository";
import { loadLocalState, saveLocalState } from "./store";

export const workflowRepository = {
	// --- Project Gates ---
	async getProjectGates(projectId: string): Promise<ProjectGate[]> {
		const state = loadLocalState();
		if (!state.gates[projectId]) {
			state.gates[projectId] = GATES_TEMPLATE.map((g, idx) => ({
				id: `g_${projectId}_${g.step}`,
				projectId,
				stepNumber: g.step,
				name: g.name,
				ownerDept: g.ownerDept,
				status: idx < 3 ? "Approved" : "Pending",
			}));
			saveLocalState(state);
		}
		return state.gates[projectId];
	},

	async updateGateStatus(
		projectId: string,
		stepNumber: number,
		status: "Pending" | "In Review" | "Approved" | "Rejected",
		actor = "User",
	): Promise<ProjectGate> {
		const state = loadLocalState();
		const gates = state.gates[projectId] || [];
		const idx = gates.findIndex((g) => g.stepNumber === stepNumber);
		if (idx === -1)
			throw new Error(
				`Gate step ${stepNumber} not found for project ${projectId}`,
			);

		gates[idx].status = status;
		if (status === "Approved") {
			gates[idx].approvedBy = actor;
			gates[idx].approvedAt = new Date().toISOString();
		}
		state.gates[projectId] = gates;
		saveLocalState(state);

		await activityRepository.log({
			text: `Gate updated: ${gates[idx].name} → ${status}`,
			actor,
			entityType: "gate",
			entityId: gates[idx].id,
		});

		return gates[idx];
	},

	// --- Approvals ---
	async listApprovals(): Promise<ApprovalRequest[]> {
		const state = loadLocalState();
		return state.approvals;
	},

	async requestApproval(
		payload: Omit<ApprovalRequest, "id" | "createdAt" | "status">,
		actor = "User",
	): Promise<ApprovalRequest> {
		const state = loadLocalState();
		const newReq: ApprovalRequest = {
			...payload,
			id: `app_${Date.now()}`,
			status: "Pending",
			createdAt: new Date().toISOString(),
		};
		state.approvals = [newReq, ...state.approvals];
		saveLocalState(state);

		await activityRepository.log({
			text: `Approval requested: ${newReq.title}`,
			actor,
			entityType: "approval",
			entityId: newReq.id,
		});

		return newReq;
	},

	async decideApproval(
		id: string,
		decision: "Approved" | "Rejected" | "Changes Requested",
		notes?: string,
		actor = "User",
	): Promise<ApprovalRequest> {
		const state = loadLocalState();
		const idx = state.approvals.findIndex((a) => a.id === id);
		if (idx === -1) throw new Error(`Approval request ${id} not found`);

		state.approvals[idx].status = decision;
		state.approvals[idx].decisionNotes = notes;
		saveLocalState(state);

		await activityRepository.log({
			text: `Approval ${decision.toLowerCase()}: ${state.approvals[idx].title}`,
			actor,
			entityType: "approval",
			entityId: id,
		});

		return state.approvals[idx];
	},

	// --- Department Checklists ---
	async getChecklistState(projectId: string): Promise<Record<string, boolean>> {
		const state = loadLocalState();
		return state.checklists[projectId] || {};
	},

	async toggleChecklistItem(
		projectId: string,
		itemKey: string,
		checked: boolean,
	): Promise<void> {
		const state = loadLocalState();
		if (!state.checklists[projectId]) {
			state.checklists[projectId] = {};
		}
		state.checklists[projectId][itemKey] = checked;
		saveLocalState(state);
	},

	// --- RACI Matrix ---
	async getProjectRaci(projectId: string): Promise<RACIAssignment[]> {
		const state = loadLocalState();
		return state.raci[projectId] || [];
	},

	async updateRaciAssignment(
		projectId: string,
		deliverable: string,
		roleCode: string,
		assignment: "R" | "A" | "C" | "I" | "—" | "A/R",
	): Promise<void> {
		const state = loadLocalState();
		const list = state.raci[projectId] || [];
		const idx = list.findIndex(
			(r) => r.deliverable === deliverable && r.roleCode === roleCode,
		);
		if (idx !== -1) {
			list[idx].assignment = assignment;
		} else {
			list.push({ deliverable, roleCode, assignment });
		}
		state.raci[projectId] = list;
		saveLocalState(state);
	},

	// --- Scope Changes ---
	async listScopeChanges(projectId?: string): Promise<ScopeChange[]> {
		const state = loadLocalState();
		if (projectId) {
			return state.scopeChanges.filter((c) => c.projectId === projectId);
		}
		return state.scopeChanges;
	},

	async createScopeChange(
		payload: Omit<ScopeChange, "id" | "createdAt" | "status">,
		actor = "User",
	): Promise<ScopeChange> {
		const state = loadLocalState();
		const newChange: ScopeChange = {
			...payload,
			id: `sc_${Date.now()}`,
			status: "Pending",
			createdAt: new Date().toISOString(),
		};
		state.scopeChanges = [newChange, ...state.scopeChanges];
		saveLocalState(state);

		await activityRepository.log({
			text: `Scope change submitted: ${newChange.title} (+${newChange.daysDelta}d, ₹${newChange.costDelta})`,
			actor,
			entityType: "scope_change",
			entityId: newChange.id,
		});

		return newChange;
	},
};
