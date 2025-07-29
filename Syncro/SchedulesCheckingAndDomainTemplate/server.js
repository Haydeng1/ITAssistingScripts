
const SYNCRO_API_KEY = process.env.syncro_recurring_domain_key;

const SYNCRO_SUBDOMAIN = process.env.syncro_domain;
const PORT = 3000;
const domainCosts = {
  21215105 : {
    price: 4541,
    cost: 3000
  },
  20101107 : {
    price: 6363,
    cost: 950
  }
}

const express = require('express');
const axios = require('axios');
const cors = require('cors');

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${SYNCRO_API_KEY}`
};

const app = express();
app.use(cors());
app.use(express.json()); // Parse JSON body
app.use(express.static('public')); // Serve index.html

// SEARCH CUSTOMERS
app.get('/api/customers', async (req, res) => {
  const query = req.query.business_name;
  if (!query || query.length < 3) return res.status(400).json({ error: 'Invalid query' });

  try {
    const response = await axios.get(`https://${SYNCRO_SUBDOMAIN}.syncromsp.com/api/v1/customers`, {
      headers: { Authorization: `Bearer ${SYNCRO_API_KEY}` },
      params: { business_name: query }
    });
    res.json(response.data);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

/**
 * 
 * @param {string} domain start of domain or business name.
 * @param {number} page Normally 1, ready for recursion
 * @param {Array} schedulesvalid Normally an empty array, ready for recursion.
 * @returns 
 */
async function searchSchedules(domain, page = 1, schedulesvalid = []){
  const schedules = await axios.get(`https://${SYNCRO_SUBDOMAIN}.syncromsp.com/api/v1/schedules?page=${page}`, { headers });

  for(let i = 0; i < schedules.data.schedules.length; i++){
    if(schedules.data.schedules[i].name.includes(domain)){
      schedulesvalid.push(schedules.data.schedules[i].name);
    }
  }
  if(page < schedules.data.meta.total_pages) {
    schedulesvalid = await searchSchedules(domain,page+1,schedulesvalid);
  }
  // console.log(schedulesvalid + page);
  return schedulesvalid;
} 

app.get('/api/checkschedules', async (req, res) => {
  const domain = req.query.domain;
  try {
    const schedulesvalid = await searchSchedules(domain);
    res.json(schedulesvalid);
  } catch (err) {
    console.error({error: err })
    res.status(500).json(err);
  }
});

// CREATE RECURRING INVOICE (and optional ticket)
app.post('/api/create-schedule', async (req, res) => {
  const {
    customer_id, domain, expiry, paymentType, notes, inSynergy, schedule_frequency
  } = req.body;

  try {
    const expiryDate = new Date(expiry);
    const today = new Date();
    let nextRun = new Date(expiryDate);
    nextRun.setDate(nextRun.getDate() - 30);
    if (nextRun <= today) {
      nextRun = new Date(today);
      nextRun.setDate(today.getDate() + 1);
    }
    const formattedDate = nextRun.toISOString().split('T')[0];

    const invoicePayload = {
      customer_id: parseInt(customer_id),
      email_customer: true,
      frequency: schedule_frequency,
      name: `Domain Renewal - ${domain}`,
      next_run: formattedDate,
      charge_mop: true
    };

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SYNCRO_API_KEY}`
    };
    const lineItemID = invoicePayload.frequency == "Annually" ? 21215105 : (invoicePayload.frequency =="Biennially" ? 20101107 : "");
    if(lineItemID == ""){
      return res.status(400).json({ error: 'Invalid query - frequency not specified correctly' })
    }
    const lineItemPayload = {
      "product_id": lineItemID,
      "description": `${domain} - Domain Renewal`,
      "cost_cents": domainCosts[lineItemID].cost,
      "quantity": 1,
      "retail_cents":domainCosts[lineItemID].price,
      "taxable": true,
    }
    
    const invoiceRes = await axios.post(`https://${SYNCRO_SUBDOMAIN}.syncromsp.com/api/v1/schedules`, invoicePayload, { headers });
    
    const addLineItemRes = await axios.post(`https://${SYNCRO_SUBDOMAIN}.syncromsp.com/api/v1/schedules/${invoiceRes.data.schedule.id}/add_line_item`, lineItemPayload, { headers });

    let ticketPayload = {}
    // Optional Ticket
    if (!inSynergy) {
      ticketPayload = {
        customer_id: customer_id,
        subject: `Domain Requires Registration or Transfer - ${domain}`,
        status: "New",
        issue_type: "Task",
        comments_attributes: [{
          subject: "Reminder",
          body: `Please renew domain manually.\n`+
          `Domain: ${domain}\n`+
          `Expiry: ${expiryDate.toDateString()}\n`+
          `Payment: ${paymentType}\n\n`+
          `Action Items:\n`+
          `If domain ends with ".au", reset the domain pw with https://pw.auda.org.au/\n`+
          `If domain ends with ".com", generally access to the old provider / registrant is required to reset the PW\n`+
          `HOWEVER, if the domain is with CYW -> access via, https://hosting.computeyourworld.com.au/ `+
          `reset the pw generally for the Owners email. Same with CloudFlare.\n`
          `Verify domain is transfered into our CloudFlare\n`+
          `Verify DMARC setup - Record established, is it Q or R?\n`+
          `Correct the recurring invoice which was created - https://${SYNCRO_SUBDOMAIN}.syncromsp.com/schedules/${invoiceRes.data.schedule.id}\n`+
          `If bank details are on file, ensure auto charge is enabled\n`+
          `Copy the Recurring invoice name into the Invoice name to ensure the invoices which are created are easily identifiable.\n`+
          `Notes: ${notes}\n`,
          do_not_email: true,
          hidden: true,
          tech: "Automation"
        }]
      };
    } else {
      ticketPayload = {
        customer_id: customer_id,
        subject: `Domain Renewal Verification: ${domain}`,
        status: "New",
        issue_type: "Task",
        comments_attributes: [{
          subject: "Reminder",
          body: `Please renew domain manually Please verify and setup automatic payments through syncro invoice details here. \n`+
          `Recurring Invoice: https://nebtech.syncromsp.com/schedules/${invoiceRes.data.schedule.id}/edit \n`+
          `Domain: ${domain}\n`+
          `Expiry: ${expiryDate.toDateString()}\n`+
          `Payment: ${paymentType}\n\n`+
          `Action Items:\n`+
          `If domain ends with ".au", verify domain is 'eligible for renewal' through synergywholesale or with https://whois.auda.org.au/ \n`+
          `Verify domain DNS is in our CloudFlare\n`+
          `Verify DMARC setup (Email, DMARC Management -> Enable or dashboard will be visible) - Record established, is it Q or R?\n`+
          `Correct the recurring invoice which was created - https://${SYNCRO_SUBDOMAIN}.syncromsp.com/schedules/${invoiceRes.data.schedule.id}\n`+
          `If bank details are on file, ensure auto charge is enabled\n`+
          `Copy the Recurring Invoice name into the Invoice name to ensure the invoices which are created are easily identifiable.\n`+
          `Notes: ${notes}\n`,
          do_not_email: true,
          hidden: true,
          tech: "Automation"
        }]
      };
    }
    await axios.post(`https://${SYNCRO_SUBDOMAIN}.syncromsp.com/api/v1/tickets`, ticketPayload, { headers });


    res.status(200).json({ message: 'Recurring invoice (and ticket if needed) created successfully!' });

  } catch (err) {
    console.error('Error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to create schedule or ticket' });
  }
});


app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));