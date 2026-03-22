@echo off
chcp 65001 >nul
echo ============================================
echo  XOA FILE KHONG CAN THIET (PART 2)
echo ============================================
echo.
echo SE XOA:
echo  1. PDF, XLSX (p4iusj000000125a-att\)
echo  2. before.html (news\)
echo  3. Tat ca bai viet news co nam (2014-2025)
echo  4. Tat ca bai chi tiet expertise (giu index.html)
echo.
echo SE GIU LAI:
echo  - Tat ca index.html
echo  - Cau truc thu muc chinh
echo.
pause

set "BASE=e:\a\ah\web\en"

echo.
echo [1/5] Xoa tat ca PDF va XLSX...
del /s /q "%BASE%\*.pdf" 2>nul
del /s /q "%BASE%\*.xlsx" 2>nul

echo [2/5] Xoa tat ca before.html...
del /s /q "%BASE%\news\before.html" 2>nul
del /s /q "%BASE%\news\awards\before.html" 2>nul
del /s /q "%BASE%\news\news\before.html" 2>nul
del /s /q "%BASE%\news\press_release\before.html" 2>nul

echo [3/5] Xoa bai viet news co nam (giu index.html)...
for %%f in ("%BASE%\news\20*.html") do del /q "%%f" 2>nul
for %%f in ("%BASE%\news\awards\20*.html") do del /q "%%f" 2>nul
for %%f in ("%BASE%\news\awards\2*.html") do del /q "%%f" 2>nul
for %%f in ("%BASE%\news\news\20*.html") do del /q "%%f" 2>nul
for %%f in ("%BASE%\news\news\2*.html") do del /q "%%f" 2>nul
for %%f in ("%BASE%\news\press_release\20*.html") do del /q "%%f" 2>nul
for %%f in ("%BASE%\news\press_release\2*.html") do del /q "%%f" 2>nul

echo [4/5] Xoa bai chi tiet expertise (giu index.html)...
for %%f in ("%BASE%\expertise\architectural_design\*.html") do if /i not "%%~nxf"=="index.html" del /q "%%f" 2>nul
for %%f in ("%BASE%\expertise\interior_design\*.html") do if /i not "%%~nxf"=="index.html" del /q "%%f" 2>nul
for %%f in ("%BASE%\expertise\computational_design_bim\*.html") do if /i not "%%~nxf"=="index.html" del /q "%%f" 2>nul
for %%f in ("%BASE%\expertise\landscape_design\*.html") do if /i not "%%~nxf"=="index.html" del /q "%%f" 2>nul
for %%f in ("%BASE%\expertise\mep_engineering\*.html") do if /i not "%%~nxf"=="index.html" del /q "%%f" 2>nul
for %%f in ("%BASE%\expertise\structural_engineering\*.html") do if /i not "%%~nxf"=="index.html" del /q "%%f" 2>nul
for %%f in ("%BASE%\expertise\sustainability_resilience\*.html") do if /i not "%%~nxf"=="index.html" del /q "%%f" 2>nul
for %%f in ("%BASE%\expertise\civil_engineering\*.html") do if /i not "%%~nxf"=="index.html" del /q "%%f" 2>nul
for %%f in ("%BASE%\expertise\consulting\*.html") do if /i not "%%~nxf"=="index.html" del /q "%%f" 2>nul
for %%f in ("%BASE%\expertise\urban_design_and_planning\*.html") do if /i not "%%~nxf"=="index.html" del /q "%%f" 2>nul

echo [5/5] Xoa thu muc p4iusj000000125a-att (chua PDF/XLSX)...
rmdir /s /q "%BASE%\p4iusj000000125a-att" 2>nul

echo.
echo ============================================
echo  HOAN TAT!
echo ============================================
echo  - Da xoa: PDF, XLSX, before.html
echo  - Da xoa: ~158 bai news (2014-2025)
echo  - Da xoa: ~54 bai expertise chi tiet
echo  - Giu lai: tat ca index.html
echo.
pause
