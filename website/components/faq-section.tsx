import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const faqs = [
  {
    question: "How long does it take to set up Revenue Boost?",
    answer:
      "You can get started in under 5 minutes! Simply install the app from the Shopify App Store, choose a template, customize it to match your brand, and you're ready to go. No coding required.",
  },
  {
    question: "Will popups slow down my website?",
    answer:
      "Absolutely not. Revenue Boost is built with performance in mind. Our lightweight scripts load asynchronously and won't affect your page load times or SEO rankings.",
  },
  {
    question: "Can I customize the design to match my brand?",
    answer:
      "Yes! Every template is fully customizable. You can change colors, fonts, images, text, timing, and animations. You can also use custom CSS on our Pro plan for complete control.",
  },
  {
    question: "Do you offer a free trial?",
    answer:
      "Yes, we offer a generous free plan with up to 1,000 popup views per month. This lets you test all core features before upgrading. Paid plans also include a 14-day free trial.",
  },
  {
    question: "Is Revenue Boost GDPR compliant?",
    answer:
      "Yes, Revenue Boost is fully GDPR compliant. We don't store any customer data on our servers, and all data collection is handled through your Shopify store. We also provide consent collection features.",
  },
  {
    question: "What kind of support do you offer?",
    answer:
      "All plans include email support with a 24-hour response time. Growth and Pro plans get priority support with faster response times. Pro plan customers also get a dedicated account manager.",
  },
  {
    question: "Can I use Revenue Boost with my existing email marketing tools?",
    answer:
      "Yes! Revenue Boost works seamlessly with Klaviyo, Mailchimp, Omnisend, ActiveCampaign, and any email platform that syncs with Shopify customers. When someone signs up through your popup, they're added as a Shopify customer with marketing consent and campaign tags — your email platform picks them up automatically. No API keys or extra setup required.",
  },
]

export function FaqSection() {
  return (
    <section id="faq" className="px-4 py-20 md:py-32">
      <div className="container mx-auto">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">Frequently Asked Questions</h2>
          <p className="text-lg text-muted-foreground">Got questions? We've got answers.</p>
        </div>

        <div className="mx-auto max-w-3xl">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left text-foreground hover:text-primary">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}
