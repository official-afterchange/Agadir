import { REST, Routes, SlashCommandBuilder } from "discord.js";
import { readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { Command } from "./types/index.js";
import { config } from "./config/index.js";
import { logger } from "./utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function deployCommands(): Promise<void> {
  const commands: ReturnType<SlashCommandBuilder["toJSON"]>[] = [];

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

      if (command?.data) {
        commands.push(command.data.toJSON());
        logger.debug(`Command Ready : /${command.data.name}`);
      }
    }
  }

  const rest = new REST().setToken(config.token);
  logger.info(`Deploying ${commands.length} command(s)...`);

  try {
    if (config.guildId) {
      await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), { body: commands });
      logger.success(`${commands.length} command(s) deployed on server ${config.guildId}`);
    } else {
      await rest.put(Routes.applicationCommands(config.clientId), { body: commands });
      logger.success(`${commands.length} command(s) deployed globally`);
    }
  } catch (error) {
    logger.error("Error during deployment :", error);
    process.exit(1);
  }
}

deployCommands();