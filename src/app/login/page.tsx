import { signIn } from "@/auth";

export default function LoginPage() {
  const showDev = process.env.NODE_ENV !== "production";
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-10 bg-page px-8 text-ink">
      <div className="text-center">
        <div className="text-xs font-semibold tracking-[0.14em] text-faint">
          WORKOUT TRACKER
        </div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Log every set.</h1>
        <p className="mt-2 max-w-xs text-sm text-muted">
          Plan your week, run your workout, and track progress over time.
        </p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-3">
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-ink text-[17px] font-semibold text-white transition-opacity active:opacity-85"
          >
            Continue with Google
          </button>
        </form>

        {showDev && (
          <form
            action={async () => {
              "use server";
              await signIn("dev", { redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="flex h-12 w-full items-center justify-center rounded-2xl border border-hair bg-surface text-sm font-semibold text-muted transition-colors active:bg-page"
            >
              Dev sign-in (local only)
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
