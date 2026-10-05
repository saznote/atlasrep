#ifndef SourceDir
  #define SourceDir "dist\InterfaceAtlas"
#endif

[Setup]
AppId={{5C00EDE5-8AF6-4F26-9B5D-1438266B9457}
AppName=Interface Atlas
AppVersion=0.1.0
AppPublisher=Interface Atlas
DefaultDirName={localappdata}\Programs\Interface Atlas
DefaultGroupName=Interface Atlas
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
OutputDir=dist
OutputBaseFilename=InterfaceAtlas-Setup
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
UninstallDisplayIcon={app}\InterfaceAtlas.exe

[Files]
Source: "{#SourceDir}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{autoprograms}\Interface Atlas"; Filename: "{app}\InterfaceAtlas.exe"
Name: "{autodesktop}\Interface Atlas"; Filename: "{app}\InterfaceAtlas.exe"; Tasks: desktopicon

[Tasks]
Name: "desktopicon"; Description: "Créer un raccourci sur le bureau"; GroupDescription: "Raccourcis :"; Flags: unchecked

[Run]
Filename: "{app}\InterfaceAtlas.exe"; Description: "Lancer Interface Atlas"; Flags: postinstall nowait skipifsilent
