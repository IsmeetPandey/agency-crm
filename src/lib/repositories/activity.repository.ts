import type { Activity } from "../../types";
import {
	DEFAULT_ORG_ID,
	isSupabaseConfigured,
	supabase,
} from "../supabase/client";
import { loadLocalState, saveLocalState } from "./store";

export const activityRepository = {
	async list(): Promise<Activity[]> {
		if (isSupabaseConfigured()) {
			const { data, error } = await supabase
				.from("activity_events")
				.select("*")
				.order("created_at", { ascending: false })
				.limit(100);

			if (error) {
				console.error("Supabase list activity error:", error);
				throw error;
			}

			return (data || []).map((row) => ({
				id: row.id,
				text: row.summary,
				at: row.created_at,
				actor: row.actor_name,
				entityType: row.entity_type,
				entityId: row.entity_id || undefined,
			}));
		}

		const state = loadLocalState();
		return state.activity;
	},

	async log(payload: {
		text: string;
		actor: string;
		entityType?: string;
		entityId?: string;
		action?: string;
	}): Promise<Activity> {
		const act: Activity = {
			id: `a${Date.now()}`,
			text: payload.text,
			at: new Date().toISOString(),
			actor: payload.actor || "System",
			entityType: payload.entityType,
			entityId: payload.entityId,
		};

		if (isSupabaseConfigured()) {
			const { data, error } = await supabase
				.from("activity_events")
				.insert({
					organization_id: DEFAULT_ORG_ID,
					actor_name: act.actor,
					summary: act.text,
					entity_type: payload.entityType || "general",
					entity_id: payload.entityId || null,
					action: payload.action || "log",
				})
				.select()
				.single();

			if (!error && data) {
				act.id = data.id;
			}
		}

		const state = loadLocalState();
		state.activity = [act, ...state.activity].slice(0, 100);
		saveLocalState(state);

		return act;
	},
};
