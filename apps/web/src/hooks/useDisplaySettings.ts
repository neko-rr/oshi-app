"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { API_PATHS } from "@oshi/shared";
import { createClient } from "@/lib/client";
import {
  DEFAULT_GALLERY_LAYOUT,
  DEFAULT_LANDING_PAGE,
  DEFAULT_LIST_SORT,
  DEFAULT_REGISTER_START_STEP,
  sanitizeDefaultStorageLocationId,
  sanitizeGalleryCardFields,
  sanitizeGalleryLayout,
  sanitizeGalleryShow,
  sanitizeLandingPage,
  sanitizeListSort,
  sanitizeRegisterStartStep,
  type GalleryLayoutId,
  type LandingPageId,
  type ListSortId,
  type RegisterStartStepId,
} from "@/lib/displayPrefs";
import {
  DEFAULT_CURRENCY_FORMAT_MODE,
  DEFAULT_DATE_FORMAT_MODE,
  DEFAULT_RESIDENCE_REGION,
  sanitizeCurrencyCodeOverride,
  sanitizeCurrencyFormatMode,
  sanitizeDateFormatMode,
  sanitizeResidenceRegion,
  sanitizeTimezoneOverride,
  type CurrencyCodeId,
  type CurrencyFormatModeId,
  type DateFormatModeId,
  type ResidenceRegionId,
  type TimezoneId,
} from "@/lib/residencePrefs";

export type DisplayLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type DisplaySettings = {
  text_scale: DisplayLevel;
  ui_density: DisplayLevel;
  list_sort: ListSortId;
  gallery_layout: GalleryLayoutId;
  landing_page: LandingPageId;
  residence_region: ResidenceRegionId;
  timezone_override: TimezoneId | null;
  date_format_mode: DateFormatModeId;
  currency_code_override: CurrencyCodeId | null;
  currency_format_mode: CurrencyFormatModeId;
  register_start_step: RegisterStartStepId;
  default_storage_location_id: number | null;
  gallery_show_name: boolean;
  gallery_show_tags: boolean;
  gallery_show_price: boolean;
};

export const DEFAULT_TEXT_SCALE: DisplayLevel = 3;
export const DEFAULT_UI_DENSITY: DisplayLevel = 4;

const LOCAL_KEY = "oshiapp:displaySettings";
const SYNC_DEBOUNCE_MS = 800;
const MIN_LEVEL = 1;
const MAX_LEVEL = 7;

export type DisplaySettingsContextValue = {
  textScale: DisplayLevel;
  uiDensity: DisplayLevel;
  listSort: ListSortId;
  galleryLayout: GalleryLayoutId;
  landingPage: LandingPageId;
  residenceRegion: ResidenceRegionId;
  timezoneOverride: TimezoneId | null;
  dateFormatMode: DateFormatModeId;
  currencyCodeOverride: CurrencyCodeId | null;
  currencyFormatMode: CurrencyFormatModeId;
  setTextScale: (level: DisplayLevel) => void;
  setUiDensity: (level: DisplayLevel) => void;
  setListSort: (id: ListSortId) => void;
  setGalleryLayout: (id: GalleryLayoutId) => void;
  setLandingPage: (id: LandingPageId) => void;
  setResidenceRegion: (id: ResidenceRegionId) => void;
  setTimezoneOverride: (tz: TimezoneId | null) => void;
  setDateFormatMode: (mode: DateFormatModeId) => void;
  setCurrencyCodeOverride: (code: CurrencyCodeId | null) => void;
  setCurrencyFormatMode: (mode: CurrencyFormatModeId) => void;
  registerStartStep: RegisterStartStepId;
  defaultStorageLocationId: number | null;
  setRegisterStartStep: (id: RegisterStartStepId) => void;
  setDefaultStorageLocationId: (id: number | null) => void;
  galleryShowName: boolean;
  galleryShowTags: boolean;
  galleryShowPrice: boolean;
  setGalleryShowName: (on: boolean) => void;
  setGalleryShowTags: (on: boolean) => void;
  setGalleryShowPrice: (on: boolean) => void;
  isSyncing: boolean;
};

export const DisplaySettingsContext =
  createContext<DisplaySettingsContextValue | null>(null);

function apiBase(): string {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
    "http://127.0.0.1:8000"
  );
}

function tryCreateClient() {
  try {
    return createClient();
  } catch {
    return null;
  }
}

function clampLevel(raw: unknown, fallback: DisplayLevel): DisplayLevel {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isInteger(n) || n < MIN_LEVEL || n > MAX_LEVEL) return fallback;
  return n as DisplayLevel;
}

