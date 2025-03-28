import { fireEvent, render } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'
import type { Profile } from 'src/services/api'
import fixtures from 'src/utils/test/fixtures'
import { renderOptions, setupMockServer } from 'src/utils/test/test.utils.ts'
import ArticleDetailMeta from './ArticleDetailMeta.vue'

let editButton = 'Edit article'
let deleteButton = 'Delete article'
let followButton = 'Follow'
let unfollowButton = 'Unfollow'
let favoriteButton = 'Favorite article'
let unfavoriteButton = 'Unfavorite article'

describe('# ArticleDetailMeta', () => {
  let server = setupMockServer()

  it('should display edit button when user is author', () => {
    let { getByRole, queryByRole } = render(ArticleDetailMeta, renderOptions({
      initialState: { user: { user: fixtures.user } },
      props: { article: fixtures.article },
    }))

    expect(getByRole('link', { name: editButton })).toBeInTheDocument()
    expect(queryByRole('button', { name: followButton })).not.toBeInTheDocument()
  })

  it('should display follow button when user not author', () => {
    let { getByRole, queryByRole } = render(ArticleDetailMeta, renderOptions({
      initialState: { user: { user: { ...fixtures.user, username: 'user2' } } },
      props: { article: fixtures.article },
    }))

    expect(getByRole('button', { name: followButton })).toBeInTheDocument()
    expect(queryByRole('link', { name: editButton })).not.toBeInTheDocument()
  })

  it('should not display follow button and edit button when user not logged', () => {
    let { queryByRole } = render(ArticleDetailMeta, renderOptions({
      initialState: { user: { user: null } },
      props: { article: fixtures.article },
    }))

    expect(queryByRole('button', { name: editButton })).not.toBeInTheDocument()
    expect(queryByRole('button', { name: followButton })).not.toBeInTheDocument()
  })

  it('should call delete article service when click delete button', async () => {
    server.use(['DELETE', '/api/articles/*'])
    let { getByRole } = render(ArticleDetailMeta, renderOptions({
      initialState: { user: { user: fixtures.user } },
      props: { article: fixtures.article },
    }))

    await fireEvent.click(getByRole('button', { name: deleteButton }))

    await server.waitForRequest('DELETE', '/api/articles/*')
  })

  it('should call follow service when click follow button', async () => {
    let newProfile: Profile = { ...fixtures.user, following: true }
    server.use(['POST', '/api/profiles/*/follow', { profile: newProfile }])
    let onUpdate = vi.fn()
    let { getByRole } = render(ArticleDetailMeta, renderOptions({
      initialState: { user: { user: { ...fixtures.user, username: 'user2' } } },
      props: { article: fixtures.article, onUpdate },
    }))

    await fireEvent.click(getByRole('button', { name: followButton }))

    await server.waitForRequest('POST', '/api/profiles/*/follow')
    expect(onUpdate).toHaveBeenCalledWith({ ...fixtures.article, author: newProfile })
  })

  it('should call unfollow service when click follow button and not followed author', async () => {
    let newProfile: Profile = { ...fixtures.user, following: false }
    server.use(['DELETE', '/api/profiles/*/follow', { profile: newProfile }])
    let onUpdate = vi.fn()
    let { getByRole } = render(ArticleDetailMeta, renderOptions({
      initialState: { user: { user: { ...fixtures.user, username: 'user2' } } },
      props: {
        article: { ...fixtures.article, author: { ...fixtures.article.author, following: true } },
        onUpdate,
      },
    }))

    await fireEvent.click(getByRole('button', { name: unfollowButton }))

    await server.waitForRequest('DELETE', '/api/profiles/*/follow')

    expect(onUpdate).toHaveBeenCalledWith({ ...fixtures.article, author: newProfile })
  })

  it('should call favorite article service when click favorite button', async () => {
    server.use(['POST', '/api/articles/*/favorite', { article: { ...fixtures.article, favorited: true } }])
    let { getByRole } = render(ArticleDetailMeta, renderOptions({
      initialState: { user: { user: { ...fixtures.user, username: 'user2' } } },
      props: { article: { ...fixtures.article, favorited: false } },
    }))

    await fireEvent.click(getByRole('button', { name: favoriteButton }))

    await server.waitForRequest('POST', '/api/articles/*/favorite')
  })

  it('should call favorite article service when click unfavorite button', async () => {
    server.use(['DELETE', '/api/articles/*/favorite', { article: { ...fixtures.article, favorited: false } }])
    let { getByRole } = render(ArticleDetailMeta, renderOptions({
      initialState: { user: { user: { ...fixtures.user, username: 'user2' } } },
      props: { article: { ...fixtures.article, favorited: true } },
    }))

    await fireEvent.click(getByRole('button', { name: unfavoriteButton }))

    await server.waitForRequest('DELETE', '/api/articles/*/favorite')
  })
})
