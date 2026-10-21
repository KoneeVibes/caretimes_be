const puppeteer = require("puppeteer");

const generatePDF = async (template) => {
	const browser = await puppeteer.launch({ headless: true });
	const page = await browser.newPage();

	await page.setContent(template, {
		waitUntil: "load",
	});
	const pdfBuffer = await page.pdf({
		format: "A4",
		printBackground: true,
		margin: {
			top: "1cm",
			right: "1cm",
			bottom: "1cm",
			left: "1cm",
		},
	});

	await browser.close();
	return pdfBuffer;
};

module.exports = generatePDF;
