import type React from "react";
import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmModalProps {
	isOpen: boolean;
	title: string;
	message: string;
	confirmTextRequired?: string; // Optional keyword required to type
	confirmButtonLabel?: string;
	variant?: "danger" | "warning" | "default";
	onConfirm: () => void;
	onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
	isOpen,
	title,
	message,
	confirmTextRequired,
	confirmButtonLabel = "Confirm Action",
	variant = "danger",
	onConfirm,
	onClose,
}) => {
	const [inputVal, setInputVal] = useState("");

	if (!isOpen) return null;

	const isMatch = confirmTextRequired
		? inputVal.trim() === confirmTextRequired.trim()
		: true;

	const handleConfirm = () => {
		if (isMatch) {
			onConfirm();
			setInputVal("");
			onClose();
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
			<div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-2xl space-y-4">
				<div className="flex items-start justify-between">
					<div className="flex items-center gap-3">
						<div
							className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
								variant === "danger"
									? "bg-rose-500/10 text-rose-600 border border-rose-500/20"
									: "bg-amber-500/10 text-amber-600 border border-amber-500/20"
							}`}
						>
							<AlertTriangle className="w-5 h-5" />
						</div>
						<div>
							<h3 className="text-[15px] font-bold text-[var(--ink)] leading-snug">
								{title}
							</h3>
							<p className="text-[11px] font-mono text-[var(--ink-muted)] uppercase tracking-wider">
								High-Assurance Safety Gate
							</p>
						</div>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="p-1.5 rounded-lg text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-sunken)] transition"
						aria-label="Close dialog"
					>
						<X className="w-4 h-4" />
					</button>
				</div>

				<p className="text-[13px] text-[var(--ink-secondary)] leading-relaxed">
					{message}
				</p>

				{confirmTextRequired && (
					<div className="space-y-1.5 pt-1">
						<label className="text-[11px] font-mono text-[var(--ink-muted)] block">
							Type <span className="font-bold text-rose-600 dark:text-rose-400 select-all font-mono">{confirmTextRequired}</span> to confirm:
						</label>
						<input
							type="text"
							value={inputVal}
							onChange={(e) => setInputVal(e.target.value)}
							placeholder={confirmTextRequired}
							className="studio-input text-[13px] font-mono"
							autoFocus
						/>
					</div>
				)}

				<div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border)]">
					<button
						type="button"
						onClick={onClose}
						className="btn-secondary !h-[34px] !text-[12px] cursor-pointer"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={handleConfirm}
						disabled={!isMatch}
						className={`!h-[34px] !px-4 rounded-lg text-[12px] font-semibold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
							variant === "danger"
								? "bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
								: "btn-primary"
						}`}
					>
						{confirmButtonLabel}
					</button>
				</div>
			</div>
		</div>
	);
};

