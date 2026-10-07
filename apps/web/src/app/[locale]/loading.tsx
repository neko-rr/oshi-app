import { RouteLoadingFallback } from "@/components/feedback/RouteLoadingFallback";

/**
 * ロケール配下の即時ローディング境界。
 * layout（AppChrome）は維持し、page 待ち中だけシルエットを出す。
 */
export default function LocaleLoading() {
  return <RouteLoadingFallback />;
}
