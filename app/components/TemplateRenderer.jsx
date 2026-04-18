"use client";

export default function TemplateRenderer({ template, creative }) {
  return (
    <div className="relative w-[1280px] h-[720px] mx-auto bg-white rounded-2xl shadow-xl overflow-hidden text-black">

      {/* HEADER */}
      <div className="absolute top-0 left-0 w-full h-14 bg-gray-100 flex items-center justify-between px-6 text-sm border-b">
        <span>September 2030</span>
        <span className="font-bold text-lg">Adigator News</span>
        <span>USA</span>
      </div>

      {/* CONTENT */}
      <div className="pt-16 px-6 grid grid-cols-3 gap-6">

        {/* LEFT MAIN NEWS */}
        <div className="col-span-2 space-y-4">

          <h1 className="text-2xl font-bold leading-snug">
            Lebanon-Israel ceasefire talks begin as global tensions rise
          </h1>

          <img
            src="https://source.unsplash.com/800x400/?politics,conference"
            alt=""
            className="w-full h-64 object-cover rounded-lg"
          />

          <p className="text-sm text-gray-700">
            World leaders have initiated high-level discussions to stabilize
            the region. Analysts say this could impact global oil prices and
            international trade dynamics in the coming weeks.
          </p>

          {/* SUB NEWS GRID */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <img src="https://source.unsplash.com/200x200/?economy" className="h-20 w-full object-cover rounded" />
              <p className="text-xs mt-1">Markets react to global uncertainty</p>
            </div>

            <div>
              <img src="https://source.unsplash.com/200x200/?technology" className="h-20 w-full object-cover rounded" />
              <p className="text-xs mt-1">AI adoption grows in advertising</p>
            </div>

            <div>
              <img src="https://source.unsplash.com/200x200/?energy" className="h-20 w-full object-cover rounded" />
              <p className="text-xs mt-1">Energy sector sees price surge</p>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="space-y-4">

          <div>
            <img src="https://source.unsplash.com/300x150/?government" className="rounded" />
            <p className="text-xs mt-1">
              Policy changes expected to affect global trade
            </p>
          </div>

          <div>
            <img src="https://source.unsplash.com/300x150/?sports,stadium" className="rounded" />
            <p className="text-xs mt-1">
              Sports sponsorship spending reaches new high
            </p>
          </div>

          <div>
            <img src="https://source.unsplash.com/300x150/?finance,stock" className="rounded" />
            <p className="text-xs mt-1">
              Stock markets show mixed reactions worldwide
            </p>
          </div>

        </div>
      </div>

      {/* 🎯 AD SLOT */}
      <div
        className="absolute bg-gray-200 flex items-center justify-center overflow-hidden"
        style={{
          width: template.slot.width,
          height: template.slot.height,
          top: template.slot.top,
          left: template.slot.left,
          right: template.slot.right
        }}
      >
        {creative ? (
          <img
            src={creative.url}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-xs text-gray-500">
            Ad Slot ({template.size})
          </span>
        )}
      </div>

    </div>
  );
}