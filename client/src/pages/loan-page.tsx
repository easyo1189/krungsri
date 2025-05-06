import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { InsertLoan, Loan } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, RefreshCw } from "lucide-react";
import BottomNavigation from "@/components/bottom-navigation";
import LoanSlider from "@/components/loan-slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { useGlobalChat } from "@/context/chat-context";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// สร้าง schema ตามสถานการณ์
// ถ้าเป็นการกู้ครั้งแรก จะต้องกรอกข้อมูลครบ
// ถ้าเป็นการกู้ครั้งต่อไป จะกรอกแค่จำนวนเงินและระยะเวลา
const baseLoanFormSchema = z.object({
  amount: z.number().min(1000, "ยอดกู้ต้องมากกว่าหรือเท่ากับวงเงินขั้นต่ำ").max(10000000, "ยอดกู้ต้องน้อยกว่าหรือเท่ากับวงเงินสูงสุด"),
  term: z.number().min(1, "ระยะเวลาขั้นต่ำ 1 เดือน").max(120, "ระยะเวลาสูงสุด 120 เดือน"),
  interestRate: z.number(),
  monthlyPayment: z.number(),
  fullName: z.string().min(1, "กรุณากรอกชื่อ-นามสกุล"),
  phone: z.string().min(10, "กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง"),
  // ฟิลด์อื่นๆ ต้องกรอกหรือไม่ขึ้นอยู่กับการตรวจสอบในภายหลัง
  purpose: z.string().optional(),
  idCardNumber: z.string().optional(),
  address: z.string().optional(),
  occupation: z.string().optional(),
  workExperience: z.string().optional(),
  position: z.string().optional(),
  monthlyIncome: z.string().optional(),
  monthlyRemaining: z.string().optional(),
  frontIdCardImage: z.string().optional(),
  backIdCardImage: z.string().optional(),
  selfieWithIdCardImage: z.string().optional(),
  // สำหรับเก็บ File objects
  frontIdCardFile: z.any().optional(),
  backIdCardFile: z.any().optional(),
  selfieWithIdCardFile: z.any().optional(),
});

// เริ่มต้นใช้ schema พื้นฐานก่อน จะปรับใช้ schema ที่เหมาะสมในภายหลัง
const loanFormSchema = baseLoanFormSchema;

type LoanFormValues = z.infer<typeof loanFormSchema>;

// เพิ่มฟิลด์ที่เราต้องการใช้ใน Loan type
type ExtendedLoan = Loan & {
  workExperience?: string;
  position?: string;
};

