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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ambassadors: {
        Row: {
          created_at: string
          event_id: string
          id: string
          name: string
          ref_code: string
          sales_goal: number
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          name: string
          ref_code: string
          sales_goal?: number
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          name?: string
          ref_code?: string
          sales_goal?: number
        }
        Relationships: [
          {
            foreignKeyName: "ambassadors_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_pages: {
        Row: {
          brief: string | null
          content: Json
          created_at: string
          event_id: string
          id: string
          is_active: boolean
          mode: Database["public"]["Enums"]["page_mode"]
          preview_url: string | null
          price_amount: number | null
          status: Database["public"]["Enums"]["custom_page_status"]
          updated_at: string
        }
        Insert: {
          brief?: string | null
          content?: Json
          created_at?: string
          event_id: string
          id?: string
          is_active?: boolean
          mode?: Database["public"]["Enums"]["page_mode"]
          preview_url?: string | null
          price_amount?: number | null
          status?: Database["public"]["Enums"]["custom_page_status"]
          updated_at?: string
        }
        Update: {
          brief?: string | null
          content?: Json
          created_at?: string
          event_id?: string
          id?: string
          is_active?: boolean
          mode?: Database["public"]["Enums"]["page_mode"]
          preview_url?: string | null
          price_amount?: number | null
          status?: Database["public"]["Enums"]["custom_page_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_pages_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_sessions: {
        Row: {
          created_at: string
          end_time: string | null
          event_id: string
          id: string
          location: string | null
          name: string
          session_date: string
          sort_order: number
          start_time: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_time?: string | null
          event_id: string
          id?: string
          location?: string | null
          name: string
          session_date: string
          sort_order?: number
          start_time?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_time?: string | null
          event_id?: string
          id?: string
          location?: string | null
          name?: string
          session_date?: string
          sort_order?: number
          start_time?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_sessions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          cover_image_url: string | null
          created_at: string
          currency: string
          description: string | null
          event_date: string
          event_time: string | null
          id: string
          location: string
          name: string
          organizer_id: string
          page_mode: Database["public"]["Enums"]["page_mode"]
          slug: string
          status: Database["public"]["Enums"]["event_status"]
          updated_at: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          event_date: string
          event_time?: string | null
          id?: string
          location: string
          name: string
          organizer_id: string
          page_mode?: Database["public"]["Enums"]["page_mode"]
          slug: string
          status?: Database["public"]["Enums"]["event_status"]
          updated_at?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          event_date?: string
          event_time?: string | null
          id?: string
          location?: string
          name?: string
          organizer_id?: string
          page_mode?: Database["public"]["Enums"]["page_mode"]
          slug?: string
          status?: Database["public"]["Enums"]["event_status"]
          updated_at?: string
        }
        Relationships: []
      }
      hosts: {
        Row: {
          access_code: string
          created_at: string
          event_id: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          access_code: string
          created_at?: string
          event_id: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          access_code?: string
          created_at?: string
          event_id?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "hosts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          ambassador_id: string | null
          amount: number
          created_at: string
          discount: number
          email: string
          event_id: string
          first_name: string
          id: string
          last_name: string
          phone: string | null
          promo_code_id: string | null
          status: Database["public"]["Enums"]["order_status"]
          ticket_type_id: string
          updated_at: string
        }
        Insert: {
          ambassador_id?: string | null
          amount?: number
          created_at?: string
          discount?: number
          email: string
          event_id: string
          first_name: string
          id?: string
          last_name: string
          phone?: string | null
          promo_code_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          ticket_type_id: string
          updated_at?: string
        }
        Update: {
          ambassador_id?: string | null
          amount?: number
          created_at?: string
          discount?: number
          email?: string
          event_id?: string
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          promo_code_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          ticket_type_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_ambassador_id_fkey"
            columns: ["ambassador_id"]
            isOneToOne: false
            referencedRelation: "ambassadors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_ticket_type_id_fkey"
            columns: ["ticket_type_id"]
            isOneToOne: false
            referencedRelation: "ticket_types"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          order_id: string
          provider: string
          provider_reference: string | null
          status: Database["public"]["Enums"]["order_status"]
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          order_id: string
          provider?: string
          provider_reference?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          order_id?: string
          provider?: string
          provider_reference?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          ends_at: string | null
          event_id: string
          id: string
          is_active: boolean
          starts_at: string | null
          usage_limit: number | null
          used_count: number
        }
        Insert: {
          code: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          ends_at?: string | null
          event_id: string
          id?: string
          is_active?: boolean
          starts_at?: string | null
          usage_limit?: number | null
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          ends_at?: string | null
          event_id?: string
          id?: string
          is_active?: boolean
          starts_at?: string | null
          usage_limit?: number | null
          used_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "promo_codes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      scans: {
        Row: {
          event_id: string
          host_id: string | null
          id: string
          result: string
          scanned_at: string
          session_id: string | null
          ticket_id: string | null
        }
        Insert: {
          event_id: string
          host_id?: string | null
          id?: string
          result: string
          scanned_at?: string
          session_id?: string | null
          ticket_id?: string | null
        }
        Update: {
          event_id?: string
          host_id?: string | null
          id?: string
          result?: string
          scanned_at?: string
          session_id?: string | null
          ticket_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scans_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scans_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "hosts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scans_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "event_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scans_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_session_access: {
        Row: {
          created_at: string
          id: string
          is_used: boolean
          session_id: string
          ticket_id: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_used?: boolean
          session_id: string
          ticket_id: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_used?: boolean
          session_id?: string
          ticket_id?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_session_access_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "event_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_session_access_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_templates: {
        Row: {
          created_at: string
          event_id: string
          id: string
          image_url: string | null
          qr_height: number
          qr_width: number
          qr_x: number
          qr_y: number
          status: string
          ticket_type_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          image_url?: string | null
          qr_height?: number
          qr_width?: number
          qr_x?: number
          qr_y?: number
          status?: string
          ticket_type_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          image_url?: string | null
          qr_height?: number
          qr_width?: number
          qr_x?: number
          qr_y?: number
          status?: string
          ticket_type_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_templates_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_templates_ticket_type_id_fkey"
            columns: ["ticket_type_id"]
            isOneToOne: true
            referencedRelation: "ticket_types"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_type_sessions: {
        Row: {
          created_at: string
          id: string
          session_id: string
          ticket_type_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          session_id: string
          ticket_type_id: string
        }
        Update: {
          created_at?: string
          id?: string
          session_id?: string
          ticket_type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_type_sessions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "event_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_type_sessions_ticket_type_id_fkey"
            columns: ["ticket_type_id"]
            isOneToOne: false
            referencedRelation: "ticket_types"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_types: {
        Row: {
          created_at: string
          description: string | null
          event_id: string
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          price: number
          quantity: number
          sold: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_id: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          price?: number
          quantity?: number
          sold?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_id?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          price?: number
          quantity?: number
          sold?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_types_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          created_at: string
          event_id: string
          holder_first_name: string
          holder_last_name: string
          id: string
          is_used: boolean
          order_id: string
          qr_token: string
          ticket_number: string
          ticket_type_id: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          event_id: string
          holder_first_name: string
          holder_last_name: string
          id?: string
          is_used?: boolean
          order_id: string
          qr_token: string
          ticket_number: string
          ticket_type_id: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          event_id?: string
          holder_first_name?: string
          holder_last_name?: string
          id?: string
          is_used?: boolean
          order_id?: string
          qr_token?: string
          ticket_number?: string
          ticket_type_id?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_ticket_type_id_fkey"
            columns: ["ticket_type_id"]
            isOneToOne: false
            referencedRelation: "ticket_types"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          admin_comment: string | null
          amount_requested: number
          created_at: string
          event_id: string | null
          fee_amount: number
          fee_rate: number
          id: string
          net_amount: number
          organizer_id: string
          organizer_note: string | null
          payout_details: string
          payout_method: string
          processed_at: string | null
          processed_by: string | null
          proof_url: string | null
          status: Database["public"]["Enums"]["withdrawal_status"]
          total_debited: number
          transaction_reference: string | null
          updated_at: string
        }
        Insert: {
          admin_comment?: string | null
          amount_requested: number
          created_at?: string
          event_id?: string | null
          fee_amount?: number
          fee_rate?: number
          id?: string
          net_amount?: number
          organizer_id: string
          organizer_note?: string | null
          payout_details: string
          payout_method: string
          processed_at?: string | null
          processed_by?: string | null
          proof_url?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"]
          total_debited?: number
          transaction_reference?: string | null
          updated_at?: string
        }
        Update: {
          admin_comment?: string | null
          amount_requested?: number
          created_at?: string
          event_id?: string | null
          fee_amount?: number
          fee_rate?: number
          id?: string
          net_amount?: number
          organizer_id?: string
          organizer_note?: string | null
          payout_details?: string
          payout_method?: string
          processed_at?: string | null
          processed_by?: string | null
          proof_url?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"]
          total_debited?: number
          transaction_reference?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      organizer_balance: { Args: { _user_id: string }; Returns: number }
    }
    Enums: {
      app_role: "admin" | "organizer" | "host" | "participant"
      custom_page_status:
        | "pending"
        | "in_progress"
        | "ready_for_preview"
        | "awaiting_payment"
        | "paid"
        | "active"
        | "revision_requested"
      event_status:
        | "draft"
        | "published"
        | "ongoing"
        | "completed"
        | "cancelled"
      order_status: "pending" | "paid" | "failed" | "cancelled"
      page_mode: "standard" | "custom"
      withdrawal_status:
        | "pending"
        | "processing"
        | "paid"
        | "rejected"
        | "cancelled"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "organizer", "host", "participant"],
      custom_page_status: [
        "pending",
        "in_progress",
        "ready_for_preview",
        "awaiting_payment",
        "paid",
        "active",
        "revision_requested",
      ],
      event_status: ["draft", "published", "ongoing", "completed", "cancelled"],
      order_status: ["pending", "paid", "failed", "cancelled"],
      page_mode: ["standard", "custom"],
      withdrawal_status: [
        "pending",
        "processing",
        "paid",
        "rejected",
        "cancelled",
      ],
    },
  },
} as const
