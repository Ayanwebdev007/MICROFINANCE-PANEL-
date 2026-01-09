const { createProxyMiddleware } = require("http-proxy-middleware");
module.exports = function (app) {
  app.use(
    ["/login", "/auth/user", "/sessionLogin", "/sessionLogout", '/api/*', '/open-api/*'],
    createProxyMiddleware({
      target: "http://localhost:5000",
      crossOrigin: true,
    })
  );
};