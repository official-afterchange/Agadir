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
    .setName("kick")
    .setDescription("Kick a member from the server")
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption((option) =>
      option.setName("member").setDescription("The member to kick").setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Kick reason")
        .setRequired(false)
        .setMaxLength(512)
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!checkPermissions(interaction, [PermissionFlagsBits.KickMembers])) return;

    const targetMember = interaction.options.getMember("member") as GuildMember | null;
    const reason = interaction.options.getString("reason") ?? "No reason provided";

    if (!targetMember) {
      await interaction.reply({
        embeds: [errorEmbed("Member not found", "This member is not in the server.")],
        ephemeral: true,
      });
      return;
    }


    if (!canModerate(interaction, targetMember)) return;

    if (!targetMember.kickable) {
      await interaction.reply({
        embeds: [errorEmbed("Not possible", "I cannot kick this member (higher or equal role).")],
        ephemeral: true,
      });
      return;
    }


    await interaction.deferReply();

    try {
      await targetMember.kick(`${interaction.user.tag}: ${reason}`);

      const embed = modEmbed({
        action: "Kick",
        target: targetMember.user,
        moderator: interaction.user,
        reason,
      });


      await interaction.editReply({ embeds: [embed] });
      await sendModLog(interaction.guild!, embed);
    } catch {
      await interaction.editReply({
        embeds: [errorEmbed("Error", "Unable to kick this member.")],
      });
    }

  },
};
