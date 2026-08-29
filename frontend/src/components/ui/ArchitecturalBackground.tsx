import React from "react";

export const ArchitecturalBackground: React.FC = () => {
  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none"
      aria-hidden="true"
    >
      {/* 1. CAD / Blueprint Technical 100px Drafting Grid */}
      <div className="absolute inset-0 blueprint-lines opacity-70 dark:opacity-50" />

      {/* 2. Primary SMART BUILD Architectural Identity Watermark */}
      <div className="absolute top-[18%] -right-[5%] sm:right-[2%] flex flex-col items-end pointer-events-none select-none opacity-[0.06] dark:opacity-[0.09] transform -rotate-6">
        <div className="flex items-center gap-3 text-[10px] sm:text-xs font-mono font-bold tracking-[0.4em] uppercase text-slate-900 dark:text-slate-100 mb-1">
          <span>ARCHITECTURAL ERP SYSTEM</span>
          <span>•</span>
          <span>SPECIFICATION DWG 01-A</span>
        </div>
        <span className="text-7xl sm:text-9xl lg:text-[11rem] font-black font-display tracking-[0.18em] uppercase text-slate-900 dark:text-slate-100 whitespace-nowrap text-right leading-none">
          SMART BUILD
        </span>
        <div className="flex items-center gap-4 text-[9px] sm:text-[11px] font-mono font-medium tracking-[0.3em] uppercase text-slate-700 dark:text-slate-300 mt-2">
          <span>STRUCTURAL AXIS A–Z</span>
          <span>•</span>
          <span>ELEVATION +120.00M</span>
          <span>•</span>
          <span>SCALE 1:100</span>
        </div>
        <div className="w-full h-[2px] bg-slate-400 dark:bg-slate-500 mt-3 opacity-60" />
      </div>

      {/* 3. Restrained 2.5D Construction Structural Motion (Continuous Bottom -> Top) */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Structural Truss Column 1 (Left Flank) */}
        <div
          className="absolute left-[4%] sm:left-[7%] bottom-0 w-16 sm:w-20 h-[650px] border-l border-r border-brand-500/25 dark:border-brand-400/20 animate-structural-rise-slow"
          style={{ animationDelay: "0s" }}
        >
          {/* Internal diagonal lattice bracing */}
          <svg className="w-full h-full text-brand-500/20 dark:text-brand-400/15" preserveAspectRatio="none" viewBox="0 0 40 400">
            <path d="M0,0 L40,40 M40,0 L0,40 M0,40 L40,80 M40,40 L0,80 M0,80 L40,120 M40,80 L0,120 M0,120 L40,160 M40,120 L0,160 M0,160 L40,200 M40,160 L0,200 M0,200 L40,240 M40,200 L0,240 M0,240 L40,280 M40,240 L0,280 M0,280 L40,320 M40,280 L0,320 M0,320 L40,360 M40,320 L0,360 M0,360 L40,400 M40,360 L0,400" stroke="currentColor" strokeWidth="1" fill="none" />
          </svg>
          <div className="absolute top-4 left-1.5 text-[9px] font-mono font-bold text-brand-700/50 dark:text-brand-300/40 whitespace-nowrap">
            ▲ EL +48.00m
          </div>
        </div>

        {/* Elevation Plumb Line 2 (Left Center) */}
        <div
          className="absolute left-[26%] bottom-0 w-[1px] h-[520px] bg-gradient-to-t from-transparent via-brand-600/30 dark:via-brand-400/25 to-transparent animate-structural-rise-med"
          style={{ animationDelay: "6s" }}
        >
          <div className="absolute top-12 -left-6 px-1.5 py-0.5 rounded bg-brand-100/50 dark:bg-brand-950/50 text-[9px] font-mono font-semibold text-brand-700/60 dark:text-brand-300/60 border border-brand-300/40 dark:border-brand-700/40">
            GRID 04-A
          </div>
        </div>

        {/* Isometric Structural Beam Frame (Center) */}
        <div
          className="absolute left-[48%] bottom-0 w-12 h-12 border border-slate-400/25 dark:border-slate-500/20 rotate-45 animate-structural-rise-slow"
          style={{ animationDelay: "14s" }}
        >
          <div className="absolute inset-1 border border-dashed border-slate-400/20 dark:border-slate-500/15" />
        </div>

        {/* Structural Column 4 (Right Center) */}
        <div
          className="absolute right-[22%] bottom-0 w-[1px] h-[560px] bg-gradient-to-t from-transparent via-slate-500/30 dark:via-slate-400/25 to-transparent animate-structural-rise-fast"
          style={{ animationDelay: "3s" }}
        >
          <div className="absolute top-24 -left-7 px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800/60 text-[9px] font-mono font-semibold text-slate-700/60 dark:text-slate-300/60 border border-slate-300/50 dark:border-slate-700/50">
            ▲ BEAM B-08
          </div>
        </div>

        {/* Structural Truss Column 5 (Right Flank) */}
        <div
          className="absolute right-[4%] sm:right-[6%] bottom-0 w-16 sm:w-20 h-[680px] border-l border-r border-slate-400/25 dark:border-slate-600/20 animate-structural-rise-slow"
          style={{ animationDelay: "10s" }}
        >
          <svg className="w-full h-full text-slate-400/20 dark:text-slate-500/20" preserveAspectRatio="none" viewBox="0 0 50 400">
            <path d="M0,0 L50,50 M50,0 L0,50 M0,50 L50,100 M50,50 L0,100 M0,100 L50,150 M50,100 L0,150 M0,150 L50,200 M50,150 L0,200 M0,200 L50,250 M50,200 L0,250 M0,250 L50,300 M50,250 L0,300 M0,300 L50,350 M50,300 L0,350 M0,350 L50,400 M50,350 L0,400" stroke="currentColor" strokeWidth="1" fill="none" />
          </svg>
          <div className="absolute top-6 left-1.5 text-[9px] font-mono font-bold text-slate-600/60 dark:text-slate-400/50 whitespace-nowrap">
            ▲ COL R-12
          </div>
        </div>
      </div>

      {/* 4. Coordinate Crosshairs at Fixed Technical Intervals */}
      <div className="absolute inset-0 grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-32 p-8 opacity-40 dark:opacity-30">
        {Array.from({ length: 24 }).map((_, i) => (
          <div key={i} className="relative w-4 h-4 text-slate-400 dark:text-slate-500 font-mono text-[10px] font-bold flex items-center justify-center">
            +
          </div>
        ))}
      </div>
    </div>
  );
};

export default ArchitecturalBackground;
