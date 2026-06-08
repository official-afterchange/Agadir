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
    .setName("lock")
    .setDescription("Lock or unlock a channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addSubcommand((sub) =>
      sub
        .setName("on")
        .setDescription("Lock the channel (prevents sending messages)")
        .addChannelOption((o) => o.setName("channel").setDescription("Target channel (current one by default)"))
        .addStringOption((o) => o.setName("reason").setDescription("Reason for locking"))
    )
    .addSubcommand((sub) =>
      sub
        .setName("off")
        .setDescription("Unlock the channel")
        .addChannelOption((o) => o.setName("channel").setDescription("Target channel (current one by default)"))
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!checkPermissions(interaction, [PermissionFlagsBits.ManageChannels])) return;

    const subcommand = interaction.options.getSubcommand();
    const targetChannel = (interaction.options.getChannel("channel") ?? interaction.channel) as TextChannel;
    const reason = interaction.options.getString("reason") ?? "No reason provided";
    const guild = interaction.guild!;

    if (!targetChannel || !("permissionOverwrites" in targetChannel)) {
      await interaction.reply({
        embeds: [errorEmbed("Invalid Channel", "This channel does not support permission overwrites.")],
        ephemeral: true,
      });
      return;
    }

    try {
      if (subcommand === "on") {
        await targetChannel.permissionOverwrites.edit(guild.roles.everyone, {
          SendMessages: false,
        });

        await interaction.reply({
          embeds: [
            successEmbed(
              "Channel Locked 🔒",
              `${targetChannel} is now locked.\n**Reason:** ${reason}`
            ),
          ],
        });

        await targetChannel.send({
          embeds: [errorEmbed("Channel Locked", `This channel has been locked by a moderator.\n**Reason:** ${reason}`)],
        });
      } else {
        await targetChannel.permissionOverwrites.edit(guild.roles.everyone, {
          SendMessages: null,
        });

        await interaction.reply({
          embeds: [successEmbed("Channel Unlocked 🔓", `${targetChannel} is now unlocked.`)],
        });

        await targetChannel.send({
          embeds: [successEmbed("Channel Unlocked", "This channel is now unlocked.")],
        });
      }
    } catch {
      await interaction.reply({
        embeds: [errorEmbed("Error", "Failed to modify the channel permissions.")],
        ephemeral: true,
      });
    }
  },
};
