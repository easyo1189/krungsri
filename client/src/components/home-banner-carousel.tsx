import React, { useState, useEffect } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
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

// Default banner items
const defaultBanners: BannerItem[] = [
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
];

interface HomeBannerCarouselProps {
  banners?: BannerItem[];
  autoPlay?: boolean;
  interval?: number;
}

export default function HomeBannerCarousel({
  banners = defaultBanners,
  autoPlay = true,
  interval = 5000,
}: HomeBannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [api, setApi] = useState<any>(null);

  // Set up auto-scrolling if autoPlay is true
  useEffect(() => {
    if (!autoPlay || !api) return;

    const intervalId = setInterval(() => {
      if (api.canScrollNext && api.canScrollNext()) {
        api.scrollNext();
      } else {
        api.scrollTo && api.scrollTo(0);
      }
    }, interval);

    return () => clearInterval(intervalId);
  }, [api, autoPlay, interval]);

  // Update currentIndex when carousel slides
  useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      if (api.selectedScrollSnap) {
        setCurrentIndex(api.selectedScrollSnap());
      }
    };

    if (api.on) {
      api.on("select", onSelect);
      
      return () => {
        api.off && api.off("select", onSelect);
      };
    }
  }, [api]);

  return (
    <div className="relative pb-6">
      <Carousel setApi={setApi} opts={{
        loop: true,
        align: "start",
      }}>
        <CarouselContent>
          {banners.map((banner) => (
            <CarouselItem key={banner.id}>
              <div
                className="relative h-[200px] w-full rounded-xl overflow-hidden flex flex-col justify-center p-6"
                style={{ backgroundColor: banner.backgroundColor }}
              >
                <div className="absolute top-0 right-0 w-1/2 h-full flex items-center justify-center">
                  <img 
                    src={banner.imageUrl} 
                    alt={banner.title} 
                    className="max-h-[160px] object-contain z-10" 
                  />
                </div>
                <div className="w-1/2 text-white z-20">
                  <h2 className="text-xl font-bold mb-2">{banner.title}</h2>
                  <p className="text-sm mb-4 opacity-90">{banner.description}</p>
                  <Link href={banner.buttonLink}>
                    <Button 
                      variant="secondary" 
                      className="mt-2 bg-white text-gray-800 hover:bg-gray-100"
                    >
                      {banner.buttonText}
                    </Button>
                  </Link>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="flex justify-center mt-4">
          {banners.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full mx-1 transition-all duration-300 ${
                currentIndex === index ? "bg-primary w-4" : "bg-gray-300"
              }`}
              onClick={() => api?.scrollTo(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </Carousel>
    </div>
  );
}