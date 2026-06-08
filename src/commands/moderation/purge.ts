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
    .setName("purge")
    .setDescription("Bulk delete messages")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption((option) =>
      option
        .setName("number")
        .setDescription("Number of messages to delete (1-100)")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    )
    .addUserOption((option) =>
      option
        .setName("member")
        .setDescription("Delete messages from this member only")
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!checkPermissions(interaction, [PermissionFlagsBits.ManageMessages])) return;

    const amount = interaction.options.getInteger("number", true);
    const targetUser = interaction.options.getUser("member");
    const channel = interaction.channel as TextChannel;

    if (!channel.isTextBased()) {
      await interaction.reply({
        embeds: [errorEmbed("Invalid channel", "This command can only be used in a text channel.")],
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      let messages = await channel.messages.fetch({ limit: targetUser ? 100 : amount });

      if (targetUser) {
        messages = messages.filter((m) => m.author.id === targetUser.id);
        messages = new (messages.constructor as typeof messages.constructor)(
          [...messages.entries()].slice(0, amount)
        );
      }

      const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
      const recentMessages = messages.filter((m) => m.createdTimestamp > twoWeeksAgo);

      if (recentMessages.size === 0) {
        await interaction.editReply({
          embeds: [
            errorEmbed(
              "No messages",
              "No recent messages are available to delete. Messages older than 14 days cannot be bulk deleted."
            ),
          ],
        });
        return;
      }

      const deleted = await channel.bulkDelete(recentMessages, true);

      await interaction.editReply({
        embeds: [
          successEmbed(
            "Messages deleted",
            `**${deleted.size}** message(s) deleted${targetUser ? ` from ${targetUser}` : ""}.`
          ),
        ],
      });
    } catch {
      await interaction.editReply({
        embeds: [errorEmbed("Error", "Unable to delete the messages.")],
      });
    }
  },
};
