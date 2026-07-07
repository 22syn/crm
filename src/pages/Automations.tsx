import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Zap, 
  Mail, 
  Globe, 
  Archive, 
  MessageSquare, 
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface Automation {
  id: string;
  name: string;
  description: string;
  trigger: string;
  action: string;
  status: "active" | "inactive";
  type: "system" | "webhook" | "scheduled";
  icon: React.ElementType;
  lastRun?: string;
}

const automations: Automation[] = [
  {
    id: "1",
    name: "Send quote by email",
    description: "Automatically send a quote to the customer when clicking 'Send quote'",
    trigger: "Click on 'Send quote'",
    action: "Send email with PDF of the quote",
    status: "active",
    type: "webhook",
    icon: Mail,
  },
  {
    id: "2",
    name: "Capture leads from website",
    description: "Automatically capture leads who fill out the contact form on the website",
    trigger: "Contact form submission on website",
    action: "Create new lead in system",
    status: "active",
    type: "webhook",
    icon: Globe,
  },
  {
    id: "3",
    name: "Archive old quotes",
    description: "Automatically move unassigned quotes older than 14 days to archive",
    trigger: "Quote unassigned for more than 14 days",
    action: "Move quote to archive",
    status: "active",
    type: "scheduled",
    icon: Archive,
  },
  {
    id: "4",
    name: "WhatsApp supplier booking",
    description: "Create automatic WhatsApp message to suppliers with order details",
    trigger: "Quote approval",
    action: "Create WhatsApp link with order summary",
    status: "active",
    type: "system",
    icon: MessageSquare,
  },
];

const AutomationCard = ({ automation }: { automation: Automation }) => {
  const Icon = automation.icon;
  
  return (
    <Card className="relative overflow-hidden">
      <div className={`absolute top-0 left-0 w-1 h-full ${
        automation.status === "active" ? "bg-green-500" : "bg-muted"
      }`} />
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              automation.status === "active" 
                ? "bg-primary/10 text-primary" 
                : "bg-muted text-muted-foreground"
            }`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">{automation.name}</CardTitle>
              <CardDescription className="text-sm mt-1">
                {automation.description}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={automation.status === "active" ? "default" : "secondary"}>
              {automation.status === "active" ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs">Trigger</p>
            <p className="font-medium">{automation.trigger}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs">Action</p>
            <p className="font-medium">{automation.action}</p>
          </div>
        </div>
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {automation.type === "webhook" && (
              <Badge variant="outline" className="text-xs">
                <Zap className="h-3 w-3 mr-1" />
                Webhook
              </Badge>
            )}
            {automation.type === "scheduled" && (
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                Scheduled
              </Badge>
            )}
            {automation.type === "system" && (
              <Badge variant="outline" className="text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                System
              </Badge>
            )}
          </div>
          <Switch 
            checked={automation.status === "active"} 
            disabled 
            aria-label="Toggle automation"
          />
        </div>
      </CardContent>
    </Card>
  );
};

const Automations = () => {
  const activeCount = automations.filter(a => a.status === "active").length;
  
  return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="hidden md:block">
            <h1 className="text-display font-semibold">Automations</h1>
            <p className="text-muted-foreground mt-1">
              View all active automations in the system
            </p>
          </div>
          <div className="flex items-center gap-2 md:ml-auto">
            <Badge variant="outline" className="text-sm py-1 px-3">
              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
              {activeCount} active automations
            </Badge>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-100 text-green-600">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activeCount}</p>
                  <p className="text-sm text-muted-foreground">Active automations</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  <Zap className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold">2</p>
                  <p className="text-sm text-muted-foreground">Webhooks</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold">1</p>
                  <p className="text-sm text-muted-foreground">Scheduled tasks</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Automations Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {automations.map((automation) => (
            <AutomationCard key={automation.id} automation={automation} />
          ))}
        </div>

        {/* Info Card */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium">About automations</p>
                <p className="text-sm text-muted-foreground">
                  Automations run in the background and perform actions based on defined triggers.
                  To request changes or add new automations, contact the system administrator.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
    </div>
  );
};

export default Automations;
