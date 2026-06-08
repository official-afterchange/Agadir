import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
} from "discord.js";
import { Command } from "../../types/index.js";
import { checkPermissions } from "../../utils/permissions.js";
import { modEmbed, errorEmbed } from "../../utils/embeds.js";
import { sendModLog } from "../../utils/modlog.js";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Revoke a ban for a user")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addStringOption((option) =>
      option
        .setName("user_id")
        .setDescription("The user ID to revoke the ban for")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("reason").setDescription("Revoke ban reason").setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!checkPermissions(interaction, [PermissionFlagsBits.BanMembers])) return;

    const userId = interaction.options.getString("user_id", true);
    const reason = interaction.options.getString("reason") ?? "No reason provided";
    const guild = interaction.guild!;

    await interaction.deferReply();

    const ban = await guild.bans.fetch(userId).catch(() => null);
    if (!ban) {
      await interaction.editReply({
        embeds: [errorEmbed("Not banned", "This user is not banned from the server.")],
      });
      return;
    }


    try {
      await guild.members.unban(userId, `${interaction.user.tag}: ${reason}`);

      const embed = modEmbed({
        action: "Revoke Ban",
        target: ban.user,
        moderator: interaction.user,
        reason,
      });


      await interaction.editReply({ embeds: [embed] });
      await sendModLog(guild, embed);
    } catch {
      await interaction.editReply({
        embeds: [errorEmbed("Error", "Unable to revoke ban for this user.")],
      });
    }
  },
};
