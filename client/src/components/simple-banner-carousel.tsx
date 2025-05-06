import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

// Interface for the banner items
interface BannerItem {
  id: number;
  imageUrl: string;
  title: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  backgroundColor: string;
}

// Load slides from brand settings
function useBrandSlides() {
  const [slides, setSlides] = useState<BannerItem[]>([
    {
      id: 1,
      imageUrl: "/images/banner-1.svg",
      title: "สินเชื่อส่วนบุคคล",
      description: "วงเงินสูงสุด 2 ล้านบาท ดอกเบี้ยเริ่มต้น 9.99% ต่อปี",
      buttonText: "สมัครเลย",
      buttonLink: "/loan",
      backgroundColor: "#e6b54a",
    },
    {
      id: 2,
      imageUrl: "/images/banner-2.svg",
      title: "รู้ผลอนุมัติไว",
      description: "ยื่นกู้ผ่านแอป รู้ผลไวใน 1 วัน ไม่ต้องใช้หลักทรัพย์",
      buttonText: "เช็ควงเงิน",
      buttonLink: "/loan",
      backgroundColor: "#16a5a3",
    },
    {
      id: 3,
      imageUrl: "/images/banner-3.svg",
      title: "ผ่อนสบาย 60 เดือน",
      description: "เงินก้อนใหญ่ผ่อนสบายสูงสุด 60 เดือน",
      buttonText: "ดูรายละเอียด",
      buttonLink: "/chat",
      backgroundColor: "#5d4a4a",
    },
  ]);
  
  useEffect(() => {
    const fetchBrandSettings = async () => {
      try {
        const response = await fetch('/api/settings/brand');
        if (response.ok) {
          const data = await response.json();
          if (data.homePage && data.homePage.bannerSlides) {
            setSlides(data.homePage.bannerSlides);
          }
        }
      } catch (error) {
        console.error('Failed to load banner slides:', error);
      }
    };
    
    fetchBrandSettings();
  }, []);
  
  return slides;
};

interface SimpleBannerCarouselProps {
  banners?: BannerItem[];
  initialBannerIndex?: number;
}

export default function SimpleBannerCarousel({
  banners,
  initialBannerIndex = 0,
}: SimpleBannerCarouselProps) {
  const brandSlides = useBrandSlides();
  const slidesToUse = banners || brandSlides;
  const [activeBanner, setActiveBanner] = React.useState(initialBannerIndex);
  
  const nextBanner = () => {
    setActiveBanner((prev) => (prev + 1) % slidesToUse.length);
  };
  
  const prevBanner = () => {
    setActiveBanner((prev) => (prev - 1 + slidesToUse.length) % slidesToUse.length);
  };
  
  React.useEffect(() => {
    const interval = setInterval(nextBanner, 5000);
    return () => clearInterval(interval);
  }, []);

  const currentBanner = slidesToUse[activeBanner];

  return (
    <div className="relative pb-6">
      <div
        className="relative h-[250px] w-full rounded-xl overflow-hidden flex flex-col justify-center p-0 transition-all duration-300"
        style={{ backgroundColor: currentBanner.backgroundColor }}
      >
        {/* Full-width image container */}
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
          <img 
            src={currentBanner.imageUrl} 
            alt={currentBanner.title} 
            className="w-full h-full object-cover z-10" 
          />
        </div>
        {/* Text content with darker overlay for readability */}
        <div className="absolute bottom-0 left-0 w-full p-6 text-white z-20 bg-gradient-to-t from-black/70 to-transparent">
          <h2 className="text-xl font-bold mb-2">{currentBanner.title}</h2>
          <p className="text-sm mb-4 opacity-90">{currentBanner.description}</p>
          <Link href={currentBanner.buttonLink}>
            <Button 
              variant="secondary" 
              className="mt-2 bg-white text-gray-800 hover:bg-gray-100"
            >
              {currentBanner.buttonText}
            </Button>
          </Link>
        </div>
        
        {/* Navigation arrows */}
        <button 
          onClick={prevBanner}
          className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/30 rounded-full p-1 text-white hover:bg-white/50 transition"
          aria-label="Previous banner"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        
        <button 
          onClick={nextBanner}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/30 rounded-full p-1 text-white hover:bg-white/50 transition"
          aria-label="Next banner"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
      
      {/* Indicators */}
      <div className="flex justify-center mt-4">
        {slidesToUse.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 rounded-full mx-1 transition-all duration-300 ${
              activeBanner === index ? "bg-primary w-4" : "bg-gray-300"
            }`}
            onClick={() => setActiveBanner(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}