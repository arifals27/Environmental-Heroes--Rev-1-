Add-Type -AssemblyName System.Drawing

$srcPath = Join-Path $PSScriptRoot "..\game\icon\icon.png"
$resPath = Join-Path $PSScriptRoot "..\android\app\src\main\res"

if (-not (Test-Path $srcPath)) {
    Write-Error "Game icon not found at: $srcPath"
    exit 1
}

# 1. Generate Launcher Icons
$launcherSizes = @{
    "mipmap-mdpi" = 48
    "mipmap-hdpi" = 72
    "mipmap-xhdpi" = 96
    "mipmap-xxhdpi" = 144
    "mipmap-xxxhdpi" = 192
}

$srcImg = [System.Drawing.Image]::FromFile($srcPath)

foreach ($folder in $launcherSizes.Keys) {
    $dim = $launcherSizes[$folder]
    $destFolder = Join-Path $resPath $folder
    if (-not (Test-Path $destFolder)) {
        New-Item -ItemType Directory -Path $destFolder -Force | Out-Null
    }
    
    $bmp = New-Object System.Drawing.Bitmap($dim, $dim)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($srcImg, 0, 0, $dim, $dim)
    $g.Dispose()

    $bmp.Save((Join-Path $destFolder "ic_launcher.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Save((Join-Path $destFolder "ic_launcher_round.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Save((Join-Path $destFolder "ic_launcher_foreground.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Generated launcher icon for $folder ($($dim)x$($dim))"
}

# 2. Generate Dark Sleek Splash Screens
$splashSizes = @(
    @{ Folder = "drawable"; Width = 480; Height = 320 },
    @{ Folder = "drawable-land-mdpi"; Width = 480; Height = 320 },
    @{ Folder = "drawable-land-hdpi"; Width = 800; Height = 480 },
    @{ Folder = "drawable-land-xhdpi"; Width = 1280; Height = 720 },
    @{ Folder = "drawable-land-xxhdpi"; Width = 1600; Height = 960 },
    @{ Folder = "drawable-land-xxxhdpi"; Width = 1920; Height = 1280 },
    @{ Folder = "drawable-port-mdpi"; Width = 320; Height = 480 },
    @{ Folder = "drawable-port-hdpi"; Width = 480; Height = 800 },
    @{ Folder = "drawable-port-xhdpi"; Width = 720; Height = 1280 },
    @{ Folder = "drawable-port-xxhdpi"; Width = 960; Height = 1600 },
    @{ Folder = "drawable-port-xxxhdpi"; Width = 1280; Height = 1920 }
)

foreach ($item in $splashSizes) {
    $destFolder = Join-Path $resPath $item.Folder
    if (-not (Test-Path $destFolder)) {
        New-Item -ItemType Directory -Path $destFolder -Force | Out-Null
    }
    
    $w = $item.Width
    $h = $item.Height
    $splashBmp = New-Object System.Drawing.Bitmap($w, $h)
    $g = [System.Drawing.Graphics]::FromImage($splashBmp)
    
    # Fill background with pure black to match RPG Maker MZ
    $g.Clear([System.Drawing.Color]::Black)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    
    # Draw centered icon (icon size approx 25% of smaller dimension, min 96px)
    $minDim = [Math]::Min($w, $h)
    $iconDim = [Math]::Max(96, [int]($minDim * 0.28))
    $posX = [int](($w - $iconDim) / 2)
    $posY = [int](($h - $iconDim) / 2)
    
    $g.DrawImage($srcImg, $posX, $posY, $iconDim, $iconDim)
    $g.Dispose()

    $destPath = Join-Path $destFolder "splash.png"
    $splashBmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $splashBmp.Dispose()
    Write-Host "Generated dark splash for $($item.Folder) ($($w)x$($h))"
}

$srcImg.Dispose()
Write-Host "All icons and splash screens generated successfully!"
