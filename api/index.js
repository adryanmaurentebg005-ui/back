const app = require("../app");

module.exports = (req, res) => {
	const rewrittenPath = req.query.path;

	if (typeof rewrittenPath === "string") {
		req.url = `/${rewrittenPath}`;
	}

	return app(req, res);
};