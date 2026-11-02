import assert from "node:assert/strict";
import test from "node:test";
import { loadAuthoritativeRole } from "../../src/lib/auth/auth.context";
import { PERMISSIONS, type UserRole } from "../../src/lib/permissions/permissions";
import { clientsRepository } from "../../src/lib/repositories/clients.repository";
import { financeRepository } from "../../src/lib/repositories/finance.repository";
import { opportunitiesRepository } from "../../src/lib/repositories/opportunities.repository";
import { projectsRepository } from "../../src/lib/repositories/projects.repository";
import { backupService } from "../../src/lib/services/backup.service";
import { formatMultiCurrency, sumByCurrency } from "../../src/lib/utils/format";

test("Security: loadAuthoritativeRole rejects untrusted user_metadata and fails closed", async () => {
	// Attacker tries to inject { role: "owner" } into user_metadata
	const maliciousSession = {
		user: {
			id: "attacker-user-id",
			email: "attacker@external.com",
			user_metadata: {
				role: "owner",
				is_superadmin: true,
			},
		},
	} as any;

	// In the absence of a verified organization membership record, authoritative role must fail closed to "member"
	const authoritativeRole = await loadAuthoritativeRole(maliciousSession);
	assert.equal(
		authoritativeRole,
		"member",
		"Attacker role injection via user_metadata must be ignored; role must fail closed to member",
	);
});

test("Security: Role simulator preview does not authorize actual exports or destructive actions", () => {
	const realRole: UserRole = "member";
	const simulatedRole: UserRole = "owner";

	// Real permission check must evaluate realRole
	const isExportAuthorized = PERMISSIONS.canExportData(realRole);
	assert.equal(
		isExportAuthorized,
		false,
		"Member must not be authorized to export data even if owner role is simulated in UI preview",
	);

	const isDeleteOrgAuthorized = PERMISSIONS.canDeleteOrganization(realRole);
	assert.equal(
		isDeleteOrgAuthorized,
		false,
		"Member must not be authorized to delete organization",
	);

	// Preview evaluation is separate
	assert.equal(PERMISSIONS.canExportData(simulatedRole), true);
});

test("Finance Integrity: Reject creating record with opportunity belonging to a different client", async () => {
	const clientA = await clientsRepository.create({
		name: `Client Alpha ${Date.now()}`,
		contact: "Alpha Contact",
		email: "alpha@test.com",
		notes: "Alpha client",
		status: "active",
	});

	const clientB = await clientsRepository.create({
		name: `Client Beta ${Date.now()}`,
		contact: "Beta Contact",
		email: "beta@test.com",
		notes: "Beta client",
		status: "active",
	});

	const oppA = await opportunitiesRepository.create({
		clientId: clientA.id,
		title: "Alpha Growth Engine",
		service: "Web Platform",
		value: 100000,
		currency: "INR",
		stage: "Proposal",
		owner: "Ansul",
	});

	// Attempting to associate oppA (belongs to clientA) with clientB must throw an error
	await assert.rejects(
		async () => {
			await financeRepository.create({
				title: "Mismatched Invoice",
				type: "invoice",
				clientId: clientB.id, // Mismatched client!
				opportunityId: oppA.id,
				opportunityNo: oppA.opportunityNo,
				amount: 50000,
				status: "Draft",
				issuedDate: "2026-11-01",
			});
		},
		{
			message: /Invalid relationship/i,
		},
		"Repository must reject creating finance records linked to an opportunity of another client",
	);
});

test("Finance Integrity: Reject updating finance record to mismatched opportunity", async () => {
	const client1 = await clientsRepository.create({
		name: `Client One ${Date.now()}`,
		contact: "Client One Contact",
		email: "client1@test.com",
		notes: "Client 1",
		status: "active",
	});

	const client2 = await clientsRepository.create({
		name: `Client Two ${Date.now()}`,
		contact: "Client Two Contact",
		email: "client2@test.com",
		notes: "Client 2",
		status: "active",
	});

	const opp2 = await opportunitiesRepository.create({
		clientId: client2.id,
		title: "Client 2 Deal",
		service: "Branding",
		value: 75000,
		currency: "USD",
		stage: "Qualified",
		owner: "Shradha",
	});

	// Create valid record for client1
	const item = await financeRepository.create({
		title: "Valid Retainer Invoice",
		type: "invoice",
		clientId: client1.id,
		amount: 25000,
		status: "Draft",
		issuedDate: "2026-11-01",
	});

	// Attempt to update item (belongs to client1) with opp2 (belongs to client2)
	await assert.rejects(
		async () => {
			await financeRepository.update(item.id, {
				opportunityId: opp2.id,
			});
		},
		{
			message: /Invalid relationship/i,
		},
		"Repository must reject updates introducing cross-client opportunity relationships",
	);
});

