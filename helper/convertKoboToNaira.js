const koboToNaira = (amountInKobo) => {
	return Math.round(amountInKobo / 100);
};

module.exports = koboToNaira;
