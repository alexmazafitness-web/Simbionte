import { listOnboardings, listOnboardingMensajes } from "@/lib/coaching/onboarding-queries";
import { OnboardingPageClient } from "@/components/shared/onboarding/OnboardingPageClient";

export default async function OnboardingPage() {
  const [activos, completados, mensajes] = await Promise.all([
    listOnboardings("en_progreso"),
    listOnboardings("completado"),
    listOnboardingMensajes(),
  ]);

  return (
    <div className="px-10 py-10">
      <div className="mb-6 flex items-center gap-2.5 text-[10px] tracking-[0.24em] text-gold-dim uppercase">
        Business
        <span className="text-text-dim">/</span>
        Onboarding
      </div>

      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold tracking-wide">Onboarding</h1>
        <p className="mt-1 text-sm text-text-dim">
          Seguimiento del proceso de incorporación de clientes nuevos
        </p>
      </div>

      <OnboardingPageClient activos={activos} completados={completados} mensajes={mensajes} />
    </div>
  );
}
