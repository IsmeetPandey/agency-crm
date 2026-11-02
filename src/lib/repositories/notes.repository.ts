import type { Note } from "../../types";
import {
	DEFAULT_ORG_ID,
	isSupabaseConfigured,
	supabase,
} from "../supabase/client";
import { activityRepository } from "./activity.repository";
import { loadLocalState, saveLocalState } from "./store";

export const notesRepository = {
	async list(
		entityType: "lead" | "client" | "opportunity" | "project" | "task",
		entityId: string,
	): Promise<Note[]> {
		if (isSupabaseConfigured()) {
			const { data, error } = await supabase
				.from("notes")
				.select("*")
				.eq("entity_type", entityType)
				.eq("entity_id", entityId)
				.order("created_at", { ascending: false });

			if (error) {
				console.error("Supabase list notes error:", error);
				throw new Error(`Failed to list notes: ${error.message}`);
			}

			return (data || []).map((row) => ({
				id: row.id,
				entityType: row.entity_type as any,
				entityId: row.entity_id,
				author: row.author_name,
				content: row.content,
				createdAt: row.created_at,
			}));
		}

		const state = loadLocalState();
		return (state.notes || []).filter(
			(n) => n.entityType === entityType && n.entityId === entityId,
		);
	},

	async create(
		payload: {
			entityType?: "lead" | "client" | "opportunity" | "project" | "task";
			targetType?: "lead" | "client" | "opportunity" | "project" | "task";
			entityId?: string;
			targetId?: string;
			author: string;
			content: string;
			id?: string;
		},
	): Promise<Note> {
		const id = payload.id || `n_${Date.now()}`;
		const entityType = payload.entityType || payload.targetType || "opportunity";
		const entityId = payload.entityId || payload.targetId || "";

		if (isSupabaseConfigured()) {
			const { data, error } = await supabase
				.from("notes")
				.insert({
					organization_id: DEFAULT_ORG_ID,
					entity_type: entityType,
					entity_id: entityId,
					author_name: payload.author,
					content: payload.content,
				})
				.select()
				.single();

			if (error) {
				console.error("Supabase create note error:", error);
				throw new Error(`Failed to create note: ${error.message}`);
			}

			const created: Note = {
				id: data.id,
				entityType: data.entity_type as any,
				entityId: data.entity_id,
				author: data.author_name,
				content: data.content,
				createdAt: data.created_at,
			};

			await activityRepository.log({
				text: `Note added to ${created.entityType}: "${created.content.slice(0, 40)}..."`,
				actor: created.author,
				entityType: created.entityType,
				entityId: created.entityId,
			});

			return created;
		}

		const newNote: Note = {
			id,
			entityType,
			entityId,
			author: payload.author,
			content: payload.content,
			createdAt: new Date().toISOString(),
		};

		const state = loadLocalState();
		if (!state.notes) state.notes = [];
		state.notes = [newNote, ...state.notes];
		saveLocalState(state);

		await activityRepository.log({
			text: `Note added to ${newNote.entityType}: "${newNote.content.slice(0, 40)}..."`,
			actor: newNote.author,
			entityType: newNote.entityType,
			entityId: newNote.entityId,
		});

		return newNote;
	},

	async delete(id: string): Promise<void> {
		if (isSupabaseConfigured()) {
			const { error } = await supabase.from("notes").delete().eq("id", id);
			if (error) {
				console.error("Supabase delete note error:", error);
				throw new Error(`Failed to delete note: ${error.message}`);
			}
			return;
		}

		const state = loadLocalState();
		if (!state.notes) return;
		state.notes = state.notes.filter((n) => n.id !== id);
		saveLocalState(state);
	},
};
