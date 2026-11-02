import type { FinanceItem, FinanceStatus, FinanceType } from "../../types";
import { activityRepository } from "./activity.repository";
import { loadLocalState, saveLocalState } from "./store";

export const financeRepository = {
	async list(clientId?: string, projectId?: string): Promise<FinanceItem[]> {
		const state = loadLocalState();
		let items = state.finance;
		if (clientId) {
			items = items.filter((f) => f.clientId === clientId);
		}
		if (projectId) {
			items = items.filter((f) => f.projectId === projectId);
		}
		return items;
	},

	async getById(id: string): Promise<FinanceItem | null> {
		const state = loadLocalState();
		return state.finance.find((f) => f.id === id) || null;
	},

	async create(
		payload: Omit<FinanceItem, "id" | "createdAt"> & { id?: string },
		actor = "User",
	): Promise<FinanceItem> {
		const id = payload.id || `fin_${Date.now()}`;
		const newItem: FinanceItem = {
			...payload,
			id,
			createdAt: new Date().toISOString(),
		};

		const state = loadLocalState();
		state.finance = [newItem, ...state.finance];
		saveLocalState(state);

		await activityRepository.log({
			text: `${newItem.type.toUpperCase()} created: ${newItem.title} (₹${newItem.amount.toLocaleString()})`,
			actor,
			entityType: "finance",
			entityId: id,
		});

		return newItem;
	},

	async update(
		id: string,
		updates: Partial<FinanceItem>,
	): Promise<FinanceItem> {
		const state = loadLocalState();
		const idx = state.finance.findIndex((f) => f.id === id);
		if (idx === -1) throw new Error(`Finance record ${id} not found`);

		const updated = { ...state.finance[idx], ...updates };
		state.finance[idx] = updated;
		saveLocalState(state);

		return updated;
	},

	async updateStatus(
		id: string,
		status: FinanceStatus,
		actor = "User",
	): Promise<FinanceItem> {
		const updates: Partial<FinanceItem> = { status };
		if (status === "Paid") {
			updates.paidDate = new Date().toISOString().slice(0, 10);
		}
		const updated = await this.update(id, updates);

		await activityRepository.log({
			text: `${updated.type.toUpperCase()} ${updated.title} marked as ${status}`,
			actor,
			entityType: "finance",
			entityId: id,
		});

		return updated;
	},

	async delete(id: string): Promise<void> {
		const state = loadLocalState();
		state.finance = state.finance.filter((f) => f.id !== id);
		saveLocalState(state);
	},
};
