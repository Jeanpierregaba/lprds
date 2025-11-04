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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          activity_date: string
          child_id: string
          created_at: string
          description: string | null
          educator_id: string
          id: string
          photos: Json | null
          title: string
          updated_at: string
        }
        Insert: {
          activity_date: string
          child_id: string
          created_at?: string
          description?: string | null
          educator_id: string
          id?: string
          photos?: Json | null
          title: string
          updated_at?: string
        }
        Update: {
          activity_date?: string
          child_id?: string
          created_at?: string
          description?: string | null
          educator_id?: string
          id?: string
          photos?: Json | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_educator_id_fkey"
            columns: ["educator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          arrival_time: string | null
          child_id: string
          created_at: string
          date: string
          departure_time: string | null
          id: string
          notes: string | null
          recorded_by: string
          updated_at: string
        }
        Insert: {
          arrival_time?: string | null
          child_id: string
          created_at?: string
          date: string
          departure_time?: string | null
          id?: string
          notes?: string | null
          recorded_by: string
          updated_at?: string
        }
        Update: {
          arrival_time?: string | null
          child_id?: string
          created_at?: string
          date?: string
          departure_time?: string | null
          id?: string
          notes?: string | null
          recorded_by?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      authorized_persons: {
        Row: {
          child_id: string
          created_at: string
          email: string | null
          first_name: string
          id: string
          is_emergency_contact: boolean | null
          is_pickup_authorized: boolean | null
          last_name: string
          notes: string | null
          phone: string | null
          photo_url: string | null
          relationship: string
          updated_at: string
        }
        Insert: {
          child_id: string
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          is_emergency_contact?: boolean | null
          is_pickup_authorized?: boolean | null
          last_name: string
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          relationship: string
          updated_at?: string
        }
        Update: {
          child_id?: string
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          is_emergency_contact?: boolean | null
          is_pickup_authorized?: boolean | null
          last_name?: string
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          relationship?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_authorized_persons_child"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      children: {
        Row: {
          address: string | null
          administrative_documents: Json | null
          admission_date: string
          allergies: string | null
          assigned_educator_id: string | null
          behavioral_notes: string | null
          birth_date: string
          code_qr_id: string | null
          created_at: string
          dietary_restrictions: Json | null
          emergency_contacts: Json | null
          emergency_contacts_detailed: Json | null
          first_name: string
          group_id: string | null
          id: string
          last_name: string
          medical_history: Json | null
          medical_info: string | null
          medical_info_detailed: Json | null
          photo_url: string | null
          preferences: string | null
          section: Database["public"]["Enums"]["child_section_new"] | null
          special_needs: string | null
          status: Database["public"]["Enums"]["child_status"]
          updated_at: string
          usual_name: string | null
        }
        Insert: {
          address?: string | null
          administrative_documents?: Json | null
          admission_date: string
          allergies?: string | null
          assigned_educator_id?: string | null
          behavioral_notes?: string | null
          birth_date: string
          code_qr_id?: string | null
          created_at?: string
          dietary_restrictions?: Json | null
          emergency_contacts?: Json | null
          emergency_contacts_detailed?: Json | null
          first_name: string
          group_id?: string | null
          id?: string
          last_name: string
          medical_history?: Json | null
          medical_info?: string | null
          medical_info_detailed?: Json | null
          photo_url?: string | null
          preferences?: string | null
          section?: Database["public"]["Enums"]["child_section_new"] | null
          special_needs?: string | null
          status?: Database["public"]["Enums"]["child_status"]
          updated_at?: string
          usual_name?: string | null
        }
        Update: {
          address?: string | null
          administrative_documents?: Json | null
          admission_date?: string
          allergies?: string | null
          assigned_educator_id?: string | null
          behavioral_notes?: string | null
          birth_date?: string
          code_qr_id?: string | null
          created_at?: string
          dietary_restrictions?: Json | null
          emergency_contacts?: Json | null
          emergency_contacts_detailed?: Json | null
          first_name?: string
          group_id?: string | null
          id?: string
          last_name?: string
          medical_history?: Json | null
          medical_info?: string | null
          medical_info_detailed?: Json | null
          photo_url?: string | null
          preferences?: string | null
          section?: Database["public"]["Enums"]["child_section_new"] | null
          special_needs?: string | null
          status?: Database["public"]["Enums"]["child_status"]
          updated_at?: string
          usual_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "children_assigned_educator_id_fkey"
            columns: ["assigned_educator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_children_group"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_attendance: {
        Row: {
          absence_notified: boolean | null
          absence_reason: string | null
          arrival_scanned_by: string | null
          arrival_time: string | null
          attendance_date: string
          child_id: string
          created_at: string
          departure_scanned_by: string | null
          departure_time: string | null
          educator_id: string
          id: string
          is_present: boolean | null
          notes: string | null
          updated_at: string
        }
        Insert: {
          absence_notified?: boolean | null
          absence_reason?: string | null
          arrival_scanned_by?: string | null
          arrival_time?: string | null
          attendance_date?: string
          child_id: string
          created_at?: string
          departure_scanned_by?: string | null
          departure_time?: string | null
          educator_id: string
          id?: string
          is_present?: boolean | null
          notes?: string | null
          updated_at?: string
        }
        Update: {
          absence_notified?: boolean | null
          absence_reason?: string | null
          arrival_scanned_by?: string | null
          arrival_time?: string | null
          attendance_date?: string
          child_id?: string
          created_at?: string
          departure_scanned_by?: string | null
          departure_time?: string | null
          educator_id?: string
          id?: string
          is_present?: boolean | null
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      daily_reports: {
        Row: {
          activities: Json | null
          arrival_time: string | null
          breakfast_eaten: string | null
          child_id: string
          created_at: string
          departure_time: string | null
          educator_id: string
          health_notes: string | null
          health_status: string | null
          hygiene_bath: boolean | null
          hygiene_bowel_movement: boolean | null
          hygiene_frequency_notes: string | null
          id: string
          is_draft: boolean
          is_validated: boolean | null
          lunch_eaten: string | null
          mood: string | null
          nap_duration_minutes: number | null
          nap_taken: boolean | null
          photos: Json | null
          report_date: string
          snack_eaten: string | null
          special_observations: string | null
          temperature_arrival: number | null
          temperature_departure: number | null
          updated_at: string
          validated_at: string | null
          validated_by: string | null
          validation_notes: string | null
        }
        Insert: {
          activities?: Json | null
          arrival_time?: string | null
          breakfast_eaten?: string | null
          child_id: string
          created_at?: string
          departure_time?: string | null
          educator_id: string
          health_notes?: string | null
          health_status?: string | null
          hygiene_bath?: boolean | null
          hygiene_bowel_movement?: boolean | null
          hygiene_frequency_notes?: string | null
          id?: string
          is_draft?: boolean
          is_validated?: boolean | null
          lunch_eaten?: string | null
          mood?: string | null
          nap_duration_minutes?: number | null
          nap_taken?: boolean | null
          photos?: Json | null
          report_date?: string
          snack_eaten?: string | null
          special_observations?: string | null
          temperature_arrival?: number | null
          temperature_departure?: number | null
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
          validation_notes?: string | null
        }
        Update: {
          activities?: Json | null
          arrival_time?: string | null
          breakfast_eaten?: string | null
          child_id?: string
          created_at?: string
          departure_time?: string | null
          educator_id?: string
          health_notes?: string | null
          health_status?: string | null
          hygiene_bath?: boolean | null
          hygiene_bowel_movement?: boolean | null
          hygiene_frequency_notes?: string | null
          id?: string
          is_draft?: boolean
          is_validated?: boolean | null
          lunch_eaten?: string | null
          mood?: string | null
          nap_duration_minutes?: number | null
          nap_taken?: boolean | null
          photos?: Json | null
          report_date?: string
          snack_eaten?: string | null
          special_observations?: string | null
          temperature_arrival?: number | null
          temperature_departure?: number | null
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
          validation_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_reports_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_reports_educator_id_fkey"
            columns: ["educator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_reports_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          age_max_months: number | null
          age_min_months: number | null
          assigned_educator_id: string | null
          capacity: number | null
          created_at: string
          description: string | null
          id: string
          name: string
          section: Database["public"]["Enums"]["child_section_new"] | null
          type: Database["public"]["Enums"]["group_type"]
          updated_at: string
        }
        Insert: {
          age_max_months?: number | null
          age_min_months?: number | null
          assigned_educator_id?: string | null
          capacity?: number | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          section?: Database["public"]["Enums"]["child_section_new"] | null
          type?: Database["public"]["Enums"]["group_type"]
          updated_at?: string
        }
        Update: {
          age_max_months?: number | null
          age_min_months?: number | null
          assigned_educator_id?: string | null
          capacity?: number | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          section?: Database["public"]["Enums"]["child_section_new"] | null
          type?: Database["public"]["Enums"]["group_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_groups_educator"
            columns: ["assigned_educator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      login_history: {
        Row: {
          id: string
          ip_address: unknown
          login_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          id?: string
          ip_address?: unknown
          login_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          id?: string
          ip_address?: unknown
          login_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      medical_records: {
        Row: {
          child_id: string
          created_at: string
          date: string
          description: string
          doctor_contact: string | null
          doctor_name: string | null
          documents: Json | null
          id: string
          notes: string | null
          record_type: string
          recorded_by: string
        }
        Insert: {
          child_id: string
          created_at?: string
          date: string
          description: string
          doctor_contact?: string | null
          doctor_name?: string | null
          documents?: Json | null
          id?: string
          notes?: string | null
          record_type: string
          recorded_by: string
        }
        Update: {
          child_id?: string
          created_at?: string
          date?: string
          description?: string
          doctor_contact?: string | null
          doctor_name?: string | null
          documents?: Json | null
          id?: string
          notes?: string | null
          record_type?: string
          recorded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_medical_records_child"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_medical_records_recorder"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          child_id: string | null
          content: string
          created_at: string
          id: string
          is_read: boolean
          recipient_id: string
          sender_id: string
          subject: string
        }
        Insert: {
          child_id?: string | null
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          recipient_id: string
          sender_id: string
          subject: string
        }
        Update: {
          child_id?: string | null
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          recipient_id?: string
          sender_id?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_children: {
        Row: {
          child_id: string
          created_at: string
          id: string
          is_primary_contact: boolean
          parent_id: string
          relationship: string
        }
        Insert: {
          child_id: string
          created_at?: string
          id?: string
          is_primary_contact?: boolean
          parent_id: string
          relationship?: string
        }
        Update: {
          child_id?: string
          created_at?: string
          id?: string
          is_primary_contact?: boolean
          parent_id?: string
          relationship?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_children_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_children_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          created_at: string
          emergency_contact: string | null
          emergency_phone: string | null
          first_name: string
          id: string
          is_active: boolean
          last_name: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          emergency_contact?: string | null
          emergency_phone?: string | null
          first_name: string
          id?: string
          is_active?: boolean
          last_name: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          emergency_contact?: string | null
          emergency_phone?: string | null
          first_name?: string
          id?: string
          is_active?: boolean
          last_name?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      qr_scan_logs: {
        Row: {
          child_id: string
          created_at: string
          id: string
          location_notes: string | null
          scan_time: string
          scan_type: string
          scanned_by: string
        }
        Insert: {
          child_id: string
          created_at?: string
          id?: string
          location_notes?: string | null
          scan_time?: string
          scan_type: string
          scanned_by: string
        }
        Update: {
          child_id?: string
          created_at?: string
          id?: string
          location_notes?: string | null
          scan_time?: string
          scan_type?: string
          scanned_by?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_educator_children: { Args: { user_uuid: string }; Returns: string[] }
      get_parent_children: { Args: { user_uuid: string }; Returns: string[] }
      get_user_role: {
        Args: { user_uuid: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_admin_or_secretary: { Args: { user_uuid: string }; Returns: boolean }
      is_educator: { Args: { user_uuid: string }; Returns: boolean }
    }
    Enums: {
      child_section:
        | "creche"
        | "garderie"
        | "maternelle_etoile"
        | "maternelle_soleil"
      child_section_new:
        | "creche_etoile"
        | "creche_nuage"
        | "creche_soleil"
        | "garderie"
        | "maternelle_PS1"
        | "maternelle_PS2"
        | "maternelle_MS"
        | "maternelle_GS"
      child_status: "active" | "inactive" | "waiting_list"
      group_type: "age_group" | "mixed_group" | "class"
      user_role: "admin" | "secretary" | "educator" | "parent"
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
      child_section: [
        "creche",
        "garderie",
        "maternelle_etoile",
        "maternelle_soleil",
      ],
      child_section_new: [
        "creche_etoile",
        "creche_nuage",
        "creche_soleil",
        "garderie",
        "maternelle_PS1",
        "maternelle_PS2",
        "maternelle_MS",
        "maternelle_GS",
      ],
      child_status: ["active", "inactive", "waiting_list"],
      group_type: ["age_group", "mixed_group", "class"],
      user_role: ["admin", "secretary", "educator", "parent"],
    },
  },
} as const
