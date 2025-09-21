Install playwright. TS. 

Get it working and use a dockerized netlify dev contaner that allows for serverless functions. Port over the contents of .env

Workflows:

1. User can purchase basic card. use "https://bancroft.io" as site. customer email is connectme-customer@mailinator.com, phone number doesn't matter but put one in. customer name john doe

in stripe window, credit card is 4242424242424242
exp is 12/34 and cv is 123

Check that emails are sent to connectme-customer@mailinator.com @https://www.mailinator.com/v4/public/inboxes.jsp?msgid=connectme-test-1758430315-012348911012&to=connectme-test 
check the email is sent to connectme-test@mailinator.com @https://www.mailinator.com/v4/public/inboxes.jsp?msgid=connectme-test-1758430315-012348911012&to=connectme-test 

check that particulars including correct website exist

2. User can create TAG Core Card

Use app/assets for placeholder images. sizes are displayed on file names. 
Use many if not all attributes. 

use "https://bancroft.io" as site. customer email is connectme-customer@mailinator.com, phone number doesn't matter but put one in. customer name john doe 

in stripe window, credit card is 4242424242424242
exp is 12/34 and cv is 123

Check that emails are sent to connectme-customer@mailinator.com @https://www.mailinator.com/v4/public/inboxes.jsp?msgid=connectme-test-1758430315-012348911012&to=connectme-test 
check the email is sent to connectme-test@mailinator.com @https://www.mailinator.com/v4/public/inboxes.jsp?msgid=connectme-test-1758430315-012348911012&to=connectme-test 

Check that website generated as specifed in confirmation page. Check that vcf and image assets available in that demo.bancroft.io/{uuid}/...

Check that images display on website generated. 

3. Admin can create TAG Core Card

Admin should log in with username "admin" password "password"

Use app/assets for placeholder images. sizes are displayed on file names. 
Use many if not all attributes. 

Check that website generated as specifed in confirmation page. Check that vcf and image assets available in that demo.bancroft.io/{uuid}/...

Check that images display on website generated. 

4. Check that admin can modify existing card. 

Swithc some attributes. See whether they propagate in new site. 