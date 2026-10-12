param(
    [string]$InputName = '发给老师/老师确认稿_教师资料与网站风格.docx',
    [string]$OutputFolder = '内部资料/排版检查/teacher-brief'
)
$ErrorActionPreference = 'Stop'
$reviewDocsRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$reviewInput = Join-Path $reviewDocsRoot $InputName
$reviewOutputDir = Join-Path $reviewDocsRoot $OutputFolder
New-Item -ItemType Directory -Path $reviewOutputDir -Force | Out-Null
$reviewPdf = Join-Path $reviewOutputDir 'teacher-review.pdf'
$reviewWord = $null
$reviewDocument = $null
try {
    $reviewWord = New-Object -ComObject Word.Application
    $reviewWord.Visible = $false
    $reviewWord.DisplayAlerts = 0
    $reviewDocument = $reviewWord.Documents.Open($reviewInput, $false, $true)
    $reviewDocument.Fields.Update() | Out-Null
    $reviewDocument.Repaginate()
    $reviewDocument.ExportAsFixedFormat($reviewPdf, 17)
    Write-Output "PDF: $reviewPdf"
    Write-Output "Pages: $($reviewDocument.ComputeStatistics(2))"
} finally {
    if ($null -ne $reviewDocument) {
        $reviewDocument.Close(0)
        [System.Runtime.InteropServices.Marshal]::ReleaseComObject($reviewDocument) | Out-Null
    }
    if ($null -ne $reviewWord) {
        $reviewWord.Quit()
        [System.Runtime.InteropServices.Marshal]::ReleaseComObject($reviewWord) | Out-Null
    }
}
