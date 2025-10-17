import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { sendEmailAction } from "./actions/auth/send-email.action";
import { db } from "./db/client";
import * as schema from "./db/schema";
import { getValidDomains, normalizeName } from "./lib/utils";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),

  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    requireEmailVerification: true,

    sendResetPassword: async ({ user, url }) => {
      await sendEmailAction({
        to: user.email,
        subject: "Redefinir senha",
        meta: {
          description: "Clique no link abaixo para redefinir sua senha.",
          link: String(url),
        },
      });
    },
  },

  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/sign-up/email") {
        const email = String(ctx.body.email);
        const domain = email.split("@")[1];

        const VALID_DOMAINS = getValidDomains();

        if (!VALID_DOMAINS.includes(domain)) {
          throw new APIError("BAD_REQUEST", {
            message: "Domínio inválido. Por favor, use um domínio válido.",
          });
        }

        const name = normalizeName(ctx.body.name);

        return {
          context: {
            ...ctx,
            body: {
              ...ctx.body,
              name,
            },
          },
        };
      }
    }),
  },

  user: {
    additionalFields: {
      cpf: { type: "string", required: true },
      cnpj: { type: "string", required: true },
      phone: { type: "string", required: true },
      street: { type: "string", required: true },
      number: { type: "string", required: true },
      complement: { type: "string", required: true },
      neighborhood: { type: "string", required: true },
      city: { type: "string", required: true },
      uf: { type: "string", required: true },
      cep: { type: "string", required: true },
      referralCode: { type: "string", required: true },
      referredBy: { type: "string", required: false },
      isAdmin: { type: "boolean", required: false },
    },
  },

  advanced: {
    database: {
      generateId: () => crypto.randomUUID(),
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },

  plugins: [nextCookies()],
});

export type ErrorCode = keyof typeof auth.$ERROR_CODES | "UNKNOWN";
