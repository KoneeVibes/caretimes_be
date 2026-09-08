const crypto = require("crypto");
const dispatchEvent = require("../event");

const paystack = async (req, res) => {
	try {
		const secretKey = process.env.PAYSTACK_SECRET_KEY;

		const hash = crypto
			.createHmac("sha512", secretKey)
			.update(JSON.stringify(req.body))
			.digest("hex");
		if (hash !== req.headers["x-paystack-signature"]) {
			return res.status(401).json({
				status: "fail",
				message: "Invalid Paystack signature.",
			});
		}

		const event = req.body;
		const dispatch = await dispatchEvent(event.event, event.data);
		if (dispatch?.status === "fail") {
			return res.status(500).json({
				status: "fail",
				message: dispatch?.message,
			});
		}

		return res.status(200).json({
			status: "success",
			message: dispatch.message,
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			status: "fail",
			message: "Webhook processing failed.",
		});
	}
};

module.exports = paystack;
