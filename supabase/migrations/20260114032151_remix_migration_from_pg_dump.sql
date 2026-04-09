CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'client'
);


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  is_first BOOLEAN;
  user_role app_role;
BEGIN
  -- Check if this is the first user
  SELECT public.is_first_user() INTO is_first;
  
  -- Determine role
  IF is_first THEN
    user_role := 'admin'::app_role;
  ELSE
    user_role := 'client'::app_role;
  END IF;
  
  -- Create profile
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  
  -- Assign role with proper type
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role);
  
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: is_admin(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_admin(_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;


--
-- Name: is_first_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_first_user() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT NOT EXISTS (SELECT 1 FROM public.user_roles)
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: activities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    type text NOT NULL,
    message text NOT NULL,
    user_id uuid NOT NULL,
    project_id uuid,
    task_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: arca_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.arca_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    cuit text NOT NULL,
    punto_venta integer DEFAULT 1 NOT NULL,
    tipo_comprobante text DEFAULT 'factura_c'::text NOT NULL,
    condicion_iva text DEFAULT 'monotributo'::text NOT NULL,
    api_token_encrypted text,
    environment text DEFAULT 'testing'::text NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT arca_config_environment_check CHECK ((environment = ANY (ARRAY['testing'::text, 'production'::text])))
);


--
-- Name: arca_invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.arca_invoices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    finance_record_id uuid,
    cae text,
    cae_vencimiento date,
    numero_comprobante integer,
    punto_venta integer,
    tipo_comprobante text,
    importe_total numeric(12,2),
    fecha_emision date,
    cliente_nombre text,
    cliente_cuit_dni text,
    estado text DEFAULT 'draft'::text NOT NULL,
    error_message text,
    raw_response jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT arca_invoices_estado_check CHECK ((estado = ANY (ARRAY['draft'::text, 'emitida'::text, 'anulada'::text, 'error'::text])))
);


--
-- Name: comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    content text NOT NULL,
    task_id uuid NOT NULL,
    author_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: finance_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.finance_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid,
    description text NOT NULL,
    amount numeric(12,2) NOT NULL,
    payment_status text DEFAULT 'pending'::text NOT NULL,
    payment_method text,
    internal_notes text,
    invoice_date date,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT finance_records_payment_status_check CHECK ((payment_status = ANY (ARRAY['pending'::text, 'paid'::text, 'partial'::text])))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    status text DEFAULT 'active'::text NOT NULL,
    client_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT projects_status_check CHECK ((status = ANY (ARRAY['active'::text, 'completed'::text, 'on-hold'::text])))
);


--
-- Name: tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    status text DEFAULT 'backlog'::text NOT NULL,
    project_id uuid NOT NULL,
    assignee_id uuid,
    is_client_visible boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    client_input_required boolean DEFAULT false NOT NULL,
    CONSTRAINT tasks_status_check CHECK ((status = ANY (ARRAY['backlog'::text, 'in-progress'::text, 'review'::text, 'done'::text])))
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role DEFAULT 'client'::public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: activities activities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_pkey PRIMARY KEY (id);


--
-- Name: arca_config arca_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.arca_config
    ADD CONSTRAINT arca_config_pkey PRIMARY KEY (id);


--
-- Name: arca_config arca_config_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.arca_config
    ADD CONSTRAINT arca_config_user_id_key UNIQUE (user_id);


--
-- Name: arca_invoices arca_invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.arca_invoices
    ADD CONSTRAINT arca_invoices_pkey PRIMARY KEY (id);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: finance_records finance_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finance_records
    ADD CONSTRAINT finance_records_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: arca_config update_arca_config_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_arca_config_updated_at BEFORE UPDATE ON public.arca_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: arca_invoices update_arca_invoices_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_arca_invoices_updated_at BEFORE UPDATE ON public.arca_invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: finance_records update_finance_records_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_finance_records_updated_at BEFORE UPDATE ON public.finance_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: projects update_projects_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: tasks update_tasks_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: activities activities_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: activities activities_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- Name: activities activities_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: arca_invoices arca_invoices_finance_record_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.arca_invoices
    ADD CONSTRAINT arca_invoices_finance_record_id_fkey FOREIGN KEY (finance_record_id) REFERENCES public.finance_records(id) ON DELETE SET NULL;


