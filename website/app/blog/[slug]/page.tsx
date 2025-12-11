import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { posts } from "#site/content"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MDXContent } from "@/components/mdx-content"
import { formatDate } from "@/lib/blog-utils"
import { ArrowLeft, Clock } from "lucide-react"

interface BlogPostPageProps {
  params: Promise<{ slug: string }>
}

function getPostBySlug(slug: string) {
  return posts.find((post) => post.slug === slug)
}

export async function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  
  if (!post) {
    return { title: "Post Not Found" }
  }

  const siteUrl = "https://revenueboost.app"
  
  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.description,
    openGraph: {
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.description,
      type: "article",
      url: `${siteUrl}${post.permalink}`,
      publishedTime: post.date,
      images: post.image ? [{ url: post.image, alt: post.imageAlt || post.title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.description,
      images: post.image ? [post.image] : undefined,
    },
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params
  const post = getPostBySlug(slug)

  if (!post || !post.published) {
    notFound()
  }

  return (
    <>
      <Header />
      <main className="min-h-screen">
        <article className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              {/* Back link */}
              <Link 
                href="/blog" 
                className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Blog
              </Link>

              {/* Header */}
              <header className="mb-8">
                <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <Badge variant="secondary" className="capitalize">
                    {post.category}
                  </Badge>
                  <time dateTime={post.date}>{formatDate(post.date)}</time>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {post.readingTime} min read
                  </span>
                </div>
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
                  {post.title}
                </h1>
                <p className="mt-4 text-xl text-muted-foreground">
                  {post.description}
                </p>
              </header>

              {/* Featured Image */}
              {post.image && (
                <div className="relative mb-10 aspect-video overflow-hidden rounded-xl">
                  <Image
                    src={post.image}
                    alt={post.imageAlt || post.title}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              )}

              {/* Content */}
              <div className="prose prose-neutral dark:prose-invert max-w-none">
                <MDXContent code={post.body} />
              </div>

              {/* Tags */}
              {post.tags.length > 0 && (
                <div className="mt-10 border-t pt-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-muted-foreground">Tags:</span>
                    {post.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA */}
              <div className="mt-12 rounded-xl bg-muted p-8 text-center">
                <h2 className="text-2xl font-bold">Ready to boost your conversions?</h2>
                <p className="mt-2 text-muted-foreground">
                  Get started with Revenue Boost in 60 seconds.
                </p>
                <Button size="lg" className="mt-6" asChild>
                  <a href="https://apps.shopify.com/revenue-boost" target="_blank" rel="noopener noreferrer">
                    Install on Shopify - Free
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </>
  )
}

