@echo off
chcp 65001 >nul
echo ============================================
echo  GIT PUSH - AH WEBSITE
echo ============================================

cd /d e:\a\ah
echo.
echo [AH] Checking status...
git status --short
echo.
echo [AH] Adding all changes...
git add -A
echo.
echo [AH] Committing...
git commit -m "cleanup: remove Nikken content, centralize services, update branding to DuyBeo HUB"
echo.
echo [AH] Pushing...
git push
echo.

echo ============================================
echo  GIT PUSH - INTEGRATED
echo ============================================

cd /d e:\a\integrated
echo.
echo [INTEGRATED] Checking status...
git status --short
echo.
echo [INTEGRATED] Adding all changes...
git add -A
echo.
echo [INTEGRATED] Committing...
git commit -m "fix: remove default credentials from login page, update author name"
echo.
echo [INTEGRATED] Pushing...
git push
echo.

echo ============================================
echo  DONE! 
echo ============================================
pause
