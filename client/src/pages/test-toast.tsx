import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BottomNavigation from "@/components/bottom-navigation";

export default function TestToastPage() {
  const { toast } = useToast();

  const showSuccessToast = () => {
    toast({
      title: "สำเร็จ!",
      description: "การทำรายการเสร็จสมบูรณ์",
      variant: "default",
    });
  };

  const showErrorToast = () => {
    toast({
      title: "ข้อผิดพลาด!",
      description: "ไม่สามารถดำเนินการได้ กรุณาลองใหม่อีกครั้ง",
      variant: "destructive",
    });
  };

  const showInfoToast = () => {
    toast({
      title: "ข้อมูล",
      description: "มีข้อความใหม่ในกล่องข้อความของคุณ",
      variant: "default",
    });
  };

  const showLoanUpdateToast = () => {
    toast({
      title: "อัพเดทสถานะการกู้",
      description: "คำขอกู้เงินของคุณได้รับการอนุมัติแล้ว",
      variant: "default",
    });
  };

  const showWithdrawalToast = () => {
    toast({
      title: "การถอนเงิน",
      description: "การถอนเงินของคุณจำนวน ฿5,000 ได้รับการดำเนินการแล้ว",
      variant: "default",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <Card className="shadow-lg rounded-xl mb-4">
        <CardHeader>
          <CardTitle className="text-xl text-center">ทดสอบการแจ้งเตือน</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-3">
            <Button onClick={showSuccessToast}>
              แสดงแจ้งเตือนสำเร็จ
            </Button>
            <Button onClick={showErrorToast} variant="destructive">
              แสดงแจ้งเตือนข้อผิดพลาด
            </Button>
            <Button onClick={showInfoToast} variant="outline">
              แสดงแจ้งเตือนข้อมูล
            </Button>
            <Button onClick={showLoanUpdateToast} variant="secondary">
              แสดงแจ้งเตือนอัพเดทสถานะการกู้
            </Button>
            <Button onClick={showWithdrawalToast} variant="default">
              แสดงแจ้งเตือนการถอนเงิน
            </Button>
          </div>
        </CardContent>
      </Card>
      <BottomNavigation />
    </div>
  );
}