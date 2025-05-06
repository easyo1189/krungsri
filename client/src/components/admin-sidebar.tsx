import { FC } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
  Home,
  CreditCard,
  DollarSign,
  Users,
  BarChart,
  Shield,
  Settings,
  RefreshCw
} from 'lucide-react';

interface AdminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  newLoanNotification: boolean;
  newWithdrawalNotification: boolean;
}

const AdminSidebar: FC<AdminSidebarProps> = ({
  activeTab,
  setActiveTab,
  newLoanNotification,
  newWithdrawalNotification,
}) => {
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const isSuperAdmin = user?.adminRole === 'super_admin';

  return (
    <nav className="flex-1 px-2 py-4 space-y-2">
      <Button
        variant="ghost"
        className="w-full justify-start text-white hover:bg-gray-700"
        onClick={() => setActiveTab("dashboard")}
      >
        <Home className="h-5 w-5 mr-3" />
        แดชบอร์ด
      </Button>
      <Button
        variant="ghost"
        className="w-full justify-start text-white hover:bg-gray-700 relative"
        onClick={() => setActiveTab("loans")}
      >
        <CreditCard className="h-5 w-5 mr-3" />
        จัดการเงินกู้
        {newLoanNotification && (
          <div className="absolute w-3 h-3 bg-red-500 rounded-full right-2 top-3"></div>
        )}
      </Button>
      <Button
        variant="ghost"
        className="w-full justify-start text-white hover:bg-gray-700 relative"
        onClick={() => setActiveTab("withdrawals")}
      >
        <DollarSign className="h-5 w-5 mr-3" />
        จัดการการถอนเงิน
        {newWithdrawalNotification && (
          <div className="absolute w-3 h-3 bg-red-500 rounded-full right-2 top-3"></div>
        )}
      </Button>
      <Button
        variant="ghost"
        className="w-full justify-start text-white hover:bg-gray-700"
        onClick={() => setActiveTab("users")}
      >
        <Users className="h-5 w-5 mr-3" />
        จัดการผู้ใช้
      </Button>
      <Button
        variant="ghost"
        className="w-full justify-start text-white hover:bg-gray-700"
        onClick={() => setActiveTab("stats")}
      >
        <BarChart className="h-5 w-5 mr-3" />
        สถิติและรายงาน
      </Button>
      {isSuperAdmin && (
        <Button
          variant="ghost"
          className="w-full justify-start text-white hover:bg-gray-700"
          onClick={() => navigate("/admin/management")}
        >
          <Shield className="h-5 w-5 mr-3" />
          จัดการสิทธิ์แอดมิน
        </Button>
      )}
      <Button
        variant="ghost"
        className="w-full justify-start text-white hover:bg-gray-700"
        onClick={() => navigate("/admin/settings")}
      >
        <Settings className="h-5 w-5 mr-3" />
        ตั้งค่าระบบ
      </Button>
      {isSuperAdmin && (
        <Button
          variant="ghost"
          className="w-full justify-start text-white hover:bg-gray-700"
          onClick={() => navigate("/admin/data-recovery")}
        >
          <RefreshCw className="h-5 w-5 mr-3" />
          กู้คืนข้อมูล
        </Button>
      )}
    </nav>
  );
};

export default AdminSidebar;