
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
function loadEnv() {
    const env = {};
    const files = ['.env', '.env.local'];

    files.forEach(file => {
        if (fs.existsSync(file)) {
            const parsed = dotenv.parse(fs.readFileSync(file));
            Object.assign(env, parsed);
        }
    });

    return { ...env, ...process.env };
}

const env = loadEnv();
const CRON_SECRET = env.CRON_SECRET;
const APP_URL = env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

if (!CRON_SECRET) {
    console.error('❌ CRON_SECRET not found in .env or .env.local');
    process.exit(1);
}

const API_URL = `${APP_URL}/api/cron/poll-repos`;

console.log('🔄 Starting Local Polling Simulation');
console.log(`Target: ${API_URL}`);
console.log('Interval: 60 seconds');
console.log('Press Ctrl+C to stop\n');

async function poll() {
    const timestamp = new Date().toLocaleTimeString();
    process.stdout.write(`[${timestamp}] Checking for updates... `);

    try {
        const response = await fetch(API_URL, {
            headers: { 'Authorization': `Bearer ${CRON_SECRET}` }
        });

        if (response.ok) {
            console.log('✅ Done');
            const data = await response.json().catch(() => ({}));
            if (data.results?.notifications > 0) {
                console.log(`   📤 Sent ${data.results.notifications} notifications`);
            }
        } else {
            console.log(`❌ Failed (Status: ${response.status})`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

poll();
setInterval(poll, 60000);
