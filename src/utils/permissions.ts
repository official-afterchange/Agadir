import {
  ChatInputCommandInteraction,
  GuildMember,
  PermissionResolvable,
} from "discord.js";
import { errorEmbed } from "./embeds.js";

export function checkPermissions(
  interaction: ChatInputCommandInteraction,
  permissions: PermissionResolvable[]
): boolean {
  const member = interaction.member as GuildMember;

  for (const perm of permissions) {
    if (!member.permissions.has(perm)) {
      interaction.reply({
        embeds: [
          errorEmbed(
            "Insufficient permissions",
            `You do not have the \`${perm}\` permission to use this command.`
          ),
        ],
        ephemeral: true,
      });
      return false;
    }
  }
  return true;
}


export function canModerate(
  interaction: ChatInputCommandInteraction,
  target: GuildMember
): boolean {
  const moderator = interaction.member as GuildMember;
  const guild = interaction.guild!;

  if (target.id === guild.ownerId) {
    interaction.reply({
      embeds: [errorEmbed("Action not allowed", "You cannot moderate the server owner.")],
      ephemeral: true,
    });
    return false;
  }

  if (moderator.roles.highest.comparePositionTo(target.roles.highest) <= 0) {
    interaction.reply({
      embeds: [
        errorEmbed(
          "Insufficient role hierarchy",
          "You cannot moderate a member whose top role is equal to or higher than yours."
        ),
      ],
      ephemeral: true,
    });
    return false;
  }

  return true;
}
