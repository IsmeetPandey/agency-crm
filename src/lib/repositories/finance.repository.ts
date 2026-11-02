import type { FinanceItem, FinanceStatus, FinanceType } from "../../types";
import {
	DEFAULT_ORG_ID,
	isSupabaseConfigured,
	supabase,
} from "../supabase/client";
import { activityRepository } from "./activity.repository";
import { loadLocalState, saveLocalState } from "./store";

async function validateFinanceRelationships(
	clientId: string,
	opportunityId?: string | null,
	projectId?: string | null,
): Promise<void> {
	if (!clientId) {
		throw new Error(
			"Invalid relationship: Client ID is required for financial records.",
		);
	}

	if (opportunityId) {
		let oppClient: string | undefined;
		if (isSupabaseConfigured()) {
			const { data } = await supabase
				.from("opportunities")
				.select("client_id")
				.eq("id", opportunityId)
				.maybeSingle();
			oppClient = data?.client_id;
		} else {
			const state = loadLocalState();
			oppClient = state.opportunities.find(
				(o) => o.id === opportunityId,
			)?.clientId;
		}

		if (oppClient && oppClient !== clientId) {
			throw new Error(
				`Invalid relationship: Opportunity ${opportunityId} belongs to client ${oppClient}, not client ${clientId}.`,
			);
		}
	}

	if (projectId) {
		let projClient: string | undefined;
		if (isSupabaseConfigured()) {
			const { data } = await supabase
				.from("projects")
				.select("client_id")
				.eq("id", projectId)
				.maybeSingle();
			projClient = data?.client_id;
		} else {
			const state = loadLocalState();
			projClient = state.projects.find((p) => p.id === projectId)?.clientId;
		}

		if (projClient && projClient !== clientId) {
			throw new Error(
				`Invalid relationship: Project ${projectId} belongs to client ${projClient}, not client ${clientId}.`,
			);
		}
	}
}

