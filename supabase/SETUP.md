# Supabase setup — Basic mosque website

Run these files only in the separate \`shayla-akram-mosque-basic\` project.

1. Confirm the project contains \`admin_profiles\`, \`mosque_entries\`, and \`donation_records\`. Do not create a second set of tables.
2. Open SQL Editor and run \`migrate-basic-modules.sql\`.
3. Open \`activate-basic-owner.sql\` and verify the Auth UUID/email pair matches the intended owner before running it.
4. In Authentication → Users, confirm that the owner Auth user exists and is not deleted. The SQL owner activation does not set or reset the user's password.
5. Configure Authentication → URL Configuration:
   - Site URL: \`https://itdaynamic96-hub.github.io\`
   - Redirect URL: \`https://itdaynamic96-hub.github.io/shayla-akram-mosque-basic/**\`
6. Keep public sign-ups disabled. Configure a trusted SMTP provider if password recovery email is required.
7. Never put a Supabase secret/service-role key in the browser configuration or GitHub repository.

The owner activation script validates the exact Auth UUID and email before changing the \`admin_profiles\` row. It does not modify any other Auth user.
