#IMAP Migration Check

Connect-ExchangeOnline 
Get-MigrationBatch  
Get-MigrationUser
Get-MigrationUserStatistics -Identity | Format-List