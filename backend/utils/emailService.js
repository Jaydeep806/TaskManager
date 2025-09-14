import nodemailer from "nodemailer";

// ✅ Reuse one transporter for all emails
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  logger: true,
  debug: true
});


// Verify transporter at startup
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Email transporter error:", error);
  } else {
    console.log("✅ Email transporter ready");
  }
});

/**
 * Send reminder email
 * @param {string} to - Recipient email
 * @param {Array|Object} tasks - Single task or array of tasks
 */
export async function sendReminderEmail(to, tasks) {
  try {
    // Normalize to array
    const taskArray = Array.isArray(tasks) ? tasks : [tasks];

    // Prepare email content
    const taskList = taskArray
      .map((t, i) => `${i + 1}. ${t.title} (${t.date} ${t.time || ""})`)
      .join("\n");

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject:
        taskArray.length === 1
          ? `Task Reminder: ${taskArray[0].title}`
          : "Pending Task Reminder",
      text: `Hello,\n\nYou have the following task(s):\n\n${taskList}\n\nRegards,\nTask Manager`,
      html: `
        <h3>Task Reminder</h3>
        <ul>
          ${taskArray
            .map(
              (t) =>
                `<li><strong>${t.title}</strong> - ${new Date(
                  t.date
                ).toDateString()} ${t.time || ""}</li>`
            )
            .join("")}
        </ul>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📩 Email sent to ${to}:`, info.response);
  } catch (error) {
    console.error("❌ Error sending reminder email:", error);
  }
}
