<<<<<<< HEAD
const { createProxyMiddleware } = require("http-proxy-middleware");
=======
const {createProxyMiddleware} = require("http-proxy-middleware");
>>>>>>> 08a3e09b7cf566c659945d7a0721562764214a9c
module.exports = function (app) {
  app.use(
    ["/login", "/auth/user", "/sessionLogin", "/sessionLogout", '/api/*', '/open-api/*'],
    createProxyMiddleware({
<<<<<<< HEAD
      target: "http://localhost:5000",
=======
      target: "http://localhost:3001",
>>>>>>> 08a3e09b7cf566c659945d7a0721562764214a9c
      crossOrigin: true,
    })
  );
};