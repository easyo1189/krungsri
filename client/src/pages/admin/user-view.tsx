import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";

export default function UserView() {
  const [, navigate] = useLocation();
  const [userId, setUserId] = useState<number | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [accountData, setAccountData] = useState<any>(null);
  const [loansData, setLoansData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ฟังก์ชันดึงข้อมูลโดยตรงจาก API
  const fetchUserData = async (id: number) => {
    setLoading(true);
    setError(null);
    
    try {
      // ดึงข้อมูลผู้ใช้
      const userResponse = await fetch(`/api/admin/user/${id}`);
      if (!userResponse.ok) {
        throw new Error("Failed to fetch user data");
      }
      
      try {
        const userData = await userResponse.json();
        console.log("User data:", userData);
        setUserData(userData);
      } catch (err) {
        console.error("Error parsing user data:", err);
        throw new Error("ไม่สามารถอ่านข้อมูลผู้ใช้ได้ กรุณาล็อกอินใหม่อีกครั้ง");
      }
      
      // ดึงข้อมูลบัญชี
      const accountResponse = await fetch(`/api/admin/user/${id}/account`);
      if (!accountResponse.ok) {
        throw new Error("Failed to fetch account data");
      }
      
      try {
        const accountData = await accountResponse.json();
        console.log("Account data:", accountData);
        setAccountData(accountData);
      } catch (err) {
        console.error("Error parsing account data:", err);
        throw new Error("ไม่สามารถอ่านข้อมูลบัญชีได้ กรุณาล็อกอินใหม่อีกครั้ง");
      }
      
      // ดึงข้อมูลเงินกู้
      const loansResponse = await fetch(`/api/admin/user/${id}/loans`);
      if (!loansResponse.ok) {
        throw new Error("Failed to fetch loans data");
      }
      
      try {
        const loansData = await loansResponse.json();
        console.log("Loans data:", loansData);
        setLoansData(loansData);
      } catch (err) {
        console.error("Error parsing loans data:", err);
        throw new Error("ไม่สามารถอ่านข้อมูลเงินกู้ได้ กรุณาล็อกอินใหม่อีกครั้ง");
      }
      
      setLoading(false);
    } catch (err) {
      setError((err as any).message || "เกิดข้อผิดพลาดระหว่างการดึงข้อมูล");
      setLoading(false);
      console.error("Error fetching data:", err);
    }
  };

  // ดึงข้อมูลผู้ใช้
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id) {
      const userId = parseInt(id);
      setUserId(userId);
      fetchUserData(userId);
    }
  }, []);

  const handleRefresh = () => {
    if (userId) {
      fetchUserData(userId);
    }
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
        <h1 className="text-2xl font-bold">ข้อมูลผู้ใช้</h1>
      </div>

      <div className="mb-4 flex justify-end">
        <Button onClick={handleRefresh}>รีเฟรชข้อมูล</Button>
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
        <div className="space-y-6">


          {/* ข้อมูลผู้ใช้ */}
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <div>
                <CardTitle>ข้อมูลส่วนตัว</CardTitle>
                <CardDescription>ข้อมูลเชิงประชากรและการติดต่อ</CardDescription>
              </div>
              <div className="flex space-x-2">
                {userData?.isAdmin ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500 text-white">แอดมิน</span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">ผู้ใช้ทั่วไป</span>
                )}
                {userData?.isActive ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500 text-white">ใช้งานอยู่</span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500 text-white">ระงับการใช้งาน</span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {userData && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">ชื่อผู้ใช้</p>
                      <p className="font-medium">{userData.username}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">อีเมล</p>
                      <p className="font-medium">{userData.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">ชื่อ-นามสกุล</p>
                      <p className="font-medium">{userData.fullName || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">เบอร์โทรศัพท์</p>
                      <p className="font-medium">{userData.phone || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">ที่อยู่</p>
                      <p className="font-medium">{userData.address || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">เลขบัตรประชาชน</p>
                      <p className="font-medium">{userData.idCardNumber || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">อาชีพ</p>
                      <p className="font-medium">{userData.occupation || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">รายได้ต่อเดือน</p>
                      <p className="font-medium">{userData.monthlyIncome ? `${userData.monthlyIncome.toLocaleString()} บาท` : "-"}</p>
                    </div>
                  </div>
                  
                  {/* เอกสารยืนยันตัวตน */}
                  {(userData.frontIdCardImage || userData.backIdCardImage || userData.selfieWithIdCardImage) && (
                    <div className="mt-4">
                      <h3 className="text-md font-semibold mb-2">เอกสารยืนยันตัวตน</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {userData.frontIdCardImage && (
                          <div className="space-y-2">
                            <p className="text-sm text-gray-500">บัตรประชาชนด้านหน้า</p>
                            <div className="relative border rounded-md overflow-hidden aspect-[3/2]">
                              <img 
                                src={userData.frontIdCardImage} 
                                alt="บัตรประชาชนด้านหน้า" 
                                className="object-cover w-full h-full cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => window.open(userData.frontIdCardImage, '_blank')}
                              />
                            </div>
                          </div>
                        )}
                        
                        {userData.backIdCardImage && (
                          <div className="space-y-2">
                            <p className="text-sm text-gray-500">บัตรประชาชนด้านหลัง</p>
                            <div className="relative border rounded-md overflow-hidden aspect-[3/2]">
                              <img 
                                src={userData.backIdCardImage} 
                                alt="บัตรประชาชนด้านหลัง" 
                                className="object-cover w-full h-full cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => window.open(userData.backIdCardImage, '_blank')}
                              />
                            </div>
                          </div>
                        )}
                        
                        {userData.selfieWithIdCardImage && (
                          <div className="space-y-2">
                            <p className="text-sm text-gray-500">เซลฟี่พร้อมบัตรประชาชน</p>
                            <div className="relative border rounded-md overflow-hidden aspect-[3/2]">
                              <img 
                                src={userData.selfieWithIdCardImage} 
                                alt="เซลฟี่พร้อมบัตรประชาชน" 
                                className="object-cover w-full h-full cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => window.open(userData.selfieWithIdCardImage, '_blank')}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ข้อมูลบัญชี */}
          {accountData && (
            <Card>
              <CardHeader>
                <CardTitle>ข้อมูลบัญชีธนาคาร</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">ธนาคาร</p>
                    <p className="font-medium">{accountData.bankName || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">เลขบัญชี</p>
                    <p className="font-medium">{accountData.accountNumber || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">ชื่อบัญชี</p>
                    <p className="font-medium">{accountData.accountName || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">ยอดเงินคงเหลือ</p>
                    <p className="font-medium">{accountData.balance || "0"} บาท</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ข้อมูลเงินกู้ */}
          {loansData && loansData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>ประวัติการกู้เงิน</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loansData.map((loan: any) => (
                    <div key={loan.id} className="border p-4 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">จำนวนเงินกู้</p>
                          <p className="font-medium">{loan.amount} บาท</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">ระยะเวลา</p>
                          <p className="font-medium">{loan.term} เดือน</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">ดอกเบี้ย</p>
                          <p className="font-medium">{loan.interestRate}%</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">สถานะ</p>
                          <p className="font-medium">{loan.status}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">วันที่สร้าง</p>
                          <p className="font-medium">{new Date(loan.createdAt).toLocaleDateString('th-TH')}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}