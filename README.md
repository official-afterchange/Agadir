# Discord Bot

Agadir is a Discord bot that keeps your server safe and secure.

---

## Included Moderation Commands

| Command | Required Permission | Description |
|---|---|---|
| `/ban` | `BAN_MEMBERS` | Ban a member (with optional message deletion) |
| `/unban` | `BAN_MEMBERS` | Unban a user by ID |
| `/kick` | `KICK_MEMBERS` | Kick a member from the server |
| `/timeout` | `MODERATE_MEMBERS` | Timeout a member (e.g. `10m`, `1h`, `2d`) |
| `/untimeout` | `MODERATE_MEMBERS` | Remove a member's timeout |
| `/warn add` | `MODERATE_MEMBERS` | Warn a member (with automatic DM) |
| `/warn list` | `MODERATE_MEMBERS` | View a member's warnings |
| `/purge` | `MANAGE_MESSAGES` | Delete 1-100 messages (with member filter) |
| `/slowmode` | `MANAGE_CHANNELS` | Set a channel's slow mode |
| `/lock on/off` | `MANAGE_CHANNELS` | Lock / Unlock a channel
| `/userinfo` | — | Detailed information about a member |

---

## Installation

### 1. Clone and install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Fill in the `.env` file:

```env
DISCORD_TOKEN=your_token_here
CLIENT_ID=your_client_id_here
GUILD_ID=your_guild_id_here       # Optional: for testing on a single server
LOG_CHANNEL_ID=your_channel_id    # Optional: channel for moderation logs
```

### 3. Deploy slash commands

```bash
# Development (instant, on a single server via GUILD_ID)
npm run deploy

# Production (global, ~1h propagation)
# Remove GUILD_ID from .env, then:
npm run deploy
```

### 4. Start the bot

```bash
# Development (with ts-node)
npm run dev

# Production (after build)
npm run build
npm start
```

---

## Project Structure

```
src/
├── commands/
│   └── moderation/
│       ├── ban.ts
│       ├── unban.ts
│       ├── kick.ts
│       ├── timeout.ts
│       ├── untimeout.ts
│       ├── warn.ts
│       ├── purge.ts
│       ├── slowmode.ts
│       ├── lock.ts
│       └── userinfo.ts
├── events/
│   ├── ready.ts
│   └── interactionCreate.ts
├── utils/
│   ├── logger.ts
│   ├── embeds.ts
│   ├── permissions.ts
│   └── modlog.ts
├── config/
│   └── index.ts
├── types/
│   └── index.ts
├── index.ts
└── deploy-commands.ts
```

---

##  Adding a Command

1. Create a file in `src/commands/<categorie>/mycommande.ts`
2. Export a `command` object following the `Command` interface
3. Re-run `npm run deploy` to deploy the new command

```typescript
import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { Command } from "../../types/index.js";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with Pong!"),
  
  cooldown: 5, // seconds (optional)

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.reply("🏓 Pong!");
  },
};
```

---

## Configuration des intents Discord

The bot requires the following intents enabled in the [developer portal](https://discord.com/developers/applications) :
- **Server Members Intent** — to access members
- **Message Content Intent** — to read message content
- **Presence Intent** — to display statuses in `/userinfo`

---

## Notes

- Warnings  (`/warn`)  are stored in memory. In production, integrate a database (SQLite, MongoDB, PostgreSQL…)
- Moderation logs are sent to  `LOG_CHANNEL_ID`  if defined
- The cooldown system is global and configurable per command
