import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAllReports, useUpdateReport, useBanUser, useIsAdmin } from "@/hooks/useReports";
import { useAllUsers } from "@/hooks/useUsers";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { getUserFriendlyError, logError } from "@/lib/error-handler";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Shield, Ban, CheckCircle, XCircle, AlertCircle, Users, Search, Star } from "lucide-react";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Ожидает", variant: "secondary" },
  reviewed: { label: "Рассмотрено", variant: "default" },
  resolved: { label: "Решено", variant: "outline" },
  dismissed: { label: "Отклонено", variant: "destructive" },
};

const Admin = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const { data: reports, isLoading: reportsLoading } = useAllReports();
  const { data: allUsers, isLoading: usersLoading } = useAllUsers();
  const updateReport = useUpdateReport();
  const banUser = useBanUser();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("reports");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    } else if (!isAdminLoading && !isAdmin) {
      navigate("/");
      toast({
        variant: "destructive",
        title: "Доступ запрещен",
        description: "У вас нет прав администратора",
      });
    }
  }, [user, authLoading, isAdmin, isAdminLoading, navigate, toast]);

  const handleUpdateStatus = async (
    reportId: string,
    status: string,
    adminNotes?: string
  ) => {
    try {
      await updateReport.mutateAsync({
        id: reportId,
        status: status as any,
        admin_notes: adminNotes,
      });
      toast({
        title: "Статус обновлен",
      });
    } catch (error) {
      logError(error, "updateReport");
      const friendlyError = getUserFriendlyError(error);
      toast({
        variant: "destructive",
        title: friendlyError.title,
        description: friendlyError.description,
      });
    }
  };

  const handleBanUser = async (userId: string, isBanned: boolean) => {
    try {
      await banUser.mutateAsync({ userId, isBanned });
      toast({
        title: isBanned ? "Пользователь заблокирован" : "Пользователь разблокирован",
      });
    } catch (error) {
      logError(error, "banUser");
      const friendlyError = getUserFriendlyError(error);
      toast({
        variant: "destructive",
        title: friendlyError.title,
        description: friendlyError.description,
      });
    }
  };

  if (authLoading || isAdminLoading || reportsLoading || usersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Загрузка...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const pendingReports = reports?.filter((r) => r.status === "pending") || [];
  const otherReports = reports?.filter((r) => r.status !== "pending") || [];

  // Filter users by search query
  const filteredUsers = allUsers?.filter((user) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.full_name?.toLowerCase().includes(query) ||
      user.phone?.toLowerCase().includes(query) ||
      user.user_id.toLowerCase().includes(query)
    );
  }) || [];

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container flex h-16 items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <Shield className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Панель модератора</h1>
        </div>
      </header>

      <div className="container py-4 sm:py-6 space-y-4 sm:space-y-6 pb-24 md:pb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6">
            <TabsTrigger value="reports" className="gap-1 sm:gap-2 text-xs sm:text-sm">
              <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Жалобы</span>
              <span className="sm:hidden">Жалобы</span>
              <span className="text-[10px] sm:text-xs">({reports?.length || 0})</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-1 sm:gap-2 text-xs sm:text-sm">
              <Users className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Пользователи</span>
              <span className="sm:hidden">Пользователи</span>
              <span className="text-[10px] sm:text-xs">({allUsers?.length || 0})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="space-y-4 sm:space-y-6">
            <div className="bg-card rounded-2xl p-4 sm:p-6 shadow-card">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-warning" />
                Ожидают рассмотрения ({pendingReports.length})
              </h2>

              {pendingReports.length > 0 ? (
                <div className="space-y-4">
                  {pendingReports.map((report) => (
                    <ReportCard
                      key={report.id}
                      report={report}
                      onUpdateStatus={handleUpdateStatus}
                      onBanUser={handleBanUser}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Нет жалоб, ожидающих рассмотрения</p>
              )}
            </div>

            {otherReports.length > 0 && (
              <div className="bg-card rounded-2xl p-4 sm:p-6 shadow-card">
                <h2 className="text-lg font-bold mb-4">Остальные жалобы</h2>
                <div className="space-y-4">
                  {otherReports.map((report) => (
                    <ReportCard
                      key={report.id}
                      report={report}
                      onUpdateStatus={handleUpdateStatus}
                      onBanUser={handleBanUser}
                    />
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="users" className="space-y-4 sm:space-y-6">
            <div className="bg-card rounded-2xl p-4 sm:p-6 shadow-card">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4">
                <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Все пользователи</span>
                  <span className="sm:hidden">Пользователи</span>
                  <span className="text-sm sm:text-base">({filteredUsers.length})</span>
                </h2>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Поиск пользователей..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 text-sm sm:text-base"
                  />
                </div>
              </div>

              {filteredUsers.length > 0 ? (
                <div className="space-y-3">
                  {filteredUsers.map((user) => (
                    <UserCard
                      key={user.user_id}
                      user={user}
                      onBanUser={handleBanUser}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  {searchQuery ? "Пользователи не найдены" : "Нет пользователей"}
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

interface ReportCardProps {
  report: any;
  onUpdateStatus: (id: string, status: string, notes?: string) => void;
  onBanUser: (userId: string, isBanned: boolean) => void;
}

const ReportCard = ({ report, onUpdateStatus, onBanUser }: ReportCardProps) => {
  const [status, setStatus] = useState(report.status);
  const [notes, setNotes] = useState(report.admin_notes || "");
  const [showNotesDialog, setShowNotesDialog] = useState(false);

  return (
    <div className="border rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={statusLabels[report.status].variant}>
              {statusLabels[report.status].label}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {format(new Date(report.created_at), "d MMM yyyy, HH:mm", { locale: ru })}
            </span>
          </div>
          <p className="font-medium">
            Жалоба на: {report.reported_user?.full_name || "Пользователь"}
          </p>
          <p className="text-sm text-muted-foreground">
            От: {report.reporter?.full_name || "Аноним"}
          </p>
          {report.ride && (
            <p className="text-sm text-muted-foreground">
              Поездка: {report.ride.from_city} → {report.ride.to_city}
            </p>
          )}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium mb-1">Причина: {report.reason}</p>
        {report.description && (
          <p className="text-sm text-muted-foreground">{report.description}</p>
        )}
      </div>

      {report.admin_notes && (
        <div className="bg-muted rounded-lg p-3">
          <p className="text-xs font-medium mb-1">Заметки модератора:</p>
          <p className="text-sm">{report.admin_notes}</p>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Ожидает</SelectItem>
            <SelectItem value="reviewed">Рассмотрено</SelectItem>
            <SelectItem value="resolved">Решено</SelectItem>
            <SelectItem value="dismissed">Отклонено</SelectItem>
          </SelectContent>
        </Select>

        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowNotesDialog(true)}
        >
          Заметки
        </Button>

        <Button
          size="sm"
          variant="destructive"
          onClick={() => onBanUser(report.reported_user_id, true)}
        >
          <Ban className="w-4 h-4 mr-1" />
          Заблокировать
        </Button>

        <Button
          size="sm"
          onClick={() => onUpdateStatus(report.id, status, notes)}
        >
          Сохранить
        </Button>
      </div>

      <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Заметки модератора</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Заметки</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Добавьте заметки о рассмотрении жалобы..."
            />
            <Button onClick={() => {
              onUpdateStatus(report.id, status, notes);
              setShowNotesDialog(false);
            }}>
              Сохранить
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface UserCardProps {
  user: any;
  onBanUser: (userId: string, isBanned: boolean) => void;
}

const UserCard = ({ user, onBanUser }: UserCardProps) => {
  return (
    <div className="border rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative">
            <img
              src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || "U")}&background=0d9488&color=fff`}
              alt={user.full_name || "Пользователь"}
              className="w-12 h-12 rounded-full object-cover border-2 border-border"
            />
            {user.is_banned && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-destructive flex items-center justify-center ring-2 ring-card">
                <Ban className="w-3 h-3 text-destructive-foreground" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-medium truncate">{user.full_name || "Без имени"}</p>
              {user.is_admin && (
                <Badge variant="default" className="gap-1 text-xs">
                  <Shield className="w-3 h-3" />
                  Админ
                </Badge>
              )}
              {user.is_verified && (
                <Badge variant="soft" className="gap-1 text-xs">
                  <CheckCircle className="w-3 h-3" />
                  Проверен
                </Badge>
              )}
              {user.is_banned && (
                <Badge variant="destructive" className="gap-1 text-xs">
                  <Ban className="w-3 h-3" />
                  Заблокирован
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              {user.phone && <span>{user.phone}</span>}
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-warning text-warning" />
                <span>{user.rating?.toFixed(1) || "5.0"}</span>
              </div>
              <span>{user.trips_count || 0} поездок</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              ID: {user.user_id.substring(0, 8)}...
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant={user.is_banned ? "default" : "destructive"}
            onClick={() => onBanUser(user.user_id, !user.is_banned)}
          >
            <Ban className="w-4 h-4 mr-1" />
            {user.is_banned ? "Разблокировать" : "Заблокировать"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Admin;

