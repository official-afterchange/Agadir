import { Client, GatewayIntentBits, Collection, Partials } from "discord.js";
import { readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { BotClient, Command } from "./types/index.js";
import { config } from "./config/index.js";
import { logger } from "./utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.GuildMember, Partials.Message],
}) as BotClient;

client.commands = new Collection<string, Command>();
client.cooldowns = new Collection();

async function loadCommands(): Promise<void> {
  const commandsPath = join(__dirname, "commands");
  const commandFolders = readdirSync(commandsPath);

  for (const folder of commandFolders) {
    const folderPath = join(commandsPath, folder);
    const commandFiles = readdirSync(folderPath).filter(
      (f) => (f.endsWith(".ts") || f.endsWith(".js")) && !f.endsWith(".d.ts")
    );

    for (const file of commandFiles) {
      const filePath = pathToFileURL(join(folderPath, file)).href;
      const module = await import(filePath);
      const command: Command = module.command;

      if (command?.data && typeof command.execute === "function") {
        client.commands.set(command.data.name, command);
        logger.debug(`Command loaded : /${command.data.name}`);
      } else {
        logger.warn(`Invalid command in ${file}`);
      }
    }
  }
}

async function loadEvents(): Promise<void> {
  const eventsPath = join(__dirname, "events");
  const eventFiles = readdirSync(eventsPath).filter(
    (f) => (f.endsWith(".ts") || f.endsWith(".js")) && !f.endsWith(".d.ts")
  );

  for (const file of eventFiles) {
    const filePath = pathToFileURL(join(eventsPath, file)).href;
    const event = await import(filePath);

    if (event.once) {
      client.once(event.name, (...args: unknown[]) => event.execute(client, ...args));
    } else {
      client.on(event.name, (...args: unknown[]) => event.execute(client, ...args));
    }

    logger.debug(`Event loaded : ${event.name}`);
  }
}

async function main(): Promise<void> {
  logger.info("Starting bot...");
  await loadCommands();
  await loadEvents();
  await client.login(config.token);
}

main().catch((err) => {
  logger.error("Fatal error at startup :", err);
  process.exit(1);
});

process.on("unhandledRejection", (error) => logger.error("Uncaught rejection :", error));
process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception :", error);
  process.exit(1);
});