export const financeRepository = {
	async list(
		clientId?: string,
		projectId?: string,
		opportunityId?: string,
	): Promise<FinanceItem[]> {
		if (isSupabaseConfigured()) {
			let query = supabase
				.from("finance_records")
				.select("*")
				.order("issued_date", { ascending: false });

			if (clientId) query = query.eq("client_id", clientId);
			if (projectId) query = query.eq("project_id", projectId);
			if (opportunityId) query = query.eq("opportunity_id", opportunityId);

			const { data, error } = await query;
			if (error) {
				console.error("Supabase list finance error:", error);
				throw new Error(`Failed to load finance records: ${error.message}`);
			}

			return (data || []).map((row) => ({
				id: row.id,
				clientId: row.client_id,
				projectId: row.project_id || undefined,
				opportunityId: row.opportunity_id || undefined,
				opportunityNo: row.opportunity_no || undefined,
				type: row.type as FinanceType,
				title: row.title,
				amount: Number(row.amount) || 0,
				status: row.status as FinanceStatus,
				issuedDate: row.issued_date,
				issueDate: row.issued_date, // backward compatibility alias
				dueDate: row.due_date || undefined,
				paidDate: row.paid_date || undefined,
				notes: row.notes || "",
				createdAt: row.created_at,
			}));
		}

		const state = loadLocalState();
		let items = state.finance.map((f) => ({
			...f,
			issuedDate:
				f.issuedDate ||
				(f as any).issueDate ||
				new Date().toISOString().split("T")[0],
			issueDate: f.issuedDate || (f as any).issueDate,
		}));

		if (clientId) items = items.filter((f) => f.clientId === clientId);
		if (projectId) items = items.filter((f) => f.projectId === projectId);
		if (opportunityId)
			items = items.filter((f) => f.opportunityId === opportunityId);

		return items;
	},

	async getById(id: string): Promise<FinanceItem | null> {
		if (isSupabaseConfigured()) {
			const { data, error } = await supabase
				.from("finance_records")
				.select("*")
				.eq("id", id)
				.maybeSingle();

			if (error) {
				console.error("Supabase get finance error:", error);
				throw new Error(`Failed to load finance record: ${error.message}`);
			}
			if (!data) return null;

			return {
				id: data.id,
				clientId: data.client_id,
				projectId: data.project_id || undefined,
				opportunityId: data.opportunity_id || undefined,
				opportunityNo: data.opportunity_no || undefined,
				type: data.type as FinanceType,
				title: data.title,
				amount: Number(data.amount) || 0,
				status: data.status as FinanceStatus,
				issuedDate: data.issued_date,
				issueDate: data.issued_date,
				dueDate: data.due_date || undefined,
				paidDate: data.paid_date || undefined,
				notes: data.notes || "",
				createdAt: data.created_at,
			};
		}

		const state = loadLocalState();
		const item = state.finance.find((f) => f.id === id);
		if (!item) return null;
		const canonicalDate =
			item.issuedDate ||
			(item as any).issueDate ||
			new Date().toISOString().split("T")[0];
		return {
			...item,
			issuedDate: canonicalDate,
			issueDate: canonicalDate,
		};
	},

	async create(
		payload: Omit<FinanceItem, "id" | "createdAt"> & { id?: string },
		actor = "User",
	): Promise<FinanceItem> {
		const id =
			payload.id ||
			`fin_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
		const canonicalIssuedDate =
			payload.issuedDate ||
			(payload as any).issueDate ||
			new Date().toISOString().split("T")[0];

		await validateFinanceRelationships(
			payload.clientId,
			payload.opportunityId,
			payload.projectId,
		);

		if (isSupabaseConfigured()) {
			const { data, error } = await supabase
				.from("finance_records")
				.insert({
					organization_id: DEFAULT_ORG_ID,
					client_id: payload.clientId,
					project_id: payload.projectId || null,
					opportunity_id: payload.opportunityId || null,
					opportunity_no: payload.opportunityNo || null,
					type: payload.type,
					title: payload.title,
					amount: payload.amount,
					status: payload.status || "Draft",
					issued_date: canonicalIssuedDate,
					due_date: payload.dueDate || null,
					paid_date: payload.paidDate || null,
					notes: payload.notes || null,
				})
				.select()
				.single();

			if (error) {
				console.error("Supabase create finance record error:", error);
				throw new Error(`Failed to create financial record: ${error.message}`);
			}

			const created: FinanceItem = {
				id: data.id,
				clientId: data.client_id,
				projectId: data.project_id || undefined,
				opportunityId: data.opportunity_id || undefined,
				opportunityNo: data.opportunity_no || undefined,
				type: data.type as FinanceType,
				title: data.title,
				amount: Number(data.amount) || 0,
				status: data.status as FinanceStatus,
				issuedDate: data.issued_date,
				issueDate: data.issued_date,
				dueDate: data.due_date || undefined,
				paidDate: data.paid_date || undefined,
				notes: data.notes || "",
				createdAt: data.created_at,
			};

			await activityRepository.log({
				text: `${created.type.toUpperCase()} created: ${created.title} (₹${created.amount.toLocaleString()})`,
				actor,
				entityType: "finance",
				entityId: created.id,
			});

			return created;
		}

		const newItem: FinanceItem = {
			...payload,
			id,
			issuedDate: canonicalIssuedDate,
			issueDate: canonicalIssuedDate,
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
		const existing = await this.getById(id);
		if (!existing) throw new Error(`Finance record ${id} not found`);

		const effectiveClientId = updates.clientId || existing.clientId;
		const effectiveOppId =
			updates.opportunityId !== undefined
				? updates.opportunityId
				: existing.opportunityId;
		const effectiveProjId =
			updates.projectId !== undefined ? updates.projectId : existing.projectId;

		await validateFinanceRelationships(
			effectiveClientId,
			effectiveOppId,
			effectiveProjId,
		);

		if (isSupabaseConfigured()) {
			const dbUpdates: any = {};
			if (updates.clientId !== undefined)
				dbUpdates.client_id = updates.clientId;
			if (updates.title !== undefined) dbUpdates.title = updates.title;
			if (updates.type !== undefined) dbUpdates.type = updates.type;
			if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
			if (updates.status !== undefined) dbUpdates.status = updates.status;
			if (
				updates.issuedDate !== undefined ||
				(updates as any).issueDate !== undefined
			) {
				dbUpdates.issued_date =
					updates.issuedDate || (updates as any).issueDate;
			}
			if (updates.dueDate !== undefined)
				dbUpdates.due_date = updates.dueDate || null;
			if (updates.paidDate !== undefined)
				dbUpdates.paid_date = updates.paidDate || null;
			if (updates.notes !== undefined) dbUpdates.notes = updates.notes || null;
			if (updates.projectId !== undefined)
				dbUpdates.project_id = updates.projectId || null;
			if (updates.opportunityId !== undefined)
				dbUpdates.opportunity_id = updates.opportunityId || null;
			if (updates.opportunityNo !== undefined)
				dbUpdates.opportunity_no = updates.opportunityNo || null;

			const { data, error } = await supabase
				.from("finance_records")
				.update(dbUpdates)
				.eq("id", id)
				.select()
				.single();

			if (error) {
				console.error("Supabase update finance record error:", error);
				throw new Error(`Failed to update finance record: ${error.message}`);
			}

			return {
				id: data.id,
				clientId: data.client_id,
				projectId: data.project_id || undefined,
				opportunityId: data.opportunity_id || undefined,
				opportunityNo: data.opportunity_no || undefined,
				type: data.type as FinanceType,
				title: data.title,
				amount: Number(data.amount) || 0,
				status: data.status as FinanceStatus,
				issuedDate: data.issued_date,
				issueDate: data.issued_date,
				dueDate: data.due_date || undefined,
				paidDate: data.paid_date || undefined,
				notes: data.notes || "",
				createdAt: data.created_at,
			};
		}

		const state = loadLocalState();
		const idx = state.finance.findIndex((f) => f.id === id);
		if (idx === -1) throw new Error(`Finance record ${id} not found`);

		const updatedCanonical = {
			...state.finance[idx],
			...updates,
			issuedDate:
				updates.issuedDate ||
				(updates as any).issueDate ||
				state.finance[idx].issuedDate,
			issueDate:
				updates.issuedDate ||
				(updates as any).issueDate ||
				state.finance[idx].issuedDate,
		};
		state.finance[idx] = updatedCanonical;
		saveLocalState(state);

		return updatedCanonical;
	},

	async updateStatus(
		id: string,
		status: FinanceStatus,
		actor = "User",
	): Promise<FinanceItem> {
		const updates: Partial<FinanceItem> = { status };
		if (status === "Paid") {
			updates.paidDate = new Date().toISOString().split("T")[0];
		}
		const updated = await this.update(id, updates);

		await activityRepository.log({
			text: `${updated.type.toUpperCase()} marked as ${status}: ${updated.title}`,
			actor,
			entityType: "finance",
			entityId: id,
		});

		return updated;
	},

	async delete(id: string): Promise<void> {
		if (isSupabaseConfigured()) {
			const { error } = await supabase
				.from("finance_records")
				.delete()
				.eq("id", id);
			if (error) {
				console.error("Supabase delete finance record error:", error);
				throw new Error(`Failed to delete finance record: ${error.message}`);
			}
			return;
		}

		const state = loadLocalState();
		state.finance = state.finance.filter((f) => f.id !== id);
		saveLocalState(state);
	},
};
