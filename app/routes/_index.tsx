import { Header } from "../components/Header";
import { HeroSection } from "../components/HeroSection";
import { FeaturesSection } from "../components/FeaturesSection";
import { TagMeCardsSection } from "../components/TagMeCardsSection";
import { StorySection } from "../components/StorySection";
import { Footer } from "../components/Footer";

export function meta() {
  return [
    { title: "Tagme Connections" },
    { name: "description", content: "Your brand in their pocket—always. TAG Me Cards revolutionize professional networking with innovative e-business cards." },
  ];
}

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <FeaturesSection />
        <TagMeCardsSection />
        <StorySection />
      </main>
      <Footer />
    </div>
  );
}
