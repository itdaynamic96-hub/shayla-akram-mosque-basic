const MODULES=[["m01","home","হোমপেজ"],["m02","mosjid-porichiti","মসজিদের পরিচিতি"],["m03","itihas","মসজিদের নামকরণ ও ইতিহাস"],["m04","motawalli","মোতাওয়াল্লীর বাণী"],["m05","committee","পরিচালনা কমিটি"],["m06","prayer","পাঁচ ওয়াক্ত নামাজের সময়সূচি"],["m07","special-prayer","জুমা, রমজান ও ঈদের সময়সূচি"],["m08","notices","নোটিশ ও ঘোষণা"],["m09","news","সংবাদ ও কার্যক্রম"],["m10","islamic-learning","কোরআন ও ইসলামিক শিক্ষা"],["m11","imam","ইমাম ও খতিব পরিচিতি"],["m12","services","ধর্মীয় ও সামাজিক সেবা"],["m13","donations","অনুদান ও সহযোগিতা"],["m14","gallery","ছবি ও ভিডিও গ্যালারি"],["m15","contact","যোগাযোগ ও অবস্থান"]];
const configured=window.supabase&&window.MOSQUE_SUPABASE_URL&&window.MOSQUE_SUPABASE_ANON_KEY;
const db=configured?window.supabase.createClient(window.MOSQUE_SUPABASE_URL,window.MOSQUE_SUPABASE_ANON_KEY):null;
const $=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const empty=m=>'<div class="empty-state">'+esc(m)+'</div>';
const safeUrl=value=>{try{const u=new URL(value,location.href);return ["https:","http:"].includes(u.protocol)?u.href:""}catch{return""}};
if($("year"))$("year").textContent=new Date().getFullYear();
if($("todayDate"))$("todayDate").textContent=new Intl.DateTimeFormat("bn-BD",{dateStyle:"full"}).format(new Date());
$("menuToggle")?.addEventListener("click",()=>$("mainNav")?.classList.toggle("open"));
$("mainNav")?.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>$("mainNav")?.classList.remove("open")));
function entryCard(r,compact=false){
 const meta=r.metadata||{},url=safeUrl(meta.url);let media="";
 if(r.module==="gallery"&&url)media=meta.media_type==="video"?'<video controls preload="metadata" src="'+esc(url)+'"></video>':'<img loading="lazy" src="'+esc(url)+'" alt="'+esc(r.title)+'">';
 let details="";
 if(r.module==="prayer"&&Object.keys(meta).length)details='<dl class="entry-meta">'+["ফজর","যোহর","আসর","মাগরিব","ইশা"].map(k=>'<div><dt>'+k+'</dt><dd>'+esc(meta[k]||"—")+'</dd></div>').join("")+'</dl>';
 if(r.module==="special-prayer"){const j=meta.jummah||meta["জুমার জামাত"];if(j)details='<p><strong>জুমার জামাত:</strong> '+esc(j)+'</p>'}
 const body=r.body?'<p>'+esc(compact&&r.body.length>220?r.body.slice(0,220)+"…":r.body)+'</p>':"";
 return '<article class="public-card '+(r.module==="gallery"?"gallery-card":"")+'">'+media+'<div class="public-card-copy"><h3>'+esc(r.title)+'</h3>'+body+details+'</div></article>';
}
function setSection(id,rows,message,compact=false){
 const el=$(id);if(!el)return;
 el.innerHTML=rows.length?rows.map(r=>entryCard(r,compact)).join(""):empty(message);
}
function renderHomepage(rows){
 const allPublished=$("allPublishedDynamic");if(allPublished)allPublished.innerHTML=rows.map(r=>entryCard(r,true)).join("");
 const sampleModules=[
  ["home","হোমপেজ","নমুনা তথ্য: স্বাগত বার্তা, গুরুত্বপূর্ণ ঘোষণা ও সর্বশেষ প্রকাশনা এখানে দেখানো হবে।"],["mosjid-porichiti","মসজিদের পরিচিতি","নমুনা তথ্য: মসজিদের উদ্দেশ্য, সেবা ও সুযোগ-সুবিধার যাচাইকৃত পরিচিতি এখানে যুক্ত হবে।"],["itihas","মসজিদের নামকরণ ও ইতিহাস","নমুনা তথ্য: প্রতিষ্ঠা, নামকরণ ও উল্লেখযোগ্য ঘটনার তথ্য প্রমাণসহ প্রশাসক যাচাই করে প্রকাশ করবেন।"],["motawalli","মোতাওয়াল্লীর বাণী","নমুনা তথ্য: দায়িত্বশীলের অনুমোদিত বাণী ও দিকনির্দেশনা এখানে প্রকাশিত হবে।"],["committee","পরিচালনা কমিটি","নমুনা তথ্য: অনুমোদিত কমিটির নাম, পদ ও মেয়াদ যাচাই শেষে প্রকাশ করা হবে।"],["prayer","নামাজের সময়সূচি","নমুনা তথ্য: স্থানীয়ভাবে নিশ্চিত জামাতের সময় প্রশাসক প্রকাশ করবেন; এখানে কোনো সময় অনুমান করে দেওয়া হয়নি।"],["special-prayer","জুমা, রমজান ও ঈদের সময়সূচি","নমুনা তথ্য: কর্তৃপক্ষ নিশ্চিত করলে বিশেষ জামাতের সময় এখানে দেখানো হবে।"],["notices","নোটিশ ও ঘোষণা","নমুনা তথ্য: তারিখ, বিষয় ও কর্তৃপক্ষের অনুমোদনসহ নোটিশ এখানে প্রকাশিত হবে।"],["news","সংবাদ ও কার্যক্রম","নমুনা তথ্য: সম্পন্ন কার্যক্রমের যাচাইকৃত সংবাদ ও প্রতিবেদন এখানে যুক্ত হবে।"],["islamic-learning","কোরআন ও ইসলামিক শিক্ষা","নমুনা তথ্য: নির্ভরযোগ্য সূত্রভিত্তিক কোরআন-সুন্নাহর শিক্ষামূলক লেখা এখানে প্রকাশিত হবে।"],["imam","ইমাম ও খতিব পরিচিতি","নমুনা তথ্য: সংশ্লিষ্ট ব্যক্তির সম্মতি ও যাচাইকৃত পরিচিতি প্রকাশ করা হবে।"],["services","ধর্মীয় ও সামাজিক সেবা","নমুনা তথ্য: বাস্তবে চালু সেবা, যোগ্যতা ও যোগাযোগের নিয়ম এখানে জানানো হবে।"],["donations","অনুদান ও সহযোগিতা","নমুনা তথ্য: অনুমোদিত অনুদান পদ্ধতি ও স্বচ্ছ হিসাবের তথ্য এখানে প্রকাশিত হবে; কোনো কাল্পনিক অঙ্ক নয়।"],["gallery","ছবি ও ভিডিও গ্যালারি","নমুনা তথ্য: অনুমতিপ্রাপ্ত আসল ছবি ও ভিডিও আপলোড হলে এখানে দেখা যাবে।"],["contact","যোগাযোগ ও অবস্থান","নমুনা তথ্য: যাচাইকৃত ঠিকানা ও যোগাযোগ নম্বর কর্তৃপক্ষ প্রকাশ করবেন।"]
 ];
 const existing=new Set(rows.map(r=>r.module));
 rows=[...rows,...sampleModules.filter(x=>!existing.has(x[0])).map(x=>({id:"sample-"+x[0],module:x[0],title:"নমুনা তথ্য — "+x[1],body:x[2],metadata:{sample:true},status:"published",published_at:"",created_at:""}))];

 const latest=Object.fromEntries(MODULES.map(m=>[m[1],rows.find(r=>r.module===m[1])]));
 const home=latest.home;
 if(home){const heroText=$("heroDynamic");if(heroText){heroText.innerHTML=(home.title?'<h2>'+esc(home.title)+'</h2>':"")+(home.body?'<p>'+esc(home.body)+'</p>':"");heroText.classList.remove("hidden")}}
 setSection("historyDynamic",rows.filter(r=>["mosjid-porichiti","itihas","motawalli"].includes(r.module)).slice(0,3),"মসজিদের পরিচিতি ও ইতিহাসের তথ্য প্রকাশের অপেক্ষায়।",true);
 setSection("committeeDynamic",rows.filter(r=>["committee","imam"].includes(r.module)).slice(0,4),"কমিটি ও ইমাম-খতিবের পরিচিতি প্রকাশের অপেক্ষায়।",true);
 setSection("newsDynamic",rows.filter(r=>r.module==="news").slice(0,3),"প্রকাশিত সংবাদ ও কার্যক্রম এখনো নেই।",true);
 setSection("learningDynamic",rows.filter(r=>r.module==="islamic-learning").slice(0,3),"ইসলামিক শিক্ষার তথ্য প্রকাশের অপেক্ষায়।",true);
 setSection("servicesDynamic",rows.filter(r=>r.module==="services").slice(0,3),"সেবা কার্যক্রমের তথ্য প্রকাশের অপেক্ষায়।",true);
 setSection("donationsDynamic",rows.filter(r=>r.module==="donations").slice(0,2),"অনুদান ও সহযোগিতার তথ্য প্রকাশের অপেক্ষায়।",true);
 setSection("specialPrayerDynamic",rows.filter(r=>r.module==="special-prayer").slice(0,2),"জুমা, রমজান ও ঈদের সময়সূচি প্রকাশের অপেক্ষায়।",true);
 setSection("galleryDynamic",rows.filter(r=>r.module==="gallery").slice(0,6),"প্রকাশিত ছবি বা ভিডিও এখনো নেই।",true);
 setSection("noticeList",rows.filter(r=>r.module==="notices").slice(0,4),"প্রকাশিত নোটিশ এখনো নেই।",true);
 const prayer=latest.prayer;
 if(prayer&&$("prayerGrid"))$("prayerGrid").innerHTML=["ফজর","যোহর","আসর","মাগরিব","ইশা"].map(k=>'<div class="prayer-item"><span>'+k+'</span><strong>'+esc(prayer.metadata?.[k]||"—")+'</strong></div>').join("");
 const special=latest["special-prayer"];
 if(special&&$("jummahTime"))$("jummahTime").textContent=special.metadata?.jummah||special.metadata?.["জুমার জামাত"]||"প্রকাশিত হলে দেখানো হবে";
 const contact=latest.contact?.metadata||{};
 const address=contact.address||contact["ঠিকানা"],phone=contact.phone||contact["ফোন"];
 const panel=$("contactDynamic");
 if(panel&&(address||phone))panel.innerHTML=(address?'<p><strong>ঠিকানা</strong><br>'+esc(address)+'</p>':"")+(phone?'<p><strong>ফোন</strong><br>'+esc(phone)+'</p>':"");
}
async function loadPublic(){
 if(!db)return;
 const {data,error}=await db.from("mosque_entries").select("id,module,title,body,metadata,status,published_at,created_at").eq("status","published").order("published_at",{ascending:false,nullsFirst:false}).order("created_at",{ascending:false}).limit(1000);
 if(error){console.warn("প্রকাশিত তথ্য লোড হয়নি:",error.message);document.querySelectorAll("[data-public-error]").forEach(x=>x.textContent="তথ্য লোড করা যায়নি। পরে আবার চেষ্টা করুন।");return}
 renderHomepage(data||[]);
}
async function renderModule(){
 const slug=new URLSearchParams(location.search).get("page"),module=MODULES.find(x=>x[1]===slug);if(!module)return;
 document.title=module[2]+" | সাকছিপাড়া শায়লা আকরাম কেন্দ্রীয় জামে মসজিদ";
 const main=document.querySelector("main");
 main.innerHTML='<section class="page-hero"><div class="container"><span class="eyebrow">সাকছিপাড়া শায়লা আকরাম কেন্দ্রীয় জামে মসজিদ</span><h1>'+esc(module[2])+'</h1></div></section><section class="page-content container" id="moduleContent">'+empty("এই বিভাগের তথ্য লোড হচ্ছে…")+'</section>';
 if(!db){$("moduleContent").innerHTML=empty("এই মুহূর্তে তথ্যসেবা সংযুক্ত নয়।");return}
 const {data,error}=await db.from("mosque_entries").select("id,module,title,body,metadata,status,published_at,created_at").eq("module",module[1]).eq("status","published").order("published_at",{ascending:false,nullsFirst:false}).order("created_at",{ascending:false});
 if(error){$("moduleContent").innerHTML=empty("তথ্য লোড করা যায়নি। পরে আবার চেষ্টা করুন।");return}
 $("moduleContent").innerHTML=(data||[]).length?(data||[]).map(r=>entryCard(r)).join(""):empty("এই বিভাগের তথ্য এখনো প্রকাশ করা হয়নি।");
}
if(new URLSearchParams(location.search).has("page"))renderModule();else loadPublic();
