import Link from "next/link";
import { 
  ShieldCheck, 
  Building2, 
  Server, 
  CreditCard,
  Activity,
  History
} from "lucide-react";

const navItems = [
  { name: "Global Overview", href: "/dashboard", icon: ShieldCheck },
  { name: "Tenants", href: "/tenants", icon: Building2 },
  { name: "System Health", href: "/system", icon: Activity },
  { name: "Billing & Revenue", href: "/billing", icon: CreditCard },
  { name: "Infrastructure", href: "/infrastructure", icon: Server },
  { name: "Audit Logs", href: "/audit", icon: History },
];

export default function SuperAdminSidebar() {
  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col min-h-screen">
      <div className="p-6">
        <h1 className="text-xl font-bold text-blue-400">Dukat SuperAdmin</h1>
      </div>
      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
          >
            <item.icon size={20} />
            <span className="font-medium">{item.name}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
