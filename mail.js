let inp = document.getElementById('attendant_file');
let group_name = document.getElementById('group_name');
let list_text_area = document.getElementById('area_stud_list');
let combox = document.getElementById('select_group');
let combox_url = document.getElementById('select_url');
let table = document.getElementById('out_list').children[0];
let unknown_table = document.getElementById('unknown_list').children[0];
let get_file = document.getElementById('get_file');
let obj = [];
let file_name;
let data;
let set_group;
function add_box_value(box, item){ // запис вибору опцій для сортування
    for(let i of box.children)if(i.value === item)return; // щоб не повторювалися
    box.insertAdjacentHTML("BeforeEnd",'<option value="'+item+'">'+item+'</option>');
}

function set_combobox_values(){ // завантаження вже завантажених груп
    set_group = JSON.parse(localStorage.getItem('GROUPS')); // отримання груп
    if(set_group){
        set_group = set_group.list; // якщо не порожнє то отримання списку
        if(set_group.length>0){ // якщо список має значення
            for(let i of set_group){ // перебір елементів списку
                console.log(i);
                add_box_value(combox,i); // завантаження для вибору
            }
        }
    }
}


// запис групи
function update_list(){
    let groups= group_name.value.trim(); // назва групи без пробілів перед/після
    let string_array = [];
    let item;
    string_array = list_text_area.value.split('\n'); // список групи
    if(groups.length==0){console.log("Відсутня група");return;} // перевірки на наявність групи для запису
    if(string_array.length==0){console.log("Порожній список, або відсутній файл");return;}
    let storage_group = JSON.parse(localStorage.getItem('GROUPS')); // отримання груп
    if(storage_group) // якщо не порожній
    {
        if(storage_group.list.indexOf(groups)===-1){ //та не має такого значення
            storage_group.list.push(groups); // запис
            console.log(groups);
            add_box_value(combox,groups); // додання вибору
        }
    }else {storage_group = {list: [groups]};add_box_value(groups);}// якщо порожній
    localStorage.setItem('GROUPS', JSON.stringify(storage_group)); // збереження в списку груп змін
    let local = localStorage.getItem(groups); // отримання групи
    if(!local){// якщо порожній, то створення порожнього об'єкту та заповнення
        console.log('ok')
        item = {group: groups, students: []}; // база для .json групи
        for(let i of string_array){ // перебір списку та додання студентів по типу ім'я, прізвище, присутність_по_датам
            if(i.trim() !==''){
                console.log(i);
                let pib = i.split(' ');
                item.students.push({name: pib[1], last_name: pib[0], second_name: pib[2], dates: []}); // створення поля
            }
        }
    }
    else{ // перезапис користувачів зі збереженням дат
        item = JSON.parse(local); 
        let new_item = {group: item.group, students: []};
        for(let i = 0; i < string_array.length; i++){
            let pib = string_array[i].split(' ');
            if(pib.length<3)pib.push('');
            let index = item.students.findIndex(itm => itm.name===pib[0]&&itm.last_name === pib[1]);
            let dat = index==-1?[]:item.students[i].dates;
            console.log(index);
            console.log(dat);
            new_item.students.push({name: pib[0], last_name: pib[1], dates: dat});
        }
        item = new_item;
    }
    localStorage.setItem(groups, JSON.stringify(item));
}

