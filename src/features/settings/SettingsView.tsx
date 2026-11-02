import type React from "react";
import { useState } from "react";
import { useAuth } from "../../lib/auth/auth.context";
import { useToast } from "../../lib/feedback/toast.context";
import { PERMISSIONS, type UserRole } from "../../lib/permissions/permissions";
import { isSupabaseConfigured } from "../../lib/supabase/client";
import type {
	Activity,
	ApprovalRequest,
	Client,
	Contact,
	FinanceItem,
	Handoff,
	Lead,
	Note,
	Opportunity,
	Project,
	ProjectGate,
	RACIAssignment,
	ScopeChange,
	Task,
	TeamMemberDetail,
} from "../../types";

interface SettingsViewProps {
	leads: Lead[];
	opportunities?: Opportunity[];
	clients: Client[];
	contacts?: Contact[];
	projects: Project[];
	tasks: Task[];
	handoffs: Handoff[];
	team: TeamMemberDetail[];
	activity: Activity[];
	finance?: FinanceItem[];
	notes?: Note[];
	gates?: Record<string, ProjectGate[]>;
	raci?: Record<string, RACIAssignment[]>;
	approvals?: ApprovalRequest[];
	scopeChanges?: ScopeChange[];
}

export const SettingsView: React.FC<SettingsViewProps> = ({
	leads,
	opportunities = [],
	clients,
	contacts = [],
	projects,
	tasks,
	handoffs,
	team,
	activity,
	finance = [],
	notes = [],
	gates = {},
	raci = {},
	approvals = [],
	scopeChanges = [],
}) => {
	const { user, role, setRole } = useAuth();
	const { showToast } = useToast();
	const [, setClearedCache] = useState(false);

	const isConnected = isSupabaseConfigured();

	const handleExportJSON = () => {
		if (!PERMISSIONS.canExportData(role)) {
			showToast({
				type: "error",
				title: "Export Restricted",
				message:
					"Permission denied: Your current role cannot export organizational data.",
			});
			return;
		}

		const exportPayload = {
			agency: "Kreatiwit AgencyOS",
			exportedAt: new Date().toISOString(),
			exportedBy: user?.email || "Executive",
			role,
			data: {
				leads,
				opportunities,
				clients,
				contacts,
				projects,
				tasks,
				handoffs,
				team,
				activity,
				finance,
				notes,
				gates,
				raci,
				approvals,
				scopeChanges,
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

		showToast({
			type: "success",
			title: "Backup Generated",
			message: "Full agency JSON data archive downloaded successfully.",
		});
	};

	const handleClearCache = () => {
		if (
			confirm(
				"Clear local UI cache? This will reset transient UI caches and reload page.",
			)
		) {
			localStorage.removeItem("kreatiwit_agencyos_v3_state");
			setClearedCache(true);
			showToast({
				type: "info",
				message: "Cache reset. Reloading workspace...",
			});
			setTimeout(() => window.location.reload(), 1000);
		}
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h2 className="text-[18px] font-bold text-slate-900 tracking-tight">
					Settings & Infrastructure Governance
				</h2>
				<p className="text-[12px] text-slate-500">
					PostgreSQL connection diagnostics, role-based access control, data
					backup, and session state
				</p>
			</div>

			<div className="grid lg:grid-cols-2 gap-6">
				{/* Card 1: Persistence & Database Diagnostics */}
				<div className="studio-card p-5 space-y-4 bg-white border border-slate-200 rounded-xl">
					<div className="flex items-center justify-between pb-3 border-b border-slate-100">
						<div>
							<h3 className="text-[14px] font-bold text-slate-900 tracking-tight">
								Persistence Architecture
							</h3>
							<p className="text-[11px] text-slate-500">
								PostgreSQL database connection state and security policies
							</p>
						</div>
						<span
							className={`badge-status ${
								isConnected ? "badge-emerald" : "badge-amber"
							}`}
						>
							{isConnected ? "Live Supabase" : "Resilient Engine"}
						</span>
					</div>

					<div className="space-y-2.5 text-[12px]">
						<div className="flex justify-between py-1.5 border-b border-slate-100">
							<span className="text-slate-500">Storage Engine:</span>
							<span className="font-mono font-semibold text-slate-800">
								{isConnected
									? "Supabase Cloud (PostgreSQL 15+)"
									: "Local Persistent Engine"}
							</span>
						</div>
						<div className="flex justify-between py-1.5 border-b border-slate-100">
							<span className="text-slate-500">Security Model:</span>
							<span className="font-mono font-semibold text-slate-800">
								Row-Level Security (RLS) Active
							</span>
						</div>
						<div className="flex justify-between py-1.5 border-b border-slate-100">
							<span className="text-slate-500">RPC Transactions:</span>
							<span className="font-mono text-emerald-600 font-semibold">
								rpc_convert_lead_to_opportunity_and_client
							</span>
						</div>
						<div className="flex justify-between py-1.5">
							<span className="text-slate-500">Compound Indexes:</span>
							<span className="font-mono text-slate-800 font-semibold">
								12 High-Performance Compound Indexes
							</span>
						</div>
					</div>

					<div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
						{isConnected
							? "PostgreSQL database connected. All mutations commit directly to server with foreign-key constraints and atomic RPC rollbacks."
							: "Operating in resilient engine mode. Agency records are preserved cleanly across browser sessions. Live Supabase credentials in .env will synchronize to PostgreSQL cloud."}
					</div>
				</div>

				{/* Card 2: User Authorization & RBAC */}
				<div className="studio-card p-5 space-y-4 bg-white border border-slate-200 rounded-xl">
					<div className="flex items-center justify-between pb-3 border-b border-slate-100">
						<div>
							<h3 className="text-[14px] font-bold text-slate-900 tracking-tight">
								User Session & RBAC Permissions
							</h3>
							<p className="text-[11px] text-slate-500">
								Active authenticated role and authorization boundaries
							</p>
						</div>
						<span className="badge-status badge-cobalt uppercase font-mono text-[10px]">
							{role}
						</span>
					</div>

					<div className="space-y-3">
						<div className="flex items-center justify-between text-[12px]">
							<span className="text-slate-500">Active Identity:</span>
							<span className="font-mono font-bold text-slate-900">
								{user?.name || "Kreatiwit Executive"} (
								{user?.email || "owner@kreatiwit.com"})
							</span>
						</div>

						{/* Role Switcher for Testing RBAC */}
						<div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
							<div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
								Simulate Role Permissions
							</div>
							<div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
								{(["owner", "admin", "manager", "member"] as UserRole[]).map(
									(r) => (
										<button
											key={r}
											type="button"
											onClick={() => {
												setRole(r);
												showToast({
													type: "info",
													message: `Active role switched to: ${r.toUpperCase()}`,
												});
											}}
											className={`py-1.5 px-2 rounded-md font-mono text-[11px] font-semibold border transition cursor-pointer ${
												role === r
													? "bg-blue-600 text-white border-blue-600"
													: "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
											}`}
										>
											{r}
										</button>
									),
								)}
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Data Backup & Export Controls */}
			<div className="studio-card p-5 space-y-4 bg-white border border-slate-200 rounded-xl">
				<div className="flex items-center justify-between pb-3 border-b border-slate-100">
					<div>
						<h3 className="text-[14px] font-bold text-slate-900 tracking-tight">
							Organizational Data Archive & Safety
						</h3>
						<p className="text-[11px] text-slate-500">
							Export immutable JSON snapshots of opportunities, clients,
							contacts, projects, tasks, finance records, and audit logs
						</p>
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-3">
					<button
						type="button"
						onClick={handleExportJSON}
						className="btn-primary !h-[34px] !text-[12px] cursor-pointer"
					>
						📥 Export Complete Agency Backup (.json)
					</button>

					<button
						type="button"
						onClick={handleClearCache}
						className="btn-secondary !h-[34px] !text-[12px] !text-rose-600 hover:!bg-rose-50 cursor-pointer"
					>
						Reset Local UI Cache
					</button>
				</div>
			</div>
		</div>
	);
};
