import { commitSession, getSession } from './session.server'

enum Level {
  ERROR = 'error',
  SUCCESS = 'success',
}

export async function addMessage(
  request: Request,
  level: `${Level}`,
  message: string
) {
  const session = await getSession(request)

  session.flash(level, message)

  await commitSession(session)
}

export async function getMessages(request: Request) {
  const session = await getSession(request)

  const successMessage = session.get('success')
  const errorMessage = session.get('error')

  await commitSession(session)

  return { error: errorMessage, success: successMessage }
}
