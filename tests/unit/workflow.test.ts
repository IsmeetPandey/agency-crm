import { describe, expect, it } from "bun:test";
import { activityRepository } from "../../src/lib/repositories/activity.repository";
import { clientsRepository } from "../../src/lib/repositories/clients.repository";
import { leadsRepository } from "../../src/lib/repositories/leads.repository";
import { workflowRepository } from "../../src/lib/repositories/workflow.repository";

describe("Workflow & Governance Repository", () => {
	it("initializes project gates from template and updates gate approval status", async () => {
		const testProjId = `p_test_gates_${Date.now()}`;
		const gates = await workflowRepository.getProjectGates(testProjId);

		expect(gates.length).toBeGreaterThan(0);
		expect(gates[0].stepNumber).toBe(1);

		// Approve gate 4
		const updatedGate = await workflowRepository.updateGateStatus(
			testProjId,
			4,
			"Approved",
			"Abhishek",
		);

		expect(updatedGate.status).toBe("Approved");
		expect(updatedGate.approvedBy).toBe("Abhishek");
		expect(updatedGate.approvedAt).toBeDefined();

		// Check persisted state
		const reloaded = await workflowRepository.getProjectGates(testProjId);
		const gate4 = reloaded.find((g) => g.stepNumber === 4);
		expect(gate4?.status).toBe("Approved");
		expect(gate4?.approvedBy).toBe("Abhishek");
	});

	it("persists checklist item state per project", async () => {
		const testProjId = `p_test_chk_${Date.now()}`;
		await workflowRepository.toggleChecklistItem(
			testProjId,
			"ENG-0",
			true,
		);
		await workflowRepository.toggleChecklistItem(
			testProjId,
			"DES-1",
			true,
		);

		const chk = await workflowRepository.getChecklistState(testProjId);
		expect(chk["ENG-0"]).toBe(true);
		expect(chk["DES-1"]).toBe(true);
		expect(chk["ENG-1"]).toBeUndefined();

		// Toggle back to false
		await workflowRepository.toggleChecklistItem(
			testProjId,
			"ENG-0",
			false,
		);
		const chkAfter = await workflowRepository.getChecklistState(testProjId);
		expect(chkAfter["ENG-0"]).toBe(false);
	});

	it("updates RACI deliverable assignments dynamically", async () => {
		const testProjId = `p_test_raci_${Date.now()}`;
		await workflowRepository.updateRaciAssignment(
			testProjId,
			"System Architecture",
			"ENG_LEAD",
			"A/R",
		);
		await workflowRepository.updateRaciAssignment(
			testProjId,
			"System Architecture",
			"PRODUCT",
			"C",
		);

		const raci = await workflowRepository.getProjectRaci(testProjId);
		const engLead = raci.find(
			(r) =>
				r.deliverable === "System Architecture" && r.roleCode === "ENG_LEAD",
		);
		const product = raci.find(
			(r) =>
				r.deliverable === "System Architecture" && r.roleCode === "PRODUCT",
		);

		expect(engLead?.assignment).toBe("A/R");
		expect(product?.assignment).toBe("C");
	});

	it("records scope changes with positive timeline delta and cost impact", async () => {
		const testProjId = `p_test_sc_${Date.now()}`;
		const change = await workflowRepository.createScopeChange(
			{
				projectId: testProjId,
				title: "Added Apple Pay Integration",
				reason: "Client request for European and US checkout expansion",
				daysDelta: 5,
				costDelta: 45000,
			},
			"Shreyas",
		);

		expect(change.id).toBeDefined();
		expect(change.daysDelta).toBe(5);
		expect(change.costDelta).toBe(45000);
		expect(change.status).toBe("Pending");

		const list = await workflowRepository.listScopeChanges(testProjId);
		expect(list.some((c) => c.title === "Added Apple Pay Integration")).toBe(
			true,
		);
	});

	it("updates lead fields and preserves unedited values", async () => {
		const lead = await leadsRepository.create({
			name: "Test Update Lead",
			contact: "Jordan Smith",
			email: "jordan@example.com",
			service: "Next.js Core",
			value: 120000,
			stage: "Qualified",
			owner: "Abhishek",
		});

		const updated = await leadsRepository.update(lead.id, {
			value: 175000,
			notes: "Budget updated after scoping call",
		});

		expect(updated.value).toBe(175000);
		expect(updated.notes).toBe("Budget updated after scoping call");
		expect(updated.name).toBe("Test Update Lead");
		expect(updated.contact).toBe("Jordan Smith");
	});

	it("updates client information cleanly", async () => {
		const client = await clientsRepository.create({
			name: "Acme Enterprise",
			contact: "Elena Vance",
			email: "elena@acme.example",
			phone: "+91 9876543210",
		});

		const updated = await clientsRepository.update(client.id, {
			phone: "+91 9999988888",
			notes: "Primary billing contact changed",
		});

		expect(updated.phone).toBe("+91 9999988888");
		expect(updated.notes).toBe("Primary billing contact changed");
		expect(updated.name).toBe("Acme Enterprise");
	});
});
