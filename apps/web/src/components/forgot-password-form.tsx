'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { cn } from '@/lib/utils'
import { createClient } from '@/lib/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Link } from '@/i18n/navigation'
import { AuthTurnstile } from '@/components/auth/AuthTurnstile'
import {
  authCaptchaBlockReason,
  readTurnstileSiteKey,
  resolveCaptchaToken,
} from '@/lib/authCaptcha'

export function ForgotPasswordForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const t = useTranslations('ForgotPassword')
  const tCommon = useTranslations('Common')
  const tCaptcha = useTranslations('AuthCaptcha')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [captchaRemount, setCaptchaRemount] = useState(0)

  function clearCaptcha() {
    setCaptchaToken(null)
    setCaptchaRemount((n) => n + 1)
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const siteKey = readTurnstileSiteKey(
        process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
      )
      const block = authCaptchaBlockReason(siteKey, captchaToken)
      if (block === 'missing_site_key') {
        setError(tCaptcha('missingSiteKey'))
        return
      }
      if (block === 'missing_token') {
        setError(tCaptcha('missingToken'))
        return
      }
      const token = resolveCaptchaToken(captchaToken)
      if (!token) {
        setError(tCaptcha('missingToken'))
        return
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
        captchaToken: token,
      })
      if (error) throw error
      clearCaptcha()
      setSuccess(true)
    } catch (err: unknown) {
      clearCaptcha()
      setError(err instanceof Error ? err.message : tCommon('genericError'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      {success ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{t('successTitle')}</CardTitle>
            <CardDescription>{t('successDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{t('successBody')}</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{t('title')}</CardTitle>
            <CardDescription>{t('description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleForgotPassword}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">{t('email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('emailPlaceholder')}
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <AuthTurnstile
                  action="forgot"
                  remountKey={captchaRemount}
                  onTokenChange={setCaptchaToken}
                  className="flex justify-center"
                />
                {error ? <p className="text-sm text-red-500">{error}</p> : null}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || !captchaToken}
                >
                  {isLoading ? t('sending') : t('submit')}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm">
                {t('haveAccount')}{' '}
                <Link href="/auth/login" className="underline underline-offset-4">
                  {t('login')}
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
