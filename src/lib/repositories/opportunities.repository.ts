import type { Opportunity, OpportunityStage } from "../../types";
import {
	DEFAULT_ORG_ID,
	isSupabaseConfigured,
	supabase,
} from "../supabase/client";
import { activityRepository } from "./activity.repository";
import {
	allocateNextOpportunityNumber,
	loadLocalState,
	saveLocalState,
} from "./store";

export const opportunitiesRepository = {
	async list(clientId?: string): Promise<Opportunity[]> {
		if (isSupabaseConfigured()) {
			let query = supabase
				.from("opportunities")
				.select("*")
				.eq("status", "active")
				.order("created_at", { ascending: false });

			if (clientId) {
				query = query.eq("client_id", clientId);
			}

			const { data, error } = await query;
			if (error) {
				console.error("Supabase list opportunities error:", error);
				throw new Error(`Failed to load opportunities: ${error.message}`);
			}

			return (data || []).map((row) => ({
				id: row.id,
				opportunityNo: row.opportunity_no,
				clientId: row.client_id,
				sourceLeadId: row.source_lead_id || undefined,
				title: row.title,
				service: row.service,
				description: row.description || "",
				value: Number(row.estimated_value) || 0,
				currency: row.currency || "INR",
				stage: row.stage as OpportunityStage,
				owner: row.owner_name || "Unassigned",
				expectedCloseDate: row.expected_close_date || "",
				status: row.status as "active" | "archived",
				createdAt: row.created_at,
				updatedAt: row.updated_at,
			}));
		}

		const state = loadLocalState();
		let opps = state.opportunities.filter((o) => o.status !== "archived");
		if (clientId) {
			opps = opps.filter((o) => o.clientId === clientId);
		}
		return opps;
	},

	async listArchived(): Promise<Opportunity[]> {
		if (isSupabaseConfigured()) {
			const { data, error } = await supabase
				.from("opportunities")
				.select("*")
				.eq("status", "archived")
				.order("created_at", { ascending: false });

			if (error) {
				console.error("Supabase list archived opportunities error:", error);
				throw new Error(
					`Failed to load archived opportunities: ${error.message}`,
				);
			}

			return (data || []).map((row) => ({
				id: row.id,
				opportunityNo: row.opportunity_no,
				clientId: row.client_id,
				sourceLeadId: row.source_lead_id || undefined,
				title: row.title,
				service: row.service,
				description: row.description || "",
				value: Number(row.estimated_value) || 0,
				currency: row.currency || "INR",
				stage: row.stage as OpportunityStage,
				owner: row.owner_name || "Unassigned",
				expectedCloseDate: row.expected_close_date || "",
				status: row.status as "active" | "archived",
				createdAt: row.created_at,
				updatedAt: row.updated_at,
			}));
		}

		const state = loadLocalState();
		return state.opportunities.filter((o) => o.status === "archived");
	},

	async getById(id: string): Promise<Opportunity | null> {
		if (isSupabaseConfigured()) {
			const { data, error } = await supabase
				.from("opportunities")
				.select("*")
				.eq("id", id)
				.maybeSingle();

			if (error) {
				console.error("Supabase get opportunity error:", error);
				throw new Error(`Failed to load opportunity: ${error.message}`);
			}
			if (!data) return null;

			return {
				id: data.id,
				opportunityNo: data.opportunity_no,
				clientId: data.client_id,
				sourceLeadId: data.source_lead_id || undefined,
				title: data.title,
				service: data.service,
				description: data.description || "",
				value: Number(data.estimated_value) || 0,
				currency: data.currency || "INR",
				stage: data.stage as OpportunityStage,
				owner: data.owner_name || "Unassigned",
				expectedCloseDate: data.expected_close_date || "",
				status: data.status as "active" | "archived",
				createdAt: data.created_at,
				updatedAt: data.updated_at,
			};
		}

		const state = loadLocalState();
		return state.opportunities.find((o) => o.id === id) || null;
	},

	async getByNo(opportunityNo: string): Promise<Opportunity | null> {
		if (isSupabaseConfigured()) {
			const { data, error } = await supabase
				.from("opportunities")
				.select("*")
				.eq("opportunity_no", opportunityNo.trim())
				.maybeSingle();

			if (error) {
				console.error("Supabase get opportunity by number error:", error);
				throw new Error(`Failed to locate opportunity: ${error.message}`);
			}
			if (!data) return null;

			return {
				id: data.id,
				opportunityNo: data.opportunity_no,
				clientId: data.client_id,
				sourceLeadId: data.source_lead_id || undefined,
				title: data.title,
				service: data.service,
				description: data.description || "",
				value: Number(data.estimated_value) || 0,
				currency: data.currency || "INR",
				stage: data.stage as OpportunityStage,
				owner: data.owner_name || "Unassigned",
				expectedCloseDate: data.expected_close_date || "",
				status: data.status as "active" | "archived",
				createdAt: data.created_at,
				updatedAt: data.updated_at,
			};
		}

		const state = loadLocalState();
		return (
			state.opportunities.find(
				(o) =>
					o.opportunityNo.toLowerCase() === opportunityNo.trim().toLowerCase(),
			) || null
		);
	},

	async create(
		payload: {
			clientId: string;
			title: string;
			service: string;
			description?: string;
			value: number;
			currency?: string;
			stage?: OpportunityStage;
			owner?: string;
			expectedCloseDate?: string;
			sourceLeadId?: string;
		},
		actor = "User",
	): Promise<Opportunity> {
		if (isSupabaseConfigured()) {
			const { data, error } = await supabase
				.from("opportunities")
				.insert({
					organization_id: DEFAULT_ORG_ID,
					client_id: payload.clientId,
					source_lead_id: payload.sourceLeadId || null,
					title: payload.title,
					service: payload.service,
					description: payload.description || null,
					estimated_value: payload.value,
					currency: payload.currency || "INR",
					stage: payload.stage || "Open",
					owner_name: payload.owner || "Unassigned",
					expected_close_date: payload.expectedCloseDate || null,
					status: "active",
				})
				.select()
				.single();

			if (error) {
				console.error("Supabase create opportunity error:", error);
				throw new Error(
					`Failed to create opportunity in database: ${error.message}`,
				);
			}

			const created: Opportunity = {
				id: data.id,
				opportunityNo: data.opportunity_no,
				clientId: data.client_id,
				sourceLeadId: data.source_lead_id || undefined,
				title: data.title,
				service: data.service,
				description: data.description || "",
				value: Number(data.estimated_value) || 0,
				currency: data.currency || "INR",
				stage: data.stage as OpportunityStage,
				owner: data.owner_name || "Unassigned",
				expectedCloseDate: data.expected_close_date || "",
				status: data.status as "active" | "archived",
				createdAt: data.created_at,
				updatedAt: data.updated_at,
			};

			await activityRepository.log({
				text: `Opportunity created: ${created.opportunityNo} • ${created.title} (₹${created.value.toLocaleString()})`,
				actor,
				entityType: "opportunity",
				entityId: created.id,
			});

			return created;
		}

		// Local transactional persistence
		const state = loadLocalState();
		const opportunityNo = allocateNextOpportunityNumber(state);
		const id = `opp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
		const now = new Date().toISOString();

		const newOpp: Opportunity = {
			id,
			opportunityNo,
			clientId: payload.clientId,
			sourceLeadId: payload.sourceLeadId,
			title: payload.title,
			service: payload.service,
			description: payload.description || "",
			value: payload.value,
			currency: payload.currency || "INR",
			stage: payload.stage || "Open",
			owner: payload.owner || "Unassigned",
			expectedCloseDate: payload.expectedCloseDate || "",
			status: "active",
			createdAt: now,
			updatedAt: now,
		};

		state.opportunities = [newOpp, ...state.opportunities];
		saveLocalState(state);

		await activityRepository.log({
			text: `Opportunity created: ${newOpp.opportunityNo} • ${newOpp.title} (₹${newOpp.value.toLocaleString()})`,
			actor,
			entityType: "opportunity",
			entityId: id,
		});

		return newOpp;
	},

	async update(
		id: string,
		updates: Partial<Omit<Opportunity, "id" | "opportunityNo" | "createdAt">>,
		actor = "User",
	): Promise<Opportunity> {
		if (isSupabaseConfigured()) {
			const dbUpdates: any = {};
			if (updates.title !== undefined) dbUpdates.title = updates.title;
			if (updates.service !== undefined) dbUpdates.service = updates.service;
			if (updates.description !== undefined)
				dbUpdates.description = updates.description;
			if (updates.value !== undefined)
				dbUpdates.estimated_value = updates.value;
			if (updates.stage !== undefined) dbUpdates.stage = updates.stage;
			if (updates.owner !== undefined) dbUpdates.owner_name = updates.owner;
			if (updates.expectedCloseDate !== undefined)
				dbUpdates.expected_close_date = updates.expectedCloseDate || null;
			if (updates.status !== undefined) dbUpdates.status = updates.status;

			const { data, error } = await supabase
				.from("opportunities")
				.update(dbUpdates)
				.eq("id", id)
				.select()
				.single();

			if (error) {
				console.error("Supabase update opportunity error:", error);
				throw new Error(`Failed to update opportunity: ${error.message}`);
			}

			const updated: Opportunity = {
				id: data.id,
				opportunityNo: data.opportunity_no,
				clientId: data.client_id,
				sourceLeadId: data.source_lead_id || undefined,
				title: data.title,
				service: data.service,
				description: data.description || "",
				value: Number(data.estimated_value) || 0,
				currency: data.currency || "INR",
				stage: data.stage as OpportunityStage,
				owner: data.owner_name || "Unassigned",
				expectedCloseDate: data.expected_close_date || "",
				status: data.status as "active" | "archived",
				createdAt: data.created_at,
				updatedAt: data.updated_at,
			};

			if (updates.stage) {
				await activityRepository.log({
					text: `Opportunity ${updated.opportunityNo} stage updated to ${updates.stage}`,
					actor,
					entityType: "opportunity",
					entityId: id,
				});
			}

			return updated;
		}

		const state = loadLocalState();
		const idx = state.opportunities.findIndex((o) => o.id === id);
		if (idx === -1) throw new Error(`Opportunity ${id} not found`);

		// Enforce immutability of opportunityNo and id
		const prev = state.opportunities[idx];
		const updated: Opportunity = {
			...prev,
			...updates,
			id: prev.id,
			opportunityNo: prev.opportunityNo,
			updatedAt: new Date().toISOString(),
		};

		state.opportunities[idx] = updated;
		saveLocalState(state);

		if (updates.stage && updates.stage !== prev.stage) {
			await activityRepository.log({
				text: `Opportunity ${updated.opportunityNo} stage updated to ${updates.stage}`,
				actor,
				entityType: "opportunity",
				entityId: id,
			});
		}

		return updated;
	},

	async archive(id: string): Promise<void> {
		if (isSupabaseConfigured()) {
			const { error } = await supabase
				.from("opportunities")
				.update({ status: "archived" })
				.eq("id", id);
			if (error) {
				throw new Error(`Failed to archive opportunity: ${error.message}`);
			}
			return;
		}

		const state = loadLocalState();
		const opp = state.opportunities.find((o) => o.id === id);
		if (opp) {
			opp.status = "archived";
			saveLocalState(state);
		}
	},

	async restore(id: string): Promise<void> {
		if (isSupabaseConfigured()) {
			const { error } = await supabase
				.from("opportunities")
				.update({ status: "active" })
				.eq("id", id);
			if (error) {
				throw new Error(`Failed to restore opportunity: ${error.message}`);
			}
			return;
		}

		const state = loadLocalState();
		const opp = state.opportunities.find((o) => o.id === id);
		if (opp) {
			opp.status = "active";
			saveLocalState(state);
		}
	},

	async deletePermanently(id: string): Promise<void> {
		if (isSupabaseConfigured()) {
			const { error } = await supabase
				.from("opportunities")
				.delete()
				.eq("id", id);
			if (error) {
				throw new Error(
					`Failed to delete opportunity permanently: ${error.message}`,
				);
			}
			return;
		}

		const state = loadLocalState();
		state.opportunities = state.opportunities.filter((o) => o.id !== id);
		saveLocalState(state);
	},
};
