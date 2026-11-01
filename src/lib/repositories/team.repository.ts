import type { TeamMemberDetail } from "../../types";
import { isSupabaseConfigured, supabase } from "../supabase/client";
import { loadLocalState, saveLocalState } from "./store";

export const teamRepository = {
	async list(): Promise<TeamMemberDetail[]> {
		if (isSupabaseConfigured()) {
			const { data, error } = await supabase
				.from("team_members")
				.select(`
          *,
          team_member_skills (skill),
          team_member_departments (
            is_learning,
            departments (code)
          ),
          availability_windows (start_hour, end_hour)
        `)
				.eq("status", "active");

			if (!error && data?.length) {
				return data.map((row: any) => ({
					id: row.id,
					legacyId: row.legacy_id || undefined,
					name: row.name,
					roleTitle: row.role_title,
					initials: row.initials,
					stack: (row.team_member_skills || []).map((s: any) => s.skill),
					avail: Number(row.avail_hours) || 4,
					focus: Number(row.focus_hours) || 3,
					slotRaw: row.slot_raw || "",
					slots: (row.availability_windows || []).map((w: any) => ({
						start: Number(w.start_hour),
						end: Number(w.end_hour),
					})),
					departments: (row.team_member_departments || [])
						.filter((d: any) => !d.is_learning)
						.map((d: any) => d.departments?.code || ""),
					learning: (row.team_member_departments || [])
						.filter((d: any) => d.is_learning)
						.map((d: any) => d.departments?.code || ""),
					accent: row.accent || "#007AFF",
					overload: row.is_overloaded,
					email: row.email,
				}));
			}
		}

		const state = loadLocalState();
		return state.team;
	},

	async update(
		id: string,
		updates: Partial<TeamMemberDetail>,
	): Promise<TeamMemberDetail> {
		const state = loadLocalState();
		const idx = state.team.findIndex((m) => m.id === id || m.legacyId === id);
		if (idx === -1) throw new Error(`Member ${id} not found`);

		const updated = { ...state.team[idx], ...updates };
		state.team[idx] = updated;
		saveLocalState(state);
		return updated;
	},

	async suggestTeam(
		techQuery: string,
	): Promise<{ member: TeamMemberDetail; score: number }[]> {
		const team = await this.list();
		const tokens = techQuery.toLowerCase().split(/[, ]+/).filter(Boolean);

		return team
			.map((m) => {
				let score = 0;
				const stackStr = m.stack.join(" ").toLowerCase();
				tokens.forEach((t) => {
					if (stackStr.includes(t)) score += 10;
				});
				score += m.avail + m.focus * 1.5;
				const peakOverlap = m.slots.some(
					(s) => (s.start <= 23 && s.end > 22) || s.start < 1 || s.start === 0,
				);
				if (peakOverlap) score += 5;
				if (m.overload) score -= 8;
				if (m.focus < 2.5) score -= 3;
				return { member: m, score };
			})
			.sort((a, b) => b.score - a.score)
			.slice(0, 4);
	},
};
