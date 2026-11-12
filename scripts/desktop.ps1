param([ValidateSet('dev','test','build')][string]$Action='dev')
$ErrorActionPreference='Stop'
$projectRoot=Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectRoot
if(Test-Path -LiteralPath "$projectRoot\.tools\cargo\bin\cargo.exe") {
    $env:RUSTUP_HOME="$projectRoot\.tools\rustup"
    $env:CARGO_HOME="$projectRoot\.tools\cargo"
    $env:PATH="$env:CARGO_HOME\bin;$env:PATH"
}
if($Action -eq 'test'){cargo test --manifest-path src-tauri/Cargo.toml}
elseif($Action -eq 'build'){npm.cmd run installer}
else{npm.cmd run desktop}
exit $LASTEXITCODE
