-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Get user_id for luxassilva@gmail.com and insert profile + admin role
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'luxassilva@gmail.com';
  
  IF v_user_id IS NOT NULL THEN
    -- Insert profile if not exists
    INSERT INTO public.profiles (user_id, name, email)
    VALUES (v_user_id, 'Lucas Silva', 'luxassilva@gmail.com')
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Insert admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;