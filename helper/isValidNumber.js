const isValidNumber = (value) =>
	(typeof value === "number" && Number.isFinite(value)) ||
	(typeof value === "string" &&
		value.trim() !== "" &&
		!Number.isNaN(Number(value)));

module.exports = isValidNumber;
