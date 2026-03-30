@echo off
echo Testing different Supabase hostname formats...
echo.

echo 1. Testing: db.rmtyykiyeehnyvcaajap.supabase.co
ping -n 1 db.rmtyykiyeehnyvcaajap.supabase.co >nul 2>&1
if %errorlevel% equ 0 echo [SUCCESS] Hostname resolves
if %errorlevel% neq 0 echo [FAILED] Hostname not found

echo.
echo 2. Testing: db.rmtyykiyeehnyvcaajap.pooler.supabase.co
ping -n 1 db.rmtyykiyeehnyvcaajap.pooler.supabase.co >nul 2>&1
if %errorlevel% equ 0 echo [SUCCESS] Pooler hostname resolves
if %errorlevel% neq 0 echo [FAILED] Pooler hostname not found

echo.
echo 3. Testing: db.rmtyykiyeehnyvcaajap.supabase.co:5432
telnet db.rmtyykiyeehnyvcaajap.supabase.co 5432 >nul 2>&1
if %errorlevel% equ 0 echo [SUCCESS] Port 5432 is open
if %errorlevel% neq 0 echo [FAILED] Port 5432 is not accessible

echo.
echo If all tests fail, check:
echo 1. Supabase project is active
echo 2. Correct hostname from Supabase dashboard
echo 3. Network connectivity
echo 4. Firewall settings
pause
