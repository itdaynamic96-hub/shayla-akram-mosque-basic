const MODULES=[["mosjid-porichiti","মসজিদের পরিচিতি"],["itihas","মসজিদের নামকরণ ও ইতিহাস"],["motawalli","মোতাওয়াল্লীর বাণী"],["committee","পরিচালনা কমিটি"],["prayer","পাঁচ ওয়াক্ত নামাজের সময়সূচি"],["special-prayer","জুমা, রমজান ও ঈদের সময়সূচি"],["notices","নোটিশ ও ঘোষণা"],["news","সংবাদ ও কার্যক্রম"],["islamic-learning","কোরআন ও ইসলামিক শিক্ষা"],["imam","ইমাম ও খতিব পরিচিতি"],["services","ধর্মীয় ও সামাজিক সেবা"],["donations","অনুদান ও সহযোগিতা"],["gallery","ছবি ও ভিডিও গ্যালারি"],["contact","যোগাযোগ ও অবস্থান"]];
const configured=window.supabase&&window.MOSQUE_SUPABASE_URL&&window.MOSQUE_SUPABASE_ANON_KEY;
const db=configured?window.supabase.createClient(window.MOSQUE_SUPABASE_URL,window.MOSQUE_SUPABASE_ANON_KEY):null;
const $=id=>document.getElementById(id);
if($("year"))$("year").textContent=new Date().getFullYear();
if($("todayDate"))$("todayDate").textContent=new Intl.DateTimeFormat("bn-BD",{dateStyle:"full"}).format(new Date());
$("menuToggle")?.addEventListener("click",()=>$("mainNav")?.classList.toggle("open"));
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function empty(msg){return '<div class="empty-state">'+esc(msg)+'</div>'}
function displayEntry(x){const media=x.metadata||{};let visual="";if(x.module==="gallery"&&media.url){if(media.media_type==="video")visual='<video controls preload="metadata" src="'+esc(media.url)+'"></video>';else visual='<img loading="lazy" src="'+esc(media.url)+'" alt="'+esc(x.title)+'">'}let extra="";if(x.module==="prayer"&&media&&Object.keys(media).length){extra='<dl class="entry-meta">'+["ফজর","যোহর","আসর","মাগরিব","ইশা"].map(k=>'<div><dt>'+k+'</dt><dd>'+esc(media[k]||"—")+'</dd></div>').join("")+'</dl>'}if(x.module==="special-prayer"&&media.jummah)extra='<p><strong>জুমার জামাত:</strong> '+esc(media.jummah)+'</p>';return '<article class="admin-card entry-public">'+visual+'<h2>'+esc(x.title)+'</h2><p>'+esc(x.body||"")+'</p>'+extra+'</article>'}
async function loadPublic(){
 if(!db)return;
 const {data,error}=await db.from("mosque_entries").select("id,module,title,body,published_at,metadata").eq("status","published").order("published_at",{ascending:false});
 if(error){console.warn("প্রকাশিত তথ্য লোড হয়নি:",error.message);return}
 const rows=data||[], notices=rows.filter(x=>x.module==="notices").slice(0,4), nl=$("noticeList");
 if(nl)nl.innerHTML=notices.length?notices.map(n=>'<article class="notice-card"><h3>'+esc(n.title)+'</h3><p>'+esc((n.body||"").slice(0,240))+'</p></article>').join(""):empty("প্রকাশিত নোটিশ এখনো নেই।");
 const prayer=rows.find(x=>x.module==="prayer"&&x.metadata);
 if(prayer&&$("prayerGrid"))$("prayerGrid").innerHTML=["ফজর","যোহর","আসর","মাগরিব","ইশা"].map(k=>'<div class="prayer-item"><span>'+k+'</span><strong>'+esc(prayer.metadata[k]||"—")+'</strong></div>').join("");
 const jummah=rows.find(x=>x.module==="special-prayer"&&x.metadata&&(x.metadata.jummah||x.metadata["জুমার জামাত"]));
 if(jummah&&$("jummahTime"))$("jummahTime").textContent=jummah.metadata.jummah||jummah.metadata["জুমার জামাত"];
}
async function renderModule(){
 const slug=new URLSearchParams(location.search).get("page"), module=MODULES.find(x=>x[0]===slug);
 if(!module)return;
 document.title=module[1]+" | ساکছিপাড়া শায়লা আকরাম কেন্দ্রীয় জামে মসজিদ";
 document.querySelector("main").innerHTML='<section class="page-hero"><div class="container"><h1>'+module[1]+'</h1></div></section><section class="page-content container" id="moduleContent">'+empty("এই বিভাগের তথ্য এখনো প্রকাশ করা হয়নি।")+'</section>';
 if(!db)return;
 const {data,error}=await db.from("mosque_entries").select("id,title,body,metadata,published_at").eq("module",slug).eq("status","published").order("published_at",{ascending:false});
 if(error){$("moduleContent").innerHTML=empty("তথ্য লোড করা যায়নি। পরে আবার চেষ্টা করুন।");return}
 if(data?.length)$("moduleContent").innerHTML=data.map(displayEntry).join("");
}
if(new URLSearchParams(location.search).has("page"))renderModule();else loadPublic();
