import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getTranslations, setRequestLocale } from 'next-intl/server'

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('AuthError')
  const sp = await searchParams

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{t('title')}</CardTitle>
            </CardHeader>
            <CardContent>
              {sp?.error ? (
                <p className="text-sm text-muted-foreground">
                  {t('codeError', { error: sp.error })}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">{t('unspecified')}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
