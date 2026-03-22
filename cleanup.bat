@echo off
chcp 65001 >nul
echo ============================================
echo  XOA FILE KHONG CAN THIET
echo ============================================
echo.
echo SE XOA:
echo  1. hts-cache\
echo  2. hts-log.txt
echo  3. index.html (root)
echo  4. www.duybeoHUB.com\
echo  5. www.google-analytics.com\
echo  6. www.googletagmanager.com\
echo  7. ajax.googleapis.com\
echo  8. cdnjs.cloudflare.com\
echo  9. use.fontawesome.com\
echo  10. use.typekit.net\
echo  11. web\images\
echo  12. web\en\index-2.html
echo  13. xoa_anh.bat
echo.
echo SE GIU LAI: web\en\ (website chinh)
echo.
pause

echo.
echo [1/13] Xoa hts-cache...
rmdir /s /q "e:\a\ah\hts-cache" 2>nul

echo [2/13] Xoa hts-log.txt...
del /q "e:\a\ah\hts-log.txt" 2>nul

echo [3/13] Xoa index.html (root)...
del /q "e:\a\ah\index.html" 2>nul

echo [4/13] Xoa www.duybeoHUB.com\...
rmdir /s /q "e:\a\ah\www.duybeoHUB.com" 2>nul

echo [5/13] Xoa www.google-analytics.com\...
rmdir /s /q "e:\a\ah\www.google-analytics.com" 2>nul

echo [6/13] Xoa www.googletagmanager.com\...
rmdir /s /q "e:\a\ah\www.googletagmanager.com" 2>nul

echo [7/13] Xoa ajax.googleapis.com\...
rmdir /s /q "e:\a\ah\ajax.googleapis.com" 2>nul

echo [8/13] Xoa cdnjs.cloudflare.com\...
rmdir /s /q "e:\a\ah\cdnjs.cloudflare.com" 2>nul

echo [9/13] Xoa use.fontawesome.com\...
rmdir /s /q "e:\a\ah\use.fontawesome.com" 2>nul

echo [10/13] Xoa use.typekit.net\...
rmdir /s /q "e:\a\ah\use.typekit.net" 2>nul

echo [11/13] Xoa web\images\...
rmdir /s /q "e:\a\ah\web\images" 2>nul

echo [12/13] Xoa web\en\index-2.html...
del /q "e:\a\ah\web\en\index-2.html" 2>nul

echo [13/13] Xoa xoa_anh.bat...
del /q "e:\a\ah\xoa_anh.bat" 2>nul

echo.
echo ============================================
echo  HOAN TAT! Da xoa 13 muc khong can thiet.
echo ============================================
echo.
echo Con lai duy nhat: web\en\ (website chinh)
echo.
echo Luu y: Xoa file cleanup.bat nay thu cong sau khi chay xong.
echo.
pause
