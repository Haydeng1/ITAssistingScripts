## IMAP Migration Scripts

This folder contains basic scripts which run in Powershell to complete an IMAP migration.

### Steps to complete
1. Run ``IMAP Migration Script.ps1`` in powershell.
2. Login using the destination Microsoft tenants Global Administrator.
3. Create / copy the ``Old IMAP Login Template.csv`` can fill in the details for all the accounts being migrated and save. Limits apply
    - Maximum of 500,000 emails per email can be migrated. 
    - No contacts, calendars or tasks will be migrated.
    - If the mailbox is larger than 100GB, then the Large Archive Onboarding (LAO) solution is recommended. Not currently supported.
4. A file selector from the script should have appeared, select the file created in Step 3.
5. Fill in the details requested as best as possible.
    - The information is directly sent to Microsoft to create the Migration Job, and Start the Batch request.

6. I recommend using the powershell scripts/commands in ``Migration Monitoring.ps1`` to keep an eye on the migration.
7. You can run the ``Complete Migration.ps1`` script to finalise the batch migration. 