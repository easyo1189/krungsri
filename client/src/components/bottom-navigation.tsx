import { Link, useLocation } from "wouter";
import { Home, DollarSign, MessageSquare, User, BanknoteIcon } from "lucide-react";
import { useGlobalChat } from "@/context/chat-context";
import { cn } from "@/lib/utils";
import useBrandSettings from "@/lib/useBrandSettings";

export default function BottomNavigation() {
  const [location] = useLocation();
  const { unreadCount } = useGlobalChat();
  const { brandSettings } = useBrandSettings();

  // ใช้สีพื้นหลังแถบนำทางจาก brand settings หรือค่าเริ่มต้น
  const navBgColor = brandSettings?.colors?.bottomNavigationBackground || "#ffffff";
  const navBorderColor = brandSettings?.colors?.bottomNavigationBorder || "#e5e7eb";

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 max-w-md mx-auto border-t shadow-lg flex justify-around items-center p-3 z-10"
      style={{ 
        background: navBgColor,
        borderColor: navBorderColor 
      }}
    >
      <NavItem
        href="/"
        icon={<Home className="text-lg" />}
        label="หน้าหลัก"
        isActive={location === "/"}
        brandSettings={brandSettings}
      />
      <NavItem
        href="/loan"
        icon={<DollarSign className="text-lg" />}
        label="ยื่นกู้"
        isActive={location === "/loan"}
        brandSettings={brandSettings}
      />
      <NavItem
        href="/withdrawal"
        icon={<BanknoteIcon className="text-lg" />}
        label="จัดการเงิน"
        isActive={location === "/withdrawal"}
        brandSettings={brandSettings}
      />
      <NavItem
        href="/chat"
        icon={<MessageSquare className="text-lg" />}
        label="แชท"
        isActive={location.startsWith("/chat")}
        badge={unreadCount > 0 ? unreadCount : undefined}
        brandSettings={brandSettings}
      />
      <NavItem
        href="/profile"
        icon={<User className="text-lg" />}
        label="โปรไฟล์"
        isActive={location === "/profile"}
        brandSettings={brandSettings}
      />
    </div>
  );
}

type NavItemProps = {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  badge?: number;
  brandSettings?: any;
};

function NavItem({ href, icon, label, isActive, badge, brandSettings }: NavItemProps) {
  // ใช้สีจาก brand settings หรือค่าเริ่มต้น
  const activeColor = brandSettings?.colors?.bottomNavigationActiveText || "#16a5a3";
  const inactiveColor = brandSettings?.colors?.bottomNavigationText || "#9ca3af";
  
  return (
    <Link href={href}>
      <div className="flex flex-col items-center cursor-pointer">
        <div className="relative">
          <div
            className="flex items-center justify-center text-xl"
            style={{ color: isActive ? activeColor : inactiveColor }}
          >
            {icon}
          </div>
          {badge !== undefined && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">{badge > 9 ? "9+" : badge}</span>
            </div>
          )}
        </div>
        <span
          className="text-xs mt-1"
          style={{ color: isActive ? activeColor : inactiveColor }}
        >
          {label}
        </span>
      </div>
    </Link>
  );
}
