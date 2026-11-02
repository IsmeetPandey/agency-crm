import type { Project, ProjectPhase } from "../../types";
import {
	DEFAULT_ORG_ID,
	isSupabaseConfigured,
	supabase,
} from "../supabase/client";
import { activityRepository } from "./activity.repository";
import { loadLocalState, saveLocalState } from "./store";

export const projectsRepository = {
	async list(clientId?: string, opportunityId?: string): Promise<Project[]> {
		if (isSupabaseConfigured()) {
			let query = supabase
				.from("projects")
				.select(`
          *,
          project_members (
            team_member_id
          )
        `)
				.eq("status", "active")
				.order("created_at", { ascending: false });

			if (clientId) query = query.eq("client_id", clientId);
			if (opportunityId) query = query.eq("opportunity_id", opportunityId);

			const { data, error } = await query;
			if (error) {
				console.error("Supabase list projects error:", error);
				throw new Error(`Failed to list projects: ${error.message}`);
			}

			return (data || []).map((row) => ({
				id: row.id,
				legacyId: row.legacy_id || undefined,
				name: row.name,
				clientId: row.client_id,
				opportunityId: row.opportunity_id || undefined,
				opportunityNo: row.opportunity_no || undefined,
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
				status: (row.status as "active" | "completed" | "archived") || "active",
			}));
		}

		const state = loadLocalState();
		let projects = state.projects.filter((p) => p.status !== "archived");
		if (clientId) projects = projects.filter((p) => p.clientId === clientId);
		if (opportunityId) projects = projects.filter((p) => p.opportunityId === opportunityId);
		return projects;
	},

	async listArchived(): Promise<Project[]> {
		if (isSupabaseConfigured()) {
			const { data, error } = await supabase
				.from("projects")
				.select(`
          *,
          project_members (
            team_member_id
          )
        `)
				.eq("status", "archived")
				.order("created_at", { ascending: false });

			if (error) {
				console.error("Supabase list archived projects error:", error);
				throw new Error(`Failed to list archived projects: ${error.message}`);
			}

			return (data || []).map((row) => ({
				id: row.id,
				legacyId: row.legacy_id || undefined,
				name: row.name,
				clientId: row.client_id,
				opportunityId: row.opportunity_id || undefined,
				opportunityNo: row.opportunity_no || undefined,
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
				status: "archived" as const,
			}));
		}

		const state = loadLocalState();
		return state.projects.filter((p) => p.status === "archived");
	},

	async getById(id: string): Promise<Project | null> {
		if (isSupabaseConfigured()) {
			const { data, error } = await supabase
				.from("projects")
				.select(`
          *,
          project_members (
            team_member_id
          )
        `)
				.eq("id", id)
				.maybeSingle();

			if (error) {
				console.error("Supabase get project error:", error);
				throw new Error(`Failed to get project: ${error.message}`);
			}
			if (!data) return null;

			return {
				id: data.id,
				legacyId: data.legacy_id || undefined,
				name: data.name,
				clientId: data.client_id,
				opportunityId: data.opportunity_id || undefined,
				opportunityNo: data.opportunity_no || undefined,
				phase: data.phase as ProjectPhase,
				stackNeeded: data.stack_needed || "",
				budget: Number(data.budget) || 0,
				due: data.due_date || "",
				owner: data.owner_name || "Unassigned",
				scope: data.scope || "",
				assignedTeam: ((data as any).project_members || []).map(
					(m: any) => m.team_member_id,
				),
				progress: data.progress || 0,
				status: (data.status as "active" | "completed" | "archived") || "active",
			};
		}

		const state = loadLocalState();
		return state.projects.find((p) => p.id === id) || null;
	},

	async create(
		payload: Omit<Project, "id"> & { id?: string },
		actor = "User",
	): Promise<Project> {
		const id = payload.id || `p${Date.now()}`;
		const newProject: Project = {
			...payload,
			id,
			status: "active",
		};

		if (isSupabaseConfigured()) {
			const { data, error } = await supabase
				.from("projects")
				.insert({
					organization_id: DEFAULT_ORG_ID,
					legacy_id: id,
					client_id: newProject.clientId,
					opportunity_id: newProject.opportunityId || null,
					opportunity_no: newProject.opportunityNo || null,
					name: newProject.name,
					phase: newProject.phase,
					stack_needed: newProject.stackNeeded,
					budget: newProject.budget,
					due_date: newProject.due || (newProject as any).deadline || null,
					owner_name: newProject.owner,
					scope: newProject.scope,
					progress: newProject.progress,
					status: "active",
				})
				.select()
				.single();

			if (error) {
				console.error("Supabase create project error:", error);
				throw new Error(`Failed to create project in database: ${error.message}`);
			}

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
			if (updates.opportunityId !== undefined)
				dbUpdates.opportunity_id = updates.opportunityId || null;
			if (updates.opportunityNo !== undefined)
				dbUpdates.opportunity_no = updates.opportunityNo || null;
			if (updates.phase !== undefined) dbUpdates.phase = updates.phase;
			if (updates.stackNeeded !== undefined)
				dbUpdates.stack_needed = updates.stackNeeded;
			if (updates.budget !== undefined) dbUpdates.budget = updates.budget;
			if (updates.due !== undefined) dbUpdates.due_date = updates.due || null;
			if (updates.owner !== undefined) dbUpdates.owner_name = updates.owner;
			if (updates.scope !== undefined) dbUpdates.scope = updates.scope;
			if (updates.progress !== undefined) dbUpdates.progress = updates.progress;
			if (updates.status !== undefined) dbUpdates.status = updates.status;

			const { data, error } = await supabase
				.from("projects")
				.update(dbUpdates)
				.eq("id", id)
				.select()
				.single();

			if (error) {
				console.error("Supabase update project error:", error);
				throw new Error(`Failed to update project: ${error.message}`);
			}

			return {
				id: data.id,
				legacyId: data.legacy_id || undefined,
				name: data.name,
				clientId: data.client_id,
				opportunityId: data.opportunity_id || undefined,
				opportunityNo: data.opportunity_no || undefined,
				phase: data.phase as ProjectPhase,
				stackNeeded: data.stack_needed || "",
				budget: Number(data.budget) || 0,
				due: data.due_date || "",
				owner: data.owner_name || "Unassigned",
				scope: data.scope || "",
				assignedTeam: updates.assignedTeam || [],
				progress: data.progress,
				status: (data.status as "active" | "completed" | "archived") || "active",
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
			const { error } = await supabase
				.from("projects")
				.update({ status: "archived" })
				.eq("id", id);
			if (error) throw new Error(`Failed to archive project: ${error.message}`);
			return;
		}
		const state = loadLocalState();
		const proj = state.projects.find((p) => p.id === id);
		if (proj) {
			proj.status = "archived";
			saveLocalState(state);
		}
	},

	async restore(id: string): Promise<void> {
		if (isSupabaseConfigured()) {
			const { error } = await supabase
				.from("projects")
				.update({ status: "active" })
				.eq("id", id);
			if (error) throw new Error(`Failed to restore project: ${error.message}`);
			return;
		}
		const state = loadLocalState();
		const proj = state.projects.find((p) => p.id === id);
		if (proj) {
			proj.status = "active";
			saveLocalState(state);
		}
	},

	async deletePermanently(id: string): Promise<void> {
		if (isSupabaseConfigured()) {
			const { error } = await supabase.from("projects").delete().eq("id", id);
			if (error) throw new Error(`Failed to delete project permanently: ${error.message}`);
			return;
		}
		const state = loadLocalState();
		state.projects = state.projects.filter((p) => p.id !== id);
		saveLocalState(state);
	},
};
