import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { HexColorPicker } from "react-colorful";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Palette,
  Sliders,
  Layout,
  Type,
  Globe,
  Settings,
  Save,
  RefreshCcw,
  Check,
  TextCursor,
  Pencil,
  PanelLeftClose,
  Banknote,
  DollarSign,
  Clock,
  Percent,
  Wallet,
  Building,
  Square,
  SquareStack
} from "lucide-react";

// ประเภทข้อมูลสำหรับธีม
interface ThemeSettings {
  primary: string;
  variant: "professional" | "tint" | "vibrant";
  appearance: "light" | "dark" | "system";
  radius: number;
}

// ประเภทข้อมูลสำหรับฟอนต์
interface FontSettings {
  family: string;
  size: {
    base: number;
    h1: number;
    h2: number;
    h3: number;
    small: number;
  };
  color: {
    primary: string;
    secondary: string;
    muted: string;
  };
  weight: {
    normal: number;
    medium: number;
    bold: number;
  };
}

// ประเภทข้อมูลสำหรับ Banner Slide
interface BannerSlide {
  id: number;
  imageUrl: string;
  title: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  backgroundColor: string;
}

// ประเภทข้อมูลสำหรับ Navigation Tab
interface NavigationTab {
  id: number;
  label: string;
  icon: string;
  link: string;
}

// ประเภทข้อมูลสำหรับการตั้งค่าแบรนด์
interface BrandSettings {
  siteName: string;
  logoUrl: string;
  siteDescription: string;
  footerText: string;
  fonts: FontSettings;
  
  // การปรับแต่งสีทั่วไป
  colors?: {
    // สีของส่วนบน (Header)
    headerBackground: string;
    headerText: string;
    
    // สีของปุ่มหลัก
    primaryButtonBackground: string;
    primaryButtonText: string;
    
    // สีของปุ่มรอง
    secondaryButtonBackground: string;
    secondaryButtonText: string;
    
    // สีของ Bottom Navigation
    bottomNavigationBackground: string;
    bottomNavigationText: string;
    bottomNavigationActiveText: string;
    bottomNavigationActiveIcon: string;
    bottomNavigationBorder: string;
    
    // สีของการ์ด
    cardBackground: string;
    cardBorder: string;
    cardHeaderBackground: string;
    cardTitle: string;
    
    // สีของสถานะต่างๆ
    successColor: string;
    warningColor: string;
    errorColor: string;
    infoColor: string;
  };
  
