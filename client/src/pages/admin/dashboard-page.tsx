import { useState, useEffect } from "react";
import AdminSidebar from "@/components/admin-sidebar";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loan, User, Withdrawal, Account } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/use-websocket";
import {
  Bell,
  TrendingUp,
  Users,
  MessageSquare,
  BarChart,
  Edit,
  CheckCircle,
  XCircle,
  FileText,
  DollarSign,
  UserCheck,
  RefreshCw,
  ArrowLeft,
  Home,
  LogOut,
  Settings,
  PieChart,
  User as UserIcon,
  Activity,
  CreditCard,
  Shield,
  Filter,
  Search,
  Repeat,
  Calendar,
  Clock,
  ThumbsUp,
  ThumbsDown,
  MoreHorizontal,
  Circle,
  Eye,
  ClipboardCheck,
  ExternalLink,
  KeyRound,
  Wallet,
  Pencil
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsIePieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { formatThaiCurrency } from "@/lib/utils";
import { format, parseISO, subDays } from "date-fns";
import { th } from "date-fns/locale";
import * as z from "zod";

// Form schema for user edit
const userEditSchema = z.object({
  username: z.string().min(3, "ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร").optional(),
  // รหัสผ่านอาจจะว่างได้ (ถ้าไม่ต้องการเปลี่ยน) หรือถ้ากรอกต้องมีอย่างน้อย 6 ตัวอักษร
  password: z.union([
    z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
    z.string().max(0)
  ]).optional(),
  fullName: z.string().min(1, "กรุณากรอกชื่อ-นามสกุล"),
  email: z.string().email("อีเมลไม่ถูกต้อง"),
  phone: z.string().min(1, "กรุณากรอกเบอร์โทรศัพท์"),
  withdrawalCode: z.string().min(6, "รหัสถอนเงินต้องมีอย่างน้อย 6 ตัวอักษร").max(8, "รหัสถอนเงินต้องไม่เกิน 8 ตัวอักษร").optional(),
  status: z.enum(["active", "blocked_withdrawal", "blocked_login", "blocked_loan"]),
  address: z.string().optional(),
  occupation: z.string().optional(),
  monthlyIncome: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().optional()
  ),
  idCardNumber: z.string().optional(),
});

type UserEditForm = z.infer<typeof userEditSchema>;

// เพิ่ม schema สำหรับแก้ไขข้อมูลการถอนเงิน
const withdrawalEditSchema = z.object({
  amount: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number({ invalid_type_error: "กรุณาระบุจำนวนเงิน" })
      .positive("จำนวนเงินต้องเป็นตัวเลขบวก")
      .min(100, "จำนวนเงินขั้นต่ำคือ 100 บาท")
  ),
  bankName: z.string().min(1, "กรุณาเลือกธนาคาร"),
  accountNumber: z
    .string()
    .min(10, "เลขบัญชีต้องมีอย่างน้อย 10 ตัว")
    .max(15, "เลขบัญชีต้องไม่เกิน 15 ตัว")
    .regex(/^\d+$/, "เลขบัญชีต้องเป็นตัวเลขเท่านั้น"),
  accountName: z
    .string()
    .min(3, "กรุณาระบุชื่อบัญชี"),
  status: z.enum(["pending", "approved", "rejected"]),
  adminNote: z.string().optional(),
});

type WithdrawalEditForm = z.infer<typeof withdrawalEditSchema>;

// เพิ่ม schema สำหรับแก้ไขข้อมูลเงินกู้
const loanEditSchema = z.object({
  amount: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number({ invalid_type_error: "กรุณาระบุจำนวนเงิน" })
      .positive("จำนวนเงินต้องเป็นตัวเลขบวก")
      .min(50000, "จำนวนเงินขั้นต่ำคือ 50,000 บาท")
      .max(5000000, "จำนวนเงินสูงสุดคือ 5,000,000 บาท")
  ),
  term: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number({ invalid_type_error: "กรุณาระบุระยะเวลา" })
      .positive("ระยะเวลาต้องเป็นตัวเลขบวก")
      .min(1, "ระยะเวลาขั้นต่ำคือ 1 เดือน")
      .max(60, "ระยะเวลาสูงสุดคือ 60 เดือน")
  ),
  purpose: z.string().min(1, "กรุณาระบุวัตถุประสงค์"),
  status: z.enum(["pending", "approved", "rejected"]),
  adminNote: z.string().optional(),
  fullName: z.string().min(1, "กรุณากรอกชื่อ-นามสกุล"),
  age: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number({ invalid_type_error: "กรุณาระบุอายุ" })
      .positive("อายุต้องเป็นตัวเลขบวก")
      .min(20, "อายุขั้นต่ำคือ 20 ปี")
      .max(60, "อายุสูงสุดคือ 60 ปี")
  ),
  occupation: z.string().min(1, "กรุณาระบุอาชีพ"),
  income: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number({ invalid_type_error: "กรุณาระบุรายได้" })
      .positive("รายได้ต้องเป็นตัวเลขบวก")
  ),
  remainingIncome: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number({ invalid_type_error: "กรุณาระบุรายได้คงเหลือ" })
      .positive("รายได้คงเหลือต้องเป็นตัวเลขบวก")
  ).optional(),
  idCardNumber: z.string().min(13, "เลขบัตรประชาชนต้องมี 13 หลัก").max(13, "เลขบัตรประชาชนต้องมี 13 หลัก").optional(),
  address: z.string().min(1, "กรุณาระบุที่อยู่"),
  phone: z.string().min(1, "กรุณาระบุเบอร์โทรศัพท์"),
  // เพิ่มฟิลด์สำหรับรูปภาพเอกสาร
  frontIdCardImage: z.string().optional(),
  backIdCardImage: z.string().optional(),
  selfieWithIdCardImage: z.string().optional(),
});

type LoanEditForm = z.infer<typeof loanEditSchema>;

// สร้าง schema สำหรับปรับยอดเงินในบัญชี
// Schema สำหรับแก้ไขข้อมูลบัญชีธนาคาร
const accountEditSchema = z.object({
  bankName: z.string().min(1, "กรุณาเลือกธนาคาร"),
  accountNumber: z
    .string()
    .min(10, "เลขบัญชีต้องมีอย่างน้อย 10 ตัว")
    .max(15, "เลขบัญชีต้องไม่เกิน 15 ตัว")
    .regex(/^\d+$/, "เลขบัญชีต้องเป็นตัวเลขเท่านั้น"),
  accountName: z
    .string()
    .min(3, "กรุณาระบุชื่อบัญชี"),
  withdrawalCode: z.string().min(6, "รหัสถอนเงินต้องมีอย่างน้อย 6 ตัวอักษร").max(8, "รหัสถอนเงินต้องไม่เกิน 8 ตัวอักษร").optional(),
  balance: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number({ invalid_type_error: "กรุณาระบุยอดเงิน" })
      .nonnegative("ยอดเงินต้องไม่ติดลบ")
  )
});

type AccountEditForm = z.infer<typeof accountEditSchema>;

const adjustBalanceSchema = z.object({
  amount: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number({ invalid_type_error: "กรุณาระบุจำนวนเงิน" })
      .refine((val) => val !== 0, "จำนวนเงินต้องไม่เท่ากับ 0")
  ),
  note: z.string().optional(),
});

type AdjustBalanceForm = z.infer<typeof adjustBalanceSchema>;

