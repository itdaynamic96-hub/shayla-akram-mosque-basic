const modules=[["m01","home","হোমপেজ"],["m02","mosjid-porichiti","মসজিদের পরিচিতি"],["m03","itihas","মসজিদের নামকরণ ও ইতিহাস"],["m04","motawalli","মোতাওয়াল্লীর বাণী"],["m05","committee","পরিচালনা কমিটি"],["m06","prayer","পাঁচ ওয়াক্ত নামাজের সময়সূচি"],["m07","special-prayer","জুমা, রমজান ও ঈদের সময়সূচি"],["m08","notices","নোটিশ ও ঘোষণা"],["m09","news","সংবাদ ও কার্যক্রম"],["m10","islamic-learning","কোরআন ও ইসলামিক শিক্ষা"],["m11","imam","ইমাম ও খতিব পরিচিতি"],["m12","services","ধর্মীয় ও সামাজিক সেবা"],["m13","donations","অনুদান ও সহযোগিতা"],["m14","gallery","ছবি ও ভিডিও গ্যালারি"],["m15","contact","যোগাযোগ ও অবস্থান"]];
const client=window.supabase&&window.MOSQUE_SUPABASE_URL&&window.MOSQUE_SUPABASE_ANON_KEY?window.supabase.createClient(window.MOSQUE_SUPABASE_URL,window.MOSQUE_SUPABASE_ANON_KEY):null;
const $=id=>document.getElementById(id),form=$("entryForm"),body=$("body");
const moduleByKey=Object.fromEntries(modules.map(m=>[m[0],m]));
const roleNames={super_admin:"সুপার অ্যাডমিন",custom_admin:"কাস্টম অ্যাডমিন",admin:"অ্যাডমিন",website_admin:"ওয়েবসাইট অ্যাডমিন",editor:"সম্পাদক",mosque_admin:"মসজিদ অ্যাডমিন",manager:"ব্যবস্থাপক",foundation_admin:"ফাউন্ডেশন অ্যাডমিন",accounts_manager:"হিসাব ব্যবস্থাপক",accountant:"হিসাবরক্ষক",auditor:"নিরীক্ষক",viewer:"দর্শক"};
let profile=null,user=null,entries=[];
const countWords=s=>(s.trim().match(/\S+/g)||[]).length;
const clampWords=s=>{let n=0;return(s.match(/\S+|\s+/g)||[]).filter(p=>{if(!/\S/.test(p))return true;if(n>=500)return false;n++;return true}).join("")};
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const label=s=>({draft:"খসড়া",pending:"অনুমোদনের অপেক্ষায়",approved:"অনুমোদিত",published:"প্রকাশিত",rejected:"বাতিল"}[s]||s);
const moduleKey=slug=>modules.find(m=>m[1]===slug)?.[0];
const canWrite=()=>profile?.role==="super_admin"||(profile?.role==="custom_admin"&&["mosque","both"].includes(profile.institution))||(["admin","website_admin","editor","mosque_admin","manager"].includes(profile?.role)&&["mosque","both"].includes(profile.institution));
const isSuper=()=>profile?.role==="super_admin";
const setMessage=(id,message)=>{if($(id))$(id).textContent=message};
function reset(){form.reset();$("editId").value="";$("entryFormTitle").textContent="নতুন তথ্য যোগ করুন";$("saveEntryBtn").textContent="তথ্য সংরক্ষণ করুন";$("cancelEditBtn").classList.add("hidden");$("wordCount").textContent="০ / ৫০০ শব্দ"}
function statusOptions(){const allowed=isSuper()?[["draft","খসড়া"],["pending","অনুমোদনের অপেক্ষায়"],["approved","অনুমোদিত"],["rejected","বাতিল"],["published","প্রকাশিত"]]:[["draft","খসড়া"],["pending","অনুমোদনের অপেক্ষায়"]];$("status").innerHTML=allowed.map(x=>'<option value="'+x[0]+'">'+x[1]+"</option>").join("")}
const rowBody=r=>r.data?.body||"";
const rowMeta=r=>r.data?.metadata||{};
const rowSlug=r=>moduleByKey[r.module_key]?.[1]||r.module_key;
async function checkSession(){
 if(!client)return;
 const {data:sessionData,error:sessionError}=await client.auth.getSession();
 if(sessionError){setMessage("loginMessage","সেশন যাচাই ব্যর্থ: "+sessionError.message);return}
 const session=sessionData?.session;if(!session)return;
 user=session.user;
 const {data,error}=await client.from("profiles").select("id,full_name,role,institution,email,job_title").eq("id",user.id).maybeSingle();
 if(error){setMessage("loginMessage","Profile Query ব্যর্থ: "+error.message+" (code: "+(error.code||"unknown")+")");return}
 if(!data){setMessage("loginMessage","এই Supabase Project-এ লগইন করা User ID-এর Profile পাওয়া যায়নি। User ID: "+user.id);return}
 profile=data;
 if(!["super_admin","custom_admin","admin","website_admin","editor","mosque_admin","manager"].includes(profile.role)){await client.auth.signOut();setMessage("loginMessage","এই ভূমিকার অ্যাডমিন প্যানেলে প্রবেশের অনুমতি নেই।");return}
 $("loginBox").classList.add("hidden");$("dashboard").classList.remove("hidden");
 $("adminIdentity").textContent=(profile.full_name||user.email)+" · "+(roleNames[profile.role]||profile.role)+" · "+profile.institution;
 $("module").innerHTML=modules.map(m=>'<option value="'+m[1]+'">'+m[2]+"</option>").join("");
 statusOptions();
 if(!canWrite())form.classList.add("hidden");
 if(canWrite()){$("donationManager").classList.remove("hidden");$("galleryManager").classList.remove("hidden")}else{$("donationManager").classList.add("hidden");$("galleryManager").classList.add("hidden")}
 await loadEntries();
}
function renderEntryActions(r){
 const actions=[];
 if(canWrite()&&(["draft","pending","rejected"].includes(r.status)||isSuper()))actions.push('<button class="btn btn-outline" data-edit="'+r.id+'">সম্পাদনা</button>');
 if(isSuper()&&r.status!=="published")actions.push('<button class="btn btn-outline" data-state="published" data-id="'+r.id+'">প্রকাশ</button>');
 if(isSuper()&&r.status!=="approved")actions.push('<button class="btn btn-outline" data-state="approved" data-id="'+r.id+'">অনুমোদন</button>');
 if(isSuper()&&r.status!=="rejected")actions.push('<button class="btn btn-outline" data-state="rejected" data-id="'+r.id+'">বাতিল</button>');
 return actions.join(" ");
}
function renderRecord(r,extra=""){
 return '<article class="notice-card"><strong>'+esc(r.title)+'</strong><p>'+esc(moduleByKey[r.module_key]?.[2]||r.module_key)+' · '+label(r.status)+'</p>'+extra+'<div class="admin-toolbar">'+renderEntryActions(r)+'</div></article>';
}
async function loadEntries(){
 const {data,error}=await client.from("module_records").select("id,module_key,institution,title,data,status,created_by,approved_by,approved_at,created_at,updated_at").eq("institution","mosque").order("created_at",{ascending:false}).limit(200);
 if(error){$("entries").textContent="তথ্য লোড হয়নি: "+error.message;return}
 entries=data||[];
 $("entries").innerHTML=entries.map(r=>renderRecord(r)).join("")||"এখনো কোনো তথ্য নেই।";
 $("entries").querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>editEntry(b.dataset.edit));
 $("entries").querySelectorAll("[data-state]").forEach(b=>b.onclick=()=>changeStatus(b.dataset.id,b.dataset.state));
 renderDonations();renderGallery();
}
function editEntry(id){
 const r=entries.find(x=>x.id===id);if(!r)return;
 $("editId").value=r.id;$("module").value=rowSlug(r);$("title").value=r.title;$("body").value=rowBody(r);$("metadata").value=JSON.stringify(rowMeta(r),null,2);$("status").value=r.status;
 $("entryFormTitle").textContent="তথ্য সম্পাদনা করুন";$("saveEntryBtn").textContent="পরিবর্তন সংরক্ষণ করুন";$("cancelEditBtn").classList.remove("hidden");$("wordCount").textContent=countWords(body.value)+" / ৫০০ শব্দ";
 form.scrollIntoView({behavior:"smooth",block:"start"});
}
async function changeStatus(id,status){
 if(!isSuper())return;
 const r=entries.find(x=>x.id===id);if(!r)return;
 const patch={status,approved_by:user.id,approved_at:new Date().toISOString(),data:{...(r.data||{}),public_display:status==="published"}};
 const {error}=await client.from("module_records").update(patch).eq("id",id);
 setMessage("saveMessage",error?"অবস্থা পরিবর্তন হয়নি: "+error.message:"অবস্থা পরিবর্তন হয়েছে।");
 if(!error)await loadEntries();
}
form.addEventListener("submit",async e=>{
 e.preventDefault();if(!client||!canWrite())return;
 if(countWords(body.value)>500){setMessage("saveMessage","বিবরণ সর্বোচ্চ ৫০০ শব্দ হতে পারবে।");return}
 let metadata={};try{metadata=$("metadata").value.trim()?JSON.parse($("metadata").value):{};if(!metadata||Array.isArray(metadata)||typeof metadata!=="object")throw new Error("JSON অবজেক্ট হতে হবে।")}catch(err){setMessage("saveMessage","JSON সঠিক নয়: "+err.message);return}
 const key=moduleKey($("module").value),status=$("status").value;
 const data={body:body.value.trim(),metadata,public_display:status==="published"};
 const payload={module_key:key,institution:"mosque",title:$("title").value.trim(),data,status};
 const result=$("editId").value?await client.from("module_records").update(payload).eq("id",$("editId").value):await client.from("module_records").insert({...payload,created_by:user.id});
 setMessage("saveMessage",result.error?"সংরক্ষণ হয়নি: "+result.error.message:"তথ্য সংরক্ষিত হয়েছে।");
 if(!result.error){reset();await loadEntries()}
});
function renderDonations(){
 const list=$("donationList");if(!list)return;
 const rows=entries.filter(r=>r.module_key==="m13");
 list.innerHTML=rows.map(r=>{const m=rowMeta(r),amount=Number(m.amount||0);return '<article class="notice-card"><strong>'+esc(r.title)+'</strong><p>পরিমাণ: ৳'+amount.toLocaleString("en-US",{minimumFractionDigits:2})+' · '+esc(m.received_on||"")+' · '+esc(m.payment_status||"যাচাই বাকি")+'</p><p>দাতা: '+esc(m.donor_name||"নাম প্রকাশ করা হয়নি")+' · রসিদ: '+esc(m.receipt_no||"—")+'</p>'+(canWrite()&&m.payment_status!=="verified"?'<button class="btn btn-outline" data-verify-donation="'+r.id+'">অনুদান যাচাই করুন</button>':"")+'</article>'}).join("")||'<div class="empty-state">এখনো কোনো অনুদান নথিভুক্ত হয়নি।</div>';
 list.querySelectorAll("[data-verify-donation]").forEach(b=>b.onclick=()=>verifyDonation(b.dataset.verifyDonation));
}
async function verifyDonation(id){
 const r=entries.find(x=>x.id===id);if(!r||!canWrite())return;
 const {error}=await client.from("module_records").update({data:{...(r.data||{}),metadata:{...rowMeta(r),payment_status:"verified",verified_at:new Date().toISOString(),verified_by:user.id}}}).eq("id",id);
 setMessage("donationMessage",error?"যাচাই করা যায়নি: "+error.message:"অনুদান যাচাইকৃত হিসেবে সংরক্ষিত হয়েছে।");
 if(!error)await loadEntries();
}
$("donationForm").addEventListener("submit",async e=>{
 e.preventDefault();if(!client||!canWrite())return;
 const amount=Number($("donationAmount").value);if(!Number.isFinite(amount)||amount<=0){setMessage("donationMessage","সঠিক অনুদানের পরিমাণ লিখুন।");return}
 const meta={donor_name:$("donorName").value.trim(),amount,source:$("donationSource").value.trim()||"নগদ",received_on:$("donationDate").value,receipt_no:$("receiptNo").value.trim(),payment_status:$("paymentStatus").value,note:$("donationNote").value.trim()};
 const payload={module_key:"m13",institution:"mosque",title:"অনুদান — ৳"+amount.toLocaleString("en-US"),data:{body:meta.note,metadata:meta,public_display:false},status:"pending",created_by:user.id};
 const {error}=await client.from("module_records").insert(payload);
 setMessage("donationMessage",error?"অনুদান নথিভুক্ত হয়নি: "+error.message:"অনুদান নথিভুক্ত হয়েছে।");
 if(!error){$("donationForm").reset();$("donationDate").value=new Date().toISOString().slice(0,10);await loadEntries()}
});
function renderGallery(){
 const list=$("galleryList");if(!list)return;
 const rows=entries.filter(r=>r.module_key==="m14");
 list.innerHTML=rows.map(r=>{const m=rowMeta(r);return renderRecord(r,m.url?'<p><a href="'+esc(m.url)+'" target="_blank" rel="noopener">আপলোড করা মিডিয়া দেখুন</a></p>':"")}).join("")||'<div class="empty-state">এখনো কোনো ছবি বা ভিডিও আপলোড হয়নি।</div>';
 list.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>editEntry(b.dataset.edit));
 list.querySelectorAll("[data-state]").forEach(b=>b.onclick=()=>changeStatus(b.dataset.id,b.dataset.state));
}
$("galleryForm").addEventListener("submit",async e=>{
 e.preventDefault();if(!client||!canWrite())return;
 const file=$("mediaFile").files[0],title=$("mediaTitle").value.trim(),caption=$("mediaCaption").value.trim();
 if(!file){setMessage("galleryMessage","একটি ছবি বা ভিডিও নির্বাচন করুন।");return}
 if(file.size>10*1024*1024){setMessage("galleryMessage","ফাইল সর্বোচ্চ ১০ MB হতে পারবে।");return}
 if(!(file.type.startsWith("image/")||["video/mp4","video/webm"].includes(file.type))){setMessage("galleryMessage","শুধু ছবি, MP4 বা WebM ভিডিও আপলোড করা যাবে।");return}
 const safeName=file.name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]/g,"_").slice(-100)||"media";
 const path="mosque/"+user.id+"/"+crypto.randomUUID()+"-"+safeName;
 setMessage("galleryMessage","ফাইল আপলোড হচ্ছে…");
 const {error:uploadError}=await client.storage.from("mosque-media").upload(path,file,{contentType:file.type,upsert:false});
 if(uploadError){setMessage("galleryMessage","আপলোড হয়নি: "+uploadError.message+"। Supabase Storage migration চালানো হয়েছে কি না যাচাই করুন।");return}
 const {data:{publicUrl}}=client.storage.from("mosque-media").getPublicUrl(path);
 const mediaType=file.type.startsWith("video/")?"video":"image";
 const payload={module_key:"m14",institution:"mosque",title,data:{body:caption,metadata:{url:publicUrl,storage_path:path,media_type:mediaType,file_name:file.name},public_display:false},status:"pending",created_by:user.id};
 const {error:recordError}=await client.from("module_records").insert(payload);
 if(recordError){await client.storage.from("mosque-media").remove([path]);setMessage("ফাইল উঠেছে, কিন্তু গ্যালারি নথি তৈরি হয়নি: "+recordError.message);return}
 setMessage("ফাইল আপলোড ও গ্যালারি নথিভুক্ত হয়েছে। প্রকাশের আগে সুপার অ্যাডমিনের অনুমোদন প্রয়োজন।");
 $("galleryForm").reset();await loadEntries();
});
$("loginForm").addEventListener("submit",async e=>{e.preventDefault();if(!client){setMessage("loginMessage","Supabase সংযোগ কনফিগার করা নেই।");return}const {error}=await client.auth.signInWithPassword({email:$("email").value.trim(),password:$("password").value});if(error){setMessage("loginMessage","লগইন ব্যর্থ: "+error.message);return}await checkSession()});
$("logoutBtn").onclick=async()=>{await client.auth.signOut();location.reload()};
$("cancelEditBtn").onclick=reset;
body.addEventListener("input",()=>{if(countWords(body.value)>500){body.value=clampWords(body.value);setMessage("saveMessage","সর্বোচ্চ ৫০০ শব্দ রাখা হয়েছে।")}$("wordCount").textContent=countWords(body.value)+" / ৫০০ শব্দ"});
body.addEventListener("paste",e=>{const t=(e.clipboardData||window.clipboardData).getData("text");if(countWords(body.value+" "+t)>500){e.preventDefault();setMessage("saveMessage","পেস্ট করা লেখাসহ মোট শব্দ ৫০০-এর বেশি হতে পারবে না।")}});
$("donationDate").value=new Date().toISOString().slice(0,10);
if(client)checkSession();else setMessage("loginMessage","Supabase Project URL ও Publishable key যুক্ত না হওয়া পর্যন্ত লগইন চালু হবে না।");
