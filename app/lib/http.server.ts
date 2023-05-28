import { ValidationError } from '~/lib/validation.server'
import { AuthenticationError } from './auth.server'
import { serverError, unauthorized, unprocessableEntity } from 'remix-utils'
import { json } from '@remix-run/node'

export function actionFailed(error: unknown) {
  if (error instanceof ValidationError) {
    return unprocessableEntity(
      new ActionResponseBody({ errors: error.errors, success: false })
    )
  }

  if (error instanceof AuthenticationError) {
    return unauthorized(
      new ActionResponseBody({ errors: error.errors, success: false })
    )
  }

  return serverError(
    new ActionResponseBody({
      message: 'Something went wrong',
      success: false,
    })
  )
}

export function actionSucceeded(data?: unknown) {
  return json(
    new ActionResponseBody({
      success: true,
      data,
    })
  )
}

class ActionResponseBody {
  public errors
  public message
  public success
  public data

  constructor({
    message = '',
    success = true,
    errors = {},
    data = {},
  }: {
    errors?: Record<string, string[] | undefined>
    message?: string
    success?: boolean
    data?: unknown
  }) {
    this.errors = errors
    this.message = message
    this.success = success
    this.data = data
  }
}
