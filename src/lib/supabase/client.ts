import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

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
	import.meta.env.VITE_ORGANIZATION_ID ||
	"11111111-1111-1111-1111-111111111111";

// Create client if configured, otherwise provide a fallback mock-safe instance
export const supabase = isSupabaseConfigured()
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
