const MODULES=[["mosjid-porichiti","মসজিদের পরিচিতি"],["itihas","মসজিদের নামকরণ ও ইতিহাস"],["motawalli","মোতাওয়াল্লীর বাণী"],["committee","পরিচালনা কমিটি"],["prayer","পাঁচ ওয়াক্ত নামাজের সময়সূচি"],["special-prayer","জুমা, রমজান ও ঈদের সময়সূচি"],["notices","নোটিশ ও ঘোষণা"],["news","সংবাদ ও কার্যক্রম"],["islamic-learning","কোরআন ও ইসলামিক শিক্ষা"],["imam","ইমাম ও খতিব পরিচিতি"],["services","ধর্মীয় ও সামাজিক সেবা"],["donations","অনুদান ও সহযোগিতা"],["gallery","ছবি ও ভিডিও গ্যালারি"],["contact","যোগাযোগ ও অবস্থান"]];
const configured=window.supabase&&window.MOSQUE_SUPABASE_URL&&!window.MOSQUE_SUPABASE_URL.startsWith("YOUR_")&&window.MOSQUE_SUPABASE_ANON_KEY&&!window.MOSQUE_SUPABASE_ANON_KEY.startsWith("YOUR_");
const db=configured?window.supabase.createClient(window.MOSQUE_SUPABASE_URL,window.MOSQUE_SUPABASE_ANON_KEY):null;
const $=id=>document.getElementById(id);
if($("year"))$("year").textContent=new Date().getFullYear();
if($("todayDate"))$("todayDate").textContent=new Intl.DateTimeFormat("bn-BD",{dateStyle:"full"}).format(new Date());
$("menuToggle")?.addEventListener("click",()=>$("mainNav")?.classList.toggle("open"));
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function empty(msg){return '<div class="empty-state">'+esc(msg)+'</div>'}
async function loadPublic(){
 if(!db)return;
 const {data,error}=await db.from("mosque_entries").select("id,module,title,body,published_at,metadata").eq("status","published").order("published_at",{ascending:false});
 if(error){console.warn("প্রকাশিত তথ্য লোড হয়নি:",error.message);return}
 const rows=data||[], notices=rows.filter(x=>x.module==="notices").slice(0,4), nl=$("noticeList");
 if(nl)nl.innerHTML=notices.length?notices.map(n=>'<article class="notice-card"><h3>'+esc(n.title)+'</h3><p>'+esc((n.body||"").slice(0,240))+'</p></article>').join(""):empty("প্রকাশিত নোটিশ এখনো নেই।");
 const prayer=rows.find(x=>x.module==="prayer"&&x.metadata);
 if(prayer&&$("prayerGrid"))$("prayerGrid").innerHTML=["ফজর","যোহর","আসর","মাগরিব","ইশা"].map(k=>'<div class="prayer-item"><span>'+k+'</span><strong>'+esc(prayer.metadata[k]||"—")+'</strong></div>').join("");
 const jummah=rows.find(x=>x.module==="special-prayer"&&x.metadata?.jummah);
 if(jummah&&$("jummahTime"))$("jummahTime").textContent=jummah.metadata.jummah;
}
async function renderModule(){
 const slug=new URLSearchParams(location.search).get("page"), module=MODULES.find(x=>x[0]===slug);
 if(!module)return;
 document.querySelector("main").innerHTML='<section class="page-hero"><div class="container"><h1>'+module[1]+'</h1></div></section><section class="page-content container" id="moduleContent">'+empty("এই বিভাগের তথ্য এখনো প্রকাশ করা হয়নি।")+'</section>';
 if(!db)return;
 const {data,error}=await db.from("mosque_entries").select("id,title,body,metadata,published_at").eq("module",slug).eq("status","published").order("published_at",{ascending:false});
 if(error){$("moduleContent").innerHTML=empty("তথ্য লোড করা যায়নি। পরে আবার চেষ্টা করুন।");return}
 if(data?.length)$("moduleContent").innerHTML=data.map(x=>'<article class="admin-card"><h2>'+esc(x.title)+'</h2><p>'+esc(x.body||"")+'</p></article>').join("");
}
if(location.search.includes("page="))renderModule();else loadPublic();
