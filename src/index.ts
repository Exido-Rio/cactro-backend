import app from "./app";
import { config } from "./config/env";

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`\n🚀 Event Booking System API`);
  console.log(`   Server running on http://localhost:${PORT}`);
  console.log(`   Health check:     http://localhost:${PORT}/api/health`);
  console.log(`   Environment:      ${process.env.NODE_ENV || "development"}\n`);
});
