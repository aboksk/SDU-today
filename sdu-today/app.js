(()=>{
'use strict';
/* ============ helpers & storage ============ */
const MAPW=1382, MAPH=2576;
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const KEY='sdutoday.v1';
let store={lang:'ru',tickets:[],created:[],sold:{},name:'',sid:''};
try{const s=JSON.parse(localStorage.getItem(KEY)||'null'); if(s&&typeof s==='object') store={...store,...s};}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(store));}catch(e){}};
let lang=store.lang==='en'?'en':'ru';

const IC={
  home:'<path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z"/>',
  news:'<path d="M5 4h11v16H7a2 2 0 0 1-2-2zM16 8h3v10a2 2 0 0 1-2 2M8 8h5M8 12h5M8 16h3"/>',
  cal:'<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
  map:'<path d="M9 4l6 2 5-2v14l-5 2-6-2-5 2V6zM9 4v14M15 6v14"/>',
  ticket:'<path d="M4 8a2 2 0 0 1 0 4 2 2 0 0 1 0 4v2h16v-2a2 2 0 0 1 0-4 2 2 0 0 1 0-4V6H4zM14 6v12"/>',
  search:'<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/>',
  pin:'<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.4"/>',
  clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  user:'<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5"/>',
  close:'<path d="M6 6l12 12M18 6L6 18"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  minus:'<path d="M5 12h14"/>',
  arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',
  back:'<path d="M19 12H5M11 6l-6 6 6 6"/>',
  check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  club:'<circle cx="9" cy="9" r="3"/><circle cx="17" cy="10" r="2.4"/><path d="M3.5 19c.6-3 2.8-4.6 5.5-4.6s4.9 1.6 5.5 4.6M15 15c2.6-.3 4.8.9 5.5 4"/>',
  target:'<circle cx="12" cy="12" r="3"/><path d="M12 3v4M12 17v4M3 12h4M17 12h4"/>',
};
const ic=n=>`<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${IC[n]||''}</svg>`;

/* ============ i18n ============ */
const TX={
 ru:{
  nav_home:'Главная',nav_news:'Новости',nav_events:'Мероприятия',nav_map:'Карта',nav_tickets:'Мои билеты',nav_org:'Для организаторов',
  foot:'Прототип SDU Today. Новости, мероприятия и номера кабинетов в нём тестовые. Схема кампуса по плану SDU.',
  hero_h:'Сегодня в SDU',hero_sub:'Новости, мероприятия и карта кампуса в одном месте.',
  finder_ph:'Кабинет или место: D-105, библиотека…',finder_btn:'Найти',
  hero_cap:'Мероприятия на карте',hero_open:'Открыть карту',
  up_events:'Ближайшие мероприятия',all_events:'Все мероприятия',latest_news:'Свежие новости',all_news:'Все новости',
  events_h:'Мероприятия',events_p:'Концерты, турниры, лекции и клубные встречи. Билеты можно купить прямо здесь.',
  f_all:'Все',f_free:'Только бесплатные',no_events:'По этому фильтру мероприятий нет.',
  cat_concert:'Концерт',cat_sport:'Турнир',cat_talk:'Встреча',cat_tech:'Технологии',cat_social:'Клубный вечер',
  free:'Бесплатно',left:'Осталось мест: {n}',soldout:'Билеты распроданы',
  back_events:'Все мероприятия',back_news:'Все новости',
  when:'Когда',where:'Где',organizer:'Организатор',show_map:'Показать на карте',offmap:'Вне схемы кампуса',
  tickets:'Билеты',register:'Регистрация',quantity:'Количество',full_name:'Имя и фамилия',student_id:'ID студента',
  buy:'Купить за {p}',reg_btn:'Зарегистрироваться',max_note:'Не более 4 билетов на одного человека.',
  have:'У вас уже есть билетов: {n}.',have_link:'Открыть мои билеты',need_name:'Укажите имя и фамилию.',
  pay_h:'Оплата',pay_demo:'Демо-режим: деньги не списываются.',pay_card:'Банковская карта',pay_qr:'Перевод по QR',pay_btn:'Оплатить {p}',pay_wait:'Обработка…',
  tk_ready:'Билет готов',tk_ready_free:'Вы зарегистрированы',tk_show:'Покажите QR-код на входе.',tk_code:'Код',tk_qty:'Билетов: {n}',tk_holder:'На имя',
  close:'Закрыть',my_tickets:'Мои билеты',tickets_p:'Все билеты хранятся здесь. На входе покажите QR-код.',
  no_tickets:'Билетов пока нет',no_tickets_p:'Выберите мероприятие и купите билет.',browse:'Смотреть мероприятия',
  refund:'Вернуть билет',refund_sure:'Точно вернуть?',refunded:'Билет возвращён.',
  news_h:'Новости',news_p:'Всё, что происходит в университете.',n_all:'Все',n_search:'Поиск по новостям',
  cat_academics:'Учёба',cat_campus:'Кампус',cat_announce:'Объявления',cat_achieve:'Достижения',no_news:'Ничего не найдено.',
  related:'Связанное мероприятие',
  block:'Блок',floor:'этаж',floor_1:'1 этаж',floor_2:'2 этаж',floor_3:'3 этаж',how:'Как пройти',events_here:'Мероприятия здесь',
  map_ph:'Кабинет или место (D-105, библиотека)',
  m_all:'Всё',m_room:'Аудитории',m_hall:'Залы',m_food:'Еда',m_service:'Сервисы',m_wc:'Уборные',m_entrance:'Входы',m_event:'Мероприятия',
  m_none:'Ничего не найдено. Проверьте номер, например D-105 или E-110.',
  zoom_in:'Приблизить',zoom_out:'Отдалить',zoom_home:'К входу',clear:'Сбросить',open_event:'Открыть мероприятие',
  room:'Аудитория',
  org_h:'Кабинет организатора',org_p:'В прототипе вход не нужен: создайте мероприятие, и оно сразу появится в общем списке.',
  f_title:'Название',f_club:'Клуб',f_cat:'Тип',f_date:'Дата',f_time:'Время',f_place:'Место',f_price:'Цена билета, ₸ (0 — бесплатно)',f_cap:'Количество мест',f_desc:'Описание',
  publish:'Опубликовать мероприятие',my_events:'Мои мероприятия',sold_n:'Продано',revenue:'Выручка',of:'из',
  no_mine:'Вы ещё не создали ни одного мероприятия.',published:'Мероприятие опубликовано.',need_fields:'Заполните название и дату.',
  org_new:'Новое мероприятие',
 },
 en:{
  nav_home:'Home',nav_news:'News',nav_events:'Events',nav_map:'Map',nav_tickets:'My tickets',nav_org:'For organizers',
  foot:'SDU Today prototype. News, events and room numbers here are test data. Campus layout based on the SDU plan.',
  hero_h:'Today at SDU',hero_sub:'News, events and the campus map in one place.',
  finder_ph:'Room or place: D-105, library…',finder_btn:'Find',
  hero_cap:'Events on the map',hero_open:'Open the map',
  up_events:'Upcoming events',all_events:'All events',latest_news:'Latest news',all_news:'All news',
  events_h:'Events',events_p:'Concerts, tournaments, talks and club meetups. Buy tickets right here.',
  f_all:'All',f_free:'Free only',no_events:'No events match this filter.',
  cat_concert:'Concert',cat_sport:'Tournament',cat_talk:'Talk',cat_tech:'Tech',cat_social:'Club night',
  free:'Free',left:'Spots left: {n}',soldout:'Sold out',
  back_events:'All events',back_news:'All news',
  when:'When',where:'Where',organizer:'Organizer',show_map:'Show on map',offmap:'Off the campus plan',
  tickets:'Tickets',register:'Registration',quantity:'Quantity',full_name:'Full name',student_id:'Student ID',
  buy:'Buy for {p}',reg_btn:'Register',max_note:'Up to 4 tickets per person.',
  have:'You already have {n} ticket(s).',have_link:'Open my tickets',need_name:'Enter your full name.',
  pay_h:'Payment',pay_demo:'Demo mode: no money is charged.',pay_card:'Bank card',pay_qr:'QR transfer',pay_btn:'Pay {p}',pay_wait:'Processing…',
  tk_ready:'Your ticket is ready',tk_ready_free:'You are registered',tk_show:'Show this QR code at the entrance.',tk_code:'Code',tk_qty:'Tickets: {n}',tk_holder:'Holder',
  close:'Close',my_tickets:'My tickets',tickets_p:'All your tickets live here. Show the QR code at the entrance.',
  no_tickets:'No tickets yet',no_tickets_p:'Pick an event and get a ticket.',browse:'Browse events',
  refund:'Cancel ticket',refund_sure:'Really cancel?',refunded:'Ticket cancelled.',
  news_h:'News',news_p:'Everything happening at the university.',n_all:'All',n_search:'Search news',
  cat_academics:'Academics',cat_campus:'Campus',cat_announce:'Announcements',cat_achieve:'Achievements',no_news:'Nothing found.',
  related:'Related event',
  block:'Block',floor:'floor',floor_1:'Floor 1',floor_2:'Floor 2',floor_3:'Floor 3',how:'How to get there',events_here:'Events here',
  map_ph:'Room or place (D-105, library)',
  m_all:'All',m_room:'Rooms',m_hall:'Halls',m_food:'Food',m_service:'Services',m_wc:'Restrooms',m_entrance:'Entrances',m_event:'Events',
  m_none:'Nothing found. Check the number, e.g. D-105 or E-110.',
  zoom_in:'Zoom in',zoom_out:'Zoom out',zoom_home:'To entrance',clear:'Clear',open_event:'Open event',
  room:'Room',
  org_h:'Organizer dashboard',org_p:'No login in the prototype: create an event and it appears in the public list right away.',
  f_title:'Title',f_club:'Club',f_cat:'Type',f_date:'Date',f_time:'Time',f_place:'Venue',f_price:'Ticket price, ₸ (0 = free)',f_cap:'Capacity',f_desc:'Description',
  publish:'Publish event',my_events:'My events',sold_n:'Sold',revenue:'Revenue',of:'of',
  no_mine:'You have not created any events yet.',published:'Event published.',need_fields:'Fill in the title and the date.',
  org_new:'New event',
 }
};
const t=(k,v)=>{let s=(TX[lang][k]??TX.ru[k]??k); if(v) for(const x in v) s=s.replace('{'+x+'}',v[x]); return s;};
const L=o=>o?(o[lang]??o.ru??''):'';

