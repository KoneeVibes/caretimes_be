const { Order } = require("../../../model/order");
const Product = require("../../../model/product");

const retrieveOrderOverview = async (req, res) => {
	const { id, type } = req.user;

	try {
		let query = {};

		if (!["super-admin", "admin"].includes(type)) {
			const products = await Product.find({ insertedBy: id }, { _id: 0, id: 1 })
				.lean()
				.exec();

			const productIds = products.map((product) => product.id);

			query = {
				cartItems: {
					$elemMatch: {
						productId: { $in: productIds },
					},
				},
			};
		}

		const [total, paid, disputed, cancelled, fulfilled, unfulfilled] =
			await Promise.all([
				Order.countDocuments(query),
				Order.countDocuments({ ...query, status: "paid" }),
				Order.countDocuments({ ...query, status: "disputed" }),
				Order.countDocuments({ ...query, status: "cancelled" }),
				Order.countDocuments({ ...query, status: "fulfilled" }),
				Order.countDocuments({ ...query, status: "unfulfilled" }),
			]);

		return res.status(200).json({
			status: "success",
			data: {
				paidOrder: paid,
				totalOrder: total,
				disputedOrder: disputed,
				cancelledOrder: cancelled,
				fulfilledOrder: fulfilled,
				unfulfilledOrder: unfulfilled,
			},
		});
	} catch (error) {
		console.error(error);

		return res.status(500).json({
			status: "fail",
			message:
				"Server encountered an issue in retrieving order overview at this moment. Please retry",
		});
	}
};

module.exports = retrieveOrderOverview;
