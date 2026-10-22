const BASE_URL = process.env.PAYSTACK_BASE_URL;
const SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

const verifyTransaction = async (reference) => {
	try {
		const response = await fetch(
			`${BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
			{
				method: "GET",
				headers: {
					Authorization: `Bearer ${SECRET_KEY}`,
					"Content-Type": "application/json",
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

module.exports = verifyTransaction;
