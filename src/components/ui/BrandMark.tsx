import type React from "react";
import kreatiwitLogo from "../../assets/kreatiwit-logo.png";

interface BrandMarkProps {
	size?: "sm" | "md" | "lg";
	showWordmark?: boolean;
	subtitle?: string;
	className?: string;
}

export const BrandMark: React.FC<BrandMarkProps> = ({
	size = "md",
	showWordmark = true,
	subtitle = "AGENCYOS • STUDIO",
	className = "",
}) => {
	const iconSizes = {
		sm: "w-7 h-7",
		md: "w-9 h-9",
		lg: "w-12 h-12",
	};

	return (
		<div className={`flex items-center gap-2.5 min-w-0 select-none ${className}`}>
			{/* Official Kreatiwit Gradient Monogram Badge */}
			<div
				className={`${iconSizes[size]} shrink-0 relative flex items-center justify-center rounded-full overflow-hidden transition-transform duration-200 hover:scale-105 shadow-xs`}
			>
				<img
					src={kreatiwitLogo}
					alt="Kreatiwit Logo"
					className="w-full h-full object-contain select-none pointer-events-none"
					loading="eager"
					draggable={false}
				/>
			</div>

			{/* Wordmark Hierarchy */}
			{showWordmark && (
				<div className="min-w-0">
					<div className="text-[14px] font-extrabold tracking-tight text-[#1A253C] dark:text-white leading-none flex items-center gap-1.5">
						<span>KREATIWIT</span>
					</div>
					{subtitle && (
						<div className="text-[9px] font-mono font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider truncate">
							{subtitle}
						</div>
					)}
				</div>
			)}
		</div>
	);
};