/* ============ dates ============ */
const today=new Date(); today.setHours(0,0,0,0);
const addDays=(d,n)=>{const x=new Date(d); x.setDate(x.getDate()+n); return x;};
const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const parseISO=s=>{const [y,m,d]=s.split('-').map(Number); return new Date(y,m-1,d);};
const loc=()=>lang==='ru'?'ru-RU':'en-GB';
const fmt=(d,o)=>new Intl.DateTimeFormat(loc(),o).format(d);
const money=n=>n===0?t('free'):new Intl.NumberFormat(loc()).format(n)+' ₸';

/* ============ campus data ============ */
const BLOCKS={
 A:{x:232,y:2025,w:190,h:551},B:{x:422,y:2030,w:400,h:546},C:{x:830,y:1920,w:300,h:560},
 D:{x:455,y:1640,w:322,h:210},E:{x:455,y:1275,w:322,h:210},F:{x:455,y:790,w:322,h:325},G:{x:455,y:420,w:322,h:330},H:{x:455,y:55,w:322,h:340}
};
const FAC={
 D:{ru:'Факультет права и социальных наук',en:'Faculty of Law & Social Sciences'},
 E:{ru:'Факультет образования и гуманитарных наук',en:'Faculty of Education & Humanities'},
 F:{ru:'Факультет инженерии и естественных наук',en:'Faculty of Engineering and Natural Sciences'},
 G:{ru:'Бизнес-школа SDU',en:'SDU Business School'}
};
const LOCS=[];
const place=(id,cat,x,y,block,ru,en,kw='')=>LOCS.push({id,kind:'place',cat,x,y,block,ru,en,kw});
place('entrance-c','entrance',1078,2150,'C','Вход (блок C)','Entrance (Block C)','вход выход entrance');
place('entrance-g','entrance',1128,655,'G','Вход (блок G)','Entrance (Block G)','вход entrance');
place('info','service',980,2175,'C','Информационная стойка','Information desk','информация справка info');
place('wifi','service',882,2135,'C','Зона Wi-Fi','Wi-Fi zone','вайфай интернет wifi');
place('cloakroom','service',1055,2045,'C','Гардероб','Cloakroom','гардероб куртка cloakroom coat');
place('library','service',680,2340,'B','Библиотека','Library','книги читальный зал library books');
place('admin','service',590,2092,'B','Административные офисы','Administration offices','администрация офис admin');
place('medical','service',745,487,'G','Медпункт','Medical center','врач медицинский медцентр health doctor');
place('support','service',752,1585,'D','Служба поддержки студентов','Student support','поддержка help support');
place('market','service',950,803,'F','Market','Market','маркет магазин market shop');
place('copy-center','service',950,551,'G','Копировальный центр','Copy center','копировальный центр копия печать print copy');
place('canteen','food',975,990,'F','Столовая','Canteen','еда обед столовая food lunch');
place('cafe','food',1100,1165,'F','Кофейня','Coffee point','кофе coffee cafe');
place('seating','food',925,1262,'E','Зона столиков','Seating area','столики отдых seating');
place('lecture1','hall',890,1362,'E','Бочка D','Bochka D','бочка bochka barrel лекция lecture аудитория');
place('lecture2','hall',952,1560,'E','Бочка C','Bochka C','бочка bochka barrel лекция lecture аудитория');
place('lecture3','hall',890,1700,'D','Бочка B','Bochka B','бочка bochka barrel лекция lecture аудитория');
place('lecture4','hall',952,1828,'D','Бочка A','Bochka A','бочка bochka barrel лекция lecture аудитория');
place('hall-a','hall',325,2185,'A','Red hall','Red hall','зал концерт сцена red hall');
place('rec','hall',1000,738,'G','Зона отдыха и игр (настольный теннис)','Recreation zone (table tennis)','теннис пинг-понг игры tennis games');
place('hall-blue','hall',1000,685,'G','Blue hall','Blue hall','синий зал blue hall');
[['wc-g',678,787,'G'],['wc-f',678,1153,'F'],['wc-e',678,1515,'E'],['wc-d',678,1880,'D'],['wc-b',477,2002,'B']]
 .forEach(([id,x,y,b])=>place(id,'wc',x,y,b,'Уборная','Restroom','уборная туалет wc restroom toilet'));
const WINGS={D:{top:1688,bot:1806},E:{top:1322,bot:1439},F:{top:955,bot:1072},G:{top:595,bot:706},H:{top:225,bot:336}};
const TOPX=[488,562,663,744], BOTX=[492,544,592,642,693,745];
const D_ROOM_NUMBERS={1:108,2:107,3:106,5:105,6:104,7:103,8:102,9:101};
Object.entries(WINGS).forEach(([b,w])=>{
  for(let i=1;i<=10;i++){
    const top=i<=4, x=top?TOPX[i-1]:BOTX[i-5], y=top?w.top:w.bot;
    if(b==='D'&&(i===4||i===10)) continue;
    const roomNumber=b==='D'?D_ROOM_NUMBERS[i]:100+i;
    for(let floor=1;floor<=3;floor++){
      const id=`${b}-${floor}${String(roomNumber%100).padStart(2,'0')}`;
      let ru=`Аудитория ${id}`,en=`Room ${id}`;
      if(i===1&&b==='G'){ru=`Офис бизнес-школы (${id})`;en=`Business School office (${id})`;}
      else if(i===1&&FAC[b]){ru=`Деканат (${id})`;en=`Dean's office (${id})`;}
      LOCS.push({id,kind:'room',cat:'room',x,y,block:b,floor,row:top?'top':'bottom',ru,en,kw:(i===1?'деканат dean office офис ':'')+'кабинет аудитория room classroom'});
    }
  }
});
const LOC_BY_ID=Object.fromEntries(LOCS.map(l=>[l.id,l]));

const CLUBS={
 music:{ru:'Музыкальный клуб',en:'Music Club'},debate:{ru:'Клуб дебатов',en:'Debate Club'},sport:{ru:'Спортивный клуб',en:'Sports Club'},
 tech:{ru:'Клуб технологий',en:'Tech Club'},cinema:{ru:'Киноклуб',en:'Cinema Club'},business:{ru:'Бизнес-клуб',en:'Business Club'}
};
const ECAT={concert:'#7A1F2B',sport:'#4F6B35',talk:'#2F345C',tech:'#2F6DA3',social:'#84317F'};
const NCAT={academics:'#2F345C',campus:'#4F6B35',announce:'#B3612F',achieve:'#7A1F2B'};

