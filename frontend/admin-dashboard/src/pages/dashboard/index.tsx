import React from 'react';
// Note: In a real project, you would have Apollo Client or similar setup
// This is a placeholder for the actual implementation
const AdminDashboard = () => {
  // Mock data for initial rendering
  const data = {
    totalCalls: 1250,
    activeAgents: 5,
    successfulResolutions: '92%',
    averageLatency: '450ms'
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Total Calls</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{data.totalCalls}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Active Agents</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{data.activeAgents}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Resolution Rate</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{data.successfulResolutions}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Avg Latency</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{data.averageLatency}</p>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2026-01-08 14:20:01</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Inbound Call</td>
                <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Completed</span></td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2m 45s</td>
              </tr>
              {/* More rows would be mapped here */}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
