import { Logo } from "@/components/logo";
import { ParticleNetworkBackground } from "@/components/particle-network-background";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative isolate flex min-h-dvh flex-col items-center justify-center gap-8 overflow-hidden bg-background px-4 py-12">
      <ParticleNetworkBackground />
      <Logo />
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
