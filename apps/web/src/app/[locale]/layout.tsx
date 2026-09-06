import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import AppChrome from "@/components/layout/AppChrome";
import { DocumentLang } from "@/components/layout/DocumentLang";
import { AppPreferencesRoot } from "@/components/layout/AppPreferencesRoot";
import { routing } from "@/i18n/routing";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <DocumentLang locale={locale} />
      <AppPreferencesRoot>
        <AppChrome>{children}</AppChrome>
      </AppPreferencesRoot>
    </NextIntlClientProvider>
  );
}
