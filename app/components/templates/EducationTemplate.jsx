"use client";

import React from "react";
import { Search, Menu, BookOpen, GraduationCap, Users, PlayCircle, CheckCircle2 } from "lucide-react";
import AdSlot from "../AdSlot";
import { generateTemplateContent } from "../../lib/templateContent";

export default function EducationTemplate({
  topSlots,
  leftSlots,
  rightSlots,
  contentSlots,
  bottomSlots,
  activeSlotId,
  slotCreativeMap,
  showSlotLabels,
  isMobile,
}) {
  const adSlotProps = { activeSlotId, slotCreativeMap, showSlotLabels, isMobile };
  const content = generateTemplateContent("education");

  return (
    <div
      className={`relative bg-slate-50 shadow-2xl overflow-hidden transition-all duration-500 flex flex-col font-sans ${
        isMobile ? "rounded-[2rem] border-[8px] border-slate-300" : "rounded-xl border border-slate-200"
      }`}
      style={{ 
        width: isMobile ? 375 : 1200, 
        minHeight: isMobile ? 812 : 900 
      }}
    >
      {/* ── EDUCATION HEADER ── */}
      <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="flex items-center justify-between px-4 md:px-8 py-4">
          <div className="flex items-center gap-4">
            <Menu className="text-slate-600 cursor-pointer hover:text-blue-600 transition" size={24} />
            <div className="flex items-center gap-2 text-blue-700">
              <GraduationCap size={28} />
              <span className="text-xl font-black tracking-tight">SkillForge</span>
            </div>
          </div>
          
          {!isMobile && (
            <div className="flex-1 max-w-xl mx-8 relative">
              <input 
                type="text" 
                placeholder="What do you want to learn?" 
                className="w-full py-2.5 pl-10 pr-4 rounded-full border border-slate-300 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
              <Search className="absolute left-4 top-3 text-slate-400" size={16} />
            </div>
          )}

          <div className="flex items-center gap-4">
            <span className="hidden md:block text-sm font-semibold text-slate-600 hover:text-blue-600 cursor-pointer">Teach on SkillForge</span>
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold border border-blue-200 cursor-pointer">
              JD
            </div>
          </div>
        </div>
      </header>

      {/* ── TOP BANNER ZONE ── */}
      {topSlots.length > 0 && (
        <div className="w-full bg-white border-b border-slate-200 py-4 flex flex-col items-center">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1 font-semibold">Advertisement</p>
          {topSlots.map((slotDef) => <AdSlot key={slotDef.id} slotDef={slotDef} {...adSlotProps} />)}
        </div>
      )}

      {/* ── MAIN LAYOUT WRAPPER ── */}
      <div className={`flex flex-1 ${isMobile ? 'flex-col px-4 py-6' : 'flex-row px-8 py-8 gap-8'} w-full max-w-[1200px] mx-auto`}>
        
        {/* ── LEFT RAIL ZONE (Dashboard Nav) ── */}
        {!isMobile && (
          <aside className="w-[200px] flex-shrink-0 flex flex-col gap-8">
            <nav className="flex flex-col gap-2">
              <div className="px-4 py-2 bg-blue-50 text-blue-700 font-bold rounded-lg flex items-center gap-3 cursor-pointer">
                <BookOpen size={18} /> My Learning
              </div>
              {['Recommendations', 'Skill Paths', 'Certifications', 'Saved Courses'].map((item) => (
                <div key={item} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg flex items-center gap-3 cursor-pointer transition">
                  {item}
                </div>
              ))}
            </nav>
            
            {leftSlots.length > 0 && (
              <div className="flex flex-col gap-4 sticky top-32">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest text-center font-semibold">Advertisement</p>
                {leftSlots.map((slotDef) => <AdSlot key={slotDef.id} slotDef={slotDef} {...adSlotProps} />)}
              </div>
            )}
          </aside>
        )}

        {/* ── CENTER CONTENT ZONE ── */}
        <main className="flex-1 flex flex-col min-w-0">
          
          <div className="mb-10 bg-gradient-to-br from-blue-900 to-indigo-900 rounded-2xl p-8 md:p-10 text-white relative overflow-hidden shadow-lg">
            <div className="relative z-10 md:w-2/3">
              <h2 className="text-3xl md:text-4xl font-black mb-4 leading-tight">{content.hero.headline}</h2>
              <p className="text-blue-100 text-lg mb-6 leading-relaxed">{content.hero.subtitle}</p>
              <button className="bg-white text-blue-900 font-bold px-6 py-3 rounded-lg hover:bg-blue-50 transition shadow-md">
                Resume Learning
              </button>
            </div>
            {!isMobile && (
              <div className="absolute top-0 right-0 w-1/2 h-full opacity-30 mix-blend-overlay">
                <img src={content.hero.image} className="w-full h-full object-cover" alt="Hero" />
              </div>
            )}
          </div>

          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            Recommended for you
          </h3>
          
          <div className={`grid ${isMobile ? 'grid-cols-1 gap-6' : 'grid-cols-2 lg:grid-cols-3 gap-6'} mb-10`}>
            {content.courses.map((course, idx) => (
              <React.Fragment key={idx}>
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition group cursor-pointer flex flex-col">
                  <div className="w-full aspect-video bg-slate-100 relative overflow-hidden">
                    <img src={course.image} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                      <PlayCircle className="text-white" size={48} />
                    </div>
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <h4 className="font-bold text-slate-900 leading-tight mb-2 line-clamp-2">{course.title}</h4>
                    <p className="text-sm text-slate-500 mb-4">{course.instructor}</p>
                    <div className="mt-auto flex items-center text-xs font-semibold text-slate-500 gap-1 bg-slate-50 w-fit px-2 py-1 rounded">
                      <Users size={14} /> {(course.students / 1000).toFixed(1)}k students
                    </div>
                  </div>
                </div>

                {/* Inject Inline Ad every 3 courses */}
                {(idx + 1) % 3 === 0 && contentSlots[Math.floor(idx / 3)] && (
                  <div className="col-span-full w-full my-6 py-6 border-y border-slate-200 flex flex-col items-center bg-white shadow-sm rounded-xl">
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-3 font-semibold">Sponsored Advertisement</p>
                    <AdSlot
                      slotDef={contentSlots[Math.floor(idx / 3)]}
                      activeSlotId={activeSlotId}
                      slotCreativeMap={slotCreativeMap}
                      showSlotLabels={showSlotLabels}
                      isMobile={isMobile}
                    />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          <h3 className="text-xl font-bold text-slate-900 mb-6">Learning Paths</h3>
          <div className="bg-white rounded-xl border border-slate-200 p-6 flex items-center justify-between mb-8 shadow-sm cursor-pointer hover:border-blue-300 transition">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Become a Frontend Engineer</h4>
                <p className="text-sm text-slate-500">6 courses • 42 hours remaining</p>
              </div>
            </div>
            <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="w-[35%] h-full bg-blue-500 rounded-full"></div>
            </div>
          </div>

        </main>

        {/* ── RIGHT RAIL ZONE (Ads / Info) ── */}
        {!isMobile && rightSlots.length > 0 && (
          <aside className="w-[250px] flex-shrink-0 flex flex-col gap-6">
            <div className="flex flex-col gap-6 sticky top-32">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest text-center font-semibold">Advertisement</p>
              {rightSlots.map((slotDef) => <AdSlot key={slotDef.id} slotDef={slotDef} {...adSlotProps} />)}
            </div>
          </aside>
        )}
      </div>

      {/* ── MOBILE STICKY BOTTOM ZONE ── */}
      {bottomSlots.length > 0 && (
        <div className="w-full bg-white border-t border-slate-200 py-2 flex flex-col items-center justify-center sticky bottom-0 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
          <p className="text-[9px] text-slate-400 uppercase tracking-widest mb-1 font-semibold">Advertisement</p>
          {bottomSlots.map((slotDef) => <AdSlot key={slotDef.id} slotDef={slotDef} {...adSlotProps} />)}
        </div>
      )}
    </div>
  );
}
