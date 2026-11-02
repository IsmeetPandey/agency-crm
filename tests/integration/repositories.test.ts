import { describe, expect, it } from "../test-utils";
import { activityRepository } from "../../src/lib/repositories/activity.repository";
import { clientsRepository } from "../../src/lib/repositories/clients.repository";
import { handoffsRepository } from "../../src/lib/repositories/handoffs.repository";
import { leadsRepository } from "../../src/lib/repositories/leads.repository";
import { projectsRepository } from "../../src/lib/repositories/projects.repository";
import { tasksRepository } from "../../src/lib/repositories/tasks.repository";
import { workflowRepository } from "../../src/lib/repositories/workflow.repository";

describe("Leads Repository & Idempotent Client Conversion", () => {
  it("creates a lead and lists it", async () => {
    const created = await leadsRepository.create({
      name: "Test Corp",
      contact: "Sam",
      email: "sam@testcorp.example",
      service: "Cloud Architecture",
      value: 120000,
      stage: "Qualified",
      owner: "Ansul",
      followup: "2026-12-01",
      notes: "Test lead",
    });

    expect(created.id).toBeDefined();
    expect(created.name).toBe("Test Corp");

    const all = await leadsRepository.list();
    const found = all.find((l) => l.id === created.id);
    expect(found).toBeDefined();
  });

  it("converts a lead to client idempotently without duplicating client", async () => {
    const lead = await leadsRepository.create({
      name: "Zenith Design",
      contact: "Zoe",
      email: "zoe@zenith.example",
      service: "Design System",
      value: 180000,
      stage: "Proposal",
      owner: "Shradha",
      followup: "",
      notes: "Ready to sign",
    });

    // 1st conversion
    const { lead: converted1, client: client1 } = await leadsRepository.convertToClient(lead.id);
    expect(client1.name).toBe("Zenith Design");

    // Check that lead is now Won and linked
    const updatedLead = (await leadsRepository.list()).find((l) => l.id === lead.id)!;
    expect(updatedLead.stage).toBe("Won");
    expect(updatedLead.convertedClientId).toBe(client1.id);

    // 2nd conversion retry (must be idempotent!)
    const { client: client2 } = await leadsRepository.convertToClient(lead.id);
    expect(client2.id).toBe(client1.id); // Same client reused!
  });
});

describe("Projects & Delivery Repositories", () => {
  it("creates and updates projects and tasks", async () => {
    const project = await projectsRepository.create({
      name: "Quantum UI Experience",
      clientId: "c1",
      phase: "Discovery",
      stackNeeded: "React, Tailwind",
      budget: 150000,
      due: "2026-12-15",
      owner: "Ansul",
      scope: "Modern web portal",
      assignedTeam: ["ansul", "vipul"],
      progress: 10,
    });

    expect(project.id).toBeDefined();

    // Create task
    const task = await tasksRepository.create({
      projectId: project.id,
      name: "Setup CI/CD pipeline",
      dept: "DevOps",
      owner: "Ansul",
      status: "In progress",
      due: "2026-11-20",
    });

    expect(task.projectId).toBe(project.id);

    // Update task
    const updatedTask = await tasksRepository.update(task.id, {
      status: "Completed",
    });
    expect(updatedTask.status).toBe("Completed");
  });
});

describe("Handoffs & Approvals Workflow", () => {
  it("creates handoff and updates acceptance status", async () => {
    const handoff = await handoffsRepository.create({
      projectId: "p1",
      title: "UI Prototype Handoff to Frontend",
      from: "Design",
      to: "Frontend",
      status: "Pending",
      due: "2026-11-25",
    });

    expect(handoff.id).toBeDefined();
    expect(handoff.status).toBe("Pending");

    const accepted = await handoffsRepository.updateStatus(handoff.id, "Accepted", "Ansul");
    expect(accepted.status).toBe("Accepted");
  });

  it("handles approval decisions and records audit activity", async () => {
    const req = await workflowRepository.requestApproval({
      projectId: "p1",
      title: "Milestone QA Acceptance",
      requestedBy: "Shradha",
    });

    expect(req.status).toBe("Pending");

    const decided = await workflowRepository.decideApproval(req.id, "Approved", "All tests passed", "Ansul");
    expect(decided.status).toBe("Approved");

    // Check activity log
    const activities = await activityRepository.list();
    const act = activities.find((a) => a.entityId === req.id);
    expect(act).toBeDefined();
    expect(act!.actor).toBe("Ansul");
  });
});

