const axios = require('axios');

// 🔧 Your SyncroMSP configuration
const args = process.argv.length > 2 ? process.argv.slice(2) : null;
const API_TOKEN = args != null ? args[0] : null;
const SUBDOMAIN = 'nebtech';
const BASE_URL = `https://${SUBDOMAIN}.syncromsp.com/api/v1`;
const Logging = args[1] == null ? false : true;

const headers = {
  'Authorization': `Bearer ${API_TOKEN}`,
  'Content-Type': 'application/json'
};

async function getOpenInvoices() {
  const response = await axios.get(`${BASE_URL}/invoices?unpaid=true`, {
    headers,
    params: { status: 'open' }
  });
  return response.data.invoices || [];
}

function isOverdue(invoice) {
  const today = new Date();
  const dueDate = new Date(invoice.due_date);
  return today > dueDate;
}

async function updateInvoice(item) {
  let val = await axios.put(`${BASE_URL}/invoices/${item.invoice_id}/line_items/${item.id}`, item, { headers });
  if(Logging){console.log(val)};
  return val;
}

async function getSpecificInvoice(invoiceId) {
    const response = await axios.get(`${BASE_URL}/invoices/${invoiceId}`, { headers });
    return response.data.invoice;
  }

async function processInvoices() {
  try {
    if(API_TOKEN == null){
      throw new Error("API Key not supplied");
    }
    const invoices = await getOpenInvoices();
    for (const invoice of invoices) {
      if(Logging){console.log(isOverdue(invoice));}
      if (isOverdue(invoice)) {
        let updated = false;
        let items = await getSpecificInvoice(invoice.id);
        for (let i = 0; i<items.line_items.length; i++){
            if (items.line_items[i].name.toLowerCase().includes('late fee') && !items.line_items[i].taxable) {
                items.line_items[i].taxable = true;
                updated = true;
                if(Logging){console.log(`Updating Invoice #${invoice.number} to apply GST on late fee...`)};
                await updateInvoice(items.line_items[i]);
                console.log(`Invoice #${invoice.number} updated.`);
                break;
            }
        }

        if (!updated && Logging) {
          console.log(`Invoice #${invoice.number} is correct.`);
        }
      }
    }
    console.log("COMPLETE");
  } catch (err) {
    console.error('Error processing invoices:', err.message);
  }
}

processInvoices();