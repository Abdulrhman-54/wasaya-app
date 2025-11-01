/*
  File: /js/app.js
  Title: Wasaya — App Logic (OTP محلي + الوضع الافتراضي فاتح + تفعيل الشعارات في "المزيد")
*/
(() => {
  const $ = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);

  // ===== اجعل الوضع الافتراضي "فاتح" قبل أي شيء (حتى قبل تسجيل الدخول) =====
  if (!localStorage.getItem('wasaya:lastUser')) {
    document.body.classList.add('theme-light');
    document.body.classList.remove('theme-dark');
  }

  // ==== حساب المستخدم برقم الجوال ====
  let currentUser = localStorage.getItem('wasaya:lastUser') || '';
  const key = k => `wasaya:${currentUser || 'guest'}:${k}`;

  // بيانات
  const state = { dom:[], dtm:[], wills:[], alerts:{wills:false,debts:false}, plan:null, theme:'light' };

  // إعدادات عامة من لوحة المسؤول
  const SITE_KEY='wasaya:site:config';
  const site = () => { try{return JSON.parse(localStorage.getItem(SITE_KEY)||'{}');}catch(e){return {}} };

  // أدوات
  const uid = () => Math.random().toString(36).slice(2);
  const fmt = n => new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(+n||0);
  const today = () => new Date().toISOString().slice(0,10);

  // تخزين
  const save = (what) => {
    if(!currentUser) return;
    if(!what || what==='dom') localStorage.setItem(key('dom'), JSON.stringify(state.dom));
    if(!what || what==='dtm') localStorage.setItem(key('dtm'), JSON.stringify(state.dtm));
    if(!what || what==='wills') localStorage.setItem(key('wills'), JSON.stringify(state.wills));
    if(!what || what==='alerts') localStorage.setItem(key('alerts'), JSON.stringify(state.alerts));
    if(!what || what==='plan') localStorage.setItem(key('plan'), JSON.stringify(state.plan));
    if(!what || what==='theme') localStorage.setItem(key('theme'), state.theme);
  };
  const load = () => {
    state.dom = JSON.parse(localStorage.getItem(key('dom'))||'[]');
    state.dtm = JSON.parse(localStorage.getItem(key('dtm'))||'[]');
    state.wills = JSON.parse(localStorage.getItem(key('wills'))||'[]');
    state.alerts = JSON.parse(localStorage.getItem(key('alerts'))||'{"wills":false,"debts":false}');
    state.plan = JSON.parse(localStorage.getItem(key('plan'))||'null');
    state.theme = localStorage.getItem(key('theme')) || state.theme || 'light';
  };

  // ===== تدفّق الدخول برقم الجوال + OTP تجريبي محلي =====
  function ensureLogin(){
    if(currentUser){ load(); initPage(); return; }

    const wrap = document.createElement('div');
    wrap.className = 'auth-overlay';
    wrap.innerHTML = `
      <div class="auth-card">
        <h3>تسجيل الدخول</h3>
        <p class="tiny muted">أدخل رقم جوالك ثم سنرسل لك رمز تحقق مكوّنًا من 6 أرقام.</p>

        <label>رقم الجوال</label>
        <input id="login-phone" type="tel" inputmode="numeric" placeholder="05xxxxxxxx" />

        <div class="row space" style="margin-top:10px">
          <button id="send-otp" class="btn primary">إرسال الرمز</button>
          <button id="cancel-auth" class="btn ghost">إلغاء</button>
        </div>

        <div id="otp-area" class="card" style="margin-top:10px; display:none">
          <label>أدخل الرمز</label>
          <input id="login-otp" type="tel" inputmode="numeric" placeholder="******" maxlength="6" />
          <div class="row space" style="margin-top:8px">
            <button id="verify-otp" class="btn">تحقق</button>
            <button id="resend-otp" class="btn ghost" disabled>إعادة الإرسال (<span id="otp-timer">60</span>s)</button>
          </div>
          <p id="otp-debug" class="tiny muted" style="margin-top:6px"></p>
        </div>
      </div>`;

    document.body.appendChild(wrap);

    let otp = null, exp = 0, t = null;

    function startTimer(){
      let left = 60;
      const lbl = $('#otp-timer');
      $('#resend-otp').disabled = true;
      t && clearInterval(t);
      t = setInterval(()=>{
        left--;
        if(lbl) lbl.textContent = String(left);
        if(left<=0){
          clearInterval(t);
          $('#resend-otp').disabled = false;
        }
      },1000);
    }

    function genSendOTP(){
      // رمز تجريبي محلي (بدون إرسال SMS)
      otp = (Math.floor(Math.random()*900000)+100000).toString();
      exp = Date.now() + 2*60*1000; // صالح لدقيقتين
      $('#otp-area').style.display = 'block';
      $('#otp-debug').textContent = `رمز تجريبي للاختبار: ${otp}`;
      startTimer();
    }

    $('#send-otp').onclick = ()=>{
      const p = ($('#login-phone').value||'').trim();
      if(!/^0\d{9}$/.test(p)){ alert('أدخل رقمًا صحيحًا: 05xxxxxxxx'); return; }
      genSendOTP();
    };

    $('#resend-otp').onclick = ()=>{
      genSendOTP();
    };

    $('#verify-otp').onclick = ()=>{
      const code = ($('#login-otp').value||'').trim();
      if(!code || code.length!==6) return alert('أدخل الرمز من 6 أرقام');
      if(Date.now()>exp) return alert('انتهت صلاحية الرمز، أعد الإرسال');
      if(code!==otp) return alert('الرمز غير صحيح');

      // نجاح التحقق
      const p = ($('#login-phone').value||'').trim();
      currentUser = p;
      localStorage.setItem('wasaya:lastUser', currentUser);
      load();
      document.body.removeChild(wrap);
      initPage();
    };

    $('#cancel-auth').onclick = ()=>{ document.body.removeChild(wrap); };
  }

  // ثيم
  function applyTheme(){
    document.body.classList.toggle('theme-light', state.theme==='light');
    document.body.classList.toggle('theme-dark', state.theme!=='light');
    if($('#themeToggle')) $('#themeToggle').textContent = (state.theme==='light' ? '🌞' : '🌙');
  }
  $('#themeToggle')?.addEventListener('click', ()=>{
    state.theme = (state.theme==='light' ? 'dark' : 'light');
    save('theme'); applyTheme();
  });

  // شارة الخطة
  function applyPlanBadge(){
    const badge = $('#planBadge');
    if(!badge) return;
    if(state.plan){ badge.textContent = `مفعل: ${state.plan.label}`; badge.classList.remove('hidden'); }
    else badge.classList.add('hidden');
  }

  // Upgrade → payment.html
  $('#upgradeBtn')?.addEventListener('click', ()=> location.href='./payment.html');

  // قائمة إضافة الدين (في الصفحة الرئيسية فقط)
  (function initHomeMenu(){
    const toggle = $('#debtToggle'), menu = $('#debtMenu');
    if(!toggle || !menu) return;
    toggle.addEventListener('click', (e)=>{ e.stopPropagation(); menu.classList.toggle('show'); });
    document.addEventListener('click', (e)=>{ if(!menu.contains(e.target) && !toggle.contains(e.target)) menu.classList.remove('show'); });
  })();

  // ملفات → Base64
  function filesToEntries(fileInput){
    const files = Array.from(fileInput?.files||[]);
    return Promise.all(files.map(f=> new Promise(res=>{
      const r = new FileReader(); r.onload = ()=> res({name:f.name, data:r.result}); r.readAsDataURL(f);
    })));
  }

  // وصايا
  function renderWills(){
    const mount = $('#wills-list'); if(!mount) return;
    mount.innerHTML = '';
    state.wills.slice().reverse().forEach(w=>{
      const card = document.createElement('div');
      card.className = 'card bankcard';
      card.innerHTML = `
        <div class="title">${w.title}</div>
        <div class="footer">
          <button class="link-like" data-act="show" data-id="${w.id}">شاهد الوصية</button>
          <button class="link-like" data-act="edit" data-id="${w.id}">تعديل</button>
        </div>`;
      mount.appendChild(card);
    });
  }
  const willDlg = $('#will-dialog');
  $('#form-will')?.addEventListener('submit', e=>{
    e.preventDefault();
    const title = $('#will-title').value.trim();
    const body = $('#will-body').value.trim();
    state.wills.push({id:uid(), title, body, date:today()});
    save('wills'); e.target.reset(); renderWills();
  });
  $('#wills-list')?.addEventListener('click', (e)=>{
    const b = e.target.closest('button'); if(!b) return;
    const it = state.wills.find(x=>x.id===b.dataset.id); if(!it) return;
    if(b.dataset.act==='show'){
      $('#dlg-will-title').textContent = it.title;
      $('#dlg-will-body').textContent = it.body;
      $('#dlg-edit-will').onclick = ()=>{ willDlg?.close(); editWill(it.id); };
      $('#dlg-del-will').onclick = ()=>{ if(confirm('حذف الوصية؟')){ state.wills = state.wills.filter(x=>x.id!==it.id); save('wills'); renderWills(); willDlg?.close(); } };
      willDlg?.showModal();
    }
    if(b.dataset.act==='edit'){ editWill(it.id); }
  });
  $('#dlg-close-will')?.addEventListener('click', ()=> willDlg?.close());
  function editWill(id){
    const it = state.wills.find(x=>x.id===id); if(!it) return;
    $('#will-title').value = it.title; $('#will-body').value = it.body;
    state.wills = state.wills.filter(x=>x.id!==id); save('wills'); renderWills();
    window.scrollTo({top:0, behavior:'smooth'});
  }

  // ديون
  function renderDebts(list, mountId, typeLabel){
    const mount = $(`#${mountId}`); if(!mount) return;
    mount.innerHTML = '';
    list.slice().reverse().forEach(item=>{
      const card = document.createElement('div');
      card.className = 'card bankcard';
      card.innerHTML = `
        <div class="title">${item.name}</div>
        <div class="sub">${item.phone || ''}</div>
        <div class="type">${typeLabel}</div>
        <div class="footer">
          <button class="link-like" data-act="view" data-id="${item.id}">شاهد الدين</button>
          <button class="link-like" data-act="edit" data-id="${item.id}">تعديل</button>
        </div>`;
      mount.appendChild(card);

      card.addEventListener('click', (e)=>{
        const btn = e.target.closest('button'); if(!btn) return;
        const it = list.find(x=>x.id===btn.dataset.id); if(!it) return;
        if(btn.dataset.act==='view') openDebtDialog(it, list, typeLabel);
        if(btn.dataset.act==='edit') editDebt(it, list);
      });
    });
  }
  function openDebtDialog(it, list, typeLabel){
    const dlg = $('#debt-dialog'); if(!dlg) return;
    const paid = (it.payments||[]).reduce((a,p)=> a + (+p.amount||0), 0);
    const remain = Math.max(0, (+it.amount||0) - paid);
    $('#dlg-debt-title').textContent = it.name;
    $('#dlg-debt-meta').textContent = `${it.phone || '—'} — ${typeLabel} — المبلغ: ${fmt(it.amount||0)} — المتبقي: ${fmt(remain)}`;
    $('#dlg-debt-body').innerHTML = `
      <div class="sadaad-list">${(it.payments||[]).map(p=>`
        <div class="sadaad-item"><div>${p.type==='installment'?'تقسيط':'جزئي'} — ${fmt(p.amount)}</div><div class="muted">${p.date}</div></div>
      `).join('')}</div>
      <div class="row space" style="margin-top:10px">
        <div class="row">
          <select id="dlg-kind"><option value="partial">تسديد جزئي</option><option value="installment">تقسيط</option></select>
          <input id="dlg-amt" type="number" min="0" step="0.01" placeholder="المبلغ" />
        </div>
        <button id="dlg-add" class="btn small">+ إضافة</button>
      </div>`;
    $('#dlg-close-debt').onclick = ()=> dlg.close();
    $('#dlg-edit-debt').onclick = ()=>{ dlg.close(); editDebt(it, list); };
    $('#dlg-del-debt').onclick = ()=>{ if(confirm('حذف هذا الدين؟')){ const idx = list.findIndex(x=>x.id===it.id); list.splice(idx,1); save(list===state.dom?'dom':'dtm'); rerenderDebts(); dlg.close(); } };
    $('#dlg-add').onclick = ()=>{
      const amt = +($('#dlg-amt').value||0); if(!amt) return alert('أدخل مبلغًا صحيحًا');
      const type = $('#dlg-kind').value;
      if(!it.payments) it.payments=[];
      it.payments.push({type, amount:amt, date:today()});
      save(list===state.dom?'dom':'dtm'); rerenderDebts(); dlg.close(); openDebtDialog(it, list, typeLabel);
    };
    dlg.showModal();
  }
  function editDebt(it, list){
    const pref = (list===state.dom) ? 'dom' : 'dtm';
    $(`#${pref}-name`)?.scrollIntoView({behavior:'smooth', block:'start'});
    $(`#${pref}-name`).value = it.name || '';
    $(`#${pref}-phone`).value = it.phone || '';
    $(`#${pref}-amount`).value = it.amount || '';
    const idx = list.findIndex(x=>x.id===it.id);
    if(idx>-1) list.splice(idx,1);
    save(list===state.dom?'dom':'dtm'); rerenderDebts();
  }
  function rerenderDebts(){ renderDebts(state.dom, 'dom-list', 'دين علي'); renderDebts(state.dtm, 'dtm-list', 'دين لي'); }

  // حفظ ديون
  $('#form-debt-on-me')?.addEventListener('submit', async e=>{
    e.preventDefault();
    const name=$('#dom-name').value.trim(), phone=$('#dom-phone').value.trim(), amount=$('#dom-amount').value.trim();
    const docs=await filesToEntries($('#dom-files'));
    state.dom.push({id:uid(), name, phone, amount, docs, payments:[], created:today()});
    save('dom'); e.target.reset(); rerenderDebts();
  });
  $('#form-debt-to-me')?.addEventListener('submit', async e=>{
    e.preventDefault();
    const name=$('#dtm-name').value.trim(), phone=$('#dtm-phone').value.trim(), amount=$('#dtm-amount').value.trim();
    const docs=await filesToEntries($('#dtm-files'));
    state.dtm.push({id:uid(), name, phone, amount, docs, payments:[], created:today()});
    save('dtm'); e.target.reset(); rerenderDebts();
  });

  // === روابط "المزيد" ===
  function openContentDialog(title, html){
    const dlg = $('#contentDialog'); if(!dlg) return alert(title + ':\n' + html);
    $('#contentTitle').textContent = title;
    $('#contentBody').innerHTML = html;
    $('#contentClose').onclick = ()=> dlg.close();
    dlg.showModal();
  }
  $('#privacy')?.addEventListener('click', e=>{ e.preventDefault(); openContentDialog('سياسة الخصوصية', (site().privacy||'لم تتم إضافة سياسة بعد.').replace(/\n/g,'<br>')); });
  $('#contact')?.addEventListener('click', e=>{ e.preventDefault(); openContentDialog('تواصل معنا', (site().contact||'لم تتم إضافة معلومات الاتصال بعد.').replace(/\n/g,'<br>')); });
  $('#faq')?.addEventListener('click', e=>{
    e.preventDefault();
    const data = site().faq || [];
    if(!data.length) return openContentDialog('الأسئلة الشائعة','لا توجد أسئلة بعد.');
    const html = '<ul>' + data.map(x=>`<li><strong>${x.q}</strong><br>${x.a}</li>`).join('') + '</ul>';
    openContentDialog('الأسئلة الشائعة', html);
  });
  $('#academy')?.addEventListener('click', e=>{
    e.preventDefault();
    const list = site().academy || [];
    if(!list.length) return openContentDialog('أكاديمية وصايا','لا توجد فيديوهات بعد.');
    const html = list.map(v=>{
      if(v.type==='youtube'){
        const url = v.url.replace('watch?v=','embed/');
        return `<div style="margin-bottom:12px"><div><strong>${v.title}</strong></div><iframe width="100%" height="200" src="${url}" frameborder="0" allowfullscreen></iframe></div>`;
      }else{
        return `<div style="margin-bottom:12px"><div><strong>${v.title}</strong></div><video controls style="width:100%;max-height:220px"><source src="${v.url}"></video></div>`;
      }
    }).join('');
    openContentDialog('أكاديمية وصايا', html);
  });

  // الدفع — تفعيل الخطة وهميًا وتظهر في الهيدر
  $$('.subscribe-btn')?.forEach(btn=>{
    const host = btn.closest('.plan-card');
    btn.addEventListener('click', ()=>{
      state.plan = { type:host.dataset.plan, label:host.dataset.label, price:+host.dataset.price, ts:Date.now() };
      save('plan'); applyPlanBadge(); alert('تم تفعيل الخطة: ' + state.plan.label);
    });
  });

  // تطبيق إعدادات الموقع (شعار/الهيرو/التبويبات/السلايدر)
  let slideTimer = null, slideIdx = 0;
  function applySiteConfig(){
    const cfg = site();
    if(cfg.logo){ const logo = $('#siteLogo'); if(logo) logo.src = cfg.logo; }
    if($('#heroTitle')) $('#heroTitle').innerHTML = cfg.heroTitle || $('#heroTitle').innerHTML;
    if($('#heroSub')) $('#heroSub').textContent = cfg.heroSub || $('#heroSub').textContent;
    const tb = $('#tabbar'); if(tb){ tb.classList.remove('style-pill','style-underline'); if(cfg.tabStyle) tb.classList.add(cfg.tabStyle); }
    // السلايدر
    const slides = cfg.slides || [];
    const host = $('#heroSlider');
    if(host){
      host.innerHTML = ''; slideIdx = 0; if(slideTimer){ clearInterval(slideTimer); slideTimer=null; }
      if(slides.length){
        const el = document.createElement('div');
        el.className = 'muted';
        host.appendChild(el);
        const swap = ()=>{
          const s = slides[slideIdx % slides.length];
          el.innerHTML = `<strong>${s.title||''}</strong><br>${s.sub||''}`;
          slideIdx++;
        };
        swap();
        slideTimer = setInterval(swap, 3500);
      }
    }
  }

  // تفعيل الملف الشخصي في الهيدر بعد الدخول
  function activateProfile(){
    const pbtn = $('#profileBtn');
    if(!pbtn) return;
    pbtn.classList.add('profile','active');
    pbtn.title = `المستخدم: ${currentUser}`;
    pbtn.onclick = ()=>{
      if(confirm(`تسجيل خروج من ${currentUser}؟`)){
        localStorage.removeItem('wasaya:lastUser');
        location.reload();
      }
    };
  }

  function initPage(){
    applyTheme();
    applyPlanBadge();
    applySiteConfig();
    activateProfile();

    // رندر عند الحاجة
    renderWills();
    renderDebts(state.dom, 'dom-list', 'دين علي');
    renderDebts(state.dtm, 'dtm-list', 'دين لي');
    if($('#alert-wills')) $('#alert-wills').checked = !!state.alerts.wills;
    if($('#alert-debts')) $('#alert-debts').checked = !!state.alerts.debts;

    // أزرار سريعة في الصفحة الرئيسية
    $('#quick-add-will')?.addEventListener('click', ()=> location.href='./wills.html');
    $('#quick-debt-to-me')?.addEventListener('click', ()=> location.href='./debt-to-me.html');
    $('#quick-debt-on-me')?.addEventListener('click', ()=> location.href='./debt-on-me.html');
  }

  document.addEventListener('DOMContentLoaded', ensureLogin);
})();

