import { Events, ActivityType } from "discord.js";
import { BotClient } from "../types/index.js";
import { logger } from "../utils/logger.js";

export const name = Events.ClientReady;
export const once = true;

export async function execute(client: BotClient): Promise<void> {
  logger.success(`Bot connected as ${client.user!.tag}`);
  logger.info(`Present on ${client.guilds.cache.size} server(s)`);
  logger.info(`${client.commands.size} command(s) loaded`);

  client.user!.setPresence({
    activities: [
      {
        name: `${client.guilds.cache.size} server(s)`,
        type: ActivityType.Watching,
      },
    ],
    status: "online",
  });
}
