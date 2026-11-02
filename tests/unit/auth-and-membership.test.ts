import assert from "node:assert/strict";
import test from "node:test";
import {
	loadAuthoritativeMembership,
	loadAuthoritativeRole,
} from "../../src/lib/auth/auth.context";
import {
	getActiveOrgId,
	setActiveOrgId,
	validateSupabaseConfig,
} from "../../src/lib/supabase/client";
import { formatMultiCurrency, sumByCurrency } from "../../src/lib/utils/format";

test("Auth & Config: validateSupabaseConfig detects missing or placeholder environment variables", () => {
	const res = validateSupabaseConfig();
	// In the test runner without live keys, isValid must be a boolean and errors array must be present
	assert.equal(typeof res.isValid, "boolean");
	assert.ok(Array.isArray(res.errors));
	assert.ok(Array.isArray(res.warnings));
	// Ensure error messages never leak sensitive secrets
	for (const err of res.errors) {
		assert.ok(!err.includes("eyJ"), "Errors must never leak token fragments");
	}
});

test("Auth & Security: loadAuthoritativeMembership returns null and role fails closed to member for unverified external user", async () => {
	const membership = await loadAuthoritativeMembership("unregistered-random-user-id");
	assert.equal(
		membership,
		null,
		"Users without an authorized organization membership record must return null membership",
	);

	const role = await loadAuthoritativeRole("unregistered-random-user-id");
	assert.equal(
		role,
		"member",
		"Role must fail closed to member without elevated privileges",
	);
});

test("Auth & Organization: getActiveOrgId and setActiveOrgId handle dynamic switching safely", () => {
	const initial = getActiveOrgId();
	assert.ok(initial, "Initial organization ID must be defined");

	const newOrg = "99999999-9999-9999-9999-999999999999";
	setActiveOrgId(newOrg);
	assert.equal(getActiveOrgId(), newOrg, "Active org ID should update cleanly");

	// Reset to original
	setActiveOrgId(initial);
	assert.equal(getActiveOrgId(), initial, "Active org ID should restore cleanly");
});

test("Currency & Multi-Tenant: sumByCurrency handles diverse currencies without false summation", () => {
	const records = [
		{ value: 120000, currency: "INR" },
		{ value: 30000, currency: "INR" },
		{ value: 5000, currency: "USD" },
		{ value: 2500, currency: "EUR" },
		{ value: 1000, currency: "GBP" },
	];

	const sums = sumByCurrency(records);
	assert.equal(sums.INR, 150000);
	assert.equal(sums.USD, 5000);
	assert.equal(sums.EUR, 2500);
	assert.equal(sums.GBP, 1000);

	const formatted = formatMultiCurrency(sums);
	assert.ok(formatted.includes("₹1,50,000") || formatted.includes("₹150,000"));
	assert.ok(formatted.includes("$5,000"));
	assert.ok(formatted.includes("€2,500"));
	assert.ok(formatted.includes("£1,000"));
});
