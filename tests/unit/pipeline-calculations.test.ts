import { describe, expect, it } from "../test-utils";
import { formatHour, getISTHour, isMemberOnline, TEAM } from "../../src/lib/constants/agency";
import { PERMISSIONS } from "../../src/lib/permissions/permissions";
import { teamRepository } from "../../src/lib/repositories/team.repository";
import type { Lead, Project } from "../../src/types";

describe("Pipeline & Financial Metrics Calculations", () => {
  const sampleLeads: Lead[] = [
    { id: "1", name: "Alpha", contact: "A", email: "a@ex.com", service: "Web", value: 100000, stage: "New", owner: "Ansul", followup: "", notes: "" },
    { id: "2", name: "Beta", contact: "B", email: "b@ex.com", service: "App", value: 250000, stage: "Qualified", owner: "Shradha", followup: "", notes: "" },
    { id: "3", name: "Gamma", contact: "C", email: "c@ex.com", service: "Design", value: 150000, stage: "Proposal", owner: "Darshan", followup: "", notes: "" },
    { id: "4", name: "Delta", contact: "D", email: "d@ex.com", service: "SEO", value: 50000, stage: "Won", owner: "Abhishek", followup: "", notes: "" },
    { id: "5", name: "Epsilon", contact: "E", email: "e@ex.com", service: "Brand", value: 80000, stage: "Lost", owner: "Arnav", followup: "", notes: "" },
  ];

  it("calculates active pipeline value by excluding Won and Lost stages", () => {
    const active = sampleLeads.filter((l) => !["Won", "Lost"].includes(l.stage));
    const total = active.reduce((sum, l) => sum + l.value, 0);

    expect(active.length).toBe(3);
    expect(total).toBe(500000); // 100k + 250k + 150k
  });

  it("calculates won revenue accurately", () => {
    const won = sampleLeads.filter((l) => l.stage === "Won");
    const wonTotal = won.reduce((s, l) => s + l.value, 0);

    expect(won.length).toBe(1);
    expect(wonTotal).toBe(50000);
  });
});

describe("Team Capacity & Allocation", () => {
  it("determines member online schedule correctly based on IST time slot", () => {
    const vipul = TEAM.find((m) => m.id === "vipul")!;
    // Vipul works 12am-6am (slots 0 to 6)
    expect(isMemberOnline(vipul, 2.5)).toBe(true);
    expect(isMemberOnline(vipul, 14)).toBe(false);
  });

  it("formats hours properly in 12h AM/PM format", () => {
    expect(formatHour(0)).toBe("12 AM");
    expect(formatHour(12)).toBe("12 PM");
    expect(formatHour(14)).toBe("2 PM");
    expect(formatHour(9)).toBe("9 AM");
  });

  it("suggests the most qualified team members based on technology requirements", async () => {
    const suggestions = await teamRepository.suggestTeam("React, Flutter, Dart");
    expect(suggestions.length).toBeGreaterThan(0);
    // Darshan knows Flutter and Dart
    const darshan = suggestions.find((s) => s.member.id === "darshan");
    expect(darshan).toBeDefined();
    expect(darshan!.score).toBeGreaterThan(10);
  });
});

describe("Role-Based Access Control (RBAC) Permissions", () => {
  it("enforces owner/admin privileges for organization and settings", () => {
    expect(PERMISSIONS.canManageOrganization("owner")).toBe(true);
    expect(PERMISSIONS.canManageOrganization("admin")).toBe(true);
    expect(PERMISSIONS.canManageOrganization("member")).toBe(false);
  });

  it("allows export only to authorized management roles", () => {
    expect(PERMISSIONS.canExportData("owner")).toBe(true);
    expect(PERMISSIONS.canExportData("manager")).toBe(true);
    expect(PERMISSIONS.canExportData("member")).toBe(false);
  });

  it("allows approval decisions only to managers, admins, and owners", () => {
    expect(PERMISSIONS.canApproveRequests("owner")).toBe(true);
    expect(PERMISSIONS.canApproveRequests("manager")).toBe(true);
    expect(PERMISSIONS.canApproveRequests("member")).toBe(false);
  });
});

