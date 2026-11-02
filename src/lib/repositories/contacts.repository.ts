import type { Contact } from "../../types";
import {
	DEFAULT_ORG_ID,
	isSupabaseConfigured,
	supabase,
} from "../supabase/client";
import { activityRepository } from "./activity.repository";
import { loadLocalState, saveLocalState } from "./store";

export const contactsRepository = {
	async list(clientId?: string): Promise<Contact[]> {
		if (isSupabaseConfigured()) {
			let query = supabase
				.from("contacts")
				.select("*")
				.order("is_primary", { ascending: false })
				.order("name", { ascending: true });

			if (clientId) {
				query = query.eq("client_id", clientId);
			}

			const { data, error } = await query;
			if (error) {
				console.error("Supabase list contacts error:", error);
				throw new Error(`Failed to list contacts: ${error.message}`);
			}

			return (data || []).map((row) => ({
				id: row.id,
				clientId: row.client_id,
				name: row.name,
				role: row.role,
				email: row.email || "",
				phone: row.phone || "",
				isPrimary: Boolean(row.is_primary),
				notes: row.notes || "",
				createdAt: row.created_at,
			}));
		}

		const state = loadLocalState();
		if (clientId) {
			return state.contacts.filter((c) => c.clientId === clientId);
		}
		return state.contacts;
	},

	async getById(id: string): Promise<Contact | null> {
		if (isSupabaseConfigured()) {
			const { data, error } = await supabase
				.from("contacts")
				.select("*")
				.eq("id", id)
				.maybeSingle();

			if (error) {
				console.error("Supabase get contact error:", error);
				throw new Error(`Failed to get contact: ${error.message}`);
			}
			if (!data) return null;

			return {
				id: data.id,
				clientId: data.client_id,
				name: data.name,
				role: data.role,
				email: data.email || "",
				phone: data.phone || "",
				isPrimary: Boolean(data.is_primary),
				notes: data.notes || "",
				createdAt: data.created_at,
			};
		}

		const state = loadLocalState();
		return state.contacts.find((c) => c.id === id) || null;
	},

	async create(
		payload: Omit<Contact, "id" | "createdAt"> & { id?: string },
		actor = "User",
	): Promise<Contact> {
		const id = payload.id || `con_${Date.now()}`;

		if (isSupabaseConfigured()) {
			if (payload.isPrimary) {
				await supabase
					.from("contacts")
					.update({ is_primary: false })
					.eq("client_id", payload.clientId);
			}

			const { data, error } = await supabase
				.from("contacts")
				.insert({
					organization_id: DEFAULT_ORG_ID,
					client_id: payload.clientId,
					name: payload.name,
					role: payload.role || "Representative",
					email: payload.email || null,
					phone: payload.phone || null,
					is_primary: Boolean(payload.isPrimary),
					notes: payload.notes || null,
				})
				.select()
				.single();

			if (error) {
				console.error("Supabase create contact error:", error);
				throw new Error(
					`Failed to create contact in database: ${error.message}`,
				);
			}

			const created: Contact = {
				id: data.id,
				clientId: data.client_id,
				name: data.name,
				role: data.role,
				email: data.email || "",
				phone: data.phone || "",
				isPrimary: Boolean(data.is_primary),
				notes: data.notes || "",
				createdAt: data.created_at,
			};

			await activityRepository.log({
				text: `Contact added: ${created.name} (${created.role})`,
				actor,
				entityType: "contact",
				entityId: created.id,
			});

			return created;
		}

		const newContact: Contact = {
			...payload,
			id,
			createdAt: new Date().toISOString(),
		};

		const state = loadLocalState();

		if (newContact.isPrimary) {
			for (const c of state.contacts) {
				if (c.clientId === newContact.clientId) {
					c.isPrimary = false;
				}
			}
		}

		state.contacts = [newContact, ...state.contacts];
		saveLocalState(state);

		await activityRepository.log({
			text: `Contact added: ${newContact.name} (${newContact.role})`,
			actor,
			entityType: "contact",
			entityId: id,
		});

		return newContact;
	},

	async update(id: string, updates: Partial<Contact>): Promise<Contact> {
		if (isSupabaseConfigured()) {
			if (updates.isPrimary) {
				const contact = await this.getById(id);
				if (contact) {
					await supabase
						.from("contacts")
						.update({ is_primary: false })
						.eq("client_id", updates.clientId || contact.clientId);
				}
			}

			const dbUpdates: any = {};
			if (updates.name !== undefined) dbUpdates.name = updates.name;
			if (updates.role !== undefined) dbUpdates.role = updates.role;
			if (updates.email !== undefined) dbUpdates.email = updates.email || null;
			if (updates.phone !== undefined) dbUpdates.phone = updates.phone || null;
			if (updates.isPrimary !== undefined)
				dbUpdates.is_primary = Boolean(updates.isPrimary);
			if (updates.notes !== undefined) dbUpdates.notes = updates.notes || null;
			if (updates.clientId !== undefined)
				dbUpdates.client_id = updates.clientId;

			const { data, error } = await supabase
				.from("contacts")
				.update(dbUpdates)
				.eq("id", id)
				.select()
				.single();

			if (error) {
				console.error("Supabase update contact error:", error);
				throw new Error(`Failed to update contact: ${error.message}`);
			}

			return {
				id: data.id,
				clientId: data.client_id,
				name: data.name,
				role: data.role,
				email: data.email || "",
				phone: data.phone || "",
				isPrimary: Boolean(data.is_primary),
				notes: data.notes || "",
				createdAt: data.created_at,
			};
		}

		const state = loadLocalState();
		const idx = state.contacts.findIndex((c) => c.id === id);
		if (idx === -1) throw new Error(`Contact ${id} not found`);

		if (updates.isPrimary) {
			const clientId = updates.clientId || state.contacts[idx].clientId;
			for (const c of state.contacts) {
				if (c.clientId === clientId) {
					c.isPrimary = false;
				}
			}
		}

		const updated = { ...state.contacts[idx], ...updates };
		state.contacts[idx] = updated;
		saveLocalState(state);

		return updated;
	},

	async setPrimary(contactId: string, clientId: string): Promise<void> {
		if (isSupabaseConfigured()) {
			await supabase
				.from("contacts")
				.update({ is_primary: false })
				.eq("client_id", clientId);

			const { error } = await supabase
				.from("contacts")
				.update({ is_primary: true })
				.eq("id", contactId);

			if (error) {
				console.error("Supabase setPrimary contact error:", error);
				throw new Error(`Failed to set primary contact: ${error.message}`);
			}
			return;
		}

		const state = loadLocalState();
		for (const c of state.contacts) {
			if (c.clientId === clientId) {
				c.isPrimary = c.id === contactId;
			}
		}
		saveLocalState(state);
	},

	async delete(id: string): Promise<void> {
		if (isSupabaseConfigured()) {
			const { error } = await supabase.from("contacts").delete().eq("id", id);
			if (error) {
				console.error("Supabase delete contact error:", error);
				throw new Error(`Failed to delete contact: ${error.message}`);
			}
			return;
		}

		const state = loadLocalState();
		state.contacts = state.contacts.filter((c) => c.id !== id);
		saveLocalState(state);
	},
};
