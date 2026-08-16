import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import auditLogRoutes from "./routes/auditLog.routes.js";
import emailRoutes from "./routes/email.routes.js";

const app = express();

app.use(cors());

app.use(express.json());

app.use(helmet());

app.use(morgan("dev"));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/logs", auditLogRoutes);
app.use("/api/email",emailRoutes);

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "API Running"
    });
});

export default app;