import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
  TextChannel,
} from "discord.js";
import { Command } from "../../types/index.js";
import { checkPermissions } from "../../utils/permissions.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("slowmode")
    .setDescription("Set slow mode for a channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addIntegerOption((option) =>
      option
        .setName("seconds")
        .setDescription("Delay in seconds (0 to disable, max 21600)")
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(21600)
    )
    .addChannelOption((option) =>
      option.setName("channel").setDescription("Target channel (current one by default)").setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!checkPermissions(interaction, [PermissionFlagsBits.ManageChannels])) return;

    const seconds = interaction.options.getInteger("seconds", true);
    const targetChannel = (interaction.options.getChannel("channel") ?? interaction.channel) as TextChannel;

    if (!targetChannel || !targetChannel.isTextBased()) {
      await interaction.reply({
        embeds: [errorEmbed("Invalid channel", "This command can only be used in a text channel.")],
        ephemeral: true,
      });
      return;
    }

    try {
      await (targetChannel as TextChannel).setRateLimitPerUser(
        seconds,
        `Slow mode edited by ${interaction.user.tag}`
      );

      const message =
        seconds === 0
          ? `Slow mode has been **disabled** in ${targetChannel}.`
          : `Slow mode for ${targetChannel} is now **${seconds} second(s)**.`;

      await interaction.reply({
        embeds: [successEmbed("Slow mode updated", message)],
      });
    } catch {
      await interaction.reply({
        embeds: [errorEmbed("Error", "Unable to update slow mode for this channel.")],
        ephemeral: true,
      });
    }
  },
};
