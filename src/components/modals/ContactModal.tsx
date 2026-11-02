import type React from "react";
import { useState } from "react";
import { useToast } from "../../lib/feedback/toast.context";
import { contactsRepository } from "../../lib/repositories/contacts.repository";
import type { Client, Contact } from "../../types";

interface ContactModalProps {
	clients: Client[];
	initialContact?: Contact | null;
	initialClientId?: string;
	onClose: () => void;
	onSuccess: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({
	clients,
	initialContact,
	initialClientId,
	onClose,
	onSuccess,
}) => {
	const { toast } = useToast();
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const isEditing = !!initialContact;

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError(null);
		const fd = new FormData(e.currentTarget);

		const name = String(fd.get("name") || "").trim();
		const clientId = String(fd.get("clientId") || "").trim();
		const role = String(fd.get("role") || "").trim();
		const email = String(fd.get("email") || "").trim();
		const phone = String(fd.get("phone") || "").trim();
		const notes = String(fd.get("notes") || "").trim();
		const isPrimary = fd.get("isPrimary") === "on";

		if (!name) {
			setError("Contact person name is required");
			return;
		}
		if (!clientId) {
			setError("Associated client company is required");
			return;
		}

		setIsSubmitting(true);
		try {
			if (isEditing && initialContact) {
				await contactsRepository.update(initialContact.id, {
					clientId,
					name,
					role: role || "Representative",
					email,
					phone,
					notes,
					isPrimary,
				});
				toast({
					title: "Contact Updated",
					description: `${name}'s profile has been updated.`,
					type: "success",
				});
			} else {
				await contactsRepository.create({
					clientId,
					name,
					role: role || "Representative",
					email,
					phone,
					notes,
					isPrimary,
				});
				toast({
					title: "Contact Created",
					description: `${name} has been added to the client roster.`,
					type: "success",
				});
			}
			onSuccess();
			onClose();
		} catch (err: any) {
			setError(err.message || "Failed to save contact");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDelete = async () => {
		if (!initialContact) return;
		if (
			!window.confirm(
				`Are you sure you want to remove contact ${initialContact.name}?`,
			)
		) {
			return;
		}

		setIsDeleting(true);
		try {
			await contactsRepository.delete(initialContact.id);
			toast({
				title: "Contact Removed",
				description: `${initialContact.name} was removed.`,
				type: "info",
			});
			onSuccess();
			onClose();
		} catch (err: any) {
			setError(err.message || "Failed to remove contact");
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs animate-in fade-in">
			<div className="studio-modal w-full max-w-md p-6 space-y-4 bg-white border border-[#DEDEDE] shadow-xl rounded-xl">
				<div className="flex items-center justify-between pb-3 border-b border-[#EDEDED]">
					<h3 className="text-[16px] font-bold text-[#111111]">
						{isEditing ? "Edit Key Contact" : "New Client Contact"}
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
					<div>
						<label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#666666] mb-1 block">
							Client Account *
						</label>
						<select
							name="clientId"
							required
							defaultValue={
								initialContact?.clientId ||
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

					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#666666] mb-1 block">
								Contact Name *
							</label>
							<input
								name="name"
								required
								defaultValue={initialContact?.name || ""}
								placeholder="e.g. Eleanor Vance"
								className="studio-input"
							/>
						</div>
						<div>
							<label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#666666] mb-1 block">
								Role / Title
							</label>
							<input
								name="role"
								defaultValue={initialContact?.role || ""}
								placeholder="e.g. VP Marketing"
								className="studio-input"
							/>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#666666] mb-1 block">
								Email Address
							</label>
							<input
								name="email"
								type="email"
								defaultValue={initialContact?.email || ""}
								placeholder="eleanor@client.com"
								className="studio-input"
							/>
						</div>
						<div>
							<label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#666666] mb-1 block">
								Phone / Mobile
							</label>
							<input
								name="phone"
								defaultValue={initialContact?.phone || ""}
								placeholder="+91 98765 00000"
								className="studio-input"
							/>
						</div>
					</div>

					<div>
						<label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#666666] mb-1 block">
							Notes & Key Preferences
						</label>
						<textarea
							name="notes"
							rows={2}
							defaultValue={initialContact?.notes || ""}
							placeholder="e.g. Prefers WhatsApp updates, budget signatory"
							className="studio-input resize-none"
						/>
					</div>

					<div className="pt-1">
						<label className="flex items-center gap-2 cursor-pointer text-[13px] text-[#333333]">
							<input
								type="checkbox"
								name="isPrimary"
								defaultChecked={initialContact?.isPrimary || false}
								className="rounded border-[#CCCCCC] text-[#49B3FC] focus:ring-[#49B3FC]"
							/>
							<span>
								Designate as <strong>Primary Contact</strong> for this client
							</span>
						</label>
					</div>

					<div className="flex items-center justify-between pt-3 border-t border-[#EDEDED]">
						{isEditing ? (
							<button
								type="button"
								onClick={handleDelete}
								disabled={isDeleting}
								className="text-[12px] font-medium text-rose-600 hover:text-rose-700 underline cursor-pointer"
							>
								{isDeleting ? "Removing..." : "Delete Contact"}
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
										: "Create Contact"}
							</button>
						</div>
					</div>
				</form>
			</div>
		</div>
	);
};
