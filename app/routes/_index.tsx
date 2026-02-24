import { Suspense, lazy } from "react";
import { HomePageSkeleton } from "../components/HomePageSkeleton";

const HeroSection = lazy(async () => {
  const mod = await import("../components/HeroSection");
  return { default: mod.HeroSection };
});
const FeaturesSection = lazy(async () => {
  const mod = await import("../components/FeaturesSection");
  return { default: mod.FeaturesSection };
});
const TagMeCardsSection = lazy(async () => {
  const mod = await import("../components/TagMeCardsSection");
  return { default: mod.TagMeCardsSection };
});
const StorySection = lazy(async () => {
  const mod = await import("../components/StorySection");
  return { default: mod.StorySection };
});

export function meta() {
  return [
    { title: "Tagme Connections" },
    { name: "description", content: "Your brand in their pocket—always. TAG Me Cards revolutionize professional networking with innovative e-business cards." },
  ];
}

export default function Home() {
  return (
    <Suspense fallback={<HomePageSkeleton />}>
      <main className="min-h-screen">
        <HeroSection />
        <FeaturesSection />
        <TagMeCardsSection />
        <StorySection />
      </main>
    </Suspense>
  );
}
