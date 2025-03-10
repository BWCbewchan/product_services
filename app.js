const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const morgan = require("morgan");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const path = require("path");
const router = require("./routers/index");
const connectDB = require("./config/connectDB");
const logger = require("./utils/logger");
const { errorHandler } = require("./middleware/errorHandler");
const rateLimiter = require("./middleware/rateLimiter");

dotenv.config();
const app = express();
const port = process.env.PORT || 4004;

// Kết nối DB
connectDB();

// Security Middleware
app.use(helmet());
app.use(rateLimiter);

// Danh sách origin được phép
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:2000",
  process.env.FRONTEND_URL_2 || "http://localhost:5173",
];

console.log("Allowed Origins:", allowedOrigins);

// Cấu hình CORS
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS policy does not allow this origin."));
      }
    },
    credentials: true,
  })
);

// Logging Middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Middleware xử lý JSON
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// API Documentation
const swaggerDocument = YAML.load(path.join(__dirname, "./swagger.yaml"));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Health Check Endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "UP" });
});

// API Routes
app.use("/api/v1", router);

// Error Handling
app.use(errorHandler);

// Middleware xử lý lỗi CORS
app.use((err, req, res, next) => {
  if (err.message === "CORS policy does not allow this origin.") {
    return res.status(403).json({ error: "CORS policy blocked this request." });
  }
  next(err);
});

// Chạy server
app.listen(port, () => {
  logger.info(`🚀 Server is running on port ${port}`);
});
