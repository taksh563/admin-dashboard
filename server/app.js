import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import auditLogRoutes from "./routes/auditLog.routes.js";
import emailRoutes from "./routes/email.routes.js";
import emailLogRoutes from "./routes/emailLog.routes.js";
import emailTemplateRoutes from "./routes/emailTemplate.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import productRoutes from "./routes/product.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";


const app = express();

app.use(cors());

app.use(express.json());

// app.use(helmet());
app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);
app.use(morgan("dev"));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/logs", auditLogRoutes);
app.use("/api/email",emailRoutes);
app.use("/api/email-logs",emailLogRoutes);
app.use("/api/email/templates",emailTemplateRoutes);
app.use("/api/categories",categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/uploads",express.static(path.join(process.cwd(), "uploads")));
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "API Running"
    });
});

export default app;