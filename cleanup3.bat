@echo off
chcp 65001 >nul
echo ============================================
echo  XOA FILE RAC PART 3 - DON DEP SAU CUNG
echo ============================================
echo.
echo Phan tich: Tat ca trang chi tiet deu load data tu JSON API
echo (khong hoat dong offline), nen chi giu lai cac trang "shell" chinh.
echo.
echo SE XOA:
echo  1. expertise\ subfolders: tat ca HTML chi tiet (giu index.html)
echo  2. news\ subfolders: tat ca HTML chi tiet (giu index.html)
echo  3. projects\ subfolders: tat ca HTML chi tiet (giu index.html)
echo  4. insights\: tat ca HTML chi tiet + img (giu index.html)
echo  5. about\: chi giu index.html va cac trang duoc link truc tiep
echo  6. p4iusj000000125a-att\ (PDF/XLSX)
echo  7. Cac file 2020-2025.html, before.html
echo.
echo SE GIU LAI:
echo  - Tat ca index.html (navigation shells)
echo  - common\ (CSS, JS, images)
echo  - p4iusj000000006s-img\ (logos)
echo  - p4iusj0000000uxa-img\ (slider images)
echo  - favicon.ico
echo  - Cac trang root: policy, disclaimer, privacy, socialmedia, wechat
echo  - about\: index + cac trang duoc link tu about
echo  - career\, contacts\, brand\ (index.html)
echo.
pause

set "BASE=e:\a\ah\web\en"

echo.
echo === EXPERTISE: xoa HTML chi tiet, giu index.html ===
for %%d in (architectural_design civil_engineering computational_design_bim consulting interior_design landscape_design mep_engineering structural_engineering sustainability_resilience urban_design_and_planning) do (
    echo   Cleaning expertise\%%d...
    for %%f in ("%BASE%\expertise\%%d\*.html") do (
        if /i not "%%~nxf"=="index.html" del /q "%%f" 2>nul
    )
)

echo.
echo === NEWS: xoa tat ca HTML chi tiet, giu index.html ===
for %%d in (news awards press_release) do (
    echo   Cleaning news\%%d...
    for %%f in ("%BASE%\news\%%d\*.html") do (
        if /i not "%%~nxf"=="index.html" del /q "%%f" 2>nul
    )
)
rem Xoa year pages va before.html o news root
for %%f in ("%BASE%\news\20*.html") do del /q "%%f" 2>nul
for %%f in ("%BASE%\news\before.html") do del /q "%%f" 2>nul

echo.
echo === PROJECTS: xoa tat ca HTML chi tiet, giu index.html ===
for /r "%BASE%\projects" %%f in (*.html) do (
    if /i not "%%~nxf"=="index.html" del /q "%%f" 2>nul
)

echo.
echo === INSIGHTS: xoa HTML chi tiet, giu index.html ===
for %%f in ("%BASE%\insights\*.html") do (
    if /i not "%%~nxf"=="index.html" del /q "%%f" 2>nul
)

echo.
echo === PDF/XLSX: xoa tat ca ===
del /s /q "%BASE%\*.pdf" 2>nul
del /s /q "%BASE%\*.xlsx" 2>nul
rmdir /s /q "%BASE%\p4iusj000000125a-att" 2>nul

echo.
echo === ABOUT: giu index + sub-pages duoc link ===
rem Giu: index, chairman_ceomessage, outline, corporate_structure,
rem      nikken_group, board_members, publication, publication_archive,
rem      projects_history, corporate_history, pynt, pynt_event,
rem      pynt_membership_agreement, pynt_terms_of_service, social_responsibility
rem Xoa phan con lai khong duoc link tu about/index
rem (Tat ca deu duoc link truc tiep nen khong xoa gi o about)

echo.
echo ============================================
echo  HOAN TAT!
echo ============================================
echo.
echo Da xoa:
echo  - expertise: ~54 bai chi tiet
echo  - news: ~158 bai tin tuc
echo  - projects: ~200+ trang du an
echo  - insights: ~20+ bai
echo  - PDF/XLSX files
echo.
echo Con lai: cac trang shell (index.html) + about pages + common assets
echo.
pause
