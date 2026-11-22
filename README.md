# সাকছিপাড়া শায়লা আকরাম কেন্দ্রীয় জামে মসজিদ

বাংলা-ভিত্তিক মসজিদ ওয়েবসাইটের Basic Package। পুরোনো ওয়েবসাইট/ডেটাবেস থেকে সম্পূর্ণ আলাদা।

## ফাইল
- `index.html`, `style.css`, `app.js`: পাবলিক ওয়েবসাইট
- `admin.html`, `admin.js`: প্রশাসনিক লগইন ও কনটেন্ট ড্যাশবোর্ড
- `supabase/schema.sql`: টেবিল, RLS, সার্ভার-সাইড ৫০০ শব্দ যাচাই ও Storage bucket
- `supabase-config.js`: কেবল public Project URL ও publishable/anon key

## Supabase সংযোগ
1. নতুন Supabase project-এর SQL Editor-এ `supabase/schema.sql` চালান।
2. Authentication settings-এ Public sign-ups বন্ধ রাখুন।
3. Authentication > Users থেকে প্রথম admin user তৈরি করুন।
4. ওই user UUID-কে SQL ফাইলে দেওয়া নির্দেশনা অনুসারে `admin_profiles`-এ owner role দিন।
5. Project Settings > API থেকে Project URL এবং Publishable/anon key নিয়ে `supabase-config.js`-এ বসান।
6. কখনো service_role/secret key ব্রাউজার কোডে রাখবেন না।
7. বাস্তব ব্যবহারের আগে review/publish workflow, account recovery এবং Storage policies পরীক্ষা করুন।

## GitHub Pages
Repository Settings > Pages > Build and deployment-এ Deploy from a branch নির্বাচন করে `main` এবং `/ (root)` নির্বাচন করুন। GitHub Actions workflow-ও যুক্ত করা হবে।

প্রত্যাশিত ঠিকানা: https://itdaynamic96-hub.github.io/shayla-akram-mosque-basic/

## গুরুত্বপূর্ণ অবস্থা
এটি প্রাথমিক কার্যকরী ভিত্তি; Supabase SQL প্রয়োগ, Project key configuration, প্রথম admin profile, পূর্ণ অনুমোদন workflow, donation verification, gallery upload এবং live deployment আলাদাভাবে যাচাই করতে হবে। ৫০০ শব্দ সীমা অ্যাডমিন ফর্মে এবং database trigger-এ প্রয়োগ করা হয়েছে।
