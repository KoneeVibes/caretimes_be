const getChartConfig = (period, value) => {
	const allowedPeriods = ["day", "month"];
	const numericValue = Number(value);

	if (
		!allowedPeriods.includes(period) ||
		!Number.isInteger(numericValue) ||
		numericValue < 1
	) {
		return null;
	}

	const now = new Date();
	let from;
	let bucket;

	if (period === "day") {
		from = new Date(now);
		from.setUTCHours(0, 0, 0, 0);
		from.setUTCDate(from.getUTCDate() - (numericValue - 1));
		bucket = "day";
	} else {
		from = new Date(now);
		bucket = numericValue === 1 ? "day" : "month";

		if (bucket === "day") {
			from.setUTCMonth(from.getUTCMonth() - 1);
			from.setUTCHours(0, 0, 0, 0);
		} else {
			from.setUTCMonth(from.getUTCMonth() - (numericValue - 1), 1);
			from.setUTCHours(0, 0, 0, 0);
		}
	}

	return {
		period,
		value: numericValue,
		bucket,
		from: from.toISOString(),
		to: now.toISOString(),
	};
};

module.exports = getChartConfig;
