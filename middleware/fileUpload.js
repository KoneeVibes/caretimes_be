const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
require("dotenv").config();

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

const createUploader = ({
	getFolderName,
	fields,
	fieldName,
	isMultiple = false,
	fileFilter,
}) => {
	const storage = new CloudinaryStorage({
		cloudinary,
		params: {
			folder: (req, file) => {
				return getFolderName(req, file);
			},
			allowed_formats: ["jpg", "png"],
			transformation: { width: 500, height: 500, crop: "limit" },
		},
	});

	const upload = multer({
		storage,
		limits: { fileSize: 5000000 }, // 5 MB limit
		fileFilter: (req, file, cb) => {
			if (fileFilter) {
				fileFilter(req, file, cb);
			} else {
				cb(null, true);
			}
		},
	});

	return isMultiple ? upload.array(fieldName) : upload.single(fieldName);
};

module.exports = (options) => (req, res, next) => {
	const upload = createUploader(options);
	upload(req, res, (err) => {
		if (err) {
			// the error comes, but somehow this
			// block is not returning the response to client.
			console.error(err);
			return res.status(400).json({
				status: "fail",
				message: err.message || "File upload failed",
			});
		}
		next();
	});
};