function defaults(): DisplaySettings {
  return {
    text_scale: DEFAULT_TEXT_SCALE,
    ui_density: DEFAULT_UI_DENSITY,
    list_sort: DEFAULT_LIST_SORT,
    gallery_layout: DEFAULT_GALLERY_LAYOUT,
    landing_page: DEFAULT_LANDING_PAGE,
    residence_region: DEFAULT_RESIDENCE_REGION,
    timezone_override: null,
    date_format_mode: DEFAULT_DATE_FORMAT_MODE,
    currency_code_override: null,
    currency_format_mode: DEFAULT_CURRENCY_FORMAT_MODE,
    register_start_step: DEFAULT_REGISTER_START_STEP,
    default_storage_location_id: null,
    ...sanitizeGalleryCardFields(null),
  };
}

function sanitizePrefs(raw: unknown): DisplaySettings {
  const obj =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    text_scale: clampLevel(obj.text_scale, DEFAULT_TEXT_SCALE),
    ui_density: clampLevel(obj.ui_density, DEFAULT_UI_DENSITY),
    list_sort: sanitizeListSort(obj.list_sort),
    gallery_layout: sanitizeGalleryLayout(obj.gallery_layout),
    landing_page: sanitizeLandingPage(obj.landing_page),
    residence_region: sanitizeResidenceRegion(obj.residence_region),
    timezone_override: sanitizeTimezoneOverride(obj.timezone_override),
    date_format_mode: sanitizeDateFormatMode(obj.date_format_mode),
    currency_code_override: sanitizeCurrencyCodeOverride(
      obj.currency_code_override,
    ),
    currency_format_mode: sanitizeCurrencyFormatMode(obj.currency_format_mode),
    register_start_step: sanitizeRegisterStartStep(obj.register_start_step),
    default_storage_location_id: sanitizeDefaultStorageLocationId(
      obj.default_storage_location_id,
    ),
    ...sanitizeGalleryCardFields(obj),
  };
}

function readLocal(): DisplaySettings {
  try {
    if (typeof window === "undefined") return defaults();
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return defaults();
    return sanitizePrefs(JSON.parse(raw) as unknown);
  } catch {
    return defaults();
  }
}

function applyToDocument(prefs: DisplaySettings) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-text-scale", String(prefs.text_scale));
  root.setAttribute("data-ui-density", String(prefs.ui_density));
  root.setAttribute("data-gallery-layout", prefs.gallery_layout);
}