  login: {
    logoIcon: string;
    mainTitle: string;
    subTitle: string;
    backgroundColor: string;
    headerText: string;
    buttonColor: string;
    buttonTextColor: string;
    titleFontSize: number;
    titleFontColor: string;
    subtitleFontSize: number;
    subtitleFontColor: string;
  };
  homePage?: {
    headerBackgroundColor: string;
    bannerSlides: BannerSlide[];
    navigationTabs: NavigationTab[];
  };
  loanPage?: {
    headerBackgroundColor: string;
    minLoanAmount: number;
    maxLoanAmount: number;
    minLoanTerm: number;
    maxLoanTerm: number;
    interestRate: number;
    formLabelColor: string;
    formInputBorderColor: string;
    formInputBgColor: string;
    buttonColor: string;
    buttonTextColor: string;
  };
  withdrawalPage?: {
    balanceCardBgFrom: string;  // สีเริ่มต้นของการ์ดแสดงยอดเงิน
    balanceCardBgTo: string;    // สีสิ้นสุดของการ์ดแสดงยอดเงิน
    balanceCardTextColor: string; // สีข้อความในการ์ดแสดงยอดเงิน
    tabActiveColor: string;     // สีแท็บที่เลือก
    tabTextColor: string;       // สีข้อความในแท็บ
    bankFormHeaderBgFrom: string; // สีพื้นหลังส่วนหัวฟอร์มธนาคาร (เริ่มต้น)
    bankFormHeaderBgTo: string;   // สีพื้นหลังส่วนหัวฟอร์มธนาคาร (สิ้นสุด)
    withdrawFormHeaderBgFrom: string; // สีพื้นหลังส่วนหัวฟอร์มถอนเงิน (เริ่มต้น)
    withdrawFormHeaderBgTo: string;   // สีพื้นหลังส่วนหัวฟอร์มถอนเงิน (สิ้นสุด)
    bankButtonBgFrom: string;   // สีเริ่มต้นของปุ่มบันทึกบัญชีธนาคาร
    bankButtonBgTo: string;     // สีสิ้นสุดของปุ่มบันทึกบัญชีธนาคาร
    bankButtonTextColor: string; // สีข้อความในปุ่มบันทึกบัญชีธนาคาร
    withdrawButtonBgFrom: string; // สีเริ่มต้นของปุ่มถอนเงิน
    withdrawButtonBgTo: string;   // สีสิ้นสุดของปุ่มถอนเงิน
    withdrawButtonTextColor: string; // สีข้อความในปุ่มถอนเงิน
  };
}

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>({
    primary: "hsl(179, 75%, 37%)",
    variant: "professional",
    appearance: "light",
    radius: 0.5,
  });

  const [brandSettings, setBrandSettings] = useState<BrandSettings>({
    siteName: "CashLuxe",
    logoUrl: "",
    siteDescription: "บริการเงินกู้ออนไลน์ รวดเร็ว ปลอดภัย น่าเชื่อถือ",
    footerText: "© 2025 CashLuxe - บริการเงินกู้ออนไลน์",
    fonts: {
      family: "'Sukhumvit Set', 'Noto Sans Thai', sans-serif",
      size: {
        base: 16,
        h1: 32,
        h2: 24,
        h3: 20, 
        small: 14
      },
      color: {
        primary: "#1a2942",
        secondary: "#4b5563",
        muted: "#6b7280"
      },
      weight: {
        normal: 400,
        medium: 500,
        bold: 700
      }
    },
    // ค่าเริ่มต้นของการปรับแต่งสีทั่วไป
    colors: {
      // สีของส่วนบน (Header)
      headerBackground: "#5d4a4a",
      headerText: "#ffffff",
      
      // สีของปุ่มหลัก
      primaryButtonBackground: "#ffd008",
      primaryButtonText: "#000000",
      
      // สีของปุ่มรอง
      secondaryButtonBackground: "#e0e0e0",
      secondaryButtonText: "#333333",
      
      // สีของ Bottom Navigation
      bottomNavigationBackground: "#ffffff",
      bottomNavigationText: "#9ca3af",
      bottomNavigationActiveText: "#5d4a4a",
      bottomNavigationActiveIcon: "#5d4a4a",
      bottomNavigationBorder: "#e5e7eb",
      
      // สีของการ์ด
      cardBackground: "#ffffff",
      cardBorder: "#e5e7eb",
      cardHeaderBackground: "#f9fafb",
      cardTitle: "#1a2942",
      
      // สีของสถานะต่างๆ
      successColor: "#10b981",
      warningColor: "#f59e0b",
      errorColor: "#ef4444",
      infoColor: "#3b82f6",
    },
    login: {
      logoIcon: "",
      mainTitle: "CashLuxe",
      subTitle: "สินเชื่อส่วนบุคคล ทางเลือกทางการเงินที่เชื่อถือได้",
      backgroundColor: "hsl(179, 75%, 37%)",
      headerText: "เข้าสู่ระบบ",
      buttonColor: "hsl(179, 75%, 37%)",
      buttonTextColor: "#ffffff",
      titleFontSize: 32,
      titleFontColor: "#1a2942",
      subtitleFontSize: 16,
      subtitleFontColor: "#4b5563"
    },
    withdrawalPage: {
      balanceCardBgFrom: "#10b981",
      balanceCardBgTo: "#059669",
      balanceCardTextColor: "#ffffff",
      tabActiveColor: "#10b981",
      tabTextColor: "#4b5563",
      bankFormHeaderBgFrom: "#e6f7f7",
      bankFormHeaderBgTo: "#e6f0ff",
      withdrawFormHeaderBgFrom: "#e6f7f7",
      withdrawFormHeaderBgTo: "#e6f0ff",
      bankButtonBgFrom: "#3b82f6",
      bankButtonBgTo: "#2563eb",
      bankButtonTextColor: "#ffffff",
      withdrawButtonBgFrom: "#10b981",
      withdrawButtonBgTo: "#059669",
      withdrawButtonTextColor: "#ffffff"
    }
  });

  // โหลดการตั้งค่าธีมเมื่อหน้าเว็บโหลด
  useEffect(() => {
    const fetchThemeSettings = async () => {
      try {
        const response = await apiRequest("GET", "/api/admin/settings/theme");
        if (response.ok) {
          const data = await response.json();
          setThemeSettings(data);
        }
      } catch (error) {
        console.error("Failed to load theme settings:", error);
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถโหลดการตั้งค่าธีมได้",
          variant: "destructive",
        });
      }
    };

    const fetchBrandSettings = async () => {
      try {
        const response = await apiRequest("GET", "/api/admin/settings/brand");
        if (response.ok) {
          const data = await response.json();
          
          // ตรวจสอบและเติมข้อมูลที่ขาด (กรณี fonts ไม่มีในข้อมูลที่ได้จาก API)
          const defaultFonts = {
            family: "'Sukhumvit Set', 'Noto Sans Thai', sans-serif",
            size: {
              base: 16,
              h1: 32,
              h2: 24,
              h3: 20, 
              small: 14
            },
            color: {
              primary: "#1a2942",
              secondary: "#4b5563",
              muted: "#6b7280"
            },
            weight: {
              normal: 400,
              medium: 500,
              bold: 700
            }
          };
          
          // ถ้าไม่มี fonts ให้ใช้ค่าเริ่มต้น
          if (!data.fonts) {
            data.fonts = defaultFonts;
          }
          
          // ถ้าไม่มี colors ให้ใช้ค่าเริ่มต้น
          if (!data.colors) {
            data.colors = {
              // สีของส่วนบน (Header)
              headerBackground: "#5d4a4a",
              headerText: "#ffffff",
              
              // สีของปุ่มหลัก
              primaryButtonBackground: "#ffd008",
              primaryButtonText: "#000000",
              
              // สีของปุ่มรอง
              secondaryButtonBackground: "#e0e0e0",
              secondaryButtonText: "#333333",
              
              // สีของ Bottom Navigation
              bottomNavigationBackground: "#ffffff",
              bottomNavigationText: "#9ca3af",
              bottomNavigationActiveText: "#5d4a4a",
              bottomNavigationActiveIcon: "#5d4a4a",
              bottomNavigationBorder: "#e5e7eb",
              
              // สีของการ์ด
              cardBackground: "#ffffff",
              cardBorder: "#e5e7eb",
              cardHeaderBackground: "#f9fafb",
              cardTitle: "#1a2942",
              
              // สีของสถานะต่างๆ
              successColor: "#10b981",
              warningColor: "#f59e0b",
              errorColor: "#ef4444",
              infoColor: "#3b82f6",
            };
          }

          // ถ้าไม่มี withdrawalPage ให้ใช้ค่าเริ่มต้น
          if (!data.withdrawalPage) {
            data.withdrawalPage = {
              balanceCardBgFrom: "#10b981",
              balanceCardBgTo: "#059669",
              balanceCardTextColor: "#ffffff",
              tabActiveColor: "#10b981",
              tabTextColor: "#4b5563",
              bankFormHeaderBgFrom: "#e6f7f7",
              bankFormHeaderBgTo: "#e6f0ff",
              withdrawFormHeaderBgFrom: "#e6f7f7",
              withdrawFormHeaderBgTo: "#e6f0ff",
              bankButtonBgFrom: "#3b82f6",
              bankButtonBgTo: "#2563eb",
              bankButtonTextColor: "#ffffff",
              withdrawButtonBgFrom: "#10b981",
              withdrawButtonBgTo: "#059669",
              withdrawButtonTextColor: "#ffffff"
            };
          }
          
          setBrandSettings(data);
          console.log("Brand settings loaded:", data);
        }
      } catch (error) {
        console.error("Failed to load brand settings:", error);
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถโหลดการตั้งค่าแบรนด์ได้",
          variant: "destructive",
        });
      }
    };

    fetchThemeSettings();
    fetchBrandSettings();
  }, [toast]);

  // บันทึกการตั้งค่าธีม
  const saveThemeSettings = async () => {
    setIsSaving(true);
    try {
      const response = await apiRequest("POST", "/api/admin/settings/theme", themeSettings);
      
      if (response.ok) {
        toast({
          title: "บันทึกการตั้งค่าธีมสำเร็จ",
          description: "การเปลี่ยนแปลงจะมีผลทันที",
          variant: "default",
        });
        
        // รีโหลดหน้าเว็บเพื่อให้การเปลี่ยนแปลงมีผล
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        throw new Error("Failed to save theme settings");
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกการตั้งค่าธีมได้",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // บันทึกการตั้งค่าแบรนด์
  const saveBrandSettings = async () => {
    setIsSaving(true);
    try {
      const response = await apiRequest("POST", "/api/admin/settings/brand", brandSettings);
      
      if (response.ok) {
        toast({
          title: "บันทึกการตั้งค่าแบรนด์สำเร็จ",
          description: "การเปลี่ยนแปลงจะมีผลทันที",
          variant: "default",
        });
        
        // รีโหลดหน้าเว็บเพื่อให้การเปลี่ยนแปลงมีผล
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        throw new Error("Failed to save brand settings");
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกการตั้งค่าแบรนด์ได้",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // แปลงค่าสี HSL เป็น RGB สำหรับการแสดงผล
  const parseHslToRgb = (hslColor: string) => {
    // แปลงค่าสี HSL เป็น RGB (simplified)
    return hslColor;
  };

  // บันทึกทั้งหมด
  const saveAllSettings = async () => {
    await saveThemeSettings();
    await saveBrandSettings();
  };

  if (!user?.isAdmin) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card>
          <CardHeader>
            <CardTitle>ไม่มีสิทธิ์เข้าถึง</CardTitle>
            <CardDescription>คุณไม่มีสิทธิ์ในการเข้าถึงหน้านี้</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">ตั้งค่าระบบ</h1>
          <p className="text-muted-foreground">ปรับแต่งการแสดงผลและการตั้งค่าของเว็บไซต์</p>
        </div>
        <Button onClick={saveAllSettings} className="gap-2" disabled={isSaving}>
          {isSaving ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          บันทึกการตั้งค่าทั้งหมด
        </Button>
      </div>

      <Tabs defaultValue="theme">
        <TabsList className="grid grid-cols-6 mb-6">
          <TabsTrigger value="theme" className="gap-2">
            <Palette className="h-4 w-4" />
            ธีมและรูปแบบ
          </TabsTrigger>
          <TabsTrigger value="colors" className="gap-2">
            <Square className="h-4 w-4" />
            ตั้งค่าสี
          </TabsTrigger>
          <TabsTrigger value="brand" className="gap-2">
            <Settings className="h-4 w-4" />
            แบรนด์และข้อความ
          </TabsTrigger>
          <TabsTrigger value="home" className="gap-2">
            <Layout className="h-4 w-4" />
            หน้าแรก
          </TabsTrigger>
          <TabsTrigger value="loan" className="gap-2">
            <DollarSign className="h-4 w-4" />
            หน้ายื่นกู้
          </TabsTrigger>
          <TabsTrigger value="withdrawal" className="gap-2">
            <Banknote className="h-4 w-4" />
            หน้าถอนเงิน
          </TabsTrigger>
        </TabsList>

        {/* แท็บตั้งค่าสี */}
        <TabsContent value="colors" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ส่วนบน (Header) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PanelLeftClose className="h-5 w-5" />
                  สีส่วนบน (Header)
                </CardTitle>
                <CardDescription>
                  ปรับแต่งสีพื้นหลังและข้อความในส่วนหัวของแอป
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="header-bg-color">สีพื้นหลังส่วนบน</Label>
                    <div className="flex gap-2 mt-1">
                      <div className="flex-1">
                        <Input
                          id="header-bg-color"
                          value={brandSettings.colors?.headerBackground || "#5d4a4a"}
                          onChange={(e) => setBrandSettings({
                            ...brandSettings,
                            colors: {
                              ...brandSettings.colors!,
                              headerBackground: e.target.value
                            }
                          })}
                        />
                      </div>
                      <div 
                        className="h-9 w-9 rounded-md border cursor-pointer"
                        style={{ background: brandSettings.colors?.headerBackground || "#5d4a4a" }}
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'color';
                          input.value = brandSettings.colors?.headerBackground || "#5d4a4a";
                          input.addEventListener('input', (e) => {
                            const target = e.target as HTMLInputElement;
                            setBrandSettings({
                              ...brandSettings,
                              colors: {
                                ...brandSettings.colors!,
                                headerBackground: target.value
                              }
                            });
                          });
                          input.click();
                        }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="header-text-color">สีข้อความส่วนบน</Label>
                    <div className="flex gap-2 mt-1">
                      <div className="flex-1">
                        <Input
                          id="header-text-color"
                          value={brandSettings.colors?.headerText || "#ffffff"}
                          onChange={(e) => setBrandSettings({
                            ...brandSettings,
                            colors: {
                              ...brandSettings.colors!,
                              headerText: e.target.value
                            }
                          })}
                        />
                      </div>
                      <div 
                        className="h-9 w-9 rounded-md border cursor-pointer"
                        style={{ background: brandSettings.colors?.headerText || "#ffffff" }}
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'color';
                          input.value = brandSettings.colors?.headerText || "#ffffff";
                          input.addEventListener('input', (e) => {
                            const target = e.target as HTMLInputElement;
                            setBrandSettings({
                              ...brandSettings,
                              colors: {
                                ...brandSettings.colors!,
                                headerText: target.value
                              }
                            });
                          });
                          input.click();
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg mt-2" style={{ 
                    background: brandSettings.colors?.headerBackground || "#5d4a4a",
                    color: brandSettings.colors?.headerText || "#ffffff" 
                  }}>
                    <p className="font-medium text-center">ตัวอย่างส่วนบน</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* สีปุ่ม */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Square className="h-5 w-5" />
                  สีปุ่มและองค์ประกอบ
                </CardTitle>
                <CardDescription>
                  ปรับแต่งสีปุ่มหลัก ปุ่มรอง และข้อความบนปุ่ม
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="primary-btn-bg">สีพื้นหลังปุ่มหลัก</Label>
                    <div className="flex gap-2 mt-1">
                      <div className="flex-1">
                        <Input
                          id="primary-btn-bg"
                          value={brandSettings.colors?.primaryButtonBackground || "#ffd008"}
                          onChange={(e) => setBrandSettings({
                            ...brandSettings,
                            colors: {
                              ...brandSettings.colors!,
                              primaryButtonBackground: e.target.value
                            }
                          })}
                        />
                      </div>
                      <div 
                        className="h-9 w-9 rounded-md border cursor-pointer"
                        style={{ background: brandSettings.colors?.primaryButtonBackground || "#ffd008" }}
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'color';
                          input.value = brandSettings.colors?.primaryButtonBackground || "#ffd008";
                          input.addEventListener('input', (e) => {
                            const target = e.target as HTMLInputElement;
                            setBrandSettings({
                              ...brandSettings,
                              colors: {
                                ...brandSettings.colors!,
                                primaryButtonBackground: target.value
                              }
                            });
                          });
                          input.click();
                        }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="primary-btn-text">สีข้อความปุ่มหลัก</Label>
                    <div className="flex gap-2 mt-1">
                      <div className="flex-1">
                        <Input
                          id="primary-btn-text"
                          value={brandSettings.colors?.primaryButtonText || "#000000"}
                          onChange={(e) => setBrandSettings({
                            ...brandSettings,
                            colors: {
                              ...brandSettings.colors!,
                              primaryButtonText: e.target.value
                            }
                          })}
                        />
                      </div>
                      <div 
                        className="h-9 w-9 rounded-md border cursor-pointer"
                        style={{ background: brandSettings.colors?.primaryButtonText || "#000000" }}
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'color';
                          input.value = brandSettings.colors?.primaryButtonText || "#000000";
                          input.addEventListener('input', (e) => {
                            const target = e.target as HTMLInputElement;
                            setBrandSettings({
                              ...brandSettings,
                              colors: {
                                ...brandSettings.colors!,
                                primaryButtonText: target.value
                              }
                            });
                          });
                          input.click();
                        }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="secondary-btn-bg">สีพื้นหลังปุ่มรอง</Label>
                    <div className="flex gap-2 mt-1">
                      <div className="flex-1">
                        <Input
                          id="secondary-btn-bg"
                          value={brandSettings.colors?.secondaryButtonBackground || "#e0e0e0"}
                          onChange={(e) => setBrandSettings({
                            ...brandSettings,
                            colors: {
                              ...brandSettings.colors!,
                              secondaryButtonBackground: e.target.value
                            }
                          })}
                        />
                      </div>
                      <div 
                        className="h-9 w-9 rounded-md border cursor-pointer"
                        style={{ background: brandSettings.colors?.secondaryButtonBackground || "#e0e0e0" }}
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'color';
                          input.value = brandSettings.colors?.secondaryButtonBackground || "#e0e0e0";
                          input.addEventListener('input', (e) => {
                            const target = e.target as HTMLInputElement;
                            setBrandSettings({
                              ...brandSettings,
                              colors: {
                                ...brandSettings.colors!,
                                secondaryButtonBackground: target.value
                              }
                            });
                          });
                          input.click();
                        }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="secondary-btn-text">สีข้อความปุ่มรอง</Label>
                    <div className="flex gap-2 mt-1">
                      <div className="flex-1">
                        <Input
                          id="secondary-btn-text"
                          value={brandSettings.colors?.secondaryButtonText || "#333333"}
                          onChange={(e) => setBrandSettings({
                            ...brandSettings,
                            colors: {
                              ...brandSettings.colors!,
                              secondaryButtonText: e.target.value
                            }
                          })}
                        />
                      </div>
                      <div 
                        className="h-9 w-9 rounded-md border cursor-pointer"
                        style={{ background: brandSettings.colors?.secondaryButtonText || "#333333" }}
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'color';
                          input.value = brandSettings.colors?.secondaryButtonText || "#333333";
                          input.addEventListener('input', (e) => {
                            const target = e.target as HTMLInputElement;
                            setBrandSettings({
                              ...brandSettings,
                              colors: {
                                ...brandSettings.colors!,
                                secondaryButtonText: target.value
                              }
                            });
                          });
                          input.click();
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div className="p-3 rounded-lg text-center" style={{ 
                      background: brandSettings.colors?.primaryButtonBackground || "#ffd008",
                      color: brandSettings.colors?.primaryButtonText || "#000000" 
                    }}>
                      ปุ่มหลัก
                    </div>
                    <div className="p-3 rounded-lg text-center" style={{ 
                      background: brandSettings.colors?.secondaryButtonBackground || "#e0e0e0",
                      color: brandSettings.colors?.secondaryButtonText || "#333333" 
                    }}>
                      ปุ่มรอง
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* แถบนำทางด้านล่าง */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SquareStack className="h-5 w-5" />
                  แถบนำทางด้านล่าง
                </CardTitle>
                <CardDescription>
                  ปรับแต่งสีพื้นหลัง, ข้อความ, ไอคอนของแถบนำทางด้านล่าง
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="bottom-nav-bg">สีพื้นหลังแถบด้านล่าง</Label>
                    <div className="flex gap-2 mt-1">
                      <div className="flex-1">
                        <Input
                          id="bottom-nav-bg"
                          value={brandSettings.colors?.bottomNavigationBackground || "#ffffff"}
                          onChange={(e) => setBrandSettings({
                            ...brandSettings,
                            colors: {
                              ...brandSettings.colors!,
                              bottomNavigationBackground: e.target.value
                            }
                          })}
                        />
                      </div>
                      <div 
                        className="h-9 w-9 rounded-md border cursor-pointer"
                        style={{ background: brandSettings.colors?.bottomNavigationBackground || "#ffffff" }}
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'color';
                          input.value = brandSettings.colors?.bottomNavigationBackground || "#ffffff";
                          input.addEventListener('input', (e) => {
                            const target = e.target as HTMLInputElement;
                            setBrandSettings({
                              ...brandSettings,
                              colors: {
                                ...brandSettings.colors!,
                                bottomNavigationBackground: target.value
                              }
                            });
                          });
                          input.click();
                        }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="bottom-nav-text">สีข้อความแถบด้านล่าง</Label>
                    <div className="flex gap-2 mt-1">
                      <div className="flex-1">
                        <Input
                          id="bottom-nav-text"
                          value={brandSettings.colors?.bottomNavigationText || "#9ca3af"}
                          onChange={(e) => setBrandSettings({
                            ...brandSettings,
                            colors: {
                              ...brandSettings.colors!,
                              bottomNavigationText: e.target.value
                            }
                          })}
                        />
                      </div>
                      <div 
                        className="h-9 w-9 rounded-md border cursor-pointer"
                        style={{ background: brandSettings.colors?.bottomNavigationText || "#9ca3af" }}
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'color';
                          input.value = brandSettings.colors?.bottomNavigationText || "#9ca3af";
                          input.addEventListener('input', (e) => {
                            const target = e.target as HTMLInputElement;
                            setBrandSettings({
                              ...brandSettings,
                              colors: {
                                ...brandSettings.colors!,
                                bottomNavigationText: target.value
                              }
                            });
                          });
                          input.click();
                        }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="bottom-nav-active-text">สีข้อความแถบที่เลือก</Label>
                    <div className="flex gap-2 mt-1">
                      <div className="flex-1">
                        <Input
                          id="bottom-nav-active-text"
                          value={brandSettings.colors?.bottomNavigationActiveText || "#5d4a4a"}
                          onChange={(e) => setBrandSettings({
                            ...brandSettings,
                            colors: {
                              ...brandSettings.colors!,
                              bottomNavigationActiveText: e.target.value
                            }
                          })}
                        />
                      </div>
                      <div 
                        className="h-9 w-9 rounded-md border cursor-pointer"
                        style={{ background: brandSettings.colors?.bottomNavigationActiveText || "#5d4a4a" }}
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'color';
                          input.value = brandSettings.colors?.bottomNavigationActiveText || "#5d4a4a";
                          input.addEventListener('input', (e) => {
                            const target = e.target as HTMLInputElement;
                            setBrandSettings({
                              ...brandSettings,
                              colors: {
                                ...brandSettings.colors!,
                                bottomNavigationActiveText: target.value
                              }
                            });
                          });
                          input.click();
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="p-3 rounded-md shadow border mt-2" style={{ background: brandSettings.colors?.bottomNavigationBackground || "#ffffff" }}>
                    <div className="flex justify-around items-center">
                      <div className="flex flex-col items-center">
                        <div className="h-5 w-5 mb-1" style={{ background: brandSettings.colors?.bottomNavigationText || "#9ca3af" }}></div>
                        <span style={{ color: brandSettings.colors?.bottomNavigationText || "#9ca3af" }}>หน้าแรก</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="h-5 w-5 mb-1" style={{ background: brandSettings.colors?.bottomNavigationText || "#9ca3af" }}></div>
                        <span style={{ color: brandSettings.colors?.bottomNavigationText || "#9ca3af" }}>เงินกู้</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="h-5 w-5 mb-1" style={{ background: brandSettings.colors?.bottomNavigationActiveIcon || "#5d4a4a" }}></div>
                        <span style={{ color: brandSettings.colors?.bottomNavigationActiveText || "#5d4a4a" }}>โปรไฟล์</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="h-5 w-5 mb-1" style={{ background: brandSettings.colors?.bottomNavigationText || "#9ca3af" }}></div>
                        <span style={{ color: brandSettings.colors?.bottomNavigationText || "#9ca3af" }}>แชท</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* สีการ์ด */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SquareStack className="h-5 w-5" />
                  สีการ์ดและองค์ประกอบอื่นๆ
                </CardTitle>
                <CardDescription>
                  ปรับแต่งสีการ์ด, หัวข้อ, และสีองค์ประกอบอื่นๆ
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="card-bg">สีพื้นหลังการ์ด</Label>
                    <div className="flex gap-2 mt-1">
                      <div className="flex-1">
                        <Input
                          id="card-bg"
                          value={brandSettings.colors?.cardBackground || "#ffffff"}
                          onChange={(e) => setBrandSettings({
                            ...brandSettings,
                            colors: {
                              ...brandSettings.colors!,
                              cardBackground: e.target.value
                            }
                          })}
                        />
                      </div>
                      <div 
                        className="h-9 w-9 rounded-md border cursor-pointer"
                        style={{ background: brandSettings.colors?.cardBackground || "#ffffff" }}
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'color';
                          input.value = brandSettings.colors?.cardBackground || "#ffffff";
                          input.addEventListener('input', (e) => {
                            const target = e.target as HTMLInputElement;
                            setBrandSettings({
                              ...brandSettings,
                              colors: {
                                ...brandSettings.colors!,
                                cardBackground: target.value
                              }
                            });
                          });
                          input.click();
                        }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="card-header-bg">สีพื้นหลังส่วนหัวการ์ด</Label>
                    <div className="flex gap-2 mt-1">
                      <div className="flex-1">
                        <Input
                          id="card-header-bg"
                          value={brandSettings.colors?.cardHeaderBackground || "#f9fafb"}
                          onChange={(e) => setBrandSettings({
                            ...brandSettings,
                            colors: {
                              ...brandSettings.colors!,
                              cardHeaderBackground: e.target.value
                            }
                          })}
                        />
                      </div>
                      <div 
                        className="h-9 w-9 rounded-md border cursor-pointer"
                        style={{ background: brandSettings.colors?.cardHeaderBackground || "#f9fafb" }}
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'color';
                          input.value = brandSettings.colors?.cardHeaderBackground || "#f9fafb";
                          input.addEventListener('input', (e) => {
                            const target = e.target as HTMLInputElement;
                            setBrandSettings({
                              ...brandSettings,
                              colors: {
                                ...brandSettings.colors!,
                                cardHeaderBackground: target.value
                              }
                            });
                          });
                          input.click();
                        }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="card-title">สีหัวข้อการ์ด</Label>
                    <div className="flex gap-2 mt-1">
                      <div className="flex-1">
                        <Input
                          id="card-title"
                          value={brandSettings.colors?.cardTitle || "#1a2942"}
                          onChange={(e) => setBrandSettings({
                            ...brandSettings,
                            colors: {
                              ...brandSettings.colors!,
                              cardTitle: e.target.value
                            }
                          })}
                        />
                      </div>
                      <div 
                        className="h-9 w-9 rounded-md border cursor-pointer"
                        style={{ background: brandSettings.colors?.cardTitle || "#1a2942" }}
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'color';
                          input.value = brandSettings.colors?.cardTitle || "#1a2942";
                          input.addEventListener('input', (e) => {
                            const target = e.target as HTMLInputElement;
                            setBrandSettings({
                              ...brandSettings,
                              colors: {
                                ...brandSettings.colors!,
                                cardTitle: target.value
                              }
                            });
                          });
                          input.click();
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded-lg border shadow-sm mt-2">
                    <div className="p-2 mb-2 rounded-t-md" style={{ background: brandSettings.colors?.cardHeaderBackground || "#f9fafb" }}>
                      <p className="font-medium" style={{ color: brandSettings.colors?.cardTitle || "#1a2942" }}>ตัวอย่างหัวข้อการ์ด</p>
                    </div>
                    <div className="p-2" style={{ background: brandSettings.colors?.cardBackground || "#ffffff" }}>
                      <p>เนื้อหาตัวอย่างของการ์ด</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* แท็บตั้งค่าธีมและรูปแบบ */}
        <TabsContent value="theme" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* การ์ดเลือกสีหลัก */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  สีหลัก
                </CardTitle>
                <CardDescription>
                  เลือกสีหลักสำหรับปุ่มและองค์ประกอบที่สำคัญในเว็บไซต์
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <HexColorPicker
                    color={themeSettings.primary}
                    onChange={(color) => setThemeSettings({ ...themeSettings, primary: color })}
                    className="w-full"
                  />
                  <div className="mt-4">
                    <Label htmlFor="primary-color">ค่าสี (HSL หรือ HEX)</Label>
                    <Input
                      id="primary-color"
                      value={themeSettings.primary}
                      onChange={(e) => setThemeSettings({ ...themeSettings, primary: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex gap-2 mt-4">
                    <div 
                      className="w-full h-12 rounded-md border" 
                      style={{ background: themeSettings.primary }}
                    ></div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setThemeSettings({ ...themeSettings, primary: "hsl(179, 75%, 37%)" })}
                >
                  รีเซ็ตเป็นค่าเริ่มต้น
                </Button>
              </CardFooter>
            </Card>

            {/* การ์ดตั้งค่ารูปแบบธีม */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sliders className="h-5 w-5" />
                  รูปแบบธีม
                </CardTitle>
                <CardDescription>
                  ปรับแต่งรูปแบบการแสดงผลทั่วทั้งเว็บไซต์
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="variant">รูปแบบสี</Label>
                  <Select
                    value={themeSettings.variant}
                    onValueChange={(value: "professional" | "tint" | "vibrant") => setThemeSettings({ ...themeSettings, variant: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกรูปแบบสี" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">มืออาชีพ</SelectItem>
                      <SelectItem value="tint">นุ่มนวล</SelectItem>
                      <SelectItem value="vibrant">สดใส</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="appearance">โหมดธีม</Label>
                  <Select
                    value={themeSettings.appearance}
                    onValueChange={(value: "light" | "dark" | "system") => setThemeSettings({ ...themeSettings, appearance: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกโหมดธีม" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">สว่าง</SelectItem>
                      <SelectItem value="dark">มืด</SelectItem>
                      <SelectItem value="system">ตามระบบ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="radius">ความโค้งมน ({themeSettings.radius})</Label>
                  </div>
                  <Slider
                    id="radius"
                    min={0}
                    max={2}
                    step={0.1}
                    value={[themeSettings.radius]}
                    onValueChange={(value) => setThemeSettings({ ...themeSettings, radius: value[0] })}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <div>เหลี่ยม</div>
                    <div>มน</div>
                  </div>

                  <div className="flex gap-2 mt-6">
                    <div className="w-full h-12 bg-primary rounded-sm flex items-center justify-center text-white text-sm">
                      เหลี่ยม
                    </div>
                    <div 
                      className="w-full h-12 bg-primary flex items-center justify-center text-white text-sm"
                      style={{ borderRadius: `${themeSettings.radius * 8}px` }}
                    >
                      ตัวอย่าง
                    </div>
                    <div className="w-full h-12 bg-primary rounded-full flex items-center justify-center text-white text-sm">
                      กลม
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={saveThemeSettings} className="w-full gap-2" disabled={isSaving}>
                  {isSaving ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  บันทึกการตั้งค่าธีม
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* ตัวอย่างองค์ประกอบ UI */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layout className="h-5 w-5" />
                ตัวอย่างองค์ประกอบ UI
              </CardTitle>
              <CardDescription>
                ดูตัวอย่างองค์ประกอบ UI ที่จะแสดงในเว็บไซต์ตามการตั้งค่าที่เลือก
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">ปุ่ม</h4>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="default">ปุ่มหลัก</Button>
                    <Button variant="secondary">ปุ่มรอง</Button>
                    <Button variant="outline">ปุ่มเส้นขอบ</Button>
                    <Button variant="ghost">ปุ่มโปร่งใส</Button>
                    <Button variant="destructive">ปุ่มลบ</Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-medium">ฟอร์ม</h4>
                  <div className="space-y-2">
                    <Label htmlFor="example-input">ช่องป้อนข้อมูล</Label>
                    <Input id="example-input" placeholder="ตัวอย่างข้อมูล" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="example-switch" />
                    <Label htmlFor="example-switch">สวิตช์ตัวอย่าง</Label>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-sm font-medium mb-2">การ์ด</h4>
                <Card className="w-full">
                  <CardHeader>
                    <CardTitle>หัวข้อการ์ดตัวอย่าง</CardTitle>
                    <CardDescription>คำอธิบายการ์ดตัวอย่าง</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>เนื้อหาการ์ดตัวอย่าง</p>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline">ยกเลิก</Button>
                    <Button className="ml-2">ตกลง</Button>
                  </CardFooter>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* แท็บตั้งค่าแบรนด์และข้อความ */}
        <TabsContent value="brand" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ข้อมูลแบรนด์ */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  ข้อมูลแบรนด์
                </CardTitle>
                <CardDescription>
                  ตั้งค่าข้อมูลแบรนด์และข้อความที่แสดงบนเว็บไซต์
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="site-name">ชื่อเว็บไซต์</Label>
                  <Input
                    id="site-name"
                    value={brandSettings.siteName}
                    onChange={(e) => setBrandSettings({ ...brandSettings, siteName: e.target.value })}
                    placeholder="ชื่อเว็บไซต์"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logo-url">URL โลโก้ (ถ้ามี)</Label>
                  <Input
                    id="logo-url"
                    value={brandSettings.logoUrl}
                    onChange={(e) => setBrandSettings({ ...brandSettings, logoUrl: e.target.value })}
                    placeholder="https://example.com/logo.png"
                  />
                  {brandSettings.logoUrl && (
                    <div className="mt-2 p-2 border rounded-md">
                      <p className="text-sm text-muted-foreground mb-2">ตัวอย่างโลโก้:</p>
                      <img
                        src={brandSettings.logoUrl}
                        alt="Logo preview"
                        className="max-h-20 max-w-full"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "https://placehold.co/200x80?text=Logo+Error";
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="site-description">คำอธิบายเว็บไซต์</Label>
                  <Input
                    id="site-description"
                    value={brandSettings.siteDescription}
                    onChange={(e) => setBrandSettings({ ...brandSettings, siteDescription: e.target.value })}
                    placeholder="คำอธิบายสั้นๆ เกี่ยวกับเว็บไซต์"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="footer-text">ข้อความส่วนท้าย</Label>
                  <Input
                    id="footer-text"
                    value={brandSettings.footerText}
                    onChange={(e) => setBrandSettings({ ...brandSettings, footerText: e.target.value })}
                    placeholder="ข้อความส่วนท้ายเว็บไซต์"
                  />
                </div>
                
                {/* หน้าเข้าสู่ระบบ */}
                <div className="mt-8 pt-6 border-t">
                  <h3 className="text-lg font-medium mb-4">ตั้งค่าหน้าเข้าสู่ระบบ</h3>
                  
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="login-logo-icon">URL ไอคอนบัตร</Label>
                      <Input
                        id="login-logo-icon"
                        value={brandSettings.login.logoIcon}
                        onChange={(e) => setBrandSettings({
                          ...brandSettings,
                          login: {
                            ...brandSettings.login,
                            logoIcon: e.target.value
                          }
                        })}
                        placeholder="URL ไอคอนที่แสดงในหน้าเข้าสู่ระบบ"
                      />
                      {brandSettings.login.logoIcon && (
                        <div className="mt-2 p-2 border rounded-md">
                          <p className="text-sm text-muted-foreground mb-2">ตัวอย่างไอคอน:</p>
                          <div className="flex justify-center">
                            <img
                              src={brandSettings.login.logoIcon}
                              alt="Login icon preview"
                              className="max-h-16 max-w-16"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "https://placehold.co/64x64?text=Icon+Error";
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="login-main-title">ชื่อหลักในหน้าเข้าสู่ระบบ</Label>
                      <Input
                        id="login-main-title"
                        value={brandSettings.login.mainTitle}
                        onChange={(e) => setBrandSettings({
                          ...brandSettings,
                          login: {
                            ...brandSettings.login,
                            mainTitle: e.target.value
                          }
                        })}
                        placeholder="ชื่อหลักที่แสดงในหน้าเข้าสู่ระบบ"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="login-sub-title">ข้อความอธิบายในหน้าเข้าสู่ระบบ</Label>
                      <Input
                        id="login-sub-title"
                        value={brandSettings.login.subTitle}
                        onChange={(e) => setBrandSettings({
                          ...brandSettings,
                          login: {
                            ...brandSettings.login,
                            subTitle: e.target.value
                          }
                        })}
                        placeholder="ข้อความอธิบายที่แสดงในหน้าเข้าสู่ระบบ"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="login-header-text">ข้อความด้านบนหน้าเข้าสู่ระบบ</Label>
                      <Input
                        id="login-header-text"
                        value={brandSettings.login.headerText}
                        onChange={(e) => setBrandSettings({
                          ...brandSettings,
                          login: {
                            ...brandSettings.login,
                            headerText: e.target.value
                          }
                        })}
                        placeholder="เช่น 'เข้าสู่ระบบ'"
                      />
                    </div>

                    <div className="space-y-4">
                      <Label htmlFor="login-background-color">สีพื้นหลังหน้าเข้าสู่ระบบ</Label>
                      <HexColorPicker
                        color={brandSettings.login.backgroundColor}
                        onChange={(color) => setBrandSettings({
                          ...brandSettings,
                          login: {
                            ...brandSettings.login,
                            backgroundColor: color
                          }
                        })}
                        className="w-full"
                      />
                      <div className="mt-4">
                        <Input
                          id="login-background-color"
                          value={brandSettings.login.backgroundColor}
                          onChange={(e) => setBrandSettings({
                            ...brandSettings,
                            login: {
                              ...brandSettings.login,
                              backgroundColor: e.target.value
                            }
                          })}
                          className="mt-1"
                        />
                      </div>
                      <div className="flex gap-2 mt-4">
                        <div 
                          className="w-full h-12 rounded-md border" 
                          style={{ background: brandSettings.login.backgroundColor }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <Label htmlFor="login-button-color">สีปุ่มเข้าสู่ระบบ</Label>
                      <HexColorPicker
                        color={brandSettings.login.buttonColor}
                        onChange={(color) => setBrandSettings({
                          ...brandSettings,
                          login: {
                            ...brandSettings.login,
                            buttonColor: color
                          }
                        })}
                        className="w-full"
                      />
                      <div className="mt-4">
                        <Input
                          id="login-button-color"
                          value={brandSettings.login.buttonColor}
                          onChange={(e) => setBrandSettings({
                            ...brandSettings,
                            login: {
                              ...brandSettings.login,
                              buttonColor: e.target.value
                            }
                          })}
                          className="mt-1"
                        />
                      </div>
                      <div className="flex gap-2 mt-4">
                        <div 
                          className="w-full h-12 rounded-md border flex items-center justify-center" 
                          style={{ background: brandSettings.login.buttonColor, color: brandSettings.login.buttonTextColor }}
                        >
                          เข้าสู่ระบบ
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <Label htmlFor="login-button-text-color">สีข้อความปุ่มเข้าสู่ระบบ</Label>
                      <HexColorPicker
                        color={brandSettings.login.buttonTextColor}
                        onChange={(color) => setBrandSettings({
                          ...brandSettings,
                          login: {
                            ...brandSettings.login,
                            buttonTextColor: color
                          }
                        })}
                        className="w-full"
                      />
                      <div className="mt-4">
                        <Input
                          id="login-button-text-color"
                          value={brandSettings.login.buttonTextColor}
                          onChange={(e) => setBrandSettings({
                            ...brandSettings,
                            login: {
                              ...brandSettings.login,
                              buttonTextColor: e.target.value
                            }
                          })}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    
                    {/* ตัวอย่างหน้าล็อกอิน */}
                    <div className="mt-6 p-4 border rounded-md">
                      <h4 className="text-sm font-medium mb-4">ตัวอย่างหน้าเข้าสู่ระบบ</h4>
                      <div className="w-full aspect-[9/16] max-w-[280px] mx-auto rounded-md overflow-hidden shadow-md" 
                          style={{ background: brandSettings.login.backgroundColor }}>
                        <div className="flex flex-col h-full items-center justify-center p-6 text-white">
                          {brandSettings.login.logoIcon ? (
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-8">
                              <img 
                                src={brandSettings.login.logoIcon} 
                                alt="Login logo" 
                                className="w-8 h-8"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = "https://placehold.co/32x32?text=Icon";
                                }}
                              />
                            </div>
                          ) : (
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-8">
                              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="3" y="5" width="18" height="14" rx="2" stroke="white" strokeWidth="2" />
                                <path d="M3 10H21" stroke="white" strokeWidth="2" />
                              </svg>
                            </div>
                          )}
                          
                          <h2 className="text-xl font-bold mb-2">{brandSettings.login.headerText || "เข้าสู่ระบบ"}</h2>
                          <h3 className="text-lg font-bold mb-2">{brandSettings.login.mainTitle || "CashLuxe"}</h3>
                          <p className="text-center text-sm text-white/80">{brandSettings.login.subTitle || "สินเชื่อส่วนบุคคล ทางเลือกทางการเงินที่เชื่อถือได้"}</p>
                          
                          <div className="mt-8 w-full">
                            <div className="w-full p-3 rounded-md flex items-center justify-center"
                                style={{ background: brandSettings.login.buttonColor, color: brandSettings.login.buttonTextColor }}>
                              <span className="text-sm font-medium">เข้าสู่ระบบ</span>
                            </div>
                          </div>
                          
                          <div className="mt-auto">
                            <div className="w-8 h-8 border border-white/50 rounded-full flex items-center justify-center">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M6 9L12 15L18 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={saveBrandSettings} className="w-full gap-2" disabled={isSaving}>
                  {isSaving ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  บันทึกการตั้งค่าแบรนด์
                </Button>
              </CardFooter>
            </Card>

            {/* การตั้งค่าฟอนต์ */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TextCursor className="h-5 w-5" />
                  การตั้งค่าตัวอักษร (ฟอนต์)
                </CardTitle>
                <CardDescription>
                  ปรับแต่งรูปแบบ สี และขนาดของฟอนต์ทั่วทั้งเว็บไซต์
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-base font-medium">ครอบครัวฟอนต์</h3>
                  <div className="space-y-2">
                    <Label htmlFor="font-family">ครอบครัวฟอนต์หลัก</Label>
                    <Input
                      id="font-family"
                      value={brandSettings.fonts.family}
                      onChange={(e) => setBrandSettings({
                        ...brandSettings,
                        fonts: {
                          ...brandSettings.fonts,
                          family: e.target.value
                        }
                      })}
                      placeholder="'Sukhumvit Set', 'Noto Sans Thai', sans-serif"
                    />
                    <p className="text-xs text-muted-foreground">ระบุชื่อฟอนต์หลายชื่อและคั่นด้วยเครื่องหมายคอมม่า</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-base font-medium">ขนาดฟอนต์</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label htmlFor="base-font-size">ขนาดพื้นฐาน ({brandSettings.fonts.size.base}px)</Label>
                      </div>
                      <Slider
                        id="base-font-size"
                        min={12}
                        max={20}
                        step={1}
                        value={[brandSettings.fonts.size.base]}
                        onValueChange={(value) => setBrandSettings({
                          ...brandSettings,
                          fonts: {
                            ...brandSettings.fonts,
                            size: {
                              ...brandSettings.fonts.size,
                              base: value[0]
                            }
                          }
                        })}
                      />
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label htmlFor="h1-font-size">ขนาดหัวข้อใหญ่ (H1) ({brandSettings.fonts.size.h1}px)</Label>
                      </div>
                      <Slider
                        id="h1-font-size"
                        min={24}
                        max={48}
                        step={1}
                        value={[brandSettings.fonts.size.h1]}
                        onValueChange={(value) => setBrandSettings({
                          ...brandSettings,
                          fonts: {
                            ...brandSettings.fonts,
                            size: {
                              ...brandSettings.fonts.size,
                              h1: value[0]
                            }
                          }
                        })}
                      />
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label htmlFor="h2-font-size">ขนาดหัวข้อรอง (H2) ({brandSettings.fonts.size.h2}px)</Label>
                      </div>
                      <Slider
                        id="h2-font-size"
                        min={18}
                        max={36}
                        step={1}
                        value={[brandSettings.fonts.size.h2]}
                        onValueChange={(value) => setBrandSettings({
                          ...brandSettings,
                          fonts: {
                            ...brandSettings.fonts,
                            size: {
                              ...brandSettings.fonts.size,
                              h2: value[0]
                            }
                          }
                        })}
                      />
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label htmlFor="h3-font-size">ขนาดหัวข้อย่อย (H3) ({brandSettings.fonts.size.h3}px)</Label>
                      </div>
                      <Slider
                        id="h3-font-size"
                        min={16}
                        max={28}
                        step={1}
                        value={[brandSettings.fonts.size.h3]}
                        onValueChange={(value) => setBrandSettings({
                          ...brandSettings,
                          fonts: {
                            ...brandSettings.fonts,
                            size: {
                              ...brandSettings.fonts.size,
                              h3: value[0]
                            }
                          }
                        })}
                      />
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label htmlFor="small-font-size">ขนาดข้อความเล็ก ({brandSettings.fonts.size.small}px)</Label>
                      </div>
                      <Slider
                        id="small-font-size"
                        min={10}
                        max={16}
                        step={1}
                        value={[brandSettings.fonts.size.small]}
                        onValueChange={(value) => setBrandSettings({
                          ...brandSettings,
                          fonts: {
                            ...brandSettings.fonts,
                            size: {
                              ...brandSettings.fonts.size,
                              small: value[0]
                            }
                          }
                        })}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-base font-medium">สีฟอนต์</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="primary-font-color">สีข้อความหลัก</Label>
                      <HexColorPicker
                        color={brandSettings.fonts.color.primary}
                        onChange={(color) => setBrandSettings({
                          ...brandSettings,
                          fonts: {
                            ...brandSettings.fonts,
                            color: {
                              ...brandSettings.fonts.color,
                              primary: color
                            }
                          }
                        })}
                        className="w-full mt-2"
                      />
                      <Input
                        id="primary-font-color"
                        value={brandSettings.fonts.color.primary}
                        onChange={(e) => setBrandSettings({
                          ...brandSettings,
                          fonts: {
                            ...brandSettings.fonts,
                            color: {
                              ...brandSettings.fonts.color,
                              primary: e.target.value
                            }
                          }
                        })}
                        className="mt-2"
                      />
                      <div 
                        className="w-full h-12 mt-2 rounded-md border flex items-center justify-center px-4" 
                        style={{ color: brandSettings.fonts.color.primary }}
                      >
                        ตัวอย่างข้อความหลัก
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="secondary-font-color">สีข้อความรอง</Label>
                      <HexColorPicker
                        color={brandSettings.fonts.color.secondary}
                        onChange={(color) => setBrandSettings({
                          ...brandSettings,
                          fonts: {
                            ...brandSettings.fonts,
                            color: {
                              ...brandSettings.fonts.color,
                              secondary: color
                            }
                          }
                        })}
                        className="w-full mt-2"
                      />
                      <Input
                        id="secondary-font-color"
                        value={brandSettings.fonts.color.secondary}
                        onChange={(e) => setBrandSettings({
                          ...brandSettings,
                          fonts: {
                            ...brandSettings.fonts,
                            color: {
                              ...brandSettings.fonts.color,
                              secondary: e.target.value
                            }
                          }
                        })}
                        className="mt-2"
                      />
                      <div 
                        className="w-full h-12 mt-2 rounded-md border flex items-center justify-center px-4" 
                        style={{ color: brandSettings.fonts.color.secondary }}
                      >
                        ตัวอย่างข้อความรอง
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="muted-font-color">สีข้อความจาง</Label>
                      <HexColorPicker
                        color={brandSettings.fonts.color.muted}
                        onChange={(color) => setBrandSettings({
                          ...brandSettings,
                          fonts: {
                            ...brandSettings.fonts,
                            color: {
                              ...brandSettings.fonts.color,
                              muted: color
                            }
                          }
                        })}
                        className="w-full mt-2"
                      />
                      <Input
                        id="muted-font-color"
                        value={brandSettings.fonts.color.muted}
                        onChange={(e) => setBrandSettings({
                          ...brandSettings,
                          fonts: {
                            ...brandSettings.fonts,
                            color: {
                              ...brandSettings.fonts.color,
                              muted: e.target.value
                            }
                          }
                        })}
                        className="mt-2"
                      />
                      <div 
                        className="w-full h-12 mt-2 rounded-md border flex items-center justify-center px-4" 
                        style={{ color: brandSettings.fonts.color.muted }}
                      >
                        ตัวอย่างข้อความจาง
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-base font-medium">น้ำหนักฟอนต์</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label htmlFor="normal-font-weight">น้ำหนักปกติ ({brandSettings.fonts.weight.normal})</Label>
                      </div>
                      <Slider
                        id="normal-font-weight"
                        min={300}
                        max={500}
                        step={100}
                        value={[brandSettings.fonts.weight.normal]}
                        onValueChange={(value) => setBrandSettings({
                          ...brandSettings,
                          fonts: {
                            ...brandSettings.fonts,
                            weight: {
                              ...brandSettings.fonts.weight,
                              normal: value[0]
                            }
                          }
                        })}
                      />
                      <div 
                        className="w-full h-12 mt-2 rounded-md border flex items-center justify-center px-4" 
                        style={{ fontWeight: brandSettings.fonts.weight.normal }}
                      >
                        ตัวอย่างน้ำหนักปกติ
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label htmlFor="medium-font-weight">น้ำหนักกลาง ({brandSettings.fonts.weight.medium})</Label>
                      </div>
                      <Slider
                        id="medium-font-weight"
                        min={400}
                        max={600}
                        step={100}
                        value={[brandSettings.fonts.weight.medium]}
                        onValueChange={(value) => setBrandSettings({
                          ...brandSettings,
                          fonts: {
                            ...brandSettings.fonts,
                            weight: {
                              ...brandSettings.fonts.weight,
                              medium: value[0]
                            }
                          }
                        })}
                      />
                      <div 
                        className="w-full h-12 mt-2 rounded-md border flex items-center justify-center px-4" 
                        style={{ fontWeight: brandSettings.fonts.weight.medium }}
                      >
                        ตัวอย่างน้ำหนักกลาง
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label htmlFor="bold-font-weight">น้ำหนักหนา ({brandSettings.fonts.weight.bold})</Label>
                      </div>
                      <Slider
                        id="bold-font-weight"
                        min={600}
                        max={900}
                        step={100}
                        value={[brandSettings.fonts.weight.bold]}
                        onValueChange={(value) => setBrandSettings({
                          ...brandSettings,
                          fonts: {
                            ...brandSettings.fonts,
                            weight: {
                              ...brandSettings.fonts.weight,
                              bold: value[0]
                            }
                          }
                        })}
                      />
                      <div 
                        className="w-full h-12 mt-2 rounded-md border flex items-center justify-center px-4" 
                        style={{ fontWeight: brandSettings.fonts.weight.bold }}
                      >
                        ตัวอย่างน้ำหนักหนา
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8">
                  <h3 className="text-base font-medium mb-4">ตัวอย่างการแสดงผลฟอนต์</h3>
                  <div className="p-4 border rounded-md space-y-4">
                    <h1 style={{ 
                      fontFamily: brandSettings.fonts.family,
                      fontSize: `${brandSettings.fonts.size.h1}px`, 
                      color: brandSettings.fonts.color.primary,
                      fontWeight: brandSettings.fonts.weight.bold
                    }}>
                      หัวข้อใหญ่ (H1)
                    </h1>
                    
                    <h2 style={{ 
                      fontFamily: brandSettings.fonts.family,
                      fontSize: `${brandSettings.fonts.size.h2}px`, 
                      color: brandSettings.fonts.color.primary,
                      fontWeight: brandSettings.fonts.weight.bold
                    }}>
                      หัวข้อรอง (H2)
                    </h2>
                    
                    <h3 style={{ 
                      fontFamily: brandSettings.fonts.family,
                      fontSize: `${brandSettings.fonts.size.h3}px`, 
                      color: brandSettings.fonts.color.primary,
                      fontWeight: brandSettings.fonts.weight.medium
                    }}>
                      หัวข้อย่อย (H3)
                    </h3>
                    
                    <p style={{ 
                      fontFamily: brandSettings.fonts.family,
                      fontSize: `${brandSettings.fonts.size.base}px`, 
                      color: brandSettings.fonts.color.primary,
                      fontWeight: brandSettings.fonts.weight.normal
                    }}>
                      ข้อความปกติ (Base): นี่คือตัวอย่างข้อความเนื้อหาปกติที่ใช้แสดงผลสำหรับเนื้อหาหลักในเว็บไซต์
                    </p>
                    
                    <p style={{ 
                      fontFamily: brandSettings.fonts.family,
                      fontSize: `${brandSettings.fonts.size.base}px`, 
                      color: brandSettings.fonts.color.secondary,
                      fontWeight: brandSettings.fonts.weight.normal
                    }}>
                      ข้อความรอง: สีข้อความรองมักใช้สำหรับเนื้อหาที่มีความสำคัญรองลงมาหรือต้องการแยกให้เห็นความแตกต่าง
                    </p>
                    
                    <p style={{ 
                      fontFamily: brandSettings.fonts.family,
                      fontSize: `${brandSettings.fonts.size.small}px`, 
                      color: brandSettings.fonts.color.muted,
                      fontWeight: brandSettings.fonts.weight.normal
                    }}>
                      ข้อความขนาดเล็ก (Small): ใช้สำหรับคำอธิบายเพิ่มเติม ลิขสิทธิ์ หรือข้อมูลที่มีความสำคัญน้อยกว่า
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={saveBrandSettings} className="w-full gap-2" disabled={isSaving}>
                  {isSaving ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  บันทึกการตั้งค่าฟอนต์
                </Button>
              </CardFooter>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="h-5 w-5" />
                ตัวอย่างการแสดงผล
              </CardTitle>
              <CardDescription>
                ดูตัวอย่างการแสดงผลของข้อมูลแบรนด์
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md p-4 space-y-6">
                <div className="flex items-center gap-2">
                  {brandSettings.logoUrl ? (
                    <img
                      src={brandSettings.logoUrl}
                      alt="Logo"
                      className="h-8"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "https://placehold.co/80x30?text=Logo";
                      }}
                    />
                  ) : (
                    <div className="font-bold text-xl">{brandSettings.siteName}</div>
                  )}
                </div>
                
                <div className="border-t pt-4">
                  <p className="text-muted-foreground">{brandSettings.siteDescription}</p>
                </div>
                
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground">{brandSettings.footerText}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* แท็บตั้งค่าหน้าแรก */}
        <TabsContent value="home" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ตั้งค่าส่วนหัวของหน้าแรก */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  ส่วนหัวของหน้าแรก
                </CardTitle>
                <CardDescription>
                  ปรับแต่งส่วนหัวด้านบนของหน้าแรก
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="header-bg-color">สีพื้นหลังส่วนหัว</Label>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-6 h-6 rounded-md border cursor-pointer"
                        style={{ 
                          backgroundColor: brandSettings.homePage?.headerBackgroundColor || "#16a5a3",
                          borderColor: "transparent"
                        }}
                      />
                      <Input
                        id="header-bg-color"
                        value={brandSettings.homePage?.headerBackgroundColor || "#16a5a3"}
                        onChange={(e) => setBrandSettings({
                          ...brandSettings,
                          homePage: {
                            ...brandSettings.homePage || {
                              bannerSlides: [],
                              navigationTabs: []
                            },
                            headerBackgroundColor: e.target.value
                          }
                        })}
                        placeholder="#16a5a3"
                      />
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <HexColorPicker
                      color={brandSettings.homePage?.headerBackgroundColor || "#16a5a3"}
                      onChange={(color) => setBrandSettings({
                        ...brandSettings,
                        homePage: {
                          ...brandSettings.homePage || {
                            bannerSlides: [],
                            navigationTabs: []
                          },
                          headerBackgroundColor: color
                        }
                      })}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="mt-4 p-4 border rounded-md">
                    <div 
                      className="h-24 rounded-md flex items-center justify-center text-white font-medium"
                      style={{ backgroundColor: brandSettings.homePage?.headerBackgroundColor || "#16a5a3" }}
                    >
                      ตัวอย่างสีพื้นหลังส่วนหัว
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* ตั้งค่าแถบนำทางด้านล่าง */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layout className="h-5 w-5" />
                  แถบนำทางด้านล่าง
                </CardTitle>
                <CardDescription>
                  ปรับแต่งแถบนำทางด้านล่างของแอปพลิเคชัน
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {brandSettings.homePage?.navigationTabs && brandSettings.homePage.navigationTabs.map((tab, index) => (
                    <div key={tab.id} className="p-4 border rounded-md space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">เมนูที่ {index + 1}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500"
                          onClick={() => {
                            const newTabs = [...(brandSettings.homePage?.navigationTabs || [])];
                            newTabs.splice(index, 1);
                            setBrandSettings({
                              ...brandSettings,
                              homePage: {
                                ...brandSettings.homePage || {
                                  headerBackgroundColor: "#16a5a3",
                                  bannerSlides: []
                                },
                                navigationTabs: newTabs
                              }
                            });
                          }}
                        >
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
                          >
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`tab-label-${index}`}>ชื่อเมนู</Label>
                        <Input
                          id={`tab-label-${index}`}
                          value={tab.label}
                          onChange={(e) => {
                            const newTabs = [...(brandSettings.homePage?.navigationTabs || [])];
                            newTabs[index] = {
                              ...newTabs[index],
                              label: e.target.value
                            };
                            setBrandSettings({
                              ...brandSettings,
                              homePage: {
                                ...brandSettings.homePage || {
                                  headerBackgroundColor: "#16a5a3",
                                  bannerSlides: []
                                },
                                navigationTabs: newTabs
                              }
                            });
                          }}
                          placeholder="ชื่อเมนู"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`tab-icon-${index}`}>ไอคอน</Label>
                        <Select
                          value={tab.icon}
                          onValueChange={(value) => {
                            const newTabs = [...(brandSettings.homePage?.navigationTabs || [])];
                            newTabs[index] = {
                              ...newTabs[index],
                              icon: value
                            };
                            setBrandSettings({
                              ...brandSettings,
                              homePage: {
                                ...brandSettings.homePage || {
                                  headerBackgroundColor: "#16a5a3",
                                  bannerSlides: []
                                },
                                navigationTabs: newTabs
                              }
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="เลือกไอคอน" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Home">หน้าหลัก</SelectItem>
                            <SelectItem value="DollarSign">ยื่นกู้</SelectItem>
                            <SelectItem value="BanknoteIcon">จัดการเงิน</SelectItem>
                            <SelectItem value="MessageSquare">แชท</SelectItem>
                            <SelectItem value="User">โปรไฟล์</SelectItem>
                            <SelectItem value="Settings">ตั้งค่า</SelectItem>
                            <SelectItem value="Bell">แจ้งเตือน</SelectItem>
                            <SelectItem value="CreditCard">บัตร</SelectItem>
                            <SelectItem value="BarChart">รายงาน</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`tab-link-${index}`}>ลิงก์เชื่อมโยง</Label>
                        <Input
                          id={`tab-link-${index}`}
                          value={tab.link}
                          onChange={(e) => {
                            const newTabs = [...(brandSettings.homePage?.navigationTabs || [])];
                            newTabs[index] = {
                              ...newTabs[index],
                              link: e.target.value
                            };
                            setBrandSettings({
                              ...brandSettings,
                              homePage: {
                                ...brandSettings.homePage || {
                                  headerBackgroundColor: "#16a5a3",
                                  bannerSlides: []
                                },
                                navigationTabs: newTabs
                              }
                            });
                          }}
                          placeholder="/path"
                        />
                      </div>
                    </div>
                  ))}
                  
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => {
                      const newTabs = [...(brandSettings.homePage?.navigationTabs || [])];
                      const newId = newTabs.length > 0 
                        ? Math.max(...newTabs.map(tab => tab.id)) + 1 
                        : 1;
                      
                      newTabs.push({
                        id: newId,
                        label: "เมนูใหม่",
                        icon: "Home",
                        link: "/"
                      });
                      
                      setBrandSettings({
                        ...brandSettings,
                        homePage: {
                          ...brandSettings.homePage || {
                            headerBackgroundColor: "#16a5a3",
                            bannerSlides: []
                          },
                          navigationTabs: newTabs
                        }
                      });
                    }}
                  >
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
                    >
                      <path d="M12 5v14" />
                      <path d="M5 12h14" />
                    </svg>
                    เพิ่มเมนูใหม่
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* ตั้งค่าแบนเนอร์สไลด์ */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="h-5 w-5" />
                แบนเนอร์สไลด์
              </CardTitle>
              <CardDescription>
                จัดการรูปภาพสไลด์ในหน้าแรก
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {brandSettings.homePage?.bannerSlides && brandSettings.homePage.bannerSlides.map((slide, index) => (
                  <div key={slide.id} className="p-4 border rounded-md space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">สไลด์ที่ {index + 1}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500"
                        onClick={() => {
                          const newSlides = [...(brandSettings.homePage?.bannerSlides || [])];
                          newSlides.splice(index, 1);
                          setBrandSettings({
                            ...brandSettings,
                            homePage: {
                              ...brandSettings.homePage || {
                                headerBackgroundColor: "#16a5a3",
                                navigationTabs: []
                              },
                              bannerSlides: newSlides
                            }
                          });
                        }}
                      >
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
                        >
                          <path d="M3 6h18" />
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          <line x1="10" y1="11" x2="10" y2="17" />
                          <line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`slide-image-${index}`}>URL รูปภาพ</Label>
                      <Input
                        id={`slide-image-${index}`}
                        value={slide.imageUrl}
                        onChange={(e) => {
                          const newSlides = [...(brandSettings.homePage?.bannerSlides || [])];
                          newSlides[index] = {
                            ...newSlides[index],
                            imageUrl: e.target.value
                          };
                          setBrandSettings({
                            ...brandSettings,
                            homePage: {
                              ...brandSettings.homePage || {
                                headerBackgroundColor: "#16a5a3",
                                navigationTabs: []
                              },
                              bannerSlides: newSlides
                            }
                          });
                        }}
                        placeholder="URL รูปภาพ"
                      />
                      {slide.imageUrl && (
                        <div className="mt-2 p-2 border rounded-md">
                          <p className="text-sm text-muted-foreground mb-2">ตัวอย่างรูปภาพ:</p>
                          <img
                            src={slide.imageUrl}
                            alt={`Slide ${index + 1}`}
                            className="max-h-40 max-w-full object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "https://placehold.co/600x400?text=Image+Error";
                            }}
                          />
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`slide-title-${index}`}>หัวข้อ</Label>
                      <Input
                        id={`slide-title-${index}`}
                        value={slide.title}
                        onChange={(e) => {
                          const newSlides = [...(brandSettings.homePage?.bannerSlides || [])];
                          newSlides[index] = {
                            ...newSlides[index],
                            title: e.target.value
                          };
                          setBrandSettings({
                            ...brandSettings,
                            homePage: {
                              ...brandSettings.homePage || {
                                headerBackgroundColor: "#16a5a3",
                                navigationTabs: []
                              },
                              bannerSlides: newSlides
                            }
                          });
                        }}
                        placeholder="หัวข้อสไลด์"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`slide-desc-${index}`}>คำอธิบาย</Label>
                      <Input
                        id={`slide-desc-${index}`}
                        value={slide.description}
                        onChange={(e) => {
                          const newSlides = [...(brandSettings.homePage?.bannerSlides || [])];
                          newSlides[index] = {
                            ...newSlides[index],
                            description: e.target.value
                          };
                          setBrandSettings({
                            ...brandSettings,
                            homePage: {
                              ...brandSettings.homePage || {
                                headerBackgroundColor: "#16a5a3",
                                navigationTabs: []
                              },
                              bannerSlides: newSlides
                            }
                          });
                        }}
                        placeholder="คำอธิบายสไลด์"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`slide-btn-text-${index}`}>ข้อความปุ่ม</Label>
                        <Input
                          id={`slide-btn-text-${index}`}
                          value={slide.buttonText}
                          onChange={(e) => {
                            const newSlides = [...(brandSettings.homePage?.bannerSlides || [])];
                            newSlides[index] = {
                              ...newSlides[index],
                              buttonText: e.target.value
                            };
                            setBrandSettings({
                              ...brandSettings,
                              homePage: {
                                ...brandSettings.homePage || {
                                  headerBackgroundColor: "#16a5a3",
                                  navigationTabs: []
                                },
                                bannerSlides: newSlides
                              }
                            });
                          }}
                          placeholder="ข้อความที่แสดงบนปุ่ม"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`slide-btn-link-${index}`}>ลิงก์ปุ่ม</Label>
                        <Input
                          id={`slide-btn-link-${index}`}
                          value={slide.buttonLink}
                          onChange={(e) => {
                            const newSlides = [...(brandSettings.homePage?.bannerSlides || [])];
                            newSlides[index] = {
                              ...newSlides[index],
                              buttonLink: e.target.value
                            };
                            setBrandSettings({
                              ...brandSettings,
                              homePage: {
                                ...brandSettings.homePage || {
                                  headerBackgroundColor: "#16a5a3",
                                  navigationTabs: []
                                },
                                bannerSlides: newSlides
                              }
                            });
                          }}
                          placeholder="/path"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`slide-bg-color-${index}`}>สีพื้นหลัง</Label>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-6 h-6 rounded-md border cursor-pointer"
                          style={{ 
                            backgroundColor: slide.backgroundColor,
                            borderColor: "transparent"
                          }}
                        />
                        <Input
                          id={`slide-bg-color-${index}`}
                          value={slide.backgroundColor}
                          onChange={(e) => {
                            const newSlides = [...(brandSettings.homePage?.bannerSlides || [])];
                            newSlides[index] = {
                              ...newSlides[index],
                              backgroundColor: e.target.value
                            };
                            setBrandSettings({
                              ...brandSettings,
                              homePage: {
                                ...brandSettings.homePage || {
                                  headerBackgroundColor: "#16a5a3",
                                  navigationTabs: []
                                },
                                bannerSlides: newSlides
                              }
                            });
                          }}
                          placeholder="#color"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => {
                    const newSlides = [...(brandSettings.homePage?.bannerSlides || [])];
                    const newId = newSlides.length > 0 
                      ? Math.max(...newSlides.map(slide => slide.id)) + 1 
                      : 1;
                    
                    newSlides.push({
                      id: newId,
                      imageUrl: "/images/banner-new.svg",
                      title: "สไลด์ใหม่",
                      description: "คำอธิบายสไลด์ใหม่",
                      buttonText: "ดูรายละเอียด",
                      buttonLink: "/",
                      backgroundColor: "#16a5a3"
                    });
                    
                    setBrandSettings({
                      ...brandSettings,
                      homePage: {
                        ...brandSettings.homePage || {
                          headerBackgroundColor: "#16a5a3",
                          navigationTabs: []
                        },
                        bannerSlides: newSlides
                      }
                    });
                  }}
                >
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
                  >
                    <path d="M12 5v14" />
                    <path d="M5 12h14" />
                  </svg>
                  เพิ่มสไลด์ใหม่
                </Button>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={saveBrandSettings} className="w-full gap-2" disabled={isSaving}>
                {isSaving ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                บันทึกการตั้งค่าทั้งหมด
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* แท็บตั้งค่าหน้ายื่นกู้เงิน */}
        <TabsContent value="loan" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* การตั้งค่าพื้นฐานหน้ายื่นกู้ */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Banknote className="h-5 w-5" />
                  การตั้งค่าพื้นฐาน
                </CardTitle>
                <CardDescription>
                  ตั้งค่าพื้นฐานสำหรับหน้ายื่นกู้เงิน
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="loan-header-bg-color">สีพื้นหลังส่วนหัว</Label>
                  <div className="grid grid-cols-[1fr,80px] gap-2">
                    <Input
                      id="loan-header-bg-color"
                      value={brandSettings.loanPage?.headerBackgroundColor || "#5d4a4a"}
                      onChange={(e) => {
                        const loanPage = brandSettings.loanPage || {
                          headerBackgroundColor: "#5d4a4a",
                          minLoanAmount: 50000,
                          maxLoanAmount: 5000000,
                          minLoanTerm: 1,
                          maxLoanTerm: 60,
                          interestRate: 8.5,
                          formLabelColor: "#6b7280",
                          formInputBorderColor: "#e5e7eb",
                          formInputBgColor: "#ffffff",
                          buttonColor: "#10b981",
                          buttonTextColor: "#ffffff"
                        };
                        setBrandSettings({
                          ...brandSettings,
                          loanPage: {
                            ...loanPage,
                            headerBackgroundColor: e.target.value
                          }
                        });
                      }}
                      placeholder="#5d4a4a"
                    />
                    <div 
                      className="h-9 rounded-md border" 
                      style={{ background: brandSettings.loanPage?.headerBackgroundColor || "#5d4a4a" }}
                    ></div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="text-base font-medium mb-3 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    วงเงินกู้
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="min-loan-amount">วงเงินกู้ขั้นต่ำ (บาท)</Label>
                      <Input
                        id="min-loan-amount"
                        type="number"
                        value={brandSettings.loanPage?.minLoanAmount || 50000}
                        onChange={(e) => {
                          const loanPage = brandSettings.loanPage || {
                            headerBackgroundColor: "#5d4a4a",
                            minLoanAmount: 50000,
                            maxLoanAmount: 5000000,
                            minLoanTerm: 1,
                            maxLoanTerm: 60,
                            interestRate: 8.5,
                            formLabelColor: "#6b7280",
                            formInputBorderColor: "#e5e7eb",
                            formInputBgColor: "#ffffff",
                            buttonColor: "#10b981",
                            buttonTextColor: "#ffffff"
                          };
                          setBrandSettings({
                            ...brandSettings,
                            loanPage: {
                              ...loanPage,
                              minLoanAmount: Number(e.target.value)
                            }
                          });
                        }}
                        placeholder="50000"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="max-loan-amount">วงเงินกู้สูงสุด (บาท)</Label>
                      <Input
                        id="max-loan-amount"
                        type="number"
                        value={brandSettings.loanPage?.maxLoanAmount || 5000000}
                        onChange={(e) => {
                          const loanPage = brandSettings.loanPage || {
                            headerBackgroundColor: "#5d4a4a",
                            minLoanAmount: 50000,
                            maxLoanAmount: 5000000,
                            minLoanTerm: 1,
                            maxLoanTerm: 60,
                            interestRate: 8.5,
                            formLabelColor: "#6b7280",
                            formInputBorderColor: "#e5e7eb",
                            formInputBgColor: "#ffffff",
                            buttonColor: "#10b981",
                            buttonTextColor: "#ffffff"
                          };
                          setBrandSettings({
                            ...brandSettings,
                            loanPage: {
                              ...loanPage,
                              maxLoanAmount: Number(e.target.value)
                            }
                          });
                        }}
                        placeholder="5000000"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="text-base font-medium mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    ระยะเวลาผ่อนชำระ
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="min-loan-term">ระยะเวลาขั้นต่ำ (เดือน)</Label>
                      <Input
                        id="min-loan-term"
                        type="number"
                        value={brandSettings.loanPage?.minLoanTerm || 1}
                        onChange={(e) => {
                          const loanPage = brandSettings.loanPage || {
                            headerBackgroundColor: "#5d4a4a",
                            minLoanAmount: 50000,
                            maxLoanAmount: 5000000,
                            minLoanTerm: 1,
                            maxLoanTerm: 60,
                            interestRate: 8.5,
                            formLabelColor: "#6b7280",
                            formInputBorderColor: "#e5e7eb",
                            formInputBgColor: "#ffffff",
                            buttonColor: "#10b981",
                            buttonTextColor: "#ffffff"
                          };
                          setBrandSettings({
                            ...brandSettings,
                            loanPage: {
                              ...loanPage,
                              minLoanTerm: Number(e.target.value)
                            }
                          });
                        }}
                        placeholder="1"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="max-loan-term">ระยะเวลาสูงสุด (เดือน)</Label>
                      <Input
                        id="max-loan-term"
                        type="number"
                        value={brandSettings.loanPage?.maxLoanTerm || 60}
                        onChange={(e) => {
                          const loanPage = brandSettings.loanPage || {
                            headerBackgroundColor: "#5d4a4a",
                            minLoanAmount: 50000,
                            maxLoanAmount: 5000000,
                            minLoanTerm: 1,
                            maxLoanTerm: 60,
                            interestRate: 8.5,
                            formLabelColor: "#6b7280",
                            formInputBorderColor: "#e5e7eb",
                            formInputBgColor: "#ffffff",
                            buttonColor: "#10b981",
                            buttonTextColor: "#ffffff"
                          };
                          setBrandSettings({
                            ...brandSettings,
                            loanPage: {
                              ...loanPage,
                              maxLoanTerm: Number(e.target.value)
                            }
                          });
                        }}
                        placeholder="60"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="text-base font-medium mb-3 flex items-center gap-2">
                    <Percent className="h-4 w-4" />
                    อัตราดอกเบี้ย
                  </h3>
                  <div className="space-y-2">
                    <Label htmlFor="interest-rate">อัตราดอกเบี้ย (% ต่อเดือน)</Label>
                    <Input
                      id="interest-rate"
                      type="number"
                      value={brandSettings.loanPage?.interestRate || 8.5}
                      onChange={(e) => {
                        const loanPage = brandSettings.loanPage || {
                          headerBackgroundColor: "#5d4a4a",
                          minLoanAmount: 50000,
                          maxLoanAmount: 5000000,
                          minLoanTerm: 1,
                          maxLoanTerm: 60,
                          interestRate: 8.5,
                          formLabelColor: "#6b7280",
                          formInputBorderColor: "#e5e7eb",
                          formInputBgColor: "#ffffff",
                          buttonColor: "#10b981",
                          buttonTextColor: "#ffffff"
                        };
                        setBrandSettings({
                          ...brandSettings,
                          loanPage: {
                            ...loanPage,
                            interestRate: Number(e.target.value)
                          }
                        });
                      }}
                      step="0.01"
                      placeholder="8.5"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setBrandSettings({
                      ...brandSettings,
                      loanPage: {
                        headerBackgroundColor: "#5d4a4a",
                        minLoanAmount: 50000,
                        maxLoanAmount: 5000000,
                        minLoanTerm: 1,
                        maxLoanTerm: 60,
                        interestRate: 8.5,
                        formLabelColor: "#6b7280",
                        formInputBorderColor: "#e5e7eb",
                        formInputBgColor: "#ffffff",
                        buttonColor: "#10b981",
                        buttonTextColor: "#ffffff"
                      }
                    });
                  }}
                >
                  รีเซ็ตเป็นค่าเริ่มต้น
                </Button>
              </CardFooter>
            </Card>

            {/* การตั้งค่าสีฟอร์มและปุ่ม */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  สีฟอร์มและปุ่ม
                </CardTitle>
                <CardDescription>
                  ตั้งค่าสีสำหรับฟอร์มและปุ่มในหน้ายื่นกู้เงิน
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="form-label-color">สีข้อความ Label ฟอร์ม</Label>
                  <div className="grid grid-cols-[1fr,80px] gap-2">
                    <Input
                      id="form-label-color"
                      value={brandSettings.loanPage?.formLabelColor || "#6b7280"}
                      onChange={(e) => {
                        const loanPage = brandSettings.loanPage || {
                          headerBackgroundColor: "#5d4a4a",
                          minLoanAmount: 50000,
                          maxLoanAmount: 5000000,
                          minLoanTerm: 1,
                          maxLoanTerm: 60,
                          interestRate: 8.5,
                          formLabelColor: "#6b7280",
                          formInputBorderColor: "#e5e7eb",
                          formInputBgColor: "#ffffff",
                          buttonColor: "#10b981",
                          buttonTextColor: "#ffffff"
                        };
                        setBrandSettings({
                          ...brandSettings,
                          loanPage: {
                            ...loanPage,
                            formLabelColor: e.target.value
                          }
                        });
                      }}
                      placeholder="#6b7280"
                    />
                    <div 
                      className="h-9 rounded-md border" 
                      style={{ background: brandSettings.loanPage?.formLabelColor || "#6b7280" }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="form-input-border-color">สีขอบช่องกรอกข้อมูล</Label>
                  <div className="grid grid-cols-[1fr,80px] gap-2">
                    <Input
                      id="form-input-border-color"
                      value={brandSettings.loanPage?.formInputBorderColor || "#e5e7eb"}
                      onChange={(e) => {
                        const loanPage = brandSettings.loanPage || {
                          headerBackgroundColor: "#5d4a4a",
                          minLoanAmount: 50000,
                          maxLoanAmount: 5000000,
                          minLoanTerm: 1,
                          maxLoanTerm: 60,
                          interestRate: 8.5,
                          formLabelColor: "#6b7280",
                          formInputBorderColor: "#e5e7eb",
                          formInputBgColor: "#ffffff",
                          buttonColor: "#10b981",
                          buttonTextColor: "#ffffff"
                        };
                        setBrandSettings({
                          ...brandSettings,
                          loanPage: {
                            ...loanPage,
                            formInputBorderColor: e.target.value
                          }
                        });
                      }}
                      placeholder="#e5e7eb"
                    />
                    <div 
                      className="h-9 rounded-md border" 
                      style={{ background: brandSettings.loanPage?.formInputBorderColor || "#e5e7eb" }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="form-input-bg-color">สีพื้นหลังช่องกรอกข้อมูล</Label>
                  <div className="grid grid-cols-[1fr,80px] gap-2">
                    <Input
                      id="form-input-bg-color"
                      value={brandSettings.loanPage?.formInputBgColor || "#ffffff"}
                      onChange={(e) => {
                        const loanPage = brandSettings.loanPage || {
                          headerBackgroundColor: "#5d4a4a",
                          minLoanAmount: 50000,
                          maxLoanAmount: 5000000,
                          minLoanTerm: 1,
                          maxLoanTerm: 60,
                          interestRate: 8.5,
                          formLabelColor: "#6b7280",
                          formInputBorderColor: "#e5e7eb",
                          formInputBgColor: "#ffffff",
                          buttonColor: "#10b981",
                          buttonTextColor: "#ffffff"
                        };
                        setBrandSettings({
                          ...brandSettings,
                          loanPage: {
                            ...loanPage,
                            formInputBgColor: e.target.value
                          }
                        });
                      }}
                      placeholder="#ffffff"
                    />
                    <div 
                      className="h-9 rounded-md border" 
                      style={{ background: brandSettings.loanPage?.formInputBgColor || "#ffffff" }}
                    ></div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="text-base font-medium mb-3">ปุ่มกดยื่นกู้</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="button-color">สีพื้นหลังปุ่ม</Label>
                      <div className="grid grid-cols-[1fr,80px] gap-2">
                        <Input
                          id="button-color"
                          value={brandSettings.loanPage?.buttonColor || "#10b981"}
                          onChange={(e) => {
                            const loanPage = brandSettings.loanPage || {
                              headerBackgroundColor: "#5d4a4a",
                              minLoanAmount: 50000,
                              maxLoanAmount: 5000000,
                              minLoanTerm: 1,
                              maxLoanTerm: 60,
                              interestRate: 8.5,
                              formLabelColor: "#6b7280",
                              formInputBorderColor: "#e5e7eb",
                              formInputBgColor: "#ffffff",
                              buttonColor: "#10b981",
                              buttonTextColor: "#ffffff"
                            };
                            setBrandSettings({
                              ...brandSettings,
                              loanPage: {
                                ...loanPage,
                                buttonColor: e.target.value
                              }
                            });
                          }}
                          placeholder="#10b981"
                        />
                        <div 
                          className="h-9 rounded-md border" 
                          style={{ background: brandSettings.loanPage?.buttonColor || "#10b981" }}
                        ></div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="button-text-color">สีข้อความปุ่ม</Label>
                      <div className="grid grid-cols-[1fr,80px] gap-2">
                        <Input
                          id="button-text-color"
                          value={brandSettings.loanPage?.buttonTextColor || "#ffffff"}
                          onChange={(e) => {
                            const loanPage = brandSettings.loanPage || {
                              headerBackgroundColor: "#5d4a4a",
                              minLoanAmount: 50000,
                              maxLoanAmount: 5000000,
                              minLoanTerm: 1,
                              maxLoanTerm: 60,
                              interestRate: 8.5,
                              formLabelColor: "#6b7280",
                              formInputBorderColor: "#e5e7eb",
                              formInputBgColor: "#ffffff",
                              buttonColor: "#10b981",
                              buttonTextColor: "#ffffff"
                            };
                            setBrandSettings({
                              ...brandSettings,
                              loanPage: {
                                ...loanPage,
                                buttonTextColor: e.target.value
                              }
                            });
                          }}
                          placeholder="#ffffff"
                        />
                        <div 
                          className="h-9 rounded-md border" 
                          style={{ background: brandSettings.loanPage?.buttonTextColor || "#ffffff" }}
                        ></div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div 
                        className="p-2 rounded-md text-center font-medium"
                        style={{ 
                          backgroundColor: brandSettings.loanPage?.buttonColor || "#10b981",
                          color: brandSettings.loanPage?.buttonTextColor || "#ffffff"
                        }}
                      >
                        ตัวอย่างปุ่มยื่นกู้
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={saveBrandSettings} className="w-full gap-2" disabled={isSaving}>
                  {isSaving ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  บันทึกการตั้งค่าหน้ายื่นกู้
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        {/* แท็บตั้งค่าหน้าจัดการเงิน (หน้าถอนเงิน) */}
        <TabsContent value="withdrawal" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* การตั้งค่าการ์ดแสดงยอดเงิน */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  การ์ดแสดงยอดเงิน
                </CardTitle>
                <CardDescription>
                  ปรับแต่งการแสดงผลของการ์ดแสดงยอดเงินในหน้าถอนเงิน
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="balance-card-bg-from">สีพื้นหลังเริ่มต้น (Gradient)</Label>
                  </div>
                  <div className="flex space-x-2">
                    <Input
                      id="balance-card-bg-from"
                      type="text"
                      value={brandSettings.withdrawalPage?.balanceCardBgFrom || "var(--primary-color)"}
                      onChange={(e) => {
                        const withdrawalPage = brandSettings.withdrawalPage || {
                          balanceCardBgFrom: "var(--primary-color)",
                          balanceCardBgTo: "var(--primary-dark)",
                          balanceCardTextColor: "#ffffff",
                          tabActiveColor: "var(--primary-color)",
                          tabTextColor: "#4b5563",
                          bankFormHeaderBgFrom: "#e6f7f7",
                          bankFormHeaderBgTo: "#e6f0ff",
                          withdrawFormHeaderBgFrom: "#e6f7f7", 
                          withdrawFormHeaderBgTo: "#e6f0ff",
                          bankButtonBgFrom: "#3b82f6",
                          bankButtonBgTo: "#2563eb",
                          bankButtonTextColor: "#ffffff",
                          withdrawButtonBgFrom: "#10b981",
                          withdrawButtonBgTo: "#059669",
                          withdrawButtonTextColor: "#ffffff"
                        };
                        setBrandSettings({
                          ...brandSettings,
                          withdrawalPage: {
                            ...withdrawalPage,
                            balanceCardBgFrom: e.target.value
                          }
                        });
                      }}
                      placeholder="var(--primary-color)"
                    />
                    <div 
                      className="h-9 rounded-md border" 
                      style={{ background: brandSettings.withdrawalPage?.balanceCardBgFrom || "var(--primary-color)" }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="balance-card-bg-to">สีพื้นหลังสิ้นสุด (Gradient)</Label>
                  </div>
                  <div className="flex space-x-2">
                    <Input
                      id="balance-card-bg-to"
                      type="text"
                      value={brandSettings.withdrawalPage?.balanceCardBgTo || "var(--primary-dark)"}
                      onChange={(e) => {
                        const withdrawalPage = brandSettings.withdrawalPage || {
                          balanceCardBgFrom: "var(--primary-color)",
                          balanceCardBgTo: "var(--primary-dark)",
                          balanceCardTextColor: "#ffffff",
                          tabActiveColor: "var(--primary-color)",
                          tabTextColor: "#4b5563",
                          bankFormHeaderBgFrom: "#e6f7f7",
                          bankFormHeaderBgTo: "#e6f0ff",
                          withdrawFormHeaderBgFrom: "#e6f7f7", 
                          withdrawFormHeaderBgTo: "#e6f0ff",
                          bankButtonBgFrom: "#3b82f6",
                          bankButtonBgTo: "#2563eb",
                          bankButtonTextColor: "#ffffff",
                          withdrawButtonBgFrom: "#10b981",
                          withdrawButtonBgTo: "#059669",
                          withdrawButtonTextColor: "#ffffff"
                        };
                        setBrandSettings({
                          ...brandSettings,
                          withdrawalPage: {
                            ...withdrawalPage,
                            balanceCardBgTo: e.target.value
                          }
                        });
                      }}
                      placeholder="var(--primary-dark)"
                    />
                    <div 
                      className="h-9 rounded-md border" 
                      style={{ background: brandSettings.withdrawalPage?.balanceCardBgTo || "var(--primary-dark)" }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="balance-card-text-color">สีข้อความในการ์ด</Label>
                  </div>
                  <div className="flex space-x-2">
                    <Input
                      id="balance-card-text-color"
                      type="text"
                      value={brandSettings.withdrawalPage?.balanceCardTextColor || "#ffffff"}
                      onChange={(e) => {
                        const withdrawalPage = brandSettings.withdrawalPage || {
                          balanceCardBgFrom: "var(--primary-color)",
                          balanceCardBgTo: "var(--primary-dark)",
                          balanceCardTextColor: "#ffffff",
                          tabActiveColor: "var(--primary-color)",
                          tabTextColor: "#4b5563",
                          bankFormHeaderBgFrom: "#e6f7f7",
                          bankFormHeaderBgTo: "#e6f0ff",
                          withdrawFormHeaderBgFrom: "#e6f7f7", 
                          withdrawFormHeaderBgTo: "#e6f0ff",
                          bankButtonBgFrom: "#3b82f6",
                          bankButtonBgTo: "#2563eb",
                          bankButtonTextColor: "#ffffff",
                          withdrawButtonBgFrom: "#10b981",
                          withdrawButtonBgTo: "#059669",
                          withdrawButtonTextColor: "#ffffff"
                        };
                        setBrandSettings({
                          ...brandSettings,
                          withdrawalPage: {
                            ...withdrawalPage,
                            balanceCardTextColor: e.target.value
                          }
                        });
                      }}
                      placeholder="#ffffff"
                    />
                    <div 
                      className="h-9 rounded-md border" 
                      style={{ background: brandSettings.withdrawalPage?.balanceCardTextColor || "#ffffff" }}
                    ></div>
                  </div>
                </div>

                <div className="mt-4">
                  <div 
                    className="w-full h-24 rounded-md p-4 flex flex-col justify-between" 
                    style={{ 
                      background: `linear-gradient(135deg, ${brandSettings.withdrawalPage?.balanceCardBgFrom || "var(--primary-color)"}, ${brandSettings.withdrawalPage?.balanceCardBgTo || "var(--primary-dark)"})`,
                      color: brandSettings.withdrawalPage?.balanceCardTextColor || "#ffffff"
                    }}
                  >
                    <div className="text-sm font-medium opacity-90">ยอดเงินในบัญชี</div>
                    <div className="text-2xl font-bold font-mono">฿10,000.00</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* การตั้งค่าแท็บและปุ่ม */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sliders className="h-5 w-5" />
                  แท็บและการนำทาง
                </CardTitle>
                <CardDescription>
                  ปรับแต่งแท็บและการนำทางในหน้าถอนเงิน
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="tab-active-color">สีแท็บที่เลือก</Label>
                  </div>
                  <div className="flex space-x-2">
                    <Input
                      id="tab-active-color"
                      type="text"
                      value={brandSettings.withdrawalPage?.tabActiveColor || "var(--primary-color)"}
                      onChange={(e) => {
                        const withdrawalPage = brandSettings.withdrawalPage || {
                          balanceCardBgFrom: "var(--primary-color)",
                          balanceCardBgTo: "var(--primary-dark)",
                          balanceCardTextColor: "#ffffff",
                          tabActiveColor: "var(--primary-color)",
                          tabTextColor: "#4b5563",
                          bankFormHeaderBgFrom: "#e6f7f7",
                          bankFormHeaderBgTo: "#e6f0ff",
                          withdrawFormHeaderBgFrom: "#e6f7f7", 
                          withdrawFormHeaderBgTo: "#e6f0ff",
                          bankButtonBgFrom: "#3b82f6",
                          bankButtonBgTo: "#2563eb",
                          bankButtonTextColor: "#ffffff",
                          withdrawButtonBgFrom: "#10b981",
                          withdrawButtonBgTo: "#059669",
                          withdrawButtonTextColor: "#ffffff"
                        };
                        setBrandSettings({
                          ...brandSettings,
                          withdrawalPage: {
                            ...withdrawalPage,
                            tabActiveColor: e.target.value
                          }
                        });
                      }}
                      placeholder="var(--primary-color)"
                    />
                    <div 
                      className="h-9 rounded-md border" 
                      style={{ background: brandSettings.withdrawalPage?.tabActiveColor || "var(--primary-color)" }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="tab-text-color">สีข้อความแท็บ</Label>
                  </div>
                  <div className="flex space-x-2">
                    <Input
                      id="tab-text-color"
                      type="text"
                      value={brandSettings.withdrawalPage?.tabTextColor || "#4b5563"}
                      onChange={(e) => {
                        const withdrawalPage = brandSettings.withdrawalPage || {
                          balanceCardBgFrom: "var(--primary-color)",
                          balanceCardBgTo: "var(--primary-dark)",
                          balanceCardTextColor: "#ffffff",
                          tabActiveColor: "var(--primary-color)",
                          tabTextColor: "#4b5563",
                          bankFormHeaderBgFrom: "#e6f7f7",
                          bankFormHeaderBgTo: "#e6f0ff",
                          withdrawFormHeaderBgFrom: "#e6f7f7", 
                          withdrawFormHeaderBgTo: "#e6f0ff",
                          bankButtonBgFrom: "#3b82f6",
                          bankButtonBgTo: "#2563eb",
                          bankButtonTextColor: "#ffffff",
                          withdrawButtonBgFrom: "#10b981",
                          withdrawButtonBgTo: "#059669",
                          withdrawButtonTextColor: "#ffffff"
                        };
                        setBrandSettings({
                          ...brandSettings,
                          withdrawalPage: {
                            ...withdrawalPage,
                            tabTextColor: e.target.value
                          }
                        });
                      }}
                      placeholder="#4b5563"
                    />
                    <div 
                      className="h-9 rounded-md border" 
                      style={{ background: brandSettings.withdrawalPage?.tabTextColor || "#4b5563" }}
                    ></div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="w-full rounded-md shadow-sm overflow-hidden">
                    <div className="grid grid-cols-2 bg-white/80 backdrop-blur-sm">
                      <div
                        className="py-4 font-medium text-sm relative transition-all duration-200 text-center"
                        style={{ 
                          color: brandSettings.withdrawalPage?.tabActiveColor || "var(--primary-color)",
                          fontWeight: "600"
                        }}
                      >
                        ถอนเงิน
                        <div className="absolute bottom-0 left-0 right-0 h-0.5"
                          style={{ 
                            background: brandSettings.withdrawalPage?.tabActiveColor || "var(--primary-color)" 
                          }}
                        ></div>
                      </div>
                      <div
                        className="py-4 font-medium text-sm relative transition-all duration-200 text-center"
                        style={{ 
                          color: brandSettings.withdrawalPage?.tabTextColor || "#4b5563"
                        }}
                      >
                        ประวัติ
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* การตั้งค่าส่วนหัวฟอร์ม */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layout className="h-5 w-5" />
                  ส่วนหัวฟอร์ม
                </CardTitle>
                <CardDescription>
                  ปรับแต่งส่วนหัวของฟอร์มในหน้าถอนเงิน
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-base font-medium mb-3">ฟอร์มเพิ่มบัญชีธนาคาร</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label htmlFor="bank-form-header-bg-from">สีพื้นหลังส่วนหัวเริ่มต้น</Label>
                      </div>
                      <div className="flex space-x-2">
                        <Input
                          id="bank-form-header-bg-from"
                          type="text"
                          value={brandSettings.withdrawalPage?.bankFormHeaderBgFrom || "#e6f7f7"}
                          onChange={(e) => {
                            const withdrawalPage = brandSettings.withdrawalPage || {
                              balanceCardBgFrom: "var(--primary-color)",
                              balanceCardBgTo: "var(--primary-dark)",
                              balanceCardTextColor: "#ffffff",
                              tabActiveColor: "var(--primary-color)",
                              tabTextColor: "#4b5563",
                              bankFormHeaderBgFrom: "#e6f7f7",
                              bankFormHeaderBgTo: "#e6f0ff",
                              withdrawFormHeaderBgFrom: "#e6f7f7", 
                              withdrawFormHeaderBgTo: "#e6f0ff",
                              bankButtonBgFrom: "#3b82f6",
                              bankButtonBgTo: "#2563eb",
                              bankButtonTextColor: "#ffffff",
                              withdrawButtonBgFrom: "#10b981",
                              withdrawButtonBgTo: "#059669",
                              withdrawButtonTextColor: "#ffffff"
                            };
                            setBrandSettings({
                              ...brandSettings,
                              withdrawalPage: {
                                ...withdrawalPage,
                                bankFormHeaderBgFrom: e.target.value
                              }
                            });
                          }}
                          placeholder="#e6f7f7"
                        />
                        <div 
                          className="h-9 rounded-md border" 
                          style={{ background: brandSettings.withdrawalPage?.bankFormHeaderBgFrom || "#e6f7f7" }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label htmlFor="bank-form-header-bg-to">สีพื้นหลังส่วนหัวสิ้นสุด</Label>
                      </div>
                      <div className="flex space-x-2">
                        <Input
                          id="bank-form-header-bg-to"
                          type="text"
                          value={brandSettings.withdrawalPage?.bankFormHeaderBgTo || "#e6f0ff"}
                          onChange={(e) => {
                            const withdrawalPage = brandSettings.withdrawalPage || {
                              balanceCardBgFrom: "var(--primary-color)",
                              balanceCardBgTo: "var(--primary-dark)",
                              balanceCardTextColor: "#ffffff",
                              tabActiveColor: "var(--primary-color)",
                              tabTextColor: "#4b5563",
                              bankFormHeaderBgFrom: "#e6f7f7",
                              bankFormHeaderBgTo: "#e6f0ff",
                              withdrawFormHeaderBgFrom: "#e6f7f7", 
                              withdrawFormHeaderBgTo: "#e6f0ff",
                              bankButtonBgFrom: "#3b82f6",
                              bankButtonBgTo: "#2563eb",
                              bankButtonTextColor: "#ffffff",
                              withdrawButtonBgFrom: "#10b981",
                              withdrawButtonBgTo: "#059669",
                              withdrawButtonTextColor: "#ffffff"
                            };
                            setBrandSettings({
                              ...brandSettings,
                              withdrawalPage: {
                                ...withdrawalPage,
                                bankFormHeaderBgTo: e.target.value
                              }
                            });
                          }}
                          placeholder="#e6f0ff"
                        />
                        <div 
                          className="h-9 rounded-md border" 
                          style={{ background: brandSettings.withdrawalPage?.bankFormHeaderBgTo || "#e6f0ff" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="text-base font-medium mb-3">ฟอร์มถอนเงิน</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label htmlFor="withdraw-form-header-bg-from">สีพื้นหลังส่วนหัวเริ่มต้น</Label>
                      </div>
                      <div className="flex space-x-2">
                        <Input
                          id="withdraw-form-header-bg-from"
                          type="text"
                          value={brandSettings.withdrawalPage?.withdrawFormHeaderBgFrom || "#e6f7f7"}
                          onChange={(e) => {
                            const withdrawalPage = brandSettings.withdrawalPage || {
                              balanceCardBgFrom: "var(--primary-color)",
                              balanceCardBgTo: "var(--primary-dark)",
                              balanceCardTextColor: "#ffffff",
                              tabActiveColor: "var(--primary-color)",
                              tabTextColor: "#4b5563",
                              bankFormHeaderBgFrom: "#e6f7f7",
                              bankFormHeaderBgTo: "#e6f0ff",
                              withdrawFormHeaderBgFrom: "#e6f7f7", 
                              withdrawFormHeaderBgTo: "#e6f0ff",
                              bankButtonBgFrom: "#3b82f6",
                              bankButtonBgTo: "#2563eb",
                              bankButtonTextColor: "#ffffff",
                              withdrawButtonBgFrom: "#10b981",
                              withdrawButtonBgTo: "#059669",
                              withdrawButtonTextColor: "#ffffff"
                            };
                            setBrandSettings({
                              ...brandSettings,
                              withdrawalPage: {
                                ...withdrawalPage,
                                withdrawFormHeaderBgFrom: e.target.value
                              }
                            });
                          }}
                          placeholder="#e6f7f7"
                        />
                        <div 
                          className="h-9 rounded-md border" 
                          style={{ background: brandSettings.withdrawalPage?.withdrawFormHeaderBgFrom || "#e6f7f7" }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label htmlFor="withdraw-form-header-bg-to">สีพื้นหลังส่วนหัวสิ้นสุด</Label>
                      </div>
                      <div className="flex space-x-2">
                        <Input
                          id="withdraw-form-header-bg-to"
                          type="text"
                          value={brandSettings.withdrawalPage?.withdrawFormHeaderBgTo || "#e6f0ff"}
                          onChange={(e) => {
                            const withdrawalPage = brandSettings.withdrawalPage || {
                              balanceCardBgFrom: "var(--primary-color)",
                              balanceCardBgTo: "var(--primary-dark)",
                              balanceCardTextColor: "#ffffff",
                              tabActiveColor: "var(--primary-color)",
                              tabTextColor: "#4b5563",
                              bankFormHeaderBgFrom: "#e6f7f7",
                              bankFormHeaderBgTo: "#e6f0ff",
                              withdrawFormHeaderBgFrom: "#e6f7f7", 
                              withdrawFormHeaderBgTo: "#e6f0ff",
                              bankButtonBgFrom: "#3b82f6",
                              bankButtonBgTo: "#2563eb",
                              bankButtonTextColor: "#ffffff",
                              withdrawButtonBgFrom: "#10b981",
                              withdrawButtonBgTo: "#059669",
                              withdrawButtonTextColor: "#ffffff"
                            };
                            setBrandSettings({
                              ...brandSettings,
                              withdrawalPage: {
                                ...withdrawalPage,
                                withdrawFormHeaderBgTo: e.target.value
                              }
                            });
                          }}
                          placeholder="#e6f0ff"
                        />
                        <div 
                          className="h-9 rounded-md border" 
                          style={{ background: brandSettings.withdrawalPage?.withdrawFormHeaderBgTo || "#e6f0ff" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="space-y-4">
                    <div className="rounded-xl overflow-hidden shadow-sm">
                      <div className="bg-gradient-to-r p-4 flex items-center gap-2"
                        style={{ 
                          background: `linear-gradient(to right, ${brandSettings.withdrawalPage?.bankFormHeaderBgFrom || "#e6f7f7"}, ${brandSettings.withdrawalPage?.bankFormHeaderBgTo || "#e6f0ff"})` 
                        }}
                      >
                        <Building className="text-teal-600 h-5 w-5 mr-2" />
                        <span className="text-lg">เพิ่มบัญชีธนาคาร</span>
                      </div>
                    </div>

                    <div className="rounded-xl overflow-hidden shadow-sm">
                      <div className="bg-gradient-to-r p-4 flex items-center gap-2"
                        style={{ 
                          background: `linear-gradient(to right, ${brandSettings.withdrawalPage?.withdrawFormHeaderBgFrom || "#e6f7f7"}, ${brandSettings.withdrawalPage?.withdrawFormHeaderBgTo || "#e6f0ff"})` 
                        }}
                      >
                        <Banknote className="text-teal-600 h-5 w-5 mr-2" />
                        <span className="text-lg">ถอนเงินเข้าบัญชีธนาคาร</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* การตั้งค่าปุ่ม */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Square className="h-5 w-5" />
                  ปุ่มในฟอร์ม
                </CardTitle>
                <CardDescription>
                  ปรับแต่งสีปุ่มในฟอร์มถอนเงินและเพิ่มบัญชี
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-base font-medium mb-3">ปุ่มบันทึกบัญชีธนาคาร</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label htmlFor="bank-button-bg-from">สีปุ่มเริ่มต้น (Gradient)</Label>
                      </div>
                      <div className="flex space-x-2">
                        <Input
                          id="bank-button-bg-from"
                          type="text"
                          value={brandSettings.withdrawalPage?.bankButtonBgFrom || "#3b82f6"}
                          onChange={(e) => {
                            const withdrawalPage = brandSettings.withdrawalPage || {
                              balanceCardBgFrom: "var(--primary-color)",
                              balanceCardBgTo: "var(--primary-dark)",
                              balanceCardTextColor: "#ffffff",
                              tabActiveColor: "var(--primary-color)",
                              tabTextColor: "#4b5563",
                              bankFormHeaderBgFrom: "#e6f7f7",
                              bankFormHeaderBgTo: "#e6f0ff",
                              withdrawFormHeaderBgFrom: "#e6f7f7", 
                              withdrawFormHeaderBgTo: "#e6f0ff",
                              bankButtonBgFrom: "#3b82f6",
                              bankButtonBgTo: "#2563eb",
                              bankButtonTextColor: "#ffffff",
                              withdrawButtonBgFrom: "#10b981",
                              withdrawButtonBgTo: "#059669",
                              withdrawButtonTextColor: "#ffffff"
                            };
                            setBrandSettings({
                              ...brandSettings,
                              withdrawalPage: {
                                ...withdrawalPage,
                                bankButtonBgFrom: e.target.value
                              }
                            });
                          }}
                          placeholder="#3b82f6"
                        />
                        <div 
                          className="h-9 rounded-md border" 
                          style={{ background: brandSettings.withdrawalPage?.bankButtonBgFrom || "#3b82f6" }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label htmlFor="bank-button-bg-to">สีปุ่มสิ้นสุด (Gradient)</Label>
                      </div>
                      <div className="flex space-x-2">
                        <Input
                          id="bank-button-bg-to"
                          type="text"
                          value={brandSettings.withdrawalPage?.bankButtonBgTo || "#2563eb"}
                          onChange={(e) => {
                            const withdrawalPage = brandSettings.withdrawalPage || {
                              balanceCardBgFrom: "var(--primary-color)",
                              balanceCardBgTo: "var(--primary-dark)",
                              balanceCardTextColor: "#ffffff",
                              tabActiveColor: "var(--primary-color)",
                              tabTextColor: "#4b5563",
                              bankFormHeaderBgFrom: "#e6f7f7",
                              bankFormHeaderBgTo: "#e6f0ff",
                              withdrawFormHeaderBgFrom: "#e6f7f7", 
                              withdrawFormHeaderBgTo: "#e6f0ff",
                              bankButtonBgFrom: "#3b82f6",
                              bankButtonBgTo: "#2563eb",
                              bankButtonTextColor: "#ffffff",
                              withdrawButtonBgFrom: "#10b981",
                              withdrawButtonBgTo: "#059669",
                              withdrawButtonTextColor: "#ffffff"
                            };
                            setBrandSettings({
                              ...brandSettings,
                              withdrawalPage: {
                                ...withdrawalPage,
                                bankButtonBgTo: e.target.value
                              }
                            });
                          }}
                          placeholder="#2563eb"
                        />
                        <div 
                          className="h-9 rounded-md border" 
                          style={{ background: brandSettings.withdrawalPage?.bankButtonBgTo || "#2563eb" }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label htmlFor="bank-button-text-color">สีข้อความปุ่ม</Label>
                      </div>
                      <div className="flex space-x-2">
                        <Input
                          id="bank-button-text-color"
                          type="text"
                          value={brandSettings.withdrawalPage?.bankButtonTextColor || "#ffffff"}
                          onChange={(e) => {
                            const withdrawalPage = brandSettings.withdrawalPage || {
                              balanceCardBgFrom: "var(--primary-color)",
                              balanceCardBgTo: "var(--primary-dark)",
                              balanceCardTextColor: "#ffffff",
                              tabActiveColor: "var(--primary-color)",
                              tabTextColor: "#4b5563",
                              bankFormHeaderBgFrom: "#e6f7f7",
                              bankFormHeaderBgTo: "#e6f0ff",
                              withdrawFormHeaderBgFrom: "#e6f7f7", 
                              withdrawFormHeaderBgTo: "#e6f0ff",
                              bankButtonBgFrom: "#3b82f6",
                              bankButtonBgTo: "#2563eb",
                              bankButtonTextColor: "#ffffff",
                              withdrawButtonBgFrom: "#10b981",
                              withdrawButtonBgTo: "#059669",
                              withdrawButtonTextColor: "#ffffff"
                            };
                            setBrandSettings({
                              ...brandSettings,
                              withdrawalPage: {
                                ...withdrawalPage,
                                bankButtonTextColor: e.target.value
                              }
                            });
                          }}
                          placeholder="#ffffff"
                        />
                        <div 
                          className="h-9 rounded-md border" 
                          style={{ background: brandSettings.withdrawalPage?.bankButtonTextColor || "#ffffff" }}
                        ></div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div 
                        className="w-full h-12 rounded-xl shadow-md flex items-center justify-center transition-all duration-200 hover:shadow-lg" 
                        style={{ 
                          background: `linear-gradient(to right, ${brandSettings.withdrawalPage?.bankButtonBgFrom || "#3b82f6"}, ${brandSettings.withdrawalPage?.bankButtonBgTo || "#2563eb"})`,
                          color: brandSettings.withdrawalPage?.bankButtonTextColor || "#ffffff"
                        }}
                      >
                        บันทึกข้อมูลบัญชี
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t">
                  <h3 className="text-base font-medium mb-3">ปุ่มถอนเงิน</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label htmlFor="withdraw-button-bg-from">สีปุ่มเริ่มต้น (Gradient)</Label>
                      </div>
                      <div className="flex space-x-2">
                        <Input
                          id="withdraw-button-bg-from"
                          type="text"
                          value={brandSettings.withdrawalPage?.withdrawButtonBgFrom || "#10b981"}
                          onChange={(e) => {
                            const withdrawalPage = brandSettings.withdrawalPage || {
                              balanceCardBgFrom: "var(--primary-color)",
                              balanceCardBgTo: "var(--primary-dark)",
                              balanceCardTextColor: "#ffffff",
                              tabActiveColor: "var(--primary-color)",
                              tabTextColor: "#4b5563",
                              bankFormHeaderBgFrom: "#e6f7f7",
                              bankFormHeaderBgTo: "#e6f0ff",
                              withdrawFormHeaderBgFrom: "#e6f7f7", 
                              withdrawFormHeaderBgTo: "#e6f0ff",
                              bankButtonBgFrom: "#3b82f6",
                              bankButtonBgTo: "#2563eb",
                              bankButtonTextColor: "#ffffff",
                              withdrawButtonBgFrom: "#10b981",
                              withdrawButtonBgTo: "#059669",
                              withdrawButtonTextColor: "#ffffff"
                            };
                            setBrandSettings({
                              ...brandSettings,
                              withdrawalPage: {
                                ...withdrawalPage,
                                withdrawButtonBgFrom: e.target.value
                              }
                            });
                          }}
                          placeholder="#10b981"
                        />
                        <div 
                          className="h-9 rounded-md border" 
                          style={{ background: brandSettings.withdrawalPage?.withdrawButtonBgFrom || "#10b981" }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label htmlFor="withdraw-button-bg-to">สีปุ่มสิ้นสุด (Gradient)</Label>
                      </div>
                      <div className="flex space-x-2">
                        <Input
                          id="withdraw-button-bg-to"
                          type="text"
                          value={brandSettings.withdrawalPage?.withdrawButtonBgTo || "#059669"}
                          onChange={(e) => {
                            const withdrawalPage = brandSettings.withdrawalPage || {
                              balanceCardBgFrom: "var(--primary-color)",
                              balanceCardBgTo: "var(--primary-dark)",
                              balanceCardTextColor: "#ffffff",
                              tabActiveColor: "var(--primary-color)",
                              tabTextColor: "#4b5563",
                              bankFormHeaderBgFrom: "#e6f7f7",
                              bankFormHeaderBgTo: "#e6f0ff",
                              withdrawFormHeaderBgFrom: "#e6f7f7", 
                              withdrawFormHeaderBgTo: "#e6f0ff",
                              bankButtonBgFrom: "#3b82f6",
                              bankButtonBgTo: "#2563eb",
                              bankButtonTextColor: "#ffffff",
                              withdrawButtonBgFrom: "#10b981",
                              withdrawButtonBgTo: "#059669",
                              withdrawButtonTextColor: "#ffffff"
                            };
                            setBrandSettings({
                              ...brandSettings,
                              withdrawalPage: {
                                ...withdrawalPage,
                                withdrawButtonBgTo: e.target.value
                              }
                            });
                          }}
                          placeholder="#059669"
                        />
                        <div 
                          className="h-9 rounded-md border" 
                          style={{ background: brandSettings.withdrawalPage?.withdrawButtonBgTo || "#059669" }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label htmlFor="withdraw-button-text-color">สีข้อความปุ่ม</Label>
                      </div>
                      <div className="flex space-x-2">
                        <Input
                          id="withdraw-button-text-color"
                          type="text"
                          value={brandSettings.withdrawalPage?.withdrawButtonTextColor || "#ffffff"}
                          onChange={(e) => {
                            const withdrawalPage = brandSettings.withdrawalPage || {
                              balanceCardBgFrom: "var(--primary-color)",
                              balanceCardBgTo: "var(--primary-dark)",
                              balanceCardTextColor: "#ffffff",
                              tabActiveColor: "var(--primary-color)",
                              tabTextColor: "#4b5563",
                              bankFormHeaderBgFrom: "#e6f7f7",
                              bankFormHeaderBgTo: "#e6f0ff",
                              withdrawFormHeaderBgFrom: "#e6f7f7", 
                              withdrawFormHeaderBgTo: "#e6f0ff",
                              bankButtonBgFrom: "#3b82f6",
                              bankButtonBgTo: "#2563eb",
                              bankButtonTextColor: "#ffffff",
                              withdrawButtonBgFrom: "#10b981",
                              withdrawButtonBgTo: "#059669",
                              withdrawButtonTextColor: "#ffffff"
                            };
                            setBrandSettings({
                              ...brandSettings,
                              withdrawalPage: {
                                ...withdrawalPage,
                                withdrawButtonTextColor: e.target.value
                              }
                            });
                          }}
                          placeholder="#ffffff"
                        />
                        <div 
                          className="h-9 rounded-md border" 
                          style={{ background: brandSettings.withdrawalPage?.withdrawButtonTextColor || "#ffffff" }}
                        ></div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div 
                        className="w-full h-12 rounded-xl shadow-md flex items-center justify-center transition-all duration-200 hover:shadow-lg" 
                        style={{ 
                          background: `linear-gradient(to right, ${brandSettings.withdrawalPage?.withdrawButtonBgFrom || "#10b981"}, ${brandSettings.withdrawalPage?.withdrawButtonBgTo || "#059669"})`,
                          color: brandSettings.withdrawalPage?.withdrawButtonTextColor || "#ffffff"
                        }}
                      >
                        ยืนยันการถอนเงิน
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}