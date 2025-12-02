declare module "better-auth/types" {
  interface User {
    isAdmin?: boolean;
    role?: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string;
      emailVerified: boolean;
      cpf: string;
      cnpj: string;
      phone: string;
      street: string;
      number: string;
      complement: string;
      neighborhood: string;
      city: string;
      uf: string;
      cep: string;
      referralCode: string;
      referredBy?: string;
      isAdmin: boolean;
      role?: string;
    };
  }
}
