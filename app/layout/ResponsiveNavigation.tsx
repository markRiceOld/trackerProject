import type { ReactNode } from "react";
import { Link, useLocation } from "react-router";
import { cn } from "~/lib/utils";

// --- Types ---
type SidebarNavItem = {
  id: string;
  title: string;
  href: string;
  icon: ReactNode;
  children?: SidebarNavItem[];
};

type BottomBarNavItem = {
  id: string;
  icon: ReactNode;
  href: string;
};

type ResponsiveNavigationProps = {
  sidebarItems: SidebarNavItem[];
  bottomBarItems: BottomBarNavItem[];
};

// --- Component ---
export default function ResponsiveNavigation({
  sidebarItems,
  bottomBarItems,
}: ResponsiveNavigationProps) {
  const location = useLocation();

  return (
    <>
      {/* Sidebar Navigation (md and up) */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-white p-4">
        <nav className="space-y-2">
          {sidebarItems.map((item) => (
            <SidebarItem key={item.id} item={item} currentPath={location.pathname} />
          ))}
        </nav>
      </aside>

      {/* Bottom Bar Navigation (mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-around border-t bg-white p-2 md:hidden">
        {bottomBarItems.map((item) => (
          <Link
            key={item.id}
            to={item.href}
            className={cn(
              "flex flex-col items-center text-sm text-muted-foreground",
              location.pathname === item.href && "text-primary"
            )}
          >
            {item.icon}
          </Link>
        ))}
      </nav>
    </>
  );
}

// --- Sidebar Item Renderer ---
function SidebarItem({ item, currentPath }: { item: SidebarNavItem; currentPath: string }) {
  const isActive = currentPath === item.href;

  return (
    <div>
      <Link
        to={item.href}
        className={cn(
          "flex items-center gap-2 rounded px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted",
          isActive && "bg-muted text-primary"
        )}
      >
        {item.icon}
        <span>{item.title}</span>
      </Link>
      {item.children && (
        <div className="ml-6 mt-1 space-y-1">
          {item.children.map((child) => (
            <SidebarItem key={child.id} item={child} currentPath={currentPath} />
          ))}
        </div>
      )}
    </div>
  );
}
