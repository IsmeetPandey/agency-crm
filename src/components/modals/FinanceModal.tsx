import type React from "react";
import { useState } from "react";
import { useToast } from "../../lib/feedback/toast.context";
import { financeRepository } from "../../lib/repositories/finance.repository";
import type {
	Client,
	FinanceItem,
	FinanceStatus,
	FinanceType,
	Project,
} from "../../types";

interface FinanceModalProps {
	clients: Client[];
	projects: Project[];
	initialItem?: FinanceItem | null;
	initialClientId?: string;
	initialProjectId?: string;
	onClose: () => void;
	onSuccess: () => void;
}

export const FinanceModal: React.FC<FinanceModalProps> = ({
	clients,
	projects,
	initialItem,
	initialClientId,
	initialProjectId,
	onClose,
	onSuccess,
}) => {
	const { toast } = useToast();
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const isEditing = !!initialItem;

	const today = new Date().toISOString().split("T")[0];
	const defaultDue = new Date(Date.now() + 14 * 86400000)
		.toISOString()
		.split("T")[0];

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError(null);
		const fd = new FormData(e.currentTarget);

		const title = String(fd.get("title") || "").trim();
		const type = String(fd.get("type") || "invoice") as FinanceType;
		const clientId = String(fd.get("clientId") || "").trim();
		const projectId = String(fd.get("projectId") || "").trim() || undefined;
		const amount = Number(fd.get("amount")) || 0;
		const status = String(fd.get("status") || "Draft") as FinanceStatus;
		const issueDate = String(fd.get("issueDate") || today);
		const dueDate = String(fd.get("dueDate") || "") || undefined;
		const notes = String(fd.get("notes") || "").trim();

		if (!title) {
			setError("Title / Description is required");
			return;
		}
		if (!clientId) {
			setError("Client company is required");
			return;
		}
		if (amount <= 0) {
			setError("Amount must be greater than zero");
			return;
		}

		setIsSubmitting(true);
		try {
			if (isEditing && initialItem) {
				await financeRepository.update(initialItem.id, {
					title,
					type,
					clientId,
					projectId,
					amount,
					status,
					issueDate,
					dueDate,
					notes,
				});
				toast({
					title: "Record Updated",
					description: `${type.toUpperCase()}: ${title} saved.`,
					type: "success",
				});
			} else {
				await financeRepository.create({
					title,
					type,
					clientId,
					projectId,
					amount,
					status,
					issueDate,
					dueDate,
					notes,
				});
				toast({
					title: "Record Created",
					description: `${type.toUpperCase()}: ${title} recorded.`,
					type: "success",
				});
			}
			onSuccess();
			onClose();
		} catch (err: any) {
			setError(err.message || "Failed to save finance record");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDelete = async () => {
		if (!initialItem) return;
		if (!window.confirm(`Delete ${initialItem.type} "${initialItem.title}"?`))
			return;

		setIsDeleting(true);
		try {
			await financeRepository.delete(initialItem.id);
			toast({
				title: "Record Deleted",
				description: `${initialItem.title} was removed.`,
				type: "info",
			});
			onSuccess();
			onClose();
		} catch (err: any) {
			setError(err.message || "Failed to delete record");
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs animate-in fade-in">
			<div className="studio-modal w-full max-w-lg p-6 space-y-4 bg-white border border-[#DEDEDE] shadow-xl rounded-xl">
				<div className="flex items-center justify-between pb-3 border-b border-[#EDEDED]">
					<h3 className="text-[16px] font-bold text-[#111111]">
						{isEditing
							? "Edit Financial Record"
							: "New Proposal, Quote or Invoice"}
					</h3>
					<button
						type="button"
						onClick={onClose}
						className="text-[#808080] hover:text-[#111111] text-[18px]"
						aria-label="Close"
					>
						×
					</button>
				</div>

				{error && (
					<div className="p-2.5 rounded-md bg-[#FFF0F0] text-[#C62828] border border-[#F8C2C2] text-[12px] font-medium">
						{error}
					</div>
				)}

				<form onSubmit={handleSubmit} className="space-y-3">
					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#666666] mb-1 block">
								Record Type *
							</label>
							<select
								name="type"
								required
								defaultValue={initialItem?.type || "invoice"}
								className="studio-input font-medium"
							>
								<option value="invoice">Invoice</option>
								<option value="proposal">Proposal</option>
								<option value="quotation">Quotation</option>
							</select>
						</div>

						<div>
							<label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#666666] mb-1 block">
								Status *
							</label>
							<select
								name="status"
								required
								defaultValue={initialItem?.status || "Draft"}
								className="studio-input font-medium"
							>
								<option value="Draft">Draft</option>
								<option value="Sent">Sent</option>
								<option value="Accepted">Accepted</option>
								<option value="Paid">Paid</option>
								<option value="Overdue">Overdue</option>
								<option value="Declined">Declined</option>
							</select>
						</div>
					</div>

					<div>
						<label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#666666] mb-1 block">
							Title / Deliverable Description *
						</label>
						<input
							name="title"
							required
							defaultValue={initialItem?.title || ""}
							placeholder="e.g. Sprint 1-2 Milestone Delivery"
							className="studio-input"
						/>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#666666] mb-1 block">
								Client Account *
							</label>
							<select
								name="clientId"
								required
								defaultValue={
									initialItem?.clientId ||
									initialClientId ||
									clients[0]?.id ||
									""
								}
								className="studio-input"
							>
								{clients.map((c) => (
									<option key={c.id} value={c.id}>
										{c.name}
									</option>
								))}
							</select>
						</div>

						<div>
							<label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#666666] mb-1 block">
								Related Project (Optional)
							</label>
							<select
								name="projectId"
								defaultValue={initialItem?.projectId || initialProjectId || ""}
								className="studio-input"
							>
								<option value="">None / General Retainer</option>
								{projects.map((p) => (
									<option key={p.id} value={p.id}>
										{p.name}
									</option>
								))}
							</select>
						</div>
					</div>

					<div className="grid grid-cols-3 gap-3">
						<div>
							<label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#666666] mb-1 block">
								Amount (INR ₹) *
							</label>
							<input
								name="amount"
								type="number"
								required
								min="1000"
								step="1000"
								defaultValue={initialItem?.amount || 150000}
								className="studio-input font-mono"
							/>
						</div>

						<div>
							<label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#666666] mb-1 block">
								Issue Date *
							</label>
							<input
								name="issueDate"
								type="date"
								required
								defaultValue={initialItem?.issueDate || today}
								className="studio-input"
							/>
						</div>

						<div>
							<label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#666666] mb-1 block">
								Due Date
							</label>
							<input
								name="dueDate"
								type="date"
								defaultValue={initialItem?.dueDate || defaultDue}
								className="studio-input"
							/>
						</div>
					</div>

					<div>
						<label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#666666] mb-1 block">
							Terms & Notes
						</label>
						<textarea
							name="notes"
							rows={2}
							defaultValue={initialItem?.notes || ""}
							placeholder="Net 15 days payment terms, bank wire details"
							className="studio-input resize-none"
						/>
					</div>

					<div className="flex items-center justify-between pt-3 border-t border-[#EDEDED]">
						{isEditing ? (
							<button
								type="button"
								onClick={handleDelete}
								disabled={isDeleting}
								className="text-[12px] font-medium text-rose-600 hover:text-rose-700 underline cursor-pointer"
							>
								{isDeleting ? "Deleting..." : "Delete Record"}
							</button>
						) : (
							<div />
						)}

						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={onClose}
								className="px-4 py-2 rounded-lg border border-[#DEDEDE] text-[#666666] hover:bg-[#F5F5F5] text-[13px] font-medium"
							>
								Cancel
							</button>
							<button
								type="submit"
								disabled={isSubmitting}
								className="px-4 py-2 rounded-lg bg-[#222222] hover:bg-[#111111] text-white text-[13px] font-medium disabled:opacity-50"
							>
								{isSubmitting
									? "Saving..."
									: isEditing
										? "Save Changes"
										: "Create Record"}
							</button>
						</div>
					</div>
				</form>
			</div>
		</div>
	);
};
