"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

interface UserData {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface PortalShellProps {
  user: UserData;
  children: React.ReactNode;
}

export function PortalShell({ user, children }: PortalShellProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await fetch("/api/v1/auth/logout", { method: "POST" });
    router.push("/signin");
    router.refresh();
  };

  const navItems = [
    { href: "/portal/mis-mascotas", label: "Mis Mascotas" },
    { href: "/portal/mis-citas", label: "Mis Citas" },
    { href: "/portal/agendar-citas", label: "Agendar Cita" },
    { href: "/portal/historial-medico", label: "Historial Médico" },
    { href: "/portal/perfil", label: "Mi Perfil" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white border-b border-gray-200 dark:border-gray-800 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/portal/mis-citas" className="flex items-center">
                <span className="text-xl font-bold text-brand-500">VeteriApp</span>
              </Link>
              <nav className="hidden md:flex gap-6">
                {navItems.map(item => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`text-sm font-medium transition-colors ${
                        isActive
                          ? "text-brand-600 dark:text-brand-400"
                          : "text-gray-700 hover:text-brand-500 dark:text-gray-300"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/portal/perfil"
                className="hidden sm:flex items-center gap-2 text-sm text-gray-700 hover:text-brand-500 dark:text-gray-300"
              >
                <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                  <span className="text-sm font-bold text-brand-600 dark:text-brand-300">
                    {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                  </span>
                </div>
                <span>{user.firstName} {user.lastName}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-red-500"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </header>
      <nav className="md:hidden bg-white border-b border-gray-200 dark:bg-gray-900 dark:border-gray-800 overflow-x-auto">
        <div className="flex gap-4 px-4 py-2 whitespace-nowrap">
          {navItems.map(item => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-xs font-medium pb-1 ${
                  isActive
                    ? "text-brand-600 border-b-2 border-brand-500 dark:text-brand-400"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
