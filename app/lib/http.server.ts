import { ValidationError } from '~/lib/validation.server'
import { AuthenticationError } from './auth.server'
import { serverError, unauthorized, unprocessableEntity } from 'remix-utils'
import type { ResponseInit, TypedResponse } from '@remix-run/node'
import { redirect } from '@remix-run/node'

export interface ExceptionHandlerResponseBody {
  errors: Record<string, string[] | undefined>
  message?: string
}

export function handleExceptions(
  error: unknown
): TypedResponse<ExceptionHandlerResponseBody> {
  if (error instanceof ValidationError) {
    return unprocessableEntity({
      errors: error.errors,
    })
  }

  if (error instanceof AuthenticationError) {
    return unauthorized({ errors: error.errors })
  }

  return serverError({
    message: 'Something went wrong',
    errors: {},
  })
}

export function redirectHome(init?: ResponseInit) {
  return redirect('/', init)
}

export function redirectToLogin(init?: ResponseInit) {
  return redirect('/login', init)
}
