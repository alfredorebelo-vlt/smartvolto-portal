import Image from "next/image";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { LoginButton } from "./login-button";

type SearchParams = Promise<{ error?: string; callbackUrl?: string }>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();
  const params = await searchParams;

  if (session?.user) {
    redirect(params.callbackUrl || "/");
  }

  const errorMessage = getErrorMessage(params.error);

  async function handleSignIn() {
    "use server";
    await signIn("google", {
      redirectTo: params.callbackUrl || "/",
    });
  }

  return (
    <div className="relative flex min-h-[100dvh] overflow-hidden bg-[#0d1117]">
      {/* Background decorative blobs */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
      >
        <div
          className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full opacity-30"
          style={{
            background:
              "radial-gradient(circle, rgba(255,196,41,0.35) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
        <div
          className="absolute -bottom-40 -right-40 h-[700px] w-[700px] rounded-full opacity-20"
          style={{
            background:
              "radial-gradient(circle, rgba(46,60,143,0.6) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
        <div
          className="absolute right-1/4 top-1/3 h-[300px] w-[300px] rounded-full opacity-10"
          style={{
            background:
              "radial-gradient(circle, rgba(255,196,41,0.5) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
      </div>

      {/* Subtle grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
        aria-hidden="true"
      />

      {/* Left panel — branding */}
      <div className="relative hidden flex-col justify-between p-12 lg:flex lg:w-1/2">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Image
            src="/brand/symbol.png"
            alt="Smart Volto"
            width={36}
            height={36}
            priority
            className="h-9 w-auto"
          />
          <span
            className="text-xl font-semibold tracking-tight text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Smart Volto
          </span>
        </div>

        {/* Hero text */}
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-[#ffc429]">
            Portal Interno
          </div>
          <h1
            className="text-5xl font-bold leading-tight text-white"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}
          >
            O seu espaço
            <br />
            <span style={{ color: "#ffc429" }}>de trabalho</span>
            <br />
            digital.
          </h1>
          <p className="max-w-sm text-base leading-relaxed text-white/50">
            Aceda a anúncios, documentos, calendário e muito mais num único portal dedicado à equipa Volto Drive.
          </p>
        </div>

        {/* Footer note */}
        <p className="text-xs text-white/25">
          © {new Date().getFullYear()} Volto Drive. Uso interno exclusivo.
        </p>
      </div>

      {/* Right panel — login card */}
      <div className="relative flex w-full items-center justify-center p-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center justify-center gap-2 lg:hidden">
            <Image
              src="/brand/symbol.png"
              alt="Smart Volto"
              width={28}
              height={28}
              priority
              className="h-7 w-auto"
            />
            <span
              className="text-lg font-semibold text-white"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Smart Volto
            </span>
          </div>

          {/* Card */}
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] shadow-2xl backdrop-blur-xl">
            {/* Top accent */}
            <div
              className="h-[3px] w-full"
              style={{ background: "linear-gradient(90deg, #ffc429 0%, #f29220 100%)" }}
            />

            <div className="p-8">
              <div className="mb-7 space-y-1">
                <h2
                  className="text-2xl font-bold text-white"
                  style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
                >
                  Bem-vindo de volta
                </h2>
                <p className="text-sm text-white/50">
                  Inicia sessão com a tua conta Volto Drive.
                </p>
              </div>

              <form action={handleSignIn} className="flex flex-col gap-4">
                <LoginButton />

                {errorMessage ? (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-center text-xs font-medium text-red-400">
                    {errorMessage}
                  </div>
                ) : null}

                <div className="mt-1 flex items-center gap-2">
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="text-[11px] text-white/30">
                    apenas @voltodrive.com
                  </span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>
              </form>
            </div>
          </div>

          <p className="mt-6 text-center text-[11px] text-white/20">
            Acesso restrito a colaboradores Volto Drive.
            <br />
            Problemas? Contacta o administrador de sistema.
          </p>
        </div>
      </div>
    </div>
  );
}

function getErrorMessage(code?: string): string | null {
  if (!code) return null;
  switch (code) {
    case "AccessDenied":
      return "Acesso negado. Apenas contas @voltodrive.com são permitidas.";
    case "OAuthAccountNotLinked":
      return "Esta conta já existe com outro método de autenticação.";
    case "Configuration":
      return "Erro de configuração. Contacta o administrador.";
    default:
      return "Não foi possível autenticar. Tenta novamente.";
  }
}
