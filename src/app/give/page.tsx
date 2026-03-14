"use client";

import { useState } from "react";

const presetAmounts = [25, 50, 100, 250, 500];

const givingOptions = [
  {
    id: "tithe",
    name: "Tithe",
    description: "Regular giving to support the church's mission and ministry.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: "offering",
    name: "General Offering",
    description: "Above and beyond giving for special needs and projects.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    id: "missions",
    name: "Missions",
    description: "Support local and global mission efforts and outreach.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: "benevolence",
    name: "Benevolence Fund",
    description: "Help those in need within our church and community.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
];

export default function GivePage() {
  const [selectedOption, setSelectedOption] = useState("tithe");
  const [amount, setAmount] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState("monthly");

  const handleAmountSelect = (value: number) => {
    setAmount(value.toString());
    setCustomAmount("");
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setAmount("");
  };

  const displayAmount = customAmount || amount;

  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="bg-[#0a1a2f] text-white py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-[900] tracking-tight mb-6">
              GIVE GENEROUSLY
            </h1>
            <p className="text-white/70 text-lg md:text-xl max-w-2xl mx-auto font-body leading-relaxed">
              Your generosity fuels our mission to share God&apos;s love and build
              community. Every gift makes a difference.
            </p>
          </div>
        </div>
      </section>

      {/* Giving Form Section */}
      <section className="py-16 md:py-24 bg-[#fafcff]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Giving Options */}
            <div className="p-8 md:p-10 border-b border-[#c8dded]/30">
              <h2 className="text-2xl font-display font-[800] text-[#0a1a2f] mb-6">
                Choose a Fund
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {givingOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSelectedOption(option.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      selectedOption === option.id
                        ? "border-[#1a6fb5] bg-[#1a6fb5]/5"
                        : "border-[#c8dded]/50 hover:border-[#1a6fb5]/50"
                    }`}
                  >
                    <div
                      className={`mb-2 ${
                        selectedOption === option.id
                          ? "text-[#1a6fb5]"
                          : "text-[#4a6580]"
                      }`}
                    >
                      {option.icon}
                    </div>
                    <p
                      className={`font-body font-semibold text-sm ${
                        selectedOption === option.id
                          ? "text-[#1a6fb5]"
                          : "text-[#0a1a2f]"
                      }`}
                    >
                      {option.name}
                    </p>
                  </button>
                ))}
              </div>
              <p className="mt-4 text-sm text-[#4a6580] font-body">
                {givingOptions.find((o) => o.id === selectedOption)?.description}
              </p>
            </div>

            {/* Amount Selection */}
            <div className="p-8 md:p-10 border-b border-[#c8dded]/30">
              <h2 className="text-2xl font-display font-[800] text-[#0a1a2f] mb-6">
                Select Amount
              </h2>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-6">
                {presetAmounts.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => handleAmountSelect(preset)}
                    className={`py-3 px-4 rounded-lg font-body font-semibold transition-all ${
                      amount === preset.toString()
                        ? "bg-[#1a6fb5] text-white shadow-lg shadow-[#1a6fb5]/20"
                        : "bg-[#f0f4f8] text-[#0a1a2f] hover:bg-[#1a6fb5]/10"
                    }`}
                  >
                    ${preset}
                  </button>
                ))}
              </div>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4a6580] text-xl font-body">
                  $
                </span>
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                  placeholder="Other amount"
                  className="w-full pl-10 pr-4 py-4 rounded-lg border border-[#c8dded] focus:border-[#1a6fb5] focus:ring-2 focus:ring-[#1a6fb5]/20 outline-none transition-colors bg-[#fafcff] text-xl font-body text-[#0a1a2f]"
                />
              </div>
            </div>

            {/* Recurring Options */}
            <div className="p-8 md:p-10 border-b border-[#c8dded]/30">
              <div className="flex items-center gap-4 mb-6">
                <button
                  onClick={() => setIsRecurring(false)}
                  className={`px-6 py-3 rounded-lg font-body font-semibold transition-all ${
                    !isRecurring
                      ? "bg-[#1a6fb5] text-white shadow-lg shadow-[#1a6fb5]/20"
                      : "bg-[#f0f4f8] text-[#0a1a2f] hover:bg-[#1a6fb5]/10"
                  }`}
                >
                  One-Time Gift
                </button>
                <button
                  onClick={() => setIsRecurring(true)}
                  className={`px-6 py-3 rounded-lg font-body font-semibold transition-all ${
                    isRecurring
                      ? "bg-[#1a6fb5] text-white shadow-lg shadow-[#1a6fb5]/20"
                      : "bg-[#f0f4f8] text-[#0a1a2f] hover:bg-[#1a6fb5]/10"
                  }`}
                >
                  Recurring Gift
                </button>
              </div>

              {isRecurring && (
                <div className="animate-fade-in">
                  <label className="block text-sm font-body font-semibold text-[#0a1a2f] mb-2">
                    Frequency
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-[#c8dded] focus:border-[#1a6fb5] focus:ring-2 focus:ring-[#1a6fb5]/20 outline-none transition-colors bg-[#fafcff] font-body text-[#0a1a2f]"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Every 2 Weeks</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                  </select>
                </div>
              )}
            </div>

            {/* Summary and Submit */}
            <div className="p-8 md:p-10 bg-[#f0f4f8]">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <p className="text-[#4a6580] text-sm font-body">
                    {isRecurring ? `${frequency.charAt(0).toUpperCase() + frequency.slice(1)} gift to` : "One-time gift to"}
                  </p>
                  <p className="font-display text-xl font-[800] text-[#0a1a2f]">
                    {givingOptions.find((o) => o.id === selectedOption)?.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[#4a6580] text-sm font-body">Amount</p>
                  <p className="font-display text-3xl font-[900] text-[#1a6fb5]">
                    ${displayAmount || "0"}
                  </p>
                </div>
              </div>

              <button
                className="w-full bg-[#1a6fb5] text-white rounded-xl px-8 py-4 text-lg font-body font-bold hover:bg-[#145a94] transition-all shadow-lg shadow-[#1a6fb5]/20 disabled:opacity-50 disabled:cursor-not-allowed tracking-wide"
                disabled={!displayAmount || parseFloat(displayAmount) <= 0}
                onClick={() => alert("Stripe integration coming soon! This is a placeholder.")}
              >
                Continue to Payment
              </button>

              <div className="mt-6 flex items-center justify-center gap-2 text-sm text-[#4a6580] font-body">
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
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <span>Secure payment powered by Stripe</span>
              </div>
            </div>
          </div>

          {/* Notice */}
          <div className="mt-8 bg-[#1a6fb5]/10 rounded-xl p-6 text-center">
            <p className="text-[#4a6580] text-sm font-body">
              <strong className="text-[#0a1a2f]">Note:</strong> This is a demo payment form.
              Stripe integration will be configured with your account credentials before launch.
            </p>
          </div>
        </div>
      </section>

      {/* Why Give Section */}
      <section className="py-20 md:py-28 bg-[#f0f4f8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-[#1a6fb5] font-body font-bold tracking-widest uppercase text-sm">
              Stewardship
            </span>
            <h2 className="text-3xl md:text-5xl font-display font-[900] text-[#0a1a2f] mt-3">
              Where Your Gift Goes
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                ),
                title: "Ministry Operations",
                description: "Supporting our virtual gatherings, technology, and ministry resources.",
                percentage: "40%",
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                ),
                title: "Community Care",
                description: "Helping those in need through our benevolence fund and outreach programs.",
                percentage: "30%",
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: "Global Missions",
                description: "Partnering with missionaries and organizations around the world.",
                percentage: "30%",
              },
            ].map((item, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="w-16 h-16 mx-auto rounded-xl bg-[#f0f4f8] flex items-center justify-center text-[#1a6fb5] mb-5">
                  {item.icon}
                </div>
                <div className="text-4xl font-display font-[800] text-[#1a6fb5] mb-2">
                  {item.percentage}
                </div>
                <h3 className="font-display text-xl font-[800] text-[#0a1a2f] mb-2">
                  {item.title}
                </h3>
                <p className="text-[#4a6580] text-sm font-body">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Scripture Section */}
      <section className="py-20 md:py-28 bg-[#fafcff]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white rounded-2xl p-10 md:p-14 shadow-sm">
            <svg
              className="w-12 h-12 mx-auto mb-8 text-[#1a6fb5]"
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
            <blockquote className="text-2xl md:text-3xl font-display font-[800] text-[#0a1a2f] mb-6 leading-snug">
              &ldquo;Each of you should give what you have decided in your heart to give,
              not reluctantly or under compulsion, for God loves a cheerful giver.&rdquo;
            </blockquote>
            <cite className="text-[#1a6fb5] font-body font-bold text-lg not-italic">
              — 2 Corinthians 9:7
            </cite>
          </div>
        </div>
      </section>
    </div>
  );
}
