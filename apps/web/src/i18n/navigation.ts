import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/** locale を考慮した Link / redirect / router */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
