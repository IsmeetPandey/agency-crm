import assert from "node:assert/strict";
import { describe, it } from "node:test";

export { describe, it };

export function expect(actual: any) {
	return {
		toBe(expected: any) {
			assert.strictEqual(actual, expected);
		},
		toEqual(expected: any) {
			assert.deepStrictEqual(actual, expected);
		},
		toBeDefined() {
			assert.notStrictEqual(actual, undefined);
		},
		toBeUndefined() {
			assert.strictEqual(actual, undefined);
		},
		toBeGreaterThan(expected: number) {
			assert.ok(actual > expected, `Expected ${actual} > ${expected}`);
		},
		toBeGreaterThanOrEqual(expected: number) {
			assert.ok(actual >= expected, `Expected ${actual} >= ${expected}`);
		},
		toBeTruthy() {
			assert.ok(Boolean(actual));
		},
		toBeFalsy() {
			assert.ok(!actual);
		},
	};
}
