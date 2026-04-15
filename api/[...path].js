const app = require("../app");

module.exports = (req, res) => {
    const segments = Array.isArray(req.query.path)
        ? req.query.path
        : [req.query.path].filter(Boolean);
    const queryIndex = req.url.indexOf("?");
    const queryString = queryIndex >= 0 ? req.url.slice(queryIndex) : "";
    const normalizedPath = segments.join("/");

    req.url = `/${normalizedPath}${queryString}`;
    return app(req, res);
};