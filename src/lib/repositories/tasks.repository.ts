import type { Task, TaskPriority, TaskStatus } from "../../types";
import {
	DEFAULT_ORG_ID,
	isSupabaseConfigured,
	supabase,
} from "../supabase/client";
import { activityRepository } from "./activity.repository";
import { loadLocalState, saveLocalState } from "./store";

export const tasksRepository = {
	async list(): Promise<Task[]> {
		if (isSupabaseConfigured()) {
			const { data, error } = await supabase
				.from("tasks")
				.select("*")
				.order("created_at", { ascending: false });

			if (error) {
				console.error("Supabase list tasks error:", error);
				throw error;
			}

			return (data || []).map((row) => ({
				id: row.id,
				legacyId: row.legacy_id || undefined,
				projectId: row.project_id,
				name: row.title,
				dept: row.department_code,
				owner: row.assigned_to_name || "Unassigned",
				status: row.status as TaskStatus,
				priority: (row.priority as TaskPriority) || "Medium",
				due: row.due_date || "",
				description: row.description || "",
			}));
		}

		const state = loadLocalState();
		return state.tasks;
	},

	async create(
		payload: Omit<Task, "id"> & { id?: string },
		actor = "User",
	): Promise<Task> {
		const id = payload.id || `t${Date.now()}`;
		const newTask: Task = {
			...payload,
			id,
		};

		if (isSupabaseConfigured()) {
			const { data, error } = await supabase
				.from("tasks")
				.insert({
					organization_id: DEFAULT_ORG_ID,
					legacy_id: id,
					project_id: newTask.projectId,
					title: newTask.name,
					department_code: newTask.dept,
					assigned_to_name: newTask.owner,
					status: newTask.status,
					priority: newTask.priority || "Medium",
					due_date: newTask.due || null,
					description: newTask.description || null,
				})
				.select()
				.single();

			if (error) throw error;

			await activityRepository.log({
				text: `Task created: ${newTask.name} [${newTask.dept}]`,
				actor,
				entityType: "task",
				entityId: data.id,
			});

			return {
				...newTask,
				id: data.id,
			};
		}

		const state = loadLocalState();
		state.tasks = [newTask, ...state.tasks];
		saveLocalState(state);

		await activityRepository.log({
			text: `Task created: ${newTask.name} [${newTask.dept}]`,
			actor,
			entityType: "task",
			entityId: id,
		});

		return newTask;
	},

	async update(id: string, updates: Partial<Task>): Promise<Task> {
		if (isSupabaseConfigured()) {
			const dbUpdates: any = {};
			if (updates.name !== undefined) dbUpdates.title = updates.name;
			if (updates.dept !== undefined) dbUpdates.department_code = updates.dept;
			if (updates.owner !== undefined)
				dbUpdates.assigned_to_name = updates.owner;
			if (updates.status !== undefined) dbUpdates.status = updates.status;
			if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
			if (updates.due !== undefined) dbUpdates.due_date = updates.due || null;

			const { data, error } = await supabase
				.from("tasks")
				.update(dbUpdates)
				.eq("id", id)
				.select()
				.single();

			if (error) throw error;

			return {
				id: data.id,
				legacyId: data.legacy_id || undefined,
				projectId: data.project_id,
				name: data.title,
				dept: data.department_code,
				owner: data.assigned_to_name || "Unassigned",
				status: data.status as TaskStatus,
				priority: (data.priority as TaskPriority) || "Medium",
				due: data.due_date || "",
			};
		}

		const state = loadLocalState();
		const idx = state.tasks.findIndex((t) => t.id === id);
		if (idx === -1) throw new Error(`Task ${id} not found`);

		const updated = { ...state.tasks[idx], ...updates };
		state.tasks[idx] = updated;
		saveLocalState(state);

		return updated;
	},

	async delete(id: string): Promise<void> {
		if (isSupabaseConfigured()) {
			await supabase.from("tasks").delete().eq("id", id);
			return;
		}
		const state = loadLocalState();
		state.tasks = state.tasks.filter((t) => t.id !== id);
		saveLocalState(state);
	},
};
