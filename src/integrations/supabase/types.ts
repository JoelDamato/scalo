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
      activities: {
        Row: {
          created_at: string
          id: string
          message: string
          project_id: string | null
          task_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          project_id?: string | null
          task_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          project_id?: string | null
          task_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      arca_config: {
        Row: {
          api_token_encrypted: string | null
          condicion_iva: string
          created_at: string
          cuit: string
          enabled: boolean
          environment: string
          id: string
          punto_venta: number
          tipo_comprobante: string
          updated_at: string
          user_id: string
        }
        Insert: {
          api_token_encrypted?: string | null
          condicion_iva?: string
          created_at?: string
          cuit: string
          enabled?: boolean
          environment?: string
          id?: string
          punto_venta?: number
          tipo_comprobante?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          api_token_encrypted?: string | null
          condicion_iva?: string
          created_at?: string
          cuit?: string
          enabled?: boolean
          environment?: string
          id?: string
          punto_venta?: number
          tipo_comprobante?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      arca_invoices: {
        Row: {
          cae: string | null
          cae_vencimiento: string | null
          cliente_cuit_dni: string | null
          cliente_nombre: string | null
          created_at: string
          error_message: string | null
          estado: string
          fecha_emision: string | null
          finance_record_id: string | null
          id: string
          importe_total: number | null
          numero_comprobante: number | null
          punto_venta: number | null
          raw_response: Json | null
          tipo_comprobante: string | null
          updated_at: string
        }
        Insert: {
          cae?: string | null
          cae_vencimiento?: string | null
          cliente_cuit_dni?: string | null
          cliente_nombre?: string | null
          created_at?: string
          error_message?: string | null
          estado?: string
          fecha_emision?: string | null
          finance_record_id?: string | null
          id?: string
          importe_total?: number | null
          numero_comprobante?: number | null
          punto_venta?: number | null
          raw_response?: Json | null
          tipo_comprobante?: string | null
          updated_at?: string
        }
        Update: {
          cae?: string | null
          cae_vencimiento?: string | null
          cliente_cuit_dni?: string | null
          cliente_nombre?: string | null
          created_at?: string
          error_message?: string | null
          estado?: string
          fecha_emision?: string | null
          finance_record_id?: string | null
          id?: string
          importe_total?: number | null
          numero_comprobante?: number | null
          punto_venta?: number | null
          raw_response?: Json | null
          tipo_comprobante?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "arca_invoices_finance_record_id_fkey"
            columns: ["finance_record_id"]
            isOneToOne: false
            referencedRelation: "finance_records"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          task_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          task_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_announcements: {
        Row: {
          content: string
          created_at: string
          created_by: string
          id: string
          is_pinned: boolean
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          id?: string
          is_pinned?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          is_pinned?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      crm_events: {
        Row: {
          created_at: string
          created_by: string
          converted_task_id: string | null
          description: string | null
          end_time: string | null
          event_date: string
          event_time: string | null
          event_type: string
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          converted_task_id?: string | null
          description?: string | null
          end_time?: string | null
          event_date: string
          event_time?: string | null
          event_type?: string
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          converted_task_id?: string | null
          description?: string | null
          end_time?: string | null
          event_date?: string
          event_time?: string | null
          event_type?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      crm_interactions: {
        Row: {
          content: string | null
          created_at: string
          created_by: string
          customer_id: string
          follow_up_date: string | null
          id: string
          interaction_date: string
          opportunity_id: string | null
          subject: string
          type: Database["public"]["Enums"]["interaction_type"]
        }
        Insert: {
          content?: string | null
          created_at?: string
          created_by: string
          customer_id: string
          follow_up_date?: string | null
          id?: string
          interaction_date?: string
          opportunity_id?: string | null
          subject: string
          type?: Database["public"]["Enums"]["interaction_type"]
        }
        Update: {
          content?: string | null
          created_at?: string
          created_by?: string
          customer_id?: string
          follow_up_date?: string | null
          id?: string
          interaction_date?: string
          opportunity_id?: string | null
          subject?: string
          type?: Database["public"]["Enums"]["interaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "crm_interactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_interactions_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "crm_opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_opportunities: {
        Row: {
          created_at: string
          currency: string | null
          customer_id: string
          expected_close_date: string | null
          id: string
          lost_at: string | null
          lost_reason: string | null
          notes: string | null
          probability: number | null
          stage: Database["public"]["Enums"]["customer_stage"]
          title: string
          updated_at: string
          value: number | null
          won_at: string | null
        }
        Insert: {
          created_at?: string
          currency?: string | null
          customer_id: string
          expected_close_date?: string | null
          id?: string
          lost_at?: string | null
          lost_reason?: string | null
          notes?: string | null
          probability?: number | null
          stage?: Database["public"]["Enums"]["customer_stage"]
          title: string
          updated_at?: string
          value?: number | null
          won_at?: string | null
        }
        Update: {
          created_at?: string
          currency?: string | null
          customer_id?: string
          expected_close_date?: string | null
          id?: string
          lost_at?: string | null
          lost_reason?: string | null
          notes?: string | null
          probability?: number | null
          stage?: Database["public"]["Enums"]["customer_stage"]
          title?: string
          updated_at?: string
          value?: number | null
          won_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_opportunities_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          assigned_to: string | null
          booking_id: string | null
          budget: string | null
          client_type: string | null
          company: string | null
          created_at: string
          email: string | null
          fbclid: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          project_type: string | null
          qualified: boolean | null
          ready_to_invest: string | null
          scheduled_call_time: string | null
          source: string | null
          stage: Database["public"]["Enums"]["customer_stage"]
          updated_at: string
          urgency: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          assigned_to?: string | null
          booking_id?: string | null
          budget?: string | null
          client_type?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          fbclid?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          project_type?: string | null
          qualified?: boolean | null
          ready_to_invest?: string | null
          scheduled_call_time?: string | null
          source?: string | null
          stage?: Database["public"]["Enums"]["customer_stage"]
          updated_at?: string
          urgency?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          assigned_to?: string | null
          booking_id?: string | null
          budget?: string | null
          client_type?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          fbclid?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          project_type?: string | null
          qualified?: boolean | null
          ready_to_invest?: string | null
          scheduled_call_time?: string | null
          source?: string | null
          stage?: Database["public"]["Enums"]["customer_stage"]
          updated_at?: string
          urgency?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          amount_ars: number | null
          category: Database["public"]["Enums"]["expense_category"]
          created_at: string
          currency: string
          description: string
          exchange_rate: number | null
          exchange_rate_date: string | null
          exchange_source: string | null
          expense_date: string
          id: string
          is_recurring: boolean
          notes: string | null
          receipt_file_name: string | null
          receipt_path: string | null
          recurring_interval: string | null
          updated_at: string
          vendor_name: string | null
        }
        Insert: {
          amount: number
          amount_ars?: number | null
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          currency?: string
          description: string
          exchange_rate?: number | null
          exchange_rate_date?: string | null
          exchange_source?: string | null
          expense_date?: string
          id?: string
          is_recurring?: boolean
          notes?: string | null
          receipt_file_name?: string | null
          receipt_path?: string | null
          recurring_interval?: string | null
          updated_at?: string
          vendor_name?: string | null
        }
        Update: {
          amount?: number
          amount_ars?: number | null
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          currency?: string
          description?: string
          exchange_rate?: number | null
          exchange_rate_date?: string | null
          exchange_source?: string | null
          expense_date?: string
          id?: string
          is_recurring?: boolean
          notes?: string | null
          receipt_file_name?: string | null
          receipt_path?: string | null
          recurring_interval?: string | null
          updated_at?: string
          vendor_name?: string | null
        }
        Relationships: []
      }
      finance_records: {
        Row: {
          amount: number
          amount_ars: number | null
          created_at: string
          currency: string
          description: string
          exchange_rate: number | null
          exchange_rate_date: string | null
          exchange_source: string | null
          id: string
          internal_notes: string | null
          invoice_date: string | null
          payment_method: string | null
          payment_status: string
          project_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          amount_ars?: number | null
          created_at?: string
          currency?: string
          description: string
          exchange_rate?: number | null
          exchange_rate_date?: string | null
          exchange_source?: string | null
          id?: string
          internal_notes?: string | null
          invoice_date?: string | null
          payment_method?: string | null
          payment_status?: string
          project_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          amount_ars?: number | null
          created_at?: string
          currency?: string
          description?: string
          exchange_rate?: number | null
          exchange_rate_date?: string | null
          exchange_source?: string | null
          id?: string
          internal_notes?: string | null
          invoice_date?: string | null
          payment_method?: string | null
          payment_status?: string
          project_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_records_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_monthly_overrides: {
        Row: {
          created_at: string
          expenses_ars: number | null
          id: string
          month: string
          notes: string | null
          revenue_ars: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          expenses_ars?: number | null
          id?: string
          month: string
          notes?: string | null
          revenue_ars?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          expenses_ars?: number | null
          id?: string
          month?: string
          notes?: string | null
          revenue_ars?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      initiative_briefs: {
        Row: {
          business_model: string | null
          business_risks: string | null
          created_at: string
          executive_summary: string | null
          existing_solutions: string | null
          id: string
          implementation_strategy: string | null
          initiative_id: string
          is_completed: boolean
          job_to_be_done: string | null
          key_features: string | null
          market_analysis: string | null
          platform_recommendation: string | null
          problem_statement: string | null
          product_objectives: string | null
          proposed_solution: string | null
          success_metrics: string | null
          target_users: string | null
          technical_risks: string | null
          updated_at: string
        }
        Insert: {
          business_model?: string | null
          business_risks?: string | null
          created_at?: string
          executive_summary?: string | null
          existing_solutions?: string | null
          id?: string
          implementation_strategy?: string | null
          initiative_id: string
          is_completed?: boolean
          job_to_be_done?: string | null
          key_features?: string | null
          market_analysis?: string | null
          platform_recommendation?: string | null
          problem_statement?: string | null
          product_objectives?: string | null
          proposed_solution?: string | null
          success_metrics?: string | null
          target_users?: string | null
          technical_risks?: string | null
          updated_at?: string
        }
        Update: {
          business_model?: string | null
          business_risks?: string | null
          created_at?: string
          executive_summary?: string | null
          existing_solutions?: string | null
          id?: string
          implementation_strategy?: string | null
          initiative_id?: string
          is_completed?: boolean
          job_to_be_done?: string | null
          key_features?: string | null
          market_analysis?: string | null
          platform_recommendation?: string | null
          problem_statement?: string | null
          product_objectives?: string | null
          proposed_solution?: string | null
          success_metrics?: string | null
          target_users?: string | null
          technical_risks?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "initiative_briefs_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: true
            referencedRelation: "product_initiatives"
            referencedColumns: ["id"]
          },
        ]
      }
      initiative_features: {
        Row: {
          acceptance_criteria: string[] | null
          complexity: Database["public"]["Enums"]["feature_complexity"]
          created_at: string
          description: string | null
          id: string
          initiative_id: string
          name: string
          priority: Database["public"]["Enums"]["feature_priority"]
          sort_order: number
          status: string
          updated_at: string
          user_story: string | null
        }
        Insert: {
          acceptance_criteria?: string[] | null
          complexity?: Database["public"]["Enums"]["feature_complexity"]
          created_at?: string
          description?: string | null
          id?: string
          initiative_id: string
          name: string
          priority?: Database["public"]["Enums"]["feature_priority"]
          sort_order?: number
          status?: string
          updated_at?: string
          user_story?: string | null
        }
        Update: {
          acceptance_criteria?: string[] | null
          complexity?: Database["public"]["Enums"]["feature_complexity"]
          created_at?: string
          description?: string | null
          id?: string
          initiative_id?: string
          name?: string
          priority?: Database["public"]["Enums"]["feature_priority"]
          sort_order?: number
          status?: string
          updated_at?: string
          user_story?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "initiative_features_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "product_initiatives"
            referencedColumns: ["id"]
          },
        ]
      }
      initiative_prds: {
        Row: {
          acceptance_criteria: string | null
          created_at: string
          dependencies: string | null
          design_guidelines: string | null
          edge_cases: string | null
          feature_id: string
          id: string
          is_completed: boolean
          non_functional_requirements: string | null
          overview: string | null
          updated_at: string
          use_cases: Json | null
        }
        Insert: {
          acceptance_criteria?: string | null
          created_at?: string
          dependencies?: string | null
          design_guidelines?: string | null
          edge_cases?: string | null
          feature_id: string
          id?: string
          is_completed?: boolean
          non_functional_requirements?: string | null
          overview?: string | null
          updated_at?: string
          use_cases?: Json | null
        }
        Update: {
          acceptance_criteria?: string | null
          created_at?: string
          dependencies?: string | null
          design_guidelines?: string | null
          edge_cases?: string | null
          feature_id?: string
          id?: string
          is_completed?: boolean
          non_functional_requirements?: string | null
          overview?: string | null
          updated_at?: string
          use_cases?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "initiative_prds_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: true
            referencedRelation: "initiative_features"
            referencedColumns: ["id"]
          },
        ]
      }
      initiative_questionnaires: {
        Row: {
          created_at: string
          id: string
          initiative_id: string
          is_completed: boolean
          responses: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          initiative_id: string
          is_completed?: boolean
          responses?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          initiative_id?: string
          is_completed?: boolean
          responses?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "initiative_questionnaires_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: true
            referencedRelation: "product_initiatives"
            referencedColumns: ["id"]
          },
        ]
      }
      initiative_screens: {
        Row: {
          created_at: string
          description: string | null
          flow_name: string | null
          id: string
          initiative_id: string
          name: string
          screen_type: string | null
          step_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          flow_name?: string | null
          id?: string
          initiative_id: string
          name: string
          screen_type?: string | null
          step_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          flow_name?: string | null
          id?: string
          initiative_id?: string
          name?: string
          screen_type?: string | null
          step_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "initiative_screens_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "product_initiatives"
            referencedColumns: ["id"]
          },
        ]
      }
      initiative_shares: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          initiative_id: string
          is_active: boolean
          share_token: string
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          initiative_id: string
          is_active?: boolean
          share_token?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          initiative_id?: string
          is_active?: boolean
          share_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "initiative_shares_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "product_initiatives"
            referencedColumns: ["id"]
          },
        ]
      }
      initiative_tech_docs: {
        Row: {
          api_routes: Json | null
          authentication: string | null
          backend_structure: string | null
          created_at: string
          database_schema: string | null
          frontend_guidelines: string | null
          id: string
          implementation_plan: string | null
          initiative_id: string
          integrations: string | null
          is_completed: boolean
          tech_stack: Json | null
          updated_at: string
        }
        Insert: {
          api_routes?: Json | null
          authentication?: string | null
          backend_structure?: string | null
          created_at?: string
          database_schema?: string | null
          frontend_guidelines?: string | null
          id?: string
          implementation_plan?: string | null
          initiative_id: string
          integrations?: string | null
          is_completed?: boolean
          tech_stack?: Json | null
          updated_at?: string
        }
        Update: {
          api_routes?: Json | null
          authentication?: string | null
          backend_structure?: string | null
          created_at?: string
          database_schema?: string | null
          frontend_guidelines?: string | null
          id?: string
          implementation_plan?: string | null
          initiative_id?: string
          integrations?: string | null
          is_completed?: boolean
          tech_stack?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "initiative_tech_docs_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: true
            referencedRelation: "product_initiatives"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_read: boolean
          link: string | null
          message: string
          project_id: string | null
          task_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          project_id?: string | null
          task_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          project_id?: string | null
          task_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      product_initiatives: {
        Row: {
          created_at: string
          current_step: Database["public"]["Enums"]["initiative_step"]
          id: string
          name: string
          product_type: Database["public"]["Enums"]["product_type"]
          project_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_step?: Database["public"]["Enums"]["initiative_step"]
          id?: string
          name: string
          product_type?: Database["public"]["Enums"]["product_type"]
          project_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_step?: Database["public"]["Enums"]["initiative_step"]
          id?: string
          name?: string
          product_type?: Database["public"]["Enums"]["product_type"]
          project_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_initiatives_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      google_calendar_connections: {
        Row: {
          access_token: string
          calendar_id: string
          calendar_summary: string | null
          created_at: string
          google_email: string | null
          id: string
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          calendar_id?: string
          calendar_summary?: string | null
          created_at?: string
          google_email?: string | null
          id?: string
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          calendar_id?: string
          calendar_summary?: string | null
          created_at?: string
          google_email?: string | null
          id?: string
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      google_calendar_oauth_states: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          state: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          state: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          state?: string
          user_id?: string
        }
        Relationships: []
      }
      google_calendar_syncs: {
        Row: {
          calendar_id: string
          created_at: string
          google_event_id: string
          id: string
          source_id: string
          source_type: string
          synced_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          calendar_id?: string
          created_at?: string
          google_event_id: string
          id?: string
          source_id: string
          source_type: string
          synced_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          calendar_id?: string
          created_at?: string
          google_event_id?: string
          id?: string
          source_id?: string
          source_type?: string
          synced_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      project_events: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          event_date: string
          event_end_time: string | null
          event_time: string | null
          event_type: string
          id: string
          project_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          event_date: string
          event_end_time?: string | null
          event_time?: string | null
          event_type?: string
          id?: string
          project_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          event_date?: string
          event_end_time?: string | null
          event_time?: string | null
          event_type?: string
          id?: string
          project_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_credentials: {
        Row: {
          access_url: string | null
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          password: string
          project_id: string
          tool_name: string
          updated_at: string
          username: string | null
        }
        Insert: {
          access_url?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          password: string
          project_id: string
          tool_name: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          access_url?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          password?: string
          project_id?: string
          tool_name?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_credentials_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_instructions: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          id: string
          instruction_url: string | null
          project_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          instruction_url?: string | null
          project_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          instruction_url?: string | null
          project_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_instructions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_pages: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          page_url: string
          project_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          page_url: string
          project_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          page_url?: string
          project_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_pages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_knowledge_base: {
        Row: {
          created_at: string
          id: string
          is_completed: boolean
          project_id: string
          responses: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_completed?: boolean
          project_id: string
          responses?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_completed?: boolean
          project_id?: string
          responses?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_knowledge_base_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          created_at: string
          id: string
          project_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          client_id: string | null
          created_at: string
          customer_id: string | null
          description: string | null
          id: string
          name: string
          onboarding_token: string
          status: string
          support_active: boolean
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          customer_id?: string | null
          description?: string | null
          id?: string
          name: string
          onboarding_token?: string
          status?: string
          support_active?: boolean
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          customer_id?: string | null
          description?: string | null
          id?: string
          name?: string
          onboarding_token?: string
          status?: string
          support_active?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      report_addendums: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          report_id: string
          title: string | null
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          report_id: string
          title?: string | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          report_id?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_addendums_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          content: string
          created_at: string
          created_by: string
          id: string
          report_date: string
          title: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          id?: string
          report_date?: string
          title: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          report_date?: string
          title?: string
        }
        Relationships: []
      }
      report_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          report_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          report_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          report_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_comments_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          category: string | null
          content: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          title: string
          type: string
          updated_at: string
          url: string | null
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          title: string
          type?: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          title?: string
          type?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      sprints: {
        Row: {
          created_at: string
          end_date: string
          goal: string | null
          id: string
          name: string
          project_id: string
          start_date: string
          status: Database["public"]["Enums"]["sprint_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date?: string
          goal?: string | null
          id?: string
          name: string
          project_id: string
          start_date?: string
          status?: Database["public"]["Enums"]["sprint_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          goal?: string | null
          id?: string
          name?: string
          project_id?: string
          start_date?: string
          status?: Database["public"]["Enums"]["sprint_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sprints_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: Database["public"]["Enums"]["ticket_category"]
          created_at: string
          created_by: string
          description: string | null
          first_response_at: string | null
          id: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          project_id: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category?: Database["public"]["Enums"]["ticket_category"]
          created_at?: string
          created_by: string
          description?: string | null
          first_response_at?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          project_id?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category?: Database["public"]["Enums"]["ticket_category"]
          created_at?: string
          created_by?: string
          description?: string | null
          first_response_at?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          project_id?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      task_assignees: {
        Row: {
          created_at: string
          id: string
          task_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          task_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_assignees_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_checklist_items: {
        Row: {
          content: string
          created_at: string
          id: string
          is_completed: boolean
          sort_order: number
          task_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_completed?: boolean
          sort_order?: number
          task_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_completed?: boolean
          sort_order?: number
          task_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_checklist_items_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee_id: string | null
          client_input_required: boolean
          created_at: string
          description: string | null
          id: string
          is_client_visible: boolean
          project_id: string | null
          source_ticket_id: string | null
          scheduled_date: string | null
          scheduled_end_time: string | null
          scheduled_time: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          client_input_required?: boolean
          created_at?: string
          description?: string | null
          id?: string
          is_client_visible?: boolean
          project_id?: string | null
          source_ticket_id?: string | null
          scheduled_date?: string | null
          scheduled_end_time?: string | null
          scheduled_time?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          client_input_required?: boolean
          created_at?: string
          description?: string | null
          id?: string
          is_client_visible?: boolean
          project_id?: string | null
          source_ticket_id?: string | null
          scheduled_date?: string | null
          scheduled_end_time?: string | null
          scheduled_time?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      task_attachments: {
        Row: {
          content_type: string
          created_at: string
          file_name: string
          file_path: string
          file_size: number
          id: string
          task_id: string
          uploaded_by: string
        }
        Insert: {
          content_type: string
          created_at?: string
          file_name: string
          file_path: string
          file_size: number
          id?: string
          task_id: string
          uploaded_by: string
        }
        Update: {
          content_type?: string
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          task_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_attachments: {
        Row: {
          content_type: string
          created_at: string
          file_name: string
          file_path: string
          file_size: number
          id: string
          is_internal: boolean
          message_id: string | null
          ticket_id: string
          uploaded_by: string
        }
        Insert: {
          content_type: string
          created_at?: string
          file_name: string
          file_path: string
          file_size: number
          id?: string
          is_internal?: boolean
          message_id?: string | null
          ticket_id: string
          uploaded_by: string
        }
        Update: {
          content_type?: string
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          is_internal?: boolean
          message_id?: string | null
          ticket_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "ticket_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_attachments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_messages: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          is_internal: boolean
          ticket_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          is_internal?: boolean
          ticket_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          is_internal?: boolean
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
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
          role?: Database["public"]["Enums"]["app_role"]
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
      user_stories: {
        Row: {
          acceptance_criteria: string[] | null
          assigned_to: string | null
          client_input_required: boolean
          created_at: string
          description: string | null
          id: string
          is_ai_generated: boolean
          is_client_visible: boolean
          points: number | null
          priority: Database["public"]["Enums"]["feature_priority"]
          project_id: string
          source_feature_id: string | null
          sprint_id: string | null
          status: Database["public"]["Enums"]["story_status"]
          title: string
          updated_at: string
        }
        Insert: {
          acceptance_criteria?: string[] | null
          assigned_to?: string | null
          client_input_required?: boolean
          created_at?: string
          description?: string | null
          id?: string
          is_ai_generated?: boolean
          is_client_visible?: boolean
          points?: number | null
          priority?: Database["public"]["Enums"]["feature_priority"]
          project_id: string
          source_feature_id?: string | null
          sprint_id?: string | null
          status?: Database["public"]["Enums"]["story_status"]
          title: string
          updated_at?: string
        }
        Update: {
          acceptance_criteria?: string[] | null
          assigned_to?: string | null
          client_input_required?: boolean
          created_at?: string
          description?: string | null
          id?: string
          is_ai_generated?: boolean
          is_client_visible?: boolean
          points?: number | null
          priority?: Database["public"]["Enums"]["feature_priority"]
          project_id?: string
          source_feature_id?: string | null
          sprint_id?: string | null
          status?: Database["public"]["Enums"]["story_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_stories_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_stories_source_feature_id_fkey"
            columns: ["source_feature_id"]
            isOneToOne: false
            referencedRelation: "initiative_features"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_stories_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprints"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_conversations: {
        Row: {
          contact_name: string | null
          created_at: string | null
          customer_id: string | null
          id: string
          last_message_at: string | null
          phone_number: string
          status: string | null
          unread_count: number | null
          updated_at: string | null
        }
        Insert: {
          contact_name?: string | null
          created_at?: string | null
          customer_id?: string | null
          id?: string
          last_message_at?: string | null
          phone_number: string
          status?: string | null
          unread_count?: number | null
          updated_at?: string | null
        }
        Update: {
          contact_name?: string | null
          created_at?: string | null
          customer_id?: string | null
          id?: string
          last_message_at?: string | null
          phone_number?: string
          status?: string | null
          unread_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_conversations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          direction: string
          id: string
          media_url: string | null
          message_type: string | null
          sent_by: string | null
          status: string | null
          whatsapp_message_id: string | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          direction: string
          id?: string
          media_url?: string | null
          message_type?: string | null
          sent_by?: string | null
          status?: string | null
          whatsapp_message_id?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          direction?: string
          id?: string
          media_url?: string | null
          message_type?: string | null
          sent_by?: string | null
          status?: string | null
          whatsapp_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_project_onboarding: {
        Args: { p_token: string }
        Returns: string
      }
      delete_initiative_cascade: {
        Args: { p_initiative_id: string }
        Returns: undefined
      }
      delete_project_cascade: {
        Args: { p_project_id: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      get_project_onboarding: {
        Args: { p_token: string }
        Returns: {
          project_id: string
          project_name: string
          project_description: string | null
          support_active: boolean
        }[]
      }
      can_access_finance: { Args: { _user_id: string }; Returns: boolean }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_first_user: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "dev" | "client"
      customer_stage: "lead" | "prospect" | "negotiation" | "client" | "churned"
      expense_category:
        | "lovable"
        | "meta_ads"
        | "google_ads"
        | "hosting"
        | "software"
        | "editor"
        | "salary"
        | "freelancer"
        | "marketing"
        | "other"
      feature_complexity: "easy" | "medium" | "hard"
      feature_priority: "must" | "should" | "could" | "wont"
      initiative_step:
        | "brief"
        | "features"
        | "prd"
        | "screens"
        | "tech_docs"
        | "implementation"
        | "kickoff"
        | "landing_page"
        | "chatbot_ia"
        | "integracion"
        | "entrega"
        | "soporte"
      interaction_type:
        | "call"
        | "email"
        | "meeting"
        | "note"
        | "whatsapp"
        | "other"
      product_type: "mvp" | "funnel" | "app" | "automation" | "landing_page"
      sprint_status: "planning" | "active" | "review" | "completed"
      story_status: "backlog" | "todo" | "in_progress" | "review" | "done"
      ticket_category: "bug" | "feature_request" | "question" | "other"
      ticket_priority: "low" | "medium" | "high" | "urgent"
      ticket_status:
        | "open"
        | "in_progress"
        | "waiting_response"
        | "resolved"
        | "closed"
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
      app_role: ["admin", "dev", "client"],
      customer_stage: ["lead", "prospect", "negotiation", "client", "churned"],
      expense_category: [
        "lovable",
        "meta_ads",
        "google_ads",
        "hosting",
        "software",
        "editor",
        "salary",
        "freelancer",
        "marketing",
        "other",
      ],
      feature_complexity: ["easy", "medium", "hard"],
      feature_priority: ["must", "should", "could", "wont"],
      initiative_step: [
        "brief",
        "features",
        "prd",
        "screens",
        "tech_docs",
        "implementation",
        "kickoff",
        "landing_page",
        "chatbot_ia",
        "integracion",
        "entrega",
        "soporte",
      ],
      interaction_type: [
        "call",
        "email",
        "meeting",
        "note",
        "whatsapp",
        "other",
      ],
      product_type: ["mvp", "funnel", "app", "automation", "landing_page"],
      sprint_status: ["planning", "active", "review", "completed"],
      story_status: ["backlog", "todo", "in_progress", "review", "done"],
      ticket_category: ["bug", "feature_request", "question", "other"],
      ticket_priority: ["low", "medium", "high", "urgent"],
      ticket_status: [
        "open",
        "in_progress",
        "waiting_response",
        "resolved",
        "closed",
      ],
    },
  },
} as const
