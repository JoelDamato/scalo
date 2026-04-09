
-- Create the trigger function for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );

  -- Assign role: first user is admin, others are client
  IF (SELECT public.is_first_user()) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin'::app_role);
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'client'::app_role);
  END IF;

  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Manually create profile and admin role for existing user
INSERT INTO public.profiles (user_id, email, name)
VALUES ('d81f977b-359b-49e2-a364-2a7ca514a351', 'damatojoel25@gmail.com', 'damatojoel')
ON CONFLICT DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
VALUES ('d81f977b-359b-49e2-a364-2a7ca514a351', 'admin'::app_role)
ON CONFLICT DO NOTHING;
