import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
  GuildMember,
} from "discord.js";
import ms from "ms";
import { Command } from "../../types/index.js";
import { checkPermissions, canModerate } from "../../utils/permissions.js";
import { modEmbed, errorEmbed } from "../../utils/embeds.js";
import { sendModLog } from "../../utils/modlog.js";

const MAX_TIMEOUT_MS = 28 * 24 * 60 * 60 * 1000;

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("timeout")
.setDescription("Timeout a member")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((option) =>
      option.setName("member").setDescription("The member to timeout").setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("duration")
        .setDescription("Timeout duration (e.g. 10m, 1h, 2d)")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("reason").setDescription("Timeout reason").setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!checkPermissions(interaction, [PermissionFlagsBits.ModerateMembers])) return;

    const targetMember = interaction.options.getMember("member") as GuildMember | null;
    const durationStr = interaction.options.getString("duration", true);
    const reason = interaction.options.getString("reason") ?? "No reason provided";

    if (!targetMember) {
      await interaction.reply({
        embeds: [errorEmbed("Member not found", "This member is not in the server.")],
        ephemeral: true,
      });
      return;
    }

    if (!canModerate(interaction, targetMember)) return;

    const durationMs = ms(durationStr);
    if (!durationMs || durationMs <= 0) {
      await interaction.reply({
        embeds: [errorEmbed("Invalid duration", "Invalid format. Examples: `10m`, `1h`, `2d`, `1w`.")],
        ephemeral: true,
      });
      return;
    }

    if (durationMs > MAX_TIMEOUT_MS) {
      await interaction.reply({
        embeds: [errorEmbed("Duration too long", "The maximum timeout duration is 28 days.")],
        ephemeral: true,
      });
      return;
    }

    if (!targetMember.moderatable) {
      await interaction.reply({
        embeds: [errorEmbed("Not possible", "I cannot timeout this member.")],
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply();

    try {
      await targetMember.timeout(durationMs, `${interaction.user.tag}: ${reason}`);

      const embed = modEmbed({
        action: "Timeout",
        target: targetMember.user,
        moderator: interaction.user,
        reason,
        duration: durationStr,
      });

      await interaction.editReply({ embeds: [embed] });
      await sendModLog(interaction.guild!, embed);
    } catch {
      await interaction.editReply({
        embeds: [errorEmbed("Error", "Unable to timeout this member.")],
      });
    }
  },
};
