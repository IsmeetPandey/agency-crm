import type React from "react";
import { useState } from "react";
import { Check, ChevronDown, Laptop, Moon, Sun } from "lucide-react";
import { type ThemePreference, useTheme } from "../../lib/theme/theme.context";

interface ThemeToggleProps {
	compact?: boolean;
	showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
	compact = false,
	showLabel = false,
}) => {
	const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
	const [isOpen, setIsOpen] = useState(false);

	const options: {
		value: ThemePreference;
		label: string;
		icon: React.ComponentType<{ className?: string }>;
	}[] = [
		{ value: "light", label: "Light", icon: Sun },
		{ value: "dark", label: "Dark", icon: Moon },
		{ value: "system", label: "System", icon: Laptop },
	];

	if (compact) {
		return (
			<button
				type="button"
				onClick={toggleTheme}
				className="w-7 h-7 rounded-md border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-sunken)] text-[12px] flex items-center justify-center transition shadow-xs text-[var(--ink)] cursor-pointer"
				title={`Current: ${theme} (${resolvedTheme}) — Click to toggle`}
				aria-label="Toggle visual theme"
			>
				{resolvedTheme === "dark" ? (
					<Moon className="w-3.5 h-3.5 text-blue-400" />
				) : (
					<Sun className="w-3.5 h-3.5 text-amber-500" />
				)}
			</button>
		);
	}

	return (
		<div className="relative inline-block text-left">
			<button
				type="button"
				onClick={() => setIsOpen((v) => !v)}
				className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)] transition shadow-xs text-[var(--ink)] cursor-pointer"
				aria-label="Theme options"
			>
				{resolvedTheme === "dark" ? (
					<Moon className="w-3.5 h-3.5 text-blue-400 shrink-0" />
				) : (
					<Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
				)}
				{showLabel && (
					<span className="capitalize text-[var(--ink-secondary)] hidden sm:inline">
						{theme}
					</span>
				)}
				<ChevronDown className="w-2.5 h-2.5 text-[var(--ink-muted)] shrink-0" />
			</button>

			{isOpen && (
				<>
					<div
						className="fixed inset-0 z-40"
						onClick={() => setIsOpen(false)}
					/>
					<div className="absolute right-0 top-8 z-50 w-32 p-1 studio-modal shadow-lg border border-[var(--border)] animate-in fade-in space-y-0.5 rounded-lg">
						{options.map((opt) => {
							const Icon = opt.icon;
							return (
								<button
									key={opt.value}
									type="button"
									onClick={() => {
										setTheme(opt.value);
										setIsOpen(false);
									}}
									className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-[11px] font-medium transition cursor-pointer ${
										theme === opt.value
											? "bg-[var(--accent-tint)] text-[var(--accent-text)] font-semibold"
											: "text-[var(--ink)] hover:bg-[var(--surface-sunken)]"
									}`}
								>
									<span className="flex items-center gap-2">
										<Icon className="w-3.5 h-3.5 shrink-0" />
										<span>{opt.label}</span>
									</span>
									{theme === opt.value && <Check className="w-3 h-3 shrink-0" />}
								</button>
							);
						})}
					</div>
				</>
			)}
		</div>
	);
};
