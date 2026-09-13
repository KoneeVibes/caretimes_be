const BASE_URL = process.env.PAYSTACK_BASE_URL;
const SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

const listTransactions = async ({ page, perPage, status, from, to }) => {
	const params = new URLSearchParams();
	if (page) {
		params.append("page", page);
	}
	if (perPage) {
		params.append("perPage", perPage);
	}
	if (status) {
		params.append("status", status);
	}
	if (from) {
		params.append("from", from);
	}
	if (to) {
		params.append("to", to);
	}
	try {
		const response = await fetch(
			`${BASE_URL}/transaction?${params.toString()}`,
			{
				method: "GET",
				headers: {
					Authorization: `Bearer ${SECRET_KEY}`,
					Accept: "application/json",
				},
			},
		);
		const res = await response.json();
		if (!response.ok) {
			console.error("Error:", res);
			throw new Error(res.message);
		}
		return res;
	} catch (error) {
		console.error("API fetch error:", error);
		throw error;
	}
};

module.exports = listTransactions;
