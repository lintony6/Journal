// Email utilities using Resend
const config = require('./config');

async function sendVerificationEmail(toEmail, code) {
    const htmlBody = `
    <html>
    <head>
        <style>
            body { font-family: 'Inter', Arial, sans-serif; background: #0f0f23; color: #e4e4e7; }
            .container { max-width: 500px; margin: 40px auto; padding: 40px; background: #1a1a2e; border-radius: 16px; }
            .logo { font-size: 24px; font-weight: bold; color: #6366f1; margin-bottom: 24px; }
            .code { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #6366f1; 
                     background: rgba(99, 102, 241, 0.1); padding: 16px 24px; border-radius: 12px; 
                     display: inline-block; margin: 24px 0; }
            p { color: #a1a1aa; line-height: 1.6; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">📔 Journal</div>
            <h2>Verify your email</h2>
            <p>Welcome to Journal! Use the code below to verify your email address:</p>
            <div class="code">${code}</div>
            <p>This code expires in 15 minutes.</p>
            <p>If you didn't create an account, you can safely ignore this email.</p>
        </div>
    </body>
    </html>
    `;

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'Journal <onboarding@resend.dev>',
                to: toEmail,
                subject: 'Verify your Journal account',
                html: htmlBody
            })
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Resend error:', error);
            return false;
        }

        console.log('Verification email sent to:', toEmail);
        return true;
    } catch (error) {
        console.error('Email send error:', error.message);
        return false;
    }
}

module.exports = { sendVerificationEmail };
