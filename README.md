# সাকছিপাড়া শায়লা আকরাম কেন্দ্রীয় জামে মসজিদ

বাংলা-ভিত্তিক Basic Package ওয়েবসাইট। পুরোনো ওয়েবসাইট, GitHub repository এবং Supabase project থেকে সম্পূর্ণ আলাদা।

## ফাইল ও সুবিধা
- \`index.html\`, \`style.css\`, \`app.js\`: পাবলিক হোমপেজ, সর্বমোট ১৫টি নির্ধারিত মডিউল, প্রকাশিত নোটিশ, নামাজের সময় ও গ্যালারি মিডিয়া প্রদর্শন।
- \`admin.html\`, \`admin.js\`: Supabase Auth লগইন, \`admin_profiles\` ভূমিকা, মডিউল-ভিত্তিক তথ্য তৈরি/সম্পাদনা, পর্যালোচনা ও প্রকাশ।
- অনুদান আলাদা \`donation_records\` টেবিলে নথিভুক্ত ও যাচাই হয়; এটি অনলাইন পেমেন্ট গেটওয়ে নয়।
- গ্যালারির ছবি/MP4/WebM \`mosque-media\` Storage bucket-এ থাকে; গ্যালারি রেকর্ড \`mosque_entries\`-এ pending অবস্থায় যায়।
- বিবরণে সর্বোচ্চ ৫০০ শব্দের ব্রাউজার ও ডেটাবেস যাচাই।
- \`supabase/schema.sql\` এই প্রকল্পের প্রাথমিক schema: \`admin_profiles\`, \`mosque_entries\`, \`donation_records\`।
- \`supabase/migrate-basic-modules.sql\` ওই schema-র ১৫টি নির্দিষ্ট মডিউল, ৫০০ শব্দের server-side সীমা ও Storage সেটআপ নিশ্চিত করে।
- \`supabase/activate-basic-owner.sql\` নির্দিষ্ট Auth user-কে owner profile দেয়; চালানোর আগে ফাইলে থাকা Auth UUID ও ইমেইল মিলিয়ে নিন।
- \`supabase-config.js\`-এ কেবল public Project URL ও publishable/anon key থাকবে। Secret/service_role key কখনো browser বা repository-তে রাখবেন না।

## একবারের Supabase সেটআপ
1. আলাদা Supabase project \`shayla-akram-mosque-basic\` ব্যবহার করুন।
2. এই Project-এ \`admin_profiles\`, \`mosque_entries\`, \`donation_records\` টেবিল থাকলে \`schema.sql\` পুনরায় চালানোর প্রয়োজন নেই।
3. SQL Editor-এ \`supabase/migrate-basic-modules.sql\` চালান।
4. Authentication → Users-এ অনুমোদিত Auth user আছে এবং Email Confirmed হয়েছে কি না নিশ্চিত করুন।
5. \`supabase/activate-basic-owner.sql\`-এ নির্দিষ্ট Auth UUID ও ইমেইল যাচাই করে SQL Editor-এ চালান।
6. Authentication settings-এ Public Sign-ups বন্ধ রাখুন।
7. Auth URL configuration-এ Site URL: \`https://itdaynamic96-hub.github.io\` এবং Redirect URL: \`https://itdaynamic96-hub.github.io/shayla-akram-mosque-basic/**\` রাখুন।
8. ইমেইল recovery পাঠাতে নিজস্ব SMTP সেটআপ প্রয়োজন হতে পারে।
9. কখনো service_role/secret key browser বা GitHub repository-তে রাখবেন না।

## ভূমিকা
- \`owner\`: প্রধান প্রশাসক; সব মডিউল তৈরি, সম্পাদনা, অনুমোদন ও প্রকাশ করতে পারবেন।
- \`admin\`: প্রশাসনিক কাজ ও প্রকাশ।
- \`editor\`: তথ্য তৈরি/সম্পাদনা করে খসড়া বা অনুমোদনের জন্য পাঠাতে পারবেন; নিজের তৈরি রেকর্ডে সীমাবদ্ধ।
- \`reviewer\`: তথ্য অনুমোদন বা বাতিল করতে পারবেন; তথ্যের মূল লেখা সম্পাদনা করতে পারবেন না।

## GitHub Pages
GitHub Actions workflow: \`.github/workflows/pages.yml\`।
প্রত্যাশিত ঠিকানা: https://itdaynamic96-hub.github.io/shayla-akram-mosque-basic/

## সীমাবদ্ধতা
- Auth user তৈরি, পাসওয়ার্ড সেট/রিসেট, SQL চালানো এবং SMTP কনফিগারেশন Project মালিকের Supabase Dashboard-এ করতে হয়।
- বাস্তব অনলাইন পেমেন্ট গেটওয়ে এখনো সংযুক্ত নয়।
- গ্যালারির ফাইল সর্বোচ্চ ১০ MB।
- নামাজের সময়, ফোন/ঠিকানা, কমিটি ও ইতিহাসের বাস্তব তথ্য কর্তৃপক্ষকে দিয়ে প্রকাশ করতে হবে।
