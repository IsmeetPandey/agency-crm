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
				throw new Error(`Failed to list clients: ${error.message}`);
			}

			return (data || []).map((row) => ({
				id: row.id,
				legacyId: row.legacy_id || undefined,
				name: row.name,
				contact: row.contact_person || "",
				email: row.email || "",
				notes: row.notes || "",
				phone: row.phone || undefined,
				status: (row.status as "active" | "archived") || "active",
				createdAt: row.created_at,
			}));
		}

		const state = loadLocalState();
		return state.clients.filter((c) => c.status !== "archived");
	},

	async listArchived(): Promise<Client[]> {
		if (isSupabaseConfigured()) {
			const { data, error } = await supabase
				.from("clients")
				.select("*")
				.eq("status", "archived")
				.order("created_at", { ascending: false });

			if (error) {
				console.error("Supabase list archived clients error:", error);
				throw new Error(`Failed to list archived clients: ${error.message}`);
			}

			return (data || []).map((row) => ({
				id: row.id,
				legacyId: row.legacy_id || undefined,
				name: row.name,
				contact: row.contact_person || "",
				email: row.email || "",
				notes: row.notes || "",
				phone: row.phone || undefined,
				status: "archived" as const,
				createdAt: row.created_at,
			}));
		}

		const state = loadLocalState();
		return state.clients.filter((c) => c.status === "archived");
	},

	async getById(id: string): Promise<Client | null> {
		if (isSupabaseConfigured()) {
			const { data, error } = await supabase
				.from("clients")
				.select("*")
				.eq("id", id)
				.maybeSingle();

			if (error) {
				console.error("Supabase get client error:", error);
				throw new Error(`Failed to get client: ${error.message}`);
			}
			if (!data) return null;

			return {
				id: data.id,
				legacyId: data.legacy_id || undefined,
				name: data.name,
				contact: data.contact_person || "",
				email: data.email || "",
				notes: data.notes || "",
				phone: data.phone || undefined,
				status: (data.status as "active" | "archived") || "active",
				createdAt: data.created_at,
			};
		}

		const state = loadLocalState();
		return state.clients.find((c) => c.id === id) || null;
	},

	async create(
		payload: Omit<Client, "id"> & { id?: string },
		actor = "User",
	): Promise<Client> {
		const id =
			payload.id ||
			`c_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
		const newClient: Client = {
			...payload,
			id,
			status: "active",
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
					status: "active",
				})
				.select()
				.single();

			if (error) {
				console.error("Supabase create client error:", error);
				throw new Error(`Failed to create client: ${error.message}`);
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
				status: "active",
				createdAt: data.created_at,
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
			const dbUpdates: any = {};
			if (updates.name !== undefined) dbUpdates.name = updates.name;
			if (updates.contact !== undefined)
				dbUpdates.contact_person = updates.contact;
			if (updates.email !== undefined) dbUpdates.email = updates.email;
			if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
			if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
			if (updates.status !== undefined) dbUpdates.status = updates.status;

			const { data, error } = await supabase
				.from("clients")
				.update(dbUpdates)
				.eq("id", id)
				.select()
				.single();

			if (error) {
				console.error("Supabase update client error:", error);
				throw new Error(`Failed to update client: ${error.message}`);
			}

			return {
				id: data.id,
				legacyId: data.legacy_id || undefined,
				name: data.name,
				contact: data.contact_person || "",
				email: data.email || "",
				notes: data.notes || "",
				phone: data.phone || undefined,
				status: (data.status as "active" | "archived") || "active",
				createdAt: data.created_at,
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
			const { error } = await supabase
				.from("clients")
				.update({ status: "archived" })
				.eq("id", id);
			if (error) throw new Error(`Failed to archive client: ${error.message}`);
			return;
		}
		const state = loadLocalState();
		const client = state.clients.find((c) => c.id === id);
		if (client) {
			client.status = "archived";
			saveLocalState(state);
		}
	},

	async restore(id: string): Promise<void> {
		if (isSupabaseConfigured()) {
			const { error } = await supabase
				.from("clients")
				.update({ status: "active" })
				.eq("id", id);
			if (error) throw new Error(`Failed to restore client: ${error.message}`);
			return;
		}
		const state = loadLocalState();
		const client = state.clients.find((c) => c.id === id);
		if (client) {
			client.status = "active";
			saveLocalState(state);
		}
	},

	async deletePermanently(id: string): Promise<void> {
		if (isSupabaseConfigured()) {
			const { error } = await supabase.from("clients").delete().eq("id", id);
			if (error)
				throw new Error(
					`Failed to delete client permanently: ${error.message}`,
				);
			return;
		}
		const state = loadLocalState();
		state.clients = state.clients.filter((c) => c.id !== id);
		saveLocalState(state);
	},
};
