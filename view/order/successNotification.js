export const orderSuccessNotificationTemplate = ({
	customerName,
	orderNumber,
	orderDate,
	totalAmount,
	paymentStatus,
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
			<title>Order Confirmed! Your Caretimes Cosmetics Order #${orderNumber}</title>
		</head>

		<body>
			<div class="header-container">
				<img src="https://res.cloudinary.com/wyv2jitx/image/upload/v1788732803/header.svg" alt="header-img" />
			</div>

			<div class="content-area">
				<div class="subject">
					<h1>Order Confirmed!</h1>
				</div>

				<div class="body">
					<p>Hi ${customerName},</p>

					<p>
                        Thank you for shopping with Caretimes Cosmetics!
					</p>

                    <p>
                        We’re pleased to confirm that your order #${orderNumber} has been placed successfully. We appreciate your trust in us and look forward to bringing your favourite beauty essentials to you.
                    </p>

                    <p><strong>Order Summary</strong></p>

                    <ul>
                        <li>
                            <strong>Order Number:</strong>
                            <span class="highlight-text">#${orderNumber}</span>
                        </li>

                        <li>
                            <strong>Order Date:</strong>
                            <span class="highlight-text">${orderDate}</span>
                        </li>

                        <li>
                            <strong>Total Amount:</strong>
                            <span class="highlight-text"> NGN ${totalAmount}</span>
                        </li>

                        <li>
                            <strong>Payment Status:</strong>
                            <span class="highlight-text">${paymentStatus}</span>
                        </li>
                    </ul>

					<p>
                        If you have any questions or need assistance with your order, please contact our support team.
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
