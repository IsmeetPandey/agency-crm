import type { Handoff, HandoffStatus } from "../../types";
import {
	DEFAULT_ORG_ID,
	isSupabaseConfigured,
	supabase,
} from "../supabase/client";
import { activityRepository } from "./activity.repository";
import { loadLocalState, saveLocalState } from "./store";

export const handoffsRepository = {
	async list(): Promise<Handoff[]> {
		if (isSupabaseConfigured()) {
			const { data, error } = await supabase
				.from("handoffs")
				.select("*")
				.order("created_at", { ascending: false });

			if (error) {
				console.error("Supabase list handoffs error:", error);
				throw error;
			}

			return (data || []).map((row) => ({
				id: row.id,
				legacyId: row.legacy_id || undefined,
				projectId: row.project_id,
				title: row.title,
				from: row.from_dept,
				to: row.to_dept,
				status: row.status as HandoffStatus,
				due: row.due_date || "",
				description: row.description || "",
			}));
		}

		const state = loadLocalState();
		return state.handoffs;
	},

	async create(
		payload: Omit<Handoff, "id"> & { id?: string },
		actor = "User",
	): Promise<Handoff> {
		const id = payload.id || `h${Date.now()}`;
		const newHandoff: Handoff = {
			...payload,
			id,
		};

		if (isSupabaseConfigured()) {
			const { data, error } = await supabase
				.from("handoffs")
				.insert({
					organization_id: DEFAULT_ORG_ID,
					legacy_id: id,
					project_id: newHandoff.projectId,
					title: newHandoff.title,
					from_dept: newHandoff.from,
					to_dept: newHandoff.to,
					status: newHandoff.status,
					due_date: newHandoff.due || null,
					description: newHandoff.description || null,
				})
				.select()
				.single();

			if (error) throw error;

			await activityRepository.log({
				text: `Handoff created: ${newHandoff.from} → ${newHandoff.to} (${newHandoff.title})`,
				actor,
				entityType: "handoff",
				entityId: data.id,
			});

			return {
				...newHandoff,
				id: data.id,
			};
		}

		const state = loadLocalState();
		state.handoffs = [newHandoff, ...state.handoffs];
		saveLocalState(state);

		await activityRepository.log({
			text: `Handoff created: ${newHandoff.from} → ${newHandoff.to} (${newHandoff.title})`,
			actor,
			entityType: "handoff",
			entityId: id,
		});

		return newHandoff;
	},

	async updateStatus(
		id: string,
		status: HandoffStatus,
		actor = "User",
	): Promise<Handoff> {
		if (isSupabaseConfigured()) {
			const { data, error } = await supabase
				.from("handoffs")
				.update({
					status,
					accepted_by: actor,
					accepted_at: new Date().toISOString(),
				})
				.eq("id", id)
				.select()
				.single();

			if (error) throw error;

			await activityRepository.log({
				text: `Handoff status changed: ${data.title} → ${status}`,
				actor,
				entityType: "handoff",
				entityId: id,
			});

			return {
				id: data.id,
				legacyId: data.legacy_id || undefined,
				projectId: data.project_id,
				title: data.title,
				from: data.from_dept,
				to: data.to_dept,
				status: data.status as HandoffStatus,
				due: data.due_date || "",
			};
		}

		const state = loadLocalState();
		const idx = state.handoffs.findIndex((h) => h.id === id);
		if (idx === -1) throw new Error(`Handoff ${id} not found`);

		const updated: Handoff = { ...state.handoffs[idx], status };
		state.handoffs[idx] = updated;
		saveLocalState(state);

		await activityRepository.log({
			text: `Handoff status changed: ${updated.title} → ${status}`,
			actor,
			entityType: "handoff",
			entityId: id,
		});

		return updated;
	},
};
