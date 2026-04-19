"use client";

export default function TemplateRenderer({
  template,
  creative,
  showSlotLabels = false,
}) {
  const { type, name, size, content, slot } = template;

  const slotStyle = {
    position: "absolute",
    width: `${slot.width}px`,
    height: `${slot.height}px`,
    top: `${slot.top}px`,
    ...(slot.left != null ? { left: `${slot.left}px` } : {}),
    ...(slot.right != null ? { right: `${slot.right}px` } : {}),
  };

  const renderNews = () => (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            News
          </p>
          <h2 className="text-2xl font-bold text-slate-900">{content.headline}</h2>
        </div>
        <span className="text-sm text-slate-500">{name}</span>
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-6">
        <div className="space-y-4">
          <div className="rounded-3xl overflow-hidden bg-slate-200">
            <img
              src={content.image}
              alt={content.headline}
              className="w-full h-60 object-cover"
            />
          </div>
          <p className="text-sm text-slate-600">{content.subheadline}</p>
          <p className="text-sm text-slate-500">{content.summary}</p>
        </div>

        <div className="space-y-3 rounded-3xl border border-slate-200 p-4 bg-slate-50">
          <h3 className="text-sm uppercase tracking-[0.2em] text-slate-500">
            Trending
          </h3>
          <p className="font-semibold text-slate-900">
            The South after delimitation: Shah assures seats will increase
          </p>
          <p className="text-xs text-slate-500">
            Parliament buzzed with debate over India’s representational future.
          </p>
        </div>
      </div>
    </div>
  );

  const renderGaming = () => (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Gaming
          </p>
          <h2 className="text-2xl font-bold text-slate-900">{content.headline}</h2>
        </div>
        <span className="text-sm text-slate-500">{name}</span>
      </div>

      <div className="rounded-3xl overflow-hidden bg-slate-200">
        <img
          src={content.image}
          alt={content.headline}
          className="w-full h-72 object-cover"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <p className="text-sm text-slate-600">{content.subheadline}</p>
          <p className="text-sm text-slate-500">{content.summary}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 p-4 bg-slate-50">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Event
          </p>
          <p className="font-semibold text-slate-900">Live now: Arena Cup</p>
          <p className="text-xs text-slate-500">Join the ultimate squad challenge.</p>
        </div>
      </div>
    </div>
  );

  const renderEcommerce = () => (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            E-commerce
          </p>
          <h2 className="text-2xl font-bold text-slate-900">{content.headline}</h2>
        </div>
        <span className="text-sm text-slate-500">{name}</span>
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-6">
        <div className="space-y-4">
          <div className="rounded-3xl overflow-hidden bg-slate-200">
            <img
              src={content.image}
              alt={content.headline}
              className="w-full h-64 object-cover"
            />
          </div>
          <p className="text-sm text-slate-600">{content.subheadline}</p>
          <p className="text-sm text-slate-500">{content.summary}</p>
        </div>

        <div className="rounded-3xl border border-slate-200 p-4 bg-slate-50">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Offer
          </p>
          <p className="font-semibold text-slate-900">Free shipping over $49</p>
          <p className="text-xs text-slate-500">Limited-time promo across top categories.</p>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className="relative bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden"
      style={{ width: 980, minHeight: 760 }}
    >
      <div className="p-8 space-y-6">
        {type === "news" && renderNews()}
        {type === "gaming" && renderGaming()}
        {type === "ecommerce" && renderEcommerce()}
      </div>

      <div
        className="absolute rounded-3xl border border-dashed border-slate-300 bg-slate-100/80 overflow-hidden"
        style={slotStyle}
      >
        {showSlotLabels && (
          <div className="absolute top-2 left-2 z-10 rounded-full bg-slate-900/90 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-white">
            {size}
          </div>
        )}
        {creative ? (
          <img
            src={creative.url}
            alt={creative.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-200 text-slate-500 text-sm font-semibold">
            {size}
          </div>
        )}
      </div>
    </div>
  );
}