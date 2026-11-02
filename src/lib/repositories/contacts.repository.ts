import type { Contact } from "../../types";
import { activityRepository } from "./activity.repository";
import { loadLocalState, saveLocalState } from "./store";

export const contactsRepository = {
	async list(clientId?: string): Promise<Contact[]> {
		const state = loadLocalState();
		if (clientId) {
			return state.contacts.filter((c) => c.clientId === clientId);
		}
		return state.contacts;
	},

	async getById(id: string): Promise<Contact | null> {
		const state = loadLocalState();
		return state.contacts.find((c) => c.id === id) || null;
	},

	async create(
		payload: Omit<Contact, "id" | "createdAt"> & { id?: string },
		actor = "User",
	): Promise<Contact> {
		const id = payload.id || `con_${Date.now()}`;
		const newContact: Contact = {
			...payload,
			id,
			createdAt: new Date().toISOString(),
		};

		const state = loadLocalState();

		// If new contact is set as primary, unset other primary contacts for this client
		if (newContact.isPrimary) {
			for (const c of state.contacts) {
				if (c.clientId === newContact.clientId) {
					c.isPrimary = false;
				}
			}
		}

		state.contacts = [newContact, ...state.contacts];
		saveLocalState(state);

		await activityRepository.log({
			text: `Contact added: ${newContact.name} (${newContact.role})`,
			actor,
			entityType: "contact",
			entityId: id,
		});

		return newContact;
	},

	async update(id: string, updates: Partial<Contact>): Promise<Contact> {
		const state = loadLocalState();
		const idx = state.contacts.findIndex((c) => c.id === id);
		if (idx === -1) throw new Error(`Contact ${id} not found`);

		if (updates.isPrimary) {
			const clientId = updates.clientId || state.contacts[idx].clientId;
			for (const c of state.contacts) {
				if (c.clientId === clientId) {
					c.isPrimary = false;
				}
			}
		}

		const updated = { ...state.contacts[idx], ...updates };
		state.contacts[idx] = updated;
		saveLocalState(state);

		return updated;
	},

	async setPrimary(clientId: string, contactId: string): Promise<void> {
		const state = loadLocalState();
		for (const c of state.contacts) {
			if (c.clientId === clientId) {
				c.isPrimary = c.id === contactId;
			}
		}
		saveLocalState(state);
	},

	async delete(id: string): Promise<void> {
		const state = loadLocalState();
		state.contacts = state.contacts.filter((c) => c.id !== id);
		saveLocalState(state);
	},
};
