import type {
	Department,
	LeadershipRole,
	ProjectPhase,
	TeamMemberDetail,
} from "../../types";

export const PHASES: ProjectPhase[] = [
	"Kickoff",
	"Discovery",
	"Design",
	"Prototype",
	"Build",
	"QA",
	"UAT",
	"Launch",
	"Close",
];

export const STAGES = [
	"New",
	"Contacted",
	"Qualified",
	"Proposal",
	"Won",
	"Lost",
] as const;

export const STAGE_META: Record<
	string,
	{ bg: string; tint: string; border: string; dot: string }
> = {
	New: {
		bg: "#6D28D9",
		tint: "rgba(109,40,217,0.10)",
		border: "rgba(109,40,217,0.18)",
		dot: "#6D28D9",
	},
	Contacted: {
		bg: "#007AFF",
		tint: "rgba(0,122,255,0.10)",
		border: "rgba(0,122,255,0.18)",
		dot: "#007AFF",
	},
	Qualified: {
		bg: "#FF2D55",
		tint: "rgba(255,45,85,0.10)",
		border: "rgba(255,45,85,0.18)",
		dot: "#FF2D55",
	},
	Proposal: {
		bg: "#FF9500",
		tint: "rgba(255,149,0,0.12)",
		border: "rgba(255,149,0,0.18)",
		dot: "#FF9500",
	},
	Won: {
		bg: "#30D158",
		tint: "rgba(48,209,88,0.12)",
		border: "rgba(48,209,88,0.22)",
		dot: "#30D158",
	},
	Lost: {
		bg: "#8E8E93",
		tint: "rgba(142,142,147,0.10)",
		border: "rgba(142,142,147,0.18)",
		dot: "#8E8E93",
	},
};

export const DEPARTMENTS: Department[] = [
	{
		id: "PM",
		code: "PM",
		label: "Client Facing / PM",
		members: ["Shradha", "Arnav"],
		dot: "#6D28D9",
		color: "#6D28D9",
	},
	{
		id: "Design",
		code: "Design",
		label: "Design / UI UX",
		members: ["Shradha", "Darshan", "Ismeet"],
		dot: "#FF4D6A",
		color: "#FF4D6A",
	},
	{
		id: "Frontend",
		code: "Frontend",
		label: "Frontend",
		members: ["Ansul", "Vipul", "Rahul"],
		dot: "#007AFF",
		color: "#007AFF",
	},
	{
		id: "Backend",
		code: "Backend",
		label: "Backend",
		members: ["Ansul", "Rahul"],
		dot: "#6D28D9",
		color: "#6D28D9",
	},
	{
		id: "App",
		code: "App",
		label: "App Development",
		members: ["Darshan", "Rahul"],
		dot: "#00C7BE",
		color: "#00C7BE",
	},
	{
		id: "SEO",
		code: "SEO",
		label: "SEO",
		members: ["Abhishek"],
		learning: ["Shradha", "Rahul"],
		dot: "#FF9500",
		color: "#FF9500",
	},
	{
		id: "Testing",
		code: "Testing",
		label: "Testing",
		members: ["Shradha"],
		dot: "#30D158",
		color: "#30D158",
	},
	{
		id: "DevOps",
		code: "DevOps",
		label: "DevOps",
		members: ["Ansul", "Rahul"],
		dot: "#5856D6",
		color: "#5856D6",
	},
	{
		id: "Marketing",
		code: "Marketing",
		label: "Digital Marketing / Brand",
		members: ["Arnav", "Abhishek"],
		learning: ["Shradha"],
		dot: "#FF2D55",
		color: "#FF2D55",
	},
	{
		id: "AI",
		code: "AI",
		label: "AI / ML",
		members: [],
		learning: ["Shradha"],
		dot: "#AF52DE",
		color: "#AF52DE",
	},
	{
		id: "Accounts",
		code: "Accounts",
		label: "Accounts",
		members: ["Abhishek"],
		dot: "#8E8E93",
		color: "#8E8E93",
	},
];

export const LEADERSHIP: LeadershipRole[] = [
	{
		role: "CEO",
		name: "Vacant",
		status: "hiring",
		tint: "rgba(255,149,0,0.12)",
		color: "#FF9500",
	},
	{
		role: "COO",
		name: "Abhishek",
		status: "active",
		tint: "rgba(48,209,88,0.10)",
		color: "#30D158",
	},
	{
		role: "CTO",
		name: "Ansul",
		status: "active",
		tint: "rgba(109,40,217,0.10)",
		color: "#6D28D9",
	},
	{
		role: "CMO",
		name: "Arnav",
		status: "active",
		tint: "rgba(255,45,85,0.10)",
		color: "#FF2D55",
	},
];

