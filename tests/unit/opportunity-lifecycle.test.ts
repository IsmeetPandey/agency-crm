import { describe, expect, it } from "../test-utils";
import { clientsRepository } from "../../src/lib/repositories/clients.repository";
import { leadsRepository } from "../../src/lib/repositories/leads.repository";
import { opportunitiesRepository } from "../../src/lib/repositories/opportunities.repository";

describe("Opportunity Lifecycle & SKU Allocation", () => {
	it("allocates monotonic sequential SKU numbers in KW-OPP-XXXXXX format without collisions", async () => {
		const client = await clientsRepository.create({
			name: `SKU Test Client ${Date.now()}`,
			status: "active",
			contact: "Test Contact",
			email: "sku@test.example",
			notes: "SKU test client",
		});

		const opp1 = await opportunitiesRepository.create({
			clientId: client.id,
			title: "Opportunity 1",
			service: "Design System",
			value: 100000,
			stage: "Open",
			owner: "Abhishek",
		});

		const opp2 = await opportunitiesRepository.create({
			clientId: client.id,
			title: "Opportunity 2",
			service: "Web Engineering",
			value: 200000,
			stage: "Qualified",
			owner: "Ansul",
		});

		expect(opp1.opportunityNo).toMatch(/^KW-OPP-\d{6}$/);
		expect(opp2.opportunityNo).toMatch(/^KW-OPP-\d{6}$/);
		expect(opp1.opportunityNo).not.toBe(opp2.opportunityNo);

		const num1 = parseInt(opp1.opportunityNo.replace("KW-OPP-", ""), 10);
		const num2 = parseInt(opp2.opportunityNo.replace("KW-OPP-", ""), 10);
		expect(num2).toBe(num1 + 1);
	});

	it("converts lead to existing client without duplicating client record", async () => {
		const existingClient = await clientsRepository.create({
			name: `Existing Corp ${Date.now()}`,
			status: "active",
			contact: "Sarah Connor",
			email: "sarah@cyberdyne.example",
			notes: "Existing account",
		});

		const lead = await leadsRepository.create({
			name: existingClient.name,
			contact: "Sarah Connor",
			email: "sarah@cyberdyne.example",
			service: "AI Strategy",
			value: 500000,
			stage: "Contacted",
			owner: "Abhishek",
			followup: "",
			notes: "Enterprise lead for existing client",
		});

		const conversion = await leadsRepository.convertToOpportunityAndClient(
			lead.id,
			{
				actor: "Abhishek",
				targetClientId: existingClient.id,
				initialStage: "Proposal",
				title: "Enterprise AI Strategy Q1",
			},
		);

		expect(conversion.client.id).toBe(existingClient.id);
		expect(conversion.opportunity.clientId).toBe(existingClient.id);
		expect(conversion.opportunity.stage).toBe("Proposal");
		expect(conversion.opportunity.title).toBe("Enterprise AI Strategy Q1");
		expect(conversion.lead.convertedClientId).toBe(existingClient.id);
		expect(conversion.lead.convertedOpportunityId).toBe(
			conversion.opportunity.id,
		);
		expect(conversion.lead.convertedOpportunityNo).toBe(
			conversion.opportunity.opportunityNo,
		);
		// Verified: transitions to Qualified, not falsely marked as Won!
		expect(conversion.lead.stage).toBe("Qualified");
	});

	it("defaults initial stage to Qualified (never false Won) when not specified", async () => {
		const lead = await leadsRepository.create({
			name: `New Prospect Corp ${Date.now()}`,
			contact: "John Doe",
			email: "john@newprospect.example",
			service: "Branding",
			value: 250000,
			stage: "New",
			owner: "Shradha",
			followup: "",
			notes: "Inbound discovery lead",
		});

		const conversion = await leadsRepository.convertToOpportunityAndClient(
			lead.id,
			{
				actor: "Shradha",
			},
		);

		expect(conversion.opportunity.stage).toBe("Qualified");
		expect(conversion.lead.stage).toBe("Qualified");
		expect(conversion.alreadyConverted).toBe(false);
	});

	it("preserves idempotency on repeated conversion attempts", async () => {
		const lead = await leadsRepository.create({
			name: `Idempotent Test ${Date.now()}`,
			contact: "Alice",
			email: "alice@test.example",
			service: "Mobile App",
			value: 300000,
			stage: "Contacted",
			owner: "Abhishek",
			followup: "",
			notes: "Testing idempotent conversion",
		});

		const first = await leadsRepository.convertToOpportunityAndClient(lead.id, {
			actor: "Abhishek",
		});
		const second = await leadsRepository.convertToOpportunityAndClient(
			lead.id,
			{
				actor: "Abhishek",
			},
		);

		expect(second.alreadyConverted).toBe(true);
		expect(second.opportunity.id).toBe(first.opportunity.id);
		expect(second.opportunity.opportunityNo).toBe(
			first.opportunity.opportunityNo,
		);
		expect(second.client.id).toBe(first.client.id);
	});
});
