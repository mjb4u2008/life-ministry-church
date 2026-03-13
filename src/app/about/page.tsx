import { Button } from "@/components/Button";

const beliefs = [
  {
    title: "The Bible",
    description: "We believe the Bible is God's inspired Word and our guide for faith and life.",
  },
  {
    title: "God",
    description: "We believe in one God, eternally existing in three persons: Father, Son, and Holy Spirit.",
  },
  {
    title: "Jesus Christ",
    description: "We believe Jesus is fully God and fully man, born of a virgin, and that He died for our sins and rose again.",
  },
  {
    title: "Salvation",
    description: "We believe salvation is a gift of grace received through faith in Jesus Christ alone.",
  },
  {
    title: "The Church",
    description: "We believe the church is the body of Christ, called to worship, fellowship, and serve.",
  },
  {
    title: "Eternity",
    description: "We believe in the resurrection of the dead and eternal life with God for all who believe.",
  },
];

const lifeLetters = [
  {
    letter: "L",
    word: "Lord",
    description: "Our eternal God, the beginning and the end, unchanging through all generations.",
  },
  {
    letter: "I",
    word: "Is",
    description: "Not was, not will be — but IS. He is present, active, and alive right now.",
  },
  {
    letter: "F",
    word: "Forever",
    description: "His presence endures eternally. Yesterday, today, and forever the same.",
  },
  {
    letter: "E",
    word: "Emmanuel",
    description: "\"God with us\" — the promise fulfilled in Jesus, our ever-present companion.",
  },
];

