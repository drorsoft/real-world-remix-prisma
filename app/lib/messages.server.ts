import type { SessionFlashData } from './session.server'
import { commitSession, getSession } from './session.server'

export async function getMessages(request: Request) {
  const session = await getSession(request)

  const successMessage = session.get('success')
  const errorMessage = session.get('error')

  await commitSession(session)

  if (!successMessage && !successMessage) return null

  return { error: errorMessage, success: successMessage }
}

export async function addMessage(
  request: Request,
  messageType: keyof SessionFlashData,
  message: string
) {
  const session = await getSession(request)

  session.flash(messageType, message)

  await commitSession(session)
}
