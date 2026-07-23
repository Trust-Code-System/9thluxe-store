import { prisma } from "@/lib/prisma"
import { EMAIL_TEMPLATE_CATALOGUE } from "@/lib/email-templates/service"
import { EmailTemplateManager } from "@/components/admin/email-template-manager"
export const dynamic = "force-dynamic"
export default async function EmailTemplatesPage() { let templates: Awaited<ReturnType<typeof prisma.emailTemplate.findMany>> = []; try { templates = await prisma.emailTemplate.findMany() } catch {} return <div className="space-y-6"><div><h1 className="font-serif text-2xl font-semibold">Transactional email templates</h1><p className="text-muted-foreground">Safe plain-text overrides with a fixed variable allowlist. Disabled templates use the built-in design.</p></div><EmailTemplateManager catalogue={[...EMAIL_TEMPLATE_CATALOGUE]} templates={templates} /></div> }
