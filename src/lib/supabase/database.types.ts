export type Json =
	| string
	| number
	| boolean
	| null
	| { [key: string]: Json | undefined }
	| Json[];

export interface Database {
	public: {
		Tables: {
			organizations: {
				Row: {
					id: string;
					name: string;
					slug: string;
					currency: string;
					timezone: string;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					name: string;
					slug: string;
					currency?: string;
					timezone?: string;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					name?: string;
					slug?: string;
					currency?: string;
					timezone?: string;
					updated_at?: string;
				};
			};
			profiles: {
				Row: {
					id: string;
					full_name: string;
					email: string;
					avatar_url: string | null;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id: string;
					full_name: string;
					email: string;
					avatar_url?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					full_name?: string;
					email?: string;
					avatar_url?: string | null;
					updated_at?: string;
				};
			};
			organization_memberships: {
				Row: {
					id: string;
					organization_id: string;
					user_id: string;
					role: "owner" | "admin" | "manager" | "member";
					created_at: string;
				};
				Insert: {
					id?: string;
					organization_id: string;
					user_id: string;
					role: "owner" | "admin" | "manager" | "member";
					created_at?: string;
				};
				Update: {
					role?: "owner" | "admin" | "manager" | "member";
				};
			};
			departments: {
				Row: {
					id: string;
					organization_id: string;
					code: string;
					name: string;
					color: string;
					dot: string;
					created_at: string;
				};
				Insert: {
					id?: string;
					organization_id: string;
					code: string;
					name: string;
					color?: string;
					dot?: string;
					created_at?: string;
				};
				Update: {
					code?: string;
					name?: string;
					color?: string;
					dot?: string;
				};
			};
			team_members: {
				Row: {
					id: string;
					legacy_id: string | null;
					organization_id: string;
					user_id: string | null;
					name: string;
					email: string;
					role_title: string;
					initials: string;
					accent: string;
					avail_hours: number;
					focus_hours: number;
					slot_raw: string | null;
					is_overloaded: boolean;
					status: "active" | "hiring" | "inactive";
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					legacy_id?: string | null;
					organization_id: string;
					user_id?: string | null;
					name: string;
					email: string;
					role_title: string;
					initials: string;
					accent?: string;
					avail_hours?: number;
					focus_hours?: number;
					slot_raw?: string | null;
					is_overloaded?: boolean;
					status?: "active" | "hiring" | "inactive";
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					name?: string;
					email?: string;
					role_title?: string;
					initials?: string;
					accent?: string;
					avail_hours?: number;
					focus_hours?: number;
					slot_raw?: string | null;
					is_overloaded?: boolean;
					status?: "active" | "hiring" | "inactive";
					updated_at?: string;
				};
			};
			clients: {
				Row: {
					id: string;
					legacy_id: string | null;
					organization_id: string;
					name: string;
					contact_person: string | null;
					email: string | null;
					phone: string | null;
					notes: string | null;
					status: "active" | "archived";
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					legacy_id?: string | null;
					organization_id: string;
					name: string;
					contact_person?: string | null;
					email?: string | null;
					phone?: string | null;
					notes?: string | null;
					status?: "active" | "archived";
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					name?: string;
					contact_person?: string | null;
					email?: string | null;
					phone?: string | null;
					notes?: string | null;
					status?: "active" | "archived";
					updated_at?: string;
				};
			};
			leads: {
				Row: {
					id: string;
					legacy_id: string | null;
					organization_id: string;
					name: string;
					contact_person: string | null;
					email: string | null;
					service: string | null;
					estimated_value: number;
					stage:
						| "New"
						| "Contacted"
						| "Qualified"
						| "Proposal"
						| "Won"
						| "Lost";
					owner_id: string | null;
					owner_name: string | null;
					next_followup: string | null;
					notes: string | null;
					converted_to_client_id: string | null;
					converted_at: string | null;
					status: "active" | "archived";
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					legacy_id?: string | null;
					organization_id: string;
					name: string;
					contact_person?: string | null;
					email?: string | null;
					service?: string | null;
					estimated_value?: number;
					stage?:
						| "New"
						| "Contacted"
						| "Qualified"
						| "Proposal"
						| "Won"
						| "Lost";
					owner_id?: string | null;
					owner_name?: string | null;
					next_followup?: string | null;
					notes?: string | null;
					converted_to_client_id?: string | null;
					converted_at?: string | null;
					status?: "active" | "archived";
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					name?: string;
					contact_person?: string | null;
					email?: string | null;
					service?: string | null;
					estimated_value?: number;
					stage?:
						| "New"
						| "Contacted"
						| "Qualified"
						| "Proposal"
						| "Won"
						| "Lost";
					owner_id?: string | null;
					owner_name?: string | null;
					next_followup?: string | null;
					notes?: string | null;
					converted_to_client_id?: string | null;
					converted_at?: string | null;
					status?: "active" | "archived";
					updated_at?: string;
				};
			};
			projects: {
				Row: {
					id: string;
					legacy_id: string | null;
					organization_id: string;
					client_id: string;
					name: string;
					phase:
						| "Kickoff"
						| "Discovery"
						| "Design"
						| "Prototype"
						| "Build"
						| "QA"
						| "UAT"
						| "Launch"
						| "Close";
					stack_needed: string | null;
					budget: number;
					due_date: string | null;
					owner_id: string | null;
					owner_name: string | null;
					scope: string | null;
					progress: number;
					status: "active" | "completed" | "archived";
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					legacy_id?: string | null;
					organization_id: string;
					client_id: string;
					name: string;
					phase?:
						| "Kickoff"
						| "Discovery"
						| "Design"
						| "Prototype"
						| "Build"
						| "QA"
						| "UAT"
						| "Launch"
						| "Close";
					stack_needed?: string | null;
					budget?: number;
					due_date?: string | null;
					owner_id?: string | null;
					owner_name?: string | null;
					scope?: string | null;
					progress?: number;
					status?: "active" | "completed" | "archived";
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					client_id?: string;
					name?: string;
					phase?:
						| "Kickoff"
						| "Discovery"
						| "Design"
						| "Prototype"
						| "Build"
						| "QA"
						| "UAT"
						| "Launch"
						| "Close";
					stack_needed?: string | null;
					budget?: number;
					due_date?: string | null;
					owner_id?: string | null;
					owner_name?: string | null;
					scope?: string | null;
					progress?: number;
					status?: "active" | "completed" | "archived";
					updated_at?: string;
				};
			};
			tasks: {
				Row: {
					id: string;
					legacy_id: string | null;
					organization_id: string;
					project_id: string;
					title: string;
					description: string | null;
					department_code: string;
					assigned_to_id: string | null;
					assigned_to_name: string | null;
					status: "Todo" | "In progress" | "Blocked" | "Completed";
					priority: "Low" | "Medium" | "High" | "Urgent";
					due_date: string | null;
					completed_at: string | null;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					legacy_id?: string | null;
					organization_id: string;
					project_id: string;
					title: string;
					description?: string | null;
					department_code: string;
					assigned_to_id?: string | null;
					assigned_to_name?: string | null;
					status?: "Todo" | "In progress" | "Blocked" | "Completed";
					priority?: "Low" | "Medium" | "High" | "Urgent";
					due_date?: string | null;
					completed_at?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					title?: string;
					description?: string | null;
					department_code?: string;
					assigned_to_id?: string | null;
					assigned_to_name?: string | null;
					status?: "Todo" | "In progress" | "Blocked" | "Completed";
					priority?: "Low" | "Medium" | "High" | "Urgent";
					due_date?: string | null;
					completed_at?: string | null;
					updated_at?: string;
				};
			};
			handoffs: {
				Row: {
					id: string;
					legacy_id: string | null;
					organization_id: string;
					project_id: string;
					title: string;
					description: string | null;
					from_dept: string;
					to_dept: string;
					status:
						| "Pending"
						| "Accepted"
						| "Rejected"
						| "Changes Requested"
						| "Completed";
					due_date: string | null;
					accepted_by: string | null;
					accepted_at: string | null;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					legacy_id?: string | null;
					organization_id: string;
					project_id: string;
					title: string;
					description?: string | null;
					from_dept: string;
					to_dept: string;
					status?:
						| "Pending"
						| "Accepted"
						| "Rejected"
						| "Changes Requested"
						| "Completed";
					due_date?: string | null;
					accepted_by?: string | null;
					accepted_at?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					title?: string;
					description?: string | null;
					from_dept?: string;
					to_dept?: string;
					status?:
						| "Pending"
						| "Accepted"
						| "Rejected"
						| "Changes Requested"
						| "Completed";
					due_date?: string | null;
					accepted_by?: string | null;
					accepted_at?: string | null;
					updated_at?: string;
				};
			};
			project_gates: {
				Row: {
					id: string;
					project_id: string;
					step_number: number;
					name: string;
					owner_dept: string;
					status: "Pending" | "In Review" | "Approved" | "Rejected";
					notes: string | null;
					approved_by: string | null;
					approved_at: string | null;
					created_at: string;
				};
				Insert: {
					id?: string;
					project_id: string;
					step_number: number;
					name: string;
					owner_dept: string;
					status?: "Pending" | "In Review" | "Approved" | "Rejected";
					notes?: string | null;
					approved_by?: string | null;
					approved_at?: string | null;
					created_at?: string;
				};
				Update: {
					status?: "Pending" | "In Review" | "Approved" | "Rejected";
					notes?: string | null;
					approved_by?: string | null;
					approved_at?: string | null;
				};
			};
			approval_requests: {
				Row: {
					id: string;
					organization_id: string;
					project_id: string;
					gate_id: string | null;
					title: string;
					status: "Pending" | "Approved" | "Rejected" | "Changes Requested";
					requested_by: string;
					assigned_approver: string | null;
					decision_notes: string | null;
					decided_at: string | null;
					created_at: string;
				};
				Insert: {
					id?: string;
					organization_id: string;
					project_id: string;
					gate_id?: string | null;
					title: string;
					status?: "Pending" | "Approved" | "Rejected" | "Changes Requested";
					requested_by: string;
					assigned_approver?: string | null;
					decision_notes?: string | null;
					decided_at?: string | null;
					created_at?: string;
				};
				Update: {
					status?: "Pending" | "Approved" | "Rejected" | "Changes Requested";
					decision_notes?: string | null;
					decided_at?: string | null;
				};
			};
			scope_changes: {
				Row: {
					id: string;
					organization_id: string;
					project_id: string;
					title: string;
					category: "Scope" | "Timeline" | "Budget" | "Stack" | "Other";
					description: string;
					cost_delta: number;
					days_delta: number;
					mitigation: string | null;
					status: "Pending" | "Approved" | "Rejected";
					requested_by: string;
					created_at: string;
				};
				Insert: {
					id?: string;
					organization_id: string;
					project_id: string;
					title: string;
					category?: "Scope" | "Timeline" | "Budget" | "Stack" | "Other";
					description: string;
					cost_delta?: number;
					days_delta?: number;
					mitigation?: string | null;
					status?: "Pending" | "Approved" | "Rejected";
					requested_by: string;
					created_at?: string;
				};
				Update: {
					status?: "Pending" | "Approved" | "Rejected";
				};
			};
			project_raci_assignments: {
				Row: {
					id: string;
					project_id: string;
					deliverable: string;
					role_code: string;
					assignment: "R" | "A" | "C" | "I" | "—" | "A/R";
					updated_at: string;
				};
				Insert: {
					id?: string;
					project_id: string;
					deliverable: string;
					role_code: string;
					assignment?: "R" | "A" | "C" | "I" | "—" | "A/R";
					updated_at?: string;
				};
				Update: {
					assignment?: "R" | "A" | "C" | "I" | "—" | "A/R";
					updated_at?: string;
				};
			};
			activity_events: {
				Row: {
					id: string;
					organization_id: string;
					actor_name: string;
					actor_id: string | null;
					entity_type: string;
					entity_id: string | null;
					action: string;
					summary: string;
					metadata: Json;
					created_at: string;
				};
				Insert: {
					id?: string;
					organization_id: string;
					actor_name: string;
					actor_id?: string | null;
					entity_type: string;
					entity_id?: string | null;
					action: string;
					summary: string;
					metadata?: Json;
					created_at?: string;
				};
				Update: {
					summary?: string;
				};
			};
		};
	};
}
