const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const client = new Client({ intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});
const mysql = require('mysql');
const moment = require('moment-timezone');

require('console-stamp')(console, 'HH:MM:ss.l');

if (!process.env.DISCORD_API_KEY || process.env.DISCORD_API_KEY.length <= 0) {
    console.log('ERROR: Env variable DISCORD_API_KEY does not exists or is empty!');
    process.exit(1);
}

if (!process.env.DB_HOST || process.env.DB_HOST.length <= 0) {
    console.log('ERROR: Env variable DB_HOST does not exists or is empty!');
    process.exit(1);
}

if (!process.env.DB_USER || process.env.DB_USER.length <= 0) {
    console.log('ERROR: Env variable DB_USER does not exists or is empty!');
    process.exit(1);
}

if (!process.env.DB_PASS || process.env.DB_PASS.length <= 0) {
    console.log('ERROR: Env variable DB_PASS does not exists or is empty!');
    process.exit(1);
}

if (!process.env.DISCORD_CHANNEL_ID || process.env.DISCORD_CHANNEL_ID.length <= 0) {
    console.log('ERROR: Env variable DISCORD_CHANNEL_ID does not exists or is empty!');
    process.exit(1);
}

const discordApiKey = process.env.DISCORD_API_KEY;
const discordChannelId = process.env.DISCORD_CHANNEL_ID;
const connect = (connection) => {
    connection.connect((err) => {
        if (err) {
            console.error('Error connecting to the database:', err);
            return 'Error connecting to the database:' + err;
        }
    });
}

// Function to create a new database connection
const createConnection = () => {
    return mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME
    });
}

let myTag;

const findChannel = () => {
    return client.channels.cache.get(discordChannelId);
}

const setStatus = (output) => {
    client.user.setPresence({
        activities: [{ name: output, type: ActivityType.Watching }],
        status: 'online',
    });
}

const insertData = (data, callback) => {
    const connection = createConnection();
    connect(connection);

    // Insert a dataset
    const dataset = {milliliter: data, timestamp: moment().tz('Europe/Berlin').format('YYYY-MM-DD HH:mm:ss')};
    connection.query('INSERT INTO consumption_data SET ?', dataset, (err, results) => {
        if (err) {
            console.error('Error inserting dataset:', err);
            callback('Error inserting dataset: ' + err);
        }

        console.log('Dataset inserted successfully!');
        callback(dataset.milliliter + ' ml @ ' + dataset.timestamp);
    });

    // Close the connection
    connection.end((err) => {
        if (err) {
            console.error('Error closing the database connection:', err);
        }
    });
};

const sendMessage = (channel, channelMessage) => {
    channel.send(channelMessage).then(() => {
        console.log(`Message "${channelMessage}" sent successfully!`);
    }).catch((error) => {
        console.error('Error sending message:', error);
    });
};

const refreshStatus = (echoInChannel) => {
    const connection = createConnection();
    connect(connection);
    const channel = findChannel();

    // Get the current date in Europe/Berlin timezone
    const currentDate = moment().tz('Europe/Berlin').format('YYYY-MM-DD');

    // Run the query
    const query = `
SELECT DATE(timestamp) AS date, SUM(milliliter) AS total_ml
FROM consumption_data
WHERE 
    DATE(timestamp) = CURDATE()
GROUP BY DATE(timestamp);
  `;

    connection.query(query, [currentDate, currentDate, currentDate], (err, results) => {
        if (err) {
            console.error('Error executing the query:', err);
            connection.end();
            return;
        }

        let statusText;

        // Process the query results
        if (results.length > 0) {
            let output;
            const totalMilliliters = results[0].total_ml;

            if (totalMilliliters > 1000) {
                const totalLiters = (totalMilliliters / 1000).toFixed(2);
                output = `Total for ${currentDate}: ${totalLiters} l`;
                statusText = `TODAY: ${totalLiters} l`;
            } else {
                output = `Total for ${currentDate}: ${totalMilliliters} ml`;
                statusText = `TODAY: ${totalMilliliters} ml`;
            }
            console.log(output);

            if (echoInChannel)
                sendMessage(channel, output);
        } else {
            statusText = `TODAY: 0 ml`;
            console.log(`No data found for ${currentDate}. Defaulting to 0 ml`);
        }

        setStatus(statusText);

        // Close the connection
        connection.end((err) => {
            if (err) {
                console.error('Error closing the database connection:', err);
            }
        });
    });
}

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag} (${client.user.username})!`);
    myTag = client.user.username;

    // Call refreshStatus every 30 minutes (30 minutes * 60 seconds * 1000 milliseconds)
    setInterval(() => {
        console.log("Periodically refresh presence status...");
        refreshStatus(false);
    }, 30 * 60 * 1000);

    // Initial refreshStatus
    refreshStatus(false);
});

client.on('messageCreate', msg => {
    if (msg.author.username === myTag) {
        return;
    }

    const inputMessage = msg.content.slice(1);

    if (inputMessage.length > 0 && msg.content.startsWith('!')) {
        const words = msg.content.split(' ');
        const command = words[0];
        const channel = findChannel();

        console.log("COMMAND: " + inputMessage.toLowerCase())

        const args = words.slice(1).join(' ');

        if (!channel) {
            console.error("Channel not found by ID!")
            return;
        }

        if (command.toLowerCase() === "!seller") {
            if (words.length <= 1) {
                sendMessage(channel, "ERR: Validation failed, no args provided!");
                return;
            }

            console.log("!seller command received, args: " + args);
            var argsArray = args.split(/\s+/);

            // When 2rd argument is oz/cups convert it to ml.
            if (argsArray[1]) {
                if (["oz", "cups", "ml"].includes(argsArray[1])) {
                    // Convert oz into ml.
                    if (argsArray[1] === "oz") {
                        argsArray[0] = Math.round(argsArray[0] * 29.5735);
                    } else if (argsArray[1] === "cups") { // Convert cups into ml.
                        argsArray[0] = Math.round(argsArray[0] * 236.588);
                    }
                } else {
                    sendMessage(channel, "ERR: Validation failed, arg-1 validation failed (oz/cups/ml)!");
                    return;
                }
            }

            if (/^\d+$/.test(argsArray[0]) && argsArray[0] > 0 && argsArray[0] < 10000) {
                console.log("lets log " + argsArray[0] + " ml!");
                insertData(argsArray[0], (result) => {
                    sendMessage(channel, "Logged Sellerie: " + result);
                    refreshStatus(true);
                });
            } else {
                console.log(`Failed to validate arg: ${argsArray[0]}`);
                sendMessage(channel, "ERR: Args validation failed!");
            }
        }
    }
});

client.login(discordApiKey);
