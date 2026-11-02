import { describe, it, expect } from "../test-utils";
import { leadsRepository } from "../../src/lib/repositories/leads.repository";
import { clientsRepository } from "../../src/lib/repositories/clients.repository";
import { projectsRepository } from "../../src/lib/repositories/projects.repository";
import { tasksRepository } from "../../src/lib/repositories/tasks.repository";
import { handoffsRepository } from "../../src/lib/repositories/handoffs.repository";
import { workflowRepository } from "../../src/lib/repositories/workflow.repository";
import { activityRepository } from "../../src/lib/repositories/activity.repository";

describe("E2E CRM Workflow: Complete User Journey", () => {
	it("executes the full lifecycle: lead -> qualification -> client conversion -> project -> task -> handoff -> gate -> RACI -> scope change -> cleanup", async () => {
		const testSuffix = Date.now().toString();

		// 1. Create a new opportunity (Lead)
		const createdLead = await leadsRepository.create({
			name: `Apex Systems Test ${testSuffix}`,
			contact: "Marcus Vance",
			email: `marcus-${testSuffix}@apex.example`,
			service: "Next.js & Design System",
			value: 380000,
			stage: "New",
			owner: "Abhishek",
			followup: "2026-12-01",
			notes: "Initial discovery call scheduled",
		});

		expect(createdLead.id).toBeDefined();
		expect(createdLead.name).toBe(`Apex Systems Test ${testSuffix}`);
		expect(createdLead.stage).toBe("New");

		// 2. Edit Opportunity
		const updatedLead = await leadsRepository.update(createdLead.id, {
			stage: "Qualified",
			value: 420000,
			notes: "Scope validated. Moving to proposal preparation.",
		});
		expect(updatedLead.stage).toBe("Qualified");
		expect(updatedLead.value).toBe(420000);

		// 3. Convert Opportunity into Client Account (Idempotent conversion)
		const { lead: convertedLead, client: createdClient } =
			await leadsRepository.convertToClient(createdLead.id, "Abhishek");

		expect(createdClient.id).toBeDefined();
		expect(createdClient.name).toBe(`Apex Systems Test ${testSuffix}`);
		expect(convertedLead.stage).toBe("Won");
		expect(convertedLead.convertedClientId).toBe(createdClient.id);

		// 4. Create Delivery Project for the new Client
		const createdProject = await projectsRepository.create({
			clientId: createdClient.id,
			name: `Apex / Global Portal ${testSuffix}`,
			phase: "Discovery",
			budget: 420000,
			due: "2027-01-31",
			stackNeeded: "Next.js, Tailwind, PostgreSQL",
			assignedTeam: ["ansul", "shradha"],
			owner: "Shradha",
			scope: "Full-scale multi-region digital experience platform",
			progress: 15,
		});

		expect(createdProject.id).toBeDefined();
		expect(createdProject.clientId).toBe(createdClient.id);
		expect(createdProject.due).toBe("2027-01-31");

		// 5. Create Deliverable Task for this project
		const createdTask = await tasksRepository.create({
			projectId: createdProject.id,
			name: "Architecture Blueprint & API Schema",
			dept: "Frontend",
			owner: "Ansul",
			status: "In progress",
			priority: "High",
			due: "2026-12-15",
			description: "Specify REST & GraphQL endpoints with caching",
		});

		expect(createdTask.id).toBeDefined();
		expect(createdTask.projectId).toBe(createdProject.id);

		// 6. Update Task Status
		const updatedTask = await tasksRepository.update(createdTask.id, {
			status: "Completed",
		});
		expect(updatedTask.status).toBe("Completed");

		// 7. Milestone Quality Gates
		const gates = await workflowRepository.getProjectGates(createdProject.id);
		expect(gates.length).toBe(9);
		const approvedGate = await workflowRepository.updateGateStatus(
			createdProject.id,
			1,
			"Approved",
			"Abhishek",
		);
		expect(approvedGate.status).toBe("Approved");
		expect(approvedGate.approvedBy).toBe("Abhishek");

		// 8. Department Readiness Checklists
		await workflowRepository.toggleChecklistItem(
			createdProject.id,
			"Frontend-0",
			true,
		);
		const chk = await workflowRepository.getChecklistState(createdProject.id);
		expect(chk["Frontend-0"]).toBe(true);

		// 9. RACI Governance
		await workflowRepository.updateRaciAssignment(
			createdProject.id,
			"Technical Architecture",
			"CTO",
			"A/R",
		);
		const raci = await workflowRepository.getProjectRaci(createdProject.id);
		const arch = raci.find(
			(r) => r.deliverable === "Technical Architecture" && r.roleCode === "CTO",
		);
		expect(arch?.assignment).toBe("A/R");

		// 10. Department Handoff Transit
		const createdHandoff = await handoffsRepository.create({
			projectId: createdProject.id,
			title: "Design Tokens & Component Specs to Frontend",
			from: "Design",
			to: "Frontend",
			status: "Pending",
			due: "2026-12-20",
			description: "Figma variable library published and ready for token sync",
		});
		expect(createdHandoff.id).toBeDefined();

		const acceptedHandoff = await handoffsRepository.updateStatus(
			createdHandoff.id,
			"Accepted",
			"Ansul",
		);
		expect(acceptedHandoff.status).toBe("Accepted");

		// 11. Scope Delta Log
		const createdScopeChange = await workflowRepository.createScopeChange({
			projectId: createdProject.id,
			title: "Add OAuth SSO Support",
			category: "Scope",
			description: "Client requested Okta and Google Workspace SSO integration",
			costDelta: 60000,
			daysDelta: 4,
			requestedBy: "Marcus Vance",
		});
		expect(createdScopeChange.id).toBeDefined();
		expect(createdScopeChange.costDelta).toBe(60000);

		// 12. Verify Activity Audit Trail logged the events
		const activities = await activityRepository.list();
		expect(activities.length).toBeGreaterThan(0);

		// 13. Isolated Test Cleanup
		await tasksRepository.delete(createdTask.id);
		await leadsRepository.archive(createdLead.id);
		await clientsRepository.archive(createdClient.id);
		await projectsRepository.archive(createdProject.id);

		// Verify records cleaned up
		const remainingLeads = await leadsRepository.list();
		expect(remainingLeads.some((l) => l.id === createdLead.id)).toBe(false);

		const remainingClients = await clientsRepository.list();
		expect(remainingClients.some((c) => c.id === createdClient.id)).toBe(false);
	});
});