const BASE_EVENTS=[
 {id:'open-mic',cat:'social',club:'music',d:0,time:'17:00',loc:'seating',price:0,cap:80,sold:41,
  title:{ru:'Открытый микрофон',en:'Open mic'},
  desc:{ru:'Выходите на сцену со своей песней или стихами, либо просто послушайте. Музыкальный клуб соберёт небольшую сцену прямо в зоне столиков.',en:'Step up with a song or a poem, or just listen. The Music Club sets up a small stage right in the seating area.'}},
 {id:'debate',cat:'talk',club:'debate',d:2,time:'16:00',loc:'lecture2',price:0,cap:120,sold:67,
  title:{ru:'Открытые дебаты: ИИ в образовании',en:'Open debate: AI in education'},
  desc:{ru:'Две команды поспорят, помогает ли искусственный интеллект учиться или мешает. После раунда зал задаёт вопросы спикерам.',en:'Two teams argue whether artificial intelligence helps or hurts learning. After the round, the audience questions the speakers.'}},
 {id:'tt-tournament',cat:'sport',club:'sport',d:3,time:'15:00',loc:'rec',price:500,cap:32,sold:29,
  title:{ru:'Турнир по настольному теннису',en:'Table tennis tournament'},
  desc:{ru:'Олимпийская система: проигрыш — выбывание. Взнос покрывает судей и призы. Ракетки и мячи выдаёт клуб.',en:'Knockout format: lose and you are out. The fee covers referees and prizes. Rackets and balls are provided by the club.'}},
 {id:'cinema',cat:'social',club:'cinema',d:4,time:'19:00',loc:'lecture3',price:300,cap:150,sold:88,
  title:{ru:'Киновечер: выбор зрителей',en:'Movie night: audience pick'},
  desc:{ru:'Фильм выбирают голосованием в чате клуба за день до показа. После сеанса короткое обсуждение.',en:'The film is chosen by a vote in the club chat the day before. A short discussion follows the screening.'}},
 {id:'career-talk',cat:'talk',club:'business',d:5,time:'14:00',loc:'lecture4',price:0,cap:150,sold:103,
  title:{ru:'Выпускники о карьере в IT и финтехе',en:'Alumni on careers in IT and fintech'},
  desc:{ru:'Выпускники расскажут, как начинали, что ценят работодатели и какие навыки стоит прокачивать уже сейчас. Регистрация обязательна.',en:'Alumni share how they started, what employers value and which skills to build now. Registration is required.'}},
 {id:'autumn-concert',cat:'concert',club:'music',d:6,time:'18:30',loc:'hall-a',price:1500,cap:300,sold:212,
  title:{ru:'Осенний концерт клубов',en:'Autumn clubs concert'},
  desc:{ru:'Большой вечер на одной сцене: вокал, группы, танцы и сюрпризы от студенческих клубов. Двери открываются за 30 минут до начала.',en:'A big evening on one stage: vocals, bands, dance and surprises from student clubs. Doors open 30 minutes before the start.'}},
 {id:'quiz',cat:'social',club:'debate',d:8,time:'18:00',loc:'seating',price:400,cap:120,sold:54,
  title:{ru:'Интеллектуальная игра',en:'Quiz night'},
  desc:{ru:'Команды по четыре человека отвечают на вопросы из науки, кино, истории и интернета. Лучшая команда получает призы.',en:'Teams of four answer questions on science, film, history and the internet. The best team wins prizes.'}},
 {id:'hackathon',cat:'tech',club:'tech',d:9,time:'10:00',loc:'lecture1',price:0,cap:60,sold:60,
  title:{ru:'Хакатон на один день',en:'One-day hackathon'},
  desc:{ru:'Соберите команду, придумайте продукт и покажите прототип жюри к вечеру. Регистрация уже закрыта: все места заняты.',en:'Form a team, come up with a product and show a prototype to the jury by evening. Registration is closed: all spots are taken.'}},
 {id:'basketball',cat:'sport',club:'sport',d:12,time:'17:00',loc:null,locText:{ru:'Спортивный комплекс (вне схемы)',en:'Sports complex (off the plan)'},price:700,cap:400,sold:230,
  title:{ru:'Межфакультетский баскетбольный турнир',en:'Inter-faculty basketball tournament'},
  desc:{ru:'Четыре команды от факультетов сыграют за кубок университета. Болельщики приходят с флагами и барабанами.',en:'Four faculty teams play for the university cup. Fans come with flags and drums.'}}
];
BASE_EVENTS.forEach(e=>{e.date=iso(addDays(today,e.d));});
const allEvents=()=>BASE_EVENTS.concat(store.created);
const evById=id=>allEvents().find(e=>e.id===id);
const soldOf=e=>(e.sold||0)+(store.sold[e.id]||0);
const evDate=e=>parseISO(e.date);
const upcoming=()=>allEvents().filter(e=>evDate(e)>=today).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
const evPlace=e=>e.loc&&LOC_BY_ID[e.loc]?L(LOC_BY_ID[e.loc]):(e.locText?L(e.locText):t('offmap'));

const NEWS=[
 {id:'new-app',cat:'announce',d:0,
  ru:{t:'Встречайте SDU Today: новости, события и карта в одном приложении',lead:'Мы собрали всё, что нужно студенту, чтобы не искать по чатам и объявлениям.',b:['В SDU Today можно читать новости университета, находить мероприятия и покупать билеты, а также искать аудитории и сервисы на карте кампуса.','Приложение пока работает в тестовом режиме. Расскажите, чего вам в нём не хватает, и мы добавим.']},
  en:{t:'Meet SDU Today: news, events and the map in one app',lead:'Everything a student needs, so you stop digging through chats and notice boards.',b:['In SDU Today you can read university news, find events and buy tickets, and look up rooms and services on the campus map.','The app is in test mode for now. Tell us what is missing and we will add it.']}},
 {id:'exchange',cat:'academics',d:-1,
  ru:{t:'Открыт приём заявок на программы обмена на весенний семестр',lead:'Подать документы можно до конца месяца через офис международных связей.',b:['Студенты 2–4 курсов могут подать заявки на семестровый обмен в университеты-партнёры. Понадобятся выписка с оценками, подтверждение уровня английского и мотивационное письмо.','Консультации проходят по будням. Перед визитом проверьте список документов на сайте университета.']},
  en:{t:'Applications open for spring semester exchange programs',lead:'Documents can be submitted until the end of the month through the international relations office.',b:['Students in years 2–4 can apply for a semester exchange at partner universities. You will need a transcript, proof of English proficiency and a motivation letter.','Consultations run on weekdays. Check the document list on the university website before you visit.']}},
 {id:'library-hours',cat:'campus',d:-2,
  ru:{t:'Библиотека продлевает часы работы в период сессии',lead:'Читальные залы будут открыты допоздна, а часть мест отдадут под групповую подготовку.',b:['В период сессии библиотека работает дольше обычного. Часть читальных мест отведена под тихую работу, часть под командную подготовку к экзаменам.','Актуальное расписание будет доступно на странице библиотеки на карте кампуса.']},
  en:{t:'Library extends opening hours during exams',lead:'Reading rooms stay open late, and some seats are set aside for group study.',b:['During exam weeks the library is open longer than usual. Some reading seats are reserved for quiet work, others for group exam prep.','The current schedule will be available on the library page of the campus map.']}},
 {id:'club-fair',cat:'campus',d:-3,
  ru:{t:'Ярмарка клубов: найдите сообщество по интересам',lead:'Студенческие клубы расскажут о себе и откроют набор новых участников.',b:['На ярмарке можно познакомиться с командами, задать вопросы и сразу записаться. Музыка, дебаты, технологии, спорт и кино: выбирайте то, что ближе.','Следите за событиями клубов в разделе «Мероприятия». Билеты можно купить прямо в приложении.']},
  en:{t:'Clubs fair: find a community that fits',lead:'Student clubs will present themselves and open recruitment.',b:['At the fair you can meet the teams, ask questions and sign up on the spot. Music, debate, tech, sports and film: pick what suits you.','Follow club events in the Events section. You can buy tickets right in the app.']}},
 {id:'schedule',cat:'announce',d:-4,
  ru:{t:'Изменения в расписании на ближайшую неделю',lead:'Часть занятий переносится из-за технических работ в корпусе.',b:['Некоторые занятия в блоках F и G перенесены в другие аудитории. Актуальные номера публикуются в расписании.','Если не можете найти новую аудиторию, введите её номер в поиске на карте: приложение покажет, как пройти.']},
  en:{t:'Schedule changes for the coming week',lead:'Some classes are moving because of maintenance work in the building.',b:['Some classes in Blocks F and G have moved to other rooms. Current room numbers are published in the timetable.','If you cannot find the new room, type its number into the map search and the app will show you the way.']}},
 {id:'career-news',cat:'academics',d:-5,ev:'career-talk',
  ru:{t:'Выпускники расскажут о карьере в IT и финтехе',lead:'Открытая встреча с практиками пройдёт на этой неделе в лекционном зале.',b:['Выпускники и приглашённые специалисты поделятся тем, как начать карьеру, на что обращают внимание работодатели и какие навыки развивать уже сейчас.','Регистрация бесплатная, места ограничены.']},
  en:{t:'Alumni to talk about careers in IT and fintech',lead:'An open meetup with practitioners takes place this week in a lecture hall.',b:['Alumni and guest speakers will share how to start a career, what employers look for and which skills to build now.','Registration is free, spots are limited.']}},
 {id:'olympiad',cat:'achieve',d:-6,ev:'hackathon',
  ru:{t:'Студенческая команда вышла в финал олимпиады по программированию',lead:'Ребята прошли отборочный этап и готовятся к финальным заданиям.',b:['Команда факультета инженерии и естественных наук прошла отборочный раунд. Финал состоится в конце месяца.','Клуб технологий проводит открытые тренировки для всех желающих: следите за анонсами.']},
  en:{t:'Student team reaches the programming olympiad final',lead:'The team passed the qualifying round and is preparing for the final tasks.',b:['A team from the Faculty of Engineering and Natural Sciences passed the qualifying round. The final takes place at the end of the month.','The Tech Club runs open training sessions for anyone interested: watch for announcements.']}},
 {id:'scholarship',cat:'announce',d:-7,
  ru:{t:'Напоминание о сроках подачи документов на стипендию',lead:'Приём документов на академическую стипендию закончится в конце месяца.',b:['Проверьте, что в личном кабинете актуальны оценки и контактные данные. Неполные заявки рассматриваться не будут.','С вопросами обращайтесь в службу поддержки студентов: её можно найти на карте.']},
  en:{t:'Reminder: scholarship application deadline',lead:'Applications for the academic scholarship close at the end of the month.',b:['Check that your grades and contact details are up to date in your account. Incomplete applications will not be considered.','For questions, go to Student support: you can find it on the map.']}}
];
NEWS.forEach(n=>{n.date=addDays(today,n.d);});
const newsSorted=()=>NEWS.slice().sort((a,b)=>b.date-a.date);

