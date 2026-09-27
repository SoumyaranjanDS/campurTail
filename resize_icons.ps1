$sourceImage = "C:\Users\soumy\.gemini\antigravity-ide\brain\a3976e6a-49e7-4819-93ec-5f89761fdb6e\campus_tails_icon_1790533537805.jpg"
$baseDir = "c:\Users\soumy\OneDrive\Desktop\myApp\appp\android\app\src\main\res"

Add-Type -AssemblyName System.Drawing

function Resize-Image {
    param([string]$source, [string]$destination, [int]$size)
    $img = [System.Drawing.Image]::FromFile($source)
    $bitmap = new-object System.Drawing.Bitmap $size, $size
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.DrawImage($img, 0, 0, $size, $size)
    
    # Save as PNG
    $bitmap.Save($destination, [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose()
    $bitmap.Dispose()
    $img.Dispose()
}

Resize-Image -source $sourceImage -destination "$baseDir\mipmap-mdpi\ic_launcher.png" -size 48
Resize-Image -source $sourceImage -destination "$baseDir\mipmap-mdpi\ic_launcher_round.png" -size 48

Resize-Image -source $sourceImage -destination "$baseDir\mipmap-hdpi\ic_launcher.png" -size 72
Resize-Image -source $sourceImage -destination "$baseDir\mipmap-hdpi\ic_launcher_round.png" -size 72

Resize-Image -source $sourceImage -destination "$baseDir\mipmap-xhdpi\ic_launcher.png" -size 96
Resize-Image -source $sourceImage -destination "$baseDir\mipmap-xhdpi\ic_launcher_round.png" -size 96

Resize-Image -source $sourceImage -destination "$baseDir\mipmap-xxhdpi\ic_launcher.png" -size 144
Resize-Image -source $sourceImage -destination "$baseDir\mipmap-xxhdpi\ic_launcher_round.png" -size 144

Resize-Image -source $sourceImage -destination "$baseDir\mipmap-xxxhdpi\ic_launcher.png" -size 192
Resize-Image -source $sourceImage -destination "$baseDir\mipmap-xxxhdpi\ic_launcher_round.png" -size 192

Write-Host "Icons generated successfully!"
