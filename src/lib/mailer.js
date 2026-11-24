export async function sendSellerApprovedEmail({ to, name, username }) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        return { sent: false, reason: "RESEND_API_KEY_NOT_CONFIGURED" };
    }

    try {
        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: process.env.RESEND_FROM || "Fallora <onboarding@resend.dev>",
                to: [to],
                subject: "Akun Seller Fallora Anda Telah Disetujui!",
                html: `
          <div style="font-family: sans-serif; line-height: 1.5;">
            <h2>Halo, ${name}!</h2>
            <p>Akun Seller Fallora (<strong>@${username}</strong>) telah disetujui oleh Admin.</p>
            <p>Silakan login kembali untuk mulai mengelola toko dan produk Anda.</p>
          </div>
        `,
            }),
        });

        if (!res.ok) {
            const errText = await res.text();
            return { sent: false, reason: errText };
        }

        return { sent: true };
    } catch (err) {
        return { sent: false, reason: err.message };
    }
}