/* ============ search helpers ============ */
const CYR={'а':'a','в':'b','с':'c','д':'d','е':'e','ё':'e','ф':'f','г':'g','н':'h'};
const norm=s=>String(s||'').toLowerCase().replace(/[а-яё]/g,c=>CYR[c]||c).replace(/[\s\-_.,:;()«»]/g,'');
const locText=l=>norm([l.id,l.ru,l.en,l.kw,l.block?('блок'+l.block+'block'+l.block):''].join(' '));
const evText=e=>norm([e.title.ru,e.title.en,CLUBS[e.club]?.ru,CLUBS[e.club]?.en,e.loc&&LOC_BY_ID[e.loc]?LOC_BY_ID[e.loc].ru+LOC_BY_ID[e.loc].en:'',(e.locText?e.locText.ru+e.locText.en:'')].join(' '));

function howTo(l){
  if(l.kind!=='room') return '';
  const order=['D','E','F','G','H'], passed=order.slice(0,order.indexOf(l.block));
  const ru=l.row==='top'?'правой':'левой', en=l.row==='top'?'right':'left';
  return lang==='ru'
   ? `Войдите через вход в блоке C и идите по главному коридору${passed.length?` мимо блоков ${passed.join(', ')}`:''} до блока ${l.block}. Поднимитесь на ${l.floor} этаж и поверните налево в коридор блока: ${l.id} будет на ${ru} стороне.`
   : `Enter through Block C and follow the main corridor${passed.length?`, past blocks ${passed.join(', ')},`:''} to Block ${l.block}. Go to floor ${l.floor} and turn left into the block corridor: ${l.id} is on the ${en} side.`;
}

/* ============ QR ============ */
function qrSvg(text){
  try{
    const qr=qrcode(0,'M'); qr.addData(text); qr.make();
    const n=qr.getModuleCount(); let d='';
    for(let r=0;r<n;r++)for(let c=0;c<n;c++) if(qr.isDark(r,c)) d+=`M${c+2},${r+2}h1v1h-1z`;
    return `<svg viewBox="0 0 ${n+4} ${n+4}" shape-rendering="crispEdges" role="img" aria-label="QR"><path d="${d}"/></svg>`;
  }catch(e){
    let h=0; for(const ch of text) h=(h*31+ch.charCodeAt(0))>>>0;
    const n=25; let d=''; let s=h||7;
    const rnd=()=>{s^=s<<13;s>>>=0;s^=s>>17;s^=s<<5;s>>>=0;return s;};
    const finder=(r,c)=>(r<8&&c<8)||(r<8&&c>=n-8)||(r>=n-8&&c<8);
    for(let r=0;r<n;r++)for(let c=0;c<n;c++){
      let dark;
      if(finder(r,c)){const lr=r>=n-8?r-(n-8):r,lc=c>=n-8?c-(n-8):c;dark=(lr===0||lr===6||lc===0||lc===6)&&lr<7&&lc<7||(lr>=2&&lr<=4&&lc>=2&&lc<=4);}
      else dark=rnd()%2===0;
      if(dark) d+=`M${c+2},${r+2}h1v1h-1z`;
    }
    return `<svg viewBox="0 0 ${n+4} ${n+4}" shape-rendering="crispEdges" role="img" aria-label="QR"><path d="${d}"/></svg>`;
  }
}

/* ============ chrome ============ */
const app=$('#app');
let currentRoute='';
function navItems(){return [
  ['#/', 'home', t('nav_home'),'home'],['#/news','news',t('nav_news'),'news'],['#/events','events',t('nav_events'),'cal'],['#/map','map',t('nav_map'),'map'],['#/tickets','tickets',t('nav_tickets'),'ticket']];}
