import { Button } from "@/components/Button";
import { ScrollReveal } from "@/components/ScrollReveal";

const beliefs = [
  {
    title: "The Bible",
    description:
      "We believe the Bible is God's inspired Word and our guide for faith and life.",
  },
  {
    title: "God",
    description:
      "We believe in one God, eternally existing in three persons: Father, Son, and Holy Spirit.",
  },
  {
    title: "Jesus Christ",
    description:
      "We believe Jesus is fully God and fully man, born of a virgin, and that He died for our sins and rose again.",
  },
  {
    title: "Salvation",
    description:
      "We believe salvation is a gift of grace received through faith in Jesus Christ alone.",
  },
  {
    title: "The Church",
    description:
      "We believe the church is the body of Christ, called to worship, fellowship, and serve.",
  },
  {
    title: "Eternity",
    description:
      "We believe in the resurrection of the dead and eternal life with God for all who believe.",
  },
];

const lifeLetters = [
  {
    letter: "L",
    word: "Lord",
    description:
      "Our eternal God, the beginning and the end, unchanging through all generations.",
  },
  {
    letter: "I",
    word: "Is",
    description:
      "Not was, not will be — but IS. He is present, active, and alive right now.",
  },
  {
    letter: "F",
    word: "Forever",
    description:
      "His presence endures eternally. Yesterday, today, and forever the same.",
  },
  {
    letter: "E",
    word: "Emmanuel",
    description:
      '"God with us" — the promise fulfilled in Jesus, our ever-present companion.',
  },
];

const faqs = [
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
];

const anchorLinks = [
  { label: "Our Mission", href: "#mission" },
  { label: "Our Values", href: "#values" },
  { label: "Our Beliefs", href: "#beliefs" },
  { label: "Our Leaders", href: "#leaders" },
  { label: "FAQ", href: "#faq" },
];

