import type React from "react";

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
		sm: "w-7 h-7 text-[12px] rounded-lg",
		md: "w-9 h-9 text-[15px] rounded-xl",
		lg: "w-11 h-11 text-[18px] rounded-2xl",
	};

	const logoSize = {
		sm: 18,
		md: 22,
		lg: 26,
	}[size];

	return (
		<div className={`flex items-center gap-2.5 min-w-0 select-none ${className}`}>
			{/* Bespoke Geometric Monogram */}
			<div
				className={`${iconSizes[size]} bg-[#1A253C] dark:bg-slate-900 text-white flex items-center justify-center shrink-0 border border-slate-700/40 shadow-xs relative overflow-hidden`}
			>
				{/* Subtle Ambient Refraction */}
				<div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/15 pointer-events-none" />

				<svg
					width={logoSize}
					height={logoSize}
					viewBox="0 0 24 24"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					className="relative z-10"
					aria-label="Kreatiwit Logo"
				>
					{/* Vertical Stem */}
					<rect x="4" y="3" width="3.5" height="18" rx="1.75" fill="white" />
					{/* Upper Diagonal Arm */}
					<path
						d="M8.5 12.5L16.8 4.2C17.3 3.7 18.2 4 18.2 4.8V5.5C18.2 6 18 6.5 17.6 6.9L11.5 13L8.5 12.5Z"
						fill="white"
					/>
					{/* Lower Diagonal Leg */}
					<path
						d="M10.2 11.5L17.8 19.1C18.2 19.5 18.2 20.2 17.8 20.6L17.2 21.2C16.8 21.6 16.1 21.6 15.7 21.2L8.5 14L10.2 11.5Z"
						fill="white"
					/>
					{/* Active Duty Indicator Dot (Jade Emerald) */}
					<circle cx="19" cy="5" r="2" fill="#10B981" />
				</svg>
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

