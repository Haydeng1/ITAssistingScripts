Connect-ExchangeOnline
$BATCHNAME = Read-Host -Prompt "Please specify the imap match you would like to specify as complete: "
Complete-MigrationBatch -Identity $BATCHNAME
