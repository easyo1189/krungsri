import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function UsersList() {
  const [, navigate] = useLocation();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/admin/users");
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      
      try {
        const data = await response.json();
        console.log("Users data:", data);
        setUsers(data);
      } catch (err) {
        console.error("Error parsing users data:", err);
        throw new Error("ไม่สามารถอ่านข้อมูลผู้ใช้ได้ กรุณาล็อกอินใหม่อีกครั้ง");
      }
      setLoading(false);
    } catch (err) {
      setError((err as any).message || "เกิดข้อผิดพลาดระหว่างการดึงข้อมูล");
      setLoading(false);
      console.error("Error fetching users:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleViewUser = (userId: number) => {
    navigate(`/admin/user-view?id=${userId}`);
  };

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate("/admin")}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-200 mr-4"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-2xl font-bold">จัดการข้อมูลผู้ใช้ทั้งหมด</h1>
      </div>

      <div className="mb-6 flex justify-between items-center">
        <p className="text-gray-600">
          เลือกผู้ใช้เพื่อดูข้อมูลทั้งหมด
        </p>
        <Button
          variant="outline"
          onClick={fetchUsers}
        >
          <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          รีเฟรชข้อมูล
        </Button>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="loader"></div>
          <p className="mt-4">กำลังโหลดข้อมูล...</p>
        </div>
      )}

      {error && (
        <Card className="mb-4 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-500">{error}</p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && (
        <>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {users.map((user) => (
              <Card 
                key={user.id} 
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => handleViewUser(user.id)}
              >
                <CardHeader className="pb-2">
                  <CardTitle>{user.fullName || user.username}</CardTitle>
                  <CardDescription>{user.email}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {user.fullName ? user.fullName.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm text-gray-500">ผู้ใช้ #{user.id}</p>
                      <p className="text-sm">{user.phone || "ไม่มีเบอร์โทร"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}