import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
  GuildMember,
} from "discord.js";
import { Command } from "../../types/index.js";
import { checkPermissions, canModerate } from "../../utils/permissions.js";
import { modEmbed, errorEmbed } from "../../utils/embeds.js";
import { sendModLog } from "../../utils/modlog.js";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a member from the server")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption((option) =>
      option.setName("member").setDescription("The member to ban").setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("reason").setDescription("Ban reason").setRequired(false).setMaxLength(512)
    )
    .addIntegerOption((option) =>
      option.setName("delete_messages").setDescription("Delete messages from the last X days (0-7)").setMinValue(0).setMaxValue(7).setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!checkPermissions(interaction, [PermissionFlagsBits.BanMembers])) return;

    const targetUser = interaction.options.getUser("member", true);
    const reason = interaction.options.getString("reason") ?? "No reason provided";
    const deleteMessageDays = interaction.options.getInteger("delete_messages") ?? 0;
    const guild = interaction.guild!;

    const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);
    if (targetMember && !canModerate(interaction, targetMember as GuildMember)) return;

    const botMember = guild.members.me!;
    if (!botMember.permissions.has(PermissionFlagsBits.BanMembers)) {
      await interaction.reply({
        embeds: [errorEmbed("Missing Permission", "I don't have permission to ban members.")],
        ephemeral: true,
      });
      return;
    }

    const bans = await guild.bans.fetch();
    if (bans.has(targetUser.id)) {
      await interaction.reply({
        embeds: [errorEmbed("Already Banned", "This user is already banned from the server.")],
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply();

    try {
      await guild.members.ban(targetUser.id, {
        reason: `${interaction.user.tag}: ${reason}`,
        deleteMessageSeconds: deleteMessageDays * 86400,
      });

      const embed = modEmbed({
        action: "Banned",
        target: targetUser,
        moderator: interaction.user,
        reason,
        extra: deleteMessageDays > 0
          ? [{ name: "Messages deleted", value: `${deleteMessageDays} day(s)`, inline: true }]
          : undefined,
      });

      await interaction.editReply({ embeds: [embed] });
      await sendModLog(guild, embed);
    } catch {
      await interaction.editReply({ embeds: [errorEmbed("Error", "Failed to ban the user.")] });
    }
  },
};