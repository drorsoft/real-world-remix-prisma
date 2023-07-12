import { useNavigation, useSubmit } from '@remix-run/react'
import React from 'react'

export function useForm(
  formRef: React.RefObject<HTMLFormElement>,
  options: { resetOnSubmit?: boolean; submitOnEnter?: boolean } = {}
) {
  const navigation = useNavigation()
  const submit = useSubmit()

  React.useEffect(() => {
    if (
      options.resetOnSubmit &&
      navigation.state === 'submitting' &&
      formRef.current
    ) {
      formRef.current.reset()
    }
  }, [formRef, navigation.state, options.resetOnSubmit])

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        submit(formRef.current)
      }
    },
    [formRef, submit]
  )

  React.useEffect(() => {
    if (!options.submitOnEnter) return

    const form = formRef.current

    form?.addEventListener('keydown', handleKeyDown)

    return () => form?.removeEventListener('keydown', handleKeyDown)
  }, [formRef, handleKeyDown, options.submitOnEnter])

  const isPending =
    navigation.state === 'submitting' ||
    (navigation.formMethod === 'POST' && navigation.state === 'loading')

  return { isPending }
}
