import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Loan, User } from "@shared/schema";
import { Link, useLocation } from "wouter";
import { Check, Clock, ChevronRight, Banknote, MessageSquareText, User as UserIcon, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import BottomNavigation from "@/components/bottom-navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ApprovalTicker from "@/components/ApprovalTicker";
import SimpleBannerCarousel from "@/components/simple-banner-carousel";
import { useGlobalChat } from "@/context/chat-context";
import { useToast } from "@/hooks/use-toast";

export default function HomePage() {
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const { hasNewLoanUpdate, hasNewAccountUpdate, resetUpdateFlags } = useGlobalChat();

  // Get brand settings for theme
  const { data: brandSettings } = useQuery<{
    siteName: string;
    logoUrl: string;
    siteDescription: string;
    footerText: string;
    homePage?: {
      headerBackgroundColor: string;
      bannerSlides: any[];
      navigationTabs: any[];
    }
  }>({
    queryKey: ["/api/settings/brand"],
  });

  // Get available loan amount
  const { data: loanInfo, isLoading: isLoanInfoLoading } = useQuery<{availableAmount: number, interestRate: number}>({
    queryKey: ["/api/loans/available"],
    enabled: !!user,
  });

  // Get loan history with real-time updates
  const { data: loans, isLoading: isLoansLoading, refetch: refetchLoans } = useQuery<Loan[]>({
    queryKey: ["/api/loans"],
    enabled: !!user,
  });
  
  // Get account info with real-time updates
  const { data: account } = useQuery({
    queryKey: ["/api/account"],
    enabled: !!user,
  });
  
  // Handle real-time updates
  useEffect(() => {
    if (hasNewLoanUpdate) {
      // Refresh loans data when there's a new loan update
      refetchLoans();
      toast({
        title: "การอัพเดตสถานะเงินกู้",
        description: "คำขอสินเชื่อของคุณมีการเปลี่ยนแปลงสถานะ",
        variant: "default",
      });
      resetUpdateFlags();
    }
  }, [hasNewLoanUpdate, refetchLoans, toast, resetUpdateFlags]);

  if (!user) return null;

  // สีพื้นหลังจาก brand settings หรือค่าเริ่มต้น
  const headerBackgroundColor = brandSettings?.homePage?.headerBackgroundColor || '#16a5a3';

  return (
    <div className="min-h-screen bg-light pb-20">
      {/* Header */}
      <div 
        className="text-white p-6 pb-16 rounded-b-3xl shadow-lg" 
        style={{ 
          background: headerBackgroundColor,
          backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(0,0,0,0.1))'
        }}
      >
        <div className="flex justify-between items-center animate-fade-in">
          <div>
            <h1 className="text-xl font-semibold hero-animation">
              สวัสดี, {user.fullName.split(' ')[0]}
            </h1>
            <p className="text-sm opacity-80 hero-animation" style={{ animationDelay: "0.1s" }}>ยินดีต้อนรับกลับมา</p>
          </div>
          <Link href="/profile" className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center animate-scale-up">
            <UserIcon className="w-5 h-5" />
          </Link>
        </div>

        <div className="mt-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 animate-slide-up">
            <div className="flex justify-between items-center">
              <p className="text-sm opacity-80">วงเงินที่สามารถกู้ได้</p>
              <span className="text-xs px-2 py-1 bg-[#2ecc71]/20 rounded-full text-white animate-pulse-effect">
                พร้อมกู้
              </span>
            </div>
            {isLoanInfoLoading ? (
              <Skeleton className="h-8 w-32 bg-white/20 my-2" />
            ) : (
              <h2 className="text-2xl font-bold my-2 animate-scale-up" style={{ animationDelay: "0.2s" }}>
                ฿{loanInfo?.availableAmount.toLocaleString() || "50,000"}
              </h2>
            )}
            <div className="flex items-center text-xs mt-1 animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3 mr-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <span>
                อัตราดอกเบี้ย{" "}
                {loanInfo ? (loanInfo.interestRate / 100).toFixed(2) : "0.85"}%
                ต่อเดือน
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Banner Carousel */}
      <div className="px-4 -mt-10 mb-4 animate-slide-down" style={{ animationDelay: "0.2s" }}>
        <SimpleBannerCarousel />
      </div>
      
      {/* ApprovalTicker */}
      <div className="px-4 mb-4 animate-slide-down" style={{ animationDelay: "0.4s" }}>
        <ApprovalTicker />
      </div>

      {/* Actions */}
      <div className="px-4 -mt-4">
        <Card className="rounded-xl shadow-lg animate-slide-up" style={{ animationDelay: "0.3s" }}>
          <CardContent className="p-5">
            <h3 className="text-lg font-semibold text-[#1a2942] mb-4 animate-slide-right">
              ดำเนินการต่อ
            </h3>

            <Button
              variant="outline"
              className="w-full bg-[#16a5a3]/10 rounded-lg p-4 flex justify-between items-center mb-3 transition hover:bg-[#16a5a3]/20 h-auto button-animation stagger-item animate-slide-right"
              onClick={() => navigate("/loan")}
            >
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-[#16a5a3]/20 flex items-center justify-center text-[#16a5a3] mr-3 animate-wave">
                  <Banknote className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <h4 className="font-medium">ยื่นกู้เงิน</h4>
                  <p className="text-sm text-gray-500">เริ่มกระบวนการยื่นกู้</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </Button>

            <Button
              variant="outline"
              className="w-full bg-[#e6b54a]/10 rounded-lg p-4 flex justify-between items-center transition hover:bg-[#e6b54a]/20 h-auto button-animation stagger-item animate-slide-right"
              style={{ animationDelay: "0.15s" }}
              onClick={() => navigate("/chat")}
            >
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-[#e6b54a]/20 flex items-center justify-center text-[#e6b54a] mr-3 animate-wave">
                  <MessageSquareText className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <h4 className="font-medium">ติดต่อเจ้าหน้าที่</h4>
                  <p className="text-sm text-gray-500">ปรึกษาเกี่ยวกับการกู้</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </Button>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card className="rounded-xl shadow-lg mt-4 animate-slide-up" style={{ animationDelay: "0.5s" }}>
          <CardContent className="p-5">
            <h3 className="text-lg font-semibold text-[#1a2942] mb-4 animate-slide-right" style={{ animationDelay: "0.6s" }}>
              ประวัติการทำรายการ
            </h3>

            {isLoansLoading ? (
              // Loading skeleton
              <div className="space-y-4 animate-pulse-effect">
                {[1, 2].map((i) => (
                  <div key={i} className="flex items-center py-3 border-b">
                    <Skeleton className="w-10 h-10 rounded-full mr-3" />
                    <div className="flex-grow">
                      <Skeleton className="h-5 w-32 mb-1" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="text-right">
                      <Skeleton className="h-5 w-16 mb-1" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                  </div>
                ))}
              </div>
            ) : loans && loans.length > 0 ? (
              <div className="space-y-4">
                {loans.map((loan, index) => (
                  <div
                    key={loan.id}
                    className="flex items-center py-3 border-b last:border-0 animate-slide-right stagger-item"
                    style={{ animationDelay: `${0.1 * (index + 1)}s` }}
                  >
                    <div
                      className={`w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3 ${
                        loan.status === "approved"
                          ? "text-[#2ecc71] animate-pulse-effect"
                          : loan.status === "rejected"
                          ? "text-[#e74c3c]"
                          : "text-[#f39c12] animate-wave"
                      }`}
                    >
                      {loan.status === "approved" ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <Clock className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-grow">
                      <h4 className="font-medium">
                        {loan.status === "approved"
                          ? "ได้รับการอนุมัติเงินกู้"
                          : loan.status === "rejected"
                          ? "คำขอถูกปฏิเสธ"
                          : "ยื่นขอสินเชื่อ"}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {format(
                          new Date(loan.createdAt),
                          "d MMM yyyy",
                          { locale: th }
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-medium ${
                          loan.status === "approved"
                            ? "text-[#2ecc71]"
                            : loan.status === "rejected"
                            ? "text-[#e74c3c]"
                            : "text-[#f39c12]"
                        }`}
                      >
                        {loan.status === "approved" ? (
                          `฿${loan.amount.toLocaleString()}`
                        ) : loan.status === "rejected" ? (
                          "ไม่อนุมัติ"
                        ) : (
                          "รอดำเนินการ"
                        )}
                      </p>
                      <p className="text-xs text-gray-500">
                        {loan.status === "approved"
                          ? "เสร็จสิ้น"
                          : loan.status === "rejected"
                          ? "ถูกปฏิเสธ"
                          : "กำลังตรวจสอบ"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 animate-fade-in">
                <p>ยังไม่มีประวัติการทำรายการ</p>
                <Button
                  variant="link"
                  className="text-[#16a5a3] mt-2 button-animation animate-scale-up"
                  style={{ animationDelay: "0.3s" }}
                  onClick={() => navigate("/loan")}
                >
                  เริ่มยื่นกู้เงินตอนนี้
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
}