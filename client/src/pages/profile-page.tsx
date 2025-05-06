import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatThaiCurrency, formatDate } from "@/lib/utils";
import { Loan, Withdrawal, Account } from "@shared/schema";
import useBrandSettings from "@/lib/useBrandSettings";
import { 
  ArrowLeft, 
  User, 
  Edit, 
  Lock, 
  Bell, 
  Shield, 
  UserCog, 
  LogOut,
  CalendarClock,
  CreditCard,
  BanknoteIcon,
  ClockIcon,
  BuildingIcon,
  Building
} from "lucide-react";
import BottomNavigation from "@/components/bottom-navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const profileSchema = z.object({
  fullName: z.string().min(3, "กรุณากรอกชื่อ-นามสกุล"),
  email: z.string().email("กรุณากรอกอีเมลให้ถูกต้อง"),
  phone: z.string().min(10, "กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง"),
  birthDate: z.string().optional(),
  address: z.string().optional(),
  occupation: z.string().optional(),
  idCardNumber: z.string().optional(),
  age: z.number().optional(),
  monthlyIncome: z.number().optional(),
  remainingIncome: z.number().optional(),
});

// สร้าง Schema สำหรับการเปลี่ยนรหัสผ่าน
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "กรุณากรอกรหัสผ่านปัจจุบัน"),
  newPassword: z.string().min(8, "รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร"),
  confirmPassword: z.string().min(8, "การยืนยันรหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน",
  path: ["confirmPassword"],
});

// สร้าง Schema สำหรับการตั้งค่าการแจ้งเตือน
const notificationsSchema = z.object({
  loanUpdates: z.boolean().default(true),
  withdrawalUpdates: z.boolean().default(true),
  marketingUpdates: z.boolean().default(false),
  emailNotifications: z.boolean().default(true),
  smsNotifications: z.boolean().default(true),
});

// สร้าง Schema สำหรับการตั้งค่าความเป็นส่วนตัว
const privacySchema = z.object({
  showLoanHistory: z.boolean().default(true),
  showWithdrawalHistory: z.boolean().default(true),
  allowDataCollection: z.boolean().default(true),
  allowThirdPartySharing: z.boolean().default(false),
});

