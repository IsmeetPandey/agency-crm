import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

interface ThemeContextType {
	theme: ThemePreference;
	resolvedTheme: ResolvedTheme;
	setTheme: (theme: ThemePreference) => void;
	toggleTheme: () => void;
}

const STORAGE_KEY = "kreatiwit-theme";

const ThemeContext = createContext<ThemeContextType>({
	theme: "system",
	resolvedTheme: "light",
	setTheme: () => {},
	toggleTheme: () => {},
});

function getSystemTheme(): ResolvedTheme {
	if (typeof window === "undefined" || !window.matchMedia) return "light";
	return window.matchMedia("(prefers-color-scheme: dark)").matches
		? "dark"
		: "light";
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [theme, setThemeState] = useState<ThemePreference>(() => {
		if (typeof window === "undefined") return "system";
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored === "light" || stored === "dark" || stored === "system") {
				return stored;
			}
		} catch {}
		return "system";
	});

	const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
		if (theme === "system") return getSystemTheme();
		return theme;
	});

	useEffect(() => {
		const applyTheme = () => {
			const activeTheme: ResolvedTheme =
				theme === "system" ? getSystemTheme() : theme;
			setResolvedTheme(activeTheme);

			const root = document.documentElement;
			root.setAttribute("data-theme", activeTheme);
			root.style.colorScheme = activeTheme;

			try {
				localStorage.setItem(STORAGE_KEY, theme);
			} catch {}
		};

		applyTheme();

		// Listen for system preference changes when in 'system' mode
		if (theme === "system" && typeof window !== "undefined") {
			const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
			const handleChange = () => applyTheme();

			if (mediaQuery.addEventListener) {
				mediaQuery.addEventListener("change", handleChange);
				return () => mediaQuery.removeEventListener("change", handleChange);
			}
			mediaQuery.addListener(handleChange);
			return () => mediaQuery.removeListener(handleChange);
		}
	}, [theme]);

	const setTheme = (newTheme: ThemePreference) => {
		setThemeState(newTheme);
	};

	const toggleTheme = () => {
		setThemeState((prev) => {
			if (prev === "light") return "dark";
			if (prev === "dark") return "light";
			return getSystemTheme() === "dark" ? "light" : "dark";
		});
	};

	return (
		<ThemeContext.Provider
			value={{
				theme,
				resolvedTheme,
				setTheme,
				toggleTheme,
			}}
		>
			{children}
		</ThemeContext.Provider>
	);
};

export const useTheme = () => useContext(ThemeContext);