test("Finance Integrity: Reject project belonging to another client", async () => {
	const clientX = await clientsRepository.create({
		name: `Client X ${Date.now()}`,
		contact: "Client X Contact",
		email: "clientx@test.com",
		notes: "Client X",
		status: "active",
	});

	const clientY = await clientsRepository.create({
		name: `Client Y ${Date.now()}`,
		contact: "Client Y Contact",
		email: "clienty@test.com",
		notes: "Client Y",
		status: "active",
	});

	const projectX = await projectsRepository.create({
		clientId: clientX.id,
		name: "Health Platform 2.0",
		phase: "Build",
		budget: 200000,
		due: "2026-12-31",
		owner: "Ansul",
		scope: "Comprehensive architecture",
		assignedTeam: [],
		stackNeeded: "React, Node",
		progress: 20,
	});

	// Attempt linking projectX (clientX) with clientY
	await assert.rejects(
		async () => {
			await financeRepository.create({
				title: "Invalid Cross-Client Project Invoice",
				type: "invoice",
				clientId: clientY.id,
				projectId: projectX.id,
				amount: 40000,
				status: "Draft",
				issuedDate: "2026-11-01",
			});
		},
		{
			message: /Invalid relationship/i,
		},
	);
});

test("Currency Integrity: sumByCurrency and formatMultiCurrency avoid false blended summation", () => {
	const testDeals = [
		{ value: 100000, currency: "INR" },
		{ value: 50000, currency: "INR" },
		{ value: 2000, currency: "USD" },
		{ value: 1500, currency: "EUR" },
		{ value: 0, currency: "USD" },
	];

	const sums = sumByCurrency(testDeals);
	assert.equal(sums.INR, 150000, "INR amounts must sum together");
	assert.equal(sums.USD, 2000, "USD amounts must sum separately");
	assert.equal(sums.EUR, 1500, "EUR amounts must sum separately");

	const formatted = formatMultiCurrency(sums);
	assert.ok(
		formatted.includes("₹1,50,000") || formatted.includes("₹150,000"),
		"Formatted string must present INR correctly",
	);
	assert.ok(
		formatted.includes("$2,000"),
		"Formatted string must present USD separately",
	);
	assert.ok(
		formatted.includes("€1,500"),
		"Formatted string must present EUR separately",
	);
});

test("Backup Integrity: Authoritative backup service gathers all 16 domains with schema version 3.2.0", async () => {
	const backup = await backupService.createBackup("auditor@kreatiwit.com", "owner");

	assert.equal(backup.agency, "Kreatiwit AgencyOS");
	assert.equal(backup.schemaVersion, "3.2.0");
	assert.equal(backup.exportedBy, "auditor@kreatiwit.com");
	assert.equal(backup.userRole, "owner");
	assert.ok(Date.parse(backup.exportedAt) > 0, "exportedAt must be a valid ISO string");

	// Verify all 16 domain keys exist in data and counts
	const requiredDomains = [
		"leads",
		"opportunities",
		"clients",
		"contacts",
		"projects",
		"tasks",
		"finance",
		"handoffs",
		"team",
		"activity",
		"notes",
		"gates",
		"raci",
		"checklists",
		"approvals",
		"scopeChanges",
	] as const;

	for (const domain of requiredDomains) {
		assert.ok(
			domain in backup.data,
			`Domain ${domain} must be included in backup data`,
		);
		assert.ok(
			domain in backup.counts,
			`Domain ${domain} must be counted in backup metadata`,
		);
		assert.equal(
			typeof backup.counts[domain],
			"number",
			`Count for ${domain} must be a number`,
		);
	}
});