// додавання відвідуваності до студентів
function add_students_date(){
    if(obj.length===0){console.log("Файл з відвідуванням відсутній");return;} // якщо порожньо
    let groups = JSON.parse(localStorage.getItem('GROUPS')).list;
    let splited_object=[];
    for(let ob of obj)splited_object.push([ob.split(',')]); // розбиття рядка
    for(let i of groups){ // перебір груп
        console.log(i);
        let group = JSON.parse(localStorage.getItem(i));
        if(group.students[0].dates.findIndex(da => da.date===data)>-1){ // якщо така дата була 
            break;
        }
        else{ // якщо ні то перебір студентів
            for(let j of group.students){
                let index = splited_object.findIndex(ob=> ob[0][0] === j.name && ob[0][1]===j.last_name);
                console.log(index);
                if(index >-1){
                    j.dates.push({date: data, was: '1'});
                    obj.splice(index, 1);
                    splited_object.splice(index, '1'); // видалення студента зі стаиску відвідування
                } // якщо студент був
                else{j.dates.push({date: data, was: '0'})}; // якщо ні
                j.dates.sort((a,b)=> a.date>b.date?1:-1);
            }
        }
        localStorage.setItem(i, JSON.stringify(group)); // запис групи
    }
    if(obj.length>0){ // нелегали
        console.log(obj);
        let unknown = JSON.parse(localStorage.getItem('UNKNOWN'));
        if(!unknown){
            unknown = [];
            unknown = {students:[{name: splited_object[0][0][0], last_name: splited_object[0][0][1], dates: [{date: data, was:'1'}]}]};
            obj.splice(0, 1);
            splited_object.splice(0, 1); // видалення студента зі стаиску відвідування
        }
        for(let i of splited_object){
            let index = unknown.students.findIndex(unki=> i[0][0]=== unki.name && i[0][1]===unki.last_name);
            if(index > -1) {unknown.students[index].dates.push({date: data, was: '1'});
            unknown.students[index].dates.sort((a,b)=> a.date>b.date?1:-1);}
            else {unknown.students.push({name: i[0][0], last_name: i[0][1], dates: [{date: data, was:'1'}]});
            unknown.students.at(-1).dates.sort((a,b)=> a.date>b.date?1:-1);}
            obj.splice(0, 1);
        }
        localStorage.setItem('UNKNOWN', JSON.stringify(unknown));
        update_unknown_table();
    }
}

//читання файлу відвідувань
inp.addEventListener('change', 
    (event)=>{file = event.target.files; 
        obj = [];
        file_name = event.target.files[0].name;
        data = file_name.split(' ')[0];
        for(let item of file){
            let reader = new FileReader(); 
            reader.onload = function(its){
                obj = (its.target.result).split('\n');
                obj.splice(0,1);
                obj.splice(obj.length-1,1);
            }; 
            reader.readAsText(item);
        }
    }
)

function revork_table(){ // вивід таблиці з фільтрами
    for(let i = table.children.length-1; i>-1; i--){
        table.children[i].remove();
    }
    let index = combox.value;
    let group = JSON.parse(localStorage.getItem(index));
    table.insertAdjacentHTML('BeforeEnd', "<tr><td>ПІБ</td></tr>");
    for(let i of group.students[0].dates){
        table.children[0].insertAdjacentHTML('BeforeEnd', '<td>'+i.date+'</td>');
    }
    for(let i of group.students){
        table.insertAdjacentHTML('BeforeEnd', '<tr><td>'+i.last_name+' '+i.name+' '+i.second_name+'</td></tr>');
        for(let j of i.dates){
            table.lastChild.insertAdjacentHTML('BeforeEnd', '<td>'+j.was+'</td>');
        }
    }
}

function update_unknown_table(){ // вивід таблиці невизначених користувачів
    for(let i = unknown_table.children.length-1; i>-1; i--){
        unknown_table.children[i].remove();
    }
    unknown_table.insertAdjacentHTML('BeforeEnd', "<tr><td>Прізвище</td><td>Ім'я</td></tr>");
    let group = JSON.parse(localStorage.getItem('UNKNOWN'));
    if(!group)return;
    group.students.sort((a,b)=> a.dates.length>b.dates.length?1:-1)
    for(let i of group.students[0].dates){
        unknown_table.children[0].insertAdjacentHTML('BeforeEnd', '<td>'+i.date+'</td>');
    }
    for(let i of group.students){
        unknown_table.insertAdjacentHTML('BeforeEnd', '<tr><td>'+i.last_name+'</td><td>'+i.name+'</td></tr>');
        for(let j of i.dates){
            unknown_table.lastChild.insertAdjacentHTML('BeforeEnd', '<td>'+j.was+'</td>');
        }
    }
}