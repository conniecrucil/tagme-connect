import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { HeroSection } from "../components/HeroSection";
import { FeaturesSection } from "../components/FeaturesSection";
import { TagMeCardsSection } from "../components/TagMeCardsSection";
import { StorySection } from "../components/StorySection";

export function meta() {
  return [
    { title: "Tagme Connections" },
    { name: "description", content: "Your brand in their pocket—always. TAG Me Cards revolutionize professional networking with innovative e-business cards." },
  ];
}

export default function Home() {
  return (
  <main className="min-h-screen">
        <HeroSection />
        <FeaturesSection />
        <TagMeCardsSection />
        <StorySection />
    </main>

  );
}
