import { Client, Events, GatewayIntentBits, Message } from 'discord.js';
import dotenv from 'dotenv';
import axios from 'axios';

// Load environment variables
dotenv.config();

// Initialize Discord client with necessary intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Interface for Acorn payload
interface AcornPayload {
  QUERY: string;
  USER_ID: string;
  CHANNEL_ID: string;
  TIMESTAMP: string;
  GUILD_ID: string;
  THREAD_ID?: string;
}

// Function to forward message to Acorn
async function forwardToAcorn(payload: AcornPayload) {
  try {
    // TODO: change this before using
    const response = await axios.post("https://main.acornlabs.com/api/assistants/a14hkfx/projects/p1vbpgb/tasks/w1m78rp/run?step=*", payload, {
      headers: {
        'Cookie': `obot_access_token=${process.env.ACORN_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });
    console.log('Successfully forwarded message to Acorn:', response.status);
  } catch (error) {
    console.error('Error forwarding message to Acorn:', error);
  }
}

// Event handler for when the bot is ready
client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

// Event handler for messages
client.on(Events.MessageCreate, async (message: Message) => {
  // Ignore bot messages to prevent loops
  if (message.author.bot) return;

  // Only process messages that mention the bot
  if (!message.mentions.users.has(client.user!.id)) {
    return;
  }

  // Create payload for Acorn
  const payload: AcornPayload = {
    QUERY: message.content,
    USER_ID: message.author.id,
    TIMESTAMP: message.createdAt.toISOString(),
    GUILD_ID: message.guild!.id,
    CHANNEL_ID: message.channel.isThread() ? message.channel.parentId! : message.channel.id,
  };

  if (message.channel.isThread()) {
    payload.THREAD_ID = message.channel.id;
  }

  console.log(payload);

  // Forward message to Acorn
  await forwardToAcorn(payload);
});

// Error handling
client.on('error', (error) => {
  console.error('Discord client error:', error);
});

// Login to Discord
client.login(process.env.DISCORD_TOKEN)
  .catch((error) => {
    console.error('Failed to login to Discord:', error);
    process.exit(1);
  });
