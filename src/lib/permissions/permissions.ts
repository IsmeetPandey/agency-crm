export type UserRole = "owner" | "admin" | "manager" | "member";

export const PERMISSIONS = {
	canManageOrganization(role: UserRole): boolean {
		return role === "owner" || role === "admin";
	},
	canManageUsers(role: UserRole): boolean {
		return role === "owner" || role === "admin";
	},
	canManageLeads(role: UserRole): boolean {
		return (
			role === "owner" ||
			role === "admin" ||
			role === "manager" ||
			role === "member"
		);
	},
	canManageClients(role: UserRole): boolean {
		return (
			role === "owner" ||
			role === "admin" ||
			role === "manager" ||
			role === "member"
		);
	},
	canManageProjects(role: UserRole): boolean {
		return (
			role === "owner" ||
			role === "admin" ||
			role === "manager" ||
			role === "member"
		);
	},
	canManageTeam(role: UserRole): boolean {
		return role === "owner" || role === "admin" || role === "manager";
	},
	canApproveRequests(role: UserRole): boolean {
		return role === "owner" || role === "admin" || role === "manager";
	},
	canManageRaci(role: UserRole): boolean {
		return role === "owner" || role === "admin" || role === "manager";
	},
	canManageFinance(role: UserRole): boolean {
		return role === "owner" || role === "admin" || role === "manager";
	},
	canDeleteOpportunity(role: UserRole): boolean {
		return role === "owner" || role === "admin";
	},
	canExportData(role: UserRole): boolean {
		return role === "owner" || role === "admin" || role === "manager";
	},
	canDeleteOrganization(role: UserRole): boolean {
		return role === "owner";
	},
};
