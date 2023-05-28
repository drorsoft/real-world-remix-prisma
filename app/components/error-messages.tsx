export function ErrorMessages({
  errors,
}: {
  errors?: Record<string, string[]>
}) {
  return errors ? (
    <ul className="error-messages">
      {Object.entries(errors).map(([key, messages]) => (
        <li key={key}>
          {key} {Array.isArray(messages) ? messages[0] : messages}
        </li>
      ))}
    </ul>
  ) : null
}
