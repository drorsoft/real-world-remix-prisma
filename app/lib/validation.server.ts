import type { ZodObject, ZodRawShape } from 'zod'
import { z } from 'zod'

export class ValidationError extends Error {
  constructor(
    public errors: Record<string, string[] | undefined>,
    public message: string = ''
  ) {
    super(message)
  }
}

export async function validate<T extends ZodRawShape>(
  payload: unknown,
  schema: ZodObject<T>
) {
  try {
    return await schema.parseAsync(payload)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(error.flatten().fieldErrors)
    }

    throw new ValidationError({}, 'Validation failed')
  }
}

export const nonEmptyStringSchema = z
  .string()
  .min(1, { message: "can't be blank" })

export const userEmailSchema = nonEmptyStringSchema.email()

export const userNameSchema = nonEmptyStringSchema.min(2, {
  message: "can't be less than 2 chars",
})

export const userPasswordSchema = z
  .string()
  .min(6, { message: "can't be less than 6 chars" })
  .max(20, { message: "can't be more than 20 chars" })
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{6,}$/, {
    message:
      'must contain at least one lower case, one capital case, one number and one symbol',
  })
