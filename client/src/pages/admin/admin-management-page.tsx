import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, getQueryFn, apiRequest } from "@/lib/queryClient";
import { AdminAssignment, User } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { CalendarDays, CheckCircle, Clock, ShieldAlert, ShieldCheck, XCircle } from "lucide-react";

// สร้าง schema สำหรับฟอร์มแต่งตั้งแอดมิน
const adminAssignmentFormSchema = z.object({
  userId: z.number().positive(),
  adminRole: z.enum(["admin"]),
  durationValue: z.coerce.number().positive().min(1, "กรุณาระบุระยะเวลา"),
  durationUnit: z.enum(["minutes", "hours", "days", "months", "years"]),
});

export default function AdminManagementPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  
  // ดึงข้อมูลแอดมินทั้งหมด
  const { data: admins, isLoading: isLoadingAdmins } = useQuery<User[]>({
    queryKey: ['/api/admin/roles'],
    queryFn: getQueryFn(),
    enabled: !!user && user.adminRole === 'super_admin'
  });
  
  // ดึงข้อมูลผู้ใช้ทั้งหมด (สำหรับแต่งตั้งแอดมิน)
  const { data: users, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    queryFn: getQueryFn(),
    enabled: !!user && user.adminRole === 'super_admin'
  });
  
  // สร้าง mutation สำหรับแต่งตั้งแอดมิน
  const assignAdminMutation = useMutation({
    mutationFn: async (data: z.infer<typeof adminAssignmentFormSchema>) => {
      const res = await apiRequest("POST", "/api/admin/roles", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "แต่งตั้งแอดมินสำเร็จ",
        description: "ผู้ใช้ได้รับสิทธิ์แอดมินเรียบร้อยแล้ว",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/roles"] });
      setIsAssignDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // สร้าง mutation สำหรับถอดถอนแอดมิน
  const revokeAdminMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("DELETE", `/api/admin/roles/${userId}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "ถอดถอนแอดมินสำเร็จ",
        description: "สิทธิ์แอดมินถูกยกเลิกเรียบร้อยแล้ว",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/roles"] });
    },
    onError: (error: Error) => {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // สร้าง form สำหรับแต่งตั้งแอดมิน
  const form = useForm<z.infer<typeof adminAssignmentFormSchema>>({
    resolver: zodResolver(adminAssignmentFormSchema),
    defaultValues: {
      adminRole: "admin",
      durationValue: 30,
      durationUnit: "days",
    },
  });
  
  // ตรวจสอบว่าผู้ใช้ที่มีสิทธิ์ super_admin หรือไม่
  const isSuperAdmin = user?.adminRole === 'super_admin';
  
  // ถ้าไม่ใช่ super_admin ให้แสดงข้อความแจ้งเตือน
  if (!isSuperAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">จัดการแอดมิน</CardTitle>
          <CardDescription>
            ระบบจัดการสิทธิ์แอดมิน
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-8 gap-4">
            <ShieldAlert size={64} className="text-destructive" />
            <h3 className="text-xl font-semibold">ไม่มีสิทธิ์เข้าถึง</h3>
            <p className="text-muted-foreground text-center">
              คุณไม่มีสิทธิ์ในการเข้าถึงหน้าจัดการแอดมิน กรุณาติดต่อผู้ดูแลระบบ
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // ฟังก์ชันสำหรับแสดงสถานะของแอดมิน
  const renderAdminStatus = (admin: User) => {
    if (admin.adminRole === 'super_admin') {
      return (
        <Badge variant="default" className="bg-indigo-600">
          <ShieldCheck className="mr-1 h-3 w-3" /> Super Admin
        </Badge>
      );
    }
    
    // ตรวจสอบว่าแอดมินหมดอายุหรือไม่
    if (admin.adminExpiresAt) {
      const expiresAt = new Date(admin.adminExpiresAt);
      const now = new Date();
      
      if (now > expiresAt) {
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" /> หมดอายุ
          </Badge>
        );
      }
      
      // คำนวณเวลาที่เหลือ
      const diffTime = Math.abs(expiresAt.getTime() - now.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return (
        <Badge variant="default" className="bg-green-600">
          <CheckCircle className="mr-1 h-3 w-3" /> แอดมิน ({diffDays} วัน)
        </Badge>
      );
    }
    
    return (
      <Badge variant="default">
        <CheckCircle className="mr-1 h-3 w-3" /> แอดมิน
      </Badge>
    );
  };
  
  // แปลงหน่วยเวลาให้เป็นภาษาไทย
  const translateDurationUnit = (unit: string) => {
    switch (unit) {
      case 'minutes': return 'นาที';
      case 'hours': return 'ชั่วโมง';
      case 'days': return 'วัน';
      case 'months': return 'เดือน';
      case 'years': return 'ปี';
      default: return unit;
    }
  };
  
  // ฟังก์ชันเมื่อส่งฟอร์มแต่งตั้งแอดมิน
  const onSubmit = (data: z.infer<typeof adminAssignmentFormSchema>) => {
    assignAdminMutation.mutate(data);
  };
  
  // กำหนดค่าเริ่มต้นสำหรับฟอร์มเมื่อเลือกผู้ใช้
  const handleUserSelect = (userId: string) => {
    form.setValue('userId', parseInt(userId));
  };
  
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl">จัดการแอดมิน</CardTitle>
            <CardDescription>
              ระบบจัดการสิทธิ์แอดมิน และผู้ใช้ที่มีสิทธิ์แอดมิน
            </CardDescription>
          </div>
          <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
            <DialogTrigger asChild>
              <Button>แต่งตั้งแอดมินใหม่</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>แต่งตั้งแอดมินใหม่</DialogTitle>
                <DialogDescription>
                  เลือกผู้ใช้และกำหนดระยะเวลาการเป็นแอดมิน
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="userId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>เลือกผู้ใช้</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="เลือกผู้ใช้ที่ต้องการแต่งตั้งเป็นแอดมิน" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {users?.filter(u => !u.isAdmin).map((user) => (
                              <SelectItem key={user.id} value={user.id.toString()}>
                                {user.fullName} ({user.username})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="durationValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ระยะเวลา</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} min={1} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="durationUnit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>หน่วย</FormLabel>
                          <Select 
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="เลือกหน่วยเวลา" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="minutes">นาที</SelectItem>
                              <SelectItem value="hours">ชั่วโมง</SelectItem>
                              <SelectItem value="days">วัน</SelectItem>
                              <SelectItem value="months">เดือน</SelectItem>
                              <SelectItem value="years">ปี</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={assignAdminMutation.isPending}
                    >
                      {assignAdminMutation.isPending ? "กำลังดำเนินการ..." : "แต่งตั้งแอดมิน"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {isLoadingAdmins ? (
            <div className="flex justify-center my-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : admins && admins.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ชื่อผู้ใช้</TableHead>
                  <TableHead>ชื่อ-นามสกุล</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>วันหมดอายุ</TableHead>
                  <TableHead>การจัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell className="font-medium">{admin.username}</TableCell>
                    <TableCell>{admin.fullName}</TableCell>
                    <TableCell>{renderAdminStatus(admin)}</TableCell>
                    <TableCell>
                      {admin.adminExpiresAt ? (
                        <div className="flex items-center">
                          <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
                          {new Date(admin.adminExpiresAt).toLocaleDateString('th-TH')}
                        </div>
                      ) : admin.adminRole === 'super_admin' ? (
                        <span className="text-muted-foreground">ไม่มีวันหมดอายุ</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {admin.adminRole !== 'super_admin' && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              ยกเลิกสิทธิ์
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>ยืนยันการยกเลิกสิทธิ์แอดมิน</AlertDialogTitle>
                              <AlertDialogDescription>
                                คุณต้องการยกเลิกสิทธิ์แอดมินของ {admin.fullName} ใช่หรือไม่?
                                เมื่อดำเนินการแล้วจะไม่สามารถย้อนกลับได้
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => revokeAdminMutation.mutate(admin.id)}
                                disabled={revokeAdminMutation.isPending}
                              >
                                {revokeAdminMutation.isPending ? "กำลังดำเนินการ..." : "ยืนยัน"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <ShieldCheck size={64} className="text-muted-foreground mb-4" />
              <p>ไม่พบข้อมูลแอดมิน</p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}