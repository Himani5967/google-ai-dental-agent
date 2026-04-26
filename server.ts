import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for sending confirmation email
  app.post("/api/send-confirmation", async (req, res) => {
    const { patientName, issue, preferredDate, preferredTime, email } = req.body;

    if (!email || !patientName) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      let smtpConfig: any;
      const smtpHost = process.env.SMTP_HOST || "smtp.ethereal.email";

      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log("SMTP credentials missing. Using Ethereal for testing...");
        const testAccount = await nodemailer.createTestAccount();
        smtpConfig = {
          host: "smtp.ethereal.email",
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        };
      } else if (smtpHost.includes("@")) {
        // The user likely put their email in the HOST field
        const errorMsg = `SMTP_HOST is configured as an email address (${smtpHost}). Please set it to a valid SMTP server (e.g., smtp.gmail.com).`;
        console.error(errorMsg);
        return res.status(400).json({ 
          error: errorMsg,
          suggestion: "Update SMTP_HOST in Settings to your provider's SMTP server (e.g., smtp.gmail.com if using Gmail)."
        });
      } else {
        console.log(`Attempting to send email via host: ${smtpHost}`);
        
        smtpConfig = {
          host: smtpHost,
          port: parseInt(process.env.SMTP_PORT || "587"),
          secure: process.env.SMTP_SECURE === "true",
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        };
      }

      const transporter = nodemailer.createTransport(smtpConfig);

      const mailOptions = {
        from: `"Ziva's Dental Care" <${smtpConfig.auth.user || 'noreply@zivasdental.com'}>`,
        to: email,
        subject: "Appointment Confirmation - Ziva's Dental Care",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #f8fafc;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #0d9488; margin: 0;">Ziva's Dental Care</h1>
              <p style="color: #64748b; margin: 4px 0 0 0;">Next-Gen Dentistry</p>
            </div>
            
            <div style="background-color: white; padding: 24px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <h2 style="color: #1e293b; margin-top: 0;">Appointment Confirmed!</h2>
              <p style="color: #475569;">Hi <strong>${patientName}</strong>,</p>
              <p style="color: #475569;">Your appointment has been successfully scheduled. We've reserved the following time for you:</p>
              
              <div style="background-color: #f1f5f9; padding: 16px; border-radius: 6px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-weight: 600; width: 100px;">Reason:</td>
                    <td style="padding: 8px 0; color: #1e293b;">${issue}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Date:</td>
                    <td style="padding: 8px 0; color: #1e293b;">${preferredDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Time:</td>
                    <td style="padding: 8px 0; color: #1e293b;">${preferredTime}</td>
                  </tr>
                </table>
              </div>
              
              <p style="color: #475569;">We look forward to seeing you!</p>
            </div>
            
            <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #94a3b8;">
              <p>123 Dental St, Wellness City | +1 (555) ZIVA-CARE</p>
              <p>If this wasn't you, please disregard this email.</p>
              ${!process.env.SMTP_USER ? `<p style="color: #f59e0b; font-weight: bold;">(DEMO MODE: Sent via Ethereal. Check your server logs for the test link!)</p>` : ""}
            </div>
          </div>
        `,
      };

      const info = await transporter.sendMail(mailOptions);
      if (!process.env.SMTP_USER) {
        console.log("Preview URL: " + nodemailer.getTestMessageUrl(info as any));
      }
      res.json({ success: true, message: "Confirmation email sent" });
    } catch (error: any) {
      console.error("Error sending email:", error);
      
      let message = "Failed to send email";
      let suggestion = "Check your SMTP settings.";

      if (error.code === 'EAUTH' || (error.message && error.message.includes('535'))) {
          message = "SMTP Authentication failed.";
          suggestion = "Verify your SMTP_USER and SMTP_PASS. If using Gmail, make sure you use an 'App Password', not your regular password.";
      } else if (error.code === 'ENOTFOUND') {
          message = "SMTP Host not found.";
          suggestion = "Ensure SMTP_HOST is a valid server address (e.g., smtp.gmail.com).";
      }

      res.status(500).json({ 
          error: message, 
          suggestion,
          rawError: error.message 
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
