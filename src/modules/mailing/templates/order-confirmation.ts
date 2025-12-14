import { OrderConfirmationData } from '../dto/mailing.dto';

export function generateOrderConfirmationEmail(data: OrderConfirmationData) {
  const itemsHtml = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 15px 0; color: #000; font-size: 14px;">${item.productName}</td>
        <td style="padding: 15px 0; text-align: center; color: #000; font-size: 14px;">${item.quantity}</td>
        <td style="padding: 15px 0; text-align: right; color: #000; font-size: 14px;">$${item.unitPrice}</td>
        <td style="padding: 15px 0; text-align: right; font-weight: 400; color: #000; font-size: 14px;">$${item.subtotal}</td>
      </tr>
    `
    )
    .join('');

  return {
    subject: `Confirmation de commande - ${data.orderNumber}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.8; color: #000; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #fff;">
  <div style="text-align: center; padding: 40px 0;">
    <h1 style="color: #000; margin: 0; font-size: 32px; font-weight: 300; letter-spacing: -0.5px;">Merci</h1>
  </div>

  <div style="padding: 0 20px;">
    <p style="font-size: 15px; margin-bottom: 30px; color: #000;">Bonjour <strong>${data.customerName}</strong>,</p>

    <p style="font-size: 15px; margin-bottom: 40px; color: #000;">
      Votre commande a été reçue avec succès et est en cours de traitement.<br>
      Numéro de commande : <strong>${data.orderNumber}</strong>
    </p>

    <div style="margin-bottom: 50px;">
      <h2 style="color: #000; margin-top: 0; margin-bottom: 30px; font-size: 18px; font-weight: 400; letter-spacing: 1px; text-transform: uppercase;">Détails de la commande</h2>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
        <thead>
          <tr>
            <th style="padding: 15px 0; text-align: left; font-weight: 400; font-size: 13px; letter-spacing: 0.5px; text-transform: uppercase;">Produit</th>
            <th style="padding: 15px 0; text-align: center; font-weight: 400; font-size: 13px; letter-spacing: 0.5px; text-transform: uppercase;">Qté</th>
            <th style="padding: 15px 0; text-align: right; font-weight: 400; font-size: 13px; letter-spacing: 0.5px; text-transform: uppercase;">Prix</th>
            <th style="padding: 15px 0; text-align: right; font-weight: 400; font-size: 13px; letter-spacing: 0.5px; text-transform: uppercase;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <table style="width: 100%; margin-top: 30px;">
        <tr>
          <td style="padding: 10px 0; text-align: right; color: #000; font-size: 14px;">Sous-total :</td>
          <td style="padding: 10px 0; text-align: right; font-weight: 400; width: 120px; font-size: 14px;">$${data.subtotal}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; text-align: right; color: #000; font-size: 14px;">Livraison :</td>
          <td style="padding: 10px 0; text-align: right; font-weight: 400; font-size: 14px;">$${data.shippingCost}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; text-align: right; color: #000; font-size: 14px;">Taxes :</td>
          <td style="padding: 10px 0; text-align: right; font-weight: 400; font-size: 14px;">$${data.taxAmount}</td>
        </tr>
        <tr>
          <td style="padding: 20px 0 10px; text-align: right; font-size: 16px; font-weight: 500; color: #000;">Total :</td>
          <td style="padding: 20px 0 10px; text-align: right; font-size: 16px; font-weight: 500; color: #000;">$${data.totalPrice}</td>
        </tr>
      </table>
    </div>

    <div style="margin-bottom: 40px;">
      <h3 style="color: #000; margin-top: 0; margin-bottom: 15px; font-size: 14px; font-weight: 400; letter-spacing: 0.5px; text-transform: uppercase;">Adresse de livraison</h3>
      <p style="margin: 0; color: #000; font-size: 14px; line-height: 1.6;">
        ${data.shippingAddress.streetAddress}<br>
        ${data.shippingAddress.city}, ${data.shippingAddress.postalCode}
      </p>
    </div>

    <div style="margin-bottom: 50px;">
      <h3 style="color: #000; margin-top: 0; margin-bottom: 15px; font-size: 14px; font-weight: 400; letter-spacing: 0.5px; text-transform: uppercase;">Méthode de paiement</h3>
      <p style="margin: 0; color: #000; font-size: 14px; text-transform: capitalize;">${data.paymentMethod}</p>
    </div>

    <p style="margin-top: 50px; padding-top: 30px; color: #000; font-size: 13px; text-align: center; opacity: 0.7;">
      Si vous avez des questions, n'hésitez pas à nous contacter.<br>
      Merci d'avoir fait vos achats chez nous.
    </p>
  </div>
</body>
</html>
    `,
  };
}
