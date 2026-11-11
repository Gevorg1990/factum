import { z } from 'zod'
export const registrationSchema = z.object({
  email: z.string().trim().email('Էլ․ հասցեի ձևաչափը սխալ է').max(254).transform(value => value.toLowerCase()),
  name: z.string().trim().min(2, 'Անունը պետք է պարունակի առնվազն 2 նիշ').max(100),
  password: z.string().min(12, 'Գաղտնաբառը պետք է պարունակի առնվազն 12 նիշ').max(128),
  passwordConfirmation: z.string().min(1, 'Կրկնիր գաղտնաբառը'),
}).refine(value => value.password === value.passwordConfirmation, { path: ['passwordConfirmation'], message: 'Գաղտնաբառերը չեն համընկնում' })
