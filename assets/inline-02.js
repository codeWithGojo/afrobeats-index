function showTab(id) {
      const hero = document.querySelector('.index-hero');
      if (hero) hero.hidden = id === 'receipt';
      document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('nav-active');
        if (window.innerWidth < 768) btn.classList.add('bg-gray-100');
      });
      const s = document.getElementById(id);
      if (s) s.classList.add('active');
      document.querySelectorAll('.nav-btn').forEach(btn => {
        const t = btn.textContent.toLowerCase().replace(/\s+/g,'');
        if ((id==='alltime'&&t.includes('all-time'))||(id==='current'&&t.includes('current'))||
            (id==='regions'&&t.includes('regions'))||(id==='albums'&&t.includes('albums'))||(id==='yearly'&&t.includes('streams'))||(id==='artists'&&t.includes('artists'))||
            (id==='vs'&&t.includes('vs'))||
            (id==='networth'&&(t.includes('net')||t.includes('worth')))||
            (id==='discuss'&&t.includes('discuss'))||(id==='method'&&t.includes('method'))||(id==='receipt'&&t.includes('receipt'))||(id==='underground'&&t.includes('underground'))||(id==='top100'&&t.includes('top100'))||(id==='news'&&t.includes('news'))) {
          btn.classList.add('nav-active'); btn.classList.remove('bg-gray-100');
        }
      });
      window.scrollTo({top:0,behavior:'smooth'});
    }
    document.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('.nav-scroll').forEach(scroller => {
        scroller.addEventListener('wheel', event => {
          if (Math.abs(event.deltaY) > Math.abs(event.deltaX) && scroller.scrollWidth > scroller.clientWidth) {
            event.preventDefault();
            scroller.scrollLeft += event.deltaY;
          }
        }, {passive:false});
      });
    });
    function openArtist(id) {
      showTab('artists');
      setTimeout(() => { const el = document.getElementById(id); if (el) el.scrollIntoView({behavior:'smooth',block:'center'}); }, 150);
    }
