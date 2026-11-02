import type React from "react";
import { useState } from "react";

interface OpportunityChipProps {
	opportunityNo: string;
	opportunityId?: string;
	onNavigate?: (opportunityId: string) => void;
	size?: "sm" | "md";
	className?: string;
}

export const OpportunityChip: React.FC<OpportunityChipProps> = ({
	opportunityNo,
	opportunityId,
	onNavigate,
	size = "sm",
	className = "",
}) => {
	const [copyStatus, setCopyStatus] = useState<"idle" | "success" | "error">(
		"idle",
	);

	const handleCopy = async (e: React.MouseEvent) => {
		e.stopPropagation();
		try {
			if (navigator.clipboard && navigator.clipboard.writeText) {
				await navigator.clipboard.writeText(opportunityNo);
			} else {
				const textArea = document.createElement("textarea");
				textArea.value = opportunityNo;
				document.body.appendChild(textArea);
				textArea.select();
				document.execCommand("copy");
				document.body.removeChild(textArea);
			}
			setCopyStatus("success");
			setTimeout(() => setCopyStatus("idle"), 2000);
		} catch (err) {
			console.error("Failed to copy opportunity reference:", err);
			setCopyStatus("error");
			setTimeout(() => setCopyStatus("idle"), 2500);
		}
	};

	const handleClick = (e: React.MouseEvent) => {
		if (onNavigate && opportunityId) {
			e.stopPropagation();
			onNavigate(opportunityId);
		}
	};

	const isClickable = Boolean(onNavigate && opportunityId);

	return (
		<span
			className={`inline-flex items-center gap-1.5 font-mono font-medium rounded-md border whitespace-nowrap shrink-0 select-none transition-all ${
				size === "sm"
					? "text-[11px] px-2 py-0.5 bg-[var(--accent-tint)] text-[var(--ink)] border-[var(--accent-border)]"
					: "text-[12px] px-2.5 py-1 bg-[var(--accent-tint)] text-[var(--ink-strong)] border-[var(--accent-border)] font-semibold shadow-xs"
			} ${className}`}
		>
			{isClickable ? (
				<button
					type="button"
					onClick={handleClick}
					className="inline-flex items-center gap-1 cursor-pointer hover:text-[var(--accent)] hover:underline focus-visible:underline focus-visible:outline-none transition whitespace-nowrap"
					title={`Click to view opportunity ${opportunityNo}`}
				>
					<span className="text-[var(--accent-text)] font-semibold text-[10px]">
						SKU:
					</span>
					<span className="tracking-tight font-bold">{opportunityNo}</span>
				</button>
			) : (
				<span
					className="inline-flex items-center gap-1 whitespace-nowrap"
					title={opportunityNo}
				>
					<span className="text-[var(--accent-text)] font-semibold text-[10px]">
						SKU:
					</span>
					<span className="tracking-tight font-bold">{opportunityNo}</span>
				</span>
			)}

			<button
				type="button"
				onClick={handleCopy}
				className="text-[var(--ink-muted)] hover:text-[var(--ink)] p-0.5 transition cursor-pointer flex items-center justify-center rounded hover:bg-[var(--surface-sunken)]"
				title={
					copyStatus === "success"
						? "Copied to clipboard!"
						: copyStatus === "error"
							? "Copy failed"
							: "Copy Opportunity Reference"
				}
				aria-label="Copy Opportunity Reference"
			>
				{copyStatus === "success" ? (
					<span className="text-[var(--success)] text-[10px] font-bold">✓</span>
				) : copyStatus === "error" ? (
					<span
						className="text-[var(--danger)] text-[10px] font-bold"
						title="Copy failed"
					>
						!
					</span>
				) : (
					<span className="text-[10px] opacity-70 hover:opacity-100">📋</span>
				)}
			</button>
		</span>
	);
};
