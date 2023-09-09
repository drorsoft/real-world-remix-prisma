import { badRequest, unprocessableEntity } from 'remix-utils'
import { z } from 'zod'

export async function handleExceptions(error: unknown) {
  if (error instanceof z.ZodError) {
    return unprocessableEntity({ errors: error.flatten().fieldErrors })
  }

  if (error instanceof Response) {
    return error
  }

  return badRequest({ errors: {} })
}
