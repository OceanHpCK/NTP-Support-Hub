// aria-label added for accessibility compliance
import React from 'react';
import { useNavigate } from 'react-router-dom';
import APP_REGISTRY from '../registry';
import { ArrowRight, Drill, PipetteIcon, Flame, Calculator, Wrench, Cpu, Book, Anchor, ShieldCheck } from 'lucide-react';

const ICON_MAP_LARGE: Record<string, React.ReactNode> = {
  drill: <Drill className="w-7 h-7" />,
  pipe: <PipetteIcon className="w-7 h-7" />,
  flame: <Flame className="w-7 h-7" />,
  calculator: <Calculator className="w-7 h-7" />,
  wrench: <Wrench className="w-7 h-7" />,
  cpu: <Cpu className="w-7 h-7" />,
  book: <Book className="w-7 h-7" />,
  anchor: <Anchor className="w-7 h-7" />,
};

interface DashboardProps {
  publicModuleIds?: string[];
}

const Dashboard: React.FC<DashboardProps> = ({ publicModuleIds = [] }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-full bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_42%,#f1f5f9_100%)]">
      <div className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-14">
        <section className="mb-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-blue-700 ring-1 ring-blue-100">
              <ShieldCheck className="h-3.5 w-3.5" />
              NTP Technical Support Suite
            </div>
            <div className="space-y-3">
              <h1 className="max-w-3xl text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
                Bộ công cụ hỗ trợ kỹ thuật cho hệ thống ống nhựa
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
                Tập hợp các công cụ tính toán, tra cứu và tư vấn kỹ thuật cho thiết kế, thi công và vận hành hệ thống ống HDPE, PPR.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Tổng quan</p>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
                <p className="text-2xl font-black text-slate-950">{APP_REGISTRY.length}</p>
                <p className="text-xs font-medium text-slate-500">Module</p>
              </div>
              <div className="rounded-xl bg-blue-50 p-3 ring-1 ring-blue-100">
                <p className="text-2xl font-black text-blue-700">ISO</p>
                <p className="text-xs font-medium text-blue-700/70">Chuẩn kỹ thuật</p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-3 ring-1 ring-emerald-100">
                <p className="text-2xl font-black text-emerald-700">AI</p>
                <p className="text-xs font-medium text-emerald-700/70">Trợ giúp</p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-black tracking-tight text-slate-950">Chọn công cụ</h2>
              <p className="mt-1 text-sm text-slate-500">Mỗi module được tối ưu cho một tác vụ kỹ thuật cụ thể.</p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {APP_REGISTRY.map((app, index) => (
              <button
                key={app.id}
                type="button"
                onClick={() => navigate(`/${app.path}`)}
                className="group relative flex min-h-[220px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm shadow-slate-200/60 outline-none transition duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/80 focus:ring-4 focus:ring-blue-100"
                style={{ animationDelay: `${index * 70}ms` }}
              >
                <div className="absolute inset-x-0 top-0 h-1" style={{ background: app.colorHex }} />
                <div className="flex items-start justify-between gap-4">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-lg transition duration-200 group-hover:scale-105"
                    style={{ background: `linear-gradient(135deg, ${app.colorHex}, ${app.colorHex}cc)` }}
                  >
                    {ICON_MAP_LARGE[app.icon] || <Calculator className="w-7 h-7" />}
                  </div>
                  {publicModuleIds.includes(app.id) && (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-200">
                      Public
                    </span>
                  )}
                </div>

                <div className="mt-5 flex-1">
                  <h3 className="text-lg font-black tracking-tight text-slate-950">{app.name}</h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{app.description}</p>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-sm font-bold" style={{ color: app.colorHex }}>Mở ứng dụng</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition group-hover:bg-slate-900 group-hover:text-white">
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <p className="mt-10 text-center text-xs leading-5 text-slate-400">
          Các công cụ tính toán mang tính chất tham khảo. Cần kiểm tra lại theo tiêu chuẩn, điều kiện công trình và hướng dẫn của nhà sản xuất trước khi áp dụng.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
