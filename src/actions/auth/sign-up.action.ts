"use server";

import { APIError } from "better-auth/api";
import { eq, or } from "drizzle-orm";
import type { z } from "zod";
import type { registerSchema } from "@/app/(auth)/_schemas/register-schemas";
import { auth, type ErrorCode } from "@/auth";
import { db } from "@/db/client";
import { user } from "@/db/schema/user";
import {
  cleanCNPJ,
  cleanCPF,
  generateReferralCode,
  isValidCNPJ,
  isValidCPF,
} from "@/lib/utils";

type formData = z.infer<typeof registerSchema> & {
  referredBy?: string | null;
};

export async function signUpEmailAction(data: formData) {
  try {
    const cleanedCPF = cleanCPF(data.cpf);
    const cleanedCNPJ = cleanCNPJ(data.cnpj);

    const isCPFValid = isValidCPF(cleanedCPF);
    const isCNPJValid = isValidCNPJ(cleanedCNPJ);

    if (!isCPFValid) {
      return {
        error: "CPF inválido. Verifique os dígitos informados.",
      };
    }

    if (!isCNPJValid) {
      return {
        error: "CNPJ inválido. Verifique os dígitos informados.",
      };
    }

    const existingUser = await db
      .select({
        id: user.id,
        email: user.email,
        cpf: user.cpf,
        cnpj: user.cnpj,
      })
      .from(user)
      .where(
        or(
          eq(user.email, data.email),
          eq(user.cpf, cleanedCPF),
          eq(user.cnpj, cleanedCNPJ),
        ),
      )
      .limit(1);

    if (existingUser.length > 0) {
      const user = existingUser[0];

      if (user.email === data.email) {
        return { error: "Este e-mail já está sendo usado por outro usuário." };
      }

      if (user.cpf === cleanedCPF) {
        return { error: "Este CPF já está sendo usado por outro usuário." };
      }

      if (user.cnpj === cleanedCNPJ) {
        return { error: "Este CNPJ já está sendo usado por outro usuário." };
      }
    }

    // Gerar código de afiliado único
    let referralCode = generateReferralCode();
    let isUnique = false;

    // Garantir que o código é único
    while (!isUnique) {
      const existingCode = await db
        .select({ referralCode: user.referralCode })
        .from(user)
        .where(eq(user.referralCode, referralCode))
        .limit(1);

      if (existingCode.length === 0) {
        isUnique = true;
      } else {
        referralCode = generateReferralCode();
      }
    }

    // Validar código de indicação se fornecido
    let validReferredBy: string | undefined;
    if (data.referredBy) {
      const referrer = await db
        .select({ referralCode: user.referralCode })
        .from(user)
        .where(eq(user.referralCode, data.referredBy))
        .limit(1);

      if (referrer.length > 0) {
        validReferredBy = data.referredBy;
      }
    }

    await auth.api.signUpEmail({
      body: {
        name: data.fullname,
        email: data.email,
        password: data.password,
        phone: data.phone,
        cpf: cleanedCPF,
        cnpj: cleanedCNPJ,
        street: data.street,
        number: data.number,
        complement: data.complement,
        neighborhood: data.neighborhood,
        city: data.city,
        uf: data.state,
        cep: data.cep,
        referralCode,
        referredBy: validReferredBy,
      },
    });

    return { error: null };
  } catch (error) {
    if (error instanceof APIError) {
      const errorCode = error.body ? (error.body.code as ErrorCode) : "UNKNOWN";

      switch (errorCode) {
        case "USER_ALREADY_EXISTS":
          return { error: "Oops! E-mail já cadastrado" };
        default:
          return { error: error.message };
      }
    }

    console.log(error);

    return { error: "Erro de servidor Interno." };
  }
}
