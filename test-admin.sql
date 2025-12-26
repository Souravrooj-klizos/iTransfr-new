-- Test admin setup
SELECT 'Admin Profiles:' as info, COUNT(*) as count FROM admin_profiles
UNION ALL
SELECT 'Admin Credentials:', COUNT(*) FROM admin_credentials;

-- Show admin user details (without password hash)
SELECT
  ap.id,
  ap.first_name,
  ap.last_name,
  ap.email,
  ap.role,
  ac.username,
  ac.is_active,
  ac.login_attempts
FROM admin_profiles ap
LEFT JOIN admin_credentials ac ON ap.id = ac."adminId";

-- Test authentication function
SELECT * FROM authenticate_admin(
  'admin',
  'SecurePass123!',
  '127.0.0.1',
  'test'
);