const bankOptions = [
  { value: 'กรุงเทพ', label: 'กรุงเทพ' },
  { value: 'ไทยพาณิชย์', label: 'ไทยพาณิชย์' },
  { value: 'กสิกรไทย', label: 'กสิกรไทย' },
  // Add more bank options as needed
];

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const { addMessageListener, isConnected } = useWebSocket();
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isEditWithdrawalOpen, setIsEditWithdrawalOpen] = useState(false);
  const [isEditLoanOpen, setIsEditLoanOpen] = useState(false);
  const [isAdjustBalanceDialogOpen, setIsAdjustBalanceDialogOpen] = useState(false);
  const [isUserDetailsDialogOpen, setIsUserDetailsDialogOpen] = useState(false);
  const [isEditAccountDialogOpen, setIsEditAccountDialogOpen] = useState(false);
  const [userAllData, setUserAllData] = useState<any>(null);
  const [newLoanNotification, setNewLoanNotification] = useState(false);
  const [newWithdrawalNotification, setNewWithdrawalNotification] = useState(false);

  // Get all users
  const { data: users, isLoading: isUsersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: !!user?.isAdmin,
  });

  // Get all loans
  const { data: loans, isLoading: isLoansLoading } = useQuery<Loan[]>({
    queryKey: ["/api/admin/loans"],
    enabled: !!user?.isAdmin,
  });

  // Get all withdrawals
  const { data: withdrawals, isLoading: isWithdrawalsLoading } = useQuery<Withdrawal[]>({
    queryKey: ["/api/admin/withdrawals"],
    enabled: !!user?.isAdmin,
  });
  
  // Get all accounts
  const { data: accounts, isLoading: isAccountsLoading } = useQuery<Account[]>({
    queryKey: ["/api/admin/accounts"],
    enabled: !!user?.isAdmin,
  });

  // Update loan status
  const updateLoanMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      adminNote,
    }: {
      id: number;
      status: string;
      adminNote?: string;
    }) => {
      const res = await apiRequest("PATCH", `/api/admin/loans/${id}`, {
        status,
        adminNote,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "อัพเดทสถานะเงินกู้สำเร็จ",
        description: "สถานะเงินกู้ถูกอัพเดทเรียบร้อยแล้ว",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/loans"] });
      setSelectedLoan(null);
    },
    onError: (error: Error) => {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update withdrawal status
  const updateWithdrawalMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      adminNote,
      amount,
      bankName,
      accountNumber,
      accountName,
    }: {
      id: number;
      status?: string;
      adminNote?: string;
      amount?: number;
      bankName?: string;
      accountNumber?: string;
      accountName?: string;
    }) => {
      const res = await apiRequest("PATCH", `/api/admin/withdrawals/${id}`, {
        ...(status && { status }),
        adminNote,
        amount,
        bankName,
        accountNumber,
        accountName,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "อัพเดทสถานะการถอนเงินสำเร็จ",
        description: "สถานะการถอนเงินถูกอัพเดทเรียบร้อยแล้ว",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/account"] });
      setSelectedWithdrawal(null);
      setIsEditWithdrawalOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update user status
  const createUserMutation = useMutation({
    mutationFn: async (data: Omit<UserEditForm, "id">) => {
      const res = await apiRequest("POST", "/api/admin/users", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "เพิ่มผู้ใช้สำเร็จ",
        description: "ผู้ใช้ใหม่ถูกเพิ่มเข้าระบบเรียบร้อยแล้ว",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsAddUserDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({
      id,
      isActive,
      ...updates
    }: {
      id: number;
      isActive?: boolean;
      [key: string]: any;
    }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${id}`, {
        isActive,
        ...updates,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "อัพเดทข้อมูลผู้ใช้สำเร็จ",
        description: "ข้อมูลผู้ใช้ถูกอัพเดทเรียบร้อยแล้ว",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setSelectedUser(null);
      setIsEditDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // เพิ่ม mutation สำหรับแก้ไขข้อมูลเงินกู้
  const updateLoanMutation2 = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: number;
      [key: string]: any;
    }) => {
      const res = await apiRequest("PATCH", `/api/admin/loans/${id}`, updates);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "แก้ไขข้อมูลเงินกู้สำเร็จ",
        description: "ข้อมูลเงินกู้ถูกอัพเดทเรียบร้อยแล้ว",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/loans"] });
      setSelectedLoan(null);
      setIsEditLoanOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutation สำหรับอัพเดทบัญชีธนาคารของผู้ใช้
  const updateAccountFullMutation = useMutation({
    mutationFn: async ({
      userId,
      bankName,
      accountNumber,
      accountName,
      withdrawalCode,
      balance,
    }: {
      userId: number;
      bankName?: string;
      accountNumber?: string;
      accountName?: string;
      withdrawalCode?: string;
      balance?: number;
    }) => {
      const res = await apiRequest("PATCH", `/api/admin/accounts/${userId}`, {
        bankName,
        accountNumber,
        accountName,
        withdrawalCode,
        balance,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "อัพเดทข้อมูลบัญชีธนาคารสำเร็จ",
        description: "ข้อมูลบัญชีธนาคารถูกอัพเดทเรียบร้อยแล้ว",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/all-user-data"] });
      setIsEditAccountDialogOpen(false);
      
      // รีโหลดข้อมูลผู้ใช้ทั้งหมดหากมีการแก้ไขข้อมูลบัญชี
      if (selectedUser) {
        handleViewUserDetails(selectedUser);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation สำหรับอัพเดทรหัสถอนเงินในบัญชีผู้ใช้
  const updateAccountMutation = useMutation({
    mutationFn: async ({
      userId,
      withdrawalCode,
    }: {
      userId: number;
      withdrawalCode: string;
    }) => {
      const res = await apiRequest("PATCH", `/api/admin/accounts/${userId}`, {
        withdrawalCode,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "อัพเดทรหัสถอนเงินสำเร็จ",
        description: "รหัสถอนเงินถูกอัพเดทเรียบร้อยแล้ว",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/accounts"] });
    },
    onError: (error: Error) => {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutation สำหรับปรับยอดเงินในบัญชี
  const adjustBalanceMutation = useMutation({
    mutationFn: async ({
      userId,
      amount,
      note,
    }: {
      userId: number;
      amount: number;
      note?: string;
    }) => {
      const res = await apiRequest("POST", `/api/admin/accounts/${userId}/adjust-balance`, {
        amount,
        note,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "ปรับยอดเงินในบัญชีสำเร็จ",
        description: "ยอดเงินในบัญชีถูกปรับปรุงเรียบร้อยแล้ว",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/accounts"] });
      setSelectedUser(null);
      setIsAdjustBalanceDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      });
    },
  });


  const form = useForm<UserEditForm>({
    resolver: zodResolver(userEditSchema),
    defaultValues: {
      status: "active",
    },
  });
  
  // สร้าง form สำหรับเพิ่มผู้ใช้ใหม่
  const addUserForm = useForm<UserEditForm>({
    resolver: zodResolver(userEditSchema),
    defaultValues: {
      status: "active",
    },
  });

  // เพิ่ม form สำหรับแก้ไขข้อมูลการถอนเงิน
  const withdrawalForm = useForm<WithdrawalEditForm>({
    resolver: zodResolver(withdrawalEditSchema),
  });

  // เพิ่ม form สำหรับแก้ไขข้อมูลเงินกู้
  const loanForm = useForm<LoanEditForm>({
    resolver: zodResolver(loanEditSchema),
  });
  
  // เพิ่ม form สำหรับแก้ไขข้อมูลบัญชีธนาคาร
  const accountEditForm = useForm<AccountEditForm>({
    resolver: zodResolver(accountEditSchema),
  });
  
  // เพิ่ม form สำหรับปรับยอดเงินในบัญชี
  const adjustBalanceForm = useForm<AdjustBalanceForm>({
    resolver: zodResolver(adjustBalanceSchema),
    defaultValues: {
      amount: 0,
      note: "",
    },
  });

  const getUserStatusText = (user: User) => {
    if (!user.isActive) return "ห้ามเข้าสู่ระบบ";
    switch (user.status) {
      case "blocked_withdrawal":
        return "ห้ามถอนเงิน";
      case "blocked_loan":
        return "ห้ามกู้เงิน";
      default:
        return "ใช้งานได้ปกติ";
    }
  };

  const handleEditUser = async (user: User) => {
    setSelectedUser(user);
    
    // พยายามดึงข้อมูลบัญชีของผู้ใช้เพื่อดึงรหัสถอนเงิน
    let withdrawalCode = "";
    if (accounts) {
      const userAccount = accounts.find(account => account.userId === user.id);
      if (userAccount) {
        withdrawalCode = userAccount.withdrawalCode || "";
      }
    }
    
    form.reset({
      username: user.username,
      password: "", // เว้นว่างเพื่อไม่ต้องเปลี่ยน password
      withdrawalCode: withdrawalCode, // ใส่รหัสถอนเงินที่ดึงจากบัญชีผู้ใช้
      fullName: user.fullName,
      email: user.email,
      phone: user.phone || "",
      // address และ occupation ถูกลบออกเนื่องจากไม่มีใน form schema
      status: user.isActive ? (user.status as any) || "active" : "blocked_login",
    });
    setIsEditDialogOpen(true);
  };

  const handleEditWithdrawal = (withdrawal: Withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    withdrawalForm.reset({
      amount: withdrawal.amount,
      bankName: withdrawal.bankName,
      accountNumber: withdrawal.accountNumber,
      accountName: withdrawal.accountName,
      status: withdrawal.status as any,
      adminNote: withdrawal.adminNote || "",
    });
    setIsEditWithdrawalOpen(true);
  };
  
  // ฟังก์ชันสำหรับแก้ไขข้อมูลบัญชีธนาคาร
  const handleEditAccount = (account: Account) => {
    if (!selectedUser) return;
    
    accountEditForm.reset({
      bankName: account.bankName || "",
      accountNumber: account.accountNumber || "",
      accountName: account.accountName || "",
      withdrawalCode: account.withdrawalCode || "",
      balance: account.balance || 0
    });
    
    setIsEditAccountDialogOpen(true);
  };

  // ฟังก์ชันสำหรับเรียกดูข้อมูลผู้ใช้ทั้งหมด
  const handleViewUserDetails = async (user: User) => {
    try {
      setSelectedUser(user);
      
      // แสดง loading state
      setUserAllData(null);
      setIsUserDetailsDialogOpen(true);
      
      // เรียก API เพื่อดึงข้อมูลทั้งหมดของผู้ใช้
      const response = await fetch(`/api/admin/all-user-data/${user.id}`);
      
      if (!response.ok) {
        throw new Error("ไม่สามารถดึงข้อมูลผู้ใช้ได้");
      }
      
      const data = await response.json();
      setUserAllData(data);
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      });
      setIsUserDetailsDialogOpen(false);
    }
  };

  const onSubmit = (data: UserEditForm) => {
    // กรณีแก้ไขผู้ใช้ (จะใช้เฉพาะเมื่อมีการเรียก handleEditUser และมี selectedUser)
    if (selectedUser) {
      // ถ้าไม่ได้กรอกรหัสผ่านให้ตัดฟิลด์นี้ออกเพื่อไม่ต้องอัพเดท
      const { 
        password, 
        withdrawalCode, 
        address, 
        occupation, 
        monthlyIncome, 
        idCardNumber,
        ...userDataBase 
      } = data;
      
      const userData = {
        ...userDataBase,
        id: selectedUser.id,
        // เพิ่มรหัสผ่านเฉพาะเมื่อมีการกรอก
        ...(password ? { password } : {}),
        isActive: data.status !== "blocked_login",
        status: data.status === "blocked_login" ? "active" : data.status,
      };
      
      // อัพเดทข้อมูลผู้ใช้
      updateUserMutation.mutate(userData);
      
      // ถ้ามีการกรอกรหัสถอนเงิน ให้อัพเดทข้อมูลบัญชีผู้ใช้
      if (withdrawalCode) {
        updateAccountMutation.mutate({
          userId: selectedUser.id,
          withdrawalCode
        });
      }
    }
  };
  
  // ฟังก์ชันสำหรับการเพิ่มผู้ใช้ใหม่
  const onAddUserSubmit = (data: UserEditForm) => {
    // กรณีเพิ่มผู้ใช้ใหม่
    const { 
      withdrawalCode, 
      address, 
      occupation, 
      monthlyIncome, 
      idCardNumber,
      ...userDataBase
    } = data;
    
    const userData = {
      username: data.username || "",
      password: data.password || "",
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      // ไม่ส่ง withdrawalCode เพราะไม่มีคอลัมน์นี้ในตาราง users
      isActive: true,
      status: "active",
    };
    
    // ใช้ mutation ที่สร้างไว้ และเมื่อสร้างผู้ใช้สำเร็จให้บันทึกรหัสถอนเงิน
    createUserMutation.mutate(userData as any, {
      onSuccess: (newUser) => {
        // ถ้ามีการกรอกรหัสถอนเงิน ให้สร้างบัญชีผู้ใช้พร้อมรหัสถอนเงิน
        if (withdrawalCode) {
          updateAccountMutation.mutate({
            userId: newUser.id,
            withdrawalCode
          });
        }
      }
    });
  };

  const onWithdrawalSubmit = (data: WithdrawalEditForm) => {
    if (!selectedWithdrawal) return;

    const adminNoteText = `Updated by ${user?.fullName || 'Admin'}: ${data.adminNote || ""}`;
    
    updateWithdrawalMutation.mutate({
      id: selectedWithdrawal.id,
      status: data.status,
      amount: data.amount,
      bankName: data.bankName,
      accountNumber: data.accountNumber,
      accountName: data.accountName,
      adminNote: adminNoteText,
    });
  };

  const handleEditLoan = (loan: Loan) => {
    setSelectedLoan(loan);
    
    loanForm.reset({
      amount: loan.amount,
      term: loan.term,
      purpose: loan.purpose || "",
      status: loan.status as any,
      adminNote: loan.adminNote || "",
      fullName: loan.fullName || "",
      age: loan.age || undefined,
      occupation: loan.occupation || "",
      income: loan.income || undefined,
      remainingIncome: loan.remainingIncome || undefined,
      idCardNumber: loan.idCardNumber || "",
      address: loan.address || "",
      phone: loan.phone || "",
      // รูปภาพเอกสาร
      frontIdCardImage: loan.frontIdCardImage || "",
      backIdCardImage: loan.backIdCardImage || "",
      selfieWithIdCardImage: loan.selfieWithIdCardImage || "",
    });
    setIsEditLoanOpen(true);
  };

  const onLoanSubmit = (data: LoanEditForm) => {
    if (!selectedLoan) return;

    // เราต้องแก้ไขข้อมูลผู้ใช้ที่เกี่ยวข้องกับเงินกู้นี้ด้วย
    const loanUserId = selectedLoan.userId;
    
    // ถ้าผู้ใช้ไม่เปลี่ยน ไม่ต้องอัพเดทข้อมูลผู้ใช้
    if (loanUserId) {
      // แก้ไขข้อมูลเงินกู้
      // ต้องดึงข้อมูลที่เราต้องการอัปเดทออกมาเองแทนการใช้ spread operator
      // เพื่อป้องกันปัญหา type error เกี่ยวกับ property ที่ไม่มีอยู่ใน schema ของเรา
      updateLoanMutation2.mutate({
        id: selectedLoan.id,
        amount: data.amount,
        term: data.term,
        purpose: data.purpose,
        status: data.status,
        fullName: data.fullName,
        age: data.age,
        occupation: data.occupation,
        income: data.income,
        remainingIncome: data.remainingIncome,
        idCardNumber: data.idCardNumber,
        phone: data.phone,
        // ถ้าเพิ่ม address อย่าลืมเพิ่มในตาราง schema ด้วย
        address: data.address,
        frontIdCardImage: data.frontIdCardImage,
        backIdCardImage: data.backIdCardImage,
        selfieWithIdCardImage: data.selfieWithIdCardImage,
        adminNote: `Updated by ${user?.fullName || 'Admin'}: ${data.adminNote || ""}`,
      });
    }
  };
  
  // ฟังก์ชันสำหรับการแก้ไขข้อมูลบัญชีธนาคาร
  const onAccountEditSubmit = (data: AccountEditForm) => {
    if (!selectedUser) return;
    
    // แก้ไขข้อมูลบัญชีธนาคาร
    updateAccountFullMutation.mutate({
      userId: selectedUser.id,
      bankName: data.bankName,
      accountNumber: data.accountNumber,
      accountName: data.accountName,
      withdrawalCode: data.withdrawalCode,
      balance: data.balance
    });
  };

  // ฟังก์ชันสำหรับการปรับยอดเงินในบัญชี
  const onAdjustBalanceSubmit = (data: AdjustBalanceForm) => {
    if (!selectedUser || !data.amount) return;
    
    // ปรับยอดเงินในบัญชี
    adjustBalanceMutation.mutate({
      userId: selectedUser.id,
      amount: data.amount,
      note: data.note
    });
  };

  // WebSocket real-time updates for admin
  useEffect(() => {
    if (!user?.isAdmin || !isConnected) return;
    
    const removeListener = addMessageListener((data) => {
      // Process different message types
      switch (data.type) {
        case 'loan_created':
        case 'loan_update':
          // Handle new loan or loan update
          queryClient.invalidateQueries({ queryKey: ["/api/admin/loans"] });
          
          if (data.type === 'loan_created') {
            setNewLoanNotification(true);
            setActiveTab("loans");
            toast({
              title: "มีคำขอสินเชื่อใหม่!",
              description: "มีผู้ใช้ยื่นคำขอสินเชื่อใหม่เข้ามา",
              variant: "default",
            });
            
            // Auto-clear notification after 5 seconds
            setTimeout(() => {
              setNewLoanNotification(false);
            }, 5000);
          }
          break;
          
        case 'withdrawal_created':
        case 'withdrawal_update':
          // Handle new withdrawal or withdrawal update
          queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawals"] });
          
          if (data.type === 'withdrawal_created') {
            setNewWithdrawalNotification(true);
            setActiveTab("withdrawals");
            toast({
              title: "มีคำขอถอนเงินใหม่!",
              description: "มีผู้ใช้ส่งคำขอถอนเงินใหม่เข้ามา",
              variant: "default",
            });
            
            // Auto-clear notification after 5 seconds
            setTimeout(() => {
              setNewWithdrawalNotification(false);
            }, 5000);
          }
          break;
      }
    });
    
    return removeListener;
  }, [user, isConnected, addMessageListener, queryClient, toast, setActiveTab]);
  
  // ไม่ต้องใช้ query นี้เนื่องจากเรามี accounts query อยู่แล้วด้านบน

  // Dashboard statistics calculations
  const dashboardStats = {
    totalUsers: users?.length || 0,
    totalLoans: loans?.length || 0,
    totalWithdrawals: withdrawals?.length || 0,
    pendingLoans: loans?.filter(loan => loan.status === "pending")?.length || 0,
    pendingWithdrawals: withdrawals?.filter(w => w.status === "pending")?.length || 0,
    totalLoanAmount: loans?.reduce((total, loan) => 
      loan.status === "approved" ? total + loan.amount : total, 0) || 0,
    totalWithdrawalAmount: withdrawals?.reduce((total, w) => 
      w.status === "approved" ? total + w.amount : total, 0) || 0,
    activeUsers: users?.filter(u => u.isActive)?.length || 0,
  };

  // Calculate loan status stats for pie chart
  const loanStatusData = [
    { name: "รออนุมัติ", value: loans?.filter(loan => loan.status === "pending")?.length || 0, color: "#fbbf24" },
    { name: "อนุมัติแล้ว", value: loans?.filter(loan => loan.status === "approved")?.length || 0, color: "#10b981" },
    { name: "ปฏิเสธ", value: loans?.filter(loan => loan.status === "rejected")?.length || 0, color: "#ef4444" },
  ];

  // Calculate withdrawal status stats for pie chart
  const withdrawalStatusData = [
    { name: "รออนุมัติ", value: withdrawals?.filter(w => w.status === "pending")?.length || 0, color: "#fbbf24" },
    { name: "อนุมัติแล้ว", value: withdrawals?.filter(w => w.status === "approved")?.length || 0, color: "#10b981" },
    { name: "ปฏิเสธ", value: withdrawals?.filter(w => w.status === "rejected")?.length || 0, color: "#ef4444" },
  ];

  // Generate some mock data for the loan trends graph
  const getLoanTrends = () => {
    const data = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const formattedDate = format(date, 'dd/MM', { locale: th });
      
      // Generate data based on actual loans if possible
      const loansOnThisDay = loans?.filter(loan => {
        if (!loan.createdAt) return false;
        const loanDate = new Date(loan.createdAt);
        return loanDate.toDateString() === date.toDateString();
      });
      
      data.push({
        date: formattedDate,
        loans: loansOnThisDay?.length || 0,
        amount: loansOnThisDay?.reduce((sum, loan) => sum + loan.amount, 0) || 0,
      });
    }
    
    return data;
  };

  const loanTrends = getLoanTrends();

  // ฟังก์ชั่นสำหรับแสดงสถานะของเงินกู้และการถอนเงิน
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">รออนุมัติ</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">อนุมัติแล้ว</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">ปฏิเสธ</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // ฟังก์ชั่นสำหรับแสดงอักษรย่อของชื่อผู้ใช้
  const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length === 1) return name.substring(0, 2).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen bg-light flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#1a2942] mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
          <Button onClick={() => navigate("/")}>กลับสู่หน้าหลัก</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 bg-[#1a2942] text-white">
        <div className="flex items-center justify-center h-20 border-b border-gray-700">
          <h1 className="text-xl font-semibold">CashLuxe Admin</h1>
        </div>
        <div className="flex flex-col flex-1 overflow-y-auto">
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
            {/* เมนูที่เคยอยู่ตรงนี้ถูกนำออกแล้ว */}
            <Button 
              variant="ghost" 
              className="w-full justify-start text-white hover:bg-gray-700"
              onClick={() => setActiveTab("stats")}
            >
              <BarChart className="h-5 w-5 mr-3" />
              สถิติและรายงาน
            </Button>
            {user?.adminRole === 'super_admin' && (
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
          </nav>
        </div>
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center">
            <Avatar>
              <AvatarFallback>{user ? getInitials(user.fullName || user.username) : '?'}</AvatarFallback>
            </Avatar>
            <div className="ml-3">
              <p className="text-sm font-medium">{user?.fullName || user?.username}</p>
              <p className="text-xs text-gray-300">แอดมิน</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-white hover:bg-gray-700 mt-3"
            onClick={() => navigate("/")}
          >
            <LogOut className="h-5 w-5 mr-3" />
            ออกจากระบบ
          </Button>
        </div>
      </div>

      {/* Mobile header */}
      <div className="md:hidden bg-[#1a2942] text-white p-4 fixed top-0 w-full z-10">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">CashLuxe Admin</h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">เปิดเมนู</span>
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>เมนู</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setActiveTab("dashboard")}>
                <Home className="mr-2 h-4 w-4" />
                <span>แดชบอร์ด</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveTab("loans")}>
                <CreditCard className="mr-2 h-4 w-4" />
                <span>จัดการเงินกู้</span>
                {newLoanNotification && (
                  <div className="ml-2 w-2 h-2 bg-red-500 rounded-full"></div>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveTab("withdrawals")}>
                <DollarSign className="mr-2 h-4 w-4" />
                <span>จัดการการถอนเงิน</span>
                {newWithdrawalNotification && (
                  <div className="ml-2 w-2 h-2 bg-red-500 rounded-full"></div>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveTab("users")}>
                <Users className="mr-2 h-4 w-4" />
                <span>จัดการผู้ใช้</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveTab("stats")}>
                <BarChart className="mr-2 h-4 w-4" />
                <span>สถิติและรายงาน</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/admin/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                <span>ตั้งค่าระบบ</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/")}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>ออกจากระบบ</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 md:ml-64 pt-5 px-4 md:px-8 pb-24 md:pb-8 overflow-y-auto md:mt-0 mt-16">
        {/* Dashboard Tab */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="hidden">
            <TabsTrigger value="dashboard">แดชบอร์ด</TabsTrigger>
            <TabsTrigger value="loans">จัดการเงินกู้</TabsTrigger>
            <TabsTrigger value="withdrawals">จัดการการถอนเงิน</TabsTrigger>
            <TabsTrigger value="users">จัดการผู้ใช้</TabsTrigger>
            <TabsTrigger value="stats">สถิติและรายงาน</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-6">แดชบอร์ด</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">จำนวนผู้ใช้ทั้งหมด</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <Users className="h-8 w-8 text-blue-500 mr-3" />
                      <div>
                        <div className="text-2xl font-bold">{dashboardStats.totalUsers}</div>
                        <p className="text-xs text-gray-500">{dashboardStats.activeUsers} คนที่ใช้งานอยู่</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">เงินกู้รออนุมัติ</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <CreditCard className="h-8 w-8 text-yellow-500 mr-3" />
                      <div>
                        <div className="text-2xl font-bold">{dashboardStats.pendingLoans}</div>
                        <p className="text-xs text-gray-500">จากทั้งหมด {dashboardStats.totalLoans} รายการ</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">การถอนเงินรออนุมัติ</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <DollarSign className="h-8 w-8 text-yellow-500 mr-3" />
                      <div>
                        <div className="text-2xl font-bold">{dashboardStats.pendingWithdrawals}</div>
                        <p className="text-xs text-gray-500">จากทั้งหมด {dashboardStats.totalWithdrawals} รายการ</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">ยอดเงินกู้ที่อนุมัติ</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <TrendingUp className="h-8 w-8 text-green-500 mr-3" />
                      <div>
                        <div className="text-2xl font-bold">{formatThaiCurrency(dashboardStats.totalLoanAmount)}</div>
                        <p className="text-xs text-gray-500">ยอดรวมทั้งหมด</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>แนวโน้มการขอสินเชื่อ 7 วันล่าสุด</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={loanTrends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorLoans" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#1e40af" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#1e40af" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" />
                        <YAxis />
                        <CartesianGrid strokeDasharray="3 3" />
                        <Tooltip 
                          formatter={(value: any) => [`${value} รายการ`, 'จำนวนคำขอ']}
                          labelFormatter={(label) => `วันที่: ${label}`}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="loans" 
                          stroke="#1e40af" 
                          fillOpacity={1} 
                          fill="url(#colorLoans)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>สถานะคำขอสินเชื่อ</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsIePieChart>
                        <Pie
                          data={loanStatusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {loanStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: any) => [`${value} รายการ`, '']}
                        />
                      </RechartsIePieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle>คำขอสินเชื่อล่าสุด</CardTitle>
                    <Button 
                      variant="ghost" 
                      className="h-8" 
                      onClick={() => setActiveTab("loans")}
                    >
                      ดูทั้งหมด
                      <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="px-0">
                  {isLoansLoading ? (
                    <div className="p-4 space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-4">
                          <Skeleton className="h-12 w-12 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-[250px]" />
                            <Skeleton className="h-4 w-[200px]" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <ScrollArea className="h-[300px] px-4">
                      <div className="space-y-4">
                        {loans?.slice(0, 5).map((loan) => (
                          <div key={loan.id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback>{getInitials(loan.fullName || '')}</AvatarFallback>
                              </Avatar>
                              <div>
                                <h4 className="font-medium">{loan.fullName}</h4>
                                <div className="flex items-center text-sm text-gray-500">
                                  <span>{formatThaiCurrency(loan.amount)} • {loan.term} เดือน</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(loan.status)}
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0"
                                onClick={() => handleEditLoan(loan)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle>คำขอถอนเงินล่าสุด</CardTitle>
                    <Button 
                      variant="ghost" 
                      className="h-8" 
                      onClick={() => setActiveTab("withdrawals")}
                    >
                      ดูทั้งหมด
                      <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="px-0">
                  {isWithdrawalsLoading ? (
                    <div className="p-4 space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-4">
                          <Skeleton className="h-12 w-12 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-[250px]" />
                            <Skeleton className="h-4 w-[200px]" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <ScrollArea className="h-[300px] px-4">
                      <div className="space-y-4">
                        {withdrawals?.slice(0, 5).map((withdrawal) => (
                          <div key={withdrawal.id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback>{getInitials(withdrawal.accountName || '')}</AvatarFallback>
                              </Avatar>
                              <div>
                                <h4 className="font-medium">{withdrawal.accountName}</h4>
                                <div className="flex items-center text-sm text-gray-500">
                                  <span>{formatThaiCurrency(withdrawal.amount)} • {withdrawal.bankName}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(withdrawal.status)}
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0"
                                onClick={() => handleEditWithdrawal(withdrawal)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
      
          {/* Loans Tab */}
          <TabsContent value="loans" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">จัดการเงินกู้</h2>
              <Button
                variant="outline"
                onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/loans"] })}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                รีเฟรช
              </Button>
            </div>
            
            <Card>
              <CardHeader className="pb-0">
                <div className="flex items-center justify-between">
                  <CardTitle>รายการคำขอเงินกู้ทั้งหมด</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {isLoansLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="border-b pb-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <Skeleton className="w-10 h-10 rounded-full mr-3" />
                            <div>
                              <Skeleton className="h-5 w-32 mb-1" />
                              <Skeleton className="h-3 w-24" />
                            </div>
                          </div>
                          <Skeleton className="h-8 w-8" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ชื่อผู้ขอสินเชื่อ</TableHead>
                          <TableHead>จำนวนเงิน</TableHead>
                          <TableHead>ระยะเวลา</TableHead>
                          <TableHead>วัตถุประสงค์</TableHead>
                          <TableHead>สถานะ</TableHead>
                          <TableHead>วันที่ยื่นคำขอ</TableHead>
                          <TableHead className="text-right">จัดการ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loans && loans.length > 0 ? (
                          loans.map(loan => (
                            <TableRow key={loan.id}>
                              <TableCell className="font-medium">{loan.fullName}</TableCell>
                              <TableCell>{formatThaiCurrency(loan.amount)}</TableCell>
                              <TableCell>{loan.term} เดือน</TableCell>
                              <TableCell className="max-w-[200px] truncate">{loan.purpose}</TableCell>
                              <TableCell>{getStatusBadge(loan.status)}</TableCell>
                              <TableCell>{loan.createdAt ? format(new Date(loan.createdAt), 'dd/MM/yyyy', { locale: th }) : '-'}</TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                      <span className="sr-only">เปิดเมนู</span>
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>การดำเนินการ</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => handleEditLoan(loan)}>
                                      <Edit className="mr-2 h-4 w-4" />
                                      <span>ดูรายละเอียด/แก้ไข</span>
                                    </DropdownMenuItem>
                                    {loan.status === "pending" && (
                                      <>
                                        <DropdownMenuItem onClick={() => 
                                          updateLoanMutation.mutate({
                                            id: loan.id,
                                            status: "approved",
                                            adminNote: `Approved by ${user?.fullName || 'Admin'}`
                                          })
                                        }>
                                          <CheckCircle className="mr-2 h-4 w-4" />
                                          <span>อนุมัติ</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => 
                                          updateLoanMutation.mutate({
                                            id: loan.id,
                                            status: "rejected",
                                            adminNote: `Rejected by ${user?.fullName || 'Admin'}`
                                          })
                                        }>
                                          <XCircle className="mr-2 h-4 w-4" />
                                          <span>ปฏิเสธ</span>
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-6 text-gray-500">
                              ไม่มีรายการเงินกู้
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Withdrawals Tab */}
          <TabsContent value="withdrawals" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">จัดการการถอนเงิน</h2>
              <Button
                variant="outline"
                onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawals"] })}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                รีเฟรช
              </Button>
            </div>

            <Card>
              <CardHeader className="pb-0">
                <div className="flex items-center justify-between">
                  <CardTitle>รายการคำขอถอนเงินทั้งหมด</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {isWithdrawalsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="border-b pb-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <Skeleton className="w-10 h-10 rounded-full mr-3" />
                            <div>
                              <Skeleton className="h-5 w-32 mb-1" />
                              <Skeleton className="h-3 w-24" />
                            </div>
                          </div>
                          <Skeleton className="h-8 w-8" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ชื่อบัญชี</TableHead>
                          <TableHead>ธนาคาร</TableHead>
                          <TableHead>เลขที่บัญชี</TableHead>
                          <TableHead>จำนวนเงิน</TableHead>
                          <TableHead>สถานะ</TableHead>
                          <TableHead>วันที่ยื่นคำขอ</TableHead>
                          <TableHead className="text-right">จัดการ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {withdrawals && withdrawals.length > 0 ? (
                          withdrawals.map(withdrawal => (
                            <TableRow key={withdrawal.id}>
                              <TableCell className="font-medium">{withdrawal.accountName}</TableCell>
                              <TableCell>{withdrawal.bankName}</TableCell>
                              <TableCell>{withdrawal.accountNumber}</TableCell>
                              <TableCell>{formatThaiCurrency(withdrawal.amount)}</TableCell>
                              <TableCell>{getStatusBadge(withdrawal.status)}</TableCell>
                              <TableCell>{withdrawal.createdAt ? format(new Date(withdrawal.createdAt), 'dd/MM/yyyy', { locale: th }) : '-'}</TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                      <span className="sr-only">เปิดเมนู</span>
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>การดำเนินการ</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => handleEditWithdrawal(withdrawal)}>
                                      <Edit className="mr-2 h-4 w-4" />
                                      <span>ดูรายละเอียด/แก้ไข</span>
                                    </DropdownMenuItem>
                                    {withdrawal.status === "pending" && (
                                      <>
                                        <DropdownMenuItem onClick={() => 
                                          updateWithdrawalMutation.mutate({
                                            id: withdrawal.id,
                                            status: "approved",
                                            adminNote: `Approved by ${user?.fullName || 'Admin'}`
                                          })
                                        }>
                                          <CheckCircle className="mr-2 h-4 w-4" />
                                          <span>อนุมัติ</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => 
                                          updateWithdrawalMutation.mutate({
                                            id: withdrawal.id,
                                            status: "rejected",
                                            adminNote: `Rejected by ${user?.fullName || 'Admin'}`
                                          })
                                        }>
                                          <XCircle className="mr-2 h-4 w-4" />
                                          <span>ปฏิเสธ</span>
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-6 text-gray-500">
                              ไม่มีรายการการถอนเงิน
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">จัดการผู้ใช้</h2>
              <div className="flex gap-2">
                <Button 
                  variant="default" 
                  onClick={() => {
                    // Reset form and open create dialog
                    addUserForm.reset({
                      username: '',
                      password: '',
                      fullName: '',
                      email: '',
                      phone: '',
                      address: '',
                      occupation: '',
                      monthlyIncome: undefined,
                      idCardNumber: '',
                      withdrawalCode: '',
                      status: 'active',
                    });
                    setIsAddUserDialogOpen(true);
                  }}
                >
                  <UserIcon className="h-4 w-4 mr-2" />
                  เพิ่มสมาชิกใหม่
                </Button>
                <Button
                  variant="outline"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] })}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  รีเฟรช
                </Button>
              </div>
            </div>
            
            <Card>
              <CardHeader className="pb-0">
                <div className="flex items-center justify-between">
                  <CardTitle>รายชื่อผู้ใช้ทั้งหมด</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {isUsersLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="border-b pb-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <Skeleton className="w-10 h-10 rounded-full mr-3" />
                            <div>
                              <Skeleton className="h-5 w-32 mb-1" />
                              <Skeleton className="h-3 w-24" />
                            </div>
                          </div>
                          <Skeleton className="h-8 w-8" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ผู้ใช้</TableHead>
                          <TableHead>อีเมล</TableHead>
                          <TableHead>เบอร์โทรศัพท์</TableHead>
                          <TableHead>สถานะ</TableHead>
                          <TableHead>วันที่ลงทะเบียน</TableHead>
                          <TableHead className="text-right">จัดการ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users && users.length > 0 ? (
                          users.filter(u => u?.id !== user?.id).map(u => (
                            <TableRow key={u.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar>
                                    <AvatarFallback>{getInitials(u.fullName || u.username)}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium">{u.fullName || u.username}</div>
                                    <div className="text-xs text-gray-500">
                                      @{u.username}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{u.email}</TableCell>
                              <TableCell>{u.phone || '-'}</TableCell>
                              <TableCell>
                                <Badge 
                                  variant="outline" 
                                  className={
                                    !u.isActive 
                                      ? "bg-red-100 text-red-800 hover:bg-red-100" 
                                      : (u.status !== "active" 
                                          ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" 
                                          : "bg-green-100 text-green-800 hover:bg-green-100")
                                  }
                                >
                                  {getUserStatusText(u)}
                                </Badge>
                              </TableCell>
                              <TableCell>{u.createdAt ? format(new Date(u.createdAt), 'dd/MM/yyyy', { locale: th }) : '-'}</TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                      <span className="sr-only">เปิดเมนู</span>
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>การดำเนินการ</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => handleEditUser(u)}>
                                      <Edit className="mr-2 h-4 w-4" />
                                      <span>แก้ไขข้อมูล</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleViewUserDetails(u)}>
                                      <Eye className="mr-2 h-4 w-4" />
                                      <span>ดูข้อมูลผู้ใช้</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => {
                                      setSelectedUser(u);
                                      setIsAdjustBalanceDialogOpen(true);
                                    }}>
                                      <Wallet className="mr-2 h-4 w-4" />
                                      <span>ปรับยอดเงินในบัญชี</span>
                                    </DropdownMenuItem>
                                    {u.isActive ? (
                                      <DropdownMenuItem onClick={() => 
                                        updateUserMutation.mutate({
                                          id: u.id,
                                          isActive: false
                                        })
                                      }>
                                        <XCircle className="mr-2 h-4 w-4" />
                                        <span>ระงับการใช้งาน</span>
                                      </DropdownMenuItem>
                                    ) : (
                                      <DropdownMenuItem onClick={() => 
                                        updateUserMutation.mutate({
                                          id: u.id,
                                          isActive: true
                                        })
                                      }>
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        <span>เปิดใช้งาน</span>
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                              ไม่มีข้อมูลผู้ใช้
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="stats" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-6">สถิติและรายงาน</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>สถิติสถานะเงินกู้</CardTitle>
                    <CardDescription>อัตราส่วนของเงินกู้ในแต่ละสถานะ</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsIePieChart>
                          <Pie
                            data={loanStatusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            label={({name, value}) => `${name}: ${value} รายการ`}
                          >
                            {loanStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Legend />
                          <Tooltip />
                        </RechartsIePieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>สถิติสถานะการถอนเงิน</CardTitle>
                    <CardDescription>อัตราส่วนของการถอนเงินในแต่ละสถานะ</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsIePieChart>
                          <Pie
                            data={withdrawalStatusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            label={({name, value}) => `${name}: ${value} รายการ`}
                          >
                            {withdrawalStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Legend />
                          <Tooltip />
                        </RechartsIePieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>สถิติการทำธุรกรรมรายเดือน</CardTitle>
                    <CardDescription>เปรียบเทียบจำนวนการขอสินเชื่อและการถอนเงินในแต่ละวัน 7 วันล่าสุด</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={loanTrends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="date" />
                          <YAxis />
                          <CartesianGrid strokeDasharray="3 3" />
                          <Tooltip 
                            formatter={(value: any, name: string) => [
                              name === 'amount' ? formatThaiCurrency(value) : `${value} รายการ`, 
                              name === 'amount' ? 'ยอดเงิน' : 'จำนวนรายการ'
                            ]}
                            labelFormatter={(label) => `วันที่: ${label}`}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="loans" 
                            stroke="#1e40af" 
                            fillOpacity={1} 
                            fill="url(#colorLoans)" 
                            name="สินเชื่อ"
                          />
                          <Area 
                            type="monotone" 
                            dataKey="amount" 
                            stroke="#10b981" 
                            fillOpacity={1} 
                            fill="url(#colorAmount)" 
                            name="ยอดเงิน"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>รายงานสรุป</CardTitle>
                <CardDescription>ภาพรวมของการดำเนินงานทั้งหมดในระบบ</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">จำนวนผู้ใช้ทั้งหมด</div>
                    <div className="text-2xl font-bold">{dashboardStats.totalUsers}</div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">ยอดเงินกู้ทั้งหมด</div>
                    <div className="text-2xl font-bold">{formatThaiCurrency(dashboardStats.totalLoanAmount)}</div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">ยอดถอนเงินทั้งหมด</div>
                    <div className="text-2xl font-bold">{formatThaiCurrency(dashboardStats.totalWithdrawalAmount)}</div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">อัตราการอนุมัติเงินกู้</div>
                    <div className="text-2xl font-bold">
                      {loans && loans.length > 0
                        ? `${((loans.filter(loan => loan.status === "approved").length / loans.length) * 100).toFixed(1)}%`
                        : '0%'
                      }
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* User Details Dialog - แสดงข้อมูลผู้ใช้ทั้งหมด */}
      <Dialog open={isUserDetailsDialogOpen} onOpenChange={setIsUserDetailsDialogOpen}>
        <DialogContent className="lg:max-w-screen-lg md:max-w-2xl w-full max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>ข้อมูลผู้ใช้ทั้งหมด</DialogTitle>
            <DialogDescription>
              ข้อมูลทั้งหมดของผู้ใช้ ทั้งข้อมูลส่วนตัว ข้อมูลเงินกู้ ข้อมูลบัญชีธนาคาร และจำนวนเงินในระบบ
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(90vh-130px)]">
            <div className="px-1 py-4">
              {!userAllData ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <RefreshCw className="h-10 w-10 text-gray-400 animate-spin mb-4" />
                  <p>กำลังโหลดข้อมูล...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* ข้อมูลส่วนตัว */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xl flex items-center">
                        <UserIcon className="h-5 w-5 mr-2" />
                        ข้อมูลส่วนตัว
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">ชื่อผู้ใช้</p>
                          <p className="font-medium">{userAllData.user?.username || '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">ชื่อ-นามสกุล</p>
                          <p className="font-medium">{userAllData.user?.fullName || '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">อีเมล</p>
                          <p className="font-medium">{userAllData.user?.email || '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">เบอร์โทรศัพท์</p>
                          <p className="font-medium">{userAllData.user?.phone || '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">เลขบัตรประชาชน</p>
                          <p className="font-medium">{userAllData.user?.idCardNumber || '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">ที่อยู่</p>
                          <p className="font-medium">{userAllData.user?.address || '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">อาชีพ</p>
                          <p className="font-medium">{userAllData.user?.occupation || '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">รายได้ต่อเดือน</p>
                          <p className="font-medium">{userAllData.user?.monthlyIncome ? formatThaiCurrency(userAllData.user.monthlyIncome) : '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">สถานะผู้ใช้</p>
                          <p className="font-medium">
                            <Badge 
                              variant="outline" 
                              className={
                                !userAllData.user?.isActive 
                                  ? "bg-red-100 text-red-800" 
                                  : (userAllData.user?.status !== "active" 
                                      ? "bg-yellow-100 text-yellow-800" 
                                      : "bg-green-100 text-green-800")
                              }
                            >
                              {userAllData.user ? getUserStatusText(userAllData.user) : '-'}
                            </Badge>
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">วันที่ลงทะเบียน</p>
                          <p className="font-medium">{userAllData.user?.createdAt ? format(new Date(userAllData.user.createdAt), 'dd/MM/yyyy HH:mm', { locale: th }) : '-'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* ข้อมูลบัญชีธนาคาร */}
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-xl flex items-center">
                          <Wallet className="h-5 w-5 mr-2" />
                          ข้อมูลบัญชีธนาคาร
                        </CardTitle>
                        {userAllData.account && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => {
                              // ตั้งค่าฟอร์มด้วยข้อมูลบัญชีปัจจุบัน
                              accountEditForm.reset({
                                bankName: userAllData.account?.bankName || '',
                                accountNumber: userAllData.account?.accountNumber || '',
                                accountName: userAllData.account?.accountName || '',
                                withdrawalCode: userAllData.account?.withdrawalCode || '',
                                balance: userAllData.account?.balance || 0
                              });
                              
                              // เปิด Dialog แก้ไขข้อมูลบัญชี
                              setSelectedUser(userAllData.user);
                              setIsEditAccountDialogOpen(true);
                            }}
                            className="flex items-center"
                          >
                            <Pencil className="h-4 w-4 mr-1" /> แก้ไข
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {userAllData.account ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">ยอดเงินคงเหลือ</p>
                            <p className="font-medium">{formatThaiCurrency(userAllData.account.balance)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">ธนาคาร</p>
                            <p className="font-medium">{userAllData.account.bankName || '-'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">เลขบัญชี</p>
                            <p className="font-medium">{userAllData.account.accountNumber || '-'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">ชื่อบัญชี</p>
                            <p className="font-medium">{userAllData.account.accountName || '-'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">รหัสถอนเงิน</p>
                            <p className="font-medium">{userAllData.account.withdrawalCode || '-'}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-500">ไม่มีข้อมูลบัญชีธนาคาร</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* ข้อมูลเงินกู้ */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xl flex items-center">
                        <CreditCard className="h-5 w-5 mr-2" />
                        ข้อมูลเงินกู้
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {userAllData.loans && userAllData.loans.length > 0 ? (
                        <div className="space-y-4">
                          {userAllData.loans.map((loan, index) => (
                            <Card key={index} className="border rounded-lg shadow-sm">
                              <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-4">
                                  <div>
                                    <p className="font-semibold">เงินกู้ #{loan.id}</p>
                                    <p className="text-sm text-gray-500">
                                      {loan.createdAt ? format(new Date(loan.createdAt), 'dd/MM/yyyy HH:mm', { locale: th }) : '-'}
                                    </p>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      onClick={() => {
                                        // ตั้งค่าฟอร์มแก้ไขเงินกู้
                                        loanForm.reset({
                                          amount: loan.amount,
                                          term: loan.term,
                                          purpose: loan.purpose || "",
                                          status: loan.status as any,
                                          adminNote: loan.adminNote || "",
                                          fullName: loan.fullName || "",
                                          age: loan.age || undefined,
                                          occupation: loan.occupation || "",
                                          income: loan.income || undefined,
                                          remainingIncome: loan.remainingIncome || undefined,
                                          idCardNumber: loan.idCardNumber || "",
                                          address: loan.address || "",
                                          phone: loan.phone || "",
                                          frontIdCardImage: loan.frontIdCardImage || "",
                                          backIdCardImage: loan.backIdCardImage || "",
                                          selfieWithIdCardImage: loan.selfieWithIdCardImage || "",
                                        });
                                        
                                        // เปิด Dialog แก้ไขเงินกู้
                                        setSelectedLoan(loan);
                                        setIsEditLoanOpen(true);
                                        setIsUserDetailsDialogOpen(false);
                                      }}
                                      className="flex items-center"
                                    >
                                      <Pencil className="h-4 w-4 mr-1" /> แก้ไข
                                    </Button>
                                    {getStatusBadge(loan.status)}
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div>
                                    <p className="text-sm text-gray-500">จำนวนเงิน</p>
                                    <p className="font-medium">{formatThaiCurrency(loan.amount)}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-500">ระยะเวลา</p>
                                    <p className="font-medium">{loan.term ? `${loan.term} เดือน` : '-'}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-500">อัตราดอกเบี้ย</p>
                                    <p className="font-medium">{loan.interestRate ? `${loan.interestRate}%` : '-'}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-500">ชำระต่อเดือน</p>
                                    <p className="font-medium">{loan.monthlyPayment ? formatThaiCurrency(loan.monthlyPayment) : '-'}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-500">วัตถุประสงค์</p>
                                    <p className="font-medium">{loan.purpose || '-'}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-500">หมายเหตุแอดมิน</p>
                                    <p className="font-medium">{loan.adminNote || '-'}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-500">อาชีพ</p>
                                    <p className="font-medium">{loan.occupation || '-'}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-500">รายได้ต่อเดือน</p>
                                    <p className="font-medium">{loan.income ? formatThaiCurrency(loan.income) : '-'}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-500">รายได้คงเหลือ</p>
                                    <p className="font-medium">{loan.remainingIncome ? formatThaiCurrency(loan.remainingIncome) : '-'}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-500">เลขบัตรประชาชน</p>
                                    <p className="font-medium">{loan.idCardNumber || '-'}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-500">ที่อยู่</p>
                                    <p className="font-medium">{loan.address || '-'}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-500">เบอร์โทรศัพท์</p>
                                    <p className="font-medium">{loan.phone || '-'}</p>
                                  </div>
                                </div>
                                
                                {/* แสดงรูปภาพ */}
                                <div className="mt-4">
                                  <p className="font-medium mb-2">เอกสารแนบ</p>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                      <p className="text-sm text-gray-500 mb-1">บัตรประชาชนด้านหน้า</p>
                                      {loan.frontIdCardImage ? (
                                        <a href={loan.frontIdCardImage} target="_blank" rel="noopener noreferrer" className="block">
                                          <img 
                                            src={loan.frontIdCardImage} 
                                            alt="บัตรประชาชนด้านหน้า" 
                                            className="w-full h-auto rounded border"
                                          />
                                        </a>
                                      ) : (
                                        <div className="text-gray-500 border rounded p-2 text-center">ไม่มีรูปภาพ</div>
                                      )}
                                    </div>
                                    <div>
                                      <p className="text-sm text-gray-500 mb-1">บัตรประชาชนด้านหลัง</p>
                                      {loan.backIdCardImage ? (
                                        <a href={loan.backIdCardImage} target="_blank" rel="noopener noreferrer" className="block">
                                          <img 
                                            src={loan.backIdCardImage} 
                                            alt="บัตรประชาชนด้านหลัง" 
                                            className="w-full h-auto rounded border"
                                          />
                                        </a>
                                      ) : (
                                        <div className="text-gray-500 border rounded p-2 text-center">ไม่มีรูปภาพ</div>
                                      )}
                                    </div>
                                    <div>
                                      <p className="text-sm text-gray-500 mb-1">เซลฟี่คู่บัตรประชาชน</p>
                                      {loan.selfieWithIdCardImage ? (
                                        <a href={loan.selfieWithIdCardImage} target="_blank" rel="noopener noreferrer" className="block">
                                          <img 
                                            src={loan.selfieWithIdCardImage} 
                                            alt="เซลฟี่คู่บัตรประชาชน" 
                                            className="w-full h-auto rounded border"
                                          />
                                        </a>
                                      ) : (
                                        <div className="text-gray-500 border rounded p-2 text-center">ไม่มีรูปภาพ</div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500">ไม่มีข้อมูลเงินกู้</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* ประวัติการถอนเงิน */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xl flex items-center">
                        <DollarSign className="h-5 w-5 mr-2" />
                        ประวัติการถอนเงิน
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {userAllData.withdrawals && userAllData.withdrawals.length > 0 ? (
                        <div className="space-y-4">
                          {userAllData.withdrawals.map((withdrawal, index) => (
                            <Card key={index} className="border rounded-lg shadow-sm">
                              <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-4">
                                  <div>
                                    <p className="font-semibold">การถอนเงิน #{withdrawal.id}</p>
                                    <p className="text-sm text-gray-500">
                                      {withdrawal.createdAt ? format(new Date(withdrawal.createdAt), 'dd/MM/yyyy HH:mm', { locale: th }) : '-'}
                                    </p>
                                  </div>
                                  {getStatusBadge(withdrawal.status)}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div>
                                    <p className="text-sm text-gray-500">จำนวนเงิน</p>
                                    <p className="font-medium">{formatThaiCurrency(withdrawal.amount)}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-500">ธนาคาร</p>
                                    <p className="font-medium">{withdrawal.bankName || '-'}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-500">เลขบัญชี</p>
                                    <p className="font-medium">{withdrawal.accountNumber || '-'}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-500">ชื่อบัญชี</p>
                                    <p className="font-medium">{withdrawal.accountName || '-'}</p>
                                  </div>
                                  <div className="md:col-span-2">
                                    <p className="text-sm text-gray-500">หมายเหตุแอดมิน</p>
                                    <p className="font-medium">{withdrawal.adminNote || '-'}</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500">ไม่มีประวัติการถอนเงิน</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button onClick={() => setIsUserDetailsDialogOpen(false)}>ปิด</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Edit Dialog */}
      {/* แก้ไขผู้ใช้ Dialog */}
      {/* Add User Dialog */}
      <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
        <DialogContent className="lg:max-w-screen-lg w-full max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>เพิ่มสมาชิกใหม่</DialogTitle>
            <DialogDescription>
              กรอกข้อมูลเพื่อเพิ่มสมาชิกใหม่เข้าสู่ระบบ
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(90vh-130px)]">
            <div className="px-1">
              <Form {...addUserForm}>
                <form onSubmit={addUserForm.handleSubmit(onAddUserSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={addUserForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ชื่อผู้ใช้</FormLabel>
                          <FormControl>
                            <Input placeholder="username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={addUserForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>รหัสผ่าน</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="รหัสผ่าน" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={addUserForm.control}
                    name="withdrawalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>รหัสอนุมัติถอนเงิน</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                              <KeyRound className="h-4 w-4" />
                            </span>
                            <Input
                              {...field}
                              className="pl-8"
                              value={field.value || ""}
                              placeholder="รหัสอนุมัติสำหรับถอนเงิน (6-8 หลัก)"
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          กำหนดรหัสอนุมัติสำหรับถอนเงิน
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={addUserForm.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ชื่อ-นามสกุล</FormLabel>
                        <FormControl>
                          <Input placeholder="ชื่อ นามสกุล" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={addUserForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>อีเมล</FormLabel>
                        <FormControl>
                          <Input placeholder="email@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={addUserForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>เบอร์โทรศัพท์</FormLabel>
                        <FormControl>
                          <Input placeholder="0812345678" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddUserDialogOpen(false)}
                    >
                      ยกเลิก
                    </Button>
                    <Button type="submit" disabled={createUserMutation.isPending}>
                      {createUserMutation.isPending ? "กำลังบันทึก..." : "บันทึก"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
      
      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="lg:max-w-screen-lg w-full max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>แก้ไขข้อมูลผู้ใช้</DialogTitle>
            <DialogDescription>
              แก้ไขข้อมูลและสถานะของผู้ใช้งาน
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(90vh-130px)]">
            <div className="px-1">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ชื่อผู้ใช้</FormLabel>
                          <FormControl>
                            <Input placeholder="username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>รหัสผ่าน</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="รหัสผ่าน (เว้นว่างถ้าไม่ต้องการเปลี่ยน)" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="withdrawalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>รหัสอนุมัติถอนเงิน</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                              <KeyRound className="h-4 w-4" />
                            </span>
                            <Input
                              {...field}
                              className="pl-8"
                              value={field.value || ""}
                              placeholder="รหัสอนุมัติสำหรับถอนเงิน (6-8 หลัก)"
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          กำหนดรหัสอนุมัติสำหรับถอนเงิน
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ชื่อ-นามสกุล</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>อีเมล</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>เบอร์โทรศัพท์</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* ฟิลด์ที่อยู่ถูกลบออก */}
                  {/* ฟิลด์อาชีพถูกลบออก */}
                  {/* ฟิลด์รายได้ต่อเดือนถูกลบออก */}
                  {/* ฟิลด์เลขบัตรประชาชนถูกลบออก */}
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>สถานะ</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="เลือกสถานะ" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">ใช้งานได้ปกติ</SelectItem>
                            <SelectItem value="blocked_withdrawal">ห้ามถอนเงิน</SelectItem>
                            <SelectItem value="blocked_loan">ห้ามกู้เงิน</SelectItem>
                            <SelectItem value="blocked_login">ห้ามเข้าสู่ระบบ</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditDialogOpen(false)}
                    >
                      ยกเลิก
                    </Button>
                    <Button type="submit" disabled={updateUserMutation.isPending}>
                      {updateUserMutation.isPending ? "กำลังบันทึก..." : "บันทึก"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Withdrawal Edit Dialog */}
      <Dialog open={isEditWithdrawalOpen} onOpenChange={setIsEditWithdrawalOpen}>
        <DialogContent className="max-w-md max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>รายละเอียดการถอนเงิน</DialogTitle>
            <DialogDescription>
              แก้ไขข้อมูลและสถานะของการถอนเงิน
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(90vh-130px)]">
            <Form {...withdrawalForm}>
            <form onSubmit={withdrawalForm.handleSubmit(onWithdrawalSubmit)} className="space-y-4">
              <FormField
                control={withdrawalForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>จำนวนเงิน</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        value={field.value === undefined ? "" : field.value}
                        onChange={(e) => field.onChange(
                          e.target.value === "" ? undefined : Number(e.target.value)
                        )}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={withdrawalForm.control}
                name="bankName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ธนาคาร</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกธนาคาร" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {bankOptions.map((bank) => (
                          <SelectItem key={bank.value} value={bank.value}>
                            {bank.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={withdrawalForm.control}
                name="accountNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>เลขที่บัญชี</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={withdrawalForm.control}
                name="accountName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ชื่อบัญชี</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={withdrawalForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>สถานะ</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกสถานะ" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">รออนุมัติ</SelectItem>
                        <SelectItem value="approved">อนุมัติแล้ว</SelectItem>
                        <SelectItem value="rejected">ปฏิเสธ</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={withdrawalForm.control}
                name="adminNote"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>หมายเหตุ</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="เพิ่มหมายเหตุสำหรับรายการนี้"
                        className="resize-none"
                        rows={3}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditWithdrawalOpen(false)}
                >
                  ยกเลิก
                </Button>
                <Button type="submit" disabled={updateWithdrawalMutation.isPending}>
                  {updateWithdrawalMutation.isPending ? "กำลังบันทึก..." : "บันทึก"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Loan Edit Dialog */}
      <Dialog open={isEditLoanOpen} onOpenChange={setIsEditLoanOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>รายละเอียดเงินกู้</DialogTitle>
            <DialogDescription>
              แก้ไขข้อมูลและสถานะของเงินกู้
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(90vh-130px)]">
            <Form {...loanForm}>
            <form onSubmit={loanForm.handleSubmit(onLoanSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={loanForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>จำนวนเงิน</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          value={field.value === undefined ? "" : field.value}
                          onChange={(e) => field.onChange(
                            e.target.value === "" ? undefined : Number(e.target.value)
                          )}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loanForm.control}
                  name="term"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ระยะเวลา (เดือน)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          value={field.value === undefined ? "" : field.value}
                          onChange={(e) => field.onChange(
                            e.target.value === "" ? undefined : Number(e.target.value)
                          )}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={loanForm.control}
                name="purpose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>วัตถุประสงค์</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={loanForm.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ชื่อ-นามสกุล</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={loanForm.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>อายุ</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          value={field.value === undefined ? "" : field.value}
                          onChange={(e) => field.onChange(
                            e.target.value === "" ? undefined : Number(e.target.value)
                          )}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loanForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>เบอร์โทรศัพท์</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={loanForm.control}
                  name="occupation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>อาชีพ</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loanForm.control}
                  name="income"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>รายได้</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          value={field.value === undefined ? "" : field.value}
                          onChange={(e) => field.onChange(
                            e.target.value === "" ? undefined : Number(e.target.value)
                          )}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={loanForm.control}
                name="idCardNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>เลขบัตรประชาชน</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={loanForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ที่อยู่</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={loanForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>สถานะ</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกสถานะ" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">รออนุมัติ</SelectItem>
                        <SelectItem value="approved">อนุมัติแล้ว</SelectItem>
                        <SelectItem value="rejected">ปฏิเสธ</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={loanForm.control}
                name="adminNote"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>หมายเหตุ</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="เพิ่มหมายเหตุสำหรับรายการนี้"
                        className="resize-none"
                        rows={3}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* เอกสารแนบ */}
              <div className="space-y-4 mt-4">
                <h3 className="text-lg font-semibold">เอกสารที่อัพโหลด</h3>
                <div className="grid grid-cols-3 gap-4">
                  {/* บัตรประชาชนด้านหน้า */}
                  <div className="border rounded-lg p-3 bg-gray-50">
                    <h4 className="text-sm font-medium mb-2">บัตรประชาชนด้านหน้า</h4>
                    {selectedLoan?.frontIdCardImage ? (
                      <div className="relative aspect-[3/2] overflow-hidden rounded-md bg-gray-100">
                        <img 
                          src={selectedLoan.frontIdCardImage} 
                          alt="บัตรประชาชนด้านหน้า" 
                          className="h-full w-full object-cover"
                        />
                        <a 
                          href={selectedLoan.frontIdCardImage} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="absolute top-1 right-1 p-1 bg-white/50 rounded-md hover:bg-white/80"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-24 bg-gray-100 rounded-md">
                        <p className="text-sm text-gray-500">ไม่มีไฟล์</p>
                      </div>
                    )}
                  </div>
                  
                  {/* บัตรประชาชนด้านหลัง */}
                  <div className="border rounded-lg p-3 bg-gray-50">
                    <h4 className="text-sm font-medium mb-2">บัตรประชาชนด้านหลัง</h4>
                    {selectedLoan?.backIdCardImage ? (
                      <div className="relative aspect-[3/2] overflow-hidden rounded-md bg-gray-100">
                        <img 
                          src={selectedLoan.backIdCardImage} 
                          alt="บัตรประชาชนด้านหลัง" 
                          className="h-full w-full object-cover"
                        />
                        <a 
                          href={selectedLoan.backIdCardImage} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="absolute top-1 right-1 p-1 bg-white/50 rounded-md hover:bg-white/80"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-24 bg-gray-100 rounded-md">
                        <p className="text-sm text-gray-500">ไม่มีไฟล์</p>
                      </div>
                    )}
                  </div>
                  
                  {/* เซลฟี่กับบัตรประชาชน */}
                  <div className="border rounded-lg p-3 bg-gray-50">
                    <h4 className="text-sm font-medium mb-2">เซลฟี่กับบัตรประชาชน</h4>
                    {selectedLoan?.selfieWithIdCardImage ? (
                      <div className="relative aspect-[3/2] overflow-hidden rounded-md bg-gray-100">
                        <img 
                          src={selectedLoan.selfieWithIdCardImage} 
                          alt="เซลฟี่กับบัตรประชาชน" 
                          className="h-full w-full object-cover"
                        />
                        <a 
                          href={selectedLoan.selfieWithIdCardImage} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="absolute top-1 right-1 p-1 bg-white/50 rounded-md hover:bg-white/80"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-24 bg-gray-100 rounded-md">
                        <p className="text-sm text-gray-500">ไม่มีไฟล์</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditLoanOpen(false)}
                >
                  ยกเลิก
                </Button>
                <Button type="submit" disabled={updateLoanMutation2.isPending}>
                  {updateLoanMutation2.isPending ? "กำลังบันทึก..." : "บันทึก"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
          </ScrollArea>
        </DialogContent>
      </Dialog>
      
      {/* Dialog ปรับยอดเงินในบัญชี */}
      {/* Dialog box สำหรับแก้ไขข้อมูลบัญชีธนาคาร */}
      <Dialog open={isEditAccountDialogOpen} onOpenChange={setIsEditAccountDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>แก้ไขข้อมูลบัญชีธนาคาร</DialogTitle>
            <DialogDescription>
              แก้ไขข้อมูลบัญชีธนาคารของผู้ใช้ {selectedUser?.fullName || selectedUser?.username}
            </DialogDescription>
          </DialogHeader>
          <Form {...accountEditForm}>
            <form onSubmit={accountEditForm.handleSubmit(onAccountEditSubmit)} className="space-y-4">
              <FormField
                control={accountEditForm.control}
                name="bankName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ธนาคาร</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกธนาคาร" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {bankOptions.map((bank) => (
                          <SelectItem key={bank.value} value={bank.value}>
                            {bank.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={accountEditForm.control}
                name="accountNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>เลขบัญชี</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="ระบุเลขบัญชี" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={accountEditForm.control}
                name="accountName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ชื่อบัญชี</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="ระบุชื่อบัญชี" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={accountEditForm.control}
                name="withdrawalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>รหัสถอนเงิน</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="ระบุรหัสถอนเงิน" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={accountEditForm.control}
                name="balance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ยอดเงินในบัญชี</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} placeholder="ระบุยอดเงิน" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">บันทึก</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isAdjustBalanceDialogOpen} onOpenChange={setIsAdjustBalanceDialogOpen}>
        <DialogContent className="md:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>ปรับยอดเงินในบัญชี</DialogTitle>
            <DialogDescription>
              {selectedUser && (
                <span>ปรับยอดเงินในบัญชีของ {selectedUser?.fullName || selectedUser?.username}</span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...adjustBalanceForm}>
            <form onSubmit={adjustBalanceForm.handleSubmit(onAdjustBalanceSubmit)} className="space-y-4">
              <FormField
                control={adjustBalanceForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>จำนวนเงินที่ต้องการปรับ</FormLabel>
                    <FormDescription>
                      ใส่จำนวนเงินเป็นค่าบวกเพื่อเพิ่มยอดเงิน หรือค่าลบเพื่อลดยอดเงิน
                    </FormDescription>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value === "" ? "" : Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={adjustBalanceForm.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>หมายเหตุ</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="หมายเหตุเกี่ยวกับการปรับยอดเงิน..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAdjustBalanceDialogOpen(false)}>
                  ยกเลิก
                </Button>
                <Button type="submit">ยืนยัน</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}