async function fetchViaFastAPI(token: string): Promise<DisplaySettings | null> {
  try {
    const res = await fetch(`${apiBase()}${API_PATHS.displaySettings}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return sanitizePrefs(await res.json());
  } catch {
    return null;
  }
}

async function putViaFastAPI(
  prefs: DisplaySettings,
  token: string,
): Promise<boolean> {
  try {
    const res = await fetch(`${apiBase()}${API_PATHS.displaySettings}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(prefs),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Provider 用の状態フック（JSX なし） */
export function useDisplaySettingsState(): DisplaySettingsContextValue {
  const [prefs, setPrefs] = useState<DisplaySettings>(() => readLocal());
  const [isSyncing, setIsSyncing] = useState(false);
  const mounted = useRef(false);
  const debounceTimer = useRef<number | null>(null);
  const skipNextSync = useRef(false);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(prefs));
    } catch {
      /* ignore */
    }
    applyToDocument(prefs);
  }, [prefs]);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (skipNextSync.current) {
      skipNextSync.current = false;
      return;
    }
    if (debounceTimer.current) window.clearTimeout(debounceTimer.current);
    debounceTimer.current = window.setTimeout(async () => {
      setIsSyncing(true);
      try {
        const supabase = tryCreateClient();
        if (!supabase) return;
        const session = await supabase.auth.getSession();
        const token = session.data?.session?.access_token;
        if (!token) return;
        await putViaFastAPI(prefs, token);
      } finally {
        setIsSyncing(false);
      }
    }, SYNC_DEBOUNCE_MS);
    return () => {
      if (debounceTimer.current) window.clearTimeout(debounceTimer.current);
    };
  }, [prefs]);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const supabase = tryCreateClient();
        if (!supabase) return;
        const session = await supabase.auth.getSession();
        const token = session.data?.session?.access_token;
        if (!token) return;
        const server = await fetchViaFastAPI(token);
        if (server && alive) {
          skipNextSync.current = true;
          setPrefs(server);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const setTextScale = useCallback((level: DisplayLevel) => {
    setPrefs((prev) => ({
      ...prev,
      text_scale: clampLevel(level, DEFAULT_TEXT_SCALE),
    }));
  }, []);

  const setUiDensity = useCallback((level: DisplayLevel) => {
    setPrefs((prev) => ({
      ...prev,
      ui_density: clampLevel(level, DEFAULT_UI_DENSITY),
    }));
  }, []);

  const setListSort = useCallback((id: ListSortId) => {
    setPrefs((prev) => ({ ...prev, list_sort: sanitizeListSort(id) }));
  }, []);

  const setGalleryLayout = useCallback((id: GalleryLayoutId) => {
    setPrefs((prev) => ({
      ...prev,
      gallery_layout: sanitizeGalleryLayout(id),
    }));
  }, []);

  const setLandingPage = useCallback((id: LandingPageId) => {
    setPrefs((prev) => ({
      ...prev,
      landing_page: sanitizeLandingPage(id),
    }));
  }, []);

  const setResidenceRegion = useCallback((id: ResidenceRegionId) => {
    setPrefs((prev) => ({
      ...prev,
      residence_region: sanitizeResidenceRegion(id),
      // 居住地変更時は個別 TZ・通貨を解除して連動させる
      timezone_override: null,
      currency_code_override: null,
    }));
  }, []);

  const setTimezoneOverride = useCallback((tz: TimezoneId | null) => {
    setPrefs((prev) => ({
      ...prev,
      timezone_override: sanitizeTimezoneOverride(tz),
    }));
  }, []);

  const setDateFormatMode = useCallback((mode: DateFormatModeId) => {
    setPrefs((prev) => ({
      ...prev,
      date_format_mode: sanitizeDateFormatMode(mode),
    }));
  }, []);

  const setCurrencyCodeOverride = useCallback((code: CurrencyCodeId | null) => {
    setPrefs((prev) => ({
      ...prev,
      currency_code_override: sanitizeCurrencyCodeOverride(code),
    }));
  }, []);

  const setCurrencyFormatMode = useCallback((mode: CurrencyFormatModeId) => {
    setPrefs((prev) => ({
      ...prev,
      currency_format_mode: sanitizeCurrencyFormatMode(mode),
    }));
  }, []);

  const setRegisterStartStep = useCallback((id: RegisterStartStepId) => {
    setPrefs((prev) => ({
      ...prev,
      register_start_step: sanitizeRegisterStartStep(id),
    }));
  }, []);

  const setDefaultStorageLocationId = useCallback((id: number | null) => {
    setPrefs((prev) => ({
      ...prev,
      default_storage_location_id: sanitizeDefaultStorageLocationId(id),
    }));
  }, []);

  const setGalleryShowName = useCallback((on: boolean) => {
    setPrefs((prev) => ({
      ...prev,
      gallery_show_name: sanitizeGalleryShow(on),
    }));
  }, []);

  const setGalleryShowTags = useCallback((on: boolean) => {
    setPrefs((prev) => ({
      ...prev,
      gallery_show_tags: sanitizeGalleryShow(on),
    }));
  }, []);

  const setGalleryShowPrice = useCallback((on: boolean) => {
    setPrefs((prev) => ({
      ...prev,
      gallery_show_price: sanitizeGalleryShow(on),
    }));
  }, []);

  return useMemo(
    () => ({
      textScale: prefs.text_scale,
      uiDensity: prefs.ui_density,
      listSort: prefs.list_sort,
      galleryLayout: prefs.gallery_layout,
      landingPage: prefs.landing_page,
      residenceRegion: prefs.residence_region,
      timezoneOverride: prefs.timezone_override,
      dateFormatMode: prefs.date_format_mode,
      currencyCodeOverride: prefs.currency_code_override,
      currencyFormatMode: prefs.currency_format_mode,
      registerStartStep: prefs.register_start_step,
      defaultStorageLocationId: prefs.default_storage_location_id,
      galleryShowName: prefs.gallery_show_name,
      galleryShowTags: prefs.gallery_show_tags,
      galleryShowPrice: prefs.gallery_show_price,
      setTextScale,
      setUiDensity,
      setListSort,
      setGalleryLayout,
      setLandingPage,
      setResidenceRegion,
      setTimezoneOverride,
      setDateFormatMode,
      setCurrencyCodeOverride,
      setCurrencyFormatMode,
      setRegisterStartStep,
      setDefaultStorageLocationId,
      setGalleryShowName,
      setGalleryShowTags,
      setGalleryShowPrice,
      isSyncing,
    }),
    [
      prefs,
      setTextScale,
      setUiDensity,
      setListSort,
      setGalleryLayout,
      setLandingPage,
      setResidenceRegion,
      setTimezoneOverride,
      setDateFormatMode,
      setCurrencyCodeOverride,
      setCurrencyFormatMode,
      setRegisterStartStep,
      setDefaultStorageLocationId,
      setGalleryShowName,
      setGalleryShowTags,
      setGalleryShowPrice,
      isSyncing,
    ],
  );
}

export function useDisplaySettings(): DisplaySettingsContextValue {
  const ctx = useContext(DisplaySettingsContext);
  if (!ctx) {
    throw new Error(
      "useDisplaySettings は DisplaySettingsProvider 内で使ってください",
    );
  }
  return ctx;
}
