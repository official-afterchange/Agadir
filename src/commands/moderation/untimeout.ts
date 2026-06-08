import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
  GuildMember,
} from "discord.js";
import { Command } from "../../types/index.js";
import { checkPermissions } from "../../utils/permissions.js";
import { modEmbed, errorEmbed } from "../../utils/embeds.js";
import { sendModLog } from "../../utils/modlog.js";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("untimeout")
    .setDescription("Remove a timeout from a member")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((option) =>
      option.setName("member").setDescription("The member whose timeout should be removed").setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("reason").setDescription("Reason").setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!checkPermissions(interaction, [PermissionFlagsBits.ModerateMembers])) return;

    const targetMember = interaction.options.getMember("member") as GuildMember | null;
    const reason = interaction.options.getString("reason") ?? "No reason provided";

    if (!targetMember) {
      await interaction.reply({
        embeds: [errorEmbed("Member not found", "This member is not in the server.")],
        ephemeral: true,
      });
      return;
    }

    if (!targetMember.isCommunicationDisabled()) {
      await interaction.reply({
        embeds: [errorEmbed("Not timed out", "This member is not currently timed out.")],
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply();

    try {
      await targetMember.timeout(null, `${interaction.user.tag}: ${reason}`);

      const embed = modEmbed({
        action: "Timeout removed",
        target: targetMember.user,
        moderator: interaction.user,
        reason,
      });

      await interaction.editReply({ embeds: [embed] });
      await sendModLog(interaction.guild!, embed);
    } catch {
      await interaction.editReply({
        embeds: [errorEmbed("Error", "Unable to remove the timeout for this member.")],
      });
    }
  },
};
