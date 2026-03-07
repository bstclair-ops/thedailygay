'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import type { PostWithRelations, CategoryWithCount } from '@/lib/types'

const POST_INCLUDE = {
  author: { select: { id: true, name: true, image: true } },
  category: { select: { id: true, name: true, slug: true } },
  tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
} as const

export async function getPublishedPosts(options?: {
  limit?: number
  categorySlug?: string
}): Promise<PostWithRelations[]> {
  try {
    return await prisma.post.findMany({
      where: {
        published: true,
        ...(options?.categorySlug ? { category: { slug: options.categorySlug } } : {}),
      },
      include: POST_INCLUDE,
      orderBy: { publishedAt: 'desc' },
      take: options?.limit,
    }) as PostWithRelations[]
  } catch {
    return []
  }
}

export async function getFeaturedPosts(limit = 6): Promise<PostWithRelations[]> {
  return getPublishedPosts({ limit })
}

export async function getPostBySlug(slug: string): Promise<PostWithRelations | null> {
  try {
    return await prisma.post.findUnique({
      where: { slug, published: true },
      include: POST_INCLUDE,
    }) as PostWithRelations | null
  } catch {
    return null
  }
}

export async function getAllPosts(): Promise<PostWithRelations[]> {
  try {
    return await prisma.post.findMany({
      include: POST_INCLUDE,
      orderBy: { createdAt: 'desc' },
    }) as PostWithRelations[]
  } catch {
    return []
  }
}

export async function getCategories(): Promise<CategoryWithCount[]> {
  try {
    return await prisma.category.findMany({
      include: { _count: { select: { posts: { where: { published: true } } } } },
      orderBy: { name: 'asc' },
    }) as CategoryWithCount[]
  } catch {
    return []
  }
}

export async function createPost(data: {
  title: string
  slug: string
  excerpt?: string
  content: any
  heroImage?: string
  categoryId: string
  tagIds?: string[]
  authorId: string
  published?: boolean
}): Promise<{ id: string; slug: string }> {
  try {
    const { tagIds, published, ...rest } = data
    const post = await prisma.post.create({
      data: {
        ...rest,
        published: published ?? false,
        publishedAt: published ? new Date() : null,
        tags: tagIds?.length
          ? { create: tagIds.map((tagId) => ({ tagId })) }
          : undefined,
      },
    })
    revalidatePath('/')
    return { id: post.id, slug: post.slug }
  } catch (err) {
    throw new Error(
      err instanceof Error ? err.message : 'Failed to create post'
    )
  }
}

export async function updatePost(
  id: string,
  data: {
    title?: string
    slug?: string
    excerpt?: string
    content?: any
    heroImage?: string
    categoryId?: string
    tagIds?: string[]
    published?: boolean
  }
): Promise<void> {
  try {
    const { tagIds, published, ...rest } = data
    // Resolve publish state change
    const publishData: Record<string, any> = {}
    if (published !== undefined) {
      const current = await prisma.post.findUnique({ where: { id }, select: { published: true } })
      publishData.published = published
      if (published && !current?.published) {
        publishData.publishedAt = new Date()
      } else if (!published) {
        publishData.publishedAt = null
      }
    }

    await prisma.post.update({
      where: { id },
      data: {
        ...rest,
        ...publishData,
        ...(tagIds !== undefined
          ? {
              tags: {
                deleteMany: {},
                create: tagIds.map((tagId) => ({ tagId })),
              },
            }
          : {}),
      },
    })
    const post = await prisma.post.findUnique({ where: { id }, select: { slug: true } })
    if (post) revalidatePath(`/article/${post.slug}`)
    revalidatePath('/')
    revalidatePath('/admin/articles')
  } catch (err) {
    throw new Error(
      err instanceof Error ? err.message : 'Failed to update post'
    )
  }
}

export async function deletePost(id: string): Promise<void> {
  try {
    await prisma.post.delete({ where: { id } })
    revalidatePath('/')
    revalidatePath('/admin/articles')
  } catch (err) {
    throw new Error(
      err instanceof Error ? err.message : 'Failed to delete post'
    )
  }
}

export async function togglePublish(id: string): Promise<void> {
  try {
    const post = await prisma.post.findUnique({ where: { id }, select: { published: true, slug: true } })
    if (!post) return
    await prisma.post.update({
      where: { id },
      data: {
        published: !post.published,
        publishedAt: !post.published ? new Date() : null,
      },
    })
    revalidatePath(`/article/${post.slug}`)
    revalidatePath('/')
    revalidatePath('/admin/articles')
  } catch (err) {
    throw new Error(
      err instanceof Error ? err.message : 'Failed to toggle publish state'
    )
  }
}

export async function getTags() {
  try {
    return await prisma.tag.findMany({ orderBy: { name: 'asc' } })
  } catch {
    return []
  }
}
