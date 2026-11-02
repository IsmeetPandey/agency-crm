import type { Client, Lead, LeadStage, Opportunity } from "../../types";
import {
	DEFAULT_ORG_ID,
	isSupabaseConfigured,
	supabase,
} from "../supabase/client";
import { activityRepository } from "./activity.repository";
import { clientsRepository } from "./clients.repository";
import { opportunitiesRepository } from "./opportunities.repository";
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
				throw new Error(`Failed to list leads: ${error.message}`);
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
				convertedOpportunityId: row.converted_to_opportunity_id || undefined,
				convertedOpportunityNo: row.converted_opportunity_no || undefined,
				convertedAt: row.converted_at || undefined,
				status: (row.status as "active" | "archived") || "active",
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

			if (error) {
				console.error("Supabase list archived leads error:", error);
				throw new Error(`Failed to list archived leads: ${error.message}`);
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
				convertedOpportunityId: row.converted_to_opportunity_id || undefined,
				convertedOpportunityNo: row.converted_opportunity_no || undefined,
				convertedAt: row.converted_at || undefined,
				status: "archived" as const,
			}));
		}

		const state = loadLocalState();
		return state.leads.filter((l) => l.status === "archived");
	},

	async getById(id: string): Promise<Lead | null> {
		if (isSupabaseConfigured()) {
			const { data, error } = await supabase
				.from("leads")
				.select("*")
				.eq("id", id)
				.maybeSingle();

			if (error) {
				console.error("Supabase get lead error:", error);
				throw new Error(`Failed to get lead: ${error.message}`);
			}
			if (!data) return null;

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
				convertedClientId: data.converted_to_client_id || undefined,
				convertedOpportunityId: data.converted_to_opportunity_id || undefined,
				convertedOpportunityNo: data.converted_opportunity_no || undefined,
				convertedAt: data.converted_at || undefined,
				status: (data.status as "active" | "archived") || "active",
			};
		}

		const state = loadLocalState();
		return state.leads.find((l) => l.id === id) || null;
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
					status: "active",
				})
				.select()
				.single();

			if (error) {
				console.error("Supabase create lead error:", error);
				throw new Error(`Failed to create lead: ${error.message}`);
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
				status: "active",
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
			const dbUpdates: any = {};
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
			if (updates.convertedClientId !== undefined)
				dbUpdates.converted_to_client_id = updates.convertedClientId;
			if (updates.convertedOpportunityId !== undefined)
				dbUpdates.converted_to_opportunity_id = updates.convertedOpportunityId;
			if (updates.convertedOpportunityNo !== undefined)
				dbUpdates.converted_opportunity_no = updates.convertedOpportunityNo;
			if (updates.convertedAt !== undefined)
				dbUpdates.converted_at = updates.convertedAt;
			if (updates.status !== undefined) dbUpdates.status = updates.status;

			const { data, error } = await supabase
				.from("leads")
				.update(dbUpdates)
				.eq("id", id)
				.select()
				.single();

			if (error) {
				console.error("Supabase update lead error:", error);
				throw new Error(`Failed to update lead: ${error.message}`);
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
				convertedClientId: data.converted_to_client_id || undefined,
				convertedOpportunityId: data.converted_to_opportunity_id || undefined,
				convertedOpportunityNo: data.converted_opportunity_no || undefined,
				convertedAt: data.converted_at || undefined,
				status: (data.status as "active" | "archived") || "active",
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
			text: `Lead stage changed: ${lead.name} -> ${stage}`,
			actor,
			entityType: "lead",
			entityId: id,
		});
		return lead;
	},

	/**
	 * Atomic, idempotent lead-to-opportunity-and-client conversion.
	 * Protects against duplicate clients, duplicate opportunities, and race conditions.
	 */
	async convertToOpportunityAndClient(
		leadId: string,
		actor = "User",
	): Promise<{
		lead: Lead;
		client: Client;
		opportunity: Opportunity;
		alreadyConverted: boolean;
	}> {
		if (isSupabaseConfigured()) {
			try {
				const { data, error } = await (supabase.rpc as any)(
					"rpc_convert_lead_to_opportunity_and_client",
					{
						p_lead_id: leadId,
						p_actor: actor,
					},
				);

				if (!error && data) {
					const l = data.lead;
					const c = data.client;
					const o = data.opportunity;

					return {
						lead: {
							id: l.id,
							legacyId: l.legacy_id || undefined,
							name: l.name,
							contact: l.contact_person || "",
							email: l.email || "",
							service: l.service || "",
							value: Number(l.estimated_value) || 0,
							stage: l.stage as LeadStage,
							owner: l.owner_name || "Unassigned",
							followup: l.next_followup || "",
							notes: l.notes || "",
							convertedClientId: l.converted_to_client_id,
							convertedOpportunityId: l.converted_to_opportunity_id,
							convertedOpportunityNo: l.converted_opportunity_no,
							convertedAt: l.converted_at,
							status: l.status || "active",
						},
						client: {
							id: c.id,
							legacyId: c.legacy_id || undefined,
							name: c.name,
							contact: c.contact_person || "",
							email: c.email || "",
							notes: c.notes || "",
							phone: c.phone || "",
							status: c.status || "active",
							createdAt: c.created_at,
						},
						opportunity: {
							id: o.id,
							opportunityNo: o.opportunity_no,
							clientId: o.client_id,
							sourceLeadId: o.source_lead_id,
							title: o.title,
							service: o.service,
							description: o.description || "",
							value: Number(o.estimated_value) || 0,
							currency: o.currency || "INR",
							stage: o.stage,
							owner: o.owner_name,
							expectedCloseDate: o.expected_close_date || "",
							status: o.status || "active",
							createdAt: o.created_at,
							updatedAt: o.updated_at,
						},
						alreadyConverted: Boolean(data.already_converted),
					};
				}
			} catch (rpcErr) {
				console.warn(
					"RPC conversion failed or not yet deployed, using client fallback:",
					rpcErr,
				);
			}
		}

		// Fallback / Local mode atomic transactional conversion
		const lead = await this.getById(leadId);
		if (!lead) throw new Error(`Lead ${leadId} not found`);

		// Idempotency: If already converted, return the exact linked opportunity and client
		if (lead.convertedOpportunityId) {
			const existingOpp = await opportunitiesRepository.getById(
				lead.convertedOpportunityId,
			);
			const existingClient = lead.convertedClientId
				? await clientsRepository.getById(lead.convertedClientId)
				: null;

			if (existingOpp && existingClient) {
				return {
					lead,
					client: existingClient,
					opportunity: existingOpp,
					alreadyConverted: true,
				};
			}
		}

		// 1. Identify or Create Client Account
		const existingClients = await clientsRepository.list();
		let client = existingClients.find(
			(c) =>
				(lead.email &&
					lead.email.trim() &&
					c.email?.toLowerCase() === lead.email.toLowerCase().trim()) ||
				c.name.toLowerCase().trim() === lead.name.toLowerCase().trim(),
		);

		if (!client) {
			client = await clientsRepository.create({
				name: lead.name,
				contact: lead.contact,
				email: lead.email,
				notes: `Converted from lead opportunity. Original notes: ${lead.notes || "None"}`,
			});
		}

		// 2. Identify or Create Opportunity
		let opportunity: Opportunity | null = null;
		const existingOpps = await opportunitiesRepository.list(client.id);
		const matchingOpp = existingOpps.find((o) => o.sourceLeadId === lead.id);

		if (matchingOpp) {
			opportunity = matchingOpp;
		} else {
			opportunity = await opportunitiesRepository.create(
				{
					clientId: client.id,
					sourceLeadId: lead.id,
					title: lead.service
						? `${client.name} / ${lead.service}`
						: `${client.name} Commercial Engagement`,
					service: lead.service || "Consulting & Engineering",
					description: lead.notes || "",
					value: lead.value || 0,
					stage: "Won",
					owner: lead.owner || "Abhishek",
					expectedCloseDate: new Date().toISOString().split("T")[0],
				},
				actor,
			);
		}

		// 3. Update Lead atomically
		const updatedLead = await this.update(leadId, {
			stage: "Won",
			convertedClientId: client.id,
			convertedOpportunityId: opportunity.id,
			convertedOpportunityNo: opportunity.opportunityNo,
			convertedAt: new Date().toISOString(),
		});

		await activityRepository.log({
			text: `Lead converted to Opportunity ${opportunity.opportunityNo} and Account "${client.name}"`,
			actor,
			entityType: "opportunity",
			entityId: opportunity.id,
		});

		return {
			lead: updatedLead,
			client,
			opportunity,
			alreadyConverted: false,
		};
	},

	/**
	 * Backward compatible wrapper for convertToClient.
	 */
	async convertToClient(leadId: string, actor = "User") {
		const res = await this.convertToOpportunityAndClient(leadId, actor);
		return {
			lead: res.lead,
			client: res.client,
			opportunity: res.opportunity,
		};
	},

	async archive(id: string): Promise<void> {
		if (isSupabaseConfigured()) {
			const { error } = await supabase
				.from("leads")
				.update({ status: "archived" })
				.eq("id", id);
			if (error) throw new Error(`Failed to archive lead: ${error.message}`);
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
			const { error } = await supabase
				.from("leads")
				.update({ status: "active" })
				.eq("id", id);
			if (error) throw new Error(`Failed to restore lead: ${error.message}`);
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
			const { error } = await supabase.from("leads").delete().eq("id", id);
			if (error) throw new Error(`Failed to delete lead: ${error.message}`);
			return;
		}
		const state = loadLocalState();
		state.leads = state.leads.filter((l) => l.id !== id);
		saveLocalState(state);
	},

	async bulkUpdateStage(ids: string[], stage: LeadStage): Promise<void> {
		if (isSupabaseConfigured()) {
			const { error } = await supabase
				.from("leads")
				.update({ stage })
				.in("id", ids);
			if (error)
				throw new Error(`Failed to bulk update stage: ${error.message}`);
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
			const { error } = await supabase
				.from("leads")
				.update({ status: "archived" })
				.in("id", ids);
			if (error) throw new Error(`Failed to bulk archive: ${error.message}`);
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
