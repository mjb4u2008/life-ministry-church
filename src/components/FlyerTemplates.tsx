"use client";

export interface FlyerData {
  headline: string;
  subheadline: string;
  scripture_text: string;
  scripture_ref: string;
  details: string;
  tagline: string;
}

interface FlyerTemplateProps {
  data: FlyerData;
  template: 1 | 2 | 3;
}

function WaterCrossWatermark() {
  return (
    <svg
      viewBox="0 0 200 260"
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] opacity-[0.06]"
      fill="currentColor"
    >
      <rect x="85" y="10" width="30" height="240" rx="4" />
      <rect x="25" y="70" width="150" height="30" rx="4" />
      <path
        d="M100 220 C80 200, 60 210, 50 230 C40 250, 60 260, 100 260 C140 260, 160 250, 150 230 C140 210, 120 200, 100 220Z"
        opacity="0.7"
      />
    </svg>
  );
}

function LivingWaterTemplate({ data }: { data: FlyerData }) {
  return (
    <div
      className="relative w-[540px] h-[540px] overflow-hidden flex flex-col items-center justify-center text-center px-12"
      style={{
        background: "linear-gradient(180deg, #e8f4fd 0%, #ffffff 100%)",
      }}
    >
      <WaterCrossWatermark />

      {/* Ministry name */}
      <p className="relative z-10 text-xs font-medium tracking-[0.3em] uppercase text-water-dark mb-1">
        L.I.F.E. Ministry
      </p>
      <p className="relative z-10 text-[10px] tracking-[0.15em] uppercase text-text-light mb-8">
        Lord Is Forever Emmanuel
      </p>

      {/* Headline */}
      <h1 className="relative z-10 font-display text-4xl font-bold text-deep leading-tight mb-4">
        {data.headline}
      </h1>

      {/* Subheadline */}
      <p className="relative z-10 text-lg text-water font-medium mb-8">
        {data.subheadline}
      </p>

      {/* Scripture */}
      <div className="relative z-10 mb-8 max-w-[420px]">
        <p className="font-display italic text-base text-deep/80 leading-relaxed">
          &ldquo;{data.scripture_text}&rdquo;
        </p>
        <p className="text-sm text-water-dark font-medium mt-2">
          {data.scripture_ref}
        </p>
      </div>

      {/* Details */}
      <p className="relative z-10 text-xs tracking-[0.15em] uppercase text-text-body mb-4">
        {data.details}
      </p>

      {/* Tagline */}
      <p className="relative z-10 text-sm text-water font-medium italic">
        {data.tagline}
      </p>
    </div>
  );
}

function CleanLightTemplate({ data }: { data: FlyerData }) {
  return (
    <div className="relative w-[540px] h-[540px] overflow-hidden bg-white flex flex-col justify-center px-16">
      {/* Left accent line */}
      <div
        className="absolute left-10 top-16 bottom-16 w-[4px] rounded-full"
        style={{ background: "linear-gradient(180deg, #3b9dd9 0%, #00d4ff 100%)" }}
      />

      {/* Ministry name */}
      <p className="text-xs font-medium tracking-[0.3em] uppercase text-water-dark mb-1 ml-6">
        L.I.F.E. Ministry
      </p>
      <p className="text-[10px] tracking-[0.15em] uppercase text-text-light mb-8 ml-6">
        Lord Is Forever Emmanuel
      </p>

      {/* Headline */}
      <h1 className="font-display text-4xl font-bold text-deep leading-tight mb-4 ml-6">
        {data.headline}
      </h1>

      {/* Subheadline */}
      <p className="text-base text-text-body mb-6 ml-6">
        {data.subheadline}
      </p>

      {/* Scripture block */}
      <div className="bg-sky/60 rounded-lg p-5 mb-6 ml-6 mr-2">
        <p className="font-display italic text-base text-deep/80 leading-relaxed">
          &ldquo;{data.scripture_text}&rdquo;
        </p>
        <p className="text-sm text-water-dark font-medium mt-2">
          {data.scripture_ref}
        </p>
      </div>

      {/* Details */}
      <p className="text-xs tracking-[0.12em] uppercase text-text-body mb-3 ml-6">
        {data.details}
      </p>

      {/* Tagline */}
      <p className="text-sm text-water font-medium ml-6">
        {data.tagline}
      </p>
    </div>
  );
}

function BoldSkyTemplate({ data }: { data: FlyerData }) {
  return (
    <div
      className="relative w-[540px] h-[540px] overflow-hidden flex flex-col items-center justify-center text-center px-14"
      style={{
        background: "linear-gradient(160deg, #1a5276 0%, #0c2d48 100%)",
      }}
    >
      {/* Ministry name */}
      <p className="text-xs font-medium tracking-[0.3em] uppercase text-white/70 mb-1">
        L.I.F.E. Ministry
      </p>
      <p className="text-[10px] tracking-[0.15em] uppercase text-white/40 mb-8">
        Lord Is Forever Emmanuel
      </p>

      {/* Headline */}
      <h1 className="font-display text-4xl font-bold text-white leading-tight mb-4">
        {data.headline}
      </h1>

      {/* Subheadline */}
      <p className="text-lg text-white/80 font-medium mb-6">
        {data.subheadline}
      </p>

      {/* Cyan accent line */}
      <div className="w-16 h-[3px] bg-cyan rounded-full mb-6" />

      {/* Scripture */}
      <div className="mb-8 max-w-[420px]">
        <p className="font-display italic text-base text-white/80 leading-relaxed">
          &ldquo;{data.scripture_text}&rdquo;
        </p>
        <p className="text-sm text-cyan font-medium mt-2">
          {data.scripture_ref}
        </p>
      </div>

      {/* Details */}
      <p className="text-xs tracking-[0.15em] uppercase text-white/60 mb-4">
        {data.details}
      </p>

      {/* Tagline */}
      <p className="text-sm text-cyan/90 font-medium italic">
        {data.tagline}
      </p>
    </div>
  );
}

export default function FlyerTemplate({ data, template }: FlyerTemplateProps) {
  switch (template) {
    case 1:
      return <LivingWaterTemplate data={data} />;
    case 2:
      return <CleanLightTemplate data={data} />;
    case 3:
      return <BoldSkyTemplate data={data} />;
    default:
      return <LivingWaterTemplate data={data} />;
  }
}
