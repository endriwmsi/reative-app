"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { z } from "zod";
import type { loginSchema } from "@/app/(app)/(auth)/_schemas/login-schema";
import { auth, type ErrorCode } from "@/auth";

type formData = z.infer<typeof loginSchema>;

export async function signInEmailAction(data: formData) {
  const email = String(data.email);
  if (!email) return { error: "Insira um e-mail válido" };

  const password = String(data.password);
  if (!password) return { error: "Insira uma senha válida" };

  try {
    const response = await auth.api.signInEmail({
      headers: await headers(),
      body: {
        email: data.email,
        password: data.password,
      },
      asResponse: true,
    });

    if (!response.ok) {
      return { error: "E-mail ou senha inválidos." };
    }

    return { error: null };
  } catch (error) {
    if (error instanceof APIError) {
      const errorCode = error.body ? (error.body.code as ErrorCode) : "UNKNOWN";
      console.log(errorCode);

      switch (errorCode) {
        case "EMAIL_NOT_VERIFIED":
          redirect("/verify?error=email_not_verified");
          break;
        default:
          return { error: error.message };
      }
    }

    return { error: "Erro de servidor Interno.", log: console.log(error) };
  }
}