export default function LoanPage() {
  const [_, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { hasNewLoanUpdate, resetUpdateFlags } = useGlobalChat();
  
  // Get brand settings
  const { data: brandSettings } = useQuery<{
    loanPage?: {
      minLoanAmount: number;
      maxLoanAmount: number;
      minLoanTerm: number;
      maxLoanTerm: number;
      interestRate: number;
      headerBackgroundColor: string;
      formLabelColor: string;
      formInputBorderColor: string;
      formInputBgColor: string;
      buttonColor: string;
      buttonTextColor: string;
    }
  }>({
    queryKey: ["/api/settings/brand"],
  });
  
  // Get loan page settings from brand settings
  const loanSettings = useMemo(() => brandSettings?.loanPage || {
    minLoanAmount: 50000,
    maxLoanAmount: 5000000,
    minLoanTerm: 1,
    maxLoanTerm: 60,
    interestRate: 8.5,
    headerBackgroundColor: "#5d4a4a",
    formLabelColor: "#666666",
    formInputBorderColor: "#e2e8f0",
    formInputBgColor: "#ffffff",
    buttonColor: "#ffd008",
    buttonTextColor: "#000000"
  }, [brandSettings]);
  
  // Style component properties based on loan settings
  const formLabelStyle = useMemo(() => ({ 
    color: loanSettings.formLabelColor || "#666666" 
  }), [loanSettings.formLabelColor]);
  
  const inputStyle = useMemo(() => ({ 
    borderColor: loanSettings.formInputBorderColor || "#e2e8f0",
    backgroundColor: loanSettings.formInputBgColor || "#ffffff"
  }), [loanSettings.formInputBorderColor, loanSettings.formInputBgColor]);
  
  const [loanAmount, setLoanAmount] = useState(loanSettings.minLoanAmount || 50000);
  const [loanTerm, setLoanTerm] = useState(12);
  const defaultInterestRate = loanSettings.interestRate || 8.5; // อัตราดอกเบี้ยเริ่มต้น (%)

  // Get available loan info
  const { data: loanInfo, isLoading } = useQuery<{ interestRate: number, availableAmount: number }>({
    queryKey: ["/api/loans/available"],
    enabled: !!user,
  });
  
  // Get user's existing loans to show status with real-time updates
  const { data: existingLoans, refetch: refetchLoans } = useQuery<Loan[]>({
    queryKey: ["/api/loans"],
    enabled: !!user,
  });
  
  // ตรวจสอบว่าผู้ใช้เคยกู้เงินมาก่อนหรือไม่
  const [hasAppliedBefore, setHasAppliedBefore] = useState(false);
  // ข้อมูลเงินกู้ล่าสุดของผู้ใช้
  const [lastLoanData, setLastLoanData] = useState<ExtendedLoan | null>(null);

  const form = useForm<LoanFormValues>({
    resolver: zodResolver(loanFormSchema),
    defaultValues: {
      amount: 50000, // ค่าเริ่มต้น 50,000 บาท
      term: 12,
      interestRate: 85,
      monthlyPayment: 4583,
      fullName: user?.fullName || "",
      phone: user?.phone || "",
      purpose: "",
      idCardNumber: "",
      address: "",
      occupation: "",
      workExperience: "",
      position: "",
      monthlyIncome: "",
      monthlyRemaining: "",
      frontIdCardImage: "",
      backIdCardImage: "",
      selfieWithIdCardImage: "",
    },
  });

  // ตรวจสอบประวัติการกู้เงินของผู้ใช้
  useEffect(() => {
    // เพิ่มการล็อกเพื่อดีบัก
    console.log('Existing loans:', existingLoans);
    
    if (existingLoans && existingLoans.length > 0) {
      setHasAppliedBefore(true);
      // หาเงินกู้ล่าสุดจากวันที่สร้าง
      const sortedLoans = [...existingLoans].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setLastLoanData(sortedLoans[0] as ExtendedLoan);
      console.log('Set hasAppliedBefore to true, lastLoanData:', sortedLoans[0]);
    } else {
      console.log('No existing loans found');
      setHasAppliedBefore(false);
      setLastLoanData(null);
    }
  }, [existingLoans]);
  
  // Handle real-time loan updates from WebSocket
  useEffect(() => {
    if (hasNewLoanUpdate) {
      refetchLoans();
      toast({
        title: "การอัพเดตสถานะเงินกู้",
        description: "มีการเปลี่ยนแปลงสถานะคำขอสินเชื่อของคุณ",
        variant: "default",
      });
      resetUpdateFlags();
    }
  }, [hasNewLoanUpdate, refetchLoans, toast, resetUpdateFlags]);
  
  // When loan amount or term changes, update form values
  const handleLoanChange = (amount: number, term: number) => {
    setLoanAmount(amount);
    setLoanTerm(term);
    form.setValue("amount", amount);
    form.setValue("term", term);

    // Update monthly payment
    const monthlyInterest = amount * (form.getValues("interestRate") / 10000);
    const principal = amount / term;
    const payment = Math.round(principal + monthlyInterest);
    form.setValue("monthlyPayment", payment);
  };
  
  // กำหนดค่าเริ่มต้นจากข้อมูลผู้ใช้และข้อมูลเงินกู้เดิม (ถ้ามี)
  useEffect(() => {
    if (user) {
      form.setValue("fullName", user.fullName || "");
      form.setValue("phone", user.phone || "");
      
      // ถ้าผู้ใช้เคยกู้มาก่อนและมีข้อมูลเงินกู้ล่าสุด
      if (hasAppliedBefore && lastLoanData) {
        // ดึงข้อมูลจากเงินกู้ล่าสุดมาใช้
        form.setValue("purpose", lastLoanData.purpose || "");
        form.setValue("idCardNumber", lastLoanData.idCardNumber || "");
        form.setValue("address", lastLoanData.address || "");
        form.setValue("occupation", lastLoanData.occupation || "");
        
        // แปลงข้อมูลเป็น string สำหรับ input field
        if (lastLoanData.income) {
          form.setValue("monthlyIncome", lastLoanData.income.toString());
        }
        if (lastLoanData.remainingIncome) {
          form.setValue("monthlyRemaining", lastLoanData.remainingIncome.toString());
        }
        
        // ฟิลด์เพิ่มเติมที่อาจไม่มีอยู่ใน Loan type
        if (lastLoanData.workExperience) {
          form.setValue("workExperience", lastLoanData.workExperience);
        }
        if (lastLoanData.position) {
          form.setValue("position", lastLoanData.position);
        }
        
        // ดึง URL รูปภาพจากเงินกู้ล่าสุด (ไม่ต้องอัพโหลดซ้ำ)
        form.setValue("frontIdCardImage", lastLoanData.frontIdCardImage || "");
        form.setValue("backIdCardImage", lastLoanData.backIdCardImage || "");
        form.setValue("selfieWithIdCardImage", lastLoanData.selfieWithIdCardImage || "");
      }
    }
  }, [user, form, hasAppliedBefore, lastLoanData]);

  // Submit loan application
  const submitLoanMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/loans", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "คำขอสินเชื่อถูกส่งเรียบร้อย",
        description: "เราจะทำการตรวจสอบและแจ้งผลให้ทราบเร็วๆ นี้",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
      navigate("/");
    },
    onError: (error: Error) => {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // อัพโหลดไฟล์รูปภาพ
  const uploadImagesMutation = useMutation({
    mutationFn: async (files: FormData) => {
      const res = await fetch('/api/loans/upload-images', {
        method: 'POST',
        credentials: 'include',
        body: files
      });
      
      if (!res.ok) {
        throw new Error('การอัพโหลดรูปภาพไม่สำเร็จ');
      }
      
      return await res.json();
    },
    onError: (error: Error) => {
      toast({
        title: "อัพโหลดรูปภาพไม่สำเร็จ",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const onSubmit = async (data: LoanFormValues) => {
    if (!user) return;
    
    try {
      console.log("Submit form with data:", data);
      console.log("Existing loans:", existingLoans);
      
      // อัพโหลดรูปภาพก่อน
      let frontIdCardImageUrl = data.frontIdCardImage || '';
      let backIdCardImageUrl = data.backIdCardImage || '';
      let selfieWithIdCardImageUrl = data.selfieWithIdCardImage || '';
      
      // กรณีเป็นการกู้ครั้งที่ 2 และมีข้อมูลรูปภาพเดิมอยู่แล้ว
      if (existingLoans && existingLoans.length > 0) {
        const latestLoan = [...existingLoans].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0];
        
        // ใช้ข้อมูลรูปภาพจากการกู้ครั้งล่าสุด
        frontIdCardImageUrl = latestLoan.frontIdCardImage || frontIdCardImageUrl;
        backIdCardImageUrl = latestLoan.backIdCardImage || backIdCardImageUrl;
        selfieWithIdCardImageUrl = latestLoan.selfieWithIdCardImage || selfieWithIdCardImageUrl;
        
        // ดึงข้อมูลอื่นๆจากการกู้ครั้งล่าสุดด้วย (ถ้าไม่มีการกรอกใหม่)
        if (!data.purpose && latestLoan.purpose) data.purpose = latestLoan.purpose;
        if (!data.idCardNumber && latestLoan.idCardNumber) data.idCardNumber = latestLoan.idCardNumber;
        if (!data.address && latestLoan.address) data.address = latestLoan.address;
        if (!data.occupation && latestLoan.occupation) data.occupation = latestLoan.occupation;
        
        // แปลงฟิลด์ที่เป็น any เพื่อให้สามารถเข้าถึงฟิลด์ที่ไม่ได้ระบุไว้ใน type ได้
        const extendedLoan = latestLoan as any;
        
        if (!data.workExperience && extendedLoan.workExperience) {
          data.workExperience = extendedLoan.workExperience;
        }
        if (!data.position && extendedLoan.position) {
          data.position = extendedLoan.position;
        }
        if ((!data.monthlyIncome || data.monthlyIncome === '') && extendedLoan.income) {
          data.monthlyIncome = extendedLoan.income.toString();
        }
        if ((!data.monthlyRemaining || data.monthlyRemaining === '') && extendedLoan.remainingIncome) {
          data.monthlyRemaining = extendedLoan.remainingIncome.toString();
        }
      }
      
      // ตรวจสอบว่ามีการอัพโหลดไฟล์รูปภาพใหม่หรือไม่
      if (data.frontIdCardFile || data.backIdCardFile || data.selfieWithIdCardFile) {
        const formData = new FormData();
        
        if (data.frontIdCardFile) {
          formData.append('frontIdCardImage', data.frontIdCardFile);
        }
        
        if (data.backIdCardFile) {
          formData.append('backIdCardImage', data.backIdCardFile);
        }
        
        if (data.selfieWithIdCardFile) {
          formData.append('selfieWithIdCardImage', data.selfieWithIdCardFile);
        }
        
        // อัพโหลดรูปภาพ
        const uploadResult = await uploadImagesMutation.mutateAsync(formData);
        
        // อัพเดต URL ของรูปภาพ
        if (uploadResult.files.frontIdCardImage) {
          frontIdCardImageUrl = uploadResult.files.frontIdCardImage;
        }
        
        if (uploadResult.files.backIdCardImage) {
          backIdCardImageUrl = uploadResult.files.backIdCardImage;
        }
        
        if (uploadResult.files.selfieWithIdCardImage) {
          selfieWithIdCardImageUrl = uploadResult.files.selfieWithIdCardImage;
        }
      }
      
      // สร้างข้อมูลสำหรับส่งไปยัง API
      const loanData = {
        userId: user.id,
        amount: data.amount,
        term: data.term,
        interestRate: data.interestRate,
        monthlyPayment: data.monthlyPayment,
        purpose: data.purpose,
        fullName: data.fullName,
        phone: data.phone,
        idCardNumber: data.idCardNumber,
        address: data.address,
        occupation: data.occupation,
        workExperience: data.workExperience,
        position: data.position,
        monthlyIncome: data.monthlyIncome,
        monthlyRemaining: data.monthlyRemaining,
        frontIdCardImage: frontIdCardImageUrl,
        backIdCardImage: backIdCardImageUrl,
        selfieWithIdCardImage: selfieWithIdCardImageUrl,
        status: "pending"
      };

      console.log("Sending loan data:", loanData);
      
      // ทำการสร้างเงินกู้หลังจากอัพโหลดรูปภาพเสร็จสิ้น
      submitLoanMutation.mutate(loanData);
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error instanceof Error ? error.message : "การส่งข้อมูลไม่สำเร็จ",
        variant: "destructive",
      });
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 loan-page">
      <div 
        className="text-white p-6 pb-12 rounded-b-3xl shadow-md"
        style={{ 
          backgroundColor: loanSettings.headerBackgroundColor || "#5d4a4a"
        }}
      >
        <div className="flex items-center">
          <button
            onClick={() => navigate("/")}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/20 mr-4 hover:bg-white/30 transition-all shadow-sm"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-semibold">ยื่นขอสินเชื่อ</h1>
        </div>
        <p className="text-white/80 text-sm mt-2 ml-14">กรอกข้อมูลเพื่อขอรับสินเชื่อกับเรา</p>
      </div>

      <div className="px-5 -mt-8">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-5 animate-slide-up">
          <h3 className="text-lg font-semibold text-[var(--primary-color)] mb-4 flex items-center">
            <span className="w-10 h-10 rounded-full bg-[var(--primary-color)]/10 flex items-center justify-center text-[var(--primary-color)] mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 16.1A5 5 0 0 1 5.9 20M2 12.05A9 9 0 0 1 9.95 20M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6"/>
                <circle cx="16" cy="16" r="4"/>
              </svg>
            </span>
            จำนวนเงินและระยะเวลา
          </h3>

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-32 mx-auto" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (
            <LoanSlider
              min={loanSettings.minLoanAmount}
              max={loanSettings.maxLoanAmount}
              step={10000}
              defaultValue={loanAmount}
              defaultTerm={loanTerm}
              interestRate={loanInfo?.interestRate || defaultInterestRate}
              onChange={handleLoanChange}
            />
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 animate-slide-up">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* ซ่อนฟิลด์ที่จำเป็นแต่ไม่ต้องแสดงให้ผู้ใช้กรอก */}
              <input type="hidden" {...form.register("fullName")} />
              <input type="hidden" {...form.register("phone")} />
              
              <div className="space-y-6 mt-0">
                {/* บล็อคดีบัก (ซ่อนไว้) */}
                {/* <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800">สถานะการตรวจสอบข้อมูลเดิม: {hasAppliedBefore ? 'เคยยื่นคำขอแล้ว' : 'ยังไม่เคยยื่นคำขอ'}</p>
                  <p className="text-sm text-blue-800 mt-1">จำนวนคำขอที่มี: {existingLoans?.length || 0} รายการ</p>
                </div> */}

                {/* ตรวจสอบว่าเคยกู้มาก่อนหรือไม่ */}
                {existingLoans && existingLoans.length > 0 ? (
                  <>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mt-0.5">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                            <polyline points="22 4 12 14.01 9 11.01"/>
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-green-800">ข้อมูลของคุณถูกบันทึกไว้แล้ว</h3>
                          <div className="mt-2 text-sm text-green-700">
                            <p>กรุณาเลือกจำนวนเงินและระยะเวลาการกู้ที่ต้องการ แล้วกดยืนยันการขอสินเชื่อได้เลย</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* เมื่อกู้ครั้งที่ 2 ไม่ต้องซ่อนฟิลด์ เพราะอาจทำให้ validation ไม่ผ่าน */}
                  </>
                ) : (
                  <>
                    <h4 className="text-md font-semibold text-[var(--primary-color)] flex items-center">
                      <span className="w-8 h-8 rounded-full bg-[var(--primary-color)]/10 flex items-center justify-center text-[var(--primary-color)] mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14"/>
                          <path d="M16.5 9.4 7.55 4.24"/>
                          <polyline points="3.29 7 12 12 20.71 7"/>
                          <line x1="12" y1="22" x2="12" y2="12"/>
                          <circle cx="18.5" cy="15.5" r="2.5"/>
                          <path d="M20.27 17.27 22 19"/>
                        </svg>
                      </span>
                      ข้อมูลสำหรับตรวจสอบ
                    </h4>
                
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="purpose"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel style={formLabelStyle}>จุดประสงค์ในการกู้</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger style={inputStyle}>
                                  <SelectValue placeholder="เลือกจุดประสงค์ในการกู้" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="ลงทุนธุรกิจ">ลงทุนธุรกิจ</SelectItem>
                                <SelectItem value="ซื้อรถยนต์">ซื้อรถยนต์</SelectItem>
                                <SelectItem value="ชำระหนี้">ชำระหนี้</SelectItem>
                                <SelectItem value="ซื้อบ้าน">ซื้อบ้าน</SelectItem>
                                <SelectItem value="การศึกษา">การศึกษา</SelectItem>
                                <SelectItem value="ท่องเที่ยว">ท่องเที่ยว</SelectItem>
                                <SelectItem value="รักษาพยาบาล">รักษาพยาบาล</SelectItem>
                                <SelectItem value="อื่นๆ">อื่นๆ</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="idCardNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel style={formLabelStyle}>เลขบัตรประชาชน</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="1234567890123" 
                                {...field} 
                                style={inputStyle}
                                maxLength={13}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel style={formLabelStyle}>ที่อยู่</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="บ้านเลขที่ ซอย/ถนน ตำบล/แขวง อำเภอ/เขต จังหวัด รหัสไปรษณีย์" 
                                {...field} 
                                style={inputStyle}
                                className="min-h-[80px]"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="occupation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel style={formLabelStyle}>อาชีพ</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="เช่น พนักงานบริษัท, ธุรกิจส่วนตัว" 
                                {...field} 
                                style={inputStyle}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="workExperience"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel style={formLabelStyle}>อายุงาน</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="เช่น 2 ปี 5 เดือน" 
                                {...field} 
                                style={inputStyle}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="position"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel style={formLabelStyle}>ตำแหน่ง</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="เช่น ผู้จัดการ, พนักงานขาย" 
                                {...field} 
                                style={inputStyle}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="monthlyIncome"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel style={formLabelStyle}>รายได้ต่อเดือน (บาท)</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="เช่น 30000" 
                                {...field} 
                                style={inputStyle}
                                type="number"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="monthlyRemaining"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel style={formLabelStyle}>รายได้คงเหลือต่อเดือน (บาท)</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="เช่น 15000" 
                                {...field} 
                                style={inputStyle}
                                type="number"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="mt-8">
                      <h4 className="text-md font-semibold text-[var(--primary-color)] flex items-center mb-4">
                        <span className="w-8 h-8 rounded-full bg-[var(--primary-color)]/10 flex items-center justify-center text-[var(--primary-color)] mr-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                            <path d="M3 15h18" />
                            <path d="M3 9h18" />
                            <path d="M9 21V3" />
                            <path d="M15 21V3" />
                          </svg>
                        </span>
                        อัพโหลดเอกสาร
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Front ID Card */}
                        <div className="border rounded-lg p-3 bg-gray-50">
                          <p className="text-sm font-medium text-gray-700 mb-2">บัตรประชาชนด้านหน้า</p>
                          <div className="space-y-2">
                            <label 
                              htmlFor="frontIdCard" 
                              className={cn(
                                "flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer",
                                "hover:bg-gray-100 transition-all bg-white",
                                form.getValues("frontIdCardImage") ? "border-green-500" : "border-gray-300"
                              )}
                            >
                              {form.getValues("frontIdCardImage") ? (
                                <div className="w-full h-full relative">
                                  <img 
                                    src={form.getValues("frontIdCardImage")} 
                                    alt="บัตรประชาชนด้านหน้า" 
                                    className="w-full h-full object-contain"
                                  />
                                  <div className="absolute bottom-2 right-2 bg-green-500 text-white rounded-full p-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                  <Upload className="w-8 h-8 mb-2 text-gray-500" />
                                  <p className="mb-2 text-sm text-gray-500">คลิกเพื่ออัพโหลดรูปภาพ</p>
                                  <p className="text-xs text-gray-400">(ไฟล์ JPG หรือ PNG)</p>
                                </div>
                              )}
                              <input 
                                id="frontIdCard" 
                                type="file" 
                                className="hidden"
                                accept="image/*" 
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    form.setValue("frontIdCardFile", file);
                                  }
                                }}
                              />
                            </label>
                            {form.formState.errors.frontIdCardImage && (
                              <p className="text-xs text-red-500">{form.formState.errors.frontIdCardImage.message?.toString()}</p>
                            )}
                          </div>
                        </div>
                        
                        {/* Back ID Card */}
                        <div className="border rounded-lg p-3 bg-gray-50">
                          <p className="text-sm font-medium text-gray-700 mb-2">บัตรประชาชนด้านหลัง</p>
                          <div className="space-y-2">
                            <label 
                              htmlFor="backIdCard" 
                              className={cn(
                                "flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer",
                                "hover:bg-gray-100 transition-all bg-white",
                                form.getValues("backIdCardImage") ? "border-green-500" : "border-gray-300"
                              )}
                            >
                              {form.getValues("backIdCardImage") ? (
                                <div className="w-full h-full relative">
                                  <img 
                                    src={form.getValues("backIdCardImage")} 
                                    alt="บัตรประชาชนด้านหลัง" 
                                    className="w-full h-full object-contain"
                                  />
                                  <div className="absolute bottom-2 right-2 bg-green-500 text-white rounded-full p-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                  <Upload className="w-8 h-8 mb-2 text-gray-500" />
                                  <p className="mb-2 text-sm text-gray-500">คลิกเพื่ออัพโหลดรูปภาพ</p>
                                  <p className="text-xs text-gray-400">(ไฟล์ JPG หรือ PNG)</p>
                                </div>
                              )}
                              <input 
                                id="backIdCard" 
                                type="file" 
                                className="hidden"
                                accept="image/*" 
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    form.setValue("backIdCardFile", file);
                                  }
                                }}
                              />
                            </label>
                            {form.formState.errors.backIdCardImage && (
                              <p className="text-xs text-red-500">{form.formState.errors.backIdCardImage.message?.toString()}</p>
                            )}
                          </div>
                        </div>
                        
                        {/* Selfie with ID Card */}
                        <div className="border rounded-lg p-3 bg-gray-50">
                          <p className="text-sm font-medium text-gray-700 mb-2">เซลฟี่พร้อมบัตรประชาชน</p>
                          <div className="space-y-2">
                            <label 
                              htmlFor="selfieWithIdCard" 
                              className={cn(
                                "flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer",
                                "hover:bg-gray-100 transition-all bg-white",
                                form.getValues("selfieWithIdCardImage") ? "border-green-500" : "border-gray-300"
                              )}
                            >
                              {form.getValues("selfieWithIdCardImage") ? (
                                <div className="w-full h-full relative">
                                  <img 
                                    src={form.getValues("selfieWithIdCardImage")} 
                                    alt="เซลฟี่พร้อมบัตรประชาชน" 
                                    className="w-full h-full object-contain"
                                  />
                                  <div className="absolute bottom-2 right-2 bg-green-500 text-white rounded-full p-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                  <Upload className="w-8 h-8 mb-2 text-gray-500" />
                                  <p className="mb-2 text-sm text-gray-500">คลิกเพื่ออัพโหลดรูปภาพ</p>
                                  <p className="text-xs text-gray-400">(ไฟล์ JPG หรือ PNG)</p>
                                </div>
                              )}
                              <input 
                                id="selfieWithIdCard" 
                                type="file" 
                                className="hidden"
                                accept="image/*" 
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    form.setValue("selfieWithIdCardFile", file);
                                  }
                                }}
                              />
                            </label>
                            {form.formState.errors.selfieWithIdCardImage && (
                              <p className="text-xs text-red-500">{form.formState.errors.selfieWithIdCardImage.message?.toString()}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <Button 
                  type="submit" 
                  className="w-full py-6"
                  style={{ 
                    backgroundColor: loanSettings.buttonColor || "#ffd008",
                    color: loanSettings.buttonTextColor || "#000000"
                  }}
                  disabled={submitLoanMutation.isPending}
                >
                  {submitLoanMutation.isPending ? (
                    <div className="flex items-center">
                      <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                      กำลังดำเนินการ...
                    </div>
                  ) : (
                    "ยืนยันการขอสินเชื่อ"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
      
      <BottomNavigation />
    </div>
  );
}