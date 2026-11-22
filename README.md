# সাকছিপাড়া শায়লা আকরাম কেন্দ্রীয় জামে মসজিদ
বাংলা-ভিত্তিক Basic Package ওয়েবসাইট। পুরোনো ওয়েবসাইট ও ডেটাবেস থেকে সম্পূর্ণ আলাদা।

## ফাইল
- `index.html`, `style.css`, `app.js`: পাবলিক ওয়েবসাইট ও ১৪টি বিভাগ
- `admin.html`, `admin.js`: Supabase Auth লগইন, ভূমিকা-ভিত্তিক কনটেন্ট তৈরি, অনুমোদন/প্রকাশ/মুছে ফেলা
- `supabase/schema.sql`: টেবিল, RLS, ৫০০ শব্দের server-side যাচাই ও Storage bucket
- `supabase-config.js`: শুধু public Project URL ও publishable/anon key

## একবারের Supabase সেটআপ
1. নতুন Supabase project `shayla-akram-mosque-basic` তৈরি করুন।
2. SQL Editor-এ `supabase/schema.sql` সম্পূর্ণ চালান।
3. Authentication settings-এ Public sign-ups বন্ধ রাখুন।
4. Authentication > Users থেকে প্রথম admin account তৈরি করুন।
5. ওই user UUID-কে SQL Editor-এ owner profile দিন (ফাইলের শেষের উদাহরণ অনুসরণ করুন)।
6. Project Settings > API থেকে Project URL এবং Publishable/anon key নিয়ে `supabase-config.js`-এ বসান।
7. Auth URL configuration-এ Site URL হিসেবে `https://itdaynamic96-hub.github.io` দিন এবং Redirect URL-এ `https://itdaynamic96-hub.github.io/shayla-akram-mosque-basic/**` অনুমোদন করুন।
8. কখনো service_role/secret key browser-এ রাখবেন না।

## ভূমিকা
- owner/admin: সব কনটেন্ট তৈরি, অনুমোদন, প্রকাশ ও মুছে ফেলতে পারবেন।
- reviewer: তথ্য অনুমোদন বা বাতিল করতে পারবেন।
- editor: খসড়া/অনুমোদনের অপেক্ষায় থাকা তথ্য তৈরি করতে পারবেন।

## GitHub Pages
GitHub Actions workflow: `.github/workflows/pages.yml`। প্রত্যাশিত ঠিকানা:
https://itdaynamic96-hub.github.io/shayla-akram-mosque-basic/

## সীমাবদ্ধতা
Supabase project creation, SQL execution, Auth user creation এবং public API key configuration প্রকল্পের মালিকের Supabase dashboard-এ করতে হবে। বাস্তব online payment gateway এখনো যুক্ত নয়; donation table কেবল রেকর্ড/যাচাইয়ের ভিত্তি। গ্যালারির Storage bucket/policy প্রস্তুত, কিন্তু upload UI পরবর্তী কাজ।
