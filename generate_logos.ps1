$g = [Convert]::ToBase64String([IO.File]::ReadAllBytes('Img/logo-guadiana.png'))
$c = [Convert]::ToBase64String([IO.File]::ReadAllBytes('Img/logo-cumbria.png'))
$content = "const LOGO_GUADIANA_BASE64 = 'data:image/png;base64,$g';`nconst LOGO_CUMBRIA_BASE64 = 'data:image/png;base64,$c';"
Set-Content -Path 'js/logos-updated.js' -Value $content
