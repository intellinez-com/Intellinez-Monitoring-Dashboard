import {
  Circle,
  ExternalLink,
  Monitor,
  Pencil,
  Trash,
  Copy,
  CheckCheck,
  Info,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "./ui/card";
import { cn } from "@/lib/utils";
import { Website, WebsiteWithSSL } from "@/types/website";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface WebsiteStatusCardProps {
  website: WebsiteWithSSL;
  onDelete: (id: string) => void;
  onUpdate: (website: Website) => void;
  isMonitoring: boolean;
}

export function WebsiteStatusCard({
  website,
  onDelete,
  onUpdate,
  isMonitoring,
}: WebsiteStatusCardProps) {
  console.log("Website Status Card Rendered", website);
  const navigate = useNavigate();

  const status = website.health_status || "Unknown";

  const statusColor = {
    Healthy: "text-emerald-500",
    Degraded: "text-yellow-500",
    Offline: "text-red-500",
    Intermittent: "text-orange-500",
    Unknown: "text-gray-400",
  }[status];

  // Add this function to handle logs navigation
  const handleViewLogs = () => {
    navigate(`/website-logs/${website.id}`, {
      state: { websiteName: website.website_name },
    });
  };

  const [copied, setCopied] = useState(false);

  const [showDetailsModal, setShowDetailsModal] = useState(false);

  //helper function to formate date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statusBackgroundColor = {
    healthy: "bg-status-healthy/10",
    degraded: "bg-status-warning/10",
    offline: "bg-status-critical/10",
    intermittent: "bg-gray-100/10",
  };

  // Add this helper function inside your component
  const getExpiryStatus = (expiryDate: string | null) => {
    if (!expiryDate) return { color: "text-gray-400", icon: null };

    const today = new Date();
    const expiry = new Date(expiryDate);
    const monthsDiff =
      (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30);

    if (monthsDiff > 6) {
      return {
        color: "text-emerald-500",
        icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
        tooltip: "Valid for more than 6 months",
      };
    } else if (monthsDiff > 1) {
      return {
        color: "text-yellow-500",
        icon: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
        tooltip: "Expires in less than 6 months",
      };
    } else {
      return {
        color: "text-red-500",
        icon: <XCircle className="h-4 w-4 text-red-500" />,
        tooltip: "Expires in less than a month",
      };
    }
  };

  //function to truncate lengthy website urls
  const truncateUrl = (url: string, maxLength: number = 25) => {
    return url.length > maxLength ? `${url.substring(0, maxLength)}...` : url;
  };

  //function to truncate lengthy website names
  const truncateWebsiteName = (name: string, maxLength: number = 18) => {
    return name.length > maxLength
      ? `${name.substring(0, maxLength)}...`
      : name;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(website.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <TooltipProvider>
      <Card className={cn(
        "relative overflow-hidden transition-all duration-300 hover:shadow-lg",
        website.health_status.toLowerCase() === "offline" && "animate-pulse-fast",
        !isMonitoring && "filter grayscale-[0.7]"
      )}>

        <div
          className={cn(
            "absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-30 blur-2xl pointer-events-none",
            website.health_status === "Healthy" && "bg-emerald-200",
            website.health_status === "Degraded" && "bg-yellow-200",
            website.health_status === "Offline" && "bg-red-200",
            website.health_status === "Intermittent" && "bg-gray-200"
          )}
        />
        <div
          className={cn(
            "absolute -bottom-10 -left-10 w-60 h-28 rounded-full opacity-30 blur-2xl pointer-events-none",
            website.health_status === "Healthy" && "bg-emerald-200",
            website.health_status === "Degraded" && "bg-yellow-200",
            website.health_status === "Offline" && "bg-red-200",
            website.health_status === "Intermittent" && "bg-gray-200"
          )}
        />

        <CardHeader className="px-4">
          <div className="flex justify-between items-start space-x-4">
            {/* Website Info Section */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <CardTitle className="font-semibold text-xl tracking-tight truncate text-zinc-800 dark:text-zinc-100">
                  {truncateWebsiteName(website.website_name)}
                </CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className=" h-4 w-4 hover:bg-transparent"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowDetailsModal(true);
                      }}
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Details</TooltipContent>
                </Tooltip>
              </div>
              {/* URL Display */}
              <div className="flex items-center gap-2 group/url">
                <Monitor className="h-4 w-4 text-muted-foreground/70" />
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p className="text-xs text-muted-foreground truncate max-w-[220px] group-hover/url:text-foreground transition-colors">
                        {truncateUrl(website.url)}
                      </p>
                    </TooltipTrigger>
                    <TooltipContent>{website.url}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "h-6 w-6 p-0 rounded-full",
                          "hover:bg-muted",
                          "transition-all duration-200"
                        )}
                        onClick={copyToClipboard}
                      >
                        {copied ? (
                          <CheckCheck className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3 text-muted-foreground" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {copied ? "Copied!" : "Copy URL"}
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>
            {/* Status Badge */}
            <div
              className={cn(
                "px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm border",
                {
                  "bg-emerald-100 border-emerald-200":
                    website.health_status === "Healthy",
                  "bg-yellow-100 border-yellow-200":
                    website.health_status === "Degraded",
                  "bg-red-100 border-red-200":
                    website.health_status === "Offline",
                  "bg-orange-100 border-orange-200":
                    website.health_status === "Intermittent",
                  "bg-gray-100 border-gray-200":
                    website.health_status === "Unknown",
                },
                "transition-all duration-300"
              )}
            >
              <Circle className={cn("h-2.5 w-2.5 fill-current", statusColor)} />
              <span
                className={cn("capitalize text-sm font-medium", statusColor)}
              >
                {website.health_status}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-4 grid gap-4">
          {/* Website Meta Info */}
          <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>
                Last checked:{" "}
                <span className="font-semibold text-zinc-700 dark:text-zinc-200">
                  {new Date(website.checked_at).toLocaleTimeString()}
                </span>
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 sm:text-xs">
              <span>
                Response:{" "}
                <span className="font-semibold text-zinc-700 dark:text-zinc-200">
                  {website.response_time_ms || "N/A"}
                </span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-1 text-xs sm:text-xs text-zinc-600 dark:text-zinc-300 leading-tight">
            {/* SSL Status */}
            <div className="flex items-center justify-between">
              <span className="font-semibold">SSL Status:</span>
              <span className="font-bold text-zinc-700 dark:text-zinc-200">
                {website.certificate_status || "N/A"}
              </span>
            </div>

            {/* SSL Expiry */}
            <div className="flex items-center justify-between">
              <span className="font-semibold">SSL Expiry:</span>
              <div
                className={cn(
                  "flex items-center gap-1",
                  getExpiryStatus(website.ssl_expiry).color
                )}
              >
                {getExpiryStatus(website.ssl_expiry).icon}
                <span>{formatDate(website.ssl_expiry)}</span>
              </div>
            </div>

            {/* Domain Expiry */}
            <div className="flex items-center justify-between">
              <span className="font-semibold">Domain Expiry:</span>
              <div
                className={cn(
                  "flex items-center gap-1",
                  getExpiryStatus(website.domain_expiry).color
                )}
              >
                {getExpiryStatus(website.domain_expiry).icon}
                <span>{formatDate(website.domain_expiry)}</span>
              </div>
            </div>
          </div>

          {/* Footer Section */}
          <div
            className={cn(
              "rounded-md flex items-center justify-end gap-3 duration-300"
            )}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleViewLogs}
                  className="h-8 w-8  rounded-full hover:bg-blue-100 hover:text-blue-700 transition"
                >
                  <FileText className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>View logs</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onUpdate(website)}
                  className="h-8 w-8 rounded-full hover:bg-emerald-100 hover:text-emerald-700 transition"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(website.id)}
                  className="h-8 w-8  rounded-full hover:bg-red-100 hover:text-red-700 transition"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete</TooltipContent>
            </Tooltip>
          </div>
        </CardContent>

        {/* Footer bar with metrics */}
      </Card>
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <span>{website.website_name}</span>
              <a
                href={website.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {/* Website Status Section */}
            <div className="grid gap-4">
              <h3 className="font-semibold text-lg">Status Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Health Status:
                    </span>
                    <span className={statusColor}>{website.health_status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Response Time:
                    </span>
                    <span>{website.response_time_ms}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status Code:</span>
                    <span>{website.status_code || "N/A"}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Checked:</span>
                    <span>{formatDate(website.checked_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span>{formatDate(website.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Updated:</span>
                    <span>{formatDate(website.updated_at)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SSL Certificate Section */}

            <div className="grid gap-4">
              <h3 className="font-semibold text-lg">SSL and Domain Info</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">SSL Status:</span>
                    <span>{website.certificate_status || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Issuer:</span>
                    <span>{website.issuer || "N/A"}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Domain Expiry:
                    </span>
                    <div
                      className={cn(
                        "font-semibold flex items-center gap-1",
                        getExpiryStatus(website.domain_expiry).color
                      )}
                    >
                      <div className="flex items-center gap-1">
                        {getExpiryStatus(website.domain_expiry).icon}
                        <span>{formatDate(website.domain_expiry)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">SSL Expiry:</span>
                    <div
                      className={cn(
                        "font-semibold flex items-center gap-1",
                        getExpiryStatus(website.ssl_expiry).color
                      )}
                    >
                      {getExpiryStatus(website.ssl_expiry).icon}
                      {formatDate(website.ssl_expiry)}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Checked:</span>
                    <span>{formatDate(website.last_checked)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
