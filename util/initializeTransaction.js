const BASE_URL = process.env.PAYSTACK_BASE_URL;
const SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

const initializeTransaction = async (queryParams = {}) => {
	const payload = {
		...queryParams,
		channels: ["card", "bank", "ussd", "bank_transfer"],
	};
	try {
		const response = await fetch(`${BASE_URL}/transaction/initialize`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${SECRET_KEY}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(payload),
		});
		const res = await response.json();
		if (!response.ok) {
			console.error("Paystack Error:", res);
			throw new Error(res.message);
		}
		return res;
	} catch (error) {
		console.error("Paystack API fetch error:", error);
		throw error;
	}
};

module.exports = initializeTransaction;
