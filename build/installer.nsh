# Eidovara Windows Setup: replace an existing program install.
# User data under AppData is not deleted (deleteAppDataOnUninstall stays false;
# electron-builder already passes /KEEP_APP_DATA --updated to the old uninstaller).

SetOverwrite on

!ifndef nsProcess::FindProcess
  !include "nsProcess.nsh"
!endif

!macro closeRunningEidovara
  ${nsProcess::FindProcess} "${APP_EXECUTABLE_FILENAME}" $R0
  ${if} $R0 == 0
    DetailPrint "Closing running ${PRODUCT_NAME} so Setup can overwrite the existing install."
    ${nsProcess::CloseProcess} "${APP_EXECUTABLE_FILENAME}" $R1
    Sleep 1000
    ${nsProcess::KillProcess} "${APP_EXECUTABLE_FILENAME}" $R2
    Sleep 400
  ${endif}
!macroend

!macro customInit
  SetOverwrite on
  !insertmacro closeRunningEidovara
!macroend

!macro customCheckAppRunning
  !insertmacro closeRunningEidovara
!macroend

!macro customUnInstallCheck
  # Continue Setup if the previous uninstaller cannot run; remaining files are overwritten.
  ClearErrors
!macroend

!macro customUnInstallCheckCurrentUser
  ClearErrors
!macroend
