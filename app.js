/* =========================
PWA
========================= */

if("serviceWorker" in navigator){
    navigator.serviceWorker.register("service-worker.js")
}

/**
 * null → 新規追加
 * 数字 → 編集中
 */
let editingPriceId = null
let priceSortMode = "unitPrice"
/* =========================
画面切替
========================= */

function show(id){
    document.querySelectorAll(".screen").forEach(screen=>screen.classList.remove("active"))
    document.getElementById(id).classList.add("active")
}

function goHome(){
    show("homeScreen")
}

function openAdd(){
    show("addScreen")
    renderFrequent()
}

function openList(){
    show("listScreen")
    renderShoppingList()
}

function openPriceHome(){
    show("priceHomeScreen")
    renderVegetableList()
}

function openPriceAdd(name=""){
    show("priceAddScreen")
    editingPriceId = null
    renderStoreOptions()
    resetPriceForm(name)
}

function openPriceDetail(name){
    show("priceDetailScreen")
    document.getElementById("detailTitle").textContent=name
    renderPriceHistory(name)
}

function openSettings(){
    show("settingsScreen")
}

function openStoreSettings(){
    show("storeSettingsScreen")
    renderStoreList()
}

/* =========================
入力初期化
========================= */
function resetPriceForm(name=""){
    const today = new Date().toISOString().split("T")[0]

    document.getElementById("priceName").value=name
    document.getElementById("priceDate").value=today

    document.getElementById("priceStore").value=""
    document.getElementById("otherStore").value=""
    document.getElementById("otherStore").style.display="none"

    document.getElementById("priceQuantity").value=""
    document.getElementById("priceTotal").value=""
}

/* =========================
localStorage
========================= */

function loadData(key,defaultValue=[]){
    try{
        return JSON.parse(localStorage.getItem(key) || JSON.stringify(defaultValue))
    }catch{
        return defaultValue
    }
}

function saveData(key,data){
    localStorage.setItem(key, JSON.stringify(data))
}

/* =========================
買い物メモ
========================= */
function addCustom(){
    const input=document.getElementById("itemInput")
    const name=input.value.trim().replace(/\s+/g," ")
    if(!name)return

    const added = addShoppingItem(name)
    if(added){
        renderShoppingList()
        alert("追加しました")
    }else{
        alert("既に追加されています")
    }
    input.value=""
}

function renderShoppingList(){
    const ul=document.getElementById("shoppingList")
    const items=loadData("shoppingList")
    ul.innerHTML=""
    if(items.length===0){
        ul.innerHTML="<li>買い物メモがありません</li>"
        return
    }

    items.forEach((item)=>{
        const li=document.createElement("li")
        li.textContent=item.name
        if(item.checked){
            li.classList.add("checked")
        }

        li.onclick=()=>{
            item.checked=!item.checked
            saveData("shoppingList", items)
            renderShoppingList()
        }
        ul.appendChild(li)
    })
}

function clearAll(){
    if(!confirm("削除しますか？")) return
    localStorage.removeItem("shoppingList")
    renderShoppingList()
}


/* よく買うもの */
function addFrequent(){
    const input=document.getElementById("frequentInput")
    const name=input.value.trim().replace(/\s+/g," ")
    if(!name)return

    const items=loadData("frequentItems")
    if(items.some(item=>item.name===name)){
        alert("既に登録されています")
        return
    }
    items.push({
        name:name
    })

    saveData("frequentItems", items)
    input.value=""
    renderFrequent()
}

function renderFrequent(){
    const area=document.getElementById("frequentItems")
    const items=loadData("frequentItems")
    area.innerHTML=""
    if(items.length===0){
        area.textContent="まだ登録がありません"
        return
    }

    items.forEach(item=>{
        const btn=document.createElement("button")
        btn.textContent=item.name
        btn.onclick=()=>{
            const added = addShoppingItem(item.name)
            if(added){
                renderShoppingList()
                alert("追加しました")
            }else{
                alert("既に追加されています")
            }
        }
    area.appendChild(btn)
    })
}

function addShoppingItem(name){
    const items=loadData("shoppingList")
    if(items.some(item=>item.name===name && !item.checked)){
        return false
    }
    items.push({
        name:name,
        checked:false
    })
    saveData("shoppingList", items)
    return true
}


/* =========================
価格メモ
========================= */

function addPriceHistory(){
    const name=document.getElementById("priceName").value.trim().replace(/\s+/g," ")
    const storeSelect=document.getElementById("priceStore").value
    const otherStore=document.getElementById("otherStore").value.trim().replace(/\s+/g," ")
    const store = storeSelect==="その他" ? otherStore : storeSelect
    const quantity=Number(document.getElementById("priceQuantity").value)
    const total=Number(document.getElementById("priceTotal").value)
    const date=document.getElementById("priceDate").value

    if(!name || !store || !date){
        alert("入力してください")
        return
    }
    if(quantity <= 0 || total <= 0 || !Number.isInteger(quantity) || !Number.isInteger(total)){
        alert("数量と価格は1以上の整数を入力してください")
        return
    }

    const unitPrice=(total/quantity).toFixed(2)
    const history=loadData("priceHistory")
    if(editingPriceId !== null){
        const index = history.findIndex(
            item => item.id === editingPriceId
        )
        if(index === -1){
            alert("データが見つかりません")
            return
        }
        history[index] = {
            id:editingPriceId,
            name:name,
            store:store,
            quantity:quantity,
            total:total,
            unitPrice:unitPrice,
            date:date
        }
        editingPriceId = null
    }else{
        history.push({
            id:Date.now(),
            name:name,
            store:store,
            quantity:quantity,
            total:total,
            unitPrice:unitPrice,
            date:date
        })
    }

    saveData("priceHistory", history)
    resetPriceForm()
    renderStoreOptions()

    alert("保存しました")
    renderVegetableList()
}

