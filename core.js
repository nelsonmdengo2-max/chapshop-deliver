/* =====================================================================
   ChapShop CORE v2 — shared by every portal page.
   Drop-in replacement. No page changes required.

   Fixed vs v1:
   1. Firebase starts as soon as page code is ready — no more waiting
      for every font/image to download + 100ms (dead Sign In button).
   2. formatDate() is crash-proof (old one crashed on text dates).
   3. Login problems show a clear message instead of freezing.

   Page lifecycle — pages should define these instead of their own
   auth listeners:
     function onAppLoaded()   { ... }  // signed in: start loading data
     function onAppUnloaded() { ... }  // signed out: stop listeners (optional)
   ===================================================================== */
const s1=document.createElement('script');s1.src='https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js';document.head.appendChild(s1);
const s2=document.createElement('script');s2.src='https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js';document.head.appendChild(s2);
const s3=document.createElement('script');s3.src='https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js';document.head.appendChild(s3);

let auth,db,fc,coreTries=0;

function init(){
    if(typeof firebase==='undefined'||!firebase.firestore||!firebase.auth){
        if(++coreTries>400){console.error('Firebase never loaded — check internet.');try{showT("Cannot reach the server. Refresh the page.","error")}catch(e){}return}
        setTimeout(init,25);return;
    }
    fc={apiKey:"AIzaSyBjyRehaNQqt5ogt5U3tiw8NYr4TyuX2iI",authDomain:"chapshop-delivery-88fe1.firebaseapp.com",projectId:"chapshop-delivery-88fe1",storageBucket:"chapshop-delivery-88fe1.firebasestorage.app",messagingSenderId:"540757404981",appId:"1:540757404981:web:f5ae5d041dd260304eb07c"};
    firebase.initializeApp(fc);auth=firebase.auth();db=firebase.firestore();
    try{db.enablePersistence({synchronizeTabs:true}).catch(e=>console.warn('offline cache:',e&&e.code))}catch(e){}

    auth.onAuthStateChanged(async u=>{
        if(u){
            let d;
            try{d=await db.collection('users').doc(u.uid).get()}
            catch(e){console.error(e);showT("Could not verify your account — check internet.","error");return}
            if(d.exists&&d.data().active){
                if(d.data().role==='merchant'&&d.data().approved===false){auth.signOut();showT("Pending Admin approval.","error");return}
                window.currentUser={uid:u.uid,...d.data()};showApp();
            }else{auth.signOut();showT("Account disabled.","error")}
        }else{
            window.currentUser=null;
            if(typeof onAppUnloaded==='function'){try{onAppUnloaded()}catch(e){console.error(e)}}
            showLogin();
        }
    });
}
// Start as soon as the page's own code is in place — no waiting for images/fonts.
if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init)}else{init()}

/* ---------- image compressor (unchanged) ---------- */
function compressImage(file, maxW = 800, quality = 0.5) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let w = img.width, h = img.height;
                if (w > h) { if (w > maxW) { h *= maxW / w; w = maxW; } }
                else { if (h > maxW) { w *= maxW / h; h = maxW; } }
                canvas.width = w; canvas.height = h;
                canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/* ---------- screens & lifecycle ---------- */
function showLogin(){document.getElementById('login-screen').style.display='flex';document.getElementById('app-screen').style.display='none'}
function showApp(){
    document.getElementById('login-screen').style.display='none';
    document.getElementById('app-screen').style.display='flex';
    if(typeof onAppLoaded==='function'){
        if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',()=>{try{onAppLoaded()}catch(e){console.error(e)}})}
        else{try{onAppLoaded()}catch(e){console.error(e)}}
    }
}

/* ---------- login / logout ---------- */
function handleLogin(e){
    e.preventDefault();
    if(!auth){showT("Still connecting — try again in a second.","error");return}
    const b=e.target.querySelector('button[type="submit"]');const t=b.innerHTML;
    b.innerHTML='<span class="iconify animate-spin" data-icon="mdi:loading"></span> Logging in...';b.disabled=true;
    auth.signInWithEmailAndPassword(e.target.email.value,e.target.password.value).catch(er=>{showT(er.message,"error");b.innerHTML=t;b.disabled=false});
}
function handleLogout(){if(auth)auth.signOut()}

/* ---------- toast ---------- */
function showT(m,t="success"){
    const toast=document.getElementById('toast');if(!toast)return;
    const icon=document.getElementById('toast-icon'),msg=document.getElementById('toast-msg');
    msg.textContent=m;icon.setAttribute('data-icon',t==='error'?'mdi:alert-circle':'mdi:check-circle');
    icon.className=`iconify text-xl ${t==='error'?'text-red-400':'text-cyan-400'}`;
    toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),3000);
}

/* ---------- CRASH-PROOF date formatting ----------
   Handles Firestore Timestamps, {seconds}, Date objects, text strings,
   numbers, and broken values — never throws. */
function formatDate(ts){
    if(!ts)return'N/A';
    try{
        let d=null;
        if(typeof ts.toDate==='function')d=ts.toDate();
        else if(typeof ts.seconds==='number')d=new Date(ts.seconds*1000);
        else if(ts instanceof Date)d=ts;
        else{const t=new Date(ts).getTime();if(!isNaN(t))d=new Date(t)}
        if(!d||isNaN(d.getTime()))return'N/A';
        return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
    }catch(e){return'N/A'}
}

/* ---------- status badge (unchanged) ---------- */
function getStatusBadge(s){
    const c={'pending':'bg-yellow-500/20 text-yellow-400 border-yellow-500/30','accepted':'bg-blue-500/20 text-blue-400 border-blue-500/30','rejected':'bg-red-500/20 text-red-400 border-red-500/30','confirmed':'bg-cyan-500/20 text-cyan-400 border-cyan-500/30','no_answer':'bg-orange-500/20 text-orange-400 border-orange-500/30','wrong_number':'bg-pink-500/20 text-pink-400 border-pink-500/30','callback_requested':'bg-indigo-500/20 text-indigo-400 border-indigo-500/30','cancelled':'bg-red-500/20 text-red-400 border-red-500/30','out_for_delivery':'bg-violet-500/20 text-violet-400 border-violet-500/30','delivered':'bg-green-500/20 text-green-400 border-green-500/30','returned':'bg-slate-500/20 text-slate-400 border-slate-500/30','out_of_region':'bg-gray-500/20 text-gray-400 border-gray-500/30'};
    return `<span class="px-2.5 py-1 rounded-full text-xs font-semibold border ${c[s]||'bg-slate-500/20 text-slate-400 border-slate-500/30'}">${s.replace(/_/g,' ').toUpperCase()}</span>`;
}

/* ---------- staff account creation (unchanged) ---------- */
async function createStaffUser(email,password){
    const r=await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${fc.apiKey}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password,returnSecureToken:true})});
    const d=await r.json();if(d.error)throw new Error(d.error.message);return d.localId;
}
