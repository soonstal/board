import type { ComputedRef } from 'vue'
import { api } from 'src/services'
import type { Article } from 'src/services/api'
import useAsync from 'src/utils/use-async'

interface useFavoriteArticleProps {
  isFavorited: ComputedRef<boolean>
  articleSlug: ComputedRef<string>
  onUpdate: (newArticle: Article) => void
}

export function useFavoriteArticle({ isFavorited, articleSlug, onUpdate }: useFavoriteArticleProps) {
  let favoriteArticle = async () => {
    let requestor = isFavorited.value ? api.articles.deleteArticleFavorite : api.articles.createArticleFavorite
    let article = await requestor(articleSlug.value).then(res => res.data.article)
    onUpdate(article)
  }

  let { active, run } = useAsync(favoriteArticle)

  return {
    favoriteProcessGoing: active,
    favoriteArticle: run,
  }
}
