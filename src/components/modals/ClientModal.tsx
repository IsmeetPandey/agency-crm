import type React from "react";
import { useState } from "react";
import { clientsRepository } from "../../lib/repositories/clients.repository";
import type { Client } from "../../types";

interface ClientModalProps {
	initialClient?: Client | null;
	onClose: () => void;
	onSuccess: () => void;
}

export const ClientModal: React.FC<ClientModalProps> = ({
	initialClient,
	onClose,
	onSuccess,
}) => {
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const isEditing = !!initialClient;

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (isSubmitting) return;

		setError(null);
		const fd = new FormData(e.currentTarget);
		const name = String(fd.get("name") || "").trim();

		if (!name) {
			setError("Client company name is required");
			return;
		}

		setIsSubmitting(true);
		try {
			if (isEditing && initialClient) {
				await clientsRepository.update(initialClient.id, {
					name,
					contact: String(fd.get("contact") || "").trim(),
					email: String(fd.get("email") || "").trim(),
					phone: String(fd.get("phone") || "").trim(),
					notes: String(fd.get("notes") || "").trim(),
				});
			} else {
				await clientsRepository.create({
					name,
					contact: String(fd.get("contact") || "").trim(),
					email: String(fd.get("email") || "").trim(),
					phone: String(fd.get("phone") || "").trim(),
					notes: String(fd.get("notes") || "").trim(),
				});
			}
			onSuccess();
			onClose();
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : "Failed to save client";
			setError(msg);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs animate-in fade-in">
			<div className="studio-modal w-full max-w-md p-6 space-y-4 bg-white border border-[#DEDEDE] shadow-xl rounded-xl">
				<div className="flex items-center justify-between pb-3 border-b border-[#EDEDED]">
					<h3 className="text-[16px] font-bold text-[#111111]">
						{isEditing ? "Edit Client Account" : "New Client Account"}
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
							Company Name *
						</label>
						<input
							name="name"
							required
							defaultValue={initialClient?.name || ""}
							placeholder="e.g. Orbit Technologies"
							className="studio-input"
						/>
					</div>

					<div>
						<label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#666666] mb-1 block">
							Primary Contact Person
						</label>
						<input
							name="contact"
							defaultValue={initialClient?.contact || ""}
							placeholder="e.g. Avery Quinn"
							className="studio-input"
						/>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#666666] mb-1 block">
								Email
							</label>
							<input
								name="email"
								type="email"
								defaultValue={initialClient?.email || ""}
								placeholder="avery@orbit.example"
								className="studio-input"
							/>
						</div>
						<div>
							<label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#666666] mb-1 block">
								Phone
							</label>
							<input
								name="phone"
								defaultValue={initialClient?.phone || ""}
								placeholder="+91..."
								className="studio-input font-mono"
							/>
						</div>
					</div>

					<div>
						<label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#666666] mb-1 block">
							Client Account Notes
						</label>
						<textarea
							name="notes"
							rows={2}
							defaultValue={initialClient?.notes || ""}
							placeholder="B2B client background, billing requirements..."
							className="studio-input !h-auto py-2"
						/>
					</div>

					<div className="flex items-center justify-between gap-2.5 pt-3 border-t border-[#EDEDED]">
						{isEditing && initialClient && (
							<button
								type="button"
								disabled={isSubmitting}
								onClick={async () => {
									if (confirm(`Archive client "${initialClient.name}"?`)) {
										setIsSubmitting(true);
										try {
											await clientsRepository.archive(initialClient.id);
											onSuccess();
											onClose();
										} catch (err: unknown) {
											const msg =
												err instanceof Error
													? err.message
													: "Failed to archive client";
											setError(msg);
											setIsSubmitting(false);
										}
									}
								}}
								className="text-[12px] text-rose-600 hover:text-rose-700 font-semibold px-2 py-1 mr-auto transition cursor-pointer"
							>
								Archive
							</button>
						)}
						<div className="flex items-center gap-2.5 ml-auto">
							<button
								type="button"
								onClick={onClose}
								className="btn-secondary !h-[34px]"
							>
								Cancel
							</button>
							<button
								type="submit"
								disabled={isSubmitting}
								className="btn-primary !h-[34px] disabled:opacity-50"
							>
								{isSubmitting
									? "Saving..."
									: isEditing
										? "Update Client"
										: "Add Client"}
							</button>
						</div>
					</div>
				</form>
			</div>
		</div>
	);
};
