export function paginate(request: Request) {
  const url = new URL(request.url)

  const page = url.searchParams.get('page') || '1'

  return { page }
}
