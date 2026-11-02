import type { Note } from "../../types";
import { activityRepository } from "./activity.repository";
import { loadLocalState, saveLocalState } from "./store";

export const notesRepository = {
	async list(entityType: string, entityId: string): Promise<Note[]> {
		const state = loadLocalState();
		return (state.notes || []).filter(
			(n) => n.entityType === entityType && n.entityId === entityId,
		);
	},

	async create(
		payload: Omit<Note, "id" | "createdAt"> & { id?: string },
	): Promise<Note> {
		const id = payload.id || `n_${Date.now()}`;
		const newNote: Note = {
			...payload,
			id,
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
		const state = loadLocalState();
		if (!state.notes) return;
		state.notes = state.notes.filter((n) => n.id !== id);
		saveLocalState(state);
	},
};
