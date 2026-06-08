import "dotenv/config";

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Environment variable not found: ${key}`);
  return value;
}

export const config = {
  token: requireEnv("DISCORD_TOKEN"),
  clientId: requireEnv("CLIENT_ID"),
  guildId: process.env.GUILD_ID,
  logChannelId: process.env.LOG_CHANNEL_ID,

  colors: {
    success: 0x2ecc71,
    error: 0xe74c3c,
    warning: 0xf39c12,
    info: 0x3498db,
    mod: 0x9b59b6,
  },

  defaultCooldown: 3,
};
