export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      category_budgets: {
        Row: {
          categoria_nome: string
          categoria_tipo: string
          created_at: string
          id: string
          orcamento: number
          updated_at: string
          usuario_id: string
        }
        Insert: {
          categoria_nome: string
          categoria_tipo: string
          created_at?: string
          id?: string
          orcamento?: number
          updated_at?: string
          usuario_id: string
        }
        Update: {
          categoria_nome?: string
          categoria_tipo?: string
          created_at?: string
          id?: string
          orcamento?: number
          updated_at?: string
          usuario_id?: string
        }
        Relationships: []
      }
      "Dados planilha": {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      lancamentos: {
        Row: {
          categoria: string
          created_at: string
          data: string
          descricao: string | null
          ganhos: number | null
          id: number
          parcelas: number
          quem_gastou: string
          tipo: string
          usuario_id: string
          valor: number
        }
        Insert: {
          categoria: string
          created_at?: string
          data: string
          descricao?: string | null
          ganhos?: number | null
          id?: number
          parcelas?: number
          quem_gastou: string
          tipo: string
          usuario_id: string
          valor: number
        }
        Update: {
          categoria?: string
          created_at?: string
          data?: string
          descricao?: string | null
          ganhos?: number | null
          id?: number
          parcelas?: number
          quem_gastou?: string
          tipo?: string
          usuario_id?: string
          valor?: number
        }
        Relationships: []
      }
      properties: {
        Row: {
          accessibility_score: number
          address: string
          area: number
          bathrooms: number
          bedrooms: number
          condo: number
          condo_score: number
          created_at: string
          final_score: number
          finishing_score: number
          fire_insurance: number
          floor: string | null
          furniture_score: number
          id: string
          images: string[] | null
          internal_space_score: number
          iptu: number
          location_score: number
          location_summary: string | null
          other_fees: number
          parking_spaces: number
          price_score: number
          rent: number
          source_url: string | null
          title: string
          total_monthly_cost: number
          updated_at: string
          user_id: string
        }
        Insert: {
          accessibility_score?: number
          address: string
          area: number
          bathrooms?: number
          bedrooms?: number
          condo?: number
          condo_score?: number
          created_at?: string
          final_score?: number
          finishing_score?: number
          fire_insurance?: number
          floor?: string | null
          furniture_score?: number
          id?: string
          images?: string[] | null
          internal_space_score?: number
          iptu?: number
          location_score?: number
          location_summary?: string | null
          other_fees?: number
          parking_spaces?: number
          price_score?: number
          rent: number
          source_url?: string | null
          title: string
          total_monthly_cost: number
          updated_at?: string
          user_id: string
        }
        Update: {
          accessibility_score?: number
          address?: string
          area?: number
          bathrooms?: number
          bedrooms?: number
          condo?: number
          condo_score?: number
          created_at?: string
          final_score?: number
          finishing_score?: number
          fire_insurance?: number
          floor?: string | null
          furniture_score?: number
          id?: string
          images?: string[] | null
          internal_space_score?: number
          iptu?: number
          location_score?: number
          location_summary?: string | null
          other_fees?: number
          parking_spaces?: number
          price_score?: number
          rent?: number
          source_url?: string | null
          title?: string
          total_monthly_cost?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_criteria_preferences: {
        Row: {
          ativo: boolean
          created_at: string
          criterio_nome: string
          id: string
          peso: number
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          criterio_nome: string
          id?: string
          peso?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          criterio_nome?: string
          id?: string
          peso?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string
          id: string
          objetivo_principal: string
          profile_type: string
          situacao_moradia: string
          updated_at: string
          user_id: string
          valor_principal: string
        }
        Insert: {
          created_at?: string
          id?: string
          objetivo_principal: string
          profile_type: string
          situacao_moradia: string
          updated_at?: string
          user_id: string
          valor_principal: string
        }
        Update: {
          created_at?: string
          id?: string
          objetivo_principal?: string
          profile_type?: string
          situacao_moradia?: string
          updated_at?: string
          user_id?: string
          valor_principal?: string
        }
        Relationships: []
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