export const TEAM: TeamMemberDetail[] = [
	{
		id: "ansul",
		legacyId: "ansul",
		name: "Ansul",
		roleTitle: "CTO • Fullstack Lead",
		initials: "AN",
		stack: [
			"React",
			"Next.js",
			"Express",
			"Hapi",
			"Nest.js",
			"AWS",
			"Azure",
			"GCP",
			"Cloudflare",
			"MySQL",
			"Postgres",
			"MongoDB",
			"React Native",
			"Electron",
		],
		avail: 4,
		focus: 3,
		slotRaw: "10pm-1am +1hr random",
		slots: [
			{ start: 22, end: 24 },
			{ start: 0, end: 1 },
		],
		departments: ["Frontend", "Backend", "DevOps"],
		learning: [],
		accent: "#6D28D9",
		overload: true,
		email: "ansul@kreatiwit.io",
		status: "active",
	},
	{
		id: "shradha",
		legacyId: "shradha",
		name: "Shradha",
		roleTitle: "PM • Design Lead",
		initials: "SH",
		stack: [
			"Requirements",
			"Designs",
			"Testing",
			"Proposal",
			"Client Comm",
			"Research",
			"Lead Project",
			"Figma",
		],
		avail: 4,
		focus: 2,
		slotRaw: "9-11:30am 2-4pm 9-11pm",
		slots: [
			{ start: 9, end: 11.5 },
			{ start: 14, end: 16 },
			{ start: 21, end: 23 },
		],
		departments: ["PM", "Design", "Testing"],
		learning: ["SEO", "Marketing", "AI"],
		accent: "#FF2D55",
		overload: true,
		email: "shradha@kreatiwit.io",
		status: "active",
	},
	{
		id: "ismeet",
		legacyId: "ismeet",
		name: "Ishmeet",
		roleTitle: "Frontend • 3D Dev",
		initials: "IS",
		stack: [
			"React",
			"Next.js",
			"three.js",
			"AWS",
			"SQL",
			"node.js",
			"Astro.js",
			"Figma",
		],
		avail: 3,
		focus: 2,
		slotRaw: "10pm-12am 6-7pm",
		slots: [
			{ start: 22, end: 24 },
			{ start: 18, end: 19 },
		],
		departments: ["Design"],
		learning: [],
		accent: "#30D158",
		overload: false,
		email: "ismeet@kreatiwit.io",
		status: "active",
	},
	{
		id: "rahul",
		legacyId: "rahul",
		name: "Rahul",
		roleTitle: "Fullstack • WordPress",
		initials: "RH",
		stack: [
			"React",
			"Vue",
			"Next",
			"Quasar",
			"PHP Laravel",
			"Node",
			"WordPress",
			"Shopify",
			"APIs",
		],
		avail: 3,
		focus: 2,
		slotRaw: "10pm-1am random",
		slots: [
			{ start: 22, end: 24 },
			{ start: 0, end: 1 },
		],
		departments: ["Frontend", "Backend", "App", "DevOps"],
		learning: ["SEO"],
		accent: "#AF52DE",
		overload: true,
		email: "rahul@kreatiwit.io",
		status: "active",
	},
	{
		id: "vipul",
		legacyId: "vipul",
		name: "Vipul",
		roleTitle: "Frontend • Night Ops",
		initials: "VI",
		stack: ["React", "Frontend Arch", "Performance"],
		avail: 6,
		focus: 5,
		slotRaw: "12am-6am",
		slots: [{ start: 0, end: 6 }],
		departments: ["Frontend"],
		learning: [],
		accent: "#007AFF",
		overload: false,
		email: "vipul@kreatiwit.io",
		status: "active",
	},
	{
		id: "darshan",
		legacyId: "darshan",
		name: "Darshan",
		roleTitle: "App Dev • Flutter",
		initials: "DA",
		stack: [
			"Flutter",
			"Dart",
			"Kotlin",
			"Java",
			"Firebase",
			"Supabase",
			"Figma",
		],
		avail: 4,
		focus: 3,
		slotRaw: "11pm-2am random",
		slots: [
			{ start: 23, end: 24 },
			{ start: 0, end: 2 },
		],
		departments: ["Design", "App"],
		learning: [],
		accent: "#00C7BE",
		overload: false,
		email: "darshan@kreatiwit.io",
		status: "active",
	},
	{
		id: "arnav",
		legacyId: "arnav",
		name: "Arnav",
		roleTitle: "CMO • Brand",
		initials: "AR",
		stack: ["Brand Strategy", "Content", "Campaigns", "Client Comm"],
		avail: 3,
		focus: 2,
		slotRaw: "10pm-12am 1:30-2:30pm Mon-Fri",
		slots: [
			{ start: 22, end: 24 },
			{ start: 13.5, end: 14.5 },
		],
		departments: ["PM", "Marketing"],
		learning: [],
		accent: "#FF9500",
		overload: false,
		email: "arnav@kreatiwit.io",
		status: "active",
	},
	{
		id: "abhishek",
		legacyId: "abhishek",
		name: "Abhishek",
		roleTitle: "COO • Ops & SEO",
		initials: "AB",
		stack: ["Ops", "Accounts", "SEO Core", "Strategy"],
		avail: 8,
		focus: 6,
		slotRaw: "Flexible - Ops",
		slots: [{ start: 9, end: 18 }],
		departments: ["SEO", "Marketing", "Accounts"],
		learning: [],
		accent: "#8E8E93",
		overload: false,
		email: "abhishek@kreatiwit.io",
		status: "active",
	},
];

