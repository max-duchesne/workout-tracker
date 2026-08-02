import Image from "next/image";
import { signIn } from "@/auth";

function GoogleG() {
  return (
    <svg width="19" height="19" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const showDev = process.env.NODE_ENV !== "production";
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-12 bg-page px-8">
      <div className="flex flex-col items-center gap-4">
        <Image
          src="/icon-512.png"
          alt=""
          width={72}
          height={72}
          className="rounded-[20px] shadow-sm"
          priority
        />
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          Workout
        </h1>
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
            className="flex h-[52px] w-full items-center justify-center gap-3 rounded-2xl border border-[#dadce0] bg-white text-[15px] font-medium text-[#1f1f1f] shadow-sm transition-colors active:bg-[#f7f8f8]"
          >
            <GoogleG />
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
              className="flex h-11 w-full items-center justify-center rounded-2xl text-[13px] font-medium text-faint transition-colors active:text-muted"
            >
              Dev sign-in (local only)
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
