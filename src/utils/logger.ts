type LogLevel = "info" | "warn" | "error" | "debug" | "success";

const colors = {
  reset: "\x1b[0m",
  info: "\x1b[36m",
  warn: "\x1b[33m",
  error: "\x1b[31m",
  debug: "\x1b[35m",
  success: "\x1b[32m",
};

const icons: Record<LogLevel, string> = {
  info: "ℹ",
  warn: "⚠",
  error: "✖",
  debug: "◈",
  success: "✔",
};

function log(level: LogLevel, message: string, ...args: unknown[]): void {
  const timestamp = new Date().toLocaleTimeString("fr-FR");
  const color = colors[level];
  const icon = icons[level];
  const label = level.toUpperCase().padEnd(7);

  console.log(
    `${color}${icon} [${timestamp}] ${label}${colors.reset} ${message}`,
    ...args
  );
}

export const logger = {
  info: (msg: string, ...args: unknown[]) => log("info", msg, ...args),
  warn: (msg: string, ...args: unknown[]) => log("warn", msg, ...args),
  error: (msg: string, ...args: unknown[]) => log("error", msg, ...args),
  debug: (msg: string, ...args: unknown[]) => log("debug", msg, ...args),
  success: (msg: string, ...args: unknown[]) => log("success", msg, ...args),
};
