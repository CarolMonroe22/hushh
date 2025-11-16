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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      asmr_sessions: {
        Row: {
          ambient: string
          audio_url: string
          created_at: string | null
          id: string
          mood: string
          times_played: number | null
          week_key: string
        }
        Insert: {
          ambient: string
          audio_url: string
          created_at?: string | null
          id?: string
          mood: string
          times_played?: number | null
          week_key: string
        }
        Update: {
          ambient?: string
          audio_url?: string
          created_at?: string | null
          id?: string
          mood?: string
          times_played?: number | null
          week_key?: string
        }
        Relationships: []
      }
      early_access_emails: {
        Row: {
          created_at: string | null
          email: string
          feature: string
          id: string
          notified: boolean | null
          vote_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          feature?: string
          id?: string
          notified?: boolean | null
          vote_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          feature?: string
          id?: string
          notified?: boolean | null
          vote_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "early_access_emails_vote_id_fkey"
            columns: ["vote_id"]
            isOneToOne: false
            referencedRelation: "votes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          favorite_ambients: string[] | null
          favorite_moods: string[] | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          favorite_ambients?: string[] | null
          favorite_moods?: string[] | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          favorite_ambients?: string[] | null
          favorite_moods?: string[] | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          request_count: number | null
          updated_at: string | null
          user_id: string
          window_start: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          request_count?: number | null
          updated_at?: string | null
          user_id: string
          window_start?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          request_count?: number | null
          updated_at?: string | null
          user_id?: string
          window_start?: string | null
        }
        Relationships: []
      }
      usage_analytics: {
        Row: {
          created_at: string | null
          endpoint: string
          error_message: string | null
          id: string
          latency_ms: number | null
          success: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          error_message?: string | null
          id?: string
          latency_ms?: number | null
          success?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          error_message?: string | null
          id?: string
          latency_ms?: number | null
          success?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          ambient: string | null
          audio_url: string
          binaural_experience: string | null
          created_at: string | null
          duration_seconds: number | null
          id: string
          is_favorite: boolean | null
          last_played_at: string | null
          mood: string | null
          session_type: string
          times_played: number | null
          updated_at: string | null
          user_id: string
          vibe_description: string | null
          voice_gender: string | null
          voice_journey: string | null
        }
        Insert: {
          ambient?: string | null
          audio_url: string
          binaural_experience?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          is_favorite?: boolean | null
          last_played_at?: string | null
          mood?: string | null
          session_type: string
          times_played?: number | null
          updated_at?: string | null
          user_id: string
          vibe_description?: string | null
          voice_gender?: string | null
          voice_journey?: string | null
        }
        Update: {
          ambient?: string | null
          audio_url?: string
          binaural_experience?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          is_favorite?: boolean | null
          last_played_at?: string | null
          mood?: string | null
          session_type?: string
          times_played?: number | null
          updated_at?: string | null
          user_id?: string
          vibe_description?: string | null
          voice_gender?: string | null
          voice_journey?: string | null
        }
        Relationships: []
      }
      votes: {
        Row: {
          created_at: string | null
          feature: string
          id: string
          ip_address: unknown
          session_id: string | null
          user_agent: string | null
          vote: string
        }
        Insert: {
          created_at?: string | null
          feature?: string
          id?: string
          ip_address?: unknown
          session_id?: string | null
          user_agent?: string | null
          vote: string
        }
        Update: {
          created_at?: string | null
          feature?: string
          id?: string
          ip_address?: unknown
          session_id?: string | null
          user_agent?: string | null
          vote?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
      increment_rate_limit:
        | {
            Args: {
              p_endpoint: string
              p_user_id: string
              p_window_start: string
            }
            Returns: undefined
          }
        | {
            Args: {
              p_endpoint: string
              p_user_id: string
              p_window_start: string
            }
            Returns: undefined
          }
      increment_session_play_count: {
        Args: { session_id: string }
        Returns: undefined
      }
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
