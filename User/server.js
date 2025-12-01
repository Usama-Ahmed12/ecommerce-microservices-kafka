const app = require('./app');

const PORT = process.env.PORT || 3005;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 User Service is running on http://localhost:${PORT}`);
});
