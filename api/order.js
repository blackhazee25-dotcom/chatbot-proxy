export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  const { number } = req.query;
  if (!number) return res.status(400).json({ error: 'Bestelnummer vereist' });
  try {
    const response = await fetch(
      `https://${process.env.SHOPIFY_DOMAIN}/admin/api/2024-01/orders.json?name=%23${number}&status=any`,
      { headers: { 'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_TOKEN } }
    );
    const data = await response.json();
    if (!data.orders || data.orders.length === 0) return res.status(404).json({ error: 'Niet gevonden' });
    const order = data.orders[0];
    const tracking = (order.fulfillments || []).map(f => ({
      status: f.shipment_status || f.status,
      tracking_number: f.tracking_number,
      tracking_url: f.tracking_url,
    }));
    return res.status(200).json({
      order_number: order.order_number,
      status: order.financial_status,
      fulfillment_status: order.fulfillment_status,
      tracking,
    });
  } catch (e) {
    return res.status(500).json({ error: 'Server fout' });
  }
}