--
-- Name: comments comments_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: comments comments_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- Name: finance_records finance_records_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finance_records
    ADD CONSTRAINT finance_records_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: projects projects_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: tasks tasks_assignee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_assignee_id_fkey FOREIGN KEY (assignee_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: tasks tasks_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: finance_records Admins can delete finance records; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete finance records" ON public.finance_records FOR DELETE USING (public.is_admin(auth.uid()));


--
-- Name: activities Admins can do everything with activities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can do everything with activities" ON public.activities USING (public.is_admin(auth.uid()));


--
-- Name: comments Admins can do everything with comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can do everything with comments" ON public.comments USING (public.is_admin(auth.uid()));


--
-- Name: projects Admins can do everything with projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can do everything with projects" ON public.projects USING (public.is_admin(auth.uid()));


--
-- Name: tasks Admins can do everything with tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can do everything with tasks" ON public.tasks USING (public.is_admin(auth.uid()));


--
-- Name: arca_config Admins can insert arca config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert arca config" ON public.arca_config FOR INSERT WITH CHECK (public.is_admin(auth.uid()));


--
-- Name: arca_invoices Admins can insert arca invoices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert arca invoices" ON public.arca_invoices FOR INSERT WITH CHECK (public.is_admin(auth.uid()));


--
-- Name: finance_records Admins can insert finance records; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert finance records" ON public.finance_records FOR INSERT WITH CHECK (public.is_admin(auth.uid()));


--
-- Name: user_roles Admins can manage roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage roles" ON public.user_roles USING (public.is_admin(auth.uid()));


--
-- Name: arca_config Admins can update arca config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update arca config" ON public.arca_config FOR UPDATE USING (public.is_admin(auth.uid()));


--
-- Name: arca_invoices Admins can update arca invoices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update arca invoices" ON public.arca_invoices FOR UPDATE USING (public.is_admin(auth.uid()));


--
-- Name: finance_records Admins can update finance records; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update finance records" ON public.finance_records FOR UPDATE USING (public.is_admin(auth.uid()));


--
-- Name: profiles Admins can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.is_admin(auth.uid()));


--
-- Name: user_roles Admins can view all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.is_admin(auth.uid()));


--
-- Name: arca_config Admins can view arca config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view arca config" ON public.arca_config FOR SELECT USING (public.is_admin(auth.uid()));


--
-- Name: arca_invoices Admins can view arca invoices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view arca invoices" ON public.arca_invoices FOR SELECT USING (public.is_admin(auth.uid()));


--
-- Name: finance_records Admins can view finance records; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view finance records" ON public.finance_records FOR SELECT USING (public.is_admin(auth.uid()));


--
-- Name: comments Clients can add comments on visible tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clients can add comments on visible tasks" ON public.comments FOR INSERT WITH CHECK (((auth.uid() = author_id) AND (EXISTS ( SELECT 1
   FROM (public.tasks
     JOIN public.projects ON ((projects.id = tasks.project_id)))
  WHERE ((tasks.id = comments.task_id) AND (tasks.is_client_visible = true) AND (projects.client_id = auth.uid()))))));


--
-- Name: activities Clients can view activities on their projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clients can view activities on their projects" ON public.activities FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.projects
  WHERE ((projects.id = activities.project_id) AND (projects.client_id = auth.uid())))));


--
-- Name: comments Clients can view comments on visible tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clients can view comments on visible tasks" ON public.comments FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (public.tasks
     JOIN public.projects ON ((projects.id = tasks.project_id)))
  WHERE ((tasks.id = comments.task_id) AND (tasks.is_client_visible = true) AND (projects.client_id = auth.uid())))));


--
-- Name: projects Clients can view their own projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clients can view their own projects" ON public.projects FOR SELECT USING ((auth.uid() = client_id));


--
-- Name: tasks Clients can view visible tasks on their projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clients can view visible tasks on their projects" ON public.tasks FOR SELECT USING (((is_client_visible = true) AND (EXISTS ( SELECT 1
   FROM public.projects
  WHERE ((projects.id = tasks.project_id) AND (projects.client_id = auth.uid()))))));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_roles Users can view own role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: activities; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

--
-- Name: arca_config; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.arca_config ENABLE ROW LEVEL SECURITY;

--
-- Name: arca_invoices; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.arca_invoices ENABLE ROW LEVEL SECURITY;

--
-- Name: comments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

--
-- Name: finance_records; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.finance_records ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: projects; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

--
-- Name: tasks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;