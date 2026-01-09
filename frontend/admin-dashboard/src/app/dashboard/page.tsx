export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold text-gray-900">Dashboard Overview</h2>
        <p className="text-gray-500">Monitor your Voice AI performance at a glance.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Active Calls" value="12" change="+20%" />
        <StatCard title="Total Minutes" value="1,240" change="+5%" />
        <StatCard title="Avg. Satisfaction" value="4.8/5" change="+2%" />
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-xl font-semibold mb-4">Recent Conversations</h3>
        <div className="h-64 flex items-center justify-center text-gray-400 italic">
          Conversation history visualization will be here.
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, change }: { title: string; value: string; change: string }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</p>
      <div className="mt-2 flex items-baseline justify-between">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <span className="text-green-600 text-sm font-semibold">{change}</span>
      </div>
    </div>
  );
}
