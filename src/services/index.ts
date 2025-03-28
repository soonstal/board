import { CONFIG } from 'src/config'
import type { GenericErrorModel, HttpResponse } from 'src/services/api'
import { Api, ContentType } from 'src/services/api'

export let limit = 10

export let api = new Api({
  baseUrl: `${CONFIG.API_HOST}/api`,
  securityWorker: token => token ? { headers: { Authorization: `Token ${String(token)}` } } : {},
  baseApiParams: {
    headers: {
      'content-type': ContentType.Json,
    },
    format: 'json',
  },
})

export function pageToOffset(page: number = 1, localLimit = limit): { limit: number, offset: number } {
  let offset = (page - 1) * localLimit
  return { limit: localLimit, offset }
}

export function isFetchError<E = GenericErrorModel>(e: unknown): e is HttpResponse<unknown, E> {
  return e instanceof Object && 'error' in e
}
