import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  GuildMember,
  EmbedBuilder,
} from "discord.js";
import { Command } from "../../types/index.js";
import { config } from "../../config/index.js";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription("Show information about a user")
    .addUserOption((option) =>
      option.setName("member").setDescription("The member to inspect (you by default)").setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const targetMember = (interaction.options.getMember("member") ?? interaction.member) as GuildMember;
    const user = targetMember.user;

    await interaction.deferReply();

    const createdAt = Math.floor(user.createdTimestamp / 1000);
    const joinedAt = targetMember.joinedTimestamp
      ? Math.floor(targetMember.joinedTimestamp / 1000)
      : null;

    const roles = targetMember.roles.cache
      .filter((r) => r.id !== interaction.guild!.roles.everyone.id)
      .sort((a, b) => b.position - a.position)
      .map((r) => r.toString());

    const statusMap: Record<string, string> = {
      online: "Online",
      idle: "Idle",
      dnd: "Do Not Disturb",
      offline: "Offline",
    };

    const presence = targetMember.presence?.status ?? "offline";
    const status = statusMap[presence] ?? "Offline";

    const embed = new EmbedBuilder()
      .setColor(targetMember.displayHexColor !== "#000000" ? targetMember.displayHexColor : config.colors.info)
      .setTitle(`👤 ${user.tag}`)
      .setThumbnail(user.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: "ID", value: `\`${user.id}\``, inline: true },
        { name: "Status", value: status, inline: true },
        { name: "Bot", value: user.bot ? "Yes" : "No", inline: true },
        { name: "Account created on", value: `<t:${createdAt}:F> (<t:${createdAt}:R>)`, inline: false },
        { name: "Joined on", value: joinedAt ? `<t:${joinedAt}:F> (<t:${joinedAt}:R>)` : "Unknown", inline: false },
        {
          name: `Roles (${roles.length})`,
          value: roles.length > 0 ? roles.slice(0, 15).join(", ") : "No roles",
          inline: false,
        }
      )
      .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
