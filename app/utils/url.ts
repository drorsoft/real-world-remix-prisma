export const DEFAULT_PAGE_LENGTH = 10

export function paginate(request: Request) {
  const url = new URL(request.url)

  const page = url.searchParams.get('page') || '1'

  return { page }
}
