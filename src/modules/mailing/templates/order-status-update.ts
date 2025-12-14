import { OrderStatusUpdateData } from '../dto/mailing.dto';

export function generateOrderStatusUpdateEmail(data: OrderStatusUpdateData) {
  return {
    subject: `Commande ${data.orderNumber} - ${data.statusMessage}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.8; color: #000; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #fff;">
  <div style="text-align: center; padding: 40px 0;">
    <h1 style="color: #000; margin: 0; font-size: 32px; font-weight: 300; letter-spacing: -0.5px;">${data.statusMessage}</h1>
  </div>

  <div style="padding: 0 20px;">
    <p style="font-size: 15px; margin-bottom: 30px; color: #000;">Bonjour <strong>${data.customerName}</strong>,</p>

    <p style="font-size: 15px; margin-bottom: 40px; color: #000;">
      Le statut de votre commande <strong>${data.orderNumber}</strong> a été mis à jour.
    </p>

    <div style="margin-bottom: 50px;">
      <h2 style="color: #000; margin-top: 0; margin-bottom: 30px; font-size: 18px; font-weight: 400; letter-spacing: 1px; text-transform: uppercase;">Mise à jour du statut</h2>

      <table style="width: 100%; margin: 30px 0;">
        ${data.oldStatus ? `
        <tr>
          <td style="padding: 15px 0; color: #000; font-size: 13px; letter-spacing: 0.5px; text-transform: uppercase; opacity: 0.6;">Statut précédent</td>
          <td style="padding: 15px 0; text-align: right; color: #000; font-size: 14px; text-transform: capitalize; text-decoration: line-through; opacity: 0.4;">${data.oldStatus}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 15px 0; color: #000; font-size: 13px; letter-spacing: 0.5px; text-transform: uppercase;">Statut actuel</td>
          <td style="padding: 15px 0; text-align: right; color: #000; font-size: 16px; font-weight: 500; text-transform: capitalize;">${data.newStatus}</td>
        </tr>
      </table>

      <p style="margin-top: 30px; color: #000; font-size: 13px; opacity: 0.6;">
        Mis à jour le : ${new Date(data.updatedAt).toLocaleString('fr-FR', {
          dateStyle: 'long',
          timeStyle: 'short'
        })}
      </p>
    </div>

    <p style="margin-top: 50px; padding-top: 30px; color: #000; font-size: 13px; text-align: center; opacity: 0.7;">
      Merci pour votre patience.<br>
      Si vous avez des questions, veuillez contacter notre équipe de support.
    </p>
  </div>
</body>
</html>
    `,
  };
}