function renderVegetableList(){
    const area=document.getElementById("vegetableList")
    const history=loadData("priceHistory")
    const uniqueNames=[...new Set(history.map(h=>h.name))]
    area.innerHTML=""
    if(uniqueNames.length===0){
        area.textContent="まだ登録がありません"
        return
    }

    uniqueNames.forEach(name=>{
        /* 行全体 */
        const row=document.createElement("div")
        row.className="vegetableRow"

        /* 商品名 */
        const title=document.createElement("span")
        title.textContent=name

        /* 追加ボタン */
        const addBtn=document.createElement("button")
        addBtn.textContent="追加"
        addBtn.onclick=()=>{
            openPriceAdd(name)
        }

        /* 履歴ボタン */
        const historyBtn=document.createElement("button")
        historyBtn.textContent="履歴"
        historyBtn.onclick=()=>{
            openPriceDetail(name)
        }

        /* 追加 */
        row.appendChild(title)
        row.appendChild(addBtn)
        row.appendChild(historyBtn)
        area.appendChild(row)
    })
}

function renderPriceHistory(name){
    const ul=document.getElementById("priceHistoryList")
    let history=loadData("priceHistory").filter(item=>item.name===name)
    if(history.length===0){
        ul.innerHTML="<li>履歴がありません</li>"
        return
    }

    if(priceSortMode==="unitPrice"){
        history.sort((a,b)=> Number(a.unitPrice)-Number(b.unitPrice))
    }else if(priceSortMode==="store"){
        history.sort((a,b)=>{
            /* 店名比較 */
            const storeCompare = a.store.localeCompare(b.store,"ja")
            if(storeCompare!==0){
                return storeCompare
            }
            /* 同じ店なら日付順 */
            return b.date.localeCompare(a.date)
        })
    }

    ul.innerHTML=""
    history.forEach(item=>{
        const li=document.createElement("li")
        li.innerHTML=`
            <div>${item.date}</div>
            <div>${item.store}</div>
            <div>${item.quantity}個 / ${item.total}円</div>
            <div><strong>1個あたり ${item.unitPrice}円</strong></div>
        `
        li.onclick=()=>{ openPriceEdit(item.id) }
        ul.appendChild(li)
    })
}

function openPriceEdit(id){
    const history=loadData("priceHistory")
    const item=history.find(h=>h.id===id)
    if(!item){
        alert("データが見つかりません")
        return
    }
    editingPriceId=id
    show("priceAddScreen")
    renderStoreOptions()

    const select=document.getElementById("priceStore")
    const other=document.getElementById("otherStore")
    const options = loadData("stores")

    if(options.includes(item.store)){
        select.value=item.store
        other.value=""
        other.style.display="none"
    }else{
        select.value="その他"
        toggleOtherStore()
        other.value=item.store
    }

    document.getElementById("priceName").value=item.name
    document.getElementById("priceQuantity").value=item.quantity
    document.getElementById("priceTotal").value=item.total
    document.getElementById("priceDate").value=item.date
}

function toggleOtherStore(){
    const select=document.getElementById("priceStore")
    const other=document.getElementById("otherStore")

    if(select.value==="その他"){
        other.style.display="block"
    }else{
        other.style.display="none"
    }
}

function changePriceSort(){
    priceSortMode = document.getElementById("priceSortSelect").value
    const name =document.getElementById("detailTitle").textContent
    renderPriceHistory(name)
}

function renderStoreOptions(){
    const select = document.getElementById("priceStore")
    const stores = loadData("stores")

    select.innerHTML=""

    /* 初期表示 */
    const defaultOption = document.createElement("option")
    defaultOption.value=""
    defaultOption.textContent="店を選択"
    select.appendChild(defaultOption)

    stores.forEach(store=>{
        const option = document.createElement("option")
        option.value=store
        option.textContent=store
        select.appendChild(option)
    })

    const otherOption = document.createElement("option")
    otherOption.value="その他"
    otherOption.textContent="その他"
    select.appendChild(otherOption)

}

/* =========================
設定画面
========================= */
/** 店名リスト編集 */
function renderStoreList(){
    const ul = document.getElementById("storeList")
    const stores = loadData("stores")
    ul.innerHTML=""
    stores.forEach((store)=>{
        const li = document.createElement("li")

        /* 店名 */
        const text = document.createElement("span")
        text.textContent = store

        /* 削除ボタン */
        const delBtn = document.createElement("button")
        delBtn.textContent = "削除"
        delBtn.onclick=()=>{
            const result = confirm(`${store} を削除しますか？`)
            if(!result)return
            const newStores = stores.filter(s => s !== store)
            saveData("stores", newStores)
            renderStoreList()
        }
        li.appendChild(text)
        li.appendChild(delBtn)
        ul.appendChild(li)
    })
}
function addStore(){
    const input = document.getElementById("storeInput")
    const name = input.value.trim().replace(/\s+/g," ")
    if(!name)return

    const stores = loadData("stores")
    if(stores.includes(name)){
        alert("既に登録されています")
        return
    }

    stores.push(name)
    saveData("stores", stores)
    renderStoreList()
    input.value=""
}

/* =========================
初期表示
========================= */

renderFrequent()
renderVegetableList()