/* === قراءة إعدادات المسؤول العامة وتطبيقها في تبويب "المزيد" (مفعّلة تلقائيًا) === */
(function(){
  const onMorePage = document.querySelector('[data-page="more"]') || document.getElementById('more');
  if(!onMorePage) return;

  const KEY_PAY_LINKS = 'wasaya:admin:payLinks';
  const KEY_PAY_ICONS = 'wasaya:admin:payIcons';
  const KEY_COMP_ICONS = 'wasaya:admin:compIcons';

  const links = JSON.parse(localStorage.getItem(KEY_PAY_LINKS) || '{"tamara":"","tabby":""}');
  const payIcons = JSON.parse(localStorage.getItem(KEY_PAY_ICONS) || '[]');
  const compIcons = JSON.parse(localStorage.getItem(KEY_COMP_ICONS) || '[]');

  const tBtn = document.getElementById('payTamara');
  const yBtn = document.getElementById('payTabby');
  if(tBtn){
    if(links.tamara){ tBtn.href = links.tamara; tBtn.classList.remove('ghost'); }
    else { tBtn.href = '#'; tBtn.onclick = e=>{e.preventDefault(); alert('لم يتم ضبط رابط تمارا بعد.');}; }
  }
  if(yBtn){
    if(links.tabby){ yBtn.href = links.tabby; yBtn.classList.remove('ghost'); }
    else { yBtn.href = '#'; yBtn.onclick = e=>{e.preventDefault(); alert('لم يتم ضبط رابط تابي بعد.');}; }
  }

  const payBox = document.getElementById('payIcons');
  if(payBox){
    payBox.innerHTML = payIcons.length
      ? payIcons.map(i=>`<img src="${i.data}" alt="${i.alt||i.name}">`).join('')
      : '<span class="tiny muted">لم تتم إضافة أيقونات دفع بعد.</span>';
  }

  const compBox = document.getElementById('compIcons');
  if(compBox){
    compBox.innerHTML = compIcons.length
      ? compIcons.map(i=>`<img src="${i.data}" alt="${i.alt||i.name}">`).join('')
      : '<span class="tiny muted">لم تتم إضافة شعارات الامتثال بعد.</span>';
  }
})();
