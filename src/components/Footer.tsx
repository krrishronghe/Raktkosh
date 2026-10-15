import Link from "next/link";
import {
  Droplet,
  ShieldCheck,
  Activity,
  PhoneCall,
  Award,
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 dark:border-white/10 bg-white/70 dark:bg-[#0D0B0C]/80 backdrop-blur-xl transition-colors">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Col 1: System Bio-Vault Identity */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#E50914] to-[#7A0A10] shadow-md shadow-red-600/30">
                <Droplet className="h-4 w-4 fill-white text-white" />
              </div>
              <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                RAKT<span className="text-[#E50914]">KOSH</span>
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              Advanced Clinical Blood Bank Management System & Transfusion Protocol Workstation.
              Engineered with MongoDB 8.3 ACID transactions, real-time cryogenic inventory telemetry, and bi-directional donor registries.
            </p>
            <div className="flex items-center space-x-2 text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
              <Activity className="h-3.5 w-3.5 animate-pulse" />
              <span>MongoDB Engine: Connected & Indexed</span>
            </div>
          </div>

          {/* Col 2: Clinical Accreditations & Standards */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center">
              <Award className="h-3.5 w-3.5 mr-1.5 text-[#E50914]" />
              Transfusion Protocols
            </h4>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-zinc-400">
              <li className="flex items-center space-x-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span>WHO Cold Chain Protocol (2°C – 6°C)</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span>NABH Transfusion Safety Standards</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span>ISO 15189 Medical Lab Compliance</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span>Erythrocyte Cross-Match Validation</span>
              </li>
            </ul>
          </div>

          {/* Col 3: Core Operating Modules */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              System Modules
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link
                  href="/donors"
                  className="text-slate-600 dark:text-zinc-400 hover:text-[#E50914] dark:hover:text-white transition-colors"
                >
                  Voluntary Donor Registry (DNR)
                </Link>
              </li>
              <li>
                <Link
                  href="/inventory"
                  className="text-slate-600 dark:text-zinc-400 hover:text-[#E50914] dark:hover:text-white transition-colors"
                >
                  Cold Vault Stock & Expiry Telemetry
                </Link>
              </li>
              <li>
                <Link
                  href="/requests"
                  className="text-slate-600 dark:text-zinc-400 hover:text-[#E50914] dark:hover:text-white transition-colors"
                >
                  Hospital Requisition & Triage Queue
                </Link>
              </li>
              <li>
                <Link
                  href="/donations"
                  className="text-slate-600 dark:text-zinc-400 hover:text-[#E50914] dark:hover:text-white transition-colors"
                >
                  Collection Session Audit Logs
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Emergency Transfusion Hotline & ADBMS Info */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center">
              <PhoneCall className="h-3.5 w-3.5 mr-1.5 text-[#E50914]" />
              Emergency Transfusion Desk
            </h4>
            <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs">
              <div className="text-[11px] font-bold uppercase text-[#E50914]">24/7 Red Cell Response</div>
              <div className="text-sm font-black font-mono text-slate-900 dark:text-white mt-0.5">
                1800-RAKT-247
              </div>
              <div className="text-[10px] text-slate-500 dark:text-zinc-400 mt-1">
                Direct dispatch to trauma centers & ICU wards.
              </div>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-zinc-500">
              Station ID: <span className="font-mono font-bold text-slate-700 dark:text-zinc-300">BLD-MUM-NODE-1</span>
            </div>
          </div>
        </div>

        {/* Bottom Banner */}
        <div className="mt-12 pt-6 border-t border-slate-200 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-zinc-500">
          <div className="flex items-center space-x-1">
            <span>Raktkosh Transfusion OS</span>
            <span>•</span>
            <span>ADBMS Academic Capstone</span>
            <span>•</span>
            <span>MongoDB 8.3 & Next.js 15</span>
          </div>

          <div className="flex items-center space-x-2">
            <span>Designed & Engineered by</span>
            <strong className="text-slate-800 dark:text-zinc-300 font-semibold">
              Krrish Ronghe & Team
            </strong>
          </div>
        </div>
      </div>
    </footer>
  );
}
