import type { Lead, LeadStage } from "../../types";
import {
	DEFAULT_ORG_ID,
	isSupabaseConfigured,
	supabase,
} from "../supabase/client";
import { activityRepository } from "./activity.repository";
import { clientsRepository } from "./clients.repository";
import { loadLocalState, saveLocalState } from "./store";

export const leadsRepository = {
	async list(): Promise<Lead[]> {
		if (isSupabaseConfigured()) {
			const { data, error } = await supabase
				.from("leads")
				.select("*")
				.eq("status", "active")
				.order("created_at", { ascending: false });

			if (error) {
				console.error("Supabase list leads error:", error);
				throw error;
			}

			return (data || []).map((row) => ({
				id: row.id,
				legacyId: row.legacy_id || undefined,
				name: row.name,
				contact: row.contact_person || "",
				email: row.email || "",
				service: row.service || "",
				value: Number(row.estimated_value) || 0,
				stage: row.stage as LeadStage,
				owner: row.owner_name || "Unassigned",
				followup: row.next_followup || "",
				notes: row.notes || "",
				convertedClientId: row.converted_to_client_id || undefined,
				convertedAt: row.converted_at || undefined,
			}));
		}

		const state = loadLocalState();
		return state.leads.filter((l) => l.status !== "archived");
	},

	async listArchived(): Promise<Lead[]> {
		if (isSupabaseConfigured()) {
			const { data, error } = await supabase
				.from("leads")
				.select("*")
				.eq("status", "archived")
				.order("created_at", { ascending: false });

			if (error) throw error;
			return (data || []).map((row) => ({
				id: row.id,
				legacyId: row.legacy_id || undefined,
				name: row.name,
				contact: row.contact_person || "",
				email: row.email || "",
				service: row.service || "",
				value: Number(row.estimated_value) || 0,
				stage: row.stage as LeadStage,
				owner: row.owner_name || "Unassigned",
				followup: row.next_followup || "",
				notes: row.notes || "",
				convertedClientId: row.converted_to_client_id || undefined,
				convertedAt: row.converted_at || undefined,
				status: "archived" as const,
			}));
		}

		const state = loadLocalState();
		return state.leads.filter((l) => l.status === "archived");
	},

	async create(payload: Omit<Lead, "id"> & { id?: string }): Promise<Lead> {
		const id = payload.id || `l${Date.now()}`;
		const newLead: Lead = {
			...payload,
			id,
		};

		if (isSupabaseConfigured()) {
			const { data, error } = await supabase
				.from("leads")
				.insert({
					organization_id: DEFAULT_ORG_ID,
					legacy_id: id,
					name: newLead.name,
					contact_person: newLead.contact,
					email: newLead.email,
					service: newLead.service,
					estimated_value: newLead.value,
					stage: newLead.stage,
					owner_name: newLead.owner,
					next_followup: newLead.followup || null,
					notes: newLead.notes,
				})
				.select()
				.single();

			if (error) {
				console.error("Supabase create lead error:", error);
				throw error;
			}

			await activityRepository.log({
				text: `Lead created: ${newLead.name} • ${newLead.service}`,
				actor: newLead.owner || "User",
				entityType: "lead",
				entityId: data.id,
			});

			return {
				...newLead,
				id: data.id,
			};
		}

		const state = loadLocalState();
		state.leads = [newLead, ...state.leads];
		saveLocalState(state);

		await activityRepository.log({
			text: `Lead created: ${newLead.name} • ${newLead.service}`,
			actor: newLead.owner || "User",
			entityType: "lead",
			entityId: id,
		});

		return newLead;
	},

	async update(id: string, updates: Partial<Lead>): Promise<Lead> {
		if (isSupabaseConfigured()) {
			const dbUpdates: Record<string, any> = {};
			if (updates.name !== undefined) dbUpdates.name = updates.name;
			if (updates.contact !== undefined)
				dbUpdates.contact_person = updates.contact;
			if (updates.email !== undefined) dbUpdates.email = updates.email;
			if (updates.service !== undefined) dbUpdates.service = updates.service;
			if (updates.value !== undefined)
				dbUpdates.estimated_value = updates.value;
			if (updates.stage !== undefined) dbUpdates.stage = updates.stage;
			if (updates.owner !== undefined) dbUpdates.owner_name = updates.owner;
			if (updates.followup !== undefined)
				dbUpdates.next_followup = updates.followup || null;
			if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

			const { data, error } = await supabase
				.from("leads")
				.update(dbUpdates)
				.eq("id", id)
				.select()
				.single();

			if (error) {
				console.error("Supabase update lead error:", error);
				throw error;
			}

			return {
				id: data.id,
				legacyId: data.legacy_id || undefined,
				name: data.name,
				contact: data.contact_person || "",
				email: data.email || "",
				service: data.service || "",
				value: Number(data.estimated_value) || 0,
				stage: data.stage as LeadStage,
				owner: data.owner_name || "Unassigned",
				followup: data.next_followup || "",
				notes: data.notes || "",
			};
		}

		const state = loadLocalState();
		const idx = state.leads.findIndex((l) => l.id === id);
		if (idx === -1) throw new Error(`Lead ${id} not found`);

		const updated = { ...state.leads[idx], ...updates };
		state.leads[idx] = updated;
		saveLocalState(state);

		return updated;
	},

	async updateStage(
		id: string,
		stage: LeadStage,
		actor = "User",
	): Promise<Lead> {
		const lead = await this.update(id, { stage });
		await activityRepository.log({
			text: `Stage moved: ${lead.name} → ${stage}`,
			actor,
			entityType: "lead",
			entityId: id,
		});
		return lead;
	},

	async convertToClient(leadId: string, actor = "User") {
		const list = await this.list();
		const lead = list.find((l) => l.id === leadId);
		if (!lead) throw new Error(`Lead ${leadId} not found`);

		// Check if client already exists (idempotent)
		const existingClients = await clientsRepository.list();
		let client = existingClients.find(
			(c) =>
				c.name.toLowerCase() === lead.name.toLowerCase() ||
				(lead.email && c.email.toLowerCase() === lead.email.toLowerCase()),
		);

		if (!client) {
			client = await clientsRepository.create({
				name: lead.name,
				contact: lead.contact,
				email: lead.email,
				notes: `Converted from lead. Original notes: ${lead.notes || "None"}`,
			});
		}

		// Mark lead as Won and link client
		const updatedLead = await this.update(leadId, {
			stage: "Won",
			convertedClientId: client.id,
			convertedAt: new Date().toISOString(),
		});

		await activityRepository.log({
			text: `Lead converted to client: ${lead.name} → ${client.name}`,
			actor,
			entityType: "client",
			entityId: client.id,
		});

		return { lead: updatedLead, client };
	},

	async archive(id: string): Promise<void> {
		if (isSupabaseConfigured()) {
			await supabase.from("leads").update({ status: "archived" }).eq("id", id);
			return;
		}
		const state = loadLocalState();
		const idx = state.leads.findIndex((l) => l.id === id);
		if (idx !== -1) {
			state.leads[idx].status = "archived";
			saveLocalState(state);
		}
	},

	async restore(id: string): Promise<void> {
		if (isSupabaseConfigured()) {
			await supabase.from("leads").update({ status: "active" }).eq("id", id);
			return;
		}
		const state = loadLocalState();
		const idx = state.leads.findIndex((l) => l.id === id);
		if (idx !== -1) {
			state.leads[idx].status = "active";
			saveLocalState(state);
		}
	},

	async deletePermanently(id: string): Promise<void> {
		if (isSupabaseConfigured()) {
			await supabase.from("leads").delete().eq("id", id);
			return;
		}
		const state = loadLocalState();
		state.leads = state.leads.filter((l) => l.id !== id);
		saveLocalState(state);
	},

	async bulkUpdateStage(ids: string[], stage: LeadStage): Promise<void> {
		if (isSupabaseConfigured()) {
			await supabase.from("leads").update({ stage }).in("id", ids);
			return;
		}
		const state = loadLocalState();
		for (const l of state.leads) {
			if (ids.includes(l.id)) {
				l.stage = stage;
			}
		}
		saveLocalState(state);
	},

	async bulkArchive(ids: string[]): Promise<void> {
		if (isSupabaseConfigured()) {
			await supabase.from("leads").update({ status: "archived" }).in("id", ids);
			return;
		}
		const state = loadLocalState();
		for (const l of state.leads) {
			if (ids.includes(l.id)) {
				l.status = "archived";
			}
		}
		saveLocalState(state);
	},
};
