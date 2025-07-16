import fetch from 'node-fetch';
import fs from 'fs/promises';

// Load your API token from environment variables
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const BASE_URL = 'https://api.cloudflare.com/client/v4';

const shouldListRecords = process.argv.includes('--list-records');

if (process.argv.includes('--help')) {
  console.log(`
🛠️  Usage: node script.js [options]

Options:
  --help            Show this help message
  --list-records    Print all TXT and CNAME records for each zone
  --output          Write DNS health summary to email_dns_report.txt (default)
  
Examples:
  node script.js
      Checks all Cloudflare zones for missing DMARC, SPF, and DKIM records.

  node script.js --list-records
      Lists all TXT and CNAME records for manual verification.

  node script.js --help
      Shows this help message.

Note: Make sure to set CLOUDFLARE_API_TOKEN in your environment.
`);
  process.exit(0);
}

if (!CLOUDFLARE_API_TOKEN) {
  throw new Error("Missing CLOUDFLARE_API_TOKEN in environment.");
}

// Function to call Cloudflare API
async function cloudflareApi(path) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  if (!data.success) {
    throw new Error(`API error: ${JSON.stringify(data.errors)}`);
  }
  return data.result;
}

function analyzeDNSRecords(records, zoneName) {
  const lowerRecords = records.map(r => ({
    ...r,
    name: r.name.toLowerCase(),
    content: r.content.toLowerCase(),
  }));

  const hasDMARC = lowerRecords.some(r =>
    r.type === 'TXT' && r.name === `_dmarc.${zoneName}`
  );

  const hasDMARCSetToRejectOrQuarantine = lowerRecords.some(r =>
    r.type === 'TXT' && r.name === `_dmarc.${zoneName}` && (r.content.includes('p=quarantine') || r.content.includes("p=reject"))
  );
  // TODO - Link to settings.json for dmarc strict settings - Alert for reject only or quarantine / Display both, alert only if none.
  // TODO - Identify subdomains with MX records and check for DMARC specfici.

  const hasSPF = lowerRecords.some(r =>
    r.type === 'TXT' &&
    r.name === zoneName &&
    (r.content.startsWith('v=spf1') || r.content.startsWith('"v=spf1'))
  );

  // TODO - Identify subdomains with MX records and check for SPF and DKIM for subdomains

  const hasDKIM =
    lowerRecords.some(r =>
      r.type === 'TXT' &&
      r.name.includes('._domainkey.') &&
      (r.content.includes('v=dkim1') || r.content.includes('"v=dkim1'))
    );

  // TODO - Identify subdomains with MX records and check for SPF and DKIM for subdomains.

  const hasMicrosoftDKIM = lowerRecords.some(r =>
    (r.type === 'CNAME' || r.type === 'TXT') &&
    r.name.includes('._domainkey.') &&
    (
        r.content.includes('onmicrosoft.com') ||
        r.content.endsWith('.onmicrosoft.com') ||
        r.content.endsWith('.dkim.mail.microsoft')
    ));

  return { hasDMARC, hasSPF, hasDKIM, hasMicrosoftDKIM, hasDMARCSetToRejectOrQuarantine};
}

// Main
(async () => {
  try {
    const zones = await cloudflareApi('/zones');
    const results = [];

    for (const zone of zones) {
      const zoneId = zone.id;
      const zoneName = zone.name.toLowerCase();

      const dnsRecords = await cloudflareApi(`/zones/${zoneId}/dns_records?per_page=500`);
      const { hasDMARC, hasSPF, hasDKIM, hasMicrosoftDKIM, hasDMARCSetToRejectOrQuarantine } = analyzeDNSRecords(dnsRecords, zoneName);

      results.push({
        domain: zoneName,
        dmarc: hasDMARC,
        spf: hasSPF,
        dkim: hasDKIM,
        microsoftdkim: hasMicrosoftDKIM,
        DMARCSetToRejectOrQuarantine: hasDMARCSetToRejectOrQuarantine
      });

       if (shouldListRecords) {
        const filtered = dnsRecords.filter(r => ['TXT', 'CNAME'].includes(r.type));
        console.log(`\n📄 DNS Records for ${zoneName}:\n`);
        filtered.forEach(record => {
          console.log(`  [${record.type}] ${record.name} → ${record.content}`);
        });
    }
    }

   

    if(!shouldListRecords){
        // Generate report

        // Identify Missing records
        const missingRecords = results.filter(r => !r.dmarc || !r.spf || !(r.dkim || r.microsoftdkim) || !r.DMARCSetToRejectOrQuarantine);

        // If none, display none.
        if (missingRecords.length === 0) {
        console.log("✅ All zones have DMARC, SPF, and DKIM records.");
        } else {
        // Display the missing records, and which domains are okay.
          const lines = missingRecords.map(r => {
              return `❌ ${r.domain} - Missing: ` +
              [
                  !r.dmarc ? 'DMARC' : null,
                  !r.spf ? 'SPF' : null,
                  (!r.dkim && !r.microsoftdkim) ? 'DKIM / Microsoft DKIM' : null,
                  !r.DMARCSetToRejectOrQuarantine ? 'DMARC Not Set to Reject or Quarantine' : null,
              ].filter(Boolean).join(', ');
          });

          // Create the report and print it
          const report = `🚨 Missing DNS Records Detected:\n${lines.join('\n')}`;
          console.log(report);

          // Save the report to File.
          const TodaysDate = new Date().Get;
          await fs.writeFile(`DOMAIN SECURITY CHECK ${date.toDateString()} ${date.toTimeString().split(" ")[0]}.txt`, report, 'utf-8');
          // TODO make filename customiseable in Settings.json
        }
    }   

  } catch (err) {
    console.error("Error:", err.message);
  }
})();