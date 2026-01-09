export default function GlobalOverviewPage() {
  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold text-gray-900">Platform Overview</h2>
        <p className="text-gray-500">Global system health and business metrics.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <GlobalStat title="Total Tenants" value="482" trend="+12" />
        <GlobalStat title="System Load" value="24%" trend="Normal" />
        <GlobalStat title="Monthly Revenue" value="$42,500" trend="+$3.2k" />
        <GlobalStat title="Active Nodes" value="18/20" trend="Healthy" />
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
        <h3 className="text-xl font-bold mb-6">Tenant Growth</h3>
        <div className="h-80 bg-gray-50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-200 text-gray-400">
          Global growth visualization will be rendered here.
        </div>
      </div>
    </div>
  );
}

function GlobalStat({ title, value, trend }: { title: string; value: string; trend: string }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{title}</p>
      <div className="mt-3">
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        <p className="mt-1 text-sm text-blue-600 font-medium">{trend}</p>
      </div>
    </div>
  );
}