export default function ProfilePage() {
  const { user, logoutMutation } = useAuth();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [viewLoanDetails, setViewLoanDetails] = useState<Loan | null>(null);
  const [viewWithdrawalDetails, setViewWithdrawalDetails] = useState<Withdrawal | null>(null);
  const [fullProfileOpen, setFullProfileOpen] = useState(false);

  // ดึงข้อมูลเงินกู้ทั้งหมดของผู้ใช้
  const { data: loans, isLoading: isLoansLoading } = useQuery<Loan[]>({
    queryKey: ["/api/loans"],
    enabled: !!user,
  });
  
  // หาเงินกู้ล่าสุดที่มีรูปภาพยืนยันตัวตน
  const latestLoanWithImages = useMemo(() => {
    if (!loans || loans.length === 0) return null;
    
    // เรียงลำดับตามวันที่สร้างล่าสุด
    const sortedLoans = [...loans].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    // หาเงินกู้ที่มีรูปภาพอย่างน้อย 1 รูป
    return sortedLoans.find(loan => 
      loan.frontIdCardImage || loan.backIdCardImage || loan.selfieWithIdCardImage
    ) || null;
  }, [loans]);

  // ดึงข้อมูลการถอนเงินทั้งหมดของผู้ใช้
  const { data: withdrawals, isLoading: isWithdrawalsLoading } = useQuery<Withdrawal[]>({
    queryKey: ["/api/withdrawals"],
    enabled: !!user,
  });
  
  // ดึงข้อมูลบัญชีธนาคารของผู้ใช้
  const { data: account, isLoading: isAccountLoading } = useQuery<Account>({
    queryKey: ["/api/account"],
    enabled: !!user,
  });

  // Get membership date
  const memberSince = user?.createdAt 
    ? new Date(user.createdAt).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long'
      })
    : 'มิถุนายน 2023';
    
  // แสดงสถานะของการกู้ในภาษาไทย
  const getLoanStatusText = (status: string) => {
    switch (status) {
      case "pending": return "รอดำเนินการ";
      case "approved": return "อนุมัติแล้ว";
      case "rejected": return "ปฏิเสธ";
      case "completed": return "ชำระแล้ว";
      default: return status;
    }
  };
  
  // แสดงสถานะของการถอนเงินในภาษาไทย
  const getWithdrawalStatusText = (status: string) => {
    switch (status) {
      case "pending": return "รอดำเนินการ";
      case "approved": return "อนุมัติแล้ว";
      case "rejected": return "ปฏิเสธ";
      default: return status;
    }
  };
  
  // คำนวณยอดชำระรายเดือน
  const calculateMonthlyPayment = (amount: number, term: number, interestRate: number) => {
    const monthlyInterest = interestRate / 100 / 12;
    return (amount * monthlyInterest * Math.pow(1 + monthlyInterest, term)) / 
           (Math.pow(1 + monthlyInterest, term) - 1);
  };

  // Form for profile editing
  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      email: user?.email || "",
      phone: user?.phone || "",
      birthDate: user?.birthDate || "",
      address: user?.address || "",
      occupation: user?.occupation || "",
      idCardNumber: user?.idCardNumber || "",
      age: user?.age || undefined,
      monthlyIncome: user?.monthlyIncome || undefined,
      remainingIncome: user?.remainingIncome || undefined,
    },
  });

  // ไม่ต้องการตัวแปรเหล่านี้เนื่องจากถูกลบหน้าต่างแก้ไขข้อมูลส่วนตัวไปแล้ว
  // แต่ยังคงเก็บไว้เพื่อที่จะสามารถนำกลับมาใช้ในอนาคตได้หากต้องการ

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        navigate("/auth");
      },
    });
  };

  // ใช้ brand settings สำหรับสีส่วนบน
  const { brandSettings } = useBrandSettings();
  
  if (!user) return null;

  return (
    <div className="min-h-screen bg-light pb-20">
      <div 
        className="text-white p-6 pb-16" 
        style={{ 
          background: brandSettings?.colors?.headerBackground || "#16a5a3",
          color: brandSettings?.colors?.headerText || "#ffffff"
        }}
      >
        <div className="flex items-center">
          <button
            onClick={() => navigate("/")}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20 mr-4"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-xl font-semibold">โปรไฟล์</h1>
        </div>

        <div className="flex flex-col items-center mt-6">
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl">
            <User className="h-10 w-10" />
          </div>
          <h2 className="text-xl font-semibold mt-3">{user.fullName}</h2>
          <p className="text-sm opacity-80">สมาชิกตั้งแต่: {memberSince}</p>
        </div>
      </div>

      <div className="px-4 -mt-10">
        <Card className="rounded-xl shadow-lg animate-slide-up">
          <CardContent className="p-5">
            <h3 className="text-lg font-semibold text-[#1a2942] mb-4">ข้อมูลส่วนตัว</h3>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="basic-info">
                <AccordionTrigger className="py-2 text-left font-medium">
                  ข้อมูลพื้นฐาน
                </AccordionTrigger>
                <AccordionContent className="pb-2">
                  <div className="space-y-3 pt-2">
                    <div>
                      <p className="text-sm text-gray-500">ชื่อผู้ใช้</p>
                      <p className="font-medium">{user.username}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">อีเมล</p>
                      <p className="font-medium">{user.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">เบอร์โทรศัพท์</p>
                      <p className="font-medium">{user.phone}</p>
                    </div>
                    {user.birthDate && (
                      <div>
                        <p className="text-sm text-gray-500">วันเกิด</p>
                        <p className="font-medium">{user.birthDate}</p>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="id-info">
                <AccordionTrigger className="py-2 text-left font-medium">
                  ข้อมูลบัตรประชาชน
                </AccordionTrigger>
                <AccordionContent className="pb-2">
                  <div className="space-y-3 pt-2">
                    <div>
                      <p className="text-sm text-gray-500">เอกสารยืนยันตัวตน</p>
                      <p className="font-medium">มีการยืนยันตัวตนแล้ว</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="employment-info">
                <AccordionTrigger className="py-2 text-left font-medium">
                  ข้อมูลส่วนตัวเพิ่มเติม
                </AccordionTrigger>
                <AccordionContent className="pb-2">
                  <div className="space-y-3 pt-2">
                    {loans && loans.length > 0 && loans[0].idCardNumber && (
                      <div>
                        <p className="text-sm text-gray-500">เลขบัตรประชาชน</p>
                        <p className="font-medium">{loans[0].idCardNumber}</p>
                      </div>
                    )}
                    
                    {loans && loans.length > 0 && loans[0].address && (
                      <div>
                        <p className="text-sm text-gray-500">ที่อยู่</p>
                        <p className="font-medium">{loans[0].address}</p>
                      </div>
                    )}
                    
                    {loans && loans.length > 0 && loans[0].occupation && (
                      <div>
                        <p className="text-sm text-gray-500">อาชีพ</p>
                        <p className="font-medium">{loans[0].occupation}</p>
                      </div>
                    )}
                    
                    {loans && loans.length > 0 && loans[0].workExperience && (
                      <div>
                        <p className="text-sm text-gray-500">อายุงาน</p>
                        <p className="font-medium">{loans[0].workExperience}</p>
                      </div>
                    )}
                    
                    {loans && loans.length > 0 && loans[0].position && (
                      <div>
                        <p className="text-sm text-gray-500">ตำแหน่ง</p>
                        <p className="font-medium">{loans[0].position}</p>
                      </div>
                    )}
                    
                    {loans && loans.length > 0 && loans[0].monthlyIncome && (
                      <div>
                        <p className="text-sm text-gray-500">รายได้ต่อเดือน</p>
                        <p className="font-medium">{formatThaiCurrency(Number(loans[0].monthlyIncome))}</p>
                      </div>
                    )}
                    
                    {loans && loans.length > 0 && loans[0].monthlyRemaining && (
                      <div>
                        <p className="text-sm text-gray-500">คงเหลือต่อเดือน</p>
                        <p className="font-medium">{formatThaiCurrency(Number(loans[0].monthlyRemaining))}</p>
                      </div>
                    )}
                    
                    {loans && loans.length > 0 && loans[0].purpose && (
                      <div>
                        <p className="text-sm text-gray-500">จุดประสงค์ในการกู้</p>
                        <p className="font-medium">{loans[0].purpose}</p>
                      </div>
                    )}
                    
                    <div>
                      <p className="text-sm text-gray-500">เอกสารยืนยันตัวตน</p>
                      <p className="font-medium">ผ่านการตรวจสอบแล้ว</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            <div className="flex flex-col space-y-2 mt-4">
              <Button 
                variant="link" 
                className="font-medium p-0 flex items-center h-auto" 
                style={{ color: brandSettings?.colors?.primaryButtonBackground || "#16a5a3" }} 
                onClick={() => setFullProfileOpen(true)}
              >
                <User className="mr-2 h-4 w-4" /> ดูข้อมูลส่วนตัวและเอกสารทั้งหมด
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ส่วนแสดงประวัติการกู้เงิน */}
        <Card className="rounded-xl shadow-lg mt-4 animate-slide-up">
          <CardHeader>
            <CardTitle className="text-lg text-[#1a2942] flex items-center">
              <CreditCard className="h-5 w-5 mr-2" style={{ color: brandSettings?.colors?.primaryButtonBackground || "#16a5a3" }} /> 
              ประวัติการกู้เงิน
            </CardTitle>
            <CardDescription>
              ข้อมูลการกู้เงินของคุณทั้งหมด
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            {isLoansLoading && (
              <div className="text-center py-8">
                <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
              </div>
            )}
            
            {!isLoansLoading && (!loans || loans.length === 0) && (
              <div className="text-center py-8">
                <p className="text-gray-500">ไม่พบข้อมูลการกู้เงิน</p>
              </div>
            )}
            
            {!isLoansLoading && loans && loans.length > 0 && (
              <div className="space-y-3">
                {loans.map((loan) => (
                  <div 
                    key={loan.id} 
                    className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setViewLoanDetails(loan)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{formatThaiCurrency(loan.amount)}</div>
                        <div className="text-sm text-gray-500">
                          ระยะเวลา {loan.term} เดือน • {new Date(loan.createdAt).toLocaleDateString('th-TH')}
                        </div>
                      </div>
                      <div>
                        <Badge className={
                          loan.status === "approved" ? "bg-green-100 text-green-800 hover:bg-green-200" :
                          loan.status === "rejected" ? "bg-red-100 text-red-800 hover:bg-red-200" :
                          loan.status === "completed" ? "bg-blue-100 text-blue-800 hover:bg-blue-200" :
                          "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                        }>
                          {getLoanStatusText(loan.status)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter className="pt-0">
            <Button 
              variant="link" 
              className="p-0 h-auto"
              style={{ color: brandSettings?.colors?.primaryButtonBackground || "#16a5a3" }}
              onClick={() => navigate("/loan")}
            >
              ขอสินเชื่อเพิ่มเติม
            </Button>
          </CardFooter>
        </Card>

        {/* ส่วนแสดงประวัติการถอนเงิน */}
        <Card className="rounded-xl shadow-lg mt-4 animate-slide-up">
          <CardHeader>
            <CardTitle className="text-lg text-[#1a2942] flex items-center">
              <BanknoteIcon className="h-5 w-5 mr-2" style={{ color: brandSettings?.colors?.primaryButtonBackground || "#16a5a3" }} /> 
              ประวัติการถอนเงิน
            </CardTitle>
            <CardDescription>
              ข้อมูลการถอนเงินของคุณทั้งหมด
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            {isWithdrawalsLoading && (
              <div className="text-center py-8">
                <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
              </div>
            )}
            
            {!isWithdrawalsLoading && (!withdrawals || withdrawals.length === 0) && (
              <div className="text-center py-8">
                <p className="text-gray-500">ไม่พบข้อมูลการถอนเงิน</p>
              </div>
            )}
            
            {!isWithdrawalsLoading && withdrawals && withdrawals.length > 0 && (
              <div className="space-y-3">
                {withdrawals.map((withdrawal) => (
                  <div 
                    key={withdrawal.id} 
                    className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setViewWithdrawalDetails(withdrawal)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{formatThaiCurrency(withdrawal.amount)}</div>
                        <div className="text-sm text-gray-500">
                          {withdrawal.bankName} • {new Date(withdrawal.createdAt).toLocaleDateString('th-TH')}
                        </div>
                      </div>
                      <div>
                        <Badge className={
                          withdrawal.status === "approved" ? "bg-green-100 text-green-800 hover:bg-green-200" :
                          withdrawal.status === "rejected" ? "bg-red-100 text-red-800 hover:bg-red-200" :
                          "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                        }>
                          {getWithdrawalStatusText(withdrawal.status)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter className="pt-0">
            <Button 
              variant="link" 
              className="p-0 h-auto"
              style={{ color: brandSettings?.colors?.primaryButtonBackground || "#16a5a3" }}
              onClick={() => navigate("/withdrawal")}
            >
              ขอถอนเงิน
            </Button>
          </CardFooter>
        </Card>

        {/* ส่วนข้อมูลบัญชีธนาคาร */}
        <Card className="rounded-xl shadow-lg mt-4 animate-slide-up">
          <CardHeader>
            <CardTitle className="text-lg text-[#1a2942] flex items-center">
              <Building className="h-5 w-5 mr-2" style={{ color: brandSettings?.colors?.primaryButtonBackground || "#16a5a3" }} /> 
              ข้อมูลบัญชีธนาคาร
            </CardTitle>
            <CardDescription>
              บัญชีธนาคารสำหรับการถอนเงิน
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-5">
            {isAccountLoading && (
              <div className="text-center py-8">
                <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
              </div>
            )}
            
            {!isAccountLoading && account && !account.bankName && (
              <div className="text-center py-8">
                <p className="text-gray-500">ยังไม่มีข้อมูลบัญชีธนาคาร</p>
                <Button 
                  variant="link" 
                  className="p-0 h-auto mt-2"
                  style={{ color: brandSettings?.colors?.primaryButtonBackground || "#16a5a3" }}
                  onClick={() => navigate("/withdrawal")}
                >
                  เพิ่มบัญชีธนาคาร
                </Button>
              </div>
            )}
            
            {!isAccountLoading && account && account.bankName && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">ธนาคาร</p>
                  <p className="font-medium">{account.bankName}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">เลขที่บัญชี</p>
                  <p className="font-medium">{account.accountNumber}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">ชื่อบัญชี</p>
                  <p className="font-medium">{account.accountName}</p>
                </div>
                
                <Button 
                  variant="outline" 
                  className="mt-2"
                  style={{ 
                    color: brandSettings?.colors?.primaryButtonBackground || "#16a5a3", 
                    borderColor: brandSettings?.colors?.primaryButtonBackground || "#16a5a3" 
                  }}
                  onClick={() => navigate("/withdrawal")}
                >
                  แก้ไขบัญชีธนาคาร
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ส่วนบัญชีและความปลอดภัย */}
        <Card className="rounded-xl shadow-lg mt-4 animate-slide-up">
          <CardHeader>
            <CardTitle className="text-lg text-[#1a2942]">
              บัญชีและความปลอดภัย
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 px-5 pb-5">
            <div className="space-y-3">
              <Button 
                variant="ghost" 
                className="w-full flex justify-between items-center py-2 h-auto"
                onClick={() => setChangePasswordOpen(true)}
              >
                <div className="flex items-center">
                  <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 mr-3">
                    <Lock className="h-4 w-4" />
                  </div>
                  <span>เปลี่ยนรหัสผ่าน</span>
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-gray-400"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Button>
              
              {user.adminRole && (
                <Button 
                  variant="ghost" 
                  className="w-full flex justify-between items-center py-2 h-auto"
                  onClick={() => navigate("/admin")}
                >
                  <div className="flex items-center">
                    <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mr-3">
                      <Shield className="h-4 w-4" />
                    </div>
                    <span>หน้าแอดมิน</span>
                    {user.adminRole === 'super_admin' && (
                      <Badge className="ml-2 bg-indigo-500">Super</Badge>
                    )}
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-gray-400"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Button>
              )}

              <Button 
                variant="ghost" 
                className="w-full flex justify-between items-center py-2 h-auto"
                onClick={() => setNotificationsOpen(true)}
              >
                <div className="flex items-center">
                  <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 mr-3">
                    <Bell className="h-4 w-4" />
                  </div>
                  <span>การแจ้งเตือน</span>
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-gray-400"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Button>

              <Button 
                variant="ghost" 
                className="w-full flex justify-between items-center py-2 h-auto"
                onClick={() => setPrivacyOpen(true)}
              >
                <div className="flex items-center">
                  <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 mr-3">
                    <Shield className="h-4 w-4" />
                  </div>
                  <span>ความเป็นส่วนตัว</span>
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-gray-400"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Button>

              <Button 
                variant="ghost" 
                className="w-full flex justify-between items-center py-2 h-auto mt-4"
                onClick={handleLogout}
              >
                <div className="flex items-center">
                  <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center text-red-500 mr-3">
                    <LogOut className="h-4 w-4" />
                  </div>
                  <span className="text-red-500 font-medium">ออกจากระบบ</span>
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-red-400"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <BottomNavigation />

      {/* Dialog for changing passwords */}
      <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>เปลี่ยนรหัสผ่าน</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">รหัสผ่านปัจจุบัน</label>
                <Input type="password" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">รหัสผ่านใหม่</label>
                <Input type="password" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">ยืนยันรหัสผ่านใหม่</label>
                <Input type="password" />
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setChangePasswordOpen(false)}>
              ยกเลิก
            </Button>
            <Button>บันทึกการเปลี่ยนแปลง</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog for notification settings */}
      <Dialog open={notificationsOpen} onOpenChange={setNotificationsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>การแจ้งเตือน</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <label className="flex flex-col space-y-1">
                  <span className="text-sm font-medium leading-none">การอัพเดทสถานะการกู้</span>
                  <span className="text-xs text-gray-500">รับการแจ้งเตือนเมื่อมีการเปลี่ยนแปลงสถานะการกู้เงิน</span>
                </label>
                <Switch checked={true} />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <label className="flex flex-col space-y-1">
                  <span className="text-sm font-medium leading-none">การอัพเดทสถานะการถอนเงิน</span>
                  <span className="text-xs text-gray-500">รับการแจ้งเตือนเมื่อมีการเปลี่ยนแปลงสถานะการถอนเงิน</span>
                </label>
                <Switch checked={true} />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <label className="flex flex-col space-y-1">
                  <span className="text-sm font-medium leading-none">อีเมลทางการตลาด</span>
                  <span className="text-xs text-gray-500">รับข้อมูลข่าวสารเกี่ยวกับโปรโมชั่นและบริการใหม่ๆ</span>
                </label>
                <Switch checked={false} />
              </div>

              <Separator className="my-4" />

              <div className="flex items-center justify-between space-x-2">
                <label className="flex flex-col space-y-1">
                  <span className="text-sm font-medium leading-none">แจ้งเตือนทางอีเมล</span>
                  <span className="text-xs text-gray-500">ส่งการแจ้งเตือนไปยังอีเมลของคุณ</span>
                </label>
                <Switch checked={true} />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <label className="flex flex-col space-y-1">
                  <span className="text-sm font-medium leading-none">แจ้งเตือนทาง SMS</span>
                  <span className="text-xs text-gray-500">ส่งการแจ้งเตือนไปยังเบอร์โทรศัพท์ของคุณ</span>
                </label>
                <Switch checked={true} />
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setNotificationsOpen(false)}>
              ยกเลิก
            </Button>
            <Button>บันทึกการเปลี่ยนแปลง</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog for privacy settings */}
      <Dialog open={privacyOpen} onOpenChange={setPrivacyOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>ความเป็นส่วนตัว</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <label className="flex flex-col space-y-1">
                  <span className="text-sm font-medium leading-none">แสดงประวัติการกู้</span>
                  <span className="text-xs text-gray-500">แสดงประวัติการกู้เงินในโปรไฟล์ของคุณ</span>
                </label>
                <Switch checked={true} />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <label className="flex flex-col space-y-1">
                  <span className="text-sm font-medium leading-none">แสดงประวัติการถอนเงิน</span>
                  <span className="text-xs text-gray-500">แสดงประวัติการถอนเงินในโปรไฟล์ของคุณ</span>
                </label>
                <Switch checked={true} />
              </div>

              <Separator className="my-4" />

              <div className="flex items-center justify-between space-x-2">
                <label className="flex flex-col space-y-1">
                  <span className="text-sm font-medium leading-none">อนุญาตการเก็บข้อมูลการใช้งาน</span>
                  <span className="text-xs text-gray-500">อนุญาตให้เราเก็บข้อมูลการใช้งานเพื่อปรับปรุงบริการ</span>
                </label>
                <Switch checked={true} />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <label className="flex flex-col space-y-1">
                  <span className="text-sm font-medium leading-none">การแบ่งปันข้อมูลกับบุคคลที่สาม</span>
                  <span className="text-xs text-gray-500">อนุญาตให้เราแบ่งปันข้อมูลกับพันธมิตรของเรา</span>
                </label>
                <Switch checked={false} />
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setPrivacyOpen(false)}>
              ยกเลิก
            </Button>
            <Button>บันทึกการเปลี่ยนแปลง</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog for loan details */}
      <Dialog open={!!viewLoanDetails} onOpenChange={() => setViewLoanDetails(null)}>
        <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>รายละเอียดการกู้เงิน</DialogTitle>
          </DialogHeader>
          
          {viewLoanDetails && (
            <div className="space-y-6 py-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold">{formatThaiCurrency(viewLoanDetails.amount)}</h3>
                  <p className="text-sm text-gray-500">ระยะเวลา {viewLoanDetails.term} เดือน</p>
                </div>
                <Badge className={
                  viewLoanDetails.status === "approved" ? "bg-green-100 text-green-800 hover:bg-green-200" :
                  viewLoanDetails.status === "rejected" ? "bg-red-100 text-red-800 hover:bg-red-200" :
                  viewLoanDetails.status === "completed" ? "bg-blue-100 text-blue-800 hover:bg-blue-200" :
                  "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                }>
                  {getLoanStatusText(viewLoanDetails.status)}
                </Badge>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h4 className="font-medium">รายละเอียดการกู้</h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-gray-500">จำนวนเงิน</p>
                    <p className="font-medium">{formatThaiCurrency(viewLoanDetails.amount)}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">อัตราดอกเบี้ย</p>
                    <p className="font-medium">{viewLoanDetails.interestRate}% ต่อปี</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">ระยะเวลา</p>
                    <p className="font-medium">{viewLoanDetails.term} เดือน</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">ผ่อนชำระรายเดือน</p>
                    <p className="font-medium">{formatThaiCurrency(calculateMonthlyPayment(viewLoanDetails.amount, viewLoanDetails.term, viewLoanDetails.interestRate))}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">วัตถุประสงค์การกู้</p>
                  <p className="font-medium">{viewLoanDetails.purpose || "ไม่ระบุ"}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">วันที่ยื่นกู้</p>
                  <p className="font-medium">{new Date(viewLoanDetails.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                
                {/* เอาส่วนที่ไม่มีในข้อมูลออก */}
                <div>
                  <p className="text-sm text-gray-500">สถานะ</p>
                  <p className="font-medium">{getLoanStatusText(viewLoanDetails.status)}</p>
                </div>
              </div>
              
              {viewLoanDetails.status === "approved" && (
                <div className="space-y-4">
                  <h4 className="font-medium">ตารางการผ่อนชำระ</h4>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>งวดที่</TableHead>
                        <TableHead>วันครบกำหนด</TableHead>
                        <TableHead className="text-right">จำนวนเงิน</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.from({ length: Math.min(5, viewLoanDetails.term) }).map((_, index) => {
                        // ใช้วันที่สร้างเป็นฐานแทน approvedAt ที่ไม่มี
                        const dueDate = new Date(viewLoanDetails.createdAt);
                        dueDate.setMonth(dueDate.getMonth() + index + 1);
                        
                        return (
                          <TableRow key={index}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{dueDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</TableCell>
                            <TableCell className="text-right">{formatThaiCurrency(calculateMonthlyPayment(viewLoanDetails.amount, viewLoanDetails.term, viewLoanDetails.interestRate))}</TableCell>
                          </TableRow>
                        );
                      })}
                      
                      {viewLoanDetails.term > 5 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-sm text-gray-500">
                            ... อีก {viewLoanDetails.term - 5} งวด
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
          
          <div className="flex justify-end mt-4">
            <Button 
              variant="outline"
              onClick={() => setViewLoanDetails(null)}
            >
              ปิด
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog for withdrawal details */}
      <Dialog open={!!viewWithdrawalDetails} onOpenChange={() => setViewWithdrawalDetails(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>รายละเอียดการถอนเงิน</DialogTitle>
          </DialogHeader>
          
          {viewWithdrawalDetails && (
            <div className="space-y-6 py-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold">{formatThaiCurrency(viewWithdrawalDetails.amount)}</h3>
                  <p className="text-sm text-gray-500">{viewWithdrawalDetails.bankName}</p>
                </div>
                <Badge className={
                  viewWithdrawalDetails.status === "approved" ? "bg-green-100 text-green-800 hover:bg-green-200" :
                  viewWithdrawalDetails.status === "rejected" ? "bg-red-100 text-red-800 hover:bg-red-200" :
                  "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                }>
                  {getWithdrawalStatusText(viewWithdrawalDetails.status)}
                </Badge>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h4 className="font-medium">รายละเอียดการถอน</h4>
                
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <p className="text-sm text-gray-500">จำนวนเงิน</p>
                    <p className="font-medium">{formatThaiCurrency(viewWithdrawalDetails.amount)}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">ธนาคาร</p>
                    <p className="font-medium">{viewWithdrawalDetails.bankName}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">เลขที่บัญชี</p>
                    <p className="font-medium">{viewWithdrawalDetails.accountNumber}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">ชื่อบัญชี</p>
                    <p className="font-medium">{viewWithdrawalDetails.accountName}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">วันที่ขอถอนเงิน</p>
                    <p className="font-medium">{new Date(viewWithdrawalDetails.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                  
                    {/* เอาส่วนที่ไม่มีในข้อมูลออก */}
                  <div>
                    <p className="text-sm text-gray-500">สถานะ</p>
                    <p className="font-medium">{getWithdrawalStatusText(viewWithdrawalDetails.status)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-end mt-4">
            <Button 
              variant="outline" 
              onClick={() => setViewWithdrawalDetails(null)}
            >
              ปิด
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog แสดงข้อมูลส่วนตัวแบบเต็ม */}
      <Dialog open={fullProfileOpen} onOpenChange={setFullProfileOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>ข้อมูลส่วนตัวทั้งหมด</DialogTitle>
            <DialogDescription>
              ข้อมูลทั้งหมดในระบบของคุณ (แสดงเฉพาะข้อมูลที่มีการบันทึกแล้ว)
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {/* ข้อมูลส่วนตัวพื้นฐาน */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-md font-semibold mb-3 text-[#1a2942]">ข้อมูลส่วนตัว</h3>
              
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <p className="text-sm text-gray-500">ชื่อ-นามสกุล</p>
                  <p className="font-medium">{user.fullName || "-"}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">เบอร์โทรศัพท์</p>
                  <p className="font-medium">{user.phone || "-"}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">อีเมล</p>
                  <p className="font-medium">{user.email || "-"}</p>
                </div>

                {/* ข้อมูลเพิ่มเติมจากหน้าขอสินเชื่อ */}
                {loans && loans.length > 0 && loans[0].idCardNumber && (
                  <div>
                    <p className="text-sm text-gray-500">เลขบัตรประชาชน</p>
                    <p className="font-medium">{loans[0].idCardNumber}</p>
                  </div>
                )}
                
                {loans && loans.length > 0 && loans[0].address && (
                  <div>
                    <p className="text-sm text-gray-500">ที่อยู่</p>
                    <p className="font-medium">{loans[0].address}</p>
                  </div>
                )}
                
                {loans && loans.length > 0 && loans[0].occupation && (
                  <div>
                    <p className="text-sm text-gray-500">อาชีพ</p>
                    <p className="font-medium">{loans[0].occupation}</p>
                  </div>
                )}
                
                {loans && loans.length > 0 && loans[0].workExperience && (
                  <div>
                    <p className="text-sm text-gray-500">อายุงาน</p>
                    <p className="font-medium">{loans[0].workExperience}</p>
                  </div>
                )}
                
                {loans && loans.length > 0 && loans[0].position && (
                  <div>
                    <p className="text-sm text-gray-500">ตำแหน่ง</p>
                    <p className="font-medium">{loans[0].position}</p>
                  </div>
                )}
                
                {loans && loans.length > 0 && loans[0].monthlyIncome && (
                  <div>
                    <p className="text-sm text-gray-500">รายได้ต่อเดือน</p>
                    <p className="font-medium">{formatThaiCurrency(Number(loans[0].monthlyIncome))}</p>
                  </div>
                )}
                
                {loans && loans.length > 0 && loans[0].monthlyRemaining && (
                  <div>
                    <p className="text-sm text-gray-500">คงเหลือต่อเดือน</p>
                    <p className="font-medium">{formatThaiCurrency(Number(loans[0].monthlyRemaining))}</p>
                  </div>
                )}
                
                {loans && loans.length > 0 && loans[0].purpose && (
                  <div>
                    <p className="text-sm text-gray-500">จุดประสงค์ในการกู้</p>
                    <p className="font-medium">{loans[0].purpose}</p>
                  </div>
                )}
                
                {account && (
                  <>
                    <div>
                      <p className="text-sm text-gray-500">ธนาคาร</p>
                      <p className="font-medium">{account.bankName || "-"}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">เลขบัญชี</p>
                      <p className="font-medium">{account.accountNumber || "-"}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">ชื่อบัญชี</p>
                      <p className="font-medium">{account.accountName || "-"}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {/* ข้อมูลการกู้ทั้งหมด */}
            {loans && loans.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-md font-semibold mb-3 text-[#1a2942]">ข้อมูลการกู้ทั้งหมด</h3>
                
                <div className="space-y-3">
                  {loans.map((loan, index) => (
                    <div key={loan.id} className="border rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">คำขอสินเชื่อ #{index + 1}</h4>
                        <Badge className={
                          loan.status === "approved" ? "bg-green-100 text-green-800 hover:bg-green-200" :
                          loan.status === "rejected" ? "bg-red-100 text-red-800 hover:bg-red-200" :
                          loan.status === "completed" ? "bg-blue-100 text-blue-800 hover:bg-blue-200" :
                          "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                        }>
                          {getLoanStatusText(loan.status)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-gray-500">จำนวนเงิน</p>
                          <p className="font-medium">{formatThaiCurrency(loan.amount)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">ระยะเวลา</p>
                          <p className="font-medium">{loan.term} เดือน</p>
                        </div>
                        <div>
                          <p className="text-gray-500">อัตราดอกเบี้ย</p>
                          <p className="font-medium">{loan.interestRate}%</p>
                        </div>
                        <div>
                          <p className="text-gray-500">ชำระต่อเดือน</p>
                          <p className="font-medium">{formatThaiCurrency(loan.monthlyPayment)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">วัตถุประสงค์</p>
                          <p className="font-medium">{loan.purpose || "ไม่ระบุ"}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">วันที่ยื่นคำขอ</p>
                          <p className="font-medium">{new Date(loan.createdAt).toLocaleDateString('th-TH')}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* รูปภาพเอกสาร */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-md font-semibold mb-3 text-[#1a2942]">เอกสารยืนยันตัวตน</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">รูปบัตรประชาชนด้านหน้า</p>
                  {latestLoanWithImages?.frontIdCardImage ? (
                    <div className="h-40 border rounded-md bg-gray-100 flex items-center justify-center overflow-hidden">
                      <img 
                        src={latestLoanWithImages.frontIdCardImage} 
                        alt="บัตรประชาชนด้านหน้า" 
                        className="object-contain max-h-full"
                      />
                    </div>
                  ) : (
                    <div className="h-40 border rounded-md bg-gray-100 flex items-center justify-center">
                      <p className="text-gray-500">ยังไม่มีรูปบัตรประชาชนด้านหน้า</p>
                    </div>
                  )}
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 mb-1">รูปบัตรประชาชนด้านหลัง</p>
                  {latestLoanWithImages?.backIdCardImage ? (
                    <div className="h-40 border rounded-md bg-gray-100 flex items-center justify-center overflow-hidden">
                      <img 
                        src={latestLoanWithImages.backIdCardImage} 
                        alt="บัตรประชาชนด้านหลัง" 
                        className="object-contain max-h-full"
                      />
                    </div>
                  ) : (
                    <div className="h-40 border rounded-md bg-gray-100 flex items-center justify-center">
                      <p className="text-gray-500">ยังไม่มีรูปบัตรประชาชนด้านหลัง</p>
                    </div>
                  )}
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 mb-1">รูปถ่ายคู่กับบัตรประชาชน</p>
                  {latestLoanWithImages?.selfieWithIdCardImage ? (
                    <div className="h-40 border rounded-md bg-gray-100 flex items-center justify-center overflow-hidden">
                      <img 
                        src={latestLoanWithImages.selfieWithIdCardImage} 
                        alt="รูปถ่ายคู่กับบัตรประชาชน" 
                        className="object-contain max-h-full"
                      />
                    </div>
                  ) : (
                    <div className="h-40 border rounded-md bg-gray-100 flex items-center justify-center">
                      <p className="text-gray-500">ยังไม่มีรูปถ่ายคู่กับบัตรประชาชน</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end mt-4">
            <Button 
              variant="outline" 
              onClick={() => setFullProfileOpen(false)}
            >
              ปิด
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
    </div>
  );
}