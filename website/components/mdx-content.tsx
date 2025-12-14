"use client"

import * as runtime from "react/jsx-runtime"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

// Custom MDX components for consistent styling
const mdxComponents = {
  // Override default HTML elements
  h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className="mt-10 scroll-m-20 text-3xl font-bold tracking-tight" {...props} />
  ),
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className="mt-10 scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight first:mt-0" {...props} />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="mt-8 scroll-m-20 text-xl font-semibold tracking-tight" {...props} />
  ),
  h4: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h4 className="mt-6 scroll-m-20 text-lg font-semibold tracking-tight" {...props} />
  ),
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="leading-7 [&:not(:first-child)]:mt-6" {...props} />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="my-6 ml-6 list-disc [&>li]:mt-2" {...props} />
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="my-6 ml-6 list-decimal [&>li]:mt-2" {...props} />
  ),
  li: (props: React.HTMLAttributes<HTMLLIElement>) => (
    <li className="leading-7" {...props} />
  ),
  blockquote: (props: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote className="mt-6 border-l-4 border-primary pl-6 italic" {...props} />
  ),
  hr: () => <hr className="my-8 border-border" />,
  a: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    const isInternal = href?.startsWith("/") || href?.startsWith("#")
    if (isInternal) {
      return (
        <Link href={href || "#"} className="font-medium text-primary underline underline-offset-4" {...props}>
          {children}
        </Link>
      )
    }
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-primary underline underline-offset-4"
        {...props}
      >
        {children}
      </a>
    )
  },
  code: (props: React.HTMLAttributes<HTMLElement>) => (
    <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm" {...props} />
  ),
  pre: (props: React.HTMLAttributes<HTMLPreElement>) => (
    <pre className="mt-6 overflow-x-auto rounded-lg bg-muted p-4 font-mono text-sm" {...props} />
  ),
  table: (props: React.TableHTMLAttributes<HTMLTableElement>) => (
    <div className="my-6 w-full overflow-y-auto">
      <table className="w-full" {...props} />
    </div>
  ),
  th: (props: React.ThHTMLAttributes<HTMLTableCellElement>) => (
    <th className="border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right" {...props} />
  ),
  td: (props: React.TdHTMLAttributes<HTMLTableCellElement>) => (
    <td className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right" {...props} />
  ),
  strong: (props: React.HTMLAttributes<HTMLElement>) => (
    <strong className="font-semibold" {...props} />
  ),
  // Custom components available in MDX
  Image,
  Button,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
}

// Compile MDX at runtime
function useMDXComponent(code: string) {
  const fn = new Function(code)
  return fn({ ...runtime }).default
}

interface MDXContentProps {
  code: string
}

export function MDXContent({ code }: MDXContentProps) {
  const Component = useMDXComponent(code)
  return <Component components={mdxComponents} />
}

