/**
 * モバイル枠向け親指ゾーン見本。
 * 下＝届きやすい／上＝伸ばしにくい、のざっくりガイド（機種差あり・近似）。
 */
type LabThumbZoneOverlayProps = {
  visible: boolean;
};

export default function LabThumbZoneOverlay({
  visible,
}: LabThumbZoneOverlayProps) {
  if (!visible) return null;

  return (
    <div
      className="lab-thumb-zone pointer-events-none absolute inset-0 z-20"
      aria-hidden
    >
      <div className="lab-thumb-zone__hard absolute inset-x-0 top-0 h-[38%]" />
      <div className="lab-thumb-zone__mid absolute inset-x-0 top-[38%] h-[24%]" />
      <div className="lab-thumb-zone__easy absolute inset-x-0 bottom-0 h-[38%]" />
      <p className="absolute bottom-2 left-2 right-2 rounded bg-black/55 px-2 py-1 text-center text-[9px] leading-snug text-white">
        緑寄り＝親指が届きやすい帯 · 赤寄り＝伸ばしにくい帯（近似）
      </p>
    </div>
  );
}
