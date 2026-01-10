import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileText, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function QuickActions() {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle>פעולות מהירות</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button 
          className="w-full justify-start" 
          variant="outline"
          onClick={() => navigate("/leads")}
        >
          <Plus className="h-4 w-4 mr-2" />
          ליד חדש
        </Button>
        <Button 
          className="w-full justify-start" 
          variant="outline"
          onClick={() => navigate("/quotes")}
        >
          <FileText className="h-4 w-4 mr-2" />
          הצעת מחיר חדשה
        </Button>
        <Button 
          className="w-full justify-start" 
          variant="outline"
          onClick={() => navigate("/leads?filter=no-meeting")}
        >
          <AlertCircle className="h-4 w-4 mr-2" />
          לידים לטיפול
        </Button>
      </CardContent>
    </Card>
  );
}
