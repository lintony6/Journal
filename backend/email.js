// Email utilities using Brevo (formerly Sendinblue)
const config = require('./config');

async function sendVerificationEmail(toEmail, code) {
    const htmlBody = `
    <html>
    <body style="font-family: Arial, sans-serif; background: #0f0f23; color: #e4e4e7; padding: 40px;">
        <div style="max-width: 500px; margin: 0 auto; background: #1a1a2e; padding: 40px; border-radius: 16px;">
            <h1 style="color: #6366f1;">📔 Journal</h1>
            <h2 style="color: #e4e4e7;">Verify your email</h2>
            <p style="color: #a1a1aa;">Welcome to Journal! Use the code below to verify your email address:</p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #6366f1; background: rgba(99, 102, 241, 0.1); padding: 16px 24px; border-radius: 12px; display: inline-block; margin: 24px 0;">
                ${code}
            </div>
            <p style="color: #a1a1aa;">This code expires in 15 minutes.</p>
            <p style="color: #71717a;">If you didn't create an account, you can safely ignore this email.</p>
        </div>
    </body>
    </html>
    `;

    console.log('Attempting to send email to:', toEmail);
    console.log('API Key present:', !!config.BREVO_API_KEY);

    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'api-key': config.BREVO_API_KEY,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                sender: {
                    name: 'Journal',
                    email: config.BREVO_SENDER_EMAIL
                },
                to: [{ email: toEmail }],
                subject: 'Verify your Journal account',
                htmlContent: htmlBody
            })
        });

        const responseData = await response.json();
        console.log('Brevo response:', JSON.stringify(responseData));

        if (!response.ok) {
            console.error('Brevo error:', responseData);
            return false;
        }

        console.log('Verification email sent successfully to:', toEmail);
        return true;
    } catch (error) {
        console.error('Email send error:', error);
        return false;
    }
}

module.exports = { sendVerificationEmail };
