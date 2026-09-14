const escapeHtml = (value = "") =>
	String(value ?? "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");

const transactionReceiptTemplate = ({
	amount,
	reference,
	channel,
	bank,
	customerEmail,
	transactionDate = new Date(),
	transactionStatus,
}) => {
	const status = String(transactionStatus || "failed").toLowerCase();

	const isSuccess = status === "success";

	const iconUrl = isSuccess
		? "https://res.cloudinary.com/dzw17flyf/image/upload/v1789361521/success-icon.svg"
		: "https://res.cloudinary.com/dzw17flyf/image/upload/v1789362633/error-icon.png";

	const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);

	const statusMessage = isSuccess
		? "Payment has been successfully made"
		: status === "failed"
			? "Payment failed to go through"
			: "Payment was abandoned by user";

	return `
        <!doctype html>
        <html lang="en">
            <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <style>
                    @import url("https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Roboto:ital,wght@0,100..900;1,14..32,100..900&display=swap");
        
                    body {
                        margin: 0;
                        border-radius: 8px;
                        background-color: white;
                    }
        
                    h1 {
                        font-family: Roboto;
                        font-weight: 600;
                        font-size: 23px;
                        line-height: normal;
                        color: #1a1c21;
                        overflow: hidden;
                        white-space: nowrap;
                        text-overflow: ellipsis;
                        margin-block: 0;
                    }
        
                    h2 {
                        font-family: Inter;
                        font-weight: 400;
                        font-size: 12px;
                        line-height: normal;
                        color: #484d57;
                        overflow: hidden;
                        white-space: normal;
                        text-overflow: ellipsis;
                        margin-block: 0;
                    }
        
                    h3 {
                        font-family: Roboto;
                        font-weight: 400;
                        font-size: 16px;
                        line-height: normal;
                        color: #484d57;
                        overflow: hidden;
                        white-space: normal;
                        text-overflow: ellipsis;
                        margin-block: 0;
                    }
        
                    h4 {
                        font-family: Roboto;
                        font-weight: 600;
                        font-size: 30px;
                        line-height: normal;
                        color: #4caf50;
                        overflow: hidden;
                        white-space: normal;
                        text-overflow: ellipsis;
                        margin-block: 0;
                    }
        
                    h5 {
                        font-family: Roboto;
                        font-weight: 400;
                        font-size: 12px;
                        line-height: normal;
                        color: #484d57;
                        overflow: hidden;
                        white-space: normal;
                        text-overflow: ellipsis;
                        margin-block: 0;
                    }
        
                    h6 {
                        font-family: Roboto;
                        font-weight: 400;
                        font-size: 12px;
                        line-height: normal;
                        color: #1a1c214d;
                        overflow: hidden;
                        white-space: normal;
                        text-overflow: ellipsis;
                        margin-block: 0;
                    }
        
                    p {
                        font-family: Inter;
                        font-weight: 500;
                        font-size: 14px;
                        line-height: normal;
                        color: #1a1c21;
                        overflow: hidden;
                        white-space: normal;
                        text-overflow: ellipsis;
                        margin-block: 0;
                    }
        
                    .content-area {
                        display: flex;
                        flex-direction: column;
                        padding: 2rem;
                        padding-top: 0;
                        gap: 3rem;
                    }
        
                    .icon-container {
                        display: flex;
                        justify-content: center;
                    }
        
                    .header-container,
                    .transaction-amount {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 0.5rem;
                    }
        
                    .transaction-details {
                        display: grid;
                        grid-template-columns: repeat(2, minmax(0, 1fr));
                        grid-template-rows: repeat(2, auto);
                        gap: 1rem;
                    }
        
                    .transaction-details > .detail {
                        padding: 2rem;
                        border-radius: 7px;
                        border: 1.15px solid #f4f4f4;
                        display: flex;
                        flex-direction: column;
                        gap: 0.5rem;
                    }

                    .icon {
                        width: 101px;
                        height: 101px;
                    }
                </style>
                <title>Transaction Receipt</title>
            </head>

            <body>
                <div class="content-area">
                    <div class="icon-container">
                        <img
                            src="${iconUrl}"
                            class="icon"
                            alt="${isSuccess ? "success-icon" : "error-icon"}"
                        />
                    </div>
                    
                    <div class="header-container">
                        <div>
                            <h1>Payment ${isSuccess ? "Successful" : escapeHtml(statusLabel)}</h1>
                        </div>
                    
                        <div>
                            <h5>${escapeHtml(statusMessage)}</h5>
                        </div>
                    
                        <div>
                            <h6>${escapeHtml(
															new Date(transactionDate).toLocaleString(
																"en-NG",
																{
																	timeZone: "Africa/Lagos",
																},
															),
														)}</h6>
                        </div>
                    </div>
        
                    <div class="transaction-amount">
                        <div>
                            <h3>Amount</h3>
                        </div>
            
                        <div>
                            <h4>${escapeHtml(amount)}</h4>
                        </div>
                    </div>
        
                    <div class="transaction-details">
                        <div class="detail">
                            <div>
                                <h2>Ref Number</h2>
                            </div>
                            <div>
                                <p>${escapeHtml(reference)}</p>
                            </div>
                        </div>
            
                        <div class="detail">
                            <div>
                                <h2>Payment Method</h2>
                            </div>
                            <div>
                                <p>${escapeHtml(channel)}</p>
                            </div>
                        </div>
            
                        <div class="detail">
                            <div>
                                <h2>Bank</h2>
                            </div>
                            <div>
                                <p>${escapeHtml(bank)}</p>
                            </div>
                        </div>
            
                        <div class="detail">
                            <div>
                                <h2>Customer Email</h2>
                            </div>
                            <div>
                                <p>${escapeHtml(customerEmail)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </body>
      </html>
    `;
};

module.exports = transactionReceiptTemplate;
