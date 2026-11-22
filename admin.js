const modules=[["m01","home","হোমপেজ"],["m02","mosjid-porichiti","মসজিদের পরিচিতি"],["m03","itihas","মসজিদের নামকরণ ও ইতিহাস"],["m04","motawalli","মোতাওয়াল্লীর বাণী"],["m05","committee","পরিচালনা কমিটি"],["m06","prayer","পাঁচ ওয়াক্ত নামাজের সময়সূচি"],["m07","special-prayer","জুমা, রমজান ও ঈদের সময়সূচি"],["m08","notices","নোটিশ ও ঘোষণা"],["m09","news","সংবাদ ও কার্যক্রম"],["m10","islamic-learning","কোরআন ও ইসলামিক শিক্ষা"],["m11","imam","ইমাম ও খতিব পরিচিতি"],["m12","services","ধর্মীয় ও সামাজিক সেবা"],["m13","donations","অনুদান ও সহযোগিতা"],["m14","gallery","ছবি ও ভিডিও গ্যালারি"],["m15","contact","যোগাযোগ ও অবস্থান"]];
const client=window.supabase&&window.MOSQUE_SUPABASE_URL&&window.MOSQUE_SUPABASE_ANON_KEY?window.supabase.createClient(window.MOSQUE_SUPABASE_URL,window.MOSQUE_SUPABASE_ANON_KEY):null;
const $=id=>document.getElementById(id),form=$("entryForm"),body=$("body");
const moduleBySlug=Object.fromEntries(modules.map(m=>[m[1],m]));
const roleNames={owner:"প্রধান প্রশাসক",admin:"অ্যাডমিন",editor:"সম্পাদক",reviewer:"অনুমোদনকারী"};
let profile=null,user=null,entries=[],donations=[];
const countWords=s=>(s.trim().match(/\S+/g)||[]).length;
const clampWords=s=>{let n=0;return(s.match(/\S+|\s+/g)||[]).filter(p=>{if(!/\S/.test(p))return true;if(n>=500)return false;n++;return true}).join("")};
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const label=s=>({draft:"খসড়া",pending:"অনুমোদনের অপেক্ষায়",approved:"অনুমোদিত",published:"প্রকাশিত",rejected:"বাতিল"}[s]||s);
const canWrite=()=>["owner","admin","editor"].includes(profile?.role);
const canReview=()=>["owner","admin","reviewer"].includes(profile?.role);
const isOwner=()=>profile?.role==="owner";
const isAdmin=()=>["owner","admin"].includes(profile?.role);
const setMessage=(id,message)=>{if($(id))$(id).textContent=message};
function reset(){form.reset();$("editId").value="";$("entryFormTitle").textContent="নতুন তথ্য যোগ করুন";$("saveEntryBtn").textContent="তথ্য সংরক্ষণ করুন";$("cancelEditBtn").classList.add("hidden");$("wordCount").textContent="০ / ৫০০ শব্দ"}
function statusOptions(){const allowed=isAdmin()?[["draft","খসড়া"],["pending","অনুমোদনের অপেক্ষায়"],["approved","অনুমোদিত"],["rejected","বাতিল"],["published","প্রকাশিত"]]:[["draft","খসড়া"],["pending","অনুমোদনের অপেক্ষায়"]];$("status").innerHTML=allowed.map(x=>'<option value="'+x[0]+'">'+x[1]+"</option>").join("")}
const rowMeta=r=>r.metadata||{};
function renderEntryActions(r){
 const actions=[];
 if(canWrite()&&(isAdmin()||r.created_by===user.id)&&(isAdmin()||["draft","pending","rejected"].includes(r.status)))actions.push('<button class="btn btn-outline" data-edit="'+r.id+'">সম্পাদনা</button>');
 if(canReview()&&r.status!=="approved")actions.push('<button class="btn btn-outline" data-state="approved" data-id="'+r.id+'">অনুমোদন</button>');
 if(canReview()&&r.status!=="rejected")actions.push('<button class="btn btn-outline" data-state="rejected" data-id="'+r.id+'">বাতিল</button>');
 if(isAdmin()&&r.status!=="published")actions.push('<button class="btn btn-outline" data-state="published" data-id="'+r.id+'">প্রকাশ</button>');
 return actions.join(" ");
}
function renderRecord(r,extra=""){
 return '<article class="notice-card"><strong>'+esc(r.title)+'</strong><p>'+esc(moduleBySlug[r.module]?.[2]||r.module)+' · '+label(r.status)+'</p>'+extra+'<div class="admin-toolbar">'+renderEntryActions(r)+'</div></article>';
}
async function checkSession(){
 if(!client)return;
 const {data:sessionData,error:sessionError}=await client.auth.getSession();
 if(sessionError){setMessage("loginMessage","সেশন যাচাই ব্যর্থ: "+sessionError.message);return}
 const session=sessionData?.session;if(!session)return;
 user=session.user;
 const {data,error}=await client.from("admin_profiles").select("user_id,display_name,role").eq("user_id",user.id).maybeSingle();
 if(error){setMessage("loginMessage","প্রশাসনিক Profile যাচাই ব্যর্থ: "+error.message+" (code: "+(error.code||"unknown")+")");return}
 if(!data){setMessage("loginMessage","এই অ্যাকাউন্টের প্রশাসনিক Profile পাওয়া যায়নি। Supabase-এর admin_profiles টেবিলে এই Auth User ID-এর Profile যোগ করতে হবে: "+user.id);return}
 profile=data;
 if(!["owner","admin","editor","reviewer"].includes(profile.role)){await client.auth.signOut();setMessage("loginMessage","এই ভূমিকার অ্যাডমিন প্যানেলে প্রবেশের অনুমতি নেই।");return}
 $("loginBox").classList.add("hidden");$("dashboard").classList.remove("hidden");
 $("adminIdentity").textContent=(profile.display_name||user.email)+" · "+(roleNames[profile.role]||profile.role);
 $("module").innerHTML=modules.map(m=>'<option value="'+m[1]+'">'+m[2]+"</option>").join("");
 statusOptions();
 if(!canWrite())form.classList.add("hidden");
 if(canWrite()){$("donationManager").classList.remove("hidden");$("galleryManager").classList.remove("hidden")}else{$("donationManager").classList.add("hidden");$("galleryManager").classList.add("hidden")}
 await loadEntries();if(canWrite())await loadDonations();
}
function bindEntryActions(container){
 container.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>editEntry(b.dataset.edit));
 container.querySelectorAll("[data-state]").forEach(b=>b.onclick=()=>changeStatus(b.dataset.id,b.dataset.state));
}
async function loadEntries(){
 const {data,error}=await client.from("mosque_entries").select("id,module,title,body,metadata,status,created_by,reviewed_by,published_at,created_at,updated_at").order("created_at",{ascending:false}).limit(200);
 if(error){$("entries").textContent="তথ্য লোড হয়নি: "+error.message;return}
 entries=data||[];$("entries").innerHTML=entries.map(r=>renderRecord(r)).join("")||"এখনো কোনো তথ্য নেই।";bindEntryActions($("entries"));renderGallery();
}
function editEntry(id){
 const r=entries.find(x=>x.id===id);if(!r||(!isAdmin()&&r.created_by!==user.id))return;
 $("editId").value=r.id;$("module").value=r.module;$("title").value=r.title;$("body").value=r.body||"";$("metadata").value=JSON.stringify(rowMeta(r),null,2);$("status").value=r.status;
 $("entryFormTitle").textContent="তথ্য সম্পাদনা করুন";$("saveEntryBtn").textContent="পরিবর্তন সংরক্ষণ করুন";$("cancelEditBtn").classList.remove("hidden");$("wordCount").textContent=countWords(body.value)+" / ৫০০ শব্দ";form.scrollIntoView({behavior:"smooth",block:"start"});
}
async function changeStatus(id,status){
 const r=entries.find(x=>x.id===id);if(!r)return;
 if(status==="published"&&!isAdmin())return;
 if(["approved","rejected"].includes(status)&&!canReview())return;
 const {error}=await client.from("mosque_entries").update({status}).eq("id",id);
 setMessage("saveMessage",error?"অবস্থা পরিবর্তন হয়নি: "+error.message:"অবস্থা পরিবর্তন হয়েছে।");if(!error)await loadEntries();
}
form.addEventListener("submit",async e=>{
 e.preventDefault();if(!client||!canWrite())return;
 if(countWords(body.value)>500){setMessage("saveMessage","বিবরণ সর্বোচ্চ ৫০০ শব্দ হতে পারবে।");return}
 let metadata={};try{metadata=$("metadata").value.trim()?JSON.parse($("metadata").value):{};if(!metadata||Array.isArray(metadata)||typeof metadata!=="object")throw new Error("JSON অবজেক্ট হতে হবে।")}catch(err){setMessage("saveMessage","JSON সঠিক নয়: "+err.message);return}
 const module=$("module").value;if(!moduleBySlug[module]){setMessage("saveMessage","সঠিক মডিউল নির্বাচন করুন।");return}
 const payload={module,title:$("title").value.trim(),body:body.value.trim(),metadata,status:$("status").value};
 const result=$("editId").value?await client.from("mosque_entries").update(payload).eq("id",$("editId").value):await client.from("mosque_entries").insert({...payload,created_by:user.id});
 setMessage("saveMessage",result.error?"সংরক্ষণ হয়নি: "+result.error.message:"তথ্য সংরক্ষিত হয়েছে।");
 if(!result.error){reset();await loadEntries()}
});
async function loadDonations(){
 const list=$("donationList");if(!list)return;
 const {data,error}=await client.from("donation_records").select("id,donor_name,amount,currency,source,received_on,receipt_no,payment_status,note,created_by,created_at").order("received_on",{ascending:false}).limit(200);
 if(error){list.textContent="অনুদানের হিসাব লোড হয়নি: "+error.message;return}

 donations=data||[];
 const verified=donations.filter(r=>r.payment_status==="verified").reduce((s,r)=>s+Number(r.amount||0),0);
 const pending=donations.filter(r=>r.payment_status==="pending").reduce((s,r)=>s+Number(r.amount||0),0);
 const rejected=donations.filter(r=>r.payment_status==="rejected").reduce((s,r)=>s+Number(r.amount||0),0);
 const summary=$("donationSummary");
 if(summary)summary.innerHTML='<div class="donation-stats"><div><small>তালিকাভুক্ত যাচাইকৃত</small><strong>৳'+verified.toLocaleString("bn-BD")+'</strong></div><div><small>তালিকাভুক্ত যাচাই বাকি</small><strong>৳'+pending.toLocaleString("bn-BD")+'</strong></div><div><small>তালিকাভুক্ত বাতিল</small><strong>৳'+rejected.toLocaleString("bn-BD")+'</strong></div></div>';
 list.innerHTML=donations.map(r=>'<article class="notice-card"><strong>৳'+Number(r.amount||0).toLocaleString("bn-BD",{minimumFractionDigits:2})+'</strong><p>দাতা: '+esc(r.donor_name||"নাম প্রকাশ করা হয়নি")+' · '+esc(r.received_on||"")+' · '+labelDonation(r.payment_status)+'</p><p>উৎস: '+esc(r.source||"")+' · রসিদ: '+esc(r.receipt_no||"—")+'</p>'+(canWrite()&&r.payment_status!=="verified"?'<button class="btn btn-outline" data-donation-status="verified" data-id="'+r.id+'">যাচাই করুন</button>':"")+(canWrite()&&r.payment_status!=="rejected"?'<button class="btn btn-outline" data-donation-status="rejected" data-id="'+r.id+'">বাতিল করুন</button>':"")+'</article>').join("")||'<div class="empty-state">এখনো কোনো অনুদান নথিভুক্ত হয়নি।</div>';
 list.querySelectorAll("[data-donation-status]").forEach(b=>b.onclick=()=>setDonationStatus(b.dataset.id,b.dataset.donationStatus));
}
const labelDonation=s=>({pending:"যাচাই বাকি",verified:"যাচাইকৃত",rejected:"বাতিল"}[s]||s);
async function setDonationStatus(id,status){
 const r=donations.find(x=>x.id===id);if(!r||!canWrite()||!["verified","rejected"].includes(status))return;
 const {error}=await client.from("donation_records").update({payment_status:status}).eq("id",id);
 setMessage("donationMessage",error?"অনুদানের অবস্থা পরিবর্তন হয়নি: "+error.message:(status==="verified"?"অনুদান যাচাইকৃত হিসেবে সংরক্ষিত হয়েছে।":"অনুদান বাতিল হিসেবে সংরক্ষিত হয়েছে।"));if(!error)await loadDonations();
}
$("donationForm").addEventListener("submit",async e=>{
 e.preventDefault();if(!client||!canWrite())return;
 const amount=Number($("donationAmount").value);if(!Number.isFinite(amount)||amount<=0){setMessage("donationMessage","সঠিক অনুদানের পরিমাণ লিখুন।");return}
 const payload={donor_name:$("donorName").value.trim()||null,amount,currency:"BDT",source:$("donationSource").value.trim()||"নগদ",received_on:$("donationDate").value,receipt_no:$("receiptNo").value.trim()||null,payment_status:$("paymentStatus").value,note:$("donationNote").value.trim()||null,created_by:user.id};
 const {error}=await client.from("donation_records").insert(payload);
 setMessage("donationMessage",error?"অনুদান নথিভুক্ত হয়নি: "+error.message:"অনুদান নথিভুক্ত হয়েছে।");if(!error){$("donationForm").reset();$("donationDate").value=new Date().toISOString().slice(0,10);await loadDonations()}
});
function renderGallery(){
 const list=$("galleryList");if(!list)return;
 const rows=entries.filter(r=>r.module==="gallery");
 list.innerHTML=rows.map(r=>renderRecord(r,r.metadata?.url?'<p><a href="'+esc(r.metadata.url)+'" target="_blank" rel="noopener">আপলোড করা মিডিয়া দেখুন</a></p>':"")).join("")||'<div class="empty-state">এখনো কোনো ছবি বা ভিডিও আপলোড হয়নি।</div>';bindEntryActions(list);
}
$("galleryForm").addEventListener("submit",async e=>{
 e.preventDefault();if(!client||!canWrite())return;
 const file=$("mediaFile").files[0],title=$("mediaTitle").value.trim(),caption=$("mediaCaption").value.trim();
 if(!file){setMessage("galleryMessage","একটি ছবি বা ভিডিও নির্বাচন করুন।");return}
 if(file.size>10*1024*1024){setMessage("galleryMessage","ফাইল সর্বোচ্চ ১০ MB হতে পারবে।");return}
 if(!(file.type.startsWith("image/")||["video/mp4","video/webm"].includes(file.type))){setMessage("galleryMessage","শুধু ছবি, MP4 বা WebM ভিডিও আপলোড করা যাবে।");return}
 const safeName=file.name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]/g,"_").slice(-100)||"media",path="mosque/"+user.id+"/"+crypto.randomUUID()+"-"+safeName;
 setMessage("galleryMessage","ফাইল আপলোড হচ্ছে…");
 const {error:uploadError}=await client.storage.from("mosque-media").upload(path,file,{contentType:file.type,upsert:false});
 if(uploadError){setMessage("galleryMessage","আপলোড হয়নি: "+uploadError.message+"। Storage policy যাচাই করুন।");return}
 const {data:{publicUrl}}=client.storage.from("mosque-media").getPublicUrl(path);
 const {error:recordError}=await client.from("mosque_entries").insert({module:"gallery",title,body:caption,metadata:{url:publicUrl,storage_path:path,media_type:file.type.startsWith("video/")?"video":"image",file_name:file.name},status:"pending",created_by:user.id});
 if(recordError){await client.storage.from("mosque-media").remove([path]);setMessage("ফাইল উঠেছে, কিন্তু গ্যালারি নথি তৈরি হয়নি: "+recordError.message);return}
 setMessage("ফাইল আপলোড ও গ্যালারি নথিভুক্ত হয়েছে। প্রকাশের আগে অনুমোদন প্রয়োজন।");$("galleryForm").reset();await loadEntries();
});
$("loginForm").addEventListener("submit",async e=>{e.preventDefault();if(!client){setMessage("loginMessage","Supabase সংযোগ কনফিগার করা নেই।");return}const {error}=await client.auth.signInWithPassword({email:$("email").value.trim(),password:$("password").value});if(error){setMessage("loginMessage","লগইন ব্যর্থ: "+error.message);return}await checkSession()});
$("logoutBtn").onclick=async()=>{await client.auth.signOut();location.reload()};
$("cancelEditBtn").onclick=reset;
body.addEventListener("input",()=>{if(countWords(body.value)>500){body.value=clampWords(body.value);setMessage("saveMessage","সর্বোচ্চ ৫০০ শব্দ রাখা হয়েছে।")}$("wordCount").textContent=countWords(body.value)+" / ৫০০ শব্দ"});
body.addEventListener("paste",e=>{const t=(e.clipboardData||window.clipboardData).getData("text");if(countWords(body.value+" "+t)>500){e.preventDefault();setMessage("saveMessage","পেস্ট করা লেখাসহ মোট শব্দ ৫০০-এর বেশি হতে পারবে না।")}});
$("donationDate").value=new Date().toISOString().slice(0,10);
client.auth.onAuthStateChange((event)=>{
 if(event==="PASSWORD_RECOVERY"){
  $("loginBox").classList.add("hidden");
  $("recoveryBox").classList.remove("hidden");
 }
});
$("recoveryForm")?.addEventListener("submit",async e=>{
 e.preventDefault();
 const password=$("newPassword").value,confirm=$("confirmPassword").value;
 if(password.length<8){setMessage("recoveryMessage","পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।");return}
 if(password!==confirm){setMessage("recoveryMessage","দুটি পাসওয়ার্ড মিলছে না।");return}
 const {error}=await client.auth.updateUser({password});
 if(error){setMessage("recoveryMessage","পাসওয়ার্ড পরিবর্তন হয়নি: "+error.message);return}
 setMessage("recoveryMessage","পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে। এখন লগইন করুন।");
 await client.auth.signOut();
 $("recoveryForm").reset();
 $("recoveryBox").classList.add("hidden");
 $("loginBox").classList.remove("hidden");
});
$("forgotPasswordBtn")?.addEventListener("click",async()=>{
 const email=$("email").value.trim();
 if(!email){setMessage("loginMessage","পাসওয়ার্ড রিসেট লিংক পাঠাতে আগে ইমেইল লিখুন।");$("email").focus();return}
 if(!client){setMessage("loginMessage","Supabase সংযোগ কনফিগার করা নেই।");return}
 const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});
 setMessage("loginMessage",error?"রিসেট ইমেইল পাঠানো যায়নি: "+error.message:"ইমেইলটি Supabase-এ থাকলে পাসওয়ার্ড রিসেটের নির্দেশনা পাঠানো হয়েছে। Inbox ও Spam দেখুন।");
});
if(client)checkSession();else setMessage("loginMessage","Supabase Project URL ও Publishable key যুক্ত না হওয়া পর্যন্ত লগইন চালু হবে না।");
