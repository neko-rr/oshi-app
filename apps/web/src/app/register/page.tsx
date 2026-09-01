import { RegisterWizard } from "@/components/register/RegisterWizard";

export default function RegisterPage() {
  return (
    <div className="flex flex-col gap-6 py-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">製品登録</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          バーコード → 正面写真 → 確認の順で登録します。外部照合がなくても完了できます。
        </p>
      </div>
      <RegisterWizard />
    </div>
  );
}
