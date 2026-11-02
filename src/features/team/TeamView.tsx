import type React from "react";
import { useState } from "react";
import {
	DAY_SCHEDULE,
	formatHour,
	isMemberOnline,
	LEADERSHIP,
} from "../../lib/constants/agency";
import type { Department, TeamMemberDetail } from "../../types";

interface TeamViewProps {
	team: TeamMemberDetail[];
	departments: Department[];
	istHour: number;
}

export const TeamView: React.FC<TeamViewProps> = ({
	team,
	departments,
	istHour,
}) => {
	const [selectedHour, setSelectedHour] = useState<number | null>(null);

	const displayHour = selectedHour !== null ? selectedHour : istHour;

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
				<div>
					<h2 className="text-[18px] font-bold text-[var(--ink)] tracking-tight">
						Team Roster & Capacity Intelligence
					</h2>
					<p className="text-[12px] text-[var(--ink-muted)]">
						8 Core Specialists • Daily focus allocation • 24h IST shift
						distribution • Workload health
					</p>
				</div>
			</div>

			{/* Executive Leadership */}
			<div className="studio-card p-5 space-y-3">
				<h3 className="text-[13px] font-mono font-bold uppercase tracking-wider text-[var(--ink-muted)]">
					Agency Executive Leadership
				</h3>
				<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
					{LEADERSHIP.map((lead) => (
						<div
							key={lead.role}
							className="p-3.5 rounded-lg border border-[var(--border)] bg-[var(--surface-sunken)] space-y-1"
						>
							<div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--ink-muted)]">
								{lead.role}
							</div>
							<div className="text-[14px] font-bold text-[var(--ink)]">
								{lead.name}
							</div>
							<div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
								<span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
								{lead.status}
							</div>
						</div>
					))}
				</div>
			</div>

			{/* 24h Schedule Timeline */}
			<div className="studio-card p-5 space-y-3">
				<div className="flex items-center justify-between">
					<div>
						<h3 className="text-[14px] font-bold text-[var(--ink)] tracking-tight">
							24h Specialist Coverage & Hourly Shift Distribution (IST)
						</h3>
						<p className="text-[11px] text-[var(--ink-muted)] font-mono">
							Inspection time:{" "}
							<span className="font-bold text-[#49B3FC]">
								{formatHour(Math.floor(displayHour))} IST
							</span>
						</p>
					</div>
					{selectedHour !== null && (
						<button
							type="button"
							onClick={() => setSelectedHour(null)}
							className="text-[11px] text-[#49B3FC] font-semibold hover:underline"
						>
							Reset to Current Time ({formatHour(Math.floor(istHour))})
						</button>
					)}
				</div>

				<div className="grid grid-cols-5 sm:grid-cols-10 gap-2 pt-1">
					{DAY_SCHEDULE.map((slot) => {
						const isSelected = selectedHour === slot.hour;
						const isCurrent = Math.floor(istHour) === slot.hour;

						return (
							<button
								key={slot.hour}
								type="button"
								onClick={() => setSelectedHour(slot.hour)}
								className={`p-2 rounded-lg text-center border transition ${
									isSelected
										? "bg-[#49B3FC] text-white border-[#49B3FC] shadow-sm"
										: isCurrent
											? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-[var(--ink)] font-bold"
											: "bg-[var(--surface-sunken)] border border-[var(--border)] hover:bg-[var(--surface-raised)] text-[var(--ink-secondary)]"
								}`}
							>
								<div className="text-[10px] font-mono truncate">
									{slot.label}
								</div>
								<div
									className={`text-[12px] font-mono font-bold ${isSelected ? "text-white" : "text-[#49B3FC]"}`}
								>
									{slot.count} on
								</div>
							</button>
						);
					})}
				</div>
			</div>

			{/* Detailed Team Directory Cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{team.map((member) => {
					const isOnline = isMemberOnline(member, displayHour);

					return (
						<div key={member.id} className="studio-card p-5 space-y-4">
							<div className="flex items-start justify-between">
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 rounded-full bg-[var(--ink)] text-[var(--canvas)] flex items-center justify-center font-bold text-[13px] font-mono">
										{member.initials}
									</div>
									<div>
										<h4 className="text-[15px] font-bold text-[var(--ink)]">
											{member.name}
										</h4>
										<div className="text-[12px] text-[var(--ink-muted)] font-medium">
											{member.roleTitle}
										</div>
									</div>
								</div>

								<div className="flex items-center gap-2">
									{member.overload && (
										<span className="badge-status badge-rose text-[10px]">
											Overloaded
										</span>
									)}
									<span
										className={`badge-status text-[10px] ${
											isOnline ? "badge-emerald" : "badge-neutral"
										}`}
									>
										{isOnline ? "Scheduled On-Duty" : "Off-Shift"}
									</span>
								</div>
							</div>

							{/* Allocation & Time Slot */}
							<div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-[var(--surface-sunken)] border border-[var(--border)] font-mono text-[11px]">
								<div>
									<div className="text-[var(--ink-muted)] uppercase text-[9px] font-bold">
										Planned Capacity
									</div>
									<div className="text-[13px] font-bold text-[var(--ink)]">
										{member.focus}h / {member.avail}h per day
									</div>
								</div>
								<div>
									<div className="text-[var(--ink-muted)] uppercase text-[9px] font-bold">
										IST Duty Slot
									</div>
									<div className="text-[13px] font-bold text-[var(--ink-secondary)]">
										{(member as any).slot || member.slotRaw}
									</div>
								</div>
							</div>

							{/* Skills */}
							<div className="space-y-1.5">
								<div className="text-[10px] font-mono uppercase tracking-wider text-[var(--ink-muted)] font-bold">
									Verified Skill Capabilities
								</div>
								<div className="flex flex-wrap gap-1.5">
									{(member.stack || (member as any).skills || []).map(
										(skill: string) => (
											<span
												key={skill}
												className="font-mono text-[10px] px-2 py-0.5 rounded bg-[var(--surface-raised)] text-[var(--ink-secondary)] border border-[var(--border-subtle)]"
											>
												{skill}
											</span>
										),
									)}
								</div>
							</div>

							{/* Projects assigned */}
							<div className="pt-2 border-t border-[var(--border-subtle)] text-[11px] text-[var(--ink-muted)] flex items-center justify-between">
								<span>Assigned Specializations:</span>
								<span className="font-mono font-semibold text-[var(--ink)]">
									{((member as any).projects || member.departments || []).join(
										", ",
									) || "Standby / Available"}
								</span>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
};
