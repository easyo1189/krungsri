import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BottomNavigation from "@/components/bottom-navigation";

export default function TestToastNewPage() {
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

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 p-4">
      <div className="flex-1 max-w-md mx-auto w-full">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-center">ทดสอบการแจ้งเตือนใหม่</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Button onClick={showSuccessToast}>แสดงการแจ้งเตือนสำเร็จ</Button>
            <Button 
              onClick={showErrorToast}
              variant="destructive"
            >แสดงการแจ้งเตือนข้อผิดพลาด</Button>
            <Button 
              onClick={showInfoToast}
              variant="outline"
            >แสดงการแจ้งเตือนข้อมูล</Button>
          </CardContent>
        </Card>
      </div>
      <BottomNavigation />
    </div>
  );
}