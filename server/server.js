import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./config/db.js";
import transporter from "./utils/email.js";

dotenv.config();

connectDB();

transporter.verify()
  .then(() => {
    console.log(
      "✅ Email SMTP server is ready"
    );
  })
  .catch((error) => {
    console.error(
      "❌ Email SMTP configuration error:",
      error.message
    );
  });

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
});