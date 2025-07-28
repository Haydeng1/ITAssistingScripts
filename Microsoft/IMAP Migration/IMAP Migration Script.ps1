
Add-Type -AssemblyName System.Windows.Forms
Import-Module ExchangeOnlineManagement
Connect-ExchangeOnline
     

function Get-FileName($initialDirectory) {
    $OpenFileDialog = New-Object System.Windows.Forms.OpenFileDialog
    $OpenFileDialog.InitialDirectory = $initialDirectory
    $openFileDialog.Title = "Select the IMAP Migration CSV File"
    $OpenFileDialog.Filter = "CSV files (*.csv)|*.csv|All files (*.*)|*.*"
    $OpenFileDialog.ShowDialog() | Out-Null
    $OpenFileDialog.FileName
}

# CHECKING AND CREATING THE MAIL USERS
$csvPath = Get-FileName -initialDirectory .
$csvData = Import-Csv -Path $csvPath


# Step 2: Check each mailbox
$validUsers = @()
foreach ($row in $csvData) {
    $email = $row.EmailAddress

    try {
        $mailbox = Get-Mailbox -Identity $email -ErrorAction Stop
        Write-Host "✅ Mailbox found: $email" -ForegroundColor Green
        $validUsers += $row
    } catch {
        Write-Warning "❌ No mailbox found for $email — skipping"
    }
}

if ($validUsers.Count -eq 0) {
    Write-Warning "No valid mailboxes found — migration batch will not be created."
    Disconnect-ExchangeOnline
    exit
}


# it's typical to use 143 for unencrypted or Transport Layer Security (TLS) 
# connections and to use 993 for SSL connections. 
# Security can be TLS, SSL, none
$IMAPSERVER = Read-Host -Prompt "Please input IMAP Server: "
$IMAPSECURITY = Read-Host -Prompt "Please input Security Value (TLS, SSL, none): "
$IMAPPORT = [int](Read-Host -Prompt "Please input Port (Typically 143 for unencrypted or Transport Layer Security (TLS) and 993 for SSL connections) ");
New-MigrationEndpoint -Name "IMAPEndpoint" `
                      -Imap `
                      -RemoteServer $IMAPSERVER `
                      -Port $IMAPPORT `
                      -Security $IMAPSECURITY

Write-Host "Verification of Migration EndPoint Creation"
$MigrationEndpoint = Get-MigrationEndpoint IMAPEndpoint | Format-List EndpointType,RemoteServer,Port,Security
Write-Host $MigrationEndpoint

$EMAILNOTIFICATIONS = Read-Host -Prompt "Please input the email you would like to receive notification to: "
New-MigrationBatch -Name "IMAPMigrationBatch" `
                   -SourceEndpoint "IMAPEndpoint" `
                   -CSVData ([System.IO.File]::ReadAllBytes($csvPath)) `
                   -NotificationEmails $EMAILNOTIFICATIONS

Start-MigrationBatch -Identity "IMAPMigrationBatch"
Write-Host "Batch Started"