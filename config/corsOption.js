const allowedOrigins = require("./allowedOrigin");

const corsOptions = {
	origin: (origin, callback) => {
		// if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
		// 	callback(null, true);
		// } else {
		// 	callback(new Error("Not allowed by CORS"));
		// }
		if (!origin) return callback(null, true);
		if (allowedOrigins.includes(origin)) {
			return callback(null, true);
		}
		console.error("CORS blocked origin:", origin);
		return callback(new Error("Not allowed by CORS"));
	},
	credentials: true,
	optionsSuccessStatus: 200,
};

module.exports = corsOptions;
