const allowedOrigins = require("./allowedOrigin");

const corsOptions = {
	// origin: (origin, callback) => {
	// 	if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
	// 		callback(null, true);
	// 	} else {
	// 		callback(new Error("Not allowed by CORS"));
	// 	}
	// },
	origin: (origin, callback) => {
		if (!origin) {
			return callback(null, true);
		}
		if (allowedOrigins.includes(origin)) {
			return callback(null, true);
		}
		callback(new Error("Not allowed by CORS"));
	},
	credentials: true,
	methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
	allowedHeaders: ["Content-Type", "Authorization"],
	optionsSuccessStatus: 200,
};

module.exports = corsOptions;
