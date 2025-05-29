import { Website } from "@/types/website";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface WebsiteCardProps {
  website: Website;
  onDelete: (id: string) => void;
  onUpdate: (website: Website) => void;
}

export function WebsiteCard({ website, onDelete, onUpdate }: WebsiteCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          {website.name}
          <div className="space-x-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onUpdate(website)}
            >
              Edit
            </Button>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => onDelete(website.id)}
            >
              Delete
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground overflow-hidden">{website.url}</p>
      </CardContent>
    </Card>
  );
}