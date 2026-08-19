export type AzoyIsRuntimeEnv = {
  ADMIN_SESSION_SECRET?: string;
  ADMIN_SETUP_EMAIL?: string;
  ADMIN_SETUP_KEY?: string;
  CONTACT_TO_EMAIL?: string;
  POSTGRES_URL?: string;
};

export function getRuntimeEnv(): AzoyIsRuntimeEnv {
  return {
    ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET,
    ADMIN_SETUP_EMAIL: process.env.ADMIN_SETUP_EMAIL,
    ADMIN_SETUP_KEY: process.env.ADMIN_SETUP_KEY,
    CONTACT_TO_EMAIL: process.env.CONTACT_TO_EMAIL,
    POSTGRES_URL: process.env.POSTGRES_URL,
  };
}
