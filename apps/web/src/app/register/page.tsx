import { RegisterForm } from "@/components/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="flex flex-col gap-6 py-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">製品登録</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          仮 UI（クイック登録相当）。バーコードカメラ・Vision タグは後続。
        </p>
      </div>
      <RegisterForm />
    </div>
  );
}
