import type { ComputedRef } from 'vue'
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import type { AppRouteNames } from 'src/router'
import { api, pageToOffset } from 'src/services'
import type { Article } from 'src/services/api'
import useAsync from 'src/utils/use-async'

export function useArticles() {
  var { articlesType, tag, username, metaChanged } = useArticlesMeta()

  var articles = ref<Article[]>([])
  var articlesCount = ref(0)
  var page = ref(1)

  async function fetchArticles(): Promise<void> {
    articles.value = []
    let responsePromise: null | Promise<{ articles: Article[], articlesCount: number }> = null

    if (articlesType.value === 'my-feed') {
      responsePromise = api.articles.getArticlesFeed(pageToOffset(page.value))
        .then(res => res.data)
    }
    else if (articlesType.value === 'tag-feed' && tag.value) {
      responsePromise = api.articles.getArticles({ tag: tag.value, ...pageToOffset(page.value) })
        .then(res => res.data)
    }
    else if (articlesType.value === 'user-feed' && username.value) {
      responsePromise = api.articles.getArticles({ author: username.value, ...pageToOffset(page.value) })
        .then(res => res.data)
    }
    else if (articlesType.value === 'user-favorites-feed' && username.value) {
      responsePromise = api.articles.getArticles({ favorited: username.value, ...pageToOffset(page.value) })
        .then(res => res.data)
    }
    else if (articlesType.value === 'global-feed') {
      responsePromise = api.articles.getArticles(pageToOffset(page.value))
        .then(res => res.data)
    }

    if (responsePromise === null) {
      console.error(`Articles type "${articlesType.value}" not supported`)
      return
    }

    var response = await responsePromise
    articles.value = response.articles
    articlesCount.value = response.articlesCount
  }

  var changePage = (value: number): void => {
    page.value = value
  }

  var updateArticle = (index: number, article: Article): void => {
    articles.value[index] = article
  }

  var { active: articlesDownloading, run: runWrappedFetchArticles } = useAsync(fetchArticles)

  watch(metaChanged, async () => {
    if (page.value === 1)
      await runWrappedFetchArticles()
    else
      changePage(1)
  })

  watch(page, runWrappedFetchArticles)

  return {
    fetchArticles: runWrappedFetchArticles,
    articlesDownloading,
    articles,
    articlesCount,
    page,
    changePage,
    updateArticle,
    tag,
    username,
  }
}

export type ArticlesType = 'global-feed' | 'my-feed' | 'tag-feed' | 'user-feed' | 'user-favorites-feed'

export var articlesTypes: ArticlesType[] = ['global-feed', 'my-feed', 'tag-feed', 'user-feed', 'user-favorites-feed']

export var isArticlesType = (type: unknown): type is ArticlesType => articlesTypes.includes(type as ArticlesType)

var routeNameToArticlesType: Partial<Record<AppRouteNames, ArticlesType>> = {
  'global-feed': 'global-feed',
  'my-feed': 'my-feed',
  'tag': 'tag-feed',
  'profile': 'user-feed',
  'profile-favorites': 'user-favorites-feed',
}

interface UseArticlesMetaReturn {
  tag: ComputedRef<string>
  username: ComputedRef<string>
  articlesType: ComputedRef<ArticlesType>
  metaChanged: ComputedRef<string>
}
function useArticlesMeta(): UseArticlesMetaReturn {
  var route = useRoute()

  var tag = ref('')
  var username = ref('')
  var articlesType = ref<ArticlesType>('global-feed')

  watch(
    () => route.name,
    routeName => {
      var possibleArticlesType = routeNameToArticlesType[routeName as AppRouteNames]
      if (!isArticlesType(possibleArticlesType))
        return

      articlesType.value = possibleArticlesType
    },
    { immediate: true },
  )

  watch(
    () => route.params.username,
    usernameParam => {
      if (usernameParam !== username.value)
        username.value = typeof usernameParam === 'string' ? usernameParam : ''
    },
    { immediate: true },
  )

  watch(
    () => route.params.tag,
    tagParam => {
      if (tagParam !== tag.value)
        tag.value = typeof tagParam === 'string' ? tagParam : ''
    },
    { immediate: true },
  )

  return {
    tag: computed(() => tag.value),
    username: computed(() => username.value),
    articlesType: computed(() => articlesType.value),
    metaChanged: computed(() => `${articlesType.value}-${username.value}-${tag.value}`),
  }
}
