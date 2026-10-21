import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async ({ email, text, html, attachments, subject }) => {
	const common = {
		from: process.env.RESEND_FROM,
		to: [email],
		subject,
		...(attachments?.length
			? {
					attachments: attachments.map((att) => ({
						...att,
						content: Buffer.from(att.content),
					})),
				}
			: {}),
	};

	let result;
	if (html !== undefined && text !== undefined) {
		result = await resend.emails.send({ ...common, html, text });
	} else if (html !== undefined) {
		result = await resend.emails.send({ ...common, html });
	} else if (text !== undefined) {
		result = await resend.emails.send({ ...common, text });
	} else {
		throw new Error("Email must include either text or html content");
	}

	if (result.error) {
		throw new Error(`Failed to send email: ${result.error.message}`);
	}
	return result.data;
};

export default sendEmail;
