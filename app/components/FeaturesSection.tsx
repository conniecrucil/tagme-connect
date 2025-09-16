export function FeaturesSection() {
  const features = [
    "Save paper.",
    "Save space.", 
    "Connect smarter."
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <div className="space-y-4">
            {features.map((feature, index) => (
              <h2 
                key={index} 
                className={`text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 animate-fade-in-up hover:scale-105 transition-transform duration-300`}
                style={{ animationDelay: `${index * 200 + 100}ms` }}
              >
                {feature}
              </h2>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