export const PERSON_COLOR: Record<
	string,
	{ solid: string; tint: string; gradient: string }
> = {
	ansul: {
		solid: "#6D28D9",
		tint: "rgba(109,40,217,0.10)",
		gradient: "linear-gradient(135deg,#6D28D9,#AF52DE)",
	},
	shradha: {
		solid: "#FF2D55",
		tint: "rgba(255,45,85,0.10)",
		gradient: "linear-gradient(135deg,#FF2D55,#FF6B6B)",
	},
	vipul: {
		solid: "#007AFF",
		tint: "rgba(0,122,255,0.10)",
		gradient: "linear-gradient(135deg,#007AFF,#00C7BE)",
	},
	darshan: {
		solid: "#00C7BE",
		tint: "rgba(0,199,190,0.10)",
		gradient: "linear-gradient(135deg,#00C7BE,#30D158)",
	},
	arnav: {
		solid: "#FF9500",
		tint: "rgba(255,149,0,0.12)",
		gradient: "linear-gradient(135deg,#FF9500,#FFCC02)",
	},
	ismeet: {
		solid: "#30D158",
		tint: "rgba(48,209,88,0.10)",
		gradient: "linear-gradient(135deg,#30D158,#00C7BE)",
	},
	rahul: {
		solid: "#AF52DE",
		tint: "rgba(175,82,222,0.10)",
		gradient: "linear-gradient(135deg,#AF52DE,#FF2D55)",
	},
	abhishek: {
		solid: "#8E8E93",
		tint: "rgba(142,142,147,0.12)",
		gradient: "linear-gradient(135deg,#8E8E93,#636366)",
	},
};

export const DAY_SCHEDULE: {
	hour: number;
	label: string;
	members: string[];
	count: number;
}[] = [
	{
		hour: 0,
		label: "12AM-1AM",
		members: ["Ansul", "Rahul", "Arnav", "Darshan", "Vipul"],
		count: 5,
	},
	{ hour: 1, label: "1AM-2AM", members: ["Vipul", "Darshan"], count: 2 },
	{ hour: 2, label: "2AM-6AM", members: ["Vipul"], count: 1 },
	{ hour: 9, label: "9AM-12PM", members: ["Shradha"], count: 1 },
	{ hour: 13, label: "1:30-2:30PM", members: ["Arnav", "Shradha"], count: 2 },
	{ hour: 18, label: "6-7PM", members: ["Ishmeet"], count: 1 },
	{ hour: 19, label: "7-9PM", members: ["Ansul"], count: 1 },
	{ hour: 21, label: "9-10PM", members: ["Shradha"], count: 1 },
	{
		hour: 22,
		label: "10-11PM",
		members: ["Ansul", "Shradha", "Ishmeet", "Rahul", "Arnav"],
		count: 5,
	},
	{
		hour: 23,
		label: "11PM-12AM",
		members: ["Ansul", "Ishmeet", "Rahul", "Arnav", "Darshan"],
		count: 5,
	},
];

export function getISTHour(): number {
	const now = new Date();
	const utc = now.getTime() + now.getTimezoneOffset() * 60000;
	const ist = new Date(utc + 5.5 * 3600000);
	return ist.getHours() + ist.getMinutes() / 60;
}

export function isMemberOnline(
	member: TeamMemberDetail,
	istHourFloat: number,
): boolean {
	const h = Math.floor(istHourFloat);
	return member.slots.some((s) => {
		if (s.end <= 24 && s.start < s.end) {
			return h >= Math.floor(s.start) && h < Math.ceil(s.end);
		}
		return false;
	});
}

export function formatHour(h: number): string {
	const whole = Math.floor(h);
	const min = Math.round((h - whole) * 60);
	const isPM = whole >= 12;
	const displayHour = whole === 0 ? 12 : whole > 12 ? whole - 12 : whole;
	if (min > 0) {
		const minStr = min < 10 ? `0${min}` : `${min}`;
		return `${displayHour}:${minStr} ${isPM ? "PM" : "AM"}`;
	}
	return `${displayHour} ${isPM ? "PM" : "AM"}`;
}

export const GATES_TEMPLATE = [
	{ step: 1, name: "Kickoff", ownerDept: "PM" },
	{ step: 2, name: "Discovery", ownerDept: "PM" },
	{ step: 3, name: "Design", ownerDept: "Design" },
	{ step: 4, name: "Prototype", ownerDept: "Frontend" },
	{ step: 5, name: "Build", ownerDept: "Frontend" },
	{ step: 6, name: "QA", ownerDept: "Testing" },
	{ step: 7, name: "UAT", ownerDept: "PM" },
	{ step: 8, name: "Launch", ownerDept: "DevOps" },
	{ step: 9, name: "Close", ownerDept: "PM" },
];

export const RACI_ROLES = ["PL", "ST", "DS", "DV", "QA", "AM", "CL"] as const;
export const RACI_DELIVERABLES = [
	"Requirements",
	"Design",
	"Build",
	"QA",
	"Launch",
] as const;
