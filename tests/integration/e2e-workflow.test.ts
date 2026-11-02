import { describe, it, expect } from "../test-utils";
import { leadsRepository } from "../../src/lib/repositories/leads.repository";
import { clientsRepository } from "../../src/lib/repositories/clients.repository";
import { opportunitiesRepository } from "../../src/lib/repositories/opportunities.repository";
import { projectsRepository } from "../../src/lib/repositories/projects.repository";
import { tasksRepository } from "../../src/lib/repositories/tasks.repository";
import { handoffsRepository } from "../../src/lib/repositories/handoffs.repository";
import { workflowRepository } from "../../src/lib/repositories/workflow.repository";
import { activityRepository } from "../../src/lib/repositories/activity.repository";
import { financeRepository } from "../../src/lib/repositories/finance.repository";
import { notesRepository } from "../../src/lib/repositories/notes.repository";

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
		expect(convertedLead.stage).toBe("Qualified");
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

		// 12. Stakeholder Contact Management
		const { contactsRepository } = await import(
			"../../src/lib/repositories/contacts.repository"
		);
		const createdContact = await contactsRepository.create({
			clientId: createdClient.id,
			name: "Elena Rostova",
			role: "VP Engineering",
			email: `elena-${testSuffix}@apex.example`,
			isPrimary: true,
		});
		expect(createdContact.id).toBeDefined();
		expect(createdContact.isPrimary).toBe(true);

		const clientContacts = await contactsRepository.list(createdClient.id);
		expect(clientContacts.length).toBeGreaterThanOrEqual(1);

		// 13. Financial Milestone & Invoicing
		const { financeRepository } = await import(
			"../../src/lib/repositories/finance.repository"
		);
		const invoice = await financeRepository.create({
			title: "Phase 1 Discovery Milestone",
			type: "invoice",
			clientId: createdClient.id,
			projectId: createdProject.id,
			amount: 150000,
			status: "Sent",
			issuedDate: "2026-11-01",
		});
		expect(invoice.id).toBeDefined();
		expect(invoice.amount).toBe(150000);

		const paidInvoice = await financeRepository.updateStatus(invoice.id, "Paid");
		expect(paidInvoice.status).toBe("Paid");

		// 14. Lead Archive & Restore lifecycle
		await leadsRepository.archive(createdLead.id);
		const archived = await leadsRepository.listArchived();
		expect(archived.some((l) => l.id === createdLead.id)).toBe(true);

		await leadsRepository.restore(createdLead.id);
		const restoredLeads = await leadsRepository.list();
		expect(restoredLeads.some((l) => l.id === createdLead.id)).toBe(true);

		// 15. Verify Activity Audit Trail logged the events
		const activities = await activityRepository.list();
		expect(activities.length).toBeGreaterThan(0);

		// 16. Isolated Test Cleanup
		await tasksRepository.delete(createdTask.id);
		await contactsRepository.delete(createdContact.id);
		await financeRepository.delete(invoice.id);
		await leadsRepository.deletePermanently(createdLead.id);
		await clientsRepository.archive(createdClient.id);
		await projectsRepository.archive(createdProject.id);

		// Verify records cleaned up
		const remainingLeads = await leadsRepository.list();
		expect(remainingLeads.some((l) => l.id === createdLead.id)).toBe(false);

		const remainingClients = await clientsRepository.list();
		expect(remainingClients.some((c) => c.id === createdClient.id)).toBe(false);
	});

	it("manages commercial opportunities with sequence generation, idempotency, and cross-department references", async () => {
		const testSuffix = Date.now().toString();

		// 1. Inbound Lead creation
		const lead = await leadsRepository.create({
			name: `Omni Dynamics ${testSuffix}`,
			contact: "Rachel Green",
			email: `rachel-${testSuffix}@omni.example`,
			service: "Headless E-Commerce & ERP Integration",
			value: 650000,
			stage: "Proposal",
			owner: "Abhishek",
			followup: "2026-12-10",
			notes: "Enterprise multichannel platform overhaul",
		});

		// 2. Atomic lead to Opportunity & Client conversion
		const conversion = await leadsRepository.convertToOpportunityAndClient(lead.id, "Abhishek");
		expect(conversion.opportunity).toBeDefined();
		expect(conversion.opportunity.opportunityNo).toMatch(/^KW-OPP-\d{6}$/);
		expect(conversion.client.name).toBe(`Omni Dynamics ${testSuffix}`);
		// Truthful pipeline accounting: conversion defaults to Qualified/preserves stage, never forced Won
		expect(conversion.lead.stage).toBe("Proposal");
		expect(conversion.lead.convertedOpportunityId).toBe(conversion.opportunity.id);
		expect(conversion.lead.convertedOpportunityNo).toBe(conversion.opportunity.opportunityNo);

		const opp1No = conversion.opportunity.opportunityNo;

		// 3. Idempotency Verification: Repeated conversion must return the same opportunity and NOT increment sequence
		const repeatConversion = await leadsRepository.convertToOpportunityAndClient(lead.id, "Abhishek");
		expect(repeatConversion.opportunity.id).toBe(conversion.opportunity.id);
		expect(repeatConversion.opportunity.opportunityNo).toBe(opp1No);
		expect(repeatConversion.alreadyConverted).toBe(true);

		// 4. One Client may have Multiple Opportunities
		const opp2 = await opportunitiesRepository.create(
			{
				clientId: conversion.client.id,
				title: `Omni Dynamics / Native Mobile App ${testSuffix}`,
				service: "React Native Mobile App",
				description: "Phase 2 mobile consumer experience",
				value: 350000,
				stage: "Qualified",
				owner: "Shradha",
				expectedCloseDate: "2027-02-28",
			},
			"Abhishek",
		);

		expect(opp2.id).toBeDefined();
		expect(opp2.opportunityNo).toMatch(/^KW-OPP-\d{6}$/);
		expect(opp2.opportunityNo).not.toBe(opp1No); // Distinct sequential numbering
		expect(opp2.clientId).toBe(conversion.client.id);

		// Verify client has both opportunities
		const clientOpps = await opportunitiesRepository.list(conversion.client.id);
		expect(clientOpps.length).toBeGreaterThanOrEqual(2);

		// 5. Cross-Department Linking: Project references Opportunity
		const project = await projectsRepository.create({
			clientId: conversion.client.id,
			opportunityId: conversion.opportunity.id,
			opportunityNo: conversion.opportunity.opportunityNo,
			name: `Omni Commerce Engine ${testSuffix}`,
			phase: "Discovery",
			budget: 650000,
			due: "2027-03-31",
			stackNeeded: "Next.js, Shopify Plus, Node.js",
			assignedTeam: ["ansul"],
			owner: "Ansul",
			scope: "Full-scale store implementation",
			progress: 10,
		});

		expect(project.opportunityId).toBe(conversion.opportunity.id);
		expect(project.opportunityNo).toBe(conversion.opportunity.opportunityNo);

		// 6. Cross-Department Linking: Finance Item references Opportunity
		const invoice = await financeRepository.create({
			title: `Deposit Milestone - ${opp1No}`,
			type: "invoice",
			clientId: conversion.client.id,
			projectId: project.id,
			opportunityId: conversion.opportunity.id,
			opportunityNo: conversion.opportunity.opportunityNo,
			amount: 200000,
			status: "Sent",
			issuedDate: "2026-11-02",
		});

		expect(invoice.opportunityId).toBe(conversion.opportunity.id);
		expect(invoice.opportunityNo).toBe(conversion.opportunity.opportunityNo);

		// 7. Internal Opportunity Notes & Collaboration
		const note = await notesRepository.create({
			targetType: "opportunity",
			targetId: conversion.opportunity.id,
			content: "Client confirmed legal terms and NDA execution.",
			author: "Abhishek",
		});

		expect(note.id).toBeDefined();
		const oppNotes = await notesRepository.list("opportunity", conversion.opportunity.id);
		expect(oppNotes.some((n) => n.id === note.id)).toBe(true);

		// 8. Opportunity Stage Updates
		const updatedOpp = await opportunitiesRepository.update(conversion.opportunity.id, {
			stage: "Proposal",
			value: 700000,
		});
		expect(updatedOpp.stage).toBe("Proposal");
		expect(updatedOpp.value).toBe(700000);

		// 9. Universal Archive & Restore Lifecycle for Opportunity
		await opportunitiesRepository.archive(conversion.opportunity.id);
		const archivedOpps = await opportunitiesRepository.listArchived();
		expect(archivedOpps.some((o) => o.id === conversion.opportunity.id)).toBe(true);

		// Excluded from active list
		const activeOpps = await opportunitiesRepository.list();
		expect(activeOpps.some((o) => o.id === conversion.opportunity.id)).toBe(false);

		// Restore opportunity
		await opportunitiesRepository.restore(conversion.opportunity.id);
		const restoredOpps = await opportunitiesRepository.list();
		expect(restoredOpps.some((o) => o.id === conversion.opportunity.id)).toBe(true);

		// 10. Isolated Test Cleanup
		await notesRepository.delete(note.id);
		await financeRepository.delete(invoice.id);
		await projectsRepository.archive(project.id);
		await projectsRepository.deletePermanently(project.id);
		await opportunitiesRepository.deletePermanently(conversion.opportunity.id);
		await opportunitiesRepository.deletePermanently(opp2.id);
		await leadsRepository.deletePermanently(lead.id);
		await clientsRepository.deletePermanently(conversion.client.id);
	});
});
