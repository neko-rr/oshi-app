import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
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
        <Header />
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-density-main">
          {children}
        </main>
        <Footer />
      </AppPreferencesRoot>
    </NextIntlClientProvider>
  );
}
