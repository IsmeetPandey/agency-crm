import type React from "react";
import { useState } from "react";
import { useAuth } from "../../lib/auth/auth.context";
import { PERMISSIONS, type UserRole } from "../../lib/permissions/permissions";
import { isSupabaseConfigured } from "../../lib/supabase/client";
import type {
	Activity,
	Client,
	Handoff,
	Lead,
	Project,
	Task,
	TeamMemberDetail,
} from "../../types";

interface SettingsViewProps {
	leads: Lead[];
	clients: Client[];
	projects: Project[];
	tasks: Task[];
	handoffs: Handoff[];
	team: TeamMemberDetail[];
	activity: Activity[];
}

export const SettingsView: React.FC<SettingsViewProps> = ({
	leads,
	clients,
	projects,
	tasks,
	handoffs,
	team,
	activity,
}) => {
	const { user, role, setRole, signOut } = useAuth();
	const [copied, setCopied] = useState(false);
	const [clearedCache, setClearedCache] = useState(false);

	const isConnected = isSupabaseConfigured();

	const handleExportJSON = () => {
		if (!PERMISSIONS.canExportData(role)) {
			alert(
				"Permission denied: Your current role cannot export organizational data.",
			);
			return;
		}

		const exportPayload = {
			agency: "Kreatiwit AgencyOS v3",
			exportedAt: new Date().toISOString(),
			exportedBy: user?.email || "Unknown",
			role,
			data: {
				leads,
				clients,
				projects,
				tasks,
				handoffs,
				team,
				activity,
			},
		};

		const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
			type: "application/json",
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `kreatiwit-agencyos-backup-${new Date().toISOString().slice(0, 10)}.json`;
		a.click();
		URL.revokeObjectURL(url);
	};

	const handleClearCache = () => {
		if (
			confirm(
				"Clear local UI cache? This will reset transient UI caches and reload page.",
			)
		) {
			localStorage.removeItem("kreatiwit_agencyos_v3_state");
			setClearedCache(true);
			setTimeout(() => window.location.reload(), 1000);
		}
	};

	return (
		<div className="space-y-5">
			<div>
				<h2 className="text-[18px] font-[700] tracking-[-0.02em] text-[#1D1D1F]">
					Settings & Infrastructure Governance
				</h2>
				<p className="text-[12px] text-[#86868B]">
					Database connections, user authorization roles, audit logs, and data
					exports
				</p>
			</div>

			<div className="grid lg:grid-cols-2 gap-5">
				{/* Left: Organization & Data management */}
				<div className="liquid-card p-6 space-y-5">
					<div className="flex items-center justify-between">
						<h3 className="text-[15px] font-[700] text-[#1D1D1F]">
							Kreatiwit AgencyOS v3 • Production Core
						</h3>
						<span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#007AFF]/10 text-[#007AFF] font-[600]">
							v3.0.0
						</span>
					</div>

					<p className="text-[13px] text-[#86868B] leading-relaxed">
						Internal Operating System for Kreatiwit. Built with Liquid Glass
						design tokens (blur 30px, saturate 200%, 0.5px hairlines).
						Relational persistence layer designed for Supabase PostgreSQL with
						Row Level Security.
					</p>

					{/* Role Switching (Demo / RBAC evaluation) */}
					<div className="p-3.5 rounded-[12px] bg-white/70 border border-black/[0.06] space-y-2">
						<div className="text-[12px] font-[650] text-[#1D1D1F] flex items-center justify-between">
							<span>Current User Role</span>
							<span className="text-[11px] font-[600] uppercase text-[#6D28D9]">
								{role}
							</span>
						</div>
						<div className="flex gap-2">
							{(["owner", "admin", "manager", "member"] as UserRole[]).map(
								(r) => (
									<button
										key={r}
										type="button"
										onClick={() => setRole(r)}
										className={`flex-1 py-1 text-[11px] font-[600] capitalize rounded-[8px] border transition ${
											role === r
												? "bg-[#6D28D9] text-white border-[#6D28D9]"
												: "bg-white/80 text-[#86868B] border-black/[0.08] hover:text-[#1D1D1F]"
										}`}
									>
										{r}
									</button>
								),
							)}
						</div>
						<div className="text-[10px] text-[#86868B] pt-1">
							Switch roles to evaluate RBAC boundaries (e.g. data export and
							settings management).
						</div>
					</div>

					{/* Export & Session Buttons */}
					<div className="flex flex-wrap gap-2 pt-2">
						<button
							type="button"
							onClick={handleExportJSON}
							className="btn-liquid btn-liquid-primary !h-[34px] !px-4"
						>
							Export JSON Backup
						</button>
						<button
							type="button"
							onClick={handleClearCache}
							className="btn-liquid !h-[34px] !px-4 hover:!text-[#FF2D55]"
						>
							{clearedCache ? "Cache Cleared..." : "Clear Local Cache"}
						</button>
						<button
							type="button"
							onClick={() => signOut()}
							className="btn-liquid !h-[34px] !px-4"
						>
							Sign Out
						</button>
					</div>
				</div>

				{/* Right: Supabase Connection & Health */}
				<div className="liquid-card p-6 space-y-5">
					<div className="flex items-center justify-between">
						<h3 className="text-[15px] font-[700] text-[#1D1D1F]">
							Supabase Database Backend
						</h3>
						<span
							className={`text-[10px] font-[700] px-2.5 py-0.5 rounded-full ${
								isConnected
									? "bg-[#30D158]/15 text-[#30D158] border border-[#30D158]/30"
									: "bg-[#FF9500]/15 text-[#FF9500] border border-[#FF9500]/30"
							}`}
						>
							{isConnected ? "CONNECTED (LIVE)" : "LOCAL / PREVIEW MODE"}
						</span>
					</div>

					<div className="p-3.5 rounded-[12px] bg-white/70 border border-black/[0.06] space-y-2 text-[12px]">
						<div className="flex justify-between">
							<span className="text-[#86868B]">Supabase URL</span>
							<span className="font-mono text-[#1D1D1F]">
								{isConnected
									? import.meta.env.VITE_SUPABASE_URL
									: "Not configured in .env"}
							</span>
						</div>
						<div className="flex justify-between">
							<span className="text-[#86868B]">Anon Key</span>
							<span className="font-mono text-[#1D1D1F]">
								{isConnected ? "Configured (••••••••)" : "Not configured"}
							</span>
						</div>
						<div className="flex justify-between">
							<span className="text-[#86868B]">Row Level Security</span>
							<span className="text-[#30D158] font-[600]">
								Active in Schema Migrations
							</span>
						</div>
					</div>

					<div className="text-[12px] text-[#86868B] leading-relaxed space-y-2">
						<p>To connect your remote Supabase project:</p>
						<ol className="list-decimal pl-4 space-y-1 text-[11px]">
							<li>
								Copy{" "}
								<code className="bg-black/[0.05] px-1 py-0.5 rounded">
									.env.example
								</code>{" "}
								to{" "}
								<code className="bg-black/[0.05] px-1 py-0.5 rounded">
									.env.local
								</code>
								.
							</li>
							<li>Add your Supabase URL & Anon Key from Supabase Dashboard.</li>
							<li>
								Run the SQL migration in{" "}
								<code className="bg-black/[0.05] px-1 py-0.5 rounded">
									supabase/migrations/20261102000000_initial_agencyos_schema.sql
								</code>
								.
							</li>
							<li>
								Run{" "}
								<code className="bg-black/[0.05] px-1 py-0.5 rounded">
									bun run scripts/import-legacy-data.ts
								</code>{" "}
								to seed genuine records.
							</li>
						</ol>
					</div>
				</div>
			</div>
		</div>
	);
};
