import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type OpClient = Tables<"op_clients">;

interface ClientTableProps {
  clients: OpClient[];
  isAdmin: boolean;
  onEdit: (client: OpClient) => void;
  onDelete: (client: OpClient) => void;
}

export function ClientTable({ clients, isAdmin, onEdit, onDelete }: ClientTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>שם</TableHead>
          <TableHead>איש קשר</TableHead>
          <TableHead>טלפון איש קשר</TableHead>
          <TableHead>אימייל</TableHead>
          <TableHead className="w-12"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {clients.map((client) => (
          <TableRow key={client.id}>
            <TableCell className="font-medium">
              <Link to={`/ad-agency/clients/${client.id}`} className="text-primary hover:underline">
                {client.name}
              </Link>
            </TableCell>
            <TableCell>{client.contact_name || "-"}</TableCell>
            <TableCell>{client.contact_phone || "-"}</TableCell>
            <TableCell>{client.email || "-"}</TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(client)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    עריכה
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem
                      onClick={() => onDelete(client)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      מחיקה
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
