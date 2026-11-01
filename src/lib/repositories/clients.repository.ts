import type { Client } from "../../types";
import {
	DEFAULT_ORG_ID,
	isSupabaseConfigured,
	supabase,
} from "../supabase/client";
import { activityRepository } from "./activity.repository";
import { loadLocalState, saveLocalState } from "./store";

export const clientsRepository = {
	async list(): Promise<Client[]> {
		if (isSupabaseConfigured()) {
			const { data, error } = await supabase
				.from("clients")
				.select("*")
				.eq("status", "active")
				.order("created_at", { ascending: false });

			if (error) {
				console.error("Supabase list clients error:", error);
				throw error;
			}

			return (data || []).map((row) => ({
				id: row.id,
				legacyId: row.legacy_id || undefined,
				name: row.name,
				contact: row.contact_person || "",
				email: row.email || "",
				notes: row.notes || "",
				phone: row.phone || undefined,
			}));
		}

		const state = loadLocalState();
		return state.clients;
	},

	async create(
		payload: Omit<Client, "id"> & { id?: string },
		actor = "User",
	): Promise<Client> {
		const id = payload.id || `c${Date.now()}`;
		const newClient: Client = {
			...payload,
			id,
		};

		if (isSupabaseConfigured()) {
			const { data, error } = await supabase
				.from("clients")
				.insert({
					organization_id: DEFAULT_ORG_ID,
					legacy_id: id,
					name: newClient.name,
					contact_person: newClient.contact,
					email: newClient.email,
					phone: newClient.phone || null,
					notes: newClient.notes,
				})
				.select()
				.single();

			if (error) {
				console.error("Supabase create client error:", error);
				throw error;
			}

			await activityRepository.log({
				text: `Client added: ${newClient.name}`,
				actor,
				entityType: "client",
				entityId: data.id,
			});

			return {
				...newClient,
				id: data.id,
			};
		}

		const state = loadLocalState();
		state.clients = [newClient, ...state.clients];
		saveLocalState(state);

		await activityRepository.log({
			text: `Client added: ${newClient.name}`,
			actor,
			entityType: "client",
			entityId: id,
		});

		return newClient;
	},

	async update(id: string, updates: Partial<Client>): Promise<Client> {
		if (isSupabaseConfigured()) {
			const dbUpdates: Record<string, any> = {};
			if (updates.name !== undefined) dbUpdates.name = updates.name;
			if (updates.contact !== undefined)
				dbUpdates.contact_person = updates.contact;
			if (updates.email !== undefined) dbUpdates.email = updates.email;
			if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
			if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

			const { data, error } = await supabase
				.from("clients")
				.update(dbUpdates)
				.eq("id", id)
				.select()
				.single();

			if (error) throw error;

			return {
				id: data.id,
				legacyId: data.legacy_id || undefined,
				name: data.name,
				contact: data.contact_person || "",
				email: data.email || "",
				notes: data.notes || "",
				phone: data.phone || undefined,
			};
		}

		const state = loadLocalState();
		const idx = state.clients.findIndex((c) => c.id === id);
		if (idx === -1) throw new Error(`Client ${id} not found`);

		const updated = { ...state.clients[idx], ...updates };
		state.clients[idx] = updated;
		saveLocalState(state);

		return updated;
	},

	async archive(id: string): Promise<void> {
		if (isSupabaseConfigured()) {
			await supabase
				.from("clients")
				.update({ status: "archived" })
				.eq("id", id);
			return;
		}
		const state = loadLocalState();
		state.clients = state.clients.filter((c) => c.id !== id);
		saveLocalState(state);
	},
};
