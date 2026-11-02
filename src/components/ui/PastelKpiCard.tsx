import type React from "react";

export type PastelCardColor = "green" | "yellow" | "pink" | "blue";

export interface PastelKpiCardProps {
	title: string;
	value: string | number;
	icon: React.ReactNode;
	color: PastelCardColor;
	caption?: string;
	progressPercent?: number;
	onClick?: () => void;
	className?: string;
}

const COLOR_MAP: Record<
	PastelCardColor,
	{
		bgClass: string;
		borderClass: string;
		barTrackClass: string;
		barFillClass: string;
		titleClass: string;
		valueClass: string;
		captionClass: string;
		iconClass: string;
	}
> = {
	green: {
		bgClass: "bg-[var(--kpi-green-bg)]",
		borderClass: "border-[var(--kpi-green-border)]",
		barTrackClass: "bg-emerald-500/20",
		barFillClass: "bg-[var(--kpi-green-bar)]",
		titleClass: "text-[var(--kpi-green-text)]",
		valueClass: "text-slate-900 dark:text-emerald-50",
		captionClass: "text-slate-600 dark:text-emerald-200/70",
		iconClass: "text-emerald-800 dark:text-emerald-300",
	},
	yellow: {
		bgClass: "bg-[var(--kpi-yellow-bg)]",
		borderClass: "border-[var(--kpi-yellow-border)]",
		barTrackClass: "bg-amber-500/20",
		barFillClass: "bg-[var(--kpi-yellow-bar)]",
		titleClass: "text-[var(--kpi-yellow-text)]",
		valueClass: "text-slate-900 dark:text-amber-50",
		captionClass: "text-slate-600 dark:text-amber-200/70",
		iconClass: "text-amber-800 dark:text-amber-300",
	},
	pink: {
		bgClass: "bg-[var(--kpi-pink-bg)]",
		borderClass: "border-[var(--kpi-pink-border)]",
		barTrackClass: "bg-rose-500/20",
		barFillClass: "bg-[var(--kpi-pink-bar)]",
		titleClass: "text-[var(--kpi-pink-text)]",
		valueClass: "text-slate-900 dark:text-rose-50",
		captionClass: "text-slate-600 dark:text-rose-200/70",
		iconClass: "text-rose-800 dark:text-rose-300",
	},
	blue: {
		bgClass: "bg-[var(--kpi-blue-bg)]",
		borderClass: "border-[var(--kpi-blue-border)]",
		barTrackClass: "bg-blue-500/20",
		barFillClass: "bg-[var(--kpi-blue-bar)]",
		titleClass: "text-[var(--kpi-blue-text)]",
		valueClass: "text-slate-900 dark:text-blue-50",
		captionClass: "text-slate-600 dark:text-blue-200/70",
		iconClass: "text-blue-800 dark:text-blue-300",
	},
};

export const PastelKpiCard: React.FC<PastelKpiCardProps> = ({
	title,
	value,
	icon,
	color,
	caption = "out of 100",
	progressPercent = 45,
	onClick,
	className = "",
}) => {
	const c = COLOR_MAP[color];
	const clampedProgress = Math.max(0, Math.min(100, progressPercent));

	return (
		<div
			onClick={onClick}
			className={`relative p-5 rounded-2xl border shadow-sm transition-all duration-200 ${c.bgClass} ${c.borderClass} ${
				onClick ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-md" : ""
			} ${className}`}
		>
			{/* Top Header: Title + Category Icon */}
			<div className="flex items-center justify-between gap-2 mb-3">
				<span
					className={`text-[13px] font-semibold tracking-tight ${c.titleClass}`}
				>
					{title}
				</span>
				<div
					className={`p-1.5 rounded-lg bg-black/5 dark:bg-white/10 ${c.iconClass}`}
				>
					{icon}
				</div>
			</div>

			{/* Progress Indicator Track & Filled Bar */}
			<div
				className={`w-full h-1.5 rounded-full overflow-hidden mb-3.5 ${c.barTrackClass}`}
			>
				<div
					className={`h-full rounded-full transition-all duration-500 ease-out ${c.barFillClass}`}
					style={{ width: `${clampedProgress}%` }}
				/>
			</div>

			{/* Large Bold Metric */}
			<div
				className={`text-3xl font-extrabold tracking-tight mb-1 font-sans ${c.valueClass}`}
			>
				{value}
			</div>

			{/* Supporting Information Caption */}
			<div className={`text-[11px] font-medium ${c.captionClass}`}>
				{caption}
			</div>
		</div>
	);
};
