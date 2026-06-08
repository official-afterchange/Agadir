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

const warnings = new Map<
  string,
  { userId: string; guildId: string; reason: string; moderatorId: string; date: Date }[]
>();

export function getWarnings(guildId: string, userId: string) {
  const key = `${guildId}-${userId}`;
  return warnings.get(key) ?? [];
}

function addWarning(guildId: string, userId: string, reason: string, moderatorId: string) {
  const key = `${guildId}-${userId}`;
  const userWarnings = warnings.get(key) ?? [];
  userWarnings.push({ userId, guildId, reason, moderatorId, date: new Date() });
  warnings.set(key, userWarnings);
  return userWarnings.length;
}

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Warn a member")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand((sub) =>
      sub
        .setName("add")
        .setDescription("Add a warning to a member")
        .addUserOption((o) =>
          o.setName("member").setDescription("The member to warn").setRequired(true)
        )
        .addStringOption((o) =>
          o.setName("raison").setDescription("Warning reason").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("list")
        .setDescription("View warnings of a member")
        .addUserOption((o) => o.setName("member").setDescription("The member").setRequired(true))
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!checkPermissions(interaction, [PermissionFlagsBits.ModerateMembers])) return;

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "add") {
      const targetMember = interaction.options.getMember("member") as GuildMember | null;
      const reason = interaction.options.getString("raison", true);

      if (!targetMember) {
        await interaction.reply({
          embeds: [errorEmbed("Member not found", "This member is not in the server.")],
          ephemeral: true,
        });
        return;
      }

      if (!canModerate(interaction, targetMember)) return;

      const totalWarnings = addWarning(
        interaction.guild!.id,
        targetMember.id,
        reason,
        interaction.user.id
      );

      const embed = modEmbed({
        action: "Warning",
        target: targetMember.user,
        moderator: interaction.user,
        reason,
        extra: [{ name: "Total warnings", value: `${totalWarnings}`, inline: true }],
      });

      await interaction.reply({ embeds: [embed] });
      await sendModLog(interaction.guild!, embed);

      await targetMember
        .send({
          embeds: [
            modEmbed({
              action: `Warning on ${interaction.guild!.name}`,
              target: targetMember.user,
              moderator: interaction.user,
              reason,
            }),
          ],
        })
        .catch(() => null);
    } else if (subcommand === "list") {
      const targetUser = interaction.options.getUser("member", true);
      const userWarnings = getWarnings(interaction.guild!.id, targetUser.id);

      if (userWarnings.length === 0) {
        await interaction.reply({
          embeds: [
            {
              color: 0x2ecc71,
              description: `${targetUser} has no warnings.`,
              timestamp: new Date().toISOString(),
            },
          ],
          ephemeral: true,
        });
        return;
      }

      const { EmbedBuilder } = await import("discord.js");
      const embed = new EmbedBuilder()
        .setColor(0xf39c12)
        .setTitle(`Warnings for ${targetUser.tag}`)
        .setThumbnail(targetUser.displayAvatarURL())
        .setDescription(`Total: **${userWarnings.length}** warning(s)`)
        .addFields(
          userWarnings.slice(-10).map((w, i) => ({
            name: `#${i + 1} — ${w.date.toLocaleDateString("en-US")}`,
            value: `**Reason:** ${w.reason}`,
          }))
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
