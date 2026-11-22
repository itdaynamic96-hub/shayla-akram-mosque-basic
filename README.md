# সাকছিপাড়া শায়লা আকরাম কেন্দ্রীয় জামে মসজিদ

বাংলা-ভিত্তিক Basic Package ওয়েবসাইট। পুরোনো ওয়েবসাইট, GitHub repository এবং Supabase project থেকে সম্পূর্ণ আলাদা।

## ফাইল ও সুবিধা
- `index.html`, `style.css`, `app.js`: পাবলিক হোমপেজ, সর্বমোট ১৫টি নির্দিষ্ট মডিউল (হোমপেজসহ; অতিরিক্ত মডিউল যোগের সুবিধা নেই), প্রকাশিত নোটিশ, নামাজের সময় ও গ্যালারি মিডিয়া প্রদর্শন।
- `admin.html`, `admin.js`: Supabase Auth লগইন, ভূমিকা ও মডিউল-অনুমতিভিত্তিক তথ্য তৈরি/সম্পাদনা, অনুমোদন ও প্রকাশ।
- অ্যাডমিন প্যানেলে অনুদান নথিভুক্তি, রসিদ নম্বর, তারিখ ও যাচাইয়ের অবস্থা; তথ্য `module_records`-এ `m13` মডিউলে সংরক্ষিত হয়।
- অ্যাডমিন প্যানেলে সর্বোচ্চ ১০ MB ছবি/MP4/WebM আপলোড; `mosque-media` Storage bucket-এ ফাইল থাকে এবং গ্যালারি নথি `m14` মডিউলে pending অবস্থায় যায়। সুপার অ্যাডমিন প্রকাশ না করা পর্যন্ত ওয়েবসাইটে দেখা যায় না।
- বড় বিবরণে সর্বোচ্চ ৫০০ শব্দের ব্রাউজার ও ডেটাবেস যাচাই।
- `supabase/migrate-basic-modules.sql`: বিদ্যমান Supabase schema-র জন্য ১৫ মডিউল, ৫০০ শব্দের server-side সীমা এবং gallery Storage bucket/policies। `schema.sql` এই প্রকল্পে চালাবেন না।
- `supabase-config.js`: শুধু public Project URL ও publishable/anon key। Secret/service_role key এখানে রাখা যাবে না।

## একবারের Supabase সেটআপ
1. আলাদা Supabase project `shayla-akram-mosque-basic` তৈরি করুন।
2. এই প্রকল্পের বিদ্যমান `profiles`, `module_records` ও `admin_module_permissions` টেবিল ব্যবহার করুন; `supabase/schema.sql` এই বিদ্যমান প্রকল্পে চালাবেন না—এটি পুরোনো আলাদা schema-র নথি।
3. SQL Editor-এ `supabase/migrate-basic-modules.sql` চালান (১৫ মডিউল, ৫০০ শব্দের সীমা ও গ্যালারি Storage policy)।
3. Authentication settings-এ Public sign-ups বন্ধ রাখুন।
4. Authentication > Users থেকে প্রথম admin account তৈরি করুন।
5. বিদ্যমান `profiles` টেবিলে ওই Auth user-এর UUID-তে উপযুক্ত `role` ও `institution` নিশ্চিত করুন। `admin_profiles` টেবিল তৈরি করবেন না।
6. Project URL এবং Publishable key `supabase-config.js`-এ কনফিগার করা আছে।
7. Auth URL configuration-এ Site URL: `https://itdaynamic96-hub.github.io` এবং Redirect URL: `https://itdaynamic96-hub.github.io/shayla-akram-mosque-basic/**` রাখুন।
8. কখনো service_role/secret key browser বা GitHub repository-তে রাখবেন না।

## ভূমিকা
- `super_admin`: সব ১৫টি মডিউলের তথ্য তৈরি/সম্পাদনা, অনুমোদন ও প্রকাশ করতে পারবেন।
- `custom_admin`: `admin_module_permissions`-এ অনুমোদিত মডিউলে তথ্য তৈরি/সম্পাদনা, অনুদান নথিভুক্ত ও গ্যালারি ফাইল আপলোড করতে পারবেন; তথ্য `pending` অবস্থায় যাবে।
- গ্যালারি ফাইল Storage-এ প্রকাশ্য URL-এ থাকে, কিন্তু ওয়েবসাইটে দেখাতে সংশ্লিষ্ট `m14` রেকর্ড `published` হতে হবে।

## GitHub Pages
GitHub Actions workflow: `.github/workflows/pages.yml`।
প্রত্যাশিত ঠিকানা: https://itdaynamic96-hub.github.io/shayla-akram-mosque-basic/

## সীমাবদ্ধতা ও মালিকের করণীয়
- Supabase Auth user তৈরি, SQL চালানো, Site URL/Redirect URL সংরক্ষণ এবং প্রথম owner profile যাচাই প্রকল্পের মালিকের Supabase dashboard-এ করতে হয়।
- অনুদান মডিউল হাতে পাওয়া অনুদান নথিভুক্তি ও যাচাইয়ের জন্য; বাস্তব online payment gateway এখনো সংযুক্ত নয়।
- গ্যালারির ফাইল Storage-এ থাকে; বড় ফাইলের জন্য ১০ MB client-side সীমা রয়েছে।
- নামাজের সময়, যোগাযোগের ফোন/ঠিকানা, কমিটি ও ইতিহাসের বাস্তব তথ্য কর্তৃপক্ষকে দিয়ে অ্যাডমিন প্যানেল থেকে প্রকাশ করতে হবে। কোনো সময় বা ব্যক্তিগত তথ্য অনুমান করে দেখানো হয় না।
