-- Update profile_type from 'primeira_compra' to 'compra_segura' in user_profiles table
UPDATE user_profiles 
SET profile_type = 'compra_segura' 
WHERE profile_type = 'primeira_compra';