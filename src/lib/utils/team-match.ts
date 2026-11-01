import type { TeamMemberDetail } from "../../types";

export function suggestTeamForProject(
	techQuery: string,
	team: TeamMemberDetail[],
): { member: TeamMemberDetail; score: number }[] {
	if (!team || team.length === 0) return [];
	const tokens = techQuery.toLowerCase().split(/[, ]+/).filter(Boolean);

	return team
		.map((m) => {
			let score = 0;
			const stackStr = (m.stack || []).join(" ").toLowerCase();
			tokens.forEach((t) => {
				if (stackStr.includes(t)) score += 10;
			});
			score += (m.avail || 0) + (m.focus || 0) * 1.5;
			const peakOverlap = (m.slots || []).some(
				(s) => (s.start <= 23 && s.end > 22) || s.start < 1 || s.start === 0,
			);
			if (peakOverlap) score += 5;
			if (m.overload) score -= 8;
			if ((m.focus || 0) < 2.5) score -= 3;
			return { member: m, score };
		})
		.sort((a, b) => b.score - a.score)
		.slice(0, 4);
}
