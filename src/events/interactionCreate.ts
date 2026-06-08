import { Events, ChatInputCommandInteraction, Collection } from "discord.js";
import { BotClient } from "../types/index.js";
import { logger } from "../utils/logger.js";
import { errorEmbed } from "../utils/embeds.js";
import { config } from "../config/index.js";

export const name = Events.InteractionCreate;
export const once = false;

export async function execute(
  client: BotClient,
  interaction: ChatInputCommandInteraction
): Promise<void> {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) {

    logger.warn(`Unknown command: ${interaction.commandName}`);
    return;
  }

  if (!client.cooldowns.has(command.data.name)) {
    client.cooldowns.set(command.data.name, new Collection());
  }

  const now = Date.now();
  const timestamps = client.cooldowns.get(command.data.name)!;

  const cooldownAmount = (command.cooldown ?? config.defaultCooldown) * 1000;

  if (timestamps.has(interaction.user.id)) {
    const expirationTime = timestamps.get(interaction.user.id)! + cooldownAmount;

    if (now < expirationTime) {
      const timeLeft = ((expirationTime - now) / 1000).toFixed(1);
      await interaction.reply({
        embeds: [
          errorEmbed(
            "Command is on cooldown",
            `Please wait **${timeLeft}s** before reusing \`/${command.data.name}\`.`
          ),
        ],
        ephemeral: true,
      });
      return;
    }
  }

  timestamps.set(interaction.user.id, now);
  setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

  try {
    await command.execute(interaction);
    logger.info(`/${interaction.commandName} used by ${interaction.user.tag} in ${interaction.guild?.name}`);

  } catch (error) {
    logger.error(
      `Unexpected error while executing /${interaction.commandName}:`,
      error
    );

    const reply = {
      embeds: [
        errorEmbed(
          "Unexpected error",
          "An unexpected error occurred while executing this command."
        ),
      ],
      ephemeral: true,
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply).catch(() => null);
    } else {
      await interaction.reply(reply).catch(() => null);
    }
  }
}
