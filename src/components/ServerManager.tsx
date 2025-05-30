import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { useUser } from "@/hooks/useUser";
import { Plus, RefreshCw, Search } from "lucide-react";
import { ServerStatusCard } from "./ServerStatusCard";
import { ServerStatusFilter } from "./ServerStatusFilter";
import { ServerCardSkeleton } from "./ServerCardSkeleton";

interface ProxyServer {
  id: string;
  proxy_ip: string;
  port: number;
  type: 'HTTP' | 'HTTPS' | 'SOCKS4' | 'SOCKS5';
  auth_required: boolean;
  username: string | null;
  is_active: boolean;
  last_checked: string | null;
  response_time_ms: number | null;
  status: 'online' | 'offline' | 'slow' | 'unreachable';
  created_at: string;
  created_by: string | null;
}

interface ServerWithLogs extends ProxyServer {
  updated_at?: string;
  server_monitoring_logs?: {
    status: string;
    response_time_ms: number | null;
    status_code: number | null;
    error_message: string | null;
    checked_at: string;
  }[];
}

export function ServerManager() {
  const [servers, setServers] = useState<ServerWithLogs[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [serverToUpdate, setServerToUpdate] = useState<ProxyServer | null>(null);
  const [activeFilter, setActiveFilter] = useState<"All" | "Online" | "Offline" | "Slow" | "Unreachable">("All");
  const [is_Monitoring, setIs_Monitoring] = useState(() => {
    const stored = localStorage.getItem("is_Server_Monitoring");
    return stored ? JSON.parse(stored) : false;
  });

  useEffect(() => {
    localStorage.setItem("is_Server_Monitoring", JSON.stringify(is_Monitoring));
  }, [is_Monitoring]);

  const [formData, setFormData] = useState({
    proxy_ip: "",
    port: "",
    type: "HTTP",
    auth_required: false,
    username: "",
  });

  const [UpdateformData, setUpdateFormData] = useState({
    proxy_ip: "",
    port: "",
    type: "HTTP",
    auth_required: false,
    username: "",
  });

  const statusCounts = {
    all: servers.length,
    online: servers.filter((s) => s.status === "online").length,
    offline: servers.filter((s) => s.status === "offline").length,
    slow: servers.filter((s) => s.status === "slow").length,
    unreachable: servers.filter((s) => s.status === "unreachable").length,
  };

  const { user } = useUser();
  const userId = user?.id;

  const handleNewServerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const now = new Date().toISOString();
      if (formData.proxy_ip.trim() === "") {
        throw new Error("Please enter a valid proxy IP");
      }

      if (!formData.port || isNaN(Number(formData.port))) {
        throw new Error("Please enter a valid port number");
      }

      // Check if the proxy server already exists
      const { data: existingServer, error: serverError } = await supabase
        .from("proxy_servers")
        .select("id")
        .eq("proxy_ip", formData.proxy_ip)
        .eq("port", formData.port)
        .eq("is_active", true);

      if (serverError) throw serverError;
      if (existingServer && existingServer.length > 0) {
        throw new Error("A proxy server with this IP and port already exists");
      }

      const newServer = {
        proxy_ip: formData.proxy_ip,
        port: parseInt(formData.port),
        type: formData.type,
        auth_required: formData.auth_required,
        username: formData.auth_required ? formData.username : null,
        is_active: true,
        status: "offline",
        created_by: userId,
        created_at: now,
      };

      const { data, error } = await supabase
        .from("proxy_servers")
        .insert([newServer])
        .select();

      if (error) throw error;

      if (data?.[0]) {
        setServers((prev) => [data[0], ...prev]);
      }

      setFormData({
        proxy_ip: "",
        port: "",
        type: "HTTP",
        auth_required: false,
        username: "",
      });
      setIsOpen(false);

      toast({
        title: "Success",
        description: "Proxy server added successfully",
        variant: "success",
      });
    } catch (error) {
      console.error("Error adding proxy server:", error);
      toast({
        title: "Error",
        description: error.message || "Could not add proxy server",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDialogOpen = (open: boolean) => {
    setIsOpen(open);
  };

  const handleUpdateDialogOpen = (open: boolean) => {
    setIsUpdateOpen(open);
  };

  const confirmDelete = async () => {
    if (!selectedServerId || isDeleting) return;

    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from("proxy_servers")
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedServerId)
        .select();

      if (error) throw error;

      setServers((servers) =>
        servers.filter((server) => server.id !== selectedServerId)
      );
      toast({
        title: "Success",
        description: "Proxy server deleted successfully",
        variant: "success",
      });
      setConfirmOpen(false);
      setSelectedServerId(null);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Could not delete proxy server",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdate = (server: ProxyServer) => {
    setServerToUpdate(server);
    setUpdateFormData({
      proxy_ip: server.proxy_ip,
      port: server.port.toString(),
      type: server.type,
      auth_required: server.auth_required,
      username: server.username || "",
    });
    setIsUpdateOpen(true);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverToUpdate) return;

    setIsLoading(true);

    try {
      if (UpdateformData.proxy_ip.trim() === "") {
        throw new Error("Please enter a valid proxy IP");
      }

      if (!UpdateformData.port || isNaN(Number(UpdateformData.port))) {
        throw new Error("Please enter a valid port number");
      }

      const { data, error } = await supabase
        .from("proxy_servers")
        .update({
          proxy_ip: UpdateformData.proxy_ip,
          port: parseInt(UpdateformData.port),
          type: UpdateformData.type,
          auth_required: UpdateformData.auth_required,
          username: UpdateformData.auth_required ? UpdateformData.username : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", serverToUpdate.id)
        .select(`
          *,
          server_monitoring_logs (
            status,
            response_time_ms,
            status_code,
            checked_at
          )
        `);

      if (error) throw error;

      if (data?.[0]) {
        const updatedServer: ServerWithLogs = {
          ...serverToUpdate,
          proxy_ip: data[0].proxy_ip,
          port: data[0].port,
          type: data[0].type,
          auth_required: data[0].auth_required,
          username: data[0].username,
          updated_at: data[0].updated_at,
          server_monitoring_logs: data[0].server_monitoring_logs,
        };

        setServers((prev) =>
          prev.map((server) =>
            server.id === updatedServer.id ? updatedServer : server
          )
        );

        toast({
          title: "Success",
          description: "Proxy server updated successfully",
          variant: "success",
        });
      }

      setIsUpdateOpen(false);
      setServerToUpdate(null);
      setUpdateFormData({
        proxy_ip: "",
        port: "",
        type: "HTTP",
        auth_required: false,
        username: "",
      });
    } catch (error) {
      console.error("Error updating proxy server:", error);
      toast({
        title: "Error",
        description: error.message || "Could not update proxy server",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchServers = async () => {
    if (!userId) return;

    let freshData = [];

    try {
      setIsLoading((prev) => (!prev ? true : prev));

      await new Promise((resolve) => setTimeout(resolve, 500));

      const { data, error } = await supabase
        .from("proxy_servers")
        .select(`
          *,
          server_monitoring_logs (
            status,
            response_time_ms,
            status_code,
            error_message,
            checked_at
          )
        `)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      freshData = data || [];
    } catch (error) {
      console.error("Error fetching proxy servers:", error);
      toast({
        title: "Error",
        description: "Could not refresh/load proxy servers.",
        variant: "destructive",
      });
    } finally {
      setServers((prev) => {
        if (JSON.stringify(prev) !== JSON.stringify(freshData)) {
          return freshData;
        }
        return prev;
      });

      setLastUpdated(new Date());
      setTimeout(() => setIsLoading(false), 200);
    }
  };

  useEffect(() => {
    fetchServers();

    if (!is_Monitoring) return;

    const intervalId = setInterval(() => {
      fetchServers();
    }, 35000);

    return () => clearInterval(intervalId);
  }, [userId, is_Monitoring]);

  const sortByStatus = (servers: ServerWithLogs[]) => {
    const statusPriority = {
      offline: 1,
      unreachable: 2,
      slow: 3,
      online: 4,
    };

    return [...servers].sort((a, b) => {
      return statusPriority[a.status] - statusPriority[b.status];
    });
  };

  const combinedFilteredServers = sortByStatus(
    servers
      .filter((server) => {
        if (activeFilter !== "All") {
          return server.status === activeFilter.toLowerCase();
        }
        return true;
      })
      .filter((server) => {
        const query = searchQuery.toLowerCase().trim();
        return (
          server.proxy_ip.toLowerCase().includes(query) ||
          server.type.toLowerCase().includes(query)
        );
      })
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Dialog open={isOpen} onOpenChange={handleDialogOpen}>
          <div className="relative w-60">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground/60" />
            <Input
              placeholder="Search servers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm"
            />
          </div>
          <ServerStatusFilter
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            counts={statusCounts}
          />
          <DialogTrigger asChild>
            <Button onClick={() => setFormData({
              proxy_ip: "",
              port: "",
              type: "HTTP",
              auth_required: false,
              username: "",
            })}>
              <Plus className="mr-2 h-6 w-6" />
              Add Server
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-center">Add New Proxy Server</DialogTitle>
            </DialogHeader>
            <form className="space-y-4" onSubmit={handleNewServerSubmit}>
              <label className="block text-sm font-medium text-gray-700 ml-1">
                Proxy IP<span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Enter proxy IP"
                value={formData.proxy_ip}
                onChange={(e) =>
                  setFormData({ ...formData, proxy_ip: e.target.value })
                }
                required
              />
              <label className="block text-sm font-medium text-gray-700 mt-2 ml-1">
                Port<span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Enter port number"
                type="number"
                value={formData.port}
                onChange={(e) =>
                  setFormData({ ...formData, port: e.target.value })
                }
                required
              />
              <label className="block text-sm font-medium text-gray-700 mt-2 ml-1">
                Type<span className="text-red-500">*</span>
              </label>
              <select
                className="w-full p-2 border rounded-md"
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value as any })
                }
                required
              >
                <option value="HTTP">HTTP</option>
                <option value="HTTPS">HTTPS</option>
                <option value="SOCKS4">SOCKS4</option>
                <option value="SOCKS5">SOCKS5</option>
              </select>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="auth_required"
                  checked={formData.auth_required}
                  onChange={(e) =>
                    setFormData({ ...formData, auth_required: e.target.checked })
                  }
                />
                <label htmlFor="auth_required">Authentication Required</label>
              </div>
              {formData.auth_required && (
                <>
                  <label className="block text-sm font-medium text-gray-700 ml-1">
                    Username<span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Enter username"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    required={formData.auth_required}
                  />
                </>
              )}
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Adding..." : "Add Server"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Are you sure?</DialogTitle>
            </DialogHeader>
            <p>
              This will permanently delete the proxy server. This action cannot be
              undone.
            </p>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Button
          variant="outline"
          className={`
            ml-4 flex items-center gap-4 px-3 py-3
            rounded-full border-[3px] transition-all duration-500 ease-in-out
            transform hover:scale-102 group relative
            backdrop-blur-sm
            ${
              is_Monitoring
                ? "border-emerald-400/50 bg-gradient-to-r from-emerald-500/90 to-green-400/90 text-white shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:from-emerald-400 hover:to-green-300"
                : "border-zinc-300/50 bg-gradient-to-r from-zinc-100/90 to-slate-50/90 text-zinc-700 shadow-zinc-300/20 hover:shadow-zinc-300/40 hover:from-zinc-200 hover:to-slate-100"
            }
          `}
          onClick={() => setIs_Monitoring((prev) => !prev)}
        >
          <div
            className={`
              absolute inset-0 rounded-full blur-xl transition-opacity duration-500
              ${is_Monitoring ? "opacity-40" : "opacity-0"}
              ${is_Monitoring ? "bg-emerald-400" : "bg-zinc-400"}
            `}
          />
          <div
            className={`
              w-12 h-7 rounded-full transition-all duration-500 ease-in-out flex items-center
              ${is_Monitoring ? "bg-emerald-400/20" : "bg-zinc-200/50"}
              backdrop-blur-sm border-2
              ${is_Monitoring ? "border-white/30" : "border-zinc-300/30"}
            `}
          >
            <div
              className={`
                absolute w-5 h-5 rounded-full transition-all duration-500 ease-in-out
                ${is_Monitoring ? "translate-x-6" : "translate-x-1"}
                ${is_Monitoring ? "bg-white" : "bg-zinc-400"}
                shadow-lg
                flex items-center justify-center
              `}
            >
              <div
                className={`
                  absolute inset-0 rounded-full
                  ${is_Monitoring ? "animate-ping bg-white/50" : "bg-transparent"}
                `}
              />
              <div
                className={`
                  w-2 h-2 rounded-full transition-all duration-500
                  ${
                    is_Monitoring ? "bg-emerald-500 scale-100" : "bg-zinc-500 scale-0"
                  }
                `}
              />
            </div>
          </div>
          {is_Monitoring ? (
            <>
              <span className="inline-block w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="animate-gradient-text bg-gradient-to-r from-white to-emerald-100">
                Monitoring Active
              </span>
            </>
          ) : (
            <span className="text-zinc-600">Monitoring Paused</span>
          )}
          <div className="absolute -z-10 inset-0 overflow-hidden rounded-full">
            {is_Monitoring && (
              <>
                <div className="absolute -top-4 -right-4 w-8 h-8 rounded-full bg-emerald-300/20 blur-md animate-pulse" />
                <div className="absolute -bottom-4 -left-4 w-8 h-8 rounded-full bg-green-300/20 blur-md animate-pulse delay-100" />
              </>
            )}
          </div>
        </Button>

        <div className="w-64 flex border p-1 items-center gap-1 text-muted-foreground rounded-full justify-evenly">
          <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
          <button
            onClick={fetchServers}
            disabled={isLoading}
            className="rounded-full hover:bg-muted"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <hr className="my-6 border-t-2 border-gray-200 dark:border-zinc-700 rounded-full shadow-sm" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <>
            {[...Array(6)].map((_, index) => (
              <ServerCardSkeleton key={index} />
            ))}
          </>
        ) : combinedFilteredServers.length === 0 ? (
          <div className="col-span-full text-center py-10 text-muted-foreground">
            {servers.length === 0 ? (
              "No proxy servers added yet"
            ) : searchQuery ? (
              <>
                <p className="text-lg">
                  No proxy servers found matching your search.
                </p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-sm text-primary hover:underline mt-2"
                >
                  Clear search
                </button>
              </>
            ) : (
              `No ${activeFilter.toLowerCase()} proxy servers found`
            )}
          </div>
        ) : (
          combinedFilteredServers.map((server) => (
            <ServerStatusCard
              key={server.id}
              server={server}
              onDelete={() => {
                setSelectedServerId(server.id);
                setConfirmOpen(true);
              }}
              onUpdate={() => handleUpdate(server)}
              isMonitoring={is_Monitoring}
            />
          ))
        )}
      </div>

      <Dialog open={isUpdateOpen} onOpenChange={handleUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Proxy Server</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateSubmit} className="space-y-4">
            <label className="block text-sm font-medium text-gray-700 ml-1">
              Proxy IP<span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Proxy IP"
              value={UpdateformData.proxy_ip}
              onChange={(e) =>
                setUpdateFormData({ ...UpdateformData, proxy_ip: e.target.value })
              }
              required
            />
            <label className="block text-sm font-medium text-gray-700 mt-2 ml-1">
              Port<span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Port number"
              type="number"
              value={UpdateformData.port}
              onChange={(e) =>
                setUpdateFormData({ ...UpdateformData, port: e.target.value })
              }
              required
            />
            <label className="block text-sm font-medium text-gray-700 mt-2 ml-1">
              Type<span className="text-red-500">*</span>
            </label>
            <select
              className="w-full p-2 border rounded-md"
              value={UpdateformData.type}
              onChange={(e) =>
                setUpdateFormData({ ...UpdateformData, type: e.target.value as any })
              }
              required
            >
              <option value="HTTP">HTTP</option>
              <option value="HTTPS">HTTPS</option>
              <option value="SOCKS4">SOCKS4</option>
              <option value="SOCKS5">SOCKS5</option>
            </select>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="update_auth_required"
                checked={UpdateformData.auth_required}
                onChange={(e) =>
                  setUpdateFormData({ ...UpdateformData, auth_required: e.target.checked })
                }
              />
              <label htmlFor="update_auth_required">Authentication Required</label>
            </div>
            {UpdateformData.auth_required && (
              <>
                <label className="block text-sm font-medium text-gray-700 ml-1">
                  Username<span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="Username"
                  value={UpdateformData.username}
                  onChange={(e) =>
                    setUpdateFormData({ ...UpdateformData, username: e.target.value })
                  }
                  required={UpdateformData.auth_required}
                />
              </>
            )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsUpdateOpen(false);
                  setServerToUpdate(null);
                  setUpdateFormData({
                    proxy_ip: "",
                    port: "",
                    type: "HTTP",
                    auth_required: false,
                    username: "",
                  });
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Updating..." : "Update Server"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 