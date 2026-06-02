export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      contracts: {
        Row: {
          contract_number: string
          created_at: string
          created_by: string | null
          deal_id: string | null
          id: string
          quote_id: string
          signed_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          contract_number: string
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          id?: string
          quote_id: string
          signed_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          contract_number?: string
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          id?: string
          quote_id?: string
          signed_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: true
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      company_settings: {
        Row: {
          id: string
          module: string
          name: string | null
          address: string | null
          email: string | null
          phone: string | null
          website: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          module: string
          name?: string | null
          address?: string | null
          email?: string | null
          phone?: string | null
          website?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          module?: string
          name?: string | null
          address?: string | null
          email?: string | null
          phone?: string | null
          website?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          created_at: string
          email: string
          id: string
          name: string
          notes: string | null
          phone: string
          shopify_customer_id: string | null
          status: Database["public"]["Enums"]["customer_status"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          notes?: string | null
          phone: string
          shopify_customer_id?: string | null
          status?: Database["public"]["Enums"]["customer_status"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string
          shopify_customer_id?: string | null
          status?: Database["public"]["Enums"]["customer_status"]
          updated_at?: string
        }
        Relationships: []
      }
      deals: {
        Row: {
          amount: number
          assigned_to: string | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          expected_close_date: string | null
          id: string
          lead_id: string | null
          notes: string | null
          probability: number | null
          quote_id: string | null
          stage: Database["public"]["Enums"]["deal_stage"]
          title: string
          updated_at: string
        }
        Insert: {
          amount?: number
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          expected_close_date?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          probability?: number | null
          quote_id?: string | null
          stage?: Database["public"]["Enums"]["deal_stage"]
          title: string
          updated_at?: string
        }
        Update: {
          amount?: number
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          expected_close_date?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          probability?: number | null
          quote_id?: string | null
          stage?: Database["public"]["Enums"]["deal_stage"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      design_requests: {
        Row: {
          completed_at: string | null
          created_at: string
          customer_notes: string | null
          design_file_url: string | null
          design_notes: string | null
          designer_id: string | null
          id: string
          quote_id: string
          quote_item_id: string
          status: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          customer_notes?: string | null
          design_file_url?: string | null
          design_notes?: string | null
          designer_id?: string | null
          id?: string
          quote_id: string
          quote_item_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          customer_notes?: string | null
          design_file_url?: string | null
          design_notes?: string | null
          designer_id?: string | null
          id?: string
          quote_id?: string
          quote_item_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "design_requests_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_requests_quote_item_id_fkey"
            columns: ["quote_item_id"]
            isOneToOne: false
            referencedRelation: "quote_items"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_comments: {
        Row: {
          body: string
          created_at: string
          id: string
          lead_id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          lead_id: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          lead_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_comments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          converted_customer_id: string | null
          created_at: string
          customer_address: string | null
          customer_email: string | null
          customer_name: string
          customer_phone: string
          id: string
          meeting_date: string | null
          notes: string | null
          source: Database["public"]["Enums"]["lead_source"]
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
          whatsapp_link: string | null
        }
        Insert: {
          assigned_to?: string | null
          converted_customer_id?: string | null
          created_at?: string
          customer_address?: string | null
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          id?: string
          meeting_date?: string | null
          notes?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          whatsapp_link?: string | null
        }
        Update: {
          assigned_to?: string | null
          converted_customer_id?: string | null
          created_at?: string
          customer_address?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          id?: string
          meeting_date?: string | null
          notes?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          whatsapp_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_converted_customer_id_fkey"
            columns: ["converted_customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      op_clients: {
        Row: {
          address: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          payment_terms: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      op_items: {
        Row: {
          created_at: string
          id: string
          price: number
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          price?: number
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          price?: number
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      op_project_items: {
        Row: {
          created_at: string
          days: number
          id: string
          item_id: string
          project_id: string
          quantity: number
        }
        Insert: {
          created_at?: string
          days?: number
          id?: string
          item_id: string
          project_id: string
          quantity?: number
        }
        Update: {
          created_at?: string
          days?: number
          id?: string
          item_id?: string
          project_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "op_project_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "op_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "op_project_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "op_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      op_project_tasks: {
        Row: {
          assigned_to: string | null
          created_at: string
          end_date: string | null
          id: string
          notes: string | null
          project_id: string
          start_date: string | null
          status: Database["public"]["Enums"]["op_task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          project_id: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["op_task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          project_id?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["op_task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "op_project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "op_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      op_projects: {
        Row: {
          budget_approved: number | null
          budget_required: number | null
          client_id: string
          created_at: string
          end_date: string | null
          id: string
          notes: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["op_project_status"]
          title: string
          updated_at: string
        }
        Insert: {
          budget_approved?: number | null
          budget_required?: number | null
          client_id: string
          created_at?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["op_project_status"]
          title: string
          updated_at?: string
        }
        Update: {
          budget_approved?: number | null
          budget_required?: number | null
          client_id?: string
          created_at?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["op_project_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "op_projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "op_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      op_task_subtasks: {
        Row: {
          created_at: string
          done: boolean
          id: string
          task_id: string
          title: string
        }
        Insert: {
          created_at?: string
          done?: boolean
          id?: string
          task_id: string
          title: string
        }
        Update: {
          created_at?: string
          done?: boolean
          id?: string
          task_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "op_task_subtasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "op_project_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          price: number
          shopify_variant_id: string | null
          sku: string | null
          stock_qty: number | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          price?: number
          shopify_variant_id?: string | null
          sku?: string | null
          stock_qty?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          price?: number
          shopify_variant_id?: string | null
          sku?: string | null
          stock_qty?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quote_items: {
        Row: {
          created_at: string
          custom_design_notes: string | null
          description: string | null
          dimensions: string | null
          id: string
          image_url: string | null
          product_type: string | null
          quantity: number
          quote_id: string
          requires_custom_design: boolean | null
          shopify_product_id: string | null
          shopify_variant_id: string | null
          title: string
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          custom_design_notes?: string | null
          description?: string | null
          dimensions?: string | null
          id?: string
          image_url?: string | null
          product_type?: string | null
          quantity?: number
          quote_id: string
          requires_custom_design?: boolean | null
          shopify_product_id?: string | null
          shopify_variant_id?: string | null
          title: string
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          custom_design_notes?: string | null
          description?: string | null
          dimensions?: string | null
          id?: string
          image_url?: string | null
          product_type?: string | null
          quantity?: number
          quote_id?: string
          requires_custom_design?: boolean | null
          shopify_product_id?: string | null
          shopify_variant_id?: string | null
          title?: string
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string | null
          customer_address: string | null
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          discount: number | null
          id: string
          lead_id: string | null
          notes: string | null
          project_id: string | null
          quote_number: string
          status: string
          subtotal: number
          tax: number | null
          total: number
          unlinked_at: string | null
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_address?: string | null
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          discount?: number | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          project_id?: string | null
          quote_number: string
          status?: string
          subtotal?: number
          tax?: number | null
          total?: number
          unlinked_at?: string | null
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_address?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          discount?: number | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          project_id?: string | null
          quote_number?: string
          status?: string
          subtotal?: number
          tax?: number | null
          total?: number
          unlinked_at?: string | null
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "op_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          category: Database["public"]["Enums"]["supplier_category"]
          contact_name: string
          created_at: string
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          phone: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          category: Database["public"]["Enums"]["supplier_category"]
          contact_name: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          phone: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          category?: Database["public"]["Enums"]["supplier_category"]
          contact_name?: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_table_preferences: {
        Row: {
          column_visibility: Json | null
          filters: Json
          id: string
          page_key: string
          updated_at: string
          user_id: string
          view_name: string
        }
        Insert: {
          column_visibility?: Json | null
          filters?: Json
          id?: string
          page_key: string
          updated_at?: string
          user_id: string
          view_name?: string
        }
        Update: {
          column_visibility?: Json | null
          filters?: Json
          id?: string
          page_key?: string
          updated_at?: string
          user_id?: string
          view_name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_crm_access: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "sales"
      customer_status: "new" | "in_progress" | "closed" | "returning"
      deal_stage:
        | "quote_approved"
        | "in_production"
        | "ready_for_delivery"
        | "shipped"
        | "delivered"
        | "cancelled"
      document_type: "quote" | "invoice" | "receipt"
      lead_source:
        | "instagram"
        | "website"
        | "architects"
        | "organic"
        | "facebook"
      lead_status:
        | "new"
        | "in_process"
        | "meeting_scheduled"
        | "meeting_done"
        | "waiting_for_approval"
        | "done"
        | "not_done"
      op_project_status:
        | "draft"
        | "active"
        | "completed"
        | "cancelled"
        | "waiting_for_approval"
        | "planning"
        | "execution"
        | "collection"
      op_task_status: "todo" | "in_progress" | "done" | "cancelled"
      order_source: "shopify" | "crm"
      order_status:
        | "pending"
        | "confirmed"
        | "in_production"
        | "ready"
        | "shipped"
        | "delivered"
        | "cancelled"
      supplier_category: "sofas" | "cabinets" | "chairs" | "tables"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "sales"],
      customer_status: ["new", "in_progress", "closed", "returning"],
      deal_stage: [
        "quote_approved",
        "in_production",
        "ready_for_delivery",
        "shipped",
        "delivered",
        "cancelled",
      ],
      document_type: ["quote", "invoice", "receipt"],
      lead_source: [
        "instagram",
        "website",
        "architects",
        "organic",
        "facebook",
      ],
      lead_status: [
        "new",
        "in_process",
        "meeting_scheduled",
        "meeting_done",
        "waiting_for_approval",
        "done",
        "not_done",
      ],
      op_project_status: [
        "draft",
        "active",
        "completed",
        "cancelled",
        "waiting_for_approval",
        "planning",
        "execution",
        "collection",
      ],
      op_task_status: ["todo", "in_progress", "done", "cancelled"],
      order_source: ["shopify", "crm"],
      order_status: [
        "pending",
        "confirmed",
        "in_production",
        "ready",
        "shipped",
        "delivered",
        "cancelled",
      ],
      supplier_category: ["sofas", "cabinets", "chairs", "tables"],
    },
  },
} as const
