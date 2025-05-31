import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Website, WebsiteWithSSL } from "@/types/website";
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
import { Plus, RefreshCw } from "lucide-react";
import { WebsiteStatusCard } from "./WebsiteStatusCard";
import { WebsiteStatusFilter } from "./WebsiteStatusFilter";
import { WebsiteCardSkeleton } from "./WebsiteCardSkeleton";
import { Search } from "lucide-react";

export function WebsiteManager() {
  const [websites, setWebsites] = useState<WebsiteWithSSL[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<string | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");

  // const [isLiveLoading, setIsLiveLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [websiteToUpdate, setWebsiteToUpdate] = useState<Website | null>(null);
  const [activeFilter, setActiveFilter] = useState<
    "All" | "Healthy" | "Degraded" | "Offline" | "Intermittent"
  >("All");
  const [is_Monitoring, setIs_Monitoring] = useState(() => {
    // Get the stored value on initial load
    const stored = localStorage.getItem("is_Monitoring");
    return stored ? JSON.parse(stored) : false;
  });

  useEffect(() => {
    // Update localStorage whenever is_Monitoring changes
    localStorage.setItem("is_Monitoring", JSON.stringify(is_Monitoring));
  }, [is_Monitoring]);

  const [UpdateformData, setUpdateFormData] = useState({
    name: "",
    url: "",
  });
  const [formData, setFormData] = useState({
    name: "",
    url: "",
  });

  // Regex pattern to validate URL format
  const urlPattern =
    /^https:\/\/([a-zA-Z0-9-]+\.)*(com|net|org|ai|ngo|[a-zA-Z]{2,})(\/.*)?$/;

  const statusCounts = {
    all: websites.length,
    healthy: websites.filter((w) => w.health_status === "Healthy").length,
    degraded: websites.filter((w) => w.health_status === "Degraded").length,
    offline: websites.filter((w) => w.health_status === "Offline").length,
    intermittent: websites.filter((w) => w.health_status === "Intermittent").length,
  };

  //Getting user details through hook
  const { user } = useUser();
  const userId = user?.id;

  // Add website to the database
  const handleNewWebsiteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const now = new Date().toISOString();
      if (formData.name.trim() === "") {
        throw new Error("Please enter a valid website name");
      }

      if (!urlPattern.test(formData.url)) {
        throw new Error(
          "Please enter a valid URL starting with https:// and ending in .com, .net, or .org"
        );
      }

      // Check if the website name already exists among active websites
      const { data: existingName, error: nameError } = await supabase
        .from("websites")
        .select("id")
        .eq("website_name", formData.name)
        .eq("is_active", true);

      if (nameError) throw nameError;
      if (existingName && existingName.length > 0) {
        throw new Error(
          "A website with this name already exists among active websites"
        );
      }

      // Check if the website URL already exists among active websites
      const { data: existingWebsites, error: fetchError } = await supabase
        .from("websites")
        .select("id")
        .eq("url", formData.url)
        .eq("is_active", true);

      if (fetchError) throw fetchError;
      if (existingWebsites && existingWebsites.length > 0) {
        throw new Error(
          "A website with this URL already exists among active websites"
        );
      }

      const newWebsite = {
        website_name: formData.name, // Changed from name to website_name
        url: formData.url,
        checked_at: now,
        updated_at: now,
        created_by: userId,
        is_active: true,
        created_at: now,
      };

      const { data, error } = await supabase
        .from("websites")
        .insert([newWebsite])
        .select();

      if (error) throw error;

      if (data?.[0]) {
        // No need to transform the data, use it directly
        setWebsites((prev) => [data[0], ...prev]);
      }

      setFormData({ name: "", url: "" });
      setIsOpen(false);

      toast({
        title: "Success",
        description: "Website added successfully",
        variant: "success",
      });
    } catch (error) {
      console.error("Error adding website:", error);
      toast({
        title: "Error",
        description: error.message || "Could not add website",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update Dialog open handlers
  const handleDialogOpen = (open: boolean) => {
    setIsOpen(open);
  };

  const handleUpdateDialogOpen = (open: boolean) => {
    setIsUpdateOpen(open);
  };

  // Delete website from the database
  const confirmDelete = async () => {
    if (!selectedWebsiteId || isDeleting) return;

    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from("websites")
        .update({
          is_active: false,
          updated_by: userId,
          updated_at: new Date().toISOString(),
        }) // Update instead of delete
        .eq("id", selectedWebsiteId)
        .select();

      if (error) throw error;

      setWebsites((websites) =>
        websites.filter((site) => site.id !== selectedWebsiteId)
      );
      toast({
        title: "Success",
        description: "Website deleted successfully",
        variant: "success",
      });
      setConfirmOpen(false);
      setSelectedWebsiteId(null);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Could not delete website",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdate = (website: Website) => {
    setWebsiteToUpdate(website);
    setUpdateFormData({
      name: website.website_name,
      url: website.url,
    });
    setIsUpdateOpen(true);
  };

  // Add this new function after handleUpdate
  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!websiteToUpdate) return;

    setIsLoading(true);
    try {
      if (UpdateformData.name.trim() === "") {
        throw new Error("Please enter a valid website name");
      }

      if (!urlPattern.test(UpdateformData.url)) {
        throw new Error(
          "Please enter a valid URL starting with https:// and ending in .com, .net, .ai, .dev or .org"
        );
      }

      // Check if the website name already exists among active websites
      const { data: existingName, error: nameError } = await supabase
        .from("websites")
        .select("id")
        .eq("website_name", UpdateformData.name)
        .eq("is_active", true)
        .neq("id", websiteToUpdate.id); // Exclude the current website

      if (nameError) throw nameError;
      if (existingName && existingName.length > 0) {
        throw new Error(
          "A website with this name already exists among active websites"
        );
      }

      // Check if the website URL already exists among active websites
      const { data: existingWebsites, error: fetchError } = await supabase
        .from("websites")
        .select("id")
        .eq("url", UpdateformData.url)
        .eq("is_active", true)
        .neq("id", websiteToUpdate.id); // Exclude the current website

      if (fetchError) throw fetchError;
      if (existingWebsites && existingWebsites.length > 0) {
        throw new Error(
          "A website with this URL already exists among active websites"
        );
      }

      const { data, error } = await supabase
        .from("websites")
        .update({
          website_name: UpdateformData.name,
          url: UpdateformData.url,
          updated_at: new Date().toISOString(),
          updated_by: userId,
        })
        .eq("id", websiteToUpdate.id).select(`
        *,
        website_monitoring_logs (
          health_status,
          response_time_ms,
          status_code,
          checked_at
        )
      `);

      if (error) throw error;

      if (data?.[0]) {

        toast({
          title: "Success",
          description: "Website updated successfully",
          variant: "success",
        });
      }

      setIsUpdateOpen(false);
      setWebsiteToUpdate(null);
      setUpdateFormData({ name: "", url: "" });
    } catch (error) {
      console.error("Error updating website:", error);
      toast({
        title: "Error",
        description: error.message || "Could not update website",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // the website status fetch logic
  const fetchWebsites = async () => {
    if (!userId) return;

    let freshData = [];

    try {
      // Start lightweight spinner without full UI block
      setIsLoading((prev) => (!prev ? true : prev));

      // Optional debounce delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      const { data, error } = await supabase
        .from("latest_active_website_data")
        .select("*");

      if (error) throw error;

      console.log("Fetched website monitoring logs:", data);

      freshData =
        data?.map((website) => ({
          id: website.id,
          website_name: website.website_name,
          url: website.url,
          is_active: website.is_active,

          // Latest monitoring data (flat, no nesting now)
          health_status: website.latest_health_status || "Unknown",
          response_time_ms: website.latest_response_time_ms ?? "N/A",
          status_code: website.latest_status_code ?? 0,
          checked_at: website.latest_checked_at || website.created_at,

          // Timestamps and authorship
          created_at: website.created_at,
          updated_at: website.updated_at,
          created_by: website.created_by,
          updated_by: website.updated_by,

          // Latest SSL info
          ssl_expiry: website.ssl_expiry || null,
          issuer: website.issuer || null,
          certificate_status: website.certificate_status || null,
          last_checked: website.ssl_last_checked || null,
          domain_expiry: website.domain_expiry || null,
        })) || [];

      console.log("Final transformed website data:", freshData);
    } catch (error) {
      console.error("Error fetching websites:", error);
      toast({
        title: "Error",
        description: `Could not refresh/load websites.`,
        variant: "destructive",
      });
    } finally {
      setWebsites((prev) => {
        if (JSON.stringify(prev) !== JSON.stringify(freshData)) {
          return freshData;
        }
        return prev;
      });

      setLastUpdated(new Date());
      setTimeout(() => setIsLoading(false), 200);
    }
  };



  // Initial fetch and auto-refresh logic
  useEffect(() => {
    fetchWebsites(); // Initial load

    if (!is_Monitoring) return; // Only auto-refresh if monitoring is ON

    const intervalId = setInterval(() => {
      fetchWebsites();
    }, 55000);

    return () => clearInterval(intervalId);
  }, [userId, is_Monitoring]);

  // Add this sorting function before your return statement
  const sortByHealthStatus = (websites: WebsiteWithSSL[]) => {
    const statusPriority = {
      Offline: 1,
      Degraded: 2,
      Intermittent: 3,
      Healthy: 4,
      Unknown: 5,
    };

    return [...websites].sort((a, b) => {
      const statusA = a.health_status || "Unknown";
      const statusB = b.health_status || "Unknown";
      return statusPriority[statusA] - statusPriority[statusB];
    });
  };

  // function to Filter websites based on search query and active filter
  const combinedFilteredWebsites = sortByHealthStatus(
    websites
      .filter((website) => {
        // Status filter
        if (activeFilter !== "All") {
          return website.health_status === activeFilter;
        }
        return true;
      })
      .filter((website) => {
        // Search filter
        const query = searchQuery.toLowerCase().trim();
        return (
          website.website_name.toLowerCase().includes(query) ||
          website.url.toLowerCase().includes(query)
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
              placeholder="Search websites..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm"
            />
          </div>
          <WebsiteStatusFilter
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            counts={statusCounts}
          />
          <DialogTrigger asChild>
            <Button onClick={() => setFormData({ name: "", url: "" })}>
              <Plus className="mr-2 h-6 w-6" />
              Add Website
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-center">Add New Website</DialogTitle>
            </DialogHeader>
            <form className="space-y-4" onSubmit={handleNewWebsiteSubmit}>
              <label className="block text-sm font-medium text-gray-700 ml-1">
                Website Name<span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Enter name here"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
              <label className="block text-sm font-medium text-gray-700 mt-2 ml-1">
                Website URL<span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Enter URL here"
                type="url"
                value={formData.url}
                onChange={(e) =>
                  setFormData({ ...formData, url: e.target.value })
                }
                required
              />

              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Adding..." : "Add Website"}
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
              This will permanently delete the website. This action cannot be
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
    ${is_Monitoring
              ? "border-emerald-400/50 bg-gradient-to-r from-emerald-500/90 to-green-400/90 text-white shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:from-emerald-400 hover:to-green-300"
              : "border-zinc-300/50 bg-gradient-to-r from-zinc-100/90 to-slate-50/90 text-zinc-700 shadow-zinc-300/20 hover:shadow-zinc-300/40 hover:from-zinc-200 hover:to-slate-100"}
  `}
          onClick={() => setIs_Monitoring((prev) => !prev)}
        >
          {/* Glow */}
          <div className={`
    absolute inset-0 rounded-full blur-xl transition-opacity duration-500
    ${is_Monitoring ? "opacity-40 bg-emerald-400" : "opacity-0 bg-zinc-400"}
  `} />

          {/* Toggle */}
          <div className="relative">
            <div className={`
      w-10 h-6 rounded-full transition-all duration-500 flex items-center
      ${is_Monitoring ? "bg-emerald-400/20 border-white/30" : "bg-zinc-200/50 border-zinc-300/30"}
      backdrop-blur-sm border-2
    `}>
              <div className={`
        absolute w-4 h-4 rounded-full shadow-md transition-all duration-500 flex items-center justify-center
        ${is_Monitoring ? "translate-x-5 bg-white" : "translate-x-1 bg-zinc-400"}
      `}>
                <div className={`absolute inset-0 rounded-full ${is_Monitoring ? "animate-ping bg-white/50" : ""}`} />
                <div className={`
          w-1.5 h-1.5 rounded-full transition-all duration-500
          ${is_Monitoring ? "bg-emerald-500 scale-100" : "bg-zinc-500 scale-0"}
        `} />
              </div>
            </div>
          </div>

          {/* Text */}
          <span className="relative font-medium tracking-wide text-xs flex items-center gap-2">
            {is_Monitoring ? (
              <>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span className="animate-gradient-text bg-gradient-to-r from-white to-emerald-100">Monitoring</span>
              </>
            ) : (
              <span className="text-zinc-600">Paused</span>
            )}
          </span>

          {/* Decorative circles */}
          <div className="absolute -z-10 inset-0 overflow-hidden rounded-full">
            {is_Monitoring && (
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
            onClick={fetchWebsites}
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
          // Show 6 skeleton cards while loading
          <>
            {[...Array(6)].map((_, index) => (
              <WebsiteCardSkeleton key={index} />
            ))}
          </>
        ) : combinedFilteredWebsites.length === 0 ? (
          <div className="col-span-full text-center py-10 text-muted-foreground">
            {websites.length === 0 ? (
              "No websites added yet"
            ) : searchQuery ? (
              <>
                <p className="text-lg">
                  No websites found matching your search.
                </p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-sm text-primary hover:underline mt-2"
                >
                  Clear search
                </button>
              </>
            ) : (
              `No ${activeFilter.toLowerCase()} websites found`
            )}
          </div>
        ) : (
          combinedFilteredWebsites.map((website) => (
            <WebsiteStatusCard
              key={website.id}
              website={website}
              onDelete={() => {
                setSelectedWebsiteId(website.id);
                setConfirmOpen(true);
              }}
              onUpdate={() => handleUpdate(website)}
              isMonitoring={is_Monitoring}
            />
          ))
        )}
      </div>

      <Dialog open={isUpdateOpen} onOpenChange={handleUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Website</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateSubmit} className="space-y-4">
            <label className="block text-sm font-medium text-gray-700 ml-1">
              Website Name<span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Website Name"
              value={UpdateformData.name}
              onChange={(e) =>
                setUpdateFormData({ ...UpdateformData, name: e.target.value })
              }
              required
            />
            <label className="block text-sm font-medium text-gray-700 mt-2 ml-1">
              Website URL<span className="text-red-500">*</span>
            </label>

            <Input
              placeholder="Website URL"
              type="url"
              value={UpdateformData.url}
              onChange={(e) =>
                setUpdateFormData({ ...UpdateformData, url: e.target.value })
              }
              required
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsUpdateOpen(false);
                  setWebsiteToUpdate(null);
                  setUpdateFormData({ name: "", url: "" });
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Updating..." : "Update Website"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
