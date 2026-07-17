export const emailTemplate = (OTP) => {
    return `<div style="font-family: Arial, sans-serif; background-color:#f9f9f9; padding:20px;">
  <div style="max-width:500px; margin:auto; background:#ffffff; padding:20px; border-radius:8px;">
    
    <h2 style="color:#202124;">Hi,</h2>
    
    <p style="color:#5f6368; font-size:14px;">
      This is Nodemailer working.
    </p>

    <p style="color:#202124; font-size:16px;">
      Here is your OTP:
    </p>

    <div style="text-align:center; margin:20px 0;">
      <span style="font-size:24px; letter-spacing:4px; font-weight:bold; color:#1a73e8;">
        ${OTP}
      </span>
    </div>

    <p style="color:#5f6368; font-size:12px;">
      This code will expire shortly. Do not share it with anyone.
    </p>

    <p style="color:#5f6368; font-size:12px;">
      If you didn’t request this, you can ignore this email.
    </p>

  </div>
</div>`
}