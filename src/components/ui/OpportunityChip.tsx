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
			className={`inline-flex items-center gap-1.5 font-mono font-medium rounded-md border transition-all ${
				size === "sm"
					? "text-[11px] px-2 py-0.5 bg-[#F5F7FA] text-[#333333] border-[#DCE2EB]"
					: "text-[13px] px-2.5 py-1 bg-[#F5F7FA] text-[#111111] border-[#CCD5E2] font-semibold"
			} ${className}`}
		>
			{isClickable ? (
				<button
					type="button"
					onClick={handleClick}
					className="inline-flex items-center gap-1 cursor-pointer hover:text-[#0070BA] focus-visible:underline focus-visible:outline-none"
					title={`Click to view opportunity ${opportunityNo}`}
				>
					<span className="text-[#888888] font-light">#</span>
					<span className="tracking-tight">{opportunityNo}</span>
				</button>
			) : (
				<span className="inline-flex items-center gap-1" title={opportunityNo}>
					<span className="text-[#888888] font-light">#</span>
					<span className="tracking-tight">{opportunityNo}</span>
				</span>
			)}

			<button
				type="button"
				onClick={handleCopy}
				className="text-[#999999] hover:text-[#111111] p-0.5 transition cursor-pointer flex items-center justify-center rounded hover:bg-slate-200/50"
				title={
					copyStatus === "success"
						? "Copied!"
						: copyStatus === "error"
							? "Copy failed"
							: "Copy Opportunity Number"
				}
				aria-label="Copy Opportunity Number"
			>
				{copyStatus === "success" ? (
					<span className="text-emerald-600 text-[10px] font-bold">✓</span>
				) : copyStatus === "error" ? (
					<span
						className="text-rose-600 text-[10px] font-bold"
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
