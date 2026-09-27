# ============================================================
# Campus Tails - Android Launcher Icon Generator
# Generates legacy PNGs + adaptive icon foreground layers
# ============================================================

param()

Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Drawing.Imaging

$source     = "c:\Users\soumy\OneDrive\Desktop\myApp\appp\public\app-logo.png"
$resDir     = "c:\Users\soumy\OneDrive\Desktop\myApp\appp\android\app\src\main\res"
$bgHex      = "#FAFAF7"

# ---- helper: hex colour -> System.Drawing.Color ----------
function HexToColor([string]$hex) {
    $hex = $hex.TrimStart('#')
    $r = [Convert]::ToInt32($hex.Substring(0,2),16)
    $g = [Convert]::ToInt32($hex.Substring(2,2),16)
    $b = [Convert]::ToInt32($hex.Substring(4,2),16)
    return [System.Drawing.Color]::FromArgb(255,$r,$g,$b)
}

# ---- generate LEGACY icon (white bg + logo centred with 10% padding) ----
function Make-Legacy([string]$dest, [int]$size) {
    $img     = [System.Drawing.Image]::FromFile($source)
    $bmp     = New-Object System.Drawing.Bitmap $size, $size
    $g       = [System.Drawing.Graphics]::FromImage($bmp)
    $g.Clear([System.Drawing.Color]::White)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode     = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $pad   = [int]($size * 0.10)
    $inner = $size - ($pad * 2)
    $g.DrawImage($img, $pad, $pad, $inner, $inner)
    $bmp.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose(); $bmp.Dispose(); $img.Dispose()
    Write-Host "  [legacy]    $dest"
}

# ---- generate FOREGROUND layer (transparent bg, logo in Google safe zone) ----
# Google adaptive icon canvas = 108dp.  Safe zone = 66dp (centre 66/108 = ~61%).
# We render the logo into the inner 61% of the canvas so masks never crop it.
function Make-Foreground([string]$dest, [int]$size) {
    $img    = [System.Drawing.Image]::FromFile($source)
    $bmp    = New-Object System.Drawing.Bitmap $size, $size
    $g      = [System.Drawing.Graphics]::FromImage($bmp)
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode     = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $ratio = 0.60   # 60% of canvas = well inside safe zone
    $inner = [int]($size * $ratio)
    $offset = [int](($size - $inner) / 2)
    $g.DrawImage($img, $offset, $offset, $inner, $inner)
    $bmp.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose(); $bmp.Dispose(); $img.Dispose()
    Write-Host "  [foreground] $dest"
}

# ---- sizes: [density, legacy-size, foreground-size] ----
$densities = @(
    @{ name="mipmap-mdpi";    legacyPx=48;  fgPx=108  }
    @{ name="mipmap-hdpi";    legacyPx=72;  fgPx=162  }
    @{ name="mipmap-xhdpi";   legacyPx=96;  fgPx=216  }
    @{ name="mipmap-xxhdpi";  legacyPx=144; fgPx=324  }
    @{ name="mipmap-xxxhdpi"; legacyPx=192; fgPx=432  }
)

Write-Host "`nGenerating legacy launcher PNGs..."
foreach ($d in $densities) {
    $dir = "$resDir\$($d.name)"
    Make-Legacy "$dir\ic_launcher.png"       $d.legacyPx
    Make-Legacy "$dir\ic_launcher_round.png" $d.legacyPx
}

Write-Host "`nGenerating adaptive foreground layers..."
foreach ($d in $densities) {
    $dir = "$resDir\$($d.name)"
    Make-Foreground "$dir\ic_launcher_foreground.png" $d.fgPx
}

Write-Host "`nAll icon files written successfully!`n"
