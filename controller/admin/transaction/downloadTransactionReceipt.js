const downloadTransactionReceipt = async (req, res) => {
	const { transactionId } = req.params || {};
	return console.log(transactionId);
};

module.exports = downloadTransactionReceipt;
