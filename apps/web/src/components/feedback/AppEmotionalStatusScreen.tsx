import type { ReactNode } from "react";
import { MascotEmotionalMark } from "@/components/mascot/MascotEmotionalMark";
import type { EmotionalSceneKind } from "@/lib/mascotCatalog";

type Props = {
  kind: EmotionalSceneKind;
  title: string;
  body: string;
  children: ReactNode;
};

export function AppEmotionalStatusScreen({
  kind,
  title,
  body,
  children,
}: Props) {
  return (
    <div className="flex min-h-[50vh] w-full flex-col items-center justify-center px-4 py-10 text-center">
      <MascotEmotionalMark kind={kind} />
      <h1 className="mt-6 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
        {title}
      </h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        {body}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        {children}
      </div>
    </div>
  );
}
