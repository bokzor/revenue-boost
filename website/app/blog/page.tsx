import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { posts } from "#site/content"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { formatDate } from "@/lib/blog-utils"

export const metadata: Metadata = {
  title: "Blog",
  description: "Tips, guides, and strategies for boosting your Shopify store conversions with popups and notifications.",
}

export default function BlogPage() {
  const publishedPosts = posts
    .filter((post) => post.published)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <>
      <Header />
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="border-b bg-muted/30 py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
                Blog
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Tips, guides, and strategies for boosting your Shopify store conversions.
              </p>
            </div>
          </div>
        </section>

        {/* Posts Grid */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            {publishedPosts.length === 0 ? (
              <p className="text-center text-muted-foreground">No posts yet. Check back soon!</p>
            ) : (
              <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2 lg:grid-cols-3">
                {publishedPosts.map((post) => (
                  <Link key={post.slug} href={post.permalink}>
                    <Card className="h-full transition-shadow hover:shadow-md">
                      {post.image && (
                        <div className="relative aspect-video overflow-hidden rounded-t-xl">
                          <Image
                            src={post.image.src}
                            alt={post.imageAlt || post.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="secondary" className="capitalize">
                            {post.category}
                          </Badge>
                          <span>·</span>
                          <time dateTime={post.date}>{formatDate(post.date)}</time>
                        </div>
                        <CardTitle className="line-clamp-2 text-lg">
                          {post.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <CardDescription className="line-clamp-3">
                          {post.description}
                        </CardDescription>
                        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{post.readingTime} min read</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

