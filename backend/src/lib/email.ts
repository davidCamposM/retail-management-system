import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordResetEmail(to: string, resetLink: string) {
  await resend.emails.send({
    from: "RetailOps <onboarding@resend.dev>",
    to,
    subject: "Recupera tu contraseña — RetailOps",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #101B15;">Recupera tu contraseña</h2>
        <p>Recibimos una solicitud para restablecer tu contraseña de RetailOps.</p>
        <p>
          <a href="${resetLink}" style="display: inline-block; background: #C9A227; color: #101B15; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
            Restablecer contraseña
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">
          Este link expira en 1 hora. Si no solicitaste esto, puedes ignorar este correo.
        </p>
      </div>
    `,
  });
}
