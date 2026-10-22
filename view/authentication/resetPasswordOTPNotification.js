export const resetPasswordOTPNotificationTemplate = ({
	randomFourDigits,
	title,
}) => {
	return `<html>
		<head>
			<meta charset="UTF-8" />
			<meta name="viewport" content="width=device-width, initial-scale=1.0" />
			<style>
				@import url("https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap");

				body {
					margin: 0;
					border-radius: 8px;
					background-color: white;
				}

				.header-container {
					display: flex;
				}

				.header-container > img {
					width: 100%;
				}

				h1 {
					font-family: Inter;
					font-weight: 700;
					font-size: 20px;
					line-height: normal;
					color: #121a26;
					overflow: hidden;
					white-space: nowrap;
					text-overflow: ellipsis;
				}

				p {
					font-family: Inter;
					font-weight: 400;
					font-size: 16px;
					line-height: normal;
					color: #384860;
					overflow: hidden;
					white-space: normal;
					text-overflow: ellipsis;
				}

				.content-area {
					padding: 2rem;
				}

				.highlight-text {
					font-weight: 400;
					font-size: 12px;
				}
			</style>
			<title>${title}</title>
		</head>

		<body>
			<div class="header-container">
				<img src="https://res.cloudinary.com/wyv2jitx/image/upload/v1788732803/header.svg" alt="header-img" />
			</div>

			<div class="content-area">
				<div class="subject">
					<h1>Reset Password</h1>
				</div>

				<div class="body">
					<p>Hi there,</p>

					<p>
                        Thank you for shopping with Caretimes Cosmetics!
					</p>

                    <p>
                        Your one-time pin is: 
                    </p>

                    <p><strong>${randomFourDigits}</strong></p>

                    <p>
                        This code will expire in 5 minutes.
					</p>

					<p>
                        Thank you for choosing Caretimes Cosmetics. We look forward to serving you again!
					</p>

					<p>
						Warm regards,<br />
						<strong>The Caretimes Cosmetics Team</strong> <br />
                        <a href="https://caretimescosmetics.com">caretimescosmetics.com</a>
					</p>
				</div>
			</div>
		</body>
	</html>`;
};
