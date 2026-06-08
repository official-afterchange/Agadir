import { EmbedBuilder, GuildMember, User } from "discord.js";
import { config } from "../config/index.js";

export function successEmbed(title: string, description: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(config.colors.success)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp();
}

export function errorEmbed(title: string, description: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(config.colors.error)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp();
}

export function modEmbed(options: {
  action: string;
  target: User | GuildMember;
  moderator: User | GuildMember;
  reason: string;
  duration?: string;
  extra?: { name: string; value: string; inline?: boolean }[];
}): EmbedBuilder {
  const target = options.target instanceof GuildMember ? options.target.user : options.target;
  const moderator = options.moderator instanceof GuildMember ? options.moderator.user : options.moderator;

  const embed = new EmbedBuilder()
    .setColor(config.colors.mod)
    .setTitle(options.action)
    .setThumbnail(target.displayAvatarURL())
    .addFields(
      { name: "User", value: `${target} (\`${target.id}\`)`, inline: true },
      { name: "Moderator", value: `${moderator}`, inline: true },
      { name: "Reason", value: options.reason }
    )
    .setTimestamp();

  if (options.duration) {
    embed.addFields({ name: "Duration", value: options.duration, inline: true });
  }


  if (options.extra) {
    embed.addFields(options.extra);
  }

  return embed;
}

export function infoEmbed(title: string, description: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(config.colors.info)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp();
}