export default function AboutPage() {
  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="bg-forest text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-semibold mb-4">
              What is L.I.F.E.?
            </h1>
            <p className="text-white/80 text-lg max-w-2xl mx-auto">
              More than a name — it&apos;s a declaration of who God is
              and His promise to always be with us.
            </p>
          </div>
        </div>
      </section>

      {/* L.I.F.E. Meaning Section - The Heart of the Page */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="text-terracotta font-medium tracking-wider uppercase text-sm">
              The Heart of Our Ministry
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-semibold text-charcoal mt-4 mb-6">
              Lord Is Forever Emmanuel
            </h2>
            <p className="text-charcoal-light text-lg leading-relaxed">
              L.I.F.E. Ministry is built on a beautiful truth that spans from ancient
              prophecy to present reality: God has always been, and will always be,
              with His people.
            </p>
          </div>

          {/* L.I.F.E. Letter Breakdown */}
          <div className="grid md:grid-cols-4 gap-6 mb-16">
            {lifeLetters.map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all text-center group"
              >
                <div className="w-20 h-20 mx-auto rounded-full bg-terracotta text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="font-display text-4xl font-bold">{item.letter}</span>
                </div>
                <h3 className="font-display text-2xl font-semibold text-charcoal mb-2">
                  {item.word}
                </h3>
                <p className="text-charcoal-light text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          {/* Scripture Connection */}
          <div className="bg-cream-dark rounded-3xl p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl md:text-3xl font-display font-semibold text-charcoal mb-6">
                  A Promise Fulfilled
                </h3>
                <div className="space-y-4 text-charcoal-light leading-relaxed">
                  <p>
                    In <strong className="text-charcoal">Isaiah 7:14</strong>, the prophet
                    spoke of a coming sign: <em>&quot;The virgin will conceive and give birth
                    to a son, and will call him Immanuel.&quot;</em>
                  </p>
                  <p>
                    Centuries later, <strong className="text-charcoal">Matthew 1:23</strong> reveals
                    the fulfillment of this prophecy in Jesus Christ — Emmanuel, which means
                    <em>&quot;God with us.&quot;</em>
                  </p>
                  <p>
                    This is the foundation of L.I.F.E. Ministry: the eternal God chose to
                    dwell among us, and through Jesus, He continues to be present with
                    His people — including you, right where you are.
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <svg
                  className="w-12 h-12 text-terracotta mb-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
                <blockquote className="font-display text-xl md:text-2xl text-charcoal leading-relaxed mb-4">
                  &ldquo;And surely I am with you always, to the very end of the age.&rdquo;
                </blockquote>
                <cite className="text-terracotta font-medium">— Matthew 28:20</cite>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What This Means For You */}
      <section className="py-16 md:py-24 bg-forest text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-terracotta-light font-medium tracking-wider uppercase text-sm">
              God&apos;s Constant Presence
            </span>
            <h2 className="text-3xl md:text-4xl font-display font-semibold mt-2">
              What This Means for You
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ),
                title: "You Are Never Alone",
                description: "In your brightest moments and darkest valleys, Emmanuel — God with us — is right there beside you.",
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                ),
                title: "You Are Deeply Loved",
                description: "The God of the universe chose to be with you. Not watching from a distance, but intimately present in your life.",
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: "His Presence Is Eternal",
                description: "The Lord IS — present tense, always. His faithfulness extends to every generation, including yours.",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="bg-white/10 rounded-2xl p-8 hover:bg-white/15 transition-colors text-center"
              >
                <div className="w-16 h-16 mx-auto rounded-xl bg-terracotta/20 flex items-center justify-center text-terracotta-light mb-4">
                  {item.icon}
                </div>
                <h3 className="font-display text-xl font-semibold mb-3">
                  {item.title}
                </h3>
                <p className="text-white/80 text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pastor Section */}
      <section id="pastor" className="py-16 md:py-24 bg-cream-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <span className="text-terracotta font-medium tracking-wider uppercase text-sm">
                Meet the Pastor
              </span>
              <h2 className="text-3xl md:text-4xl font-display font-semibold text-charcoal mt-2 mb-6">
                Pastor Mike
              </h2>
              <div className="space-y-4 text-charcoal-light leading-relaxed">
                <p>
                  Pastor Mike founded L.I.F.E. Ministry with a simple vision: to create
                  a welcoming space where people can experience God&apos;s presence together,
                  no matter where they are in the world.
                </p>
                <p>
                  With a heart for teaching and a passion for authentic connection,
                  Pastor Mike brings Scripture to life in a way that&apos;s accessible,
                  practical, and filled with warmth. His conversational style makes
                  everyone feel like family.
                </p>
                <p>
                  Beyond Sunday services, you can find Pastor Mike sharing daily
                  encouragement on TikTok and Instagram, where he connects with
                  thousands through short, powerful messages of faith and hope.
                </p>
              </div>
              <blockquote className="mt-8 border-l-4 border-terracotta pl-6 italic text-charcoal">
                &ldquo;God is with you right now, right where you are. That&apos;s not just
                a nice thought — it&apos;s the truth that changes everything.&rdquo;
              </blockquote>
            </div>
            <div className="order-1 md:order-2">
              <div className="aspect-[4/5] rounded-2xl bg-gradient-to-br from-forest to-forest-dark overflow-hidden shadow-xl">
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center text-white/60">
                    <svg
                      className="w-24 h-24 mx-auto mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <p className="text-sm">Pastor Mike Photo</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Beliefs Section */}
      <section id="beliefs" className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-terracotta font-medium tracking-wider uppercase text-sm">
              Our Foundation
            </span>
            <h2 className="text-3xl md:text-4xl font-display font-semibold text-charcoal mt-2">
              What We Believe
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {beliefs.map((belief, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow"
              >
                <h3 className="font-display text-xl font-semibold text-charcoal mb-3">
                  {belief.title}
                </h3>
                <p className="text-charcoal-light text-sm leading-relaxed">
                  {belief.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24 bg-cream-dark">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-terracotta font-medium tracking-wider uppercase text-sm">
              Common Questions
            </span>
            <h2 className="text-3xl md:text-4xl font-display font-semibold text-charcoal mt-2">
              FAQs
            </h2>
          </div>

          <div className="space-y-6">
            {[
              {
                q: "What time is the service?",
                a: "We gather every Sunday at 10:00 AM Eastern Time. The service typically lasts about an hour.",
              },
              {
                q: "Do I need to turn on my camera?",
                a: "Cameras and microphones are completely optional. You're welcome to participate however you're comfortable — whether that's on video, audio only, or just watching.",
              },
              {
                q: "Is this a real church?",
                a: "Absolutely! While we meet online rather than in a physical building, we're a genuine community of believers committed to worship, teaching, prayer, and fellowship together.",
              },
              {
                q: "Can I join from anywhere?",
                a: "Yes! We have members from all over the world. As long as you have an internet connection, you're welcome to join us.",
              },
              {
                q: "What about my kids?",
                a: "We welcome families! Many parents watch with their children and use the service as a teaching moment. We keep our messages accessible to all ages.",
              },
            ].map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 shadow-sm"
              >
                <h3 className="font-display text-lg font-semibold text-charcoal mb-2">
                  {faq.q}
                </h3>
                <p className="text-charcoal-light">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-display font-semibold text-charcoal mb-6">
            Experience God&apos;s Presence With Us
          </h2>
          <p className="text-charcoal-light text-lg mb-8 max-w-2xl mx-auto">
            L.I.F.E. Ministry is a place where you can encounter the God who is
            forever Emmanuel — forever with us. Join us this Sunday and experience
            His presence in community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button href="/watch" size="lg">
              Join This Sunday
            </Button>
            <Button href="/connect" variant="outline" size="lg">
              Submit a Prayer Request
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
