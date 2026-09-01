Add-Type -AssemblyName System.Drawing

function New-FoodStockIcon {
    param(
        [int]$Size,
        [string]$Path,
        [bool]$FullBleed = $false
    )

    $bmp = New-Object System.Drawing.Bitmap($Size, $Size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.Clear([System.Drawing.Color]::Transparent)

    $bgColor = [System.Drawing.Color]::FromArgb(255, 0x4F, 0x8E, 0xF7)
    $bgBrush = New-Object System.Drawing.SolidBrush($bgColor)

    $radius = if ($FullBleed) { 0 } else { [int]($Size * 0.22) }
    $rect = New-Object System.Drawing.Rectangle(0, 0, $Size, $Size)

    if ($radius -eq 0) {
        $g.FillRectangle($bgBrush, $rect)
    } else {
        $gp = New-Object System.Drawing.Drawing2D.GraphicsPath
        $d = $radius * 2
        $gp.AddArc(0, 0, $d, $d, 180, 90)
        $gp.AddArc($Size - $d, 0, $d, $d, 270, 90)
        $gp.AddArc($Size - $d, $Size - $d, $d, $d, 0, 90)
        $gp.AddArc(0, $Size - $d, $d, $d, 90, 90)
        $gp.CloseFigure()
        $g.FillPath($bgBrush, $gp)
    }

    # --- Icono: silueta de nevera abastecida ---
    $white = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $whitePen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, [Math]::Max(2, $Size * 0.03))
    $whitePen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $whitePen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round

    $cx = $Size / 2.0
    $bodyW = $Size * 0.40
    $bodyH = $Size * 0.56
    $bodyX = $cx - ($bodyW / 2.0)
    $bodyY = $Size * 0.20
    $bodyRadius = $Size * 0.06

    $bodyPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d2 = $bodyRadius * 2
    $bodyPath.AddArc($bodyX, $bodyY, $d2, $d2, 180, 90)
    $bodyPath.AddArc($bodyX + $bodyW - $d2, $bodyY, $d2, $d2, 270, 90)
    $bodyPath.AddArc($bodyX + $bodyW - $d2, $bodyY + $bodyH - $d2, $d2, $d2, 0, 90)
    $bodyPath.AddArc($bodyX, $bodyY + $bodyH - $d2, $d2, $d2, 90, 90)
    $bodyPath.CloseFigure()
    $g.DrawPath($whitePen, $bodyPath)

    # Linea divisoria (congelador / nevera)
    $divY = $bodyY + $bodyH * 0.32
    $g.DrawLine($whitePen, $bodyX + $Size * 0.02, $divY, $bodyX + $bodyW - $Size * 0.02, $divY)

    # Tiradores
    $handleW = [Math]::Max(2, $Size * 0.025)
    $handlePen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, $handleW)
    $handlePen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $handlePen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $handleX = $bodyX + $bodyW * 0.16
    $g.DrawLine($handlePen, $handleX, $bodyY + $bodyH * 0.08, $handleX, $bodyY + $bodyH * 0.24)
    $g.DrawLine($handlePen, $handleX, $divY + $bodyH * 0.08, $handleX, $divY + $bodyH * 0.32)

    # Puntito (alimento) dentro, como acento
    $dotR = $Size * 0.045
    $g.FillEllipse($white, $cx + $bodyW * 0.06, $bodyY + $bodyH * 0.62, $dotR, $dotR)

    $g.Dispose()

    $dir = Split-Path $Path -Parent
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}

$base = "C:\Users\lucas\Desktop\mi-web\foodstock\assets\icons"

New-FoodStockIcon -Size 512 -Path "$base\icon-512.png"
New-FoodStockIcon -Size 192 -Path "$base\icon-192.png"
New-FoodStockIcon -Size 180 -Path "$base\apple-touch-icon.png"
New-FoodStockIcon -Size 512 -Path "$base\icon-maskable-512.png" -FullBleed $true
New-FoodStockIcon -Size 192 -Path "$base\icon-maskable-192.png" -FullBleed $true
New-FoodStockIcon -Size 32 -Path "$base\favicon-32.png"

Write-Host "Iconos generados en $base"
