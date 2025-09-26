const createApp = require('./app');

const PORT = process.env.PORT || 3000;

// Create the app
const app = createApp();

// Start server
app.listen(PORT, () => {
  console.log(`Todo API server is running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
