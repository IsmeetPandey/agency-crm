import type { Project, ProjectPhase } from "../../types";
import {
	DEFAULT_ORG_ID,
	isSupabaseConfigured,
	supabase,
} from "../supabase/client";
import { activityRepository } from "./activity.repository";
import { loadLocalState, saveLocalState } from "./store";

export const projectsRepository = {
	async list(): Promise<Project[]> {
		if (isSupabaseConfigured()) {
			const { data, error } = await supabase
				.from("projects")
				.select(`
          *,
          project_members (
            team_member_id
          )
        `)
				.eq("status", "active")
				.order("created_at", { ascending: false });

			if (error) {
				console.error("Supabase list projects error:", error);
				throw error;
			}

			return (data || []).map((row) => ({
				id: row.id,
				legacyId: row.legacy_id || undefined,
				name: row.name,
				clientId: row.client_id,
				phase: row.phase as ProjectPhase,
				stackNeeded: row.stack_needed || "",
				budget: Number(row.budget) || 0,
				due: row.due_date || "",
				owner: row.owner_name || "Unassigned",
				scope: row.scope || "",
				assignedTeam: ((row as any).project_members || []).map(
					(m: any) => m.team_member_id,
				),
				progress: row.progress || 0,
			}));
		}

		const state = loadLocalState();
		return state.projects;
	},

	async getById(id: string): Promise<Project | null> {
		const all = await this.list();
		return all.find((p) => p.id === id) || null;
	},

	async create(
		payload: Omit<Project, "id"> & { id?: string },
		actor = "User",
	): Promise<Project> {
		const id = payload.id || `p${Date.now()}`;
		const newProject: Project = {
			...payload,
			id,
		};

		if (isSupabaseConfigured()) {
			const { data, error } = await supabase
				.from("projects")
				.insert({
					organization_id: DEFAULT_ORG_ID,
					legacy_id: id,
					client_id: newProject.clientId,
					name: newProject.name,
					phase: newProject.phase,
					stack_needed: newProject.stackNeeded,
					budget: newProject.budget,
					due_date: newProject.due || null,
					owner_name: newProject.owner,
					scope: newProject.scope,
					progress: newProject.progress,
				})
				.select()
				.single();

			if (error) {
				console.error("Supabase create project error:", error);
				throw error;
			}

			// Add project members
			if (newProject.assignedTeam?.length) {
				await supabase.from("project_members").insert(
					newProject.assignedTeam.map((memberId) => ({
						project_id: data.id,
						team_member_id: memberId,
					})),
				);
			}

			await activityRepository.log({
				text: `Project created: ${newProject.name} with auto-team`,
				actor,
				entityType: "project",
				entityId: data.id,
			});

			return {
				...newProject,
				id: data.id,
			};
		}

		const state = loadLocalState();
		state.projects = [newProject, ...state.projects];
		saveLocalState(state);

		await activityRepository.log({
			text: `Project created: ${newProject.name} with auto-team`,
			actor,
			entityType: "project",
			entityId: id,
		});

		return newProject;
	},

	async update(id: string, updates: Partial<Project>): Promise<Project> {
		if (isSupabaseConfigured()) {
			const dbUpdates: Record<string, any> = {};
			if (updates.name !== undefined) dbUpdates.name = updates.name;
			if (updates.clientId !== undefined)
				dbUpdates.client_id = updates.clientId;
			if (updates.phase !== undefined) dbUpdates.phase = updates.phase;
			if (updates.stackNeeded !== undefined)
				dbUpdates.stack_needed = updates.stackNeeded;
			if (updates.budget !== undefined) dbUpdates.budget = updates.budget;
			if (updates.due !== undefined) dbUpdates.due_date = updates.due || null;
			if (updates.owner !== undefined) dbUpdates.owner_name = updates.owner;
			if (updates.scope !== undefined) dbUpdates.scope = updates.scope;
			if (updates.progress !== undefined) dbUpdates.progress = updates.progress;

			const { data, error } = await supabase
				.from("projects")
				.update(dbUpdates)
				.eq("id", id)
				.select()
				.single();

			if (error) throw error;

			return {
				id: data.id,
				legacyId: data.legacy_id || undefined,
				name: data.name,
				clientId: data.client_id,
				phase: data.phase as ProjectPhase,
				stackNeeded: data.stack_needed || "",
				budget: Number(data.budget) || 0,
				due: data.due_date || "",
				owner: data.owner_name || "Unassigned",
				scope: data.scope || "",
				assignedTeam: updates.assignedTeam || [],
				progress: data.progress,
			};
		}

		const state = loadLocalState();
		const idx = state.projects.findIndex((p) => p.id === id);
		if (idx === -1) throw new Error(`Project ${id} not found`);

		const updated = { ...state.projects[idx], ...updates };
		state.projects[idx] = updated;
		saveLocalState(state);

		return updated;
	},

	async archive(id: string): Promise<void> {
		if (isSupabaseConfigured()) {
			await supabase
				.from("projects")
				.update({ status: "archived" })
				.eq("id", id);
			return;
		}
		const state = loadLocalState();
		state.projects = state.projects.filter((p) => p.id !== id);
		saveLocalState(state);
	},
};
