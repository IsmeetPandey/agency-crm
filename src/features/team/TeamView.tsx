import type React from "react";
import { useState } from "react";
import {
	DAY_SCHEDULE,
	formatHour,
	isMemberOnline,
	LEADERSHIP,
	PERSON_COLOR,
} from "../../lib/constants/agency";
import type { Department, LeadershipRole, TeamMemberDetail } from "../../types";

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
					<h2 className="text-[18px] font-[700] tracking-[-0.02em] text-[#1D1D1F]">
						Team & Operational Capacity • Liquid Tahoe
					</h2>
					<p className="text-[12px] text-[#86868B]">
						8 members • Focus-hour distribution • Overload detection • 24h IST
						schedule
					</p>
				</div>
			</div>

			{/* Leadership Structure */}
			<div className="liquid-card p-5">
				<h3 className="text-[13px] font-[650] text-[#1D1D1F] mb-3">
					Executive Leadership
				</h3>
				<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
					{LEADERSHIP.map((lead) => (
						<div
							key={lead.role}
							className="p-3 rounded-[12px] bg-white/60 border border-black/[0.04] space-y-1"
						>
							<div className="text-[11px] font-[600] uppercase tracking-wider text-[#86868B]">
								{lead.role}
							</div>
							<div className="text-[14px] font-[700] text-[#1D1D1F]">
								{lead.name}
							</div>
							<div className="text-[10px] font-[600] capitalize text-[#30D158]">
								{lead.status}
							</div>
						</div>
					))}
				</div>
			</div>

			{/* 24h Schedule Timeline */}
			<div className="liquid-card p-5 space-y-3">
				<div className="flex items-center justify-between">
					<div>
						<h3 className="text-[13px] font-[650] text-[#1D1D1F]">
							24h Coverage & Hourly Shift Distribution (IST)
						</h3>
						<p className="text-[11px] text-[#86868B]">
							Selected time:{" "}
							<span className="font-[600] text-[#007AFF]">
								{formatHour(Math.floor(displayHour))} IST
							</span>
						</p>
					</div>
					{selectedHour !== null && (
						<button
							type="button"
							onClick={() => setSelectedHour(null)}
							className="text-[11px] text-[#007AFF] hover:underline"
						>
							Reset to Current Time ({formatHour(Math.floor(istHour))})
						</button>
					)}
				</div>

				<div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 pt-1">
					{DAY_SCHEDULE.map((slot) => {
						const isSelected = selectedHour === slot.hour;
						const isCurrent = Math.floor(istHour) === slot.hour;

						return (
							<button
								key={slot.hour}
								type="button"
								onClick={() => setSelectedHour(slot.hour)}
								className={`p-2 rounded-[8px] text-center border transition ${
									isSelected
										? "bg-[#007AFF] text-white border-[#007AFF] shadow-sm"
										: isCurrent
											? "bg-[#30D158]/15 border-[#30D158]/30 text-[#1D1D1F]"
											: "bg-white/60 border-black/[0.06] hover:bg-white/90 text-[#1D1D1F]"
								}`}
							>
								<div className="text-[10px] font-[600] truncate">
									{slot.label}
								</div>
								<div
									className={`text-[12px] font-[750] ${isSelected ? "text-white" : "text-[#6D28D9]"}`}
								>
									{slot.count}
								</div>
							</button>
						);
					})}
				</div>
			</div>

			{/* Team Member Cards Grid */}
			<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
				{team.map((m) => {
					const online = isMemberOnline(m, displayHour);
					const col = PERSON_COLOR[m.legacyId || m.id] || {
						gradient: "linear-gradient(135deg, #007AFF, #6D28D9)",
					};

					return (
						<div
							key={m.id}
							className={`liquid-card p-4 space-y-3 ${m.overload ? "tint-pink" : ""}`}
						>
							<div className="flex items-center gap-3">
								<div className="relative">
									<div className="avatar-glass w-11 h-11">
										<div
											className="avatar-glass-inner text-[12px]"
											style={{ background: col.gradient }}
										>
											{m.initials}
										</div>
									</div>
									{online && (
										<span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#30D158] rounded-full border-2 border-white shadow-[0_0_6px_rgba(48,209,88,0.6)]" />
									)}
								</div>
								<div>
									<div className="text-[14px] font-[700] text-[#1D1D1F] flex items-center gap-1.5">
										{m.name}
										{m.overload && (
											<span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#FF2D55] text-white font-[700]">
												OVERLOAD
											</span>
										)}
									</div>
									<div className="text-[11px] text-[#86868B] truncate">
										{m.roleTitle}
									</div>
								</div>
							</div>

							{/* Working slots & Focus hours */}
							<div className="p-2.5 rounded-[8px] bg-white/60 border border-black/[0.04] text-[11px] space-y-1">
								<div className="flex justify-between text-[#86868B]">
									<span>Availability</span>
									<span className="font-[600] text-[#1D1D1F]">
										{m.avail}h/day ({m.focus}h focus)
									</span>
								</div>
								<div className="text-[#86868B] truncate text-[10px]">
									Slot:{" "}
									<span className="font-mono text-[#1D1D1F]">{m.slotRaw}</span>
								</div>
							</div>

							{/* Stack Pills */}
							<div>
								<div className="text-[10px] font-[600] uppercase tracking-wider text-[#86868B] mb-1.5">
									Core Stack ({m.stack.length})
								</div>
								<div className="flex flex-wrap gap-1 max-h-[70px] overflow-hidden">
									{m.stack.slice(0, 6).map((s) => (
										<span
											key={s}
											className="text-[10px] font-[500] px-2 py-0.5 rounded-full bg-black/[0.04] text-[#1D1D1F]/80"
										>
											{s}
										</span>
									))}
									{m.stack.length > 6 && (
										<span className="text-[10px] text-[#86868B]">
											+{m.stack.length - 6} more
										</span>
									)}
								</div>
							</div>

							{/* Departments */}
							<div className="pt-2 border-t border-black/[0.04] flex items-center justify-between text-[11px] text-[#86868B]">
								<span className="truncate">
									Depts: {m.departments.join(", ")}
								</span>
								<span className="font-mono text-[10px]">{m.email}</span>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
};
