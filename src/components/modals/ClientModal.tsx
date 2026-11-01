import type React from "react";
import { useState } from "react";
import { clientsRepository } from "../../lib/repositories/clients.repository";

interface ClientModalProps {
	onClose: () => void;
	onSuccess: () => void;
}

export const ClientModal: React.FC<ClientModalProps> = ({
	onClose,
	onSuccess,
}) => {
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError(null);
		const fd = new FormData(e.currentTarget);
		const name = String(fd.get("name") || "").trim();
		if (!name) {
			setError("Client company name is required");
			return;
		}

		setIsSubmitting(true);
		try {
			await clientsRepository.create({
				name,
				contact: String(fd.get("contact") || ""),
				email: String(fd.get("email") || ""),
				phone: String(fd.get("phone") || ""),
				notes: String(fd.get("notes") || ""),
			});
			onSuccess();
			onClose();
		} catch (err: any) {
			setError(err.message || "Failed to create client");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
			<div className="liquid-modal w-full max-w-md p-6 space-y-4">
				<div className="flex items-center justify-between pb-3 border-b border-black/[0.08]">
					<h3 className="text-[16px] font-[700] text-[#1D1D1F]">
						New Client Account • Liquid Glass
					</h3>
					<button
						type="button"
						onClick={onClose}
						className="text-[#86868B] hover:text-[#1D1D1F] text-[18px]"
					>
						×
					</button>
				</div>

				{error && (
					<div className="p-2.5 rounded-[8px] bg-[#FF2D55]/10 text-[#FF2D55] text-[12px] font-[500]">
						{error}
					</div>
				)}

				<form onSubmit={handleSubmit} className="space-y-3">
					<div>
						<label className="text-[11px] font-[600] uppercase text-[#86868B] mb-1 block">
							Company Name *
						</label>
						<input
							name="name"
							required
							placeholder="e.g. Orbit Technologies"
							className="input-glass"
						/>
					</div>

					<div>
						<label className="text-[11px] font-[600] uppercase text-[#86868B] mb-1 block">
							Primary Contact Person
						</label>
						<input
							name="contact"
							placeholder="e.g. Avery Quinn"
							className="input-glass"
						/>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="text-[11px] font-[600] uppercase text-[#86868B] mb-1 block">
								Email
							</label>
							<input
								name="email"
								type="email"
								placeholder="avery@orbit.example"
								className="input-glass"
							/>
						</div>
						<div>
							<label className="text-[11px] font-[600] uppercase text-[#86868B] mb-1 block">
								Phone
							</label>
							<input
								name="phone"
								placeholder="+91..."
								className="input-glass"
							/>
						</div>
					</div>

					<div>
						<label className="text-[11px] font-[600] uppercase text-[#86868B] mb-1 block">
							Client Account Notes
						</label>
						<textarea
							name="notes"
							rows={2}
							placeholder="B2B client background, billing requirements..."
							className="input-glass !h-auto py-2"
						/>
					</div>

					<div className="flex justify-end gap-2 pt-3 border-t border-black/[0.08]">
						<button
							type="button"
							onClick={onClose}
							className="btn-liquid !h-[32px]"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={isSubmitting}
							className="btn-liquid btn-liquid-primary !h-[32px]"
						>
							{isSubmitting ? "Saving..." : "Add Client"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};
