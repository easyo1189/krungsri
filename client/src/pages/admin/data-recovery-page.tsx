import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, RefreshCcw, Trash2, UserCheck, FileText, MessagesSquare, CreditCard, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// ประเภทข้อมูลสำหรับข้อมูลที่ถูกลบ
type DeletedItemCount = {
  table_name: string;
  deleted_count: number;
};

// ประเภทข้อมูลสำหรับผู้ใช้ที่ถูกลบ
type DeletedUser = {
  id: number;
  username: string;
  email: string;
  full_name: string;
  deleted_at: string;
};

export default function DataRecoveryPage() {
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    action: () => void;
  }>({ isOpen: false, title: "", description: "", action: () => {} });

  // ตรวจสอบว่าผู้ใช้เป็น super_admin หรือไม่
  const isSuperAdmin = user?.adminRole === 'super_admin';

  // ดึงข้อมูลจำนวนข้อมูลที่ถูกลบ
  const {
    data: deletedCounts,
    isLoading: isLoadingCounts,
    refetch: refetchCounts,
  } = useQuery<DeletedItemCount[]>({
    queryKey: ['/api/admin/deleted-count'],
    enabled: !!user?.isAdmin && isSuperAdmin,
  });

  // ดึงข้อมูลผู้ใช้ที่ถูกลบ
  const {
    data: deletedUsers,
    isLoading: isLoadingUsers,
    refetch: refetchUsers,
  } = useQuery<DeletedUser[]>({
    queryKey: ['/api/admin/deleted-users'],
    enabled: !!user?.isAdmin && isSuperAdmin,
  });

  // Mutation สำหรับกู้คืนข้อมูลทั้งหมด
  const restoreAllMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/restore/all");
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "กู้คืนข้อมูลสำเร็จ",
        description: "ข้อมูลทั้งหมดถูกกู้คืนเรียบร้อยแล้ว",
      });
      // รีเฟรชข้อมูล
      refetchCounts();
      refetchUsers();
      queryClient.invalidateQueries();
    },
    onError: (error: Error) => {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation สำหรับกู้คืนข้อมูลผู้ใช้ทั้งหมด
  const restoreUsersMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/restore/users");
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "กู้คืนข้อมูลผู้ใช้สำเร็จ",
        description: "ข้อมูลผู้ใช้ทั้งหมดถูกกู้คืนเรียบร้อยแล้ว",
      });
      refetchCounts();
      refetchUsers();
    },
    onError: (error: Error) => {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation สำหรับกู้คืนข้อมูลสินเชื่อทั้งหมด
  const restoreLoansMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/restore/loans");
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "กู้คืนข้อมูลสินเชื่อสำเร็จ",
        description: "ข้อมูลสินเชื่อทั้งหมดถูกกู้คืนเรียบร้อยแล้ว",
      });
      refetchCounts();
    },
    onError: (error: Error) => {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation สำหรับกู้คืนข้อมูลข้อความทั้งหมด
  const restoreMessagesMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/restore/messages");
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "กู้คืนข้อมูลข้อความสำเร็จ",
        description: "ข้อมูลข้อความทั้งหมดถูกกู้คืนเรียบร้อยแล้ว",
      });
      refetchCounts();
    },
    onError: (error: Error) => {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation สำหรับกู้คืนข้อมูลการถอนเงินทั้งหมด
  const restoreWithdrawalsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/restore/withdrawals");
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "กู้คืนข้อมูลการถอนเงินสำเร็จ",
        description: "ข้อมูลการถอนเงินทั้งหมดถูกกู้คืนเรียบร้อยแล้ว",
      });
      refetchCounts();
    },
    onError: (error: Error) => {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation สำหรับกู้คืนข้อมูลผู้ใช้ตาม ID
  const restoreUserByIdMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("POST", `/api/admin/restore/user/${userId}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "กู้คืนข้อมูลผู้ใช้สำเร็จ",
        description: "ข้อมูลผู้ใช้ถูกกู้คืนเรียบร้อยแล้ว",
      });
      refetchCounts();
      refetchUsers();
    },
    onError: (error: Error) => {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // ฟังก์ชันสำหรับเปิด dialog ยืนยันการกู้คืนข้อมูล
  const confirmRestore = (title: string, description: string, action: () => void) => {
    setConfirmDialog({
      isOpen: true,
      title,
      description,
      action
    });
  };

  // ฟังก์ชันสำหรับปิด dialog
  const closeConfirmDialog = () => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
  };

  // ถ้าไม่ใช่ super_admin ให้แสดงข้อความแจ้งเตือน
  if (!isSuperAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">กู้คืนข้อมูล</CardTitle>
          <CardDescription>
            ระบบกู้คืนข้อมูลที่ถูกลบ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-8 gap-4">
            <ShieldAlert size={64} className="text-destructive" />
            <h3 className="text-xl font-semibold">ไม่มีสิทธิ์เข้าถึง</h3>
            <p className="text-muted-foreground text-center">
              คุณไม่มีสิทธิ์ในการเข้าถึงระบบกู้คืนข้อมูล กรุณาติดต่อผู้ดูแลระบบ
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl">กู้คืนข้อมูล</CardTitle>
              <CardDescription>
                ระบบกู้คืนข้อมูลที่ถูกลบในฐานข้อมูล
              </CardDescription>
            </div>
            <Button 
              variant="primary"
              className="bg-green-600 hover:bg-green-700 text-white"
              size="lg"
              onClick={() => confirmRestore(
                "ยืนยันการกู้คืนข้อมูลทั้งหมด", 
                "คุณแน่ใจหรือไม่ว่าต้องการกู้คืนข้อมูลทั้งหมดที่ถูกลบ? การดำเนินการนี้ไม่สามารถย้อนกลับได้", 
                () => restoreAllMutation.mutate()
              )}
              disabled={restoreAllMutation.isPending}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              กู้คืนข้อมูลทั้งหมด
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>คำเตือน</AlertTitle>
            <AlertDescription>
              การกู้คืนข้อมูลจะทำให้ข้อมูลที่ถูกมาร์คว่าลบกลับมาแสดงในระบบอีกครั้ง การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </AlertDescription>
          </Alert>
          
          <Tabs defaultValue="stats">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="stats">ภาพรวมข้อมูลที่ถูกลบ</TabsTrigger>
              <TabsTrigger value="users">ผู้ใช้ที่ถูกลบ</TabsTrigger>
            </TabsList>
            
            <TabsContent value="stats" className="space-y-4 mt-6">
              <h3 className="text-xl font-semibold mb-4">จำนวนข้อมูลที่ถูกลบ</h3>
              
              {isLoadingCounts ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center">
                        <UserCheck className="h-5 w-5 mr-2 text-blue-500" />
                        ผู้ใช้
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {deletedCounts?.find(item => item.table_name === 'users')?.deleted_count || 0}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="w-full"
                        onClick={() => confirmRestore(
                          "ยืนยันการกู้คืนข้อมูลผู้ใช้", 
                          "คุณแน่ใจหรือไม่ว่าต้องการกู้คืนข้อมูลผู้ใช้ทั้งหมดที่ถูกลบ?", 
                          () => restoreUsersMutation.mutate()
                        )}
                        disabled={restoreUsersMutation.isPending || (deletedCounts?.find(item => item.table_name === 'users')?.deleted_count || 0) === 0}
                      >
                        กู้คืนข้อมูลผู้ใช้
                      </Button>
                    </CardFooter>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-green-500" />
                        สินเชื่อ
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {deletedCounts?.find(item => item.table_name === 'loans')?.deleted_count || 0}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="w-full"
                        onClick={() => confirmRestore(
                          "ยืนยันการกู้คืนข้อมูลสินเชื่อ", 
                          "คุณแน่ใจหรือไม่ว่าต้องการกู้คืนข้อมูลสินเชื่อทั้งหมดที่ถูกลบ?", 
                          () => restoreLoansMutation.mutate()
                        )}
                        disabled={restoreLoansMutation.isPending || (deletedCounts?.find(item => item.table_name === 'loans')?.deleted_count || 0) === 0}
                      >
                        กู้คืนข้อมูลสินเชื่อ
                      </Button>
                    </CardFooter>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center">
                        <MessagesSquare className="h-5 w-5 mr-2 text-yellow-500" />
                        ข้อความ
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {deletedCounts?.find(item => item.table_name === 'messages')?.deleted_count || 0}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="w-full"
                        onClick={() => confirmRestore(
                          "ยืนยันการกู้คืนข้อความ", 
                          "คุณแน่ใจหรือไม่ว่าต้องการกู้คืนข้อความทั้งหมดที่ถูกลบ?", 
                          () => restoreMessagesMutation.mutate()
                        )}
                        disabled={restoreMessagesMutation.isPending || (deletedCounts?.find(item => item.table_name === 'messages')?.deleted_count || 0) === 0}
                      >
                        กู้คืนข้อความ
                      </Button>
                    </CardFooter>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center">
                        <CreditCard className="h-5 w-5 mr-2 text-purple-500" />
                        การถอนเงิน
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {deletedCounts?.find(item => item.table_name === 'withdrawals')?.deleted_count || 0}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="w-full"
                        onClick={() => confirmRestore(
                          "ยืนยันการกู้คืนข้อมูลการถอนเงิน", 
                          "คุณแน่ใจหรือไม่ว่าต้องการกู้คืนข้อมูลการถอนเงินทั้งหมดที่ถูกลบ?", 
                          () => restoreWithdrawalsMutation.mutate()
                        )}
                        disabled={restoreWithdrawalsMutation.isPending || (deletedCounts?.find(item => item.table_name === 'withdrawals')?.deleted_count || 0) === 0}
                      >
                        กู้คืนข้อมูลการถอนเงิน
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="users" className="mt-6">
              <h3 className="text-xl font-semibold mb-4">ผู้ใช้ที่ถูกลบ</h3>
              
              {isLoadingUsers ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : deletedUsers && deletedUsers.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>ชื่อผู้ใช้</TableHead>
                        <TableHead>อีเมล</TableHead>
                        <TableHead>ชื่อ-นามสกุล</TableHead>
                        <TableHead>วันที่ลบ</TableHead>
                        <TableHead>การกระทำ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deletedUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.id}</TableCell>
                          <TableCell>{user.username}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.full_name}</TableCell>
                          <TableCell>
                            {new Date(user.deleted_at).toLocaleString('th-TH')}
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => confirmRestore(
                                `ยืนยันการกู้คืนผู้ใช้ ${user.full_name}`, 
                                `คุณแน่ใจหรือไม่ว่าต้องการกู้คืนผู้ใช้ ${user.full_name}?`, 
                                () => restoreUserByIdMutation.mutate(user.id)
                              )}
                              disabled={restoreUserByIdMutation.isPending}
                            >
                              <RefreshCcw className="mr-2 h-4 w-4" />
                              กู้คืน
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center p-8 text-muted-foreground">
                  <Trash2 className="mx-auto h-12 w-12 mb-4 text-muted-foreground/60" />
                  <p>ไม่พบข้อมูลผู้ใช้ที่ถูกลบ</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <Dialog open={confirmDialog.isOpen} onOpenChange={closeConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmDialog.title}</DialogTitle>
            <DialogDescription>
              {confirmDialog.description}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeConfirmDialog}>ยกเลิก</Button>
            <Button 
              variant="default"
              className="bg-primary" 
              onClick={() => {
                confirmDialog.action();
                closeConfirmDialog();
              }}
            >
              ยืนยัน
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}