import { createClient } from "redis";

const client = createClient({
    password: 'tlNs1uqYknarrBE1Hbcz6iSNwbyjIsVB',
    socket: {
        host: 'redis-19777.c289.us-west-1-2.ec2.cloud.redislabs.com',
        port: 19777
    }
});

client.on('connect', () => {
    console.log('Connected to Redis!');
});

client.on('error', err => {
    console.error('Redis Client Error', err);
});

// Note: We're not calling client.quit() here
await client.connect();

// Additional function to check the connection status externally
async function checkConnection() {
    if (!client.isOpen) {
        console.log('Redis client is not open.');
        return false;
    }

    try {
        const pong = await client.ping();
        if (pong === 'PONG') {
            console.log('Redis connection is confirmed.');
            return true;
        }
    } catch (error) {
        console.error('Error confirming Redis connection:', error);
        return false;
    }
}

export default client;
export { checkConnection };

