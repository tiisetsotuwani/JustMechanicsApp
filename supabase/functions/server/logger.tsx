export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export const log = (
  level: LogLevel,
  message: string,
  context: Record<string, unknown> = {},
) => {
  console.log(
    JSON.stringify({
      level,
      message,
      timestamp: new Date().toISOString(),
      ...context,
    }),
  );
};
