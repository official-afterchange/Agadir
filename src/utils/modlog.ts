import { EmbedBuilder, Guild, TextChannel } from "discord.js";
import { config } from "../config/index.js";
import { logger } from "./logger.js";

export async function sendModLog(guild: Guild, embed: EmbedBuilder): Promise<void> {
  if (!config.logChannelId) return;

  try {
    const channel = await guild.channels.fetch(config.logChannelId);
    if (channel && channel.isTextBased()) {
      await (channel as TextChannel).send({ embeds: [embed] });
    }
  } catch {
    logger.warn(`Unable to send moderation logs to channel ${config.logChannelId}`);
  }
}
