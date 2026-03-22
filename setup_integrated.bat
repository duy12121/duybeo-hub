@echo off
chcp 65001 >nul
echo ============================================
echo  TICH HOP INTEGRATED VÀO WEBSITE
echo ============================================
echo.
echo Se copy frontend/dist vao web\en\integrated\
echo Trang chi truy cap duoc qua URL truc tiep.
echo.
pause

echo.
echo [1/2] Copy frontend build...
xcopy /s /e /i /y "E:\a\integrated\frontend\dist\*" "E:\a\ah\web\en\integrated\" >nul
echo   Done!

echo.
echo [2/2] Hoan tat!
echo.
echo Truy cap: https://duybeohub.com/integrated/
echo (hoac local: web\en\integrated\index.html)
echo.
echo LUU Y: Can chay fix_integrated.py de sua asset paths!
echo.
pause
