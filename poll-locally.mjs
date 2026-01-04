
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import readline from 'readline';

// Function to load env files manually to handle precedence
function loadEnv() {
    const env = {};

    // High -> Low priority: .env.local -> .env
    const files = ['.env', '.env.local'];

    files.forEach(file => {
        if (fs.existsSync(file)) {
            const parsed = dotenv.parse(fs.readFileSync(file));
            Object.assign(env, parsed);
        }
    });

    // Also check actual process.env (system vars override files)
    return { ...env, ...process.env };
}

const env = loadEnv();
const CRON_SECRET = env.CRON_SECRET;
const APP_URL = env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

if (!CRON_SECRET) {
    console.error('❌ CRON_SECRET not found in .env or .env.local');
    process.exit(1);
}

const API_URL = `${APP_URL}/api/cron/poll-repos`.replace(/\/$/, '') + '/';

console.log('🔄 Starting Local Polling Simulation (Node.js)');
console.log(`Target: ${API_URL}`);
console.log(`Secret: ${CRON_SECRET.substring(0, 5)}... (Length: ${CRON_SECRET.length})`);
console.log('Interval: 60 seconds');
console.log('Press Ctrl+C to stop\n');

async function poll() {
    const timestamp = new Date().toLocaleTimeString();
    process.stdout.write(`[${timestamp}] Checking for updates... `);

    try {
        const response = await fetch(API_URL, {
            headers: {
                'Authorization': `Bearer ${CRON_SECRET}`
            }
        });

        if (response.ok) {
            console.log('✅ Done');
            // Try to parse JSON if exists
            try {
                const data = await response.json();
                if (data.results && data.results.notifications > 0) {
                    console.log(`   📤 Sent ${data.results.notifications} notifications`);
                }
            } catch (e) { }
        } else {
            console.log(`❌ Failed (Status: ${response.status})`);
            if (response.status === 404) {
                console.log('   Is the Next.js server running? (npm run dev)');
            }
            if (response.status === 401) {
                console.log('   Unauthorized. Check if your CRON_SECRET matches the server.');
            }
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        if (error.cause && error.cause.code === 'ECONNREFUSED') {
            console.log('   Are you sure the server is running on localhost:3000?');
        }
    }
}

// Initial poll
poll();

// Poll every 60s
setInterval(poll, 60000);
