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
import { ServerStatusCard } from "../components/ServerStatusCard";
import { ServerStatusFilter } from "../components/ServerStatusFilter";
import { ServerCardSkeleton } from "../components/ServerCardSkeleton";

interface ServerMetrics {
  id: string;
  hostname: string;
  detected_hostname: string | null;
  ip_address: string;
  os: string | null;
  cpu_percent: number | null;
  memory_percent: number | null;
  memory_total_gb: number | null;
  disk_percent: number | null;
  disk_total_gb: number | null;
  disk_used_gb: number | null;
  disk_free_gb: number | null;
  network_sent_mb: number | null;
  network_recv_mb: number | null;
  running_processes: number | null;
  health_status: "Healthy" | "Degraded" | "Offline" | "Intermittent";
  checked_at: string | null;
  created_at: string;
  updated_at: string;
}

export function ServerManager() {
  const [servers, setServers] = useState<ServerMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [serverToUpdate, setServerToUpdate] = useState<ServerMetrics | null>(null);
  const [activeFilter, setActiveFilter] = useState<
    "All" | "Healthy" | "Degraded" | "Offline" | "Intermittent"
  >("All");
  const [is_Monitoring_websites, setis_Monitoring_websites] = useState(() => {
    const stored = localStorage.getItem("is_Monitoring_servers");
    return stored ? JSON.parse(stored) : false;
  });

  useEffect(() => {
    localStorage.setItem("is_Monitoring_servers", JSON.stringify(is_Monitoring_websites));
  }, [is_Monitoring_websites]);

  const [formData, setFormData] = useState({
    hostname: "",
    ip_address: "",
  });

  const [UpdateformData, setUpdateFormData] = useState({
    hostname: "",
    ip_address: "",
  });

  const { user } = useUser();
  const userId = user?.id;

  const statusCounts = {
    all: servers.length,
    healthy: servers.filter((s) => s.health_status === "Healthy").length,
    degraded: servers.filter((s) => s.health_status === "Degraded").length,
    offline: servers.filter((s) => s.health_status === "Offline").length,
    intermittent: servers.filter((s) => s.health_status === "Intermittent").length,
  };

  const handleNewServerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const now = new Date().toISOString();
      if (formData.hostname.trim() === "") {
        throw new Error("Please enter a valid hostname");
      }

      if (!formData.ip_address.trim()) {
        throw new Error("Please enter a valid IP address");
      }

      // Check if the server already exists
      const { data: existingServer, error: fetchError } = await supabase
        .from("server_metrics")
        .select("id")
        .eq("hostname", formData.hostname)
        .eq("ip_address", formData.ip_address);

      if (fetchError) throw fetchError;
      if (existingServer && existingServer.length > 0) {
        throw new Error("A server with this hostname and IP already exists");
      }

      const newServer = {
        hostname: formData.hostname,
        ip_address: formData.ip_address,
        health_status: "Offline",
        checked_at: now,
        created_at: now,
        updated_at: now,
      };

      const { data, error } = await supabase
        .from("server_metrics")
        .insert([newServer])
        .select();

      if (error) throw error;

      if (data?.[0]) {
        setServers((prev) => [data[0], ...prev]);
      }

      setFormData({ hostname: "", ip_address: "" });
      setIsOpen(false);

      toast({
        title: "Success",
        description: "Server added successfully",
        variant: "success",
      });
    } catch (error) {
      console.error("Error adding server:", error);
      toast({
        title: "Error",
        description: error.message || "Could not add server",
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
        .from("server_metrics")
        .delete()
        .eq("id", selectedServerId);

      if (error) throw error;

      setServers((servers) =>
        servers.filter((server) => server.id !== selectedServerId)
      );
      toast({
        title: "Success",
        description: "Server deleted successfully",
        variant: "success",
      });
      setConfirmOpen(false);
      setSelectedServerId(null);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Could not delete server",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdate = (server: ServerMetrics) => {
    setServerToUpdate(server);
    setUpdateFormData({
      hostname: server.hostname,
      ip_address: server.ip_address,
    });
    setIsUpdateOpen(true);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverToUpdate) return;

    setIsLoading(true);
    try {
      if (UpdateformData.hostname.trim() === "") {
        throw new Error("Please enter a valid hostname");
      }

      if (!UpdateformData.ip_address.trim()) {
        throw new Error("Please enter a valid IP address");
      }

      const { data, error } = await supabase
        .from("server_metrics")
        .update({
          hostname: UpdateformData.hostname,
          ip_address: UpdateformData.ip_address,
          updated_at: new Date().toISOString(),
        })
        .eq("id", serverToUpdate.id)
        .select();

      if (error) throw error;

      if (data?.[0]) {
        setServers((prev) =>
          prev.map((server) =>
            server.id === serverToUpdate.id ? data[0] : server
          )
        );
        toast({
          title: "Success",
          description: "Server updated successfully",
          variant: "success",
        });
      }

      setIsUpdateOpen(false);
      setServerToUpdate(null);
      setUpdateFormData({ hostname: "", ip_address: "" });
    } catch (error) {
      console.error("Error updating server:", error);
      toast({
        title: "Error",
        description: error.message || "Could not update server",
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
        .from("server_metrics")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      freshData = data || [];
    } catch (error) {
      console.error("Error fetching servers:", error);
      toast({
        title: "Error",
        description: `Could not refresh/load servers.`,
        variant: "destructive",
      });
    }

    setServers((prev) => {
      if (JSON.stringify(prev) !== JSON.stringify(freshData)) {
        return freshData;
      }
      return prev;
    });

    setLastUpdated(new Date());
    setTimeout(() => setIsLoading(false), 200);
  };

  useEffect(() => {
    fetchServers();

    if (!is_Monitoring_websites) return;

    const intervalId = setInterval(() => {
      fetchServers();
    }, 55000);

    return () => clearInterval(intervalId);
  }, [userId, is_Monitoring_websites]);

  const sortByHealthStatus = (servers: ServerMetrics[]) => {
    const statusPriority = {
      Offline: 1,
      Degraded: 2,
      Intermittent: 3,
      Healthy: 4,
    };

    return [...servers].sort((a, b) => {
      return statusPriority[a.health_status] - statusPriority[b.health_status];
    });
  };

  const combinedFilteredServers = sortByHealthStatus(
    servers
      .filter((server) => {
        if (activeFilter !== "All") {
          return server.health_status === activeFilter;
        }
        return true;
      })
      .filter((server) => {
        const query = searchQuery.toLowerCase().trim();
        return (
          server.hostname.toLowerCase().includes(query) ||
          server.ip_address.toLowerCase().includes(query)
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
            <Button onClick={() => setFormData({ hostname: "", ip_address: "" })}>
              <Plus className="mr-2 h-6 w-6" />
              Add Server
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-center">Add New Server</DialogTitle>
            </DialogHeader>
            <form className="space-y-4" onSubmit={handleNewServerSubmit}>
              <label className="block text-sm font-medium text-gray-700 ml-1">
                Hostname<span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Enter hostname here"
                value={formData.hostname}
                onChange={(e) =>
                  setFormData({ ...formData, hostname: e.target.value })
                }
                required
              />
              <label className="block text-sm font-medium text-gray-700 mt-2 ml-1">
                IP Address<span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Enter IP address here"
                value={formData.ip_address}
                onChange={(e) =>
                  setFormData({ ...formData, ip_address: e.target.value })
                }
                required
              />

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
              This will permanently delete the server. This action cannot be
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
      </div>

      <div className="flex justify-start items-center gap-5 px-4">
        {/* Monitoring Toggle Button */}
        <Button
          variant="outline"
          className={`
            flex items-center gap-3 px-2 py-2
            rounded-full border-[2.5px] transition-all duration-500 ease-in-out
            transform hover:scale-102 group relative backdrop-blur-sm
            text-xs
            ${
              is_Monitoring_websites
                ? "border-emerald-400/50 bg-gradient-to-r from-emerald-500/90 to-green-400/90 text-white shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:from-emerald-400 hover:to-green-300"
                : "border-zinc-300/50 bg-gradient-to-r from-zinc-100/90 to-slate-50/90 text-zinc-700 shadow-zinc-300/20 hover:shadow-zinc-300/40 hover:from-zinc-200 hover:to-slate-100"
            }
          `}
          onClick={() => setis_Monitoring_websites((prev) => !prev)}
        >
          {/* Glow */}
          <div
            className={`
              absolute inset-0 rounded-full blur-xl transition-opacity duration-500
              ${is_Monitoring_websites ? "opacity-40 bg-emerald-400" : "opacity-0 bg-zinc-400"}
            `}
          />

          {/* Toggle */}
          <div className="relative">
            <div
              className={`
                w-10 h-6 rounded-full transition-all duration-500 flex items-center
                ${
                  is_Monitoring_websites
                    ? "bg-emerald-400/20 border-white/30"
                    : "bg-zinc-200/50 border-zinc-300/30"
                }
                backdrop-blur-sm border-2
              `}
            >
              <div
                className={`
                  absolute w-4 h-4 rounded-full shadow-md transition-all duration-500 flex items-center justify-center
                  ${is_Monitoring_websites ? "translate-x-5 bg-white" : "translate-x-1 bg-zinc-400"}
                `}
              >
                <div
                  className={`absolute inset-0 rounded-full ${
                    is_Monitoring_websites ? "animate-ping bg-white/50" : ""
                  }`}
                />
                <div
                  className={`
                    w-1.5 h-1.5 rounded-full transition-all duration-500
                    ${is_Monitoring_websites ? "bg-emerald-500 scale-100" : "bg-zinc-500 scale-0"}
                  `}
                />
              </div>
            </div>
          </div>

          <span className="relative font-medium tracking-wide text-xs flex items-center gap-2">
            {is_Monitoring_websites ? (
              <>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span className="animate-gradient-text bg-gradient-to-r from-white to-emerald-100">
                  Monitoring
                </span>
              </>
            ) : (
              <span className="text-zinc-600">Paused</span>
            )}
          </span>

          {/* Decorative circles */}
          <div className="absolute -z-10 inset-0 overflow-hidden rounded-full">
            {is_Monitoring_websites && (
              <>
                <div className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-emerald-300/20 blur-md animate-pulse" />
                <div className="absolute -bottom-3 -left-3 w-6 h-6 rounded-full bg-green-300/20 blur-md animate-pulse delay-100" />
              </>
            )}
          </div>
        </Button>

        {/* Last Updated Panel with Button on Left */}
        <div className="w-fit max-w-[240px] flex items-center gap-2 px-3 py-1 border rounded-full bg-muted/30 text-xs text-muted-foreground shadow-sm backdrop-blur-sm">
          <button
            onClick={fetchServers}
            disabled={isLoading}
            className="rounded-full p-1 hover:bg-muted transition"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <span className="whitespace-nowrap truncate">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
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
              "No servers added yet"
            ) : searchQuery ? (
              <>
                <p className="text-lg">No servers found matching your search.</p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-sm text-primary hover:underline mt-2"
                >
                  Clear search
                </button>
              </>
            ) : (
              `No ${activeFilter.toLowerCase()} servers found`
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
              isMonitoring={is_Monitoring_websites}
            />
          ))
        )}
      </div>

      <Dialog open={isUpdateOpen} onOpenChange={handleUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Server</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateSubmit} className="space-y-4">
            <label className="block text-sm font-medium text-gray-700 ml-1">
              Hostname<span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Hostname"
              value={UpdateformData.hostname}
              onChange={(e) =>
                setUpdateFormData({ ...UpdateformData, hostname: e.target.value })
              }
              required
            />
            <label className="block text-sm font-medium text-gray-700 mt-2 ml-1">
              IP Address<span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="IP Address"
              value={UpdateformData.ip_address}
              onChange={(e) =>
                setUpdateFormData({ ...UpdateformData, ip_address: e.target.value })
              }
              required
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsUpdateOpen(false);
                  setServerToUpdate(null);
                  setUpdateFormData({ hostname: "", ip_address: "" });
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