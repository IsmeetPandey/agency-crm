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
	const [copied, setCopied] = useState(false);

	const handleCopy = async (e: React.MouseEvent | React.KeyboardEvent) => {
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
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error("Failed to copy opportunity reference:", err);
		}
	};

	const handleClick = (e: React.MouseEvent | React.KeyboardEvent) => {
		if (onNavigate && opportunityId) {
			e.stopPropagation();
			onNavigate(opportunityId);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			handleClick(e);
		}
	};

	const isClickable = Boolean(onNavigate && opportunityId);

	return (
		<span
			tabIndex={isClickable ? 0 : undefined}
			role={isClickable ? "button" : undefined}
			onClick={isClickable ? handleClick : undefined}
			onKeyDown={isClickable ? handleKeyDown : undefined}
			className={`inline-flex items-center gap-1.5 font-mono font-medium rounded-md border transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#49B3FC] ${
				isClickable
					? "cursor-pointer hover:border-[#49B3FC] hover:bg-[#F0F8FF] hover:text-[#0070BA]"
					: ""
			} ${
				size === "sm"
					? "text-[11px] px-2 py-0.5 bg-[#F5F7FA] text-[#333333] border-[#DCE2EB]"
					: "text-[13px] px-2.5 py-1 bg-[#F5F7FA] text-[#111111] border-[#CCD5E2] font-semibold"
			} ${className}`}
			title={
				isClickable
					? `Click to view opportunity ${opportunityNo}`
					: opportunityNo
			}
		>
			<span className="text-[#888888] font-light">#</span>
			<span className="tracking-tight">{opportunityNo}</span>

			<button
				type="button"
				onClick={handleCopy}
				className="text-[#999999] hover:text-[#111111] p-0.5 transition cursor-pointer flex items-center justify-center"
				title="Copy Opportunity Number"
				aria-label="Copy Opportunity Number"
			>
				{copied ? (
					<span className="text-emerald-600 text-[10px] font-bold">✓</span>
				) : (
					<span className="text-[10px] opacity-70 hover:opacity-100">📋</span>
				)}
			</button>
		</span>
	);
};
