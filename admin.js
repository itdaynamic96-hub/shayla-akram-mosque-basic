const modules=[["M01","home","হোমপেজ"],["M02","mosjid-porichiti","মসজিদের পরিচিতি"],["M03","itihas","মসজিদের নামকরণ ও ইতিহাস"],["M04","motawalli","মোতাওয়াল্লীর বাণী"],["M05","committee","পরিচালনা কমিটি"],["M06","prayer","পাঁচ ওয়াক্ত নামাজের সময়সূচি"],["M07","special-prayer","জুমা, রমজান ও ঈদের সময়সূচি"],["M08","notices","নোটিশ ও ঘোষণা"],["M09","news","সংবাদ ও কার্যক্রম"],["M10","islamic-learning","কোরআন ও ইসলামিক শিক্ষা"],["M11","imam","ইমাম ও খতিব পরিচিতি"],["M12","services","ধর্মীয় ও সামাজিক সেবা"],["M13","donations","অনুদান ও সহযোগিতা"],["M14","gallery","ছবি ও ভিডিও গ্যালারি"],["M15","contact","যোগাযোগ ও অবস্থান"]];
const client=window.supabase&&window.MOSQUE_SUPABASE_URL&&window.MOSQUE_SUPABASE_ANON_KEY?window.supabase.createClient(window.MOSQUE_SUPABASE_URL,window.MOSQUE_SUPABASE_ANON_KEY):null;
const $=id=>document.getElementById(id), form=$("entryForm"), body=$("body");
const moduleByKey=Object.fromEntries(modules.map(m=>[m[0],m]));
const roleNames={super_admin:"সুপার অ্যাডমিন",custom_admin:"কাস্টম অ্যাডমিন",admin:"অ্যাডমিন",website_admin:"ওয়েবসাইট অ্যাডমিন",editor:"সম্পাদক",mosque_admin:"মসজিদ অ্যাডমিন",manager:"ব্যবস্থাপক",foundation_admin:"ফাউন্ডেশন অ্যাডমিন",accounts_manager:"হিসাব ব্যবস্থাপক",accountant:"হিসাবরক্ষক",auditor:"নিরীক্ষক",viewer:"দর্শক"};
let profile=null,user=null,entries=[];
const countWords=s=>(s.trim().match(/\S+/g)||[]).length;
const clampWords=s=>{let n=0;return (s.match(/\S+|\s+/g)||[]).filter(p=>{if(!/\S/.test(p))return true;if(n>=500)return false;n++;return true}).join("")};
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const label=s=>({draft:"খসড়া",pending:"অনুমোদনের অপেক্ষায়",approved:"অনুমোদিত",published:"প্রকাশিত",rejected:"বাতিল"}[s]||s);
function moduleKey(slug){return modules.find(m=>m[1]===slug)?.[0]}
function canWrite(m){return profile?.role==="super_admin"||(profile?.role==="custom_admin"&&profile.institution==="mosque")||(["admin","website_admin","editor","mosque_admin","manager"].includes(profile?.role)&&profile.institution==="mosque")}
function reset(){form.reset();$("editId").value="";$("entryFormTitle").textContent="নতুন তথ্য যোগ করুন";$("saveEntryBtn").textContent="তথ্য সংরক্ষণ করুন";$("cancelEditBtn").classList.add("hidden");$("wordCount").textContent="০ / ৫০০ শব্দ"}
function statusOptions(){const allowed=profile?.role==="super_admin"?[["draft","খসড়া"],["pending","অনুমোদনের অপেক্ষায়"],["approved","অনুমোদিত"],["rejected","বাতিল"],["published","প্রকাশিত"]]:[["draft","খসড়া"],["pending","অনুমোদনের অপেক্ষায়"]];$("status").innerHTML=allowed.map(x=>'<option value="'+x[0]+'">'+x[1]+'</option>').join("")}
function rowBody(r){return r.data?.body||""}
function rowMeta(r){return r.data?.metadata||{}}
function rowSlug(r){return moduleByKey[r.module_key]?.[1]||r.module_key}
async function checkSession(){
 if(!client)return;
 const {data:{session}}=await client.auth.getSession();if(!session)return;
 user=session.user;
 const {data,error}=await client.from("profiles").select("id,full_name,role,institution,email,job_title").eq("id",user.id).maybeSingle();
 if(error||!data){await client.auth.signOut();$("loginMessage").textContent="এই অ্যাকাউন্টের প্রশাসনিক Profile পাওয়া যায়নি।";return}
 profile=data;
 if(!["super_admin","custom_admin","admin","website_admin","editor","mosque_admin","manager"].includes(profile.role)){await client.auth.signOut();$("loginMessage").textContent="এই ভূমিকার অ্যাডমিন প্যানেলে প্রবেশের অনুমতি নেই।";return}
 $("loginBox").classList.add("hidden");$("dashboard").classList.remove("hidden");
 $("adminIdentity").textContent=(profile.full_name||user.email)+" · "+(roleNames[profile.role]||profile.role)+" · "+profile.institution;
 $("module").innerHTML=modules.map(m=>'<option value="'+m[1]+'">'+m[2]+'</option>').join("");
 statusOptions();
 if(!canWrite())form.classList.add("hidden");
 if(profile.role!=="super_admin"){$("donationManager").classList.add("hidden");$("galleryManager").classList.add("hidden")}
 await loadEntries();
}
async function loadEntries(){
 const {data,error}=await client.from("module_records").select("id,module_key,institution,title,data,status,created_by,approved_by,approved_at,created_at,updated_at").eq("institution","mosque").order("created_at",{ascending:false}).limit(100);
 if(error){$("entries").textContent="তথ্য লোড হয়নি: "+error.message;return}
 entries=data||[];
 $("entries").innerHTML=entries.map(r=>{
 const actions=[];
 if(canWrite()&&(["draft","pending","rejected"].includes(r.status)||profile.role==="super_admin"))actions.push('<button class="btn btn-outline" data-edit="'+r.id+'">সম্পাদনা</button>');
 if(profile.role==="super_admin"&&r.status!=="published")actions.push('<button class="btn btn-outline" data-state="published" data-id="'+r.id+'">প্রকাশ</button>');
 if(profile.role==="super_admin"&&r.status!=="approved")actions.push('<button class="btn btn-outline" data-state="approved" data-id="'+r.id+'">অনুমোদন</button>');
 if(profile.role==="super_admin"&&r.status!=="rejected")actions.push('<button class="btn btn-outline" data-state="rejected" data-id="'+r.id+'">বাতিল</button>');
 return '<article class="notice-card"><strong>'+esc(r.title)+'</strong><p>'+esc(moduleByKey[r.module_key]?.[2]||r.module_key)+' · '+label(r.status)+' · '+esc(r.institution)+'</p><div class="admin-toolbar">'+actions.join(" ")+'</div></article>'
 }).join("")||"এখনো কোনো তথ্য নেই।";
 $("entries").querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>editEntry(b.dataset.edit));
 $("entries").querySelectorAll("[data-state]").forEach(b=>b.onclick=()=>changeStatus(b.dataset.id,b.dataset.state));
}
async function editEntry(id){
 const r=entries.find(x=>x.id===id);if(!r)return;
 $("editId").value=r.id;$("module").value=rowSlug(r);$("title").value=r.title;$("body").value=rowBody(r);$("metadata").value=JSON.stringify(rowMeta(r),null,2);$("status").value=r.status;
 $("entryFormTitle").textContent="তথ্য সম্পাদনা করুন";$("saveEntryBtn").textContent="পরিবর্তন সংরক্ষণ করুন";$("cancelEditBtn").classList.remove("hidden");$("wordCount").textContent=countWords(body.value)+" / ৫০০ শব্দ";
 form.scrollIntoView({behavior:"smooth",block:"start"});
}
async function changeStatus(id,status){
 if(profile.role!=="super_admin")return;
 const r=entries.find(x=>x.id===id);if(!r)return;
 const patch={status,approved_by:user.id,approved_at:new Date().toISOString(),data:{...(r.data||{}),public_display:status==="published"}};
 const {error}=await client.from("module_records").update(patch).eq("id",id);
 $("saveMessage").textContent=error?"অবস্থা পরিবর্তন হয়নি: "+error.message:"অবস্থা পরিবর্তন হয়েছে।";
 await loadEntries();
}
form.addEventListener("submit",async e=>{
 e.preventDefault();if(!client||!canWrite())return;
 if(countWords(body.value)>500){$("saveMessage").textContent="বিবরণ সর্বোচ্চ ৫০০ শব্দ হতে পারবে।";return}
 let metadata={};try{metadata=$("metadata").value.trim()?JSON.parse($("metadata").value):{};if(!metadata||Array.isArray(metadata)||typeof metadata!=="object")throw new Error("JSON অবজেক্ট হতে হবে।")}catch(err){$("saveMessage").textContent="JSON সঠিক নয়: "+err.message;return}
 const slug=$("module").value,key=moduleKey(slug),status=$("status").value;
 const data={body:body.value.trim(),metadata,public_display:status==="published"};
 const payload={module_key:key,institution:"mosque",title:$("title").value.trim(),data,status};
 let result;
 if($("editId").value)result=await client.from("module_records").update(payload).eq("id",$("editId").value);
 else result=await client.from("module_records").insert({...payload,created_by:user.id});
 $("saveMessage").textContent=result.error?"সংরক্ষণ হয়নি: "+result.error.message:"তথ্য সংরক্ষিত হয়েছে।";
 if(!result.error){reset();await loadEntries()}
});
$("loginForm").addEventListener("submit",async e=>{e.preventDefault();if(!client){$("loginMessage").textContent="Supabase সংযোগ কনফিগার করা নেই।";return}const {error}=await client.auth.signInWithPassword({email:$("email").value.trim(),password:$("password").value});if(error){$("loginMessage").textContent="লগইন ব্যর্থ: "+error.message;return}await checkSession()});
$("logoutBtn").onclick=async()=>{await client.auth.signOut();location.reload()};
$("cancelEditBtn").onclick=reset;
body.addEventListener("input",()=>{if(countWords(body.value)>500){body.value=clampWords(body.value);$("saveMessage").textContent="সর্বোচ্চ ৫০০ শব্দ রাখা হয়েছে।"}$("wordCount").textContent=countWords(body.value)+" / ৫০০ শব্দ"});
body.addEventListener("paste",e=>{const t=(e.clipboardData||window.clipboardData).getData("text");if(countWords(body.value+" "+t)>500){e.preventDefault();$("saveMessage").textContent="পেস্ট করা লেখাসহ মোট শব্দ ৫০০-এর বেশি হতে পারবে না।"}});
$("donationDate").value=new Date().toISOString().slice(0,10);
if(client)checkSession();else $("loginMessage").textContent="Supabase Project URL ও Publishable key যুক্ত না হওয়া পর্যন্ত লগইন চালু হবে না।";
