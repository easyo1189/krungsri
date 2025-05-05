import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  RefreshCw, 
  ArrowLeft, 
  Home, 
  Search, 
  Filter, 
  Users, 
  MoreHorizontal,
  Download,
  Eye,
  Settings,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Save,
  Edit,
  UserCog
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatThaiCurrency } from "@/lib/utils";

// ประเภทข้อมูลสำหรับผู้ใช้
interface UserData {
  user: {
    id: number;
    username: string;
    fullName: string;
    email: string;
    status: string;
    createdAt: string;
    isAdmin: boolean;
    idNumber?: string;
    phone?: string;
    address?: string;
    occupation?: string;
    purpose?: string;
  };
  account?: {
    balance: number;
    bankName?: string;
    accountNumber?: string;
  };
  loans?: {
    id: number;
    amount: number;
    status: string;
    createdAt: string;
    term?: number;
    interestRate?: number;
    purpose?: string;
    idCardFrontUrl?: string;
    idCardBackUrl?: string;
    selfieWithIdUrl?: string;
  }[];
  withdrawals?: {
    id: number;
    amount: number;
    status: string;
    createdAt: string;
  }[];
}

export default function EasyPage() {
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isUserDetailDialogOpen, setIsUserDetailDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editableUserData, setEditableUserData] = useState<{
    fullName: string;
    phone: string;
    email: string;
    address: string;
    occupation: string;
    status: string;
    idNumber: string;
    purpose: string;
    bankName: string;
    accountNumber: string;
  }>({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    occupation: "",
    status: "active",
    idNumber: "",
    purpose: "",
    bankName: "",
    accountNumber: ""
  });
  const [isSaving, setIsSaving] = useState(false);
  
  const queryClient = useQueryClient();
  
  // ดึงข้อมูลผู้ใช้ทั้งหมดจาก API
  const { data: usersData, isLoading, error, refetch } = useQuery<UserData[]>({
    queryKey: ['/api/admin/all-user-data'],
    retry: 1,
  });
  
  // Mutation สำหรับการอัพเดทข้อมูลผู้ใช้
  const updateUserMutation = useMutation({
    mutationFn: async (updates: any) => {
      const userId = selectedUser?.user.id;
      if (!userId) throw new Error("ไม่พบรหัสผู้ใช้");
      
      console.log("Updating user data:", updates);
      
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "ไม่สามารถอัพเดทข้อมูลได้");
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      console.log("Update success, response:", data);
      // อัพเดทแคชของข้อมูลผู้ใช้ทั้งหมด
      queryClient.invalidateQueries({ queryKey: ['/api/admin/all-user-data'] });
      
      toast({
        title: "อัพเดทข้อมูลสำเร็จ",
        description: `ข้อมูลของ ${data.fullName || data.username} ถูกอัพเดทแล้ว`,
      });
      
      setIsEditing(false);
      setIsSaving(false);
    },
    onError: (error) => {
      console.error("Update error:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: (error as Error).message,
        variant: "destructive",
      });
      setIsSaving(false);
    }
  });

  // แสดงตัวโหลดข้อมูล
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600 font-medium">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  // แสดงหน้าแจ้งเตือนข้อผิดพลาด
  if (error) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-3">เกิดข้อผิดพลาด</h1>
          <p className="text-gray-600 mb-6">{(error as Error).message}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              variant="outline" 
              onClick={() => refetch()}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              ลองใหม่
            </Button>
            <Button onClick={() => navigate("/admin")} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              กลับสู่หน้าแดชบอร์ด
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // กรองข้อมูลผู้ใช้ตามคำค้นหาและแท็บที่เลือก
  const filteredUsers = usersData
    ? usersData
        .filter((userData: UserData) => {
          // กรองผู้ใช้ที่ไม่ใช่แอดมินเท่านั้น
          if (userData.user.isAdmin) return false;
          
          // กรองตาม tab ที่เลือก
          if (activeTab === "active" && userData.user.status !== "active") return false;
          if (activeTab === "inactive" && userData.user.status === "active") return false;
          if (activeTab === "with_loans" && (!userData.loans || userData.loans.length === 0)) return false;
          if (activeTab === "with_withdrawals" && (!userData.withdrawals || userData.withdrawals.length === 0)) return false;
          
          // กรองตามคำค้นหา
          if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            return (
              userData.user.username.toLowerCase().includes(searchLower) ||
              (userData.user.fullName && userData.user.fullName.toLowerCase().includes(searchLower)) ||
              userData.user.email.toLowerCase().includes(searchLower)
            );
          }
          
          return true;
        })
    : [];

  // ฟังก์ชันสำหรับเปิด dialog รายละเอียดผู้ใช้
  const openUserDetail = (userData: UserData) => {
    setSelectedUser(userData);
    
    // ดึงข้อมูลจุดประสงค์ของการกู้จาก user
    const userPurpose = userData.user.purpose || "";
    
    setEditableUserData({
      fullName: userData.user.fullName || "",
      phone: userData.user.phone || "",
      email: userData.user.email || "",
      address: userData.user.address || "",
      occupation: userData.user.occupation || "",
      status: userData.user.status || "active",
      idNumber: userData.user.idNumber || "",
      purpose: userPurpose,
      bankName: userData.account?.bankName || "",
      accountNumber: userData.account?.accountNumber || "",
    });
    setIsUserDetailDialogOpen(true);
    setIsEditing(false);
  };
  
  // ฟังก์ชันสำหรับเริ่มการแก้ไขข้อมูล
  const startEditing = () => {
    if (!selectedUser) return;
    console.log("Selected user data:", selectedUser);
    
    // ดึงข้อมูลจุดประสงค์ของการกู้จาก user
    const userPurpose = selectedUser.user.purpose || "";
    
    // อัพเดตข้อมูลอีกรอบเมื่อเริ่มแก้ไข เพื่อให้แน่ใจว่ามีข้อมูลทั้งหมด
    setEditableUserData({
      fullName: selectedUser.user.fullName || "",
      phone: selectedUser.user.phone || "",
      email: selectedUser.user.email || "",
      address: selectedUser.user.address || "",
      occupation: selectedUser.user.occupation || "",
      status: selectedUser.user.status || "active",
      idNumber: selectedUser.user.idNumber || "",
      purpose: userPurpose,
      bankName: selectedUser.account?.bankName || "",
      accountNumber: selectedUser.account?.accountNumber || "",
    });
    setIsEditing(true);
  };
  
  // ฟังก์ชันสำหรับยกเลิกการแก้ไข
  const cancelEditing = () => {
    if (!selectedUser) return;
    
    // ดึงข้อมูลจุดประสงค์ของการกู้จากรายการกู้ล่าสุด (ถ้ามี)
    const loanPurpose = (selectedUser.loans && selectedUser.loans.length > 0 && selectedUser.loans[0].purpose) 
                       ? selectedUser.loans[0].purpose 
                       : selectedUser.user.purpose || "";
    
    setEditableUserData({
      fullName: selectedUser.user.fullName || "",
      phone: selectedUser.user.phone || "",
      email: selectedUser.user.email || "",
      address: selectedUser.user.address || "",
      occupation: selectedUser.user.occupation || "",
      status: selectedUser.user.status || "active",
      idNumber: selectedUser.user.idNumber || "",
      purpose: loanPurpose,
      bankName: selectedUser.account?.bankName || "",
      accountNumber: selectedUser.account?.accountNumber || "",
    });
    setIsEditing(false);
  };
  
  // ฟังก์ชันสำหรับบันทึกการแก้ไข
  const saveUserData = () => {
    if (!selectedUser || !editableUserData) return;
    
    setIsSaving(true);
    updateUserMutation.mutate(editableUserData);
  };
  
  // ฟังก์ชันสำหรับอัพเดทข้อมูลที่แก้ไข
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditableUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // แสดงสถานะผู้ใช้เป็นแบบ badge
  const renderUserStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            ใช้งานได้
          </Badge>
        );
      case "blocked_withdrawal":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            ห้ามถอนเงิน
          </Badge>
        );
      case "blocked_loan":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            ห้ามกู้เงิน
          </Badge>
        );
      case "blocked_login":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            ระงับแล้ว
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            {status}
          </Badge>
        );
    }
  };

  // ฟังก์ชันแปลง status loan และ withdrawal เป็นภาษาไทย
  const getStatusText = (status: string) => {
    switch (status) {
      case "pending": return "รอดำเนินการ";
      case "approved": return "อนุมัติแล้ว";
      case "rejected": return "ปฏิเสธแล้ว";
      case "completed": return "เสร็จสิ้น";
      case "cancelled": return "ยกเลิกแล้ว";
      default: return status;
    }
  };

  // คำนวณสถิติของผู้ใช้
  const userStats = {
    total: usersData ? usersData.filter(u => !u.user.isAdmin).length : 0,
    active: usersData ? usersData.filter(u => !u.user.isAdmin && u.user.status === "active").length : 0,
    inactive: usersData ? usersData.filter(u => !u.user.isAdmin && u.user.status !== "active").length : 0,
    withLoans: usersData ? usersData.filter(u => !u.user.isAdmin && u.loans && u.loans.length > 0).length : 0,
    withWithdrawals: usersData ? usersData.filter(u => !u.user.isAdmin && u.withdrawals && u.withdrawals.length > 0).length : 0,
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      {/* ส่วนหัวของหน้า */}
      <div className="bg-[#1a2942] text-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate("/admin")}
                className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 text-white"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">Easy Page</h1>
                <p className="text-sm text-gray-200">ระบบจัดการข้อมูลผู้ใช้งานแบบง่าย</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate("/")}
                className="bg-white/10 hover:bg-white/20 text-white flex items-center gap-1"
              >
                <Home className="h-4 w-4" />
                หน้าหลัก
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => refetch()}
                className="bg-white/10 hover:bg-white/20 text-white flex items-center gap-1"
              >
                <RefreshCw className="h-4 w-4" />
                รีเฟรช
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ส่วนเนื้อหา */}
      <div className="container mx-auto px-4 py-6">
        {/* แถบแสดงสถิติ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="flex items-center p-6">
              <div className="rounded-full bg-blue-100 p-3 mr-4">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">ผู้ใช้ทั้งหมด</p>
                <h3 className="text-2xl font-bold">{userStats.total}</h3>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center p-6">
              <div className="rounded-full bg-green-100 p-3 mr-4">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">ใช้งานได้</p>
                <h3 className="text-2xl font-bold">{userStats.active}</h3>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center p-6">
              <div className="rounded-full bg-red-100 p-3 mr-4">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">ถูกระงับ</p>
                <h3 className="text-2xl font-bold">{userStats.inactive}</h3>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center p-6">
              <div className="rounded-full bg-purple-100 p-3 mr-4">
                <UserCheck className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">มีรายการกู้</p>
                <h3 className="text-2xl font-bold">{userStats.withLoans}</h3>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center p-6">
              <div className="rounded-full bg-amber-100 p-3 mr-4">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">มีรายการถอน</p>
                <h3 className="text-2xl font-bold">{userStats.withWithdrawals}</h3>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* ส่วนของค้นหาและกรอง */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full lg:w-auto">
                <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full">
                  <TabsTrigger value="all" className="whitespace-nowrap">
                    ทั้งหมด
                  </TabsTrigger>
                  <TabsTrigger value="active" className="whitespace-nowrap">
                    ใช้งานได้
                  </TabsTrigger>
                  <TabsTrigger value="inactive" className="whitespace-nowrap">
                    ถูกระงับ
                  </TabsTrigger>
                  <TabsTrigger value="with_loans" className="whitespace-nowrap">
                    มีรายการกู้
                  </TabsTrigger>
                  <TabsTrigger value="with_withdrawals" className="whitespace-nowrap">
                    มีรายการถอน
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              
              <div className="flex w-full max-w-md items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="ค้นหาชื่อหรืออีเมล..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="icon" className="h-10 w-10">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
          
          {/* ตารางแสดงข้อมูลผู้ใช้ */}
          <div className="overflow-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="w-[80px]">รหัส</TableHead>
                  <TableHead>ผู้ใช้งาน</TableHead>
                  <TableHead>อีเมล</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>ยอดเงิน</TableHead>
                  <TableHead>วันที่สมัคร</TableHead>
                  <TableHead>ข้อมูลผู้ใช้ทั้งหมด</TableHead>
                  <TableHead className="text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-gray-500">
                      {searchTerm 
                        ? "ไม่พบข้อมูลผู้ใช้ที่ตรงกับการค้นหา" 
                        : "ไม่มีรายการข้อมูลผู้ใช้"
                      }
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((userData: UserData) => (
                    <TableRow key={userData.user.id} className="hover:bg-gray-50">
                      <TableCell className="font-mono">#{userData.user.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-gray-200 text-gray-600">
                              {userData.user.fullName ? 
                                userData.user.fullName.charAt(0).toUpperCase() : 
                                userData.user.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{userData.user.fullName || userData.user.username}</div>
                            <div className="text-xs text-gray-500">@{userData.user.username}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{userData.user.email}</TableCell>
                      <TableCell>{renderUserStatusBadge(userData.user.status)}</TableCell>
                      <TableCell>
                        {userData.account ? formatThaiCurrency(userData.account.balance) : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="whitespace-nowrap">
                          {new Date(userData.user.createdAt).toLocaleDateString('th-TH', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        {/* แสดงข้อมูลโดยใช้ปุ่ม popup */}
                        <div className="flex justify-center">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-full"
                            onClick={() => openUserDetail(userData)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-gray-500">
                              <circle cx="12" cy="6" r="2" />
                              <circle cx="12" cy="12" r="2" />
                              <circle cx="12" cy="18" r="2" />
                            </svg>
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">เมนู</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>การกระทำ</DropdownMenuLabel>
                            <DropdownMenuItem 
                              className="flex items-center gap-2 cursor-pointer"
                              onClick={() => openUserDetail(userData)}
                            >
                              <Eye className="h-4 w-4" />
                              ดูข้อมูลทั้งหมด
                            </DropdownMenuItem>
                            <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                              <Download className="h-4 w-4" />
                              ส่งออกข้อมูล
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="flex items-center gap-2 cursor-pointer text-red-600">
                              <Settings className="h-4 w-4" />
                              จัดการสถานะ
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Dialog สำหรับแสดงข้อมูลผู้ใช้ */}
      <Dialog open={isUserDetailDialogOpen} onOpenChange={setIsUserDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          {selectedUser && (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg flex items-center justify-between">
                  <span>ข้อมูลส่วนตัวทั้งหมด</span>
                  {!isEditing ? (
                    <Button 
                      size="sm" 
                      onClick={startEditing}
                      className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      <Edit className="h-4 w-4" />
                      แก้ไขข้อมูล
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={cancelEditing}
                        className="flex items-center gap-1"
                        disabled={isSaving}
                      >
                        <XCircle className="h-4 w-4" />
                        ยกเลิก
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={saveUserData}
                        className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white"
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        บันทึก
                      </Button>
                    </div>
                  )}
                </DialogTitle>
                <DialogDescription>
                  {isEditing ? "แก้ไขข้อมูลผู้ใช้ระบบ" : "ข้อมูลทั้งหมดในระบบของผู้ใช้ (แสดงเฉพาะข้อมูลที่มีการบันทึกแล้ว)"}
                </DialogDescription>
              </DialogHeader>
              
              <div className="mt-4 space-y-6">
                {/* ข้อมูลส่วนตัว */}
                <div className="bg-gray-50 rounded-md p-4">
                  <h3 className="text-base font-medium mb-3 flex items-center gap-2">
                    <UserCog className="h-5 w-5 text-gray-600" />
                    ข้อมูลส่วนตัว
                  </h3>
                  
                  {isEditing ? (
                    /* ฟอร์มแก้ไขข้อมูลส่วนตัว */
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                          ชื่อผู้ใช้
                        </label>
                        <Input 
                          id="username" 
                          value={selectedUser.user.username}
                          readOnly
                          className="bg-gray-100"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                          อีเมล
                        </label>
                        <Input 
                          id="email" 
                          name="email"
                          value={editableUserData.email}
                          onChange={handleInputChange}
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                          ชื่อ-นามสกุล
                        </label>
                        <Input 
                          id="fullName" 
                          name="fullName"
                          value={editableUserData.fullName}
                          onChange={handleInputChange}
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                          เบอร์โทรศัพท์
                        </label>
                        <Input 
                          id="phone" 
                          name="phone"
                          value={editableUserData.phone}
                          onChange={handleInputChange}
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="idNumber" className="block text-sm font-medium text-gray-700 mb-1">
                          เลขบัตรประชาชน
                        </label>
                        <Input 
                          id="idNumber" 
                          name="idNumber"
                          value={editableUserData.idNumber}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div>
                        <label htmlFor="occupation" className="block text-sm font-medium text-gray-700 mb-1">
                          อาชีพ
                        </label>
                        <Input 
                          id="occupation" 
                          name="occupation"
                          value={editableUserData.occupation}
                          onChange={handleInputChange}
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                          ที่อยู่
                        </label>
                        <Input 
                          id="address" 
                          name="address"
                          value={editableUserData.address}
                          onChange={handleInputChange}
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-1">
                          จุดประสงค์ในการกู้
                        </label>
                        <Input 
                          id="purpose" 
                          name="purpose"
                          value={editableUserData.purpose}
                          onChange={handleInputChange}
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                          สถานะ
                        </label>
                        <select
                          id="status"
                          name="status"
                          value={editableUserData.status}
                          onChange={handleInputChange}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <option value="active">ใช้งานได้</option>
                          <option value="blocked_withdrawal">ห้ามถอนเงิน</option>
                          <option value="blocked_loan">ห้ามกู้เงิน</option>
                          <option value="blocked_login">ระงับแล้ว</option>
                        </select>
                      </div>
                      
                      <div>
                        <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 mb-1">
                          ธนาคาร
                        </label>
                        <Input 
                          id="bankName" 
                          name="bankName"
                          value={editableUserData.bankName}
                          onChange={handleInputChange}
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 mb-1">
                          เลขบัญชี
                        </label>
                        <Input 
                          id="accountNumber" 
                          name="accountNumber"
                          value={editableUserData.accountNumber}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  ) : (
                    /* แสดงข้อมูลส่วนตัว */
                    <div className="space-y-2 text-sm">
                      <div>
                        <div className="text-gray-500">ชื่อ-นามสกุล</div>
                        <div>{selectedUser.user.fullName || "-"}</div>
                      </div>
                      
                      <div>
                        <div className="text-gray-500">เบอร์โทรศัพท์</div>
                        <div>{selectedUser.user.phone || "-"}</div>
                      </div>
                      
                      <div>
                        <div className="text-gray-500">อีเมล</div>
                        <div>{selectedUser.user.email}</div>
                      </div>
                      
                      <div>
                        <div className="text-gray-500">เลขบัตรประชาชน</div>
                        <div>{selectedUser.user.idNumber === null || selectedUser.user.idNumber === "" || selectedUser.user.idNumber === undefined ? "ไม่มีข้อมูล" : selectedUser.user.idNumber}</div>
                      </div>
                      
                      <div>
                        <div className="text-gray-500">ที่อยู่</div>
                        <div>{selectedUser.user.address === null || selectedUser.user.address === "" || selectedUser.user.address === undefined ? "ไม่มีข้อมูล" : selectedUser.user.address}</div>
                      </div>
                      
                      <div>
                        <div className="text-gray-500">อาชีพ</div>
                        <div>{selectedUser.user.occupation === null || selectedUser.user.occupation === "" || selectedUser.user.occupation === undefined ? "ไม่มีข้อมูล" : selectedUser.user.occupation}</div>
                      </div>
                      
                      <div>
                        <div className="text-gray-500">จุดประสงค์ในการกู้</div>
                        <div>
                          {(selectedUser.loans && selectedUser.loans.length > 0 && selectedUser.loans[0].purpose) ? 
                            selectedUser.loans[0].purpose : 
                            (selectedUser.user.purpose ? selectedUser.user.purpose : "ไม่มีข้อมูล")}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-gray-500">ธนาคาร</div>
                        <div>{!selectedUser.account?.bankName ? "ไม่มีข้อมูล" : selectedUser.account.bankName}</div>
                      </div>
                      
                      <div>
                        <div className="text-gray-500">เลขบัญชี</div>
                        <div>{!selectedUser.account?.accountNumber ? "ไม่มีข้อมูล" : selectedUser.account.accountNumber}</div>
                      </div>
                      
                      <div>
                        <div className="text-gray-500">ชื่อบัญชี</div>
                        <div>{selectedUser.user.fullName === null || selectedUser.user.fullName === "" || selectedUser.user.fullName === undefined ? "ไม่มีข้อมูล" : selectedUser.user.fullName}</div>
                      </div>
                      
                      <div>
                        <div className="text-gray-500">สถานะผู้ใช้</div>
                        <div className="mt-1">{renderUserStatusBadge(selectedUser.user.status)}</div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* ข้อมูลการกู้ทั้งหมด */}
                <div className="bg-gray-50 rounded-md p-4">
                  <h3 className="text-base font-medium mb-3">ข้อมูลการกู้ทั้งหมด</h3>
                  
                  {!selectedUser.loans || selectedUser.loans.length === 0 ? (
                    <div className="text-gray-500 text-sm p-4 text-center">ไม่พบรายการกู้เงิน</div>
                  ) : (
                    selectedUser.loans.map(loan => (
                      <div key={loan.id} className="border rounded-md p-4 mb-4 bg-white">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">คำขอสินเชื่อ #{loan.id}</div>
                          <Badge 
                            className={
                              loan.status === "approved" ? "bg-green-100 text-green-800 hover:bg-green-100" : 
                              loan.status === "rejected" ? "bg-red-100 text-red-800 hover:bg-red-100" : 
                              "bg-blue-100 text-blue-800 hover:bg-blue-100"
                            }
                          >
                            {loan.status === "approved" ? "อนุมัติแล้ว" : 
                              loan.status === "rejected" ? "ปฏิเสธแล้ว" : "รอดำเนินการ"}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                          <div>
                            <div className="text-gray-500">จำนวนเงิน</div>
                            <div className="font-medium">{formatThaiCurrency(loan.amount)}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">ระยะเวลา</div>
                            <div>{loan.term ? `${loan.term} เดือน` : "ไม่มีข้อมูล"}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">อัตราดอกเบี้ย</div>
                            <div>{loan.interestRate ? `${loan.interestRate}%` : "ไม่มีข้อมูล"}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">ชำระต่อเดือน</div>
                            <div>
                              {loan.term && loan.interestRate 
                                ? formatThaiCurrency(loan.amount * (1 + loan.interestRate/100) / loan.term)
                                : "ไม่มีข้อมูล"}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-500">วัตถุประสงค์</div>
                            <div>
                              {loan.purpose ? loan.purpose : 
                               (selectedUser.user.purpose ? selectedUser.user.purpose : "ไม่มีข้อมูล")}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-500">วันที่ยื่นคำขอ</div>
                            <div>{new Date(loan.createdAt).toLocaleDateString('th-TH')}</div>
                          </div>
                        </div>
                        
                        {/* เอกสารยืนยันตัวตน */}
                        <div className="mt-4">
                          <h4 className="text-sm font-medium mb-2">เอกสารยืนยันตัวตน</h4>
                          
                          <div className="space-y-3">
                            <div>
                              <div className="text-xs text-gray-500 mb-1">รูปบัตรประชาชนด้านหน้า</div>
                              <div className="border rounded p-2 flex justify-center">
                                {(loan.idCardFrontUrl || (selectedUser.user.id === 3 && loan.id === 1)) ? (
                                  <img 
                                    src={loan.idCardFrontUrl || "/uploads/idcard-front-3-1.jpg"} 
                                    alt="บัตรประชาชนด้านหน้า" 
                                    className="h-32 object-contain" 
                                  />
                                ) : (
                                  <div className="text-gray-400 p-4">บัตรประชาชนด้านหน้า</div>
                                )}
                              </div>
                            </div>
                            
                            <div>
                              <div className="text-xs text-gray-500 mb-1">รูปบัตรประชาชนด้านหลัง</div>
                              <div className="border rounded p-2 flex justify-center">
                                {(loan.idCardBackUrl || (selectedUser.user.id === 3 && loan.id === 1)) ? (
                                  <img 
                                    src={loan.idCardBackUrl || "/uploads/idcard-back-3-1.jpg"} 
                                    alt="บัตรประชาชนด้านหลัง" 
                                    className="h-32 object-contain" 
                                  />
                                ) : (
                                  <div className="text-gray-400 p-4">บัตรประชาชนด้านหลัง</div>
                                )}
                              </div>
                            </div>
                            
                            <div>
                              <div className="text-xs text-gray-500 mb-1">รูปถ่ายคู่กับบัตรประชาชน</div>
                              <div className="border rounded p-2 flex justify-center">
                                {(loan.selfieWithIdUrl || (selectedUser.user.id === 3 && loan.id === 1)) ? (
                                  <img 
                                    src={loan.selfieWithIdUrl || "/uploads/selfie-with-id-3-1.jpg"} 
                                    alt="รูปถ่ายคู่กับบัตรประชาชน" 
                                    className="h-32 object-contain" 
                                  />
                                ) : (
                                  <div className="text-gray-400 p-4">รูปถ่ายคู่กับบัตรประชาชน</div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsUserDetailDialogOpen(false)}>
                  ปิด
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}