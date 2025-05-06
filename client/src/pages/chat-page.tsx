import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, Loader2, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import ChatInterface from "@/components/chat-interface";
import BottomNavigation from "@/components/bottom-navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export default function ChatPage() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const params = useParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Get chat partners
  const {
    data: chatUsers,
    isLoading,
    refetch,
  } = useQuery<User[]>({
    queryKey: ["/api/chat-users"],
    enabled: !!user,
  });

  // Find selected user when route parameter exists
  useEffect(() => {
    if (params.userId && chatUsers) {
      const userId = parseInt(params.userId);
      const user = chatUsers.find((u) => u.id === userId);
      if (user) {
        setSelectedUser(user);
      }
    }
  }, [params.userId, chatUsers]);

  const handleUserSelect = (chatUser: User) => {
    setSelectedUser(chatUser);
    navigate(`/chat/${chatUser.id}`);
  };

  const handleBack = () => {
    setSelectedUser(null);
    navigate("/chat");
  };

  const filteredUsers = chatUsers?.filter((chatUser) =>
    chatUser.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // If no selected user and URL has userId, show chat interface
  if (params.userId && !selectedUser) {
    return (
      <div className="min-h-screen bg-light flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  // If selected user, show chat interface
  if (selectedUser) {
    return (
      <ChatInterface
        receiverId={selectedUser.id}
        receiver={selectedUser}
        onBack={handleBack}
      />
    );
  }

  // Otherwise show chat user list
  return (
    <div className="min-h-screen bg-light flex flex-col">
      <div className="bg-[#1a2942] text-white p-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate("/")}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20 mr-4"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-xl font-semibold">การสนทนา</h1>
        </div>
      </div>

      <div className="flex-grow flex flex-col pb-20">
        <div className="border-b">
          <div className="px-4 py-2">
            <div className="relative">
              <Input
                type="text"
                placeholder="ค้นหา..."
                className="bg-gray-100 rounded-full py-1 px-4 text-sm pl-8 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-2 text-gray-400 h-4 w-4" />
            </div>
          </div>
        </div>

        <div className="overflow-y-auto flex-grow">
          {isLoading ? (
            // Loading skeleton
            Array(4)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  className="p-4 border-b flex justify-between items-center"
                >
                  <div className="flex items-center">
                    <Skeleton className="w-12 h-12 rounded-full mr-3" />
                    <div>
                      <Skeleton className="h-5 w-32 mb-1" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </div>
                  <div className="text-right">
                    <Skeleton className="h-3 w-10" />
                  </div>
                </div>
              ))
          ) : filteredUsers && filteredUsers.length > 0 ? (
            filteredUsers.map((chatUser) => (
              <div
                key={chatUser.id}
                className="p-4 border-b flex justify-between items-center hover:bg-gray-50 cursor-pointer"
                onClick={() => handleUserSelect(chatUser)}
              >
                <div className="flex items-center">
                  <Avatar className="w-12 h-12 mr-3">
                    <AvatarFallback className="bg-gray-200 text-gray-600">
                      {chatUser.fullName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium">{chatUser.fullName}</h4>
                    <p className="text-xs text-gray-500">
                      {chatUser.isAdmin
                        ? "ฝ่ายบริการลูกค้า"
                        : chatUser.email}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    {format(new Date(), "HH:mm", { locale: th })}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center text-gray-500 h-64">
              <p className="mb-2">ยังไม่มีการสนทนา</p>
              <p className="text-sm">
                เริ่มต้นสนทนากับฝ่ายบริการลูกค้าเพื่อสอบถามข้อมูลเกี่ยวกับการกู้เงิน
              </p>
              <button
                onClick={() => refetch()}
                className="mt-4 text-[#16a5a3] font-medium"
              >
                รีเฟรช
              </button>
            </div>
          )}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}
