const MODULES=[["M01","home","হোমপেজ"],["M02","mosjid-porichiti","মসজিদের পরিচিতি"],["M03","itihas","মসজিদের নামকরণ ও ইতিহাস"],["M04","motawalli","মোতাওয়াল্লীর বাণী"],["M05","committee","পরিচালনা কমিটি"],["M06","prayer","পাঁচ ওয়াক্ত নামাজের সময়সূচি"],["M07","special-prayer","জুমা, রমজান ও ঈদের সময়সূচি"],["M08","notices","নোটিশ ও ঘোষণা"],["M09","news","সংবাদ ও কার্যক্রম"],["M10","islamic-learning","কোরআন ও ইসলামিক শিক্ষা"],["M11","imam","ইমাম ও খতিব পরিচিতি"],["M12","services","ধর্মীয় ও সামাজিক সেবা"],["M13","donations","অনুদান ও সহযোগিতা"],["M14","gallery","ছবি ও ভিডিও গ্যালারি"],["M15","contact","যোগাযোগ ও অবস্থান"]];
const configured=window.supabase&&window.MOSQUE_SUPABASE_URL&&window.MOSQUE_SUPABASE_ANON_KEY;
const db=configured?window.supabase.createClient(window.MOSQUE_SUPABASE_URL,window.MOSQUE_SUPABASE_ANON_KEY):null;
const $=id=>document.getElementById(id);
if($("year"))$("year").textContent=new Date().getFullYear();
if($("todayDate"))$("todayDate").textContent=new Intl.DateTimeFormat("bn-BD",{dateStyle:"full"}).format(new Date());
$("menuToggle")?.addEventListener("click",()=>$("mainNav")?.classList.toggle("open"));
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const empty=m=>'<div class="empty-state">'+esc(m)+'</div>';
const byKey=Object.fromEntries(MODULES.map(m=>[m[0],m]));
function renderEntry(r){
 const d=r.data||{},meta=d.metadata||{};let media="";
 if(r.module_key==="M14"&&meta.url)media=meta.media_type==="video"?'<video controls preload="metadata" src="'+esc(meta.url)+'"></video>':'<img loading="lazy" src="'+esc(meta.url)+'" alt="'+esc(r.title)+'">';
 let extra="";
 if(r.module_key==="M06"&&Object.keys(meta).length)extra='<dl class="entry-meta">'+["ফজর","যোহর","আসর","মাগরিব","ইশা"].map(k=>'<div><dt>'+k+'</dt><dd>'+esc(meta[k]||"—")+'</dd></div>').join("")+'</dl>';
 if(r.module_key==="M07"&&(meta.jummah||meta["জুমার জামাত"]))extra='<p><strong>জুমার জামাত:</strong> '+esc(meta.jummah||meta["জুমার জামাত"])+'</p>';
 return '<article class="admin-card entry-public">'+media+'<h2>'+esc(r.title)+'</h2><p>'+esc(d.body||"")+'</p>'+extra+'</article>';
}
async function loadPublic(){
 if(!db)return;
 const {data,error}=await db.from("module_records").select("id,module_key,title,data,status,created_at").eq("institution","mosque").eq("status","published").order("created_at",{ascending:false}).limit(200);
 if(error){console.warn("প্রকাশিত তথ্য লোড হয়নি:",error.message);return}
 const rows=(data||[]).filter(r=>r.data?.public_display===true);
 const notices=rows.filter(r=>r.module_key==="M08").slice(0,4),nl=$("noticeList");
 if(nl)nl.innerHTML=notices.length?notices.map(n=>'<article class="notice-card"><h3>'+esc(n.title)+'</h3><p>'+esc((n.data?.body||"").slice(0,240))+'</p></article>').join(""):empty("প্রকাশিত নোটিশ এখনো নেই।");
 const prayer=rows.find(r=>r.module_key==="M06"&&r.data?.metadata);
 if(prayer&&$("prayerGrid"))$("prayerGrid").innerHTML=["ফজর","যোহর","আসর","মাগরিব","ইশা"].map(k=>'<div class="prayer-item"><span>'+k+'</span><strong>'+esc(prayer.data.metadata[k]||"—")+'</strong></div>').join("");
 const friday=rows.find(r=>r.module_key==="M07"&&r.data?.metadata);
 if(friday&&$("jummahTime"))$("jummahTime").textContent=friday.data.metadata.jummah||friday.data.metadata["জুমার জামাত"]||"প্রকাশিত হলে দেখানো হবে";
}
async function renderModule(){
 const slug=new URLSearchParams(location.search).get("page"),module=MODULES.find(x=>x[1]===slug);if(!module)return;
 document.title=module[2]+" | সাকছিপাড়া শায়লা আকরাম কেন্দ্রীয় জামে মসজিদ";
 document.querySelector("main").innerHTML='<section class="page-hero"><div class="container"><h1>'+module[2]+'</h1></div></section><section class="page-content container" id="moduleContent">'+empty("এই বিভাগের তথ্য এখনো প্রকাশ করা হয়নি।")+'</section>';
 if(!db)return;
 const {data,error}=await db.from("module_records").select("id,module_key,title,data,status,created_at").eq("institution","mosque").eq("module_key",module[0]).eq("status","published").order("created_at",{ascending:false});
 if(error){$("moduleContent").innerHTML=empty("তথ্য লোড করা যায়নি। পরে আবার চেষ্টা করুন।");return}
 const rows=(data||[]).filter(r=>r.data?.public_display===true);
 if(rows.length)$("moduleContent").innerHTML=rows.map(renderEntry).join("");
}
if(new URLSearchParams(location.search).has("page"))renderModule();else loadPublic();
