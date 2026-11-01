import fs from "node:fs";
import path from "node:path";

const backupDir = path.resolve(process.cwd(), ".data-backup");
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Extracted from original App.tsx
const legacyData = {
  organization: {
    name: "Kreatiwit Agency",
    slug: "kreatiwit",
    currency: "INR",
    timezone: "Asia/Kolkata",
  },
  departments: [
    { id: "PM", label: "Client Facing / PM", members: ["Shradha", "Arnav"], dot: "#6D28D9" },
    { id: "Design", label: "Design / UI UX", members: ["Shradha", "Darshan", "Ismeet"], dot: "#FF4D6A" },
    { id: "Frontend", label: "Frontend", members: ["Ansul", "Vipul", "Rahul"], dot: "#007AFF" },
    { id: "Backend", label: "Backend", members: ["Ansul", "Rahul"], dot: "#6D28D9" },
    { id: "App", label: "App Development", members: ["Darshan", "Rahul"], dot: "#00C7BE" },
    { id: "SEO", label: "SEO", members: ["Abhishek"], learning: ["Shradha", "Rahul"], dot: "#FF9500" },
    { id: "Testing", label: "Testing", members: ["Shradha"], dot: "#30D158" },
    { id: "DevOps", label: "DevOps", members: ["Ansul", "Rahul"], dot: "#5856D6" },
    { id: "Marketing", label: "Digital Marketing / Brand", members: ["Arnav", "Abhishek"], learning: ["Shradha"], dot: "#FF2D55" },
    { id: "AI", label: "AI / ML", members: [], learning: ["Shradha"], dot: "#AF52DE" },
    { id: "Accounts", label: "Accounts", members: ["Abhishek"], dot: "#8E8E93" }
  ],
  leadership: [
    { role: "CEO", name: "Vacant", status: "hiring", tint: "rgba(255,149,0,0.12)", color: "#FF9500" },
    { role: "COO", name: "Abhishek", status: "active", tint: "rgba(48,209,88,0.10)", color: "#30D158" },
    { role: "CTO", name: "Ansul", status: "active", tint: "rgba(109,40,217,0.10)", color: "#6D28D9" },
    { role: "CMO", name: "Arnav", status: "active", tint: "rgba(255,45,85,0.10)", color: "#FF2D55" }
  ],
  team: [
    {
      id: "ansul",
      name: "Ansul",
      roleTitle: "CTO • Fullstack Lead",
      initials: "AN",
      stack: ["React", "Next.js", "Express", "Hapi", "Nest.js", "AWS", "Azure", "GCP", "Cloudflare", "MySQL", "Postgres", "MongoDB", "React Native", "Electron"],
      avail: 4,
      focus: 3,
      slotRaw: "10pm-1am +1hr random",
      slots: [{ start: 22, end: 24 }, { start: 0, end: 1 }],
      departments: ["Frontend", "Backend", "DevOps"],
      learning: [],
      accent: "#6D28D9",
      overload: true,
      email: "ansul@kreatiwit"
    },
    {
      id: "shradha",
      name: "Shradha",
      roleTitle: "PM • Design Lead",
      initials: "SH",
      stack: ["Requirements", "Designs", "Testing", "Proposal", "Client Comm", "Research", "Lead Project", "Figma"],
      avail: 4,
      focus: 2,
      slotRaw: "9-11:30am 2-4pm 9-11pm",
      slots: [{ start: 9, end: 11.5 }, { start: 14, end: 16 }, { start: 21, end: 23 }],
      departments: ["PM", "Design", "Testing"],
      learning: ["SEO", "Marketing", "AI"],
      accent: "#FF2D55",
      overload: true,
      email: "shradha@kreatiwit"
    },
    {
      id: "ismeet",
      name: "Ishmeet",
      roleTitle: "Frontend • 3D Dev",
      initials: "IS",
      stack: ["React", "Next.js", "three.js", "AWS", "SQL", "node.js", "Astro.js", "Figma"],
      avail: 3,
      focus: 2,
      slotRaw: "10pm-12am 6-7pm",
      slots: [{ start: 22, end: 24 }, { start: 18, end: 19 }],
      departments: ["Design"],
      learning: [],
      accent: "#30D158",
      overload: false,
      email: "ismeet@kreatiwit"
    },
    {
      id: "rahul",
      name: "Rahul",
      roleTitle: "Fullstack • WordPress",
      initials: "RH",
      stack: ["React", "Vue", "Next", "Quasar", "PHP Laravel", "Node", "WordPress", "Shopify", "APIs"],
      avail: 3,
      focus: 2,
      slotRaw: "10pm-1am random",
      slots: [{ start: 22, end: 24 }, { start: 0, end: 1 }],
      departments: ["Frontend", "Backend", "App", "DevOps"],
      learning: ["SEO"],
      accent: "#AF52DE",
      overload: true,
      email: "rahul@kreatiwit"
    },
    {
      id: "vipul",
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
      email: "vipul@kreatiwit"
    },
    {
      id: "darshan",
      name: "Darshan",
      roleTitle: "App Dev • Flutter",
      initials: "DA",
      stack: ["Flutter", "Dart", "Kotlin", "Java", "Firebase", "Supabase", "Figma"],
      avail: 4,
      focus: 3,
      slotRaw: "11pm-2am random",
      slots: [{ start: 23, end: 24 }, { start: 0, end: 2 }],
      departments: ["Design", "App"],
      learning: [],
      accent: "#00C7BE",
      overload: false,
      email: "darshan@kreatiwit"
    },
    {
      id: "arnav",
      name: "Arnav",
      roleTitle: "CMO • Brand",
      initials: "AR",
      stack: ["Brand Strategy", "Content", "Campaigns", "Client Comm"],
      avail: 3,
      focus: 2,
      slotRaw: "10pm-12am 1:30-2:30pm Mon-Fri",
      slots: [{ start: 22, end: 24 }, { start: 13.5, end: 14.5 }],
      departments: ["PM", "Marketing"],
      learning: [],
      accent: "#FF9500",
      overload: false,
      email: "arnav@kreatiwit"
    },
    {
      id: "abhishek",
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
      email: "abhishek@kreatiwit"
    }
  ],
  leads: [
    {
      id: "l1",
      name: "Aster Living",
      contact: "Casey Morgan",
      email: "casey@aster.example",
      service: "Website & branding",
      value: 260000,
      stage: "New",
      owner: "Riya Kapoor",
      followup: "2025-09-12",
      notes: "Discovery call requested."
    },
    {
      id: "l2",
      name: "Meridian Health",
      contact: "Parker Blake",
      email: "parker@meridian.example",
      service: "Next.js Commerce",
      value: 420000,
      stage: "Qualified",
      owner: "Arnav",
      followup: "2025-09-10",
      notes: "React + Node required"
    },
    {
      id: "l3",
      name: "Arc Collective",
      contact: "Drew Lane",
      email: "drew@arc.example",
      service: "Flutter App",
      value: 185000,
      stage: "Proposal",
      owner: "Darshan",
      followup: "2025-09-14",
      notes: "Flutter + Firebase"
    },
    {
      id: "l4",
      name: "Vela Systems",
      contact: "Skyler Drew",
      email: "skyler@vela.example",
      service: "AI workflow",
      value: 350000,
      stage: "Contacted",
      owner: "Shradha",
      followup: "2025-09-11",
      notes: "AI/ML + Research"
    },
    {
      id: "l5",
      name: "Northpeak",
      contact: "Alex Kim",
      email: "alex@north.example",
      service: "Brand + SEO",
      value: 125000,
      stage: "Won",
      owner: "Abhishek",
      followup: "2025-09-09",
      notes: "Won!"
    }
  ],
  clients: [
    {
      id: "c1",
      name: "Orbit Technologies",
      contact: "Avery Quinn",
      email: "avery@orbit.example",
      notes: "B2B tech client"
    },
    {
      id: "c2",
      name: "Serein Studio",
      contact: "Taylor Reed",
      email: "taylor@serein.example",
      notes: "Commerce brand"
    },
    {
      id: "c3",
      name: "Northstar Ventures",
      contact: "Jamie Ellis",
      email: "jamie@northstar.example",
      notes: "Campaign client"
    }
  ],
  projects: [
    {
      id: "p1",
      name: "Orbit / Digital Experience",
      clientId: "c1",
      phase: "Design",
      stackNeeded: "React, Next.js, Figma",
      budget: 240000,
      due: "2025-10-20",
      owner: "Shradha",
      scope: "Enterprise website with commerce.",
      assignedTeam: ["ansul", "shradha", "rahul"],
      progress: 45
    },
    {
      id: "p2",
      name: "Serein / Brand & commerce",
      clientId: "c2",
      phase: "Build",
      stackNeeded: "Next.js, Shopify, three.js",
      budget: 180000,
      due: "2025-10-05",
      owner: "Ansul",
      scope: "Brand + storefront.",
      assignedTeam: ["ismeet", "vipul"],
      progress: 68
    }
  ],
  tasks: [
    {
      id: "t1",
      projectId: "p1",
      name: "Product page implementation",
      dept: "Frontend",
      owner: "Ansul",
      status: "In progress",
      due: "2025-09-13"
    },
    {
      id: "t2",
      projectId: "p1",
      name: "CRM integration credentials",
      dept: "Backend",
      owner: "Rahul",
      status: "Blocked",
      due: "2025-09-10"
    },
    {
      id: "t3",
      projectId: "p2",
      name: "Checkout interaction states",
      dept: "Design",
      owner: "Shradha",
      status: "In progress",
      due: "2025-09-12"
    }
  ],
  handoffs: [
    {
      id: "h1",
      projectId: "p1",
      title: "Product templates / implementation review",
      from: "Design",
      to: "Frontend",
      status: "Pending",
      due: "2025-09-13"
    },
    {
      id: "h2",
      projectId: "p2",
      title: "Strategy / experience direction",
      from: "PM",
      to: "Design",
      status: "Accepted",
      due: "2025-09-09"
    }
  ],
  activity: [
    {
      id: "a1",
      text: "Workspace initialized - AgencyOS v3 Liquid Glass live",
      at: "2025-09-01T08:00:00.000Z",
      actor: "System"
    },
    {
      id: "a2",
      text: "Lead created: Aster Living - Website & branding",
      at: "2025-09-01T09:00:00.000Z",
      actor: "Shradha"
    },
    {
      id: "a3",
      text: "Client added: Orbit Technologies",
      at: "2025-09-01T10:00:00.000Z",
      actor: "Abhishek"
    },
    {
      id: "a4",
      text: "Project created: Serein / Brand & commerce with auto-team",
      at: "2025-09-01T11:00:00.000Z",
      actor: "Ansul"
    }
  ],
  gatesTemplate: [
    { step: 1, name: "Kickoff", ownerDept: "PM" },
    { step: 2, name: "Discovery", ownerDept: "PM" },
    { step: 3, name: "Design", ownerDept: "Design" },
    { step: 4, name: "Prototype", ownerDept: "Frontend" },
    { step: 5, name: "Build", ownerDept: "Frontend" },
    { step: 6, name: "QA", ownerDept: "Testing" },
    { step: 7, name: "UAT", ownerDept: "PM" },
    { step: 8, name: "Launch", ownerDept: "DevOps" },
    { step: 9, name: "Close", ownerDept: "PM" }
  ],
  raciDeliverables: ["Requirements", "Design", "Build", "QA", "Launch"],
  raciRoles: ["PL", "ST", "DS", "DV", "QA", "AM", "CL"]
};

const backupFile = path.join(backupDir, "legacy-agency-data.json");
fs.writeFileSync(backupFile, JSON.stringify(legacyData, null, 2), "utf-8");

console.log("=== SECURE DATA PRESERVATION REPORT ===");
console.log(`Saved backup to: ${backupFile}`);
console.log("Entity Counts:");
for (const [key, value] of Object.entries(legacyData)) {
  if (Array.isArray(value)) {
    console.log(`- ${key}: ${value.length} records`);
  } else if (typeof value === "object") {
    console.log(`- ${key}: object config`);
  }
}
console.log("=======================================");

