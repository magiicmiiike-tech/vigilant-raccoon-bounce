import Link from "next/link";
import { 
  LayoutDashboard, 
  UserSquare2, 
  GitBranch, 
  BarChart3, 
  Settings,
  Phone
} from "lucide-react";

const navItems = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Agents", href: "/agents", icon: UserSquare2 },
  { name: "Workflows", href: "/workflows", icon: GitBranch },
  { name: "Calls", href: "/calls", icon: Phone },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col min-h-screen">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-blue-600">Dukat Admin</h1>
      </div>
      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.name.toLowerCase() === "overview" ? "/dashboard" : item.href}
            className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
          >
            <item.icon size={20} />
            <span className="font-medium">{item.name}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