export default function AboutPage() {
  return (
    <div className="pt-20">
      {/* ── Section 1: Hero ── */}
      <section className="bg-[#0a1a2f] text-white py-24 md:py-36">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <ScrollReveal>
            <h1
              className="font-display font-[900] text-5xl md:text-6xl lg:text-7xl xl:text-8xl uppercase tracking-[0.25em] mb-8"
            >
              WHAT IS L.I.F.E.?
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={150}>
            <p className="text-white/60 font-body text-lg md:text-xl max-w-2xl mx-auto tracking-wide">
              More than a name — it&apos;s a declaration of who God is
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Section 2: Anchor Navigation ── */}
      <nav className="sticky top-20 z-30 bg-white border-b border-[#c8dded]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6 md:gap-10 overflow-x-auto py-4 scrollbar-hide">
            {anchorLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm tracking-wider uppercase font-body font-semibold text-[#4a6580] hover:text-[#1a6fb5] whitespace-nowrap transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </nav>

      {/* ── Section 3: L.I.F.E. Deep Dive ── */}
      <section id="mission" className="bg-[#fafcff] py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="max-w-3xl mx-auto text-center mb-20">
            <ScrollReveal>
              <span className="text-[#1a6fb5] font-body font-bold tracking-[0.15em] uppercase text-sm">
                The Heart of Our Ministry
              </span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-[900] text-[#0a1a2f] mt-5 mb-8 tracking-tight">
                Lord Is Forever Emmanuel
              </h2>
              <p className="text-[#4a6580] font-body text-lg leading-relaxed">
                L.I.F.E. Ministry is built on a beautiful truth that spans from
                ancient prophecy to present reality: God has always been, and
                will always be, with His people. The name itself is a statement
                of faith — each letter carrying the weight of a promise that God
                made and has never broken.
              </p>
            </ScrollReveal>
          </div>

          {/* L.I.F.E. Letter Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-20">
            {lifeLetters.map((item, index) => (
              <ScrollReveal key={index} delay={index * 100}>
                <div className="bg-[#f0f4f8] rounded-2xl p-8 text-center group hover:shadow-xl transition-shadow">
                  <div className="w-20 h-20 mx-auto rounded-full bg-[#1a6fb5] text-white flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    <span className="font-display text-4xl font-[900]">
                      {item.letter}
                    </span>
                  </div>
                  <h3 className="font-display text-2xl font-[800] text-[#0a1a2f] mb-3">
                    {item.word}
                  </h3>
                  <p className="text-[#4a6580] font-body text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* Scripture Connection */}
          <ScrollReveal>
            <div className="bg-[#f0f4f8] rounded-2xl p-8 md:p-14">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h3 className="text-3xl md:text-4xl font-display font-[900] text-[#0a1a2f] mb-8 tracking-tight">
                    A Promise Fulfilled
                  </h3>
                  <div className="space-y-4 text-[#4a6580] font-body leading-relaxed">
                    <p>
                      In{" "}
                      <strong className="text-[#0a1a2f] font-bold">Isaiah 7:14</strong>, the
                      prophet spoke of a coming sign:{" "}
                      <em>
                        &quot;The virgin will conceive and give birth to a son,
                        and will call him Immanuel.&quot;
                      </em>
                    </p>
                    <p>
                      Centuries later,{" "}
                      <strong className="text-[#0a1a2f] font-bold">Matthew 1:23</strong>{" "}
                      reveals the fulfillment of this prophecy in Jesus Christ —
                      Emmanuel, which means{" "}
                      <em>&quot;God with us.&quot;</em>
                    </p>
                    <p>
                      This is the foundation of L.I.F.E. Ministry: the eternal
                      God chose to dwell among us, and through Jesus, He
                      continues to be present with His people — including you,
                      right where you are.
                    </p>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-8 shadow-sm">
                  <svg
                    className="w-12 h-12 text-[#1a6fb5] mb-6"
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
                  <blockquote className="font-display text-xl md:text-2xl text-[#0a1a2f] font-[800] leading-relaxed mb-4">
                    &ldquo;And surely I am with you always, to the very end of
                    the age.&rdquo;
                  </blockquote>
                  <cite className="text-[#1a6fb5] font-body font-bold not-italic">
                    — Matthew 28:20
                  </cite>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Section 4: What This Means ── */}
      <section id="values" className="bg-[#0a1a2f] text-white py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <ScrollReveal>
              <span className="text-[#00d4ff] font-body font-bold tracking-[0.15em] uppercase text-sm">
                God&apos;s Constant Presence
              </span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-[900] mt-4 tracking-tight">
                What This Means for You
              </h2>
            </ScrollReveal>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: (
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                ),
                title: "You Are Never Alone",
                description:
                  "In your brightest moments and darkest valleys, Emmanuel — God with us — is right there beside you.",
              },
              {
                icon: (
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                ),
                title: "You Are Deeply Loved",
                description:
                  "The God of the universe chose to be with you. Not watching from a distance, but intimately present in your life.",
              },
              {
                icon: (
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                ),
                title: "His Presence Is Eternal",
                description:
                  "The Lord IS — present tense, always. His faithfulness extends to every generation, including yours.",
              },
            ].map((item, index) => (
              <ScrollReveal key={index} delay={index * 100}>
                <div className="bg-white/10 rounded-2xl p-8 hover:bg-white/15 transition-colors text-center h-full">
                  <div className="w-16 h-16 mx-auto rounded-xl bg-[#1a6fb5]/20 flex items-center justify-center text-[#00d4ff] mb-5">
                    {item.icon}
                  </div>
                  <h3 className="font-display text-xl font-[800] mb-3">
                    {item.title}
                  </h3>
                  <p className="text-white/70 font-body text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 5: Pastor Mike ── */}
      <section id="leaders" className="bg-[#f0f4f8] py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <ScrollReveal>
              <span className="text-[#1a6fb5] font-body font-bold tracking-[0.15em] uppercase text-sm">
                Meet the Pastor
              </span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-[900] text-[#0a1a2f] mt-4 tracking-tight">
                Pastor Mike
              </h2>
            </ScrollReveal>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-start">
            {/* Bio */}
            <ScrollReveal>
              <div className="space-y-5 text-[#4a6580] font-body leading-relaxed text-lg">
                <p>
                  Pastor Mike founded L.I.F.E. Ministry with a simple vision: to
                  create a welcoming space where people can experience
                  God&apos;s presence together, no matter where they are in the
                  world.
                </p>
                <p>
                  With a heart for teaching and a passion for authentic
                  connection, Pastor Mike brings Scripture to life in a way
                  that&apos;s accessible, practical, and filled with warmth. His
                  conversational style makes everyone feel like family.
                </p>
                <p>
                  Beyond Sunday services, you can find Pastor Mike sharing daily
                  encouragement on TikTok and Instagram, where he connects with
                  thousands through short, powerful messages of faith and hope.
                </p>
              </div>
            </ScrollReveal>

            {/* TikTok Embed Placeholder */}
            <ScrollReveal delay={150}>
              <div className="bg-[#0a1a2f] rounded-2xl p-8 flex flex-col items-center justify-center min-h-[340px] text-center">
                {/* TikTok Icon */}
                <svg
                  className="w-16 h-16 text-white/60 mb-6"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V9.17a8.16 8.16 0 004.76 1.52v-3.4a4.85 4.85 0 01-1-.6z" />
                </svg>
                <p className="text-white/40 font-body text-sm mb-4">
                  TikTok Video Coming Soon
                </p>
                <a
                  href="https://www.tiktok.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[#00d4ff] font-body text-sm font-bold hover:text-white transition-colors"
                >
                  Follow on TikTok
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </a>
              </div>
            </ScrollReveal>
          </div>

          {/* Quote */}
          <ScrollReveal delay={200}>
            <blockquote className="mt-16 max-w-3xl mx-auto text-center">
              <p className="font-display text-3xl md:text-4xl text-[#0a1a2f] font-[800] leading-[1.3] italic">
                &ldquo;God is with you right now, right where you are.
                That&apos;s not just a nice thought — it&apos;s the truth that
                changes everything.&rdquo;
              </p>
              <cite className="block mt-6 text-[#1a6fb5] font-body font-bold not-italic text-lg">
                — Pastor Mike
              </cite>
            </blockquote>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Section 6: Contact Info ── */}
      <section id="contact" className="bg-[#fafcff] py-24 md:py-32">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <ScrollReveal>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-[900] text-[#0a1a2f] tracking-tight">
                Get in Touch
              </h2>
              <p className="text-[#4a6580] font-body text-lg mt-5 max-w-xl mx-auto">
                We&apos;d love to hear from you. Reach out any time.
              </p>
            </ScrollReveal>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {/* Email */}
            <ScrollReveal>
              <div className="bg-[#f0f4f8] rounded-2xl p-8 text-center">
                <div className="w-14 h-14 mx-auto rounded-xl bg-[#1a6fb5]/10 flex items-center justify-center text-[#1a6fb5] mb-4">
                  <svg
                    className="w-7 h-7"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="font-display text-lg font-[800] text-[#0a1a2f] mb-1">
                  Email
                </h3>
                <p className="text-[#4a6580] font-body text-sm">ministry@lifeministy.org</p>
              </div>
            </ScrollReveal>

            {/* Phone */}
            <ScrollReveal delay={100}>
              <div className="bg-[#f0f4f8] rounded-2xl p-8 text-center">
                <div className="w-14 h-14 mx-auto rounded-xl bg-[#1a6fb5]/10 flex items-center justify-center text-[#1a6fb5] mb-4">
                  <svg
                    className="w-7 h-7"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                </div>
                <h3 className="font-display text-lg font-[800] text-[#0a1a2f] mb-1">
                  Phone
                </h3>
                <p className="text-[#4a6580] font-body text-sm">(555) 123-4567</p>
              </div>
            </ScrollReveal>

            {/* Social */}
            <ScrollReveal delay={200}>
              <div className="bg-[#f0f4f8] rounded-2xl p-8 text-center">
                <div className="w-14 h-14 mx-auto rounded-xl bg-[#1a6fb5]/10 flex items-center justify-center text-[#1a6fb5] mb-4">
                  <svg
                    className="w-7 h-7"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M18 8a6 6 0 01-6 6M6 8a6 6 0 006 6m-6-6a6 6 0 0112 0M6 8c0 1 .6 3.4 6 6m6-6c0 1-.6 3.4-6 6M12 2v2m0 16v2"
                    />
                  </svg>
                </div>
                <h3 className="font-display text-lg font-[800] text-[#0a1a2f] mb-1">
                  Social
                </h3>
                <div className="flex items-center justify-center gap-3 mt-2">
                  <a
                    href="#"
                    className="text-[#4a6580] hover:text-[#1a6fb5] font-body text-sm font-semibold transition-colors"
                  >
                    TikTok
                  </a>
                  <span className="text-[#c8dded]">|</span>
                  <a
                    href="#"
                    className="text-[#4a6580] hover:text-[#1a6fb5] font-body text-sm font-semibold transition-colors"
                  >
                    Instagram
                  </a>
                  <span className="text-[#c8dded]">|</span>
                  <a
                    href="#"
                    className="text-[#4a6580] hover:text-[#1a6fb5] font-body text-sm font-semibold transition-colors"
                  >
                    YouTube
                  </a>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── Section 7: Beliefs ── */}
      <section id="beliefs" className="bg-[#fafcff] py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <ScrollReveal>
              <span className="text-[#1a6fb5] font-body font-bold tracking-[0.15em] uppercase text-sm">
                Our Foundation
              </span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-[900] text-[#0a1a2f] mt-4 tracking-tight">
                What We Believe
              </h2>
            </ScrollReveal>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {beliefs.map((belief, index) => (
              <ScrollReveal key={index} delay={index * 80}>
                <div className="bg-white rounded-2xl p-8 hover:shadow-xl transition-shadow h-full">
                  <span className="text-[#1a6fb5] font-display text-5xl font-[900] leading-none">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-display text-xl font-[800] text-[#0a1a2f] mt-4 mb-3">
                    {belief.title}
                  </h3>
                  <p className="text-[#4a6580] font-body text-sm leading-relaxed">
                    {belief.description}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 8: FAQ ── */}
      <section id="faq" className="bg-[#fafcff] py-24 md:py-32">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <ScrollReveal>
              <span className="text-[#1a6fb5] font-body font-bold tracking-[0.15em] uppercase text-sm">
                Common Questions
              </span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-[900] text-[#0a1a2f] mt-4 tracking-tight">
                FAQs
              </h2>
            </ScrollReveal>
          </div>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <ScrollReveal key={index} delay={index * 80}>
                <div className="bg-[#f0f4f8] rounded-2xl p-8">
                  <h3 className="font-display text-lg font-[800] text-[#0a1a2f] mb-3">
                    {faq.q}
                  </h3>
                  <p className="text-[#4a6580] font-body leading-relaxed">{faq.a}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 9: CTA ── */}
      <section className="bg-[#f0f4f8] py-24 md:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <ScrollReveal>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-[900] text-[#0a1a2f] mb-8 tracking-tight">
              Experience God&apos;s Presence With Us
            </h2>
            <p className="text-[#4a6580] font-body text-lg mb-12 max-w-2xl mx-auto">
              L.I.F.E. Ministry is a place where you can encounter the God who
              is forever Emmanuel — forever with us. Join us this Sunday and
              experience His presence in community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button href="/watch" size="lg">
                Join This Sunday
              </Button>
              <Button href="/connect" variant="outline" size="lg">
                Submit a Prayer Request
              </Button>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
