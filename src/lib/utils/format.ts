/**
 * Currency and date formatting utilities for KREATIWIT AgencyOS
 */

/**
 * Formats a monetary value according to specified currency code (defaults to INR).
 * Handles INR (₹), USD ($), EUR (€), GBP (£), etc. cleanly.
 */
export function formatCurrency(
	amount: number | undefined | null,
	currency = "INR",
): string {
	const val = typeof amount === "number" && !Number.isNaN(amount) ? amount : 0;
	const code = (currency || "INR").toUpperCase();

	try {
		return new Intl.NumberFormat(code === "INR" ? "en-IN" : "en-US", {
			style: "currency",
			currency: code,
			maximumFractionDigits: 0,
		}).format(val);
	} catch {
		const symbolMap: Record<string, string> = {
			INR: "₹",
			USD: "$",
			EUR: "€",
			GBP: "£",
		};
		const symbol = symbolMap[code] || `${code} `;
		return `${symbol}${val.toLocaleString()}`;
	}
}

/**
 * Compact currency formatter for headers and chips (e.g., ₹240k or $1.2M)
 */
export function formatCompactCurrency(
	amount: number | undefined | null,
	currency = "INR",
): string {
	const val = typeof amount === "number" && !Number.isNaN(amount) ? amount : 0;
	const code = (currency || "INR").toUpperCase();
	const symbolMap: Record<string, string> = {
		INR: "₹",
		USD: "$",
		EUR: "€",
		GBP: "£",
	};
	const symbol = symbolMap[code] || `${code} `;

	if (val >= 10000000) {
		return `${symbol}${(val / 10000000).toFixed(1)}Cr`;
	}
	if (val >= 100000) {
		return `${symbol}${(val / 100000).toFixed(1)}L`;
	}
	if (val >= 1000) {
		return `${symbol}${(val / 1000).toFixed(0)}k`;
	}
	return `${symbol}${val}`;
}

/**
 * Formats ISO date strings to human-readable studio dates
 */
export function formatDate(dateString?: string): string {
	if (!dateString) return "—";
	try {
		const d = new Date(dateString);
		if (Number.isNaN(d.getTime())) return dateString;
		return d.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		});
	} catch {
		return dateString;
	}
}
