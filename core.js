const s1=document.createElement('script');s1.src='https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js';document.head.appendChild(s1);
const s2=document.createElement('script');s2.src='https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js';document.head.appendChild(s2);
const s3=document.createElement('script');s3.src='https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js';document.head.appendChild(s3);
window.addEventListener('load',()=>{setTimeout(init,100)});

let auth,db,fc;
function init(){
    if(typeof firebase==='undefined'){setTimeout(init,100);return}
    fc={apiKey:"AIzaSyBjyRehaNQqt5ogt5U3tiw8NYr4TyuX2iI",authDomain:"chapshop-delivery-88fe1.firebaseapp.com",projectId:"chapshop-delivery-88fe1",storageBucket:"chapshop-delivery-88fe1.firebasestorage.app",messagingSenderId:"540757404981",appId:"1:540757404981:web:f5ae5d041dd260304eb07c"};
    firebase.initializeApp(fc);auth=firebase.auth();db=firebase.firestore();
    try{db.enablePersistence({synchronizeTabs:true})}catch(e){}
    auth.onAuthStateChanged(async u=>{
        if(u){
            const d=await db.collection('users').doc(u.uid).get();
            if(d.exists&&d.data().active){
                if(d.data().role==='merchant'&&d.data().approved===false){auth.signOut();showT("Pending Admin approval.","error");return}
                window.currentUser={uid:u.uid,...d.data()};showApp();
            }else{auth.signOut();showT("Account disabled.","error")}
        }else{window.currentUser=null;showLogin()}
    });
}

// 🌟 NEW: Image Compressor (Reduces 5MB photo to 50KB data text)
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

function showLogin(){document.getElementById('login-screen').style.display='flex';document.getElementById('app-screen').style.display='none'}
function showApp(){document.getElementById('login-screen').style.display='none';document.getElementById('app-screen').style.display='flex';if(typeof onAppLoaded==='function')onAppLoaded()}

function handleLogin(e){
    e.preventDefault();const b=e.target.querySelector('button[type="submit"]');const t=b.innerHTML;
    b.innerHTML='<span class="iconify animate-spin" data-icon="mdi:loading"></span> Logging in...';b.disabled=true;
    auth.signInWithEmailAndPassword(e.target.email.value,e.target.password.value).catch(er=>{showT(er.message,"error");b.innerHTML=t;b.disabled=false});
}
function handleLogout(){auth.signOut()}

function showT(m,t="success"){
    const toast=document.getElementById('toast'),icon=document.getElementById('toast-icon'),msg=document.getElementById('toast-msg');
    msg.textContent=m;icon.setAttribute('data-icon',t==='error'?'mdi:alert-circle':'mdi:check-circle');
    icon.className=`iconify text-xl ${t==='error'?'text-red-400':'text-cyan-400'}`;
    toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),3000);
}

function formatDate(ts){if(!ts)return'N/A';return ts.toDate().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}

function getStatusBadge(s){
    const c={'pending':'bg-yellow-500/20 text-yellow-400 border-yellow-500/30','accepted':'bg-blue-500/20 text-blue-400 border-blue-500/30','rejected':'bg-red-500/20 text-red-400 border-red-500/30','confirmed':'bg-cyan-500/20 text-cyan-400 border-cyan-500/30','no_answer':'bg-orange-500/20 text-orange-400 border-orange-500/30','wrong_number':'bg-pink-500/20 text-pink-400 border-pink-500/30','callback_requested':'bg-indigo-500/20 text-indigo-400 border-indigo-500/30','cancelled':'bg-red-500/20 text-red-400 border-red-500/30','out_for_delivery':'bg-violet-500/20 text-violet-400 border-violet-500/30','delivered':'bg-green-500/20 text-green-400 border-green-500/30','returned':'bg-slate-500/20 text-slate-400 border-slate-500/30','out_of_region':'bg-gray-500/20 text-gray-400 border-gray-500/30'};
    return `<span class="px-2.5 py-1 rounded-full text-xs font-semibold border ${c[s]||'bg-slate-500/20 text-slate-400 border-slate-500/30'}">${s.replace(/_/g,' ').toUpperCase()}</span>`;
}

async function createStaffUser(email,password){
    const r=await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${fc.apiKey}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password,returnSecureToken:true})});
    const d=await r.json();if(d.error)throw new Error(d.error.message);return d.localId;
}
