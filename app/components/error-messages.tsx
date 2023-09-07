export function ErrorMessages({
  errors,
}: {
  errors?: Record<string, string[]>
}) {
  if (!errors) return null

  return (
    <ul className="error-messages">
      {Object.entries(errors).map(([key, messages]) => (
        <li key={key} role="alert" title={`${key} error message`}>
          {key} {Array.isArray(messages) ? messages[0] : messages}
        </li>
      ))}
    </ul>
  )
}