function ticketCount(){return store.tickets.reduce((a,x)=>a+x.qty,0);}
function renderChrome(){
  const items=navItems(), n=ticketCount();
  $('#nav').innerHTML=items.map(([h,k,l,i])=>`<a href="${h}" data-nav="${k}">${l}${k==='tickets'&&n?`<span class="badge">${n}</span>`:''}</a>`).join('');
  $('#tabbar').innerHTML=items.map(([h,k,l,i])=>`<a href="${h}" data-nav="${k}">${ic(i)}<span>${k==='tickets'?(lang==='ru'?'Билеты':'Tickets'):l}</span>${k==='tickets'&&n?`<span class="badge">${n}</span>`:''}</a>`).join('');
  $$('#langseg button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.lang===lang)));
  $('#foot-note').textContent=t('foot'); $('#foot-org').textContent=t('nav_org');
  document.documentElement.lang=lang;
  setActive();
}
function setActive(){
  const k=(currentRoute.split('/')[0])||'home';
  const key=k==='' ?'home':k;
  $$('[data-nav]').forEach(a=>{ if(a.dataset.nav===(key||'home')) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current'); });
}

/* ============ small components ============ */
function eventCard(e){
  const d=evDate(e), left=e.cap-soldOf(e), c=ECAT[e.cat]||'#2F345C';
  return `<a class="ev" href="#/events/${esc(e.id)}" style="--c:${c}">
    <div class="ev-date"><b>${d.getDate()}</b><span>${fmt(d,{month:'short'})}</span><span>${fmt(d,{weekday:'short'})}</span></div>
    <div class="ev-body">
      <div><span class="tag">${t('cat_'+e.cat)}</span></div>
      <h3>${esc(L(e.title))}</h3>
      <div class="ev-row">${ic('clock')}${esc(e.time)}</div>
      <div class="ev-row">${ic('pin')}${esc(evPlace(e))}</div>
      <div class="ev-foot"><span class="price${e.price===0?' free':''}">${money(e.price)}</span>
        ${left<=0?`<span class="sold">${t('soldout')}</span>`:`<span class="left${left<=15?' low':''}">${t('left',{n:left})}</span>`}</div>
    </div></a>`;
}
function newsMeta(n){return `<div class="meta"><span class="cat">${t('cat_'+n.cat)}</span><span>${fmt(n.date,{day:'numeric',month:'long'})}</span></div>`;}
function pinHTML(it,u,sel){
  const s=sel===it.id, lbl=esc(it.label||'');
  if(it.kind==='event'){
    const r=(s?21:15)*u;
    return `<g class="pin" data-pin="${esc(it.id)}" tabindex="0" role="button" aria-label="${lbl}" transform="translate(${it.x} ${it.y})"><circle r="${26*u}" fill="transparent"/>${s?`<circle class="pulse" r="${r*1.5}" fill="none" stroke="#EFA173" stroke-width="${3*u}"/>`:''}<path d="M0 ${-r}L${r*.8} 0L0 ${r}L${-r*.8} 0Z" fill="#EFA173" stroke="#2F345C" stroke-width="${2.6*u}" stroke-linejoin="round"/></g>`;
  }
  const r=(it.kind==='room'?7.5:11)*u*(s?1.55:1);
  return `<g class="pin" data-pin="${esc(it.id)}" tabindex="0" role="button" aria-label="${lbl}" transform="translate(${it.x} ${it.y})"><circle r="${24*u}" fill="transparent"/>${s?`<circle class="pulse" r="${r*1.7}" fill="none" stroke="#EFA173" stroke-width="${3*u}"/>`:''}<circle r="${r}" fill="${s?'#EFA173':'#2F345C'}" stroke="${s?'#2F345C':'#fff'}" stroke-width="${2.6*u}"/></g>`;
}
function labelHTML(it,u){
  const anchor=it.x<340?'start':(it.x>1020?'end':'middle'), dx=anchor==='start'?-8*u:(anchor==='end'?8*u:0);
  return `<text class="plabel" x="${it.x+dx}" y="${it.y-30*u}" text-anchor="${anchor}" font-size="${17*u}" stroke-width="${5*u}">${esc(it.label)}</text>`;
}

/* ============ pages ============ */
function pageHome(){
  const ups=upcoming();
  const pins=ups.filter(e=>e.loc&&LOC_BY_ID[e.loc]).slice(0,6).map(e=>({id:'ev:'+e.id,kind:'event',x:LOC_BY_ID[e.loc].x,y:LOC_BY_ID[e.loc].y,label:L(e.title)}));
  const chipIds=['library','canteen','medical','info'];
  const news=newsSorted(); const [f,...rest]=news;
  const dl=fmt(new Date(),{weekday:'long',day:'numeric',month:'long'});
  return `<div class="wrap">
   <section class="hero">
    <div>
      <p class="dateline">${esc(dl.charAt(0).toUpperCase()+dl.slice(1))}</p>
      <h1>${t('hero_h')}</h1>
      <p class="sub">${t('hero_sub')}</p>
      <form class="finder" id="finder" role="search">
        <div class="finder-row"><label class="search"><span class="sr">${t('finder_btn')}</span>${ic('search')}<input id="fq" type="search" placeholder="${esc(t('finder_ph'))}" autocomplete="off"></label>
        <button class="btn accent" type="submit">${t('finder_btn')}</button></div>
        <div class="chips">${chipIds.map(id=>`<a class="chip" href="#/map/${id}">${esc(L(LOC_BY_ID[id]))}</a>`).join('')}</div>
      </form>
    </div>
    <a class="heromap" href="#/map" aria-label="${t('hero_open')}"><div class="mapimg"></div>
      <svg viewBox="0 0 ${MAPW} ${MAPH}" aria-hidden="true">${pins.map(p=>pinHTML(p,4.4,null)).join('')}</svg>
      <div class="cap"><span>${t('hero_cap')}</span>${ic('arrow')}</div></a>
    <a class="heromap-m" href="#/map"><span>${t('hero_open')}</span>${ic('map')}</a>
   </section>
   <section class="sec"><div class="sec-h"><h2>${t('up_events')}</h2><a href="#/events">${t('all_events')}${ic('arrow')}</a></div>
     <div class="grid">${ups.slice(0,3).map(eventCard).join('')}</div></section>
   <section class="sec"><div class="sec-h"><h2>${t('latest_news')}</h2><a href="#/news">${t('all_news')}${ic('arrow')}</a></div>
     <div class="feat">
       <a class="card-n big" style="--c:${NCAT[f.cat]}" href="#/news/${f.id}">${newsMeta(f)}<h3>${esc(L(f).t)}</h3><p class="lead">${esc(L(f).lead)}</p></a>
       <div class="nlist">${rest.slice(0,3).map(n=>`<a class="nrow" style="--c:${NCAT[n.cat]}" href="#/news/${n.id}">${newsMeta(n)}<h3>${esc(L(n).t)}</h3></a>`).join('')}</div>
     </div></section>
  </div>`;
}

let newsFilter='all', newsQ='';
function pageNews(){
  const cats=['all','academics','campus','announce','achieve'];
  return `<div class="wrap"><div class="page-h"><h1>${t('news_h')}</h1><p>${t('news_p')}</p></div>
   <div class="filters"><div class="chips" id="ncats">${cats.map(c=>`<button class="chip" data-ncat="${c}" aria-pressed="${newsFilter===c}">${c==='all'?t('n_all'):t('cat_'+c)}</button>`).join('')}</div><span class="sp"></span>
   <label class="search" style="min-width:240px">${ic('search')}<input id="nq" type="search" placeholder="${esc(t('n_search'))}" value="${esc(newsQ)}" aria-label="${esc(t('n_search'))}"></label></div>
   <div class="nlist-l" id="nlist" style="display:grid;gap:14px;padding-bottom:20px"></div></div>`;
}
function drawNews(){
  const q=norm(newsQ);
  const list=newsSorted().filter(n=>(newsFilter==='all'||n.cat===newsFilter)&&(!q||norm(n.ru.t+n.en.t+n.ru.lead+n.en.lead).includes(q)));
  $('#nlist').innerHTML=list.length?list.map(n=>`<a class="nitem" style="--c:${NCAT[n.cat]}" href="#/news/${n.id}">${newsMeta(n)}<h3>${esc(L(n).t)}</h3><p class="muted">${esc(L(n).lead)}</p></a>`).join(''):`<div class="empty">${t('no_news')}</div>`;
}
function pageArticle(id){
  const n=NEWS.find(x=>x.id===id); if(!n) return notFound();
  const ev=n.ev&&evById(n.ev);
  return `<div class="wrap"><div class="article"><a class="crumb" href="#/news">${ic('back')}${t('back_news')}</a>
   <div style="--c:${NCAT[n.cat]}">${newsMeta(n)}</div><h1>${esc(L(n).t)}</h1><p class="lead">${esc(L(n).lead)}</p>
   <div class="body">${L(n).b.map(p=>`<p>${esc(p)}</p>`).join('')}</div>
   ${ev?`<div class="rel"><h3 style="margin-bottom:10px">${t('related')}</h3>${eventCard(ev)}</div>`:''}</div></div>`;
}

let evFilter='all', evFree=false;
function pageEvents(){
  const cats=['all','concert','sport','talk','tech','social'];
  return `<div class="wrap"><div class="page-h"><h1>${t('events_h')}</h1><p>${t('events_p')}</p></div>
   <div class="filters"><div class="chips">${cats.map(c=>`<button class="chip" data-ecat="${c}" aria-pressed="${evFilter===c}">${c==='all'?t('f_all'):t('cat_'+c)}</button>`).join('')}</div><span class="sp"></span>
   <button class="chip" data-efree aria-pressed="${evFree}">${t('f_free')}</button></div>
   <div class="grid" id="evgrid" style="padding-bottom:20px"></div></div>`;
}
function drawEvents(){
  const list=upcoming().filter(e=>(evFilter==='all'||e.cat===evFilter)&&(!evFree||e.price===0));
  $('#evgrid').innerHTML=list.length?list.map(eventCard).join(''):`<div class="empty">${t('no_events')}</div>`;
}

const qty={};
function buyPanel(e){
  const left=e.cap-soldOf(e), sold=soldOf(e), pct=Math.min(100,Math.round(sold/e.cap*100));
  const have=store.tickets.filter(x=>x.eventId===e.id).reduce((a,x)=>a+x.qty,0);
  const head=`<h3>${e.price===0?t('register'):t('tickets')}</h3><div class="big-price">${money(e.price)}</div>
    <div class="bar" aria-hidden="true"><i style="width:${pct}%"></i></div>
    <p class="left${left<=15?' low':''}">${left<=0?t('soldout'):t('left',{n:left})}</p>`;
  const haveBox=have?`<div class="have" style="margin-top:14px">${t('have',{n:have})} <a href="#/tickets">${t('have_link')}</a></div>`:'';
  if(left<=0) return `<div class="panel">${head}${haveBox}</div>`;
  const max=Math.min(4,left), q=Math.min(qty[e.id]||1,max);
  return `<div class="panel">${head}${haveBox}
   <div class="qty"><span>${t('quantity')}</span><div class="stepper"><button data-qty="-1" aria-label="−">${ic('minus')}</button><output aria-live="polite">${q}</output><button data-qty="1" aria-label="+">${ic('plus')}</button></div></div>
   <label class="field"><span>${t('full_name')}</span><input id="bname" autocomplete="name" value="${esc(store.name)}"></label>
   <label class="field"><span>${t('student_id')}</span><input id="bsid" inputmode="numeric" autocomplete="off" value="${esc(store.sid)}"></label>
   ${e.price>0?`<div class="total"><span>${lang==='ru'?'Итого':'Total'}</span><span>${money(e.price*q)}</span></div>`:''}
   <button class="btn block" data-buy="${esc(e.id)}">${e.price===0?t('reg_btn'):t('buy',{p:money(e.price*q)})}</button>
   <div class="err" id="berr" role="alert"></div><p class="note">${t('max_note')}</p></div>`;
}
function pageEvent(id){
  const e=evById(id); if(!e) return notFound();
  const d=evDate(e), c=ECAT[e.cat]||'#2F345C', onmap=e.loc&&LOC_BY_ID[e.loc];
  return `<div class="wrap"><a class="crumb" href="#/events">${ic('back')}${t('back_events')}</a>
   <div class="detail"><div>
    <div class="cover" style="--c:${c}"><span class="tag">${t('cat_'+e.cat)}</span><div class="big">${d.getDate()}</div><div class="mon">${esc(fmt(d,{month:'long',weekday:'long'}))}</div></div>
    <h1>${esc(L(e.title))}</h1>
    <ul class="facts">
      <li>${ic('clock')}<div><b>${t('when')}</b>${esc(fmt(d,{day:'numeric',month:'long',weekday:'long'}))}, ${esc(e.time)}</div></li>
      <li>${ic('pin')}<div><b>${t('where')}</b>${esc(evPlace(e))}${onmap?`<br><a href="#/map/ev:${esc(e.id)}" style="font-weight:600">${t('show_map')}</a>`:''}</div></li>
      <li>${ic('club')}<div><b>${t('organizer')}</b>${esc(L(CLUBS[e.club])||esc(e.clubName||''))}</div></li>
    </ul>
    <p class="desc">${esc(L(e.desc))}</p>
   </div><div id="buybox">${buyPanel(e)}</div></div></div>`;
}

function ticketCard(tk,compact){
  const e=evById(tk.eventId); if(!e) return '';
  const d=evDate(e);
  return `<article class="tk"><div class="tk-main"><span class="tag" style="--c:${ECAT[e.cat]||'#2F345C'};align-self:flex-start">${t('cat_'+e.cat)}</span>
    <h3>${esc(L(e.title))}</h3>
    <div class="ev-row">${ic('clock')}${esc(fmt(d,{day:'numeric',month:'long'}))}, ${esc(e.time)}</div>
    <div class="ev-row">${ic('pin')}${esc(evPlace(e))}</div>
    <div class="ev-row">${ic('user')}${esc(tk.name)}, ${t('tk_qty',{n:tk.qty})}</div>
    ${compact?'':`<div class="tk-actions">${e.loc&&LOC_BY_ID[e.loc]?`<a class="btn alt sm" href="#/map/ev:${esc(e.id)}">${ic('map')}${t('show_map')}</a>`:''}<button class="btn alt sm" data-refund="${esc(tk.code)}">${t('refund')}</button></div>`}
   </div><div class="tk-qr">${qrSvg('SDUT:'+tk.code)}<code>${esc(tk.code)}</code></div></article>`;
}
function pageTickets(){
  const list=store.tickets;
  return `<div class="wrap"><div class="page-h"><h1>${t('my_tickets')}</h1><p>${t('tickets_p')}</p></div>
   ${list.length?`<div class="tk-list" style="padding-bottom:20px">${list.map(x=>ticketCard(x)).join('')}</div>`
   :`<div class="empty" style="margin-bottom:20px"><h3 style="margin-bottom:6px">${t('no_tickets')}</h3><p style="margin-bottom:14px">${t('no_tickets_p')}</p><a class="btn" href="#/events">${t('browse')}</a></div>`}</div>`;
}

function pageOrganizer(){
  const mine=store.created;
  const placeIds=LOCS.filter(l=>['hall','food'].includes(l.cat)).map(l=>l.id);
  return `<div class="wrap"><div class="page-h"><h1>${t('org_h')}</h1><p>${t('org_p')}</p></div>
  <div class="two" style="padding-bottom:20px">
   <form class="formcard" id="orgform" novalidate><h2 style="font-size:1.3rem;margin-bottom:14px">${t('org_new')}</h2>
    <label class="field"><span>${t('f_title')}</span><input name="title" required maxlength="80"></label>
    <div class="row2"><label class="field"><span>${t('f_club')}</span><select name="club">${Object.keys(CLUBS).map(k=>`<option value="${k}">${esc(L(CLUBS[k]))}</option>`).join('')}</select></label>
    <label class="field"><span>${t('f_cat')}</span><select name="cat">${Object.keys(ECAT).map(k=>`<option value="${k}">${t('cat_'+k)}</option>`).join('')}</select></label></div>
    <div class="row2"><label class="field"><span>${t('f_date')}</span><input type="date" name="date" min="${iso(today)}" value="${iso(addDays(today,7))}" required></label>
    <label class="field"><span>${t('f_time')}</span><input type="time" name="time" value="18:00" required></label></div>
    <label class="field"><span>${t('f_place')}</span><select name="loc">${placeIds.map(id=>`<option value="${id}">${esc(L(LOC_BY_ID[id]))}</option>`).join('')}<option value="">${t('offmap')}</option></select></label>
    <div class="row2"><label class="field"><span>${t('f_price')}</span><input type="number" name="price" min="0" step="100" value="0"></label>
    <label class="field"><span>${t('f_cap')}</span><input type="number" name="cap" min="1" max="2000" value="100"></label></div>
    <label class="field"><span>${t('f_desc')}</span><textarea name="desc" maxlength="400"></textarea></label>
    <button class="btn block" type="submit">${t('publish')}</button><div class="err" id="oerr" role="alert"></div></form>
   <div><h2 style="font-size:1.3rem;margin-bottom:14px">${t('my_events')}</h2>
    ${mine.length?`<div style="display:grid;gap:14px">${mine.map(e=>{const s=soldOf(e);return `<div>${eventCard(e)}<div class="stat"><div><b>${s} ${t('of')} ${e.cap}</b>${t('sold_n')}</div><div><b>${money(s*e.price)}</b>${t('revenue')}</div></div></div>`;}).join('')}</div>`
    :`<div class="empty">${t('no_mine')}</div>`}</div></div></div>`;
}
const notFound=()=>`<div class="wrap"><div class="page-h"><h1>404</h1><p><a href="#/">${t('nav_home')}</a></p></div></div>`;

/* ============ map page ============ */
const ms={q:'',cat:'all',floor:1,sel:null,zoom:null};
function mapPage(){
  return `<div class="wrap"><div class="mapPage">
   <div class="mp-search"><label class="search"><span class="sr">${t('map_ph')}</span>${ic('search')}<input id="mq" type="search" placeholder="${esc(t('map_ph'))}" value="${esc(ms.q)}" autocomplete="off"></label></div>
   <div class="mp-chips chips" id="mchips"></div>
   <div class="mp-floors chips" id="mfloors"></div>
   <div class="mp-sel" id="msel"></div>
   <div class="mp-list" id="mlist"></div>
   <div class="mp-panewrap"><div class="mp-pane" id="pane"><div class="stage" id="stage"><div class="mapimg"></div><svg id="msvg" viewBox="0 0 ${MAPW} ${MAPH}"></svg></div></div>
    <div class="zoom"><button data-z="1" aria-label="${t('zoom_in')}">${ic('plus')}</button><button data-z="-1" aria-label="${t('zoom_out')}">${ic('minus')}</button><button data-z="0" aria-label="${t('zoom_home')}">${ic('target')}</button></div></div>
  </div></div>`;
}
function mapItems(){
  const q=norm(ms.q), cat=ms.cat, out=[];
  const showRooms=cat==='room'||q;
  LOCS.forEach(l=>{
    if(cat==='event') return;
    if(l.kind==='room'&&!showRooms) return;
    if(l.kind==='room'&&l.floor!==ms.floor) return;
    if(cat!=='all'&&cat!=='event'&&l.cat!==cat) return;
    if(q&&!locText(l).includes(q)) return;
    out.push({id:l.id,kind:l.kind,cat:l.cat,x:l.x,y:l.y,label:L(l),sub:l.kind==='room'?`${t('block')} ${l.block}, ${t(`floor_${l.floor}`)}`:`${t('block')} ${l.block}`});
  });
  if(cat==='all'||cat==='event'){
    upcoming().forEach(e=>{
      const p=e.loc&&LOC_BY_ID[e.loc]; if(!p) return;
      if(q&&!evText(e).includes(q)) return;
      out.push({id:'ev:'+e.id,kind:'event',cat:'event',x:p.x,y:p.y,label:L(e.title),sub:`${fmt(evDate(e),{day:'numeric',month:'short'})}, ${e.time}`});
    });
  }
  return out;
}
function findMapItem(id){
  if(!id) return null;
  if(id.startsWith('ev:')){const e=evById(id.slice(3)); const p=e&&e.loc&&LOC_BY_ID[e.loc]; return p?{id,kind:'event',cat:'event',x:p.x,y:p.y,label:L(e.title),ev:e}:null;}
  const l=LOC_BY_ID[id]; return l?{id,kind:l.kind,cat:l.cat,x:l.x,y:l.y,label:L(l),loc:l}:null;
}
function mapChips(){
  const cats=['all','room','hall','food','service','wc','entrance','event'];
  $('#mchips').innerHTML=cats.map(c=>`<button class="chip" data-mcat="${c}" aria-pressed="${ms.cat===c}">${t('m_'+c)}</button>`).join('');
  $('#mfloors').innerHTML=[1,2,3].map(f=>`<button class="chip" data-floor="${f}" aria-pressed="${ms.floor===f}">${t(`floor_${f}`)}</button>`).join('');
}
function mapList(){
  const items=mapItems();
  $('#mlist').innerHTML=items.length?items.map(it=>`<button class="res" data-sel="${esc(it.id)}" aria-pressed="${ms.sel===it.id}"><span class="dot"><i class="${it.kind==='event'?'ev':(it.kind==='room'?'room':'')}"></i></span><span><b>${esc(it.label)}</b><small>${esc(it.sub)}</small></span></button>`).join(''):`<div class="empty">${t('m_none')}</div>`;
}
function mapSel(){
  const el=$('#msel'), it=findMapItem(ms.sel);
  if(!it){el.innerHTML='';return;}
  if(it.kind==='event'){
    const e=it.ev;
    el.innerHTML=`<div class="selcard"><button class="x" data-clear aria-label="${t('clear')}">${ic('close')}</button><h3>${esc(L(e.title))}</h3>
      <p class="muted">${esc(fmt(evDate(e),{day:'numeric',month:'long'}))}, ${esc(e.time)}. ${esc(evPlace(e))}</p>
      <div style="margin-top:10px"><a class="btn sm" href="#/events/${esc(e.id)}">${t('open_event')}</a></div></div>`;
  }else{
    const l=it.loc, evs=upcoming().filter(e=>e.loc===l.id);
    el.innerHTML=`<div class="selcard"><button class="x" data-clear aria-label="${t('clear')}">${ic('close')}</button><h3>${esc(L(l))}</h3>
      <p class="muted">${t('block')} ${l.block}${l.kind==='room'?`, ${esc(t(`floor_${l.floor}`))}`:''}</p>
      ${l.kind==='room'?`<div class="how"><b>${t('how')}.</b> ${esc(howTo(l))}</div>`:''}
      ${evs.length?`<div class="here"><b>${t('events_here')}</b>${evs.map(e=>`<a href="#/events/${esc(e.id)}">${esc(L(e.title))} (${esc(fmt(evDate(e),{day:'numeric',month:'short'}))}, ${esc(e.time)})</a>`).join('')}</div>`:''}</div>`;
  }
}
function stageU(){const st=$('#stage'); return st?MAPW/st.clientWidth:2;}
function drawPins(){
  const svg=$('#msvg'); if(!svg) return;
  const u=stageU(), items=mapItems(), sel=findMapItem(ms.sel);
  let html='';
  if(sel){const b=(sel.loc&&sel.loc.block)||(sel.ev&&LOC_BY_ID[sel.ev.loc]&&LOC_BY_ID[sel.ev.loc].block); const r=BLOCKS[b]; if(r) html+=`<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="${10*u}" fill="rgba(239,161,115,.16)" stroke="#EFA173" stroke-width="${3*u}" stroke-dasharray="${10*u} ${7*u}" pointer-events="none"/>`;}
  const visibleItems=items.filter(i=>i.id!==ms.sel), roomCoords=new Set();
  visibleItems.forEach(i=>{
    if(i.kind==='room'){
      const key=`${i.x},${i.y}`;
      if(roomCoords.has(key)) return;
      roomCoords.add(key);
    }
    html+=pinHTML(i,u,ms.sel);
  });
  if(sel){html+=pinHTML(sel,u,ms.sel)+labelHTML(sel,u);}
  svg.innerHTML=html;
}
function panTo(x,y,smooth=true){
  const pane=$('#pane'), st=$('#stage'); if(!pane||!st) return;
  const k=st.clientWidth/MAPW;
  pane.scrollTo({left:x*k-pane.clientWidth/2,top:y*k-pane.clientHeight/2,behavior:smooth?'smooth':'auto'});
}
function baseZoom(){const pane=$('#pane'); return pane&&pane.clientWidth<520?2:1;}
function applyZoom(z,keep=true){
  const pane=$('#pane'), st=$('#stage'); if(!pane||!st) return;
  const fx=keep&&st.clientWidth?(pane.scrollLeft+pane.clientWidth/2)/st.clientWidth:.5, fy=keep&&st.clientHeight?(pane.scrollTop+pane.clientHeight/2)/st.clientHeight:.5;
  ms.zoom=z; st.style.width=(pane.clientWidth*z)+'px';
  pane.scrollLeft=fx*st.clientWidth-pane.clientWidth/2; pane.scrollTop=fy*st.clientHeight-pane.clientHeight/2;
  drawPins();
}
function selectItem(id,pan=true){
  ms.sel=id; mapList(); mapSel(); drawPins();
  const it=findMapItem(id); if(it&&pan) panTo(it.x,it.y);
}
function initMap(){
  mapChips(); mapList(); mapSel();
  const z=ms.zoom||baseZoom(); applyZoom(z,false);
  const it=findMapItem(ms.sel);
  requestAnimationFrame(()=>{ if(it) panTo(it.x,it.y,false); else panTo(1000,2150,false); });
}

/* ============ modal / toast ============ */
let lastFocus=null;
function openModal(html){
  lastFocus=document.activeElement;
  $('#modal-root').innerHTML=`<div class="ov" data-ov><div class="modal" role="dialog" aria-modal="true"><button class="x" data-close aria-label="${t('close')}">${ic('close')}</button>${html}</div></div>`;
  const f=$('#modal-root .modal button:not(.x), #modal-root .modal input, #modal-root .modal .x'); if(f) f.focus();
}
function closeModal(){ $('#modal-root').innerHTML=''; if(lastFocus&&lastFocus.focus) try{lastFocus.focus();}catch(e){} }
let toastT;
function toast(msg){const el=$('#toast-root'); el.innerHTML=`<div class="toast">${esc(msg)}</div>`; clearTimeout(toastT); toastT=setTimeout(()=>{el.innerHTML='';},2600);}

/* ============ purchase flow ============ */
function startBuy(id){
  const e=evById(id); if(!e) return;
  const name=($('#bname')?.value||'').trim(), sid=($('#bsid')?.value||'').trim();
  if(!name){const er=$('#berr'); if(er) er.textContent=t('need_name'); $('#bname')?.focus(); return;}
  store.name=name; store.sid=sid; save();
  const q=Math.min(qty[id]||1,Math.min(4,e.cap-soldOf(e)));
  if(q<1) return;
  if(e.price===0){ completeBuy(e,q,name,sid); return; }
  const total=e.price*q;
  openModal(`<h2>${t('pay_h')}</h2>
   <div class="sumline"><span>${esc(L(e.title))}</span><span>× ${q}</span></div>
   <div class="sumline"><b>${lang==='ru'?'Итого':'Total'}</b><b>${money(total)}</b></div>
   <div class="pm"><label><input type="radio" name="pm" checked> ${t('pay_card')}</label><label><input type="radio" name="pm"> ${t('pay_qr')}</label></div>
   <p class="demo">${t('pay_demo')}</p>
   <button class="btn block" id="paybtn" data-pay="${esc(id)}" data-q="${q}">${t('pay_btn',{p:money(total)})}</button>`);
}
function completeBuy(e,q,name,sid){
  const code='SDU-'+Math.random().toString(36).slice(2,8).toUpperCase()+String(Date.now()%10000).padStart(4,'0');
  const tk={code,eventId:e.id,qty:q,name,sid,total:e.price*q,ts:Date.now()};
  store.tickets.unshift(tk); store.sold[e.id]=(store.sold[e.id]||0)+q; save();
  qty[e.id]=1; renderChrome();
  const bb=$('#buybox'); if(bb&&currentRoute==='events/'+e.id) bb.innerHTML=buyPanel(e);
  openModal(`<div class="okmark">${ic('check')}</div><h2>${e.price===0?t('tk_ready_free'):t('tk_ready')}</h2><p class="muted" style="margin-bottom:14px">${t('tk_show')}</p>
   ${ticketCard(tk,true)}
   <div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap"><a class="btn" href="#/tickets" data-close>${t('nav_tickets')}</a>${e.loc&&LOC_BY_ID[e.loc]?`<a class="btn alt" href="#/map/ev:${esc(e.id)}" data-close>${t('show_map')}</a>`:''}</div>`);
}
let armed=null;

/* ============ router ============ */
function render(){
  const raw=location.hash.replace(/^#\/?/,''); currentRoute=raw;
  const [page,...rest]=raw.split('/'); const id=decodeURIComponent(rest.join('/')||'');
  let html='';
  if(page===''||page==='home') html=pageHome();
  else if(page==='news') html=id?pageArticle(id):pageNews();
  else if(page==='events') html=id?pageEvent(id):pageEvents();
  else if(page==='map'){ if(id){ms.sel=id; ms.q=''; ms.cat='all'; if(LOC_BY_ID[id]?.kind==='room') ms.floor=LOC_BY_ID[id].floor;} html=mapPage(); }
  else if(page==='tickets') html=pageTickets();
  else if(page==='organizer') html=pageOrganizer();
  else html=notFound();
  app.innerHTML=html;
  document.title=(page==='events'&&id&&evById(id)?L(evById(id).title)+' · ':'')+'SDU Today';
  if(page!=='map') window.scrollTo(0,0);
  if(page==='news'&&!id) drawNews();
  if(page==='events'&&!id) drawEvents();
  if(page==='map') initMap();
  renderChrome();
}

/* ============ events (delegation) ============ */
document.addEventListener('click',ev=>{
  const tg=ev.target;
  const lg=tg.closest('[data-lang]'); if(lg){lang=lg.dataset.lang; store.lang=lang; save(); render(); return;}
  const c=tg.closest('[data-close]'); if(c){closeModal(); return;}
  if(tg.matches&&tg.matches('[data-ov]')){closeModal(); return;}
  const nc=tg.closest('[data-ncat]'); if(nc){newsFilter=nc.dataset.ncat; $$('[data-ncat]').forEach(b=>b.setAttribute('aria-pressed',String(b===nc))); drawNews(); return;}
  const ec=tg.closest('[data-ecat]'); if(ec){evFilter=ec.dataset.ecat; $$('[data-ecat]').forEach(b=>b.setAttribute('aria-pressed',String(b===ec))); drawEvents(); return;}
  const ef=tg.closest('[data-efree]'); if(ef){evFree=!evFree; ef.setAttribute('aria-pressed',String(evFree)); drawEvents(); return;}
  const q=tg.closest('[data-qty]'); if(q){
    const id=currentRoute.split('/')[1], e=evById(id); if(!e) return;
    const max=Math.min(4,e.cap-soldOf(e)); qty[id]=Math.max(1,Math.min(max,(qty[id]||1)+Number(q.dataset.qty)));
    const nm=$('#bname')?.value, sd=$('#bsid')?.value; $('#buybox').innerHTML=buyPanel(e);
    if(nm!=null) $('#bname').value=nm; if(sd!=null) $('#bsid').value=sd; return;}
  const b=tg.closest('[data-buy]'); if(b){startBuy(b.dataset.buy); return;}
  const p=tg.closest('[data-pay]'); if(p){
    const e=evById(p.dataset.pay); p.disabled=true; p.textContent=t('pay_wait');
    setTimeout(()=>completeBuy(e,Number(p.dataset.q),store.name,store.sid),900); return;}
  const rf=tg.closest('[data-refund]'); if(rf){
    const code=rf.dataset.refund;
    if(armed!==code){armed=code; rf.textContent=t('refund_sure'); rf.classList.remove('alt'); rf.classList.add('accent'); return;}
    const i=store.tickets.findIndex(x=>x.code===code); if(i>=0){const tk=store.tickets[i]; store.sold[tk.eventId]=Math.max(0,(store.sold[tk.eventId]||0)-tk.qty); store.tickets.splice(i,1); save();}
    armed=null; toast(t('refunded')); renderChrome(); app.innerHTML=pageTickets(); return;}
  const mc=tg.closest('[data-mcat]'); if(mc){ms.cat=mc.dataset.mcat; ms.sel=null; mapChips(); mapList(); mapSel(); drawPins(); return;}
  const fl=tg.closest('[data-floor]'); if(fl){ms.floor=Number(fl.dataset.floor); ms.sel=null; mapChips(); mapList(); mapSel(); drawPins(); return;}
  const sl=tg.closest('[data-sel]'); if(sl){selectItem(sl.dataset.sel); if(window.innerWidth<=820) $('.mp-panewrap')?.scrollIntoView({behavior:'smooth',block:'start'}); return;}
  if(tg.closest('[data-clear]')){ms.sel=null; mapList(); mapSel(); drawPins(); return;}
  const pin=tg.closest('[data-pin]'); if(pin&&pin.closest('#msvg')){selectItem(pin.dataset.pin,false); return;}
  const z=tg.closest('[data-z]'); if(z){
    const base=baseZoom(), steps=base>1?[2,3,4.5]:[1,1.5,2.2,3.2], v=Number(z.dataset.z);
    if(v===0){applyZoom(base,false); panTo(1000,2150,false); return;}
    const cur=ms.zoom||base; let i=0; steps.forEach((s,k)=>{if(Math.abs(s-cur)<Math.abs(steps[i]-cur)) i=k;});
    i=Math.max(0,Math.min(steps.length-1,i+v)); applyZoom(steps[i]); return;}
});
document.addEventListener('keydown',ev=>{
  if(ev.key==='Escape'&&$('#modal-root').firstChild) closeModal();
  if((ev.key==='Enter'||ev.key===' ')&&ev.target.matches&&ev.target.matches('#msvg [data-pin]')){ev.preventDefault(); selectItem(ev.target.dataset.pin,false);}
});
document.addEventListener('input',ev=>{
  const tg=ev.target;
  if(tg.id==='mq'){ms.q=tg.value; ms.sel=null;
    const q=norm(ms.q), matchingRooms=LOCS.filter(l=>l.kind==='room'&&locText(l).includes(q));
    const floors=[...new Set(matchingRooms.map(l=>l.floor))];
    if(q&&floors.length===1) ms.floor=floors[0];
    mapChips(); mapList(); mapSel(); drawPins();
    const items=mapItems(); if(ms.q&&items.length===1){ms.sel=items[0].id; mapList(); mapSel(); drawPins(); panTo(items[0].x,items[0].y);} }
  else if(tg.id==='nq'){newsQ=tg.value; drawNews();}
});
document.addEventListener('submit',ev=>{
  const f=ev.target;
  if(f.id==='finder'){ev.preventDefault(); const v=$('#fq').value.trim(); ms.q=v; ms.cat='all'; ms.sel=null; location.hash='#/map'; if(currentRoute==='map') render();
    if(v){setTimeout(()=>{const items=mapItems(); if(items.length>=1) selectItem(items[0].id);},60);} return;}
  if(f.id==='orgform'){ev.preventDefault(); const d=new FormData(f);
    const title=(d.get('title')||'').trim(), date=d.get('date');
    if(!title||!date){$('#oerr').textContent=t('need_fields'); return;}
    const id='my-'+Date.now().toString(36);
    const e={id,cat:d.get('cat'),club:d.get('club'),date,time:d.get('time')||'18:00',loc:d.get('loc')||null,locText:{ru:'Вне схемы кампуса',en:'Off the campus plan'},
      price:Math.max(0,parseInt(d.get('price'),10)||0),cap:Math.max(1,parseInt(d.get('cap'),10)||100),sold:0,title:{ru:title,en:title},
      desc:{ru:(d.get('desc')||'').trim()||'Описание появится позже.',en:(d.get('desc')||'').trim()||'Details will be added soon.'},mine:true};
    store.created.push(e); save(); toast(t('published')); location.hash='#/events/'+id; }
});
$('#app').addEventListener('input',ev=>{
  if(ev.target.id==='bname') store.name=ev.target.value; if(ev.target.id==='bsid') store.sid=ev.target.value;
});
let rt; window.addEventListener('resize',()=>{clearTimeout(rt); rt=setTimeout(()=>{ if(currentRoute.split('/')[0]==='map'){const z=ms.zoom||baseZoom(); applyZoom(z);} },150);});
window.addEventListener('hashchange',render);
render();
})();
