@echo off
echo Creating .env file with your Supabase credentials...

echo # Server Configuration > .env
echo PORT=4000 >> .env
echo. >> .env

echo # PostgreSQL Database Connection >> .env
echo DATABASE_URL=postgresql://postgres:Tnseripdl@123@db.rmtyykiyeehnyvcaajap.supabase.co:5432/postgres >> .env
echo. >> .env

echo # JWT Configuration >> .env
echo JWT_SECRET=change_me_to_a_long_random_secret_pdl_admin_portal_2024 >> .env
echo. >> .env

echo # CORS Configuration >> .env
echo CORS_ORIGIN=http://localhost:5173 >> .env
echo. >> .env

echo # Admin Credentials >> .env
echo ADMIN_EMAIL=admin@example.com >> .env
echo ADMIN_PASSWORD=Admin123! >> .env
echo. >> .env

echo # Environment >> .env
echo NODE_ENV=development >> .env

echo.
echo ✅ .env file created successfully!
echo 🚀 You can now start the backend with: npm run dev-postgres
echo 🔑 Login credentials: admin@example.com / Admin123!
pause
