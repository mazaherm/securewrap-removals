import { Hero } from "@/components/Hero";
import { TrustBar } from "@/components/TrustBar";
import { ServicesOverview } from "@/components/ServicesOverview";
import { HowItWorks } from "@/components/HowItWorks";
import { WhyTrustUs } from "@/components/WhyTrustUs";
import { CallToAction } from "@/components/CallToAction";

export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustBar />
      <ServicesOverview />
      <HowItWorks />
      <WhyTrustUs />
      <CallToAction />
    </>
  );
}
