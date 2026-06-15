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
      builders: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      inspection_questions: {
        Row: {
          allow_photos: boolean | null
          created_at: string | null
          display_order: number
          id: string
          is_active: boolean | null
          question_text: string
          response_type_id: string | null
          section_id: string | null
        }
        Insert: {
          allow_photos?: boolean | null
          created_at?: string | null
          display_order?: number
          id?: string
          is_active?: boolean | null
          question_text: string
          response_type_id?: string | null
          section_id?: string | null
        }
        Update: {
          allow_photos?: boolean | null
          created_at?: string | null
          display_order?: number
          id?: string
          is_active?: boolean | null
          question_text?: string
          response_type_id?: string | null
          section_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inspection_questions_response_type_id_fkey"
            columns: ["response_type_id"]
            isOneToOne: false
            referencedRelation: "response_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_questions_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "inspection_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_responses: {
        Row: {
          comments: string | null
          created_at: string | null
          id: string
          inspection_id: string | null
          is_compliant: boolean | null
          photo_urls: string[] | null
          question_id: string | null
        }
        Insert: {
          comments?: string | null
          created_at?: string | null
          id?: string
          inspection_id?: string | null
          is_compliant?: boolean | null
          photo_urls?: string[] | null
          question_id?: string | null
        }
        Update: {
          comments?: string | null
          created_at?: string | null
          id?: string
          inspection_id?: string | null
          is_compliant?: boolean | null
          photo_urls?: string[] | null
          question_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inspection_responses_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "site_inspections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "inspection_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_sections: {
        Row: {
          created_at: string | null
          display_order: number
          id: string
          is_active: boolean | null
          title: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number
          id?: string
          is_active?: boolean | null
          title: string
        }
        Update: {
          created_at?: string | null
          display_order?: number
          id?: string
          is_active?: boolean | null
          title?: string
        }
        Relationships: []
      }
      inspection_signatures: {
        Row: {
          created_at: string | null
          id: string
          inspection_id: string | null
          name: string
          position_id: string | null
          signature_data: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          inspection_id?: string | null
          name: string
          position_id?: string | null
          signature_data: string
        }
        Update: {
          created_at?: string | null
          id?: string
          inspection_id?: string | null
          name?: string
          position_id?: string | null
          signature_data?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspection_signatures_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "site_inspections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_signatures_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          netsuite_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          netsuite_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          netsuite_id?: string | null
        }
        Relationships: []
      }
      positions: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      response_types: {
        Row: {
          code: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      roles: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      site_inspections: {
        Row: {
          builder_id: string | null
          created_at: string | null
          id: string
          inspection_date: string
          inspector_id: string | null
          operatives_on_site: number | null
          pdf_url: string | null
          site_id: string | null
          status: string | null
          supervisor_qualification: string | null
        }
        Insert: {
          builder_id?: string | null
          created_at?: string | null
          id?: string
          inspection_date?: string
          inspector_id?: string | null
          operatives_on_site?: number | null
          pdf_url?: string | null
          site_id?: string | null
          status?: string | null
          supervisor_qualification?: string | null
        }
        Update: {
          builder_id?: string | null
          created_at?: string | null
          id?: string
          inspection_date?: string
          inspector_id?: string | null
          operatives_on_site?: number | null
          pdf_url?: string | null
          site_id?: string | null
          status?: string | null
          supervisor_qualification?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_inspections_builder_id_fkey"
            columns: ["builder_id"]
            isOneToOne: false
            referencedRelation: "builders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_inspections_inspector_id_fkey"
            columns: ["inspector_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_inspections_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          builder_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          builder_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          builder_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "sites_builder_id_fkey"
            columns: ["builder_id"]
            isOneToOne: false
            referencedRelation: "builders"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          account_type: string | null
          address: string | null
          cis_status: string | null
          company_name: string | null
          company_reg_number: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          job_title: string | null
          last_name: string | null
          national_insurance: string | null
          phone: string | null
          primary_location_id: string | null
          qualification: string | null
          role_id: string
          status: string | null
          utr_number: string | null
        }
        Insert: {
          account_type?: string | null
          address?: string | null
          cis_status?: string | null
          company_name?: string | null
          company_reg_number?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id: string
          job_title?: string | null
          last_name?: string | null
          national_insurance?: string | null
          phone?: string | null
          primary_location_id?: string | null
          qualification?: string | null
          role_id?: string
          status?: string | null
          utr_number?: string | null
        }
        Update: {
          account_type?: string | null
          address?: string | null
          cis_status?: string | null
          company_name?: string | null
          company_reg_number?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          job_title?: string | null
          last_name?: string | null
          national_insurance?: string | null
          phone?: string | null
          primary_location_id?: string | null
          qualification?: string | null
          role_id?: string
          status?: string | null
          utr_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_primary_depot_id_fkey"
            columns: ["primary_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
