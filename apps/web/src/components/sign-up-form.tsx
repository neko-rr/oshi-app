'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { useEffect, useState } from 'react'

import { cn } from '@/lib/utils'
import { createClient } from '@/lib/client'
import { isAnonymousUser } from '@/lib/authGuest'
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
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton'
import { AuthTurnstile } from '@/components/auth/AuthTurnstile'
import {
  authCaptchaBlockReason,
  readTurnstileSiteKey,
  resolveCaptchaToken,
} from '@/lib/authCaptcha'

export function SignUpForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const t = useTranslations('SignUp')
  const tOauth = useTranslations('AuthOAuth')
  const tCommon = useTranslations('Common')
  const tCaptcha = useTranslations('AuthCaptcha')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [captchaRemount, setCaptchaRemount] = useState(0)
  const router = useRouter()

  function clearCaptcha() {
    setCaptchaToken(null)
    setCaptchaRemount((n) => n + 1)
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const supabase = createClient()
      const { data } = await supabase.auth.getSession()
      if (cancelled) return
      if (data.session && isAnonymousUser(data.session.user)) {
        router.replace('/auth/upgrade')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [router])

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== repeatPassword) {
      setError(t('passwordMismatch'))
      setIsLoading(false)
      return
    }

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

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
          captchaToken: token,
        },
      })
      if (error) throw error
      clearCaptcha()
      router.push('/auth/sign-up-success')
    } catch (err: unknown) {
      clearCaptcha()
      setError(err instanceof Error ? err.message : tCommon('genericError'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <GoogleSignInButton next="/" />
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            {tOauth('or')}
            <span className="h-px flex-1 bg-border" />
          </div>
          <form onSubmit={handleSignUp}>
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
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">{t('password')}</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="repeat-password">{t('repeatPassword')}</Label>
                </div>
                <Input
                  id="repeat-password"
                  type="password"
                  required
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                />
              </div>
              <AuthTurnstile
                action="signup"
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
                {isLoading ? t('submitting') : t('submit')}
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
    </div>
  )
}
