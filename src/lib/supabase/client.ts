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

export const isSupabaseConfigured = (): boolean => {
	return (
		typeof supabaseUrl === "string" &&
		supabaseUrl.length > 0 &&
		!supabaseUrl.includes("your-project-id") &&
		typeof supabaseAnonKey === "string" &&
		supabaseAnonKey.length > 0 &&
		!supabaseAnonKey.includes("...")
	);
};

export const DEFAULT_ORG_ID =
	getEnvVar("VITE_ORGANIZATION_ID") ||
	getEnvVar("ORGANIZATION_ID") ||
	"11111111-1111-1111-1111-111111111111";

export const supabase: SupabaseClient<Database> =
	isSupabaseConfigured() &&
	typeof supabaseUrl === "string" &&
	typeof supabaseAnonKey === "string"
		? createClient<Database>(supabaseUrl, supabaseAnonKey, {
				auth: {
					autoRefreshToken: true,
					persistSession: true,
					detectSessionInUrl: true,
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
					},
				},
			);
