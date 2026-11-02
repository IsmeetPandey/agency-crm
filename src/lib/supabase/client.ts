import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const getEnvVar = (key: string): string | undefined => {
	try {
		if (
			typeof import.meta !== "undefined" &&
			import.meta.env &&
			import.meta.env[key]
		) {
			return import.meta.env[key];
		}
	} catch {}
	try {
		if (typeof process !== "undefined" && process.env && process.env[key]) {
			return process.env[key];
		}
	} catch {}
	return undefined;
};

const supabaseUrl = getEnvVar("VITE_SUPABASE_URL") || getEnvVar("SUPABASE_URL");
const supabaseAnonKey =
	getEnvVar("VITE_SUPABASE_ANON_KEY") || getEnvVar("SUPABASE_ANON_KEY");

export interface ConfigValidationResult {
	isValid: boolean;
	hasUrl: boolean;
	hasKey: boolean;
	hasOrgId: boolean;
	errors: string[];
	warnings: string[];
}

export function validateSupabaseConfig(): ConfigValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];

	let hasUrl = false;
	let hasKey = false;
	let hasOrgId = false;

	// 1. URL validation
	if (!supabaseUrl || supabaseUrl.trim() === "") {
		errors.push("Missing VITE_SUPABASE_URL environment variable.");
	} else if (
		supabaseUrl.includes("your-project") ||
		supabaseUrl.includes("placeholder-domain") ||
		supabaseUrl.includes("example.com")
	) {
		errors.push(
			"VITE_SUPABASE_URL contains an unconfigured placeholder value.",
		);
	} else {
		try {
			const parsed = new URL(supabaseUrl);
			if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
				errors.push("VITE_SUPABASE_URL must use http or https protocol.");
			} else {
				hasUrl = true;
			}
		} catch {
			errors.push("VITE_SUPABASE_URL is not a valid URL format.");
		}
	}

	// 2. Key validation (format only — never print secret key value)
	if (!supabaseAnonKey || supabaseAnonKey.trim() === "") {
		errors.push("Missing VITE_SUPABASE_ANON_KEY environment variable.");
	} else if (
		supabaseAnonKey.includes("...") ||
		supabaseAnonKey.includes("your-anon-key") ||
		supabaseAnonKey.includes("placeholder")
	) {
		errors.push(
			"VITE_SUPABASE_ANON_KEY contains an unconfigured placeholder value.",
		);
	} else {
		const parts = supabaseAnonKey.split(".");
		if (parts.length !== 3) {
			errors.push(
				"VITE_SUPABASE_ANON_KEY does not match standard JWT format (3 dot-separated segments).",
			);
		} else {
			hasKey = true;
		}
	}

	// 3. Organization ID validation
	const rawOrgId =
		getEnvVar("VITE_ORGANIZATION_ID") || getEnvVar("ORGANIZATION_ID");
	const uuidRegex =
		/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

	if (!rawOrgId || rawOrgId.trim() === "") {
		warnings.push(
			"VITE_ORGANIZATION_ID not specified; falling back to default seed organization ID.",
		);
		hasOrgId = true;
	} else if (!uuidRegex.test(rawOrgId)) {
		warnings.push(
			"VITE_ORGANIZATION_ID is not a standard UUID; using default agency organization.",
		);
		hasOrgId = true;
	} else {
		hasOrgId = true;
	}

	return {
		isValid: hasUrl && hasKey,
		hasUrl,
		hasKey,
		hasOrgId,
		errors,
		warnings,
	};
}

export const isSupabaseConfigured = (): boolean => {
	return validateSupabaseConfig().isValid;
};

export const DEFAULT_ORG_ID =
	getEnvVar("VITE_ORGANIZATION_ID") ||
	getEnvVar("ORGANIZATION_ID") ||
	"11111111-1111-1111-1111-111111111111";

let activeOrgId: string = DEFAULT_ORG_ID;

export const getActiveOrgId = (): string => activeOrgId;
export const setActiveOrgId = (id: string): void => {
	if (id?.trim()) {
		activeOrgId = id.trim();
	}
};

export const supabase: SupabaseClient<Database> =
	isSupabaseConfigured() &&
	typeof supabaseUrl === "string" &&
	typeof supabaseAnonKey === "string"
		? createClient<Database>(supabaseUrl, supabaseAnonKey, {
				auth: {
					autoRefreshToken: true,
					persistSession: true,
					detectSessionInUrl: true,
					flowType: "pkce",
				},
				realtime: {
					params: {
						eventsPerSecond: 10,
					},
				},
			})
		: createClient<Database>(
				"https://placeholder-domain-kreatiwit.supabase.co",
				"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder",
				{
					auth: {
						autoRefreshToken: false,
						persistSession: false,
						detectSessionInUrl: false,
					},
				},
			);
